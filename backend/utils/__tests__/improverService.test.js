/**
 * ImproverService 单元测试
 */

const { ImproverService, DIMENSIONS, IMPROVEMENT_TIPS } = require('../../services/improverService');

describe('ImproverService', () => {
  let service;

  beforeAll(() => {
    service = new ImproverService();
  });

  describe('analyze()', () => {
    test('应该分析简单提示词', () => {
      const result = service.analyze('写一篇文章');
      
      expect(result).toHaveProperty('originalPrompt', '写一篇文章');
      expect(result).toHaveProperty('stats');
      expect(result).toHaveProperty('scores');
      expect(result).toHaveProperty('totalScore');
      expect(result).toHaveProperty('rating');
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('suggestions');
    });

    test('应该返回正确的统计信息', () => {
      const result = service.analyze('这是一个测试提示词。它包含两个句子。');
      
      expect(result.stats.charCount).toBeGreaterThan(0);
      expect(result.stats.wordCount).toBeGreaterThan(0);
      expect(result.stats.sentenceCount).toBe(2);
    });

    test('应该为高质量提示词给出高分', () => {
      const highQualityPrompt = `作为一名资深的JavaScript开发者，请帮我审查以下代码。

要求：
1. 检查代码风格是否符合ESLint标准
2. 识别潜在的性能问题
3. 提出至少3条改进建议

请以Markdown格式输出，包含问题描述和修复示例。`;

      const result = service.analyze(highQualityPrompt);
      
      expect(result.totalScore).toBeGreaterThan(60);
      expect(result.scores.structure).toBeGreaterThan(50);
    });

    test('应该为低质量提示词给出低分', () => {
      const lowQualityPrompt = '帮我写点东西';
      
      const result = service.analyze(lowQualityPrompt);
      
      expect(result.totalScore).toBeLessThan(60);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    test('空提示词应该抛出错误', () => {
      expect(() => service.analyze('')).toThrow('提示词不能为空');
      expect(() => service.analyze('   ')).toThrow('提示词不能为空');
      expect(() => service.analyze(null)).toThrow('提示词不能为空');
    });

    test('应该返回所有评分维度', () => {
      const result = service.analyze('测试提示词');
      
      expect(result.scores).toHaveProperty('clarity');
      expect(result.scores).toHaveProperty('specificity');
      expect(result.scores).toHaveProperty('structure');
      expect(result.scores).toHaveProperty('context');
      expect(result.scores).toHaveProperty('constraints');
      expect(result.scores).toHaveProperty('outputFormat');
    });

    test('应该正确识别有角色设定的提示词', () => {
      const withRole = service.analyze('你是一名专业翻译，请翻译这段话');
      const withoutRole = service.analyze('请翻译这段话');
      
      expect(withRole.scores.context).toBeGreaterThan(withoutRole.scores.context);
    });

    test('应该正确识别有约束条件的提示词', () => {
      const withConstraints = service.analyze('写一篇文章，不要超过500字，必须包含3个例子');
      const withoutConstraints = service.analyze('写一篇文章');
      
      expect(withConstraints.scores.constraints).toBeGreaterThan(withoutConstraints.scores.constraints);
    });

    test('应该正确识别有输出格式的提示词', () => {
      const withFormat = service.analyze('以JSON格式返回结果');
      const withoutFormat = service.analyze('返回结果');
      
      expect(withFormat.scores.outputFormat).toBeGreaterThan(withoutFormat.scores.outputFormat);
    });

    test('应该返回正确的评级', () => {
      const result = service.analyze('测试');
      
      expect(result.rating).toHaveProperty('level');
      expect(result.rating).toHaveProperty('label');
      expect(result.rating).toHaveProperty('color');
      expect(['A', 'B', 'C', 'D', 'F']).toContain(result.rating.level);
    });
  });

  describe('improve()', () => {
    test('应该返回改进结果', () => {
      const result = service.improve('写一篇文章');
      
      expect(result).toHaveProperty('original', '写一篇文章');
      expect(result).toHaveProperty('improved');
      expect(result).toHaveProperty('analysis');
      expect(result).toHaveProperty('changes');
      expect(result).toHaveProperty('improvement');
    });

    test('应该改进低分提示词', () => {
      const result = service.improve('帮我做点事情');
      
      expect(result.improved.length).toBeGreaterThan(result.original.length);
      expect(result.changes.length).toBeGreaterThan(0);
    });

    test('改进后的预估分数应该更高', () => {
      const result = service.improve('帮我写代码');
      
      expect(result.improvement.afterScore).toBeGreaterThanOrEqual(result.improvement.beforeScore);
    });

    test('应该添加角色设定（如果缺失）', () => {
      const result = service.improve('翻译这段话');
      
      const hasRoleChange = result.changes.some(c => c.type === 'addRole');
      if (hasRoleChange) {
        expect(result.improved).toMatch(/作为|你是/);
      }
    });

    test('应该保留原始内容', () => {
      const original = '请分析这段数据';
      const result = service.improve(original);
      
      expect(result.improved).toContain('分析');
      expect(result.improved).toContain('数据');
    });
  });

  describe('getTips()', () => {
    test('应该返回所有改进技巧', () => {
      const tips = service.getTips();
      
      expect(Array.isArray(tips)).toBe(true);
      expect(tips.length).toBe(6);
      tips.forEach(t => {
        expect(t).toHaveProperty('dimension');
        expect(t).toHaveProperty('name');
        expect(t).toHaveProperty('tips');
        expect(Array.isArray(t.tips)).toBe(true);
      });
    });

    test('应该返回指定维度的技巧', () => {
      const tip = service.getTips('clarity');
      
      expect(tip.dimension).toBe('clarity');
      expect(tip.name).toBe('清晰度');
      expect(Array.isArray(tip.tips)).toBe(true);
      expect(tip.tips.length).toBeGreaterThan(0);
    });

    test('无效维度应该返回所有技巧', () => {
      const tips = service.getTips('invalid');
      
      expect(Array.isArray(tips)).toBe(true);
    });
  });

  describe('getDimensions()', () => {
    test('应该返回所有评分维度', () => {
      const dimensions = service.getDimensions();
      
      expect(Array.isArray(dimensions)).toBe(true);
      expect(dimensions.length).toBe(6);
      
      const ids = dimensions.map(d => d.id);
      expect(ids).toContain('clarity');
      expect(ids).toContain('specificity');
      expect(ids).toContain('structure');
      expect(ids).toContain('context');
      expect(ids).toContain('constraints');
      expect(ids).toContain('outputFormat');
    });

    test('每个维度应该有完整信息', () => {
      const dimensions = service.getDimensions();
      
      dimensions.forEach(d => {
        expect(d).toHaveProperty('id');
        expect(d).toHaveProperty('name');
        expect(d).toHaveProperty('nameEn');
        expect(d).toHaveProperty('description');
        expect(d).toHaveProperty('weight');
        expect(typeof d.weight).toBe('number');
      });
    });

    test('所有权重之和应该为1', () => {
      const dimensions = service.getDimensions();
      const totalWeight = dimensions.reduce((sum, d) => sum + d.weight, 0);
      
      expect(totalWeight).toBeCloseTo(1, 2);
    });
  });

  describe('分数计算测试', () => {
    test('分数应该在0-100范围内', () => {
      const prompts = [
        '测试',
        '写一篇关于人工智能的文章，要求字数在1000字左右',
        '你是一名专家。请帮我分析数据。',
        '请按照以下格式输出：1. 标题 2. 内容 3. 总结',
      ];

      prompts.forEach(prompt => {
        const result = service.analyze(prompt);
        
        Object.values(result.scores).forEach(score => {
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(100);
        });
        
        expect(result.totalScore).toBeGreaterThanOrEqual(0);
        expect(result.totalScore).toBeLessThanOrEqual(100);
      });
    });

    test('有列表的提示词结构分数应该更高', () => {
      const withList = service.analyze('请完成以下任务：\n1. 分析数据\n2. 生成报告\n3. 提出建议');
      const withoutList = service.analyze('请完成分析数据、生成报告、提出建议这些任务');
      
      expect(withList.scores.structure).toBeGreaterThanOrEqual(withoutList.scores.structure);
    });

    test('有示例的提示词具体性分数应该更高', () => {
      const withExample = service.analyze('请翻译，例如：Hello -> 你好');
      const withoutExample = service.analyze('请翻译');
      
      expect(withExample.scores.specificity).toBeGreaterThan(withoutExample.scores.specificity);
    });
  });

  describe('问题检测测试', () => {
    test('应该检测到过短的提示词', () => {
      const result = service.analyze('帮');
      
      const hasShortIssue = result.issues.some(i => 
        i.message.includes('过于简短') || i.message.includes('简短')
      );
      expect(hasShortIssue).toBe(true);
    });

    test('应该检测到模糊词汇', () => {
      const result = service.analyze('请给我一些好的建议，要合适的内容');
      
      const hasVagueIssue = result.issues.some(i => 
        i.message.includes('模糊')
      );
      expect(hasVagueIssue).toBe(true);
    });

    test('应该检测到缺少约束', () => {
      const result = service.analyze('写一篇文章');
      
      const hasConstraintIssue = result.issues.some(i => 
        i.dimension === 'constraints'
      );
      expect(hasConstraintIssue).toBe(true);
    });
  });

  describe('建议生成测试', () => {
    test('应该为低分维度生成建议', () => {
      const result = service.analyze('测试');
      
      expect(result.suggestions.length).toBeGreaterThan(0);
      result.suggestions.forEach(s => {
        expect(s).toHaveProperty('dimension');
        expect(s).toHaveProperty('suggestion');
        expect(s).toHaveProperty('priority');
      });
    });

    test('建议应该关联最低分的维度', () => {
      const result = service.analyze('测试');
      
      // 找到最低分维度
      const lowestDimension = Object.entries(result.scores)
        .sort((a, b) => a[1] - b[1])[0][0];
      
      // 建议应该包含这个维度
      const hasSuggestionForLowest = result.suggestions.some(s => 
        s.dimension === lowestDimension
      );
      expect(hasSuggestionForLowest).toBe(true);
    });
  });

  describe('DIMENSIONS 常量', () => {
    test('应该导出 DIMENSIONS', () => {
      expect(DIMENSIONS).toBeDefined();
      expect(Object.keys(DIMENSIONS).length).toBe(6);
    });
  });

  describe('IMPROVEMENT_TIPS 常量', () => {
    test('应该导出 IMPROVEMENT_TIPS', () => {
      expect(IMPROVEMENT_TIPS).toBeDefined();
      expect(Object.keys(IMPROVEMENT_TIPS).length).toBe(6);
    });

    test('每个维度应该有多条技巧', () => {
      Object.values(IMPROVEMENT_TIPS).forEach(tips => {
        expect(Array.isArray(tips)).toBe(true);
        expect(tips.length).toBeGreaterThan(0);
      });
    });
  });
});
