/**
 * Phase 17 — E2E 工作流集成测试
 *
 * 测试完整的端到端功能链路（所有外部依赖 mock）：
 * 1. 模型生命周期: scan → import → load → generate → unload → delete
 * 2. 设计助手 AI 优化流程（本地模型 preferLocal）
 * 3. 安全审查 → 内容过滤 → 降级策略
 * 4. 错误恢复与降级链路
 * 5. 并发请求安全
 */

const express = require('express');
const request = require('supertest');

// ============================================================
// Mock — localModelManager
// ============================================================

const EventEmitter = require('events');
const mockModelManager = new EventEmitter();

const MODEL_REGISTRY = {
    'qwen3-0.6b': {
        id: 'qwen3-0.6b', name: 'Qwen3-0.6B', type: 'generation',
        runtime: 'node-llama-cpp', sizeDisplay: '~462 MB', format: 'gguf'
    },
    'tiny-toxic-detector': {
        id: 'tiny-toxic-detector', name: 'Tiny-Toxic-Detector', type: 'classification',
        runtime: 'transformers.js', sizeDisplay: '~10 MB', format: 'onnx'
    }
};

let mockModelStates = {
    'qwen3-0.6b': 'not_downloaded',
    'tiny-toxic-detector': 'not_downloaded'
};

mockModelManager.getRegistry = jest.fn(() => ({ ...MODEL_REGISTRY }));
mockModelManager.getModelInfo = jest.fn((id) => MODEL_REGISTRY[id] || null);
mockModelManager.getStatus = jest.fn(() => {
    const status = {};
    for (const [id, reg] of Object.entries(MODEL_REGISTRY)) {
        status[id] = { ...reg, status: mockModelStates[id] };
    }
    return status;
});
mockModelManager.getModelStatus = jest.fn((id) => {
    if (!MODEL_REGISTRY[id]) return null;
    return { ...MODEL_REGISTRY[id], status: mockModelStates[id] };
});
mockModelManager.getRuntimeStatus = jest.fn(() => ({
    engines: { 'node-llama-cpp': true, 'transformers.js': true },
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    cpus: 8,
    totalMemory: '16.0 GB',
    freeMemory: '8.0 GB'
}));
mockModelManager.getMemoryUsage = jest.fn(() => ({
    rss: 100 * 1024 * 1024,
    heapUsed: 60 * 1024 * 1024,
    heapTotal: 80 * 1024 * 1024,
    external: 5 * 1024 * 1024,
    rssFormatted: '100.0 MB',
    heapUsedFormatted: '60.0 MB',
    heapTotalFormatted: '80.0 MB',
    externalFormatted: '5.0 MB',
    loadedModels: [],
    totalLoaded: 0
}));
mockModelManager.isAvailable = jest.fn((id) => mockModelStates[id] === 'ready');
mockModelManager.isGenerationAvailable = jest.fn(() => mockModelStates['qwen3-0.6b'] === 'ready');
mockModelManager.isSafetyAvailable = jest.fn(() => mockModelStates['tiny-toxic-detector'] === 'ready');
mockModelManager.scanModels = jest.fn(() => ({
    modelsDir: '/mock/models',
    found: [{ file: 'qwen3-0.6b-q4_k_m.gguf', size: 462 * 1024 * 1024, matchedModel: 'qwen3-0.6b' }],
    totalFiles: 1
}));
mockModelManager.importModel = jest.fn(async (modelId) => {
    mockModelStates[modelId] = 'downloaded';
    return '/mock/models/qwen3-0.6b-q4_k_m.gguf';
});
mockModelManager.downloadModel = jest.fn(async (modelId) => {
    mockModelStates[modelId] = 'downloaded';
    return '/mock/models/downloaded';
});
mockModelManager.loadModel = jest.fn(async (modelId) => {
    mockModelStates[modelId] = 'ready';
});
mockModelManager.unloadModel = jest.fn(async (modelId) => {
    mockModelStates[modelId] = 'downloaded';
});
mockModelManager.deleteModel = jest.fn(async (modelId) => {
    mockModelStates[modelId] = 'not_downloaded';
});
mockModelManager.generate = jest.fn(async () =>
    'A minimalist logo design featuring clean lines, modern typography, warm color palette --ar 1:1'
);
mockModelManager.classify = jest.fn(async () => ({
    label: 'non_toxic', score: 0.98, isToxic: false, confidence: 0.98
}));

jest.mock('../../services/localModelManager', () => mockModelManager);

// ============================================================
// Mock — improverService（通过 getImproverService 工厂）
// ============================================================

const mockImproveWithAI = jest.fn();
const mockAnalyze = jest.fn().mockReturnValue({
    totalScore: 65,
    dimensions: { clarity: 7, specificity: 6, structure: 6, completeness: 7, creativity: 6 }
});
const mockImprove = jest.fn();
const mockGetTips = jest.fn();

jest.mock('../../services/improverService', () => ({
    getImproverService: () => ({
        improveWithAI: mockImproveWithAI,
        analyze: mockAnalyze,
        improve: mockImprove,
        getTips: mockGetTips,
    }),
}));

// ============================================================
// Mock — 其他 prompts.js 依赖
// ============================================================

jest.mock('../../utils/promptGenerator', () => jest.fn().mockImplementation(() => ({
    generate: jest.fn(),
})));

jest.mock('../../utils/promptBuilder', () => ({
    builder: jest.fn(() => ({ build: jest.fn() })),
    PromptBuilder: jest.fn(),
    fromPrompt: jest.fn(),
}));

jest.mock('../../utils/variableParser', () => ({
    VariableParser: jest.fn(),
    VariableTypes: {},
    variable: jest.fn(),
}));

jest.mock('../../services/categoryService', () => ({
    getCategoryService: () => ({
        getAll: jest.fn().mockReturnValue([]),
        search: jest.fn().mockReturnValue([]),
    }),
}));

jest.mock('../../services/presetService', () => ({
    getPresetService: () => ({
        getAll: jest.fn().mockReturnValue([]),
    }),
}));

jest.mock('../../services/promptCompressorService', () => ({
    promptCompressor: { compress: jest.fn(), getStats: jest.fn() },
    CompressionLevel: { LIGHT: 'light', MEDIUM: 'medium', HEAVY: 'heavy' },
}));

jest.mock('../../utils/imagePromptBuilder', () => ({
    ImagePromptBuilder: jest.fn(), imageBuilder: jest.fn(),
    getStyles: jest.fn().mockReturnValue([]), getArtists: jest.fn().mockReturnValue([]),
    getLighting: jest.fn().mockReturnValue([]), getCamera: jest.fn().mockReturnValue([]),
    getMoods: jest.fn().mockReturnValue([]), getColorSchemes: jest.fn().mockReturnValue([]),
    getPlatforms: jest.fn().mockReturnValue([]), getNegativePresets: jest.fn().mockReturnValue([]),
}));

// Mock safetyService
const mockSafetyCheck = jest.fn();
jest.mock('../../services/safetyService', () => ({
    check: mockSafetyCheck,
    getConfig: jest.fn().mockReturnValue({ enabled: true }),
    updateConfig: jest.fn(),
    getStats: jest.fn().mockReturnValue({ totalChecks: 0, blocked: 0, warned: 0, passed: 0 }),
    resetStats: jest.fn(),
    config: { enabled: true }
}));

// ============================================================
// 加载路由
// ============================================================

const modelsRouter = require('../../routes/models');
const promptsRouter = require('../../routes/prompts');
const safetyRouter = require('../../routes/safety');

function createApp() {
    const app = express();
    app.use(express.json());
    app.use('/api/models', modelsRouter);
    app.use('/api/prompts', promptsRouter);
    app.use('/api/safety', safetyRouter);
    return app;
}

// ============================================================
// E2E 测试套件
// ============================================================

describe('Phase 17 — E2E 工作流集成测试', () => {
    let app;

    beforeAll(() => {
        app = createApp();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        // 重置模型状态
        mockModelStates = {
            'qwen3-0.6b': 'not_downloaded',
            'tiny-toxic-detector': 'not_downloaded'
        };
    });

    // ================================================================
    // 1. 模型完整生命周期
    // ================================================================

    describe('1. 模型完整生命周期', () => {

        test('扫描 → 导入 → 加载 → 生成 → 卸载 → 删除', async () => {
            // Step 1: 扫描
            const scanRes = await request(app).post('/api/models/scan');
            expect(scanRes.status).toBe(200);
            expect(scanRes.body.data.found.length).toBeGreaterThan(0);

            // Step 2: 导入
            const importRes = await request(app)
                .post('/api/models/qwen3-0.6b/import')
                .send({ sourcePath: '/mock/external/model.gguf', move: false });
            expect(importRes.status).toBe(200);
            expect(mockModelManager.importModel).toHaveBeenCalledWith(
                'qwen3-0.6b',
                '/mock/external/model.gguf',
                { move: false }
            );

            // Step 3: 加载
            const loadRes = await request(app).post('/api/models/qwen3-0.6b/load');
            expect(loadRes.status).toBe(200);
            expect(mockModelManager.loadModel).toHaveBeenCalledWith('qwen3-0.6b');

            // Step 4: 生成测试
            const genRes = await request(app)
                .post('/api/models/test/generate')
                .send({ prompt: '设计一个咖啡馆logo' });
            expect(genRes.status).toBe(200);
            expect(genRes.body.data.result).toBeTruthy();

            // Step 5: 卸载
            const unloadRes = await request(app).post('/api/models/qwen3-0.6b/unload');
            expect(unloadRes.status).toBe(200);
            expect(mockModelManager.unloadModel).toHaveBeenCalledWith('qwen3-0.6b');

            // Step 6: 删除
            const delRes = await request(app).delete('/api/models/qwen3-0.6b');
            expect(delRes.status).toBe(200);
            expect(mockModelManager.deleteModel).toHaveBeenCalledWith('qwen3-0.6b');
        });

        test('获取状态应反映当前生命周期阶段', async () => {
            // 初始状态
            const res1 = await request(app).get('/api/models/status');
            expect(res1.body.data.models['qwen3-0.6b'].status).toBe('not_downloaded');

            // 加载后
            mockModelStates['qwen3-0.6b'] = 'ready';
            const res2 = await request(app).get('/api/models/status');
            expect(res2.body.data.models['qwen3-0.6b'].status).toBe('ready');
        });

        test('运行时状态应返回完整系统信息', async () => {
            const res = await request(app).get('/api/models/status');
            expect(res.body.data.runtime).toHaveProperty('engines');
            expect(res.body.data.runtime).toHaveProperty('nodeVersion');
            expect(res.body.data.runtime).toHaveProperty('platform');
            expect(res.body.data.runtime).toHaveProperty('arch');
        });

        test('内存信息应包含格式化和原始值', async () => {
            const res = await request(app).get('/api/models/status');
            const mem = res.body.data.memory;
            expect(mem).toHaveProperty('rssFormatted');
            expect(mem).toHaveProperty('heapUsedFormatted');
            expect(mem).toHaveProperty('loadedModels');
            expect(mem).toHaveProperty('totalLoaded');
        });
    });

    // ================================================================
    // 2. 设计助手 AI 优化流程
    // ================================================================

    describe('2. 设计助手 AI 优化（preferLocal）', () => {

        test('preferLocal=true 应传递到 improveWithAI', async () => {
            mockImproveWithAI.mockResolvedValue({
                original: '设计logo',
                improved: 'A minimalist logo design...',
                content: 'A minimalist logo design...',
                source: 'local',
                model: 'qwen3-0.6b'
            });

            const res = await request(app)
                .post('/api/prompts/improve/ai')
                .send({
                    prompt: '设计一个简约的咖啡馆logo',
                    systemPrompt: '你是设计专家...',
                    config: {},
                    preferLocal: true,
                    fallbackToLocal: true
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.source).toBe('local');
            expect(mockImproveWithAI).toHaveBeenCalledWith(
                '设计一个简约的咖啡馆logo',
                {},
                '你是设计专家...',
                { preferLocal: true, fallbackToLocal: true }
            );
        });

        test('本地模型成功应返回 source=local', async () => {
            mockImproveWithAI.mockResolvedValue({
                original: 'test',
                improved: 'result',
                content: 'result',
                source: 'local',
                model: 'qwen3-0.6b'
            });

            const res = await request(app)
                .post('/api/prompts/improve/ai')
                .send({ prompt: 'test', preferLocal: true });

            expect(res.body.data.source).toBe('local');
            expect(res.body.data.model).toBe('qwen3-0.6b');
        });

        test('外部 API 失败 → fallback 到本地模型', async () => {
            mockImproveWithAI.mockResolvedValue({
                original: 'test',
                improved: 'fallback result',
                content: 'fallback result',
                source: 'local',
                fallback: true,
                apiError: 'API timeout'
            });

            const res = await request(app)
                .post('/api/prompts/improve/ai')
                .send({
                    prompt: 'test',
                    config: { baseUrl: 'http://bad-api', model: 'test' },
                    preferLocal: false,
                    fallbackToLocal: true
                });

            expect(res.body.data.source).toBe('local');
            expect(res.body.data.fallback).toBe(true);
        });

        test('AI 完全失败应返回 500', async () => {
            mockImproveWithAI.mockRejectedValue(new Error('所有模型不可用'));

            const res = await request(app)
                .post('/api/prompts/improve/ai')
                .send({ prompt: 'test' });

            expect(res.status).toBe(500);
            expect(res.body.success).toBe(false);
            expect(res.body.error.code).toBe('AI_IMPROVE_ERROR');
        });
    });

    // ================================================================
    // 3. 安全审查流程
    // ================================================================

    describe('3. 安全审查流程', () => {

        test('安全内容应通过审查', async () => {
            mockSafetyCheck.mockReturnValue({
                action: 'PASS',
                level: 'safe',
                categories: [],
                details: '内容安全'
            });

            const res = await request(app)
                .post('/api/safety/check')
                .send({ text: '设计一个可爱的卡通logo' });

            expect(res.status).toBe(200);
            expect(res.body.data.action).toBe('PASS');
        });

        test('危险内容应被阻止', async () => {
            mockSafetyCheck.mockReturnValue({
                action: 'BLOCK',
                level: 'dangerous',
                categories: ['violence'],
                details: '包含暴力内容'
            });

            const res = await request(app)
                .post('/api/safety/check')
                .send({ text: '暴力内容测试' });

            expect(res.status).toBe(200);
            expect(res.body.data.action).toBe('BLOCK');
        });

        test('可疑内容应发出警告', async () => {
            mockSafetyCheck.mockReturnValue({
                action: 'WARN',
                level: 'suspicious',
                categories: ['borderline'],
                details: '内容存疑'
            });

            const res = await request(app)
                .post('/api/safety/check')
                .send({ text: '边界测试' });

            expect(res.body.data.action).toBe('WARN');
        });
    });

    // ================================================================
    // 4. 错误恢复与降级
    // ================================================================

    describe('4. 错误恢复与降级', () => {

        test('模型加载失败应返回可读错误', async () => {
            mockModelManager.loadModel.mockRejectedValueOnce(
                new Error('模型文件不存在: models/qwen3-0.6b-q4_k_m.gguf')
            );

            const res = await request(app).post('/api/models/qwen3-0.6b/load');
            expect(res.status).toBe(500);
            expect(res.body.error.message).toContain('模型文件不存在');
        });

        test('生成失败应返回错误而不崩溃', async () => {
            mockModelManager.isAvailable.mockReturnValue(true);
            mockModelManager.isGenerationAvailable.mockReturnValue(true);
            mockModelManager.generate.mockRejectedValueOnce(
                new Error('本地模型生成失败: context overflow')
            );

            const res = await request(app)
                .post('/api/models/test/generate')
                .send({ prompt: '超长提示词'.repeat(1000) });

            expect(res.status).toBe(500);
            expect(res.body.success).toBe(false);
        });

        test('分类模型按需加载失败时应降级', async () => {
            mockModelManager.isAvailable.mockReturnValueOnce(false);
            mockModelManager.classify.mockRejectedValueOnce(
                new Error('分类模型未加载且按需加载失败: fetch failed')
            );

            const res = await request(app)
                .post('/api/models/test/classify')
                .send({ text: '测试文本' });

            expect(res.status).toBe(500);
            expect(res.body.success).toBe(false);
        });

        test('导入不存在的模型 ID 应返回 404', async () => {
            const res = await request(app)
                .post('/api/models/nonexistent/import')
                .send({ sourcePath: '/test/path' });

            expect(res.status).toBe(404);
        });

        test('缺少 prompt 的 AI 改进请求应返回 400', async () => {
            const res = await request(app)
                .post('/api/prompts/improve/ai')
                .send({ config: {} });

            expect(res.status).toBe(400);
            expect(res.body.error.code).toBe('MISSING_PROMPT');
        });

        test('空字符串 prompt 应返回 400', async () => {
            const res = await request(app)
                .post('/api/prompts/improve/ai')
                .send({ prompt: '' });

            expect(res.status).toBe(400);
        });
    });

    // ================================================================
    // 5. 并发请求安全
    // ================================================================

    describe('5. 并发请求安全', () => {

        test('并发状态查询不应互相干扰', async () => {
            const promises = Array.from({ length: 10 }, () =>
                request(app).get('/api/models/status')
            );

            const results = await Promise.all(promises);
            results.forEach(res => {
                expect(res.status).toBe(200);
                expect(res.body.success).toBe(true);
            });
        });

        test('并发 AI 优化请求应各自独立处理', async () => {
            let callCount = 0;
            mockImproveWithAI.mockImplementation(async (prompt) => {
                callCount++;
                return {
                    original: prompt,
                    improved: `result-${callCount}`,
                    content: `result-${callCount}`,
                    source: 'local'
                };
            });

            const prompts = ['logo设计', '海报设计', '图标设计', 'UI设计', '插画设计'];
            const promises = prompts.map(p =>
                request(app)
                    .post('/api/prompts/improve/ai')
                    .send({ prompt: p, preferLocal: true })
            );

            const results = await Promise.all(promises);
            results.forEach(res => {
                expect(res.status).toBe(200);
                expect(res.body.success).toBe(true);
            });
            expect(mockImproveWithAI).toHaveBeenCalledTimes(5);
        });

        test('并发安全审查不应遗漏', async () => {
            mockSafetyCheck.mockReturnValue({ action: 'PASS', level: 'safe' });

            const promises = Array.from({ length: 8 }, (_, i) =>
                request(app)
                    .post('/api/safety/check')
                    .send({ text: `安全内容 ${i}` })
            );

            const results = await Promise.all(promises);
            results.forEach(res => {
                expect(res.status).toBe(200);
                expect(res.body.data.action).toBe('PASS');
            });
            expect(mockSafetyCheck).toHaveBeenCalledTimes(8);
        });
    });

    // ================================================================
    // 6. 跨模块联动
    // ================================================================

    describe('6. 跨模块联动', () => {

        test('模型状态 + AI 改进应协同工作', async () => {
            // 查询状态
            const statusRes = await request(app).get('/api/models/status');
            expect(statusRes.status).toBe(200);

            // 同时执行 AI 改进
            mockImproveWithAI.mockResolvedValue({
                original: 'test', improved: 'result', content: 'result', source: 'local'
            });

            const aiRes = await request(app)
                .post('/api/prompts/improve/ai')
                .send({ prompt: 'test', preferLocal: true });

            expect(aiRes.status).toBe(200);
        });

        test('安全审查 + AI 改进请求可以同时处理', async () => {
            mockSafetyCheck.mockReturnValue({ action: 'PASS', level: 'safe' });
            mockImproveWithAI.mockResolvedValue({
                original: 'x', improved: 'y', content: 'y', source: 'local'
            });

            const [safetyRes, aiRes] = await Promise.all([
                request(app).post('/api/safety/check').send({ text: '安全内容' }),
                request(app).post('/api/prompts/improve/ai').send({ prompt: '设计logo', preferLocal: true })
            ]);

            expect(safetyRes.status).toBe(200);
            expect(aiRes.status).toBe(200);
        });
    });
});
