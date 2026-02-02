/**
 * 图像提示词构建器
 * 专为AI图像生成平台(Midjourney, DALL-E, Stable Diffusion等)设计
 */

// ==================== 预设数据 ====================

/**
 * 艺术风格预设
 */
const STYLES = {
  // 绘画风格
  'oil-painting': { en: 'oil painting', zh: '油画' },
  'watercolor': { en: 'watercolor painting', zh: '水彩画' },
  'sketch': { en: 'pencil sketch', zh: '素描' },
  'ink-wash': { en: 'Chinese ink wash painting', zh: '水墨画' },
  'digital-art': { en: 'digital art', zh: '数字艺术' },
  'concept-art': { en: 'concept art', zh: '概念艺术' },
  'anime': { en: 'anime style', zh: '动漫风格' },
  'realistic': { en: 'photorealistic', zh: '写实' },
  'hyperrealistic': { en: 'hyperrealistic', zh: '超写实' },
  '3d-render': { en: '3D render', zh: '3D渲染' },
  'pixel-art': { en: 'pixel art', zh: '像素艺术' },
  'vector': { en: 'vector illustration', zh: '矢量插画' },
  'minimalist': { en: 'minimalist', zh: '极简主义' },
  'surrealism': { en: 'surrealism', zh: '超现实主义' },
  'impressionism': { en: 'impressionism', zh: '印象派' },
  'pop-art': { en: 'pop art', zh: '波普艺术' },
  'art-nouveau': { en: 'art nouveau', zh: '新艺术风格' },
  'cyberpunk': { en: 'cyberpunk', zh: '赛博朋克' },
  'steampunk': { en: 'steampunk', zh: '蒸汽朋克' },
  'fantasy': { en: 'fantasy art', zh: '奇幻艺术' },
  'sci-fi': { en: 'sci-fi art', zh: '科幻艺术' },
  'vintage': { en: 'vintage style', zh: '复古风格' },
  'retro': { en: 'retro style', zh: '怀旧风格' },
  'gothic': { en: 'gothic style', zh: '哥特风格' },
  'cartoon': { en: 'cartoon style', zh: '卡通风格' },
  'comic': { en: 'comic book style', zh: '漫画风格' },
  'cinematic': { en: 'cinematic', zh: '电影感' },
  'editorial': { en: 'editorial photography', zh: '时尚摄影' },
  'product': { en: 'product photography', zh: '产品摄影' },
  'portrait': { en: 'portrait photography', zh: '人像摄影' }
};

/**
 * 著名艺术家
 */
const ARTISTS = {
  'van-gogh': 'Vincent van Gogh',
  'monet': 'Claude Monet',
  'picasso': 'Pablo Picasso',
  'dali': 'Salvador Dalí',
  'rembrandt': 'Rembrandt',
  'da-vinci': 'Leonardo da Vinci',
  'michelangelo': 'Michelangelo',
  'klimt': 'Gustav Klimt',
  'mucha': 'Alphonse Mucha',
  'hokusai': 'Katsushika Hokusai',
  'warhol': 'Andy Warhol',
  'banksy': 'Banksy',
  'giger': 'H.R. Giger',
  'frazetta': 'Frank Frazetta',
  'beksinski': 'Zdzisław Beksiński',
  'artgerm': 'Artgerm',
  'greg-rutkowski': 'Greg Rutkowski',
  'ross-tran': 'Ross Tran',
  'wlop': 'WLOP',
  'studio-ghibli': 'Studio Ghibli',
  'makoto-shinkai': 'Makoto Shinkai'
};

/**
 * 光照预设
 */
const LIGHTING = {
  'natural': { en: 'natural light', zh: '自然光' },
  'golden-hour': { en: 'golden hour lighting', zh: '黄金时段光' },
  'blue-hour': { en: 'blue hour lighting', zh: '蓝色时刻光' },
  'dramatic': { en: 'dramatic lighting', zh: '戏剧性光照' },
  'soft': { en: 'soft diffused lighting', zh: '柔和散射光' },
  'hard': { en: 'hard lighting', zh: '硬光' },
  'rim': { en: 'rim lighting', zh: '轮廓光' },
  'backlight': { en: 'backlight', zh: '逆光' },
  'studio': { en: 'studio lighting', zh: '摄影棚灯光' },
  'cinematic': { en: 'cinematic lighting', zh: '电影灯光' },
  'neon': { en: 'neon lighting', zh: '霓虹灯光' },
  'volumetric': { en: 'volumetric lighting', zh: '体积光' },
  'ambient': { en: 'ambient lighting', zh: '环境光' },
  'candlelight': { en: 'candlelight', zh: '烛光' },
  'moonlight': { en: 'moonlight', zh: '月光' },
  'sunlight': { en: 'bright sunlight', zh: '明亮阳光' },
  'overcast': { en: 'overcast lighting', zh: '阴天光' },
  'rembrandt': { en: 'Rembrandt lighting', zh: '伦勃朗光' },
  'split': { en: 'split lighting', zh: '分割光' },
  'butterfly': { en: 'butterfly lighting', zh: '蝴蝶光' }
};

/**
 * 相机/视角预设
 */
const CAMERA = {
  // 景别
  'extreme-closeup': { en: 'extreme close-up', zh: '超特写' },
  'closeup': { en: 'close-up shot', zh: '特写' },
  'medium-closeup': { en: 'medium close-up', zh: '中特写' },
  'medium': { en: 'medium shot', zh: '中景' },
  'medium-long': { en: 'medium long shot', zh: '中远景' },
  'full': { en: 'full shot', zh: '全景' },
  'long': { en: 'long shot', zh: '远景' },
  'extreme-long': { en: 'extreme long shot', zh: '大远景' },
  
  // 角度
  'eye-level': { en: 'eye level', zh: '平视' },
  'high-angle': { en: 'high angle', zh: '俯视' },
  'low-angle': { en: 'low angle', zh: '仰视' },
  'birds-eye': { en: "bird's eye view", zh: '鸟瞰' },
  'worms-eye': { en: "worm's eye view", zh: '蚂蚁视角' },
  'dutch-angle': { en: 'Dutch angle', zh: '倾斜角度' },
  'over-shoulder': { en: 'over the shoulder', zh: '过肩镜头' },
  'pov': { en: 'POV shot', zh: '第一人称视角' },
  
  // 镜头
  '35mm': { en: '35mm lens', zh: '35mm镜头' },
  '50mm': { en: '50mm lens', zh: '50mm镜头' },
  '85mm': { en: '85mm portrait lens', zh: '85mm人像镜头' },
  'wide-angle': { en: 'wide angle lens', zh: '广角镜头' },
  'fisheye': { en: 'fisheye lens', zh: '鱼眼镜头' },
  'telephoto': { en: 'telephoto lens', zh: '长焦镜头' },
  'macro': { en: 'macro lens', zh: '微距镜头' },
  'tilt-shift': { en: 'tilt-shift', zh: '移轴镜头' },
  'bokeh': { en: 'bokeh effect', zh: '散景效果' },
  'depth-of-field': { en: 'shallow depth of field', zh: '浅景深' }
};

/**
 * 情绪/氛围预设
 */
const MOODS = {
  'peaceful': { en: 'peaceful, serene', zh: '宁静祥和' },
  'dramatic': { en: 'dramatic, intense', zh: '戏剧性' },
  'mysterious': { en: 'mysterious, enigmatic', zh: '神秘' },
  'romantic': { en: 'romantic, dreamy', zh: '浪漫梦幻' },
  'melancholic': { en: 'melancholic, nostalgic', zh: '忧郁怀旧' },
  'joyful': { en: 'joyful, vibrant', zh: '欢快活泼' },
  'dark': { en: 'dark, ominous', zh: '黑暗阴郁' },
  'ethereal': { en: 'ethereal, otherworldly', zh: '空灵超凡' },
  'epic': { en: 'epic, grand', zh: '史诗宏大' },
  'cozy': { en: 'cozy, warm', zh: '温馨舒适' },
  'eerie': { en: 'eerie, unsettling', zh: '诡异不安' },
  'whimsical': { en: 'whimsical, playful', zh: '奇幻俏皮' },
  'majestic': { en: 'majestic, awe-inspiring', zh: '威严壮观' },
  'minimalist': { en: 'minimalist, clean', zh: '极简干净' },
  'chaotic': { en: 'chaotic, dynamic', zh: '混乱动感' }
};

/**
 * 色彩方案预设
 */
const COLOR_SCHEMES = {
  'vibrant': { en: 'vibrant colors', zh: '鲜艳色彩' },
  'muted': { en: 'muted colors', zh: '柔和色调' },
  'pastel': { en: 'pastel colors', zh: '粉彩色调' },
  'monochrome': { en: 'monochrome', zh: '单色调' },
  'warm': { en: 'warm color palette', zh: '暖色调' },
  'cool': { en: 'cool color palette', zh: '冷色调' },
  'complementary': { en: 'complementary colors', zh: '互补色' },
  'analogous': { en: 'analogous colors', zh: '相似色' },
  'triadic': { en: 'triadic color scheme', zh: '三色配色' },
  'earth-tones': { en: 'earth tones', zh: '大地色系' },
  'neon': { en: 'neon colors', zh: '霓虹色' },
  'desaturated': { en: 'desaturated', zh: '低饱和度' },
  'high-contrast': { en: 'high contrast', zh: '高对比度' },
  'sepia': { en: 'sepia tones', zh: '棕褐色调' },
  'black-white': { en: 'black and white', zh: '黑白' }
};

/**
 * 质量修饰词
 */
const QUALITY_MODIFIERS = {
  'masterpiece': 'masterpiece',
  'best-quality': 'best quality',
  'high-detail': 'highly detailed',
  'ultra-hd': 'ultra HD, 8K',
  'sharp': 'sharp focus',
  'professional': 'professional',
  'award-winning': 'award winning',
  'trending': 'trending on artstation',
  'octane': 'octane render',
  'unreal': 'unreal engine 5'
};

/**
 * 负面提示词预设
 */
const NEGATIVE_PRESETS = {
  'basic': 'blurry, low quality, distorted, deformed',
  'portrait': 'bad anatomy, bad hands, missing fingers, extra fingers, deformed face, ugly',
  'realistic': 'cartoon, anime, illustration, painting, drawing, art, sketch',
  'anime': 'realistic, photo, 3d render, photograph',
  'hands': 'bad hands, missing fingers, extra fingers, fused fingers, too many fingers',
  'text': 'text, watermark, signature, logo, words, letters',
  'comprehensive': 'blurry, low quality, distorted, deformed, bad anatomy, bad hands, missing fingers, extra fingers, ugly, duplicate, morbid, mutilated, out of frame, extra limbs, poorly drawn hands, poorly drawn face, mutation, deformed, bad proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, disfigured, gross proportions, text, watermark, signature'
};

/**
 * 平台特定配置
 */
const PLATFORMS = {
  midjourney: {
    name: 'Midjourney',
    separator: ', ',
    paramPrefix: ' --',
    defaultParams: { v: '6', q: '1' },
    aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16', '2:3', '3:2'],
    qualities: ['0.25', '0.5', '1', '2'],
    stylize: [0, 100, 250, 500, 750, 1000],
    chaos: [0, 100]
  },
  'dall-e': {
    name: 'DALL-E',
    separator: ', ',
    paramPrefix: '',
    sizes: ['1024x1024', '1792x1024', '1024x1792'],
    qualities: ['standard', 'hd'],
    styles: ['vivid', 'natural']
  },
  'stable-diffusion': {
    name: 'Stable Diffusion',
    separator: ', ',
    paramPrefix: '',
    defaultParams: { steps: 30, cfg: 7 },
    samplers: ['Euler a', 'DPM++ 2M Karras', 'DDIM'],
    sizes: ['512x512', '768x768', '1024x1024']
  },
  general: {
    name: 'General',
    separator: ', ',
    paramPrefix: ''
  }
};

// ==================== 图像构建器类 ====================

/**
 * 图像提示词构建器
 */
class ImagePromptBuilder {
  constructor() {
    this._data = {
      subject: null,
      subjectDetails: [],
      environment: null,
      environmentDetails: [],
      style: [],
      artists: [],
      lighting: [],
      camera: [],
      mood: [],
      colors: [],
      quality: [],
      details: [],
      negative: [],
      platform: 'general',
      params: {},
      language: 'en'
    };
  }

  /**
   * 设置主体
   * @param {string} subject - 主体描述
   * @param {Object} options - 选项
   * @returns {ImagePromptBuilder}
   */
  subject(subject, options = {}) {
    this._data.subject = subject;
    if (options.pose) this._data.subjectDetails.push(`${options.pose}`);
    if (options.action) this._data.subjectDetails.push(`${options.action}`);
    if (options.expression) this._data.subjectDetails.push(`${options.expression} expression`);
    if (options.clothing) this._data.subjectDetails.push(`wearing ${options.clothing}`);
    if (options.features) this._data.subjectDetails.push(options.features);
    return this;
  }

  /**
   * 设置姿势/动作
   * @param {string} pose - 姿势或动作
   * @returns {ImagePromptBuilder}
   */
  pose(pose) {
    this._data.subjectDetails.push(pose);
    return this;
  }

  /**
   * 设置环境/场景
   * @param {string} environment - 环境描述
   * @param {Object|string} options - 选项或时间
   * @returns {ImagePromptBuilder}
   */
  environment(environment, options = {}) {
    this._data.environment = environment;
    if (typeof options === 'string') {
      this._data.environmentDetails.push(options);
    } else {
      if (options.time) this._data.environmentDetails.push(`at ${options.time}`);
      if (options.weather) this._data.environmentDetails.push(`${options.weather} weather`);
      if (options.season) this._data.environmentDetails.push(`in ${options.season}`);
      if (options.details) this._data.environmentDetails.push(options.details);
    }
    return this;
  }

  /**
   * 设置背景
   * @param {string} background - 背景描述
   * @returns {ImagePromptBuilder}
   */
  background(background) {
    // 背景作为独立的环境元素
    const bgDesc = `${background} background`;
    if (!this._data.environment) {
      this._data.environment = bgDesc;
    } else {
      this._data.environmentDetails.push(bgDesc);
    }
    return this;
  }

  /**
   * 设置艺术风格
   * @param {string|string[]} styles - 风格名称或预设键
   * @returns {ImagePromptBuilder}
   */
  style(styles) {
    const styleList = Array.isArray(styles) ? styles : [styles];
    styleList.forEach(s => {
      if (STYLES[s]) {
        this._data.style.push(this._data.language === 'zh' ? STYLES[s].zh : STYLES[s].en);
      } else {
        this._data.style.push(s);
      }
    });
    return this;
  }

  /**
   * 参考艺术家风格
   * @param {string|string[]} artists - 艺术家名称或预设键
   * @returns {ImagePromptBuilder}
   */
  artist(artists) {
    const artistList = Array.isArray(artists) ? artists : [artists];
    artistList.forEach(a => {
      const artistName = ARTISTS[a] || a;
      this._data.artists.push(`in the style of ${artistName}`);
    });
    return this;
  }

  /**
   * 设置光照
   * @param {string|string[]} lighting - 光照类型或预设键
   * @returns {ImagePromptBuilder}
   */
  lighting(lighting) {
    const lightList = Array.isArray(lighting) ? lighting : [lighting];
    lightList.forEach(l => {
      if (LIGHTING[l]) {
        this._data.lighting.push(this._data.language === 'zh' ? LIGHTING[l].zh : LIGHTING[l].en);
      } else {
        this._data.lighting.push(l);
      }
    });
    return this;
  }

  /**
   * 设置相机/视角
   * @param {string|string[]} camera - 相机设置或预设键
   * @returns {ImagePromptBuilder}
   */
  camera(camera) {
    const cameraList = Array.isArray(camera) ? camera : [camera];
    cameraList.forEach(c => {
      if (CAMERA[c]) {
        this._data.camera.push(this._data.language === 'zh' ? CAMERA[c].zh : CAMERA[c].en);
      } else {
        this._data.camera.push(c);
      }
    });
    return this;
  }

  /**
   * 设置景别
   * @param {string} shot - 景别类型
   * @returns {ImagePromptBuilder}
   */
  shot(shot) {
    return this.camera(shot);
  }

  /**
   * 设置视角
   * @param {string} angle - 视角
   * @returns {ImagePromptBuilder}
   */
  angle(angle) {
    return this.camera(angle);
  }

  /**
   * 设置镜头
   * @param {string} lens - 镜头类型
   * @returns {ImagePromptBuilder}
   */
  lens(lens) {
    return this.camera(lens);
  }

  /**
   * 设置情绪/氛围
   * @param {string|string[]} moods - 情绪或预设键
   * @returns {ImagePromptBuilder}
   */
  mood(moods) {
    const moodList = Array.isArray(moods) ? moods : [moods];
    moodList.forEach(m => {
      if (MOODS[m]) {
        this._data.mood.push(this._data.language === 'zh' ? MOODS[m].zh : MOODS[m].en);
      } else {
        this._data.mood.push(m);
      }
    });
    return this;
  }

  /**
   * 设置色彩方案
   * @param {string|string[]} colors - 色彩或预设键
   * @returns {ImagePromptBuilder}
   */
  color(colors) {
    const colorList = Array.isArray(colors) ? colors : [colors];
    colorList.forEach(c => {
      if (COLOR_SCHEMES[c]) {
        this._data.colors.push(this._data.language === 'zh' ? COLOR_SCHEMES[c].zh : COLOR_SCHEMES[c].en);
      } else {
        this._data.colors.push(c);
      }
    });
    return this;
  }

  /**
   * 添加质量修饰词
   * @param {string|string[]} quality - 质量修饰词或预设键
   * @returns {ImagePromptBuilder}
   */
  quality(quality) {
    const qualityList = Array.isArray(quality) ? quality : [quality];
    qualityList.forEach(q => {
      this._data.quality.push(QUALITY_MODIFIERS[q] || q);
    });
    return this;
  }

  /**
   * 添加细节描述
   * @param {string|string[]} details - 细节描述
   * @returns {ImagePromptBuilder}
   */
  details(details) {
    const detailList = Array.isArray(details) ? details : [details];
    this._data.details.push(...detailList);
    return this;
  }

  /**
   * 添加负面提示词
   * @param {string|string[]} negative - 负面提示词或预设键
   * @returns {ImagePromptBuilder}
   */
  negative(negative) {
    const negList = Array.isArray(negative) ? negative : [negative];
    negList.forEach(n => {
      if (NEGATIVE_PRESETS[n]) {
        this._data.negative.push(NEGATIVE_PRESETS[n]);
      } else {
        this._data.negative.push(n);
      }
    });
    return this;
  }

  /**
   * 设置平台
   * @param {string} platform - 平台名称
   * @returns {ImagePromptBuilder}
   */
  platform(platform) {
    if (PLATFORMS[platform]) {
      this._data.platform = platform;
    }
    return this;
  }

  /**
   * 设置宽高比 (Midjourney)
   * @param {string} ratio - 宽高比 (如 '16:9')
   * @returns {ImagePromptBuilder}
   */
  aspect(ratio) {
    this._data.params.ar = ratio;
    return this;
  }

  /**
   * 设置版本 (Midjourney)
   * @param {string} version - 版本号
   * @returns {ImagePromptBuilder}
   */
  version(version) {
    this._data.params.v = version;
    return this;
  }

  /**
   * 设置质量参数 (Midjourney)
   * @param {string|number} q - 质量值
   * @returns {ImagePromptBuilder}
   */
  qualityParam(q) {
    this._data.params.q = String(q);
    return this;
  }

  /**
   * 设置风格化程度 (Midjourney)
   * @param {number} s - 风格化值 (0-1000)
   * @returns {ImagePromptBuilder}
   */
  stylize(s) {
    this._data.params.s = String(s);
    return this;
  }

  /**
   * 设置混乱度 (Midjourney)
   * @param {number} c - 混乱度值 (0-100)
   * @returns {ImagePromptBuilder}
   */
  chaos(c) {
    this._data.params.c = String(c);
    return this;
  }

  /**
   * 设置随机种子
   * @param {number} seed - 种子值
   * @returns {ImagePromptBuilder}
   */
  seed(seed) {
    this._data.params.seed = String(seed);
    return this;
  }

  /**
   * 设置尺寸 (DALL-E, Stable Diffusion)
   * @param {string} size - 尺寸 (如 '1024x1024')
   * @returns {ImagePromptBuilder}
   */
  size(size) {
    this._data.params.size = size;
    return this;
  }

  /**
   * 添加自定义参数
   * @param {string} key - 参数名
   * @param {string|number} value - 参数值
   * @returns {ImagePromptBuilder}
   */
  param(key, value) {
    this._data.params[key] = String(value);
    return this;
  }

  /**
   * 设置输出语言
   * @param {string} lang - 语言代码 ('en' 或 'zh')
   * @returns {ImagePromptBuilder}
   */
  language(lang) {
    this._data.language = lang === 'zh' || lang === 'zh-CN' ? 'zh' : 'en';
    return this;
  }

  /**
   * 使用预设配置快速初始化
   * @param {string} preset - 预设名称
   * @returns {ImagePromptBuilder}
   */
  preset(preset) {
    const presets = {
      'portrait': () => {
        this.camera(['closeup', '85mm', 'bokeh'])
            .lighting(['soft', 'rim'])
            .quality(['masterpiece', 'high-detail']);
      },
      'landscape': () => {
        this.camera(['wide-angle', 'long'])
            .lighting('golden-hour')
            .quality(['masterpiece', 'ultra-hd']);
      },
      'product': () => {
        this.camera(['closeup', 'studio'])
            .lighting('studio')
            .background('white')
            .quality(['professional', 'sharp']);
      },
      'anime': () => {
        this.style('anime')
            .quality(['masterpiece', 'best-quality'])
            .negative('anime');  // 使用 anime 预设，排除写实风格
      },
      'cinematic': () => {
        this.style('cinematic')
            .camera('wide-angle')
            .lighting('cinematic')
            .aspect('21:9')
            .quality(['masterpiece', 'high-detail']);
      },
      'concept-art': () => {
        this.style('concept-art')
            .quality(['masterpiece', 'trending'])
            .details(['intricate details', 'matte painting']);
      }
    };

    if (presets[preset]) {
      presets[preset]();
    }
    return this;
  }

  /**
   * 构建提示词
   * @returns {Object} 构建结果
   */
  build() {
    const platform = PLATFORMS[this._data.platform] || PLATFORMS.general;
    const separator = platform.separator;
    
    // 构建正向提示词各部分
    const parts = [];
    
    // 主体
    if (this._data.subject) {
      let subjectStr = this._data.subject;
      if (this._data.subjectDetails.length > 0) {
        subjectStr += ', ' + this._data.subjectDetails.join(', ');
      }
      parts.push(subjectStr);
    }
    
    // 环境
    if (this._data.environment) {
      let envStr = this._data.environment;
      if (this._data.environmentDetails.length > 0) {
        envStr += ', ' + this._data.environmentDetails.join(', ');
      }
      parts.push(envStr);
    }
    
    // 风格
    if (this._data.style.length > 0) {
      parts.push(this._data.style.join(', '));
    }
    
    // 艺术家
    if (this._data.artists.length > 0) {
      parts.push(this._data.artists.join(', '));
    }
    
    // 光照
    if (this._data.lighting.length > 0) {
      parts.push(this._data.lighting.join(', '));
    }
    
    // 相机
    if (this._data.camera.length > 0) {
      parts.push(this._data.camera.join(', '));
    }
    
    // 情绪
    if (this._data.mood.length > 0) {
      parts.push(this._data.mood.join(', '));
    }
    
    // 色彩
    if (this._data.colors.length > 0) {
      parts.push(this._data.colors.join(', '));
    }
    
    // 细节
    if (this._data.details.length > 0) {
      parts.push(this._data.details.join(', '));
    }
    
    // 质量
    if (this._data.quality.length > 0) {
      parts.push(this._data.quality.join(', '));
    }
    
    // 组合正向提示词
    let prompt = parts.join(separator);
    
    // 添加平台参数 (Midjourney)
    if (this._data.platform === 'midjourney') {
      const params = { ...platform.defaultParams, ...this._data.params };
      const paramStr = Object.entries(params)
        .map(([k, v]) => `${platform.paramPrefix}${k} ${v}`)
        .join(' ');
      if (paramStr) {
        prompt += ' ' + paramStr;
      }
    }
    
    // 负面提示词
    const negativePrompt = this._data.negative.length > 0 
      ? this._data.negative.join(', ') 
      : '';
    
    return {
      prompt,
      negativePrompt,
      platform: this._data.platform,
      platformName: platform.name,
      components: {
        subject: this._data.subject,
        subjectDetails: this._data.subjectDetails,
        environment: this._data.environment,
        environmentDetails: this._data.environmentDetails,
        style: this._data.style,
        artists: this._data.artists,
        lighting: this._data.lighting,
        camera: this._data.camera,
        mood: this._data.mood,
        colors: this._data.colors,
        quality: this._data.quality,
        details: this._data.details
      },
      params: this._data.params,
      metadata: {
        createdAt: new Date().toISOString(),
        language: this._data.language
      }
    };
  }

  /**
   * 仅返回提示词字符串
   * @returns {string}
   */
  toString() {
    return this.build().prompt;
  }

  /**
   * 返回 JSON 字符串
   * @returns {string}
   */
  toJSON() {
    return JSON.stringify(this.build(), null, 2);
  }

  /**
   * 克隆当前构建器
   * @returns {ImagePromptBuilder}
   */
  clone() {
    const cloned = new ImagePromptBuilder();
    cloned._data = JSON.parse(JSON.stringify(this._data));
    return cloned;
  }

  /**
   * 重置构建器
   * @returns {ImagePromptBuilder}
   */
  reset() {
    this._data = {
      subject: null,
      subjectDetails: [],
      environment: null,
      environmentDetails: [],
      style: [],
      artists: [],
      lighting: [],
      camera: [],
      mood: [],
      colors: [],
      quality: [],
      details: [],
      negative: [],
      platform: 'general',
      params: {},
      language: 'en'
    };
    return this;
  }
}

// ==================== 工厂函数 ====================

/**
 * 创建图像提示词构建器
 * @returns {ImagePromptBuilder}
 */
function imageBuilder() {
  return new ImagePromptBuilder();
}

// ==================== 辅助函数 ====================

/**
 * 获取所有预设风格
 * @returns {Object}
 */
function getStyles() {
  return STYLES;
}

/**
 * 获取所有艺术家
 * @returns {Object}
 */
function getArtists() {
  return ARTISTS;
}

/**
 * 获取所有光照预设
 * @returns {Object}
 */
function getLighting() {
  return LIGHTING;
}

/**
 * 获取所有相机预设
 * @returns {Object}
 */
function getCamera() {
  return CAMERA;
}

/**
 * 获取所有情绪预设
 * @returns {Object}
 */
function getMoods() {
  return MOODS;
}

/**
 * 获取所有色彩方案
 * @returns {Object}
 */
function getColorSchemes() {
  return COLOR_SCHEMES;
}

/**
 * 获取所有平台配置
 * @returns {Object}
 */
function getPlatforms() {
  return PLATFORMS;
}

/**
 * 获取负面提示词预设
 * @returns {Object}
 */
function getNegativePresets() {
  return NEGATIVE_PRESETS;
}

module.exports = {
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
  MOODS,
  COLOR_SCHEMES,
  PLATFORMS,
  NEGATIVE_PRESETS,
  QUALITY_MODIFIERS
};
