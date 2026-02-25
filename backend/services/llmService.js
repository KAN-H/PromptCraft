/**
 * LLM Service - 统一的 OpenAI 兼容 API 调用服务
 * 
 * 支持所有 OpenAI 兼容的服务商：
 * - 本地: Ollama, LM Studio, LocalAI, GenAPI
 * - 云端: OpenAI, Groq, DeepSeek, 硅基流动, OpenRouter
 * 
 * @version 2.0.0 - Phase 9 重构版
 */
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
