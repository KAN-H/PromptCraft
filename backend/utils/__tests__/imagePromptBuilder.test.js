/**
 * ImagePromptBuilder 单元测试
 */

const {
  ImagePromptBuilder,
  imageBuilder,
  getStyles,
  getArtists,
  getLighting,
  getCamera,
  getMoods,
  getColorSchemes,
  getPlatforms,
  getNegativePresets,
  STYLES,
  ARTISTS,
  LIGHTING,
  CAMERA,
  MOODS
} = require('../imagePromptBuilder');

describe('ImagePromptBuilder', () => {
  
  describe('基础构建', () => {
    test('应该创建空构建器', () => {
      const builder = imageBuilder();
      expect(builder).toBeInstanceOf(ImagePromptBuilder);
    });

    test('应该构建简单提示词', () => {
      const result = imageBuilder()
        .subject('a cat')
        .build();
      
      expect(result.prompt).toContain('a cat');
      expect(result.platform).toBe('general');
    });

    test('应该支持链式调用', () => {
      const builder = imageBuilder()
        .subject('a dog')
        .environment('park')
        .style('realistic');
      
      expect(builder).toBeInstanceOf(ImagePromptBuilder);
    });

    test('toString 应该返回提示词字符串', () => {
      const prompt = imageBuilder()
        .subject('a flower')
        .toString();
      
      expect(typeof prompt).toBe('string');
      expect(prompt).toContain('flower');
    });

    test('toJSON 应该返回 JSON 字符串', () => {
      const json = imageBuilder()
        .subject('a tree')
        .toJSON();
      
      expect(typeof json).toBe('string');
      const parsed = JSON.parse(json);
      expect(parsed).toHaveProperty('prompt');
    });
  });

  describe('主体设置', () => {
    test('应该设置主体描述', () => {
      const result = imageBuilder()
        .subject('a beautiful woman')
        .build();
      
      expect(result.prompt).toContain('beautiful woman');
      expect(result.components.subject).toBe('a beautiful woman');
    });

    test('应该支持主体选项', () => {
      const result = imageBuilder()
        .subject('a warrior', {
          pose: 'standing heroically',
          expression: 'determined',
          clothing: 'armor'
        })
        .build();
      
      expect(result.prompt).toContain('warrior');
      expect(result.prompt).toContain('standing heroically');
      expect(result.prompt).toContain('determined expression');
      expect(result.prompt).toContain('wearing armor');
    });

    test('应该支持单独设置姿势', () => {
      const result = imageBuilder()
        .subject('a dancer')
        .pose('leaping gracefully')
        .build();
      
      expect(result.prompt).toContain('leaping gracefully');
    });
  });

  describe('环境设置', () => {
    test('应该设置环境描述', () => {
      const result = imageBuilder()
        .subject('a house')
        .environment('mountain landscape')
        .build();
      
      expect(result.prompt).toContain('mountain landscape');
      expect(result.components.environment).toBe('mountain landscape');
    });

    test('应该支持环境选项', () => {
      const result = imageBuilder()
        .subject('a castle')
        .environment('forest', {
          time: 'sunset',
          weather: 'foggy',
          season: 'autumn'
        })
        .build();
      
      expect(result.prompt).toContain('forest');
      expect(result.prompt).toContain('sunset');
      expect(result.prompt).toContain('foggy');
      expect(result.prompt).toContain('autumn');
    });

    test('应该支持简单的时间字符串', () => {
      const result = imageBuilder()
        .subject('a beach')
        .environment('tropical island', 'during golden hour')
        .build();
      
      expect(result.prompt).toContain('during golden hour');
    });

    test('应该支持背景设置', () => {
      const result = imageBuilder()
        .subject('a product')
        .background('gradient')
        .build();
      
      expect(result.prompt).toContain('gradient background');
    });
  });

  describe('风格设置', () => {
    test('应该设置风格', () => {
      const result = imageBuilder()
        .subject('a portrait')
        .style('oil-painting')
        .build();
      
      expect(result.prompt).toContain('oil painting');
    });

    test('应该支持多种风格', () => {
      const result = imageBuilder()
        .subject('a scene')
        .style(['cinematic', 'dramatic'])
        .build();
      
      expect(result.prompt).toContain('cinematic');
    });

    test('应该支持自定义风格', () => {
      const result = imageBuilder()
        .subject('a car')
        .style('custom art style')
        .build();
      
      expect(result.prompt).toContain('custom art style');
    });

    test('应该支持艺术家风格', () => {
      const result = imageBuilder()
        .subject('a starry night')
        .artist('van-gogh')
        .build();
      
      expect(result.prompt).toContain('Vincent van Gogh');
      expect(result.prompt).toContain('in the style of');
    });

    test('应该支持多位艺术家', () => {
      const result = imageBuilder()
        .subject('a painting')
        .artist(['monet', 'Custom Artist'])
        .build();
      
      expect(result.prompt).toContain('Claude Monet');
      expect(result.prompt).toContain('Custom Artist');
    });
  });

  describe('光照设置', () => {
    test('应该设置光照', () => {
      const result = imageBuilder()
        .subject('a portrait')
        .lighting('golden-hour')
        .build();
      
      expect(result.prompt).toContain('golden hour lighting');
    });

    test('应该支持多种光照', () => {
      const result = imageBuilder()
        .subject('a scene')
        .lighting(['soft', 'rim'])
        .build();
      
      expect(result.prompt).toContain('soft');
      expect(result.prompt).toContain('rim lighting');
    });

    test('应该支持自定义光照', () => {
      const result = imageBuilder()
        .subject('a scene')
        .lighting('custom magical glow')
        .build();
      
      expect(result.prompt).toContain('custom magical glow');
    });
  });

  describe('相机设置', () => {
    test('应该设置相机/视角', () => {
      const result = imageBuilder()
        .subject('a building')
        .camera('low-angle')
        .build();
      
      expect(result.prompt).toContain('low angle');
    });

    test('应该支持多种相机设置', () => {
      const result = imageBuilder()
        .subject('a portrait')
        .camera(['closeup', '85mm', 'bokeh'])
        .build();
      
      expect(result.prompt).toContain('close-up shot');
      expect(result.prompt).toContain('85mm');
      expect(result.prompt).toContain('bokeh');
    });

    test('应该支持 shot 方法', () => {
      const result = imageBuilder()
        .subject('a person')
        .shot('medium')
        .build();
      
      expect(result.prompt).toContain('medium shot');
    });

    test('应该支持 angle 方法', () => {
      const result = imageBuilder()
        .subject('a tower')
        .angle('birds-eye')
        .build();
      
      expect(result.prompt).toContain("bird's eye view");
    });

    test('应该支持 lens 方法', () => {
      const result = imageBuilder()
        .subject('a landscape')
        .lens('wide-angle')
        .build();
      
      expect(result.prompt).toContain('wide angle lens');
    });
  });

  describe('情绪和色彩', () => {
    test('应该设置情绪', () => {
      const result = imageBuilder()
        .subject('a scene')
        .mood('mysterious')
        .build();
      
      expect(result.prompt).toContain('mysterious');
    });

    test('应该设置色彩方案', () => {
      const result = imageBuilder()
        .subject('a painting')
        .color('warm')
        .build();
      
      expect(result.prompt).toContain('warm color palette');
    });

    test('应该支持多种色彩', () => {
      const result = imageBuilder()
        .subject('a design')
        .color(['vibrant', 'high-contrast'])
        .build();
      
      expect(result.prompt).toContain('vibrant colors');
      expect(result.prompt).toContain('high contrast');
    });
  });

  describe('质量和细节', () => {
    test('应该添加质量修饰词', () => {
      const result = imageBuilder()
        .subject('a masterpiece')
        .quality(['masterpiece', 'high-detail'])
        .build();
      
      expect(result.prompt).toContain('masterpiece');
      expect(result.prompt).toContain('highly detailed');
    });

    test('应该添加细节描述', () => {
      const result = imageBuilder()
        .subject('a character')
        .details(['intricate armor', 'glowing runes'])
        .build();
      
      expect(result.prompt).toContain('intricate armor');
      expect(result.prompt).toContain('glowing runes');
    });
  });

  describe('负面提示词', () => {
    test('应该添加负面提示词', () => {
      const result = imageBuilder()
        .subject('a portrait')
        .negative('blurry, low quality')
        .build();
      
      expect(result.negativePrompt).toContain('blurry');
      expect(result.negativePrompt).toContain('low quality');
    });

    test('应该支持负面预设', () => {
      const result = imageBuilder()
        .subject('a portrait')
        .negative('portrait')
        .build();
      
      expect(result.negativePrompt).toContain('bad anatomy');
      expect(result.negativePrompt).toContain('bad hands');
    });

    test('应该支持多个负面提示词', () => {
      const result = imageBuilder()
        .subject('a scene')
        .negative(['basic', 'text'])
        .build();
      
      expect(result.negativePrompt).toContain('blurry');
      expect(result.negativePrompt).toContain('watermark');
    });
  });

  describe('平台支持', () => {
    test('应该设置平台', () => {
      const result = imageBuilder()
        .subject('a cat')
        .platform('midjourney')
        .build();
      
      expect(result.platform).toBe('midjourney');
      expect(result.platformName).toBe('Midjourney');
    });

    test('Midjourney 应该添加默认参数', () => {
      const result = imageBuilder()
        .subject('a cat')
        .platform('midjourney')
        .build();
      
      expect(result.prompt).toContain('--v');
    });

    test('应该支持宽高比参数', () => {
      const result = imageBuilder()
        .subject('a landscape')
        .platform('midjourney')
        .aspect('16:9')
        .build();
      
      expect(result.prompt).toContain('--ar 16:9');
    });

    test('应该支持版本参数', () => {
      const result = imageBuilder()
        .subject('a portrait')
        .platform('midjourney')
        .version('5.2')
        .build();
      
      expect(result.prompt).toContain('--v 5.2');
    });

    test('应该支持风格化参数', () => {
      const result = imageBuilder()
        .subject('an artwork')
        .platform('midjourney')
        .stylize(500)
        .build();
      
      expect(result.prompt).toContain('--s 500');
    });

    test('应该支持混乱度参数', () => {
      const result = imageBuilder()
        .subject('abstract art')
        .platform('midjourney')
        .chaos(50)
        .build();
      
      expect(result.prompt).toContain('--c 50');
    });

    test('应该支持种子参数', () => {
      const result = imageBuilder()
        .subject('a scene')
        .platform('midjourney')
        .seed(12345)
        .build();
      
      expect(result.prompt).toContain('--seed 12345');
    });

    test('应该支持自定义参数', () => {
      const result = imageBuilder()
        .subject('a scene')
        .platform('midjourney')
        .param('niji', '5')
        .build();
      
      expect(result.prompt).toContain('--niji 5');
    });
  });

  describe('预设功能', () => {
    test('应该应用 portrait 预设', () => {
      const result = imageBuilder()
        .subject('a woman')
        .preset('portrait')
        .build();
      
      expect(result.prompt).toContain('close-up');
      expect(result.prompt).toContain('85mm');
      expect(result.prompt).toContain('bokeh');
    });

    test('应该应用 landscape 预设', () => {
      const result = imageBuilder()
        .subject('mountains')
        .preset('landscape')
        .build();
      
      expect(result.prompt).toContain('wide angle');
      expect(result.prompt).toContain('golden hour');
    });

    test('应该应用 anime 预设', () => {
      const result = imageBuilder()
        .subject('a character')
        .preset('anime')
        .build();
      
      expect(result.prompt).toContain('anime');
      expect(result.negativePrompt).toContain('realistic');
      expect(result.negativePrompt).toContain('photo');
    });

    test('应该应用 cinematic 预设', () => {
      const result = imageBuilder()
        .subject('a scene')
        .preset('cinematic')
        .build();
      
      expect(result.prompt).toContain('cinematic');
      expect(result.params.ar).toBe('21:9');
    });
  });

  describe('语言支持', () => {
    test('默认应该是英文', () => {
      const result = imageBuilder()
        .subject('a cat')
        .style('oil-painting')
        .build();
      
      expect(result.metadata.language).toBe('en');
      expect(result.prompt).toContain('oil painting');
    });

    test('应该支持中文', () => {
      const result = imageBuilder()
        .language('zh')
        .subject('一只猫')
        .style('oil-painting')
        .build();
      
      expect(result.metadata.language).toBe('zh');
      expect(result.prompt).toContain('油画');
    });
  });

  describe('工具方法', () => {
    test('clone 应该创建副本', () => {
      const original = imageBuilder()
        .subject('a cat')
        .style('realistic');
      
      const cloned = original.clone();
      cloned.subject('a dog');
      
      expect(original.build().components.subject).toBe('a cat');
      expect(cloned.build().components.subject).toBe('a dog');
    });

    test('reset 应该重置构建器', () => {
      const builder = imageBuilder()
        .subject('a cat')
        .style('realistic');
      
      builder.reset();
      const result = builder.build();
      
      expect(result.components.subject).toBeNull();
      expect(result.components.style).toHaveLength(0);
    });
  });

  describe('完整构建测试', () => {
    test('应该构建完整的 Midjourney 提示词', () => {
      const result = imageBuilder()
        .subject('a majestic dragon', {
          pose: 'flying',
          features: 'scales shimmering'
        })
        .environment('volcanic mountain', {
          time: 'night',
          weather: 'stormy'
        })
        .style(['fantasy', 'concept-art'])
        .artist('greg-rutkowski')
        .lighting(['dramatic', 'volumetric'])
        .camera(['medium-long', 'low-angle'])
        .mood('epic')
        .color('warm')
        .quality(['masterpiece', 'high-detail', 'trending'])
        .details(['intricate scales', 'glowing eyes'])
        .negative('comprehensive')
        .platform('midjourney')
        .aspect('16:9')
        .version('6')
        .stylize(250)
        .build();
      
      // 验证正向提示词
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
      
      // 验证负面提示词
      expect(result.negativePrompt).toContain('blurry');
      expect(result.negativePrompt).toContain('bad anatomy');
      
      // 验证元数据
      expect(result.platform).toBe('midjourney');
      expect(result.components.subject).toBe('a majestic dragon');
    });
  });
});

describe('辅助函数', () => {
  test('getStyles 应该返回所有风格', () => {
    const styles = getStyles();
    expect(styles).toHaveProperty('oil-painting');
    expect(styles).toHaveProperty('anime');
    expect(styles['oil-painting']).toHaveProperty('en');
    expect(styles['oil-painting']).toHaveProperty('zh');
  });

  test('getArtists 应该返回所有艺术家', () => {
    const artists = getArtists();
    expect(artists).toHaveProperty('van-gogh');
    expect(artists['van-gogh']).toBe('Vincent van Gogh');
  });

  test('getLighting 应该返回所有光照预设', () => {
    const lighting = getLighting();
    expect(lighting).toHaveProperty('golden-hour');
    expect(lighting).toHaveProperty('dramatic');
  });

  test('getCamera 应该返回所有相机预设', () => {
    const camera = getCamera();
    expect(camera).toHaveProperty('closeup');
    expect(camera).toHaveProperty('wide-angle');
  });

  test('getMoods 应该返回所有情绪预设', () => {
    const moods = getMoods();
    expect(moods).toHaveProperty('peaceful');
    expect(moods).toHaveProperty('dramatic');
  });

  test('getColorSchemes 应该返回所有色彩方案', () => {
    const colors = getColorSchemes();
    expect(colors).toHaveProperty('warm');
    expect(colors).toHaveProperty('cool');
  });

  test('getPlatforms 应该返回所有平台配置', () => {
    const platforms = getPlatforms();
    expect(platforms).toHaveProperty('midjourney');
    expect(platforms).toHaveProperty('dall-e');
    expect(platforms).toHaveProperty('stable-diffusion');
  });

  test('getNegativePresets 应该返回所有负面预设', () => {
    const presets = getNegativePresets();
    expect(presets).toHaveProperty('basic');
    expect(presets).toHaveProperty('portrait');
    expect(presets).toHaveProperty('comprehensive');
  });
});
