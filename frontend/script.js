/**
 * PromptCraft - 专业设计提示词工作台
 * @version 4.2.0 - Phase 9 API 统一化
 */

const API_BASE = '/api/prompts';

// 🔥 Phase 9: 服务商预设配置
const API_PROVIDERS = {
  local: {
    icon: '🏠',
    name: '本地服务',
    description: 'Ollama / LM Studio / LocalAI / GenAPI 等本地服务',
    baseUrl: 'http://localhost:11434/v1',
    requiresKey: false,
    defaultModel: ''
  },
  groq: {
    icon: '⚡',
    name: 'Groq',
    description: '免费额度大，推理速度极快',
    baseUrl: 'https://api.groq.com/openai/v1',
    requiresKey: true,
    defaultModel: 'llama-3.3-70b-versatile',
    signupUrl: 'https://console.groq.com'
  },
  deepseek: {
    icon: '🔍',
    name: 'DeepSeek',
    description: '国产大模型，价格便宜',
    baseUrl: 'https://api.deepseek.com/v1',
    requiresKey: true,
    defaultModel: 'deepseek-chat',
    signupUrl: 'https://platform.deepseek.com'
  },
  siliconflow: {
    icon: '🌊',
    name: '硅基流动',
    description: '国内服务，有免费模型',
    baseUrl: 'https://api.siliconflow.cn/v1',
    requiresKey: true,
    defaultModel: 'Qwen/Qwen2.5-7B-Instruct',
    signupUrl: 'https://siliconflow.cn'
  },
  openrouter: {
    icon: '🔗',
    name: 'OpenRouter',
    description: '聚合多家模型，有免费额度',
    baseUrl: 'https://openrouter.ai/api/v1',
    requiresKey: true,
    defaultModel: 'meta-llama/llama-3.2-3b-instruct:free',
    signupUrl: 'https://openrouter.ai'
  },
  openai: {
    icon: '🤖',
    name: 'OpenAI',
    description: 'GPT-4o / GPT-4 / GPT-3.5',
    baseUrl: 'https://api.openai.com/v1',
    requiresKey: true,
    defaultModel: 'gpt-4o-mini',
    signupUrl: 'https://platform.openai.com'
  }
};

function promptCraftApp() {
  return {
    activeTab: 'design',
    theme: 'light',
    showSettings: false,
    
    toast: { show: false, message: '', type: 'info' },

    // 🔥 Phase 9: 新的统一设置结构
    // 🔥 Phase 11: 添加压缩设置
    settings: {
      provider: 'local',
      baseUrl: 'http://localhost:11434/v1',
      apiKey: '',
      model: '',
      // 压缩设置
      enableCompression: false,
      compressionLevel: 1,  // 1=精简, 2=超轻量
      showTokenEstimate: true
    },

    // Token 估算相关
    tokenEstimate: {
      original: 0,
      compressed: 0,
      saved: 0,
      ratio: 0
    },
    
    // 服务商预设 (引用全局常量)
    apiProviders: API_PROVIDERS,
    
    // 可用模型列表
    availableModels: [],
    modelsLoading: false,

    // 🔥 Phase 10: 历史记录和收藏
    historyDropdownOpen: false,
    favoritesDropdownOpen: false,
    showHistoryModal: false,
    showFavoritesModal: false,
    showFavoriteModal: false,
    historyRecords: [],
    favoriteItems: [],
    historyFilter: '',
    favoritesFilter: '',
    historyCount: 0,
    favoritesCount: 0,
    currentHistoryRecord: null,  // 当前生成的记录
    selectedReference: null,     // 选中的风格参考
    availableReferences: [],     // 当前设计类型的可用参考列表
    favoriteForm: {
      name: '',
      prompt: '',
      category: 'image',
      subcategory: 'logo-design',
      parameters: {},
      tags: [],
      notes: '',
      rating: 5,
      historyId: null
    },
    newTag: '',

    // 🔥 计算属性：可用于参考的收藏（按当前设计类型筛选）
    get referenceableFavorites() {
      if (!this.selectedDesignPreset) return [];
      const subcategory = this.selectedDesignPreset.id;
      return this.favoriteItems.filter(f => f.subcategory === subcategory);
    },

    // Design Assistant
    designPresets: [],
    selectedDesignPreset: null,
    designVariables: {},
    designAdditionalInput: '',
    designResult: null,
    designLoading: false,

    // Skills Tab
    skills: [],
    skillSearch: '',
    skillsLoading: false,
    selectedSkill: null,
    showCreateSkillModal: false,
    skillToDelete: null,
    editingSkill: null,
    newSkill: {
      id: '',
      name: '',
      description: '',
      triggersText: '',
      tagsText: '',
      instructions: ''
    },

    // 🎬 Dynamic Design Tab (Phase 13)
    dynamicParams: {
      designType: 'logo-design',
      brandName: '',
      slogan: '',
      style: '',
      colors: '',
      description: '',
      animation: {
        effects: ['fadeIn'],
        duration: '2s',
        easing: 'ease-in-out',
        loop: 'infinite'
      }
    },
    dynamicCode: '',          // 生成的 HTML 代码
    dynamicCodeEdit: '',      // 编辑区代码
    dynamicLoading: false,
    dynamicIterating: false,
    dynamicIterateInstruction: '',
    dynamicFullscreen: false,
    dynamicSafetyWarnings: [],
    dynamicDesignFromAssistant: false,  // 是否来自设计助手
    dynamicAssistantSummary: '',        // 设计助手参数摘要
    dynamicAnimationEffects: {
      fadeIn: { name: '渐显' },
      bounce: { name: '弹跳' },
      rotate: { name: '旋转' },
      strokeDraw: { name: '描边' },
      glow: { name: '发光' },
      pulse: { name: '脉冲' },
      slideIn: { name: '滑入' },
      typewriter: { name: '打字机' }
    },
    // 支持动态设计的角色 ID
    DYNAMIC_DESIGN_PRESETS: [
      'logo-design', 'icon-design', 'promo-poster',
      'social-media-graphic', 'event-poster', 'ad-creative',
      'brand-poster', 'business-card', 'book-cover'
    ],

    // 🎬 Phase 13.1: 动态设计独立 API 配置
    dynamicUseCustomConfig: false,  // 是否使用独立配置
    dynamicConfig: {
      provider: 'local',
      baseUrl: 'http://localhost:11434/v1',
      apiKey: '',
      model: ''
    },
    dynamicAvailableModels: [],   // 独立模型列表
    dynamicModelsLoading: false,  // 模型列表加载状态
    dynamicExporting: false,      // 导出 GIF/视频加载状态（通用）
    gifExporting: false,           // GIF 导出加载状态
    videoExporting: false,         // 视频导出加载状态
    showDynamicConfigPanel: false, // 折叠面板显示状态

    // Computed: filtered skills
    get filteredSkills() {
      if (!this.skillSearch) return this.skills;
      const search = this.skillSearch.toLowerCase();
      return this.skills.filter(s => 
        s.name?.toLowerCase().includes(search) ||
        s.description?.toLowerCase().includes(search) ||
        s.triggers?.some(t => t.toLowerCase().includes(search)) ||
        s.tags?.some(t => t.toLowerCase().includes(search))
      );
    },

    init() {
      this.loadTheme();
      this.loadSettings();
      this.loadDynamicDesignConfig();  // 🎬 加载动态设计独立配置
      this.loadDesignPresets();
      this.loadSkills();
      this.loadHistoryStats();
      this.loadFavoritesStats();
    },

    loadTheme() {
      const savedTheme = localStorage.getItem('promptcraft_theme') || 'light';
      this.theme = savedTheme;
      document.documentElement.setAttribute('data-theme', savedTheme);
    },

    toggleTheme() {
      this.theme = this.theme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', this.theme);
      localStorage.setItem('promptcraft_theme', this.theme);
    },

    loadSettings() {
      const saved = localStorage.getItem('promptcraft_settings');
      if (saved) {
        try {
          this.settings = { ...this.settings, ...JSON.parse(saved) };
        } catch (e) {
          console.error('Failed to load settings:', e);
        }
      }
    },

    saveSettings() {
      localStorage.setItem('promptcraft_settings', JSON.stringify(this.settings));
      this.showToast('设置已保存', 'success');
      this.showSettings = false;
    },

    // 🎬 Phase 13.1: 动态设计独立配置管理
    loadDynamicDesignConfig() {
      const saved = localStorage.getItem('promptcraft_dynamic_config');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          this.dynamicUseCustomConfig = parsed.enabled || false;
          this.dynamicConfig = { ...this.dynamicConfig, ...parsed.config };
        } catch (e) {
          console.error('Failed to load dynamic design config:', e);
        }
      }
    },

    saveDynamicDesignConfig() {
      localStorage.setItem('promptcraft_dynamic_config', JSON.stringify({
        enabled: this.dynamicUseCustomConfig,
        config: this.dynamicConfig
      }));
      this.showToast('动态设计 API 配置已保存', 'success');
    },

    /**
     * 获取动态设计实际使用的 API 配置
     * 如果启用了独立配置就用独立的，否则用全局的
     */
    getDynamicDesignApiConfig() {
      if (this.dynamicUseCustomConfig && this.dynamicConfig.baseUrl && this.dynamicConfig.model) {
        return {
          baseUrl: this.dynamicConfig.baseUrl,
          apiKey: this.dynamicConfig.apiKey,
          model: this.dynamicConfig.model
        };
      }
      return {
        baseUrl: this.settings.baseUrl,
        apiKey: this.settings.apiKey,
        model: this.settings.model
      };
    },

    /**
     * 选择动态设计独立服务商
     */
    selectDynamicProvider(providerKey) {
      const provider = this.apiProviders[providerKey];
      if (provider) {
        this.dynamicConfig.provider = providerKey;
        this.dynamicConfig.baseUrl = provider.baseUrl;
        this.dynamicConfig.model = provider.defaultModel || '';
        this.dynamicAvailableModels = [];
      }
    },

    /**
     * 刷新动态设计独立模型列表
     */
    async refreshDynamicModels() {
      if (!this.dynamicConfig.baseUrl) {
        this.showToast('请先设置 API 地址', 'warning');
        return;
      }
      this.dynamicModelsLoading = true;
      try {
        const response = await fetch(`${API_BASE}/fetch-models`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            baseUrl: this.dynamicConfig.baseUrl,
            apiKey: this.dynamicConfig.apiKey
          })
        });
        const data = await response.json();
        if (data.success && data.models) {
          this.dynamicAvailableModels = data.models;
          if (this.dynamicAvailableModels.length > 0 && !this.dynamicConfig.model) {
            this.dynamicConfig.model = this.dynamicAvailableModels[0].id;
          }
          this.showToast(`获取到 ${data.count || data.models.length} 个模型`, 'success');
        } else {
          this.showToast(data.error || '获取模型列表失败', 'error');
        }
      } catch (e) {
        console.error('Failed to refresh dynamic models:', e);
        this.showToast('获取模型列表失败: ' + e.message, 'error');
      } finally {
        this.dynamicModelsLoading = false;
      }
    },

    // 🔥 Phase 9: 选择服务商
    selectProvider(providerKey) {
      const provider = this.apiProviders[providerKey];
      if (provider) {
        this.settings.provider = providerKey;
        this.settings.baseUrl = provider.baseUrl;
        this.settings.model = provider.defaultModel || '';
        // 切换服务商时清空模型列表
        this.availableModels = [];
      }
    },

    // 🔥 Phase 9: 统一的模型列表获取
    async refreshModels() {
      if (!this.settings.baseUrl) {
        this.showToast('请先填写 API 地址', 'error');
        return;
      }

      this.modelsLoading = true;
      this.availableModels = [];

      try {
        const response = await fetch(`${API_BASE}/fetch-models`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            baseUrl: this.settings.baseUrl,
            apiKey: this.settings.apiKey
          })
        });

        const data = await response.json();
        
        if (data.success && data.models.length > 0) {
          this.availableModels = data.models;
          this.showToast(`发现 ${data.count} 个可用模型`, 'success');
          
          // 如果当前没有选择模型，自动选择第一个
          if (!this.settings.model && data.models.length > 0) {
            this.settings.model = data.models[0].id;
          }
        } else {
          this.showToast(data.error || '未找到可用模型', 'error');
        }
      } catch (error) {
        console.error('Failed to fetch models:', error);
        this.showToast('获取模型列表失败', 'error');
      } finally {
        this.modelsLoading = false;
      }
    },

    // ==================
    // 🔥 Phase 10: History & Favorites
    // ==================
    
    // 加载历史记录统计
    async loadHistoryStats() {
      try {
        const response = await fetch('/api/history/stats');
        const data = await response.json();
        if (data.success) {
          this.historyCount = data.stats.total;
        }
      } catch (error) {
        console.error('Failed to load history stats:', error);
      }
    },

    // 加载收藏统计
    async loadFavoritesStats() {
      try {
        const response = await fetch('/api/favorites/stats');
        const data = await response.json();
        if (data.success) {
          this.favoritesCount = data.stats.total;
        }
      } catch (error) {
        console.error('Failed to load favorites stats:', error);
      }
    },

    // 加载历史记录列表
    async loadHistory() {
      try {
        let url = '/api/history';
        if (this.historyFilter) {
          const [category, subcategory] = this.historyFilter.split('/');
          url += `?category=${category}&subcategory=${subcategory}`;
        }
        const response = await fetch(url);
        const data = await response.json();
        if (data.success) {
          this.historyRecords = data.records;
          this.historyCount = data.total;
        }
      } catch (error) {
        console.error('Failed to load history:', error);
        this.showToast('加载历史记录失败', 'error');
      }
    },

    // 加载收藏列表
    async loadFavorites() {
      try {
        let url = '/api/favorites';
        if (this.favoritesFilter) {
          const [category, subcategory] = this.favoritesFilter.split('/');
          url += `?category=${category}&subcategory=${subcategory}`;
        }
        const response = await fetch(url);
        const data = await response.json();
        if (data.success) {
          this.favoriteItems = data.items;
          this.favoritesCount = data.total;
        }
      } catch (error) {
        console.error('Failed to load favorites:', error);
        this.showToast('加载收藏失败', 'error');
      }
    },

    // 保存历史记录（生成后自动调用）
    async saveToHistory(category, subcategory, input, output) {
      try {
        const response = await fetch('/api/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category, subcategory, input, output })
        });
        const data = await response.json();
        if (data.success) {
          this.currentHistoryRecord = data.record;
          this.historyCount++;
          return data.record;
        }
      } catch (error) {
        console.error('Failed to save history:', error);
      }
      return null;
    },

    // 删除历史记录
    async deleteHistoryRecord(id) {
      if (!confirm('确定要删除这条记录吗？')) return;
      try {
        const response = await fetch(`/api/history/${id}`, { method: 'DELETE' });
        const data = await response.json();
        if (data.success) {
          this.historyRecords = this.historyRecords.filter(r => r.id !== id);
          this.historyCount--;
          this.showToast('已删除', 'success');
        }
      } catch (error) {
        this.showToast('删除失败', 'error');
      }
    },

    // 清空历史记录
    async clearHistory() {
      if (!confirm('确定要清空所有历史记录吗？此操作不可恢复！')) return;
      try {
        const response = await fetch('/api/history', { method: 'DELETE' });
        const data = await response.json();
        if (data.success) {
          this.historyRecords = [];
          this.historyCount = 0;
          this.showToast('已清空历史记录', 'success');
        }
      } catch (error) {
        this.showToast('清空失败', 'error');
      }
    },

    // 加载历史记录详情（复用）
    loadHistoryRecord(record) {
      // 找到对应的设计预设
      const preset = this.designPresets.find(p => p.id === record.subcategory);
      if (preset) {
        this.selectDesignPreset(preset).then(() => {
          // 填充输入参数
          Object.keys(record.input || {}).forEach(key => {
            if (this.designVariables.hasOwnProperty(key)) {
              this.designVariables[key] = record.input[key];
            }
          });
          // 显示结果
          this.designResult = {
            finalPrompt: record.output?.prompt,
            structuredPrompt: '',
            matchedSkills: record.output?.matchedSkills || []
          };
          this.currentHistoryRecord = record;
          this.historyDropdownOpen = false;
          this.showToast('已加载历史记录', 'success');
        });
      } else {
        // 如果找不到预设，直接复制提示词
        this.copyToClipboard(record.output?.prompt);
        this.historyDropdownOpen = false;
      }
    },

    // 打开收藏对话框
    openFavoriteModal() {
      if (!this.currentHistoryRecord || !this.designResult) {
        this.showToast('请先生成提示词', 'error');
        return;
      }
      
      // 预填充表单
      this.favoriteForm = {
        name: this.designVariables.brandName || this.designVariables.description || '未命名',
        prompt: this.designResult.finalPrompt,
        category: 'image',
        subcategory: this.selectedDesignPreset?.id || 'logo-design',
        parameters: { ...this.designVariables },
        tags: this.designResult.keywords?.slice(0, 5) || [],
        notes: '',
        rating: 5,
        historyId: this.currentHistoryRecord?.id
      };
      this.newTag = '';
      this.showFavoriteModal = true;
    },

    // 添加标签
    addTag() {
      const tag = this.newTag.trim();
      if (tag && !this.favoriteForm.tags.includes(tag)) {
        this.favoriteForm.tags.push(tag);
      }
      this.newTag = '';
    },

    // 保存收藏
    async saveFavorite() {
      try {
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.favoriteForm)
        });
        const data = await response.json();
        if (data.success) {
          this.showFavoriteModal = false;
          this.favoritesCount++;
          // 更新当前记录的收藏状态
          if (this.currentHistoryRecord) {
            this.currentHistoryRecord.isFavorited = true;
          }
          this.showToast('收藏成功！', 'success');
        } else {
          this.showToast(data.error || '收藏失败', 'error');
        }
      } catch (error) {
        this.showToast('收藏失败', 'error');
      }
    },

    // 删除收藏
    async deleteFavorite(id) {
      if (!confirm('确定要删除这个收藏吗？')) return;
      try {
        const response = await fetch(`/api/favorites/${id}`, { method: 'DELETE' });
        const data = await response.json();
        if (data.success) {
          this.favoriteItems = this.favoriteItems.filter(i => i.id !== id);
          this.favoritesCount--;
          this.showToast('已删除', 'success');
        }
      } catch (error) {
        this.showToast('删除失败', 'error');
      }
    },

    // 使用收藏作为参考（复用参数）
    useFavoriteAsReference(item) {
      // 找到对应的设计预设
      const preset = this.designPresets.find(p => p.id === item.subcategory);
      if (preset) {
        this.selectDesignPreset(preset).then(() => {
          // 填充输入参数
          Object.keys(item.parameters || {}).forEach(key => {
            if (this.designVariables.hasOwnProperty(key)) {
              this.designVariables[key] = item.parameters[key];
            }
          });
          this.favoritesDropdownOpen = false;
          this.showToast('已加载收藏参数，可以修改后重新生成', 'success');
        });
      } else {
        this.copyToClipboard(item.prompt);
        this.favoritesDropdownOpen = false;
      }
    },

    // 获取分类图标
    getCategoryIcon(subcategory) {
      const icons = {
        'logo-design': '🏷️',
        'character-design': '🧸',
        'photo-style': '📷',
        'illustration': '🖼️',
        'ui-design': '📱',
        'short-video': '📹',
        'animation': '🎞️',
        'commercial': '📺'
      };
      return icons[subcategory] || '🎨';
    },

    // 获取分类名称
    getCategoryName(category) {
      const names = {
        'image': '🎨 图像生成',
        'video': '🎬 视频生成',
        'writing': '✍️ 写作创作'
      };
      return names[category] || category;
    },

    // 获取子分类名称
    getSubcategoryName(subcategory) {
      const names = {
        'logo-design': 'Logo设计',
        'character-design': '角色设计',
        'photo-style': '摄影风格',
        'illustration': '插画艺术',
        'ui-design': 'UI设计',
        'short-video': '短视频',
        'animation': '动画制作',
        'commercial': '商业广告'
      };
      return names[subcategory] || subcategory;
    },

    // 格式化时间
    formatTime(timestamp) {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now - date;
      
      if (diff < 60000) return '刚刚';
      if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
      if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;
      
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    },

    // ==================
    // Design Assistant
    // ==================
    async loadDesignPresets() {
      try {
        const response = await fetch(`${API_BASE}/design-presets`);
        const data = await response.json();
        if (data.success) {
          this.designPresets = data.data;
        }
      } catch (error) {
        console.error('Failed to load design presets:', error);
        this.showToast('加载设计模板失败', 'error');
      }
    },

    async selectDesignPreset(preset) {
      try {
        const response = await fetch(`${API_BASE}/design-presets/${preset.id}`);
        const data = await response.json();
        if (data.success) {
          this.selectedDesignPreset = data.data;
          this.designVariables = {};
          const variables = this.selectedDesignPreset.template?.variables || [];
          variables.forEach(v => {
            this.designVariables[v.name] = v.defaultValue || '';
          });
          this.designResult = null;
          this.designAdditionalInput = '';
          
          // 📌 Phase 10: 加载对应类别的收藏参考
          this.selectedReference = null;
          this.loadAvailableReferences(preset.id);
        }
      } catch (error) {
        this.showToast('加载模板详情失败', 'error');
      }
    },
    
    // 📌 Phase 10: 加载当前设计类型的可用参考
    async loadAvailableReferences(subcategory) {
      console.log(`[References] 开始加载, subcategory=${subcategory}`);
      try {
        // 注意：favorites API 路径是 /api/favorites，不是 /api/prompts/favorites
        const url = `/api/favorites/references?category=image&subcategory=${subcategory}`;
        console.log(`[References] 请求 URL: ${url}`);
        const response = await fetch(url);
        const data = await response.json();
        console.log(`[References] API 响应:`, data);
        if (data.success) {
          this.availableReferences = data.candidates || [];
          console.log(`[References] ✅ 加载了 ${this.availableReferences.length} 个可用参考`);
        } else {
          console.log(`[References] ❌ API 返回失败:`, data.error);
        }
      } catch (error) {
        console.error('[References] ❌ 加载失败:', error);
        this.availableReferences = [];
      }
    },

    clearDesignPreset() {
      this.selectedDesignPreset = null;
      this.designVariables = {};
      this.designResult = null;
      this.designAdditionalInput = '';
      this.selectedReference = null;  // 清除风格参考
      this.currentHistoryRecord = null;
    },

    // � Phase 10: 通过ID选择风格参考
    selectReferenceById(id) {
      if (!id) {
        this.selectedReference = null;
        return;
      }
      // 优先从当前可用参考中查找，否则从全部收藏中查找
      this.selectedReference = this.availableReferences.find(f => f.id === id) 
        || this.favoriteItems.find(f => f.id === id) 
        || null;
      if (this.selectedReference) {
        console.log(`[Reference] 选择参考: ${this.selectedReference.name}`);
      }
    },

    // 📌 Phase 10: 清除风格参考
    clearReference() {
      this.selectedReference = null;
      console.log('[Reference] 已清除参考');
    },

    async generateDesignPrompt() {
      if (!this.selectedDesignPreset) return;

      this.designLoading = true;
      this.designResult = null;
      this.tokenEstimate = { original: 0, compressed: 0, saved: 0, ratio: 0 };

      try {
        // 🧠 Step 1: 匹配相关 Skills
        let skillsContext = '';
        let matchedSkillNames = [];
        const userInputForMatch = [
          this.selectedDesignPreset.name,
          Object.values(this.designVariables || {}).join(' '),
          this.designAdditionalInput || ''
        ].join(' ');

        try {
          const matchResponse = await fetch('/api/skills/context', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ input: userInputForMatch })
          });
          const matchData = await matchResponse.json();
          if (matchData.success && matchData.data.hasContext) {
            skillsContext = matchData.data.context;
            // 提取匹配的 Skill 名称用于显示
            const skillMatches = skillsContext.match(/## 🎯 Skill: (.+)/g);
            if (skillMatches) {
              matchedSkillNames = skillMatches.map(m => m.replace('## 🎯 Skill: ', ''));
            }
            console.log('[Skills] 匹配到:', matchedSkillNames);
          }
        } catch (e) {
          console.warn('[Skills] 匹配失败:', e);
        }

        // Step 2: 调用设计预设 API
        const applyResponse = await fetch(`${API_BASE}/design-presets/${this.selectedDesignPreset.id}/apply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            variables: this.designVariables,
            additionalInput: this.designAdditionalInput
          })
        });
        const applyData = await applyResponse.json();
        
        if (!applyData.success) {
          throw new Error(applyData.error?.message || '生成失败');
        }

        let structuredPrompt = applyData.data.content; // 这是结构化的中文提示词（给AI看的）
        let baseSystemPrompt = applyData.data.system_prompt;

        // 🔥 Phase 9: 检查是否已配置 API（baseUrl 和 model 必须存在）
        if (this.settings.baseUrl && this.settings.model) {
          try {
            // 🔥 动态构建系统提示词 - 根据用户输入调整
            let dynamicSystemPrompt = this._buildDynamicSystemPrompt(
              baseSystemPrompt, 
              structuredPrompt, 
              this.designVariables,
              this.designAdditionalInput,
              skillsContext,  // 🧠 传入 Skills 上下文
              this.selectedReference  // 📌 Phase 10: 传入收藏参考
            );

            // 🔥 Phase 11: 如果启用压缩，进行压缩处理
            let compressionApplied = false;
            if (this.settings.enableCompression) {
              const compressionResult = await this._applyCompression(
                dynamicSystemPrompt,
                structuredPrompt,
                skillsContext,
                this.settings.compressionLevel
              );
              
              if (compressionResult) {
                dynamicSystemPrompt = compressionResult.systemPrompt;
                structuredPrompt = compressionResult.structuredPrompt;
                skillsContext = compressionResult.skillsContext;
                this.tokenEstimate = compressionResult.stats;
                compressionApplied = true;
                
                console.log('[Compression] 压缩完成:', compressionResult.stats);
              }
            }

            const finalPrompt = await this._callAIForOptimization(structuredPrompt, dynamicSystemPrompt);
            this.designResult = {
              finalPrompt: finalPrompt, // 最终的图像提示词（英文）
              structuredPrompt: structuredPrompt, // 结构化提示词（中文）
              keywords: applyData.data.keywords || [],
              tips: applyData.data.outputTips || [],
              matchedSkills: matchedSkillNames,  // 🧠 显示匹配的 Skills
              compressionApplied,  // 🔥 Phase 11: 显示是否应用了压缩
              tokenEstimate: this.tokenEstimate
            };
            
            // 🔥 Phase 10: 自动保存到历史记录
            this.saveToHistory(
              'image',
              this.selectedDesignPreset?.id || 'logo-design',
              { ...this.designVariables, additionalInput: this.designAdditionalInput },
              { prompt: finalPrompt, matchedSkills: matchedSkillNames }
            );
            
            let successMsg = '专业提示词生成成功！';
            if (matchedSkillNames.length > 0) {
              successMsg += ` (应用了 ${matchedSkillNames.length} 个专业技能)`;
            }
            if (compressionApplied) {
              successMsg += ` [已压缩 ${this.tokenEstimate.ratio}%]`;
            }
            this.showToast(successMsg, 'success');
          } catch (aiError) {
            console.error('AI optimization error:', aiError);
            // AI 调用失败，使用结构化提示词作为备选
            this.designResult = {
              finalPrompt: '【AI调用失败】\n' + aiError.message + '\n\n请检查：\n1. API 地址是否正确\n2. API 密钥是否有效（云端服务需要）\n3. 模型名称是否正确\n4. 本地服务是否已启动\n\n以下是结构化提示词，您可以手动复制给AI：\n\n' + structuredPrompt,
              structuredPrompt: structuredPrompt,
              keywords: applyData.data.keywords || [],
              tips: applyData.data.outputTips || [],
              error: aiError.message
            };
            this.showToast('⚠️ AI API 调用失败: ' + aiError.message, 'error');
          }
        } else {
          this.designResult = {
            finalPrompt: structuredPrompt,
            structuredPrompt: structuredPrompt,
            keywords: applyData.data.keywords || [],
            tips: applyData.data.outputTips || []
          };
          this.showToast('⚠️ 未配置 AI API，无法生成专业图像提示词。请在设置中配置 API 地址和模型。', 'warning');
        }
      } catch (error) {
        this.showToast(error.message || '生成失败', 'error');
      } finally {
        this.designLoading = false;
      }
    },

    /**
     * 🔥 动态构建系统提示词 - 根据用户输入智能调整
     * 修复 P0-3.2: 确保用户信息（品牌名、颜色等）被包含在输出中
     * 🧠 新增: 支持 Skills 上下文注入
     * 📌 Phase 10: 支持收藏参考注入（Few-shot Learning）
     */
    _buildDynamicSystemPrompt(baseSystemPrompt, userInput, variables, additionalInput, skillsContext = '', referencePrompt = null) {
      // 🔥 提取用户必须包含的关键信息
      const userMustInclude = this._extractUserKeyInfo(variables, additionalInput);
      
      // 合并所有用户输入内容
      const allInput = [
        userInput,
        Object.values(variables || {}).join(' '),
        additionalInput || ''
      ].join(' ').toLowerCase();

      // 关键词识别规则库
      const styleDetection = {
        minimalist: ['简约', '极简', '简洁', 'minimalist', 'simple', 'clean'],
        modern: ['现代', '当代', '时尚', 'modern', 'contemporary', 'trendy'],
        vintage: ['复古', '怀旧', '经典', 'vintage', 'retro', 'classic'],
        luxury: ['奢华', '高端', '精致', 'luxury', 'premium', 'elegant'],
        playful: ['活泼', '有趣', '俏皮', 'playful', 'fun', 'cheerful'],
        professional: ['专业', '商务', '正式', 'professional', 'business', 'formal'],
        organic: ['自然', '有机', '温暖', 'organic', 'natural', 'warm'],
        tech: ['科技', '数字', '未来', 'tech', 'digital', 'futuristic']
      };

      const industryDetection = {
        food: ['餐饮', '美食', '烧烤', '咖啡', '饮品', 'food', 'restaurant', 'bbq', 'cafe'],
        fashion: ['时尚', '服装', '品牌', 'fashion', 'clothing', 'apparel'],
        tech: ['科技', 'IT', '软件', '互联网', 'technology', 'software', 'digital'],
        beauty: ['美容', '化妆', '护肤', 'beauty', 'cosmetics', 'skincare'],
        education: ['教育', '培训', '学校', 'education', 'training', 'school'],
        health: ['健康', '医疗', '健身', 'health', 'medical', 'fitness']
      };

      const visualElements = {
        flame: ['火焰', '烟火', '火', 'flame', 'fire'],
        geometric: ['几何', '图形', 'geometric', 'shapes'],
        typography: ['文字', '字体', 'typography', 'lettering'],
        illustration: ['插画', '手绘', 'illustration', 'hand-drawn'],
        gradient: ['渐变', '过渡', 'gradient', 'ombre']
      };

      // 检测风格
      const detectedStyles = [];
      for (const [style, keywords] of Object.entries(styleDetection)) {
        if (keywords.some(kw => allInput.includes(kw))) {
          detectedStyles.push(style);
        }
      }

      // 检测行业
      const detectedIndustry = [];
      for (const [industry, keywords] of Object.entries(industryDetection)) {
        if (keywords.some(kw => allInput.includes(kw))) {
          detectedIndustry.push(industry);
        }
      }

      // 检测视觉元素
      const detectedElements = [];
      for (const [element, keywords] of Object.entries(visualElements)) {
        if (keywords.some(kw => allInput.includes(kw))) {
          detectedElements.push(element);
        }
      }

      // 构建动态系统提示词
      let dynamicPrompt = baseSystemPrompt || `你是一位经验丰富的AI图像生成专家，精通 Midjourney、DALL-E、Stable Diffusion 等主流AI绘图工具。`;

      // 添加风格指导
      if (detectedStyles.length > 0) {
        const styleGuide = {
          minimalist: '采用极简主义设计理念，注重负空间运用，使用简洁的几何形状和有限的色彩，强调功能性与美感的平衡',
          modern: '运用当代设计趋势，大胆的色彩搭配，流畅的线条，注重视觉冲击力和时代感',
          vintage: '融入复古元素，使用怀旧色调（如棕褐色、暗金色），参考经典设计风格，营造历史感和温度',
          luxury: '体现高端品质，使用金属质感、优雅字体、精致细节，色彩以黑白金为主，强调品质感',
          playful: '色彩明快丰富，造型活泼有趣，可使用卡通元素或夸张表现手法，传达轻松愉悦的氛围',
          professional: '设计严谨规范，色彩稳重（深蓝、灰色系），强调可信度和专业形象',
          organic: '使用自然曲线、温暖色调（大地色系），融入自然元素，营造亲和力',
          tech: '几何化、对称性强，使用科技蓝、渐变效果，体现创新和未来感'
        };

        dynamicPrompt += `\n\n【设计风格倾向】\n`;
        detectedStyles.forEach(style => {
          dynamicPrompt += `- ${style.toUpperCase()}: ${styleGuide[style]}\n`;
        });
      }

      // 添加行业特性
      if (detectedIndustry.length > 0) {
        const industryGuide = {
          food: '注重食欲感表达，使用暖色调（红、橙、黄），可融入食材或烹饪元素，传达美味和品质',
          fashion: '强调时尚感和品味，注重细节刻画，色彩搭配要有高级感，体现品牌调性',
          tech: '使用现代化视觉语言，几何图形、渐变效果，冷色调为主，传达科技感和创新力',
          beauty: '柔和优雅，色彩以粉色、金色为主，注重质感表现，传达美丽和精致',
          education: '色彩明快但不过分鲜艳，融入知识或成长元素，传达信任和专业',
          health: '清新干净，使用绿色、蓝色等健康色系，传达活力和可信赖'
        };

        dynamicPrompt += `\n【行业特性考量】\n`;
        detectedIndustry.forEach(industry => {
          dynamicPrompt += `- ${industry.toUpperCase()}: ${industryGuide[industry]}\n`;
        });
      }

      // 添加视觉元素建议
      if (detectedElements.length > 0) {
        dynamicPrompt += `\n【建议融入的视觉元素】\n`;
        dynamicPrompt += detectedElements.map(e => `- ${e}`).join(', ') + '\n';
      }

      // 🆕 添加Logo类型专业指导
      const logoTypeGuide = {
        '纯文字Logo': {
          guide: '这是一个纯文字Logo（Wordmark/Logotype），设计要点：\n' +
                 '- 字体选择是核心，需要体现品牌个性（衬线=传统优雅，无衬线=现代简洁，手写=亲和创意）\n' +
                 '- 可进行字体微调：字距、连字、笔画粗细变化\n' +
                 '- 品牌名称必须清晰可读，是设计的唯一主体\n' +
                 '- 英文提示词应包含: wordmark, typography-based logo, lettering, custom typeface',
          keywords: ['wordmark', 'typography logo', 'text logo', 'logotype', 'lettering design']
        },
        '纯图形Logo': {
          guide: '这是一个纯图形Logo（Symbol/Pictorial Mark），设计要点：\n' +
                 '- 图形应能独立代表品牌，无需文字辅助\n' +
                 '- 设计要简洁有力，高度概括品牌理念\n' +
                 '- 注意负空间运用，增加视觉趣味\n' +
                 '- 确保在各种尺寸下都能识别\n' +
                 '- 不要在设计中包含任何文字\n' +
                 '- 英文提示词应包含: symbol logo, pictorial mark, iconic logo, no text',
          keywords: ['symbol logo', 'pictorial mark', 'iconic', 'logomark', 'no text', 'graphic only']
        },
        '图文组合Logo': {
          guide: '这是一个图文组合Logo（Combination Mark），设计要点：\n' +
                 '- 图形与文字相辅相成，可水平排列或上下排列\n' +
                 '- 保持图形和文字的视觉平衡\n' +
                 '- 设计时考虑分离使用的可能性\n' +
                 '- 英文提示词应包含: combination logo, logo with icon and text, brand name with symbol',
          keywords: ['combination mark', 'logo with text and symbol', 'integrated logo']
        },
        '字母Logo': {
          guide: '这是一个字母Logo（Lettermark/Monogram），设计要点：\n' +
                 '- 使用品牌名称的首字母或缩写（如IBM、HP、CNN）\n' +
                 '- 字母间可以有创意的连接或重叠\n' +
                 '- 适合名称较长的品牌\n' +
                 '- 英文提示词应包含: lettermark, monogram logo, initials logo, letter-based design',
          keywords: ['lettermark', 'monogram', 'initials logo', 'abbreviated logo']
        },
        '徽章Logo': {
          guide: '这是一个徽章Logo（Emblem），设计要点：\n' +
                 '- 文字嵌入图形内部，形成整体\n' +
                 '- 常见形状：圆形、盾形、徽章形\n' +
                 '- 适合传统、权威、学术类品牌\n' +
                 '- 注意小尺寸时的可读性\n' +
                 '- 英文提示词应包含: emblem logo, badge design, crest, seal',
          keywords: ['emblem', 'badge logo', 'crest', 'seal', 'enclosed logo']
        },
        '抽象符号Logo': {
          guide: '这是一个抽象符号Logo（Abstract Mark），设计要点：\n' +
                 '- 使用几何形状、线条创造独特的抽象图形\n' +
                 '- 图形不直接描绘具体事物，而是传达品牌理念\n' +
                 '- 适合科技、创新类品牌\n' +
                 '- 英文提示词应包含: abstract logo, geometric abstract, conceptual symbol',
          keywords: ['abstract mark', 'geometric logo', 'abstract symbol', 'conceptual design']
        }
      };

      // 检测用户选择的Logo类型
      if (userMustInclude && userMustInclude.length > 0) {
        const logoTypeInfo = userMustInclude.find(item => item.category === 'logo_type');
        if (logoTypeInfo && logoTypeGuide[logoTypeInfo.value]) {
          const guide = logoTypeGuide[logoTypeInfo.value];
          dynamicPrompt += `\n\n🎯【Logo类型专业指导】\n${guide.guide}`;
          dynamicPrompt += `\n推荐关键词: ${guide.keywords.join(', ')}`;
        }
      }

      // 添加输出要求 - 🔥 优化：适配多模态模型，不局限于Midjourney
      dynamicPrompt += `\n【输出要求】
1. 必须使用英文输出（AI图像/视频模型对英文支持最好）
2. 提示词要详细具体，包含：主体描述、风格、色彩、光影、构图、材质、氛围等
3. 使用专业的设计、摄影、艺术术语
4. 采用通用的提示词结构，兼容主流多模态AI模型：
   - 文生图：Midjourney、DALL-E、Stable Diffusion、Flux、通义万相、文心一格
   - 文生视频：Sora、Runway、Pika、可灵、通义千问
5. 提示词结构建议：[主体描述], [风格/艺术家], [色彩], [光影], [构图], [细节/质量词]
6. 只输出最终的英文提示词，不要输出中文解释
7. 每次生成要有创意差异，避免重复套路`;

      // 🔥 P0-3.2 修复：强调用户必须包含的关键信息
      if (userMustInclude.length > 0) {
        dynamicPrompt += `\n\n⚠️【必须包含的用户指定信息 - 非常重要！】
以下是用户明确指定的信息，你生成的提示词中必须体现这些内容，不可忽略或改动：
${userMustInclude.map((item, i) => `${i + 1}. ${item.label}: "${item.value}" ${item.englishHint ? `(建议英文表达: ${item.englishHint})` : ''}`).join('\n')}

请确保上述所有信息都被融入到最终的英文提示词中！`;
      }

      dynamicPrompt += `\n\n【示例参考】
Logo design: "Minimalist BBQ restaurant logo, stylized flame and grill icon, warm orange-red gradient, geometric shapes, bold sans-serif typography, conveys authentic smoky atmosphere, clean vector style, memorable symbol --ar 1:1 --style modern"
Poster: "Promotional poster for summer sale, vibrant tropical colors, dynamic composition, product photography with lifestyle elements, bold headlines, energetic mood, commercial photography style --ar 2:3"`;

      // 🧠 注入 Skills 专业上下文（如果有匹配的 Skill）
      if (skillsContext && skillsContext.trim().length > 0) {
        dynamicPrompt += `\n\n═══════════════════════════════════════════════════════════
🧠【专业 Skills 知识库 - 请务必参考】
═══════════════════════════════════════════════════════════
以下是根据用户需求自动匹配的专业设计知识，请在生成提示词时参考这些专业指导：

${skillsContext}
═══════════════════════════════════════════════════════════`;
      }

      // 📌 Phase 10: 注入收藏参考（Few-shot Learning）
      if (referencePrompt && referencePrompt.prompt) {
        dynamicPrompt += `\n\n═══════════════════════════════════════════════════════════
📌【用户选定的风格参考 - 请参考此示例的风格和质量】
═══════════════════════════════════════════════════════════
用户选择了一个之前收藏的优秀提示词作为参考，请学习其：
- 表达风格和术语使用
- 结构组织方式
- 质量和细节程度
- 专业性和创意方向

参考名称: ${referencePrompt.name || '未命名'}
参考提示词:
"""
${referencePrompt.prompt}
"""

请在生成新提示词时参考上述示例的风格和质量，但内容要根据用户当前需求来创作，不要照搬参考内容。
═══════════════════════════════════════════════════════════`;
      }

      return dynamicPrompt;
    },

    /**
     * 🔥 P0-3.2 新增：提取用户必须包含的关键信息
     */
    _extractUserKeyInfo(variables, additionalInput) {
      const keyInfo = [];
      
      // 常见的关键变量映射（中文标签 -> 英文提示）
      const variableMapping = {
        // 品牌相关
        'brandName': { label: '品牌名称', category: 'brand' },
        'brand_name': { label: '品牌名称', category: 'brand' },
        '品牌名': { label: '品牌名称', category: 'brand' },
        '品牌名称': { label: '品牌名称', category: 'brand' },
        'companyName': { label: '公司名称', category: 'brand' },
        '公司名称': { label: '公司名称', category: 'brand' },
        
        // 颜色相关
        'colorScheme': { label: '颜色方案', category: 'color' },
        'color_scheme': { label: '颜色方案', category: 'color' },
        'color_preference': { label: '颜色偏好', category: 'color' },
        '颜色方案': { label: '颜色方案', category: 'color' },
        '颜色偏好': { label: '颜色偏好', category: 'color' },
        '主色调': { label: '主色调', category: 'color' },
        'primaryColor': { label: '主色调', category: 'color' },
        'main_color': { label: '主色调', category: 'color' },
        '配色': { label: '配色方案', category: 'color' },
        
        // 风格相关
        'style': { label: '设计风格', category: 'style' },
        'style_preference': { label: '风格偏好', category: 'style' },
        'visual_style': { label: '视觉风格', category: 'style' },
        'art_style': { label: '艺术风格', category: 'style' },
        'creative_style': { label: '创意类型', category: 'style' },
        'visual_tone': { label: '视觉调性', category: 'style' },
        '风格': { label: '设计风格', category: 'style' },
        '设计风格': { label: '设计风格', category: 'style' },
        '风格偏好': { label: '风格偏好', category: 'style' },
        
        // 行业/类型相关
        'industry': { label: '行业', category: 'industry' },
        '行业': { label: '行业', category: 'industry' },
        'type': { label: '类型', category: 'type' },
        '类型': { label: '类型', category: 'type' },
        
        // 产品相关
        'productName': { label: '产品名称', category: 'product' },
        'product_name': { label: '产品名称', category: 'product' },
        'product_type': { label: '产品类型', category: 'product' },
        '产品名称': { label: '产品名称', category: 'product' },
        '产品': { label: '产品', category: 'product' },
        
        // 口号/文案相关
        'slogan': { label: '口号/标语', category: 'text' },
        'brand_slogan': { label: '品牌口号', category: 'text' },
        '口号': { label: '口号', category: 'text' },
        '标语': { label: '标语', category: 'text' },
        '文案': { label: '文案', category: 'text' },
        
        // Logo类型
        'logo_type': { label: 'Logo类型', category: 'logo_type' },
        'logoType': { label: 'Logo类型', category: 'logo_type' },
        'Logo类型': { label: 'Logo类型', category: 'logo_type' },
        
        // 🆕 海报类型
        'poster_type': { label: '海报类型', category: 'poster_type' },
        'poster_purpose': { label: '海报用途', category: 'poster_type' },
        
        // 🆕 IP/角色类型
        'ip_type': { label: 'IP类型', category: 'ip_type' },
        'render_style': { label: '渲染风格', category: 'render' },
        
        // 🆕 广告相关
        'ad_format': { label: '广告形式', category: 'ad_type' },
        'ad_goal': { label: '广告目标', category: 'ad_type' },
        'platform': { label: '投放平台', category: 'platform' },
        'selling_point': { label: '核心卖点', category: 'selling' },
        
        // 🆕 包装相关
        'packaging_type': { label: '包装类型', category: 'packaging_type' },
        'material_preference': { label: '材质偏好', category: 'material' },
        'finishing': { label: '表面工艺', category: 'finishing' },
        'price_range': { label: '价格定位', category: 'price' },
        
        // 🆕 构图和视觉元素
        'composition': { label: '构图方式', category: 'composition' },
        'visual_element': { label: '视觉元素', category: 'visual' },
        'photography_style': { label: '摄影风格', category: 'photography' },
        
        // 目标受众
        'targetAudience': { label: '目标受众', category: 'audience' },
        'target_audience': { label: '目标人群', category: 'audience' },
        '目标受众': { label: '目标受众', category: 'audience' },
        '目标人群': { label: '目标人群', category: 'audience' },
        
        // 尺寸/比例
        'aspectRatio': { label: '宽高比', category: 'dimension' },
        '宽高比': { label: '宽高比', category: 'dimension' },
        '尺寸': { label: '尺寸', category: 'dimension' }
      };

      // 颜色翻译表
      const colorTranslation = {
        '红色': 'red', '红': 'red',
        '橙色': 'orange', '橙': 'orange',
        '黄色': 'yellow', '黄': 'yellow',
        '绿色': 'green', '绿': 'green',
        '蓝色': 'blue', '蓝': 'blue',
        '紫色': 'purple', '紫': 'purple',
        '粉色': 'pink', '粉': 'pink',
        '黑色': 'black', '黑': 'black',
        '白色': 'white', '白': 'white',
        '灰色': 'gray', '灰': 'gray',
        '金色': 'gold', '金': 'gold',
        '银色': 'silver', '银': 'silver',
        '棕色': 'brown', '棕': 'brown',
        '米色': 'beige', '米白': 'cream',
        '渐变': 'gradient'
      };

      // 🆕 Logo类型翻译和专业术语表
      const logoTypeTranslation = {
        '纯文字Logo': { english: 'wordmark logo, typography-based logo, text-only logo', description: '仅使用品牌名称的字体设计，无图形元素' },
        '纯图形Logo': { english: 'symbol logo, pictorial mark, iconic logo, graphic-only logo', description: '仅使用图形/符号，不含文字' },
        '图文组合Logo': { english: 'combination mark logo, logo with text and symbol, emblem with typography', description: '图形与文字结合的完整Logo' },
        '字母Logo': { english: 'lettermark logo, monogram logo, initials logo', description: '使用品牌名称首字母或缩写设计' },
        '徽章Logo': { english: 'emblem logo, badge logo, crest logo, seal logo', description: '文字嵌入图形中的徽章式设计' },
        '抽象符号Logo': { english: 'abstract logo, abstract mark, geometric abstract symbol', description: '使用抽象几何形状表达品牌理念' }
      };

      // 提取变量中的关键信息
      if (variables && typeof variables === 'object') {
        for (const [key, value] of Object.entries(variables)) {
          if (value && value.toString().trim()) {
            const mapping = variableMapping[key];
            const trimmedValue = value.toString().trim();
            
            if (mapping) {
              // 已知变量类型
              let englishHint = '';
              
              // 如果是颜色类别，尝试翻译
              if (mapping.category === 'color') {
                const colorMatches = [];
                for (const [cn, en] of Object.entries(colorTranslation)) {
                  if (trimmedValue.includes(cn)) {
                    colorMatches.push(en);
                  }
                }
                if (colorMatches.length > 0) {
                  englishHint = colorMatches.join(', ');
                }
              }
              
              // 🆕 如果是Logo类型类别，提供专业英文术语
              if (mapping.category === 'logo_type') {
                const logoTypeInfo = logoTypeTranslation[trimmedValue];
                if (logoTypeInfo) {
                  englishHint = logoTypeInfo.english;
                }
              }
              
              keyInfo.push({
                key: key,
                label: mapping.label,
                value: trimmedValue,
                category: mapping.category,
                englishHint: englishHint
              });
            } else if (trimmedValue.length > 0) {
              // 未知变量，也加入
              keyInfo.push({
                key: key,
                label: key,
                value: trimmedValue,
                category: 'other',
                englishHint: ''
              });
            }
          }
        }
      }

      // 从补充说明中提取关键信息
      if (additionalInput && additionalInput.trim()) {
        // 检查是否包含品牌名/颜色等关键词
        const patterns = [
          { regex: /品牌[名称]*[是为：:]\s*([^\s,，。]+)/i, label: '品牌名称(补充)', category: 'brand' },
          { regex: /公司[名称]*[是为：:]\s*([^\s,，。]+)/i, label: '公司名称(补充)', category: 'brand' },
          { regex: /颜色[方案]*[是为：:]\s*([^\s,，。]+)/i, label: '颜色(补充)', category: 'color' },
          { regex: /主色[调]*[是为：:]\s*([^\s,，。]+)/i, label: '主色调(补充)', category: 'color' }
        ];

        for (const pattern of patterns) {
          const match = additionalInput.match(pattern.regex);
          if (match && match[1]) {
            keyInfo.push({
              key: 'additional_' + pattern.category,
              label: pattern.label,
              value: match[1],
              category: pattern.category,
              englishHint: ''
            });
          }
        }

        // 如果补充说明有内容但没匹配到特定模式，也作为一般信息加入
        if (keyInfo.filter(i => i.category !== 'other').length === 0) {
          keyInfo.push({
            key: 'additionalInput',
            label: '用户补充说明',
            value: additionalInput.trim(),
            category: 'additional',
            englishHint: ''
          });
        }
      }

      return keyInfo;
    },

    /**
     * 🔥 Phase 11: 应用提示词压缩
     * @param {string} systemPrompt - 系统提示词
     * @param {string} structuredPrompt - 结构化提示词
     * @param {string} skillsContext - Skills 上下文
     * @param {number} level - 压缩等级 (1=精简, 2=超轻量)
     * @returns {Object|null} - 压缩结果
     */
    async _applyCompression(systemPrompt, structuredPrompt, skillsContext, level) {
      try {
        // 提取用户必须包含的关键信息（压缩时也要保留）
        const userMustInclude = this._extractUserKeyInfo(this.designVariables, this.designAdditionalInput);
        
        const response = await fetch(`${API_BASE}/compress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemPrompt,
            structuredPrompt,
            skillsContext,
            level,
            userMustInclude
          })
        });

        const data = await response.json();
        
        if (data.success && data.data) {
          return data.data;
        }
        
        console.warn('[Compression] 压缩失败:', data.error);
        return null;
      } catch (error) {
        console.error('[Compression] 压缩请求失败:', error);
        return null;
      }
    },

    /**
     * 🔥 Phase 11: 估算当前提示词的 Token 数
     */
    async _estimateTokens(text) {
      try {
        const response = await fetch(`${API_BASE}/estimate-tokens`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        });
        const data = await response.json();
        return data.success ? data.data.tokens : 0;
      } catch (error) {
        console.error('[TokenEstimate] 估算失败:', error);
        return 0;
      }
    },

    async _callAIForOptimization(userPrompt, systemPrompt) {
      // 🔥 Phase 9: 统一的 API 配置
      const config = {
        baseUrl: this.settings.baseUrl,
        apiKey: this.settings.apiKey,
        model: this.settings.model
      };

      console.log('Calling AI with config:', { 
        baseUrl: config.baseUrl, 
        model: config.model,
        hasApiKey: !!config.apiKey 
      });

      // 如果没有自定义系统提示词，使用默认的专业提示词生成指令
      const defaultSystemPrompt = `你是一位经验丰富的AI图像生成专家，精通 Midjourney、DALL-E、Stable Diffusion 等主流AI绘图工具。

【你的任务】
根据用户提供的设计需求和关键词，生成一个专业、完整、可直接使用的AI图像生成提示词（Prompt）。

【输出要求】
1. 必须使用英文输出（AI绘图模型对英文支持最好）
2. 提示词要详细具体，包含：主体描述、风格、色彩、光影、构图、细节等
3. 使用专业的设计和摄影术语
4. 提示词要符合 Midjourney/DALL-E 的语法规范
5. 只输出最终的英文提示词，不要输出其他解释说明
6. 不要输出任何中文内容

【示例格式】
A minimalist logo design for a BBQ restaurant, featuring stylized flame and grill elements, warm color palette with orange and red gradients, simple geometric shapes, modern typography, conveys authentic street food atmosphere, professional vector graphic style, clean lines, memorable and recognizable, suitable for signage and branding materials --ar 1:1 --style modern`;

      // 设置超时控制 (60秒)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      try {
        const response = await fetch(`${API_BASE}/improve/ai`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: userPrompt,
            systemPrompt: systemPrompt || defaultSystemPrompt,
            config: config
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        const data = await response.json();
        console.log('AI API Response:', data);
        
        if (data.success && data.data) {
          const result = data.data.improved || data.data.content;
          if (result) {
            return result;
          }
        }
        
        // 如果响应成功但没有有效内容
        throw new Error(data.error?.message || 'AI返回内容为空');
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          throw new Error('AI请求超时（60秒），请检查网络或API服务状态');
        }
        throw fetchError;
      }
    },

    regenerateDesignPrompt() {
      this.generateDesignPrompt();
    },

    // ==========================================
    // Skills Methods
    // ==========================================

    async loadSkills() {
      this.skillsLoading = true;
      try {
        const response = await fetch('/api/skills');
        const data = await response.json();
        if (data.success) {
          this.skills = data.data || [];
        } else {
          throw new Error(data.error || '加载失败');
        }
      } catch (error) {
        console.error('加载 Skills 失败:', error);
        this.showToast('加载技能列表失败', 'error');
      } finally {
        this.skillsLoading = false;
      }
    },

    async rescanSkills() {
      this.skillsLoading = true;
      try {
        const response = await fetch('/api/skills/rescan', { method: 'POST' });
        const data = await response.json();
        if (data.success) {
          this.skills = data.data || [];
          this.showToast(`扫描完成，发现 ${data.count} 个技能`, 'success');
        } else {
          throw new Error(data.error || '扫描失败');
        }
      } catch (error) {
        this.showToast('重新扫描失败', 'error');
      } finally {
        this.skillsLoading = false;
      }
    },

    async viewSkillDetail(skillId) {
      try {
        const response = await fetch(`/api/skills/${skillId}`);
        const data = await response.json();
        if (data.success) {
          this.selectedSkill = data.data;
        } else {
          throw new Error(data.error || '加载失败');
        }
      } catch (error) {
        this.showToast('加载技能详情失败', 'error');
      }
    },

    async toggleSkill(skillId, enabled) {
      try {
        const response = await fetch(`/api/skills/${skillId}/toggle`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled })
        });
        const data = await response.json();
        if (data.success) {
          // 更新本地状态
          const skill = this.skills.find(s => s.id === skillId);
          if (skill) skill.enabled = enabled;
          this.showToast(enabled ? '技能已启用' : '技能已禁用', 'success');
        } else {
          throw new Error(data.error || '操作失败');
        }
      } catch (error) {
        this.showToast('切换状态失败', 'error');
        // 恢复本地状态
        await this.loadSkills();
      }
    },

    async createSkill() {
      if (!this.newSkill.id || !this.newSkill.name) {
        this.showToast('请填写 ID 和名称', 'error');
        return;
      }

      try {
        const skillData = {
          id: this.newSkill.id,
          name: this.newSkill.name,
          description: this.newSkill.description,
          triggers: this.newSkill.triggersText.split(',').map(t => t.trim()).filter(t => t),
          tags: this.newSkill.tagsText.split(',').map(t => t.trim()).filter(t => t),
          instructions: this.newSkill.instructions || `# ${this.newSkill.name}\n\n请在此编写技能指令...`,
          author: 'User'
        };

        const response = await fetch('/api/skills', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(skillData)
        });
        const data = await response.json();

        if (data.success) {
          this.showToast(`技能 "${skillData.name}" 创建成功！`, 'success');
          this.showCreateSkillModal = false;
          this.resetNewSkill();
          await this.loadSkills();
        } else {
          throw new Error(data.error || '创建失败');
        }
      } catch (error) {
        this.showToast(error.message || '创建技能失败', 'error');
      }
    },

    resetNewSkill() {
      this.newSkill = {
        id: '',
        name: '',
        description: '',
        triggersText: '',
        tagsText: '',
        instructions: ''
      };
    },

    confirmDeleteSkill(skill) {
      this.skillToDelete = skill;
    },

    async deleteSkill(skillId) {
      if (!skillId) return;

      try {
        const response = await fetch(`/api/skills/${skillId}`, {
          method: 'DELETE'
        });
        const data = await response.json();

        if (data.success) {
          this.showToast('技能已删除', 'success');
          this.skillToDelete = null;
          await this.loadSkills();
        } else {
          throw new Error(data.error || '删除失败');
        }
      } catch (error) {
        this.showToast('删除技能失败', 'error');
      }
    },

    async exportSkill(skillId) {
      try {
        const response = await fetch(`/api/skills/${skillId}/export`);
        const data = await response.json();

        if (data.success) {
          // 下载为 JSON 文件
          const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `skill-${skillId}.json`;
          a.click();
          URL.revokeObjectURL(url);
          this.showToast('技能已导出', 'success');
        } else {
          throw new Error(data.error || '导出失败');
        }
      } catch (error) {
        this.showToast('导出技能失败', 'error');
      }
    },

    // 导入 Skill 从 JSON 文件
    async importSkillFromFile(event) {
      const file = event.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        const response = await fetch('/api/skills/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: text
        });
        const result = await response.json();

        if (result.success) {
          this.showToast(`技能 "${result.data.name}" 导入成功！`, 'success');
          await this.loadSkills();
        } else {
          throw new Error(result.error || '导入失败');
        }
      } catch (error) {
        this.showToast(error.message || '导入失败，请检查 JSON 格式', 'error');
      }

      // 清空文件输入
      event.target.value = '';
    },

    // 编辑 Skill
    async editSkill(skillId) {
      try {
        const response = await fetch(`/api/skills/${skillId}`);
        const data = await response.json();

        if (data.success) {
          const skill = data.data;
          this.editingSkill = {
            id: skill.meta.id,
            name: skill.meta.name,
            description: skill.meta.description,
            triggersText: skill.meta.triggers?.join(', ') || '',
            tagsText: skill.meta.tags?.join(', ') || '',
            instructions: skill.instructions
          };
        } else {
          throw new Error(data.error || '加载失败');
        }
      } catch (error) {
        this.showToast('加载技能失败', 'error');
      }
    },

    // 保存编辑
    async saveSkillEdit() {
      if (!this.editingSkill || !this.editingSkill.name) return;

      try {
        const updates = {
          name: this.editingSkill.name,
          description: this.editingSkill.description,
          triggers: this.editingSkill.triggersText.split(',').map(t => t.trim()).filter(t => t),
          tags: this.editingSkill.tagsText.split(',').map(t => t.trim()).filter(t => t),
          instructions: this.editingSkill.instructions
        };

        const response = await fetch(`/api/skills/${this.editingSkill.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
        const data = await response.json();

        if (data.success) {
          this.showToast('技能已更新', 'success');
          this.editingSkill = null;
          await this.loadSkills();
        } else {
          throw new Error(data.error || '更新失败');
        }
      } catch (error) {
        this.showToast(error.message || '保存失败', 'error');
      }
    },

    // 简单的 Markdown 转 HTML（用于显示 Skill 内容）
    markdownToHtml(markdown) {
      if (!markdown) return '';
      
      return markdown
        // Headers
        .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>')
        .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
        // Bold
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Code blocks
        .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-base-300 p-2 rounded my-2 overflow-x-auto"><code>$2</code></pre>')
        // Inline code
        .replace(/`([^`]+)`/g, '<code class="bg-base-300 px-1 rounded">$1</code>')
        // Lists
        .replace(/^\- (.*$)/gim, '<li class="ml-4">$1</li>')
        .replace(/^\d+\. (.*$)/gim, '<li class="ml-4">$1</li>')
        // Line breaks
        .replace(/\n\n/g, '</p><p class="my-2">')
        .replace(/\n/g, '<br>');
    },

    async copyToClipboard(text) {
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        this.showToast('已复制到剪贴板', 'success');
      } catch (error) {
        this.showToast('复制失败', 'error');
      }
    },

    showToast(message, type = 'info') {
      this.toast = { show: true, message, type };
      setTimeout(() => {
        this.toast.show = false;
      }, 3000);
    },

    // ==================== 🎬 动态设计方法 (Phase 13) ====================

    /**
     * 判断当前设计角色是否支持动态设计
     */
    isDynamicDesignSupported() {
      if (!this.selectedDesignPreset) return false;
      return this.DYNAMIC_DESIGN_PRESETS.includes(this.selectedDesignPreset.id);
    },

    /**
     * 从设计助手跳转到动态设计（下游入口）
     */
    sendToMotionDesign() {
      if (!this.designResult || !this.selectedDesignPreset) return;

      // 传递设计参数
      this.dynamicParams.designType = this.selectedDesignPreset.id;
      this.dynamicParams.brandName = this.designVariables.brandName || this.designVariables.description || '';
      this.dynamicParams.slogan = this.designVariables.slogan || '';
      this.dynamicParams.style = this.designVariables.style || this.designVariables.designStyle || '';
      this.dynamicParams.colors = this.designVariables.colorScheme || this.designVariables.colors || '';
      this.dynamicParams.description = this.designAdditionalInput || '';

      // 设置下游模式标记
      this.dynamicDesignFromAssistant = true;
      this.dynamicAssistantSummary = `${this.selectedDesignPreset.name} · ${this.dynamicParams.brandName || '未命名'} · ${this.dynamicParams.style || '默认风格'}`;

      // 传递设计提示词
      this.dynamicParams.designPrompt = this.designResult.finalPrompt || this.designResult.structuredPrompt || '';

      // 切换到动态设计 Tab
      this.activeTab = 'dynamic';

      // 自动触发生成（下游模式核心体验：一键直达动态效果）
      this.$nextTick(() => {
        this.generateDynamicDesign();
      });
    },

    /**
     * 清除来自设计助手的数据，切换为独立模式
     */
    clearDynamicAssistantData() {
      this.dynamicDesignFromAssistant = false;
      this.dynamicAssistantSummary = '';
      this.dynamicParams.designPrompt = '';
    },

    /**
     * 切换动画效果选中状态
     */
    toggleAnimationEffect(effectKey) {
      const idx = this.dynamicParams.animation.effects.indexOf(effectKey);
      if (idx >= 0) {
        this.dynamicParams.animation.effects.splice(idx, 1);
      } else {
        this.dynamicParams.animation.effects.push(effectKey);
      }
    },

    /**
     * 生成动态设计
     */
    async generateDynamicDesign() {
      // 验证输入
      if (!this.dynamicDesignFromAssistant && !this.dynamicParams.brandName && !this.dynamicParams.description) {
        this.showToast('请至少输入品牌名称或设计描述', 'error');
        return;
      }

      // 🎬 使用独立配置或全局配置
      const apiConfig = this.getDynamicDesignApiConfig();
      if (!apiConfig.baseUrl || !apiConfig.model) {
        this.showToast('请先配置 AI 服务（API 地址和模型）—— 可在全局设置或动态设计独立配置中设置', 'error');
        return;
      }

      this.dynamicLoading = true;
      this.dynamicCode = '';
      this.dynamicCodeEdit = '';
      this.dynamicSafetyWarnings = [];

      try {
        const response = await fetch(`${API_BASE}/dynamic-design/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...this.dynamicParams,
            config: apiConfig
          })
        });

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error?.message || '生成失败');
        }

        this.dynamicCode = data.data.code;
        this.dynamicCodeEdit = data.data.code;
        this.dynamicSafetyWarnings = data.data.safety?.warnings || [];

        this.showToast('🎬 动态设计生成成功！', 'success');
        console.log('[DynamicDesign] 生成完成', data.data.metadata);

      } catch (error) {
        console.error('[DynamicDesign] 生成失败:', error);
        this.showToast(`生成失败: ${error.message}`, 'error');
      } finally {
        this.dynamicLoading = false;
      }
    },

    /**
     * 应用代码编辑到预览
     */
    applyCodeEdit() {
      if (this.dynamicCodeEdit.trim()) {
        this.dynamicCode = this.dynamicCodeEdit;
        this.showToast('代码已应用到预览', 'success');
      }
    },

    /**
     * 刷新预览
     */
    refreshDynamicPreview() {
      const iframe = document.getElementById('dynamic-preview-iframe');
      if (iframe && this.dynamicCode) {
        iframe.srcdoc = '';
        setTimeout(() => { iframe.srcdoc = this.dynamicCode; }, 50);
        this.showToast('预览已刷新', 'info');
      }
    },

    /**
     * 切换全屏预览
     */
    toggleDynamicFullscreen() {
      this.dynamicFullscreen = !this.dynamicFullscreen;
    },

    /**
     * 迭代修改动态设计
     */
    async iterateDynamicDesign() {
      if (!this.dynamicIterateInstruction.trim() || !this.dynamicCode) return;

      // 🎬 使用独立配置或全局配置
      const apiConfig = this.getDynamicDesignApiConfig();
      if (!apiConfig.baseUrl || !apiConfig.model) {
        this.showToast('请先配置 AI 服务', 'error');
        return;
      }

      this.dynamicIterating = true;

      try {
        const response = await fetch(`${API_BASE}/dynamic-design/iterate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentCode: this.dynamicCode,
            instruction: this.dynamicIterateInstruction,
            config: apiConfig
          })
        });

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error?.message || '迭代修改失败');
        }

        this.dynamicCode = data.data.code;
        this.dynamicCodeEdit = data.data.code;
        this.dynamicSafetyWarnings = data.data.safety?.warnings || [];
        this.dynamicIterateInstruction = '';

        this.showToast('🔄 迭代修改成功！', 'success');

      } catch (error) {
        console.error('[DynamicDesign] 迭代失败:', error);
        this.showToast(`迭代失败: ${error.message}`, 'error');
      } finally {
        this.dynamicIterating = false;
      }
    },

    /**
     * 导出动态设计
     */
    exportDynamicDesign(format) {
      if (!this.dynamicCode) return;

      if (format === 'html') {
        const blob = new Blob([this.dynamicCode], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dynamic-design-${this.dynamicParams.brandName || 'untitled'}-${Date.now()}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.showToast('HTML 文件已下载', 'success');
      }
    },

    /**
     * 导出动态设计为 GIF 动图
     * 使用 html2canvas 逐帧截图 + gif.js 编码
     */
    async exportDynamicAsGif() {
      if (!this.dynamicCode) return;
      if (this.gifExporting) return;

      if (!window.html2canvas || !window.GIF) {
        this.showToast('导出库尚未加载，请刷新页面后重试', 'warning');
        return;
      }

      this.gifExporting = true;
      this.showToast('正在生成 GIF，共录制 3 秒，请稍候...', 'info');

      try {
        const iframe = document.getElementById('dynamic-preview-iframe');
        if (!iframe) throw new Error('预览区域未找到');

        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        const width = iframe.offsetWidth || 800;
        const height = iframe.offsetHeight || 400;

        const gif = new GIF({
          workers: 2,
          quality: 10,
          width,
          height,
          workerScript: '/gif.worker.js'
        });

        const frameCount = 15;   // 15 帧
        const frameDelay = 200;  // 每帧 200ms → 5fps，总时长 ~3s

        for (let i = 0; i < frameCount; i++) {
          await new Promise(r => setTimeout(r, frameDelay));
          const canvas = await html2canvas(iframeDoc.body, {
            width,
            height,
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: '#ffffff',
            foreignObjectRendering: false,
            onclone: (clonedDoc) => {
              // 确保克隆文档中内联样式被保留
              const styles = iframeDoc.querySelectorAll('style');
              styles.forEach(style => {
                const clonedStyle = clonedDoc.createElement('style');
                clonedStyle.textContent = style.textContent;
                clonedDoc.head.appendChild(clonedStyle);
              });
            }
          });
          gif.addFrame(canvas, { delay: frameDelay, copy: true });
        }

        gif.on('finished', (blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `dynamic-design-${this.dynamicParams.brandName || 'untitled'}-${Date.now()}.gif`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          this.gifExporting = false;
          this.showToast('GIF 动图已下载', 'success');
        });

        gif.render();

      } catch (e) {
        console.error('GIF export failed:', e);
        this.showToast('GIF 导出失败: ' + e.message, 'error');
        this.gifExporting = false;
      }
    },

    /**
     * 导出动态设计为视频（WebM）
     * 使用 html2canvas 逐帧截图 + MediaRecorder + canvas.captureStream()
     */
    async exportDynamicAsVideo() {
      if (!this.dynamicCode) return;
      if (this.videoExporting) return;

      if (!window.html2canvas) {
        this.showToast('导出库尚未加载，请刷新页面后重试', 'warning');
        return;
      }

      if (!window.MediaRecorder) {
        this.showToast('您的浏览器不支持视频录制功能', 'error');
        return;
      }

      this.videoExporting = true;
      this.showToast('正在录制视频（5 秒）...', 'info');

      try {
        const iframe = document.getElementById('dynamic-preview-iframe');
        if (!iframe) throw new Error('预览区域未找到');

        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        const width = iframe.offsetWidth || 800;
        const height = iframe.offsetHeight || 400;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm';
        const stream = canvas.captureStream(10);
        const recorder = new MediaRecorder(stream, { mimeType });
        const chunks = [];

        recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: mimeType });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `dynamic-design-${this.dynamicParams.brandName || 'untitled'}-${Date.now()}.webm`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          this.videoExporting = false;
          this.showToast('视频已下载', 'success');
        };

        recorder.start();

        const duration = 5000;
        const fps = 10;
        const frameInterval = 1000 / fps;
        let elapsed = 0;

        const captureFrame = async () => {
          if (elapsed >= duration) {
            recorder.stop();
            return;
          }
          try {
            const captured = await html2canvas(iframeDoc.body, {
              width,
              height,
              useCORS: true,
              allowTaint: true,
              logging: false,
              backgroundColor: '#ffffff',
              foreignObjectRendering: false,
              onclone: (clonedDoc) => {
                const styles = iframeDoc.querySelectorAll('style');
                styles.forEach(style => {
                  const clonedStyle = clonedDoc.createElement('style');
                  clonedStyle.textContent = style.textContent;
                  clonedDoc.head.appendChild(clonedStyle);
                });
              }
            });
            // 先填充白色背景，再绘制捕获的帧
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(captured, 0, 0, width, height);
          } catch (e) { /* 忽略单帧错误 */ }
          elapsed += frameInterval;
          setTimeout(captureFrame, frameInterval);
        };

        captureFrame();

      } catch (e) {
        console.error('Video export failed:', e);
        this.showToast('视频导出失败: ' + e.message, 'error');
        this.videoExporting = false;
      }
    }
  };
}
