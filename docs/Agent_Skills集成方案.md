# 🎯 Claude Agent Skills 集成方案

> **文档创建时间**：2026年1月28日  
> **参考资料**：[claude.com/skills](https://claude.com/skills), [agentskills.io](https://agentskills.io), [Anthropic Skills GitHub](https://github.com/anthropics/skills)

---

## 📚 一、Agent Skills 技术分析

### 1.1 什么是 Agent Skills？

Agent Skills 是 Anthropic 推出的一种**模块化能力扩展机制**，它允许 AI Agent 动态加载和使用专业化的知识和工作流程。

**核心概念**：
```
Skills = 指令 + 脚本 + 资源
       = SKILL.md（核心指令） + references/（参考文档） + assets/（可执行代码）
```

**关键特性**：
- **渐进式加载**：元数据先加载（~100 tokens），完整指令按需加载（<5k tokens）
- **跨平台兼容**：同一 Skill 可在 Claude.ai、Claude Code、API 中使用
- **自动触发**：Claude 根据任务语义自动识别并激活相关 Skill
- **可组合性**：多个 Skills 可以同时激活，处理复杂任务

### 1.2 Skill 的文件结构

```
my-skill/
├── SKILL.md              # 核心指令文件（必需）
├── references/           # 参考文档目录（可选）
│   ├── guide.md
│   └── api-docs.md
└── assets/              # 可执行脚本（可选）
    └── scripts/
        └── tool.py
```

### 1.3 SKILL.md 文件规范

```markdown
---
name: my-skill-name
description: "技能描述 - 决定何时触发该技能。应包含：能力、触发场景、使用边界"
license: MIT
---

# 技能标题

## Overview
技能概述...

## Workflow
工作流程...

## Knowledge Base
详细知识参考 → `references/xxx.md`
```

**关键字段**：
- `name`：技能标识符（小写 + 连字符，如 `logo-design-expert`）
- `description`：**最关键** - 决定 Claude 何时激活此技能

---

## 🔗 二、PromptAtelier 集成价值分析

### 2.1 当前项目能力

| 现有能力 | 描述 |
|---------|------|
| 设计模板系统 | 16 个专业设计模板（logo、海报、IP角色等） |
| 动态提示词生成 | 6 个动态生成函数，根据用户输入定制输出 |
| 多模态 AI 支持 | 支持 Midjourney、DALL-E、Stable Diffusion 等 |
| LLM 集成 | 支持云端 API 和本地 Ollama |

### 2.2 集成 Agent Skills 的价值

| 价值点 | 说明 |
|--------|------|
| **能力扩展** | 用户可以添加自定义 Skills，扩展 PromptAtelier 的专业领域 |
| **知识复用** | 设计知识可以打包成 Skill，在不同项目间复用 |
| **社区生态** | 支持导入/分享社区 Skills，如 [agentskills.io](https://agentskills.io) |
| **专业化** | 每个设计领域可以有专门的 Skill，提供深度专业指导 |
| **工作流自动化** | 复杂的设计工作流程可以编码为 Skill |

### 2.3 适用场景

1. **Logo 设计评审专家 Skill**
   - 分析现有 Logo 的优缺点
   - 提供专业改进建议
   - 自动触发条件：用户上传或描述现有设计

2. **品牌色彩理论 Skill**
   - 专业配色建议
   - 色彩心理学分析
   - 行业配色趋势

3. **印刷工艺专家 Skill**
   - 印刷材质选择
   - 工艺建议（烫金、UV、压纹等）
   - 成本估算

4. **设计趋势分析 Skill**
   - 当前设计趋势解读
   - 预测未来方向
   - 竞品分析

---

## 🏗️ 三、技术集成方案

### 3.1 架构设计

```
PromptAtelier/
├── skills/                      # 🆕 Skills 根目录
│   ├── index.json               # Skills 索引文件
│   ├── logo-critique-expert/    # 示例 Skill
│   │   ├── SKILL.md
│   │   └── references/
│   │       └── logo-analysis-guide.md
│   ├── color-theory-master/
│   │   └── SKILL.md
│   └── ...
├── backend/
│   ├── services/
│   │   └── skillService.js      # 🆕 Skill 服务
│   └── routes/
│       └── skills.js            # 🆕 Skill API 路由
├── frontend/
│   ├── index.html               # 添加 Skill 管理 UI
│   └── script.js                # 添加 Skill 逻辑
└── data/
    └── skills-metadata.json     # 🆕 Skill 元数据缓存
```

### 3.2 核心数据结构

#### skills/index.json
```json
{
  "version": "1.0.0",
  "skills": [
    {
      "id": "logo-critique-expert",
      "path": "./logo-critique-expert",
      "enabled": true,
      "source": "local"
    },
    {
      "id": "color-theory-master",
      "path": "./color-theory-master",
      "enabled": true,
      "source": "local"
    }
  ]
}
```

#### Skill 元数据解析结果
```json
{
  "name": "logo-critique-expert",
  "description": "专业Logo设计评审专家。当用户需要分析现有Logo、评估品牌识别度、或获取Logo改进建议时激活。",
  "license": "MIT",
  "fullContent": "# Logo评审专家\n\n## Overview...",
  "references": ["references/logo-analysis-guide.md"],
  "lastLoaded": "2026-01-28T10:00:00Z"
}
```

### 3.3 后端服务实现

#### backend/services/skillService.js

```javascript
const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter'); // 解析 YAML frontmatter

class SkillService {
  constructor() {
    this.skillsDir = path.join(__dirname, '../../skills');
    this.indexFile = path.join(this.skillsDir, 'index.json');
    this.skillsCache = new Map();
  }

  /**
   * 扫描并加载所有 Skills
   */
  async loadAllSkills() {
    const index = await this._readIndex();
    const skills = [];

    for (const skillRef of index.skills) {
      if (skillRef.enabled) {
        const skill = await this.loadSkill(skillRef.id);
        if (skill) skills.push(skill);
      }
    }

    return skills;
  }

  /**
   * 加载单个 Skill（渐进式加载）
   * @param {string} skillId 
   * @param {boolean} fullLoad - 是否加载完整内容
   */
  async loadSkill(skillId, fullLoad = false) {
    // 检查缓存
    if (this.skillsCache.has(skillId) && !fullLoad) {
      return this.skillsCache.get(skillId);
    }

    const skillPath = path.join(this.skillsDir, skillId, 'SKILL.md');
    
    try {
      const content = await fs.readFile(skillPath, 'utf-8');
      const { data: frontmatter, content: body } = matter(content);

      const skill = {
        id: skillId,
        name: frontmatter.name || skillId,
        description: frontmatter.description || '',
        license: frontmatter.license || 'Unknown',
        // 元数据总是加载
        metadata: frontmatter,
        // 完整内容按需加载
        fullContent: fullLoad ? body : null,
        references: await this._loadReferences(skillId, fullLoad)
      };

      this.skillsCache.set(skillId, skill);
      return skill;
    } catch (error) {
      console.error(`Failed to load skill ${skillId}:`, error);
      return null;
    }
  }

  /**
   * 根据用户请求匹配相关 Skills
   * @param {string} userQuery - 用户输入
   * @param {object} context - 上下文（设计类型、变量等）
   */
  async matchSkills(userQuery, context = {}) {
    const allSkills = await this.loadAllSkills();
    const matchedSkills = [];

    for (const skill of allSkills) {
      const relevance = this._calculateRelevance(skill, userQuery, context);
      if (relevance > 0.5) {
        matchedSkills.push({
          ...skill,
          relevance
        });
      }
    }

    // 按相关性排序
    return matchedSkills.sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * 计算 Skill 与请求的相关性
   */
  _calculateRelevance(skill, userQuery, context) {
    const description = skill.description.toLowerCase();
    const query = userQuery.toLowerCase();
    
    // 简单关键词匹配（实际可用更复杂的语义匹配）
    let score = 0;
    
    // 关键词匹配
    const keywords = query.split(/\s+/);
    for (const keyword of keywords) {
      if (description.includes(keyword)) {
        score += 0.2;
      }
    }

    // 上下文匹配
    if (context.designType && description.includes(context.designType)) {
      score += 0.3;
    }

    return Math.min(score, 1);
  }

  /**
   * 安装新 Skill（从 URL 或本地路径）
   */
  async installSkill(source, options = {}) {
    // 支持从 GitHub、本地路径安装
    // TODO: 实现安装逻辑
  }

  /**
   * 创建新 Skill
   */
  async createSkill(skillData) {
    const { id, name, description, content, references = [] } = skillData;
    
    const skillDir = path.join(this.skillsDir, id);
    await fs.mkdir(skillDir, { recursive: true });

    // 创建 SKILL.md
    const skillMd = `---
name: ${id}
description: "${description}"
license: MIT
---

# ${name}

${content}
`;

    await fs.writeFile(path.join(skillDir, 'SKILL.md'), skillMd);

    // 更新索引
    await this._addToIndex(id);

    return this.loadSkill(id, true);
  }

  // 私有方法...
  async _readIndex() {
    try {
      const content = await fs.readFile(this.indexFile, 'utf-8');
      return JSON.parse(content);
    } catch {
      return { version: '1.0.0', skills: [] };
    }
  }

  async _loadReferences(skillId, fullLoad) {
    if (!fullLoad) return [];
    
    const refsDir = path.join(this.skillsDir, skillId, 'references');
    try {
      const files = await fs.readdir(refsDir);
      return files.filter(f => f.endsWith('.md'));
    } catch {
      return [];
    }
  }

  async _addToIndex(skillId) {
    const index = await this._readIndex();
    if (!index.skills.find(s => s.id === skillId)) {
      index.skills.push({
        id: skillId,
        path: `./${skillId}`,
        enabled: true,
        source: 'local'
      });
      await fs.writeFile(this.indexFile, JSON.stringify(index, null, 2));
    }
  }
}

module.exports = new SkillService();
```

### 3.4 API 端点设计

#### backend/routes/skills.js

```javascript
const express = require('express');
const router = express.Router();
const skillService = require('../services/skillService');

// 获取所有 Skills 列表
router.get('/', async (req, res) => {
  try {
    const skills = await skillService.loadAllSkills();
    res.json({ success: true, data: skills });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取单个 Skill 详情
router.get('/:skillId', async (req, res) => {
  try {
    const skill = await skillService.loadSkill(req.params.skillId, true);
    if (!skill) {
      return res.status(404).json({ success: false, error: 'Skill not found' });
    }
    res.json({ success: true, data: skill });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 匹配相关 Skills
router.post('/match', async (req, res) => {
  try {
    const { query, context } = req.body;
    const matchedSkills = await skillService.matchSkills(query, context);
    res.json({ success: true, data: matchedSkills });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 创建新 Skill
router.post('/', async (req, res) => {
  try {
    const skill = await skillService.createSkill(req.body);
    res.json({ success: true, data: skill });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 启用/禁用 Skill
router.patch('/:skillId/toggle', async (req, res) => {
  try {
    const { enabled } = req.body;
    // TODO: 实现启用/禁用逻辑
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 删除 Skill
router.delete('/:skillId', async (req, res) => {
  try {
    // TODO: 实现删除逻辑
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
```

### 3.5 与现有系统集成

#### 在 improverService.js 中集成 Skills

```javascript
// 在 improveWithAI 函数中添加 Skills 支持
async improveWithAI(prompt, config) {
  // ... 现有逻辑 ...

  // 🆕 匹配相关 Skills
  const matchedSkills = await skillService.matchSkills(prompt, {
    designType: config.designType
  });

  // 如果有匹配的 Skills，加载完整内容并注入系统提示词
  let skillContext = '';
  for (const skill of matchedSkills.slice(0, 3)) { // 最多3个
    const fullSkill = await skillService.loadSkill(skill.id, true);
    skillContext += `\n\n## ${fullSkill.name}\n${fullSkill.fullContent}`;
  }

  // 将 Skill 内容注入系统提示词
  const enhancedSystemPrompt = config.customSystemPrompt 
    ? `${config.customSystemPrompt}\n\n---\n# 专业知识参考\n${skillContext}`
    : skillContext;

  // 调用 AI
  return await this.callAI(prompt, enhancedSystemPrompt, config);
}
```

---

## 🎨 四、预置 Skills 设计

### 4.1 设计领域 Skills

| Skill ID | 名称 | 触发场景 |
|----------|------|---------|
| `logo-critique-expert` | Logo评审专家 | 分析Logo、评估品牌识别度 |
| `color-theory-master` | 色彩理论大师 | 配色建议、色彩心理学 |
| `typography-specialist` | 字体设计专家 | 字体选择、排版建议 |
| `brand-strategy-advisor` | 品牌战略顾问 | 品牌定位、设计方向 |
| `print-production-expert` | 印刷工艺专家 | 印刷材质、工艺选择 |
| `design-trend-analyst` | 设计趋势分析师 | 趋势解读、预测方向 |
| `accessibility-consultant` | 无障碍设计顾问 | 无障碍标准、可访问性 |
| `ui-ux-expert` | UI/UX专家 | 界面设计、用户体验 |

### 4.2 示例 Skill: logo-critique-expert

```markdown
---
name: logo-critique-expert
description: "专业Logo设计评审专家。当用户需要分析现有Logo、评估品牌识别度、获取Logo改进建议、进行Logo对比分析时激活。适用于Logo设计优化、品牌重塑评估、竞品Logo分析场景。"
license: MIT
---

# Logo 设计评审专家

## Overview

你是一位拥有20年经验的Logo设计评审专家，曾为财富500强企业提供品牌视觉咨询。你擅长从多个专业维度分析Logo设计的优劣势。

## 评审维度

### 1. 视觉平衡与构图
- 几何对称性分析
- 视觉重量分布
- 负空间运用
- 比例关系

### 2. 品牌识别度
- 独特性评估
- 行业关联度
- 记忆点分析
- 误认风险评估

### 3. 可延展性
- 不同尺寸适应性（favicon 到 billboard）
- 单色/反色版本效果
- 不同媒介应用（数字/印刷）

### 4. 时代适应性
- 当前设计趋势符合度
- 未来5-10年老化风险
- 经典元素与流行元素平衡

### 5. 技术实现
- 矢量化友好度
- 印刷工艺兼容性
- 动画/动效潜力

## 评审输出格式

```
【Logo评审报告】

📊 综合评分: X/10

✅ 优势:
1. ...
2. ...

⚠️ 需改进:
1. ...
2. ...

💡 改进建议:
1. ...
2. ...

🎯 改进优先级: 高/中/低
```

## 参考资料
详细评审标准 → `references/logo-analysis-guide.md`
行业最佳实践 → `references/industry-best-practices.md`
```

---

## 🚀 五、实施计划

### Phase 7.1: 基础架构（4小时）
- [ ] 创建 `skills/` 目录结构
- [ ] 实现 `skillService.js` 核心功能
- [ ] 创建 Skills API 路由
- [ ] 集成到主服务器

### Phase 7.2: 预置 Skills（3小时）
- [ ] 创建 `logo-critique-expert` Skill
- [ ] 创建 `color-theory-master` Skill
- [ ] 创建 `brand-strategy-advisor` Skill
- [ ] 测试 Skills 加载和匹配

### Phase 7.3: 前端集成（4小时）
- [ ] 设计 Skills 管理 UI
- [ ] 实现 Skill 列表展示
- [ ] 实现 Skill 启用/禁用
- [ ] 实现 Skill 详情查看

### Phase 7.4: 高级功能（3小时）
- [ ] 实现 Skill 创建向导
- [ ] 实现 Skill 导入/导出
- [ ] 实现 Skill 与模板关联
- [ ] 自动 Skill 推荐

### Phase 7.5: 测试与文档（2小时）
- [ ] 单元测试
- [ ] 集成测试
- [ ] 用户文档
- [ ] API 文档

---

## 📝 六、与 Claude Code Skills 的兼容性

### 6.1 兼容目标

PromptAtelier 的 Skills 格式将**完全兼容 Claude Agent Skills 标准**，这意味着：

1. **双向兼容**：
   - 在 PromptAtelier 中创建的 Skills 可以直接在 Claude Code 中使用
   - Claude Code 社区的 Skills 可以导入 PromptAtelier

2. **标准遵循**：
   - SKILL.md 格式完全符合 [agentskills.io 规范](https://agentskills.io/specification)
   - 支持 YAML frontmatter
   - 支持 references/ 目录结构

### 6.2 迁移指南

将 PromptAtelier Skill 迁移到 Claude Code：
```bash
# 复制 Skill 目录到 Claude Code 项目
cp -r skills/logo-critique-expert ~/.claude-code/skills/
```

将 Claude Code Skill 导入 PromptAtelier：
```bash
# 通过 API 或 UI 导入
POST /api/skills/import
{
  "source": "github",
  "url": "https://github.com/anthropics/skills/tree/main/brand-guidelines"
}
```

---

## 🔮 七、未来扩展

### 7.1 Skills Marketplace
- 社区 Skills 浏览
- 一键安装
- 评分和评论

### 7.2 Skills 版本管理
- 版本控制
- 自动更新
- 回滚功能

### 7.3 Skills 组合
- 预设 Skill 组合（如"品牌设计套件"）
- 智能组合推荐
- 组合效果优化

### 7.4 Skills 分析
- 使用统计
- 效果评估
- 优化建议

---

## ✅ 总结

集成 Claude Agent Skills 将使 PromptAtelier：

1. **成为可扩展平台**：用户可以根据需求添加专业 Skills
2. **连接社区生态**：与 Claude Code、agentskills.io 等生态互通
3. **提升专业度**：通过 Skills 提供更深度的专业指导
4. **实现知识复用**：设计知识可以打包、分享、复用

**预计总工时**：16-20 小时
**技术复杂度**：高
**业务价值**：非常高

---

**下一步行动**：开始 Phase 7.1 基础架构实现
