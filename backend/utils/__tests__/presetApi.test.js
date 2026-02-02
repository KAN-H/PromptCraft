/**
 * PresetService API 集成测试
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

describe('Presets API', () => {
  
  // ==================== GET /presets ====================
  describe('GET /presets', () => {
    test('应该返回所有预置模板列表', async () => {
      const { status, data } = await request('GET', '/presets');
      
      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);
      expect(data.meta.total).toBeGreaterThan(0);
    });

    test('应该支持按分类筛选', async () => {
      const { status, data } = await request('GET', '/presets?category=coding');
      
      expect(status).toBe(200);
      expect(data.success).toBe(true);
      data.data.forEach(p => {
        expect(p.category).toBe('coding');
      });
    });

    test('应该支持按难度筛选', async () => {
      const { status, data } = await request('GET', '/presets?difficulty=beginner');
      
      expect(status).toBe(200);
      expect(data.success).toBe(true);
      data.data.forEach(p => {
        expect(p.difficulty).toBe('beginner');
      });
    });

    test('应该支持限制数量', async () => {
      const { status, data } = await request('GET', '/presets?limit=3');
      
      expect(status).toBe(200);
      expect(data.data.length).toBeLessThanOrEqual(3);
    });
  });

  // ==================== GET /presets/search ====================
  describe('GET /presets/search', () => {
    test('应该搜索预置模板', async () => {
      const { status, data } = await request('GET', '/presets/search?q=翻译');
      
      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);
      expect(data.meta.query).toBe('翻译');
    });

    test('缺少查询参数应该返回400', async () => {
      const { status, data } = await request('GET', '/presets/search');
      
      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('MISSING_QUERY');
    });
  });

  // ==================== GET /presets/filter ====================
  describe('GET /presets/filter', () => {
    test('应该根据标签筛选', async () => {
      const { status, data } = await request('GET', '/presets/filter?tags=代码,审查');
      
      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);
      expect(data.meta.tags).toEqual(['代码', '审查']);
    });

    test('缺少标签参数应该返回400', async () => {
      const { status, data } = await request('GET', '/presets/filter');
      
      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('MISSING_TAGS');
    });
  });

  // ==================== GET /presets/recommended ====================
  describe('GET /presets/recommended', () => {
    test('应该返回推荐预置', async () => {
      const { status, data } = await request('GET', '/presets/recommended');
      
      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.length).toBeLessThanOrEqual(5);
    });

    test('应该支持自定义数量', async () => {
      const { status, data } = await request('GET', '/presets/recommended?limit=3');
      
      expect(status).toBe(200);
      expect(data.data.length).toBeLessThanOrEqual(3);
    });
  });

  // ==================== GET /presets/stats ====================
  describe('GET /presets/stats', () => {
    test('应该返回统计信息', async () => {
      const { status, data } = await request('GET', '/presets/stats');
      
      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('totalPresets');
      expect(data.data).toHaveProperty('categoryCount');
      expect(data.data).toHaveProperty('tagCount');
      expect(data.data).toHaveProperty('byDifficulty');
    });
  });

  // ==================== GET /presets/:id ====================
  describe('GET /presets/:id', () => {
    test('应该返回预置详情', async () => {
      const { status, data } = await request('GET', '/presets/code-review');
      
      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe('code-review');
      expect(data.data.name).toBe('代码审查专家');
      expect(data.data).toHaveProperty('template');
    });

    test('不存在的预置应该返回404', async () => {
      const { status, data } = await request('GET', '/presets/nonexistent');
      
      expect(status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('PRESET_NOT_FOUND');
    });
  });

  // ==================== GET /presets/:id/variables ====================
  describe('GET /presets/:id/variables', () => {
    test('应该返回变量定义', async () => {
      const { status, data } = await request('GET', '/presets/code-review/variables');
      
      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.presetId).toBe('code-review');
      expect(Array.isArray(data.data.variables)).toBe(true);
      expect(data.data.variables.length).toBeGreaterThan(0);
    });

    test('不存在的预置应该返回404', async () => {
      const { status, data } = await request('GET', '/presets/nonexistent/variables');
      
      expect(status).toBe(404);
      expect(data.success).toBe(false);
    });
  });

  // ==================== POST /presets/:id/validate ====================
  describe('POST /presets/:id/validate', () => {
    test('应该验证变量', async () => {
      const { status, data } = await request('POST', '/presets/code-review/validate', {
        values: { code: 'function test() {}' }
      });
      
      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.valid).toBe(true);
    });

    test('缺少必需变量应该返回验证失败', async () => {
      const { status, data } = await request('POST', '/presets/code-review/validate', {
        values: {}
      });
      
      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.valid).toBe(false);
      expect(data.data.missing.length).toBeGreaterThan(0);
    });

    test('不存在的预置应该返回404', async () => {
      const { status, data } = await request('POST', '/presets/nonexistent/validate', {
        values: {}
      });
      
      expect(status).toBe(404);
    });
  });

  // ==================== POST /presets/:id/apply ====================
  describe('POST /presets/:id/apply', () => {
    test('应该应用预置生成提示词', async () => {
      const { status, data } = await request('POST', '/presets/translation-pro/apply', {
        variables: { text: '这是测试文本' }
      });
      
      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.presetId).toBe('translation-pro');
      expect(data.data.content).toBeDefined();
      expect(data.data.content.length).toBeGreaterThan(0);
    });

    test('应该支持 JSON 格式输出', async () => {
      const { status, data } = await request('POST', '/presets/translation-pro/apply', {
        variables: { text: 'test' },
        format: 'json'
      });
      
      expect(status).toBe(200);
      expect(data.data.format).toBe('json');
    });

    test('缺少必需变量应该返回400', async () => {
      const { status, data } = await request('POST', '/presets/code-review/apply', {
        variables: {}
      });
      
      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_FAILED');
    });

    test('不存在的预置应该返回404', async () => {
      const { status, data } = await request('POST', '/presets/nonexistent/apply', {
        variables: {}
      });
      
      expect(status).toBe(404);
    });
  });

});
