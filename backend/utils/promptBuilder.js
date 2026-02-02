/**
 * PromptBuilder - 流式提示词构建器
 * 
 * 提供链式调用 API 来构建结构化提示词
 * 
 * @example
 * ```javascript
 * const { builder } = require('./promptBuilder');
 * 
 * const prompt = builder()
 *   .role('高级软件工程师')
 *   .context('你正在帮助审查一个 React 项目')
 *   .task('分析代码中的潜在问题和改进点')
 *   .constraints(['关注性能问题', '提供具体修复建议'])
 *   .output('JSON格式: { issues: [], suggestions: [] }')
 *   .variable('code', { required: true, description: '待审查的代码' })
 *   .build();
 * ```
 */

const yaml = require('js-yaml');

/**
 * 提示词构建器类
 */
class PromptBuilder {
  constructor() {
    this._data = {
      role: '',
      persona: null,
      context: '',
      task: '',
      constraints: [],
      output: '',
      variables: [],
      examples: [],
      sections: [],
      format: 'text', // text, json, yaml, markdown
      language: 'zh-CN',
      metadata: {}
    };
  }

  /**
   * 设置角色
   * @param {string} role - 角色描述
   * @returns {PromptBuilder}
   */
  role(role) {
    this._data.role = role;
    return this;
  }

  /**
   * 设置详细的角色人设
   * @param {Object} persona - 人设对象
   * @param {string} persona.name - 角色名称
   * @param {string} persona.expertise - 专业领域
   * @param {string} persona.tone - 语气风格
   * @param {string[]} [persona.traits] - 特征列表
   * @returns {PromptBuilder}
   */
  persona(persona) {
    this._data.persona = persona;
    return this;
  }

  /**
   * 设置上下文/背景
   * @param {string} context - 上下文描述
   * @returns {PromptBuilder}
   */
  context(context) {
    this._data.context = context;
    return this;
  }

  /**
   * 设置任务描述
   * @param {string} task - 任务描述
   * @returns {PromptBuilder}
   */
  task(task) {
    this._data.task = task;
    return this;
  }

  /**
   * 设置约束条件
   * @param {string|string[]} constraints - 约束条件
   * @returns {PromptBuilder}
   */
  constraints(constraints) {
    if (Array.isArray(constraints)) {
      this._data.constraints = [...this._data.constraints, ...constraints];
    } else {
      this._data.constraints.push(constraints);
    }
    return this;
  }

  /**
   * 添加单个约束条件（别名）
   * @param {string} constraint - 约束条件
   * @returns {PromptBuilder}
   */
  constraint(constraint) {
    return this.constraints(constraint);
  }

  /**
   * 设置输出格式要求
   * @param {string} output - 输出格式描述
   * @returns {PromptBuilder}
   */
  output(output) {
    this._data.output = output;
    return this;
  }

  /**
   * 定义变量
   * @param {string} name - 变量名
   * @param {Object} [options] - 变量选项
   * @param {boolean} [options.required=false] - 是否必需
   * @param {string} [options.description] - 变量描述
   * @param {string} [options.defaultValue] - 默认值
   * @param {string} [options.type] - 变量类型 (string, number, array, object)
   * @returns {PromptBuilder}
   */
  variable(name, options = {}) {
    this._data.variables.push({
      name,
      required: options.required || false,
      description: options.description || '',
      defaultValue: options.defaultValue,
      type: options.type || 'string'
    });
    return this;
  }

  /**
   * 添加输入输出示例
   * @param {string} input - 示例输入
   * @param {string} output - 示例输出
   * @returns {PromptBuilder}
   */
  example(input, output) {
    this._data.examples.push({ input, output });
    return this;
  }

  /**
   * 批量添加 Few-shot 示例
   * @param {Array<{input: string, output: string}>} examples - 示例数组
   * @returns {PromptBuilder}
   */
  fewShot(examples) {
    this._data.examples = [...this._data.examples, ...examples];
    return this;
  }

  /**
   * 添加自定义段落
   * @param {string} title - 段落标题
   * @param {string} content - 段落内容
   * @returns {PromptBuilder}
   */
  section(title, content) {
    this._data.sections.push({ title, content });
    return this;
  }

  /**
   * 设置输出格式
   * @param {'text'|'json'|'yaml'|'markdown'} format - 格式类型
   * @returns {PromptBuilder}
   */
  format(format) {
    this._data.format = format;
    return this;
  }

  /**
   * 设置语言
   * @param {string} language - 语言代码
   * @returns {PromptBuilder}
   */
  language(language) {
    this._data.language = language;
    return this;
  }

  /**
   * 添加元数据
   * @param {string} key - 键
   * @param {any} value - 值
   * @returns {PromptBuilder}
   */
  meta(key, value) {
    this._data.metadata[key] = value;
    return this;
  }

  /**
   * 构建最终的提示词
   * @returns {Object} 构建结果
   */
  build() {
    const content = this._generateContent();
    
    return {
      content,
      variables: this._data.variables,
      metadata: {
        role: this._data.role,
        persona: this._data.persona,
        context: this._data.context,
        task: this._data.task,
        constraints: this._data.constraints,
        output: this._data.output,
        examples: this._data.examples,
        sections: this._data.sections,
        format: this._data.format,
        language: this._data.language,
        ...this._data.metadata
      },
      // 便捷方法
      toString: () => content,
      toJSON: () => this.toJSON(),
      toYAML: () => this.toYAML(),
      toMarkdown: () => this.toMarkdown()
    };
  }

  /**
   * 生成提示词文本内容
   * @private
   */
  _generateContent() {
    const parts = [];
    const lang = this._data.language;
    const isZh = lang.startsWith('zh');

    // 角色部分
    if (this._data.role) {
      if (isZh) {
        parts.push(`你是一位${this._data.role}。`);
      } else {
        parts.push(`You are a ${this._data.role}.`);
      }
    }

    // 人设部分
    if (this._data.persona) {
      const p = this._data.persona;
      if (isZh) {
        let personaText = `角色设定：\n- 名称：${p.name || '助手'}`;
        if (p.expertise) personaText += `\n- 专业领域：${p.expertise}`;
        if (p.tone) personaText += `\n- 语气风格：${p.tone}`;
        if (p.traits && p.traits.length) {
          personaText += `\n- 特征：${p.traits.join('、')}`;
        }
        parts.push(personaText);
      } else {
        let personaText = `Persona:\n- Name: ${p.name || 'Assistant'}`;
        if (p.expertise) personaText += `\n- Expertise: ${p.expertise}`;
        if (p.tone) personaText += `\n- Tone: ${p.tone}`;
        if (p.traits && p.traits.length) {
          personaText += `\n- Traits: ${p.traits.join(', ')}`;
        }
        parts.push(personaText);
      }
    }

    // 上下文部分
    if (this._data.context) {
      if (isZh) {
        parts.push(`背景：${this._data.context}`);
      } else {
        parts.push(`Context: ${this._data.context}`);
      }
    }

    // 任务部分
    if (this._data.task) {
      if (isZh) {
        parts.push(`任务：${this._data.task}`);
      } else {
        parts.push(`Task: ${this._data.task}`);
      }
    }

    // 约束条件
    if (this._data.constraints.length > 0) {
      if (isZh) {
        parts.push('约束条件：\n' + this._data.constraints.map(c => `- ${c}`).join('\n'));
      } else {
        parts.push('Constraints:\n' + this._data.constraints.map(c => `- ${c}`).join('\n'));
      }
    }

    // 示例部分 (Few-shot)
    if (this._data.examples.length > 0) {
      if (isZh) {
        let exampleText = '示例：';
        this._data.examples.forEach((ex, i) => {
          exampleText += `\n\n示例 ${i + 1}：\n输入：${ex.input}\n输出：${ex.output}`;
        });
        parts.push(exampleText);
      } else {
        let exampleText = 'Examples:';
        this._data.examples.forEach((ex, i) => {
          exampleText += `\n\nExample ${i + 1}:\nInput: ${ex.input}\nOutput: ${ex.output}`;
        });
        parts.push(exampleText);
      }
    }

    // 自定义段落
    this._data.sections.forEach(sec => {
      parts.push(`${sec.title}：\n${sec.content}`);
    });

    // 输出格式
    if (this._data.output) {
      if (isZh) {
        parts.push(`输出格式：${this._data.output}`);
      } else {
        parts.push(`Output Format: ${this._data.output}`);
      }
    }

    // 变量占位符说明
    if (this._data.variables.length > 0) {
      const requiredVars = this._data.variables.filter(v => v.required);
      if (requiredVars.length > 0) {
        if (isZh) {
          const varDesc = requiredVars.map(v => {
            let desc = `\${${v.name}}`;
            if (v.description) desc += ` - ${v.description}`;
            return desc;
          }).join('\n');
          parts.push(`请提供以下信息：\n${varDesc}`);
        } else {
          const varDesc = requiredVars.map(v => {
            let desc = `\${${v.name}}`;
            if (v.description) desc += ` - ${v.description}`;
            return desc;
          }).join('\n');
          parts.push(`Please provide:\n${varDesc}`);
        }
      }
    }

    return parts.join('\n\n');
  }

  /**
   * 导出为 JSON 格式
   * @param {boolean} [pretty=true] - 是否格式化
   * @returns {string}
   */
  toJSON(pretty = true) {
    const data = {
      role: this._data.role,
      persona: this._data.persona,
      context: this._data.context,
      task: this._data.task,
      constraints: this._data.constraints,
      output: this._data.output,
      variables: this._data.variables,
      examples: this._data.examples,
      sections: this._data.sections,
      prompt: this._generateContent()
    };
    
    // 移除空值
    Object.keys(data).forEach(key => {
      if (data[key] === '' || data[key] === null || 
          (Array.isArray(data[key]) && data[key].length === 0)) {
        delete data[key];
      }
    });

    return pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  }

  /**
   * 导出为 YAML 格式
   * @returns {string}
   */
  toYAML() {
    const data = {
      role: this._data.role || undefined,
      persona: this._data.persona || undefined,
      context: this._data.context || undefined,
      task: this._data.task || undefined,
      constraints: this._data.constraints.length ? this._data.constraints : undefined,
      output: this._data.output || undefined,
      variables: this._data.variables.length ? this._data.variables : undefined,
      examples: this._data.examples.length ? this._data.examples : undefined,
      sections: this._data.sections.length ? this._data.sections : undefined,
      prompt: this._generateContent()
    };

    // 移除 undefined 值
    Object.keys(data).forEach(key => {
      if (data[key] === undefined) {
        delete data[key];
      }
    });

    return yaml.dump(data, { 
      indent: 2, 
      lineWidth: -1,
      quotingType: '"',
      forceQuotes: false
    });
  }

  /**
   * 导出为 Markdown 格式
   * @returns {string}
   */
  toMarkdown() {
    const parts = [];

    parts.push('# 提示词\n');

    if (this._data.role) {
      parts.push(`## 角色\n\n${this._data.role}\n`);
    }

    if (this._data.persona) {
      const p = this._data.persona;
      let personaMd = '## 人设\n\n';
      personaMd += `| 属性 | 值 |\n|------|----|\n`;
      personaMd += `| 名称 | ${p.name || '-'} |\n`;
      if (p.expertise) personaMd += `| 专业领域 | ${p.expertise} |\n`;
      if (p.tone) personaMd += `| 语气风格 | ${p.tone} |\n`;
      if (p.traits) personaMd += `| 特征 | ${p.traits.join(', ')} |\n`;
      parts.push(personaMd);
    }

    if (this._data.context) {
      parts.push(`## 背景\n\n${this._data.context}\n`);
    }

    if (this._data.task) {
      parts.push(`## 任务\n\n${this._data.task}\n`);
    }

    if (this._data.constraints.length > 0) {
      parts.push('## 约束条件\n\n' + this._data.constraints.map(c => `- ${c}`).join('\n') + '\n');
    }

    if (this._data.examples.length > 0) {
      let exMd = '## 示例\n\n';
      this._data.examples.forEach((ex, i) => {
        exMd += `### 示例 ${i + 1}\n\n`;
        exMd += `**输入:**\n\`\`\`\n${ex.input}\n\`\`\`\n\n`;
        exMd += `**输出:**\n\`\`\`\n${ex.output}\n\`\`\`\n\n`;
      });
      parts.push(exMd);
    }

    if (this._data.output) {
      parts.push(`## 输出格式\n\n${this._data.output}\n`);
    }

    if (this._data.variables.length > 0) {
      let varMd = '## 变量\n\n';
      varMd += '| 名称 | 必需 | 类型 | 描述 | 默认值 |\n';
      varMd += '|------|------|------|------|--------|\n';
      this._data.variables.forEach(v => {
        varMd += `| \`${v.name}\` | ${v.required ? '✅' : '❌'} | ${v.type} | ${v.description || '-'} | ${v.defaultValue || '-'} |\n`;
      });
      parts.push(varMd);
    }

    parts.push('## 生成的提示词\n\n```\n' + this._generateContent() + '\n```\n');

    return parts.join('\n');
  }

  /**
   * 克隆当前构建器
   * @returns {PromptBuilder}
   */
  clone() {
    const cloned = new PromptBuilder();
    cloned._data = JSON.parse(JSON.stringify(this._data));
    return cloned;
  }

  /**
   * 从 JSON 对象加载
   * @param {Object} data - JSON 对象
   * @returns {PromptBuilder}
   */
  static fromJSON(data) {
    const builder = new PromptBuilder();
    if (data.role) builder.role(data.role);
    if (data.persona) builder.persona(data.persona);
    if (data.context) builder.context(data.context);
    if (data.task) builder.task(data.task);
    if (data.constraints) builder.constraints(data.constraints);
    if (data.output) builder.output(data.output);
    if (data.variables) {
      data.variables.forEach(v => builder.variable(v.name, v));
    }
    if (data.examples) builder.fewShot(data.examples);
    if (data.sections) {
      data.sections.forEach(s => builder.section(s.title, s.content));
    }
    return builder;
  }
}

/**
 * 创建新的提示词构建器实例
 * @returns {PromptBuilder}
 */
function builder() {
  return new PromptBuilder();
}

/**
 * 从现有提示词文本创建构建器（简单解析）
 * @param {string} content - 提示词文本
 * @returns {PromptBuilder}
 */
function fromPrompt(content) {
  const b = new PromptBuilder();
  // 简单的启发式解析
  const lines = content.split('\n');
  
  lines.forEach(line => {
    if (line.startsWith('你是') || line.startsWith('You are')) {
      b.role(line.replace(/^(你是一位?|You are a?\s*)/i, '').replace(/[。.]$/, ''));
    }
  });
  
  // 保存原始内容作为自定义段落
  b.section('原始提示词', content);
  
  return b;
}

module.exports = {
  PromptBuilder,
  builder,
  fromPrompt
};
