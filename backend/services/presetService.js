/**
 * PresetService - 预置模板库服务
 * 
 * 提供预置模板的管理、搜索和应用功能
 */

const fs = require('fs');
const path = require('path');
const { VariableParser } = require('../utils/variableParser');
const { builder } = require('../utils/promptBuilder');

class PresetService {
  constructor(presetsPath = null) {
    this.presetsPath = presetsPath || path.join(__dirname, '../../data/presets.json');
    this.data = null;
    this._loadPresets();
  }

  /**
   * 加载预置数据
   * @private
   */
  _loadPresets() {
    try {
      const content = fs.readFileSync(this.presetsPath, 'utf-8');
      this.data = JSON.parse(content);
      // 确保 designPresets 数组存在
      if (!this.data.designPresets) {
        this.data.designPresets = [];
      }
    } catch (error) {
      console.error('Failed to load presets:', error);
      this.data = { presets: [], designPresets: [] };
    }
  }

  /**
   * 重新加载预置数据
   */
  reload() {
    this._loadPresets();
    return this;
  }

  /**
   * 获取所有设计类预置模板（用于首页设计助手）
   * @param {Object} options - 选项
   * @returns {Array}
   */
  getDesignPresets(options = {}) {
    const { includeTemplate = false, includeSystemPrompt = false } = options;
    const designPresets = this.data.designPresets || [];

    return designPresets.map(p => {
      const result = {
        id: p.id,
        name: p.name,
        nameEn: p.nameEn,
        category: p.category,
        icon: p.icon,
        description: p.description,
        tags: p.tags,
        difficulty: p.difficulty,
        variableCount: p.template?.variables?.length || 0,
        keywords: p.keywords || [],
        outputTips: p.outputTips || []
      };
      
      // 如果需要包含完整 template
      if (includeTemplate) {
        result.template = p.template;
      }
      
      // 如果需要包含 system_prompt
      if (includeSystemPrompt) {
        result.system_prompt = p.system_prompt;
      }
      
      return result;
    });
  }

  /**
   * 根据ID获取设计类预置模板详情
   * @param {string} presetId
   * @returns {Object|null}
   */
  getDesignPresetById(presetId) {
    return (this.data.designPresets || []).find(p => p.id === presetId) || null;
  }

  /**
   * 应用设计类预置模板生成提示词
   * @param {string} presetId - 预置ID
   * @param {Object} variables - 变量值
   * @returns {Object} - 包含生成的提示词和系统提示词
   */
  applyDesignPreset(presetId, variables = {}) {
    const preset = this.getDesignPresetById(presetId);
    if (!preset) {
      throw new Error(`Design preset not found: ${presetId}`);
    }

    const template = preset.template;
    if (!template) {
      throw new Error(`Design preset has no template: ${presetId}`);
    }

    // 构建用户提示词
    let userPrompt = this._buildDesignPrompt(template, variables, preset);

    return {
      success: true,
      content: userPrompt,
      system_prompt: preset.system_prompt || '',
      keywords: preset.keywords || [],
      outputTips: preset.outputTips || [],
      preset: {
        id: preset.id,
        name: preset.name,
        category: preset.category
      }
    };
  }

  /**
   * 构建设计类提示词 - 🔥 优化：根据用户参数动态生成
   * @private
   */
  _buildDesignPrompt(template, variables, preset) {
    const parts = [];
    const presetId = preset.id;

    // 🔥 动态生成角色定位（根据设计类型和用户参数）
    const dynamicRole = this._buildDynamicRole(presetId, variables, template);
    parts.push(`【角色定位】\n${dynamicRole}`);

    // 🔥 动态生成专业背景（根据用户选择的风格、类型等）
    const dynamicPersona = this._buildDynamicPersona(presetId, variables, template);
    parts.push(`【专业背景】\n${dynamicPersona}`);

    // 🔥 动态生成设计背景（融入用户的具体需求）
    const dynamicContext = this._buildDynamicContext(presetId, variables, template);
    parts.push(`【设计背景】\n${dynamicContext}`);

    // 🔥 动态生成设计任务（具体化任务描述）
    const dynamicTask = this._buildDynamicTask(presetId, variables, template);
    parts.push(`【设计任务】\n${dynamicTask}`);

    // 🔥 动态生成设计要求（根据类型添加专业约束）
    const dynamicConstraints = this._buildDynamicConstraints(presetId, variables, template);
    parts.push(`【设计要求】\n${dynamicConstraints}`);

    // 添加输出要求
    if (template.output) {
      parts.push(`【输出格式】\n${template.output}`);
    }

    // 🔥 动态生成推荐关键词
    const dynamicKeywords = this._buildDynamicKeywords(presetId, variables);
    if (dynamicKeywords) {
      parts.push(`【推荐关键词】\n${dynamicKeywords}`);
    }

    return parts.join('\n\n');
  }

  /**
   * 🆕 动态生成角色定位
   */
  _buildDynamicRole(presetId, variables, template) {
    const baseRole = template.role || '资深设计师';
    
    // Logo设计
    if (presetId === 'logo-design') {
      const logoType = variables.logo_type || '图文组合Logo';
      const style = variables.style_preference || '极简';
      const industry = variables.industry || '';
      
      const logoTypeRoles = {
        '纯文字Logo': '字体设计大师，精通Typography和字体创意设计',
        '纯图形Logo': '图形符号设计专家，擅长用简洁图形传达品牌理念',
        '图文组合Logo': '品牌视觉系统设计师，精通图文融合设计',
        '字母Logo': '字母图形化设计专家，擅长Monogram和Lettermark设计',
        '徽章Logo': '徽章纹章设计师，精通Emblem和Badge风格',
        '抽象符号Logo': '抽象视觉艺术家，擅长几何抽象与品牌概念融合'
      };
      
      return `${baseRole}，同时是${logoTypeRoles[logoType] || logoTypeRoles['图文组合Logo']}。
擅长${style}风格设计${industry ? `，对${industry}行业有深入理解` : ''}。`;
    }
    
    // 促销海报
    if (presetId === 'promo-poster') {
      const posterType = variables.poster_type || '主图直通车';
      const style = variables.style || '热烈喜庆';
      
      const posterTypeRoles = {
        '主图直通车': '电商主图设计专家，精通高点击率视觉设计',
        '详情页海报': '电商详情页设计师，擅长转化驱动的视觉叙事',
        '店铺首页Banner': '店铺视觉设计总监，精通品牌氛围营造',
        '活动会场图': '大促活动视觉设计师，擅长氛围感和紧迫感营造',
        '社交分享图': '社交媒体视觉专家，精通病毒式传播图设计',
        '直播封面': '直播视觉设计师，擅长吸睛开播封面设计'
      };
      
      return `${posterTypeRoles[posterType] || posterTypeRoles['主图直通车']}，
专注${style}风格的促销视觉设计，深谙消费心理学和视觉营销法则。`;
    }
    
    // 品牌海报
    if (presetId === 'brand-poster') {
      const purpose = variables.poster_purpose || '品牌形象展示';
      const visualStyle = variables.visual_style || '极简高端';
      
      const purposeRoles = {
        '品牌形象展示': '品牌视觉策略师，擅长用画面传达品牌精神',
        '新品发布': '新品上市视觉总监，精通产品亮相的视觉仪式感',
        '品牌周年庆': '品牌庆典视觉设计师，擅长里程碑时刻的视觉表达',
        '企业文化': '企业形象设计专家，精通文化理念的视觉转化',
        '社会责任': 'CSR视觉传达专家，擅长公益与品牌的融合表达',
        '联名合作': '跨界联名视觉设计师，精通双品牌视觉语言融合'
      };
      
      return `${purposeRoles[purpose] || purposeRoles['品牌形象展示']}，
精通${visualStyle}的视觉表达，曾为多个国际品牌打造标志性视觉作品。`;
    }
    
    // IP角色设计
    if (presetId === 'ip-character') {
      const ipType = variables.ip_type || '盲盒潮玩';
      const artStyle = variables.art_style || '泡泡玛特风';
      
      const ipTypeRoles = {
        '品牌吉祥物': '品牌IP设计师，精通将品牌理念人格化',
        '盲盒潮玩': '潮玩角色设计师，作品多次与泡泡玛特等品牌合作',
        '虚拟偶像': '虚拟角色设计专家，精通二次元与三次元融合',
        '表情包形象': '表情包IP设计师，擅长高传播度的情绪表达',
        '游戏角色': '游戏角色原画师，精通角色设定与世界观构建',
        '绘本角色': '儿童插画角色设计师，擅长温暖治愈的角色创作'
      };
      
      return `${ipTypeRoles[ipType] || ipTypeRoles['盲盒潮玩']}，
专精${artStyle}，作品深受年轻群体喜爱，具有极高的商业转化价值。`;
    }
    
    // 广告创意
    if (presetId === 'ad-creative') {
      const adFormat = variables.ad_format || '单图广告';
      const adGoal = variables.ad_goal || '促进转化';
      const platform = variables.platform || '通用';
      
      const adFormatRoles = {
        '单图广告': '信息流广告设计专家，精通单图高转化设计',
        '多图轮播': '轮播广告叙事专家，擅长多图故事化表达',
        '视频广告': '短视频广告导演，精通15秒抓住用户注意力',
        '动态创意': '动态创意设计师，擅长千人千面的个性化素材',
        '互动广告': '互动广告设计师，精通用户参与式创意',
        '开屏广告': '开屏广告视觉专家，擅长第一眼震撼设计'
      };
      
      return `${adFormatRoles[adFormat] || adFormatRoles['单图广告']}，
专注${adGoal}类广告${platform !== '通用' ? `，深谙${platform}平台用户特性` : ''}。`;
    }
    
    // 包装设计
    if (presetId === 'packaging-design') {
      const packagingType = variables.packaging_type || '产品外盒';
      const priceRange = variables.price_range || '中端';
      
      const packagingTypeRoles = {
        '产品外盒': '产品包装设计师，精通盒型结构与视觉设计',
        '礼盒套装': '礼品包装设计专家，擅长仪式感与开箱体验',
        '袋装': '软包装设计师，精通袋型包装的视觉优化',
        '瓶罐容器': '容器造型设计师，擅长瓶型与标签设计',
        '软包装': '柔性包装设计专家，精通食品软包视觉',
        '展示包装': '零售展示包装设计师，擅长货架视觉竞争力',
        '运输箱': '物流包装设计师，精通功能与品牌的平衡'
      };
      
      return `${packagingTypeRoles[packagingType] || packagingTypeRoles['产品外盒']}，
专注${priceRange}定位产品包装，作品多次获得包装设计大奖。`;
    }
    
    // ===================== 新增模板类型 =====================
    
    // UI界面设计
    if (presetId === 'ui-interface-design') {
      const platform = variables.platform || 'iOS App';
      const designStyle = variables.design_style || '极简扁平';
      
      return `资深UI/UX设计专家，专精${platform}界面设计，
精通${designStyle}风格，曾主导多款百万级用户产品的界面设计。`;
    }
    
    // 图标设计
    if (presetId === 'icon-design') {
      const iconType = variables.icon_type || '功能图标';
      const style = variables.style || '线性图标';
      
      return `图标设计专家，专精${iconType}设计，
擅长${style}风格，注重像素完美和视觉统一性。`;
    }
    
    // 商业插画
    if (presetId === 'commercial-illustration') {
      const artStyle = variables.art_style || '扁平矢量';
      const usage = variables.usage || '品牌官网';
      
      return `资深商业插画师，专精${artStyle}风格，
作品被众多品牌采用于${usage}等商业场景。`;
    }
    
    // 儿童插画
    if (presetId === 'children-illustration') {
      const artStyle = variables.art_style || '水彩童话';
      const targetAge = variables.target_age || '3-6岁';
      
      return `儿童插画创作专家，擅长${artStyle}风格，
专注${targetAge}年龄段的视觉表达，作品充满童趣和想象力。`;
    }
    
    // 概念艺术
    if (presetId === 'concept-art') {
      const genre = variables.genre || '科幻未来';
      const sceneType = variables.scene_type || '城市全景';
      
      return `概念艺术家，专精${genre}题材，
擅长${sceneType}设计，作品具有电影级视觉震撼力。`;
    }
    
    // 社交媒体配图
    if (presetId === 'social-media-graphic') {
      const platform = variables.platform || '微信公众号';
      const visualStyle = variables.visual_style || '简约高级';
      
      return `社交媒体视觉设计师，深谙${platform}平台调性，
擅长${visualStyle}风格，设计高点击率的内容配图。`;
    }
    
    // 电商产品主图
    if (presetId === 'ecommerce-product') {
      const platform = variables.platform || '淘宝/天猫';
      const imageType = variables.image_type || '白底主图';
      
      return `电商视觉设计师，精通${platform}平台规范，
专注${imageType}设计，擅长高转化的产品视觉表现。`;
    }
    
    // 名片设计
    if (presetId === 'business-card') {
      const cardStyle = variables.card_style || '简约商务';
      
      return `品牌印刷设计师，专精名片设计，
擅长${cardStyle}风格，在有限空间内展现品牌个性。`;
    }
    
    // 活动海报
    if (presetId === 'event-poster') {
      const eventType = variables.event_type || '商业活动';
      const visualStyle = variables.visual_style || '现代简约';
      
      return `活动视觉设计师，专精${eventType}海报设计，
擅长${visualStyle}风格，通过视觉传达活动调性。`;
    }
    
    // 书籍封面
    if (presetId === 'book-cover') {
      const bookGenre = variables.book_genre || '商业管理';
      const coverStyle = variables.cover_style || '简约文字型';
      
      return `书籍装帧设计师，专精${bookGenre}类书籍封面，
擅长${coverStyle}设计，通过封面传达书籍内涵。`;
    }
    
    return baseRole;
  }

  /**
   * 🆕 动态生成专业背景
   */
  _buildDynamicPersona(presetId, variables, template) {
    // Logo设计
    if (presetId === 'logo-design') {
      const logoType = variables.logo_type || '图文组合Logo';
      const style = variables.style_preference || '极简';
      const color = variables.color_preference || '蓝色系';
      
      const logoTypeExpertise = {
        '纯文字Logo': ['字体设计', '排版艺术', '字距调整', '字重控制'],
        '纯图形Logo': ['符号设计', '图形简化', '负空间运用', '视觉记忆点'],
        '图文组合Logo': ['品牌识别', '图文平衡', '多场景适配', '延展设计'],
        '字母Logo': ['字母变形', '连字设计', '几何构成', '品牌缩写'],
        '徽章Logo': ['纹章设计', '对称构图', '装饰元素', '复古工艺'],
        '抽象符号Logo': ['抽象表达', '几何美学', '动态感知', '概念转化']
      };
      
      return `专业领域：${(logoTypeExpertise[logoType] || logoTypeExpertise['图文组合Logo']).join('、')}
设计风格：${style}主义，注重${color}的运用
核心能力：将品牌理念转化为${logoType}的视觉符号，确保在各种尺寸和应用场景下都能保持识别度`;
    }
    
    // 促销海报
    if (presetId === 'promo-poster') {
      const posterType = variables.poster_type || '主图直通车';
      const style = variables.style || '热烈喜庆';
      const composition = variables.composition || '中心构图';
      const visualElement = variables.visual_element || '产品实拍';
      
      return `专业领域：${posterType}设计、${style}风格表达、消费心理学
设计风格：${style}，善用${composition}增强视觉冲击力
核心能力：通过${visualElement}结合促销信息，在0.3秒内抓住用户注意力，提升点击率和转化率`;
    }
    
    // 品牌海报
    if (presetId === 'brand-poster') {
      const purpose = variables.poster_purpose || '品牌形象展示';
      const visualStyle = variables.visual_style || '极简高端';
      const photographyStyle = variables.photography_style || '场景氛围';
      
      return `专业领域：${purpose}视觉设计、${visualStyle}美学、品牌视觉策略
设计风格：${visualStyle}，擅长${photographyStyle}的视觉叙事
核心能力：用画面传达品牌价值主张，每一帧都是品牌故事的视觉表达`;
    }
    
    // IP角色设计
    if (presetId === 'ip-character') {
      const ipType = variables.ip_type || '盲盒潮玩';
      const artStyle = variables.art_style || '泡泡玛特风';
      const renderStyle = variables.render_style || '3D渲染';
      
      return `专业领域：${ipType}设计、${artStyle}表现、${renderStyle}技术
设计风格：${artStyle}，注重角色的情感共鸣和收藏价值
核心能力：创造具有独特人格魅力的IP形象，让角色"活"起来并产生商业价值`;
    }
    
    // 广告创意
    if (presetId === 'ad-creative') {
      const adFormat = variables.ad_format || '单图广告';
      const creativeStyle = variables.creative_style || '场景代入';
      const visualTone = variables.visual_tone || '活力年轻';
      
      return `专业领域：${adFormat}创意、${creativeStyle}策略、用户行为心理
设计风格：${visualTone}，善于制造点击欲望
核心能力：3秒法则——在用户滑动的瞬间完成"吸引-理解-行动"的转化链路`;
    }
    
    // 包装设计
    if (presetId === 'packaging-design') {
      const packagingType = variables.packaging_type || '产品外盒';
      const style = variables.style || '简约现代';
      const material = variables.material_preference || '纸质卡盒';
      const finishing = variables.finishing || '无特殊工艺';
      
      return `专业领域：${packagingType}结构设计、${style}视觉风格、${material}工艺
设计风格：${style}，注重${finishing !== '无特殊工艺' ? finishing + '工艺细节' : '简洁实用'}
核心能力：让包装成为产品的"第二张脸"，在货架上脱颖而出并创造开箱惊喜`;
    }
    
    // ===================== 新增模板类型 =====================
    
    // UI界面设计
    if (presetId === 'ui-interface-design') {
      const platform = variables.platform || 'iOS App';
      const designStyle = variables.design_style || '极简扁平';
      const pageType = variables.page_type || '首页/主界面';
      
      return `专业领域：${platform}界面设计、${pageType}设计、交互体验优化
设计风格：${designStyle}，注重信息层级和用户体验
核心能力：将复杂功能转化为简洁直观的界面，让用户"零学习成本"上手`;
    }
    
    // 图标设计
    if (presetId === 'icon-design') {
      const iconType = variables.icon_type || '功能图标';
      const style = variables.style || '线性图标';
      const lineWeight = variables.line_weight || '常规(2px)';
      
      return `专业领域：${iconType}设计、${style}风格、图标系统构建
设计风格：${style}，${lineWeight}线条，追求像素完美
核心能力：在最小空间内传达最准确的含义，确保各尺寸下的可识别性`;
    }
    
    // 商业插画
    if (presetId === 'commercial-illustration') {
      const artStyle = variables.art_style || '扁平矢量';
      const characterStyle = variables.character_style || '卡通人物';
      const colorMood = variables.color_mood || '明快活力';
      
      return `专业领域：${artStyle}插画、${characterStyle}设计、商业视觉
设计风格：${colorMood}配色，场景叙事能力强
核心能力：将抽象概念可视化，让品牌故事跃然纸上`;
    }
    
    // 儿童插画
    if (presetId === 'children-illustration') {
      const artStyle = variables.art_style || '水彩童话';
      const targetAge = variables.target_age || '3-6岁';
      const mood = variables.mood || '温馨治愈';
      
      return `专业领域：${artStyle}插画、${targetAge}儿童视觉认知、故事叙事
设计风格：${mood}，色彩柔和明快，角色友好可爱
核心能力：用画面讲述故事，激发儿童想象力和阅读兴趣`;
    }
    
    // 概念艺术
    if (presetId === 'concept-art') {
      const genre = variables.genre || '科幻未来';
      const sceneType = variables.scene_type || '城市全景';
      const mood = variables.mood || '壮观';
      
      return `专业领域：${genre}世界观构建、${sceneType}设计、光影氛围
设计风格：${mood}氛围营造，电影级视觉品质
核心能力：创造沉浸式视觉世界，让观者身临其境`;
    }
    
    // 社交媒体配图
    if (presetId === 'social-media-graphic') {
      const platform = variables.platform || '微信公众号';
      const graphicType = variables.graphic_type || '文章封面';
      const visualStyle = variables.visual_style || '简约高级';
      
      return `专业领域：${platform}内容设计、${graphicType}创作、流量思维
设计风格：${visualStyle}，符合平台用户审美
核心能力：3秒抓住用户注意力，提升内容点击率和传播度`;
    }
    
    // 电商产品主图
    if (presetId === 'ecommerce-product') {
      const imageType = variables.image_type || '白底主图';
      const platform = variables.platform || '淘宝/天猫';
      const shootingAngle = variables.shooting_angle || '45度角';
      
      return `专业领域：${imageType}设计、${platform}视觉规范、产品摄影
设计风格：${shootingAngle}拍摄，突出产品质感
核心能力：让产品"自己说话"，在搜索结果中脱颖而出`;
    }
    
    // 名片设计
    if (presetId === 'business-card') {
      const cardStyle = variables.card_style || '简约商务';
      const layout = variables.layout || '横版';
      
      return `专业领域：${cardStyle}名片设计、${layout}排版、印刷工艺
设计风格：${cardStyle}，注重细节和品质感
核心能力：在方寸之间展现专业形象和品牌个性`;
    }
    
    // 活动海报
    if (presetId === 'event-poster') {
      const eventType = variables.event_type || '商业活动';
      const visualStyle = variables.visual_style || '现代简约';
      const mainVisual = variables.main_visual || '抽象图形';
      
      return `专业领域：${eventType}视觉设计、${visualStyle}表现、${mainVisual}创意
设计风格：${visualStyle}，注重氛围感和信息传达
核心能力：通过海报激发参与欲望，传达活动调性`;
    }
    
    // 书籍封面
    if (presetId === 'book-cover') {
      const bookGenre = variables.book_genre || '商业管理';
      const coverStyle = variables.cover_style || '简约文字型';
      const mood = variables.mood || '严肃专业';
      
      return `专业领域：${bookGenre}类封面设计、${coverStyle}表现、出版规范
设计风格：${mood}调性，注重内涵传达
核心能力：让读者通过封面感受书籍灵魂，激发阅读欲望`;
    }
    
    // 默认
    const persona = template.persona;
    if (persona && typeof persona === 'object') {
      let text = '';
      if (persona.expertise) text += `专业领域：${persona.expertise.join('、')}\n`;
      if (persona.style) text += `设计风格：${persona.style}\n`;
      if (persona.experience) text += `从业经验：${persona.experience}`;
      return text.trim();
    }
    return '资深设计专家，多年行业经验';
  }

  /**
   * 🆕 动态生成设计背景
   */
  _buildDynamicContext(presetId, variables, template) {
    // Logo设计
    if (presetId === 'logo-design') {
      const brandName = variables.brand_name || '[品牌名称]';
      const industry = variables.industry || '[行业]';
      const logoType = variables.logo_type || '图文组合Logo';
      const style = variables.style_preference || '极简';
      const color = variables.color_preference || '蓝色系';
      const keywords = variables.keywords || '';
      
      return `客户「${brandName}」是一家${industry}企业，需要设计一个${logoType}。
品牌希望通过Logo传达：${keywords || '专业、可信赖'}的品牌形象。
设计方向：${style}风格，主色调倾向${color}。
Logo将应用于：名片、网站、APP、产品包装、户外广告等多种场景。`;
    }
    
    // 促销海报
    if (presetId === 'promo-poster') {
      const eventName = variables.event_name || '[活动名称]';
      const discountInfo = variables.discount_info || '[优惠信息]';
      const productType = variables.product_type || '[产品类型]';
      const posterType = variables.poster_type || '主图直通车';
      const style = variables.style || '热烈喜庆';
      
      return `活动背景：「${eventName}」大促活动，核心优惠为${discountInfo}。
产品类型：${productType}
海报用途：${posterType}，需要在${this._getPosterContext(posterType)}
设计调性：${style}，需要营造紧迫感和购买欲望。`;
    }
    
    // 品牌海报
    if (presetId === 'brand-poster') {
      const brandName = variables.brand_name || '[品牌名称]';
      const brandSlogan = variables.brand_slogan || '';
      const brandValue = variables.brand_value || '[品牌价值]';
      const purpose = variables.poster_purpose || '品牌形象展示';
      
      return `品牌「${brandName}」${brandSlogan ? `，口号："${brandSlogan}"` : ''}
品牌核心价值：${brandValue}
海报目的：${purpose}，需要在视觉上传达品牌的独特调性和价值主张。
目标：让观者在看到海报的瞬间感受到品牌的精神内核。`;
    }
    
    // IP角色设计
    if (presetId === 'ip-character') {
      const concept = variables.character_concept || '[角色概念]';
      const ipType = variables.ip_type || '盲盒潮玩';
      const personality = variables.personality || '';
      const artStyle = variables.art_style || '泡泡玛特风';
      
      return `IP概念：${concept}
IP类型：${ipType}，需要具有${this._getIPTypeContext(ipType)}
性格特点：${personality || '待定义'}
艺术风格：${artStyle}
目标：创造一个具有高辨识度、情感共鸣和商业价值的IP形象。`;
    }
    
    // 广告创意
    if (presetId === 'ad-creative') {
      const productName = variables.product_name || '[产品名称]';
      const targetAudience = variables.target_audience || '[目标人群]';
      const sellingPoint = variables.selling_point || '[核心卖点]';
      const platform = variables.platform || '通用';
      const adGoal = variables.ad_goal || '促进转化';
      
      return `推广产品：${productName}
目标人群：${targetAudience}
核心卖点：${sellingPoint}
投放平台：${platform}${platform !== '通用' ? `（需符合${platform}的内容调性和用户习惯）` : ''}
广告目标：${adGoal}`;
    }
    
    // 包装设计
    if (presetId === 'packaging-design') {
      const productName = variables.product_name || '[产品名称]';
      const productType = variables.product_type || '[产品类型]';
      const packagingType = variables.packaging_type || '产品外盒';
      const priceRange = variables.price_range || '中端';
      
      return `产品信息：${productName}（${productType}）
包装类型：${packagingType}
价格定位：${priceRange}，包装需要匹配${this._getPriceRangeContext(priceRange)}
目标：通过包装设计提升产品价值感，创造独特的开箱体验。`;
    }
    
    // ===================== 新增模板类型 =====================
    
    // UI界面设计
    if (presetId === 'ui-interface-design') {
      const productName = variables.product_name || '[产品名称]';
      const pageType = variables.page_type || '首页/主界面';
      const platform = variables.platform || 'iOS App';
      const industry = variables.industry || '';
      const keyFeatures = variables.key_features || '';
      
      return `产品「${productName}」需要设计${platform}的${pageType}。
${industry ? `所属行业：${industry}` : ''}
${keyFeatures ? `核心功能模块：${keyFeatures}` : ''}
目标：设计一个简洁易用、符合平台规范的界面。`;
    }
    
    // 图标设计
    if (presetId === 'icon-design') {
      const iconName = variables.icon_name || '[图标含义]';
      const iconType = variables.icon_type || '功能图标';
      const usageScenario = variables.usage_scenario || '';
      
      return `需要设计一个表达「${iconName}」含义的${iconType}。
${usageScenario ? `使用场景：${usageScenario}` : ''}
目标：在最小视觉空间内准确传达含义，保持风格统一。`;
    }
    
    // 商业插画
    if (presetId === 'commercial-illustration') {
      const theme = variables.illustration_theme || '[插画主题]';
      const usage = variables.usage || '品牌官网';
      const brandColor = variables.brand_color || '';
      
      return `创作主题：${theme}
应用场景：${usage}
${brandColor ? `品牌主色：${brandColor}` : ''}
目标：创作一幅既能表达主题又符合商业应用需求的插画。`;
    }
    
    // 儿童插画
    if (presetId === 'children-illustration') {
      const scene = variables.story_scene || '[故事场景]';
      const targetAge = variables.target_age || '3-6岁';
      const mainCharacter = variables.main_character || '';
      const educationalElement = variables.educational_element || '';
      
      return `故事场景：${scene}
目标年龄：${targetAge}
${mainCharacter ? `主要角色：${mainCharacter}` : ''}
${educationalElement ? `教育元素：${educationalElement}` : ''}
目标：创作一幅温馨有趣、能吸引儿童注意力的插画。`;
    }
    
    // 概念艺术
    if (presetId === 'concept-art') {
      const concept = variables.scene_concept || '[场景概念]';
      const genre = variables.genre || '科幻未来';
      const keyElements = variables.key_elements || '';
      
      return `场景概念：${concept}
题材类型：${genre}
${keyElements ? `关键元素：${keyElements}` : ''}
目标：创作一幅具有震撼视觉效果的概念艺术作品。`;
    }
    
    // 社交媒体配图
    if (presetId === 'social-media-graphic') {
      const theme = variables.content_theme || '[内容主题]';
      const platform = variables.platform || '微信公众号';
      const graphicType = variables.graphic_type || '文章封面';
      const accountStyle = variables.account_style || '';
      
      return `内容主题：${theme}
目标平台：${platform}
配图类型：${graphicType}
${accountStyle ? `账号风格：${accountStyle}` : ''}
目标：设计一张符合平台调性、能提升点击率的配图。`;
    }
    
    // 电商产品主图
    if (presetId === 'ecommerce-product') {
      const productName = variables.product_name || '[产品名称]';
      const productCategory = variables.product_category || '[品类]';
      const imageType = variables.image_type || '白底主图';
      const sellingPoint = variables.selling_point || '';
      
      return `产品信息：${productName}（${productCategory}）
图片类型：${imageType}
${sellingPoint ? `核心卖点：${sellingPoint}` : ''}
目标：设计一张能在搜索结果中脱颖而出的产品主图。`;
    }
    
    // 名片设计
    if (presetId === 'business-card') {
      const name = variables.name || '[姓名]';
      const title = variables.title || '[职位]';
      const company = variables.company || '';
      const industry = variables.industry || '';
      
      return `持卡人：${name}，${title}
${company ? `公司：${company}` : ''}
${industry ? `行业：${industry}` : ''}
目标：设计一张能展现专业形象和个人特色的名片。`;
    }
    
    // 活动海报
    if (presetId === 'event-poster') {
      const eventName = variables.event_name || '[活动名称]';
      const eventType = variables.event_type || '商业活动';
      const eventDate = variables.event_date || '';
      const venue = variables.venue || '';
      const targetAudience = variables.target_audience || '';
      
      return `活动名称：「${eventName}」
活动类型：${eventType}
${eventDate ? `活动时间：${eventDate}` : ''}
${venue ? `活动地点：${venue}` : ''}
${targetAudience ? `目标人群：${targetAudience}` : ''}
目标：设计一张能传达活动调性并吸引目标人群参与的海报。`;
    }
    
    // 书籍封面
    if (presetId === 'book-cover') {
      const bookTitle = variables.book_title || '[书名]';
      const author = variables.author || '';
      const bookGenre = variables.book_genre || '商业管理';
      const targetReader = variables.target_reader || '';
      const keyVisual = variables.key_visual || '';
      
      return `书名：《${bookTitle}》
${author ? `作者：${author}` : ''}
书籍类型：${bookGenre}
${targetReader ? `目标读者：${targetReader}` : ''}
${keyVisual ? `关键视觉元素建议：${keyVisual}` : ''}
目标：设计一个能传达书籍内涵并吸引目标读者的封面。`;
    }
    
    // 默认使用模板中的context
    let context = template.context || '';
    for (const [key, value] of Object.entries(variables)) {
      if (value) {
        context = context.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
      }
    }
    return context;
  }

  /**
   * 🆕 动态生成设计任务
   */
  _buildDynamicTask(presetId, variables, template) {
    // Logo设计
    if (presetId === 'logo-design') {
      const logoType = variables.logo_type || '图文组合Logo';
      const brandName = variables.brand_name || '[品牌名称]';
      
      const logoTypeTask = {
        '纯文字Logo': `为「${brandName}」设计一个纯文字Logo（Wordmark），通过字体设计传达品牌个性，不使用任何图形元素`,
        '纯图形Logo': `为「${brandName}」设计一个纯图形Logo（Symbol），创造一个无需文字即可代表品牌的视觉符号`,
        '图文组合Logo': `为「${brandName}」设计一个图文组合Logo，让图形和品牌名称相得益彰，可独立或组合使用`,
        '字母Logo': `为「${brandName}」设计一个字母Logo（Lettermark/Monogram），将品牌首字母创意化设计`,
        '徽章Logo': `为「${brandName}」设计一个徽章式Logo（Emblem），将文字与图形融合在一个封闭图形中`,
        '抽象符号Logo': `为「${brandName}」设计一个抽象符号Logo，用几何图形或抽象元素传达品牌理念`
      };
      
      return logoTypeTask[logoType] || logoTypeTask['图文组合Logo'];
    }
    
    // 促销海报
    if (presetId === 'promo-poster') {
      const posterType = variables.poster_type || '主图直通车';
      const eventName = variables.event_name || '[活动]';
      const discountInfo = variables.discount_info || '[优惠]';
      
      return `设计一张${posterType}，用于「${eventName}」活动推广。
核心任务：突出「${discountInfo}」的优惠信息，在${this._getPosterTaskContext(posterType)}`;
    }
    
    // 品牌海报
    if (presetId === 'brand-poster') {
      const purpose = variables.poster_purpose || '品牌形象展示';
      const brandName = variables.brand_name || '[品牌]';
      const visualStyle = variables.visual_style || '极简高端';
      
      return `为「${brandName}」设计一张${purpose}海报。
核心任务：用${visualStyle}的视觉语言，传达品牌的核心价值和情感调性，让画面自己"说话"。`;
    }
    
    // IP角色设计
    if (presetId === 'ip-character') {
      const ipType = variables.ip_type || '盲盒潮玩';
      const concept = variables.character_concept || '[角色概念]';
      const renderStyle = variables.render_style || '3D渲染';
      
      return `设计一个${ipType}IP角色：${concept}
核心任务：创造一个具有独特人格魅力的角色，适合${renderStyle}表现，具备系列化延展潜力。`;
    }
    
    // 广告创意
    if (presetId === 'ad-creative') {
      const adFormat = variables.ad_format || '单图广告';
      const adGoal = variables.ad_goal || '促进转化';
      const creativeStyle = variables.creative_style || '场景代入';
      
      return `设计一个${adFormat}创意，目标是${adGoal}。
核心任务：采用${creativeStyle}的创意策略，在3秒内抓住用户注意力并引导行动。`;
    }
    
    // 包装设计
    if (presetId === 'packaging-design') {
      const packagingType = variables.packaging_type || '产品外盒';
      const productName = variables.product_name || '[产品]';
      const style = variables.style || '简约现代';
      
      return `为「${productName}」设计${packagingType}包装方案。
核心任务：用${style}的设计语言，让包装成为产品的加分项，在货架上具有竞争力。`;
    }
    
    // ===================== 新增模板类型 =====================
    
    // UI界面设计
    if (presetId === 'ui-interface-design') {
      const productName = variables.product_name || '[产品]';
      const pageType = variables.page_type || '首页/主界面';
      const platform = variables.platform || 'iOS App';
      
      return `为「${productName}」设计${platform}的${pageType}。
核心任务：创建简洁直观的界面，确保良好的用户体验和操作效率。`;
    }
    
    // 图标设计
    if (presetId === 'icon-design') {
      const iconName = variables.icon_name || '[图标]';
      const iconType = variables.icon_type || '功能图标';
      const style = variables.style || '线性图标';
      
      return `设计一个${style}风格的${iconType}，表达「${iconName}」的含义。
核心任务：在最小视觉空间内准确传达含义，确保各尺寸下清晰可识别。`;
    }
    
    // 商业插画
    if (presetId === 'commercial-illustration') {
      const theme = variables.illustration_theme || '[主题]';
      const usage = variables.usage || '品牌官网';
      const artStyle = variables.art_style || '扁平矢量';
      
      return `创作一幅关于「${theme}」的${artStyle}风格商业插画，用于${usage}。
核心任务：既能准确表达主题，又具有商业应用价值。`;
    }
    
    // 儿童插画
    if (presetId === 'children-illustration') {
      const scene = variables.story_scene || '[故事场景]';
      const illustrationType = variables.illustration_type || '绘本内页';
      const artStyle = variables.art_style || '水彩童话';
      
      return `创作一幅${artStyle}风格的${illustrationType}，描绘「${scene}」。
核心任务：用温暖有趣的画面吸引儿童注意力，激发阅读和想象兴趣。`;
    }
    
    // 概念艺术
    if (presetId === 'concept-art') {
      const concept = variables.scene_concept || '[场景概念]';
      const genre = variables.genre || '科幻未来';
      const sceneType = variables.scene_type || '城市全景';
      
      return `创作一幅${genre}题材的${sceneType}概念图：${concept}。
核心任务：营造沉浸式视觉世界，具有电影级的震撼效果。`;
    }
    
    // 社交媒体配图
    if (presetId === 'social-media-graphic') {
      const theme = variables.content_theme || '[主题]';
      const platform = variables.platform || '微信公众号';
      const graphicType = variables.graphic_type || '文章封面';
      
      return `为「${theme}」主题内容设计${platform}的${graphicType}。
核心任务：在信息流中脱颖而出，提升内容点击率。`;
    }
    
    // 电商产品主图
    if (presetId === 'ecommerce-product') {
      const productName = variables.product_name || '[产品]';
      const imageType = variables.image_type || '白底主图';
      const platform = variables.platform || '淘宝/天猫';
      
      return `为「${productName}」设计${platform}平台的${imageType}。
核心任务：突出产品质感和卖点，在搜索结果中吸引点击。`;
    }
    
    // 名片设计
    if (presetId === 'business-card') {
      const name = variables.name || '[姓名]';
      const cardStyle = variables.card_style || '简约商务';
      
      return `为「${name}」设计一张${cardStyle}风格的名片。
核心任务：在方寸之间展现专业形象和个人/品牌特色。`;
    }
    
    // 活动海报
    if (presetId === 'event-poster') {
      const eventName = variables.event_name || '[活动]';
      const eventType = variables.event_type || '商业活动';
      const visualStyle = variables.visual_style || '现代简约';
      
      return `为「${eventName}」${eventType}设计一张${visualStyle}风格的海报。
核心任务：传达活动调性，吸引目标人群参与。`;
    }
    
    // 书籍封面
    if (presetId === 'book-cover') {
      const bookTitle = variables.book_title || '[书名]';
      const bookGenre = variables.book_genre || '商业管理';
      const coverStyle = variables.cover_style || '简约文字型';
      
      return `为《${bookTitle}》设计一个${coverStyle}风格的${bookGenre}类书籍封面。
核心任务：通过封面传达书籍内涵，吸引目标读者。`;
    }
    
    // 默认
    let task = template.task || '';
    for (const [key, value] of Object.entries(variables)) {
      if (value) {
        task = task.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
      }
    }
    return task;
  }

  /**
   * 🆕 动态生成设计要求
   */
  _buildDynamicConstraints(presetId, variables, template) {
    const constraints = [];
    
    // Logo设计
    if (presetId === 'logo-design') {
      const logoType = variables.logo_type || '图文组合Logo';
      const style = variables.style_preference || '极简';
      const color = variables.color_preference || '蓝色系';
      
      constraints.push(`Logo类型：${logoType}，严格遵循该类型的设计规范`);
      constraints.push(`设计风格：${style}，保持视觉简洁有力`);
      constraints.push(`色彩方案：以${color}为主，确保在黑白场景下同样有效`);
      constraints.push('适配性：确保Logo在各种尺寸（从favicon到户外广告）都清晰可识别');
      constraints.push('独特性：避免与知名品牌Logo雷同，确保原创性');
    }
    
    // 促销海报
    else if (presetId === 'promo-poster') {
      const posterType = variables.poster_type || '主图直通车';
      const style = variables.style || '热烈喜庆';
      const composition = variables.composition || '中心构图';
      const visualElement = variables.visual_element || '产品实拍';
      const mainColor = variables.main_color || '红色';
      
      constraints.push(`海报类型：${posterType}，符合该场景的尺寸和设计规范`);
      constraints.push(`视觉风格：${style}，营造强烈的促销氛围`);
      constraints.push(`构图方式：${composition}，确保信息层次清晰`);
      constraints.push(`视觉元素：以${visualElement}为主，突出产品卖点`);
      constraints.push(`主色调：${mainColor}，与促销氛围相匹配`);
      constraints.push('文字层次：主标题>优惠信息>副标题>细则，一目了然');
    }
    
    // 品牌海报
    else if (presetId === 'brand-poster') {
      const purpose = variables.poster_purpose || '品牌形象展示';
      const visualStyle = variables.visual_style || '极简高端';
      const photographyStyle = variables.photography_style || '场景氛围';
      const mood = variables.mood || '专业、信赖';
      
      constraints.push(`海报用途：${purpose}，传达品牌核心价值`);
      constraints.push(`视觉风格：${visualStyle}，体现品牌调性`);
      constraints.push(`摄影/画面风格：${photographyStyle}，营造沉浸感`);
      constraints.push(`情绪氛围：${mood}，让观者产生情感共鸣`);
      constraints.push('留白与呼吸感：高端品牌海报需要适当留白，避免信息过载');
    }
    
    // IP角色设计
    else if (presetId === 'ip-character') {
      const ipType = variables.ip_type || '盲盒潮玩';
      const artStyle = variables.art_style || '泡泡玛特风';
      const renderStyle = variables.render_style || '3D渲染';
      const pose = variables.pose || '站立';
      const colorScheme = variables.color_scheme || '马卡龙色系';
      
      constraints.push(`IP类型：${ipType}，符合该类型的商业应用需求`);
      constraints.push(`艺术风格：${artStyle}，保持风格一致性`);
      constraints.push(`渲染风格：${renderStyle}，注重材质和光影表现`);
      constraints.push(`角色姿态：${pose}，展现角色性格`);
      constraints.push(`配色方案：${colorScheme}，增强角色的视觉吸引力`);
      constraints.push('细节要求：表情生动、比例协调、细节精致，具有收藏价值感');
    }
    
    // 广告创意
    else if (presetId === 'ad-creative') {
      const adFormat = variables.ad_format || '单图广告';
      const platform = variables.platform || '通用';
      const adGoal = variables.ad_goal || '促进转化';
      const creativeStyle = variables.creative_style || '场景代入';
      const visualTone = variables.visual_tone || '活力年轻';
      
      constraints.push(`广告形式：${adFormat}，符合该形式的设计规范`);
      constraints.push(`投放平台：${platform}${platform !== '通用' ? '，遵循平台内容调性' : ''}`);
      constraints.push(`广告目标：${adGoal}，所有设计元素服务于此目标`);
      constraints.push(`创意类型：${creativeStyle}，让用户产生代入感`);
      constraints.push(`视觉调性：${visualTone}，与目标人群审美匹配`);
      constraints.push('行动号召：必须有清晰的CTA（Call to Action）引导用户下一步');
    }
    
    // 包装设计
    else if (presetId === 'packaging-design') {
      const packagingType = variables.packaging_type || '产品外盒';
      const style = variables.style || '简约现代';
      const material = variables.material_preference || '纸质卡盒';
      const finishing = variables.finishing || '无特殊工艺';
      const priceRange = variables.price_range || '中端';
      
      constraints.push(`包装类型：${packagingType}，考虑结构可行性`);
      constraints.push(`设计风格：${style}，体现品牌调性`);
      constraints.push(`材质建议：${material}，平衡成本与效果`);
      if (finishing !== '无特殊工艺') {
        constraints.push(`工艺细节：${finishing}，提升质感和档次`);
      }
      constraints.push(`价格定位：${priceRange}，包装成本与产品定位匹配`);
      constraints.push('实用性：考虑开箱体验、运输保护、货架展示效果');
    }
    
    // ===================== 新增模板类型 =====================
    
    // UI界面设计
    else if (presetId === 'ui-interface-design') {
      const platform = variables.platform || 'iOS App';
      const designStyle = variables.design_style || '极简扁平';
      const pageType = variables.page_type || '首页/主界面';
      const primaryColor = variables.primary_color || '蓝色';
      
      constraints.push(`目标平台：${platform}，遵循平台设计规范`);
      constraints.push(`页面类型：${pageType}，确保信息架构合理`);
      constraints.push(`设计风格：${designStyle}，保持视觉一致性`);
      constraints.push(`主色调：${primaryColor}，建立品牌识别`);
      constraints.push('交互友好：操作路径清晰，反馈及时，降低学习成本');
      constraints.push('适配性：考虑不同屏幕尺寸的响应式设计');
    }
    
    // 图标设计
    else if (presetId === 'icon-design') {
      const iconType = variables.icon_type || '功能图标';
      const style = variables.style || '线性图标';
      const cornerStyle = variables.corner_style || '圆角';
      const lineWeight = variables.line_weight || '常规(2px)';
      
      constraints.push(`图标类型：${iconType}，明确表意功能`);
      constraints.push(`图标风格：${style}，${cornerStyle}处理`);
      constraints.push(`线条粗细：${lineWeight}，保持全套统一`);
      constraints.push('像素完美：对齐像素网格，避免模糊');
      constraints.push('可识别性：16px尺寸下仍清晰可辨');
      constraints.push('风格统一：与同系列图标保持视觉一致');
    }
    
    // 商业插画
    else if (presetId === 'commercial-illustration') {
      const artStyle = variables.art_style || '扁平矢量';
      const characterStyle = variables.character_style || '卡通人物';
      const colorMood = variables.color_mood || '明快活力';
      const composition = variables.composition || '场景透视';
      
      constraints.push(`艺术风格：${artStyle}，保持风格一致性`);
      constraints.push(`人物风格：${characterStyle}`);
      constraints.push(`色彩情绪：${colorMood}，增强画面感染力`);
      constraints.push(`构图方式：${composition}，引导视觉焦点`);
      constraints.push('商业适用：画面完整，便于多场景应用');
      constraints.push('版权清晰：确保原创，避免侵权风险');
    }
    
    // 儿童插画
    else if (presetId === 'children-illustration') {
      const artStyle = variables.art_style || '水彩童话';
      const targetAge = variables.target_age || '3-6岁';
      const mood = variables.mood || '温馨治愈';
      
      constraints.push(`绘画风格：${artStyle}，符合儿童审美`);
      constraints.push(`目标年龄：${targetAge}，适配该年龄段认知特点`);
      constraints.push(`情绪氛围：${mood}，传递积极情感`);
      constraints.push('安全友好：避免任何可能引起不适的元素');
      constraints.push('色彩柔和：使用对儿童眼睛友好的色彩');
      constraints.push('故事性强：画面能激发儿童想象力');
    }
    
    // 概念艺术
    else if (presetId === 'concept-art') {
      const genre = variables.genre || '科幻未来';
      const sceneType = variables.scene_type || '城市全景';
      const timeOfDay = variables.time_of_day || '黄昏';
      const mood = variables.mood || '壮观';
      const artDirection = variables.art_direction || '写实风格';
      
      constraints.push(`题材类型：${genre}，遵循该题材的视觉语言`);
      constraints.push(`场景类型：${sceneType}，注意透视和比例`);
      constraints.push(`时间/光照：${timeOfDay}，营造氛围`);
      constraints.push(`情绪调性：${mood}，强化视觉冲击力`);
      constraints.push(`艺术方向：${artDirection}，保持风格统一`);
      constraints.push('细节丰富：近景精细，远景有层次感');
    }
    
    // 社交媒体配图
    else if (presetId === 'social-media-graphic') {
      const platform = variables.platform || '微信公众号';
      const graphicType = variables.graphic_type || '文章封面';
      const visualStyle = variables.visual_style || '简约高级';
      const textOverlay = variables.text_overlay || '需要留文字位置';
      
      constraints.push(`目标平台：${platform}，符合平台调性和规范`);
      constraints.push(`配图类型：${graphicType}，匹配内容形式`);
      constraints.push(`视觉风格：${visualStyle}，提升内容质感`);
      constraints.push(`文字处理：${textOverlay}`);
      constraints.push('尺寸规范：符合平台推荐尺寸，避免裁切关键信息');
      constraints.push('吸睛度：在信息流中快速抓住注意力');
    }
    
    // 电商产品主图
    else if (presetId === 'ecommerce-product') {
      const imageType = variables.image_type || '白底主图';
      const platform = variables.platform || '淘宝/天猫';
      const shootingAngle = variables.shooting_angle || '45度角';
      const background = variables.background || '纯白背景';
      const lighting = variables.lighting || '柔和均匀';
      
      constraints.push(`图片类型：${imageType}，符合平台要求`);
      constraints.push(`销售平台：${platform}，遵循平台图片规范`);
      constraints.push(`拍摄角度：${shootingAngle}，展示产品最佳面`);
      constraints.push(`背景处理：${background}，突出产品主体`);
      constraints.push(`光线效果：${lighting}，展现产品质感`);
      constraints.push('主体突出：产品占比合适，细节清晰');
    }
    
    // 名片设计
    else if (presetId === 'business-card') {
      const cardStyle = variables.card_style || '简约商务';
      const layout = variables.layout || '横版';
      const colorScheme = variables.color_scheme || '黑白';
      const specialProcess = variables.special_process || '无特殊工艺';
      
      constraints.push(`名片风格：${cardStyle}，体现职业特点`);
      constraints.push(`版式布局：${layout}，信息排列合理`);
      constraints.push(`配色方案：${colorScheme}，简洁专业`);
      if (specialProcess !== '无特殊工艺') {
        constraints.push(`特殊工艺：${specialProcess}，提升质感`);
      }
      constraints.push('信息层级：姓名>职位>联系方式，一目了然');
      constraints.push('印刷考虑：字号不小于7pt，出血位预留');
    }
    
    // 活动海报
    else if (presetId === 'event-poster') {
      const eventType = variables.event_type || '商业活动';
      const visualStyle = variables.visual_style || '现代简约';
      const mainVisual = variables.main_visual || '抽象图形';
      const colorMood = variables.color_mood || '多彩活力';
      
      constraints.push(`活动类型：${eventType}，匹配活动调性`);
      constraints.push(`视觉风格：${visualStyle}，传达活动氛围`);
      constraints.push(`主视觉元素：${mainVisual}，吸引目标人群`);
      constraints.push(`色彩情绪：${colorMood}，强化情感共鸣`);
      constraints.push('信息层级：活动名称>时间地点>详情，清晰易读');
      constraints.push('多场景适配：考虑线上线下不同展示需求');
    }
    
    // 书籍封面
    else if (presetId === 'book-cover') {
      const bookGenre = variables.book_genre || '商业管理';
      const bookFormat = variables.book_format || '实体书';
      const coverStyle = variables.cover_style || '简约文字型';
      const mood = variables.mood || '严肃专业';
      
      constraints.push(`书籍类型：${bookGenre}，符合读者期待`);
      constraints.push(`出版形式：${bookFormat}，考虑展示场景`);
      constraints.push(`封面风格：${coverStyle}，传达书籍调性`);
      constraints.push(`情绪调性：${mood}，与内容匹配`);
      constraints.push('书名突出：标题清晰可读，层级分明');
      constraints.push('印刷规范：考虑书脊、勒口设计，CMYK色彩');
    }
    
    // 默认使用模板约束
    else if (template.constraints && template.constraints.length > 0) {
      return template.constraints.map((c, i) => `${i + 1}. ${c}`).join('\n');
    }
    
    return constraints.map((c, i) => `${i + 1}. ${c}`).join('\n');
  }

  /**
   * 🆕 动态生成推荐关键词
   */
  _buildDynamicKeywords(presetId, variables) {
    const keywords = [];
    
    // Logo设计
    if (presetId === 'logo-design') {
      const logoType = variables.logo_type || '图文组合Logo';
      const style = variables.style_preference || '极简';
      
      const logoTypeKeywords = {
        '纯文字Logo': ['wordmark', 'typography logo', 'logotype', 'custom lettering', 'text-based'],
        '纯图形Logo': ['symbol', 'logomark', 'pictorial mark', 'iconic logo', 'graphic mark'],
        '图文组合Logo': ['combination mark', 'logo lockup', 'brand identity', 'integrated logo'],
        '字母Logo': ['lettermark', 'monogram', 'initials', 'abbreviated logo'],
        '徽章Logo': ['emblem', 'badge', 'crest', 'seal', 'enclosed logo'],
        '抽象符号Logo': ['abstract mark', 'geometric logo', 'conceptual symbol', 'dynamic mark']
      };
      
      keywords.push(...(logoTypeKeywords[logoType] || []));
      keywords.push(`${style} style`, 'vector', 'scalable', 'memorable');
    }
    
    // 促销海报
    else if (presetId === 'promo-poster') {
      const style = variables.style || '热烈喜庆';
      const visualElement = variables.visual_element || '产品实拍';
      
      keywords.push('promotional poster', 'sale banner', 'e-commerce visual');
      keywords.push(style === '热烈喜庆' ? 'festive' : style);
      keywords.push(visualElement);
    }
    
    // IP角色设计
    else if (presetId === 'ip-character') {
      const artStyle = variables.art_style || '泡泡玛特风';
      const renderStyle = variables.render_style || '3D渲染';
      
      const artStyleKeywords = {
        '泡泡玛特风': ['pop mart style', 'designer toy', 'vinyl figure', 'collectible'],
        '迪士尼风': ['disney style', 'cute character', 'animated', 'family-friendly'],
        '日系动漫': ['anime style', 'manga character', 'kawaii', 'chibi'],
        '美式卡通': ['cartoon style', 'western animation', 'bold lines'],
        '国潮风': ['chinese style', 'traditional elements', 'oriental'],
        '赛博机械': ['cyberpunk', 'mecha', 'futuristic', 'tech'],
        '毛绒质感': ['plush toy', 'fluffy', 'soft texture', 'cuddly'],
        '像素风': ['pixel art', '8-bit', 'retro game', 'nostalgic']
      };
      
      keywords.push(...(artStyleKeywords[artStyle] || []));
      keywords.push(renderStyle === '3D渲染' ? '3D render, octane render, C4D' : renderStyle);
    }
    
    // UI界面设计
    else if (presetId === 'ui-design') {
      const appType = variables.app_type || '移动App';
      const designStyle = variables.design_style || '简约现代';
      
      const appTypeKeywords = {
        '移动App': ['mobile app UI', 'iOS design', 'Android interface'],
        'Web应用': ['web application', 'responsive design', 'SaaS interface'],
        '仪表盘': ['dashboard UI', 'data visualization', 'admin panel'],
        '电商平台': ['e-commerce UI', 'shopping interface', 'product listing'],
        '社交应用': ['social app', 'feed design', 'chat interface'],
        '工具软件': ['utility app', 'productivity interface', 'tool design']
      };
      
      const styleKeywords = {
        '简约现代': ['minimalist', 'clean UI', 'modern design'],
        '扁平化': ['flat design', 'material design', 'simple shapes'],
        '拟物化': ['skeuomorphic', 'realistic textures', '3D elements'],
        '玻璃态': ['glassmorphism', 'frosted glass', 'blur effects'],
        '新拟物': ['neumorphism', 'soft shadows', 'subtle depth'],
        '暗黑模式': ['dark mode', 'night theme', 'high contrast']
      };
      
      keywords.push(...(appTypeKeywords[appType] || []));
      keywords.push(...(styleKeywords[designStyle] || []));
      keywords.push('UI/UX design', 'interface mockup');
    }
    
    // 图标设计
    else if (presetId === 'icon-design') {
      const iconStyle = variables.icon_style || '线性图标';
      const useCase = variables.use_case || '应用图标';
      
      const styleKeywords = {
        '线性图标': ['line icon', 'outline style', 'stroke-based'],
        '填充图标': ['filled icon', 'solid style', 'glyph'],
        '双色图标': ['duotone icon', 'two-color', 'bicolor'],
        '3D图标': ['3D icon', 'dimensional', 'isometric'],
        '手绘风': ['hand-drawn icon', 'sketch style', 'organic'],
        '像素图标': ['pixel icon', '8-bit style', 'retro']
      };
      
      keywords.push(...(styleKeywords[iconStyle] || []));
      keywords.push('icon design', 'iconography', useCase);
    }
    
    // 商业插画
    else if (presetId === 'commercial-illustration') {
      const artStyle = variables.art_style || '扁平插画';
      const purpose = variables.purpose || '广告宣传';
      
      const styleKeywords = {
        '扁平插画': ['flat illustration', 'vector art', 'geometric shapes'],
        '渐变风': ['gradient illustration', 'colorful blend', 'smooth transitions'],
        '线描插画': ['line art', 'linework illustration', 'outline drawing'],
        '纹理插画': ['textured illustration', 'grain texture', 'retro feel'],
        '立体插画': ['3D illustration', 'isometric', 'dimensional'],
        '手绘水彩': ['watercolor illustration', 'hand-painted', 'artistic']
      };
      
      keywords.push(...(styleKeywords[artStyle] || []));
      keywords.push('commercial illustration', 'professional artwork', purpose);
    }
    
    // 儿童插画
    else if (presetId === 'children-illustration') {
      const ageGroup = variables.age_group || '3-6岁';
      const artStyle = variables.art_style || '圆润可爱';
      
      const styleKeywords = {
        '圆润可爱': ['cute illustration', 'rounded shapes', 'adorable'],
        '梦幻童话': ['fairy tale', 'magical', 'enchanted', 'whimsical'],
        '教育绘本': ['educational', 'picture book', 'learning illustration'],
        '卡通动画': ['cartoon style', 'animated look', 'playful'],
        '手绘蜡笔': ['crayon style', 'hand-drawn', 'childlike'],
        '剪纸拼贴': ['paper cut', 'collage style', 'layered']
      };
      
      keywords.push(...(styleKeywords[artStyle] || []));
      keywords.push('children illustration', 'kids artwork', 'child-friendly');
    }
    
    // 概念艺术
    else if (presetId === 'concept-art') {
      const category = variables.category || '场景概念';
      const artStyle = variables.art_style || '写实风格';
      
      const categoryKeywords = {
        '场景概念': ['environment concept', 'landscape design', 'world building'],
        '角色概念': ['character concept', 'character design', 'figure study'],
        '道具概念': ['prop design', 'item concept', 'equipment design'],
        '载具概念': ['vehicle concept', 'transportation design', 'mech design'],
        '建筑概念': ['architecture concept', 'structure design', 'building design'],
        '生物概念': ['creature design', 'monster concept', 'alien design']
      };
      
      keywords.push(...(categoryKeywords[category] || []));
      keywords.push('concept art', 'digital painting', 'entertainment design');
    }
    
    // 社交媒体配图
    else if (presetId === 'social-media-image') {
      const platform = variables.platform || '微信公众号';
      const contentType = variables.content_type || '文章封面';
      
      const platformKeywords = {
        '微信公众号': ['wechat', 'official account', 'article cover'],
        '小红书': ['xiaohongshu', 'lifestyle', 'aesthetic'],
        '微博': ['weibo', 'social post', 'trending'],
        '抖音': ['douyin', 'short video', 'viral content'],
        'Instagram': ['instagram', 'IG post', 'visual feed'],
        'Twitter/X': ['twitter', 'social media', 'tweet image']
      };
      
      keywords.push(...(platformKeywords[platform] || []));
      keywords.push('social media design', 'digital content', contentType);
    }
    
    // 电商产品主图
    else if (presetId === 'ecommerce-product') {
      const productCategory = variables.product_category || '数码3C';
      const shootingStyle = variables.shooting_style || '纯净背景';
      
      const styleKeywords = {
        '纯净背景': ['clean background', 'white background', 'minimalist product'],
        '场景化': ['lifestyle shot', 'in-context', 'environmental'],
        '悬浮创意': ['floating product', 'creative shot', 'dynamic'],
        '微距特写': ['macro shot', 'detail close-up', 'texture focus'],
        '多角度展示': ['multi-angle', 'product views', '360 display'],
        '拆解展示': ['exploded view', 'component display', 'technical']
      };
      
      keywords.push(...(styleKeywords[shootingStyle] || []));
      keywords.push('product photography', 'e-commerce image', 'commercial product');
    }
    
    // 名片设计
    else if (presetId === 'business-card') {
      const industry = variables.industry || '科技互联网';
      const designStyle = variables.design_style || '简约现代';
      
      const styleKeywords = {
        '简约现代': ['minimalist', 'modern', 'clean design'],
        '商务经典': ['business classic', 'professional', 'corporate'],
        '创意艺术': ['creative', 'artistic', 'unique design'],
        '科技未来': ['tech style', 'futuristic', 'innovative'],
        '自然有机': ['organic', 'natural', 'eco-friendly'],
        '复古怀旧': ['vintage', 'retro', 'classic style']
      };
      
      keywords.push(...(styleKeywords[designStyle] || []));
      keywords.push('business card design', 'name card', 'corporate identity');
    }
    
    // 活动海报
    else if (presetId === 'event-poster') {
      const eventType = variables.event_type || '音乐节';
      const visualStyle = variables.visual_style || '炫酷动感';
      
      const eventKeywords = {
        '音乐节': ['music festival', 'concert poster', 'live event'],
        '展览艺术': ['exhibition', 'art show', 'gallery event'],
        '体育赛事': ['sports event', 'competition', 'athletic'],
        '商业发布': ['product launch', 'press event', 'business conference'],
        '节日庆典': ['festival', 'celebration', 'holiday event'],
        '教育讲座': ['seminar', 'workshop', 'educational event']
      };
      
      const styleKeywords = {
        '炫酷动感': ['dynamic', 'energetic', 'vibrant'],
        '优雅简约': ['elegant', 'minimal', 'sophisticated'],
        '复古怀旧': ['vintage', 'retro', 'nostalgic'],
        '科幻未来': ['futuristic', 'sci-fi', 'high-tech'],
        '自然清新': ['fresh', 'natural', 'organic'],
        '艺术抽象': ['abstract', 'artistic', 'avant-garde']
      };
      
      keywords.push(...(eventKeywords[eventType] || []));
      keywords.push(...(styleKeywords[visualStyle] || []));
      keywords.push('event poster', 'promotional design');
    }
    
    // 书籍封面设计
    else if (presetId === 'book-cover') {
      const genre = variables.genre || '文学小说';
      const designStyle = variables.design_style || '艺术创意';
      
      const genreKeywords = {
        '文学小说': ['literary fiction', 'novel cover', 'storytelling'],
        '商业管理': ['business book', 'management', 'professional'],
        '科幻奇幻': ['sci-fi', 'fantasy', 'speculative fiction'],
        '历史传记': ['biography', 'historical', 'memoir'],
        '儿童绘本': ['children book', 'picture book', 'illustrated'],
        '艺术摄影': ['art book', 'photography', 'visual arts']
      };
      
      const styleKeywords = {
        '艺术创意': ['artistic', 'creative design', 'unique'],
        '简约文艺': ['minimalist', 'literary', 'elegant'],
        '插画故事': ['illustrated', 'narrative art', 'story-driven'],
        '摄影写实': ['photographic', 'realistic', 'documentary'],
        '抽象概念': ['abstract', 'conceptual', 'symbolic'],
        '复古经典': ['vintage', 'classic', 'timeless']
      };
      
      keywords.push(...(genreKeywords[genre] || []));
      keywords.push(...(styleKeywords[designStyle] || []));
      keywords.push('book cover design', 'publishing design');
    }
    
    if (keywords.length === 0) return null;
    return keywords.join('、');
  }

  // 辅助方法
  _getPosterContext(posterType) {
    const contexts = {
      '主图直通车': '搜索结果页与用户第一接触，必须在众多商品中脱颖而出',
      '详情页海报': '商品详情页引导转化，需要承上启下传递关键信息',
      '店铺首页Banner': '店铺首页展示品牌形象和主推活动',
      '活动会场图': '大促会场页面中与其他品牌竞争注意力',
      '社交分享图': '社交平台传播，需要具有转发欲望',
      '直播封面': '直播间入口吸引用户进入观看'
    };
    return contexts[posterType] || contexts['主图直通车'];
  }

  _getPosterTaskContext(posterType) {
    const tasks = {
      '主图直通车': '瞬间抓住用户眼球，提升点击率',
      '详情页海报': '引导用户继续浏览，强化购买决策',
      '店铺首页Banner': '建立品牌印象，引导进入活动',
      '活动会场图': '在会场中脱颖而出，获取流量',
      '社交分享图': '激发分享欲望，实现裂变传播',
      '直播封面': '吸引用户进入直播间'
    };
    return tasks[posterType] || tasks['主图直通车'];
  }

  _getIPTypeContext(ipType) {
    const contexts = {
      '品牌吉祥物': '品牌人格化表达和情感连接的能力',
      '盲盒潮玩': '收藏价值和系列化延展潜力',
      '虚拟偶像': '强烈的人格魅力和粉丝互动能力',
      '表情包形象': '高传播度和情绪表达的多样性',
      '游戏角色': '世界观适配性和玩家认同感',
      '绘本角色': '故事感和儿童亲和力'
    };
    return contexts[ipType] || contexts['盲盒潮玩'];
  }

  _getPriceRangeContext(priceRange) {
    const contexts = {
      '经济型': '成本控制优先，简洁实用',
      '中端': '性价比与品质感的平衡',
      '高端': '精致细节和高级质感',
      '奢侈品': '极致工艺和仪式感体验'
    };
    return contexts[priceRange] || contexts['中端'];
  }

  /**
   * 获取所有预置模板列表
   * @param {Object} options - 选项
   * @returns {Array}
   */
  getAll(options = {}) {
    const { category, difficulty, technique, limit, includeTemplate = false } = options;
    let presets = this.data.presets;

    // 按分类筛选
    if (category) {
      presets = presets.filter(p => p.category === category || p.subcategory === category);
    }

    // 按难度筛选
    if (difficulty) {
      presets = presets.filter(p => p.difficulty === difficulty);
    }

    // 按技术筛选
    if (technique) {
      presets = presets.filter(p => p.technique === technique);
    }

    // 限制数量
    if (limit && limit > 0) {
      presets = presets.slice(0, limit);
    }

    // 返回信息（可选择是否包含 template）
    return presets.map(p => {
      const result = {
        id: p.id,
        name: p.name,
        nameEn: p.nameEn,
        category: p.category,
        subcategory: p.subcategory,
        icon: p.icon,
        description: p.description,
        tags: p.tags,
        difficulty: p.difficulty,
        technique: p.technique,
        variableCount: p.template?.variables?.length || 0
      };
      
      // 如果需要包含完整 template
      if (includeTemplate) {
        result.template = p.template;
      }
      
      return result;
    });
  }

  /**
   * 获取预置模板详情
   * @param {string} presetId 
   * @returns {Object|null}
   */
  getById(presetId) {
    return this.data.presets.find(p => p.id === presetId) || null;
  }

  /**
   * 搜索预置模板
   * @param {string} query - 搜索关键词
   * @returns {Array}
   */
  search(query) {
    if (!query) return [];
    
    const normalizedQuery = query.toLowerCase().trim();
    
    return this.data.presets.filter(p => {
      return (
        p.name.toLowerCase().includes(normalizedQuery) ||
        p.nameEn?.toLowerCase().includes(normalizedQuery) ||
        p.description?.toLowerCase().includes(normalizedQuery) ||
        p.tags?.some(tag => tag.toLowerCase().includes(normalizedQuery))
      );
    }).map(p => ({
      id: p.id,
      name: p.name,
      nameEn: p.nameEn,
      category: p.category,
      icon: p.icon,
      description: p.description,
      tags: p.tags,
      difficulty: p.difficulty
    }));
  }

  /**
   * 根据标签筛选
   * @param {string[]} tags 
   * @returns {Array}
   */
  filterByTags(tags) {
    if (!tags || !tags.length) return [];
    
    const normalizedTags = tags.map(t => t.toLowerCase());
    
    return this.data.presets.filter(p => 
      p.tags?.some(tag => normalizedTags.includes(tag.toLowerCase()))
    ).map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      icon: p.icon,
      description: p.description,
      tags: p.tags,
      matchedTags: p.tags.filter(t => normalizedTags.includes(t.toLowerCase()))
    }));
  }

  /**
   * 应用预置模板生成提示词
   * @param {string} presetId - 预置ID
   * @param {Object} variables - 变量值
   * @param {Object} options - 选项
   * @returns {Object}
   */
  apply(presetId, variables = {}, options = {}) {
    const preset = this.getById(presetId);
    if (!preset) {
      throw new Error(`预置模板不存在: ${presetId}`);
    }

    const { format = 'text', language = 'zh-CN' } = options;
    const template = preset.template;

    // 使用构建器创建提示词
    const b = builder().language(language);

    // 应用模板属性
    if (template.role) b.role(template.role);
    if (template.persona) b.persona(template.persona);
    if (template.context) b.context(template.context);
    if (template.task) b.task(template.task);
    if (template.constraints) b.constraints(template.constraints);
    if (template.output) b.output(template.output);

    // 添加变量定义
    if (template.variables) {
      template.variables.forEach(v => {
        b.variable(v.name, {
          required: v.required,
          description: v.description,
          defaultValue: v.defaultValue,
          type: v.type
        });
      });
    }

    // 添加示例
    if (template.examples) {
      b.fewShot(template.examples);
    }

    // 构建提示词
    const result = b.build();

    // 处理变量插值
    let content = result.content;
    
    // 如果提供了变量值，进行插值
    if (Object.keys(variables).length > 0) {
      // 构建变量模板
      const variableSection = this._buildVariableSection(template.variables, variables);
      content = content + '\n\n' + variableSection;
    }

    // 格式化输出
    let formatted;
    switch (format) {
      case 'json':
        formatted = result.toJSON();
        break;
      case 'yaml':
        formatted = result.toYAML();
        break;
      case 'markdown':
        formatted = result.toMarkdown();
        break;
      default:
        formatted = content;
    }

    return {
      presetId: preset.id,
      presetName: preset.name,
      content,
      formatted,
      format,
      variables: this._mergeVariables(template.variables, variables),
      metadata: {
        ...result.metadata,
        preset: {
          id: preset.id,
          name: preset.name,
          category: preset.category,
          difficulty: preset.difficulty
        }
      }
    };
  }

  /**
   * 获取预置模板的变量定义
   * @param {string} presetId 
   * @returns {Array}
   */
  getVariables(presetId) {
    const preset = this.getById(presetId);
    if (!preset) return [];

    const variables = preset.template?.variables || [];
    
    return variables.map(v => ({
      name: v.name,
      type: v.type || 'string',
      required: v.required || false,
      defaultValue: v.defaultValue || '',
      description: v.description || '',
      label: this._formatLabel(v.name),
      inputType: this._getInputType(v.type)
    }));
  }

  /**
   * 验证变量
   * @param {string} presetId 
   * @param {Object} values 
   * @returns {Object}
   */
  validateVariables(presetId, values = {}) {
    const variables = this.getVariables(presetId);
    const missing = [];
    const errors = [];

    variables.forEach(v => {
      const value = values[v.name];
      const hasValue = value !== undefined && value !== '';

      if (v.required && !hasValue) {
        missing.push(v.name);
      }

      // 类型验证
      if (hasValue && v.type === 'number' && isNaN(Number(value))) {
        errors.push({ variable: v.name, error: '必须是数字' });
      }
      if (hasValue && v.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors.push({ variable: v.name, error: '邮箱格式不正确' });
      }
    });

    return {
      valid: missing.length === 0 && errors.length === 0,
      missing,
      errors,
      variables
    };
  }

  /**
   * 获取统计信息
   * @returns {Object}
   */
  getStats() {
    const presets = this.data.presets;
    const categories = new Set();
    const tags = new Set();
    const difficulties = { beginner: 0, intermediate: 0, advanced: 0 };

    presets.forEach(p => {
      categories.add(p.category);
      p.tags?.forEach(t => tags.add(t));
      if (p.difficulty && difficulties[p.difficulty] !== undefined) {
        difficulties[p.difficulty]++;
      }
    });

    return {
      totalPresets: presets.length,
      categoryCount: categories.size,
      tagCount: tags.size,
      byDifficulty: difficulties,
      version: this.data.version,
      lastUpdated: this.data.lastUpdated
    };
  }

  /**
   * 获取热门/推荐预置
   * @param {number} limit 
   * @returns {Array}
   */
  getRecommended(limit = 5) {
    // 简单实现：返回前N个预置作为推荐
    // 实际可以基于使用频率、评分等进行排序
    return this.getAll({ limit });
  }

  /**
   * 构建变量部分
   * @private
   */
  _buildVariableSection(variableDefinitions, values) {
    if (!variableDefinitions || !values) return '';

    const parts = [];
    
    variableDefinitions.forEach(v => {
      const value = values[v.name];
      if (value !== undefined && value !== '') {
        const label = v.description || this._formatLabel(v.name);
        parts.push(`【${label}】\n${value}`);
      }
    });

    return parts.join('\n\n');
  }

  /**
   * 合并变量定义和值
   * @private
   */
  _mergeVariables(definitions, values) {
    if (!definitions) return [];

    return definitions.map(v => ({
      name: v.name,
      description: v.description,
      type: v.type,
      required: v.required,
      defaultValue: v.defaultValue,
      value: values[v.name] !== undefined ? values[v.name] : v.defaultValue
    }));
  }

  /**
   * 格式化标签名
   * @private
   */
  _formatLabel(name) {
    return name
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  /**
   * 获取输入类型
   * @private
   */
  _getInputType(type) {
    const typeMap = {
      'string': 'text',
      'text': 'textarea',
      'number': 'number',
      'email': 'email',
      'url': 'url',
      'date': 'date',
      'boolean': 'checkbox'
    };
    return typeMap[type] || 'text';
  }
}

// 单例实例
let instance = null;

/**
 * 获取 PresetService 单例
 * @returns {PresetService}
 */
function getPresetService() {
  if (!instance) {
    instance = new PresetService();
  }
  return instance;
}

module.exports = {
  PresetService,
  getPresetService
};
