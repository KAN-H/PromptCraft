/**
 * intentService 单元测试
 */

const { classifyIntent, ruleBasedClassify, INTENTS } = require('../../services/intentService');

describe('INTENTS 常量', () => {
  test('应该包含所有预期的意图类型', () => {
    expect(INTENTS.GENERATION).toBe('generation');
    expect(INTENTS.IMPROVEMENT).toBe('improvement');
    expect(INTENTS.ANALYSIS).toBe('analysis');
    expect(INTENTS.TRANSLATION).toBe('translation');
    expect(INTENTS.CODING).toBe('coding');
    expect(INTENTS.CREATIVE).toBe('creative');
    expect(INTENTS.DESIGN).toBe('design');
    expect(INTENTS.OTHER).toBe('other');
  });
});

describe('ruleBasedClassify()', () => {
  test('应该识别改进意图', () => {
    const result = ruleBasedClassify('帮我优化这个提示词');
    expect(result.intent).toBe(INTENTS.IMPROVEMENT);
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  test('应该识别翻译意图', () => {
    const result = ruleBasedClassify('请翻译这段文字');
    expect(result.intent).toBe(INTENTS.TRANSLATION);
  });

  test('应该识别代码意图', () => {
    const result = ruleBasedClassify('帮我写一段 Python 代码');
    expect(result.intent).toBe(INTENTS.CODING);
  });

  test('应该识别分析意图', () => {
    const result = ruleBasedClassify('分析这篇文章的主题');
    expect(result.intent).toBe(INTENTS.ANALYSIS);
  });

  test('应该识别创意写作意图', () => {
    const result = ruleBasedClassify('写一个有创意的故事');
    expect(result.intent).toBe(INTENTS.CREATIVE);
  });

  test('应该识别设计意图', () => {
    const result = ruleBasedClassify('设计一张海报的视觉方案');
    expect(result.intent).toBe(INTENTS.DESIGN);
  });

  test('应该识别生成意图', () => {
    const result = ruleBasedClassify('生成一个产品描述');
    expect(result.intent).toBe(INTENTS.GENERATION);
  });

  test('无明显关键词时应该返回 other 意图', () => {
    const result = ruleBasedClassify('你好');
    expect(result.intent).toBe(INTENTS.OTHER);
    expect(result.confidence).toBeLessThanOrEqual(0.5);
  });

  test('返回值应该包含 intent 和 confidence 字段', () => {
    const result = ruleBasedClassify('帮我写代码');
    expect(result).toHaveProperty('intent');
    expect(result).toHaveProperty('confidence');
    expect(typeof result.confidence).toBe('number');
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });
});

describe('classifyIntent()', () => {
  test('应该通过规则层识别意图（无本地模型）', async () => {
    const result = await classifyIntent('优化这个提示词的结构');
    expect(result.intent).toBe(INTENTS.IMPROVEMENT);
    expect(result.method).toBe('rule-based');
  });

  test('本地模型不可用时应该降级到规则层', async () => {
    const result = await classifyIntent('写一段代码', {
      intentBaseUrl: 'http://localhost:99999'
    });
    expect(result.method).toBe('rule-based');
    expect(result.intent).toBe(INTENTS.CODING);
  });

  test('返回值应该包含 intent、confidence、method 字段', async () => {
    const result = await classifyIntent('帮我翻译');
    expect(result).toHaveProperty('intent');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('method');
  });

  test('空字符串应该返回默认意图', async () => {
    const result = await classifyIntent('  ');
    expect(Object.values(INTENTS)).toContain(result.intent);
  });
});
