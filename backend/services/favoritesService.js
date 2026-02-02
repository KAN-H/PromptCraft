/**
 * 收藏服务
 * 用户主动收藏的优质提示词，可作为 AI 生成参考
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const historyService = require('./historyService');

const FAVORITES_FILE = path.join(__dirname, '../../data/favorites.json');

class FavoritesService {
  constructor() {
    this.ensureDataFile();
  }

  /**
   * 确保数据文件存在
   */
  ensureDataFile() {
    if (!fs.existsSync(FAVORITES_FILE)) {
      const initialData = {
        version: '1.0.0',
        items: []
      };
      fs.writeFileSync(FAVORITES_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    }
  }

  /**
   * 读取收藏数据
   */
  readData() {
    try {
      const content = fs.readFileSync(FAVORITES_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error('[FavoritesService] 读取数据失败:', error.message);
      return { version: '1.0.0', items: [] };
    }
  }

  /**
   * 保存收藏数据
   */
  saveData(data) {
    try {
      fs.writeFileSync(FAVORITES_FILE, JSON.stringify(data, null, 2), 'utf-8');
      return true;
    } catch (error) {
      console.error('[FavoritesService] 保存数据失败:', error.message);
      return false;
    }
  }

  /**
   * 添加收藏
   * @param {Object} item - 收藏对象
   * @param {string} item.name - 收藏名称
   * @param {string} item.prompt - 提示词内容
   * @param {string} item.category - 主分类
   * @param {string} item.subcategory - 子分类
   * @param {Object} item.parameters - 参数快照
   * @param {Array} item.tags - 标签
   * @param {string} item.notes - 备注
   * @param {number} item.rating - 评分 1-5
   * @param {string} item.historyId - 关联的历史记录ID
   */
  addFavorite(item) {
    const data = this.readData();

    const newItem = {
      id: `f_${uuidv4()}`,
      name: item.name || '未命名收藏',
      prompt: item.prompt || '',
      category: item.category || 'image',
      subcategory: item.subcategory || 'logo-design',
      parameters: item.parameters || {},
      tags: item.tags || [],
      notes: item.notes || '',
      rating: Math.min(5, Math.max(1, item.rating || 5)),
      source: {
        historyId: item.historyId || null
      },
      stats: {
        usedAsReference: 0,
        lastUsedAt: null
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    data.items.push(newItem);
    this.saveData(data);

    // 更新历史记录的收藏状态
    if (item.historyId) {
      historyService.markAsFavorited(item.historyId, newItem.id);
    }

    console.log(`[FavoritesService] 添加收藏: ${newItem.id} - ${newItem.name}`);
    return newItem;
  }

  /**
   * 获取所有收藏
   * @param {Object} options - 查询选项
   * @param {string} options.category - 按主分类筛选
   * @param {string} options.subcategory - 按子分类筛选
   * @param {string} options.search - 搜索关键词
   * @param {string} options.sortBy - 排序字段 (createdAt, rating, usedAsReference)
   * @param {string} options.sortOrder - 排序方向 (asc, desc)
   */
  getFavorites(options = {}) {
    const data = this.readData();
    let items = [...data.items];

    // 按分类筛选
    if (options.category) {
      items = items.filter(i => i.category === options.category);
    }
    if (options.subcategory) {
      items = items.filter(i => i.subcategory === options.subcategory);
    }

    // 搜索
    if (options.search) {
      const keyword = options.search.toLowerCase();
      items = items.filter(i => 
        i.name.toLowerCase().includes(keyword) ||
        i.prompt.toLowerCase().includes(keyword) ||
        i.notes.toLowerCase().includes(keyword) ||
        i.tags.some(t => t.toLowerCase().includes(keyword))
      );
    }

    // 排序
    const sortBy = options.sortBy || 'createdAt';
    const sortOrder = options.sortOrder || 'desc';
    items.sort((a, b) => {
      let valA, valB;
      
      if (sortBy === 'rating') {
        valA = a.rating;
        valB = b.rating;
      } else if (sortBy === 'usedAsReference') {
        valA = a.stats?.usedAsReference || 0;
        valB = b.stats?.usedAsReference || 0;
      } else {
        valA = new Date(a.createdAt).getTime();
        valB = new Date(b.createdAt).getTime();
      }

      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

    return {
      total: items.length,
      items
    };
  }

  /**
   * 按分类分组获取收藏
   */
  getFavoritesGrouped() {
    const data = this.readData();
    const grouped = {};

    data.items.forEach(item => {
      const key = `${item.category}/${item.subcategory}`;
      if (!grouped[key]) {
        grouped[key] = {
          category: item.category,
          subcategory: item.subcategory,
          items: []
        };
      }
      grouped[key].items.push(item);
    });

    // 转换为数组并按分类排序
    return Object.values(grouped).sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.subcategory.localeCompare(b.subcategory);
    });
  }

  /**
   * 获取单个收藏
   */
  getFavorite(id) {
    const data = this.readData();
    return data.items.find(i => i.id === id) || null;
  }

  /**
   * 更新收藏
   */
  updateFavorite(id, updates) {
    const data = this.readData();
    const index = data.items.findIndex(i => i.id === id);

    if (index === -1) {
      return { success: false, message: '收藏不存在' };
    }

    // 只允许更新特定字段
    const allowedFields = ['name', 'tags', 'notes', 'rating'];
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        data.items[index][field] = updates[field];
      }
    });

    // 评分范围限制
    if (updates.rating !== undefined) {
      data.items[index].rating = Math.min(5, Math.max(1, updates.rating));
    }

    data.items[index].updatedAt = new Date().toISOString();
    this.saveData(data);

    console.log(`[FavoritesService] 更新收藏: ${id}`);
    return { success: true, item: data.items[index] };
  }

  /**
   * 删除收藏
   */
  deleteFavorite(id) {
    const data = this.readData();
    const index = data.items.findIndex(i => i.id === id);

    if (index === -1) {
      return { success: false, message: '收藏不存在' };
    }

    const item = data.items[index];
    
    // 取消历史记录的收藏标记
    if (item.source?.historyId) {
      historyService.unmarkFavorited(item.source.historyId);
    }

    data.items.splice(index, 1);
    this.saveData(data);

    console.log(`[FavoritesService] 删除收藏: ${id}`);
    return { success: true, message: '删除成功' };
  }

  /**
   * 记录引用使用
   */
  recordUsage(id) {
    const data = this.readData();
    const item = data.items.find(i => i.id === id);

    if (item) {
      item.stats = item.stats || { usedAsReference: 0 };
      item.stats.usedAsReference++;
      item.stats.lastUsedAt = new Date().toISOString();
      this.saveData(data);
      return true;
    }
    return false;
  }

  /**
   * 获取可用于参考的收藏（按分类筛选）
   * @param {string} category - 主分类
   * @param {string} subcategory - 子分类
   */
  getReferenceCandidates(category, subcategory) {
    const data = this.readData();
    
    return data.items
      .filter(i => i.category === category && i.subcategory === subcategory)
      .sort((a, b) => b.rating - a.rating) // 按评分排序
      .slice(0, 10); // 最多返回10个
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const data = this.readData();
    const items = data.items;

    // 按分类统计
    const categoryStats = {};
    const subcategoryStats = {};
    let totalRating = 0;

    items.forEach(i => {
      categoryStats[i.category] = (categoryStats[i.category] || 0) + 1;
      const key = `${i.category}/${i.subcategory}`;
      subcategoryStats[key] = (subcategoryStats[key] || 0) + 1;
      totalRating += i.rating || 0;
    });

    return {
      total: items.length,
      averageRating: items.length > 0 ? (totalRating / items.length).toFixed(1) : 0,
      byCategory: categoryStats,
      bySubcategory: subcategoryStats,
      mostUsed: items
        .filter(i => i.stats?.usedAsReference > 0)
        .sort((a, b) => b.stats.usedAsReference - a.stats.usedAsReference)
        .slice(0, 5)
        .map(i => ({ id: i.id, name: i.name, usedCount: i.stats.usedAsReference }))
    };
  }
}

// 单例模式
const favoritesService = new FavoritesService();

module.exports = favoritesService;
