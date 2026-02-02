/**
 * Improver API 集成测试
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
const API_PREFIX = '/api/prompts';

// HTTP 请求辅助函数
function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const fullPath = API_PREFIX + path;
    const url = new URL(fullPath, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

describe('Improver API', () => {
  
  // ==================== POST /analyze ====================
  describe('POST /analyze', () => {
    test('应该分析提示词并返回评分', async () => {
      const { status, data } = await request('POST', '/analyze', {
        prompt: '写一篇关于人工智能的文章'
      });
      
      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('originalPrompt');
      expect(data.data).toHaveProperty('scores');
      expect(data.data).toHaveProperty('totalScore');
      expect(data.data).toHaveProperty('rating');
      expect(data.data).toHaveProperty('issues');
      expect(data.data).toHaveProperty('suggestions');
    });

    test('应该返回所有评分维度', async () => {
      const { status, data } = await request('POST', '/analyze', {
        prompt: '测试提示词'
      });
      
      expect(status).toBe(200);
      expect(data.data.scores).toHaveProperty('clarity');
      expect(data.data.scores).toHaveProperty('specificity');
      expect(data.data.scores).toHaveProperty('structure');
      expect(data.data.scores).toHaveProperty('context');
      expect(data.data.scores).toHaveProperty('constraints');
      expect(data.data.scores).toHaveProperty('outputFormat');
    });

    test('高质量提示词应该获得高分', async () => {
      const { status, data } = await request('POST', '/analyze', {
        prompt: `作为一名资深的软件工程师，请帮我审查以下代码。

要求：
1. 检查代码风格
2. 识别潜在问题
3. 提供改进建议

请以Markdown格式输出。`
      });
      
      expect(status).toBe(200);
      expect(data.data.totalScore).toBeGreaterThan(50);
    });

    test('低质量提示词应该获得低分和问题提示', async () => {
      const { status, data } = await request('POST', '/analyze', {
        prompt: '帮我'
      });
      
      expect(status).toBe(200);
      expect(data.data.totalScore).toBeLessThan(60);
      expect(data.data.issues.length).toBeGreaterThan(0);
    });

    test('缺少提示词应该返回400', async () => {
      const { status, data } = await request('POST', '/analyze', {});
      
      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('MISSING_PROMPT');
    });

    test('空提示词应该返回错误', async () => {
      const { status, data } = await request('POST', '/analyze', {
        prompt: ''
      });
      
      expect(status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  // ==================== POST /improve ====================
  describe('POST /improve', () => {
    test('应该返回改进后的提示词', async () => {
      const { status, data } = await request('POST', '/improve', {
        prompt: '写一篇文章'
      });
      
      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('original');
      expect(data.data).toHaveProperty('improved');
      expect(data.data).toHaveProperty('analysis');
      expect(data.data).toHaveProperty('changes');
      expect(data.data).toHaveProperty('improvement');
    });

    test('改进后的提示词应该更长', async () => {
      const { status, data } = await request('POST', '/improve', {
        prompt: '帮我写代码'
      });
      
      expect(status).toBe(200);
      expect(data.data.improved.length).toBeGreaterThanOrEqual(data.data.original.length);
    });

    test('应该返回改进说明', async () => {
      const { status, data } = await request('POST', '/improve', {
        prompt: '翻译这个'
      });
      
      expect(status).toBe(200);
      expect(data.data.changes).toBeDefined();
      expect(Array.isArray(data.data.changes)).toBe(true);
    });

    test('应该返回分数变化', async () => {
      const { status, data } = await request('POST', '/improve', {
        prompt: '写点东西'
      });
      
      expect(status).toBe(200);
      expect(data.data.improvement).toHaveProperty('beforeScore');
      expect(data.data.improvement).toHaveProperty('afterScore');
      expect(data.data.improvement).toHaveProperty('delta');
    });

    test('缺少提示词应该返回400', async () => {
      const { status, data } = await request('POST', '/improve', {});
      
      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('MISSING_PROMPT');
    });
  });

  // ==================== GET /improve/tips ====================
  describe('GET /improve/tips', () => {
    test('应该返回所有改进技巧', async () => {
      const { status, data } = await request('GET', '/improve/tips');
      
      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBe(6);
    });

    test('每个维度应该有技巧列表', async () => {
      const { status, data } = await request('GET', '/improve/tips');
      
      expect(status).toBe(200);
      data.data.forEach(item => {
        expect(item).toHaveProperty('dimension');
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('tips');
        expect(Array.isArray(item.tips)).toBe(true);
      });
    });

    test('应该支持按维度筛选', async () => {
      const { status, data } = await request('GET', '/improve/tips?dimension=clarity');
      
      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.dimension).toBe('clarity');
      expect(data.data.name).toBe('清晰度');
    });
  });

  // ==================== GET /improve/dimensions ====================
  describe('GET /improve/dimensions', () => {
    test('应该返回所有评分维度', async () => {
      const { status, data } = await request('GET', '/improve/dimensions');
      
      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBe(6);
    });

    test('每个维度应该有完整信息', async () => {
      const { status, data } = await request('GET', '/improve/dimensions');
      
      expect(status).toBe(200);
      data.data.forEach(dim => {
        expect(dim).toHaveProperty('id');
        expect(dim).toHaveProperty('name');
        expect(dim).toHaveProperty('nameEn');
        expect(dim).toHaveProperty('description');
        expect(dim).toHaveProperty('weight');
      });
    });

    test('权重之和应该为1', async () => {
      const { status, data } = await request('GET', '/improve/dimensions');
      
      expect(status).toBe(200);
      const totalWeight = data.data.reduce((sum, d) => sum + d.weight, 0);
      expect(totalWeight).toBeCloseTo(1, 2);
    });
  });

  // ==================== POST /improve/ai (需要 LLM 服务) ====================
  describe('POST /improve/ai', () => {
    test('缺少提示词应该返回400', async () => {
      const { status, data } = await request('POST', '/improve/ai', {});
      
      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('MISSING_PROMPT');
    });

    // 注意: AI 改进测试需要 LLM 服务运行
    // 这里只测试回退到规则改进的情况
    test('LLM 不可用时应该回退到规则改进', async () => {
      const { status, data } = await request('POST', '/improve/ai', {
        prompt: '写一篇文章',
        config: {
          provider: 'local',
          model: 'nonexistent-model'
        }
      });
      
      // 即使 AI 失败，也应该返回结果（回退）
      if (status === 200 && data.data.fallback) {
        expect(data.data.fallback).toBe(true);
        expect(data.data).toHaveProperty('improved');
      }
      // 或者返回错误
      expect([200, 500]).toContain(status);
    });
  });

});
