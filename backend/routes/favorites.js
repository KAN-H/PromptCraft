/**
 * 收藏 API 路由
 */

const express = require('express');
const router = express.Router();
const favoritesService = require('../services/favoritesService');

/**
 * GET /api/favorites
 * 获取收藏列表
 * Query: category, subcategory, search, sortBy, sortOrder
 */
router.get('/', (req, res) => {
  try {
    const { category, subcategory, search, sortBy, sortOrder } = req.query;
    
    const result = favoritesService.getFavorites({
      category,
      subcategory,
      search,
      sortBy,
      sortOrder
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('[Favorites API] 获取列表失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/favorites/grouped
 * 获取按分类分组的收藏
 */
router.get('/grouped', (req, res) => {
  try {
    const groups = favoritesService.getFavoritesGrouped();
    res.json({ success: true, groups });
  } catch (error) {
    console.error('[Favorites API] 获取分组失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/favorites/stats
 * 获取统计信息
 */
router.get('/stats', (req, res) => {
  try {
    const stats = favoritesService.getStats();
    res.json({ success: true, stats });
  } catch (error) {
    console.error('[Favorites API] 获取统计失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/favorites/references
 * 获取可用于参考的收藏
 * Query: category, subcategory
 */
router.get('/references', (req, res) => {
  try {
    const { category, subcategory } = req.query;
    
    if (!category || !subcategory) {
      return res.status(400).json({ 
        success: false, 
        error: '需要指定 category 和 subcategory' 
      });
    }

    const candidates = favoritesService.getReferenceCandidates(category, subcategory);
    res.json({ success: true, candidates });
  } catch (error) {
    console.error('[Favorites API] 获取参考候选失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/favorites/:id
 * 获取单个收藏
 */
router.get('/:id', (req, res) => {
  try {
    const item = favoritesService.getFavorite(req.params.id);
    
    if (!item) {
      return res.status(404).json({ success: false, error: '收藏不存在' });
    }

    res.json({ success: true, item });
  } catch (error) {
    console.error('[Favorites API] 获取收藏失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/favorites
 * 添加收藏
 */
router.post('/', (req, res) => {
  try {
    const { name, prompt, category, subcategory, parameters, tags, notes, rating, historyId } = req.body;

    if (!prompt) {
      return res.status(400).json({ success: false, error: '缺少提示词内容' });
    }

    const item = favoritesService.addFavorite({
      name,
      prompt,
      category,
      subcategory,
      parameters,
      tags,
      notes,
      rating,
      historyId
    });

    res.json({ success: true, item });
  } catch (error) {
    console.error('[Favorites API] 添加收藏失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/favorites/:id
 * 更新收藏
 */
router.put('/:id', (req, res) => {
  try {
    const { name, tags, notes, rating } = req.body;
    
    const result = favoritesService.updateFavorite(req.params.id, {
      name,
      tags,
      notes,
      rating
    });

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[Favorites API] 更新收藏失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/favorites/:id/use
 * 记录引用使用
 */
router.post('/:id/use', (req, res) => {
  try {
    const success = favoritesService.recordUsage(req.params.id);
    
    if (!success) {
      return res.status(404).json({ success: false, error: '收藏不存在' });
    }

    res.json({ success: true, message: '已记录使用' });
  } catch (error) {
    console.error('[Favorites API] 记录使用失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/favorites/:id
 * 删除收藏
 */
router.delete('/:id', (req, res) => {
  try {
    const result = favoritesService.deleteFavorite(req.params.id);
    
    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[Favorites API] 删除收藏失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
