const express = require('express');
const PromptGenerator = require('../utils/promptGenerator');
const { builder, PromptBuilder, fromPrompt } = require('../utils/promptBuilder');
const { VariableParser, VariableTypes, variable } = require('../utils/variableParser');
const { getCategoryService } = require('../services/categoryService');
const { getPresetService } = require('../services/presetService');
const { getImproverService } = require('../services/improverService');
const { 
  ImagePromptBuilder, 
  imageBuilder, 
  getStyles, 
  getArtists, 
  getLighting, 
  getCamera, 
  getMoods, 
  getColorSchemes, 
  getPlatforms, 
  getNegativePresets 
} = require('../utils/imagePromptBuilder');
const router = express.Router();

const generator = new PromptGenerator();
const categoryService = getCategoryService();
const presetService = getPresetService();
const improverService = getImproverService();

// 输入验证中间件
function validateInput(req, res, next) {
  const { input } = req.body;
  
  if (!input) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_INPUT',
        message: '缺少输入内容'
      }
    });
  }

  if (typeof input === 'string') {
    const trimmedInput = input.trim();
    if (trimmedInput.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'EMPTY_INPUT',
          message: '输入内容不能为空'
        }
      });
    }
    if (trimmedInput.length > 500) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INPUT_TOO_LONG',
          message: '输入内容过长，请控制在500字符以内'
        }
      });
    }
    req.body.input = trimmedInput;
    return next();
  } 
  
  // 暂时只支持字符串输入，如果未来支持对象输入可以在这里扩展
  return res.status(400).json({
    success: false,
    error: {
      code: 'INVALID_INPUT_TYPE',
      message: '输入类型错误，仅支持文本字符串'
    }
  });
}

// 获取可用场景
router.get('/scenarios', (req, res) => {
  res.json({
    success: true,
    scenarios: generator.getScenarios()
  });
});

// ==================== 统一模型获取 API ====================
/**
 * 获取任意 OpenAI 兼容服务的模型列表
 * POST /api/prompts/fetch-models
 * 
 * @body {string} baseUrl - API 基础地址 (如 http://localhost:11434/v1)
 * @body {string} [apiKey] - API 密钥（本地服务可选）
 */
router.post('/fetch-models', async (req, res) => {
  try {
    const { baseUrl, apiKey } = req.body;
    
    if (!baseUrl) {
      return res.status(400).json({ 
        success: false, 
        error: 'baseUrl is required' 
      });
    }

    // 构建请求头
    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    // 调用 OpenAI 兼容的 /models 端点
    const modelsUrl = `${baseUrl.replace(/\/$/, '')}/models`;
    const response = await fetch(modelsUrl, { 
      method: 'GET',
      headers,
      // 设置超时（5秒）
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // 标准 OpenAI 格式: { data: [{ id: 'model-name', ... }] }
    // Ollama 格式: { models: [{ name: 'model-name', ... }] }
    let models = [];
    
    if (data.data && Array.isArray(data.data)) {
      // OpenAI 标准格式
      models = data.data.map(m => ({
        id: m.id,
        name: m.id,
        owned_by: m.owned_by || 'unknown'
      }));
    } else if (data.models && Array.isArray(data.models)) {
      // Ollama 原生格式 (兼容旧版 Ollama)
      models = data.models.map(m => ({
        id: m.name || m.model,
        name: m.name || m.model,
        size: m.size,
        family: m.details?.family || 'unknown'
      }));
    }

    res.json({ 
      success: true, 
      models,
      count: models.length 
    });

  } catch (error) {
    console.error('Failed to fetch models:', error.message);
    
    // 友好的错误提示
    let errorMessage = error.message;
    if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      errorMessage = '连接超时，请检查服务是否运行';
    } else if (error.message.includes('ECONNREFUSED')) {
      errorMessage = '无法连接服务，请检查地址和端口';
    }
    
    res.json({ 
      success: false, 
      models: [], 
      error: errorMessage 
    });
  }
});

// 🔄 保留旧接口兼容性（将在未来版本移除）
router.get('/ollama-models', async (req, res) => {
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    if (!response.ok) {
      throw new Error(`Ollama API Error: ${response.statusText}`);
    }
    const data = await response.json();
    const models = (data.models || []).map(m => ({
      name: m.name,
      size: m.size,
      family: m.details?.family || 'unknown'
    }));
    res.json({ success: true, models });
  } catch (error) {
    console.error('Failed to fetch Ollama models:', error);
    res.json({ success: false, models: [], error: error.message });
  }
});

// 生成提示词路由
router.post('/generate', validateInput, async (req, res) => {
  try {
    const { input, scenario, config } = req.body;
    let results;

    if (scenario && config) {
        // AI Mode
        results = await generator.generateAI(input, scenario, config);
    } else {
        // Legacy Mode
        results = generator.generate(input);
    }
    
    res.json({
      success: true,
      results: results,
      meta: {
        timestamp: new Date().toISOString(),
        inputLength: input.length,
        mode: scenario ? 'ai' : 'template'
      }
    });
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GENERATION_FAILED',
        message: error.message || '提示词生成失败，请稍后重试'
      }
    });
  }
});

// ==================== 流式构建器 API ====================

/**
 * 使用构建器创建提示词
 * POST /api/prompts/build
 * 
 * @body {Object} data - 构建参数
 * @body {string} [data.role] - 角色
 * @body {Object} [data.persona] - 人设
 * @body {string} [data.context] - 上下文
 * @body {string} [data.task] - 任务
 * @body {string[]} [data.constraints] - 约束条件
 * @body {string} [data.output] - 输出格式
 * @body {Array} [data.variables] - 变量定义
 * @body {Array} [data.examples] - 示例
 * @body {string} [data.format] - 输出格式 (text, json, yaml, markdown)
 * @body {string} [data.language] - 语言 (zh-CN, en)
 */
router.post('/build', (req, res) => {
  try {
    const { 
      role, persona, context, task, constraints, 
      output, variables, examples, sections,
      format = 'text', language = 'zh-CN'
    } = req.body;

    // 创建构建器
    const b = builder().language(language);

    // 应用各项设置
    if (role) b.role(role);
    if (persona) b.persona(persona);
    if (context) b.context(context);
    if (task) b.task(task);
    if (constraints && constraints.length) b.constraints(constraints);
    if (output) b.output(output);
    
    // 添加变量
    if (variables && variables.length) {
      variables.forEach(v => {
        b.variable(v.name, {
          required: v.required,
          description: v.description,
          defaultValue: v.defaultValue,
          type: v.type
        });
      });
    }

    // 添加示例
    if (examples && examples.length) {
      b.fewShot(examples);
    }

    // 添加自定义段落
    if (sections && sections.length) {
      sections.forEach(s => b.section(s.title, s.content));
    }

    // 构建结果
    const result = b.build();

    // 根据请求的格式返回
    let formattedOutput;
    switch (format) {
      case 'json':
        formattedOutput = result.toJSON();
        break;
      case 'yaml':
        formattedOutput = result.toYAML();
        break;
      case 'markdown':
        formattedOutput = result.toMarkdown();
        break;
      default:
        formattedOutput = result.content;
    }

    res.json({
      success: true,
      data: {
        prompt: result.content,
        formatted: formattedOutput,
        format,
        variables: result.variables,
        metadata: result.metadata
      }
    });

  } catch (error) {
    console.error('Build error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'BUILD_FAILED',
        message: error.message || '提示词构建失败'
      }
    });
  }
});

/**
 * 解析现有提示词
 * POST /api/prompts/parse
 * 
 * @body {string} prompt - 现有提示词文本
 */
router.post('/parse', (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PROMPT',
          message: '请提供有效的提示词文本'
        }
      });
    }

    const result = fromPrompt(prompt).build();

    res.json({
      success: true,
      data: {
        parsed: result.metadata,
        content: result.content
      }
    });

  } catch (error) {
    console.error('Parse error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PARSE_FAILED',
        message: error.message || '提示词解析失败'
      }
    });
  }
});

/**
 * 获取构建器模板列表
 * GET /api/prompts/builder-templates
 */
router.get('/builder-templates', (req, res) => {
  const templates = [
    {
      id: 'code-review',
      name: '代码审查',
      icon: '🔍',
      description: '审查代码质量和最佳实践',
      preset: {
        role: '高级软件工程师',
        task: '审查以下代码，识别潜在问题并提供改进建议',
        constraints: ['关注性能问题', '检查安全漏洞', '提供具体的修复代码'],
        output: 'JSON格式: { issues: [], suggestions: [], rating: number }',
        variables: [{ name: 'code', required: true, description: '待审查的代码' }]
      }
    },
    {
      id: 'translation',
      name: '翻译助手',
      icon: '🌐',
      description: '专业的多语言翻译',
      preset: {
        role: '专业翻译',
        task: '将以下文本从 ${source_lang} 翻译成 ${target_lang}',
        constraints: ['保持原文语义', '使用自然流畅的表达', '注意文化差异'],
        variables: [
          { name: 'source_lang', required: true, description: '源语言', defaultValue: '英文' },
          { name: 'target_lang', required: true, description: '目标语言', defaultValue: '中文' },
          { name: 'text', required: true, description: '待翻译文本' }
        ]
      }
    },
    {
      id: 'summarize',
      name: '文本摘要',
      icon: '📝',
      description: '生成简洁准确的摘要',
      preset: {
        role: '文本分析专家',
        task: '为以下内容生成摘要',
        constraints: ['抓住核心要点', '语言简洁', '保持客观'],
        output: '不超过 ${max_length} 字的摘要',
        variables: [
          { name: 'text', required: true, description: '待摘要的文本' },
          { name: 'max_length', required: false, description: '最大字数', defaultValue: '200' }
        ]
      }
    },
    {
      id: 'creative-writing',
      name: '创意写作',
      icon: '✨',
      description: '生成创意内容',
      preset: {
        role: '创意写作专家',
        persona: {
          name: 'CreativeWriter',
          expertise: '故事创作、文案写作',
          tone: '富有想象力且引人入胜'
        },
        task: '根据以下主题创作 ${content_type}',
        constraints: ['富有创意', '情感共鸣', '结构清晰'],
        variables: [
          { name: 'topic', required: true, description: '创作主题' },
          { name: 'content_type', required: false, description: '内容类型', defaultValue: '短文' },
          { name: 'style', required: false, description: '风格', defaultValue: '现代' }
        ]
      }
    },
    {
      id: 'data-analysis',
      name: '数据分析',
      icon: '📊',
      description: '分析数据并提供洞察',
      preset: {
        role: '数据分析师',
        task: '分析以下数据并提供洞察',
        constraints: ['使用数据支持结论', '提供可视化建议', '给出行动建议'],
        output: 'JSON格式: { summary: string, insights: [], recommendations: [], chartSuggestions: [] }',
        variables: [
          { name: 'data', required: true, description: '待分析的数据' },
          { name: 'focus', required: false, description: '分析重点' }
        ]
      }
    }
  ];

  res.json({
    success: true,
    templates
  });
});

// ==================== 变量解析器 API ====================

/**
 * 解析模板中的变量
 * POST /api/prompts/variables/parse
 * 
 * @body {string} template - 模板字符串
 */
router.post('/variables/parse', (req, res) => {
  try {
    const { template } = req.body;
    
    if (!template || typeof template !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TEMPLATE',
          message: '请提供有效的模板字符串'
        }
      });
    }

    const variables = VariableParser.parse(template);
    const formFields = VariableParser.generateFormFields(template);
    const highlighted = VariableParser.highlight(template);

    res.json({
      success: true,
      data: {
        variables,
        formFields,
        highlighted,
        hasVariables: variables.length > 0,
        requiredCount: variables.filter(v => v.required).length,
        optionalCount: variables.filter(v => !v.required).length
      }
    });

  } catch (error) {
    console.error('Variable parse error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'VARIABLE_PARSE_FAILED',
        message: error.message || '变量解析失败'
      }
    });
  }
});

/**
 * 填充模板变量
 * POST /api/prompts/variables/interpolate
 * 
 * @body {string} template - 模板字符串
 * @body {Object} values - 变量值映射
 * @body {Object} [options] - 选项
 */
router.post('/variables/interpolate', (req, res) => {
  try {
    const { template, values = {}, options = {} } = req.body;
    
    if (!template || typeof template !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TEMPLATE',
          message: '请提供有效的模板字符串'
        }
      });
    }

    // 验证变量
    const validation = VariableParser.validate(template, values);
    
    // 如果存在缺失的必需变量且不是宽松模式，返回验证错误
    if (!validation.valid && !options.keepUnmatched) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: '变量验证失败',
          details: {
            missing: validation.missing,
            errors: validation.errors
          }
        }
      });
    }

    // 执行插值
    const result = VariableParser.interpolate(template, values, options);

    res.json({
      success: true,
      data: {
        result,
        validation
      }
    });

  } catch (error) {
    console.error('Variable interpolate error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERPOLATE_FAILED',
        message: error.message || '变量插值失败'
      }
    });
  }
});

/**
 * 验证模板变量
 * POST /api/prompts/variables/validate
 * 
 * @body {string} template - 模板字符串
 * @body {Object} values - 变量值映射
 */
router.post('/variables/validate', (req, res) => {
  try {
    const { template, values = {} } = req.body;
    
    if (!template || typeof template !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TEMPLATE',
          message: '请提供有效的模板字符串'
        }
      });
    }

    const validation = VariableParser.validate(template, values);

    res.json({
      success: true,
      data: validation
    });

  } catch (error) {
    console.error('Variable validate error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'VALIDATE_FAILED',
        message: error.message || '变量验证失败'
      }
    });
  }
});

/**
 * 获取支持的变量类型
 * GET /api/prompts/variables/types
 */
router.get('/variables/types', (req, res) => {
  res.json({
    success: true,
    data: {
      types: Object.values(VariableTypes),
      typeDetails: [
        { type: 'string', description: '普通字符串', aliases: ['str'], inputType: 'text' },
        { type: 'number', description: '数字', aliases: ['num', 'int', 'integer', 'float'], inputType: 'number' },
        { type: 'boolean', description: '布尔值', aliases: ['bool'], inputType: 'checkbox' },
        { type: 'array', description: '数组/列表', aliases: ['arr', 'list'], inputType: 'text' },
        { type: 'object', description: '对象/JSON', aliases: ['obj', 'json'], inputType: 'textarea' },
        { type: 'date', description: '日期', aliases: ['datetime'], inputType: 'date' },
        { type: 'email', description: '邮箱地址', aliases: [], inputType: 'email' },
        { type: 'url', description: 'URL链接', aliases: ['link'], inputType: 'url' },
        { type: 'text', description: '多行文本', aliases: ['textarea'], inputType: 'textarea' }
      ]
    }
  });
});

// ==================== 分类体系 API ====================

/**
 * 获取所有分类
 * GET /api/prompts/categories
 */
router.get('/categories', (req, res) => {
  try {
    const categories = categoryService.getCategories();
    const stats = categoryService.getStats();
    
    res.json({
      success: true,
      data: {
        categories,
        stats
      }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'CATEGORIES_ERROR', message: error.message }
    });
  }
});

/**
 * 搜索分类和技术 (放在 :id 路由前面)
 * GET /api/prompts/categories/search?q=xxx
 */
router.get('/categories/search', (req, res) => {
  try {
    const query = req.query.q || '';
    
    if (!query.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'EMPTY_QUERY', message: '搜索关键词不能为空' }
      });
    }
    
    const results = categoryService.search(query, {
      includeSubcategories: req.query.subcategories !== 'false',
      includeTechniques: req.query.techniques !== 'false',
      includeTags: req.query.tags !== 'false'
    });
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Search categories error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SEARCH_ERROR', message: error.message }
    });
  }
});

/**
 * 根据标签筛选 (放在 :id 路由前面)
 * POST /api/prompts/categories/filter
 */
router.post('/categories/filter', (req, res) => {
  try {
    const { tags } = req.body;
    
    if (!tags || !Array.isArray(tags)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_TAGS', message: '请提供标签数组' }
      });
    }
    
    const results = categoryService.filterByTags(tags);
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Filter by tags error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FILTER_ERROR', message: error.message }
    });
  }
});

/**
 * 推荐分类 (放在 :id 路由前面)
 * POST /api/prompts/categories/recommend
 */
router.post('/categories/recommend', (req, res) => {
  try {
    const { scenario } = req.body;
    
    if (!scenario || typeof scenario !== 'string') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_SCENARIO', message: '请提供场景描述' }
      });
    }
    
    const recommendations = categoryService.recommend(scenario);
    
    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Recommend categories error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'RECOMMEND_ERROR', message: error.message }
    });
  }
});

/**
 * 获取分类详情（包含子分类）
 * GET /api/prompts/categories/:id
 */
router.get('/categories/:id', (req, res) => {
  try {
    const category = categoryService.getCategory(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: { code: 'CATEGORY_NOT_FOUND', message: '分类不存在' }
      });
    }
    
    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'CATEGORY_ERROR', message: error.message }
    });
  }
});

/**
 * 获取分类树结构
 * GET /api/prompts/categories-tree
 */
router.get('/categories-tree', (req, res) => {
  try {
    const tree = categoryService.getTree();
    
    res.json({
      success: true,
      data: tree
    });
  } catch (error) {
    console.error('Get categories tree error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'TREE_ERROR', message: error.message }
    });
  }
});

/**
 * 获取所有提示词技术
 * GET /api/prompts/techniques
 */
router.get('/techniques', (req, res) => {
  try {
    const techniques = categoryService.getTechniques();
    
    res.json({
      success: true,
      data: techniques
    });
  } catch (error) {
    console.error('Get techniques error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'TECHNIQUES_ERROR', message: error.message }
    });
  }
});

/**
 * 获取技术详情
 * GET /api/prompts/techniques/:id
 */
router.get('/techniques/:id', (req, res) => {
  try {
    const technique = categoryService.getTechnique(req.params.id);
    
    if (!technique) {
      return res.status(404).json({
        success: false,
        error: { code: 'TECHNIQUE_NOT_FOUND', message: '技术不存在' }
      });
    }
    
    res.json({
      success: true,
      data: technique
    });
  } catch (error) {
    console.error('Get technique error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'TECHNIQUE_ERROR', message: error.message }
    });
  }
});

/**
 * 获取所有标签
 * GET /api/prompts/tags
 */
router.get('/tags', (req, res) => {
  try {
    const tags = categoryService.getAllTags();
    
    res.json({
      success: true,
      data: tags
    });
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'TAGS_ERROR', message: error.message }
    });
  }
});

// ==================== 预置模板库 API ====================

/**
 * 获取所有预置模板列表
 * GET /api/prompts/presets
 * 
 * @query {string} [category] - 按分类筛选
 * @query {string} [difficulty] - 按难度筛选 (beginner, intermediate, advanced)
 * @query {string} [technique] - 按技术筛选
 * @query {number} [limit] - 限制返回数量
 */
/**
 * ====================================
 * 设计类预置模板 API (Design Presets)
 * ====================================
 */

/**
 * 获取所有设计类预置模板（首页设计助手使用）
 * GET /api/prompts/design-presets
 * 
 * @query {boolean} [includeTemplate=false] - 是否包含完整模板
 * @query {boolean} [includeSystemPrompt=false] - 是否包含系统提示词
 */
router.get('/design-presets', (req, res) => {
  try {
    const includeTemplate = req.query.includeTemplate === 'true';
    const includeSystemPrompt = req.query.includeSystemPrompt === 'true';
    
    const designPresets = presetService.getDesignPresets({
      includeTemplate,
      includeSystemPrompt
    });
    
    res.json({
      success: true,
      data: designPresets,
      meta: {
        total: designPresets.length,
        category: 'design'
      }
    });
  } catch (error) {
    console.error('Get design presets error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DESIGN_PRESETS_ERROR', message: error.message }
    });
  }
});

/**
 * 获取设计类预置模板详情
 * GET /api/prompts/design-presets/:id
 */
router.get('/design-presets/:id', (req, res) => {
  try {
    const preset = presetService.getDesignPresetById(req.params.id);
    
    if (!preset) {
      return res.status(404).json({
        success: false,
        error: { code: 'DESIGN_PRESET_NOT_FOUND', message: '设计预置模板不存在' }
      });
    }
    
    res.json({
      success: true,
      data: preset
    });
  } catch (error) {
    console.error('Get design preset error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DESIGN_PRESET_ERROR', message: error.message }
    });
  }
});

/**
 * 应用设计类预置模板
 * POST /api/prompts/design-presets/:id/apply
 * 
 * @body {Object} variables - 变量值
 */
router.post('/design-presets/:id/apply', (req, res) => {
  try {
    const { variables = {} } = req.body;
    
    const result = presetService.applyDesignPreset(req.params.id, variables);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Apply design preset error:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: { code: 'DESIGN_PRESET_NOT_FOUND', message: error.message }
      });
    }
    
    res.status(500).json({
      success: false,
      error: { code: 'APPLY_ERROR', message: error.message }
    });
  }
});

/**
 * ====================================
 * 预置模板 API (Presets)
 * ====================================
 */

/**
 * 获取所有预置模板列表
 * GET /api/prompts/presets
 */
router.get('/presets', (req, res) => {
  try {
    const { category, difficulty, technique, limit } = req.query;
    
    const presets = presetService.getAll({
      category,
      difficulty,
      technique,
      limit: limit ? parseInt(limit, 10) : undefined
    });
    
    res.json({
      success: true,
      data: presets,
      meta: {
        total: presets.length
      }
    });
  } catch (error) {
    console.error('Get presets error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'PRESETS_ERROR', message: error.message }
    });
  }
});

/**
 * 搜索预置模板
 * GET /api/prompts/presets/search
 * 
 * @query {string} q - 搜索关键词
 */
router.get('/presets/search', (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_QUERY', message: '缺少搜索关键词' }
      });
    }
    
    const results = presetService.search(q);
    
    res.json({
      success: true,
      data: results,
      meta: {
        query: q,
        total: results.length
      }
    });
  } catch (error) {
    console.error('Search presets error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SEARCH_ERROR', message: error.message }
    });
  }
});

/**
 * 根据标签筛选预置模板
 * GET /api/prompts/presets/filter
 * 
 * @query {string} tags - 标签（逗号分隔）
 */
router.get('/presets/filter', (req, res) => {
  try {
    const { tags } = req.query;
    
    if (!tags) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_TAGS', message: '缺少标签参数' }
      });
    }
    
    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
    const results = presetService.filterByTags(tagList);
    
    res.json({
      success: true,
      data: results,
      meta: {
        tags: tagList,
        total: results.length
      }
    });
  } catch (error) {
    console.error('Filter presets error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FILTER_ERROR', message: error.message }
    });
  }
});

/**
 * 获取推荐预置模板
 * GET /api/prompts/presets/recommended
 * 
 * @query {number} [limit=5] - 返回数量
 */
router.get('/presets/recommended', (req, res) => {
  try {
    const { limit } = req.query;
    const recommended = presetService.getRecommended(limit ? parseInt(limit, 10) : 5);
    
    res.json({
      success: true,
      data: recommended
    });
  } catch (error) {
    console.error('Get recommended presets error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'RECOMMENDED_ERROR', message: error.message }
    });
  }
});

/**
 * 获取预置模板统计信息
 * GET /api/prompts/presets/stats
 */
router.get('/presets/stats', (req, res) => {
  try {
    const stats = presetService.getStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get presets stats error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'STATS_ERROR', message: error.message }
    });
  }
});

/**
 * 获取预置模板详情
 * GET /api/prompts/presets/:id
 */
router.get('/presets/:id', (req, res) => {
  try {
    const preset = presetService.getById(req.params.id);
    
    if (!preset) {
      return res.status(404).json({
        success: false,
        error: { code: 'PRESET_NOT_FOUND', message: '预置模板不存在' }
      });
    }
    
    res.json({
      success: true,
      data: preset
    });
  } catch (error) {
    console.error('Get preset error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'PRESET_ERROR', message: error.message }
    });
  }
});

/**
 * 获取预置模板的变量定义
 * GET /api/prompts/presets/:id/variables
 */
router.get('/presets/:id/variables', (req, res) => {
  try {
    const preset = presetService.getById(req.params.id);
    
    if (!preset) {
      return res.status(404).json({
        success: false,
        error: { code: 'PRESET_NOT_FOUND', message: '预置模板不存在' }
      });
    }
    
    const variables = presetService.getVariables(req.params.id);
    
    res.json({
      success: true,
      data: {
        presetId: req.params.id,
        presetName: preset.name,
        variables
      }
    });
  } catch (error) {
    console.error('Get preset variables error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'VARIABLES_ERROR', message: error.message }
    });
  }
});

/**
 * 验证预置模板的变量
 * POST /api/prompts/presets/:id/validate
 * 
 * @body {Object} values - 变量值
 */
router.post('/presets/:id/validate', (req, res) => {
  try {
    const preset = presetService.getById(req.params.id);
    
    if (!preset) {
      return res.status(404).json({
        success: false,
        error: { code: 'PRESET_NOT_FOUND', message: '预置模板不存在' }
      });
    }
    
    const { values = {} } = req.body;
    const result = presetService.validateVariables(req.params.id, values);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Validate preset variables error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'VALIDATE_ERROR', message: error.message }
    });
  }
});

/**
 * 应用预置模板生成提示词
 * POST /api/prompts/presets/:id/apply
 * 
 * @body {Object} variables - 变量值
 * @body {string} [format] - 输出格式 (text, json, yaml, markdown)
 * @body {string} [language] - 语言
 */
router.post('/presets/:id/apply', (req, res) => {
  try {
    const preset = presetService.getById(req.params.id);
    
    if (!preset) {
      return res.status(404).json({
        success: false,
        error: { code: 'PRESET_NOT_FOUND', message: '预置模板不存在' }
      });
    }
    
    const { variables = {}, format = 'text', language = 'zh-CN' } = req.body;
    
    // 先验证变量
    const validation = presetService.validateVariables(req.params.id, variables);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: { 
          code: 'VALIDATION_FAILED', 
          message: '变量验证失败',
          details: validation
        }
      });
    }
    
    // 应用模板
    const result = presetService.apply(req.params.id, variables, { format, language });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Apply preset error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'APPLY_ERROR', message: error.message }
    });
  }
});

// ==================== 提示词改进 API ====================

/**
 * 分析提示词质量
 * POST /api/prompts/analyze
 * POST /api/prompts/improve/analyze (别名)
 * 
 * @body {string} prompt - 要分析的提示词
 */
const analyzeHandler = (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PROMPT', message: '缺少提示词' }
      });
    }
    
    const result = improverService.analyze(prompt);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Analyze prompt error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ANALYZE_ERROR', message: error.message }
    });
  }
};

router.post('/analyze', analyzeHandler);
router.post('/improve/analyze', analyzeHandler);

/**
 * 改进提示词（基于规则）
 * POST /api/prompts/improve
 * 
 * @body {string} prompt - 要改进的提示词
 * @body {string[]} [focus] - 重点改进的维度
 * @body {string} [style] - 改进风格 (balanced, minimal, comprehensive)
 */
router.post('/improve', (req, res) => {
  try {
    const { prompt, focus, style } = req.body;
    
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PROMPT', message: '缺少提示词' }
      });
    }
    
    const result = improverService.improve(prompt, { focus, style });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Improve prompt error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'IMPROVE_ERROR', message: error.message }
    });
  }
});

/**
 * 使用 AI 改进提示词
 * POST /api/prompts/improve/ai
 * 
 * @body {string} prompt - 要改进的提示词
 * @body {string} [systemPrompt] - 自定义系统提示词
 * @body {Object} config - LLM 配置
 * @body {string} [config.provider] - 提供者 (local, cloud)
 * @body {string} [config.model] - 模型名称
 * @body {string} [config.apiKey] - API Key (云端)
 * @body {string} [config.baseUrl] - API Base URL (云端)
 */
router.post('/improve/ai', async (req, res) => {
  try {
    const { prompt, systemPrompt, config = {} } = req.body;
    
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PROMPT', message: '缺少提示词' }
      });
    }
    
    // 如果有自定义系统提示词，传递给服务
    const result = await improverService.improveWithAI(prompt, config, systemPrompt);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('AI improve prompt error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'AI_IMPROVE_ERROR', message: error.message }
    });
  }
});

/**
 * 获取改进技巧
 * GET /api/prompts/improve/tips
 * 
 * @query {string} [dimension] - 指定维度
 */
router.get('/improve/tips', (req, res) => {
  try {
    const { dimension } = req.query;
    const tips = improverService.getTips(dimension);
    
    res.json({
      success: true,
      data: tips
    });
  } catch (error) {
    console.error('Get tips error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'TIPS_ERROR', message: error.message }
    });
  }
});

/**
 * 获取评分维度
 * GET /api/prompts/improve/dimensions
 */
router.get('/improve/dimensions', (req, res) => {
  try {
    const dimensions = improverService.getDimensions();
    
    res.json({
      success: true,
      data: dimensions
    });
  } catch (error) {
    console.error('Get dimensions error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DIMENSIONS_ERROR', message: error.message }
    });
  }
});

// =================================================================
// 图像提示词构建器 API (Image Prompt Builder)
// =================================================================

/**
 * 构建图像提示词
 * POST /api/prompts/image/build
 * 
 * @body {Object} config - 图像配置
 * @body {string} config.subject - 主体描述
 * @body {Object} [config.subjectOptions] - 主体选项 (pose, expression, clothing, features)
 * @body {string} [config.environment] - 环境描述
 * @body {Object} [config.environmentOptions] - 环境选项 (time, weather, season)
 * @body {string|string[]} [config.style] - 风格
 * @body {string|string[]} [config.artist] - 艺术家
 * @body {string|string[]} [config.lighting] - 光照
 * @body {string|string[]} [config.camera] - 相机设置
 * @body {string|string[]} [config.mood] - 情绪
 * @body {string|string[]} [config.color] - 色彩
 * @body {string|string[]} [config.quality] - 质量修饰词
 * @body {string[]} [config.details] - 额外细节
 * @body {string|string[]} [config.negative] - 负面提示词
 * @body {string} [config.platform] - 目标平台
 * @body {string} [config.aspect] - 宽高比
 * @body {string} [config.version] - 版本
 * @body {number} [config.stylize] - 风格化程度
 * @body {number} [config.chaos] - 混乱度
 * @body {number} [config.seed] - 种子
 * @body {string} [config.preset] - 预设
 * @body {string} [config.language] - 语言 (en/zh)
 */
router.post('/image/build', (req, res) => {
  try {
    const config = req.body;
    
    if (!config || (!config.subject && !config.preset)) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_SUBJECT', message: '必须提供主体描述或预设' }
      });
    }
    
    const imgBuilder = imageBuilder();
    
    // 设置语言
    if (config.language) {
      imgBuilder.language(config.language);
    }
    
    // 应用预设
    if (config.preset) {
      imgBuilder.preset(config.preset);
    }
    
    // 主体
    if (config.subject) {
      imgBuilder.subject(config.subject, config.subjectOptions || {});
    }
    
    // 环境
    if (config.environment) {
      imgBuilder.environment(config.environment, config.environmentOptions || {});
    }
    
    // 背景
    if (config.background) {
      imgBuilder.background(config.background);
    }
    
    // 风格
    if (config.style) {
      imgBuilder.style(config.style);
    }
    
    // 艺术家
    if (config.artist) {
      imgBuilder.artist(config.artist);
    }
    
    // 光照
    if (config.lighting) {
      imgBuilder.lighting(config.lighting);
    }
    
    // 相机
    if (config.camera) {
      imgBuilder.camera(config.camera);
    }
    
    // 情绪
    if (config.mood) {
      imgBuilder.mood(config.mood);
    }
    
    // 色彩
    if (config.color) {
      imgBuilder.color(config.color);
    }
    
    // 质量
    if (config.quality) {
      imgBuilder.quality(config.quality);
    }
    
    // 细节
    if (config.details) {
      imgBuilder.details(config.details);
    }
    
    // 负面提示词
    if (config.negative) {
      imgBuilder.negative(config.negative);
    }
    
    // 平台
    if (config.platform) {
      imgBuilder.platform(config.platform);
    }
    
    // 平台参数
    if (config.aspect) imgBuilder.aspect(config.aspect);
    if (config.version) imgBuilder.version(config.version);
    if (config.stylize !== undefined) imgBuilder.stylize(config.stylize);
    if (config.chaos !== undefined) imgBuilder.chaos(config.chaos);
    if (config.seed !== undefined) imgBuilder.seed(config.seed);
    
    const result = imgBuilder.build();
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Build image prompt error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'BUILD_ERROR', message: error.message }
    });
  }
});

/**
 * 获取可用的图像风格列表
 * GET /api/prompts/image/styles
 */
router.get('/image/styles', (req, res) => {
  try {
    const styles = getStyles();
    res.json({
      success: true,
      data: styles
    });
  } catch (error) {
    console.error('Get styles error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'STYLES_ERROR', message: error.message }
    });
  }
});

/**
 * 获取可用的艺术家列表
 * GET /api/prompts/image/artists
 */
router.get('/image/artists', (req, res) => {
  try {
    const artists = getArtists();
    res.json({
      success: true,
      data: artists
    });
  } catch (error) {
    console.error('Get artists error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ARTISTS_ERROR', message: error.message }
    });
  }
});

/**
 * 获取可用的光照预设
 * GET /api/prompts/image/lighting
 */
router.get('/image/lighting', (req, res) => {
  try {
    const lighting = getLighting();
    res.json({
      success: true,
      data: lighting
    });
  } catch (error) {
    console.error('Get lighting error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'LIGHTING_ERROR', message: error.message }
    });
  }
});

/**
 * 获取可用的相机预设
 * GET /api/prompts/image/camera
 */
router.get('/image/camera', (req, res) => {
  try {
    const camera = getCamera();
    res.json({
      success: true,
      data: camera
    });
  } catch (error) {
    console.error('Get camera error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'CAMERA_ERROR', message: error.message }
    });
  }
});

/**
 * 获取可用的情绪预设
 * GET /api/prompts/image/moods
 */
router.get('/image/moods', (req, res) => {
  try {
    const moods = getMoods();
    res.json({
      success: true,
      data: moods
    });
  } catch (error) {
    console.error('Get moods error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'MOODS_ERROR', message: error.message }
    });
  }
});

/**
 * 获取可用的色彩方案
 * GET /api/prompts/image/colors
 */
router.get('/image/colors', (req, res) => {
  try {
    const colors = getColorSchemes();
    res.json({
      success: true,
      data: colors
    });
  } catch (error) {
    console.error('Get colors error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'COLORS_ERROR', message: error.message }
    });
  }
});

/**
 * 获取支持的平台配置
 * GET /api/prompts/image/platforms
 */
router.get('/image/platforms', (req, res) => {
  try {
    const platforms = getPlatforms();
    res.json({
      success: true,
      data: platforms
    });
  } catch (error) {
    console.error('Get platforms error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'PLATFORMS_ERROR', message: error.message }
    });
  }
});

/**
 * 获取负面提示词预设
 * GET /api/prompts/image/negatives
 */
router.get('/image/negatives', (req, res) => {
  try {
    const negatives = getNegativePresets();
    res.json({
      success: true,
      data: negatives
    });
  } catch (error) {
    console.error('Get negatives error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'NEGATIVES_ERROR', message: error.message }
    });
  }
});

/**
 * 获取所有图像构建器资源
 * GET /api/prompts/image/resources
 */
router.get('/image/resources', (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        styles: getStyles(),
        artists: getArtists(),
        lighting: getLighting(),
        camera: getCamera(),
        moods: getMoods(),
        colors: getColorSchemes(),
        platforms: getPlatforms(),
        negatives: getNegativePresets()
      }
    });
  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'RESOURCES_ERROR', message: error.message }
    });
  }
});

module.exports = router;
