/**
 * PromptBuilder 单元测试
 */

const { PromptBuilder, builder, fromPrompt } = require('../promptBuilder');

// 简单的测试框架
let testsPassed = 0;
let testsFailed = 0;

function describe(name, fn) {
  console.log(`\n📦 ${name}`);
  fn();
}

function it(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ ${name}`);
    console.log(`     Error: ${error.message}`);
    testsFailed++;
  }
}

function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new Error(`Expected "${expected}" but got "${actual}"`);
      }
    },
    toEqual(expected) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
      }
    },
    toContain(expected) {
      if (!actual.includes(expected)) {
        throw new Error(`Expected "${actual}" to contain "${expected}"`);
      }
    },
    toBeTruthy() {
      if (!actual) {
        throw new Error(`Expected truthy value but got "${actual}"`);
      }
    },
    toBeInstanceOf(expected) {
      if (!(actual instanceof expected)) {
        throw new Error(`Expected instance of ${expected.name}`);
      }
    },
    toHaveLength(expected) {
      if (actual.length !== expected) {
        throw new Error(`Expected length ${expected} but got ${actual.length}`);
      }
    }
  };
}

// ================== 测试用例 ==================

describe('PromptBuilder 基础功能', () => {
  it('应该创建一个新的构建器实例', () => {
    const b = builder();
    expect(b).toBeInstanceOf(PromptBuilder);
  });

  it('应该支持链式调用', () => {
    const b = builder()
      .role('软件工程师')
      .context('代码审查')
      .task('分析代码');
    expect(b).toBeInstanceOf(PromptBuilder);
  });
});

describe('PromptBuilder.role()', () => {
  it('应该正确设置角色', () => {
    const result = builder().role('高级软件工程师').build();
    expect(result.content).toContain('你是一位高级软件工程师');
    expect(result.metadata.role).toBe('高级软件工程师');
  });

  it('应该支持英文输出', () => {
    const result = builder()
      .language('en')
      .role('Senior Software Engineer')
      .build();
    expect(result.content).toContain('You are a Senior Software Engineer');
  });
});

describe('PromptBuilder.persona()', () => {
  it('应该正确设置人设', () => {
    const result = builder()
      .persona({
        name: '代码审查专家',
        expertise: 'JavaScript/TypeScript',
        tone: '专业友好',
        traits: ['严谨', '细心', '有耐心']
      })
      .build();
    
    expect(result.content).toContain('代码审查专家');
    expect(result.content).toContain('JavaScript/TypeScript');
    expect(result.metadata.persona.name).toBe('代码审查专家');
  });
});

describe('PromptBuilder.context()', () => {
  it('应该正确设置上下文', () => {
    const result = builder()
      .context('你正在帮助一个初创公司审查他们的代码')
      .build();
    expect(result.content).toContain('背景：你正在帮助一个初创公司审查他们的代码');
  });
});

describe('PromptBuilder.task()', () => {
  it('应该正确设置任务', () => {
    const result = builder()
      .task('分析代码中的性能问题')
      .build();
    expect(result.content).toContain('任务：分析代码中的性能问题');
  });
});

describe('PromptBuilder.constraints()', () => {
  it('应该支持数组形式的约束', () => {
    const result = builder()
      .constraints(['简洁明了', '提供代码示例', '关注安全问题'])
      .build();
    expect(result.content).toContain('- 简洁明了');
    expect(result.content).toContain('- 提供代码示例');
    expect(result.metadata.constraints).toHaveLength(3);
  });

  it('应该支持单个约束', () => {
    const result = builder()
      .constraint('简洁明了')
      .constraint('提供代码示例')
      .build();
    expect(result.metadata.constraints).toHaveLength(2);
  });
});

describe('PromptBuilder.output()', () => {
  it('应该正确设置输出格式', () => {
    const result = builder()
      .output('JSON格式: { issues: [], suggestions: [] }')
      .build();
    expect(result.content).toContain('输出格式：JSON格式');
  });
});

describe('PromptBuilder.variable()', () => {
  it('应该正确定义变量', () => {
    const result = builder()
      .variable('code', { 
        required: true, 
        description: '待审查的代码',
        type: 'string'
      })
      .variable('language', {
        required: false,
        defaultValue: 'javascript'
      })
      .build();
    
    expect(result.variables).toHaveLength(2);
    expect(result.variables[0].name).toBe('code');
    expect(result.variables[0].required).toBe(true);
    expect(result.variables[1].defaultValue).toBe('javascript');
  });

  it('应该在内容中显示必需变量', () => {
    const result = builder()
      .variable('code', { required: true, description: '代码内容' })
      .build();
    expect(result.content).toContain('${code}');
  });
});

describe('PromptBuilder.example() 和 fewShot()', () => {
  it('应该正确添加单个示例', () => {
    const result = builder()
      .example('console.log("hello")', '这是一个简单的日志输出语句')
      .build();
    expect(result.content).toContain('示例 1');
    expect(result.content).toContain('console.log("hello")');
    expect(result.metadata.examples).toHaveLength(1);
  });

  it('应该支持批量添加 Few-shot 示例', () => {
    const result = builder()
      .fewShot([
        { input: '1+1', output: '2' },
        { input: '2+2', output: '4' },
        { input: '3+3', output: '6' }
      ])
      .build();
    expect(result.metadata.examples).toHaveLength(3);
    expect(result.content).toContain('示例 1');
    expect(result.content).toContain('示例 2');
    expect(result.content).toContain('示例 3');
  });
});

describe('PromptBuilder.section()', () => {
  it('应该正确添加自定义段落', () => {
    const result = builder()
      .section('注意事项', '请特别关注内存泄漏问题')
      .build();
    expect(result.content).toContain('注意事项');
    expect(result.content).toContain('请特别关注内存泄漏问题');
  });
});

describe('PromptBuilder.build()', () => {
  it('应该返回完整的构建结果', () => {
    const result = builder()
      .role('助手')
      .task('帮助用户')
      .build();
    
    expect(result.content).toBeTruthy();
    expect(result.metadata).toBeTruthy();
    expect(result.variables).toBeTruthy();
    expect(typeof result.toString).toBe('function');
    expect(typeof result.toJSON).toBe('function');
    expect(typeof result.toYAML).toBe('function');
    expect(typeof result.toMarkdown).toBe('function');
  });
});

describe('PromptBuilder.toJSON()', () => {
  it('应该正确导出 JSON', () => {
    const json = builder()
      .role('工程师')
      .task('写代码')
      .toJSON();
    
    const parsed = JSON.parse(json);
    expect(parsed.role).toBe('工程师');
    expect(parsed.task).toBe('写代码');
    expect(parsed.prompt).toBeTruthy();
  });
});

describe('PromptBuilder.toYAML()', () => {
  it('应该正确导出 YAML', () => {
    const yaml = builder()
      .role('工程师')
      .task('写代码')
      .toYAML();
    
    expect(yaml).toContain('role:');
    expect(yaml).toContain('工程师');
    expect(yaml).toContain('task:');
  });
});

describe('PromptBuilder.toMarkdown()', () => {
  it('应该正确导出 Markdown', () => {
    const md = builder()
      .role('工程师')
      .task('写代码')
      .constraints(['简洁', '高效'])
      .toMarkdown();
    
    expect(md).toContain('# 提示词');
    expect(md).toContain('## 角色');
    expect(md).toContain('## 任务');
    expect(md).toContain('## 约束条件');
  });
});

describe('PromptBuilder.clone()', () => {
  it('应该正确克隆构建器', () => {
    const original = builder().role('工程师').task('写代码');
    const cloned = original.clone();
    
    cloned.role('设计师');
    
    const originalResult = original.build();
    const clonedResult = cloned.build();
    
    expect(originalResult.metadata.role).toBe('工程师');
    expect(clonedResult.metadata.role).toBe('设计师');
  });
});

describe('PromptBuilder.fromJSON()', () => {
  it('应该从 JSON 对象创建构建器', () => {
    const data = {
      role: '数据分析师',
      task: '分析销售数据',
      constraints: ['使用图表', '提供洞察']
    };
    
    const result = PromptBuilder.fromJSON(data).build();
    
    expect(result.metadata.role).toBe('数据分析师');
    expect(result.metadata.task).toBe('分析销售数据');
    expect(result.metadata.constraints).toHaveLength(2);
  });
});

describe('fromPrompt()', () => {
  it('应该从现有提示词创建构建器', () => {
    const prompt = '你是一位专业的翻译。请将以下文本翻译成英文。';
    const result = fromPrompt(prompt).build();
    
    expect(result.content).toContain('原始提示词');
    expect(result.content).toContain(prompt);
  });
});

describe('综合场景测试', () => {
  it('应该正确生成完整的代码审查提示词', () => {
    const result = builder()
      .role('高级软件工程师')
      .persona({
        name: 'CodeReviewer',
        expertise: 'JavaScript, TypeScript, React',
        tone: '专业但友好'
      })
      .context('你正在帮助一个初创公司审查他们的前端代码')
      .task('审查以下代码，识别潜在问题并提供改进建议')
      .constraints([
        '关注性能问题',
        '检查安全漏洞',
        '提供具体的修复代码',
        '解释问题的原因'
      ])
      .output('JSON格式: { issues: [{ line, severity, description, fix }], summary: string }')
      .variable('code', { required: true, description: '待审查的代码' })
      .variable('filename', { required: false, description: '文件名', defaultValue: 'unknown' })
      .example(
        'const x = 1; var y = 2;',
        '{ "issues": [{ "line": 1, "severity": "warning", "description": "使用 var 而不是 const/let", "fix": "将 var 改为 const 或 let" }] }'
      )
      .section('额外注意', '特别关注 React Hooks 的使用是否正确')
      .build();

    // 验证内容完整性
    expect(result.content).toContain('高级软件工程师');
    expect(result.content).toContain('CodeReviewer');
    expect(result.content).toContain('初创公司');
    expect(result.content).toContain('性能问题');
    expect(result.content).toContain('JSON格式');
    expect(result.content).toContain('示例');
    expect(result.content).toContain('React Hooks');

    // 验证元数据
    expect(result.metadata.role).toBe('高级软件工程师');
    expect(result.metadata.constraints).toHaveLength(4);
    expect(result.variables).toHaveLength(2);
    expect(result.metadata.examples).toHaveLength(1);

    console.log('\n📝 生成的完整提示词:\n');
    console.log(result.content);
  });
});

// ================== 运行测试 ==================

console.log('🚀 开始运行 PromptBuilder 单元测试\n');
console.log('='.repeat(50));

// 测试结束总结
process.on('exit', () => {
  console.log('\n' + '='.repeat(50));
  console.log(`\n📊 测试结果: ${testsPassed} 通过, ${testsFailed} 失败`);
  if (testsFailed === 0) {
    console.log('🎉 所有测试通过!\n');
  } else {
    console.log('⚠️ 有测试失败，请检查!\n');
    process.exitCode = 1;
  }
});
