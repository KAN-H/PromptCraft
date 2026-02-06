console.log('DEBUG: Start loading generator.js');
const fs = require('fs');
const path = require('path');
const llmService = require('../services/llmService');

class PromptGenerator {
  constructor() {
    this.loadTemplates();
    // Initialize modules for comma-separated generation
    this.modules = [
      { key: 'subject', getValue: (input) => input.subject || '', priority: 1 },
      { key: 'modifier', getValue: (input) => input.modifier || '', priority: 2 },
      { key: 'style', getValue: (input) => input.style || '', priority: 3 },
      { key: 'negative', getValue: (input) => input.negative || '', priority: 4 }
    ];
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

  /**
   * Register a new module for comma-separated generation
   * @param {Object} module - Module configuration with key, getValue, and optional priority
   */
  registerModule(module) {
    // Validate module
    if (!module || !module.key || typeof module.getValue !== 'function') {
      return; // Ignore invalid modules
    }
    
    // Set default priority if not specified
    const priority = module.priority !== undefined ? module.priority : Infinity;
    
    // Add module to the list
    this.modules.push({
      key: module.key,
      getValue: module.getValue,
      priority: priority
    });
  }

  // Simple comma-separated generation (for tests and simple use cases)
  generate(input = {}) {
    // If input is a string, use legacy template-based generation
    if (typeof input === 'string') {
      return this.generateLegacy(input);
    }
    
    // If input has 'input' property, use legacy template-based generation
    if (input.input && !input.subject && !input.modifier && !input.style && !input.negative) {
      return this.generateLegacy(input.input);
    }

    // Otherwise, use simple comma-separated generation
    // Sort modules by priority
    const sortedModules = [...this.modules].sort((a, b) => a.priority - b.priority);
    
    // Generate parts from modules
    const parts = [];
    for (const module of sortedModules) {
      try {
        const value = module.getValue(input);
        // Only include non-empty string values
        if (typeof value === 'string' && value.trim()) {
          parts.push(value.trim());
        }
      } catch (error) {
        // Ignore errors from getValue
      }
    }
    
    // Join with comma and space
    return parts.join(', ');
  }

  // Legacy: Template-based generation
  generateLegacy(content) {
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
        return this.generateLegacy(input); 
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
