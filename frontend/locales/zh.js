/**
 * PromptAtelier - 中文语言包
 * @version 6.0.0 - Phase A i18n 基建
 */
window.i18nData = window.i18nData || {};
window.i18nData.zh = {
  // === 品牌 ===
  brand: {
    name: 'PromptAtelier',
    slogan: '专业设计提示词工作台',
    version: 'v6.0.0'
  },

  // === 侧边栏导航 ===
  nav: {
    design: '设计助手',
    skills: '专业技能',
    dynamic: '动态设计',
    ai: 'AI 管理',
    settings: '设置',
    history: '历史记录',
    favorites: '收藏夹',
    theme: '切换主题',
    language: '切换语言',
    aiReady: '本地 AI 就绪',
    aiNotReady: '本地 AI 未就绪'
  },

  // === 通用操作 ===
  actions: {
    generate: '生成专业提示词',
    generating: '生成中...',
    copy: '复制',
    copyPrompt: '复制提示词',
    clear: '清空',
    favorite: '收藏',
    favorited: '已收藏',
    delete: '删除',
    cancel: '取消',
    save: '保存',
    close: '关闭',
    search: '搜索',
    refresh: '刷新',
    export: '导出',
    import: '导入',
    apply: '应用',
    confirm: '确认',
    back: '返回',
    viewAll: '查看全部',
    manage: '管理',
    create: '创建',
    edit: '编辑',
    view: '查看',
    download: '下载',
    upload: '上传',
    load: '加载',
    unload: '卸载',
    test: '测试',
    reset: '重置',
    regenerate: '重新生成',
    copied: '已复制到剪贴板'
  },

  // === 设计助手 Tab ===
  design: {
    title: '专业设计提示词助手',
    subtitle: '选择设计类型，输入您的想法，AI 为您生成专业的绘图提示词',
    selectType: '选择设计类型',
    fillInfo: '填写设计信息',
    result: '生成结果',
    additionalInput: '补充说明（可选）',
    additionalPlaceholder: '任何额外的设计要求或灵感描述...',
    styleReference: '风格参考（可选）',
    styleReferenceAlt: '选择收藏的提示词作为风格参考',
    selectReference: '从收藏中选择参考风格...',
    referenceFound: '已找到 {count} 个同类型收藏可作为参考',
    referenceSelected: 'AI 将学习此风格生成相似的提示词',
    noReference: '暂无同类型的收藏',
    noReferenceTip: '生成满意的提示词后，点击「⭐ 收藏」可在下次作为参考',
    compression: '压缩',
    compressionOn: '已开启',
    compressionTip: '为 token 限制小的模型（如 2K）压缩提示词',
    compressed: '提示词已压缩',
    finalPrompt: '最终图像提示词',
    finalPromptTip: '可直接用于 Midjourney/DALL-E/SD',
    structuredPrompt: '查看结构化提示词（中文版，用于理解）',
    matchedSkills: '应用的专业技能',
    matchedSkillsTip: '根据您的输入自动匹配了相关专业技能，提供更专业的设计指导',
    keywords: '推荐关键词',
    tips: '输出建议',
    emptyResult: '填写左侧信息后点击生成',
    loadingPresets: '加载设计模板中...',
    generateDynamic: '生成动态设计',
    noApiWarning: '未配置 AI API 且未启用本地模型，无法生成专业图像提示词。请在设置中配置 API 或在离线模式中启用本地模型优先。',
    returnToTypes: '返回选择设计类型'
  },

  // === 专业技能 Tab ===
  skills: {
    title: '专业技能库',
    subtitle: 'AI Agent Skills - 为设计任务提供专业知识支持',
    totalSkills: '总技能数',
    enabled: '已启用',
    totalTriggers: '触发词总数',
    createNew: '创建新 Skill',
    importJson: '导入 JSON',
    rescan: '重新扫描',
    searchPlaceholder: '搜索技能...',
    triggers: '触发词',
    tags: '标签',
    emptyState: '还没有任何专业技能',
    createFirst: '创建第一个 Skill',
    // 详情
    version: '版本',
    author: '作者',
    instructions: 'Skill 指令内容',
    references: '参考文档',
    assets: '资源文件',
    noReferences: '暂无参考文档',
    noAssets: '暂无资源文件',
    enableSkill: '启用此 Skill',
    disableSkill: '禁用此 Skill',
    // 创建/编辑
    skillId: 'Skill ID',
    skillIdHint: '只能使用小写字母、数字和连字符',
    skillName: '名称',
    description: '描述',
    triggersLabel: '触发词（逗号分隔）',
    triggersHint: '当用户输入包含这些词时会自动匹配此 Skill',
    tagsLabel: '标签（逗号分隔）',
    instructionsLabel: 'Skill 指令内容（Markdown）',
    // 删除
    deleteConfirm: '确认删除',
    deleteWarning: '此操作不可撤销，相关的 SKILL.md 文件和目录都将被删除。',
    deleteQuestion: '确定要删除 Skill "{name}" 吗？'
  },

  // === 动态设计 Tab ===
  dynamic: {
    title: '动态设计工作台',
    subtitle: '输入设计信息，AI 将生成可交互的 HTML/CSS/SVG 动态效果',
    useCustomApi: '使用独立 AI 模型',
    customLabel: '独立',
    globalLabel: '跟随全局',
    notConfigured: '未配置',
    apiTip: '动态设计需要生成代码，建议使用擅长编码的模型（如 GPT-4o、Claude、DeepSeek-Coder）',
    expandConfig: '展开配置',
    collapseConfig: '收起',
    saveConfig: '保存配置',
    fromAssistant: '来自设计助手',
    clearAssistant: '清除',
    // 输入字段
    designType: '设计类型',
    brandName: '品牌/标题名称',
    brandPlaceholder: '例如: TechFlow、618大促',
    slogan: '标语/口号 (可选)',
    sloganPlaceholder: '例如: Innovation Starts Here',
    style: '设计风格',
    stylePlaceholder: '例如: 科技感、极简、渐变',
    colors: '颜色方案 (可选)',
    colorsPlaceholder: '例如: #6366F1, #06B6D4 或 蓝紫渐变',
    extraDesc: '补充描述 (可选)',
    extraPlaceholder: '任何额外的设计要求',
    // 动画
    animationEffects: '动画效果',
    duration: '时长',
    easing: '缓动',
    loop: '循环',
    generateBtn: '生成动态设计',
    generatingBtn: 'AI 正在创作...',
    // 预览
    preview: '实时预览',
    refreshPreview: '刷新预览',
    fullscreen: '全屏',
    codeEditor: '代码编辑',
    applyCode: '应用',
    applyCodeHint: 'Ctrl+Enter 应用修改',
    // 导出
    exportHtml: '导出 HTML',
    copyCode: '复制代码',
    exportGif: '导出 GIF',
    exportVideo: '导出视频',
    iterateInstruction: '输入修改指令，如：加大字体、改为红色',
    iterate: '迭代修改',
    // 动画效果名
    effects: {
      fadeIn: '渐显',
      bounce: '弹跳',
      rotate: '旋转',
      strokeDraw: '描边',
      glow: '发光',
      pulse: '脉冲',
      slideIn: '滑入',
      typewriter: '打字机'
    }
  },

  // === AI 管理 Tab ===
  ai: {
    title: 'AI 管理中心',
    subtitle: '管理本地模型、安全审查和离线模式',
    // 模型管理
    localModels: '本地模型',
    scan: '扫描',
    modelDir: '模型目录',
    modelDirTip: '手动下载的 .gguf 文件放入该目录后点击"扫描"即可识别。',
    importModel: '手动导入模型文件',
    importPathHint: '模型文件的完整路径（.gguf 格式）',
    importPathPlaceholder: '例如: D:\\Downloads\\qwen3-0.6b-q4_k_m.gguf',
    importAsQwen: '导入为 Qwen3 模型',
    qwenModel: 'Qwen3-0.6B',
    qwenDesc: '文本生成 · GGUF',
    toxicModel: 'Tiny-Toxic-Detector',
    toxicDesc: '毒性分类 · ONNX',
    // 模型状态
    status: {
      not_downloaded: '未下载',
      downloading: '下载中',
      downloaded: '已下载',
      loading: '加载中',
      ready: '就绪',
      error: '错误',
      unloading: '卸载中',
      unknown: '未知'
    },
    // 内存
    memory: '内存使用',
    rssMemory: 'RSS 内存',
    heapMemory: '堆内存',
    loadedModels: '已加载模型',
    systemFree: '系统可用',
    // 推理测试
    inferTest: '推理测试',
    testInputPlaceholder: '输入测试文本...',
    generateTest: '生成测试',
    classifyTest: '分类测试',
    // 安全审查
    safety: '安全审查',
    safetyDesc: '三层审查链：关键词过滤 → AI 毒性分类 → 语义审查',
    safetyWhitelist: '设计安全词白名单',
    safetyStats: '审查统计',
    totalChecks: '总检查',
    passed: '通过',
    blocked: '拦截',
    resetStats: '重置统计',
    manualTest: '手动测试',
    testSafetyPlaceholder: '输入文本测试安全审查...',
    testSafety: '审查测试',
    safe: '安全',
    unsafe: '不安全',
    confidence: '置信度',
    labelField: '标签',
    riskLevel: '风险',
    triggerFlags: '触发标记',
    // 离线模式
    offline: '离线模式',
    offlineReady: '本地 AI 模型已就绪，可离线使用',
    offlineNotReady: '本地 AI 模型未就绪，需先下载并加载模型',
    preferLocal: '优先使用本地模型',
    preferLocalDesc: '开启后，提示词优化将优先使用本地 Qwen3-0.6B 模型，不调用外部 API',
    fallbackStrategy: '降级策略',
    localPrimary: '本地模型（优先）',
    apiPrimary: '外部 API（优先）',
    localFallback: '本地模型（降级）',
    apiFallback: '外部 API（降级）',
    ruleEngine: '规则引擎（最终兜底）',
    // 系统信息
    systemInfo: '系统信息',
    sysVersion: '版本',
    sysRuntime: '运行时',
    sysPlatform: '平台',
    sysGenModel: '生成模型',
    sysClassModel: '分类模型'
  },

  // === 设置面板 ===
  settings: {
    title: 'API 设置',
    selectProvider: '选择服务商',
    getApiKey: '获取 API Key →',
    selectModelPlaceholder: '请选择模型',
    apiUrl: 'API 地址',
    apiUrlHint: 'OpenAI 兼容格式',
    apiKey: 'API 密钥',
    apiKeyLocal: '本地服务可留空',
    selectModel: '选择模型',
    refreshList: '刷新列表',
    loading: '加载中...',
    modelManual: '输入模型名称或点击刷新',
    modelTip: '点击刷新按钮自动获取可用模型，或手动输入模型名称',
    // 优化设置
    optimization: '小模型优化',
    preferLocalToggle: '优先使用本地模型',
    preferLocalDesc: '开启后优先使用 Qwen3-0.6B，API 失败时自动降级',
    enableCompression: '启用提示词压缩',
    compressionDesc: '适用于 token 限制较小的模型（如 2K）',
    compressionLevel: '压缩等级',
    compressionSimple: '精简模式 - 移除示例，保留核心指令',
    compressionUltra: '超轻量模式 - 极度精简，适合 2K 限制',
    compressionWarning: '超轻量模式会移除大部分专业指导，可能影响输出质量',
    showTokenEstimate: '在生成时显示 Token 估算',
    saveSettings: '保存设置'
  },

  // === 历史记录 ===
  history: {
    title: '历史记录',
    empty: '暂无历史记录',
    clearAll: '清空',
    clearConfirm: '确定要清空所有历史记录吗？此操作不可恢复！',
    unnamed: '未命名'
  },

  // === 收藏 ===
  favorites: {
    title: '我的收藏',
    empty: '暂无收藏',
    manage: '管理收藏',
    addTitle: '收藏提示词',
    nameLabel: '收藏名称',
    namePlaceholder: '给这个提示词起个名字',
    category: '分类',
    type: '类型',
    tagsLabel: '标签',
    tagPlaceholder: '输入标签后按回车',
    addTag: '添加',
    notes: '备注',
    notesPlaceholder: '添加备注（可选）',
    rating: '评分',
    promptPreview: '提示词预览',
    saveFavorite: '保存收藏'
  },

  // === 时间格式 ===
  time: {
    justNow: '刚刚',
    minutesAgo: '{n} 分钟前',
    hoursAgo: '{n} 小时前',
    daysAgo: '{n} 天前'
  },

  // === 通用提示 ===
  messages: {
    settingsSaved: '设置已保存',
    loadFailed: '加载失败',
    saveFailed: '保存失败',
    deleteFailed: '删除失败',
    operationFailed: '操作失败',
    networkError: '网络错误',
    confirmDelete: '确定要删除吗？'
  },

  // === 预设/模板弹窗 ===
  presets: {
    templatePreview: '模板结构预览',
    role: '角色',
    context: '上下文',
    task: '任务',
    constraints: '约束条件',
    outputFormat: '输出格式',
    fillVariables: '填写变量',
    required: '必填',
    pleaseSelect: '请选择',
    generatedResult: '生成结果',
    applyTemplate: '应用模板',
    copyResult: '复制结果'
  },

  // === 动态设计类型选项 ===
  dynamicTypes: {
    logoDesign: '🎨 Logo 设计',
    iconDesign: '🔷 图标设计',
    promoPoster: '📢 促销海报',
    socialMedia: '📱 社媒配图',
    eventPoster: '🎉 活动海报',
    adCreative: '📺 广告创意'
  },

  // === 动态设计动画选项 ===
  animOptions: {
    fast: '0.5s 快速',
    standard: '1s 标准',
    moderate: '2s 适中',
    slow: '3s 缓慢',
    verySlow: '5s 很慢',
    easeDefault: 'Ease 默认',
    easeInOut: 'Ease In-Out',
    linear: 'Linear 线性',
    back: 'Back 回弹',
    once: '1 次',
    threeTimes: '3 次',
    infinite: '无限循环',
    selectModel: '请选择模型',
    inputModelOrRefresh: '输入模型名或点击刷新'
  },

  // === 设置弹窗补充 ===
  settingsExtra: {
    getApiKey: '获取 API Key →',
    localCanEmpty: '本地服务可留空',
    modelHint: '点击刷新按钮自动获取可用模型，或手动输入模型名称',
    compressionSimple: '📄 精简模式 - 移除示例，保留核心指令',
    compressionUltra: '⚡ 超轻量模式 - 极度精简，适合 2K 限制',
    compressionWarning: '超轻量模式会移除大部分专业指导，可能影响输出质量',
    showTokenEstimate: '在生成时显示 Token 估算',
    immutable: '不可修改'
  }
};
