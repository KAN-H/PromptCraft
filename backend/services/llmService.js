/**
 * LLM Service - 统一的 AI 推理调用服务
 * 
 * Phase 15 增强版：支持外部 API + 本地模型 + 自动降级
 * 
 * 调用优先级（三层降级）：
 *   1. 外部 API（OpenAI 兼容格式）— 最高质量
 *   2. 本地模型（Qwen3-0.6B via localModelManager）— 离线可用
 *   3. 规则引擎（调用方自行兜底）— 零依赖
 * 
 * 支持的外部服务商：
 * - 本地: Ollama, LM Studio, LocalAI, GenAPI
 * - 云端: OpenAI, Groq, DeepSeek, 硅基流动, OpenRouter
 * 
 * @version 3.0.0 - Phase 15 本地模型集成版
 */

const localModelManager = require('./localModelManager');
const { promptCompressor } = require('./promptCompressorService');

class LLMService {
    constructor() {
        // 🔥 创造性输出的默认参数
        this.creativeSettings = {
            temperature: 0.9,      // 提高温度增加创造性
            top_p: 0.95,           // 核采样，增加多样性
            presence_penalty: 0.6, // 鼓励模型谈论新话题
            frequency_penalty: 0.3 // 降低重复内容
        };
        
        // 🔥 请求限流和重试配置
        this.rateLimitConfig = {
            maxRetries: 3,         // 最大重试次数
            baseDelay: 2000,       // 基础延迟 2 秒
            maxDelay: 10000,       // 最大延迟 10 秒
            lastRequestTime: 0,    // 上次请求时间
            minInterval: 1000      // 最小请求间隔 1 秒
        };
    }
    
    /**
     * 延迟函数
     */
    async _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * 限流：确保请求间隔
     */
    async _enforceRateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.rateLimitConfig.lastRequestTime;
        if (timeSinceLastRequest < this.rateLimitConfig.minInterval) {
            await this._delay(this.rateLimitConfig.minInterval - timeSinceLastRequest);
        }
        this.rateLimitConfig.lastRequestTime = Date.now();
    }

    /**
     * 统一的 LLM 调用方法 (OpenAI 兼容格式)
     * 
     * @param {string} prompt - 用户输入
     * @param {string} systemPrompt - 系统提示词
     * @param {Object} config - 配置对象
     * @param {string} config.baseUrl - API 基础地址
     * @param {string} [config.apiKey] - API 密钥（本地服务可选）
     * @param {string} config.model - 模型名称
     * @param {Object} [options] - 额外选项
     * @returns {Promise<string>} - 生成的文本
     */
    async call(prompt, systemPrompt, config, options = {}) {
        const { baseUrl, apiKey, model } = config;
        
        if (!baseUrl) {
            throw new Error('baseUrl is required');
        }
        if (!model) {
            throw new Error('model is required');
        }

        const { maxRetries, baseDelay, maxDelay } = this.rateLimitConfig;
        let lastError;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                // 强制请求间隔
                await this._enforceRateLimit();
                
                // 统一使用 OpenAI 兼容的 /chat/completions 端点
                const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
                
                // 构建请求头
                const headers = { 'Content-Type': 'application/json' };
                if (apiKey) {
                    headers['Authorization'] = `Bearer ${apiKey}`;
                }

                const response = await fetch(url, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        model: model,
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: prompt }
                        ],
                        temperature: options.temperature || this.creativeSettings.temperature,
                        top_p: options.top_p || this.creativeSettings.top_p,
                        presence_penalty: options.presence_penalty || this.creativeSettings.presence_penalty,
                        frequency_penalty: options.frequency_penalty || this.creativeSettings.frequency_penalty
                    })
                });

                // 处理 429 限流错误 - 自动重试
                if (response.status === 429) {
                    lastError = new Error('API 限流 (429): 请求过于频繁');
                    lastError.status = 429;
                    const retryAfter = response.headers.get('Retry-After');
                    const delay = retryAfter 
                        ? parseInt(retryAfter) * 1000 
                        : Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
                    
                    console.log(`⚠️ API 限流 (429)，${delay/1000}秒后重试... (第${attempt + 1}次)`);
                    await this._delay(delay);
                    continue;
                }

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(`API Error: ${response.status} - ${JSON.stringify(errData)}`);
                }

                const data = await response.json();
                if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
                    throw new Error('API 响应格式无效: 缺少 choices 数组或数组为空');
                }
                const firstChoice = data.choices[0];
                if (!firstChoice.message) {
                    throw new Error('API 响应格式无效: 缺少 choices[0].message 字段');
                }
                if (typeof firstChoice.message.content !== 'string') {
                    throw new Error('API 响应格式无效: 缺少 choices[0].message.content 字段');
                }
                return firstChoice.message.content;
                
            } catch (error) {
                lastError = error;
                
                // 如果是网络错误或超时，也可以重试
                if (attempt < maxRetries && (
                    error.code === 'UND_ERR_CONNECT_TIMEOUT' || 
                    error.message.includes('fetch failed') ||
                    error.message.includes('ECONNREFUSED')
                )) {
                    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
                    console.log(`⚠️ 网络错误，${delay/1000}秒后重试... (第${attempt + 1}次)`);
                    await this._delay(delay);
                    continue;
                }
                
                console.error('LLM Call Failed:', error.message);
                throw error;
            }
        }
        
        // 所有重试都失败
        console.error(`❌ API 调用失败，已重试 ${maxRetries} 次`);
        throw lastError;
    }

    // ==================== Phase 15: 本地模型调用 ====================

    /**
     * 检查本地生成模型是否可用
     * @returns {boolean}
     */
    isLocalModelAvailable() {
        return localModelManager.isGenerationAvailable();
    }

    /**
     * 通过本地模型（Qwen3-0.6B）生成文本
     * 
     * 自动执行提示词压缩以适配超轻量模型的 token 限制
     * 
     * @param {string} prompt - 用户输入
     * @param {string} systemPrompt - 系统提示词
     * @param {Object} [options] - 选项
     * @param {number} [options.maxTokens=512] - 最大生成 token 数
     * @param {number} [options.temperature=0.7] - 温度参数
     * @param {boolean} [options.thinking=false] - 是否启用思考模式
     * @param {boolean} [options.compress=true] - 是否自动压缩提示词
     * @param {number} [options.compressionLevel] - 压缩等级（0=完整, 1=精简, 2=超轻量）
     * @returns {Promise<Object>} { text, source: 'local', compressed?, tokensBefore?, tokensAfter? }
     */
    async callLocalModel(prompt, systemPrompt = '', options = {}) {
        if (!this.isLocalModelAvailable()) {
            throw new Error('本地模型不可用：模型未下载或未加载');
        }

        const {
            maxTokens = 512,
            temperature = 0.7,
            thinking = false,
            compress = true,
            compressionLevel
        } = options;

        let finalPrompt = prompt;
        let finalSystemPrompt = systemPrompt;
        let compressionInfo = null;

        // 自动压缩提示词以适配超轻量模型
        if (compress && (prompt || systemPrompt)) {
            const totalText = (systemPrompt || '') + '\n' + (prompt || '');
            const estimatedTokens = promptCompressor.estimateTokens(totalText);

            // 超过 1500 tokens 时自动压缩
            if (estimatedTokens > 1500) {
                const level = compressionLevel !== undefined
                    ? compressionLevel
                    : (estimatedTokens > 3000 ? 2 : 1);

                const compressed = promptCompressor.compress(totalText, level);
                
                // 压缩后重新拆分：系统提示词占前半部分
                if (systemPrompt && prompt) {
                    const compressedSystem = promptCompressor.compress(systemPrompt, level);
                    const compressedUser = promptCompressor.compress(prompt, level);
                    finalSystemPrompt = compressedSystem.compressed;
                    finalPrompt = compressedUser.compressed;
                } else {
                    finalPrompt = compressed.compressed;
                    finalSystemPrompt = '';
                }

                compressionInfo = {
                    compressed: true,
                    level,
                    tokensBefore: estimatedTokens,
                    tokensAfter: promptCompressor.estimateTokens(
                        (finalSystemPrompt || '') + '\n' + (finalPrompt || '')
                    ),
                    savedTokens: estimatedTokens - promptCompressor.estimateTokens(
                        (finalSystemPrompt || '') + '\n' + (finalPrompt || '')
                    )
                };

                console.log(`📦 提示词已压缩: ${compressionInfo.tokensBefore} → ${compressionInfo.tokensAfter} tokens (节省 ${compressionInfo.savedTokens})`);
            }
        }

        try {
            const result = await localModelManager.generate(finalPrompt, finalSystemPrompt, {
                maxTokens,
                temperature,
                thinking
            });

            return {
                text: result,
                source: 'local',
                model: 'qwen3-0.6b',
                ...(compressionInfo && { compression: compressionInfo })
            };

        } catch (error) {
            console.error('❌ 本地模型调用失败:', error.message);
            // 避免错误信息重复嵌套（localModelManager.generate 已包装过一次）
            const msg = error.message.startsWith('本地模型生成失败')
                ? error.message
                : `本地模型生成失败: ${error.message}`;
            throw new Error(msg);
        }
    }

    /**
     * 带降级的智能调用 — 外部 API 优先，失败时自动切换到本地模型
     * 
     * 这是 Phase 15 的核心方法，实现三层降级架构：
     *   1. 尝试外部 API
     *   2. 失败时尝试本地模型
     *   3. 都失败时抛出包含两层错误信息的异常
     * 
     * @param {string} prompt - 用户输入
     * @param {string} systemPrompt - 系统提示词
     * @param {Object} config - 外部 API 配置 { baseUrl, apiKey, model }
     * @param {Object} [options] - 选项
     * @param {boolean} [options.allowLocalFallback=true] - 是否允许降级到本地模型
     * @param {number} [options.localMaxTokens=512] - 本地模型最大 token 数
     * @param {number} [options.localTemperature=0.7] - 本地模型温度
     * @returns {Promise<Object>} { text, source: 'api'|'local', fallback?, apiError?, compression? }
     */
    async callWithFallback(prompt, systemPrompt, config, options = {}) {
        const {
            allowLocalFallback = true,
            localMaxTokens = 512,
            localTemperature = 0.7,
            ...restOptions
        } = options;

        // 第一层：尝试外部 API
        try {
            const text = await this.call(prompt, systemPrompt, config, restOptions);
            return {
                text,
                source: 'api',
                model: config.model
            };
        } catch (apiError) {
            console.warn(`⚠️ 外部 API 调用失败: ${apiError.message}`);

            // 第二层：尝试本地模型
            if (allowLocalFallback && this.isLocalModelAvailable()) {
                console.log('🔄 降级到本地模型...');
                try {
                    const localResult = await this.callLocalModel(prompt, systemPrompt, {
                        maxTokens: localMaxTokens,
                        temperature: localTemperature,
                        compress: true
                    });

                    return {
                        ...localResult,
                        fallback: true,
                        apiError: apiError.message
                    };
                } catch (localError) {
                    // 两层都失败
                    const error = new Error(
                        `所有推理方式均失败。API: ${apiError.message} | 本地模型: ${localError.message}`
                    );
                    error.apiError = apiError.message;
                    error.localError = localError.message;
                    throw error;
                }
            }

            // 不允许降级或本地模型不可用，直接抛出原始错误
            throw apiError;
        }
    }

    // ==================== 兼容旧版 API (将在未来版本移除) ====================

    /**
     * @deprecated 使用 call() 方法代替
     */
    async callLocal(prompt, systemPrompt, model = 'llama3', options = {}) {
        console.warn('⚠️ callLocal() 已弃用，请使用 call() 方法');
        return this.call(prompt, systemPrompt, {
            baseUrl: 'http://localhost:11434/v1',
            model: model
        }, options);
    }

    /**
     * @deprecated 使用 call() 方法代替
     */
    async callCloud(prompt, systemPrompt, apiKey, baseUrl, model, options = {}) {
        console.warn('⚠️ callCloud() 已弃用，请使用 call() 方法');
        return this.call(prompt, systemPrompt, {
            baseUrl: baseUrl || 'https://api.openai.com/v1',
            apiKey: apiKey,
            model: model || 'gpt-3.5-turbo'
        }, options);
    }
}

module.exports = new LLMService();
