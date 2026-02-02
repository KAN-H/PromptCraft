# NipponColors Skill 包

基于 [nipponcolors.com](https://nipponcolors.com) 的日本传统色数据库，提供287种日本传统颜色的名称、色值及文化背景参考。

## 技能概述

这个 Skill 包的目标是让 AI 成为设计类智能体的"日本传统色顾问"+"颜色搭配数据库"。

### 功能特点
- **287种传统颜色**：包含完整的日本传统颜色数据库
- **多维度查询**：支持季节、颜色家族、情感、文化意象等多种查询方式
- **文化背景**：每种颜色都附带文化描述和美学意义
- **双语支持**：提供英文名和日文汉字/平假名
- **色值信息**：包含 HEX 和 RGB 两种色值格式

## 文件结构

```
nippon-colors/
├── SKILL.md              # 技能指令文件
├── colors_cleaned.csv    # 清理后的颜色数据文件 (287种颜色)
├── colors_full.csv       # 原始颜色数据文件 (302行，包含重复项)
├── generator.py          # 颜色搜索和生成脚本
├── config.json           # 技能配置
├── validate_skill.py     # 数据验证脚本
├── test_skill.py         # 功能测试脚本
└── README.md             # 本说明文档
```

## 数据来源

数据基于 [nipponcolors.com](https://nipponcolors.com) 网站，该网站展示了日本传统的颜色系统。

### 数据获取方式
由于 nipponcolors.com 网站使用 JavaScript 动态加载颜色数据，无法直接抓取完整的 CSV 文件。当前技能包使用以下方法获取数据：

1. **网站截图分析**：分析网站页面获取颜色信息
2. **手动数据补充**：基于日本传统颜色知识补充数据
3. **数据清理**：去除重复项，确保数据准确性

### 数据字段说明
- **English Name**：颜色的英文名称
- **Hex**：颜色的 HEX 色值（如 #fff0f0）
- **RGB**：颜色的 RGB 色值（如 rgb(255,240,240)）
- **Japanese (Kanji)**：日文汉字表示
- **Japanese (Hiragana)**：日文平假名表示

## 使用方法

### 1. 作为 AI 技能
当 AI 需要回答关于日本传统色的问题时，可以调用此技能包：

```python
# 示例使用
from generator import search_colors

# 搜索春天相关的颜色
result = search_colors("spring")
print(result)

# 搜索蓝色系颜色
result = search_colors("blue")
print(result)

# 搜索具体颜色（樱花）
result = search_colors("sakura")
print(result)
```

### 2. 查询维度
技能支持多种查询方式：

- **季节查询**：spring, summer, autumn/fall, winter
- **颜色家族查询**：red, blue, green, purple, yellow, brown, pink, white, black, gray
- **情感查询**：warm, cool, calm, energetic, elegant, natural
- **具体颜色名称**：sakura, murasaki, ruri, aoi, midori, etc.
- **日文汉字查询**：紫, 桜, 梅, 松, etc.

### 3. 输出格式
每次查询返回格式化的颜色信息：

```
根据您的查询 'spring'，找到了以下日本传统色：
1. **Sakura (桜)** / #fff0f0 rgb(255,240,240)
   - **感觉**：樱花的颜色，淡粉色带有一丝温柔，象征着春天的美好、生命的短暂和纯洁的爱情。
2. **Ume (梅)** / #f9a8d4 rgb(249,168,212)
   - **感觉**：梅花的颜色，淡雅的粉紫色，象征着坚韧、希望和早春的气息。
...
*数据库包含 287 种日本传统颜色，数据参考自 Nipponcolors.com*
```

## 技能包验证

### 数据完整性验证
运行验证脚本检查数据完整性：

```bash
python validate_skill.py
```

验证内容包括：
- CSV 文件行数和唯一颜色数量
- 必填字段完整性
- HEX 格式正确性
- 配置文件结构
- SKILL.md 文件结构

### 功能测试
运行测试脚本验证功能：

```bash
python test_skill.py
```

## 扩展与定制

### 添加新颜色
如果需要添加新的颜色，请编辑 `colors_cleaned.csv` 文件，遵循以下格式：

```
English Name,Hex,RGB,Japanese (Kanji),Japanese (Hiragana)
New Color Name,#123456,rgb(18,52,86),日文汉字,ひらがな
```

### 修改颜色描述
颜色描述在 `generator.py` 的 `generate_description()` 函数中定义，可以根据需要修改或添加新的描述。

### 更新配置文件
修改 `config.json` 可以调整技能元数据、功能描述和文件列表。

## 注意事项

1. **数据准确性**：颜色数据来自公开资源，可能存在细微差异
2. **文化意义**：颜色描述基于日本传统文化，可能包含主观解读
3. **使用限制**：本技能包用于教育目的，实际使用前建议验证颜色准确性
4. **版权声明**：数据参考自 nipponcolors.com，属于通用事实数据和客观色值

## 后续改进计划

1. **获取完整数据**：如果能够从 nipponcolors.com 获取完整的 CSV 文件，可以替换当前数据
2. **图片生成**：添加生成色卡图片的功能
3. **配色方案**：扩展为提供传统配色方案的功能
4. **API 接口**：提供 RESTful API 接口

## 联系与支持

如有问题或建议，请参考原始项目文档或联系开发者。

---
**数据最后更新**：2026-01-22
**颜色数量**：287 种
**技能版本**：1.0.0