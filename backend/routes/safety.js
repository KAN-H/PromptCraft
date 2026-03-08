/**
 * Safety Routes - 安全审查 API 路由
 * 
 * Phase 14 — v5.0
 * 
 * 端点：
 *   POST   /api/safety/check         手动审查文本
 *   GET    /api/safety/config         获取安全配置
 *   PUT    /api/safety/config         更新安全配置
 *   GET    /api/safety/stats          获取审查统计
 *   POST   /api/safety/stats/reset    重置审查统计
 * 
 * @version 1.0.0
 * @since Phase 14
 */

const express = require('express');
const router = express.Router();
const safetyService = require('../services/safetyService');

// ============================================================
// POST /api/safety/check — 手动审查文本
// ============================================================

router.post('/check', async (req, res) => {
    try {
        const { text, context, skipAI } = req.body;

        if (!text || typeof text !== 'string') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_INPUT',
                    message: '缺少 text 字段或类型无效'
                }
            });
        }

        const result = await safetyService.check(text, { 
            context: context || 'input',
            skipAI: skipAI === true
        });

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Safety check error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SAFETY_CHECK_ERROR',
                message: '安全审查执行失败: ' + error.message
            }
        });
    }
});

// ============================================================
// GET /api/safety/config — 获取安全配置
// ============================================================

router.get('/config', (req, res) => {
    try {
        const config = safetyService.getConfig();
        res.json({
            success: true,
            data: config
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'CONFIG_ERROR',
                message: '获取安全配置失败: ' + error.message
            }
        });
    }
});

// ============================================================
// PUT /api/safety/config — 更新安全配置
// ============================================================

router.put('/config', (req, res) => {
    try {
        const updates = req.body;

        if (!updates || typeof updates !== 'object') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_INPUT',
                    message: '请求体必须是有效的 JSON 对象'
                }
            });
        }

        const updatedConfig = safetyService.updateConfig(updates);

        res.json({
            success: true,
            data: updatedConfig,
            message: '安全配置已更新'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'CONFIG_UPDATE_ERROR',
                message: '更新安全配置失败: ' + error.message
            }
        });
    }
});

// ============================================================
// GET /api/safety/stats — 获取审查统计
// ============================================================

router.get('/stats', (req, res) => {
    try {
        const stats = safetyService.getStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'STATS_ERROR',
                message: '获取审查统计失败: ' + error.message
            }
        });
    }
});

// ============================================================
// POST /api/safety/stats/reset — 重置审查统计
// ============================================================

router.post('/stats/reset', (req, res) => {
    try {
        safetyService.resetStats();
        res.json({
            success: true,
            message: '审查统计已重置'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'STATS_RESET_ERROR',
                message: '重置审查统计失败: ' + error.message
            }
        });
    }
});

module.exports = router;
