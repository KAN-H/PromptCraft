/**
 * LocalModelManager - 本地嵌入式 AI 模型管理器
 * 
 * Phase 13 核心模块 — v5.0
 * 
 * 职责：
 * 1. 模型注册表管理（支持的模型列表及元数据）
 * 2. 模型下载（从 HuggingFace 下载 GGUF / ONNX 模型，支持进度追踪）
 * 3. 模型生命周期管理（加载/卸载/状态查询）
 * 4. 推理接口（文本生成 + 分类任务）
 * 5. 内存管理（延迟加载、按需卸载、空闲自动卸载）
 * 6. 错误恢复（推理失败自动重建上下文）
 * 
 * 技术栈：
 * - node-llama-cpp (v3) — GGUF 模型推理引擎（Qwen3-0.6B）
 * - @huggingface/transformers (v3) — ONNX 分类模型（Tiny-Toxic-Detector）
 * 
 * 两个库都是 ESM-only，在 CommonJS 项目中通过 dynamic import() 使用
 * 
 * @version 1.0.0
 * @since Phase 13
 */

const EventEmitter = require('events');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

// ============================================================
// 模型注册表 — 定义所有支持的本地模型
// ============================================================

const MODEL_REGISTRY = {
    'qwen3-0.6b': {
        id: 'qwen3-0.6b',
        name: 'Qwen3-0.6B',
        description: '超轻量文本生成模型，支持思考/非思考双模式，100+语言',
        type: 'generation',        // 模型类型：generation | classification
        runtime: 'node-llama-cpp', // 运行时引擎
        format: 'gguf',            // 模型格式
        fileName: 'qwen3-0.6b-q4_k_m.gguf',
        // node-llama-cpp 的 resolveModelFile 支持 hf: URI 格式
        hfUri: 'hf:Qwen/Qwen3-0.6B-GGUF:Q4_K_M',
        // 也提供直接下载 URL 作为备选
        downloadUrl: 'https://huggingface.co/Qwen/Qwen3-0.6B-GGUF/resolve/main/qwen3-0.6b-q4_k_m.gguf',
        sizeBytes: 484_000_000,    // ~462 MB (Q4_K_M)
        sizeDisplay: '~462 MB',
        contextLength: 32768,
        license: 'Apache-2.0',
        capabilities: ['text-generation', 'translation', 'intent-classification'],
        recommended: true
    },
    'tiny-toxic-detector': {
        id: 'tiny-toxic-detector',
        name: 'Tiny-Toxic-Detector',
        description: '超轻量毒性内容检测模型 (2.1M参数, 90%+准确率)',
        type: 'classification',
        runtime: 'transformers.js',
        format: 'onnx',
        // Transformers.js 使用 HuggingFace 模型 ID 自动下载和缓存
        hfModelId: 'nicholasKluge/TinyToxicDetector',
        sizeBytes: 10_000_000,     // ~10 MB
        sizeDisplay: '~10 MB',
        license: 'Apache-2.0',
        capabilities: ['text-classification', 'toxicity-detection'],
        recommended: true
    }
};

// ============================================================
// 手动导入：灵活文件名匹配模式
// 用户可能从 HuggingFace 手动下载模型文件，文件名可能与预期不完全一致
// ============================================================

const MODEL_FILE_PATTERNS = {
    'qwen3-0.6b': {
        // 精确匹配（应用下载时使用的标准文件名）
        exactName: 'qwen3-0.6b-q4_k_m.gguf',
        // 模糊匹配模式（用户手动下载时可能的文件名变体）
        patterns: [
            /^qwen3[-_]?0\.?6b[-_]?q4[-_]?k[-_]?m\.gguf$/i,
            /^qwen3[-_.].*0\.?6.*\.gguf$/i,
            /^Qwen3[-_]0\.6B.*Q4_K_M\.gguf$/i,
            /^qwen.*0\.6.*\.gguf$/i
        ],
        extension: '.gguf',
        // 最小文件大小（防止误匹配空文件或损坏文件）
        minSize: 100_000_000  // 100MB
    },
    'tiny-toxic-detector': {
        // Transformers.js 自动管理，但也支持手动放置 ONNX 文件
        exactName: null,  // 无固定文件名（由 Transformers.js 缓存管理）
        patterns: [
            /^tiny[-_]?toxic[-_]?detector.*\.(onnx|bin|safetensors)$/i,
            /^TinyToxicDetector.*\.(onnx|bin|safetensors)$/i
        ],
        extension: '.onnx',
        minSize: 1_000_000  // 1MB
    }
};

// 模型状态枚举
const MODEL_STATUS = {
    NOT_DOWNLOADED: 'not_downloaded',   // 未下载
    DOWNLOADING: 'downloading',         // 下载中
    DOWNLOADED: 'downloaded',           // 已下载，未加载
    LOADING: 'loading',                 // 加载中
    READY: 'ready',                     // 已加载，可使用
    UNLOADING: 'unloading',             // 卸载中
    ERROR: 'error'                      // 错误状态
};


class LocalModelManager extends EventEmitter {

    constructor() {
        super();

        // 模型存储目录
        this.modelsDir = path.join(__dirname, '../../models');

        // 模型运行时状态
        this._modelStates = new Map();
        // 格式: modelId -> { status, progress, error, loadedAt, instance }

        // 运行时引擎缓存（延迟加载）
        this._llamaInstance = null;        // node-llama-cpp getLlama() 实例
        this._llamaModel = null;           // 已加载的 GGUF 模型
        this._llamaContext = null;         // 模型上下文
        this._contextSequence = null;      // 上下文序列（全局唯一，避免重复分配）
        this._llamaSession = null;         // 聊天会话

        this._classifierPipeline = null;   // Transformers.js 分类 pipeline

        // ── 空闲自动卸载 ──
        this._lastUsedAt = null;           // 最后一次推理时间戳（Date）
        this._idleTimeoutMs = 30 * 60 * 1000; // 空闲超时（默认 30 分钟）
        this._idleCheckTimer = null;       // 定时器 ID

        // 运行时可用性标记
        this._runtimeAvailable = {
            'node-llama-cpp': null,        // null = 未检测, true/false = 检测结果
            'transformers.js': null
        };

        // 初始化所有模型状态
        for (const modelId of Object.keys(MODEL_REGISTRY)) {
            this._modelStates.set(modelId, {
                status: MODEL_STATUS.NOT_DOWNLOADED,
                progress: 0,
                error: null,
                loadedAt: null,
                instance: null
            });
        }

        console.log('📦 LocalModelManager 创建完成');
    }

    // ============================================================
    // 初始化
    // ============================================================

    /**
     * 启动时初始化 — 检查已下载模型的状态
     * 应在服务器启动时调用
     */
    async initialize() {
        console.log('🔧 LocalModelManager 初始化中...');

        // 确保模型目录存在
        if (!fs.existsSync(this.modelsDir)) {
            fs.mkdirSync(this.modelsDir, { recursive: true });
        }

        // 检查各模型的下载状态（支持标准文件名 + 手动放置的文件）
        for (const [modelId, registry] of Object.entries(MODEL_REGISTRY)) {
            if (registry.runtime === 'node-llama-cpp') {
                // GGUF 模型：先检查标准路径，再扫描目录中的兼容文件
                const standardPath = this._getModelPath(modelId);
                let detectedPath = null;

                if (fs.existsSync(standardPath)) {
                    detectedPath = standardPath;
                } else {
                    // 扫描目录中的兼容文件（用户可能手动放置了不同文件名的模型）
                    detectedPath = this._findCompatibleFile(modelId);
                    if (detectedPath) {
                        console.log(`  🔍 发现手动放置的模型文件: ${path.basename(detectedPath)}`);
                        // 自动重命名为标准文件名，方便后续管理
                        try {
                            fs.renameSync(detectedPath, standardPath);
                            detectedPath = standardPath;
                            console.log(`  📝 已自动重命名为标准文件名: ${registry.fileName}`);
                        } catch (renameErr) {
                            // 如果重命名失败（可能权限问题），仍使用原路径
                            console.log(`  ⚠️ 文件重命名失败，使用原路径: ${renameErr.message}`);
                        }
                    }
                }

                if (detectedPath) {
                    const stats = fs.statSync(detectedPath);
                    const minSize = MODEL_FILE_PATTERNS[modelId]?.minSize || registry.sizeBytes * 0.5;
                    if (stats.size >= minSize) {
                        this._updateStatus(modelId, MODEL_STATUS.DOWNLOADED);
                        console.log(`  ✅ ${registry.name}: 已下载 (${this._formatSize(stats.size)})`);
                    } else {
                        console.log(`  ⚠️ ${registry.name}: 文件不完整 (${this._formatSize(stats.size)}), 需重新下载`);
                    }
                } else {
                    console.log(`  📥 ${registry.name}: 未下载`);
                }
            } else if (registry.runtime === 'transformers.js') {
                // Transformers.js 模型：检查缓存目录是否有内容
                const cacheDir = path.join(this.modelsDir, 'cache');
                if (fs.existsSync(cacheDir)) {
                    const cacheContents = fs.readdirSync(cacheDir);
                    if (cacheContents.length > 0) {
                        this._updateStatus(modelId, MODEL_STATUS.DOWNLOADED);
                        console.log(`  ✅ ${registry.name}: 缓存已存在`);
                    } else {
                        console.log(`  📥 ${registry.name}: 按需自动下载 (Transformers.js 管理)`);
                    }
                } else {
                    console.log(`  📥 ${registry.name}: 按需自动下载 (Transformers.js 管理)`);
                }
            }
        }

        // 检查运行时可用性
        await this._checkRuntimeAvailability();

        console.log('✅ LocalModelManager 初始化完成');
        this.emit('initialized');
    }

    // ============================================================
    // 手动导入 & 模型扫描
    // ============================================================

    /**
     * 扫描 models 目录，发现用户手动放置的兼容模型文件
     * @returns {Object} 扫描结果 { found: [...], unmatched: [...] }
     */
    scanModels() {
        if (!fs.existsSync(this.modelsDir)) {
            return { found: [], unmatched: [] };
        }

        const files = fs.readdirSync(this.modelsDir);
        const found = [];
        const unmatched = [];

        for (const fileName of files) {
            // 跳过特殊文件和目录
            if (fileName.startsWith('.') || fileName === 'README.md' || fileName === 'cache') {
                continue;
            }

            const filePath = path.join(this.modelsDir, fileName);
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) continue;

            let matched = false;
            for (const [modelId, patterns] of Object.entries(MODEL_FILE_PATTERNS)) {
                // 先检查精确匹配
                if (patterns.exactName && fileName === patterns.exactName) {
                    found.push({
                        modelId,
                        fileName,
                        filePath,
                        fileSize: stat.size,
                        fileSizeDisplay: this._formatSize(stat.size),
                        matchType: 'exact',
                        isStandardName: true
                    });
                    matched = true;
                    break;
                }

                // 再检查模糊匹配
                for (const pattern of patterns.patterns) {
                    if (pattern.test(fileName)) {
                        found.push({
                            modelId,
                            fileName,
                            filePath,
                            fileSize: stat.size,
                            fileSizeDisplay: this._formatSize(stat.size),
                            matchType: 'pattern',
                            isStandardName: false,
                            expectedName: patterns.exactName
                        });
                        matched = true;
                        break;
                    }
                }
                if (matched) break;
            }

            if (!matched) {
                // 只报告模型相关的扩展名
                const ext = path.extname(fileName).toLowerCase();
                if (['.gguf', '.onnx', '.bin', '.safetensors'].includes(ext)) {
                    unmatched.push({
                        fileName,
                        filePath,
                        fileSize: stat.size,
                        fileSizeDisplay: this._formatSize(stat.size),
                        extension: ext,
                        hint: '此文件未匹配到任何已注册模型'
                    });
                }
            }
        }

        // 同步扫描结果到状态
        for (const item of found) {
            const state = this._modelStates.get(item.modelId);
            const patterns = MODEL_FILE_PATTERNS[item.modelId];
            if (state && state.status === MODEL_STATUS.NOT_DOWNLOADED) {
                if (item.fileSize >= (patterns?.minSize || 0)) {
                    this._updateStatus(item.modelId, MODEL_STATUS.DOWNLOADED);
                }
            }
        }

        return { found, unmatched };
    }

    /**
     * 从用户指定的路径导入模型文件
     * @param {string} modelId - 目标模型 ID
     * @param {string} sourcePath - 源文件的绝对路径
     * @param {Object} [options] - 选项
     * @param {boolean} [options.move=false] - 是否移动（而非复制）文件
     * @returns {Promise<Object>} 导入结果
     */
    async importModel(modelId, sourcePath, options = {}) {
        const registry = MODEL_REGISTRY[modelId];
        if (!registry) {
            throw new Error(`未知模型: ${modelId}`);
        }

        // 验证源文件
        if (!fs.existsSync(sourcePath)) {
            throw new Error(`文件不存在: ${sourcePath}`);
        }

        const stat = fs.statSync(sourcePath);
        if (!stat.isFile()) {
            throw new Error(`路径不是文件: ${sourcePath}`);
        }

        // 验证文件扩展名
        const ext = path.extname(sourcePath).toLowerCase();
        const patterns = MODEL_FILE_PATTERNS[modelId];
        if (patterns && patterns.extension && ext !== patterns.extension) {
            throw new Error(
                `文件格式不匹配: 期望 ${patterns.extension}，实际 ${ext}`
            );
        }

        // 验证文件大小
        const minSize = patterns?.minSize || 0;
        if (stat.size < minSize) {
            throw new Error(
                `文件过小 (${this._formatSize(stat.size)})，可能是损坏的文件。最小期望: ${this._formatSize(minSize)}`
            );
        }

        // 确保模型目录存在
        if (!fs.existsSync(this.modelsDir)) {
            fs.mkdirSync(this.modelsDir, { recursive: true });
        }

        const targetPath = this._getModelPath(modelId);
        if (!targetPath) {
            throw new Error(`无法确定模型 ${modelId} 的存储路径`);
        }

        // 如果目标文件已存在，先确认状态
        const state = this._modelStates.get(modelId);
        if (state.status === MODEL_STATUS.READY) {
            throw new Error(`模型 ${modelId} 当前已加载，请先卸载后再导入`);
        }

        console.log(`📥 导入模型 ${registry.name}: ${sourcePath} → ${targetPath}`);

        try {
            if (options.move) {
                // 移动文件（更快，不占用额外磁盘空间）
                fs.renameSync(sourcePath, targetPath);
                console.log(`  ✅ 文件已移动`);
            } else {
                // 复制文件（安全，保留源文件）
                fs.copyFileSync(sourcePath, targetPath);
                console.log(`  ✅ 文件已复制`);
            }

            this._updateStatus(modelId, MODEL_STATUS.DOWNLOADED, { progress: 100 });
            this.emit('model:imported', { modelId, sourcePath, targetPath });

            return {
                modelId,
                name: registry.name,
                sourcePath,
                targetPath,
                fileSize: stat.size,
                fileSizeDisplay: this._formatSize(stat.size),
                method: options.move ? 'move' : 'copy'
            };

        } catch (error) {
            throw new Error(`导入失败: ${error.message}`);
        }
    }

    // ============================================================
    // 模型注册表
    // ============================================================

    /**
     * 获取模型注册表
     */
    getRegistry() {
        return { ...MODEL_REGISTRY };
    }

    /**
     * 获取单个模型的注册信息
     */
    getModelInfo(modelId) {
        return MODEL_REGISTRY[modelId] || null;
    }

    // ============================================================
    // 模型下载
    // ============================================================

    /**
     * 下载指定模型
     * @param {string} modelId - 模型 ID
     * @returns {Promise<string>} 模型文件路径
     */
    async downloadModel(modelId) {
        const registry = MODEL_REGISTRY[modelId];
        if (!registry) {
            throw new Error(`未知模型: ${modelId}`);
        }

        const currentState = this._modelStates.get(modelId);
        if (currentState.status === MODEL_STATUS.DOWNLOADING) {
            throw new Error(`模型 ${modelId} 正在下载中`);
        }
        if (currentState.status === MODEL_STATUS.READY) {
            throw new Error(`模型 ${modelId} 已加载，无需重新下载`);
        }

        if (registry.runtime === 'node-llama-cpp') {
            return this._downloadGGUFModel(modelId, registry);
        } else if (registry.runtime === 'transformers.js') {
            // Transformers.js 模型在加载时自动下载
            return this._preloadTransformersModel(modelId, registry);
        }

        throw new Error(`不支持的运行时: ${registry.runtime}`);
    }

    /**
     * 下载 GGUF 模型（使用 node-llama-cpp 内置下载器或 HTTP 直接下载）
     */
    async _downloadGGUFModel(modelId, registry) {
        this._updateStatus(modelId, MODEL_STATUS.DOWNLOADING, { progress: 0 });

        try {
            // 优先尝试使用 node-llama-cpp 的 resolveModelFile
            if (this._runtimeAvailable['node-llama-cpp']) {
                try {
                    const { resolveModelFile } = await import('node-llama-cpp');
                    console.log(`📥 使用 node-llama-cpp 下载 ${registry.name}...`);

                    const modelPath = await resolveModelFile(
                        registry.hfUri,
                        this.modelsDir,
                        { cli: false }
                    );

                    this._updateStatus(modelId, MODEL_STATUS.DOWNLOADED, { progress: 100 });
                    console.log(`✅ ${registry.name} 下载完成: ${modelPath}`);
                    this.emit('download:complete', { modelId, path: modelPath });
                    return modelPath;
                } catch (err) {
                    console.warn(`⚠️ node-llama-cpp 下载器失败，使用 HTTP 降级下载: ${err.message}`);
                }
            }

            // 降级：使用 HTTP 直接下载
            return await this._httpDownload(modelId, registry);

        } catch (error) {
            this._updateStatus(modelId, MODEL_STATUS.ERROR, { error: error.message });
            this.emit('download:error', { modelId, error: error.message });
            throw error;
        }
    }

    /**
     * HTTP 直接下载（降级方案）
     * 支持进度追踪和断点续传
     */
    async _httpDownload(modelId, registry) {
        return new Promise((resolve, reject) => {
            const filePath = this._getModelPath(modelId);
            const tempPath = filePath + '.tmp';

            console.log(`📥 HTTP 下载 ${registry.name} → ${filePath}`);

            // 检查临时文件（断点续传）
            let downloadedBytes = 0;
            if (fs.existsSync(tempPath)) {
                downloadedBytes = fs.statSync(tempPath).size;
                console.log(`  ⏩ 断点续传，已下载: ${this._formatSize(downloadedBytes)}`);
            }

            const url = new URL(registry.downloadUrl);
            const protocol = url.protocol === 'https:' ? https : http;

            const headers = {};
            if (downloadedBytes > 0) {
                headers['Range'] = `bytes=${downloadedBytes}-`;
            }

            const request = protocol.get(url, { headers }, (response) => {
                // 处理重定向
                if (response.statusCode === 301 || response.statusCode === 302) {
                    const redirectUrl = response.headers.location;
                    console.log(`  🔄 重定向到: ${redirectUrl}`);
                    // 递归处理重定向
                    const redirectRegistry = { ...registry, downloadUrl: redirectUrl };
                    this._httpDownload(modelId, redirectRegistry).then(resolve).catch(reject);
                    return;
                }

                if (response.statusCode !== 200 && response.statusCode !== 206) {
                    reject(new Error(`下载失败: HTTP ${response.statusCode}`));
                    return;
                }

                const totalSize = parseInt(response.headers['content-length'], 10) + downloadedBytes;
                let receivedBytes = downloadedBytes;

                const flags = downloadedBytes > 0 ? 'a' : 'w';
                const fileStream = fs.createWriteStream(tempPath, { flags });

                response.on('data', (chunk) => {
                    receivedBytes += chunk.length;
                    const progress = Math.round((receivedBytes / totalSize) * 100);

                    // 每 5% 更新一次进度
                    const currentProgress = this._modelStates.get(modelId).progress;
                    if (progress - currentProgress >= 5 || progress === 100) {
                        this._updateStatus(modelId, MODEL_STATUS.DOWNLOADING, { progress });
                        this.emit('download:progress', {
                            modelId,
                            progress,
                            receivedBytes,
                            totalSize,
                            receivedDisplay: this._formatSize(receivedBytes),
                            totalDisplay: this._formatSize(totalSize)
                        });
                    }
                });

                response.pipe(fileStream);

                fileStream.on('finish', () => {
                    fileStream.close();
                    // 重命名临时文件为最终文件
                    fs.renameSync(tempPath, filePath);
                    this._updateStatus(modelId, MODEL_STATUS.DOWNLOADED, { progress: 100 });
                    console.log(`✅ ${registry.name} 下载完成: ${filePath}`);
                    this.emit('download:complete', { modelId, path: filePath });
                    resolve(filePath);
                });

                fileStream.on('error', (err) => {
                    fs.unlink(tempPath, () => {}); // 清理临时文件
                    reject(err);
                });
            });

            request.on('error', (err) => {
                reject(new Error(`下载网络错误: ${err.message}`));
            });

            // 超时设置（10分钟）
            request.setTimeout(600_000, () => {
                request.destroy();
                reject(new Error('下载超时'));
            });
        });
    }

    /**
     * 预加载 Transformers.js 模型（触发缓存下载）
     */
    async _preloadTransformersModel(modelId, registry) {
        this._updateStatus(modelId, MODEL_STATUS.DOWNLOADING, { progress: 0 });

        try {
            const { pipeline, env } = await import('@huggingface/transformers');

            // 设置缓存目录到我们的 models 目录
            env.cacheDir = path.join(this.modelsDir, 'cache');

            console.log(`📥 预下载 ${registry.name}...`);

            // 创建 pipeline 会自动下载模型
            const classifier = await pipeline('text-classification', registry.hfModelId, {
                progress_callback: (progress) => {
                    if (progress.status === 'progress' && progress.progress) {
                        const pct = Math.round(progress.progress);
                        this._updateStatus(modelId, MODEL_STATUS.DOWNLOADING, { progress: pct });
                        this.emit('download:progress', {
                            modelId,
                            progress: pct,
                            file: progress.file || ''
                        });
                    }
                }
            });

            // 缓存 pipeline 实例
            this._classifierPipeline = classifier;

            this._updateStatus(modelId, MODEL_STATUS.READY, { progress: 100 });
            console.log(`✅ ${registry.name} 预加载完成`);
            this.emit('download:complete', { modelId });
            return registry.hfModelId;

        } catch (error) {
            this._updateStatus(modelId, MODEL_STATUS.ERROR, { error: error.message });
            this.emit('download:error', { modelId, error: error.message });
            throw error;
        }
    }

    // ============================================================
    // 模型加载/卸载
    // ============================================================

    /**
     * 加载模型到内存
     * @param {string} modelId - 模型 ID
     */
    async loadModel(modelId) {
        const registry = MODEL_REGISTRY[modelId];
        if (!registry) {
            throw new Error(`未知模型: ${modelId}`);
        }

        const state = this._modelStates.get(modelId);
        if (state.status === MODEL_STATUS.READY) {
            console.log(`ℹ️ ${registry.name} 已经加载`);
            return;
        }
        if (state.status === MODEL_STATUS.LOADING) {
            throw new Error(`${registry.name} 正在加载中`);
        }

        this._updateStatus(modelId, MODEL_STATUS.LOADING);

        try {
            if (registry.runtime === 'node-llama-cpp') {
                await this._loadGGUFModel(modelId, registry);
            } else if (registry.runtime === 'transformers.js') {
                await this._loadTransformersModel(modelId, registry);
            }

            this._updateStatus(modelId, MODEL_STATUS.READY, { loadedAt: new Date() });
            console.log(`✅ ${registry.name} 加载完成，可以使用`);
            this.emit('model:loaded', { modelId });

        } catch (error) {
            this._updateStatus(modelId, MODEL_STATUS.ERROR, { error: error.message });
            this.emit('model:error', { modelId, error: error.message });
            throw error;
        }
    }

    /**
     * 加载 GGUF 模型（node-llama-cpp）
     */
    async _loadGGUFModel(modelId, registry) {
        const modelPath = this._getModelPath(modelId);

        if (!fs.existsSync(modelPath)) {
            throw new Error(`模型文件不存在: ${modelPath}，请先下载模型`);
        }

        console.log(`🔄 加载 ${registry.name}...`);

        const { getLlama, LlamaChatSession } = await import('node-llama-cpp');

        // 获取或复用 llama 实例
        if (!this._llamaInstance) {
            this._llamaInstance = await getLlama();
            console.log('  ✅ llama 运行时初始化完成');
        }

        // 加载模型
        this._llamaModel = await this._llamaInstance.loadModel({
            modelPath: modelPath
        });
        console.log(`  ✅ 模型文件加载完成`);

        // 创建上下文（使用适当的上下文大小）
        this._llamaContext = await this._llamaModel.createContext({
            contextSize: Math.min(registry.contextLength, 4096) // 初始使用 4K 上下文节省内存
        });
        console.log('  ✅ 模型上下文创建完成');

        // 分配唯一上下文序列（全局只分配一次，后续复用）
        this._contextSequence = this._llamaContext.getSequence();

        // 创建聊天会话
        this._llamaSession = new LlamaChatSession({
            contextSequence: this._contextSequence
        });
        console.log('  ✅ 聊天会话创建完成');
    }

    /**
     * 加载 Transformers.js 模型
     */
    async _loadTransformersModel(modelId, registry) {
        if (this._classifierPipeline) {
            console.log(`ℹ️ ${registry.name} pipeline 已缓存`);
            return;
        }

        console.log(`🔄 加载 ${registry.name}...`);

        const { pipeline, env } = await import('@huggingface/transformers');

        // 设置缓存目录
        env.cacheDir = path.join(this.modelsDir, 'cache');

        this._classifierPipeline = await pipeline(
            'text-classification',
            registry.hfModelId,
            {
                progress_callback: (progress) => {
                    if (progress.status === 'progress' && progress.progress) {
                        console.log(`  📥 下载中: ${Math.round(progress.progress)}%`);
                    }
                }
            }
        );

        console.log(`  ✅ ${registry.name} pipeline 加载完成`);
    }

    /**
     * 卸载模型，释放内存
     * @param {string} modelId - 模型 ID
     */
    async unloadModel(modelId) {
        const registry = MODEL_REGISTRY[modelId];
        if (!registry) {
            throw new Error(`未知模型: ${modelId}`);
        }

        const state = this._modelStates.get(modelId);
        if (state.status !== MODEL_STATUS.READY) {
            console.log(`ℹ️ ${registry.name} 未加载，无需卸载`);
            return;
        }

        this._updateStatus(modelId, MODEL_STATUS.UNLOADING);

        try {
            if (registry.runtime === 'node-llama-cpp') {
                // 按照正确的顺序释放资源
                if (this._llamaSession) {
                    this._llamaSession = null;
                }
                if (this._contextSequence) {
                    this._contextSequence = null;
                }
                if (this._llamaContext) {
                    await this._llamaContext.dispose?.();
                    this._llamaContext = null;
                }
                if (this._llamaModel) {
                    await this._llamaModel.dispose?.();
                    this._llamaModel = null;
                }
                // 注意：不释放 _llamaInstance，它是轻量的运行时
                console.log(`✅ ${registry.name} 已卸载`);

            } else if (registry.runtime === 'transformers.js') {
                if (this._classifierPipeline) {
                    await this._classifierPipeline.dispose?.();
                    this._classifierPipeline = null;
                }
                console.log(`✅ ${registry.name} 已卸载`);
            }

            // 重置状态为"已下载"（文件还在）
            const modelPath = this._getModelPath(modelId);
            const isDownloaded = registry.runtime === 'transformers.js' || fs.existsSync(modelPath);
            this._updateStatus(modelId, isDownloaded ? MODEL_STATUS.DOWNLOADED : MODEL_STATUS.NOT_DOWNLOADED);
            this.emit('model:unloaded', { modelId });

        } catch (error) {
            this._updateStatus(modelId, MODEL_STATUS.ERROR, { error: error.message });
            throw error;
        }
    }

    /**
     * 删除模型文件
     * @param {string} modelId - 模型 ID
     */
    async deleteModel(modelId) {
        const registry = MODEL_REGISTRY[modelId];
        if (!registry) {
            throw new Error(`未知模型: ${modelId}`);
        }

        // 如果已加载，先卸载
        const state = this._modelStates.get(modelId);
        if (state.status === MODEL_STATUS.READY) {
            await this.unloadModel(modelId);
        }

        if (registry.runtime === 'node-llama-cpp') {
            const modelPath = this._getModelPath(modelId);
            if (fs.existsSync(modelPath)) {
                fs.unlinkSync(modelPath);
                console.log(`🗑️ 已删除 ${registry.name}: ${modelPath}`);
            }
            // 也删除可能的临时文件
            const tempPath = modelPath + '.tmp';
            if (fs.existsSync(tempPath)) {
                fs.unlinkSync(tempPath);
            }

        } else if (registry.runtime === 'transformers.js') {
            // Transformers.js 缓存目录
            const cacheDir = path.join(this.modelsDir, 'cache');
            if (fs.existsSync(cacheDir)) {
                fs.rmSync(cacheDir, { recursive: true, force: true });
                console.log(`🗑️ 已删除 ${registry.name} 缓存`);
            }
        }

        this._updateStatus(modelId, MODEL_STATUS.NOT_DOWNLOADED);
        this.emit('model:deleted', { modelId });
    }

    // ============================================================
    // 推理接口
    // ============================================================

    /**
     * 文本生成 — 通过 Qwen3-0.6B
     * 
     * @param {string} prompt - 用户输入
     * @param {string} [systemPrompt] - 系统提示词
     * @param {Object} [options] - 生成选项
     * @param {boolean} [options.thinking=false] - 是否启用思考模式
     * @param {number} [options.maxTokens=512] - 最大生成 token 数
     * @param {number} [options.temperature=0.7] - 温度参数
     * @param {Function} [options.onTextChunk] - 流式输出回调
     * @returns {Promise<string>} 生成的文本
     */
    async generate(prompt, systemPrompt = '', options = {}) {
        const modelId = 'qwen3-0.6b';

        if (!this.isAvailable(modelId)) {
            throw new Error('生成模型未加载。请先调用 loadModel("qwen3-0.6b")');
        }

        const {
            thinking = false,
            maxTokens = 512,
            temperature = 0.7,
            onTextChunk = null
        } = options;

        // 构建完整提示词
        let fullPrompt = prompt;
        if (thinking) {
            // Qwen3 思考模式：添加 /think 标记
            fullPrompt = `/think\n${prompt}`;
        } else {
            // 非思考模式：添加 /no_think 标记以获得更快响应
            fullPrompt = `/no_think\n${prompt}`;
        }

        // 记录最后使用时间（空闲自动卸载依赖此值）
        this._lastUsedAt = new Date();

        try {
            // 每次生成前都创建全新的会话（单次生成模式，非多轮对话）
            // 关键修复：复用已分配的 _contextSequence，不再调用 getSequence() 分配新序列
            const { LlamaChatSession } = await import('node-llama-cpp');

            // 清除上一次会话在序列中遗留的 token，释放上下文窗口
            if (this._contextSequence.nextTokenIndex > 0) {
                await this._contextSequence.eraseContextTokenRanges([{
                    start: 0,
                    end: this._contextSequence.nextTokenIndex
                }]);
            }

            this._llamaSession = new LlamaChatSession({
                contextSequence: this._contextSequence,
                ...(systemPrompt ? { systemPrompt } : {})
            });

            const result = await this._llamaSession.prompt(fullPrompt, {
                maxTokens,
                temperature,
                onTextChunk: onTextChunk || undefined
            });

            return result;

        } catch (error) {
            // ── 错误恢复：如果上下文/序列损坏，尝试自动重建 ──
            const isContextError = /sequence|context|disposed/i.test(error.message);
            if (isContextError && this._llamaModel) {
                console.warn('⚠️ 检测到上下文异常，尝试自动重建...');
                try {
                    // 重建上下文和序列
                    if (this._llamaContext) {
                        await this._llamaContext.dispose?.();
                    }
                    const registry = MODEL_REGISTRY[modelId];
                    this._llamaContext = await this._llamaModel.createContext({
                        contextSize: Math.min(registry.contextLength, 4096)
                    });
                    this._contextSequence = this._llamaContext.getSequence();
                    const { LlamaChatSession: LCS } = await import('node-llama-cpp');
                    this._llamaSession = new LCS({
                        contextSequence: this._contextSequence,
                        ...(systemPrompt ? { systemPrompt } : {})
                    });
                    console.log('✅ 上下文重建成功，重新生成...');

                    const retryResult = await this._llamaSession.prompt(fullPrompt, {
                        maxTokens, temperature,
                        onTextChunk: onTextChunk || undefined
                    });
                    return retryResult;
                } catch (retryErr) {
                    console.error(`❌ 重建后生成仍然失败: ${retryErr.message}`);
                    throw new Error(`本地模型生成失败: ${retryErr.message}`);
                }
            }

            console.error(`❌ 生成失败: ${error.message}`);
            throw new Error(`本地模型生成失败: ${error.message}`);
        }
    }

    /**
     * 文本分类 — 通过 Tiny-Toxic-Detector
     * 
     * @param {string} text - 待分类文本
     * @param {string} [task='toxicity'] - 分类任务类型
     * @returns {Promise<Object>} 分类结果 { label, score, details }
     */
    async classify(text, task = 'toxicity') {
        const modelId = 'tiny-toxic-detector';

        if (!this.isAvailable(modelId)) {
            // 尝试按需加载
            try {
                await this.loadModel(modelId);
            } catch (err) {
                throw new Error('分类模型未加载且按需加载失败: ' + err.message);
            }
        }

        // 记录最后使用时间（空闲自动卸载依赖此值）
        this._lastUsedAt = new Date();

        try {
            const results = await this._classifierPipeline(text);

            // 标准化输出格式
            const result = Array.isArray(results) ? results[0] : results;

            return {
                label: result.label,
                score: result.score,
                isToxic: result.label === 'toxic' || result.label === 'LABEL_1',
                confidence: result.score,
                raw: result
            };

        } catch (error) {
            console.error(`❌ 分类失败: ${error.message}`);
            throw new Error(`本地模型分类失败: ${error.message}`);
        }
    }

    // ============================================================
    // 状态查询
    // ============================================================

    /**
     * 获取所有模型的综合状态
     */
    getStatus() {
        const status = {};
        for (const [modelId, state] of this._modelStates.entries()) {
            const registry = MODEL_REGISTRY[modelId];
            status[modelId] = {
                ...registry,
                status: state.status,
                progress: state.progress,
                error: state.error,
                loadedAt: state.loadedAt,
                runtimeAvailable: this._runtimeAvailable[registry.runtime]
            };
        }
        return status;
    }

    /**
     * 获取单个模型的状态
     */
    getModelStatus(modelId) {
        const state = this._modelStates.get(modelId);
        if (!state) return null;

        const registry = MODEL_REGISTRY[modelId];
        return {
            ...registry,
            status: state.status,
            progress: state.progress,
            error: state.error,
            loadedAt: state.loadedAt,
            runtimeAvailable: this._runtimeAvailable[registry.runtime]
        };
    }

    /**
     * 检查模型是否可用（已加载且就绪）
     */
    isAvailable(modelId) {
        const state = this._modelStates.get(modelId);
        return state?.status === MODEL_STATUS.READY;
    }

    /**
     * 检查是否有任何生成模型可用
     */
    isGenerationAvailable() {
        return this.isAvailable('qwen3-0.6b');
    }

    /**
     * 检查是否有安全审查模型可用
     */
    isSafetyAvailable() {
        return this.isAvailable('tiny-toxic-detector');
    }

    /**
     * 获取运行时可用性（含系统信息）
     */
    getRuntimeStatus() {
        const os = require('os');
        return {
            ...this._runtimeAvailable,
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            totalMemory: this._formatSize(os.totalmem()),
            freeMemory: this._formatSize(os.freemem()),
            cpus: os.cpus().length
        };
    }

    /**
     * 获取内存使用估算（返回原始字节值 + 格式化字符串）
     */
    getMemoryUsage() {
        const processMemory = process.memoryUsage();
        const loaded = [];

        for (const [modelId, state] of this._modelStates.entries()) {
            if (state.status === MODEL_STATUS.READY) {
                const registry = MODEL_REGISTRY[modelId];
                loaded.push({
                    id: modelId,
                    name: registry.name,
                    estimatedMemory: registry.type === 'generation'
                        ? '~800 MB (模型 + KV Cache)'  // GGUF 模型运行时内存
                        : '~50 MB (ONNX 运行时)'        // 分类模型运行时内存
                });
            }
        }

        return {
            rss: processMemory.rss,
            heapUsed: processMemory.heapUsed,
            heapTotal: processMemory.heapTotal,
            external: processMemory.external,
            processRSS: this._formatSize(processMemory.rss),
            processHeap: this._formatSize(processMemory.heapUsed),
            loadedModels: loaded,
            totalLoaded: loaded.length
        };
    }

    // ============================================================
    // 内部工具方法
    // ============================================================

    /**
     * 检查运行时引擎是否可用
     */
    async _checkRuntimeAvailability() {
        // 检查 node-llama-cpp
        try {
            await import('node-llama-cpp');
            this._runtimeAvailable['node-llama-cpp'] = true;
            console.log('  ✅ node-llama-cpp 运行时: 可用');
        } catch (err) {
            this._runtimeAvailable['node-llama-cpp'] = false;
            console.log(`  ❌ node-llama-cpp 运行时: 不可用 (${err.message})`);
        }

        // 检查 transformers.js
        try {
            await import('@huggingface/transformers');
            this._runtimeAvailable['transformers.js'] = true;
            console.log('  ✅ @huggingface/transformers 运行时: 可用');
        } catch (err) {
            this._runtimeAvailable['transformers.js'] = false;
            console.log(`  ❌ @huggingface/transformers 运行时: 不可用 (${err.message})`);
        }
    }

    /**
     * 获取模型文件路径
     */
    _getModelPath(modelId) {
        const registry = MODEL_REGISTRY[modelId];
        if (!registry) return null;
        if (registry.fileName) {
            return path.join(this.modelsDir, registry.fileName);
        }
        return null;
    }

    /**
     * 在 models 目录中查找与指定模型兼容的文件（支持灵活文件名）
     * @param {string} modelId - 模型 ID
     * @returns {string|null} 找到的文件路径，或 null
     */
    _findCompatibleFile(modelId) {
        const patterns = MODEL_FILE_PATTERNS[modelId];
        if (!patterns || !patterns.patterns || !fs.existsSync(this.modelsDir)) {
            return null;
        }

        const files = fs.readdirSync(this.modelsDir);
        for (const fileName of files) {
            // 跳过标准文件名（已在主检测逻辑中处理）
            if (patterns.exactName && fileName === patterns.exactName) {
                continue;
            }

            for (const pattern of patterns.patterns) {
                if (pattern.test(fileName)) {
                    const filePath = path.join(this.modelsDir, fileName);
                    const stat = fs.statSync(filePath);
                    if (stat.isFile() && stat.size >= (patterns.minSize || 0)) {
                        return filePath;
                    }
                }
            }
        }

        return null;
    }

    /**
     * 更新模型状态
     */
    _updateStatus(modelId, status, extra = {}) {
        const state = this._modelStates.get(modelId);
        if (state) {
            state.status = status;
            if (extra.progress !== undefined) state.progress = extra.progress;
            if (extra.error !== undefined) state.error = extra.error;
            if (extra.loadedAt !== undefined) state.loadedAt = extra.loadedAt;
            if (extra.instance !== undefined) state.instance = extra.instance;

            // 发出状态变更事件
            this.emit('status:change', {
                modelId,
                status,
                ...extra
            });
        }
    }

    /**
     * 格式化文件大小
     */
    _formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i];
    }

    // ============================================================
    // 空闲自动卸载
    // ============================================================

    /**
     * 设置空闲自动卸载超时时间
     * @param {number} minutes - 超时分钟数（0 = 禁用）
     */
    setIdleTimeout(minutes) {
        this._idleTimeoutMs = minutes > 0 ? minutes * 60 * 1000 : 0;
        console.log(`⏱️ 空闲自动卸载: ${minutes > 0 ? minutes + ' 分钟' : '已禁用'}`);
        // 如果正在运行，重新启动定时器以应用新间隔
        if (this._idleCheckTimer) {
            this.stopIdleCheck();
            if (this._idleTimeoutMs > 0) this.startIdleCheck();
        }
    }

    /**
     * 获取当前空闲超时设置（分钟）
     */
    getIdleTimeout() {
        return this._idleTimeoutMs / 60 / 1000;
    }

    /**
     * 启动空闲检查定时器（每 5 分钟检查一次）
     */
    startIdleCheck() {
        if (this._idleCheckTimer) return; // 已在运行
        if (this._idleTimeoutMs <= 0) return; // 已禁用

        const checkIntervalMs = Math.min(5 * 60 * 1000, this._idleTimeoutMs / 2);
        this._idleCheckTimer = setInterval(() => this._performIdleCheck(), checkIntervalMs);

        // 避免定时器阻止 Node.js 进程退出
        if (this._idleCheckTimer.unref) {
            this._idleCheckTimer.unref();
        }

        console.log('⏱️ 空闲自动卸载定时器已启动');
    }

    /**
     * 停止空闲检查定时器
     */
    stopIdleCheck() {
        if (this._idleCheckTimer) {
            clearInterval(this._idleCheckTimer);
            this._idleCheckTimer = null;
            console.log('⏱️ 空闲自动卸载定时器已停止');
        }
    }

    /**
     * 执行一次空闲检查（内部方法）
     */
    async _performIdleCheck() {
        if (!this._lastUsedAt || this._idleTimeoutMs <= 0) return;

        const idleMs = Date.now() - this._lastUsedAt.getTime();
        if (idleMs < this._idleTimeoutMs) return;

        // 查找所有已加载的模型
        const loadedModels = [];
        for (const [modelId, state] of this._modelStates.entries()) {
            if (state.status === MODEL_STATUS.READY) {
                loadedModels.push(modelId);
            }
        }

        if (loadedModels.length === 0) return;

        console.log(`⏱️ 模型空闲超过 ${Math.round(idleMs / 60000)} 分钟，自动卸载...`);
        for (const modelId of loadedModels) {
            try {
                await this.unloadModel(modelId);
                console.log(`  ✅ 已自动卸载: ${modelId}`);
                this.emit('model:idle-unload', { modelId, idleMinutes: Math.round(idleMs / 60000) });
            } catch (err) {
                console.error(`  ⚠️ 自动卸载失败: ${modelId} - ${err.message}`);
            }
        }
        this._lastUsedAt = null;
    }

    /**
     * 优雅关闭 — 卸载所有模型
     */
    async shutdown() {
        console.log('🔄 LocalModelManager 关闭中...');

        // 停止空闲检查定时器
        this.stopIdleCheck();

        for (const [modelId, state] of this._modelStates.entries()) {
            if (state.status === MODEL_STATUS.READY) {
                try {
                    await this.unloadModel(modelId);
                } catch (err) {
                    console.error(`  ⚠️ 卸载 ${modelId} 失败: ${err.message}`);
                }
            }
        }

        if (this._llamaInstance) {
            this._llamaInstance = null;
        }

        console.log('✅ LocalModelManager 已关闭');
    }
}

// 导出单例
module.exports = new LocalModelManager();

// 同时导出类和常量（用于测试）
module.exports.LocalModelManager = LocalModelManager;
module.exports.MODEL_REGISTRY = MODEL_REGISTRY;
module.exports.MODEL_STATUS = MODEL_STATUS;
module.exports.MODEL_FILE_PATTERNS = MODEL_FILE_PATTERNS;
