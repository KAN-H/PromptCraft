// @jest-environment node
/**
 * @file generator.test.js
 * @description 针对 PromptGenerator 的标准化提示词生成逻辑进行单元测试，覆盖全部分支与动态模块注册场景。
 */

const PromptGenerator = require('../generator');

describe('PromptGenerator', () => {
  /** @type {PromptGenerator} */
  let generator;

  beforeEach(() => {
    generator = new PromptGenerator();
  });

  afterEach(() => {
    generator = null;
  });

  describe('标准提示词生成', () => {
    it('应生成包含主体、修饰、风格、负向提示的完整提示词', () => {
      const input = {
        subject: '猫',
        modifier: '可爱',
        style: '水彩',
        negative: '模糊, 低质量'
      };
      const result = generator.generate(input);
      expect(result).toBe('猫, 可爱, 水彩, 模糊, 低质量');
    });

    it('缺少部分要素时应正确生成提示词', () => {
      const input = {
        subject: '狗',
        style: '油画'
        // 无 modifier, negative
      };
      const result = generator.generate(input);
      expect(result).toBe('狗, 油画');
    });

    it('仅有负向提示时应只输出负向内容', () => {
      const input = {
        negative: '杂色'
      };
      const result = generator.generate(input);
      expect(result).toBe('杂色');
    });

    it('全部为空时应输出空字符串', () => {
      const input = {};
      const result = generator.generate(input);
      expect(result).toBe('');
    });
  });

  describe('标准化输出规则', () => {
    it('应以逗号分隔各要素，且顺序为 priority 从小到大', () => {
      const input = {
        subject: 'A',
        modifier: 'B',
        style: 'C'
      };
      const result = generator.generate(input);
      expect(result).toBe('A, B, C');
    });

    it('有正向和负向提示时，负向提示应紧随正向提示后并用逗号分隔', () => {
      const input = {
        subject: 'A',
        negative: '不良'
      };
      const result = generator.generate(input);
      expect(result).toBe('A, 不良');
    });
  });

  describe('动态注册模块', () => {
    /**
     * @description 测试动态注册新模块后，生成逻辑与顺序是否正确
     */
    it('注册新模块后应按 priority 插入并参与生成', () => {
      generator.registerModule({
        key: 'custom',
        getValue: (input) => input.custom || '',
        priority: 2.5
      });
      const input = {
        subject: '人像',
        modifier: '优雅',
        custom: '夜景',
        style: '写实'
      };
      // priority: subject(1), modifier(2), custom(2.5), style(3)
      const result = generator.generate(input);
      expect(result).toBe('人像, 优雅, 夜景, 写实');
    });

    it('注册无效模块（无key或getValue）不会影响生成', () => {
      generator.registerModule({ key: '', getValue: null });
      const input = { subject: 'A' };
      const result = generator.generate(input);
      expect(result).toBe('A');
    });
  });

  describe('边界与异常处理', () => {
    it('模块 getValue 返回非字符串时应被忽略', () => {
      generator.registerModule({
        key: 'bad',
        getValue: () => 123,
        priority: 2
      });
      const input = { subject: 'A', bad: 'B' };
      const result = generator.generate(input);
      expect(result).toBe('A');
    });

    it('注册模块未指定 priority 时默认排在最后', () => {
      generator.registerModule({
        key: 'tail',
        getValue: (input) => input.tail || ''
        // 无 priority
      });
      const input = { subject: 'A', tail: 'Z' };
      const result = generator.generate(input);
      expect(result).toBe('A, Z');
    });
  });
});