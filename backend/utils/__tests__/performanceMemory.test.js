/**
 * Phase 17 — 性能与内存优化测试
 *
 * 覆盖范围：
 * 1. 空闲自动卸载机制
 * 2. 错误恢复（上下文重建）
 * 3. 内存信息格式与完整性
 * 4. 多次生成/分类的稳定性
 * 5. 状态变更事件正确性
 */

const EventEmitter = require('events');

// ============================================================
// 直接导入 LocalModelManager 类（非单例），方便独立测试
// ============================================================

// 我们需要 mock node-llama-cpp 和 transformers 以避免真实加载
// 但 LocalModelManager 在构造函数中不会 import 它们，所以只需
// mock fs 中的文件检测部分

// 由于 localModelManager.js 导出的是单例，我们用类来单独构建实例
jest.mock('fs', () => {
    const originalFs = jest.requireActual('fs');
    return {
        ...originalFs,
        existsSync: jest.fn((p) => {
            // models 目录存在
            if (p.includes('models')) return true;
            return originalFs.existsSync(p);
        }),
        mkdirSync: jest.fn(),
        readdirSync: jest.fn(() => []),
        statSync: jest.fn(() => ({ isFile: () => true, size: 500000000 })),
        unlinkSync: jest.fn(),
        renameSync: jest.fn(),
        rmSync: jest.fn(),
    };
});

// 获取类和常量
const { LocalModelManager, MODEL_REGISTRY, MODEL_STATUS } = require('../../services/localModelManager');

describe('Phase 17 — 性能与内存优化测试', () => {

    // ================================================================
    // 1. 空闲自动卸载
    // ================================================================

    describe('1. 空闲自动卸载', () => {
        let manager;

        beforeEach(() => {
            manager = new LocalModelManager();
            jest.useFakeTimers();
        });

        afterEach(() => {
            manager.stopIdleCheck();
            jest.useRealTimers();
        });

        test('setIdleTimeout 设置超时时间（分钟）', () => {
            manager.setIdleTimeout(15);
            expect(manager.getIdleTimeout()).toBe(15);
        });

        test('setIdleTimeout(0) 禁用自动卸载', () => {
            manager.setIdleTimeout(0);
            expect(manager.getIdleTimeout()).toBe(0);
            expect(manager._idleTimeoutMs).toBe(0);
        });

        test('startIdleCheck 启动定时器', () => {
            manager.setIdleTimeout(10);
            manager.startIdleCheck();
            expect(manager._idleCheckTimer).not.toBeNull();
        });

        test('重复调用 startIdleCheck 不会创建多个定时器', () => {
            manager.setIdleTimeout(10);
            manager.startIdleCheck();
            const timer1 = manager._idleCheckTimer;
            manager.startIdleCheck();
            expect(manager._idleCheckTimer).toBe(timer1);
        });

        test('stopIdleCheck 停止定时器', () => {
            manager.setIdleTimeout(10);
            manager.startIdleCheck();
            expect(manager._idleCheckTimer).not.toBeNull();
            manager.stopIdleCheck();
            expect(manager._idleCheckTimer).toBeNull();
        });

        test('超时为 0 时 startIdleCheck 不启动', () => {
            manager.setIdleTimeout(0);
            manager.startIdleCheck();
            expect(manager._idleCheckTimer).toBeNull();
        });

        test('_performIdleCheck 在未使用时不做任何操作', async () => {
            manager._lastUsedAt = null;
            manager._idleTimeoutMs = 10 * 60 * 1000;
            await manager._performIdleCheck();
            // 不应抛错
        });

        test('_performIdleCheck 超时时卸载已加载模型', async () => {
            // 模拟 qwen3-0.6b 已加载
            manager._modelStates.get('qwen3-0.6b').status = MODEL_STATUS.READY;
            manager._lastUsedAt = new Date(Date.now() - 31 * 60 * 1000); // 31 分钟前
            manager._idleTimeoutMs = 30 * 60 * 1000;

            // mock unloadModel
            manager.unloadModel = jest.fn(async (id) => {
                manager._modelStates.get(id).status = MODEL_STATUS.DOWNLOADED;
            });

            const events = [];
            manager.on('model:idle-unload', (e) => events.push(e));

            await manager._performIdleCheck();

            expect(manager.unloadModel).toHaveBeenCalledWith('qwen3-0.6b');
            expect(events.length).toBe(1);
            expect(events[0].modelId).toBe('qwen3-0.6b');
            expect(manager._lastUsedAt).toBeNull();
        });

        test('_performIdleCheck 未超时时不卸载', async () => {
            manager._modelStates.get('qwen3-0.6b').status = MODEL_STATUS.READY;
            manager._lastUsedAt = new Date(Date.now() - 5 * 60 * 1000); // 5 分钟前
            manager._idleTimeoutMs = 30 * 60 * 1000;

            manager.unloadModel = jest.fn();

            await manager._performIdleCheck();

            expect(manager.unloadModel).not.toHaveBeenCalled();
        });

        test('setIdleTimeout 变更后重启定时器', () => {
            manager.setIdleTimeout(10);
            manager.startIdleCheck();
            const timer1 = manager._idleCheckTimer;

            manager.setIdleTimeout(20);
            // 应该停止旧定时器并启动新的
            expect(manager._idleCheckTimer).not.toBe(timer1);
            expect(manager._idleCheckTimer).not.toBeNull();
        });

        test('没有加载模型时 _performIdleCheck 跳过', async () => {
            manager._lastUsedAt = new Date(Date.now() - 60 * 60 * 1000);
            manager._idleTimeoutMs = 30 * 60 * 1000;
            // 所有模型状态为 NOT_DOWNLOADED
            manager.unloadModel = jest.fn();

            await manager._performIdleCheck();

            expect(manager.unloadModel).not.toHaveBeenCalled();
        });
    });

    // ================================================================
    // 2. 错误恢复逻辑（generate 方法）
    // ================================================================

    describe('2. 错误恢复逻辑', () => {
        let manager;

        beforeEach(() => {
            manager = new LocalModelManager();
        });

        test('generate 在模型未加载时应抛出明确错误', async () => {
            await expect(manager.generate('test'))
                .rejects
                .toThrow('生成模型未加载');
        });

        test('classify 在模型未加载且按需加载失败时应抛出', async () => {
            // mock loadModel 失败
            manager.loadModel = jest.fn().mockRejectedValue(new Error('fetch failed'));
            await expect(manager.classify('test'))
                .rejects
                .toThrow('分类模型未加载且按需加载失败');
        });

        test('generate 记录 _lastUsedAt 时间戳', () => {
            // 模拟已加载状态
            manager._modelStates.get('qwen3-0.6b').status = MODEL_STATUS.READY;
            manager._contextSequence = {
                nextTokenIndex: 0,
                eraseContextTokenRanges: jest.fn()
            };

            // mock import — 会在 try 内失败但 _lastUsedAt 已设置
            expect(manager._lastUsedAt).toBeNull();

            // 由于 dynamic import 我们无法轻松 mock，但可以检查时间戳设置
            // 调用 generate 会因为 dynamic import 失败，但 _lastUsedAt 已在 try 之前设置
            manager.generate('test').catch(() => {}); // ignore error
            expect(manager._lastUsedAt).toBeInstanceOf(Date);
        });
    });

    // ================================================================
    // 3. 内存信息
    // ================================================================

    describe('3. 内存信息格式与完整性', () => {
        let manager;

        beforeEach(() => {
            manager = new LocalModelManager();
        });

        test('getMemoryUsage 返回必需字段', () => {
            const mem = manager.getMemoryUsage();
            expect(mem).toHaveProperty('rss');
            expect(mem).toHaveProperty('heapUsed');
            expect(mem).toHaveProperty('heapTotal');
            expect(mem).toHaveProperty('external');
            expect(mem).toHaveProperty('processRSS');
            expect(mem).toHaveProperty('processHeap');
            expect(mem).toHaveProperty('loadedModels');
            expect(mem).toHaveProperty('totalLoaded');
        });

        test('没有加载模型时 totalLoaded 为 0', () => {
            const mem = manager.getMemoryUsage();
            expect(mem.totalLoaded).toBe(0);
            expect(mem.loadedModels).toEqual([]);
        });

        test('加载模型后 totalLoaded 增加', () => {
            manager._modelStates.get('qwen3-0.6b').status = MODEL_STATUS.READY;
            const mem = manager.getMemoryUsage();
            expect(mem.totalLoaded).toBe(1);
            expect(mem.loadedModels[0].id).toBe('qwen3-0.6b');
        });

        test('processRSS 和 processHeap 为格式化字符串', () => {
            const mem = manager.getMemoryUsage();
            expect(typeof mem.processRSS).toBe('string');
            expect(typeof mem.processHeap).toBe('string');
            // 应包含单位
            expect(mem.processRSS).toMatch(/[BKM]B?/i);
        });
    });

    // ================================================================
    // 4. 状态管理
    // ================================================================

    describe('4. 状态管理', () => {
        let manager;

        beforeEach(() => {
            manager = new LocalModelManager();
        });

        test('getStatus 返回所有注册模型', () => {
            const status = manager.getStatus();
            expect(Object.keys(status)).toContain('qwen3-0.6b');
            expect(Object.keys(status)).toContain('tiny-toxic-detector');
        });

        test('getModelStatus 返回单个模型信息', () => {
            const status = manager.getModelStatus('qwen3-0.6b');
            expect(status).not.toBeNull();
            expect(status.id).toBe('qwen3-0.6b');
            expect(status.status).toBe(MODEL_STATUS.NOT_DOWNLOADED);
        });

        test('getModelStatus 对未知模型返回 null', () => {
            expect(manager.getModelStatus('nonexistent')).toBeNull();
        });

        test('_updateStatus 发出 status:change 事件', (done) => {
            manager.on('status:change', (event) => {
                expect(event.modelId).toBe('qwen3-0.6b');
                expect(event.status).toBe(MODEL_STATUS.DOWNLOADING);
                done();
            });
            manager._updateStatus('qwen3-0.6b', MODEL_STATUS.DOWNLOADING);
        });

        test('isAvailable 在模型就绪时返回 true', () => {
            expect(manager.isAvailable('qwen3-0.6b')).toBe(false);
            manager._modelStates.get('qwen3-0.6b').status = MODEL_STATUS.READY;
            expect(manager.isAvailable('qwen3-0.6b')).toBe(true);
        });

        test('isGenerationAvailable 依赖 qwen3-0.6b 状态', () => {
            expect(manager.isGenerationAvailable()).toBe(false);
            manager._modelStates.get('qwen3-0.6b').status = MODEL_STATUS.READY;
            expect(manager.isGenerationAvailable()).toBe(true);
        });

        test('isSafetyAvailable 依赖 tiny-toxic-detector 状态', () => {
            expect(manager.isSafetyAvailable()).toBe(false);
            manager._modelStates.get('tiny-toxic-detector').status = MODEL_STATUS.READY;
            expect(manager.isSafetyAvailable()).toBe(true);
        });
    });

    // ================================================================
    // 5. 注册表
    // ================================================================

    describe('5. 模型注册表', () => {
        test('MODEL_REGISTRY 包含预期的模型', () => {
            expect(MODEL_REGISTRY['qwen3-0.6b']).toBeDefined();
            expect(MODEL_REGISTRY['tiny-toxic-detector']).toBeDefined();
        });

        test('qwen3-0.6b 是生成模型', () => {
            expect(MODEL_REGISTRY['qwen3-0.6b'].type).toBe('generation');
            expect(MODEL_REGISTRY['qwen3-0.6b'].runtime).toBe('node-llama-cpp');
        });

        test('tiny-toxic-detector 是分类模型', () => {
            expect(MODEL_REGISTRY['tiny-toxic-detector'].type).toBe('classification');
            expect(MODEL_REGISTRY['tiny-toxic-detector'].runtime).toBe('transformers.js');
        });

        test('每个注册模型都有必需字段', () => {
            for (const [id, reg] of Object.entries(MODEL_REGISTRY)) {
                expect(reg.id).toBe(id);
                expect(reg.name).toBeTruthy();
                expect(reg.type).toBeTruthy();
                expect(reg.runtime).toBeTruthy();
                expect(reg.format).toBeTruthy();
                expect(reg.sizeDisplay).toBeTruthy();
                expect(reg.license).toBeTruthy();
                expect(Array.isArray(reg.capabilities)).toBe(true);
            }
        });

        test('getRegistry 返回完整注册表', () => {
            const manager = new LocalModelManager();
            const reg = manager.getRegistry();
            expect(Object.keys(reg).length).toBe(Object.keys(MODEL_REGISTRY).length);
        });
    });

    // ================================================================
    // 6. 工具方法
    // ================================================================

    describe('6. 工具方法', () => {
        let manager;

        beforeEach(() => {
            manager = new LocalModelManager();
        });

        test('_formatSize 格式化字节', () => {
            expect(manager._formatSize(0)).toBe('0 B');
            expect(manager._formatSize(1024)).toBe('1.0 KB');
            expect(manager._formatSize(1024 * 1024)).toBe('1.0 MB');
            expect(manager._formatSize(1024 * 1024 * 1024)).toBe('1.0 GB');
        });

        test('_getModelPath 返回正确路径', () => {
            const p = manager._getModelPath('qwen3-0.6b');
            expect(p).toContain('models');
            expect(p).toContain('qwen3-0.6b-q4_k_m.gguf');
        });

        test('_getModelPath 对未知模型返回 null', () => {
            expect(manager._getModelPath('nonexistent')).toBeNull();
        });
    });

    // ================================================================
    // 7. 生命周期
    // ================================================================

    describe('7. 生命周期管理', () => {
        let manager;

        beforeEach(() => {
            manager = new LocalModelManager();
        });

        test('shutdown 卸载所有已加载模型', async () => {
            manager._modelStates.get('qwen3-0.6b').status = MODEL_STATUS.READY;
            manager.unloadModel = jest.fn(async (id) => {
                manager._modelStates.get(id).status = MODEL_STATUS.DOWNLOADED;
            });

            await manager.shutdown();

            expect(manager.unloadModel).toHaveBeenCalledWith('qwen3-0.6b');
        });

        test('shutdown 停止空闲检查定时器', async () => {
            manager.setIdleTimeout(10);
            manager.startIdleCheck();
            expect(manager._idleCheckTimer).not.toBeNull();

            manager.unloadModel = jest.fn(async () => {});
            await manager.shutdown();

            expect(manager._idleCheckTimer).toBeNull();
        });

        test('unloadModel 对未知模型抛出错误', async () => {
            await expect(manager.unloadModel('nonexistent'))
                .rejects.toThrow('未知模型');
        });
    });
});
