# PromptAtelier 提示词生成器

🚀 **6小时极速开发的智能提示词生成工具**

## 📋 项目概述

PromptAtelier是一款轻量化、高效的AI提示词生成工具，专注于为用户快速生成多种风格的高质量提示词。本项目采用极简架构设计，确保在6小时内完成从开发到部署的全流程。

### ✨ 核心特性

- 🎯 **三种提示词风格**：专业逻辑型、创意激发型、简洁实用型
- ⚡ **快速响应**：3秒内生成结果
- 📱 **响应式设计**：完美适配桌面端和移动端
- 🔄 **一键操作**：生成、复制、重新生成一键完成
- 💾 **轻量架构**：无数据库依赖，纯文件存储

## 🚀 快速开始

### 环境要求
- Node.js 18.0.0+
- npm 8.0.0+

### 安装与运行

```bash
# 1. 克隆项目
git clone <repository-url>
cd PromptAtelier

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev

# 4. 访问应用
# 浏览器打开: http://localhost:3000
```

### 生产部署

```bash
# 使用PM2部署
npm install -g pm2
npm start
pm2 start ecosystem.config.js --env production
```

## 🏗️ 项目结构

```
PromptAtelier/
├── README.md                 # 项目说明
├── package.json             # 依赖配置
├── PRD-优化版.md            # 产品需求文档
├── 技术规范文档.md           # 技术规范
├── 开发流程规范.md           # 开发流程
├── 部署运维规范.md           # 部署运维
├── frontend/                # 前端代码
│   ├── index.html          # 主页面
│   ├── style.css           # 样式文件
│   └── script.js           # 功能脚本
├── backend/                 # 后端代码
│   ├── server.js           # 服务器入口
│   ├── routes/             # 路由目录
│   ├── utils/              # 工具函数
│   └── middleware/         # 中间件
├── data/                   # 数据文件
│   └── templates.json      # 提示词模板
└── logs/                   # 日志文件
```

## 🎯 功能特性

### 用户界面
- 简洁直观的输入界面
- 实时字符计数显示
- 加载状态反馈
- 响应式布局设计

### 提示词生成
- **专业逻辑型**：严谨、符合逻辑的提示词
- **创意激发型**：富有想象力、开放性的提示词
- **简洁实用型**：直接、高效的提示词

### 用户操作
- 一键生成提示词
- 单个复制功能
- 全部复制功能
- 重新生成功能

## 🔧 API文档

### 生成提示词

```http
POST /api/generate
Content-Type: application/json

{
  "input": "用户输入内容"
}
```

**响应示例：**
```json
{
  "success": true,
  "data": [
    {
      "style": "professional",
      "prompt": "请以专业的角度分析用户输入内容，提供详细的逻辑推理过程..."
    },
    {
      "style": "creative",
      "prompt": "发挥你的想象力，围绕用户输入内容创造一个独特的故事..."
    },
    {
      "style": "simple",
      "prompt": "简单直接地解释用户输入内容的核心要点..."
    }
  ]
}
```

### 健康检查

```http
GET /health
```

## 🛠️ 开发指南

### 开发时间规划（6小时）
- **0-2小时**：后端开发（API + 数据层）
- **2-4.5小时**：前端开发（界面 + 交互）
- **4.5-6小时**：测试部署（验证 + 优化）

### 技术栈
- **前端**：HTML5 + CSS3 + Vanilla JavaScript + Tailwind CSS
- **后端**：Node.js + Express.js
- **数据**：JSON文件存储
- **部署**：PM2 + Nginx（可选）

### 开发原则
- 简单优先，避免过度设计
- 功能完整性优于代码优雅性
- 快速迭代，边开发边测试
- 时间严控，严格按计划执行

## 📊 性能指标

- **响应时间**：< 3秒
- **页面加载**：< 2秒
- **并发支持**：10用户
- **可用性**：99%+

## 🔒 安全特性

- 输入验证和过滤
- XSS攻击防护
- 请求频率限制
- 安全头配置

## 📈 监控运维

### 健康检查
```bash
curl http://localhost:3000/health
```

### 日志查看
```bash
# PM2日志
pm2 logs prompt-atelier

# 应用日志
tail -f logs/app.log
```

### 性能监控
- API响应时间监控
- 内存使用监控
- 错误率监控

## 🚀 部署选项

### 1. 本地开发
```bash
npm run dev
```

### 2. PM2生产部署
```bash
pm2 start ecosystem.config.js --env production
```

### 3. Docker部署
```bash
docker build -t prompt-atelier .
docker run -p 8080:8080 prompt-atelier
```

### 4. 云服务部署
- **前端**：Vercel/Netlify
- **后端**：Railway/Render/Heroku

## 🔄 版本迭代

### v1.0 (MVP - 6小时)
- [x] 基础提示词生成功能
- [x] 三种风格支持
- [x] 响应式界面
- [x] 复制功能

### v1.1 (计划 - 2小时)
- [ ] 历史记录功能
- [ ] 提示词评分
- [ ] 用户偏好设置

### v2.0 (长期)
- [ ] 用户系统
- [ ] 数据库持久化
- [ ] 更多风格选项
- [ ] AI模型集成

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📝 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系我们

- 项目主页：[GitHub Repository]
- 问题反馈：[Issues Page]
- 邮箱：support@prompt-atelier.com

---

⭐ 如果这个项目对你有帮助，请给我们一个星标！
