/**
 * 历史记录 API 路由
 */

const express = require('express');
const router = express.Router();
const historyService = require('../services/historyService');

/**
 * GET /api/history
 * 获取历史记录列表
 * Query: category, subcategory, limit, offset
 */
router.get('/', (req, res) => {
  try {
    const { category, subcategory, limit, offset } = req.query;
    
    const result = historyService.getRecords({
      category,
      subcategory,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('[History API] 获取列表失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/history/stats
 * 获取统计信息
 */
router.get('/stats', (req, res) => {
  try {
    const stats = historyService.getStats();
    res.json({ success: true, stats });
  } catch (error) {
    console.error('[History API] 获取统计失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/history/:id
 * 获取单条记录
 */
router.get('/:id', (req, res) => {
  try {
    const record = historyService.getRecord(req.params.id);
    
    if (!record) {
      return res.status(404).json({ success: false, error: '记录不存在' });
    }

    res.json({ success: true, record });
  } catch (error) {
    console.error('[History API] 获取记录失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/history
 * 添加历史记录（通常由生成接口内部调用）
 */
router.post('/', (req, res) => {
  try {
    const { category, subcategory, input, output } = req.body;

    if (!output?.prompt) {
      return res.status(400).json({ success: false, error: '缺少提示词内容' });
    }

    const record = historyService.addRecord({
      category,
      subcategory,
      input,
      output
    });

    res.json({ success: true, record });
  } catch (error) {
    console.error('[History API] 添加记录失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/history/:id
 * 删除单条记录
 */
router.delete('/:id', (req, res) => {
  try {
    const result = historyService.deleteRecord(req.params.id);
    
    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[History API] 删除记录失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/history
 * 清空所有历史记录
 */
router.delete('/', (req, res) => {
  try {
    const result = historyService.clearAll();
    res.json(result);
  } catch (error) {
    console.error('[History API] 清空记录失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
