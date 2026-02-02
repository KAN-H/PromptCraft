console.log('DEBUG: Start loading generator.js');
const fs = require('fs');
const path = require('path');
const llmService = require('../services/llmService');

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
}

console.log('DEBUG: Assigning module.exports in generator.js');
module.exports = PromptGenerator;
