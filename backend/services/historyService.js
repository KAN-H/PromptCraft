/**
 * 历史记录服务
 * 自动保存生成记录，支持查询、删除
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const uuidv4 = () => crypto.randomUUID();

const HISTORY_FILE = path.join(__dirname, '../../data/history.json');
const DEFAULT_MAX_RECORDS = 100;

class HistoryService {
  constructor() {
    this.ensureDataFile();
  }

  /**
   * 确保数据文件存在
   */
  ensureDataFile() {
    if (!fs.existsSync(HISTORY_FILE)) {
      const initialData = {
        version: '1.0.0',
        maxRecords: DEFAULT_MAX_RECORDS,
        records: []
      };
      fs.writeFileSync(HISTORY_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    }
  }

  /**
   * 读取历史数据
   */
  readData() {
    try {
      const content = fs.readFileSync(HISTORY_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error('[HistoryService] 读取数据失败:', error.message);
      return { version: '1.0.0', maxRecords: DEFAULT_MAX_RECORDS, records: [] };
    }
  }

  /**
   * 保存历史数据
   */
  saveData(data) {
    try {
      fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2), 'utf-8');
      return true;
    } catch (error) {
      console.error('[HistoryService] 保存数据失败:', error.message);
      return false;
    }
  }

  /**
   * 添加历史记录
   * @param {Object} record - 记录对象
   * @param {string} record.category - 主分类 (image, video, writing...)
   * @param {string} record.subcategory - 子分类 (logo-design, character-design...)
   * @param {Object} record.input - 输入参数
   * @param {Object} record.output - 输出结果
   */
  addRecord(record) {
    const data = this.readData();
    
    const newRecord = {
      id: `h_${uuidv4()}`,
      timestamp: new Date().toISOString(),
      category: record.category || 'image',
      subcategory: record.subcategory || 'logo-design',
      input: record.input || {},
      output: {
        prompt: record.output?.prompt || '',
        matchedSkills: record.output?.matchedSkills || []
      },
      isFavorited: false
    };

    // 添加到开头
    data.records.unshift(newRecord);

    // 限制记录数量
    const maxRecords = data.maxRecords || DEFAULT_MAX_RECORDS;
    if (data.records.length > maxRecords) {
      data.records = data.records.slice(0, maxRecords);
    }

    this.saveData(data);
    console.log(`[HistoryService] 添加记录: ${newRecord.id}`);
    
    return newRecord;
  }

  /**
   * 获取所有历史记录
   * @param {Object} options - 查询选项
   * @param {string} options.category - 按主分类筛选
   * @param {string} options.subcategory - 按子分类筛选
   * @param {number} options.limit - 限制返回数量
   * @param {number} options.offset - 偏移量
   */
  getRecords(options = {}) {
    const data = this.readData();
    let records = data.records;

    // 按分类筛选
    if (options.category) {
      records = records.filter(r => r.category === options.category);
    }
    if (options.subcategory) {
      records = records.filter(r => r.subcategory === options.subcategory);
    }

    // 分页
    const offset = options.offset || 0;
    const limit = options.limit || records.length;
    const paginatedRecords = records.slice(offset, offset + limit);

    return {
      total: records.length,
      offset,
      limit,
      records: paginatedRecords
    };
  }

  /**
   * 获取单条记录
   */
  getRecord(id) {
    const data = this.readData();
    return data.records.find(r => r.id === id) || null;
  }

  /**
   * 删除单条记录
   */
  deleteRecord(id) {
    const data = this.readData();
    const index = data.records.findIndex(r => r.id === id);
    
    if (index === -1) {
      return { success: false, message: '记录不存在' };
    }

    data.records.splice(index, 1);
    this.saveData(data);
    
    console.log(`[HistoryService] 删除记录: ${id}`);
    return { success: true, message: '删除成功' };
  }

  /**
   * 清空所有历史记录
   */
  clearAll() {
    const data = this.readData();
    const count = data.records.length;
    data.records = [];
    this.saveData(data);
    
    console.log(`[HistoryService] 清空所有记录，共 ${count} 条`);
    return { success: true, message: `已清空 ${count} 条记录` };
  }

  /**
   * 标记为已收藏
   */
  markAsFavorited(id, favoriteId) {
    const data = this.readData();
    const record = data.records.find(r => r.id === id);
    
    if (record) {
      record.isFavorited = true;
      record.favoriteId = favoriteId;
      this.saveData(data);
      return true;
    }
    return false;
  }

  /**
   * 取消收藏标记
   */
  unmarkFavorited(id) {
    const data = this.readData();
    const record = data.records.find(r => r.id === id);
    
    if (record) {
      record.isFavorited = false;
      delete record.favoriteId;
      this.saveData(data);
      return true;
    }
    return false;
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const data = this.readData();
    const records = data.records;

    // 按分类统计
    const categoryStats = {};
    const subcategoryStats = {};

    records.forEach(r => {
      categoryStats[r.category] = (categoryStats[r.category] || 0) + 1;
      const key = `${r.category}/${r.subcategory}`;
      subcategoryStats[key] = (subcategoryStats[key] || 0) + 1;
    });

    return {
      total: records.length,
      maxRecords: data.maxRecords,
      favoritedCount: records.filter(r => r.isFavorited).length,
      byCategory: categoryStats,
      bySubcategory: subcategoryStats
    };
  }
}

// 单例模式
const historyService = new HistoryService();

module.exports = historyService;
