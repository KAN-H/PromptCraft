const fs = require('fs');
const path = require('path');
const llmService = require('../services/llmService');
const { INTENTS } = require('../services/intentService');

class PromptGenerator {
  constructor() {
    this.loadTemplates();
  }

  loadTemplates() {
    try {
      // Load basic templates
      const templatesPath = path.join(__dirname, '../../data/templates.json');
      const data = fs.readFileSync(templatesPath, 'utf8');
      this.templates = JSON.parse(data);
      
      // Load expert prompts for AI generation
      const expertPath = path.join(__dirname, '../../data/expert_prompts.json');
      if (fs.existsSync(expertPath)) {
        this.expertPrompts = JSON.parse(fs.readFileSync(expertPath, 'utf8'));
      } else {
        this.expertPrompts = [];
      }
      
      console.log(`Loaded ${this.templates.length} basic templates and ${this.expertPrompts.length} expert prompts`);
    } catch (error) {
      console.error('Error loading templates:', error);
      this.templates = [];
      this.expertPrompts = [];
    }
  }

  // Legacy: Template-based generation
  generate(input = {}) {
    const content = typeof input === 'string' ? input : (input.subject || input.input || '');
    if (!content) throw new Error('Input content is required');

    const professionalTemplates = this.templates.filter(t => t.style === 'professional');
    const creativeTemplates = this.templates.filter(t => t.style === 'creative');
    const simpleTemplates = this.templates.filter(t => t.style === 'simple');

    return [
      this.generateSingle(content, professionalTemplates, 'professional'),
      this.generateSingle(content, creativeTemplates, 'creative'),
      this.generateSingle(content, simpleTemplates, 'simple')
    ];
  }

  generateSingle(input, templates, style) {
    if (!templates || templates.length === 0) return null;
    const template = templates[Math.floor(Math.random() * templates.length)];
    return {
      act: template.act,
      prompt: template.prompt.replace('{input}', input),
      tags: template.tags,
      style: style,
      framework: template.framework
    };
  }

  // New: AI-based generation
  async generateAI(input, scenarioId, config) {
    const scenario = this.expertPrompts.find(p => p.id === scenarioId);
    if (!scenario) {
        // Fallback to basic generation if scenario not found
        return this.generate(input); 
    }

    try {
        let resultText;
        if (config.mode === 'local') {
            resultText = await llmService.callLocal(input, scenario.system_prompt, config.model);
        } else if (config.mode === 'cloud') {
            resultText = await llmService.callCloud(input, scenario.system_prompt, config.apiKey, config.baseUrl, config.model);
        } else {
            throw new Error('Invalid mode');
        }

        return [{
            style: scenario.category,
            act: scenario.name,
            prompt: resultText,
            framework: {
                role: scenario.name,
                instruction: "AI Generated based on expert system prompt",
                constraints: "AI Model Constraints",
                format: "Optimized Prompt"
            }
        }];
    } catch (error) {
        console.error('AI Generation failed:', error);
        throw error;
    }
  }
  
  getScenarios() {
      return this.expertPrompts.map(p => ({
          id: p.id,
          name: p.name,
          icon: p.icon,
          description: p.description
      }));
  }

  /**
   * 意图感知生成：根据意图分类优先匹配最合适的模板风格
   * @param {string} input - 用户输入
   * @param {string} intent - 意图类型 (来自 intentService.INTENTS)
   * @returns {Array} 生成结果
   */
  generateWithIntent(input, intent) {
    const content = typeof input === 'string' ? input : (input.subject || input.input || '');
    if (!content) throw new Error('Input content is required');

    // 意图到优先风格的映射
    const intentStyleMap = {
      [INTENTS.CREATIVE]: ['creative', 'professional', 'simple'],
      [INTENTS.CODING]: ['professional', 'simple', 'creative'],
      [INTENTS.ANALYSIS]: ['professional', 'simple', 'creative'],
      [INTENTS.DESIGN]: ['creative', 'professional', 'simple'],
      [INTENTS.IMPROVEMENT]: ['professional', 'creative', 'simple'],
      [INTENTS.TRANSLATION]: ['professional', 'simple', 'creative'],
      [INTENTS.GENERATION]: ['professional', 'creative', 'simple'],
      [INTENTS.OTHER]: ['professional', 'creative', 'simple']
    };

    const styleOrder = intentStyleMap[intent] || intentStyleMap[INTENTS.OTHER];

    const byStyle = styleOrder.reduce((acc, style) => {
      acc[style] = this.templates.filter(t => t.style === style);
      return acc;
    }, {});

    return styleOrder.map(style => this.generateSingle(content, byStyle[style], style));
  }
}

module.exports = PromptGenerator;
