/**
 * 动态设计服务 - Dynamic Design Service
 * 
 * 将设计描述转化为 HTML/CSS/SVG 动态代码
 * 支持双入口：独立使用 + 设计助手下游
 * 
 * @version 1.0.0 - Phase 13
 */

const llmService = require('./llmService');

/**
 * 动画效果预设
 */
const ANIMATION_EFFECTS = {
  fadeIn: {
    name: '渐显',
    nameEn: 'Fade In',
    css: '@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }',
    description: '元素从透明渐变为可见'
  },
  bounce: {
    name: '弹跳',
    nameEn: 'Bounce',
    css: '@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }',
    description: '元素上下弹跳'
  },
  rotate: {
    name: '旋转',
    nameEn: 'Rotate',
    css: '@keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }',
    description: '元素持续旋转'
  },
  strokeDraw: {
    name: '描边绘制',
    nameEn: 'Stroke Draw',
    css: '@keyframes strokeDraw { to { stroke-dashoffset: 0; } }',
    description: 'SVG 路径描边动画'
  },
  glow: {
    name: '发光',
    nameEn: 'Glow',
    css: '@keyframes glow { 0%, 100% { filter: drop-shadow(0 0 5px currentColor); } 50% { filter: drop-shadow(0 0 20px currentColor); } }',
    description: '元素发光脉冲效果'
  },
  pulse: {
    name: '脉冲',
    nameEn: 'Pulse',
    css: '@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }',
    description: '元素轻微缩放脉冲'
  },
  slideIn: {
    name: '滑入',
    nameEn: 'Slide In',
    css: '@keyframes slideIn { from { transform: translateX(-100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }',
    description: '元素从左侧滑入'
  },
  typewriter: {
    name: '打字机',
    nameEn: 'Typewriter',
    css: '@keyframes typewriter { from { width: 0; } to { width: 100%; } }',
    description: '文字逐字出现效果'
  }
};

/**
 * 缓动函数选项
 */
const EASING_OPTIONS = [
  { value: 'ease', label: 'Ease（默认）' },
  { value: 'ease-in', label: 'Ease In（渐入）' },
  { value: 'ease-out', label: 'Ease Out（渐出）' },
  { value: 'ease-in-out', label: 'Ease In-Out（渐入渐出）' },
  { value: 'linear', label: 'Linear（线性）' },
  { value: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', label: 'Back（回弹）' },
  { value: 'cubic-bezier(0.34, 1.56, 0.64, 1)', label: 'Elastic（弹性）' }
];

/**
 * 适配动态设计的设计角色 ID 列表（分阶段）
 */
const DYNAMIC_DESIGN_PRESETS = {
  // Phase 13 MVP
  phase13: ['logo-design', 'icon-design', 'promo-poster'],
  // Phase 14 扩展
  phase14: ['social-media-graphic', 'event-poster', 'ad-creative'],
  // Phase 15 可选
  phase15: ['brand-poster', 'business-card', 'book-cover']
};

/**
 * 获取当前支持的所有动态设计角色
 */
function getSupportedPresets() {
  return [
    ...DYNAMIC_DESIGN_PRESETS.phase13,
    ...DYNAMIC_DESIGN_PRESETS.phase14,
    ...DYNAMIC_DESIGN_PRESETS.phase15
  ];
}

/**
 * 判断某个设计角色是否支持动态设计
 */
function isPresetSupported(presetId) {
  return getSupportedPresets().includes(presetId);
}

/**
 * 构建系统提示词（核心）
 * 
 * 关键设计：控制 Token 使用量，适配小模型
 * 目标生成量：200-800 tokens（HTML/CSS/SVG 代码）
 */
function buildSystemPrompt(designType) {
  return `你是一个专业的动态设计代码生成器。你的任务是根据设计描述生成一个完整的、可直接在浏览器中运行的 HTML 文件。

## 输出要求

1. 生成一个完整的 HTML 文件，包含 <!DOCTYPE html>、<html>、<head>、<body> 标签
2. 所有样式写在 <style> 标签内，所有脚本写在 <script> 标签内（如果需要）
3. 优先使用 **纯 CSS 动画**（@keyframes + animation），减少 JavaScript
4. 善用 **SVG** 创建矢量图形（logo、图标、简单插画）
5. 设计画布居中显示，默认尺寸 400x400px
6. 代码简洁高效，注释清晰

## 设计类型：${designType}

## 技术约束

- 纯前端代码，无需任何外部依赖和 CDN
- 使用 CSS 变量管理颜色，方便修改
- 动画流畅，使用 transform 和 opacity（GPU 加速属性）
- 响应式设计，使用 viewBox（SVG）或百分比单位
- 代码总量控制在合理范围（200-500行）

## 输出格式

只输出 HTML 代码，不要任何解释文字。以 <!DOCTYPE html> 开头，以 </html> 结尾。`;
}

/**
 * 构建用户提示词
 * 
 * @param {Object} params - 设计参数
 * @param {string} params.designType - 设计类型（logo/poster/icon）
 * @param {string} [params.brandName] - 品牌名称
 * @param {string} [params.slogan] - 标语
 * @param {string} [params.style] - 设计风格
 * @param {string} [params.colors] - 颜色方案
 * @param {string} [params.description] - 设计描述
 * @param {Object} [params.animation] - 动画配置
 * @param {string} [params.designPrompt] - 来自设计助手的提示词
 * @returns {string} 格式化的用户提示词
 */
function buildUserPrompt(params) {
  const {
    designType = 'logo',
    brandName = '',
    slogan = '',
    style = '',
    colors = '',
    description = '',
    animation = {},
    designPrompt = ''
  } = params;

  const parts = [];

  // 设计类型
  const typeLabels = {
    'logo-design': 'Logo 设计',
    'icon-design': '图标设计',
    'promo-poster': '促销海报',
    'social-media-graphic': '社媒配图',
    'event-poster': '活动海报',
    'ad-creative': '广告创意',
    'brand-poster': '品牌海报',
    'business-card': '名片设计',
    'book-cover': '书籍封面'
  };
  parts.push(`## 设计类型\n${typeLabels[designType] || designType}`);

  // 基本信息
  if (brandName) parts.push(`## 品牌名称\n${brandName}`);
  if (slogan) parts.push(`## 标语/口号\n${slogan}`);
  if (style) parts.push(`## 设计风格\n${style}`);
  if (colors) parts.push(`## 颜色方案\n${colors}`);
  if (description) parts.push(`## 设计描述\n${description}`);

  // 来自设计助手的提示词（下游模式）
  if (designPrompt) {
    parts.push(`## 设计助手提示词参考\n${designPrompt}`);
  }

  // 动画配置
  if (animation && Object.keys(animation).length > 0) {
    const animParts = [];
    if (animation.effects && animation.effects.length > 0) {
      const effectNames = animation.effects.map(e => {
        const effect = ANIMATION_EFFECTS[e];
        return effect ? `${effect.name}(${effect.nameEn})` : e;
      });
      animParts.push(`- 动画效果: ${effectNames.join(', ')}`);
    }
    if (animation.duration) animParts.push(`- 动画时长: ${animation.duration}`);
    if (animation.easing) animParts.push(`- 缓动函数: ${animation.easing}`);
    if (animation.loop) animParts.push(`- 循环模式: ${animation.loop === 'infinite' ? '无限循环' : animation.loop + '次'}`);
    
    if (animParts.length > 0) {
      parts.push(`## 动画要求\n${animParts.join('\n')}`);
    }
  }

  return parts.join('\n\n');
}

/**
 * 从 LLM 响应中提取 HTML 代码
 */
function extractHtmlCode(response) {
  if (!response) return null;

  // 尝试提取 ```html ... ``` 代码块
  const htmlBlockMatch = response.match(/```html\s*\n([\s\S]*?)\n```/);
  if (htmlBlockMatch) {
    return htmlBlockMatch[1].trim();
  }

  // 尝试提取 ``` ... ``` 代码块
  const codeBlockMatch = response.match(/```\s*\n([\s\S]*?)\n```/);
  if (codeBlockMatch) {
    const code = codeBlockMatch[1].trim();
    if (code.includes('<!DOCTYPE') || code.includes('<html') || code.includes('<svg')) {
      return code;
    }
  }

  // 尝试直接查找 HTML 内容
  const htmlMatch = response.match(/(<!DOCTYPE html[\s\S]*<\/html>)/i);
  if (htmlMatch) {
    return htmlMatch[1].trim();
  }

  // 尝试查找 SVG 内容
  const svgMatch = response.match(/(<svg[\s\S]*<\/svg>)/i);
  if (svgMatch) {
    // 包装成完整 HTML
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Dynamic Design</title>
<style>
  body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #1a1a2e; }
  svg { max-width: 400px; max-height: 400px; }
</style>
</head>
<body>
${svgMatch[1]}
</body>
</html>`;
  }

  // 如果包含 HTML 标签，直接返回
  if (response.includes('<') && response.includes('>') && 
      (response.includes('<div') || response.includes('<svg') || response.includes('<style'))) {
    return response.trim();
  }

  return null;
}

/**
 * 代码安全检查
 * 
 * 检查生成的代码是否包含危险内容
 * @param {string} code - HTML 代码
 * @returns {{ safe: boolean, warnings: string[] }}
 */
function checkCodeSafety(code) {
  const warnings = [];

  // 检查危险模式
  const dangerousPatterns = [
    { pattern: /fetch\s*\(/gi, msg: '检测到 fetch 请求' },
    { pattern: /XMLHttpRequest/gi, msg: '检测到 XMLHttpRequest' },
    { pattern: /eval\s*\(/gi, msg: '检测到 eval 调用' },
    { pattern: /Function\s*\(/gi, msg: '检测到 Function 构造器' },
    { pattern: /document\.cookie/gi, msg: '检测到 cookie 访问' },
    { pattern: /localStorage|sessionStorage/gi, msg: '检测到存储 API 访问' },
    { pattern: /window\.open/gi, msg: '检测到窗口操作' },
    { pattern: /location\s*[.=]/gi, msg: '检测到页面跳转' },
    { pattern: /import\s*\(/gi, msg: '检测到动态导入' },
    { pattern: /<iframe/gi, msg: '检测到嵌套 iframe' },
    { pattern: /src\s*=\s*["']https?:/gi, msg: '检测到外部资源引用' }
  ];

  for (const { pattern, msg } of dangerousPatterns) {
    if (pattern.test(code)) {
      warnings.push(msg);
    }
  }

  return {
    safe: warnings.length === 0,
    warnings
  };
}

/**
 * 生成动态设计代码
 * 
 * @param {Object} params - 设计参数
 * @param {Object} config - LLM 配置
 * @returns {Promise<Object>} 生成结果
 */
async function generateDynamicDesign(params, config) {
  const designType = params.designType || 'logo-design';
  
  // 构建提示词
  const systemPrompt = buildSystemPrompt(designType);
  const userPrompt = buildUserPrompt(params);

  console.log('[DynamicDesign] 生成动态设计...', { designType, hasDesignPrompt: !!params.designPrompt });

  // 调用 LLM
  const response = await llmService.call(userPrompt, systemPrompt, config, {
    temperature: 0.7,        // 适中的创造性
    top_p: 0.9,
    presence_penalty: 0.3,
    frequency_penalty: 0.1
  });

  // 提取 HTML 代码
  const htmlCode = extractHtmlCode(response);
  if (!htmlCode) {
    throw new Error('无法从 LLM 响应中提取有效的 HTML 代码');
  }

  // 安全检查
  const safetyCheck = checkCodeSafety(htmlCode);
  if (safetyCheck.warnings.length > 0) {
    console.warn('[DynamicDesign] 安全警告:', safetyCheck.warnings);
  }

  return {
    code: htmlCode,
    safety: safetyCheck,
    metadata: {
      designType,
      params: {
        brandName: params.brandName,
        style: params.style,
        colors: params.colors,
        animation: params.animation
      },
      source: params.designPrompt ? 'design-assistant' : 'standalone',
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * 迭代修改动态设计
 * 
 * @param {string} currentCode - 当前代码
 * @param {string} instruction - 修改指令
 * @param {Object} config - LLM 配置
 * @returns {Promise<Object>} 修改后的结果
 */
async function iterateDesign(currentCode, instruction, config) {
  const systemPrompt = `你是一个专业的动态设计代码修改器。用户会提供当前的 HTML/CSS/SVG 代码和修改指令。

## 任务
根据修改指令，修改现有代码。保持代码的整体结构和风格不变，只做指定的修改。

## 输出要求
- 输出完整的修改后 HTML 代码
- 只输出代码，不要解释
- 以 <!DOCTYPE html> 开头，以 </html> 结尾`;

  const userPrompt = `## 当前代码
\`\`\`html
${currentCode}
\`\`\`

## 修改指令
${instruction}

请输出修改后的完整 HTML 代码：`;

  console.log('[DynamicDesign] 迭代修改:', instruction.substring(0, 50));

  const response = await llmService.call(userPrompt, systemPrompt, config, {
    temperature: 0.5,  // 迭代修改用较低的温度保持稳定性
    top_p: 0.85,
    presence_penalty: 0.2,
    frequency_penalty: 0.1
  });

  const htmlCode = extractHtmlCode(response);
  if (!htmlCode) {
    throw new Error('无法从 LLM 响应中提取修改后的 HTML 代码');
  }

  const safetyCheck = checkCodeSafety(htmlCode);

  return {
    code: htmlCode,
    safety: safetyCheck,
    metadata: {
      instruction,
      timestamp: new Date().toISOString()
    }
  };
}

module.exports = {
  generateDynamicDesign,
  iterateDesign,
  buildSystemPrompt,
  buildUserPrompt,
  extractHtmlCode,
  checkCodeSafety,
  isPresetSupported,
  getSupportedPresets,
  ANIMATION_EFFECTS,
  EASING_OPTIONS,
  DYNAMIC_DESIGN_PRESETS
};
