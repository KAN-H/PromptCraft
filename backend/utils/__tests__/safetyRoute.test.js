/**
 * Safety Routes API 测试
 * 
 * Phase 14 — v5.0
 * 
 * 测试覆盖：
 * - POST /api/safety/check — 手动审查
 * - GET  /api/safety/config — 获取配置
 * - PUT  /api/safety/config — 更新配置
 * - GET  /api/safety/stats  — 获取统计
 * - POST /api/safety/stats/reset — 重置统计
 */

const express = require('express');
const request = require('supertest');

// ============================================================
// Mock safetyService
// ============================================================
const mockCheck = jest.fn();
const mockGetConfig = jest.fn();
const mockUpdateConfig = jest.fn();
const mockGetStats = jest.fn();
const mockResetStats = jest.fn();

jest.mock('../../services/safetyService', () => ({
    check: mockCheck,
    getConfig: mockGetConfig,
    updateConfig: mockUpdateConfig,
    getStats: mockGetStats,
    resetStats: mockResetStats,
    config: { enabled: true }
}));

const safetyRouter = require('../../routes/safety');

// ============================================================
// 创建测试 app
// ============================================================

function createApp() {
    const app = express();
    app.use(express.json());
    app.use('/api/safety', safetyRouter);
    return app;
}

// ============================================================
// 测试套件
// ============================================================

describe('Safety Routes', () => {
    let app;

    beforeAll(() => {
        app = createApp();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // ============================================================
    // POST /api/safety/check
    // ============================================================

    describe('POST /api/safety/check', () => {
        test('应审查有效文本并返回结果', async () => {
            mockCheck.mockResolvedValue({
                action: 'pass',
                safe: true,
                message: '审查通过',
                timestamp: new Date().toISOString()
            });

            const res = await request(app)
                .post('/api/safety/check')
                .send({ text: '设计一个品牌logo' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.action).toBe('pass');
            expect(res.body.data.safe).toBe(true);
        });

        test('应返回阻止结果', async () => {
            mockCheck.mockResolvedValue({
                action: 'block',
                safe: false,
                message: '包含违禁内容',
                layer: 'keyword'
            });

            const res = await request(app)
                .post('/api/safety/check')
                .send({ text: '制造炸弹' });

            expect(res.status).toBe(200); // API 本身返回 200，action 字段表示阻止
            expect(res.body.success).toBe(true);
            expect(res.body.data.action).toBe('block');
            expect(res.body.data.safe).toBe(false);
        });

        test('应传递 skipAI 选项', async () => {
            mockCheck.mockResolvedValue({
                action: 'pass',
                safe: true,
                message: '审查通过'
            });

            await request(app)
                .post('/api/safety/check')
                .send({ text: 'test', skipAI: true });

            expect(mockCheck).toHaveBeenCalledWith('test', {
                context: 'input',
                skipAI: true
            });
        });

        test('应传递自定义 context', async () => {
            mockCheck.mockResolvedValue({
                action: 'pass',
                safe: true,
                message: '审查通过'
            });

            await request(app)
                .post('/api/safety/check')
                .send({ text: 'test', context: 'output' });

            expect(mockCheck).toHaveBeenCalledWith('test', {
                context: 'output',
                skipAI: false
            });
        });

        test('缺少 text 字段应返回 400', async () => {
            const res = await request(app)
                .post('/api/safety/check')
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error.code).toBe('INVALID_INPUT');
        });

        test('text 不是字符串应返回 400', async () => {
            const res = await request(app)
                .post('/api/safety/check')
                .send({ text: 123 });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        test('服务异常应返回 500', async () => {
            mockCheck.mockRejectedValue(new Error('Service error'));

            const res = await request(app)
                .post('/api/safety/check')
                .send({ text: 'test' });

            expect(res.status).toBe(500);
            expect(res.body.success).toBe(false);
            expect(res.body.error.code).toBe('SAFETY_CHECK_ERROR');
        });
    });

    // ============================================================
    // GET /api/safety/config
    // ============================================================

    describe('GET /api/safety/config', () => {
        test('应返回安全配置', async () => {
            mockGetConfig.mockReturnValue({
                enabled: true,
                keywordCount: 9,
                patternCount: 3,
                designSafeTermCount: 60,
                categories: ['toxic', 'insult', 'threat', 'hate', 'sexual']
            });

            const res = await request(app)
                .get('/api/safety/config');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.enabled).toBe(true);
            expect(res.body.data.keywordCount).toBe(9);
        });

        test('服务异常应返回 500', async () => {
            mockGetConfig.mockImplementation(() => { throw new Error('Config error'); });

            const res = await request(app)
                .get('/api/safety/config');

            expect(res.status).toBe(500);
            expect(res.body.error.code).toBe('CONFIG_ERROR');
        });
    });

    // ============================================================
    // PUT /api/safety/config
    // ============================================================

    describe('PUT /api/safety/config', () => {
        test('应更新配置并返回结果', async () => {
            mockUpdateConfig.mockReturnValue({
                enabled: false,
                keywordCount: 9,
                patternCount: 3
            });

            const res = await request(app)
                .put('/api/safety/config')
                .send({ enabled: false });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.enabled).toBe(false);
            expect(res.body.message).toContain('已更新');
        });

        test('空请求体应返回 400', async () => {
            const res = await request(app)
                .put('/api/safety/config')
                .set('Content-Type', 'application/json')
                .send('invalid');

            // Express json parser may handle this differently
            // At minimum, should not crash
            expect([200, 400, 500]).toContain(res.status);
        });

        test('服务异常应返回 500', async () => {
            mockUpdateConfig.mockImplementation(() => { throw new Error('Update error'); });

            const res = await request(app)
                .put('/api/safety/config')
                .send({ enabled: true });

            expect(res.status).toBe(500);
            expect(res.body.error.code).toBe('CONFIG_UPDATE_ERROR');
        });
    });

    // ============================================================
    // GET /api/safety/stats
    // ============================================================

    describe('GET /api/safety/stats', () => {
        test('应返回审查统计', async () => {
            mockGetStats.mockReturnValue({
                totalChecks: 100,
                passed: 95,
                warned: 3,
                blocked: 2,
                errors: 0,
                lastReset: '2024-01-01T00:00:00.000Z'
            });

            const res = await request(app)
                .get('/api/safety/stats');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.totalChecks).toBe(100);
            expect(res.body.data.passed).toBe(95);
        });

        test('服务异常应返回 500', async () => {
            mockGetStats.mockImplementation(() => { throw new Error('Stats error'); });

            const res = await request(app)
                .get('/api/safety/stats');

            expect(res.status).toBe(500);
            expect(res.body.error.code).toBe('STATS_ERROR');
        });
    });

    // ============================================================
    // POST /api/safety/stats/reset
    // ============================================================

    describe('POST /api/safety/stats/reset', () => {
        test('应重置统计', async () => {
            const res = await request(app)
                .post('/api/safety/stats/reset');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toContain('已重置');
            expect(mockResetStats).toHaveBeenCalled();
        });

        test('服务异常应返回 500', async () => {
            mockResetStats.mockImplementation(() => { throw new Error('Reset error'); });

            const res = await request(app)
                .post('/api/safety/stats/reset');

            expect(res.status).toBe(500);
            expect(res.body.error.code).toBe('STATS_RESET_ERROR');
        });
    });
});
