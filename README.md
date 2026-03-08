# PromptCraft

<div align="center">

**🎨 专业设计提示词生成器 | Professional Design Prompt Generator**

[![Version](https://img.shields.io/badge/version-4.3.0-blue.svg)](PROGRESS.md)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](package.json)

</div>

PromptCraft 是一个面向设计师和内容创作者的智能提示词生成器，专注于生成用于图像生成模型（如 Midjourney、DALL-E、Stable Diffusion、Flux 等）的专业提示词。支持中文输入，自动输出英文提示词。

PromptCraft is an intelligent prompt generator for designers and creators. It crafts production-ready prompts for image models (Midjourney, DALL-E, Stable Diffusion, Flux, etc.), accepting Chinese input and returning polished English outputs.

## 🆕 v4.3.0 更新 / What's New in v4.3.0
- ✂️ 提示词压缩服务（完整/精简/超轻量），新增端点：`/api/prompts/compress`、`/estimate-tokens`、`/compression-levels`、`/recommend-compression`
- 🖥️ 前端压缩控制：设置面板与生成界面提供压缩开关、等级选择与 Token 统计
- 📚 133+ 设计专业术语库（13 类），覆盖构图、灯光、色调、材质等
- 🎨 9 个设计角色参数升级（Logo、IP 角色、UI、图标、插画、书籍封面等），预设升级至 `presets.json v2.1.0`

## ✨ 核心功能 | Core Features

### 🎨 设计助手 / Design Assistant
- **16种专业设计角色 / 16 specialized roles**：Logo、促销/品牌海报、IP 角色、广告创意、包装、UI、图标、商业/儿童/概念插画、社交媒体、电商、名片、活动海报、书籍封面
- **动态参数系统 / Dynamic parameters**：每个角色配备风格、构图、色调、材质等专业参数
- **智能系统提示词 / Smart system prompts**：基于选择自动生成专业系统提示

### 🧰 预设模板库 / Preset Library
- **专业参数配置 / Pro parameter packs**：构图方式、相机角度、光影效果、输出精度等
- **设计术语库 / Design terminology**：133+ 专业设计术语，涵盖构图、光影、色彩、材质等 13 个分类
- **一键应用 / One-click apply**：选择设计角色后自动配置相关参数

### 🧠 Agent Skills 系统 / Agent Skills
可复用的专业知识模块，让 AI 生成更专业的提示词：

| Skill | 描述 |
|-------|------|
| 🎯 Logo 评审专家 | 专业分析和评估 Logo 设计 |
| 🎨 色彩理论大师 | 专业的色彩搭配和色彩心理学 |
| 💼 品牌战略顾问 | 品牌定位和战略指导 |
| 🇯🇵 日本传统色 | 188种日本传统颜色数据库 |

### 📝 历史记录与收藏 / History & Favorites
- **生成历史 / History**：自动保存提示词生成记录
- **收藏管理 / Favorites**：一键收藏常用提示词
- **快速复用 / Quick reuse**：从历史/收藏快速载入配置

### 🔌 多模型支持 / Multi-Model Support
- **云端服务 / Cloud APIs**：OpenAI、DeepSeek、智谱等兼容 OpenAI 格式的 API
- **本地部署 / Local**：支持 Ollama 本地模型

### ✂️ 提示词压缩 / Prompt Compression
- **三档压缩 / Three levels**：完整、精简、超轻量，覆盖 8K / 4K / 超轻量模型
- **Token 估算 / Token estimation**：快速估算提示词长度，自动推荐压缩等级
- **全链路集成 / End-to-end**：后端 API + 前端开关 + 统计信息

## 🚀 快速启动 | Quick Start

### 环境要求 / Requirements
- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装运行 / Install & Run

```bash
# 克隆仓库 / Clone
git clone https://github.com/yourusername/PromptCraft.git
cd PromptCraft

# 安装依赖 / Install dependencies
npm install

# 启动服务 / Start server
npm start

# 访问应用 / Visit app
# http://localhost:3000
```

### 运行测试 / Run Tests

```bash
npm test
```

## 📚 API 参考 | API Reference

### 设计提示词 | Design Prompts
| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/prompts/design-presets` | GET | 获取所有预设模板 |
| `/api/prompts/design-presets/:id/apply` | POST | 应用指定模板 |
| `/api/prompts/improve/ai` | POST | AI 优化提示词 |

### 提示词压缩 | Prompt Compression
| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/prompts/compress` | POST | 压缩提示词（完整/精简/超轻量） |
| `/api/prompts/estimate-tokens` | POST | 估算提示词 Token 数 |
| `/api/prompts/compression-levels` | GET | 获取压缩等级信息 |
| `/api/prompts/recommend-compression` | POST | 根据 Token 推荐压缩等级 |

### Skills
| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/skills` | GET | 获取所有 Skills |
| `/api/skills/context` | POST | 获取匹配的 Skills 上下文 |

### 历史与收藏 | History & Favorites
| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/history` | GET/POST/DELETE | 历史记录管理 |
| `/api/favorites` | GET/POST/DELETE | 收藏管理 |

## 📁 项目结构 | Project Structure

```
PromptCraft/
├── backend/              # 后端服务
│   ├── server.js         # 主服务入口
│   ├── routes/           # API 路由
│   │   ├── prompts.js    # 提示词相关
│   │   ├── skills.js     # Skills 相关
│   │   ├── history.js    # 历史记录
│   │   └── favorites.js  # 收藏管理
│   ├── services/         # 业务服务层
│   └── utils/            # 工具函数
├── frontend/             # 前端页面
│   ├── index.html        # 主页面
│   ├── script.js         # 交互逻辑
│   └── style.css         # 样式文件
├── skills/               # Agent Skills
│   ├── index.json        # Skills 索引
│   └── */SKILL.md        # Skill 定义文件
├── data/                 # 数据文件
│   ├── presets.json      # 设计预设配置
│   ├── professional-terms.json  # 专业术语库
│   ├── categories.json   # 分类配置
│   └── templates.json    # 模板配置
├── schemas/              # Schema 定义
├── docs/                 # 项目文档
└── rules/                # 开发规范
```

## 🛠️ 技术栈 | Tech Stack

- **后端 / Backend**：Node.js + Express
- **前端 / Frontend**：原生 HTML/CSS/JS + Alpine.js + DaisyUI
- **测试 / Testing**：Jest
- **代码规范 / Linting**：ESLint

## 🤖 自动化发布 | Automated Release

本项目使用 [semantic-release](https://github.com/semantic-release/semantic-release) 实现全自动版本管理和发布：

- ✅ 基于提交信息自动确定版本号（major/minor/patch）
- ✅ 自动生成和更新 CHANGELOG.md
- ✅ 自动创建 Git 标签
- ✅ 自动发布 GitHub Releases

**提交信息规范**：遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范

```bash
feat: 新功能 (minor version bump)
fix: 修复 bug (patch version bump)
feat!: 破坏性变更 (major version bump)
docs: 文档更新 (patch version bump)
chore: 其他变更 (no release)
```

详细说明请参考：[语义化发布配置文档](docs/SEMANTIC_RELEASE.md)

## 📚 文档

- [Agent Skills 使用指南](docs/Agent_Skills使用指南.md)
- [项目开发计划](docs/项目开发计划.md)
- [快速开始指南](rules/快速开始指南.md)
- [技术规范文档](rules/技术规范文档.md)
- [语义化发布配置](docs/SEMANTIC_RELEASE.md)

## 🔄 更新日志 / Release Notes

### v4.3.0 (2026-02)
- ✂️ 提示词压缩服务（完整/精简/超轻量），新增 `/compress`、`/estimate-tokens`、`/compression-levels`、`/recommend-compression` 端点 / Prompt compression engine with three levels and new endpoints
- 🖥️ 前端压缩控制：设置/生成界面提供压缩开关、等级选择与 Token 统计 / Frontend controls for compression with toggles, level picker, and token stats
- 📚 133+ 设计专业术语库（13 类），预设升级至 `presets.json v2.1.0` / 133+ design terms across 13 categories; presets updated to v2.1.0
- 🎨 9 个设计角色参数升级（Logo、IP 角色、UI、图标、商业/儿童/概念插画、社交媒体、书籍封面） / Nine design roles expanded with richer parameters

### v4.2.0
- 🧠 Agent Skills 系统上线（Logo 评审、色彩理论、品牌战略、日本传统色） / Agent Skills launched with four built-in experts
- 📝 历史记录与收藏功能 / History and favorites introduced
- 🎨 16 种设计角色预设 / 16 design role presets

## 📄 许可证 | License

本项目遵循 [MIT 许可证](LICENSE)。

---

<div align="center">

**如果这个项目对你有帮助，请给个 ⭐ Star 支持一下！**

Made with ❤️ by PromptCraft Team

</div>
