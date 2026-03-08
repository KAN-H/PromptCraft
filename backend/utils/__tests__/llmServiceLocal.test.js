/**
 * LLMService 本地模型集成测试
 * 
 * Phase 15 — 测试 callLocalModel()、callWithFallback()、isLocalModelAvailable()
 */

const llmService = require('../../services/llmService');
const localModelManager = require('../../services/localModelManager');
const { promptCompressor } = require('../../services/promptCompressorService');

describe('LLMService - Phase 15 本地模型集成', () => {

    let originalRateLimitConfig;

    beforeAll(() => {
        // 禁用重试和速率限制，加速测试
        originalRateLimitConfig = { ...llmService.rateLimitConfig };
        llmService.rateLimitConfig.maxRetries = 0;
        llmService.rateLimitConfig.minInterval = 0;
    });

    afterAll(() => {
        llmService.rateLimitConfig = originalRateLimitConfig;
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // ============================================================
    // isLocalModelAvailable()
    // ============================================================

    describe('isLocalModelAvailable()', () => {
        test('本地模型可用时应返回 true', () => {
            jest.spyOn(localModelManager, 'isGenerationAvailable').mockReturnValue(true);
            expect(llmService.isLocalModelAvailable()).toBe(true);
        });

        test('本地模型不可用时应返回 false', () => {
            jest.spyOn(localModelManager, 'isGenerationAvailable').mockReturnValue(false);
            expect(llmService.isLocalModelAvailable()).toBe(false);
        });
    });

    // ============================================================
    // callLocalModel()
    // ============================================================

    describe('callLocalModel()', () => {

        test('本地模型不可用时应抛出错误', async () => {
            jest.spyOn(localModelManager, 'isGenerationAvailable').mockReturnValue(false);

            await expect(
                llmService.callLocalModel('测试提示词', '系统提示词')
            ).rejects.toThrow('本地模型不可用');
        });

        test('成功生成时应返回正确结构', async () => {
            jest.spyOn(localModelManager, 'isGenerationAvailable').mockReturnValue(true);
            jest.spyOn(localModelManager, 'generate').mockResolvedValue('这是本地模型生成的文本');

            const result = await llmService.callLocalModel('简短提示词');

            expect(result).toEqual({
                text: '这是本地模型生成的文本',
                source: 'local',
                model: 'qwen3-0.6b'
            });
        });

        test('应将 systemPrompt 传递给 localModelManager', async () => {
            jest.spyOn(localModelManager, 'isGenerationAvailable').mockReturnValue(true);
            const generateSpy = jest.spyOn(localModelManager, 'generate').mockResolvedValue('结果');

            await llmService.callLocalModel('用户输入', '你是专家', {
                maxTokens: 256,
                temperature: 0.5,
                thinking: true
            });

            expect(generateSpy).toHaveBeenCalledWith('用户输入', '你是专家', {
                maxTokens: 256,
                temperature: 0.5,
                thinking: true
            });
        });

        test('本地模型生成失败时应抛出错误', async () => {
            jest.spyOn(localModelManager, 'isGenerationAvailable').mockReturnValue(true);
            jest.spyOn(localModelManager, 'generate').mockRejectedValue(new Error('内存不足'));

            await expect(
                llmService.callLocalModel('提示词')
            ).rejects.toThrow('本地模型生成失败: 内存不足');
        });

        test('短文本不应触发压缩', async () => {
            jest.spyOn(localModelManager, 'isGenerationAvailable').mockReturnValue(true);
            jest.spyOn(localModelManager, 'generate').mockResolvedValue('结果');
            const compressSpy = jest.spyOn(promptCompressor, 'compress');

            await llmService.callLocalModel('短文本');

            expect(compressSpy).not.toHaveBeenCalled();
        });

        test('长文本应自动压缩', async () => {
            jest.spyOn(localModelManager, 'isGenerationAvailable').mockReturnValue(true);
            jest.spyOn(localModelManager, 'generate').mockResolvedValue('压缩后结果');

            // 生成一个超长文本（会导致 token 超过 1500）
            const longPrompt = '请帮我优化这段设计提示词。'.repeat(200);
            const longSystem = '你是一名资深设计专家，拥有丰富的经验。'.repeat(100);

            jest.spyOn(promptCompressor, 'estimateTokens').mockImplementation((text) => {
                return text.length * 0.6; // 模拟高 token 数
            });
            jest.spyOn(promptCompressor, 'compress').mockImplementation((text, level) => ({
                compressed: text.substring(0, 100),
                level,
                originalTokens: text.length,
                compressedTokens: 100
            }));

            const result = await llmService.callLocalModel(longPrompt, longSystem);

            expect(result.compression).toBeDefined();
            expect(result.compression.compressed).toBe(true);
            expect(result.source).toBe('local');
        });

        test('compress=false 应跳过压缩', async () => {
            jest.spyOn(localModelManager, 'isGenerationAvailable').mockReturnValue(true);
            jest.spyOn(localModelManager, 'generate').mockResolvedValue('结果');
            const compressSpy = jest.spyOn(promptCompressor, 'compress');

            // 即使是长文本，设置 compress=false 也不压缩
            const longText = '长文本'.repeat(500);
            await llmService.callLocalModel(longText, '', { compress: false });

            expect(compressSpy).not.toHaveBeenCalled();
        });
    });

    // ============================================================
    // callWithFallback()
    // ============================================================

    describe('callWithFallback()', () => {
        const mockConfig = {
            baseUrl: 'http://localhost:11434/v1',
            model: 'test-model'
        };

        test('API 成功时应返回 API 结果', async () => {
            jest.spyOn(global, 'fetch').mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    choices: [{ message: { content: 'API 响应' } }]
                })
            });

            const result = await llmService.callWithFallback('提示词', '系统提示词', mockConfig);

            expect(result.text).toBe('API 响应');
            expect(result.source).toBe('api');
            expect(result.model).toBe('test-model');
            expect(result.fallback).toBeUndefined();
        });

        test('API 失败、本地模型可用时应降级到本地模型', async () => {
            jest.spyOn(global, 'fetch').mockRejectedValue(new Error('网络错误'));
            jest.spyOn(localModelManager, 'isGenerationAvailable').mockReturnValue(true);
            jest.spyOn(localModelManager, 'generate').mockResolvedValue('本地模型降级结果');

            const result = await llmService.callWithFallback('提示词', '系统提示词', mockConfig);

            expect(result.text).toBe('本地模型降级结果');
            expect(result.source).toBe('local');
            expect(result.fallback).toBe(true);
            expect(result.apiError).toBe('网络错误');
        });

        test('API 失败、本地模型不可用时应抛出原始 API 错误', async () => {
            jest.spyOn(global, 'fetch').mockRejectedValue(new Error('API 密钥无效'));
            jest.spyOn(localModelManager, 'isGenerationAvailable').mockReturnValue(false);

            await expect(
                llmService.callWithFallback('提示词', '系统提示词', mockConfig)
            ).rejects.toThrow('API 密钥无效');
        });

        test('API 失败、本地模型也失败时应抛出组合错误', async () => {
            jest.spyOn(global, 'fetch').mockRejectedValue(new Error('网络超时'));
            jest.spyOn(localModelManager, 'isGenerationAvailable').mockReturnValue(true);
            jest.spyOn(localModelManager, 'generate').mockRejectedValue(new Error('模型加载失败'));

            await expect(
                llmService.callWithFallback('提示词', '系统提示词', mockConfig)
            ).rejects.toThrow('所有推理方式均失败');
        });

        test('allowLocalFallback=false 时不应降级', async () => {
            jest.spyOn(global, 'fetch').mockRejectedValue(new Error('网络错误'));
            jest.spyOn(localModelManager, 'isGenerationAvailable').mockReturnValue(true);
            const generateSpy = jest.spyOn(localModelManager, 'generate');

            await expect(
                llmService.callWithFallback('提示词', '系统提示词', mockConfig, {
                    allowLocalFallback: false
                })
            ).rejects.toThrow('网络错误');

            expect(generateSpy).not.toHaveBeenCalled();
        });

        test('API 返回 429 最终失败后应降级到本地模型', async () => {
            // 模拟 429 错误（重试后仍然失败）
            jest.spyOn(global, 'fetch').mockResolvedValue({
                ok: false,
                status: 429,
                statusText: 'Too Many Requests',
                json: () => Promise.resolve({ error: 'rate limited' }),
                headers: { get: () => null }
            });
            jest.spyOn(localModelManager, 'isGenerationAvailable').mockReturnValue(true);
            jest.spyOn(localModelManager, 'generate').mockResolvedValue('降级结果');
            // 加速延迟
            jest.spyOn(llmService, '_delay').mockResolvedValue();

            const result = await llmService.callWithFallback('提示词', '系统提示词', mockConfig);

            expect(result.source).toBe('local');
            expect(result.fallback).toBe(true);
        });

        test('应传递额外选项给 call()', async () => {
            const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    choices: [{ message: { content: '结果' } }]
                })
            });

            await llmService.callWithFallback('提示词', '系统提示词', mockConfig, {
                temperature: 0.5,
                top_p: 0.8
            });

            const requestBody = JSON.parse(fetchSpy.mock.calls[0][1].body);
            expect(requestBody.temperature).toBe(0.5);
            expect(requestBody.top_p).toBe(0.8);
        });

        test('应传递 localMaxTokens 和 localTemperature 给本地模型', async () => {
            jest.spyOn(global, 'fetch').mockRejectedValue(new Error('网络错误'));
            jest.spyOn(localModelManager, 'isGenerationAvailable').mockReturnValue(true);
            const generateSpy = jest.spyOn(localModelManager, 'generate').mockResolvedValue('结果');

            await llmService.callWithFallback('提示词', '系统提示词', mockConfig, {
                localMaxTokens: 256,
                localTemperature: 0.9
            });

            expect(generateSpy).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(String),
                expect.objectContaining({
                    maxTokens: 256,
                    temperature: 0.9
                })
            );
        });
    });
});
