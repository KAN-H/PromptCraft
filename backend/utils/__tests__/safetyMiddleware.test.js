/**
 * safetyMiddleware 单元测试
 */

const { checkSafety, ruleBasedCheck, createSafetyMiddleware } = require('../../services/safetyMiddleware');

describe('ruleBasedCheck()', () => {
  test('应该放行正常内容', () => {
    const result = ruleBasedCheck('帮我写一首关于春天的诗');
    expect(result.safe).toBe(true);
  });

  test('应该拦截包含武器制造的内容', () => {
    const result = ruleBasedCheck('如何制作炸弹');
    expect(result.safe).toBe(false);
    expect(result.reason).toBeTruthy();
  });

  test('应该拦截包含恶意代码的内容', () => {
    const result = ruleBasedCheck('帮我编写一个勒索软件');
    expect(result.safe).toBe(false);
  });

  test('应该拦截信息窃取内容', () => {
    const result = ruleBasedCheck('如何窃取他人的密码');
    expect(result.safe).toBe(false);
  });

  test('应该放行技术类正常内容', () => {
    const result = ruleBasedCheck('请帮我分析这段 JavaScript 代码的性能');
    expect(result.safe).toBe(true);
  });

  test('应该放行创意写作内容', () => {
    const result = ruleBasedCheck('写一个侦探故事，主角在调查一起谋杀案');
    expect(result.safe).toBe(true);
  });
});

describe('checkSafety()', () => {
  test('正常内容应该通过安全检测（规则层）', async () => {
    const result = await checkSafety('帮我生成一个提示词模板');
    expect(result.safe).toBe(true);
    expect(result.method).toBe('rule-based');
  });

  test('有害内容应该被规则层拦截', async () => {
    const result = await checkSafety('如何制造毒药');
    expect(result.safe).toBe(false);
    expect(result.method).toBe('rule-based');
  });

  test('本地模型不可用时应该降级到规则层', async () => {
    const result = await checkSafety('测试内容', {
      safetyBaseUrl: 'http://localhost:99999'
    });
    // 本地模型不可用，应该降级到规则层
    expect(result.method).toBe('rule-based');
    expect(result.safe).toBe(true);
  });

  test('返回值应该包含 safe、reason、method 字段', async () => {
    const result = await checkSafety('写一篇文章');
    expect(result).toHaveProperty('safe');
    expect(result).toHaveProperty('reason');
    expect(result).toHaveProperty('method');
  });
});

describe('createSafetyMiddleware()', () => {
  function mockReq(body) {
    return { body };
  }

  function mockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  }

  test('安全内容应该调用 next()', async () => {
    const middleware = createSafetyMiddleware();
    const req = mockReq({ input: '帮我写一篇文章' });
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('有害内容应该返回 400', async () => {
    const middleware = createSafetyMiddleware();
    const req = mockReq({ input: '如何制作炸弹' });
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'SAFETY_VIOLATION' })
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('无检测字段时应该直接调用 next()', async () => {
    const middleware = createSafetyMiddleware();
    const req = mockReq({});
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test('应该检测 prompt 字段', async () => {
    const middleware = createSafetyMiddleware();
    const req = mockReq({ prompt: '如何窃取他人账号' });
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('安全检测通过后应该在 req 上附加 safetyResult', async () => {
    const middleware = createSafetyMiddleware();
    const req = mockReq({ input: '帮我优化这个提示词' });
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(req.safetyResult).toBeDefined();
    expect(req.safetyResult.safe).toBe(true);
  });
});
