# 📦 本地模型存储目录

此目录存放 PromptAtelier 本地嵌入式 AI 模型文件。

## 支持的模型

| 模型 | 文件名 | 体积 | 用途 |
|------|--------|------|------|
| Qwen3-0.6B | `qwen3-0.6b-q4_k_m.gguf` | ~462 MB | 文本生成（提示词增强、翻译等） |
| Tiny-Toxic-Detector | 自动缓存到 `cache/` | ~10 MB | 内容安全审查 |

## 下载方式

### 方式一：应用内自动下载（推荐）

启动应用后，在设置面板中点击"下载模型"按钮，应用会自动从 HuggingFace 下载模型到此目录。

### 方式二：手动下载 + 放置

如果你的网络环境无法直接访问 HuggingFace，可以手动下载模型文件后放置到此目录。

**Qwen3-0.6B (GGUF Q4_K_M)**

```bash
# 方法 A: 使用 HuggingFace CLI
huggingface-cli download Qwen/Qwen3-0.6B-GGUF qwen3-0.6b-q4_k_m.gguf --local-dir ./models

# 方法 B: 浏览器直接下载
# 访问 https://huggingface.co/Qwen/Qwen3-0.6B-GGUF
# 下载 qwen3-0.6b-q4_k_m.gguf 文件

# 方法 C: 使用国内镜像（如果 HuggingFace 访问慢）
# 访问 https://hf-mirror.com/Qwen/Qwen3-0.6B-GGUF
# 或设置环境变量: HF_ENDPOINT=https://hf-mirror.com
```

下载后将文件放到此目录即可。应用启动时会**自动检测**并识别模型文件。

> 💡 **灵活文件名支持**：文件名不需要完全匹配。例如，从 HuggingFace 下载的文件可能叫
> `Qwen3-0.6B-Q4_K_M.gguf`（大写），应用也能正确识别。

**Tiny-Toxic-Detector** 会由 Transformers.js 自动下载并缓存到 `cache/` 子目录，无需手动操作。

### 方式三：API 导入

如果模型文件已下载到电脑的其他位置，可以通过 API 导入：

```bash
# 从指定路径导入（复制文件）
curl -X POST http://localhost:3000/api/models/qwen3-0.6b/import \
  -H "Content-Type: application/json" \
  -d '{"sourcePath": "D:/Downloads/qwen3-0.6b-q4_k_m.gguf"}'

# 移动文件（不保留原文件，更省磁盘空间）
curl -X POST http://localhost:3000/api/models/qwen3-0.6b/import \
  -H "Content-Type: application/json" \
  -d '{"sourcePath": "D:/Downloads/qwen3-0.6b-q4_k_m.gguf", "move": true}'

# 扫描 models 目录中的所有兼容文件
curl -X POST http://localhost:3000/api/models/scan
```

## 模型使用流程

```
1. 放置/下载模型文件到此目录
2. 启动应用（或调用 POST /api/models/scan）
3. 应用自动检测到模型
4. 调用 POST /api/models/qwen3-0.6b/load 加载模型
5. 模型就绪，可使用离线 AI 功能
```

## 目录结构

```
models/
├── .gitkeep              # Git 占位文件
├── README.md             # 本文件
├── qwen3-0.6b-q4_k_m.gguf  # Qwen3 模型文件（下载后出现）
└── cache/                # Transformers.js 自动缓存目录
    └── ...               # Tiny-Toxic-Detector 缓存文件
```

## 注意

- 此目录下的 `.gguf`、`.onnx`、`.bin`、`.safetensors` 模型文件已被 `.gitignore` 排除
- 请勿将大型模型文件提交到 Git 仓库
- 总体积控制在 < 800MB
- 模型是**可选组件**，不下载也能正常使用应用（使用规则引擎 + 外部 API）
