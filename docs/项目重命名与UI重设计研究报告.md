# 项目重命名与 UI 重设计研究报告

> **版本**: v2.0（终定版）  
> **日期**: 2026-03-04  
> **状态**: ✅ 方案已确认 — 名称确定为 **PromptAtelier**，UI 确定为 **Zen Workspace 三栏架构**，待进入开发阶段  
> **审阅**: v2.0 经代码级审阅，已与实际项目文件核实校正

---

## 目录

- [一、项目重命名方案](#一项目重命名方案)
  - [1.1 命名原则](#11-命名原则)
  - [1.2 竞品名称排查](#12-竞品名称排查)
  - [1.3 候选名称方案（Top 5）](#13-候选名称方案top-5)
  - [1.4 推荐方案对比表](#14-推荐方案对比表)
  - [1.5 重命名影响范围](#15-重命名影响范围)
- [二、UI 重设计方案](#二ui-重设计方案)
  - [2.1 当前 UI 诊断分析](#21-当前-ui-诊断分析)
  - [2.2 现代设计趋势研究](#22-现代设计趋势研究)
  - [2.3 优秀参考案例](#23-优秀参考案例)
  - [2.4 重设计方案提案（v2.0 终定版：Zen Workspace）](#24-重设计方案提案v20-终定版zen-workspace)
  - [2.5 国际化 (i18n) 双语支持方案](#25-国际化-i18n-双语支持方案)
- [三、实施路线图](#三实施路线图)
- [四、即梦 AI 设计参考图生成提示词](#四即梦-ai-设计参考图生成提示词)
- [附录：技术实现备注](#附录技术实现备注)

---

## 一、项目重命名方案

### 1.1 命名原则

| 原则 | 说明 |
|------|------|
| **原创性** | 不与现有开源项目、商业产品重名 |
| **功能贴合** | 体现「设计提示词 + AI 智能生成」核心定位 |
| **记忆性** | 朗朗上口、易于拼写、便于传播 |
| **SEO 友好** | 组合足够独特，搜索引擎首页可达 |
| **国际化** | 英文命名，同时有优雅的中文释义 |
| **社区曝光** | 名称本身能引发好奇心，吸引点击 |

### 1.2 竞品名称排查

以下名称已被占用，**排除**：

| 名称 | 占用情况 |
|------|----------|
| PromptCraft | 多个同名项目（我们当前名） |
| PromptForge | GitHub 已存在（AI图像提示词管理） |
| PromptLab | 常见名，多个项目使用 |
| PromptStudio | 已被商业产品使用 |
| PromptPalette | PyPI 已存在（Python 包） |
| PromptNova | GitHub 已存在（AI提示词平台） |
| Promptorium | GitHub 已存在（2个项目） |
| promptfoo | GitHub 知名项目（LLM 测试工具） |
| Pixora | 多个商业产品（意大利IoT公司/WordPress主题/美颜App） |
| VizCraft | LobeHub MCP Server 已存在 |
| ArtCue | GitHub 组织已存在 |
| OpenPrompt | 清华大学 NLP 实验室项目 |

### 1.3 候选名称方案（Top 5）

---

#### 🥇 方案一：PromptAtelier（推荐）

```
PromptAtelier = Prompt（提示词）+ Atelier（法语：工坊/工作室）
```

- **中文释义**：「AI 提示词工坊」
- **npm 包名**：`prompt-atelier`
- **GitHub**：未被占用 ✅
- **定位语**：Professional Design Prompt Atelier — AI-Powered Creative Workshop

**为什么推荐：**
- "Atelier" 在艺术/设计界是高频词汇，意为「大师工作室」，常见于高端设计品牌（如 Atelier Versace）
- 直接传达「这是一个专业的提示词创作工坊」的定位
- 法语词汇赋予品牌优雅感和专业调性
- 组合极其独特，Google 搜索零冲突，SEO 潜力极高
- 国际用户一看就懂——这是给设计师用的工具

**品牌延展**：
- Logo 概念：画笔/调色盘 + 代码光标的融合
- Slogan：`"Where Design Meets Intelligence"` 或 `"设计灵感，一词即达"`
- 缩写：`PA` → 可用于 CLI 命令 `pa generate`

---

#### 🥈 方案二：CueCanvas

```
CueCanvas = Cue（提示/线索）+ Canvas（画布）
```

- **中文释义**：「提示画布」
- **npm 包名**：`cue-canvas`
- **GitHub**：未被占用 ✅
- **定位语**：AI Design Prompt Canvas — From Cue to Creation

**优势**：
- "Cue" 是 "prompt" 的优雅同义词（提示、暗示）
- "Canvas" 是设计师最熟悉的概念——空白画布
- 双重隐喻：在画布上用提示词作画
- 发音流畅：/kjuː ˈkæn.vəs/
- 两个词首字母都是 C，有押韵美感

**品牌延展**：
- Logo 概念：画布上的光标闪烁
- Slogan：`"Your Canvas, AI's Brush"` 或 `"提示为笔，画布为纸"`

---

#### 🥉 方案三：DesignSpell

```
DesignSpell = Design（设计）+ Spell（咒语/魔法词）
```

- **中文释义**：「设计咒语」
- **npm 包名**：`design-spell`
- **GitHub**：未被占用 ✅
- **定位语**：Cast Your Design Spell — AI Prompt Magic for Creators

**优势**：
- 极具创意的比喻——AI 提示词就像"咒语"，输入文字就能召唤出图像
- "Spell" 本身有魔法的含义，契合 AI 生成图像的"神奇"体验
- 暗合 Midjourney/DALL-E 用户的心理——写提示词就是施魔法
- 品牌故事性强，容易做内容营销

**品牌延展**：
- Logo 概念：魔法棒 + 设计符号
- Slogan：`"Speak the Spell, See the Design"` 或 `"咒语一出，设计即现"`

---

#### 方案四：PromptBrush

```
PromptBrush = Prompt（提示词）+ Brush（画笔）
```

- **中文释义**：「提示画笔」
- **npm 包名**：`prompt-brush`
- **GitHub**：未被占用 ✅
- **定位语**：Paint with Words — AI Design Prompt Generator

**优势**：
- "Brush" 是最具标志性的艺术工具，直觉上与设计关联
- 简洁明了，一目了然
- 隐喻准确——提示词就是你的画笔，AI 是你的颜料

---

#### 方案五：MuzeAI

```
MuzeAI = Muze（Muse 的创意拼写，缪斯/灵感女神）+ AI
```

- **中文释义**：「AI 缪斯」/「灵感缪斯」
- **npm 包名**：`muze-ai`
- **GitHub**：未被占用 ✅
- **定位语**：Your AI Muse for Design — Inspiration at Every Prompt

**优势**：
- "Muse" 在西方文化中代表灵感之源（九位缪斯女神）
- 故意拼写为 "Muze" 确保唯一性和可注册性
- 极短、极易记忆
- "AI" 后缀明确技术定位

---

### 1.4 推荐方案对比表

| 维度 | PromptAtelier | CueCanvas | DesignSpell | PromptBrush | MuzeAI |
|------|:---:|:---:|:---:|:---:|:---:|
| **原创性** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **功能贴合** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **记忆性** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **专业感** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **SEO 潜力** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **国际友好** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **品牌延展** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **综合评分** | **4.86** | **4.43** | **4.29** | **3.86** | **4.14** |

> **💡 最终推荐：PromptAtelier** — 兼具专业感、独特性和品牌延展潜力，最适合面向设计师社区的开源项目。

### 1.5 重命名影响范围

确认新名称后，需要修改以下文件/位置：

| 文件 | 修改内容 |
|------|----------|
| `package.json` | `name` 字段、`description`、`author`、`keywords` |
| `README.md` | 项目名称、描述、仓库链接、badges |
| `frontend/index.html` | `<title>`、navbar 品牌名、所有 `PromptCraft` 文字 |
| `frontend/script.js` | console.log 中的品牌名、localStorage key 前缀（见下方迁移方案） |
| `frontend/style.css` | 注释中的项目名 |
| `backend/server.js` | 启动日志 `PromptCraft服务器启动成功` 等中文品牌名 |
| `skills/index.json` | `"author": "PromptCraft"` 字段（所有 skill 条目） |
| `PROGRESS.md` | 项目名称引用 |
| `docs/*.md` | 所有文档中的项目名引用 |
| `rules/*.md` | 规范文档中的项目名引用 |
| `LICENSE` | 如有项目名引用 |
| `jest.config.js` | 如有项目名注释 |
| GitHub 仓库 | 仓库名、Description |
| 文件夹名 | `PromptCraft/` → `PromptAtelier/`（可选） |

#### 1.5.1 localStorage 键名迁移方案

当前项目使用了 4 个 `promptcraft_` 前缀的 localStorage 键：

| 当前键名 | 新键名 | 存储内容 |
|----------|--------|----------|
| `promptcraft_theme` | `atelier_theme` | 明暗主题偏好 |
| `promptcraft_settings` | `atelier_settings` | API 服务商/模型/压缩等设置 |
| `promptcraft_dynamic_config` | `atelier_dynamic_config` | 动态设计独立 API 配置 |
| `promptcraft_offline` | `atelier_offline` | 离线模式偏好 |

**迁移策略**：在 `script.js` 的 `init()` 中加入一次性迁移逻辑——检测旧键是否存在，如果存在则复制到新键并删除旧键，确保老用户升级后设置不丢失。

---

## 二、UI 重设计方案

### 2.1 当前 UI 诊断分析

#### 2.1.1 现有技术栈
- **Alpine.js 3.13.3** — 轻量响应式框架
- **DaisyUI 4.4.19** — Tailwind CSS 组件库
- **Tailwind CSS** — 原子化 CSS（CDN 引入）
- **Chart.js 4.4.1** — 图表库
- **html2canvas + gif.js** — 导出功能

#### 2.1.2 当前布局结构

```
┌─────────────────────────────────────────────────────────┐
│  Navbar: [Logo]  [设计助手|专业技能|动态设计|AI管理]  [📜⭐🌙⚙️] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Tab Content Area (全宽，居中 max-w-7xl)                │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  设计类型网格 (2x3 到 6列)                       │    │
│  │  [Logo] [海报] [IP] [广告] [包装] [UI]...       │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌──────────────────┐  ┌──────────────────┐            │
│  │  左：输入表单      │  │  右：生成结果      │            │
│  │  (Card)          │  │  (Card)          │            │
│  └──────────────────┘  └──────────────────┘            │
│                                                         │
│  [模态框: 设置 / 收藏 / 历史 / Skill详情 / ...]        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### 2.1.3 诊断问题清单

| # | 问题 | 严重度 | 说明 |
|---|------|:---:|------|
| 1 | **顶部导航拥挤** | 🔴 高 | 4个 Tab + 4个图标按钮挤在一行，移动端换行严重 |
| 2 | **导航扩展性差** | 🔴 高 | 水平 Tab 无法容纳更多功能模块 |
| 3 | **页面层级扁平** | 🟡 中 | 所有功能在同一层级切换，缺乏空间分区感 |
| 4 | **Emoji 图标不专业** | 🟡 中 | 🎨🧠🎬🤖📜⭐ 作为主要图标，视觉不统一 |
| 5 | **卡片样式同质化** | 🟡 中 | 所有内容都是白色卡片 + 阴影，缺乏视觉层次 |
| 6 | **模态框过多** | 🟡 中 | 设置、收藏、历史、Skill 创建/编辑/详情、删除确认 共 7+ 个模态框 |
| 7 | **色彩体系单调** | 🟡 中 | 主要依赖 DaisyUI 默认配色，品牌辨识度低 |
| 8 | **移动端适配不足** | 🟡 中 | 响应式仅处理了 Tab 换行，整体布局未针对移动优化 |
| 9 | **输入表单缺引导** | 🟠 低 | 动态渲染的表单缺少进度指引和视觉分组 |
| 10 | **结果区域缺对比** | 🟠 低 | 生成结果平铺展示，缺少前后对比、版本切换等 |
| 11 | **品牌视觉缺失** | 🔴 高 | 无 Logo、无品牌色、无视觉识别系统 |
| 12 | **暗色模式粗糙** | 🟡 中 | 暗色模式仅反色处理，缺乏独立的视觉精调 |

#### 2.1.4 优点（保留）

| 优点 | 说明 |
|------|------|
| ✅ 毛玻璃导航栏 | `backdrop-filter: blur(10px)` 效果不错 |
| ✅ 渐变主色调 | `#667eea → #764ba2` 紫蓝渐变有辨识度 |
| ✅ 平滑过渡动画 | 卡片悬浮、Tab 切换有适当动效 |
| ✅ Toast 通知 | 右下角滑入的通知条设计合理 |
| ✅ 暗色模式支持 | 基础暗色切换已实现 |
| ✅ 设计类型卡片悬浮效果 | `hover:scale-105 + hover:border-primary` 交互感好 |

### 2.2 现代设计趋势研究

基于对 2025-2026 年 UI/UX 设计趋势的全面调研，以下趋势最适合本项目：

#### 2.2.1 核心趋势

| 趋势 | 说明 | 适用场景 |
|------|------|----------|
| **🏗️ Sidebar 导航** | 可折叠侧边栏取代顶部 Tab，参考 ChatGPT/Notion/v0.dev | 全局导航重构 |
| **🍱 Bento Grid** | Apple 风格的不等大小网格布局，视觉层次丰富 | 设计类型选择、AI 管理面板 |
| **🧊 Glassmorphism** | 毛玻璃+透明+模糊效果，现代感强 | 悬浮面板、侧边栏、模态框 |
| **⌨️ Command Palette** | `Cmd+K` 全局搜索面板，参考 GitHub/Linear/Raycast | 快速导航和搜索 |
| **🎭 Micro-interactions** | 精细的微交互动效（按钮波纹、加载骨架屏、进度动画） | 全局交互增强 |
| **🔲 Split Panel** | 可拖拽调节的分栏布局，参考 v0.dev/VS Code | 输入区+输出区 |
| **📐 Design Token** | 统一的设计变量系统（颜色、间距、圆角、阴影） | 品牌一致性 |

#### 2.2.2 视觉趋势

| 趋势 | 说明 | 实现方式 |
|------|------|----------|
| **渐变边框** | 卡片、按钮使用渐变色边框增加层次 | `border-image` 或 `background-clip` |
| **SVG 图标系统** | 取代 Emoji，使用 Lucide/Heroicons 统一图标风格 | CDN 引入 Lucide Icons |
| **大字体层级** | 更明显的标题-正文-辅助文字层级对比 | `text-4xl` → `text-sm` 梯度 |
| **柔和阴影** | 减少硬阴影，使用多层柔和投影 | `shadow-sm` + 透明度叠加 |
| **品牌渐变** | 关键元素使用品牌渐变色（紫→蓝→青） | 保留并增强现有渐变 |
| **骨架屏加载** | 数据加载时显示内容占位动画 | Tailwind `animate-pulse` |

### 2.3 优秀参考案例

| 产品 | 参考要素 | 说明 |
|------|----------|------|
| **v0.dev** (Vercel) | 分栏布局、代码+预览 | 左侧输入区 + 右侧实时预览，极简专业 |
| **ChatGPT** (OpenAI) | 侧边栏+主面板 | 可折叠侧边栏放历史，主区域聚焦交互 |
| **Lobe Chat** (开源) | 现代聊天 UI | DaisyUI + 侧边栏，精美的开源 AI UI |
| **Midjourney Web** | 网格画廊、参数面板 | 瀑布流展示结果，参数面板布局 |
| **Linear** (项目管理) | 极简主义、Command Palette | 黑白灰为主，`Cmd+K` 快速操作 |
| **Notion** | 侧边栏嵌套导航 | 左侧层级树导航，右侧内容 |
| **Figma** | 工具栏+面板 | 顶部工具条、右侧属性面板 |
| **Raycast** | Command Palette | 搜索+快捷操作的完美结合 |


### 2.4 重设计方案提案（v2.0 终定版：Zen Workspace）

基于对"Jimeng"等现代 AI 设计工具的视觉推演验证，最终确定采用 **"Zen Workspace"（禅意工作台）** 布局方案。该方案放弃了基础的上下或左右硬分割，转向更符合现代 AI 生产力工具的专业三栏流式布局。

#### 2.4.1 核心架构：三栏流式布局 (Three-Column Layout)

```text
+-------------------------------------------------------------------------+
| +-----+ +----------------------------------+ +------------------------+ |
| |  *  | | Search / Cmd+K                   | | Preview & Output       | |
| |  *  | +----------------------------------+ |                        | |
| |  *  | | Configuration Editor             | | [English Prompt]       | |
| |  *  | |                                  | |                        | |
| |     | | - Design Type (Bento mini)       | | [Chinese Translation]  | |
| | --- | | - Param Form (theme/color/style) | |                        | |
| |  o  | | - AI Enhancement Options         | | [Actions: Copy/Fav]    | |
| |  o  | |                                  | |                        | |
| |  o  | | [ Generate / Enhance Button ]    | | [History Stream]       | |
| +-----+ +----------------------------------+ +------------------------+ |
|  60px     calc(100% - 60px) x 45%           calc(100% - 60px) x 55%    |
+-------------------------------------------------------------------------+

* = Core Nav (Design / Skills / Motion / AI Manager)
o = System  (Settings / Theme / Language)
```

**区域职责划分**：

1. **左侧极简导航栏 (Slim Sidebar, 固定 60px)**：
   - 仅图标，悬浮显示 tooltip 文字。
   - 上方：4 个核心功能 Tab（设计助手、专业技能、动态设计、AI管理）。
   - 分割线下方：系统级操作（设置、主题切换、中英语言切换）。
   - 最底部：本地 AI 模型就绪状态指示灯（绿点/灰点，取代原 Navbar 右侧的 badge）。

2. **中栏参数配置区 (Configuration Editor, 剩余宽度的 45%)**：
   - 采用 Glassmorphism 卡片，收纳各页面的输入表单/配置项。
   - 顶部集成全局搜索栏 (Command Palette 入口)。
   - 内容随当前 Tab 切换而变化（详见 2.4.3 各 Tab 映射）。

3. **右侧结果与预览区 (Preview & Action, 剩余宽度的 55%)**：
   - 干净展示 AI 输出结果，背景使用比中栏更深/更浅的色块形成视觉焦点。
   - 操作按钮（复制/收藏/重新生成）内联到结果区底部。
   - 原有的"历史记录"下拉菜单和 Modal 整合到右栏底部的可折叠面板。

#### 2.4.2 核心改造点详解

##### 改造点 1：图标系统 — Lucide SVG 替换 Emoji

- **痛点**：Emoji 在不同系统渲染不一致，缺乏专业感。
- **方案**：全面引入 Lucide Icons（**锁定版本 0.312.0**，避免 `@latest` 在生产环境不稳定）。

**完整图标映射表**：

| 当前 Emoji | Lucide 图标 | 用途 |
|:---:|---|---|
| 🎯 | `palette` / `paintbrush` | 设计助手 |
| 🧠 | `sparkles` / `brain` | 专业技能 |
| 🎬 | `film` / `clapperboard` | 动态设计 |
| 🤖 | `server` / `cpu` | AI 管理 |
| 📜 | `history` / `clock` | 历史记录 |
| ⭐ | `star` | 收藏 |
| 🌙/☀️ | `moon` / `sun` | 主题切换 |
| ⚙️ | `settings` | 设置 |
| 📋 | `copy` / `clipboard` | 复制 |
| 🌐 | `languages` | 中英切换（新增） |
| 🟢/⚪ | `circle-dot` | AI 状态指示 |
| ➕ | `plus` | 创建 Skill |
| 🔍 | `search` | 搜索 |
| 📥/📤 | `download` / `upload` | 导入/导出 |

##### 改造点 2：品牌色彩系统（精确定义）

```css
/* 品牌三色渐变 */
--brand-gradient: linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #06B6D4 100%);

/* 色彩角色 */
--brand-primary:   #6366F1;  /* Indigo - 主色调，传达专业和信任 */
--brand-secondary: #8B5CF6;  /* Violet - 辅助色，传达创意和灵感 */
--brand-accent:    #06B6D4;  /* Cyan   - 强调色，用于 AI 状态、进度、成功反馈 */

/* 暗色模式三级灰度 */
--surface-1: #0F172A;  /* 最深，页面底层背景 (Tailwind slate-900) */
--surface-2: #1E293B;  /* 卡片/面板背景 (Tailwind slate-800) */
--surface-3: #334155;  /* 悬浮/激活态背景 (Tailwind slate-700) */

/* 暗色模式文字三级 */
--text-primary:   #F1F5F9;  /* 主文字 */
--text-secondary: #94A3B8;  /* 次要文字 */
--text-muted:     #64748B;  /* 辅助/禁用态文字 */

/* 亮色模式 */
--surface-light-1: #F8FAFC;  /* 页面背景 */
--surface-light-2: #FFFFFF;  /* 卡片背景 */
```

**霓虹点缀规则**：

- Sidebar 当前激活 Tab：左侧 3px 品牌渐变竖条 + 图标 `color: var(--brand-primary)`
- 主操作按钮（"生成"）：`background: var(--brand-gradient)` + 微弱 `box-shadow` 光晕
- AI 状态就绪：`box-shadow: 0 0 8px rgba(6, 182, 212, 0.4)` （青色呼吸光）

##### 改造点 3：视觉风格 — 暗黑优先 (Dark-First)

- **主体**：以 `--surface-1` 为主背景，卡片使用 `--surface-2`。
- **材质**：广泛使用暗色毛玻璃效果 (`backdrop-filter: blur(12px)`)，用于 Sidebar、Drawer 背景、搜索面板遮罩。
- **卡片边框**：`border: 1px solid rgba(255, 255, 255, 0.06)`（暗色下微妙可见）。
- **亮色模式**：独立精调，非简单反色。卡片使用柔和阴影取代边框。

##### 改造点 4：交互降噪 — Drawer 取代 Modal

将以下内容从全屏居中 Modal 改为侧滑 Drawer：

| 当前方式 | 改造后 | 原因 |
|----------|--------|------|
| 设置 Modal (`showSettings`) | 右侧 Drawer | 设置项多但不需要遮罩全屏 |
| 收藏管理 Modal (`showFavoritesModal`) | 右侧 Drawer | 列表型内容适合 Drawer 浏览 |
| 历史记录 Modal (`showHistoryModal`) | 右栏内嵌折叠面板 | 高频访问，直接在工作区可见 |
| 删除确认 Modal (`skillToDelete`) | 行内 Popconfirm | 轻量化，减少打断 |
| Skill 详情 Modal (`selectedSkill`) | **保留 Modal**（大尺寸） | 内容丰富，确实需要大面积 |
| Skill 创建/编辑 Modal | **保留 Modal** | 表单需要焦点 |
| 收藏新增 Modal (`showFavoriteModal`) | **保留 Modal**（小尺寸） | 简短表单适合 Modal |

##### 改造点 5：Command Palette（Cmd+K / Ctrl+K）

| 项目 | 规格 |
|------|------|
| **触发方式** | `Ctrl+K`（Win）/ `Cmd+K`（Mac），或点击中栏顶部搜索框 |
| **搜索范围** | 设计类型（16 种）、技能名称/触发词、历史记录标题、收藏名称、设置项 |
| **快捷操作** | 切换暗色模式、切换中英文、加载/卸载模型、清空历史、打开设置 |
| **UI 形态** | 居中浮层，毛玻璃背景遮罩，输入框 + 即时结果列表，键盘上下选择回车执行 |
| **模糊搜索** | 支持拼音首字母匹配（如输入 "lgsj" 匹配 "Logo设计"） |
| **实现方式** | 纯前端 JS，监听全局 `keydown`，Alpine.js 控制显隐和结果过滤 |

#### 2.4.3 各 Tab 页在 Zen 布局中的具体映射

以下详细说明现有四个 Tab 页的内容如何适配到三栏架构：

##### Tab 1：设计助手 (`activeTab === 'design'`)

| 区域 | 内容 |
|------|------|
| **中栏上部** | 设计类型选择器（Bento 微缩卡片网格 2~3 列）。选中后卡片高亮，表单出现在下方 |
| **中栏下部** | 动态渲染的参数表单（品牌名、风格、色彩等变量字段）+ 风格参考选择器（Few-shot）+ 压缩开关 + "生成"按钮 |
| **右栏** | 生成结果展示（最终提示词卡片 + 结构化中文对照 + 匹配技能 badge + 推荐关键词 + 使用建议）+ 操作按钮（复制/收藏/重新生成/发送至动态设计） |

##### Tab 2：专业技能 (`activeTab === 'skills'`)

| 区域 | 内容 |
|------|------|
| **中栏** | 技能统计条（总数/已启用/触发词）+ 操作栏（创建/导入/扫描）+ 搜索过滤框 + 技能卡片列表（纵向排列，每张卡含启用开关/触发词/标签/操作按钮） |
| **右栏** | 选中某个 Skill 后显示详情（SKILL.md 内容渲染、参考文档、资源文件列表），未选中时显示空态引导图 |

##### Tab 3：动态设计 (`activeTab === 'dynamic'`)

| 区域 | 内容 |
|------|------|
| **中栏上部** | 独立 API 配置折叠面板（或来自设计助手的参数摘要卡片） |
| **中栏下部** | 设计类型选择 + 品牌名/标语/风格/颜色输入 + 动画效果配置（效果多选/时长/缓动/循环）+ "生成动态设计"按钮 |
| **右栏上部** | 实时预览 iframe（带全屏/刷新按钮） |
| **右栏下部** | 代码编辑器 textarea + 导出工具栏（HTML/复制/GIF/视频）+ 迭代修改输入框 |

##### Tab 4：AI 管理 (`activeTab === 'aiManage'`)

| 区域 | 内容 |
|------|------|
| **中栏** | 本地模型卡片（Qwen3-0.6B + Tiny-Toxic-Detector 状态/操作）+ 手动导入 + 内存监控 4 宫格（Chart.js 保留） |
| **右栏上部** | 安全审查配置（开关/统计/手动测试） |
| **右栏下部** | 离线模式设置 + 推理测试面板 + 系统信息卡片 |

#### 2.4.4 移动端响应式降级策略

三栏布局在小屏幕上需优雅降级：

| 断点 | 布局行为 |
|------|----------|
| **>= 1024px (lg)** | 完整三栏：Sidebar(60px) + 中栏(45%) + 右栏(55%) |
| **768px ~ 1023px (md)** | Sidebar 折叠为底部 Tab Bar（iOS 风格 4 图标），中栏和右栏上下堆叠，可通过 Tab 切换"配置/结果" |
| **< 768px (sm)** | 底部 Tab Bar + 全屏单栏，配置和结果通过内部 Tab 切换（"表单 -> 结果"引导流） |

底部 Tab Bar 图标沿用 Sidebar 的 Lucide 图标子集（设计助手/技能/动态/AI管理 4 个核心入口）。

---

### 2.5 国际化 (i18n) 双语支持方案

随着项目走向成熟（PromptAtelier），支持中文和英文双语界面成为刚需。

#### 2.5.1 实施策略

鉴于当前项目基于 Alpine.js + 纯前端 HTML，并没有 Webpack/Vite 构建工具，我们需要适合轻量级架构的 i18n 方案。

- **不建议做法**：后端路由渲染两套 HTML 页面。加倍维护成本，违背 SPA 操作体验。
- **推荐做法（前端动态替换）**：Alpine.js 全局 Store (`Alpine.store`) 结合 JSON 语言包资源。

#### 2.5.2 技术实现要点

**1. 语言字典（Language Dictionaries）**

创建两个 JavaScript 文件：`frontend/locales/zh.js` 和 `frontend/locales/en.js`。

```javascript
// frontend/locales/en.js
window.i18nData = window.i18nData || {};
window.i18nData.en = {
  nav: { design: "Design Assist", skills: "Pro Skills", video: "Motion", ai: "AI Manager" },
  actions: { generate: "Generate", copy: "Copy", clear: "Clear", favorite: "Favorite" },
  design: { selectType: "Select Design Type", fillInfo: "Fill Design Info", result: "Generated Result" }
  // ... 更多词条
};
```

**2. Alpine Store 注册**

```javascript
document.addEventListener('alpine:init', () => {
    Alpine.store('i18n', {
        lang: localStorage.getItem('atelier_lang') || 'zh',
        t(key) {
           return getNestedValue(window.i18nData[this.lang], key) || key;
        },
        toggle() {
            this.lang = this.lang === 'zh' ? 'en' : 'zh';
            localStorage.setItem('atelier_lang', this.lang);
        }
    });
});
```

**3. HTML 模板绑定**

```html
<!-- 改造前 -->
<span>设计助手</span>
<!-- 改造后 -->
<span x-text="$store.i18n.t('nav.design')"></span>
```

#### 2.5.3 动态数据的 i18n 处理

> **重要**：设计类型名称（"Logo设计""促销海报"等）来自后端 API (`data/templates.json`)，不是前端静态文本，纯 Alpine Store 方案覆盖不到。

**解决方案**：

| 数据来源 | 处理方式 |
|----------|----------|
| 前端静态 UI 文字（按钮、标签、提示语） | `$store.i18n.t('key')` 绑定 |
| `data/templates.json` 中的设计类型名称 | 为每个 preset 增加 `nameEn` 字段，前端根据当前语言选取 `preset.name` 或 `preset.nameEn` |
| 后端 API 返回的错误消息（中文） | **Phase 1 暂不处理**（保持中文），Phase 2 可选后端 i18n 中间件 |
| Skill 名称和描述 | 同上，`skills/index.json` 可扩展 `nameEn` / `descriptionEn` |

#### 2.5.4 实施时机建议

此功能涉及对全站近乎一半 HTML 节点的修改。

- **最佳切入点**：在 **Phase B（核心页面重设计）** 中同步进行。编写新布局 HTML 时，**直接写成 i18n 绑定的形式**，不做二次重构。
- **工作量评估**：翻译词条约 1-2 天，HTML 模板替换结合新 UI 边写边绑，只增加约 20% 额外时间。

---

## 三、实施路线图

### Phase 0：项目重命名（预计 0.5 天）

> 在任何 UI 改造之前，先完成品牌重命名，避免后续代码中新旧名称混用。

| 任务 | 说明 |
|------|------|
| 0.1 全局文本替换 | `PromptCraft` -> `PromptAtelier`，涉及 1.5 节列出的所有文件 |
| 0.2 localStorage 迁移逻辑 | 在 `script.js` 的 `init()` 中写入旧键 -> 新键的一次性迁移 |
| 0.3 package.json 更新 | `name`, `description`, `author`, `keywords` 字段 |
| 0.4 GitHub 仓库 | 重命名 Repo（可选，也可保留旧名不影响功能） |
| 0.5 验证 | `npm start` 确认所有功能正常，无硬编码的旧名残留 |

### Phase A：基础框架与 i18n 基建（预计 2-3 天）

| 任务 | 说明 |
|------|------|
| A1. 依赖引入 | 引入 Lucide Icons CDN（锁定 v0.312.0），验证加载 |
| A2. i18n 基建 | 创建 `frontend/locales/zh.js` + `en.js` 语言包骨架，实现 `Alpine.store('i18n')` |
| A3. 布局骨架 | 清理旧 Navbar + Tab 布局，实现 Slim Sidebar + 中栏 + 右栏 flex 容器 |
| A4. 品牌色系 | 更新 `style.css` 的 CSS 变量为新品牌色体系（见 2.4.2 改造点 2），确立 Dark-First |
| A5. 暗色精调 | 设定三级灰度背景 + 三级文字色 + 卡片微妙边框 |

### Phase B：核心"Zen"工作区渲染（预计 4-5 天）

| 任务 | 说明 |
|------|------|
| B1. Sidebar 导航 | 实现图标侧边栏，底部整合设置/主题/语言切换/AI状态灯 |
| B2. 设计助手三栏 | 中栏 = Bento 类型选择 + 参数表单；右栏 = 结果展示。**同步应用 i18n 绑定** |
| B3. 专业技能三栏 | 中栏 = 技能列表（纵向卡片）；右栏 = Skill 详情面板（替代原详情 Modal 的部分功能） |
| B4. 动态设计三栏 | 中栏 = 参数配置 + 动画选项；右栏 = 预览 iframe + 代码编辑器 |
| B5. AI 管理三栏 | 中栏 = 模型管理 + 内存监控；右栏 = 安全审查 + 离线 + 推理测试 |
| B6. Drawer 改造 | 设置/收藏使用 DaisyUI Drawer 从侧边滑出 |

### Phase C：交互细节与数据缝合（预计 3 天）

| 任务 | 说明 |
|------|------|
| C1. 数据层对接 | 将原有后端 API（生成提示词、调用大模型等）逻辑无缝接驳到新界面的 Alpine 事件 |
| C2. Command Palette | 实现 `Ctrl+K` 全局搜索面板 |
| C3. 微交互动效 | 骨架屏 (Skeleton)、悬浮高亮、按钮波纹、Tab 切换过渡 |
| C4. 语言包完善 | 补全所有中英文词条，处理 `templates.json` 的 `nameEn` 扩展字段 |
| C5. 移动端适配 | 实现底部 Tab Bar + 小屏单栏降级逻辑 |

### Phase D：测试与优化（预计 2 天）

| 任务 | 说明 |
|------|------|
| D1. 功能回归测试 | 逐一验证四个 Tab 的所有功能（生成/收藏/历史/技能CRUD/动态设计导出/AI管理）在新 UI 下正常工作 |
| D2. 跨浏览器测试 | Chrome / Firefox / Edge / Safari 兼容性 |
| D3. 双语校验 | 中英文切换下界面无错位、无漏翻译、动态数据正确切换 |
| D4. 性能优化 | 懒加载、CSS 精简、首屏加载速度检查 |
| D5. 无障碍审查 | ARIA 标签、键盘导航 (Tab/Enter/Esc)、焦点管理 |

**总预计工期：11.5 - 13.5 天**

```text
Phase 0 (0.5d)  ████
Phase A (2-3d)   ████████████
Phase B (4-5d)   ████████████████████
Phase C (3d)     ████████████
Phase D (2d)     ████████
```

---

## 四、即梦 AI 设计参考图生成提示词

以下提示词可在 [即梦 AI](https://jimeng.jianying.com/ai-tool/generate?type=image) 生成 UI 设计参考图：

### 提示词 1：全局布局参考（Zen Workspace 三栏）

```text
设计一款名为 PromptAtelier 的 AI 设计提示词工作台 Web 应用界面，深色主题，
左侧有 60px 宽的极简图标侧边栏导航（设计助手、专业技能、动态设计、AI管理四个SVG图标），
主内容区分为左右两个面板（左侧输入配置表单，右侧生成结果展示），
顶部有精简的搜索框（Cmd+K 快捷指令入口），
使用 Indigo-Violet-Cyan 三色渐变作为品牌色，毛玻璃效果的面板，
现代简约风格，类似 Notion 和 ChatGPT 的布局，
高清UI设计稿，Figma风格，4K分辨率
```

### 提示词 2：设计类型选择页

```text
设计一款AI工具的功能选择页面，深色主题，
使用Bento Grid（便当盒）不等大小的网格布局，
展示16种设计类型（Logo设计、促销海报、品牌海报、IP角色等），
每个卡片有精美的SVG线框图标和简短描述，
重点类型使用大尺寸卡片，次要类型使用小卡片，
Indigo-Violet 渐变品牌色，毛玻璃卡片效果，
现代简约风格，高清UI设计稿，4K分辨率
```

### 提示词 3：工作台界面

```text
设计一款AI提示词生成器的工作台界面，深色主题，
左侧是输入表单面板（品牌名称、设计风格、颜色方案等字段），
右侧是生成结果面板（显示英文提示词、推荐关键词标签、使用建议），
底部有操作按钮栏（生成、复制、收藏、导出），
Indigo-Violet-Cyan 三色渐变品牌色，圆角卡片，柔和阴影，
现代科技感UI设计，高清设计稿，4K分辨率
```

### 提示词 4：AI 管理面板

```text
设计一款本地AI模型管理面板的Web界面，深色主题，
左侧显示模型列表（文本生成模型、毒性检测模型），每个有状态标签和操作按钮，
右侧上方显示内存使用仪表盘（RSS内存、堆内存、系统可用），
右侧下方显示安全审查统计（通过/警告/拦截的数据可视化），
底部有推理测试区（输入框+测试按钮+结果展示），
使用 Indigo-Cyan 渐变品牌色，数据卡片有微妙的发光边框效果，
科技感强的现代UI设计稿，4K分辨率
```

### 提示词 5：移动端适配

```text
设计一款名为 PromptAtelier 的 AI 设计工具手机端界面，深色主题，
底部有iOS风格的Tab导航栏（4个SVG图标按钮），
主内容区展示设计类型的卡片网格（2列），
顶部有品牌Logo和搜索入口，
使用 Indigo-Violet 渐变品牌色，圆角卡片，
现代简约的移动端UI设计，iPhone 15 Pro屏幕尺寸，高清设计稿
```

---

## 附录：技术实现备注

### A. 新增 CDN 依赖

```html
<!-- Lucide Icons v0.312.0 (替换 Emoji，锁定版本) -->
<script src="https://unpkg.com/lucide@0.312.0/dist/umd/lucide.min.js"></script>

<!-- i18n 语言包 -->
<script src="locales/zh.js"></script>
<script src="locales/en.js"></script>
```

### B. 保留的现有依赖

以下依赖在 UI 重设计中**全部保留**，不移除：

| 依赖 | 用途 | 备注 |
|------|------|------|
| Alpine.js 3.13.3 | 响应式框架 | 核心，不换 Vue/React |
| DaisyUI 4.4.19+ | UI 组件库 | 可考虑升级到最新版获得更好的 Drawer/Skeleton 组件 |
| Tailwind CSS (CDN) | 原子化 CSS | 保持零构建方式 |
| Chart.js 4.4.1 | 图表/仪表盘 | AI 管理面板的内存监控使用 |
| html2canvas 1.4.1 | 截图 | 动态设计 GIF/视频导出依赖 |
| gif.js | GIF 生成 | 动态设计 GIF 导出依赖 |

### C. DaisyUI 升级考虑

当前使用 DaisyUI 4.4.19，可考虑升级到最新版以获得：

- 更好的 Drawer 组件支持
- 改进的暗色模式 `data-theme` 支持
- 新的 Skeleton 组件（用于加载态）
- 性能优化

### D. 保持兼容性原则

- **无构建步骤** — 继续保持 CDN 引入的零构建方式
- **后端 API 不变** — 所有 `/api/*` 路由保持不动，只改前端
- **数据文件不变** — `data/*.json` 结构保持兼容（仅扩展 `nameEn` 等可选字段）

---

> **最终确认清单**：
>
> - [x] 项目名称：**PromptAtelier**
> - [x] UI 架构：**Zen Workspace 三栏布局**
> - [x] 品牌色系：**Indigo (#6366F1) / Violet (#8B5CF6) / Cyan (#06B6D4)**
> - [x] 图标方案：**Lucide Icons v0.312.0**
> - [x] 国际化：**Alpine Store + JSON 语言包，Phase B 同步写入**
> - [x] 移动端：**底部 Tab Bar + 单栏降级**
> - [x] 四个 Tab 页的三栏映射：**已逐一详细定义**
> - [x] 测试阶段：**Phase D 包含功能回归 + 跨浏览器 + 双语校验 + 无障碍**
> - [ ] **待确认后开工** — 从 Phase 0（重命名）开始执行
