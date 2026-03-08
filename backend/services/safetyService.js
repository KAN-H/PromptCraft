/**
 * SafetyService - 内容安全审查服务
 * 
 * Phase 14 核心模块 — v5.0
 * 
 * 三层安全审查架构：
 *   Layer 1: 关键词预过滤（正则匹配，极低延迟）
 *   Layer 2: AI 毒性分类（Tiny-Toxic-Detector via localModelManager）
 *   Layer 3: 语义深度审查（Qwen3-0.6B，可选，高级场景）
 * 
 * 特性：
 * - 设计领域安全词白名单（防止 "nude tone"、"bleed" 等设计术语误报）
 * - 可配置的分类阈值和处理动作（block / warn / pass）
 * - 审查统计与日志
 * - 降级策略：AI 模型不可用时退回关键词过滤
 * 
 * @version 1.0.0
 * @since Phase 14
 */

const fs = require('fs');
const path = require('path');
const localModelManager = require('./localModelManager');

// 配置文件路径
const CONFIG_PATH = path.join(__dirname, '../../data/safety-config.json');

// 审查结果动作
const SAFETY_ACTION = {
    PASS: 'pass',
    WARN: 'warn',
    BLOCK: 'block'
};

class SafetyService {

    constructor() {
        // 配置
        this.config = null;

        // 编译后的正则
        this._blockedKeywordsRegex = null;
        this._blockedPatternsRegex = [];
        this._designSafeRegex = null;

        // 统计数据
        this._stats = {
            totalChecks: 0,
            passed: 0,
            warned: 0,
            blocked: 0,
            errors: 0,
            byLayer: {
                keyword: { checked: 0, flagged: 0 },
                ai_classify: { checked: 0, flagged: 0 },
                semantic: { checked: 0, flagged: 0 }
            },
            lastReset: new Date().toISOString()
        };

        // 速率限制
        this._rateLimitWindow = [];

        console.log('🛡️ SafetyService 创建完成');
    }

    // ============================================================
    // 初始化
    // ============================================================

    /**
     * 加载配置并编译正则
     */
    initialize() {
        this._loadConfig();
        this._compilePatterns();
        console.log('✅ SafetyService 初始化完成');
        console.log(`  🛡️ 安全审查: ${this.config.enabled ? '已启用' : '已禁用'}`);
        console.log(`  📋 关键词: ${this.config.blockedKeywords.length} 个`);
        console.log(`  🎨 设计安全词: ${this.config.designSafeTerms.length} 个`);
    }

    /**
     * 从文件加载安全配置
     */
    _loadConfig() {
        try {
            const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
            this.config = JSON.parse(raw);
        } catch (err) {
            console.error('⚠️ 加载安全配置失败，使用默认配置:', err.message);
            this.config = this._getDefaultConfig();
        }
    }

    /**
     * 默认配置（配置文件加载失败时使用）
     */
    _getDefaultConfig() {
        return {
            enabled: true,
            layers: {
                keyword: { enabled: true, action: 'block' },
                ai_classify: { enabled: true, threshold: 0.75, action: 'block' },
                semantic: { enabled: false, threshold: 0.8, action: 'warn' }
            },
            blockedKeywords: [],
            blockedPatterns: [],
            designSafeTerms: [],
            categories: {},
            middleware: {
                protectedPaths: ['/api/prompts'],
                skipPaths: ['/api/safety', '/api/models', '/api/history', '/api/favorites'],
                protectedMethods: ['POST', 'PUT'],
                textFields: ['prompt', 'input', 'text', 'content', 'description']
            },
            rateLimit: { maxChecksPerMinute: 60 },
            logging: { enabled: true, logBlocked: true, logWarnings: true }
        };
    }

    /**
     * 编译关键词和模式为正则表达式
     */
    _compilePatterns() {
        // 编译阻止关键词为一个大正则（不区分大小写）
        if (this.config.blockedKeywords && this.config.blockedKeywords.length > 0) {
            const escaped = this.config.blockedKeywords.map(kw =>
                kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            );
            this._blockedKeywordsRegex = new RegExp(escaped.join('|'), 'i');
        } else {
            this._blockedKeywordsRegex = null;
        }

        // 编译阻止模式
        this._blockedPatternsRegex = [];
        if (this.config.blockedPatterns && this.config.blockedPatterns.length > 0) {
            for (const pattern of this.config.blockedPatterns) {
                try {
                    this._blockedPatternsRegex.push(new RegExp(pattern, 'i'));
                } catch (err) {
                    console.error(`  ⚠️ 无效的安全模式: ${pattern}`, err.message);
                }
            }
        }

        // 编译设计安全词白名单
        if (this.config.designSafeTerms && this.config.designSafeTerms.length > 0) {
            const escaped = this.config.designSafeTerms.map(term =>
                term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            );
            this._designSafeRegex = new RegExp(escaped.join('|'), 'gi');
        } else {
            this._designSafeRegex = null;
        }
    }

    // ============================================================
    // 核心审查方法
    // ============================================================

    /**
     * 审查输入文本
     * 
     * @param {string} text - 待审查文本
     * @param {Object} [options] - 选项
     * @param {string} [options.context='input'] - 审查上下文 (input | output)
     * @param {boolean} [options.skipAI=false] - 是否跳过 AI 分类层
     * @returns {Object} 审查结果
     */
    async check(text, options = {}) {
        const { context = 'input', skipAI = false } = options;

        // 若安全审查未启用，直接放行
        if (!this.config.enabled) {
            return this._makeResult(SAFETY_ACTION.PASS, '安全审查已禁用');
        }

        // 速率限制检查
        if (!this._checkRateLimit()) {
            return this._makeResult(SAFETY_ACTION.BLOCK, '安全检查速率超限', {
                layer: 'rate_limit'
            });
        }

        this._stats.totalChecks++;

        // 空文本直接放行
        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            this._stats.passed++;
            return this._makeResult(SAFETY_ACTION.PASS, '空文本');
        }

        const trimmed = text.trim();

        // ---------- Layer 1: 关键词预过滤 ----------
        if (this.config.layers.keyword.enabled) {
            const keywordResult = this._checkKeywords(trimmed);
            if (keywordResult.flagged) {
                this._stats.blocked++;
                this._stats.byLayer.keyword.flagged++;
                this._log('blocked', trimmed, keywordResult);
                return this._makeResult(
                    SAFETY_ACTION.BLOCK,
                    `包含违禁内容: ${keywordResult.matchedKeyword}`,
                    { layer: 'keyword', ...keywordResult }
                );
            }
            this._stats.byLayer.keyword.checked++;
        }

        // ---------- Layer 2: AI 毒性分类 ----------
        if (this.config.layers.ai_classify.enabled && !skipAI) {
            try {
                const aiResult = await this._checkAIClassify(trimmed);
                this._stats.byLayer.ai_classify.checked++;

                if (aiResult.flagged) {
                    const action = aiResult.action || this.config.layers.ai_classify.action;
                    if (action === SAFETY_ACTION.BLOCK) {
                        this._stats.blocked++;
                    } else {
                        this._stats.warned++;
                    }
                    this._stats.byLayer.ai_classify.flagged++;
                    this._log(action, trimmed, aiResult);
                    return this._makeResult(
                        action,
                        `AI 检测到不安全内容 (置信度: ${(aiResult.score * 100).toFixed(1)}%)`,
                        { layer: 'ai_classify', ...aiResult }
                    );
                }
            } catch (err) {
                // AI 分类失败，降级到仅关键词过滤，不阻止用户
                console.warn('⚠️ AI 安全分类降级:', err.message);
                this._stats.errors++;
            }
        }

        // ---------- Layer 3: 语义审查（可选） ----------
        if (this.config.layers.semantic.enabled && !skipAI) {
            try {
                const semanticResult = await this._checkSemantic(trimmed);
                this._stats.byLayer.semantic.checked++;

                if (semanticResult.flagged) {
                    const action = this.config.layers.semantic.action;
                    if (action === SAFETY_ACTION.BLOCK) {
                        this._stats.blocked++;
                    } else {
                        this._stats.warned++;
                    }
                    this._stats.byLayer.semantic.flagged++;
                    this._log(action, trimmed, semanticResult);
                    return this._makeResult(
                        action,
                        '语义审查检测到可疑内容',
                        { layer: 'semantic', ...semanticResult }
                    );
                }
            } catch (err) {
                console.warn('⚠️ 语义安全审查降级:', err.message);
                this._stats.errors++;
            }
        }

        // 通过所有层
        this._stats.passed++;
        return this._makeResult(SAFETY_ACTION.PASS, '审查通过');
    }

    // ============================================================
    // Layer 1: 关键词预过滤
    // ============================================================

    /**
     * 关键词检查
     * @param {string} text - 待检查文本
     * @returns {Object} { flagged, matchedKeyword, matchedPattern }
     */
    _checkKeywords(text) {
        // 先去掉文本中的设计安全词，避免误报
        let sanitizedText = text;
        if (this._designSafeRegex) {
            sanitizedText = text.replace(this._designSafeRegex, ' __SAFE__ ');
        }

        // 检查阻止关键词
        if (this._blockedKeywordsRegex) {
            const match = sanitizedText.match(this._blockedKeywordsRegex);
            if (match) {
                return {
                    flagged: true,
                    matchedKeyword: match[0],
                    matchType: 'keyword'
                };
            }
        }

        // 检查阻止模式
        for (const regex of this._blockedPatternsRegex) {
            const match = sanitizedText.match(regex);
            if (match) {
                return {
                    flagged: true,
                    matchedKeyword: match[0],
                    matchType: 'pattern'
                };
            }
        }

        return { flagged: false };
    }

    // ============================================================
    // Layer 2: AI 毒性分类
    // ============================================================

    /**
     * 使用 Tiny-Toxic-Detector 进行毒性分类
     * @param {string} text - 待分类文本
     * @returns {Object} { flagged, score, label, category, action }
     */
    async _checkAIClassify(text) {
        // 先检查是否包含设计安全词 — 如果整个文本主要由设计术语组成，跳过 AI 检测
        if (this._isDesignSafeText(text)) {
            return { flagged: false, score: 0, label: 'safe', note: 'design_safe_bypass' };
        }

        // 调用 localModelManager 的分类接口
        const result = await localModelManager.classify(text, 'toxicity');

        if (result.isToxic && result.confidence >= this.config.layers.ai_classify.threshold) {
            // 确定具体分类和对应动作
            const category = this._determineCategory(result);
            return {
                flagged: true,
                score: result.confidence,
                label: result.label,
                category: category.name,
                action: category.action
            };
        }

        return {
            flagged: false,
            score: result.confidence,
            label: result.label
        };
    }

    /**
     * 检查文本是否主要由设计安全术语组成
     * @param {string} text 
     * @returns {boolean}
     */
    _isDesignSafeText(text) {
        if (!this._designSafeRegex) return false;

        // 重置 regex lastIndex
        this._designSafeRegex.lastIndex = 0;

        const matches = text.match(this._designSafeRegex);
        if (!matches) return false;

        // 如果安全词占了文本的大部分，视为设计安全文本
        const safeChars = matches.join('').length;
        const totalChars = text.replace(/\s+/g, '').length;
        return totalChars > 0 && (safeChars / totalChars) > 0.5;
    }

    /**
     * 根据 AI 结果确定安全分类
     * @param {Object} result - classify() 的返回结果
     * @returns {Object} { name, action, threshold }
     */
    _determineCategory(result) {
        // 默认 toxic 分类
        const defaultCategory = { name: 'toxic', action: SAFETY_ACTION.BLOCK, threshold: 0.75 };

        if (!this.config.categories) return defaultCategory;

        // 如果 AI 返回了具体 label（如 toxic、insult、threat）
        const label = (result.label || '').toLowerCase();
        for (const [catName, catConfig] of Object.entries(this.config.categories)) {
            if (label.includes(catName)) {
                return {
                    name: catName,
                    action: catConfig.action || SAFETY_ACTION.BLOCK,
                    threshold: catConfig.threshold || 0.75
                };
            }
        }

        return defaultCategory;
    }

    // ============================================================
    // Layer 3: 语义审查（可选）
    // ============================================================

    /**
     * 使用 Qwen3-0.6B 进行语义级安全审查
     * @param {string} text - 待审查文本
     * @returns {Object} { flagged, score, analysis }
     */
    async _checkSemantic(text) {
        // 构建安全审查提示词
        const systemPrompt = `你是一个内容安全审查助手。请判断以下文本是否包含有害、违法或不当内容。
请注意：设计领域术语（如 bleed, knockout, kill line, nude tone 等）是安全的专业术语，不应被标记。
仅返回 JSON 格式：{"safe": true/false, "reason": "原因", "confidence": 0.0-1.0}`;

        const result = await localModelManager.generate(text, systemPrompt, {
            maxTokens: 150,
            temperature: 0.1
        });

        try {
            // 尝试解析 JSON 回复
            const jsonMatch = result.match(/\{[^}]+\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                const isFlagged = parsed.safe === false && 
                                  (parsed.confidence || 0) >= this.config.layers.semantic.threshold;
                return {
                    flagged: isFlagged,
                    score: parsed.confidence || 0,
                    analysis: parsed.reason || '',
                    raw: parsed
                };
            }
        } catch (parseErr) {
            // JSON 解析失败，视为安全
            console.warn('⚠️ 语义审查结果解析失败:', parseErr.message);
        }

        return { flagged: false, score: 0, analysis: '无法解析审查结果' };
    }

    // ============================================================
    // 配置管理
    // ============================================================

    /**
     * 获取当前安全配置（脱敏版本）
     */
    getConfig() {
        return {
            enabled: this.config.enabled,
            layers: this.config.layers,
            keywordCount: this.config.blockedKeywords?.length || 0,
            patternCount: this.config.blockedPatterns?.length || 0,
            designSafeTermCount: this.config.designSafeTerms?.length || 0,
            categories: Object.keys(this.config.categories || {}),
            middleware: this.config.middleware,
            rateLimit: this.config.rateLimit
        };
    }

    /**
     * 更新安全配置
     * @param {Object} updates - 要更新的配置字段
     */
    updateConfig(updates) {
        // 只允许更新特定字段
        const allowedFields = ['enabled', 'layers', 'blockedKeywords', 'blockedPatterns', 
                               'designSafeTerms', 'categories', 'rateLimit'];

        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                this.config[key] = value;
            }
        }

        // 重新编译正则
        this._compilePatterns();

        // 持久化到文件
        this._saveConfig();

        return this.getConfig();
    }

    /**
     * 保存配置到文件
     */
    _saveConfig() {
        try {
            fs.writeFileSync(CONFIG_PATH, JSON.stringify(this.config, null, 2), 'utf-8');
        } catch (err) {
            console.error('⚠️ 保存安全配置失败:', err.message);
        }
    }

    // ============================================================
    // 统计与日志
    // ============================================================

    /**
     * 获取审查统计
     */
    getStats() {
        return { ...this._stats };
    }

    /**
     * 重置统计
     */
    resetStats() {
        this._stats = {
            totalChecks: 0,
            passed: 0,
            warned: 0,
            blocked: 0,
            errors: 0,
            byLayer: {
                keyword: { checked: 0, flagged: 0 },
                ai_classify: { checked: 0, flagged: 0 },
                semantic: { checked: 0, flagged: 0 }
            },
            lastReset: new Date().toISOString()
        };
    }

    /**
     * 记录安全日志
     * @param {string} action - 动作 (blocked | warn | pass)
     * @param {string} text - 原始文本（截断）
     * @param {Object} details - 详细信息
     */
    _log(action, text, details) {
        if (!this.config.logging?.enabled) return;

        const shouldLog = (action === 'block' || action === SAFETY_ACTION.BLOCK) && this.config.logging.logBlocked ||
                          (action === 'warn' || action === SAFETY_ACTION.WARN) && this.config.logging.logWarnings;

        if (!shouldLog) return;

        const logEntry = {
            timestamp: new Date().toISOString(),
            action,
            textPreview: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
            layer: details.layer || details.matchType || 'unknown',
            details: {
                matchedKeyword: details.matchedKeyword,
                score: details.score,
                category: details.category
            }
        };

        console.log(`🛡️ [Safety ${action.toUpperCase()}]`, JSON.stringify(logEntry));

        // 写入日志文件（异步，不阻塞）
        if (this.config.logging.logFile) {
            const logPath = path.join(__dirname, '../../', this.config.logging.logFile);
            const logDir = path.dirname(logPath);
            try {
                if (!fs.existsSync(logDir)) {
                    fs.mkdirSync(logDir, { recursive: true });
                }
                fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n', 'utf-8');
            } catch (err) {
                // 日志写入失败不应影响主流程
            }
        }
    }

    // ============================================================
    // 速率限制
    // ============================================================

    /**
     * 检查速率限制
     * @returns {boolean} true = 未超限
     */
    _checkRateLimit() {
        const maxPerMinute = this.config.rateLimit?.maxChecksPerMinute || 60;
        const now = Date.now();
        const oneMinuteAgo = now - 60000;

        // 清理过期记录
        this._rateLimitWindow = this._rateLimitWindow.filter(ts => ts > oneMinuteAgo);

        if (this._rateLimitWindow.length >= maxPerMinute) {
            return false;
        }

        this._rateLimitWindow.push(now);
        return true;
    }

    // ============================================================
    // 工具方法
    // ============================================================

    /**
     * 构造标准审查结果
     */
    _makeResult(action, message, details = {}) {
        return {
            action,
            safe: action === SAFETY_ACTION.PASS,
            message,
            timestamp: new Date().toISOString(),
            ...details
        };
    }
}

// 单例模式
const safetyService = new SafetyService();

module.exports = safetyService;
module.exports.SafetyService = SafetyService;
module.exports.SAFETY_ACTION = SAFETY_ACTION;
