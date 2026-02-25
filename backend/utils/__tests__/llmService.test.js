/**
 * LLMService 单元测试
 * 验证 LLM 服务的防御性检查和基本逻辑
 */

const llmService = require('../../services/llmService');

describe('LLMService', () => {
  let originalRateLimitConfig;

  beforeAll(() => {
    // 保存原始配置
    originalRateLimitConfig = { ...llmService.rateLimitConfig };
    // 禁用重试和速率限制，加速测试
    llmService.rateLimitConfig.maxRetries = 0;
    llmService.rateLimitConfig.minInterval = 0;
  });

  afterAll(() => {
    // 恢复原始配置
    llmService.rateLimitConfig = originalRateLimitConfig;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('call() - 参数校验', () => {
    test('缺少 baseUrl 应该抛出错误', async () => {
      await expect(
        llmService.call('prompt', 'system', { model: 'test' })
      ).rejects.toThrow('baseUrl is required');
    });

    test('缺少 model 应该抛出错误', async () => {
      await expect(
        llmService.call('prompt', 'system', { baseUrl: 'http://localhost:11434/v1' })
      ).rejects.toThrow('model is required');
    });
  });

  describe('call() - 响应格式验证', () => {
    test('API 响应缺少 choices 字段应该抛出错误', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ result: 'no choices here' })
      });

      await expect(
        llmService.call('test prompt', 'system', {
          baseUrl: 'http://localhost:11434/v1',
          model: 'test-model'
        })
      ).rejects.toThrow('API 响应格式无效');
    });

    test('choices 为空数组应该抛出错误', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ choices: [] })
      });

      await expect(
        llmService.call('test prompt', 'system', {
          baseUrl: 'http://localhost:11434/v1',
          model: 'test-model'
        })
      ).rejects.toThrow('API 响应格式无效');
    });

    test('choices[0] 缺少 message 字段应该抛出错误', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ choices: [{ finish_reason: 'stop' }] })
      });

      await expect(
        llmService.call('test prompt', 'system', {
          baseUrl: 'http://localhost:11434/v1',
          model: 'test-model'
        })
      ).rejects.toThrow('API 响应格式无效');
    });

    test('正确的响应格式应该返回内容', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: '这是 AI 的回复' } }]
        })
      });

      const result = await llmService.call('test prompt', 'system', {
        baseUrl: 'http://localhost:11434/v1',
        model: 'test-model'
      });

      expect(result).toBe('这是 AI 的回复');
    });
  });

  describe('call() - HTTP 错误处理', () => {
    test('API 返回非 OK 状态应该抛出错误', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ error: 'invalid api key' }),
        headers: { get: () => null }
      });

      await expect(
        llmService.call('test', 'system', {
          baseUrl: 'http://localhost:11434/v1',
          model: 'test-model'
        })
      ).rejects.toThrow('API Error: 401');
    });
  });
});
