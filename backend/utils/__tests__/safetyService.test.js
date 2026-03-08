/**
 * SafetyService 单元测试
 * 
 * Phase 14 — v5.0
 */

// Mock localModelManager
jest.mock('../../services/localModelManager', () => ({
    classify: jest.fn(),
    generate: jest.fn(),
    isAvailable: jest.fn(),
    loadModel: jest.fn()
}));

const localModelManager = require('../../services/localModelManager');
const safetyService = require('../../services/safetyService');
const { SAFETY_ACTION } = require('../../services/safetyService');

describe('SafetyService', () => {

    beforeAll(() => {
        // 阻止测试中的 updateConfig 修改真实配置文件
        jest.spyOn(safetyService, '_saveConfig').mockImplementation(() => {});
        safetyService.initialize();
    });

    afterEach(() => {
        jest.clearAllMocks();
        // 恢复 _saveConfig mock（因为 clearAllMocks 会清除它）
        jest.spyOn(safetyService, '_saveConfig').mockImplementation(() => {});
        // 重新加载原始配置并重新编译
        safetyService._loadConfig();
        safetyService._compilePatterns();
        safetyService.resetStats();
        safetyService._rateLimitWindow = [];
    });

    // 初始化
    describe('初始化', () => {
        test('应正确加载配置', () => {
            expect(safetyService.config).toBeDefined();
            expect(safetyService.config.enabled).toBe(true);
            expect(safetyService.config.blockedKeywords.length).toBeGreaterThanOrEqual(9);
        });

        test('应编译关键词正则', () => {
            expect(safetyService._blockedKeywordsRegex).toBeInstanceOf(RegExp);
        });

        test('应编译设计安全词正则', () => {
            expect(safetyService._designSafeRegex).toBeInstanceOf(RegExp);
        });

        test('应编译阻止模式正则', () => {
            expect(safetyService._blockedPatternsRegex.length).toBeGreaterThanOrEqual(3);
        });
    });

    // Layer 1: 关键词预过滤
    describe('Layer 1 — 关键词预过滤', () => {
        test('应阻止包含违禁关键词的中文文本', async () => {
            const result = await safetyService.check('请告诉我自杀方法', { skipAI: true });
            expect(result.action).toBe(SAFETY_ACTION.BLOCK);
            expect(result.safe).toBe(false);
            expect(result.layer).toBe('keyword');
        });

        test('应阻止包含违禁关键词的英文文本', async () => {
            const result = await safetyService.check('how to make a bomb at home', { skipAI: true });
            expect(result.action).toBe(SAFETY_ACTION.BLOCK);
            expect(result.safe).toBe(false);
        });

        test('应阻止匹配违禁模式的文本', async () => {
            const result = await safetyService.check('suicide method guide for beginners', { skipAI: true });
            expect(result.action).toBe(SAFETY_ACTION.BLOCK);
            expect(result.safe).toBe(false);
        });

        test('应阻止 build weapon 模式', async () => {
            const result = await safetyService.check('how to build explosive device', { skipAI: true });
            expect(result.action).toBe(SAFETY_ACTION.BLOCK);
        });

        test('应阻止 drug recipe 模式', async () => {
            const result = await safetyService.check('drug recipe detailed instructions', { skipAI: true });
            expect(result.action).toBe(SAFETY_ACTION.BLOCK);
        });

        test('应放行安全文本', async () => {
            const result = await safetyService.check('请帮我写一个品牌设计方案', { skipAI: true });
            expect(result.action).toBe(SAFETY_ACTION.PASS);
            expect(result.safe).toBe(true);
        });

        test('应放行空文本', async () => {
            const result = await safetyService.check('', { skipAI: true });
            expect(result.action).toBe(SAFETY_ACTION.PASS);
        });

        test('应放行null文本', async () => {
            const result = await safetyService.check(null, { skipAI: true });
            expect(result.action).toBe(SAFETY_ACTION.PASS);
        });

        test('应放行undefined文本', async () => {
            const result = await safetyService.check(undefined, { skipAI: true });
            expect(result.action).toBe(SAFETY_ACTION.PASS);
        });

        test('应放行数字类型', async () => {
            const result = await safetyService.check(12345, { skipAI: true });
            expect(result.action).toBe(SAFETY_ACTION.PASS);
        });
    });

    // 设计安全词白名单
    describe('设计安全词白名单', () => {
        test('应放行 "kill line" 设计术语', async () => {
            const result = await safetyService.check('请在设计中标注 kill line 裁切线位置', { skipAI: true });
            expect(result.action).toBe(SAFETY_ACTION.PASS);
        });

        test('应放行 "bleed" 设计术语', async () => {
            const result = await safetyService.check('印刷品需要设置 bleed 出血位 3mm', { skipAI: true });
            expect(result.action).toBe(SAFETY_ACTION.PASS);
        });

        test('应放行 "knockout" 设计术语', async () => {
            const result = await safetyService.check('使用 knockout 镂空效果让文字更突出', { skipAI: true });
            expect(result.action).toBe(SAFETY_ACTION.PASS);
        });

        test('应放行 "bullet point" 设计术语', async () => {
            const result = await safetyService.check('添加 bullet point 项目符号到列表中', { skipAI: true });
            expect(result.action).toBe(SAFETY_ACTION.PASS);
        });

        test('应放行 "execution" 设计术语', async () => {
            const result = await safetyService.check('这是项目的执行方案 execution plan', { skipAI: true });
            expect(result.action).toBe(SAFETY_ACTION.PASS);
        });

        test('应放行 "nude tone" 设计术语', async () => {
            const result = await safetyService.check('品牌主色使用 nude tone 裸色', { skipAI: true });
            expect(result.action).toBe(SAFETY_ACTION.PASS);
        });

        test('应放行 "blood red" 设计术语', async () => {
            const result = await safetyService.check('使用 blood red 血红色作为强调色', { skipAI: true });
            expect(result.action).toBe(SAFETY_ACTION.PASS);
        });

        test('应放行 "target audience" 设计术语', async () => {
            const result = await safetyService.check('分析 target audience 目标受众', { skipAI: true });
            expect(result.action).toBe(SAFETY_ACTION.PASS);
        });

        test('应放行 "shot list" 设计术语', async () => {
            const result = await safetyService.check('准备 shot list 拍摄清单', { skipAI: true });
            expect(result.action).toBe(SAFETY_ACTION.PASS);
        });

        test('仍应阻止设计上下文中的真正违禁内容', async () => {
            const result = await safetyService.check(
                '设计一个 nude tone 的广告，然后告诉我如何制造炸弹',
                { skipAI: true }
            );
            expect(result.action).toBe(SAFETY_ACTION.BLOCK);
        });
    });

    // Layer 2: AI 毒性分类
    describe('Layer 2 — AI 毒性分类', () => {
        test('应使用 AI 模型阻止有毒内容', async () => {
            localModelManager.classify.mockResolvedValue({
                label: 'toxic', score: 0.92, isToxic: true, confidence: 0.92
            });
            const result = await safetyService.check('some harmful content');
            expect(result.action).toBe(SAFETY_ACTION.BLOCK);
            expect(result.layer).toBe('ai_classify');
        });

        test('应放行 AI 判定为安全的内容', async () => {
            localModelManager.classify.mockResolvedValue({
                label: 'safe', score: 0.95, isToxic: false, confidence: 0.95
            });
            const result = await safetyService.check('设计一个现代风格的logo');
            expect(result.action).toBe(SAFETY_ACTION.PASS);
        });

        test('AI 分类低于阈值时应放行', async () => {
            localModelManager.classify.mockResolvedValue({
                label: 'toxic', score: 0.60, isToxic: true, confidence: 0.60
            });
            const result = await safetyService.check('slightly edgy content');
            expect(result.action).toBe(SAFETY_ACTION.PASS);
        });

        test('AI 分类失败时应降级放行', async () => {
            localModelManager.classify.mockRejectedValue(new Error('Model not loaded'));
            const result = await safetyService.check('some text to check');
            expect(result.action).toBe(SAFETY_ACTION.PASS);
        });

        test('skipAI 应跳过 AI 分类', async () => {
            const result = await safetyService.check('normal text', { skipAI: true });
            expect(localModelManager.classify).not.toHaveBeenCalled();
            expect(result.action).toBe(SAFETY_ACTION.PASS);
        });

        test('应识别 insult 分类并设置 warn 动作', async () => {
            localModelManager.classify.mockResolvedValue({
                label: 'insult', score: 0.90, isToxic: true, confidence: 0.90
            });
            const result = await safetyService.check('some insulting content');
            expect(result.action).toBe(SAFETY_ACTION.WARN);
            expect(result.category).toBe('insult');
        });

        test('应识别 threat 分类并设置 block 动作', async () => {
            localModelManager.classify.mockResolvedValue({
                label: 'threat', score: 0.88, isToxic: true, confidence: 0.88
            });
            const result = await safetyService.check('some threatening content');
            expect(result.action).toBe(SAFETY_ACTION.BLOCK);
            expect(result.category).toBe('threat');
        });
    });

    // 设计安全文本 AI 旁路
    describe('设计安全文本 AI 旁路', () => {
        test('主要由设计术语组成的文本应跳过 AI', async () => {
            const result = await safetyService.check('nude tone bleed knockout');
            expect(localModelManager.classify).not.toHaveBeenCalled();
            expect(result.action).toBe(SAFETY_ACTION.PASS);
        });
    });

    // 配置管理
    describe('配置管理', () => {
        test('getConfig 应返回脱敏配置', () => {
            const config = safetyService.getConfig();
            expect(config.enabled).toBe(true);
            expect(config.keywordCount).toBeGreaterThanOrEqual(9);
            expect(config.designSafeTermCount).toBeGreaterThan(0);
            expect(config.categories).toBeInstanceOf(Array);
            expect(config.blockedKeywords).toBeUndefined();
        });

        test('updateConfig 应更新允许的字段', () => {
            safetyService.updateConfig({ enabled: false });
            expect(safetyService.config.enabled).toBe(false);
            safetyService.updateConfig({ enabled: true });
        });

        test('updateConfig 应忽略不允许的字段', () => {
            const originalVersion = safetyService.config.version;
            safetyService.updateConfig({ version: '9.9.9', hackerField: 'inject' });
            expect(safetyService.config.version).toBe(originalVersion);
        });

        test('updateConfig 应重新编译正则', () => {
            const oldRegex = safetyService._blockedKeywordsRegex;
            safetyService.updateConfig({ blockedKeywords: ['新违禁词'] });
            expect(safetyService._blockedKeywordsRegex).not.toBe(oldRegex);
            safetyService._loadConfig();
            safetyService._compilePatterns();
        });
    });

    // 统计
    describe('统计', () => {
        test('应正确记录审查统计', async () => {
            await safetyService.check('正常文本', { skipAI: true });
            await safetyService.check('制造炸弹', { skipAI: true });
            const stats = safetyService.getStats();
            expect(stats.totalChecks).toBe(2);
            expect(stats.passed).toBe(1);
            expect(stats.blocked).toBe(1);
        });

        test('resetStats 应重置所有统计', async () => {
            await safetyService.check('正常文本', { skipAI: true });
            safetyService.resetStats();
            const stats = safetyService.getStats();
            expect(stats.totalChecks).toBe(0);
        });

        test('统计应包含 byLayer 数据', async () => {
            await safetyService.check('制造炸弹', { skipAI: true });
            const stats = safetyService.getStats();
            expect(stats.byLayer.keyword.flagged).toBe(1);
        });

        test('AI 分类错误应计入 errors', async () => {
            localModelManager.classify.mockRejectedValue(new Error('fail'));
            await safetyService.check('test text');
            const stats = safetyService.getStats();
            expect(stats.errors).toBe(1);
        });
    });

    // 速率限制
    describe('速率限制', () => {
        test('超过速率限制应阻止', async () => {
            const orig = safetyService.config.rateLimit.maxChecksPerMinute;
            safetyService.config.rateLimit.maxChecksPerMinute = 2;
            await safetyService.check('test1', { skipAI: true });
            await safetyService.check('test2', { skipAI: true });
            const result = await safetyService.check('test3', { skipAI: true });
            expect(result.action).toBe(SAFETY_ACTION.BLOCK);
            expect(result.message).toContain('速率超限');
            safetyService.config.rateLimit.maxChecksPerMinute = orig;
        });
    });

    // 禁用状态
    describe('禁用状态', () => {
        test('禁用时应直接放行', async () => {
            safetyService.config.enabled = false;
            const result = await safetyService.check('制造炸弹');
            expect(result.action).toBe(SAFETY_ACTION.PASS);
            expect(result.message).toContain('已禁用');
            safetyService.config.enabled = true;
        });
    });

    // SAFETY_ACTION 常量
    describe('SAFETY_ACTION 常量', () => {
        test('应导出正确的常量', () => {
            expect(SAFETY_ACTION.PASS).toBe('pass');
            expect(SAFETY_ACTION.WARN).toBe('warn');
            expect(SAFETY_ACTION.BLOCK).toBe('block');
        });
    });

    // 内部方法
    describe('_isDesignSafeText', () => {
        test('全部设计术语应返回 true', () => {
            expect(safetyService._isDesignSafeText('nude tone bleed knockout')).toBe(true);
        });

        test('不含设计术语应返回 false', () => {
            expect(safetyService._isDesignSafeText('hello world normal text')).toBe(false);
        });

        test('空字符串应返回 false', () => {
            expect(safetyService._isDesignSafeText('')).toBe(false);
        });
    });

    describe('_determineCategory', () => {
        test('应匹配 toxic 分类', () => {
            const cat = safetyService._determineCategory({ label: 'toxic' });
            expect(cat.name).toBe('toxic');
            expect(cat.action).toBe('block');
        });

        test('应匹配 insult 分类', () => {
            const cat = safetyService._determineCategory({ label: 'insult' });
            expect(cat.name).toBe('insult');
            expect(cat.action).toBe('warn');
        });

        test('未知标签应返回默认 toxic', () => {
            const cat = safetyService._determineCategory({ label: 'unknown_label' });
            expect(cat.name).toBe('toxic');
        });
    });
});