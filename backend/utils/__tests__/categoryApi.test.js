/**
 * Category API 集成测试
 */

const http = require('http');

const API_BASE = 'http://localhost:3000/api/prompts';

/**
 * HTTP 请求辅助函数
 */
function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
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
          resolve({
            status: res.statusCode,
            data: data
          });
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

/**
 * 测试用例
 */
const tests = [
  // 1. 获取所有分类
  {
    name: '获取所有分类',
    async run() {
      const res = await request('GET', '/categories');
      
      if (!res.data.success) throw new Error('请求失败');
      if (!Array.isArray(res.data.data.categories)) throw new Error('分类应该是数组');
      if (res.data.data.categories.length === 0) throw new Error('分类不应该为空');
      if (!res.data.data.stats) throw new Error('应该包含统计信息');
      return true;
    }
  },

  // 2. 获取分类详情
  {
    name: '获取分类详情',
    async run() {
      const res = await request('GET', '/categories/writing');
      
      if (!res.data.success) throw new Error('请求失败');
      if (res.data.data.id !== 'writing') throw new Error('分类 ID 不正确');
      if (!Array.isArray(res.data.data.subcategories)) throw new Error('应该包含子分类');
      return true;
    }
  },

  // 3. 不存在的分类
  {
    name: '不存在的分类返回 404',
    async run() {
      const res = await request('GET', '/categories/nonexistent');
      
      if (res.status !== 404) throw new Error('应该返回 404');
      if (res.data.error.code !== 'CATEGORY_NOT_FOUND') throw new Error('错误代码不正确');
      return true;
    }
  },

  // 4. 获取分类树
  {
    name: '获取分类树结构',
    async run() {
      const res = await request('GET', '/categories-tree');
      
      if (!res.data.success) throw new Error('请求失败');
      if (!Array.isArray(res.data.data)) throw new Error('树应该是数组');
      if (!res.data.data[0].children) throw new Error('应该包含 children');
      return true;
    }
  },

  // 5. 获取所有技术
  {
    name: '获取提示词技术',
    async run() {
      const res = await request('GET', '/techniques');
      
      if (!res.data.success) throw new Error('请求失败');
      if (!Array.isArray(res.data.data)) throw new Error('技术应该是数组');
      
      const techIds = res.data.data.map(t => t.id);
      if (!techIds.includes('cot')) throw new Error('应该包含 CoT 技术');
      if (!techIds.includes('few-shot')) throw new Error('应该包含 Few-shot 技术');
      return true;
    }
  },

  // 6. 获取技术详情
  {
    name: '获取技术详情',
    async run() {
      const res = await request('GET', '/techniques/cot');
      
      if (!res.data.success) throw new Error('请求失败');
      if (res.data.data.id !== 'cot') throw new Error('技术 ID 不正确');
      if (res.data.data.name !== '思维链') throw new Error('技术名称不正确');
      return true;
    }
  },

  // 7. 搜索分类
  {
    name: '搜索分类',
    async run() {
      const res = await request('GET', '/categories/search?q=写作');
      
      if (!res.data.success) throw new Error('请求失败');
      if (res.data.data.categories.length === 0) throw new Error('应该找到写作分类');
      return true;
    }
  },

  // 8. 搜索技术
  {
    name: '搜索技术',
    async run() {
      const res = await request('GET', '/categories/search?q=思维');
      
      if (!res.data.success) throw new Error('请求失败');
      if (res.data.data.techniques.length === 0) throw new Error('应该找到思维链技术');
      return true;
    }
  },

  // 9. 根据标签筛选
  {
    name: '根据标签筛选',
    async run() {
      const res = await request('POST', '/categories/filter', {
        tags: ['品牌', '营销']
      });
      
      if (!res.data.success) throw new Error('请求失败');
      if (!Array.isArray(res.data.data)) throw new Error('结果应该是数组');
      return true;
    }
  },

  // 10. 推荐分类
  {
    name: '推荐分类',
    async run() {
      const res = await request('POST', '/categories/recommend', {
        scenario: '我想写一篇营销文案'
      });
      
      if (!res.data.success) throw new Error('请求失败');
      if (!Array.isArray(res.data.data)) throw new Error('推荐应该是数组');
      if (res.data.data.length === 0) throw new Error('应该有推荐结果');
      if (!res.data.data[0].relevanceScore) throw new Error('应该包含相关性评分');
      return true;
    }
  },

  // 11. 获取所有标签
  {
    name: '获取所有标签',
    async run() {
      const res = await request('GET', '/tags');
      
      if (!res.data.success) throw new Error('请求失败');
      if (!Array.isArray(res.data.data)) throw new Error('标签应该是数组');
      if (res.data.data.length === 0) throw new Error('标签不应该为空');
      return true;
    }
  },

  // 12. 空搜索关键词
  {
    name: '空搜索关键词返回错误',
    async run() {
      const res = await request('GET', '/categories/search?q=');
      
      if (res.status !== 400) throw new Error('应该返回 400');
      return true;
    }
  }
];

/**
 * 运行测试
 */
async function runTests() {
  console.log('🧪 分类体系 API 测试\n');
  console.log('=' .repeat(50));
  
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      await test.run();
      console.log(`✅ ${test.name}`);
      passed++;
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
      failed++;
    }
  }

  console.log('=' .repeat(50));
  console.log(`\n📊 测试结果: ${passed} 通过, ${failed} 失败`);
  
  if (failed === 0) {
    console.log('🎉 所有分类体系 API 测试通过!\n');
  } else {
    console.log(`⚠️ ${failed} 个测试失败，请检查实现\n`);
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('测试运行失败:', err);
  process.exit(1);
});
