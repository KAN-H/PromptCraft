/**
 * PresetService 单元测试
 */

const path = require('path');
const { PresetService } = require('../../services/presetService');

describe('PresetService', () => {
  let service;

  beforeAll(() => {
    const presetsPath = path.join(__dirname, '../../../data/presets.json');
    service = new PresetService(presetsPath);
  });

  describe('getAll()', () => {
    test('应该返回所有预置模板', () => {
      const presets = service.getAll();
      
      expect(Array.isArray(presets)).toBe(true);
      expect(presets.length).toBeGreaterThan(0);
      expect(presets[0]).toHaveProperty('id');
      expect(presets[0]).toHaveProperty('name');
      expect(presets[0]).toHaveProperty('category');
    });

    test('应该按分类筛选', () => {
      const presets = service.getAll({ category: 'coding' });
      
      expect(presets.length).toBeGreaterThan(0);
      presets.forEach(p => {
        expect(p.category).toBe('coding');
      });
    });

    test('应该按难度筛选', () => {
      const presets = service.getAll({ difficulty: 'beginner' });
      
      expect(presets.length).toBeGreaterThan(0);
      presets.forEach(p => {
        expect(p.difficulty).toBe('beginner');
      });
    });

    test('应该限制返回数量', () => {
      const presets = service.getAll({ limit: 3 });
      
      expect(presets.length).toBeLessThanOrEqual(3);
    });
  });

  describe('getById()', () => {
    test('应该返回指定预置的详情', () => {
      const preset = service.getById('code-review');
      
      expect(preset).not.toBeNull();
      expect(preset.id).toBe('code-review');
      expect(preset.name).toBe('代码审查专家');
      expect(preset.template).toBeDefined();
    });

    test('不存在的预置应该返回 null', () => {
      const preset = service.getById('nonexistent');
      expect(preset).toBeNull();
    });
  });

  describe('search()', () => {
    test('应该搜索名称', () => {
      const results = service.search('翻译');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toContain('翻译');
    });

    test('应该搜索标签', () => {
      const results = service.search('SQL');
      
      expect(results.length).toBeGreaterThan(0);
    });

    test('应该搜索英文名', () => {
      const results = service.search('Code Review');
      
      expect(results.length).toBeGreaterThan(0);
    });

    test('空查询应该返回空数组', () => {
      const results = service.search('');
      expect(results).toEqual([]);
    });
  });

  describe('filterByTags()', () => {
    test('应该根据标签筛选', () => {
      const results = service.filterByTags(['代码', '审查']);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('matchedTags');
    });

    test('空标签应该返回空数组', () => {
      const results = service.filterByTags([]);
      expect(results).toEqual([]);
    });
  });

  describe('getVariables()', () => {
    test('应该返回预置的变量定义', () => {
      const variables = service.getVariables('code-review');
      
      expect(Array.isArray(variables)).toBe(true);
      expect(variables.length).toBeGreaterThan(0);
      expect(variables[0]).toHaveProperty('name');
      expect(variables[0]).toHaveProperty('type');
      expect(variables[0]).toHaveProperty('inputType');
    });

    test('不存在的预置应该返回空数组', () => {
      const variables = service.getVariables('nonexistent');
      expect(variables).toEqual([]);
    });
  });

  describe('validateVariables()', () => {
    test('应该验证必需变量', () => {
      const result = service.validateVariables('code-review', {});
      
      expect(result.valid).toBe(false);
      expect(result.missing.length).toBeGreaterThan(0);
    });

    test('提供所有必需变量应该验证通过', () => {
      const result = service.validateVariables('code-review', {
        code: 'function test() {}'
      });
      
      expect(result.valid).toBe(true);
      expect(result.missing).toEqual([]);
    });
  });

  describe('apply()', () => {
    test('应该应用预置模板生成提示词', () => {
      const result = service.apply('translation-pro', {
        text: '这是一段测试文本'
      });
      
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('presetId', 'translation-pro');
      expect(result).toHaveProperty('presetName');
      expect(result.content.length).toBeGreaterThan(0);
    });

    test('应该支持 JSON 格式输出', () => {
      const result = service.apply('translation-pro', {
        text: 'test'
      }, { format: 'json' });
      
      expect(result.format).toBe('json');
      expect(typeof result.formatted).toBe('string');
    });

    test('不存在的预置应该抛出错误', () => {
      expect(() => {
        service.apply('nonexistent', {});
      }).toThrow('预置模板不存在');
    });
  });

  describe('getStats()', () => {
    test('应该返回统计信息', () => {
      const stats = service.getStats();
      
      expect(stats).toHaveProperty('totalPresets');
      expect(stats).toHaveProperty('categoryCount');
      expect(stats).toHaveProperty('tagCount');
      expect(stats).toHaveProperty('byDifficulty');
      expect(stats.totalPresets).toBeGreaterThan(0);
    });
  });

  describe('getRecommended()', () => {
    test('应该返回推荐预置', () => {
      const recommended = service.getRecommended(5);
      
      expect(Array.isArray(recommended)).toBe(true);
      expect(recommended.length).toBeLessThanOrEqual(5);
    });
  });

  describe('reload()', () => {
    test('应该重新加载数据', () => {
      const result = service.reload();
      expect(result).toBe(service);
      
      const presets = service.getAll();
      expect(presets.length).toBeGreaterThan(0);
    });
  });
});
