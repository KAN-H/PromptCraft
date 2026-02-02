# PromptCraft

<div align="center">

**🎨 专业设计提示词生成器 | Professional Design Prompt Generator**

[![Version](https://img.shields.io/badge/version-4.3.0-blue.svg)](PROGRESS.md)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](package.json)

</div>

PromptCraft 是一个面向设计师和内容创作者的智能提示词生成器，专注于生成用于图像生成模型（如 Midjourney、DALL-E、Stable Diffusion、Flux 等）的专业提示词。支持中文输入，自动输出英文提示词。

## ✨ 核心功能

### 🎨 设计助手
- **16种专业设计角色**：Logo设计、促销海报、品牌海报、IP角色、广告创意、包装设计、UI界面、图标设计、商业插画、儿童插画、概念艺术、社交媒体配图、电商产品图、名片设计、活动海报、书籍封面
- **动态参数系统**：每个设计角色配备专业参数（风格、构图、色调、材质等）
- **智能系统提示词**：根据选择自动生成专业的系统提示词

### � 预设模板库
- **专业参数配置**：构图方式、相机角度、光影效果、输出精度等
- **设计术语库**：133+ 专业设计术语，涵盖构图、光影、色彩、材质等13个分类
- **一键应用**：选择设计角色后自动配置相关参数

### 🧠 Agent Skills 系统
可复用的专业知识模块，让 AI 生成更专业的提示词：

| Skill | 描述 |
|-------|------|
| 🎯 Logo 评审专家 | 专业分析和评估 Logo 设计 |
| 🎨 色彩理论大师 | 专业的色彩搭配和色彩心理学 |
| 💼 品牌战略顾问 | 品牌定位和战略指导 |
| 🇯🇵 日本传统色 | 188种日本传统颜色数据库 |

### 📝 历史记录与收藏
- **生成历史**：自动保存提示词生成记录
- **收藏管理**：一键收藏常用提示词
- **快速复用**：从历史/收藏快速载入配置

### 🔌 多模型支持
- **云端服务**：OpenAI、DeepSeek、智谱等兼容 OpenAI 格式的 API
- **本地部署**：支持 Ollama 本地模型

## 🚀 快速启动

### 环境要求
- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装运行

```bash
# 克隆仓库
git clone https://github.com/yourusername/PromptCraft.git
cd PromptCraft

# 安装依赖
npm install

# 启动服务
npm start

# 访问应用
# 打开浏览器访问 http://localhost:3000
```

### 运行测试

```bash
npm test
```

## 📚 API 参考

### 设计提示词
| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/prompts/design-presets` | GET | 获取所有预设模板 |
| `/api/prompts/design-presets/:id/apply` | POST | 应用指定模板 |
| `/api/prompts/improve/ai` | POST | AI 优化提示词 |

### Skills
| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/skills` | GET | 获取所有 Skills |
| `/api/skills/context` | POST | 获取匹配的 Skills 上下文 |

### 历史与收藏
| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/history` | GET/POST/DELETE | 历史记录管理 |
| `/api/favorites` | GET/POST/DELETE | 收藏管理 |

## 📁 项目结构

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

## 🛠️ 技术栈

- **后端**：Node.js + Express
- **前端**：原生 HTML/CSS/JS + Alpine.js + DaisyUI
- **测试**：Jest
- **代码规范**：ESLint

## � 文档

- [Agent Skills 使用指南](docs/Agent_Skills使用指南.md)
- [项目开发计划](docs/项目开发计划.md)
- [快速开始指南](rules/快速开始指南.md)
- [技术规范文档](rules/技术规范文档.md)

## 🔄 更新日志

### v4.3.0 (2025-01)
- ✨ 新增专业设计术语库（133+术语，13个分类）
- 🎨 增强9个设计角色的专业参数配置
- 📊 Logo设计专家：新增构图、设计形式、创意方向、输出精度等参数
- 🎭 IP角色设计：新增角色风格、时代风格、中国风元素等参数

### v4.2.0
- 🧠 Agent Skills 系统上线
- 📝 历史记录与收藏功能
- 🎨 16种设计角色预设

## �📄 许可证

本项目遵循 [MIT 许可证](LICENSE)。

---

<div align="center">

**如果这个项目对你有帮助，请给个 ⭐ Star 支持一下！**

Made with ❤️ by PromptCraft Team

</div>
