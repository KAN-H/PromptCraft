/**
 * VariableParser - 增强的变量解析器
 * 
 * 支持以下变量语法:
 * - ${name}              - 基本变量
 * - ${name:default}      - 带默认值
 * - ${name:default:type} - 带默认值和类型
 * - ${name::type}        - 只有类型
 * 
 * @example
 * ```javascript
 * const { VariableParser } = require('./variableParser');
 * 
 * const template = '你好，${name:用户}！你的年龄是 ${age::number} 岁。';
 * const variables = VariableParser.parse(template);
 * const result = VariableParser.interpolate(template, { name: '张三', age: 25 });
 * ```
 */

/**
 * 变量类型枚举
 */
const VariableTypes = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  ARRAY: 'array',
  OBJECT: 'object',
  DATE: 'date',
  EMAIL: 'email',
  URL: 'url',
  TEXT: 'text' // 多行文本
};

/**
 * 变量解析器类
 */
class VariableParser {
  /**
   * 变量正则表达式
   * 匹配: ${name}, ${name:default}, ${name:default:type}, ${name::type}
   */
  static VARIABLE_REGEX = /\$\{([a-zA-Z_][a-zA-Z0-9_]*)(?::([^:}]*))?(?::([^}]*))?\}/g;

  /**
   * 解析模板中的所有变量
   * @param {string} template - 模板字符串
   * @returns {Array<Object>} 变量数组
   */
  static parse(template) {
    if (!template || typeof template !== 'string') {
      return [];
    }

    const variables = [];
    const seen = new Set();
    let match;

    // 重置正则状态
    this.VARIABLE_REGEX.lastIndex = 0;

    while ((match = this.VARIABLE_REGEX.exec(template)) !== null) {
      const name = match[1];
      
      // 避免重复变量
      if (seen.has(name)) {
        continue;
      }
      seen.add(name);

      const defaultValue = match[2] !== undefined ? match[2] : '';
      const type = match[3] || this._inferType(defaultValue) || VariableTypes.STRING;

      variables.push({
        name,
        defaultValue,
        type: this._normalizeType(type),
        fullMatch: match[0],
        required: !defaultValue, // 没有默认值则为必需
        position: {
          start: match.index,
          end: match.index + match[0].length
        }
      });
    }

    return variables;
  }

  /**
   * 使用给定值插值模板
   * @param {string} template - 模板字符串
   * @param {Object} values - 变量值映射
   * @param {Object} [options] - 选项
   * @param {boolean} [options.strict=false] - 严格模式，缺少必需变量时抛出错误
   * @param {boolean} [options.keepUnmatched=false] - 保留未匹配的变量
   * @param {string} [options.placeholder='[{name}]'] - 缺失值的占位符模板
   * @returns {string} 插值后的字符串
   */
  static interpolate(template, values = {}, options = {}) {
    const { strict = false, keepUnmatched = false, placeholder = '[{name}]' } = options;

    if (!template || typeof template !== 'string') {
      return template;
    }

    // 解析变量以获取类型信息
    const variables = this.parse(template);
    const varMap = new Map(variables.map(v => [v.name, v]));

    // 重置正则状态
    this.VARIABLE_REGEX.lastIndex = 0;

    return template.replace(this.VARIABLE_REGEX, (match, name, defaultValue, type) => {
      const varInfo = varMap.get(name);
      
      // 检查是否提供了值
      if (values.hasOwnProperty(name) && values[name] !== undefined && values[name] !== '') {
        let value = values[name];
        
        // 类型转换
        if (varInfo && varInfo.type) {
          value = this._convertType(value, varInfo.type);
        }
        
        return String(value);
      }

      // 使用默认值
      if (defaultValue !== undefined && defaultValue !== '') {
        return defaultValue;
      }

      // 严格模式
      if (strict && varInfo && varInfo.required) {
        throw new Error(`缺少必需的变量: ${name}`);
      }

      // 保留未匹配的变量
      if (keepUnmatched) {
        return match;
      }

      // 返回占位符
      return placeholder.replace('{name}', name);
    });
  }

  /**
   * 验证模板中的变量是否都已提供值
   * @param {string} template - 模板字符串
   * @param {Object} values - 变量值映射
   * @returns {Object} 验证结果
   */
  static validate(template, values = {}) {
    const variables = this.parse(template);
    const missing = [];
    const provided = [];
    const errors = [];

    for (const v of variables) {
      const value = values[v.name];
      const hasValue = value !== undefined && value !== '';

      if (hasValue) {
        // 类型验证
        const typeError = this._validateType(value, v.type);
        if (typeError) {
          errors.push({
            variable: v.name,
            error: typeError
          });
        }
        provided.push(v.name);
      } else if (v.required) {
        missing.push(v.name);
      } else {
        provided.push(v.name); // 有默认值的也算提供了
      }
    }

    return {
      valid: missing.length === 0 && errors.length === 0,
      missing,
      provided,
      errors,
      variables
    };
  }

  /**
   * 提取模板中的所有变量名
   * @param {string} template - 模板字符串
   * @returns {string[]} 变量名数组
   */
  static extractNames(template) {
    return this.parse(template).map(v => v.name);
  }

  /**
   * 检查模板是否包含变量
   * @param {string} template - 模板字符串
   * @returns {boolean}
   */
  static hasVariables(template) {
    if (!template || typeof template !== 'string') {
      return false;
    }
    this.VARIABLE_REGEX.lastIndex = 0;
    return this.VARIABLE_REGEX.test(template);
  }

  /**
   * 生成变量的输入表单结构
   * @param {string} template - 模板字符串
   * @returns {Array<Object>} 表单字段定义
   */
  static generateFormFields(template) {
    const variables = this.parse(template);
    
    return variables.map(v => ({
      name: v.name,
      label: this._formatLabel(v.name),
      type: this._getInputType(v.type),
      required: v.required,
      defaultValue: v.defaultValue,
      placeholder: v.defaultValue || `请输入${this._formatLabel(v.name)}`,
      validation: this._getValidationRules(v.type)
    }));
  }

  /**
   * 高亮模板中的变量
   * @param {string} template - 模板字符串
   * @param {string} [startTag='<mark>'] - 开始标签
   * @param {string} [endTag='</mark>'] - 结束标签
   * @returns {string} 高亮后的字符串
   */
  static highlight(template, startTag = '<mark>', endTag = '</mark>') {
    if (!template || typeof template !== 'string') {
      return template;
    }
    this.VARIABLE_REGEX.lastIndex = 0;
    return template.replace(this.VARIABLE_REGEX, `${startTag}$&${endTag}`);
  }

  /**
   * 从默认值推断类型
   * @private
   */
  static _inferType(defaultValue) {
    if (!defaultValue) return null;
    
    if (!isNaN(Number(defaultValue))) return VariableTypes.NUMBER;
    if (defaultValue === 'true' || defaultValue === 'false') return VariableTypes.BOOLEAN;
    if (defaultValue.includes('@')) return VariableTypes.EMAIL;
    if (defaultValue.startsWith('http')) return VariableTypes.URL;
    
    return VariableTypes.STRING;
  }

  /**
   * 规范化类型名称
   * @private
   */
  static _normalizeType(type) {
    if (!type) return VariableTypes.STRING;
    
    const normalized = type.toLowerCase().trim();
    
    const typeMap = {
      'str': VariableTypes.STRING,
      'string': VariableTypes.STRING,
      'num': VariableTypes.NUMBER,
      'number': VariableTypes.NUMBER,
      'int': VariableTypes.NUMBER,
      'integer': VariableTypes.NUMBER,
      'float': VariableTypes.NUMBER,
      'bool': VariableTypes.BOOLEAN,
      'boolean': VariableTypes.BOOLEAN,
      'arr': VariableTypes.ARRAY,
      'array': VariableTypes.ARRAY,
      'list': VariableTypes.ARRAY,
      'obj': VariableTypes.OBJECT,
      'object': VariableTypes.OBJECT,
      'json': VariableTypes.OBJECT,
      'date': VariableTypes.DATE,
      'datetime': VariableTypes.DATE,
      'email': VariableTypes.EMAIL,
      'url': VariableTypes.URL,
      'link': VariableTypes.URL,
      'text': VariableTypes.TEXT,
      'textarea': VariableTypes.TEXT
    };

    return typeMap[normalized] || VariableTypes.STRING;
  }

  /**
   * 类型转换
   * @private
   */
  static _convertType(value, type) {
    switch (type) {
      case VariableTypes.NUMBER:
        const num = Number(value);
        return isNaN(num) ? value : num;
      case VariableTypes.BOOLEAN:
        if (typeof value === 'boolean') return value;
        return value === 'true' || value === '1' || value === 'yes';
      case VariableTypes.ARRAY:
        if (Array.isArray(value)) return value;
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? parsed : [value];
        } catch {
          return value.split(',').map(s => s.trim());
        }
      case VariableTypes.OBJECT:
        if (typeof value === 'object') return value;
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      default:
        return value;
    }
  }

  /**
   * 类型验证
   * @private
   */
  static _validateType(value, type) {
    switch (type) {
      case VariableTypes.NUMBER:
        if (isNaN(Number(value))) {
          return '必须是数字';
        }
        break;
      case VariableTypes.EMAIL:
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return '邮箱格式不正确';
        }
        break;
      case VariableTypes.URL:
        try {
          new URL(value);
        } catch {
          return 'URL 格式不正确';
        }
        break;
      case VariableTypes.BOOLEAN:
        if (!['true', 'false', '1', '0', 'yes', 'no'].includes(String(value).toLowerCase())) {
          return '必须是布尔值';
        }
        break;
    }
    return null;
  }

  /**
   * 格式化标签名
   * @private
   */
  static _formatLabel(name) {
    return name
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  /**
   * 获取输入类型
   * @private
   */
  static _getInputType(type) {
    const inputTypeMap = {
      [VariableTypes.STRING]: 'text',
      [VariableTypes.NUMBER]: 'number',
      [VariableTypes.BOOLEAN]: 'checkbox',
      [VariableTypes.EMAIL]: 'email',
      [VariableTypes.URL]: 'url',
      [VariableTypes.DATE]: 'date',
      [VariableTypes.TEXT]: 'textarea',
      [VariableTypes.ARRAY]: 'text',
      [VariableTypes.OBJECT]: 'textarea'
    };
    return inputTypeMap[type] || 'text';
  }

  /**
   * 获取验证规则
   * @private
   */
  static _getValidationRules(type) {
    const rules = {};
    
    switch (type) {
      case VariableTypes.NUMBER:
        rules.pattern = '^-?\\d*\\.?\\d+$';
        break;
      case VariableTypes.EMAIL:
        rules.pattern = '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$';
        break;
      case VariableTypes.URL:
        rules.pattern = '^https?:\\/\\/.+';
        break;
    }
    
    return rules;
  }
}

/**
 * 创建一个可链式调用的变量构建器
 */
class VariableBuilder {
  constructor(name) {
    this._name = name;
    this._defaultValue = '';
    this._type = VariableTypes.STRING;
    this._description = '';
    this._required = false;
    this._validation = null;
  }

  /**
   * 设置默认值
   */
  default(value) {
    this._defaultValue = value;
    return this;
  }

  /**
   * 设置类型
   */
  type(type) {
    this._type = VariableParser._normalizeType(type);
    return this;
  }

  /**
   * 设置描述
   */
  description(desc) {
    this._description = desc;
    return this;
  }

  /**
   * 设为必需
   */
  required() {
    this._required = true;
    return this;
  }

  /**
   * 设置自定义验证
   */
  validate(fn) {
    this._validation = fn;
    return this;
  }

  /**
   * 构建变量定义
   */
  build() {
    return {
      name: this._name,
      defaultValue: this._defaultValue,
      type: this._type,
      description: this._description,
      required: this._required || !this._defaultValue,
      validation: this._validation
    };
  }

  /**
   * 转换为模板字符串
   */
  toString() {
    let result = '${' + this._name;
    if (this._defaultValue || this._type !== VariableTypes.STRING) {
      result += ':' + (this._defaultValue || '');
    }
    if (this._type !== VariableTypes.STRING) {
      result += ':' + this._type;
    }
    result += '}';
    return result;
  }
}

/**
 * 创建变量构建器
 * @param {string} name - 变量名
 * @returns {VariableBuilder}
 */
function variable(name) {
  return new VariableBuilder(name);
}

module.exports = {
  VariableParser,
  VariableBuilder,
  VariableTypes,
  variable
};
