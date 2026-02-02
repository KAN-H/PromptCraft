/**
 * CategoryService - 多维度分类体系服务
 * 
 * 提供分类管理、搜索和推荐功能
 */

const fs = require('fs');
const path = require('path');

class CategoryService {
  constructor(categoriesPath = null) {
    this.categoriesPath = categoriesPath || path.join(__dirname, '../../data/categories.json');
    this.data = null;
    this._loadCategories();
  }

  /**
   * 加载分类数据
   * @private
   */
  _loadCategories() {
    try {
      const content = fs.readFileSync(this.categoriesPath, 'utf-8');
      this.data = JSON.parse(content);
    } catch (error) {
      console.error('Failed to load categories:', error);
      this.data = { categories: [], techniques: [], tags: [] };
    }
  }

  /**
   * 重新加载分类数据
   */
  reload() {
    this._loadCategories();
    return this;
  }

  /**
   * 获取所有顶级分类
   * @returns {Array}
   */
  getCategories() {
    return this.data.categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      description: cat.description,
      subcategoryCount: cat.subcategories?.length || 0
    }));
  }

  /**
   * 获取指定分类的详情（包含子分类）
   * @param {string} categoryId 
   * @returns {Object|null}
   */
  getCategory(categoryId) {
    return this.data.categories.find(cat => cat.id === categoryId) || null;
  }

  /**
   * 获取指定分类的所有子分类
   * @param {string} categoryId 
   * @returns {Array}
   */
  getSubcategories(categoryId) {
    const category = this.getCategory(categoryId);
    return category?.subcategories || [];
  }

  /**
   * 获取子分类详情
   * @param {string} categoryId 
   * @param {string} subcategoryId 
   * @returns {Object|null}
   */
  getSubcategory(categoryId, subcategoryId) {
    const subcategories = this.getSubcategories(categoryId);
    return subcategories.find(sub => sub.id === subcategoryId) || null;
  }

  /**
   * 获取所有提示词技术
   * @returns {Array}
   */
  getTechniques() {
    return this.data.techniques || [];
  }

  /**
   * 获取指定技术详情
   * @param {string} techniqueId 
   * @returns {Object|null}
   */
  getTechnique(techniqueId) {
    return this.data.techniques?.find(t => t.id === techniqueId) || null;
  }

  /**
   * 获取所有标签
   * @returns {Array}
   */
  getAllTags() {
    return this.data.tags || [];
  }

  /**
   * 获取指定分类的所有标签
   * @param {string} categoryId 
   * @returns {Array}
   */
  getTagsByCategory(categoryId) {
    const category = this.getCategory(categoryId);
    if (!category) return [];
    
    const tags = new Set();
    category.subcategories?.forEach(sub => {
      sub.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  }

  /**
   * 搜索分类和子分类
   * @param {string} query - 搜索关键词
   * @param {Object} options - 搜索选项
   * @returns {Object}
   */
  search(query, options = {}) {
    const { includeSubcategories = true, includeTechniques = true, includeTags = true } = options;
    const normalizedQuery = query.toLowerCase().trim();
    const results = {
      categories: [],
      subcategories: [],
      techniques: [],
      tags: []
    };

    // 搜索分类
    this.data.categories.forEach(cat => {
      if (
        cat.name.toLowerCase().includes(normalizedQuery) ||
        cat.description?.toLowerCase().includes(normalizedQuery)
      ) {
        results.categories.push({
          id: cat.id,
          name: cat.name,
          icon: cat.icon,
          description: cat.description,
          matchType: 'category'
        });
      }

      // 搜索子分类
      if (includeSubcategories) {
        cat.subcategories?.forEach(sub => {
          if (
            sub.name.toLowerCase().includes(normalizedQuery) ||
            sub.tags?.some(tag => tag.toLowerCase().includes(normalizedQuery))
          ) {
            results.subcategories.push({
              id: sub.id,
              name: sub.name,
              icon: sub.icon,
              parentId: cat.id,
              parentName: cat.name,
              tags: sub.tags,
              matchType: 'subcategory'
            });
          }
        });
      }
    });

    // 搜索技术
    if (includeTechniques) {
      this.data.techniques?.forEach(tech => {
        if (
          tech.name.toLowerCase().includes(normalizedQuery) ||
          tech.nameEn?.toLowerCase().includes(normalizedQuery) ||
          tech.description?.toLowerCase().includes(normalizedQuery)
        ) {
          results.techniques.push({
            ...tech,
            matchType: 'technique'
          });
        }
      });
    }

    // 搜索标签
    if (includeTags) {
      this.data.tags?.forEach(tag => {
        if (tag.toLowerCase().includes(normalizedQuery)) {
          results.tags.push(tag);
        }
      });
    }

    return results;
  }

  /**
   * 根据标签筛选子分类
   * @param {string[]} tags - 标签数组
   * @returns {Array}
   */
  filterByTags(tags) {
    const normalizedTags = tags.map(t => t.toLowerCase());
    const results = [];

    this.data.categories.forEach(cat => {
      cat.subcategories?.forEach(sub => {
        const hasMatchingTag = sub.tags?.some(tag => 
          normalizedTags.includes(tag.toLowerCase())
        );
        if (hasMatchingTag) {
          results.push({
            id: sub.id,
            name: sub.name,
            icon: sub.icon,
            parentId: cat.id,
            parentName: cat.name,
            tags: sub.tags,
            matchedTags: sub.tags.filter(t => 
              normalizedTags.includes(t.toLowerCase())
            )
          });
        }
      });
    });

    return results;
  }

  /**
   * 获取推荐的分类（基于使用场景）
   * @param {string} scenario - 场景描述
   * @returns {Array}
   */
  recommend(scenario) {
    if (!scenario) return [];
    
    const normalizedScenario = scenario.toLowerCase();
    const scores = new Map();

    this.data.categories.forEach(cat => {
      let score = 0;
      
      // 匹配分类名称和描述
      if (cat.name && normalizedScenario.includes(cat.name.toLowerCase())) {
        score += 5;
      }
      if (normalizedScenario.includes(cat.name.toLowerCase().replace(/[创作生成处理]/g, ''))) {
        score += 3;
      }
      if (cat.description && normalizedScenario.includes(cat.description.toLowerCase().slice(0, 4))) {
        score += 2;
      }

      // 匹配子分类
      cat.subcategories?.forEach(sub => {
        if (sub.name && normalizedScenario.includes(sub.name.toLowerCase())) {
          score += 3;
        }
        // 匹配标签
        sub.tags?.forEach(tag => {
          if (normalizedScenario.includes(tag.toLowerCase())) {
            score += 2;
          }
        });
      });

      // 关键词匹配
      const keywords = this._extractKeywords(scenario);
      keywords.forEach(keyword => {
        if (cat.name.toLowerCase().includes(keyword)) score += 2;
        if (cat.description?.toLowerCase().includes(keyword)) score += 1;
        cat.subcategories?.forEach(sub => {
          if (sub.name.toLowerCase().includes(keyword)) score += 1;
          if (sub.tags?.some(tag => tag.toLowerCase().includes(keyword))) score += 1;
        });
      });

      if (score > 0) {
        scores.set(cat.id, { category: cat, score });
      }
    });

    return Array.from(scores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(item => ({
        id: item.category.id,
        name: item.category.name,
        icon: item.category.icon,
        description: item.category.description,
        relevanceScore: item.score
      }));
  }

  /**
   * 获取分类树结构
   * @returns {Array}
   */
  getTree() {
    return this.data.categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      description: cat.description,
      children: cat.subcategories?.map(sub => ({
        id: sub.id,
        name: sub.name,
        icon: sub.icon,
        tags: sub.tags
      })) || []
    }));
  }

  /**
   * 获取分类统计
   * @returns {Object}
   */
  getStats() {
    let totalSubcategories = 0;
    let totalTags = new Set();

    this.data.categories.forEach(cat => {
      totalSubcategories += cat.subcategories?.length || 0;
      cat.subcategories?.forEach(sub => {
        sub.tags?.forEach(tag => totalTags.add(tag));
      });
    });

    return {
      categoryCount: this.data.categories.length,
      subcategoryCount: totalSubcategories,
      techniqueCount: this.data.techniques?.length || 0,
      tagCount: totalTags.size,
      version: this.data.version,
      lastUpdated: this.data.lastUpdated
    };
  }

  /**
   * 提取关键词
   * @private
   */
  _extractKeywords(text) {
    if (!text) return [];
    return text
      .toLowerCase()
      .split(/[\s,，、]+/)
      .filter(word => word.length >= 2);
  }

  /**
   * 验证分类数据完整性
   * @returns {Object}
   */
  validate() {
    const issues = [];

    this.data.categories.forEach(cat => {
      if (!cat.id) issues.push(`分类缺少 id: ${cat.name}`);
      if (!cat.name) issues.push(`分类缺少 name: ${cat.id}`);
      
      cat.subcategories?.forEach(sub => {
        if (!sub.id) issues.push(`子分类缺少 id: ${sub.name} (父分类: ${cat.name})`);
        if (!sub.name) issues.push(`子分类缺少 name: ${sub.id} (父分类: ${cat.name})`);
      });
    });

    this.data.techniques?.forEach(tech => {
      if (!tech.id) issues.push(`技术缺少 id: ${tech.name}`);
      if (!tech.name) issues.push(`技术缺少 name: ${tech.id}`);
    });

    return {
      valid: issues.length === 0,
      issues
    };
  }
}

// 单例实例
let instance = null;

/**
 * 获取 CategoryService 单例
 * @returns {CategoryService}
 */
function getCategoryService() {
  if (!instance) {
    instance = new CategoryService();
  }
  return instance;
}

module.exports = {
  CategoryService,
  getCategoryService
};
