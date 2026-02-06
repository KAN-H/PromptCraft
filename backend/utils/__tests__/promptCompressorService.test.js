/**
 * PromptCompressorService 单元测试
 */

const { 
  PromptCompressorService, 
  promptCompressor, 
  CompressionLevel,
  TokenLimits 
} = require('../../services/promptCompressorService');

describe('PromptCompressorService', () => {
  let compressor;

  beforeEach(() => {
    compressor = new PromptCompressorService();
  });

  describe('estimateTokens', () => {
    test('应该正确估算纯中文文本', () => {
      const text = '这是一段测试文本，用于估算token数量。';
      const tokens = compressor.estimateTokens(text);
      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBeLessThan(50);
    });

    test('应该正确估算纯英文文本', () => {
      const text = 'This is a test text for token estimation.';
      const tokens = compressor.estimateTokens(text);
      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBeLessThan(20);
    });

    test('应该正确估算混合文本', () => {
      const text = '这是mixed混合文本test，包含中英文。';
      const tokens = compressor.estimateTokens(text);
      expect(tokens).toBeGreaterThan(0);
    });

    test('应该返回0对于空文本', () => {
      expect(compressor.estimateTokens('')).toBe(0);
      expect(compressor.estimateTokens(null)).toBe(0);
      expect(compressor.estimateTokens(undefined)).toBe(0);
    });
  });

  describe('getTokenLimit', () => {
    test('应该返回正确的 token 限制', () => {
      expect(compressor.getTokenLimit(CompressionLevel.FULL)).toBe(Infinity);
      expect(compressor.getTokenLimit(CompressionLevel.LITE)).toBe(4096);
      expect(compressor.getTokenLimit(CompressionLevel.ULTRA)).toBe(1500);
    });
  });

  describe('compressSkillContext', () => {
    const sampleSkillContext = `
---
## 💡 已激活的专业 Skills

## 🎯 Skill: Logo 评审专家

你是一位拥有 20 年经验的资深 Logo 设计评审专家。

## 📋 评审框架

### 1. 视觉识别度评估

- **独特性**: Logo 是否具有足够的辨识度？
- **简洁性**: 设计是否简洁有力？

### 示例

\`\`\`
评分: 85/100
\`\`\`

### 注意事项

- 保持客观专业

---
`;

    test('完整模式应该返回原始内容', () => {
      const result = compressor.compressSkillContext(sampleSkillContext, CompressionLevel.FULL);
      expect(result).toBe(sampleSkillContext);
    });

    test('精简模式应该移除示例和注意事项', () => {
      const result = compressor.compressSkillContext(sampleSkillContext, CompressionLevel.LITE);
      expect(result).not.toContain('示例');
      expect(result).not.toContain('注意事项');
      expect(result).toContain('Logo 评审专家');
      expect(result.length).toBeLessThan(sampleSkillContext.length);
    });

    test('超轻量模式应该只保留核心描述', () => {
      const result = compressor.compressSkillContext(sampleSkillContext, CompressionLevel.ULTRA);
      expect(result).toContain('已激活专业技能');
      expect(result).toContain('Logo 评审专家');
      expect(result.length).toBeLessThan(sampleSkillContext.length * 0.5);
    });

    test('应该处理空输入', () => {
      expect(compressor.compressSkillContext('', CompressionLevel.LITE)).toBe('');
      expect(compressor.compressSkillContext(null, CompressionLevel.LITE)).toBe(null);
    });
  });

  describe('compressSystemPrompt', () => {
    const sampleSystemPrompt = `你是一位经验丰富的AI图像生成专家，精通 Midjourney、DALL-E、Stable Diffusion 等主流AI绘图工具。

【设计风格倾向】
- MINIMALIST: 采用极简主义设计理念，注重负空间运用，使用简洁的几何形状和有限的色彩，强调功能性与美感的平衡
- MODERN: 运用当代设计趋势，大胆的色彩搭配

【行业特性考量】
- FOOD: 注重食欲感表达，使用暖色调

【示例参考】
Logo design: "Minimalist BBQ restaurant logo..."
Poster: "Promotional poster..."`;

    test('完整模式应该返回原始内容', () => {
      const result = compressor.compressSystemPrompt(sampleSystemPrompt, CompressionLevel.FULL);
      expect(result).toBe(sampleSystemPrompt);
    });

    test('精简模式应该移除示例', () => {
      const result = compressor.compressSystemPrompt(sampleSystemPrompt, CompressionLevel.LITE);
      expect(result).not.toContain('示例参考');
    });

    test('超轻量模式应该生成极简提示', () => {
      const result = compressor.compressSystemPrompt(sampleSystemPrompt, CompressionLevel.ULTRA);
      expect(result).toContain('AI图像生成专家');
      expect(result).toContain('输出要求');
      expect(result.length).toBeLessThan(500);
    });

    test('应该保留用户必须包含的信息', () => {
      const userMustInclude = [
        { label: '品牌名称', value: 'TestBrand' },
        { label: '主色调', value: '红色' }
      ];
      
      const result = compressor.compressSystemPrompt(
        sampleSystemPrompt, 
        CompressionLevel.ULTRA, 
        userMustInclude
      );
      
      expect(result).toContain('必须包含');
      expect(result).toContain('品牌名称');
      expect(result).toContain('TestBrand');
    });
  });

  describe('compressStructuredPrompt', () => {
    const sampleStructuredPrompt = `【角色定位】
你是一位资深Logo设计师，拥有超过15年的品牌视觉设计经验，曾服务于众多世界500强企业。

【专业背景】
拥有丰富的品牌设计经验，熟悉各种设计风格和设计理论。对色彩搭配、字体选择、图形构成等方面都有深入的研究。曾获得多项国际设计大奖，在设计行业享有很高的声誉。

【设计任务】
为用户设计一个专业的Logo，需要结合品牌定位和目标受众的喜好。

【设计要求】
- 简洁大方，符合现代审美
- 易于识别，具有较高的辨识度
- 具有良好的扩展性
- 适应多种场景使用

【推荐关键词】
现代、简约、专业、高端、品牌、视觉、创意

【输出格式】
请按照规定的JSON格式输出设计方案。`;

    test('完整模式应该返回原始内容', () => {
      const result = compressor.compressStructuredPrompt(sampleStructuredPrompt, CompressionLevel.FULL);
      expect(result).toBe(sampleStructuredPrompt);
    });

    test('精简模式应该移除冗余内容', () => {
      const result = compressor.compressStructuredPrompt(sampleStructuredPrompt, CompressionLevel.LITE);
      // 精简模式应该移除 推荐关键词、输出格式 段落，并截断专业背景
      expect(result.length).toBeLessThan(sampleStructuredPrompt.length);
      expect(result).not.toContain('推荐关键词');
      expect(result).not.toContain('输出格式');
      // 应该保留核心段落
      expect(result).toContain('角色定位');
      expect(result).toContain('设计任务');
    });

    test('超轻量模式应该只保留核心段落', () => {
      const result = compressor.compressStructuredPrompt(sampleStructuredPrompt, CompressionLevel.ULTRA);
      expect(result).toContain('设计任务');
      expect(result.length).toBeLessThan(sampleStructuredPrompt.length);
    });
  });

  describe('compress (完整压缩流程)', () => {
    test('应该返回完整的压缩结果', () => {
      const params = {
        systemPrompt: '系统提示词内容，包含一些指导信息。',
        structuredPrompt: '【任务】生成Logo设计提示词。',
        skillsContext: '## 🎯 Skill: 设计专家\n专业设计知识。',
        level: CompressionLevel.LITE,
        userMustInclude: []
      };

      const result = compressor.compress(params);

      expect(result).toHaveProperty('systemPrompt');
      expect(result).toHaveProperty('structuredPrompt');
      expect(result).toHaveProperty('skillsContext');
      expect(result).toHaveProperty('stats');
      expect(result.stats).toHaveProperty('originalTokens');
      expect(result.stats).toHaveProperty('compressedTokens');
      expect(result.stats).toHaveProperty('savedTokens');
      expect(result.stats).toHaveProperty('ratio');
    });

    test('压缩后的 token 数应该减少', () => {
      const longContent = '这是一段很长的内容。'.repeat(100);
      const params = {
        systemPrompt: longContent,
        structuredPrompt: longContent,
        skillsContext: '## 🎯 Skill: Test\n' + longContent,
        level: CompressionLevel.ULTRA,
        userMustInclude: []
      };

      const result = compressor.compress(params);

      expect(result.stats.compressedTokens).toBeLessThan(result.stats.originalTokens);
      expect(result.stats.savedTokens).toBeGreaterThan(0);
      expect(result.stats.ratio).toBeGreaterThan(0);
    });
  });

  describe('recommendCompressionLevel', () => {
    test('低 token 应该推荐完整模式', () => {
      const level = compressor.recommendCompressionLevel(1000, 2048);
      expect(level).toBe(CompressionLevel.FULL);
    });

    test('中等 token 应该推荐精简模式', () => {
      const level = compressor.recommendCompressionLevel(2500, 2048);
      expect(level).toBe(CompressionLevel.LITE);
    });

    test('高 token 应该推荐超轻量模式', () => {
      const level = compressor.recommendCompressionLevel(4000, 2048);
      expect(level).toBe(CompressionLevel.ULTRA);
    });
  });

  describe('getLevelInfo', () => {
    test('应该返回正确的等级信息', () => {
      const fullInfo = compressor.getLevelInfo(CompressionLevel.FULL);
      expect(fullInfo.name).toBe('完整模式');
      expect(fullInfo.nameEn).toBe('Full');

      const liteInfo = compressor.getLevelInfo(CompressionLevel.LITE);
      expect(liteInfo.name).toBe('精简模式');
      expect(liteInfo.icon).toBe('📄');

      const ultraInfo = compressor.getLevelInfo(CompressionLevel.ULTRA);
      expect(ultraInfo.name).toBe('超轻量模式');
      expect(ultraInfo.targetTokens).toBe('~1.5K');
    });
  });
});

describe('promptCompressor 单例', () => {
  test('应该是 PromptCompressorService 的实例', () => {
    expect(promptCompressor).toBeInstanceOf(PromptCompressorService);
  });

  test('应该能正常调用方法', () => {
    const tokens = promptCompressor.estimateTokens('测试文本');
    expect(typeof tokens).toBe('number');
  });
});
