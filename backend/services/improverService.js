/**
 * 提示词改进服务
 * 分析和优化用户提示词
 */

const llmService = require('./llmService');

/**
 * 评分维度定义
 */
const DIMENSIONS = {
  clarity: {
    name: '清晰度',
    nameEn: 'clarity',
    description: '表达是否清晰明确',
    weight: 0.2
  },
  specificity: {
    name: '具体性',
    nameEn: 'specificity', 
    description: '描述是否足够具体',
    weight: 0.2
  },
  structure: {
    name: '结构性',
    nameEn: 'structure',
    description: '是否有良好的组织结构',
    weight: 0.15
  },
  context: {
    name: '上下文',
    nameEn: 'context',
    description: '是否提供足够的背景信息',
    weight: 0.15
  },
  constraints: {
    name: '约束条件',
    nameEn: 'constraints',
    description: '是否有明确的限制和要求',
    weight: 0.15
  },
  outputFormat: {
    name: '输出格式',
    nameEn: 'outputFormat',
    description: '是否指定期望的输出格式',
    weight: 0.15
  }
};

/**
 * 改进建议模板
 */
const IMPROVEMENT_TIPS = {
  clarity: [
    '使用简洁明了的语言表达需求',
    '避免使用模糊的词汇如"好的"、"合适的"',
    '将复杂请求拆分为多个清晰的步骤',
    '使用具体的动词描述期望的行为'
  ],
  specificity: [
    '提供具体的数量、范围或标准',
    '使用具体的例子说明期望结果',
    '明确指定目标受众或使用场景',
    '给出具体的格式要求（如字数、段落数）'
  ],
  structure: [
    '将提示词分成角色、任务、约束等部分',
    '使用编号或分点列出多个要求',
    '按照逻辑顺序组织内容',
    '使用标记或分隔符区分不同部分'
  ],
  context: [
    '提供相关的背景信息',
    '说明为什么需要这个输出',
    '描述当前的情况或问题',
    '提供必要的领域知识或专业术语'
  ],
  constraints: [
    '明确指定不希望出现的内容',
    '设定时间、长度或范围限制',
    '指定必须包含或排除的元素',
    '明确风格、语气或格式要求'
  ],
  outputFormat: [
    '指定期望的输出格式（列表、表格、JSON等）',
    '提供输出示例作为参考',
    '说明输出的结构和组织方式',
    '指定语言和专业程度要求'
  ]
};

/**
 * 模式检测规则
 */
const PATTERNS = {
  // 角色相关
  hasRole: /^(你是|作为|扮演|assume|act as|you are|play the role)/i,
  
  // 任务相关
  hasTask: /(请|帮我|生成|创建|写|分析|总结|翻译|please|help|generate|create|write|analyze|summarize|translate)/i,
  
  // 约束相关
  hasConstraints: /(不要|避免|必须|限制|要求|确保|don't|avoid|must|limit|require|ensure)/i,
  
  // 格式相关
  hasFormat: /(格式|输出|返回|以.*形式|format|output|return|in the form of|as a)/i,
  
  // 示例相关
  hasExample: /(例如|比如|示例|参考|for example|such as|e\.g\.|like this)/i,
  
  // 上下文相关
  hasContext: /(背景|情况|场景|目的|context|background|situation|scenario|purpose)/i,
  
  // 模糊词汇
  vagueWords: /(好的|合适的|一些|很多|适当|相关|good|appropriate|some|many|proper|relevant)/gi,
  
  // 量化指标
  hasQuantifiers: /(\d+|几个|多少|至少|最多|number|count|at least|at most|minimum|maximum)/i,
  
  // 分点/列表
  hasList: /(1\.|2\.|•|-|\*|第一|第二|首先|其次|first|second|firstly|secondly)/i,
  
  // 段落分隔
  hasParagraphs: /\n\n|\r\n\r\n/
};

/**
 * 提示词改进服务类
 */
class ImproverService {
  constructor() {
    this.dimensions = DIMENSIONS;
    this.tips = IMPROVEMENT_TIPS;
    this.patterns = PATTERNS;
  }

  /**
   * 分析提示词
   * @param {string} prompt - 原始提示词
   * @returns {Object} 分析结果
   */
  analyze(prompt) {
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('提示词不能为空');
    }

    const trimmedPrompt = prompt.trim();
    if (trimmedPrompt.length === 0) {
      throw new Error('提示词不能为空');
    }

    // 基础统计
    const stats = this._getStats(trimmedPrompt);
    
    // 各维度评分
    const scores = this._calculateScores(trimmedPrompt, stats);
    
    // 总分
    const totalScore = this._calculateTotalScore(scores);
    
    // 问题检测
    const issues = this._detectIssues(trimmedPrompt, scores, stats);
    
    // 改进建议
    const suggestions = this._generateSuggestions(scores, issues);
    
    // 评级
    const rating = this._getRating(totalScore);

    return {
      originalPrompt: trimmedPrompt,
      stats,
      scores,
      totalScore,
      rating,
      issues,
      suggestions,
      dimensions: Object.keys(DIMENSIONS).map(key => ({
        id: key,
        ...DIMENSIONS[key],
        score: scores[key]
      }))
    };
  }

  /**
   * 改进提示词（基于规则）
   * @param {string} prompt - 原始提示词
   * @param {Object} options - 选项
   * @returns {Object} 改进结果
   */
  improve(prompt, options = {}) {
    const analysis = this.analyze(prompt);
    const { focus = [], style = 'balanced' } = options;
    
    // 生成改进版本
    const improved = this._generateImprovedPrompt(prompt, analysis, focus, style);
    
    return {
      original: prompt,
      improved: improved.text,
      analysis,
      changes: improved.changes,
      improvement: {
        beforeScore: analysis.totalScore,
        afterScore: improved.estimatedScore,
        delta: improved.estimatedScore - analysis.totalScore
      }
    };
  }

  /**
   * 使用 AI 改进提示词（支持本地模型降级）
   * 
   * Phase 15 增强：
   *   - 优先使用外部 API
   *   - API 不可用时自动降级到本地模型（Qwen3-0.6B）
   *   - 支持 fallbackToLocal 选项控制降级行为
   *   - 本地模型调用前自动压缩提示词
   * 
   * @param {string} prompt - 原始提示词
   * @param {Object} config - LLM 配置 { baseUrl, apiKey, model }
   * @param {string|null} customSystemPrompt - 自定义系统提示词
   * @param {Object} aiOptions - AI 选项
   * @param {boolean} [aiOptions.fallbackToLocal=true] - 是否允许降级到本地模型
   * @param {boolean} [aiOptions.preferLocal=false] - 是否优先使用本地模型
   * @returns {Promise<Object>} 改进结果
   */
  async improveWithAI(prompt, config = {}, customSystemPrompt = null, aiOptions = {}) {
    console.log('=== improveWithAI called ===');
    console.log('Config:', JSON.stringify(config, null, 2));
    console.log('Has customSystemPrompt:', !!customSystemPrompt);
    
    const {
      fallbackToLocal = true,
      preferLocal = false
    } = aiOptions;

    const analysis = this.analyze(prompt);
    
    // 使用自定义系统提示词或默认提示词
    const systemPrompt = customSystemPrompt || this._getImproverSystemPrompt();
    const userPrompt = customSystemPrompt ? prompt : this._getImproverUserPrompt(prompt, analysis);
    
    console.log('Model:', config.model);
    console.log('BaseUrl:', config.baseUrl);
    console.log('FallbackToLocal:', fallbackToLocal);
    console.log('PreferLocal:', preferLocal);

    // Phase 15: 如果优先使用本地模型
    if (preferLocal && llmService.isLocalModelAvailable()) {
      console.log('🏠 优先使用本地模型...');
      return this._improveWithLocalModel(prompt, analysis, systemPrompt, userPrompt, customSystemPrompt);
    }
    
    try {
      let aiResponse;
      let source = 'api';
      let fallbackUsed = false;
      let apiError = null;
      let modelUsed = null;

      if (config.baseUrl && config.model) {
        // 有外部 API 配置时，使用带降级的调用
        if (fallbackToLocal) {
          const result = await llmService.callWithFallback(
            userPrompt,
            systemPrompt,
            {
              baseUrl: config.baseUrl || 'http://localhost:11434/v1',
              apiKey: config.apiKey || '',
              model: config.model || 'llama3'
            },
            { allowLocalFallback: true }
          );
          aiResponse = result.text;
          source = result.source;
          fallbackUsed = result.fallback || false;
          apiError = result.apiError || null;
          modelUsed = result.model || config.model;
        } else {
          // 不允许降级，直接调用外部 API
          aiResponse = await llmService.call(
            userPrompt,
            systemPrompt,
            {
              baseUrl: config.baseUrl || 'http://localhost:11434/v1',
              apiKey: config.apiKey || '',
              model: config.model || 'llama3'
            }
          );
        }
      } else if (llmService.isLocalModelAvailable()) {
        // 没有外部 API 配置但本地模型可用
        console.log('🏠 未配置外部 API，使用本地模型...');
        return this._improveWithLocalModel(prompt, analysis, systemPrompt, userPrompt, customSystemPrompt);
      } else {
        throw new Error('未配置 API 且本地模型不可用，无法进行 AI 改进');
      }

      console.log('AI Response received, length:', aiResponse?.length);
      console.log('Source:', source, 'Fallback:', fallbackUsed);

      // 如果使用自定义系统提示词，直接返回AI响应
      if (customSystemPrompt) {
        console.log('Returning custom response directly');
        return {
          original: prompt,
          improved: aiResponse.trim(),
          content: aiResponse.trim(),
          source,
          ...(modelUsed && { model: modelUsed }),
          ...(fallbackUsed && { fallback: true, apiError })
        };
      }

      // 默认流程：解析 AI 响应
      const improved = this._parseAIResponse(aiResponse);
      
      // 重新分析改进后的提示词
      const improvedAnalysis = this.analyze(improved.text);
      
      return {
        original: prompt,
        improved: improved.text,
        content: improved.text,
        analysis: {
          before: analysis,
          after: improvedAnalysis
        },
        aiExplanation: improved.explanation,
        improvement: {
          beforeScore: analysis.totalScore,
          afterScore: improvedAnalysis.totalScore,
          delta: improvedAnalysis.totalScore - analysis.totalScore
        },
        source,
        ...(modelUsed && { model: modelUsed }),
        ...(fallbackUsed && { fallback: true, apiError })
      };
    } catch (error) {
      // Phase 15: 最后一道防线 — 尝试本地模型（如果还没试过）
      if (fallbackToLocal && llmService.isLocalModelAvailable()) {
        console.warn('⚠️ API 调用失败，尝试本地模型作为最后降级:', error.message);
        try {
          return this._improveWithLocalModel(prompt, analysis, systemPrompt, userPrompt, customSystemPrompt);
        } catch (localError) {
          console.error('❌ 本地模型也失败:', localError.message);
        }
      }
      
      // AI 调用失败时，抛出错误让调用方处理
      console.error('AI improvement failed:', error.message);
      throw error;
    }
  }

  /**
   * 直接使用本地模型改进提示词
   * 
   * Phase 15 新增方法 — 不经过外部 API，直接使用 Qwen3-0.6B
   * 
   * @param {string} prompt - 原始提示词
   * @param {Object} [localOptions] - 本地模型选项
   * @param {number} [localOptions.maxTokens=512] - 最大生成 token 数
   * @param {number} [localOptions.temperature=0.7] - 温度参数
   * @returns {Promise<Object>} 改进结果
   */
  async improveLocal(prompt, localOptions = {}) {
    if (!llmService.isLocalModelAvailable()) {
      throw new Error('本地模型不可用：请先下载并加载 Qwen3-0.6B 模型');
    }

    const analysis = this.analyze(prompt);
    const systemPrompt = this._getImproverSystemPrompt();
    const userPrompt = this._getImproverUserPrompt(prompt, analysis);

    return this._improveWithLocalModel(prompt, analysis, systemPrompt, userPrompt, null, localOptions);
  }

  /**
   * 内部方法：使用本地模型执行改进
   * @private
   */
  async _improveWithLocalModel(prompt, analysis, systemPrompt, userPrompt, customSystemPrompt, localOptions = {}) {
    const { maxTokens = 512, temperature = 0.7 } = localOptions;

    console.log('🏠 使用本地模型改进提示词...');
    
    const localResult = await llmService.callLocalModel(userPrompt, systemPrompt, {
      maxTokens,
      temperature,
      compress: true
    });

    const aiResponse = localResult.text;
    console.log('本地模型响应, length:', aiResponse?.length);

    // 如果使用自定义系统提示词，直接返回
    if (customSystemPrompt) {
      return {
        original: prompt,
        improved: aiResponse.trim(),
        content: aiResponse.trim(),
        source: 'local',
        model: 'qwen3-0.6b',
        ...(localResult.compression && { compression: localResult.compression })
      };
    }

    // 默认流程：解析响应
    const improved = this._parseAIResponse(aiResponse);
    const improvedAnalysis = this.analyze(improved.text);

    return {
      original: prompt,
      improved: improved.text,
      content: improved.text,
      analysis: {
        before: analysis,
        after: improvedAnalysis
      },
      aiExplanation: improved.explanation,
      improvement: {
        beforeScore: analysis.totalScore,
        afterScore: improvedAnalysis.totalScore,
        delta: improvedAnalysis.totalScore - analysis.totalScore
      },
      source: 'local',
      model: 'qwen3-0.6b',
      ...(localResult.compression && { compression: localResult.compression })
    };
  }

  /**
   * 获取改进技巧
   * @param {string} dimension - 维度（可选）
   * @returns {Object} 改进技巧
   */
  getTips(dimension = null) {
    if (dimension && this.tips[dimension]) {
      return {
        dimension,
        ...DIMENSIONS[dimension],
        tips: this.tips[dimension]
      };
    }
    
    return Object.keys(this.tips).map(key => ({
      dimension: key,
      ...DIMENSIONS[key],
      tips: this.tips[key]
    }));
  }

  /**
   * 获取所有评分维度
   * @returns {Array}
   */
  getDimensions() {
    return Object.keys(DIMENSIONS).map(key => ({
      id: key,
      ...DIMENSIONS[key]
    }));
  }

  // ==================== 私有方法 ====================

  /**
   * 获取基础统计信息
   * @private
   */
  _getStats(prompt) {
    const words = prompt.split(/\s+/).filter(w => w.length > 0);
    const sentences = prompt.split(/[.!?。！？]+/).filter(s => s.trim().length > 0);
    const lines = prompt.split(/\n/).filter(l => l.trim().length > 0);
    
    return {
      charCount: prompt.length,
      wordCount: words.length,
      sentenceCount: sentences.length,
      lineCount: lines.length,
      avgWordLength: words.length > 0 
        ? (words.reduce((sum, w) => sum + w.length, 0) / words.length).toFixed(1) 
        : 0,
      avgSentenceLength: sentences.length > 0 
        ? (words.length / sentences.length).toFixed(1) 
        : 0
    };
  }

  /**
   * 计算各维度分数
   * @private
   */
  _calculateScores(prompt, stats) {
    return {
      clarity: this._scoreClarify(prompt, stats),
      specificity: this._scoreSpecificity(prompt, stats),
      structure: this._scoreStructure(prompt, stats),
      context: this._scoreContext(prompt, stats),
      constraints: this._scoreConstraints(prompt, stats),
      outputFormat: this._scoreOutputFormat(prompt, stats)
    };
  }

  /**
   * 清晰度评分
   * @private
   */
  _scoreClarify(prompt, stats) {
    let score = 50;
    
    // 有明确任务 +20
    if (PATTERNS.hasTask.test(prompt)) score += 20;
    
    // 句子长度适中 +15
    const avgLen = parseFloat(stats.avgSentenceLength);
    if (avgLen >= 8 && avgLen <= 25) score += 15;
    else if (avgLen > 25) score -= 10;
    
    // 模糊词汇 -5 each (max -20)
    const vagueMatches = prompt.match(PATTERNS.vagueWords) || [];
    score -= Math.min(vagueMatches.length * 5, 20);
    
    // 适当长度 +15
    if (stats.charCount >= 50 && stats.charCount <= 1000) score += 15;
    else if (stats.charCount < 20) score -= 20;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * 具体性评分
   * @private
   */
  _scoreSpecificity(prompt, stats) {
    let score = 40;
    
    // 有量化指标 +20
    if (PATTERNS.hasQuantifiers.test(prompt)) score += 20;
    
    // 有示例 +20
    if (PATTERNS.hasExample.test(prompt)) score += 20;
    
    // 足够长度 +10
    if (stats.charCount >= 100) score += 10;
    
    // 模糊词汇多 -15
    const vagueMatches = prompt.match(PATTERNS.vagueWords) || [];
    if (vagueMatches.length >= 3) score -= 15;
    
    // 有数字 +10
    if (/\d/.test(prompt)) score += 10;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * 结构性评分
   * @private
   */
  _scoreStructure(prompt, stats) {
    let score = 40;
    
    // 有分点列表 +25
    if (PATTERNS.hasList.test(prompt)) score += 25;
    
    // 有段落分隔 +15
    if (PATTERNS.hasParagraphs.test(prompt)) score += 15;
    
    // 有角色定义 +10
    if (PATTERNS.hasRole.test(prompt)) score += 10;
    
    // 多行内容 +10
    if (stats.lineCount >= 3) score += 10;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * 上下文评分
   * @private
   */
  _scoreContext(prompt, stats) {
    let score = 40;
    
    // 有背景描述 +25
    if (PATTERNS.hasContext.test(prompt)) score += 25;
    
    // 有角色设定 +20
    if (PATTERNS.hasRole.test(prompt)) score += 20;
    
    // 足够长度提供上下文 +15
    if (stats.charCount >= 150) score += 15;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * 约束条件评分
   * @private
   */
  _scoreConstraints(prompt, stats) {
    let score = 40;
    
    // 有约束词汇 +30
    if (PATTERNS.hasConstraints.test(prompt)) score += 30;
    
    // 有量化限制 +20
    if (PATTERNS.hasQuantifiers.test(prompt)) score += 20;
    
    // 有否定要求 +10
    if (/(不要|避免|禁止|don't|avoid|never)/i.test(prompt)) score += 10;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * 输出格式评分
   * @private
   */
  _scoreOutputFormat(prompt, stats) {
    let score = 40;
    
    // 有格式指定 +30
    if (PATTERNS.hasFormat.test(prompt)) score += 30;
    
    // 有示例 +20
    if (PATTERNS.hasExample.test(prompt)) score += 20;
    
    // 有结构化关键词 +10
    if (/(JSON|XML|表格|列表|markdown|table|list)/i.test(prompt)) score += 10;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * 计算总分
   * @private
   */
  _calculateTotalScore(scores) {
    let total = 0;
    for (const [key, score] of Object.entries(scores)) {
      total += score * DIMENSIONS[key].weight;
    }
    return Math.round(total);
  }

  /**
   * 获取评级
   * @private
   */
  _getRating(score) {
    if (score >= 90) return { level: 'A', label: '优秀', color: '#22c55e' };
    if (score >= 80) return { level: 'B', label: '良好', color: '#84cc16' };
    if (score >= 70) return { level: 'C', label: '中等', color: '#eab308' };
    if (score >= 60) return { level: 'D', label: '及格', color: '#f97316' };
    return { level: 'F', label: '需改进', color: '#ef4444' };
  }

  /**
   * 检测问题
   * @private
   */
  _detectIssues(prompt, scores, stats) {
    const issues = [];

    // 清晰度问题
    if (scores.clarity < 60) {
      if (stats.charCount < 30) {
        issues.push({
          dimension: 'clarity',
          severity: 'high',
          message: '提示词过于简短，可能无法清晰表达需求'
        });
      }
      const vagueMatches = prompt.match(PATTERNS.vagueWords) || [];
      if (vagueMatches.length >= 2) {
        issues.push({
          dimension: 'clarity',
          severity: 'medium',
          message: `发现 ${vagueMatches.length} 个模糊词汇，建议使用更具体的表达`
        });
      }
    }

    // 具体性问题
    if (scores.specificity < 60) {
      if (!PATTERNS.hasQuantifiers.test(prompt)) {
        issues.push({
          dimension: 'specificity',
          severity: 'medium',
          message: '缺少具体的数量或标准，建议添加量化指标'
        });
      }
      if (!PATTERNS.hasExample.test(prompt)) {
        issues.push({
          dimension: 'specificity',
          severity: 'low',
          message: '没有提供示例，添加示例可以帮助AI更好理解需求'
        });
      }
    }

    // 结构问题
    if (scores.structure < 60) {
      if (stats.lineCount === 1 && stats.charCount > 100) {
        issues.push({
          dimension: 'structure',
          severity: 'medium',
          message: '内容较长但缺乏分段，建议使用换行或分点组织'
        });
      }
    }

    // 上下文问题
    if (scores.context < 60) {
      if (!PATTERNS.hasRole.test(prompt) && !PATTERNS.hasContext.test(prompt)) {
        issues.push({
          dimension: 'context',
          severity: 'medium',
          message: '缺少背景信息或角色设定，建议添加上下文'
        });
      }
    }

    // 约束问题
    if (scores.constraints < 50) {
      issues.push({
        dimension: 'constraints',
        severity: 'low',
        message: '没有明确的约束条件，可能导致输出不符合预期'
      });
    }

    // 输出格式问题
    if (scores.outputFormat < 50) {
      issues.push({
        dimension: 'outputFormat',
        severity: 'low',
        message: '未指定输出格式，建议明确期望的输出形式'
      });
    }

    return issues;
  }

  /**
   * 生成改进建议
   * @private
   */
  _generateSuggestions(scores, issues) {
    const suggestions = [];
    
    // 根据分数最低的维度优先建议
    const sortedDimensions = Object.entries(scores)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 3);
    
    for (const [dimension, score] of sortedDimensions) {
      if (score < 70 && this.tips[dimension]) {
        const tip = this.tips[dimension][Math.floor(Math.random() * this.tips[dimension].length)];
        suggestions.push({
          dimension,
          dimensionName: DIMENSIONS[dimension].name,
          score,
          suggestion: tip,
          priority: score < 50 ? 'high' : 'medium'
        });
      }
    }

    return suggestions;
  }

  /**
   * 生成改进后的提示词（基于规则）
   * @private
   */
  _generateImprovedPrompt(prompt, analysis, focus, style) {
    let improved = prompt;
    const changes = [];

    // 添加角色（如果缺失）
    if (analysis.scores.context < 60 && !PATTERNS.hasRole.test(prompt)) {
      const rolePrefix = '作为一个专业的助手，';
      improved = rolePrefix + improved;
      changes.push({ type: 'addRole', description: '添加了角色设定' });
    }

    // 添加输出格式（如果缺失）
    if (analysis.scores.outputFormat < 50 && !PATTERNS.hasFormat.test(prompt)) {
      improved += '\n\n请以清晰、结构化的格式输出结果。';
      changes.push({ type: 'addFormat', description: '添加了输出格式要求' });
    }

    // 添加具体性（如果太模糊）
    if (analysis.scores.specificity < 50) {
      improved += '\n请提供具体、详细的内容。';
      changes.push({ type: 'addSpecificity', description: '添加了具体性要求' });
    }

    // 估算改进后分数
    let estimatedScore = analysis.totalScore;
    estimatedScore += changes.length * 5;
    estimatedScore = Math.min(estimatedScore, 95);

    return {
      text: improved.trim(),
      changes,
      estimatedScore
    };
  }

  /**
   * 获取 AI 改进的系统提示词
   * @private
   */
  _getImproverSystemPrompt() {
    return `你是一个专业的提示词工程专家。你的任务是改进用户的提示词，使其更加清晰、具体和有效。

改进原则：
1. 保持用户的原始意图不变
2. 增加清晰度：使用明确的语言
3. 提高具体性：添加具体的要求和标准
4. 改善结构：组织成清晰的部分
5. 补充上下文：添加必要的背景信息
6. 明确约束：添加合理的限制条件
7. 指定输出：明确期望的输出格式

输出格式要求：
请按以下格式输出：

【改进后的提示词】
(在这里输出改进后的完整提示词)

【改进说明】
(简要说明做了哪些改进以及为什么)`;
  }

  /**
   * 获取 AI 改进的用户提示词
   * @private
   */
  _getImproverUserPrompt(prompt, analysis) {
    const weakDimensions = Object.entries(analysis.scores)
      .filter(([_, score]) => score < 70)
      .map(([dim, score]) => `${DIMENSIONS[dim].name}(${score}分)`)
      .join('、');

    return `请改进以下提示词：

【原始提示词】
${prompt}

【当前评分】
总分：${analysis.totalScore}/100
${weakDimensions ? `需要重点改进的方面：${weakDimensions}` : ''}

【检测到的问题】
${analysis.issues.map(i => `- ${i.message}`).join('\n') || '无明显问题'}

请提供改进后的版本。`;
  }

  /**
   * 解析 AI 响应
   * @private
   */
  _parseAIResponse(response) {
    // 尝试提取改进后的提示词
    const improvedMatch = response.match(/【改进后的提示词】\s*([\s\S]*?)(?=【|$)/);
    const explanationMatch = response.match(/【改进说明】\s*([\s\S]*?)$/);

    if (improvedMatch) {
      return {
        text: improvedMatch[1].trim(),
        explanation: explanationMatch ? explanationMatch[1].trim() : ''
      };
    }

    // 如果格式不匹配，尝试智能提取
    const lines = response.split('\n').filter(l => l.trim());
    if (lines.length > 0) {
      // 假设第一部分是改进的提示词
      const splitIndex = lines.findIndex(l => 
        l.includes('说明') || l.includes('改进') || l.includes('解释')
      );
      
      if (splitIndex > 0) {
        return {
          text: lines.slice(0, splitIndex).join('\n').trim(),
          explanation: lines.slice(splitIndex + 1).join('\n').trim()
        };
      }
    }

    // 回退：返回整个响应作为改进后的提示词
    return {
      text: response.trim(),
      explanation: ''
    };
  }
}

// 单例
let instance = null;

function getImproverService() {
  if (!instance) {
    instance = new ImproverService();
  }
  return instance;
}

module.exports = {
  ImproverService,
  getImproverService,
  DIMENSIONS,
  IMPROVEMENT_TIPS
};
