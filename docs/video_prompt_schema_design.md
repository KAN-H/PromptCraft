# 视频分镜脚本提示词 JSON Schema 设计

以下设计基于 JSON Schema Draft-07 标准，用于结构化定义视频脚本与分镜脚本提示词的格式。

```mermaid
flowchart TD
  A[VideoPromptSchema Object]
  A --> B[title: string]
  A --> C[duration: string|number]
  A --> D[style: enum{dramatic,informative,creative}]
  A --> E[scenes: array of Scene]
  A --> F[promptText: string]
  subgraph Scene
    D1(sceneNumber: integer)
    D1b(cameraMovement: string)
    D2(description: string)
    D3(shotType: enum{
      extremeWideShot,wideShot,mediumShot,
      mediumCloseUp,closeUp,extremeCloseUp,
      overTheShoulder,pointOfView,
      lowAngleShot,highAngleShot,dutchAngle})
    D4(dialogue?: string)
    D5(action?: string)
  end
```

## 字段说明

- **title** (string)：视频标题。  
- **duration** (string \| number)：时长，支持 `"hh:mm:ss"` 格式或秒数。  
- **style** (enum)：脚本风格标签，可选值：  
  - `dramatic`：戏剧化风格。  
  - `informative`：信息型风格。  
  - `creative`：创意型风格。  
- **scenes** (array of object)：分镜列表，每个对象包含：  
  - **sceneNumber** (integer)：场景编号。  
  - **cameraMovement** (string)：运镜说明（如推镜、摇镜等）。  
  - **description** (string)：场景描述。  
  - **shotType** (enum)：镜头类型，可选值：  
    - `extremeWideShot`：超广角镜头，用于展示环境全景。  
    - `wideShot`：广角镜头，主体占比较小。  
    - `mediumShot`：中景镜头，从腰部到头部的视角。  
    - `mediumCloseUp`：半身特写，胸部到头部的视角。  
    - `closeUp`：特写镜头，强调人物表情。  
    - `extremeCloseUp`：极端特写，突出细节。  
    - `overTheShoulder`：过肩镜头，用于对话场景。  
    - `pointOfView`：主观镜头，以角色视角拍摄。  
    - `lowAngleShot`：低角度镜头，增强角色威严。  
    - `highAngleShot`：高角度镜头，表现角色脆弱。  
    - `dutchAngle`：倾斜镜头，传递不安或混乱。  
  - **dialogue** (string, 可选)：对话或旁白文本。  
  - **action** (string, 可选)：动作说明。  
- **promptText** (string)：最终拼接的完整提示词。

## JSON Schema 定义

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://promptcraft.com/schemas/video-prompt.json",
  "title": "视频分镜脚本提示词Schema",
  "description": "用于视频分镜脚本提示词生成的结构化JSON Schema，支持各种镜头类型和运镜方式",
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "description": "视频标题",
      "minLength": 1,
      "maxLength": 200
    },
    "duration": {
      "oneOf": [
        {
          "type": "string",
          "description": "时长格式 HH:MM:SS",
          "pattern": "^([0-9]{1,2}):([0-5][0-9]):([0-5][0-9])$"
        },
        {
          "type": "number",
          "description": "时长（秒数）",
          "minimum": 1,
          "maximum": 86400
        }
      ],
      "description": "视频时长，支持 'HH:MM:SS' 格式或秒数"
    },
    "style": {
      "type": "string",
      "description": "脚本风格标签",
      "enum": ["dramatic", "informative", "creative"]
    },
    "scenes": {
      "type": "array",
      "description": "分镜场景列表",
      "items": {
        "type": "object",
        "properties": {
          "sceneNumber": {
            "type": "integer",
            "description": "场景编号",
            "minimum": 1
          },
          "cameraMovement": {
            "type": "string",
            "description": "运镜说明",
            "minLength": 1,
            "maxLength": 100
          },
          "description": {
            "type": "string",
            "description": "场景描述",
            "minLength": 1,
            "maxLength": 500
          },
          "shotType": {
            "type": "string",
            "description": "镜头类型",
            "enum": [
              "extremeWideShot", "wideShot", "mediumShot",
              "mediumCloseUp", "closeUp", "extremeCloseUp",
              "overTheShoulder", "pointOfView",
              "lowAngleShot", "highAngleShot", "dutchAngle"
            ]
          },
          "dialogue": {
            "type": "string",
            "description": "对话或旁白（可选）",
            "maxLength": 1000
          },
          "action": {
            "type": "string",
            "description": "动作说明（可选）",
            "maxLength": 500
          }
        },
        "required": ["sceneNumber", "cameraMovement", "description", "shotType"],
        "additionalProperties": false
      },
      "minItems": 1
    },
    "promptText": {
      "type": "string",
      "description": "最终拼接的完整视频脚本提示词",
      "minLength": 1,
      "maxLength": 5000
    }
  },
  "required": ["title", "duration", "style", "scenes", "promptText"],
  "additionalProperties": false
}
```

## 示例 JSON 对象

```json
{
  "title": "科技产品宣传片",
  "duration": "00:01:30",
  "style": "creative",
  "scenes": [
    {
      "sceneNumber": 1,
      "cameraMovement": "缓慢推镜",
      "description": "阳光透过窗户洒在现代办公桌上，一台笔记本电脑静静地放在桌面",
      "shotType": "extremeWideShot",
      "dialogue": "在这个快节奏的时代，我们需要一个可靠的伙伴",
      "action": "阳光渐亮，突出产品轮廓"
    },
    {
      "sceneNumber": 2,
      "cameraMovement": "环绕镜头",
      "description": "笔记本电脑特写，屏幕缓缓亮起显示精美界面",
      "shotType": "closeUp",
      "dialogue": "全新的设计理念，为您带来前所未有的体验",
      "action": "屏幕点亮，界面动画展示"
    }
  ],
  "promptText": "科技产品宣传片，创意风格，时长1分30秒。场景1：超广角镜头，缓慢推镜..."
}
```

## 文件位置

- Schema 定义：[`schemas/video_prompt_schema.json`](../schemas/video_prompt_schema.json)
- 完整示例：[`examples/video_prompt_example.json`](../examples/video_prompt_example.json)