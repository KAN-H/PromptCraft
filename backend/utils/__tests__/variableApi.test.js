/**
 * VariableParser API 集成测试
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
      path: url.pathname,
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
  // 1. 解析变量
  {
    name: '解析模板变量',
    async run() {
      const res = await request('POST', '/variables/parse', {
        template: '你好，${name}！你今年 ${age:18:number} 岁。'
      });
      
      if (!res.data.success) throw new Error('请求失败');
      if (res.data.data.variables.length !== 2) throw new Error('变量数量不正确');
      if (res.data.data.variables[0].name !== 'name') throw new Error('变量名不正确');
      if (res.data.data.variables[1].type !== 'number') throw new Error('类型不正确');
      if (!res.data.data.hasVariables) throw new Error('hasVariables 应为 true');
      return true;
    }
  },

  // 2. 生成表单字段
  {
    name: '生成表单字段定义',
    async run() {
      const res = await request('POST', '/variables/parse', {
        template: '邮箱: ${email::email}, 年龄: ${age::number}'
      });
      
      if (!res.data.success) throw new Error('请求失败');
      const fields = res.data.data.formFields;
      if (fields.length !== 2) throw new Error('字段数量不正确');
      if (fields[0].type !== 'email') throw new Error('email 输入类型不正确');
      if (fields[1].type !== 'number') throw new Error('number 输入类型不正确');
      return true;
    }
  },

  // 3. 填充变量
  {
    name: '填充模板变量',
    async run() {
      const res = await request('POST', '/variables/interpolate', {
        template: '你好，${name}！',
        values: { name: '张三' }
      });
      
      if (!res.data.success) throw new Error('请求失败');
      if (res.data.data.result !== '你好，张三！') throw new Error('插值结果不正确');
      return true;
    }
  },

  // 4. 使用默认值
  {
    name: '使用默认值填充',
    async run() {
      const res = await request('POST', '/variables/interpolate', {
        template: '你好，${name:用户}！',
        values: {},
        options: { keepUnmatched: true }
      });
      
      if (!res.data.success) throw new Error('请求失败');
      if (res.data.data.result !== '你好，用户！') throw new Error('默认值未生效');
      return true;
    }
  },

  // 5. 缺少必需变量时验证失败
  {
    name: '缺少必需变量验证',
    async run() {
      const res = await request('POST', '/variables/interpolate', {
        template: '你好，${name}！',
        values: {}
      });
      
      if (res.status !== 400) throw new Error('应该返回 400 错误');
      if (res.data.error.code !== 'VALIDATION_FAILED') throw new Error('错误代码不正确');
      if (!res.data.error.details.missing.includes('name')) throw new Error('应该包含 name 在 missing 中');
      return true;
    }
  },

  // 6. 类型验证
  {
    name: '变量类型验证',
    async run() {
      const res = await request('POST', '/variables/validate', {
        template: '年龄: ${age::number}',
        values: { age: 'abc' }
      });
      
      if (!res.data.success) throw new Error('请求失败');
      if (res.data.data.valid) throw new Error('类型验证应该失败');
      if (res.data.data.errors.length !== 1) throw new Error('应该有一个类型错误');
      return true;
    }
  },

  // 7. 邮箱验证
  {
    name: '邮箱格式验证',
    async run() {
      const res = await request('POST', '/variables/validate', {
        template: '邮箱: ${email::email}',
        values: { email: 'test@example.com' }
      });
      
      if (!res.data.success) throw new Error('请求失败');
      if (!res.data.data.valid) throw new Error('有效邮箱应该通过验证');
      return true;
    }
  },

  // 8. 获取变量类型列表
  {
    name: '获取支持的变量类型',
    async run() {
      const res = await request('GET', '/variables/types');
      
      if (!res.data.success) throw new Error('请求失败');
      if (!res.data.data.types.includes('string')) throw new Error('应该包含 string 类型');
      if (!res.data.data.types.includes('number')) throw new Error('应该包含 number 类型');
      if (res.data.data.typeDetails.length !== 9) throw new Error('类型详情数量不正确');
      return true;
    }
  },

  // 9. 复杂模板解析
  {
    name: '复杂模板解析',
    async run() {
      const res = await request('POST', '/variables/parse', {
        template: `
请帮我翻译以下内容:
源语言: \${source_lang:英文}
目标语言: \${target_lang:中文}
文本: \${text}
风格: \${style:正式:string}
        `
      });
      
      if (!res.data.success) throw new Error('请求失败');
      if (res.data.data.variables.length !== 4) throw new Error('变量数量不正确');
      if (res.data.data.requiredCount !== 1) throw new Error('必需变量数量不正确');
      if (res.data.data.optionalCount !== 3) throw new Error('可选变量数量不正确');
      return true;
    }
  },

  // 10. 保留未匹配变量选项
  {
    name: 'keepUnmatched 选项测试',
    async run() {
      const res = await request('POST', '/variables/interpolate', {
        template: '你好，${name}！年龄: ${age}',
        values: { name: '张三' },
        options: { keepUnmatched: true }
      });
      
      if (!res.data.success) throw new Error('请求失败');
      if (res.data.data.result !== '你好，张三！年龄: ${age}') throw new Error('keepUnmatched 未生效');
      return true;
    }
  },

  // 11. 变量高亮
  {
    name: '变量高亮显示',
    async run() {
      const res = await request('POST', '/variables/parse', {
        template: '你好，${name}！'
      });
      
      if (!res.data.success) throw new Error('请求失败');
      if (!res.data.data.highlighted.includes('<mark>')) throw new Error('高亮标签不存在');
      if (res.data.data.highlighted !== '你好，<mark>${name}</mark>！') throw new Error('高亮内容不正确');
      return true;
    }
  },

  // 12. 空模板处理
  {
    name: '空模板错误处理',
    async run() {
      const res = await request('POST', '/variables/parse', {
        template: ''
      });
      
      if (res.status !== 400) throw new Error('应该返回 400 错误');
      return true;
    }
  }
];

/**
 * 运行测试
 */
async function runTests() {
  console.log('🧪 变量解析器 API 测试\n');
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
    console.log('🎉 所有变量解析器 API 测试通过!\n');
  } else {
    console.log(`⚠️ ${failed} 个测试失败，请检查实现\n`);
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('测试运行失败:', err);
  process.exit(1);
});
