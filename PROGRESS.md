# PromptAtelier 项目进| Phase 15: 提示词增强(离线模式) | ✅ 后端完成 | 2026-02-27 |
| Phase 16: 前端集成 | ✅ 完成 | 2026-02-27 |
| Phase 17: 测试与优化 | ✅ 完成 | 2026-02-27 |
| 项目清理 | ✅ 完成 | 2026-01-31 |
| **Phase A: 基础框架与 i18n 基建** | ✅ 完成 | 2026-03-05 |
| **Phase B2: 设计助手三栏布局** | ✅ 完成 | 2026-03-06 |

**测试统计：19 个测试套件，519 项测试全部通过 ✅** 最后更新: 2026-03-06 | v6.0.0-alpha (Phase B2)

## 📊 总体进度

| 阶段 | 状态 | 完成日期 |
|------|------|----------|
| Phase 1-6: 基础功能 | ✅ 完成 | - |
| Phase 7: Agent Skills 系统 | ✅ 完成 | 2026-01-29 |
| Phase 8: UI 简化重构 | ✅ 完成 | 2026-01-30 |
| Phase 9: API 现代化 | ✅ 完成 | 2026-01-31 |
| Phase 10: 历史记录与收藏系统 | ✅ 完成 | 2026-01-31 |
| Phase 11: 设计角色专业化升级 | ✅ 完成 | 2026-02-02 |
| Phase 12: 超轻量模型优化 | ✅ 完成 | 2026-02-03 |
| Phase 13: 超轻量本地模型集成 | ✅ 后端完成 | 2026-02-26 |
| Phase 14: 安全审查系统 | ✅ 后端完成 | 2026-02-27 |
| Phase 15: 提示词增强(离线模式) | ✅ 后端完成 | 2026-02-27 |
| Phase 16: 前端集成 | ✅ 完成 | 2026-02-27 |
| Phase 17: 测试与优化 | ✅ 完成 | 2026-02-27 |
| 项目清理 | ✅ 完成 | 2026-01-31 |
| **Phase A: 基础框架与 i18n 基建** | ✅ 完成 | 2026-03-05 |
| **Phase B2: 设计助手三栏布局** | ✅ 完成 | 2026-03-06 |

**测试统计：19 个测试套件，519 项测试全部通过 ✅**

---

## 🎨 Phase B2: 设计助手三栏布局 (2026-03-06) — v6.0.0-alpha

### B2.1 概述 ✅

**目标：** 将 Tab 1（设计助手）从单栏布局改造为三栏 Zen Workspace 布局（sidebar + center + right），完成 i18n 全量替换、Lucide 图标替换、inline style 清零

### B2.2 CSS 新增

#### B2.2.1 布局类
- `.zen-tab-split` — 双面板 Tab 容器（display:flex, 中栏 45% + 右栏 55%）
- `.zen-tab-full` — 单栏 Tab 容器（Tab 2/3/4 临时使用，display:block, overflow-y:auto）
- 响应式：`<1024px` 时 `zen-tab-split` 垂直堆叠

#### B2.2.2 Bento 网格
- `.bento-grid` — 3 列网格选择器（设计类型选择）
- `.bento-card` — 玻璃质感卡片，选中态品牌色边框+渐变背景
- `.bento-icon` — 36px 图标容器，品牌渐变背景
- 响应式：`<768px` 时降为 2 列

#### B2.2.3 工具类
- Lucide 图标尺寸：`.lucide-xxl`(64px) / `.lucide-xl`(36px) / `.lucide-lg`(18px) / `.lucide-md`(16px) / `.lucide-sm`(14px) / `.lucide-xs`(12px) / `.lucide-inline`(12px 行内) / `.lucide-inline-sm`(14px 行内)
- Lucide 色彩：`.lucide-brand` / `.lucide-brand2` / `.lucide-accent` / `.lucide-success`
- 表面背景：`.bg-surface-2` / `.bg-surface-3`
- 品牌按钮：`.btn-brand-secondary`(紫色半透明) / `.btn-brand-accent`(青色半透明)
- 品牌边框：`.border-l-success` / `.border-l-accent`
- 徽章：`.badge-success-soft`
- 空态：`.zen-empty-state` 含 `min-height: 60vh`
- 结果高亮：`.result-highlight` 品牌渐变背景 + 顶部彩条

### B2.3 HTML 改造

#### B2.3.1 Tab 1 完全重写 ✅
- **zen-center（左面板）**：设计类型 Bento 选择器 → 参数表单 → 风格参考 → 压缩开关 → 生成按钮
- **zen-right（右面板）**：空态占位 → 最终提示词卡片 → 结构化折叠 → 压缩统计 → 匹配技能 → 推荐关键词 → 输出建议 → 操作按钮组 → 动态设计按钮
- 所有中文文本 → `$store.i18n.t()` 绑定（64处引用）
- 所有 emoji → Lucide `<i data-lucide="...">` 图标（37个）
- 所有 inline style → CSS 工具类（Tab 1 内 inline style 归零）

#### B2.3.2 Tabs 2/3/4 包装 ✅
- Tab 2 (Skills)、Tab 3 (动态设计)、Tab 4 (AI 管理) 外层 div 添加 `class="zen-tab-full"`
- `zen-main` 移除 `zen-main-single` 类

### B2.4 测试结果 ✅
- 19 个测试套件，519 项测试全部通过
- 静态资源：style.css 29KB / script.js 112KB / zh.js 12KB / en.js 12KB 全部 200
- API 端点：categories/presets/skills/history/favorites/models/safety 全部正常
- Tab 1 inline style 完全清零
- 结构验证：zen-tab-split×1 / zen-tab-full×3 / bento-card×1 / data-lucide×37 / i18n×64

---

## 🎨 Phase A: 基础框架与 i18n 基建 (2026-03-05) — v6.0.0-alpha

### A.1 概述 ✅

**目标：** Zen Workspace 布局骨架 + Lucide Icons 集成 + i18n 国际化基建 + 品牌设计体系

### A.2 新增文件

#### A.2.1 `frontend/locales/zh.js` — 中文语言包 ✅
- `window.i18nData.zh` 全量中文翻译（品牌、导航、操作、设计、Skills、动态设计、AI、设置、历史、收藏、时间、消息）
- 覆盖所有 UI 文案，支持 dot-notation 键路径访问

#### A.2.2 `frontend/locales/en.js` — 英文语言包 ✅
- `window.i18nData.en` 完整英文翻译，结构与中文包一一对应
- 支持无缝中英切换

#### A.2.3 `frontend/style.css` — Zen Workspace 设计系统 ✅
- **CSS 设计令牌：** 品牌色（Indigo #6366F1、Violet #8B5CF6、Cyan #06B6D4）、暗色表面系统、圆角/间距/动画变量
- **Zen Workspace 布局：** `.zen-workspace` flex 容器 + `.zen-sidebar` (60px 固定宽) + `.zen-main` 自适应内容区
- **Phase A 单列模式：** `.zen-main-single` class 实现过渡期单列布局
- **Glass Card 系统：** `.glass-card` 毛玻璃卡片 + 4 种尺寸 (sm/md/lg/xl)
- **品牌按钮：** `.btn-brand-primary/secondary/accent` 渐变按钮
- **侧边栏导航：** `.zen-nav-btn` 带 tooltip 的图标按钮
- **移动端适配：** `.zen-mobile-tabbar` 底部导航栏 + 响应式断点 (1024px/768px)
- **滚动条美化、暗色模式优化、旧 navbar 隐藏**

### A.3 修改文件

#### A.3.1 `frontend/index.html` 重构 ✅
- **HEAD 新增：** Lucide Icons CDN v0.312.0 + `window.i18nData` 初始化 + 语言包 script 引入
- **Body 重构：** 旧 120+ 行 navbar → 新 Zen Sidebar（Lucide 图标导航、主题/语言切换、AI 状态指示器）
- **布局包裹：** 4 个 Tab 内容区由 `.zen-main.zen-main-single` 包裹
- **移动端 Tabbar：** 底部 4 按钮导航栏，响应式显示
- **Alpine.store('i18n')：** 内联注册 i18n store（`t()` 翻译方法、`toggle()` 中英切换、`setLocale()` 手动设置）
- **DOMContentLoaded：** 自动调用 `lucide.createIcons()` 渲染图标
- **无障碍优化：** 所有导航按钮添加 `:aria-label` 动态绑定

#### A.3.2 `frontend/script.js` 更新 ✅
- `init()` 末尾新增 `_refreshIcons()` 调用 + `$nextTick` Lucide 图标初始化
- 新增 `_refreshIcons()` 辅助方法（安全调用 `lucide.createIcons()`）
- `toggleTheme()` 切换后自动刷新 Lucide 图标

### A.4 功能测试结果

| 测试项 | 结果 |
|--------|------|
| 服务器启动 | ✅ 正常 (localhost:3000) |
| 分类 API | ✅ 返回正确数据 |
| 模板 API | ✅ 正常 |
| Skills API | ✅ 4 个 Skills 加载 |
| 历史记录 API | ✅ 30 条记录 |
| 收藏 API | ✅ 3 条收藏 |
| 模型状态 API | ✅ Qwen3-0.6B 正常 |
| 安全统计 API | ✅ 正常 |
| 提示词生成 API | ✅ 生成成功 |
| 前端静态资源 | ✅ 全部 200 OK |
| zh.js 语言包 | ✅ 11,810 bytes |
| en.js 语言包 | ✅ 11,526 bytes |
| style.css | ✅ 24,060 bytes |
| 单元测试 | ✅ 19 套件 / 519 测试全部通过 |

---

## 🎯 Phase 17: 测试与优化 (2026-02-27) — v5.0.0 最终阶段

### 17.1 概述 ✅

**目标：** 全面测试覆盖 + 性能优化 + 文档完善 + 版本发布

### 17.2 新增功能

#### 17.2.1 空闲自动卸载 ✅
- `localModelManager.js` 新增 `_lastUsedAt` 时间戳追踪（generate/classify 自动记录）
- 新增 `setIdleTimeout(minutes)` / `getIdleTimeout()` 配置接口（默认 30 分钟）
- 新增 `startIdleCheck()` / `stopIdleCheck()` 定时器管理
- 内部 `_performIdleCheck()` 每 5 分钟检查，超时自动卸载所有已加载模型
- 发出 `model:idle-unload` 事件，`shutdown()` 自动停止定时器
- `.unref()` 避免阻止 Node.js 进程退出

#### 17.2.2 错误自动恢复 ✅
- `generate()` 方法增加 context/sequence 损坏检测（正则匹配 `sequence|context|disposed`）
- 检测到异常后自动重建：dispose 旧 context → 创建新 context → 分配新 sequence → 重试生成
- 重建失败时抛出带详细信息的错误

### 17.3 新增/修改的文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `backend/services/localModelManager.js` | 增强 | 空闲自动卸载 + 错误恢复 + _lastUsedAt |
| `backend/utils/__tests__/e2eWorkflow.test.js` | 新建 | E2E 端到端工作流集成测试 (26项) |
| `backend/utils/__tests__/performanceMemory.test.js` | 新建 | 性能/内存/空闲卸载/状态管理测试 (32项) |
| `README.md` | 重写 | 升级到 v5.0.0，新增本地 AI/安全/离线章节 |
| `package.json` | 更新 | 版本 4.3.0 → 5.0.0 |
| `PROGRESS.md` | 更新 | Phase 17 完成记录 |

### 17.4 测试覆盖

| 测试文件 | 用例数 | 覆盖范围 |
|----------|--------|----------|
| `e2eWorkflow.test.js` | 26 | 模型生命周期链、AI 优化 preferLocal、安全审查、错误恢复降级、并发安全、跨模块联动 |
| `performanceMemory.test.js` | 32 | 空闲自动卸载(10)、错误恢复(3)、内存信息(4)、状态管理(7)、注册表(5)、工具方法(3)、生命周期(3) |

**测试增长：17 套件 461 项 → 19 套件 519 项（+58 项新测试）**

### 17.5 版本发布 v5.0.0

**README.md 更新要点：**
- 版本 badge 4.3.0 → 5.0.0 + 测试 badge (500+ passed)
- 新增「🤖 本地 AI 模型」章节（嵌入式推理/三层降级/空闲卸载/错误恢复）
- 新增「🛡️ 内容安全审查」章节
- 新增「模型管理 API」和「安全审查 API」端点表
- 项目结构新增 models/ + services/ + middleware/ 条目
- 技术栈新增 node-llama-cpp + @huggingface/transformers
- 更新日志新增 v5.0.0 条目

---

## 🎯 Phase 16: 前端集成 (2026-02-27)

### 16.1 概述 ✅

**设计目标：**
- 将 Phase 13-15 后端功能（本地模型管理、安全审查、离线模式）整合到前端 UI
- 新增「🤖 AI 管理」选项卡，统一管理本地模型、安全审查和离线模式
- AI 改进接口支持 `preferLocal` / `fallbackToLocal` 选项，前端可感知降级来源
- 完全基于 Alpine.js + DaisyUI 技术栈，无新增依赖

### 16.2 修改/创建的文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `frontend/script.js` | 增强 | 版本升级 5.0.0，新增 AI 管理全部方法和状态变量 |
| `frontend/index.html` | 增强 | 新增 AI 管理面板、导航栏指示器、设置面板离线选项 |
| `backend/routes/prompts.js` | 增强 | `POST /improve/ai` 接受并传递 `preferLocal`/`fallbackToLocal` |
| `backend/utils/__tests__/phase16Integration.test.js` | 新建 | 路由集成测试 (12项) |

### 16.3 前端新增功能

**导航与指示器：**
- 第 4 个标签页「🤖 AI 管理」，进入时自动轮询模型状态（10 秒间隔）
- 导航栏右侧实时状态指示灯（绿色=可用 / 黄色=部分可用 / 灰色=不可用）

**AI 管理面板（5 大区块）：**

| 区块 | 功能 |
|------|------|
| 模型管理 | 显示所有注册模型，每个模型可 下载/加载/卸载/删除，下载进度条（SSE 实时推送） |
| 内存监控 | 系统内存用量/总量/百分比，进度条可视化 |
| 模型测试 | 生成文本测试（textarea 输入→输出）+ 毒性分类测试 |
| 安全审查 | 启用/禁用开关、统计数据展示（总检查/阻止/警告/通过）、手动审查测试 |
| 离线模式 | `preferLocal` 开关，解释三层降级逻辑，偏好保存到 localStorage |

**设置面板更新：**
- 在压缩设置上方新增「🤖 离线模式」区块，可快速切换本地优先模式

**AI 改进响应增强：**
- `fetch` 请求携带 `preferLocal` 参数
- 响应识别 `source`（api/local/rule_engine）、`fallback`（是否降级）
- 降级时自动弹出 toast 通知用户使用了降级方案

### 16.4 后端路由更新

**`POST /api/prompts/improve/ai`：**
```
Request Body 新增字段:
  - preferLocal: boolean (default: false)  — 优先使用本地模型
  - fallbackToLocal: boolean (default: true) — API 失败时降级到本地

Response Data 新增字段:
  - source: 'api' | 'local' | 'rule_engine'
  - model: string (使用的模型名称)
  - fallback: boolean (是否经过降级)
  - apiError: string (降级时的原始错误)
```

### 16.5 前端新增方法清单

| 方法 | 功能 | 调用的 API |
|------|------|-----------|
| `loadLocalModelStatus()` | 加载模型状态列表 | `GET /api/models/status` |
| `startModelStatusPolling()` | 启动 10s 轮询 | — |
| `stopModelStatusPolling()` | 停止轮询 | — |
| `downloadModel(modelId)` | 下载模型 + SSE 进度 | `POST /api/models/:id/download` + EventSource |
| `loadModel(modelId)` | 加载模型到内存 | `POST /api/models/:id/load` |
| `unloadModel(modelId)` | 卸载模型 | `POST /api/models/:id/unload` |
| `deleteModel(modelId)` | 删除模型文件 | `DELETE /api/models/:id` |
| `testModelGenerate()` | 测试文本生成 | `POST /api/models/test/generate` |
| `testModelClassify()` | 测试毒性分类 | `POST /api/models/test/classify` |
| `formatBytes(bytes)` | 字节格式化工具 | — |
| `getModelStatusColor(status)` | 状态颜色映射 | — |
| `getModelStatusText(status)` | 状态文本映射 | — |
| `loadSafetyConfig()` | 加载安全配置 | `GET /api/safety/config` |
| `updateSafetyConfig()` | 更新安全配置 | `PUT /api/safety/config` |
| `loadSafetyStats()` | 加载安全统计 | `GET /api/safety/stats` |
| `testSafetyCheck()` | 手动安全审查 | `POST /api/safety/check` |
| `toggleOfflineMode()` | 切换离线模式 | — (localStorage) |

### 16.6 测试覆盖

| 测试文件 | 用例数 | 覆盖范围 |
|----------|--------|----------|
| `phase16Integration.test.js` | 12 | 路由 aiOptions 默认值、preferLocal 传递、fallbackToLocal 传递、组合传递、systemPrompt 兼容、source/fallback/model 透传、analysis 透传、错误处理 |

---

## 🎯 Phase 15: 提示词增强·离线模式 (2026-02-27)

### 15.1 三层降级推理架构 ✅

**设计目标：**
- 让提示词改进功能在离线环境下也能工作
- 实现 外部 API → 本地模型 → 规则引擎 三层自动降级
- 长提示词自动压缩以适配本地小模型（2048 token 限制）
- 完全向后兼容，旧版调用方式无需修改

**架构：**
```
Layer 1: 外部 API（OpenAI 兼容格式）— 最高质量
Layer 2: 本地模型（Qwen3-0.6B + 自动提示词压缩）— 离线可用
Layer 3: 规则引擎（调用方自行兜底）— 零依赖
```

### 15.2 修改/创建的文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `backend/services/llmService.js` | 增强 v3.0.0 | 新增 `isLocalModelAvailable()`, `callLocalModel()`, `callWithFallback()` |
| `backend/services/improverService.js` | 增强 | 重写 `improveWithAI()`, 新增 `improveLocal()`, `_improveWithLocalModel()` |
| `backend/utils/__tests__/llmServiceLocal.test.js` | 新建 | LLM 服务本地模型集成测试 (17项) |
| `backend/utils/__tests__/improverServiceLocal.test.js` | 新建 | 改进服务降级行为测试 (15项) |

### 15.3 核心方法

**llmService (v3.0.0)：**

| 方法 | 功能 | 参数 |
|------|------|------|
| `isLocalModelAvailable()` | 检查本地模型是否可用 | 无 |
| `callLocalModel(prompt, systemPrompt, options)` | 直接调用本地模型 | `maxTokens`, `temperature`, `thinking`, `compress`, `compressionLevel` |
| `callWithFallback(prompt, systemPrompt, config, options)` | 外部 API + 本地模型自动降级 | `allowLocalFallback`, `localMaxTokens`, `localTemperature` |

**improverService：**

| 方法 | 功能 | 参数 |
|------|------|------|
| `improveWithAI(prompt, config, customSystemPrompt, aiOptions)` | 增强版 AI 改进 | `aiOptions: { fallbackToLocal, preferLocal }` |
| `improveLocal(prompt, localOptions)` | 直接使用本地模型改进 | `maxTokens`, `temperature` |
| `_improveWithLocalModel(...)` | 内部本地模型调用辅助 | 私有方法 |

### 15.4 核心特性

**自动提示词压缩：**
- 当估算 token > 1500 时，自动使用 LITE 级压缩
- 当估算 token > 3000 时，自动使用 ULTRA 级压缩
- 可通过 `compress: false` 选项禁用

**智能降级策略：**
| 场景 | 行为 |
|------|------|
| API 正常 | 直接使用外部 API |
| API 失败 + 本地可用 | 自动降级到本地模型 |
| API 失败 + 本地不可用 | 抛出原始 API 错误 |
| 无 API 配置 + 本地可用 | 直接使用本地模型 |
| `preferLocal=true` | 优先使用本地模型（不调外部 API） |
| 429 限流耗尽 | 自动降级到本地模型 |

**Bug 修复（同步完成）：**
- 修复 `promptCompressorService` 导入方式（需解构导入）
- 修复 429 重试耗尽后 `lastError` 为 `undefined` 的潜在 crash

### 15.5 测试覆盖

| 测试文件 | 用例数 | 覆盖范围 |
|----------|--------|----------|
| `llmServiceLocal.test.js` | 17 | isLocalModelAvailable, callLocalModel（压缩/不压缩/失败/选项传递）, callWithFallback（降级/429/错误传播） |
| `improverServiceLocal.test.js` | 15 | improveWithAI 降级行为, preferLocal 模式, 无 API 配置, improveLocal, 向后兼容性 |

---

## 🎯 Phase 14: 安全审查系统 (2026-02-27)

### 14.1 三层安全审查架构 ✅

**设计目标：**
- 构建内容安全审查系统，防止生成不当内容
- 设计领域术语白名单，避免 "nude tone"（裸色调）等术语被误报
- 三层审查链：关键词 → AI 分类 → 语义审查
- 优雅降级：AI 不可用时退回关键词过滤

**架构：**
```
Layer 1: 关键词预过滤（正则匹配，零延迟，零依赖）
Layer 2: AI 毒性分类（Tiny-Toxic-Detector ONNX 模型）
Layer 3: 语义深度审查（Qwen3-0.6B，可选高级场景）
```

### 14.2 创建的文件

| 文件 | 说明 | 行数 |
|------|------|------|
| `backend/services/safetyService.js` | 安全审查服务核心 | 616 |
| `backend/middleware/safetyMiddleware.js` | Express 安全中间件 | 164 |
| `backend/routes/safety.js` | 安全审查 API 路由 | 164 |
| `data/safety-config.json` | 安全配置文件 | 190 |
| `backend/utils/__tests__/safetyService.test.js` | 服务单元测试 (49项) | 371 |
| `backend/utils/__tests__/safetyMiddleware.test.js` | 中间件测试 (22项) | ~200 |
| `backend/utils/__tests__/safetyRoute.test.js` | 路由测试 (16项) | ~180 |

### 14.3 安全审查 API

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/safety/check` | POST | 手动审查文本 |
| `/api/safety/config` | GET | 获取安全配置 |
| `/api/safety/config` | PUT | 更新安全配置 |
| `/api/safety/stats` | GET | 获取审查统计 |
| `/api/safety/stats/reset` | POST | 重置审查统计 |

### 14.4 核心特性

**设计安全词白名单（87个）：**
- 防止设计术语误报：nude tone(裸色调), bleed(出血位), body copy(正文), kill fee(中止费), strip(条状设计) 等
- 覆盖色彩、排版、印刷、构图、材质等设计领域术语

**安全分类与处理策略：**
| 分类 | 阈值 | 动作 |
|------|------|------|
| toxic | 0.7 | block |
| insult | 0.7 | warn |
| threat | 0.6 | block |
| hate | 0.6 | block |
| sexual | 0.8 | warn |

**中间件特性：**
- 自动拦截 POST/PUT 到受保护路径
- 从请求体提取所有文本字段进行审查
- block → 403, warn → header 标记, pass → 放行
- 错误降级：中间件异常不阻塞请求

### 14.5 Server 集成

```javascript
// backend/server.js 修改
const safetyService = require('./services/safetyService');
const createSafetyMiddleware = require('./middleware/safetyMiddleware');
app.use(createSafetyMiddleware());          // 路由之前注册
app.use('/api/safety', require('./routes/safety'));
// 健康检查包含安全状态
// 启动时初始化 safetyService.initialize()
```

### 14.6 测试结果

- ✅ safetyService.test.js — **49 项通过**
- ✅ safetyMiddleware.test.js — **22 项通过**
- ✅ safetyRoute.test.js — **16 项通过**
- ✅ 全量回归测试 — **417 项全部通过**

---

## 🎯 Phase 13: 超轻量本地模型集成 (2026-02-26)

### 13.1 本地模型管理系统 ✅

**设计目标：**
- 构建完整的本地 AI 模型管理系统
- 支持 GGUF (node-llama-cpp) 和 ONNX (@huggingface/transformers) 双引擎
- 模型按需下载、延迟加载、自动卸载
- ESM-only 库通过 dynamic import() 在 CommonJS 中使用

**创建的文件：**
| 文件 | 说明 | 行数 |
|------|------|------|
| `backend/services/localModelManager.js` | 本地模型管理器核心 | 1189 |
| `backend/routes/models.js` | 模型管理 API 路由 | 479 |
| `backend/utils/__tests__/localModelManager.test.js` | 管理器测试 (43项) | ~500 |
| `backend/utils/__tests__/modelsRoute.test.js` | 路由测试 (18项) | ~300 |

### 13.2 支持的模型

| 模型 ID | 名称 | 类型 | 运行时 | 大小 |
|---------|------|------|--------|------|
| `qwen3-0.6b` | Qwen3-0.6B | 文本生成 | node-llama-cpp | ~462MB |
| `tiny-toxic-detector` | Tiny-Toxic-Detector | 文本分类 | @huggingface/transformers | ~10MB |

### 13.3 模型管理 API（13 个端点）

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/models/status` | GET | 所有模型综合状态 |
| `/api/models/registry` | GET | 模型注册表 |
| `/api/models/:modelId/status` | GET | 单个模型状态 |
| `/api/models/:modelId/download` | POST | 下载模型 |
| `/api/models/download-progress` | GET | 下载进度 SSE 推送 |
| `/api/models/:modelId/load` | POST | 加载模型到内存 |
| `/api/models/:modelId/unload` | POST | 卸载模型 |
| `/api/models/:modelId` | DELETE | 删除已下载模型 |
| `/api/models/scan` | POST | 扫描 models/ 目录 |
| `/api/models/:modelId/import` | POST | 从外部路径导入 |
| `/api/models/test/generate` | POST | 测试文本生成 |
| `/api/models/test/classify` | POST | 测试文本分类 |
| `/api/models/memory` | GET | 内存使用信息 |

### 13.4 核心特性

**模型生命周期管理：**
```
NOT_DOWNLOADED → DOWNLOADING → DOWNLOADED → LOADING → LOADED
```

**手动导入支持：**
- `scanModels()` — 扫描 models/ 目录识别手动放入的模型文件
- `importModel()` — 从任意路径导入模型文件
- `MODEL_FILE_PATTERNS` — 智能文件名模式匹配（支持多种命名变体）

**三层降级架构：**
```
外部 API（最高质量） → 本地模型（离线可用） → 规则引擎（零依赖兜底）
```

### 13.5 测试结果

- ✅ localModelManager.test.js — **43 项通过**
- ✅ modelsRoute.test.js — **18 项通过**

---

## 🎯 Phase 12: 超轻量模型优化 (2026-02-03)

### 12.1 提示词压缩服务 ✅

**问题背景：**
- 超轻量模型（如 0.6B Qwen）token 限制仅 2048
- 完整提示词（系统提示词 + Skills + 结构化提示词）可达 3000-4000 tokens
- 导致模型无法完整理解角色定义并生成高质量输出

**解决方案：**
- 创建 `PromptCompressorService` 提供多层次压缩策略
- 支持三种压缩等级：完整、精简、超轻量
- 压缩时保留用户必须包含的关键信息

**创建的文件：**
- `backend/services/promptCompressorService.js` - 压缩服务核心
- `backend/utils/__tests__/promptCompressorService.test.js` - 单元测试

**压缩等级：**
| 等级 | 名称 | 目标 Token | 压缩策略 |
|------|------|-----------|---------|
| 0 | 完整模式 | 无限制 | 不压缩，适合 8K+ 模型 |
| 1 | 精简模式 | ~4K | 移除示例，保留核心指令 |
| 2 | 超轻量模式 | ~1.5K | 极度精简，只保留要素 |

### 12.2 API 接口 ✅

**新增 API：**
| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/prompts/compress` | POST | 压缩提示词 |
| `/api/prompts/estimate-tokens` | POST | 估算 Token 数量 |
| `/api/prompts/compression-levels` | GET | 获取压缩等级信息 |
| `/api/prompts/recommend-compression` | POST | 推荐压缩等级 |

### 12.3 前端集成 ✅

**设置面板新增：**
- 启用提示词压缩开关
- 压缩等级选择（精简/超轻量）
- 显示 Token 估算选项

**生成界面新增：**
- 生成按钮旁快捷压缩开关
- 生成结果区显示压缩统计（原始/压缩后 token 数，节省比例）

**修改的文件：**
- `frontend/index.html` - 添加压缩设置 UI
- `frontend/script.js` - 集成压缩逻辑
- `backend/routes/prompts.js` - 添加压缩 API 路由

### 12.4 压缩策略详解

**Skill 上下文压缩：**
- 精简模式：移除示例代码、注意事项，保留核心指令
- 超轻量模式：只保留 Skill 名称和一句话核心描述

**系统提示词压缩：**
- 精简模式：移除示例参考，压缩风格/行业指导
- 超轻量模式：生成极简模板，只保留核心输出要求

**结构化提示词压缩：**
- 精简模式：移除冗余内容，压缩列表项
- 超轻量模式：只保留任务、角色、要求等优先段落

---

## 🎯 Phase 11: 设计角色专业化升级 (2026-02-02)

### 11.0 专业术语数据库 ✅

**创建的文件：**
- `data/professional-terms.json` - 专业设计术语库

**术语分类（13大类，133+术语）：**
| 分类 | 中文名 | 术语数量 |
|------|--------|---------|
| composition | 构图 | 11个 |
| camera | 视角 | 14个 |
| lighting | 灯光 | 15个 |
| medium | 媒介/表现形式 | 11个 |
| colorTone | 色调风格 | 13个 |
| quality | 输出精度 | 8个 |
| environment | 环境/场景 | 12个 |
| material | 材质 | 12个 |
| designForm | 设计形式 | 11个 |
| creativeApproach | 创意方向 | 8个 |
| characterStyle | 角色风格 | 10个 |
| eraStyle | 时代风格 | 10个 |
| chineseStyle | 国风元素 | 8个 |

### 11.1-11.6 设计角色参数优化 ✅

**优化的角色（9个）：**

| # | 角色 | 原参数 | 新参数 | 新增内容 |
|---|------|--------|--------|---------|
| 1 | Logo设计专家 | 6 | 10 | +构图、+设计形式、+创意方向、+输出精度 |
| 4 | IP角色设计 | 8 | 10 | +视角、+灯光 |
| 7 | UI界面设计 | 8 | 10 | +色调风格、+输出精度 |
| 8 | 图标设计 | 7 | 9 | +设计形式、+输出精度 |
| 9 | 商业插画设计 | 7 | 9 | +媒介、+灯光(已完善) |
| 10 | 儿童插画设计 | 7 | 9 | +媒介、+色彩风格 |
| 11 | 概念艺术设计 | 7 | 10 | +视角、+灯光、+输出精度 |
| 12 | 社交媒体配图 | 7 | 8 | +输出精度 |
| 16 | 书籍封面设计 | 8 | 10 | +设计形式、+色调风格 |

**Logo设计专家参数增强详情：**
- logo_type: 6选项 → 10选项 (+吉祥物Logo、动态Logo、负空间Logo、线条Logo)
- style_preference: 8选项 → 12选项 (+国潮风、扁平化、渐变风、立体3D)
- 新增 composition: 构图方式 (6选项)
- 新增 design_form: 设计形式 (7选项)
- 新增 creative_direction: 创意方向 (7选项)
- 新增 output_quality: 输出精度 (4选项)

**版本更新：**
- presets.json: v2.0.0 → v2.1.0

---

## 🧠 Phase 7: Agent Skills 系统

### 7.1 基础架构 ✅

**创建的文件：**
- `skills/index.json` - Skills 索引文件，自动同步
- `backend/services/skillService.js` - 核心服务 (~700行)
- `backend/routes/skills.js` - REST API 路由 (12个端点)

**API 端点：**
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/skills | 获取所有 Skills |
| GET | /api/skills/:id | 获取单个 Skill |
| POST | /api/skills | 创建新 Skill |
| PUT | /api/skills/:id | 更新 Skill |
| DELETE | /api/skills/:id | 删除 Skill |
| PATCH | /api/skills/:id/toggle | 切换启用状态 |
| POST | /api/skills/match | 匹配 Skills |
| POST | /api/skills/context | 获取匹配上下文 |
| POST | /api/skills/rescan | 重新扫描目录 |
| GET | /api/skills/:id/export | 导出 Skill |
| POST | /api/skills/import | 导入 Skill |

### 7.2 预设 Skills ✅

**已创建 4 个专业 Skills：**

1. **Logo 评审专家** (`logo-critique-expert`)
   - 专业分析和评估 Logo 设计
   - 触发词: logo评审、logo分析、品牌标识分析...

2. **色彩理论大师** (`color-theory-master`)
   - 专业的色彩搭配和色彩心理学
   - 触发词: 配色、色彩搭配、调色板...

3. **品牌战略顾问** (`brand-strategy-advisor`)
   - 品牌定位、品牌故事和设计方向
   - 触发词: 品牌定位、品牌策略、品牌调性...

4. **日本传统色** (`nippon-colors`) 🆕
   - 基于 Nipponcolors.com 的188种传统颜色
   - 包含颜色名称、色值及文化背景

### 7.3 前端 UI ✅

**新增界面元素：**
- 🧠 专业技能 Tab 页
- Skills 统计面板 (总数/已启用/可用)
- Skills 卡片列表 (搜索/筛选/排序)
- Skill 详情模态框
- 创建/编辑/删除 Skill 模态框

### 7.4 高级功能 ✅

**已实现：**
- ✅ Skills 编辑功能 (Edit Modal)
- ✅ Skills 导入功能 (Import JSON)
- ✅ Skills 导出功能 (Export)
- ✅ Skills 自动匹配 (generateDesignPrompt 集成)
- ✅ Skills 上下文注入 (_buildDynamicSystemPrompt)

**工作流程：**
```
用户输入设计需求
    ↓
generateDesignPrompt() 触发
    ↓
调用 /api/skills/context 获取匹配的 Skills
    ↓
Skills 上下文注入到系统提示词
    ↓
AI 生成更专业的设计提示词
    ↓
前端显示匹配到的专业技能标签
```

### 7.5 测试与文档 🔄

- [x] 更新 PROGRESS.md
- [x] 服务器正常运行
- [ ] Skills 功能手动测试
- [ ] 更新 README.md

---

## 📁 Skills 目录结构

```
skills/
├── index.json                 # 索引文件 (自动维护)
├── brand-strategy-advisor/
│   ├── SKILL.md              # Skill 定义
│   ├── assets/               # 资源文件
│   └── references/           # 参考资料
├── color-theory-master/
│   ├── SKILL.md
│   ├── assets/
│   └── references/
├── logo-critique-expert/
│   ├── SKILL.md
│   ├── assets/
│   │   └── example_logos/
│   └── references/
└── nippon-colors/            # 日本传统色
    ├── SKILL.md
    ├── config.json
    ├── colors_cleaned.csv
    ├── colors_full.csv
    ├── nipponcolors.js
    └── README.md
```

---

## 🚀 如何使用 Skills

### 方式 1: 自动匹配
在设计提示词生成时，系统会自动根据输入内容匹配相关 Skills 并应用。

### 方式 2: 手动管理
1. 点击"🧠 专业技能"Tab
2. 查看/搜索/筛选 Skills
3. 启用/禁用/编辑/删除 Skills
4. 导入/导出 Skills

### 方式 3: 创建自定义 Skill
1. 点击"+ 创建 Skill"按钮
2. 填写 Skill 信息 (名称、描述、触发词等)
3. 编写专业知识内容 (Markdown)
4. 保存

---

## 📝 SKILL.md 格式

```markdown
---
name: "Skill 名称"
description: "简要描述"
version: "1.0.0"
triggers:
  - 触发词1
  - 触发词2
tags:
  - 标签1
  - 标签2
author: "作者"
enabled: true
---

# Skill 标题

## 核心知识

专业内容...

## 最佳实践

指导建议...
```

---

## 🎯 下一步计划

- [ ] Phase 6.1: 历史记录功能（推荐，4-6小时）
- [ ] 添加更多专业 Skills
- [ ] Skills 版本管理
- [ ] 批量生成功能

---

## 🔄 Phase 8: UI 简化重构 ✅

**完成日期：** 2026-01-30

**主要变更：**
- ✅ 将4个Tab页简化为2个：设计助手 + 专业技能
- ✅ 合并"生成"和"图像/视频"功能到设计助手
- ✅ 移除冗余的模板测试Tab
- ✅ 优化界面布局，提升用户体验

---

## 🔧 Phase 9: API 现代化 ✅

**完成日期：** 2026-01-31

**解决的问题：**
- ❌ 之前：Ollama 检测缓慢，与 GenAPI 等服务器不兼容
- ❌ 之前：API 设置过于死板（本地/云端二元选择）

**解决方案：统一 OpenAI 兼容 API 格式**

**后端更新：**
- ✅ 新增 `/api/prompts/fetch-models` 代理端点
- ✅ 重写 `llmService.js` - 统一的 `call()` 方法
- ✅ 更新 `improverService.js` 使用新 LLM 服务

**前端更新：**
- ✅ 全新设计的设置面板
- ✅ 6个预设服务商：Ollama、LM Studio、ModelScope、硅基流动、DeepSeek、OpenAI
- ✅ 动态模型列表刷新功能
- ✅ 灵活的自定义配置

**新 API 格式：**
```javascript
// 统一调用格式
llmService.call(baseUrl, apiKey, model, systemPrompt, userPrompt, options)

// 所有服务商都使用 OpenAI 兼容端点
// POST {baseUrl}/chat/completions
// GET  {baseUrl}/models
```

---

## 🧹 项目清理 ✅

**完成日期：** 2026-01-31

**清理内容：**
- ✅ 移动测试文件到 `archive/tests/`
- ✅ 移动前端备份文件到 `archive/frontend_backup/`
- ✅ 删除重复文档
- ✅ 更新 PROGRESS.md

---

## 📌 Phase 10: 历史记录与收藏系统 ✅

**完成日期：** 2026-01-31

### 10.1 功能概述

为 PromptAtelier 添加完整的历史记录和收藏管理系统，支持：
- **历史记录**：自动保存每次生成的提示词
- **收藏管理**：收藏优秀的提示词，按设计类型分类
- **风格参考**：选择收藏的提示词作为 AI 生成的风格参考（Few-shot Learning）

### 10.2 后端实现

**新增文件：**
- `data/history.json` - 历史记录数据存储
- `data/favorites.json` - 收藏数据存储
- `backend/services/historyService.js` - 历史记录服务 (~150行)
- `backend/services/favoritesService.js` - 收藏服务 (~200行)
- `backend/routes/history.js` - 历史记录 API (6个端点)
- `backend/routes/favorites.js` - 收藏 API (8个端点)

**新增依赖：**
- `uuid` - 生成唯一 ID

**历史记录 API：**

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/history | 获取历史列表 |
| POST | /api/history | 添加记录 |
| DELETE | /api/history | 清空所有 |
| GET | /api/history/:id | 获取单条 |
| DELETE | /api/history/:id | 删除单条 |
| GET | /api/history/stats | 获取统计 |

**收藏 API：**

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/favorites | 获取收藏列表 |
| POST | /api/favorites | 添加收藏 |
| GET | /api/favorites/:id | 获取单个 |
| PUT | /api/favorites/:id | 更新收藏 |
| DELETE | /api/favorites/:id | 删除收藏 |
| GET | /api/favorites/grouped | 按分类分组 |
| GET | /api/favorites/references | 获取参考候选 |
| GET | /api/favorites/stats | 获取统计 |

### 10.3 前端实现

**导航栏：**
- ✅ 历史记录下拉菜单（📜 按钮）
- ✅ 收藏下拉菜单（⭐ 按钮）
- ✅ 显示数量角标

**设计表单：**
- ✅ 风格参考选择器（选择收藏作为 AI 参考）
- ✅ 显示可用参考数量
- ✅ 选中/移除参考功能

**生成结果：**
- ✅ 收藏按钮（⭐ 收藏）
- ✅ 收藏表单（名称、标签、评分、备注）
- ✅ 已收藏状态显示

### 10.4 Few-shot Learning 实现

**工作原理：**
1. 用户选择一个收藏的提示词作为"风格参考"
2. 系统将参考提示词注入到 AI 的系统提示词中
3. AI 学习参考的风格、术语、结构来生成新提示词

**注入格式：**
```
═══════════════════════════════════════════════════════════
📌【用户选定的风格参考 - 请参考此示例的风格和质量】
═══════════════════════════════════════════════════════════
用户选择了一个之前收藏的优秀提示词作为参考，请学习其：
- 表达风格和术语使用
- 结构组织方式
- 质量和细节程度
- 专业性和创意方向

参考名称: {name}
参考提示词:
"""
{prompt}
"""
═══════════════════════════════════════════════════════════
```

### 10.5 数据结构

**历史记录：**
```json
{
  "id": "h_xxx",
  "timestamp": "ISO时间",
  "category": "image",
  "subcategory": "logo-design",
  "input": { "brandName": "xxx", ... },
  "output": { "prompt": "xxx", "matchedSkills": [] },
  "isFavorited": false
}
```

**收藏：**
```json
{
  "id": "f_xxx",
  "name": "收藏名称",
  "prompt": "提示词内容",
  "category": "image",
  "subcategory": "logo-design",
  "parameters": { ... },
  "tags": ["标签1", "标签2"],
  "notes": "备注",
  "rating": 5,
  "source": { "historyId": "h_xxx" },
  "stats": { "usedAsReference": 0 }
}
```

---

## 🎯 下一步计划

### Phase 11: 用户体验优化（推荐）

| 任务 | 描述 | 优先级 | 预计工时 |
|------|------|--------|----------|
| 11.1 批量生成 | 一次生成多个变体 | 中 | 4小时 |
| 11.2 历史对比 | 对比不同版本的生成结果 | 中 | 3小时 |
| 11.3 收藏标签管理 | 标签筛选、批量操作 | 低 | 2小时 |
| 11.4 导出功能 | 导出收藏/历史为文件 | 低 | 2小时 |

### Phase 12: Skills 扩展（推荐）

| 任务 | 描述 | 优先级 | 预计工时 |
|------|------|--------|----------|
| 12.1 新增 Skills | 字体专家、印刷专家、趋势分析师 | 中 | 6小时 |
| 12.2 Skills 组合 | 多个 Skills 同时生效 | 中 | 4小时 |
| 12.3 Skills 市场 | 导入社区 Skills | 低 | 8小时 |

### Phase 13: 高级功能（长期）

| 任务 | 描述 | 优先级 | 预计工时 |
|------|------|--------|----------|
| 13.1 用户系统 | 登录/注册、云同步 | 低 | 16小时 |
| 13.2 团队协作 | 共享收藏、团队模板 | 低 | 20小时 |
| 13.3 AI 图片分析 | 上传图片分析风格 | 中 | 8小时 |
