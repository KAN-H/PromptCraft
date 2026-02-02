/**
 * Image Builder API 测试
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000/api/prompts';

// 辅助函数：发起 HTTP 请求
function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

const get = (path) => request('GET', path);
const post = (path, data) => request('POST', path, data);

// 测试用例
describe('Image Builder API', () => {
  
  // =================================================================
  // 基础构建测试
  // =================================================================
  
  describe('POST /image/build - 基础构建', () => {
    test('应该成功构建简单图像提示词', async () => {
      const response = await post(`${BASE_URL}/image/build`, {
        subject: 'a beautiful sunset'
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.prompt).toContain('sunset');
      expect(response.data.data.platform).toBe('general');
    });

    test('应该支持主体选项', async () => {
      const response = await post(`${BASE_URL}/image/build`, {
        subject: 'a warrior',
        subjectOptions: {
          pose: 'standing heroically',
          expression: 'determined',
          clothing: 'golden armor'
        }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.prompt).toContain('warrior');
      expect(response.data.data.prompt).toContain('standing heroically');
    });

    test('缺少主体时应该返回错误', async () => {
      const response = await post(`${BASE_URL}/image/build`, {});
      
      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.error.code).toBe('MISSING_SUBJECT');
    });

    test('只有预设也应该成功', async () => {
      const response = await post(`${BASE_URL}/image/build`, {
        preset: 'portrait',
        subject: 'a model'
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  // =================================================================
  // 完整配置测试
  // =================================================================

  describe('POST /image/build - 完整配置', () => {
    test('应该支持环境设置', async () => {
      const response = await post(`${BASE_URL}/image/build`, {
        subject: 'a castle',
        environment: 'mountain valley',
        environmentOptions: {
          time: 'sunset',
          weather: 'foggy',
          season: 'autumn'
        }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.data.prompt).toContain('mountain valley');
      expect(response.data.data.prompt).toContain('sunset');
      expect(response.data.data.prompt).toContain('foggy');
    });

    test('应该支持风格和艺术家', async () => {
      const response = await post(`${BASE_URL}/image/build`, {
        subject: 'a starry night',
        style: ['oil-painting', 'impressionist'],
        artist: 'van-gogh'
      });
      
      expect(response.status).toBe(200);
      expect(response.data.data.prompt).toContain('oil painting');
      expect(response.data.data.prompt).toContain('Vincent van Gogh');
    });

    test('应该支持光照和相机', async () => {
      const response = await post(`${BASE_URL}/image/build`, {
        subject: 'a portrait',
        lighting: ['golden-hour', 'rim'],
        camera: ['closeup', '85mm', 'bokeh']
      });
      
      expect(response.status).toBe(200);
      expect(response.data.data.prompt).toContain('golden hour');
      expect(response.data.data.prompt).toContain('close-up');
      expect(response.data.data.prompt).toContain('85mm');
    });

    test('应该支持情绪和色彩', async () => {
      const response = await post(`${BASE_URL}/image/build`, {
        subject: 'a landscape',
        mood: 'peaceful',
        color: ['warm', 'golden']
      });
      
      expect(response.status).toBe(200);
      expect(response.data.data.prompt).toContain('peaceful');
      expect(response.data.data.prompt).toContain('warm');
    });

    test('应该支持质量和细节', async () => {
      const response = await post(`${BASE_URL}/image/build`, {
        subject: 'an artwork',
        quality: ['masterpiece', 'high-detail'],
        details: ['intricate patterns', 'glowing effects']
      });
      
      expect(response.status).toBe(200);
      expect(response.data.data.prompt).toContain('masterpiece');
      expect(response.data.data.prompt).toContain('intricate patterns');
    });

    test('应该支持负面提示词', async () => {
      const response = await post(`${BASE_URL}/image/build`, {
        subject: 'a portrait',
        negative: ['basic', 'portrait']
      });
      
      expect(response.status).toBe(200);
      expect(response.data.data.negativePrompt).toContain('blurry');
      expect(response.data.data.negativePrompt).toContain('bad hands');
    });
  });

  // =================================================================
  // 平台支持测试
  // =================================================================

  describe('POST /image/build - 平台支持', () => {
    test('应该支持 Midjourney 平台', async () => {
      const response = await post(`${BASE_URL}/image/build`, {
        subject: 'a dragon',
        platform: 'midjourney',
        aspect: '16:9',
        version: '6',
        stylize: 500
      });
      
      expect(response.status).toBe(200);
      expect(response.data.data.platform).toBe('midjourney');
      expect(response.data.data.prompt).toContain('--ar 16:9');
      expect(response.data.data.prompt).toContain('--v 6');
      expect(response.data.data.prompt).toContain('--s 500');
    });

    test('应该支持混乱度和种子', async () => {
      const response = await post(`${BASE_URL}/image/build`, {
        subject: 'abstract art',
        platform: 'midjourney',
        chaos: 50,
        seed: 12345
      });
      
      expect(response.status).toBe(200);
      expect(response.data.data.prompt).toContain('--c 50');
      expect(response.data.data.prompt).toContain('--seed 12345');
    });

    test('应该支持 DALL-E 平台', async () => {
      const response = await post(`${BASE_URL}/image/build`, {
        subject: 'a cat',
        platform: 'dall-e'
      });
      
      expect(response.status).toBe(200);
      expect(response.data.data.platform).toBe('dall-e');
      expect(response.data.data.platformName).toBe('DALL-E');
    });

    test('应该支持 Stable Diffusion 平台', async () => {
      const response = await post(`${BASE_URL}/image/build`, {
        subject: 'a robot',
        platform: 'stable-diffusion'
      });
      
      expect(response.status).toBe(200);
      expect(response.data.data.platform).toBe('stable-diffusion');
    });
  });

  // =================================================================
  // 预设测试
  // =================================================================

  describe('POST /image/build - 预设功能', () => {
    test('应该支持 portrait 预设', async () => {
      const response = await post(`${BASE_URL}/image/build`, {
        subject: 'a woman',
        preset: 'portrait'
      });
      
      expect(response.status).toBe(200);
      expect(response.data.data.prompt).toContain('close-up');
      expect(response.data.data.prompt).toContain('85mm');
    });

    test('应该支持 landscape 预设', async () => {
      const response = await post(`${BASE_URL}/image/build`, {
        subject: 'mountains',
        preset: 'landscape'
      });
      
      expect(response.status).toBe(200);
      expect(response.data.data.prompt).toContain('wide angle');
    });

    test('应该支持 cinematic 预设', async () => {
      const response = await post(`${BASE_URL}/image/build`, {
        subject: 'a scene',
        preset: 'cinematic'
      });
      
      expect(response.status).toBe(200);
      expect(response.data.data.prompt).toContain('cinematic');
    });
  });

  // =================================================================
  // 语言支持测试
  // =================================================================

  describe('POST /image/build - 语言支持', () => {
    test('默认应该是英文', async () => {
      const response = await post(`${BASE_URL}/image/build`, {
        subject: 'a cat',
        style: 'oil-painting'
      });
      
      expect(response.status).toBe(200);
      expect(response.data.data.metadata.language).toBe('en');
      expect(response.data.data.prompt).toContain('oil painting');
    });

    test('应该支持中文', async () => {
      const response = await post(`${BASE_URL}/image/build`, {
        subject: '一只猫',
        style: 'oil-painting',
        language: 'zh'
      });
      
      expect(response.status).toBe(200);
      expect(response.data.data.metadata.language).toBe('zh');
      expect(response.data.data.prompt).toContain('油画');
    });
  });

  // =================================================================
  // 资源获取 API 测试
  // =================================================================

  describe('GET /image/styles - 获取风格列表', () => {
    test('应该返回所有风格', async () => {
      const response = await get(`${BASE_URL}/image/styles`);
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('oil-painting');
      expect(response.data.data).toHaveProperty('anime');
    });
  });

  describe('GET /image/artists - 获取艺术家列表', () => {
    test('应该返回所有艺术家', async () => {
      const response = await get(`${BASE_URL}/image/artists`);
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('van-gogh');
      expect(response.data.data['van-gogh']).toBe('Vincent van Gogh');
    });
  });

  describe('GET /image/lighting - 获取光照预设', () => {
    test('应该返回所有光照预设', async () => {
      const response = await get(`${BASE_URL}/image/lighting`);
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('golden-hour');
      expect(response.data.data).toHaveProperty('dramatic');
    });
  });

  describe('GET /image/camera - 获取相机预设', () => {
    test('应该返回所有相机预设', async () => {
      const response = await get(`${BASE_URL}/image/camera`);
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('closeup');
      expect(response.data.data).toHaveProperty('wide-angle');
    });
  });

  describe('GET /image/moods - 获取情绪预设', () => {
    test('应该返回所有情绪预设', async () => {
      const response = await get(`${BASE_URL}/image/moods`);
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('peaceful');
      expect(response.data.data).toHaveProperty('dramatic');
    });
  });

  describe('GET /image/colors - 获取色彩方案', () => {
    test('应该返回所有色彩方案', async () => {
      const response = await get(`${BASE_URL}/image/colors`);
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('warm');
      expect(response.data.data).toHaveProperty('cool');
    });
  });

  describe('GET /image/platforms - 获取平台配置', () => {
    test('应该返回所有平台配置', async () => {
      const response = await get(`${BASE_URL}/image/platforms`);
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('midjourney');
      expect(response.data.data).toHaveProperty('dall-e');
      expect(response.data.data).toHaveProperty('stable-diffusion');
    });
  });

  describe('GET /image/negatives - 获取负面预设', () => {
    test('应该返回所有负面提示词预设', async () => {
      const response = await get(`${BASE_URL}/image/negatives`);
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('basic');
      expect(response.data.data).toHaveProperty('portrait');
      expect(response.data.data).toHaveProperty('comprehensive');
    });
  });

  describe('GET /image/resources - 获取所有资源', () => {
    test('应该返回所有图像构建器资源', async () => {
      const response = await get(`${BASE_URL}/image/resources`);
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('styles');
      expect(response.data.data).toHaveProperty('artists');
      expect(response.data.data).toHaveProperty('lighting');
      expect(response.data.data).toHaveProperty('camera');
      expect(response.data.data).toHaveProperty('moods');
      expect(response.data.data).toHaveProperty('colors');
      expect(response.data.data).toHaveProperty('platforms');
      expect(response.data.data).toHaveProperty('negatives');
    });
  });

  // =================================================================
  // 复杂场景测试
  // =================================================================

  describe('POST /image/build - 复杂场景', () => {
    test('应该成功构建完整的 Midjourney 提示词', async () => {
      const response = await post(`${BASE_URL}/image/build`, {
        subject: 'a majestic dragon',
        subjectOptions: {
          pose: 'flying',
          features: 'scales shimmering'
        },
        environment: 'volcanic mountain',
        environmentOptions: {
          time: 'night',
          weather: 'stormy'
        },
        style: ['fantasy', 'concept-art'],
        artist: 'greg-rutkowski',
        lighting: ['dramatic', 'volumetric'],
        camera: ['medium-long', 'low-angle'],
        mood: 'epic',
        color: 'warm',
        quality: ['masterpiece', 'high-detail', 'trending'],
        details: ['intricate scales', 'glowing eyes'],
        negative: 'comprehensive',
        platform: 'midjourney',
        aspect: '16:9',
        version: '6',
        stylize: 250
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      const result = response.data.data;
      expect(result.prompt).toContain('dragon');
      expect(result.prompt).toContain('flying');
      expect(result.prompt).toContain('volcanic mountain');
      expect(result.prompt).toContain('fantasy');
      expect(result.prompt).toContain('Greg Rutkowski');
      expect(result.prompt).toContain('dramatic');
      expect(result.prompt).toContain('epic');
      expect(result.prompt).toContain('masterpiece');
      expect(result.prompt).toContain('--ar 16:9');
      expect(result.prompt).toContain('--v 6');
      expect(result.prompt).toContain('--s 250');
      expect(result.negativePrompt).toContain('blurry');
      expect(result.platform).toBe('midjourney');
    });
  });
});
