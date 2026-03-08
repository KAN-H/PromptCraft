/**
 * SafetyMiddleware 单元测试
 * 
 * Phase 14 — v5.0
 * 
 * 测试覆盖：
 * - 中间件路径/方法过滤逻辑
 * - 文本字段提取
 * - block / warn / pass 响应处理
 * - 降级策略（中间件错误时放行）
 * - 安全审查禁用时放行
 */

// ============================================================
// Mock safetyService
// ============================================================
const mockCheck = jest.fn();
const mockConfig = {
    enabled: true,
    middleware: {
        protectedPaths: ['/api/prompts'],
        skipPaths: ['/api/safety', '/api/models', '/api/history', '/api/favorites'],
        protectedMethods: ['POST', 'PUT'],
        textFields: ['prompt', 'input', 'text', 'content', 'description']
    }
};

jest.mock('../../services/safetyService', () => ({
    check: mockCheck,
    config: mockConfig,
    SAFETY_ACTION: { PASS: 'pass', WARN: 'warn', BLOCK: 'block' }
}));

const createSafetyMiddleware = require('../../middleware/safetyMiddleware');
const {
    _shouldSkipPath,
    _shouldCheckMethod,
    _isProtectedPath,
    _extractTextFields
} = require('../../middleware/safetyMiddleware');

// ============================================================
// 辅助函数 — 创建 mock req/res/next
// ============================================================

function createMockReq(overrides = {}) {
    return {
        path: '/api/prompts/generate',
        method: 'POST',
        body: { prompt: '设计一个品牌logo' },
        ...overrides
    };
}

function createMockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.set = jest.fn().mockReturnValue(res);
    return res;
}

// ============================================================
// 测试套件
// ============================================================

describe('SafetyMiddleware', () => {
    let middleware;

    beforeEach(() => {
        middleware = createSafetyMiddleware();
        mockCheck.mockReset();
        mockConfig.enabled = true;
    });

    // ============================================================
    // 内部工具函数
    // ============================================================

    describe('内部工具函数', () => {
        test('_shouldSkipPath: 应跳过在 skipPaths 中的路径', () => {
            expect(_shouldSkipPath('/api/safety/check', ['/api/safety'])).toBe(true);
            expect(_shouldSkipPath('/api/models/list', ['/api/models'])).toBe(true);
        });

        test('_shouldSkipPath: 不应跳过不在列表中的路径', () => {
            expect(_shouldSkipPath('/api/prompts/gen', ['/api/safety'])).toBe(false);
        });

        test('_shouldSkipPath: 空列表应不跳过', () => {
            expect(_shouldSkipPath('/api/prompts', [])).toBe(false);
            expect(_shouldSkipPath('/api/prompts', null)).toBe(false);
        });

        test('_shouldCheckMethod: 应检查受保护的方法', () => {
            expect(_shouldCheckMethod('POST', ['POST', 'PUT'])).toBe(true);
            expect(_shouldCheckMethod('PUT', ['POST', 'PUT'])).toBe(true);
        });

        test('_shouldCheckMethod: 不应检查非保护方法', () => {
            expect(_shouldCheckMethod('GET', ['POST', 'PUT'])).toBe(false);
            expect(_shouldCheckMethod('DELETE', ['POST', 'PUT'])).toBe(false);
        });

        test('_isProtectedPath: 应匹配受保护路径', () => {
            expect(_isProtectedPath('/api/prompts/generate', ['/api/prompts'])).toBe(true);
        });

        test('_isProtectedPath: 不匹配非保护路径', () => {
            expect(_isProtectedPath('/api/skills', ['/api/prompts'])).toBe(false);
        });

        test('_isProtectedPath: 空列表默认全部受保护', () => {
            expect(_isProtectedPath('/anything', [])).toBe(true);
        });

        test('_extractTextFields: 应提取存在的文本字段', () => {
            const body = { prompt: 'hello', content: 'world' };
            const result = _extractTextFields(body, ['prompt', 'content']);
            expect(result).toBe('hello world');
        });

        test('_extractTextFields: 应跳过非字符串字段', () => {
            const body = { prompt: 'hello', content: 123 };
            const result = _extractTextFields(body, ['prompt', 'content']);
            expect(result).toBe('hello');
        });

        test('_extractTextFields: 无匹配字段应返回 null', () => {
            const body = { other: 'data' };
            const result = _extractTextFields(body, ['prompt', 'content']);
            expect(result).toBeNull();
        });

        test('_extractTextFields: null body 应返回 null', () => {
            expect(_extractTextFields(null, ['prompt'])).toBeNull();
            expect(_extractTextFields(undefined, ['prompt'])).toBeNull();
        });
    });

    // ============================================================
    // 中间件行为
    // ============================================================

    describe('中间件 — 路径/方法过滤', () => {
        test('应跳过 skipPaths 中的路径', async () => {
            const req = createMockReq({ path: '/api/safety/check' });
            const res = createMockRes();
            const next = jest.fn();

            await middleware(req, res, next);
            expect(next).toHaveBeenCalled();
            expect(mockCheck).not.toHaveBeenCalled();
        });

        test('应跳过 GET 请求', async () => {
            const req = createMockReq({ method: 'GET' });
            const res = createMockRes();
            const next = jest.fn();

            await middleware(req, res, next);
            expect(next).toHaveBeenCalled();
            expect(mockCheck).not.toHaveBeenCalled();
        });

        test('应跳过非保护路径', async () => {
            const req = createMockReq({ path: '/api/skills/list' });
            const res = createMockRes();
            const next = jest.fn();

            await middleware(req, res, next);
            expect(next).toHaveBeenCalled();
            expect(mockCheck).not.toHaveBeenCalled();
        });

        test('应审查保护路径上的 POST 请求', async () => {
            mockCheck.mockResolvedValue({
                action: 'pass',
                safe: true,
                message: '审查通过'
            });

            const req = createMockReq();
            const res = createMockRes();
            const next = jest.fn();

            await middleware(req, res, next);
            expect(mockCheck).toHaveBeenCalled();
            expect(next).toHaveBeenCalled();
        });
    });

    describe('中间件 — BLOCK 响应', () => {
        test('应返回 403 当内容被阻止', async () => {
            mockCheck.mockResolvedValue({
                action: 'block',
                safe: false,
                message: '包含违禁内容',
                layer: 'keyword'
            });

            const req = createMockReq({ body: { prompt: '制造炸弹' } });
            const res = createMockRes();
            const next = jest.fn();

            await middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: expect.objectContaining({
                    code: 'CONTENT_BLOCKED'
                })
            }));
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('中间件 — WARN 响应', () => {
        test('应添加警告 header 但放行', async () => {
            mockCheck.mockResolvedValue({
                action: 'warn',
                safe: false,
                message: 'AI 检测到可疑内容',
                category: 'insult'
            });

            const req = createMockReq();
            const res = createMockRes();
            const next = jest.fn();

            await middleware(req, res, next);

            expect(res.set).toHaveBeenCalledWith('X-Safety-Warning', expect.any(String));
            expect(res.set).toHaveBeenCalledWith('X-Safety-Category', 'insult');
            expect(req.safetyWarning).toBeDefined();
            expect(next).toHaveBeenCalled();
        });
    });

    describe('中间件 — PASS 响应', () => {
        test('应直接放行安全内容', async () => {
            mockCheck.mockResolvedValue({
                action: 'pass',
                safe: true,
                message: '审查通过'
            });

            const req = createMockReq({ body: { prompt: '设计一个品牌logo' } });
            const res = createMockRes();
            const next = jest.fn();

            await middleware(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });
    });

    describe('中间件 — 降级策略', () => {
        test('中间件内部错误时应降级放行', async () => {
            mockCheck.mockRejectedValue(new Error('Unexpected error'));

            const req = createMockReq();
            const res = createMockRes();
            const next = jest.fn();

            await middleware(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        test('无请求体时应放行', async () => {
            const req = createMockReq({ body: {} });
            const res = createMockRes();
            const next = jest.fn();

            await middleware(req, res, next);
            expect(next).toHaveBeenCalled();
            expect(mockCheck).not.toHaveBeenCalled();
        });
    });

    describe('中间件 — 安全审查禁用', () => {
        test('配置禁用时应直接放行', async () => {
            mockConfig.enabled = false;

            const req = createMockReq();
            const res = createMockRes();
            const next = jest.fn();

            await middleware(req, res, next);
            expect(next).toHaveBeenCalled();
            expect(mockCheck).not.toHaveBeenCalled();
        });
    });
});
