/**
 * Phase 16 — 前端集成 路由集成测试
 *
 * 测试覆盖：
 * - POST /api/prompts/improve/ai 接受并传递 preferLocal / fallbackToLocal 选项
 * - 默认值行为 (preferLocal=false, fallbackToLocal=true)
 * - 服务返回的 source / fallback / model 字段正确透传
 * - 错误处理
 */

const express = require('express');
const request = require('supertest');

// ============================================================
// Mock improverService（通过 getImproverService 工厂函数）
// ============================================================

const mockImproveWithAI = jest.fn();
const mockAnalyze = jest.fn();
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

// Mock 其他 prompts.js 依赖，使路由可以成功加载
jest.mock('../../utils/promptGenerator', () => {
  return jest.fn().mockImplementation(() => ({
    generate: jest.fn(),
  }));
});

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
  promptCompressor: {
    compress: jest.fn(),
    getStats: jest.fn(),
  },
  CompressionLevel: { LIGHT: 'light', MEDIUM: 'medium', HEAVY: 'heavy' },
}));

jest.mock('../../utils/imagePromptBuilder', () => ({
  ImagePromptBuilder: jest.fn(),
  imageBuilder: jest.fn(),
  getStyles: jest.fn().mockReturnValue([]),
  getArtists: jest.fn().mockReturnValue([]),
  getLighting: jest.fn().mockReturnValue([]),
  getCamera: jest.fn().mockReturnValue([]),
  getMoods: jest.fn().mockReturnValue([]),
  getColorSchemes: jest.fn().mockReturnValue([]),
  getPlatforms: jest.fn().mockReturnValue([]),
  getNegativePresets: jest.fn().mockReturnValue([]),
}));

// 加载路由
const promptsRouter = require('../../routes/prompts');

// ============================================================
// 创建测试 app
// ============================================================

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/prompts', promptsRouter);
  return app;
}

// ============================================================
// 测试套件
// ============================================================

describe('Phase 16 — POST /api/prompts/improve/ai 路由集成测试', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // 基本功能
  // ============================================================

  describe('基本功能', () => {
    test('应使用默认 aiOptions 调用 improveWithAI', async () => {
      mockImproveWithAI.mockResolvedValue({
        improved: '改进后的提示词',
        analysis: { score: 85 },
        source: 'api',
        model: 'gpt-3.5-turbo',
      });

      const res = await request(app)
        .post('/api/prompts/improve/ai')
        .send({
          prompt: '设计一个Logo',
          config: { apiKey: 'test-key', baseUrl: 'https://api.example.com' },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.improved).toBe('改进后的提示词');
      expect(res.body.data.source).toBe('api');
      expect(res.body.data.model).toBe('gpt-3.5-turbo');

      // 验证默认值：preferLocal=false, fallbackToLocal=true
      expect(mockImproveWithAI).toHaveBeenCalledWith(
        '设计一个Logo',
        { apiKey: 'test-key', baseUrl: 'https://api.example.com' },
        undefined, // systemPrompt 未传
        { preferLocal: false, fallbackToLocal: true }
      );
    });

    test('缺少 prompt 应返回 400', async () => {
      const res = await request(app)
        .post('/api/prompts/improve/ai')
        .send({ config: {} });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('MISSING_PROMPT');
    });

    test('prompt 为非字符串应返回 400', async () => {
      const res = await request(app)
        .post('/api/prompts/improve/ai')
        .send({ prompt: 12345 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('MISSING_PROMPT');
    });
  });

  // ============================================================
  // Phase 16 — preferLocal / fallbackToLocal 传递
  // ============================================================

  describe('Phase 16 aiOptions 传递', () => {
    test('应传递 preferLocal=true 到 improverService', async () => {
      mockImproveWithAI.mockResolvedValue({
        improved: '本地模型改进结果',
        source: 'local',
        model: 'Qwen3-0.6B',
      });

      const res = await request(app)
        .post('/api/prompts/improve/ai')
        .send({
          prompt: '测试本地优先',
          config: {},
          preferLocal: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.source).toBe('local');
      expect(res.body.data.model).toBe('Qwen3-0.6B');

      expect(mockImproveWithAI).toHaveBeenCalledWith(
        '测试本地优先',
        {},
        undefined,
        { preferLocal: true, fallbackToLocal: true }
      );
    });

    test('应传递 fallbackToLocal=false 到 improverService', async () => {
      mockImproveWithAI.mockResolvedValue({
        improved: '仅 API 结果',
        source: 'api',
        model: 'gpt-4',
      });

      const res = await request(app)
        .post('/api/prompts/improve/ai')
        .send({
          prompt: '测试不降级',
          config: { apiKey: 'key' },
          fallbackToLocal: false,
        });

      expect(res.status).toBe(200);
      expect(mockImproveWithAI).toHaveBeenCalledWith(
        '测试不降级',
        { apiKey: 'key' },
        undefined,
        { preferLocal: false, fallbackToLocal: false }
      );
    });

    test('应同时传递 preferLocal=true 和 fallbackToLocal=false', async () => {
      mockImproveWithAI.mockResolvedValue({
        improved: '结果',
        source: 'local',
        model: 'Qwen3-0.6B',
      });

      await request(app)
        .post('/api/prompts/improve/ai')
        .send({
          prompt: '组合测试',
          config: {},
          preferLocal: true,
          fallbackToLocal: false,
        });

      expect(mockImproveWithAI).toHaveBeenCalledWith(
        '组合测试',
        {},
        undefined,
        { preferLocal: true, fallbackToLocal: false }
      );
    });

    test('应正确传递自定义 systemPrompt 和 aiOptions', async () => {
      mockImproveWithAI.mockResolvedValue({
        improved: '自定义结果',
        source: 'api',
        model: 'gpt-3.5-turbo',
      });

      await request(app)
        .post('/api/prompts/improve/ai')
        .send({
          prompt: '带系统提示词测试',
          systemPrompt: '你是一个专业的Logo设计师',
          config: { apiKey: 'key' },
          preferLocal: true,
          fallbackToLocal: true,
        });

      expect(mockImproveWithAI).toHaveBeenCalledWith(
        '带系统提示词测试',
        { apiKey: 'key' },
        '你是一个专业的Logo设计师',
        { preferLocal: true, fallbackToLocal: true }
      );
    });
  });

  // ============================================================
  // 服务返回字段透传
  // ============================================================

  describe('服务返回字段透传', () => {
    test('应透传 fallback 信息', async () => {
      mockImproveWithAI.mockResolvedValue({
        improved: '降级结果',
        source: 'local',
        model: 'Qwen3-0.6B',
        fallback: true,
        apiError: 'API 超时',
      });

      const res = await request(app)
        .post('/api/prompts/improve/ai')
        .send({ prompt: '降级测试', config: {} });

      expect(res.status).toBe(200);
      expect(res.body.data.fallback).toBe(true);
      expect(res.body.data.apiError).toBe('API 超时');
      expect(res.body.data.source).toBe('local');
    });

    test('应透传 rule_engine 来源', async () => {
      mockImproveWithAI.mockResolvedValue({
        improved: '规则引擎结果',
        source: 'rule_engine',
        fallback: true,
        apiError: '本地模型不可用',
      });

      const res = await request(app)
        .post('/api/prompts/improve/ai')
        .send({ prompt: '规则引擎测试', config: {} });

      expect(res.status).toBe(200);
      expect(res.body.data.source).toBe('rule_engine');
      expect(res.body.data.fallback).toBe(true);
    });

    test('应透传完整的 analysis 对象', async () => {
      const mockAnalysis = {
        score: 72,
        dimensions: {
          clarity: { score: 80, comment: '清晰度良好' },
          specificity: { score: 65, comment: '可以更具体' },
        },
      };

      mockImproveWithAI.mockResolvedValue({
        improved: '分析结果',
        analysis: mockAnalysis,
        source: 'api',
        model: 'gpt-3.5-turbo',
      });

      const res = await request(app)
        .post('/api/prompts/improve/ai')
        .send({ prompt: '分析测试', config: { apiKey: 'key' } });

      expect(res.status).toBe(200);
      expect(res.body.data.analysis).toEqual(mockAnalysis);
    });
  });

  // ============================================================
  // 错误处理
  // ============================================================

  describe('错误处理', () => {
    test('服务抛出异常应返回 500', async () => {
      mockImproveWithAI.mockRejectedValue(new Error('模型推理失败'));

      const res = await request(app)
        .post('/api/prompts/improve/ai')
        .send({ prompt: '错误测试', config: {} });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AI_IMPROVE_ERROR');
      expect(res.body.error.message).toBe('模型推理失败');
    });

    test('服务抛出网络错误应返回 500', async () => {
      mockImproveWithAI.mockRejectedValue(new Error('ECONNREFUSED'));

      const res = await request(app)
        .post('/api/prompts/improve/ai')
        .send({ prompt: '网络错误测试', config: {} });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('ECONNREFUSED');
    });
  });
});
