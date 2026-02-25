/**
 * 动态设计 API 路由
 * 
 * POST /api/dynamic-design/generate   - 生成动态设计代码
 * POST /api/dynamic-design/iterate    - 迭代修改设计
 * GET  /api/dynamic-design/effects    - 获取可用动画效果
 * GET  /api/dynamic-design/presets    - 获取支持的设计角色
 * 
 * @version 1.0.0 - Phase 13
 */

const express = require('express');
const router = express.Router();
const {
  generateDynamicDesign,
  iterateDesign,
  isPresetSupported,
  getSupportedPresets,
  ANIMATION_EFFECTS,
  EASING_OPTIONS
} = require('../services/dynamicDesignService');

/**
 * POST /generate - 生成动态设计代码
 * 
 * 支持两种入口：
 * 1. 独立入口：用户手动填写参数
 * 2. 下游入口：从设计助手传递参数（带 designPrompt）
 */
router.post('/generate', async (req, res) => {
  try {
    const {
      designType,
      brandName,
      slogan,
      style,
      colors,
      description,
      animation,
      designPrompt,  // 来自设计助手的提示词（下游模式）
      config         // LLM 配置 { baseUrl, apiKey, model }
    } = req.body;

    // 验证必填参数
    if (!config || !config.baseUrl || !config.model) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_CONFIG',
          message: '请先配置 AI 服务（API 地址和模型名称）'
        }
      });
    }

    // 至少需要一种输入
    if (!brandName && !description && !designPrompt) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_INPUT',
          message: '请至少输入品牌名称、设计描述或来自设计助手的提示词'
        }
      });
    }

    const result = await generateDynamicDesign({
      designType: designType || 'logo-design',
      brandName,
      slogan,
      style,
      colors,
      description,
      animation,
      designPrompt
    }, config);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('[DynamicDesign API] 生成失败:', error.message);
    res.status(500).json({
      success: false,
      error: {
        code: 'GENERATION_FAILED',
        message: error.message || '动态设计生成失败'
      }
    });
  }
});

/**
 * POST /iterate - 迭代修改设计
 */
router.post('/iterate', async (req, res) => {
  try {
    const { currentCode, instruction, config } = req.body;

    if (!currentCode) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_CODE',
          message: '缺少当前代码'
        }
      });
    }

    if (!instruction || instruction.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_INSTRUCTION',
          message: '请输入修改指令'
        }
      });
    }

    if (!config || !config.baseUrl || !config.model) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_CONFIG',
          message: '请先配置 AI 服务'
        }
      });
    }

    const result = await iterateDesign(currentCode, instruction.trim(), config);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('[DynamicDesign API] 迭代修改失败:', error.message);
    res.status(500).json({
      success: false,
      error: {
        code: 'ITERATION_FAILED',
        message: error.message || '迭代修改失败'
      }
    });
  }
});

/**
 * GET /effects - 获取可用动画效果列表
 */
router.get('/effects', (req, res) => {
  const effects = Object.entries(ANIMATION_EFFECTS).map(([key, value]) => ({
    id: key,
    name: value.name,
    nameEn: value.nameEn,
    description: value.description
  }));

  res.json({
    success: true,
    data: {
      effects,
      easings: EASING_OPTIONS
    }
  });
});

/**
 * GET /presets - 获取支持动态设计的角色列表
 */
router.get('/presets', (req, res) => {
  res.json({
    success: true,
    data: {
      supported: getSupportedPresets()
    }
  });
});

/**
 * GET /check-preset/:presetId - 检查某个角色是否支持动态设计
 */
router.get('/check-preset/:presetId', (req, res) => {
  const { presetId } = req.params;
  res.json({
    success: true,
    data: {
      presetId,
      supported: isPresetSupported(presetId)
    }
  });
});

module.exports = router;
