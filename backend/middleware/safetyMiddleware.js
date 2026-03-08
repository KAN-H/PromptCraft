/**
 * Safety Middleware - 内容安全审查中间件
 * 
 * Phase 14 — v5.0
 * 
 * Express 中间件，自动拦截受保护路径的 POST/PUT 请求，
 * 提取文本字段并调用 SafetyService 进行内容安全审查。
 * 
 * 流程：
 * 1. 检查请求路径和方法是否需要审查
 * 2. 从请求体中提取文本字段
 * 3. 调用 safetyService.check() 审查
 * 4. block → 返回 403, warn → 附加 header 放行, pass → 正常放行
 * 
 * @version 1.0.0
 * @since Phase 14
 */

const safetyService = require('../services/safetyService');
const { SAFETY_ACTION } = require('../services/safetyService');

/**
 * 创建安全审查中间件
 * @param {Object} [options] - 可选配置（覆盖 safety-config.json 中的 middleware 配置）
 * @returns {Function} Express 中间件函数
 */
function createSafetyMiddleware(options = {}) {

    return async function safetyMiddleware(req, res, next) {
        try {
            const config = safetyService.config;

            // 安全审查未启用，直接放行
            if (!config || !config.enabled) {
                return next();
            }

            const middlewareConfig = { ...config.middleware, ...options };

            // 检查是否应跳过此路径
            if (_shouldSkipPath(req.path, middlewareConfig.skipPaths)) {
                return next();
            }

            // 检查请求方法是否需要审查
            if (!_shouldCheckMethod(req.method, middlewareConfig.protectedMethods)) {
                return next();
            }

            // 检查路径是否受保护
            if (!_isProtectedPath(req.path, middlewareConfig.protectedPaths)) {
                return next();
            }

            // 从请求体中提取文本字段
            const textContent = _extractTextFields(req.body, middlewareConfig.textFields);

            if (!textContent) {
                // 没有可审查的文本内容，放行
                return next();
            }

            // 执行安全审查
            const result = await safetyService.check(textContent, { context: 'input' });

            if (result.action === SAFETY_ACTION.BLOCK) {
                // 阻止请求
                return res.status(403).json({
                    success: false,
                    error: {
                        code: 'CONTENT_BLOCKED',
                        message: '内容安全审查未通过',
                        detail: result.message
                    },
                    safety: {
                        action: result.action,
                        layer: result.layer,
                        category: result.category
                    }
                });
            }

            if (result.action === SAFETY_ACTION.WARN) {
                // 添加警告头，但允许请求继续
                res.set('X-Safety-Warning', result.message);
                res.set('X-Safety-Category', result.category || 'unknown');
                // 将警告信息附加到 req 上，方便后续中间件/路由使用
                req.safetyWarning = result;
            }

            // 通过审查，继续处理
            next();

        } catch (err) {
            // 安全中间件不应阻止业务流程 — 出错时降级放行
            console.error('⚠️ Safety middleware error (degraded pass):', err.message);
            next();
        }
    };
}

/**
 * 检查路径是否在跳过列表中
 * @param {string} reqPath 
 * @param {string[]} skipPaths 
 * @returns {boolean}
 */
function _shouldSkipPath(reqPath, skipPaths) {
    if (!skipPaths || skipPaths.length === 0) return false;
    return skipPaths.some(sp => reqPath.startsWith(sp));
}

/**
 * 检查 HTTP 方法是否需要审查
 * @param {string} method 
 * @param {string[]} protectedMethods 
 * @returns {boolean}
 */
function _shouldCheckMethod(method, protectedMethods) {
    if (!protectedMethods || protectedMethods.length === 0) return false;
    return protectedMethods.includes(method.toUpperCase());
}

/**
 * 检查路径是否在受保护列表中
 * @param {string} reqPath 
 * @param {string[]} protectedPaths 
 * @returns {boolean}
 */
function _isProtectedPath(reqPath, protectedPaths) {
    if (!protectedPaths || protectedPaths.length === 0) return true; // 无配置默认全部受保护
    return protectedPaths.some(pp => reqPath.startsWith(pp));
}

/**
 * 从请求体中提取文本字段
 * @param {Object} body - 请求体
 * @param {string[]} textFields - 要提取的字段名
 * @returns {string|null} 合并后的文本，或 null
 */
function _extractTextFields(body, textFields) {
    if (!body || typeof body !== 'object') return null;

    const defaultFields = ['prompt', 'input', 'text', 'content', 'description'];
    const fields = textFields || defaultFields;
    const texts = [];

    for (const field of fields) {
        if (body[field] && typeof body[field] === 'string') {
            texts.push(body[field].trim());
        }
    }

    if (texts.length === 0) return null;
    return texts.join(' ');
}

// 导出工厂函数和内部函数（供测试使用）
module.exports = createSafetyMiddleware;
module.exports.createSafetyMiddleware = createSafetyMiddleware;
module.exports._shouldSkipPath = _shouldSkipPath;
module.exports._shouldCheckMethod = _shouldCheckMethod;
module.exports._isProtectedPath = _isProtectedPath;
module.exports._extractTextFields = _extractTextFields;
