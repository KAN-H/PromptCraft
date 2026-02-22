# 图片类提示词 JSON Schema

## 概述

此JSON Schema专门为图片类提示词生成设计，支持Logo、广告、海报、创意插画、角色设计等多种图片类型。Schema定义了结构化的字段和类型，确保生成的提示词具有一致性和完整性。

## Schema文件

- **主文件**: [`image_prompt_schema.json`](./image_prompt_schema.json)
- **示例文件**: [`../examples/image_prompt_example.json`](../examples/image_prompt_example.json)

## 字段说明

| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| `style` | string | ✅ | 风格标签，如"professional"、"creative"、"concise" |
| `composition` | array[string] | ✅ | 构图方式，来源于提示词优化文档 |
| `cameraAngle` | array[string] | ✅ | 拍摄视角，来源于提示词优化文档 |
| `lighting` | array[string] | ✅ | 灯光设置，来源于提示词优化文档 |
| `colorScheme` | string\|array[string] | ❌ | 配色方案，支持单个或多个颜色描述 |
| `subject` | string | ✅ | 主题描述，图片的主要内容 |
| `details` | string\|array[string] | ❌ | 细节设计，支持单个或多个细节描述 |
| `promptText` | string | ✅ | 最终拼接的完整提示词 |

## 枚举值来源

所有枚举值均来自 [`data/提示词优化.md`](../data/提示词优化.md) 文件：

- **构图 (composition)**: 对称构图、居中构图、三分法构图、S型构图等
- **视角 (cameraAngle)**: 鸟瞰图、顶视图、特写视图、全身照等  
- **灯光 (lighting)**: 电影光、柔光、体积光、影棚光等

## 使用示例

```json
{
  "style": "creative",
  "composition": ["Golden ratio", "rule of thirds"],
  "cameraAngle": ["portrait", "closeup view"],
  "lighting": ["Cinematic light", "warm light"],
  "colorScheme": ["warm white", "golden tones"],
  "subject": "一位穿着现代商务装的年轻女性",
  "details": ["专业妆容", "现代办公室背景"],
  "promptText": "creative style, Golden ratio composition..."
}
```

## 验证

使用任何支持JSON Schema的验证工具都可以验证JSON对象是否符合此Schema。例如：

```bash
# 使用 ajv-cli 验证
npx ajv-cli validate -s image_prompt_schema.json -d ../examples/image_prompt_example.json
```

## 适用场景

- Logo设计提示词生成
- 广告图片提示词生成  
- 海报设计提示词生成
- 创意插画提示词生成
- 角色设计提示词生成
- 其他图片类AI生成任务

## 扩展性

Schema支持未来扩展，可以根据需要添加新的枚举值或字段，同时保持向后兼容性。