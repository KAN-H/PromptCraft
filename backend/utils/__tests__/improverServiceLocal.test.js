/**
 * ImproverService 本地模型降级测试
 * 
 * Phase 15 — 测试 improveWithAI 降级、improveLocal、_improveWithLocalModel
 */

const { ImproverService } = require('../../services/improverService');
const llmService = require('../../services/llmService');
const localModelManager = require('../../services/localModelManager');

describe('ImproverService - Phase 15 本地模型降级', () => {

    let service;

    beforeAll(() => {
        service = new ImproverService();
        // 禁用 llmService 的重试和速率限制
        llmService.rateLimitConfig.maxRetries = 0;
        llmService.rateLimitConfig.minInterval = 0;
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // ============================================================
    // improveWithAI() — 降级行为
    // ============================================================

    describe('improveWithAI() 降级行为', () => {

        test('API 成功时应返回 source=api', async () => {
            jest.spyOn(global, 'fetch').mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    choices: [{
                        message: {
                            content: '【改进后的提示词】\n改进后的版本\n\n【改进说明】\n增加了具体性'
                        }
                    }]
                })
            });

            const result = await service.improveWithAI(
                '帮我写个Logo设计提示词',
                { baseUrl: 'http://localhost:11434/v1', model: 'test-model' }
            );

            expect(result.source).toBe('api');
            expect(result.improved).toBe('改进后的版本');
            expect(result.fallback).toBeUndefined();
        });

        test('API 失败、本地模型可用时应降级并返回 source=local', async () => {
            jest.spyOn(global, 'fetch').mockRejectedValue(new Error('连接被拒绝'));
            jest.spyOn(localModelManager, 'isGenerationAvailable').mockReturnValue(true);
            jest.spyOn(localModelManager, 'generate').mockResolvedValue(
                '【改进后的提示词】\n本地模型改进的版本\n\n【改进说明】\n由本地模型改进'
            );

            const result = await service.improveWithAI(
                '帮我写个Logo设计提示词',
                { baseUrl: 'http://localhost:11434/v1', model: 'test-model' },
                null,
                { fallbackToLocal: true }
            );

            expect(result.source).toBe('local');
            expect(result.model).toBe('qwen3-0.6b');
            expect(result.improved).toContain('本地模型改进的版本');
        });

        test('fallbackToLocal=false 时 API 失败应直接抛出错误', async () => {
            jest.spyOn(global, 'fetch').mockRejectedValue(new Error('API 错误'));
            jest.spyOn(localModelManager, 'isGenerationAvailable').mockReturnValue(true);

            await expect(
                service.improveWithAI(
                    '帮我写个提示词',
                    { baseUrl: 'http://localhost:11434/v1', model: 'test-model' },
                    null,
                    { fallbackToLocal: false }
                )
            ).rejects.toThrow();
        });

        test('自定义 systemPrompt + API 成功时应直接返回响应', async () => {
            jest.spyOn(global, 'fetch').mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    choices: [{ message: { content: '自定义提示词生成的结果' } }]
                })
            });

            const result = await service.improveWithAI(
                '用户输入',
                { baseUrl: 'http://localhost:11434/v1', model: 'test-model' },
                '你是一个Logo设计专家'
            );

            expect(result.improved).toBe('自定义提示词生成的结果');
            expect(result.source).toBe('api');
        });

        test('自定义 systemPrompt + 降级到本地模型应正确返回', async () => {
            jest.spyOn(global, 'fetch').mockRejectedValue(new Error('网络错误'));
            jest.spyOn(localModelManager, 'isGenerationAvailable').mockReturnValue(true);
            jest.spyOn(localModelManager, 'generate').mockResolvedValue('本地生成的设计提示词');

            const result = await service.improveWithAI(
                '用户输入',
                { baseUrl: 'http://localhost:11434/v1', model: 'test-model' },
                '你是一个Logo设计专家',
                { fallbackToLocal: true }
            );

            expect(result.improved).toBe('本地生成的设计提示词');
            expect(result.source).toBe('local');
        });
    });

    // ============================================================
    // improveWithAI() — preferLocal 模式
    // ============================================================

    describe('improveWithAI() preferLocal 模式', () => {

        test('preferLocal=true 且本地模型可用时应直接使用本地模型', async () => {
            const fetchSpy = jest.spyOn(global, 'fetch');
            jest.spyOn(localModelManager, 'isGenerationAvailable').mockReturnValue(true);
            jest.spyOn(localModelManager, 'generate').mockResolvedValue(
                '【改进后的提示词】\n本地优先的结果\n\n【改进说明】\n本地模型直接处理'
            );

            const result = await service.improveWithAI(
                '帮我写个提示词',
                { baseUrl: 'http://localhost:11434/v1', model: 'test-model' },
                null,
                { preferLocal: true }
            );

            // 不应调用外部 API
            expect(fetchSpy).not.toHaveBeenCalled();
            expect(result.source).toBe('local');
            expect(result.model).toBe('qwen3-0.6b');
        });

        test('preferLocal=true 但本地模型不可用时应走外部 API', async () => {
            jest.spyOn(localModelManager, 'isGenerationAvailable').mockReturnValue(false);
            jest.spyOn(global, 'fetch').mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    choices: [{
                        message: { content: '【改进后的提示词】\nAPI 结果\n\n【改进说明】\n说明' }
                    }]
                })
            });

            const result = await service.improveWithAI(
                '帮我写个提示词',
                { baseUrl: 'http://localhost:11434/v1', model: 'test-model' },
                null,
                { preferLocal: true }
            );

            expect(result.source).toBe('api');
        });
    });

    // ============================================================
    // improveWithAI() — 无外部 API 配置
    // ============================================================

    describe('improveWithAI() 无外部 API 配置', () => {

        test('无 API 配置但本地模型可用时应使用本地模型', async () => {
            jest.spyOn(localModelManager, 'isGenerationAvailable').mockReturnValue(true);
            jest.spyOn(localModelManager, 'generate').mockResolvedValue(
                '【改进后的提示词】\n本地改进结果\n\n【改进说明】\n说明'
            );

            const result = await service.improveWithAI(
                '帮我写个提示词',
                {} // 空配置
            );

            expect(result.source).toBe('local');
        });

        test('无 API 配置且本地模型不可用时应抛出错误', async () => {
            jest.spyOn(localModelManager, 'isGenerationAvailable').mockReturnValue(false);

            await expect(
                service.improveWithAI('帮我写个提示词', {})
            ).rejects.toThrow('未配置 API 且本地模型不可用');
        });
    });

    // ============================================================
    // improveLocal() — 直接使用本地模型
    // ============================================================

    describe('improveLocal()', () => {

        test('本地模型可用时应成功返回结果', async () => {
            jest.spyOn(localModelManager, 'isGenerationAvailable').mockReturnValue(true);
            jest.spyOn(localModelManager, 'generate').mockResolvedValue(
                '【改进后的提示词】\n这是改进后的提示词\n\n【改进说明】\n增加了角色设定和具体要求'
            );

            const result = await service.improveLocal('帮我写一篇文章');

            expect(result.source).toBe('local');
            expect(result.model).toBe('qwen3-0.6b');
            expect(result.improved).toContain('改进后的提示词');
            expect(result.analysis).toBeDefined();
            expect(result.analysis.before).toBeDefined();
            expect(result.analysis.after).toBeDefined();
            expect(result.improvement).toBeDefined();
        });

        test('本地模型不可用时应抛出错误', async () => {
            jest.spyOn(localModelManager, 'isGenerationAvailable').mockReturnValue(false);

            await expect(
                service.improveLocal('帮我写一篇文章')
            ).rejects.toThrow('本地模型不可用');
        });

        test('应支持自定义 maxTokens 和 temperature', async () => {
            jest.spyOn(localModelManager, 'isGenerationAvailable').mockReturnValue(true);
            const generateSpy = jest.spyOn(localModelManager, 'generate').mockResolvedValue(
                '【改进后的提示词】\n结果\n\n【改进说明】\n说明'
            );

            await service.improveLocal('帮我写一篇文章', {
                maxTokens: 256,
                temperature: 0.5
            });

            expect(generateSpy).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(String),
                expect.objectContaining({
                    maxTokens: 256,
                    temperature: 0.5
                })
            );
        });

        test('返回结果应包含 improvement 分数差', async () => {
            jest.spyOn(localModelManager, 'isGenerationAvailable').mockReturnValue(true);
            jest.spyOn(localModelManager, 'generate').mockResolvedValue(
                '【改进后的提示词】\n作为一名专业的写作助手，请帮我生成一篇关于人工智能的文章。要求：1. 包含3个段落 2. 使用简洁的语言 3. 以Markdown格式输出\n\n【改进说明】\n增加了角色设定、结构和输出格式'
            );

            const result = await service.improveLocal('帮我写一篇文章');

            expect(result.improvement.beforeScore).toBeDefined();
            expect(result.improvement.afterScore).toBeDefined();
            expect(result.improvement.delta).toBeDefined();
            // 改进后的分数应该更高（因为添加了角色、结构、格式）
            expect(result.improvement.afterScore).toBeGreaterThanOrEqual(result.improvement.beforeScore);
        });
    });

    // ============================================================
    // 向后兼容性
    // ============================================================

    describe('向后兼容性', () => {

        test('不传 aiOptions 时默认 fallbackToLocal=true', async () => {
            jest.spyOn(global, 'fetch').mockRejectedValue(new Error('网络错误'));
            jest.spyOn(localModelManager, 'isGenerationAvailable').mockReturnValue(true);
            jest.spyOn(localModelManager, 'generate').mockResolvedValue(
                '【改进后的提示词】\n降级结果\n\n【改进说明】\n说明'
            );

            // 旧版调用方式（不传 aiOptions），应自动降级
            const result = await service.improveWithAI(
                '帮我写个提示词',
                { baseUrl: 'http://localhost:11434/v1', model: 'test-model' }
            );

            expect(result.source).toBe('local');
        });

        test('旧版三参数调用方式应保持兼容', async () => {
            jest.spyOn(global, 'fetch').mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    choices: [{ message: { content: '自定义结果' } }]
                })
            });

            // 旧版三参数调用: (prompt, config, customSystemPrompt)
            const result = await service.improveWithAI(
                '用户输入',
                { baseUrl: 'http://localhost:11434/v1', model: 'test-model' },
                '自定义系统提示词'
            );

            expect(result.improved).toBe('自定义结果');
        });
    });
});
