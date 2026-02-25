/**
 * Skills API 路由
 * 
 * 提供 Skills 的 CRUD 操作和管理接口
 * 
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const skillService = require('../services/skillService');

/**
 * GET /api/skills
 * 获取所有 Skills 列表
 * 
 * Query params:
 * - enabledOnly: boolean - 仅返回启用的 Skills
 * - tags: string - 逗号分隔的标签列表
 */
router.get('/', async (req, res) => {
  try {
    const { enabledOnly, tags } = req.query;
    
    const options = {
      enabledOnly: enabledOnly === 'true',
      tags: tags ? tags.split(',').map(t => t.trim()) : undefined
    };

    const skills = await skillService.listSkills(options);
    
    res.json({
      success: true,
      data: skills,
      count: skills.length
    });
  } catch (error) {
    console.error('[Skills API] 获取列表失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/skills/:id
 * 获取单个 Skill 的完整信息
 */
router.get('/:id', async (req, res) => {
  try {
    const skill = await skillService.getSkill(req.params.id);
    
    if (!skill) {
      return res.status(404).json({
        success: false,
        error: 'Skill 不存在'
      });
    }

    res.json({
      success: true,
      data: skill
    });
  } catch (error) {
    console.error('[Skills API] 获取 Skill 失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/skills
 * 创建新 Skill
 * 
 * Body:
 * - id: string (required) - 唯一标识符
 * - name: string (required) - 显示名称
 * - description: string - 描述
 * - triggers: string[] - 触发关键词
 * - tags: string[] - 分类标签
 * - instructions: string - 指令内容
 */
router.post('/', async (req, res) => {
  try {
    const { id, name, description, triggers, tags, instructions, author } = req.body;

    if (!id || !name) {
      return res.status(400).json({
        success: false,
        error: '缺少必要字段: id, name'
      });
    }

    const skill = await skillService.createSkill({
      id,
      name,
      description,
      triggers,
      tags,
      instructions,
      author
    });

    res.status(201).json({
      success: true,
      data: skill,
      message: `Skill "${name}" 创建成功`
    });
  } catch (error) {
    console.error('[Skills API] 创建 Skill 失败:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/skills/:id
 * 更新 Skill
 */
router.put('/:id', async (req, res) => {
  try {
    const { name, description, triggers, tags, instructions } = req.body;

    const skill = await skillService.updateSkill(req.params.id, {
      name,
      description,
      triggers,
      tags,
      instructions
    });

    if (!skill) {
      return res.status(404).json({
        success: false,
        error: 'Skill 不存在'
      });
    }

    res.json({
      success: true,
      data: skill,
      message: 'Skill 更新成功'
    });
  } catch (error) {
    console.error('[Skills API] 更新 Skill 失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/skills/:id
 * 删除 Skill
 */
router.delete('/:id', async (req, res) => {
  try {
    const success = await skillService.deleteSkill(req.params.id);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Skill 不存在'
      });
    }

    res.json({
      success: true,
      message: 'Skill 删除成功'
    });
  } catch (error) {
    console.error('[Skills API] 删除 Skill 失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PATCH /api/skills/:id/toggle
 * 启用/禁用 Skill
 */
router.patch('/:id/toggle', async (req, res) => {
  try {
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: '缺少 enabled 参数'
      });
    }

    const success = await skillService.setSkillEnabled(req.params.id, enabled);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Skill 不存在'
      });
    }

    res.json({
      success: true,
      message: enabled ? 'Skill 已启用' : 'Skill 已禁用'
    });
  } catch (error) {
    console.error('[Skills API] 切换 Skill 状态失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/skills/match
 * 根据用户输入匹配相关 Skills
 * 
 * Body:
 * - input: string - 用户输入
 * - maxResults: number - 最大返回数量 (默认 3)
 */
router.post('/match', async (req, res) => {
  try {
    const { input } = req.body;
    const parsedMaxResults = parseInt(req.body.maxResults, 10);
    const maxResults = Math.min(Math.max(Number.isNaN(parsedMaxResults) ? 3 : parsedMaxResults, 1), 10);

    if (!input) {
      return res.status(400).json({
        success: false,
        error: '缺少 input 参数'
      });
    }

    const skills = await skillService.matchSkills(input, maxResults);

    res.json({
      success: true,
      data: skills,
      count: skills.length
    });
  } catch (error) {
    console.error('[Skills API] 匹配 Skills 失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/skills/rescan
 * 重新扫描 Skills 目录
 */
router.post('/rescan', async (req, res) => {
  try {
    const skills = await skillService.rescan();

    res.json({
      success: true,
      data: skills,
      count: skills.length,
      message: '重新扫描完成'
    });
  } catch (error) {
    console.error('[Skills API] 重新扫描失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/skills/:id/export
 * 导出 Skill 为 JSON
 */
router.get('/:id/export', async (req, res) => {
  try {
    const data = await skillService.exportSkill(req.params.id);

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Skill 不存在'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('[Skills API] 导出 Skill 失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/skills/import
 * 从 JSON 导入 Skill
 */
router.post('/import', async (req, res) => {
  try {
    const skill = await skillService.importSkill(req.body);

    res.status(201).json({
      success: true,
      data: skill,
      message: 'Skill 导入成功'
    });
  } catch (error) {
    console.error('[Skills API] 导入 Skill 失败:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/skills/context
 * 为用户输入构建 Skills 上下文
 * 
 * Body:
 * - input: string - 用户输入
 */
router.post('/context', async (req, res) => {
  try {
    const { input } = req.body;

    if (!input) {
      return res.status(400).json({
        success: false,
        error: '缺少 input 参数'
      });
    }

    const context = await skillService.buildSkillsContext(input);

    res.json({
      success: true,
      data: {
        context,
        hasContext: context.length > 0
      }
    });
  } catch (error) {
    console.error('[Skills API] 构建上下文失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
