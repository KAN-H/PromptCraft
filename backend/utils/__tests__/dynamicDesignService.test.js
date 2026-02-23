/**
 * 动态设计服务单元测试
 * @version 1.0.0 - Phase 13
 */

const {
  buildSystemPrompt,
  buildUserPrompt,
  extractHtmlCode,
  checkCodeSafety,
  isPresetSupported,
  getSupportedPresets,
  ANIMATION_EFFECTS,
  EASING_OPTIONS,
  DYNAMIC_DESIGN_PRESETS
} = require('../../services/dynamicDesignService');

describe('DynamicDesignService', () => {

  // ==================== 动画效果预设 ====================
  describe('ANIMATION_EFFECTS', () => {
    it('应该包含所有基本动画效果', () => {
      expect(ANIMATION_EFFECTS).toHaveProperty('fadeIn');
      expect(ANIMATION_EFFECTS).toHaveProperty('bounce');
      expect(ANIMATION_EFFECTS).toHaveProperty('rotate');
      expect(ANIMATION_EFFECTS).toHaveProperty('strokeDraw');
      expect(ANIMATION_EFFECTS).toHaveProperty('glow');
      expect(ANIMATION_EFFECTS).toHaveProperty('pulse');
      expect(ANIMATION_EFFECTS).toHaveProperty('slideIn');
      expect(ANIMATION_EFFECTS).toHaveProperty('typewriter');
    });

    it('每个效果应该有完整的属性', () => {
      Object.entries(ANIMATION_EFFECTS).forEach(([key, effect]) => {
        expect(effect).toHaveProperty('name');
        expect(effect).toHaveProperty('nameEn');
        expect(effect).toHaveProperty('css');
        expect(effect).toHaveProperty('description');
        expect(typeof effect.name).toBe('string');
        expect(typeof effect.css).toBe('string');
        expect(effect.css).toContain('@keyframes');
      });
    });
  });

  // ==================== 缓动函数 ====================
  describe('EASING_OPTIONS', () => {
    it('应该包含常用缓动函数', () => {
      const values = EASING_OPTIONS.map(e => e.value);
      expect(values).toContain('ease');
      expect(values).toContain('ease-in-out');
      expect(values).toContain('linear');
    });

    it('每个选项应该有 value 和 label', () => {
      EASING_OPTIONS.forEach(option => {
        expect(option).toHaveProperty('value');
        expect(option).toHaveProperty('label');
      });
    });
  });

  // ==================== 适配角色 ====================
  describe('DYNAMIC_DESIGN_PRESETS', () => {
    it('应该按阶段分组', () => {
      expect(DYNAMIC_DESIGN_PRESETS).toHaveProperty('phase13');
      expect(DYNAMIC_DESIGN_PRESETS).toHaveProperty('phase14');
      expect(DYNAMIC_DESIGN_PRESETS).toHaveProperty('phase15');
    });

    it('Phase 13 应该包含 MVP 角色', () => {
      expect(DYNAMIC_DESIGN_PRESETS.phase13).toContain('logo-design');
      expect(DYNAMIC_DESIGN_PRESETS.phase13).toContain('icon-design');
      expect(DYNAMIC_DESIGN_PRESETS.phase13).toContain('promo-poster');
    });
  });

  describe('isPresetSupported', () => {
    it('应该返回 true 对于支持的角色', () => {
      expect(isPresetSupported('logo-design')).toBe(true);
      expect(isPresetSupported('icon-design')).toBe(true);
      expect(isPresetSupported('promo-poster')).toBe(true);
      expect(isPresetSupported('social-media-graphic')).toBe(true);
    });

    it('应该返回 false 对于不支持的角色', () => {
      expect(isPresetSupported('ip-character')).toBe(false);
      expect(isPresetSupported('packaging-design')).toBe(false);
      expect(isPresetSupported('commercial-illustration')).toBe(false);
      expect(isPresetSupported('nonexistent')).toBe(false);
    });
  });

  describe('getSupportedPresets', () => {
    it('应该返回所有支持的角色列表', () => {
      const presets = getSupportedPresets();
      expect(Array.isArray(presets)).toBe(true);
      expect(presets.length).toBe(9);
      expect(presets).toContain('logo-design');
      expect(presets).toContain('book-cover');
    });
  });

  // ==================== 系统提示词 ====================
  describe('buildSystemPrompt', () => {
    it('应该包含核心指令', () => {
      const prompt = buildSystemPrompt('logo-design');
      expect(prompt).toContain('动态设计代码生成器');
      expect(prompt).toContain('HTML');
      expect(prompt).toContain('CSS');
      expect(prompt).toContain('SVG');
      expect(prompt).toContain('logo-design');
    });

    it('应该包含安全约束', () => {
      const prompt = buildSystemPrompt('promo-poster');
      expect(prompt).toContain('无需任何外部依赖');
      expect(prompt).toContain('<!DOCTYPE html>');
    });
  });

  // ==================== 用户提示词 ====================
  describe('buildUserPrompt', () => {
    it('应该包含所有提供的参数', () => {
      const prompt = buildUserPrompt({
        designType: 'logo-design',
        brandName: 'TechFlow',
        slogan: 'Innovation Starts Here',
        style: '科技感、极简',
        colors: '#6366F1, #06B6D4'
      });
      expect(prompt).toContain('Logo 设计');
      expect(prompt).toContain('TechFlow');
      expect(prompt).toContain('Innovation Starts Here');
      expect(prompt).toContain('科技感');
      expect(prompt).toContain('#6366F1');
    });

    it('应该跳过空参数', () => {
      const prompt = buildUserPrompt({
        designType: 'icon-design',
        brandName: 'MyIcon'
      });
      expect(prompt).toContain('图标设计');
      expect(prompt).toContain('MyIcon');
      expect(prompt).not.toContain('标语');
      expect(prompt).not.toContain('颜色方案');
    });

    it('应该正确处理动画配置', () => {
      const prompt = buildUserPrompt({
        designType: 'logo-design',
        brandName: 'Test',
        animation: {
          effects: ['fadeIn', 'glow'],
          duration: '2s',
          easing: 'ease-in-out',
          loop: 'infinite'
        }
      });
      expect(prompt).toContain('渐显(Fade In)');
      expect(prompt).toContain('发光(Glow)');
      expect(prompt).toContain('2s');
      expect(prompt).toContain('ease-in-out');
      expect(prompt).toContain('无限循环');
    });

    it('应该包含设计助手提示词（下游模式）', () => {
      const prompt = buildUserPrompt({
        designType: 'logo-design',
        brandName: 'Test',
        designPrompt: 'A modern tech logo with gradient effects'
      });
      expect(prompt).toContain('设计助手提示词参考');
      expect(prompt).toContain('modern tech logo');
    });

    it('应该处理空动画配置', () => {
      const prompt = buildUserPrompt({
        designType: 'logo-design',
        brandName: 'Test',
        animation: {}
      });
      expect(prompt).not.toContain('动画要求');
    });
  });

  // ==================== HTML 代码提取 ====================
  describe('extractHtmlCode', () => {
    it('应该提取 ```html 代码块', () => {
      const response = '这是一些说明\n```html\n<!DOCTYPE html>\n<html><body>Test</body></html>\n```\n更多说明';
      const code = extractHtmlCode(response);
      expect(code).toContain('<!DOCTYPE html>');
      expect(code).toContain('Test');
    });

    it('应该提取 ``` 代码块中的 HTML', () => {
      const response = '```\n<!DOCTYPE html>\n<html><body>Test</body></html>\n```';
      const code = extractHtmlCode(response);
      expect(code).toContain('<!DOCTYPE html>');
    });

    it('应该直接提取 <!DOCTYPE html> 内容', () => {
      const response = '<!DOCTYPE html>\n<html lang="zh">\n<head></head>\n<body>Direct</body>\n</html>';
      const code = extractHtmlCode(response);
      expect(code).toContain('Direct');
    });

    it('应该将独立 SVG 包装为 HTML', () => {
      const response = '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/></svg>';
      const code = extractHtmlCode(response);
      expect(code).toContain('<!DOCTYPE html>');
      expect(code).toContain('<svg');
      expect(code).toContain('circle');
    });

    it('应该返回 null 对于无效响应', () => {
      expect(extractHtmlCode(null)).toBeNull();
      expect(extractHtmlCode('')).toBeNull();
      expect(extractHtmlCode('This is just text')).toBeNull();
    });
  });

  // ==================== 安全检查 ====================
  describe('checkCodeSafety', () => {
    it('安全代码应该通过检查', () => {
      const safeCode = `
        <!DOCTYPE html>
        <html><head><style>
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .logo { animation: fadeIn 2s ease-in-out; }
        </style></head>
        <body><div class="logo">Hello</div></body></html>
      `;
      const result = checkCodeSafety(safeCode);
      expect(result.safe).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('应该检测 fetch 请求', () => {
      const code = '<script>fetch("http://evil.com")</script>';
      const result = checkCodeSafety(code);
      expect(result.safe).toBe(false);
      expect(result.warnings).toContain('检测到 fetch 请求');
    });

    it('应该检测 eval 调用', () => {
      const code = '<script>eval("alert(1)")</script>';
      const result = checkCodeSafety(code);
      expect(result.safe).toBe(false);
      expect(result.warnings).toContain('检测到 eval 调用');
    });

    it('应该检测 cookie 访问', () => {
      const code = '<script>document.cookie</script>';
      const result = checkCodeSafety(code);
      expect(result.safe).toBe(false);
      expect(result.warnings).toContain('检测到 cookie 访问');
    });

    it('应该检测外部资源引用', () => {
      const code = '<script src="https://evil.com/script.js"></script>';
      const result = checkCodeSafety(code);
      expect(result.safe).toBe(false);
      expect(result.warnings).toContain('检测到外部资源引用');
    });

    it('应该检测嵌套 iframe', () => {
      const code = '<iframe src="http://evil.com"></iframe>';
      const result = checkCodeSafety(code);
      expect(result.safe).toBe(false);
      expect(result.warnings).toContain('检测到嵌套 iframe');
    });

    it('应该能检测多个安全问题', () => {
      const code = '<script>fetch("http://a.com"); eval("x"); localStorage.setItem("k","v")</script>';
      const result = checkCodeSafety(code);
      expect(result.safe).toBe(false);
      expect(result.warnings.length).toBeGreaterThanOrEqual(3);
    });
  });
});
