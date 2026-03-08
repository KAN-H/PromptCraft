/**
 * LocalModelManager 单元测试
 * 
 * Phase 13 - v5.0
 * 
 * 测试策略：
 * - 不依赖实际模型文件或运行时（mock 所有外部依赖）
 * - 测试核心逻辑：注册表、状态管理、生命周期
 * - 边界条件和错误处理
 */

const path = require('path');
const fs = require('fs');

// 先保存原始模块，以便 mock
let LocalModelManager, MODEL_REGISTRY, MODEL_STATUS;

beforeAll(() => {
    // 引入模块（在 mock 之前）
    const mod = require('../../services/localModelManager');
    // 使用类创建新实例以隔离测试
    LocalModelManager = mod.LocalModelManager;
    MODEL_REGISTRY = mod.MODEL_REGISTRY;
    MODEL_STATUS = mod.MODEL_STATUS;
});

describe('MODEL_REGISTRY', () => {
    test('应包含 qwen3-0.6b 模型定义', () => {
        expect(MODEL_REGISTRY['qwen3-0.6b']).toBeDefined();
        expect(MODEL_REGISTRY['qwen3-0.6b'].type).toBe('generation');
        expect(MODEL_REGISTRY['qwen3-0.6b'].runtime).toBe('node-llama-cpp');
        expect(MODEL_REGISTRY['qwen3-0.6b'].format).toBe('gguf');
    });

    test('应包含 tiny-toxic-detector 模型定义', () => {
        expect(MODEL_REGISTRY['tiny-toxic-detector']).toBeDefined();
        expect(MODEL_REGISTRY['tiny-toxic-detector'].type).toBe('classification');
        expect(MODEL_REGISTRY['tiny-toxic-detector'].runtime).toBe('transformers.js');
        expect(MODEL_REGISTRY['tiny-toxic-detector'].format).toBe('onnx');
    });

    test('所有模型都有必要字段', () => {
        for (const [id, model] of Object.entries(MODEL_REGISTRY)) {
            expect(model.id).toBe(id);
            expect(model.name).toBeTruthy();
            expect(model.description).toBeTruthy();
            expect(model.type).toMatch(/^(generation|classification)$/);
            expect(model.runtime).toMatch(/^(node-llama-cpp|transformers\.js)$/);
            expect(model.sizeBytes).toBeGreaterThan(0);
            expect(model.license).toBeTruthy();
            expect(model.capabilities).toBeInstanceOf(Array);
            expect(model.capabilities.length).toBeGreaterThan(0);
        }
    });

    test('总模型大小应小于 800MB', () => {
        const totalSize = Object.values(MODEL_REGISTRY)
            .reduce((sum, m) => sum + m.sizeBytes, 0);
        const maxSize = 800 * 1024 * 1024; // 800 MB
        expect(totalSize).toBeLessThan(maxSize);
    });
});

describe('MODEL_STATUS', () => {
    test('应包含所有预期状态', () => {
        expect(MODEL_STATUS.NOT_DOWNLOADED).toBe('not_downloaded');
        expect(MODEL_STATUS.DOWNLOADING).toBe('downloading');
        expect(MODEL_STATUS.DOWNLOADED).toBe('downloaded');
        expect(MODEL_STATUS.LOADING).toBe('loading');
        expect(MODEL_STATUS.READY).toBe('ready');
        expect(MODEL_STATUS.UNLOADING).toBe('unloading');
        expect(MODEL_STATUS.ERROR).toBe('error');
    });
});

describe('LocalModelManager', () => {
    let manager;

    beforeEach(() => {
        manager = new LocalModelManager();
    });

    // ===== 构造函数 =====

    describe('constructor', () => {
        test('应初始化模型存储目录', () => {
            expect(manager.modelsDir).toContain('models');
        });

        test('应为所有注册模型创建初始状态', () => {
            for (const modelId of Object.keys(MODEL_REGISTRY)) {
                const state = manager._modelStates.get(modelId);
                expect(state).toBeDefined();
                expect(state.status).toBe(MODEL_STATUS.NOT_DOWNLOADED);
                expect(state.progress).toBe(0);
                expect(state.error).toBeNull();
            }
        });

        test('运行时引擎初始应为 null（未检测）', () => {
            expect(manager._runtimeAvailable['node-llama-cpp']).toBeNull();
            expect(manager._runtimeAvailable['transformers.js']).toBeNull();
        });
    });

    // ===== 注册表 =====

    describe('getRegistry', () => {
        test('应返回完整的注册表副本', () => {
            const registry = manager.getRegistry();
            expect(Object.keys(registry)).toEqual(Object.keys(MODEL_REGISTRY));
        });

        test('返回的应是副本，不影响原始数据', () => {
            const registry = manager.getRegistry();
            registry['test-model'] = { fake: true };
            expect(MODEL_REGISTRY['test-model']).toBeUndefined();
        });
    });

    describe('getModelInfo', () => {
        test('应返回已知模型的信息', () => {
            const info = manager.getModelInfo('qwen3-0.6b');
            expect(info).toBeDefined();
            expect(info.name).toBe('Qwen3-0.6B');
        });

        test('未知模型应返回 null', () => {
            const info = manager.getModelInfo('nonexistent');
            expect(info).toBeNull();
        });
    });

    // ===== 状态管理 =====

    describe('getStatus', () => {
        test('应返回所有模型的综合状态', () => {
            const status = manager.getStatus();
            expect(Object.keys(status).length).toBe(Object.keys(MODEL_REGISTRY).length);

            for (const modelId of Object.keys(MODEL_REGISTRY)) {
                expect(status[modelId]).toBeDefined();
                expect(status[modelId].status).toBe(MODEL_STATUS.NOT_DOWNLOADED);
                expect(status[modelId].name).toBeTruthy();
            }
        });
    });

    describe('getModelStatus', () => {
        test('应返回单个模型的状态', () => {
            const status = manager.getModelStatus('qwen3-0.6b');
            expect(status).toBeDefined();
            expect(status.status).toBe(MODEL_STATUS.NOT_DOWNLOADED);
            expect(status.name).toBe('Qwen3-0.6B');
        });

        test('未知模型应返回 null', () => {
            expect(manager.getModelStatus('nonexistent')).toBeNull();
        });
    });

    describe('isAvailable', () => {
        test('未加载的模型应返回 false', () => {
            expect(manager.isAvailable('qwen3-0.6b')).toBe(false);
        });

        test('加载后应返回 true', () => {
            manager._updateStatus('qwen3-0.6b', MODEL_STATUS.READY);
            expect(manager.isAvailable('qwen3-0.6b')).toBe(true);
        });

        test('未知模型应返回 false', () => {
            expect(manager.isAvailable('nonexistent')).toBe(false);
        });
    });

    describe('isGenerationAvailable', () => {
        test('默认应返回 false', () => {
            expect(manager.isGenerationAvailable()).toBe(false);
        });

        test('qwen3-0.6b 加载后应返回 true', () => {
            manager._updateStatus('qwen3-0.6b', MODEL_STATUS.READY);
            expect(manager.isGenerationAvailable()).toBe(true);
        });
    });

    describe('isSafetyAvailable', () => {
        test('默认应返回 false', () => {
            expect(manager.isSafetyAvailable()).toBe(false);
        });

        test('tiny-toxic-detector 加载后应返回 true', () => {
            manager._updateStatus('tiny-toxic-detector', MODEL_STATUS.READY);
            expect(manager.isSafetyAvailable()).toBe(true);
        });
    });

    // ===== 状态更新 =====

    describe('_updateStatus', () => {
        test('应正确更新模型状态', () => {
            manager._updateStatus('qwen3-0.6b', MODEL_STATUS.DOWNLOADING, { progress: 50 });
            const state = manager._modelStates.get('qwen3-0.6b');
            expect(state.status).toBe(MODEL_STATUS.DOWNLOADING);
            expect(state.progress).toBe(50);
        });

        test('应发出 status:change 事件', () => {
            const callback = jest.fn();
            manager.on('status:change', callback);

            manager._updateStatus('qwen3-0.6b', MODEL_STATUS.DOWNLOADED);

            expect(callback).toHaveBeenCalledWith(
                expect.objectContaining({
                    modelId: 'qwen3-0.6b',
                    status: MODEL_STATUS.DOWNLOADED
                })
            );
        });
    });

    // ===== 文件路径 =====

    describe('_getModelPath', () => {
        test('应返回 GGUF 模型的正确路径', () => {
            const modelPath = manager._getModelPath('qwen3-0.6b');
            expect(modelPath).toContain('models');
            expect(modelPath).toContain('qwen3-0.6b-q4_k_m.gguf');
        });

        test('未知模型应返回 null', () => {
            expect(manager._getModelPath('nonexistent')).toBeNull();
        });
    });

    // ===== 工具方法 =====

    describe('_formatSize', () => {
        test('应正确格式化字节', () => {
            expect(manager._formatSize(0)).toBe('0 B');
            expect(manager._formatSize(1024)).toBe('1.0 KB');
            expect(manager._formatSize(1024 * 1024)).toBe('1.0 MB');
            expect(manager._formatSize(1024 * 1024 * 462)).toBe('462.0 MB');
        });
    });

    // ===== 内存使用 =====

    describe('getMemoryUsage', () => {
        test('应返回内存信息结构', () => {
            const memory = manager.getMemoryUsage();
            expect(memory).toHaveProperty('processRSS');
            expect(memory).toHaveProperty('processHeap');
            expect(memory).toHaveProperty('loadedModels');
            expect(memory).toHaveProperty('totalLoaded');
            expect(memory.totalLoaded).toBe(0);
        });

        test('加载模型后应在列表中显示', () => {
            manager._updateStatus('qwen3-0.6b', MODEL_STATUS.READY);
            const memory = manager.getMemoryUsage();
            expect(memory.totalLoaded).toBe(1);
            expect(memory.loadedModels[0].id).toBe('qwen3-0.6b');
        });
    });

    // ===== 运行时状态 =====

    describe('getRuntimeStatus', () => {
        test('应返回运行时状态', () => {
            const status = manager.getRuntimeStatus();
            expect('node-llama-cpp' in status).toBe(true);
            expect('transformers.js' in status).toBe(true);
        });
    });

    // ===== 下载验证 =====

    describe('downloadModel', () => {
        test('未知模型应抛出错误', async () => {
            await expect(manager.downloadModel('nonexistent'))
                .rejects.toThrow('未知模型');
        });

        test('正在下载中的模型应抛出错误', async () => {
            manager._updateStatus('qwen3-0.6b', MODEL_STATUS.DOWNLOADING);
            await expect(manager.downloadModel('qwen3-0.6b'))
                .rejects.toThrow('正在下载中');
        });

        test('已加载的模型应抛出错误', async () => {
            manager._updateStatus('qwen3-0.6b', MODEL_STATUS.READY);
            await expect(manager.downloadModel('qwen3-0.6b'))
                .rejects.toThrow('已加载');
        });
    });

    // ===== 加载验证 =====

    describe('loadModel', () => {
        test('未知模型应抛出错误', async () => {
            await expect(manager.loadModel('nonexistent'))
                .rejects.toThrow('未知模型');
        });

        test('正在加载中的模型应抛出错误', async () => {
            manager._updateStatus('qwen3-0.6b', MODEL_STATUS.LOADING);
            await expect(manager.loadModel('qwen3-0.6b'))
                .rejects.toThrow('正在加载中');
        });

        test('已加载的模型不应重复加载', async () => {
            manager._updateStatus('qwen3-0.6b', MODEL_STATUS.READY);
            // 不应抛出错误，只是 log
            await manager.loadModel('qwen3-0.6b');
        });
    });

    // ===== 卸载验证 =====

    describe('unloadModel', () => {
        test('未知模型应抛出错误', async () => {
            await expect(manager.unloadModel('nonexistent'))
                .rejects.toThrow('未知模型');
        });

        test('未加载的模型不应报错', async () => {
            // 不应抛出错误
            await manager.unloadModel('qwen3-0.6b');
        });
    });

    // ===== 删除验证 =====

    describe('deleteModel', () => {
        test('未知模型应抛出错误', async () => {
            await expect(manager.deleteModel('nonexistent'))
                .rejects.toThrow('未知模型');
        });
    });

    // ===== 推理验证 =====

    describe('generate', () => {
        test('模型未加载时应抛出错误', async () => {
            await expect(manager.generate('test'))
                .rejects.toThrow('生成模型未加载');
        });
    });

    describe('classify', () => {
        test('模型未加载且按需加载失败时应抛出错误', async () => {
            // Mock _loadTransformersModel to fail
            manager._runtimeAvailable['transformers.js'] = false;
            await expect(manager.classify('test'))
                .rejects.toThrow();
        });
    });

    // ===== 事件系统 =====

    describe('事件发射', () => {
        test('状态变更应发射事件', (done) => {
            manager.on('status:change', (data) => {
                expect(data.modelId).toBe('qwen3-0.6b');
                expect(data.status).toBe(MODEL_STATUS.DOWNLOADED);
                done();
            });
            manager._updateStatus('qwen3-0.6b', MODEL_STATUS.DOWNLOADED);
        });
    });

    // ===== 关闭 =====

    describe('shutdown', () => {
        test('应成功关闭（无已加载模型）', async () => {
            await expect(manager.shutdown()).resolves.toBeUndefined();
        });
    });
});
