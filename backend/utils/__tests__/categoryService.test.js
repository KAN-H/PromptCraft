/**
 * CategoryService 单元测试
 */

const path = require('path');
const { CategoryService } = require('../../services/categoryService');

describe('CategoryService', () => {
  let service;

  beforeAll(() => {
    const categoriesPath = path.join(__dirname, '../../../data/categories.json');
    service = new CategoryService(categoriesPath);
  });

  describe('getCategories()', () => {
    test('应该返回所有顶级分类', () => {
      const categories = service.getCategories();
      
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
      expect(categories[0]).toHaveProperty('id');
      expect(categories[0]).toHaveProperty('name');
      expect(categories[0]).toHaveProperty('icon');
      expect(categories[0]).toHaveProperty('subcategoryCount');
    });

    test('应该包含预期的分类', () => {
      const categories = service.getCategories();
      const categoryIds = categories.map(c => c.id);
      
      expect(categoryIds).toContain('writing');
      expect(categoryIds).toContain('coding');
      expect(categoryIds).toContain('image');
    });
  });

  describe('getCategory()', () => {
    test('应该返回指定分类的详情', () => {
      const category = service.getCategory('writing');
      
      expect(category).not.toBeNull();
      expect(category.id).toBe('writing');
      expect(category.name).toBe('写作创作');
      expect(Array.isArray(category.subcategories)).toBe(true);
    });

    test('不存在的分类应该返回 null', () => {
      const category = service.getCategory('nonexistent');
      expect(category).toBeNull();
    });
  });

  describe('getSubcategories()', () => {
    test('应该返回指定分类的所有子分类', () => {
      const subcategories = service.getSubcategories('writing');
      
      expect(Array.isArray(subcategories)).toBe(true);
      expect(subcategories.length).toBeGreaterThan(0);
      expect(subcategories[0]).toHaveProperty('id');
      expect(subcategories[0]).toHaveProperty('name');
      expect(subcategories[0]).toHaveProperty('tags');
    });

    test('不存在的分类应该返回空数组', () => {
      const subcategories = service.getSubcategories('nonexistent');
      expect(subcategories).toEqual([]);
    });
  });

  describe('getSubcategory()', () => {
    test('应该返回指定子分类的详情', () => {
      const subcategory = service.getSubcategory('writing', 'copywriting');
      
      expect(subcategory).not.toBeNull();
      expect(subcategory.id).toBe('copywriting');
      expect(subcategory.name).toBe('文案写作');
    });

    test('不存在的子分类应该返回 null', () => {
      const subcategory = service.getSubcategory('writing', 'nonexistent');
      expect(subcategory).toBeNull();
    });
  });

  describe('getTechniques()', () => {
    test('应该返回所有提示词技术', () => {
      const techniques = service.getTechniques();
      
      expect(Array.isArray(techniques)).toBe(true);
      expect(techniques.length).toBeGreaterThan(0);
      expect(techniques[0]).toHaveProperty('id');
      expect(techniques[0]).toHaveProperty('name');
      expect(techniques[0]).toHaveProperty('nameEn');
    });

    test('应该包含常用技术', () => {
      const techniques = service.getTechniques();
      const techIds = techniques.map(t => t.id);
      
      expect(techIds).toContain('zero-shot');
      expect(techIds).toContain('few-shot');
      expect(techIds).toContain('cot');
    });
  });

  describe('getTechnique()', () => {
    test('应该返回指定技术的详情', () => {
      const technique = service.getTechnique('cot');
      
      expect(technique).not.toBeNull();
      expect(technique.id).toBe('cot');
      expect(technique.name).toBe('思维链');
      expect(technique.nameEn).toBe('Chain-of-Thought (CoT)');
    });

    test('不存在的技术应该返回 null', () => {
      const technique = service.getTechnique('nonexistent');
      expect(technique).toBeNull();
    });
  });

  describe('getAllTags()', () => {
    test('应该返回所有标签', () => {
      const tags = service.getAllTags();
      
      expect(Array.isArray(tags)).toBe(true);
      expect(tags.length).toBeGreaterThan(0);
    });
  });

  describe('getTagsByCategory()', () => {
    test('应该返回指定分类的所有标签', () => {
      const tags = service.getTagsByCategory('writing');
      
      expect(Array.isArray(tags)).toBe(true);
      expect(tags.length).toBeGreaterThan(0);
      expect(tags).toContain('营销');
    });

    test('不存在的分类应该返回空数组', () => {
      const tags = service.getTagsByCategory('nonexistent');
      expect(tags).toEqual([]);
    });
  });

  describe('search()', () => {
    test('应该搜索分类', () => {
      const results = service.search('写作');
      
      expect(results.categories.length).toBeGreaterThan(0);
      expect(results.categories[0].name).toContain('写作');
    });

    test('应该搜索子分类', () => {
      const results = service.search('logo');
      
      expect(results.subcategories.length).toBeGreaterThan(0);
    });

    test('应该搜索技术', () => {
      const results = service.search('思维链');
      
      expect(results.techniques.length).toBeGreaterThan(0);
      expect(results.techniques[0].name).toBe('思维链');
    });

    test('应该搜索标签', () => {
      const results = service.search('品牌');
      
      expect(results.tags.length).toBeGreaterThan(0);
    });

    test('应该支持英文搜索', () => {
      const results = service.search('Chain-of-Thought');
      
      expect(results.techniques.length).toBeGreaterThan(0);
    });
  });

  describe('filterByTags()', () => {
    test('应该根据标签筛选子分类', () => {
      const results = service.filterByTags(['品牌', '矢量']);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('matchedTags');
    });

    test('空标签应该返回空数组', () => {
      const results = service.filterByTags([]);
      expect(results).toEqual([]);
    });
  });

  describe('recommend()', () => {
    test('应该根据场景推荐分类', () => {
      const recommendations = service.recommend('我想写一篇营销文案');
      
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0]).toHaveProperty('relevanceScore');
    });

    test('应该按相关性排序', () => {
      const recommendations = service.recommend('代码审查和重构');
      
      expect(recommendations.length).toBeGreaterThan(0);
      // 第一个应该是最相关的
      for (let i = 1; i < recommendations.length; i++) {
        expect(recommendations[i - 1].relevanceScore).toBeGreaterThanOrEqual(
          recommendations[i].relevanceScore
        );
      }
    });
  });

  describe('getTree()', () => {
    test('应该返回分类树结构', () => {
      const tree = service.getTree();
      
      expect(Array.isArray(tree)).toBe(true);
      expect(tree[0]).toHaveProperty('children');
      expect(Array.isArray(tree[0].children)).toBe(true);
    });
  });

  describe('getStats()', () => {
    test('应该返回分类统计', () => {
      const stats = service.getStats();
      
      expect(stats).toHaveProperty('categoryCount');
      expect(stats).toHaveProperty('subcategoryCount');
      expect(stats).toHaveProperty('techniqueCount');
      expect(stats).toHaveProperty('tagCount');
      expect(stats.categoryCount).toBeGreaterThan(0);
    });
  });

  describe('validate()', () => {
    test('应该验证分类数据完整性', () => {
      const validation = service.validate();
      
      expect(validation).toHaveProperty('valid');
      expect(validation).toHaveProperty('issues');
      expect(validation.valid).toBe(true);
    });
  });

  describe('reload()', () => {
    test('应该重新加载分类数据', () => {
      const result = service.reload();
      expect(result).toBe(service); // 应该返回自身以支持链式调用
      
      // 验证数据仍然可用
      const categories = service.getCategories();
      expect(categories.length).toBeGreaterThan(0);
    });
  });
});
