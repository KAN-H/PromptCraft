const PromptGenerator = require('../generator');

describe('PromptGenerator - Structured Image Generation', () => {
  let generator;

  beforeEach(() => {
    generator = new PromptGenerator();
  });

  test('应该生成结构化图片提示词', () => {
    const input = {
      subject: '美丽的女孩',
      style: 'professional'
    };

    const result = generator.generate(input);
    
    expect(result).toHaveProperty('subject', '美丽的女孩');
    expect(result).toHaveProperty('style', 'professional');
    expect(result).toHaveProperty('composition');
    expect(result).toHaveProperty('cameraAngle');
    expect(result).toHaveProperty('lighting');
    expect(result).toHaveProperty('promptText');
    expect(typeof result.promptText).toBe('string');
    expect(result.promptText.length).toBeGreaterThan(0);
  });

  test('应该自动填充缺失字段', () => {
    const input = {
      subject: '猫咪'
    };

    const result = generator.generate(input);
    
    expect(result).toHaveProperty('style');
    expect(result).toHaveProperty('composition');
    expect(result).toHaveProperty('cameraAngle');
    expect(result).toHaveProperty('lighting');
    expect(result).toHaveProperty('colorScheme');
    expect(result).toHaveProperty('details');
    expect(result).toHaveProperty('promptText');
  });

  test('应该使用模板生成提示词', () => {
    const input = {
      subject: '风景',
      style: 'artistic'
    };

    const result = generator.generateFromTemplate(input, 'landscape-nature');
    
    expect(result).toHaveProperty('templateUsed', 'landscape-nature');
    expect(result).toHaveProperty('promptText');
    expect(result.promptText).toContain('landscape');
  });

  test('传统输入应该使用原有逻辑', () => {
    const input = '测试输入';
    
    const result = generator.generate(input);
    
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('style');
    expect(result[0]).toHaveProperty('prompt');
  });

  test('应该正确格式化数组字段', () => {
    const input = {
      subject: '建筑',
      composition: ['rule of thirds', 'symmetrical'],
      lighting: ['natural lighting', 'golden hour'],
      colorScheme: ['warm palette', 'high contrast']
    };

    const result = generator.generate(input);
    
    expect(result.promptText).toContain('rule of thirds, symmetrical');
    expect(result.promptText).toContain('natural lighting, golden hour');
    expect(result.promptText).toContain('warm palette, high contrast');
  });
});