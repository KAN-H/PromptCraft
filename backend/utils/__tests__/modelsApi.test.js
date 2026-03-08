/**
 * Models API 路由测试
 * 
 * Phase 13 - v5.0
 * 
 * 测试 /api/models/* 端点
 * 使用 mock 的 localModelManager
 */

// Mock localModelManager
jest.mock('../../services/localModelManager', () => {
    const EventEmitter = require('events');
    const mockManager = new EventEmitter();

    // 模拟注册表
    const MODEL_REGISTRY = {
        'qwen3-0.6b': {
            id: 'qwen3-0.6b',
            name: 'Qwen3-0.6B',
            type: 'generation',
            runtime: 'node-llama-cpp',
            sizeDisplay: '~462 MB'
        },
        'tiny-toxic-detector': {
            id: 'tiny-toxic-detector',
            name: 'Tiny-Toxic-Detector',
            type: 'classification',
            runtime: 'transformers.js',
            sizeDisplay: '~10 MB'
        }
    };

    mockManager.getRegistry = jest.fn(() => ({ ...MODEL_REGISTRY }));
    mockManager.getModelInfo = jest.fn((id) => MODEL_REGISTRY[id] || null);
    mockManager.getStatus = jest.fn(() => ({
        'qwen3-0.6b': { ...MODEL_REGISTRY['qwen3-0.6b'], status: 'not_downloaded' },
        'tiny-toxic-detector': { ...MODEL_REGISTRY['tiny-toxic-detector'], status: 'not_downloaded' }
    }));
    mockManager.getModelStatus = jest.fn((id) => {
        if (!MODEL_REGISTRY[id]) return null;
        return { ...MODEL_REGISTRY[id], status: 'not_downloaded' };
    });
    mockManager.getRuntimeStatus = jest.fn(() => ({
        'node-llama-cpp': null,
        'transformers.js': null
    }));
    mockManager.getMemoryUsage = jest.fn(() => ({
        processRSS: '50.0 MB',
        processHeap: '30.0 MB',
        loadedModels: [],
        totalLoaded: 0
    }));
    mockManager.isAvailable = jest.fn(() => false);
    mockManager.isGenerationAvailable = jest.fn(() => false);
    mockManager.isSafetyAvailable = jest.fn(() => false);
    mockManager.downloadModel = jest.fn(() => Promise.resolve('/path/to/model'));
    mockManager.loadModel = jest.fn(() => Promise.resolve());
    mockManager.unloadModel = jest.fn(() => Promise.resolve());
    mockManager.deleteModel = jest.fn(() => Promise.resolve());
    mockManager.generate = jest.fn(() => Promise.resolve('Generated text'));
    mockManager.classify = jest.fn(() => Promise.resolve({
        label: 'non_toxic',
        score: 0.95,
        isToxic: false,
        confidence: 0.95
    }));

    return mockManager;
});

const express = require('express');
const modelsRouter = require('../../routes/models');
const modelManager = require('../../services/localModelManager');

// 创建测试 app
function createApp() {
    const app = express();
    app.use(express.json());
    app.use('/api/models', modelsRouter);
    return app;
}

// 简易请求工具
async function request(app, method, url, body) {
    return new Promise((resolve, reject) => {
        const http = require('http');
        const server = app.listen(0, () => {
            const port = server.address().port;
            const options = {
                hostname: 'localhost',
                port,
                path: url,
                method: method.toUpperCase(),
                headers: { 'Content-Type': 'application/json' }
            };

            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    server.close();
                    try {
                        resolve({
                            status: res.statusCode,
                            body: JSON.parse(data)
                        });
                    } catch {
                        resolve({ status: res.statusCode, body: data });
                    }
                });
            });

            req.on('error', (err) => {
                server.close();
                reject(err);
            });

            if (body) {
                req.write(JSON.stringify(body));
            }
            req.end();
        });
    });
}

describe('Models API Routes', () => {
    let app;

    beforeEach(() => {
        app = createApp();
        jest.clearAllMocks();
    });

    // ===== GET /status =====

    describe('GET /api/models/status', () => {
        test('应返回所有模型状态', async () => {
            const res = await request(app, 'GET', '/api/models/status');
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('models');
            expect(res.body.data).toHaveProperty('runtime');
            expect(res.body.data).toHaveProperty('memory');
            expect(modelManager.getStatus).toHaveBeenCalled();
        });
    });

    // ===== GET /registry =====

    describe('GET /api/models/registry', () => {
        test('应返回模型注册表', async () => {
            const res = await request(app, 'GET', '/api/models/registry');
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('qwen3-0.6b');
            expect(res.body.data).toHaveProperty('tiny-toxic-detector');
        });
    });

    // ===== GET /:modelId/status =====

    describe('GET /api/models/:modelId/status', () => {
        test('已知模型应返回状态', async () => {
            const res = await request(app, 'GET', '/api/models/qwen3-0.6b/status');
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.name).toBe('Qwen3-0.6B');
        });

        test('未知模型应返回 404', async () => {
            modelManager.getModelStatus.mockReturnValueOnce(null);
            const res = await request(app, 'GET', '/api/models/nonexistent/status');
            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
        });
    });

    // ===== POST /:modelId/download =====

    describe('POST /api/models/:modelId/download', () => {
        test('已知模型应启动下载', async () => {
            const res = await request(app, 'POST', '/api/models/qwen3-0.6b/download');
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toContain('开始下载');
        });

        test('未知模型应返回 404', async () => {
            modelManager.getModelInfo.mockReturnValueOnce(null);
            const res = await request(app, 'POST', '/api/models/nonexistent/download');
            expect(res.status).toBe(404);
        });
    });

    // ===== POST /:modelId/load =====

    describe('POST /api/models/:modelId/load', () => {
        test('已知模型应成功加载', async () => {
            const res = await request(app, 'POST', '/api/models/qwen3-0.6b/load');
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(modelManager.loadModel).toHaveBeenCalledWith('qwen3-0.6b');
        });

        test('加载失败应返回 500', async () => {
            modelManager.loadModel.mockRejectedValueOnce(new Error('模型文件不存在'));
            const res = await request(app, 'POST', '/api/models/qwen3-0.6b/load');
            expect(res.status).toBe(500);
            expect(res.body.success).toBe(false);
        });

        test('未知模型应返回 404', async () => {
            modelManager.getModelInfo.mockReturnValueOnce(null);
            const res = await request(app, 'POST', '/api/models/nonexistent/load');
            expect(res.status).toBe(404);
        });
    });

    // ===== POST /:modelId/unload =====

    describe('POST /api/models/:modelId/unload', () => {
        test('应成功卸载模型', async () => {
            const res = await request(app, 'POST', '/api/models/qwen3-0.6b/unload');
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(modelManager.unloadModel).toHaveBeenCalledWith('qwen3-0.6b');
        });
    });

    // ===== DELETE /:modelId =====

    describe('DELETE /api/models/:modelId', () => {
        test('应成功删除模型', async () => {
            const res = await request(app, 'DELETE', '/api/models/qwen3-0.6b');
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(modelManager.deleteModel).toHaveBeenCalledWith('qwen3-0.6b');
        });

        test('未知模型应返回 404', async () => {
            modelManager.getModelInfo.mockReturnValueOnce(null);
            const res = await request(app, 'DELETE', '/api/models/nonexistent');
            expect(res.status).toBe(404);
        });
    });

    // ===== POST /test/generate =====

    describe('POST /api/models/test/generate', () => {
        test('缺少 prompt 应返回 400', async () => {
            const res = await request(app, 'POST', '/api/models/test/generate', {});
            expect(res.status).toBe(400);
            expect(res.body.error.code).toBe('MISSING_PROMPT');
        });

        test('模型未加载应返回 503', async () => {
            const res = await request(app, 'POST', '/api/models/test/generate', {
                prompt: 'test'
            });
            expect(res.status).toBe(503);
            expect(res.body.error.code).toBe('MODEL_NOT_READY');
        });

        test('模型可用时应返回生成结果', async () => {
            modelManager.isGenerationAvailable.mockReturnValueOnce(true);
            const res = await request(app, 'POST', '/api/models/test/generate', {
                prompt: '帮我生成一个logo设计提示词'
            });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.result).toBe('Generated text');
            expect(res.body.data.model).toBe('qwen3-0.6b');
        });
    });

    // ===== POST /test/classify =====

    describe('POST /api/models/test/classify', () => {
        test('缺少 text 应返回 400', async () => {
            const res = await request(app, 'POST', '/api/models/test/classify', {});
            expect(res.status).toBe(400);
            expect(res.body.error.code).toBe('MISSING_TEXT');
        });

        test('应返回分类结果', async () => {
            const res = await request(app, 'POST', '/api/models/test/classify', {
                text: 'This is a normal design request'
            });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('label');
            expect(res.body.data).toHaveProperty('isToxic');
            expect(res.body.data.model).toBe('tiny-toxic-detector');
        });
    });

    // ===== GET /memory =====

    describe('GET /api/models/memory', () => {
        test('应返回内存信息', async () => {
            const res = await request(app, 'GET', '/api/models/memory');
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('processRSS');
            expect(res.body.data).toHaveProperty('loadedModels');
        });
    });
});
