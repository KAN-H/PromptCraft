/**
 * 模型管理 API 路由
 * 
 * Phase 13 — v5.0
 * 
 * 提供本地 AI 模型的管理接口：
 * - 查询模型状态
 * - 下载/删除模型
 * - 加载/卸载模型
 * - 推理测试
 * - 下载进度 SSE 推送
 * 
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const modelManager = require('../services/localModelManager');

// ============================================================
// 模型状态查询
// ============================================================

/**
 * GET /api/models/status
 * 获取所有模型的综合状态
 */
router.get('/status', (req, res) => {
    try {
        const status = modelManager.getStatus();
        const runtime = modelManager.getRuntimeStatus();
        const memory = modelManager.getMemoryUsage();

        res.json({
            success: true,
            data: {
                models: status,
                runtime,
                memory
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: { code: 'STATUS_ERROR', message: error.message }
        });
    }
});

/**
 * GET /api/models/registry
 * 获取模型注册表（支持的模型列表）
 */
router.get('/registry', (req, res) => {
    try {
        const registry = modelManager.getRegistry();
        res.json({
            success: true,
            data: registry
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: { code: 'REGISTRY_ERROR', message: error.message }
        });
    }
});

/**
 * GET /api/models/:modelId/status
 * 获取单个模型的状态
 */
router.get('/:modelId/status', (req, res) => {
    try {
        const { modelId } = req.params;
        const status = modelManager.getModelStatus(modelId);

        if (!status) {
            return res.status(404).json({
                success: false,
                error: { code: 'MODEL_NOT_FOUND', message: `未知模型: ${modelId}` }
            });
        }

        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: { code: 'STATUS_ERROR', message: error.message }
        });
    }
});

// ============================================================
// 模型下载
// ============================================================

/**
 * POST /api/models/:modelId/download
 * 触发模型下载
 */
router.post('/:modelId/download', async (req, res) => {
    try {
        const { modelId } = req.params;
        const modelInfo = modelManager.getModelInfo(modelId);

        if (!modelInfo) {
            return res.status(404).json({
                success: false,
                error: { code: 'MODEL_NOT_FOUND', message: `未知模型: ${modelId}` }
            });
        }

        // 异步启动下载，立即返回响应
        // 前端通过 SSE 端点获取进度
        res.json({
            success: true,
            message: `已开始下载 ${modelInfo.name}`,
            data: {
                modelId,
                name: modelInfo.name,
                size: modelInfo.sizeDisplay,
                hint: '使用 GET /api/models/download-progress SSE 端点获取实时进度'
            }
        });

        // 在响应发送后开始下载
        modelManager.downloadModel(modelId).catch(err => {
            console.error(`❌ 模型下载失败 [${modelId}]: ${err.message}`);
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: { code: 'DOWNLOAD_ERROR', message: error.message }
        });
    }
});

/**
 * GET /api/models/download-progress
 * SSE 端点：实时推送下载进度
 */
router.get('/download-progress', (req, res) => {
    // 设置 SSE 头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Nginx 关闭缓冲
    res.flushHeaders();

    // 发送初始状态
    const status = modelManager.getStatus();
    res.write(`data: ${JSON.stringify({ type: 'status', data: status })}\n\n`);

    // 监听下载进度事件
    const onProgress = (data) => {
        res.write(`data: ${JSON.stringify({ type: 'progress', data })}\n\n`);
    };
    const onComplete = (data) => {
        res.write(`data: ${JSON.stringify({ type: 'complete', data })}\n\n`);
    };
    const onError = (data) => {
        res.write(`data: ${JSON.stringify({ type: 'error', data })}\n\n`);
    };
    const onStatusChange = (data) => {
        res.write(`data: ${JSON.stringify({ type: 'status_change', data })}\n\n`);
    };

    modelManager.on('download:progress', onProgress);
    modelManager.on('download:complete', onComplete);
    modelManager.on('download:error', onError);
    modelManager.on('status:change', onStatusChange);

    // 心跳（每 30 秒）
    const heartbeat = setInterval(() => {
        res.write(`: heartbeat\n\n`);
    }, 30_000);

    // 客户端断开连接时清理
    req.on('close', () => {
        clearInterval(heartbeat);
        modelManager.off('download:progress', onProgress);
        modelManager.off('download:complete', onComplete);
        modelManager.off('download:error', onError);
        modelManager.off('status:change', onStatusChange);
    });
});

// ============================================================
// 模型加载/卸载
// ============================================================

/**
 * POST /api/models/:modelId/load
 * 加载模型到内存
 */
router.post('/:modelId/load', async (req, res) => {
    try {
        const { modelId } = req.params;
        const modelInfo = modelManager.getModelInfo(modelId);

        if (!modelInfo) {
            return res.status(404).json({
                success: false,
                error: { code: 'MODEL_NOT_FOUND', message: `未知模型: ${modelId}` }
            });
        }

        await modelManager.loadModel(modelId);

        res.json({
            success: true,
            message: `${modelInfo.name} 已加载`,
            data: modelManager.getModelStatus(modelId)
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: { code: 'LOAD_ERROR', message: error.message }
        });
    }
});

/**
 * POST /api/models/:modelId/unload
 * 从内存卸载模型
 */
router.post('/:modelId/unload', async (req, res) => {
    try {
        const { modelId } = req.params;
        const modelInfo = modelManager.getModelInfo(modelId);

        if (!modelInfo) {
            return res.status(404).json({
                success: false,
                error: { code: 'MODEL_NOT_FOUND', message: `未知模型: ${modelId}` }
            });
        }

        await modelManager.unloadModel(modelId);

        res.json({
            success: true,
            message: `${modelInfo.name} 已卸载`,
            data: modelManager.getModelStatus(modelId)
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: { code: 'UNLOAD_ERROR', message: error.message }
        });
    }
});

// ============================================================
// 模型删除
// ============================================================

/**
 * DELETE /api/models/:modelId
 * 删除模型文件
 */
router.delete('/:modelId', async (req, res) => {
    try {
        const { modelId } = req.params;
        const modelInfo = modelManager.getModelInfo(modelId);

        if (!modelInfo) {
            return res.status(404).json({
                success: false,
                error: { code: 'MODEL_NOT_FOUND', message: `未知模型: ${modelId}` }
            });
        }

        await modelManager.deleteModel(modelId);

        res.json({
            success: true,
            message: `${modelInfo.name} 已删除`,
            data: modelManager.getModelStatus(modelId)
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: { code: 'DELETE_ERROR', message: error.message }
        });
    }
});

// ============================================================
// 模型扫描 & 手动导入
// ============================================================

/**
 * POST /api/models/scan
 * 扫描 models 目录，发现用户手动放置的兼容模型文件
 */
router.post('/scan', (req, res) => {
    try {
        const result = modelManager.scanModels();

        res.json({
            success: true,
            message: `扫描完成: 发现 ${result.found.length} 个兼容模型文件`,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: { code: 'SCAN_ERROR', message: error.message }
        });
    }
});

/**
 * POST /api/models/:modelId/import
 * 从用户指定的路径导入模型文件
 * 
 * Body: { sourcePath: string, move?: boolean }
 */
router.post('/:modelId/import', async (req, res) => {
    try {
        const { modelId } = req.params;
        const { sourcePath, move = false } = req.body;

        if (!sourcePath) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_PATH',
                    message: '请提供 sourcePath 参数（模型文件的绝对路径）'
                }
            });
        }

        const modelInfo = modelManager.getModelInfo(modelId);
        if (!modelInfo) {
            return res.status(404).json({
                success: false,
                error: { code: 'MODEL_NOT_FOUND', message: `未知模型: ${modelId}` }
            });
        }

        const result = await modelManager.importModel(modelId, sourcePath, { move });

        res.json({
            success: true,
            message: `${modelInfo.name} 导入成功`,
            data: result
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: { code: 'IMPORT_ERROR', message: error.message }
        });
    }
});

// ============================================================
// 推理测试
// ============================================================

/**
 * POST /api/models/test/generate
 * 测试文本生成能力
 */
router.post('/test/generate', async (req, res) => {
    try {
        const { prompt, systemPrompt, options } = req.body;

        if (!prompt) {
            return res.status(400).json({
                success: false,
                error: { code: 'MISSING_PROMPT', message: '请提供 prompt 参数' }
            });
        }

        if (!modelManager.isGenerationAvailable()) {
            return res.status(503).json({
                success: false,
                error: {
                    code: 'MODEL_NOT_READY',
                    message: '文本生成模型未加载，请先加载 qwen3-0.6b'
                }
            });
        }

        const startTime = Date.now();
        const result = await modelManager.generate(prompt, systemPrompt, options);
        const elapsed = Date.now() - startTime;

        res.json({
            success: true,
            data: {
                result,
                model: 'qwen3-0.6b',
                elapsed: `${elapsed}ms`,
                tokensPerSecond: result.length > 0
                    ? Math.round((result.length / 4) / (elapsed / 1000)) // 粗略估算
                    : 0
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: { code: 'GENERATE_ERROR', message: error.message }
        });
    }
});

/**
 * POST /api/models/test/classify
 * 测试分类能力
 */
router.post('/test/classify', async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({
                success: false,
                error: { code: 'MISSING_TEXT', message: '请提供 text 参数' }
            });
        }

        const startTime = Date.now();
        const result = await modelManager.classify(text);
        const elapsed = Date.now() - startTime;

        res.json({
            success: true,
            data: {
                ...result,
                model: 'tiny-toxic-detector',
                elapsed: `${elapsed}ms`
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: { code: 'CLASSIFY_ERROR', message: error.message }
        });
    }
});

// ============================================================
// 内存信息
// ============================================================

/**
 * GET /api/models/memory
 * 获取内存使用信息
 */
router.get('/memory', (req, res) => {
    try {
        const memory = modelManager.getMemoryUsage();
        res.json({
            success: true,
            data: memory
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: { code: 'MEMORY_ERROR', message: error.message }
        });
    }
});

module.exports = router;
