/**
 * VariableParser 单元测试
 */

const { VariableParser, VariableBuilder, VariableTypes, variable } = require('../variableParser');

describe('VariableParser', () => {
  describe('parse()', () => {
    test('应该解析基本变量', () => {
      const template = '你好，${name}！';
      const variables = VariableParser.parse(template);
      
      expect(variables).toHaveLength(1);
      expect(variables[0].name).toBe('name');
      expect(variables[0].required).toBe(true);
      expect(variables[0].type).toBe(VariableTypes.STRING);
    });

    test('应该解析带默认值的变量', () => {
      const template = '你好，${name:用户}！';
      const variables = VariableParser.parse(template);
      
      expect(variables).toHaveLength(1);
      expect(variables[0].name).toBe('name');
      expect(variables[0].defaultValue).toBe('用户');
      expect(variables[0].required).toBe(false);
    });

    test('应该解析带类型的变量', () => {
      const template = '年龄: ${age:25:number}';
      const variables = VariableParser.parse(template);
      
      expect(variables).toHaveLength(1);
      expect(variables[0].name).toBe('age');
      expect(variables[0].defaultValue).toBe('25');
      expect(variables[0].type).toBe(VariableTypes.NUMBER);
    });

    test('应该解析只有类型的变量', () => {
      const template = '年龄: ${age::number}';
      const variables = VariableParser.parse(template);
      
      expect(variables).toHaveLength(1);
      expect(variables[0].name).toBe('age');
      expect(variables[0].defaultValue).toBe('');
      expect(variables[0].type).toBe(VariableTypes.NUMBER);
    });

    test('应该解析多个变量', () => {
      const template = '${greeting}，${name}！你今年 ${age::number} 岁。';
      const variables = VariableParser.parse(template);
      
      expect(variables).toHaveLength(3);
      expect(variables.map(v => v.name)).toEqual(['greeting', 'name', 'age']);
    });

    test('应该去重同名变量', () => {
      const template = '${name} 的名字是 ${name}';
      const variables = VariableParser.parse(template);
      
      expect(variables).toHaveLength(1);
    });

    test('应该处理空模板', () => {
      expect(VariableParser.parse('')).toEqual([]);
      expect(VariableParser.parse(null)).toEqual([]);
      expect(VariableParser.parse(undefined)).toEqual([]);
    });

    test('应该解析下划线变量名', () => {
      const template = '${user_name} ${first_name_2}';
      const variables = VariableParser.parse(template);
      
      expect(variables).toHaveLength(2);
      expect(variables[0].name).toBe('user_name');
      expect(variables[1].name).toBe('first_name_2');
    });

    test('应该包含位置信息', () => {
      const template = '你好，${name}！';
      const variables = VariableParser.parse(template);
      
      expect(variables[0].position.start).toBe(3);
      expect(variables[0].position.end).toBe(10);
    });
  });

  describe('interpolate()', () => {
    test('应该替换基本变量', () => {
      const template = '你好，${name}！';
      const result = VariableParser.interpolate(template, { name: '张三' });
      
      expect(result).toBe('你好，张三！');
    });

    test('应该使用默认值', () => {
      const template = '你好，${name:用户}！';
      const result = VariableParser.interpolate(template, {});
      
      expect(result).toBe('你好，用户！');
    });

    test('应该覆盖默认值', () => {
      const template = '你好，${name:用户}！';
      const result = VariableParser.interpolate(template, { name: '李四' });
      
      expect(result).toBe('你好，李四！');
    });

    test('应该处理多个变量', () => {
      const template = '${greeting}，${name}！你今年 ${age} 岁。';
      const result = VariableParser.interpolate(template, {
        greeting: '你好',
        name: '张三',
        age: 25
      });
      
      expect(result).toBe('你好，张三！你今年 25 岁。');
    });

    test('应该处理缺失变量并使用占位符', () => {
      const template = '你好，${name}！';
      const result = VariableParser.interpolate(template, {});
      
      expect(result).toBe('你好，[name]！');
    });

    test('应该支持自定义占位符', () => {
      const template = '你好，${name}！';
      const result = VariableParser.interpolate(template, {}, { placeholder: '___' });
      
      expect(result).toBe('你好，___！');
    });

    test('应该在严格模式下抛出错误', () => {
      const template = '你好，${name}！';
      
      expect(() => {
        VariableParser.interpolate(template, {}, { strict: true });
      }).toThrow('缺少必需的变量: name');
    });

    test('应该保留未匹配的变量', () => {
      const template = '你好，${name}！';
      const result = VariableParser.interpolate(template, {}, { keepUnmatched: true });
      
      expect(result).toBe('你好，${name}！');
    });

    test('应该转换数字类型', () => {
      const template = '年龄: ${age::number}';
      const result = VariableParser.interpolate(template, { age: '25' });
      
      expect(result).toBe('年龄: 25');
    });
  });

  describe('validate()', () => {
    test('应该验证提供了所有必需变量', () => {
      const template = '${name} 今年 ${age} 岁';
      const result = VariableParser.validate(template, { name: '张三', age: 25 });
      
      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
      expect(result.provided).toContain('name');
      expect(result.provided).toContain('age');
    });

    test('应该检测缺失的必需变量', () => {
      const template = '${name} 今年 ${age} 岁';
      const result = VariableParser.validate(template, { name: '张三' });
      
      expect(result.valid).toBe(false);
      expect(result.missing).toContain('age');
    });

    test('应该认为有默认值的变量为已提供', () => {
      const template = '${name:用户} 今年 ${age:18} 岁';
      const result = VariableParser.validate(template, {});
      
      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    test('应该验证类型错误', () => {
      const template = '年龄: ${age::number}';
      const result = VariableParser.validate(template, { age: 'abc' });
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].variable).toBe('age');
    });

    test('应该验证邮箱格式', () => {
      const template = '邮箱: ${email::email}';
      const result = VariableParser.validate(template, { email: 'invalid' });
      
      expect(result.valid).toBe(false);
      expect(result.errors[0].error).toBe('邮箱格式不正确');
    });

    test('应该接受有效邮箱', () => {
      const template = '邮箱: ${email::email}';
      const result = VariableParser.validate(template, { email: 'test@example.com' });
      
      expect(result.valid).toBe(true);
    });

    test('应该验证 URL 格式', () => {
      const template = '网站: ${url::url}';
      const result = VariableParser.validate(template, { url: 'not-a-url' });
      
      expect(result.valid).toBe(false);
    });
  });

  describe('extractNames()', () => {
    test('应该提取所有变量名', () => {
      const template = '${a} ${b} ${c}';
      const names = VariableParser.extractNames(template);
      
      expect(names).toEqual(['a', 'b', 'c']);
    });
  });

  describe('hasVariables()', () => {
    test('应该检测有变量', () => {
      expect(VariableParser.hasVariables('你好，${name}！')).toBe(true);
    });

    test('应该检测无变量', () => {
      expect(VariableParser.hasVariables('你好，世界！')).toBe(false);
    });

    test('应该处理空值', () => {
      expect(VariableParser.hasVariables('')).toBe(false);
      expect(VariableParser.hasVariables(null)).toBe(false);
    });
  });

  describe('generateFormFields()', () => {
    test('应该生成表单字段', () => {
      const template = '${user_name} 的邮箱是 ${email::email}';
      const fields = VariableParser.generateFormFields(template);
      
      expect(fields).toHaveLength(2);
      expect(fields[0].name).toBe('user_name');
      expect(fields[0].label).toBe('User Name');
      expect(fields[0].type).toBe('text');
      expect(fields[1].name).toBe('email');
      expect(fields[1].type).toBe('email');
    });

    test('应该设置必需字段', () => {
      const template = '${required_field} ${optional:默认值}';
      const fields = VariableParser.generateFormFields(template);
      
      expect(fields[0].required).toBe(true);
      expect(fields[1].required).toBe(false);
    });
  });

  describe('highlight()', () => {
    test('应该高亮变量', () => {
      const template = '你好，${name}！';
      const result = VariableParser.highlight(template);
      
      expect(result).toBe('你好，<mark>${name}</mark>！');
    });

    test('应该支持自定义标签', () => {
      const template = '你好，${name}！';
      const result = VariableParser.highlight(template, '**', '**');
      
      expect(result).toBe('你好，**${name}**！');
    });
  });
});

describe('VariableBuilder', () => {
  test('应该创建基本变量', () => {
    const v = variable('name').build();
    
    expect(v.name).toBe('name');
    expect(v.type).toBe(VariableTypes.STRING);
    expect(v.required).toBe(true);
  });

  test('应该设置默认值', () => {
    const v = variable('name').default('用户').build();
    
    expect(v.defaultValue).toBe('用户');
    expect(v.required).toBe(false);
  });

  test('应该设置类型', () => {
    const v = variable('age').type('number').build();
    
    expect(v.type).toBe(VariableTypes.NUMBER);
  });

  test('应该设置描述', () => {
    const v = variable('name').description('用户姓名').build();
    
    expect(v.description).toBe('用户姓名');
  });

  test('应该设置必需', () => {
    const v = variable('name').default('默认').required().build();
    
    expect(v.required).toBe(true);
  });

  test('应该转换为字符串', () => {
    expect(variable('name').toString()).toBe('${name}');
    expect(variable('name').default('用户').toString()).toBe('${name:用户}');
    expect(variable('age').type('number').toString()).toBe('${age::number}');
    expect(variable('age').default('25').type('number').toString()).toBe('${age:25:number}');
  });

  test('应该支持链式调用', () => {
    const v = variable('email')
      .default('test@example.com')
      .type('email')
      .description('用户邮箱')
      .required()
      .build();
    
    expect(v.name).toBe('email');
    expect(v.defaultValue).toBe('test@example.com');
    expect(v.type).toBe(VariableTypes.EMAIL);
    expect(v.description).toBe('用户邮箱');
    expect(v.required).toBe(true);
  });
});

describe('VariableTypes', () => {
  test('应该包含所有类型', () => {
    expect(VariableTypes.STRING).toBe('string');
    expect(VariableTypes.NUMBER).toBe('number');
    expect(VariableTypes.BOOLEAN).toBe('boolean');
    expect(VariableTypes.ARRAY).toBe('array');
    expect(VariableTypes.OBJECT).toBe('object');
    expect(VariableTypes.DATE).toBe('date');
    expect(VariableTypes.EMAIL).toBe('email');
    expect(VariableTypes.URL).toBe('url');
    expect(VariableTypes.TEXT).toBe('text');
  });
});

describe('类型转换', () => {
  test('应该转换布尔类型', () => {
    const template = '启用: ${enabled::boolean}';
    
    expect(VariableParser.interpolate(template, { enabled: 'true' })).toBe('启用: true');
    expect(VariableParser.interpolate(template, { enabled: '1' })).toBe('启用: true');
    expect(VariableParser.interpolate(template, { enabled: 'false' })).toBe('启用: false');
  });

  test('应该处理数组类型', () => {
    const template = '标签: ${tags::array}';
    const result = VariableParser.interpolate(template, { tags: 'a,b,c' });
    
    expect(result).toBe('标签: a,b,c');
  });
});

describe('类型别名', () => {
  test('应该识别类型别名', () => {
    expect(VariableParser.parse('${x::str}')[0].type).toBe('string');
    expect(VariableParser.parse('${x::num}')[0].type).toBe('number');
    expect(VariableParser.parse('${x::int}')[0].type).toBe('number');
    expect(VariableParser.parse('${x::bool}')[0].type).toBe('boolean');
    expect(VariableParser.parse('${x::arr}')[0].type).toBe('array');
    expect(VariableParser.parse('${x::obj}')[0].type).toBe('object');
    expect(VariableParser.parse('${x::json}')[0].type).toBe('object');
    expect(VariableParser.parse('${x::link}')[0].type).toBe('url');
    expect(VariableParser.parse('${x::textarea}')[0].type).toBe('text');
  });
});
