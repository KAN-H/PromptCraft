/**
 * 意图识别服务 - 三层降级策略
 *
 * 层级1: 本地超轻量语言模型 (Qwen3-0.6B via Ollama, ~462MB)
 * 层级2: 规则模式匹配 (内置关键词分类, 零依赖)
 * 层级3: 默认意图 (服务不可用时返回通用生成意图)
 */

/**
 * 支持的意图类型
 */
const INTENTS = {
  GENERATION: 'generation',   // 生成内容
  IMPROVEMENT: 'improvement', // 改进优化
  ANALYSIS: 'analysis',       // 分析评估
  TRANSLATION: 'translation', // 翻译转换
  CODING: 'coding',           // 代码相关
  CREATIVE: 'creative',       // 创意写作
  DESIGN: 'design',           // 设计相关
  OTHER: 'other'              // 其他
};

/**
 * 规则层：意图模式匹配规则（按优先级排序）
 */
const INTENT_PATTERNS = [
  {
    intent: INTENTS.IMPROVEMENT,
    patterns: [/改进|优化|提升|完善|修改|修复|fix|improve|optimize|enhance/i],
    weight: 1.0
  },
  {
    intent: INTENTS.TRANSLATION,
    patterns: [/翻译|translate|转换.*语言|语言.*转/i],
    weight: 1.0
  },
  {
    intent: INTENTS.CODING,
    patterns: [/代码|编程|函数|算法|debug|code|programming|script|api/i],
    weight: 1.0
  },
  {
    intent: INTENTS.ANALYSIS,
    patterns: [/分析|评估|评价|总结|analyze|analysis|evaluate|summarize|review/i],
    weight: 0.9
  },
  {
    intent: INTENTS.CREATIVE,
    patterns: [/创意|故事|小说|诗|文案|creative|story|novel|poem|copywriting/i],
    weight: 0.9
  },
  {
    intent: INTENTS.DESIGN,
    patterns: [/设计|图像|画面|视觉|design|image|visual|illustration|graphic/i],
    weight: 0.9
  },
  {
    intent: INTENTS.GENERATION,
    patterns: [/生成|创建|写|制作|generate|create|write|make|build/i],
    weight: 0.8
  }
];

/**
 * 规则层意图分类
 * @param {string} text
 * @returns {{ intent: string, confidence: number }}
 */
function ruleBasedClassify(text) {
  let bestIntent = INTENTS.OTHER;
  let bestScore = 0;

  for (const { intent, patterns, weight } of INTENT_PATTERNS) {
    const matches = patterns.filter(p => p.test(text)).length;
    const score = (matches / patterns.length) * weight;
    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent;
    }
  }

  return {
    intent: bestIntent,
    confidence: bestScore > 0 ? Math.min(0.5 + bestScore * 0.5, 0.95) : 0.3
  };
}

/**
 * 调用本地轻量模型进行意图识别 (Qwen3-0.6B via Ollama)
 * @param {string} text
 * @param {Object} config
 * @param {string} config.baseUrl
 * @param {string} [config.model]
 * @returns {Promise<{ intent: string, confidence: number }>}
 */
async function localModelClassify(text, config) {
  const { baseUrl, model = 'qwen3:0.6b' } = config;
  const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  const validIntents = Object.values(INTENTS).join(', ');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: `Classify the user intent into one of: ${validIntents}. Respond with JSON only: {"intent": "...", "confidence": 0.0-1.0}`
          },
          { role: 'user', content: text.substring(0, 500) }
        ],
        temperature: 0.1,
        max_tokens: 50
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Intent API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    const match = content.match(/\{[^}]+\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      const intent = Object.values(INTENTS).includes(parsed.intent)
        ? parsed.intent
        : INTENTS.OTHER;
      return {
        intent,
        confidence: Math.max(0, Math.min(1, parseFloat(parsed.confidence) || 0.7))
      };
    }

    throw new Error('Invalid intent model response format');
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * 三层降级意图识别
 * @param {string} text
 * @param {Object} [options]
 * @param {string} [options.intentBaseUrl] - 本地意图模型 URL
 * @param {string} [options.intentModel] - 模型名称 (默认 qwen3:0.6b)
 * @returns {Promise<{ intent: string, confidence: number, method: string }>}
 */
async function classifyIntent(text, options = {}) {
  const { intentBaseUrl, intentModel } = options;

  // 层级1: 本地语言模型
  if (intentBaseUrl) {
    try {
      const result = await localModelClassify(text, {
        baseUrl: intentBaseUrl,
        model: intentModel
      });
      return { ...result, method: 'local-model' };
    } catch (error) {
      console.warn('[Intent] 本地意图模型不可用，降级到规则分类:', error.message);
    }
  }

  // 层级2: 规则分类
  try {
    const result = ruleBasedClassify(text);
    return { ...result, method: 'rule-based' };
  } catch (error) {
    console.warn('[Intent] 规则分类失败，使用默认意图:', error.message);
  }

  // 层级3: 默认意图
  return { intent: INTENTS.GENERATION, confidence: 0.3, method: 'default' };
}

module.exports = { classifyIntent, ruleBasedClassify, INTENTS };
