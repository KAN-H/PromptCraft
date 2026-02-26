/**
 * 内容安全服务 - 三层降级策略
 *
 * 层级1: 本地超轻量安全模型 (Tiny-toxic-detector via local API, ~10MB)
 * 层级2: 规则模式匹配 (内置关键词/正则检测, 零依赖)
 * 层级3: 通过放行 (两层均不可用时允许请求继续)
 */

/**
 * 规则层：有害内容模式
 */
const UNSAFE_PATTERNS = [
  // 武器与爆炸物
  /(?:制作|制造|合成|生产).{0,20}(?:炸弹|爆炸物|毒药|毒品|武器)/i,
  // 人身伤害
  /(?:如何|怎么|方法).{0,20}(?:杀人|自杀|伤害他人)/i,
  // 恶意代码
  /(?:写|编写|创建).{0,20}(?:病毒|木马|恶意软件|勒索软件)/i,
  // 信息窃取
  /(?:窃取|盗取|获取).{0,20}(?:密码|账号|信用卡|身份证)/i,
  // 欺诈
  /(?:欺骗|诈骗|伪造).{0,20}(?:他人|用户|客户)/i
];

/**
 * 规则层安全检测
 * @param {string} text
 * @returns {{ safe: boolean, reason: string }}
 */
function ruleBasedCheck(text) {
  for (const pattern of UNSAFE_PATTERNS) {
    if (pattern.test(text)) {
      return { safe: false, reason: '内容包含潜在有害信息' };
    }
  }
  return { safe: true, reason: '' };
}

/**
 * 调用本地安全检测模型 (Tiny-toxic-detector compatible API)
 * @param {string} text
 * @param {string} baseUrl
 * @returns {Promise<{ safe: boolean, reason: string }>}
 */
async function localModelCheck(text, baseUrl) {
  const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'tiny-toxic-detector',
        messages: [
          {
            role: 'system',
            content: 'You are a content safety classifier. Respond with JSON only: {"safe": true/false, "reason": "..."}'
          },
          { role: 'user', content: text.substring(0, 500) }
        ],
        temperature: 0.1,
        max_tokens: 100
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Safety API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    const match = content.match(/\{[^}]+\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return {
        safe: parsed.safe !== false,
        reason: parsed.reason || ''
      };
    }

    throw new Error('Invalid safety model response format');
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * 三层降级安全检测
 * @param {string} text
 * @param {Object} [options]
 * @param {string} [options.safetyBaseUrl] - 本地安全模型 URL
 * @returns {Promise<{ safe: boolean, reason: string, method: string }>}
 */
async function checkSafety(text, options = {}) {
  const { safetyBaseUrl } = options;

  // 层级1: 本地安全模型
  if (safetyBaseUrl) {
    try {
      const result = await localModelCheck(text, safetyBaseUrl);
      return { ...result, method: 'local-model' };
    } catch (error) {
      console.warn('[Safety] 本地安全模型不可用，降级到规则检测:', error.message);
    }
  }

  // 层级2: 规则匹配
  try {
    const result = ruleBasedCheck(text);
    return { ...result, method: 'rule-based' };
  } catch (error) {
    console.warn('[Safety] 规则检测失败，放行请求:', error.message);
  }

  // 层级3: 通过放行
  return { safe: true, reason: '', method: 'passthrough' };
}

/**
 * Express 安全中间件工厂
 * @param {Object} [options]
 * @param {string} [options.safetyBaseUrl] - 本地安全模型 URL
 * @param {string[]} [options.fields] - 要检测的请求体字段
 * @returns {Function} Express 中间件
 */
function createSafetyMiddleware(options = {}) {
  const { fields = ['input', 'prompt'] } = options;

  return async function safetyMiddleware(req, res, next) {
    const texts = fields
      .map(f => req.body?.[f])
      .filter(v => typeof v === 'string' && v.length > 0);

    if (texts.length === 0) return next();

    const combined = texts.join('\n');

    try {
      const result = await checkSafety(combined, options);

      if (!result.safe) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'SAFETY_VIOLATION',
            message: result.reason || '内容不符合安全要求',
            method: result.method
          }
        });
      }

      req.safetyResult = result;
      next();
    } catch (error) {
      console.error('[Safety] 安全检测出错，放行请求:', error.message);
      next();
    }
  };
}

module.exports = { createSafetyMiddleware, checkSafety, ruleBasedCheck };
