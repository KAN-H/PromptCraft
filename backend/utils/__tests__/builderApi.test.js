/**
 * 构建器 API 集成测试
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

// 简单的 HTTP 请求函数
function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
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

// 测试函数
async function runTests() {
  console.log('🚀 开始运行构建器 API 集成测试\n');
  console.log('='.repeat(50));

  let passed = 0;
  let failed = 0;

  // 测试 1: 基本构建
  console.log('\n📦 测试 1: 基本构建 API');
  try {
    const res = await request('POST', '/api/prompts/build', {
      role: '软件工程师',
      task: '编写代码',
      constraints: ['简洁', '高效']
    });

    if (res.status === 200 && res.data.success) {
      console.log('  ✅ 基本构建成功');
      console.log(`     提示词长度: ${res.data.data.prompt.length} 字符`);
      passed++;
    } else {
      console.log('  ❌ 基本构建失败');
      console.log(`     响应: ${JSON.stringify(res.data)}`);
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ 请求失败: ${error.message}`);
    failed++;
  }

  // 测试 2: 完整构建（所有参数）
  console.log('\n📦 测试 2: 完整构建 API');
  try {
    const res = await request('POST', '/api/prompts/build', {
      role: '高级软件工程师',
      persona: {
        name: 'CodeMaster',
        expertise: 'JavaScript, TypeScript',
        tone: '专业友好'
      },
      context: '代码审查场景',
      task: '审查代码质量',
      constraints: ['关注性能', '检查安全'],
      output: 'JSON格式',
      variables: [
        { name: 'code', required: true, description: '代码内容' }
      ],
      examples: [
        { input: 'var x = 1', output: '建议使用 const' }
      ],
      format: 'json',
      language: 'zh-CN'
    });

    if (res.status === 200 && res.data.success) {
      console.log('  ✅ 完整构建成功');
      console.log(`     格式: ${res.data.data.format}`);
      console.log(`     变量数: ${res.data.data.variables.length}`);
      passed++;
    } else {
      console.log('  ❌ 完整构建失败');
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ 请求失败: ${error.message}`);
    failed++;
  }

  // 测试 3: YAML 格式输出
  console.log('\n📦 测试 3: YAML 格式输出');
  try {
    const res = await request('POST', '/api/prompts/build', {
      role: '翻译专家',
      task: '翻译文本',
      format: 'yaml'
    });

    if (res.status === 200 && res.data.data.format === 'yaml') {
      console.log('  ✅ YAML 输出成功');
      console.log(`     包含 "role:" : ${res.data.data.formatted.includes('role:')}`);
      passed++;
    } else {
      console.log('  ❌ YAML 输出失败');
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ 请求失败: ${error.message}`);
    failed++;
  }

  // 测试 4: Markdown 格式输出
  console.log('\n📦 测试 4: Markdown 格式输出');
  try {
    const res = await request('POST', '/api/prompts/build', {
      role: '写作助手',
      task: '写文章',
      constraints: ['简洁', '有趣'],
      format: 'markdown'
    });

    if (res.status === 200 && res.data.data.formatted.includes('# 提示词')) {
      console.log('  ✅ Markdown 输出成功');
      passed++;
    } else {
      console.log('  ❌ Markdown 输出失败');
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ 请求失败: ${error.message}`);
    failed++;
  }

  // 测试 5: 英文语言
  console.log('\n📦 测试 5: 英文语言输出');
  try {
    const res = await request('POST', '/api/prompts/build', {
      role: 'Software Engineer',
      task: 'Review code',
      language: 'en'
    });

    if (res.status === 200 && res.data.data.prompt.includes('You are a')) {
      console.log('  ✅ 英文输出成功');
      passed++;
    } else {
      console.log('  ❌ 英文输出失败');
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ 请求失败: ${error.message}`);
    failed++;
  }

  // 测试 6: 获取构建器模板
  console.log('\n📦 测试 6: 获取构建器模板');
  try {
    const res = await request('GET', '/api/prompts/builder-templates');

    if (res.status === 200 && res.data.success && res.data.templates.length > 0) {
      console.log('  ✅ 获取模板成功');
      console.log(`     模板数量: ${res.data.templates.length}`);
      res.data.templates.forEach(t => {
        console.log(`     - ${t.icon} ${t.name}`);
      });
      passed++;
    } else {
      console.log('  ❌ 获取模板失败');
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ 请求失败: ${error.message}`);
    failed++;
  }

  // 测试 7: 解析提示词
  console.log('\n📦 测试 7: 解析提示词');
  try {
    const res = await request('POST', '/api/prompts/parse', {
      prompt: '你是一位专业的数据分析师。请分析以下数据并给出建议。'
    });

    if (res.status === 200 && res.data.success) {
      console.log('  ✅ 解析提示词成功');
      passed++;
    } else {
      console.log('  ❌ 解析提示词失败');
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ 请求失败: ${error.message}`);
    failed++;
  }

  // 测试 8: 使用模板构建
  console.log('\n📦 测试 8: 使用模板预设构建');
  try {
    // 先获取模板
    const templatesRes = await request('GET', '/api/prompts/builder-templates');
    const codeReviewTemplate = templatesRes.data.templates.find(t => t.id === 'code-review');

    if (codeReviewTemplate) {
      const res = await request('POST', '/api/prompts/build', codeReviewTemplate.preset);

      if (res.status === 200 && res.data.success) {
        console.log('  ✅ 模板预设构建成功');
        console.log(`     提示词预览: ${res.data.data.prompt.substring(0, 50)}...`);
        passed++;
      } else {
        console.log('  ❌ 模板预设构建失败');
        failed++;
      }
    } else {
      console.log('  ❌ 未找到代码审查模板');
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ 请求失败: ${error.message}`);
    failed++;
  }

  // 总结
  console.log('\n' + '='.repeat(50));
  console.log(`\n📊 测试结果: ${passed} 通过, ${failed} 失败`);
  
  if (failed === 0) {
    console.log('🎉 所有 API 测试通过!\n');
  } else {
    console.log('⚠️ 有测试失败，请检查服务器状态!\n');
  }
}

// 检查服务器是否运行
async function checkServer() {
  try {
    await request('GET', '/api/prompts/scenarios');
    return true;
  } catch {
    return false;
  }
}

// 主函数
async function main() {
  console.log('🔍 检查服务器状态...\n');
  
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('❌ 服务器未运行!');
    console.log('请先启动服务器: npm run dev\n');
    process.exit(1);
  }

  console.log('✅ 服务器已运行\n');
  await runTests();
}

main().catch(console.error);
