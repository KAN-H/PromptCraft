/**
 * PromptAtelier Skill Service
 * 
 * 遵循 Claude Agent Skills 标准实现
 * 参考: https://www.anthropic.com/engineering/claude-agent-skills
 * 
 * @version 1.0.0
 * @author PromptAtelier Team
 */

const fs = require('fs').promises;
const path = require('path');

// Skills 根目录
const SKILLS_DIR = path.join(__dirname, '../../skills');
const INDEX_FILE = path.join(SKILLS_DIR, 'index.json');

/**
 * Skill 元数据结构
 * @typedef {Object} SkillMeta
 * @property {string} id - 唯一标识符
 * @property {string} name - 显示名称
 * @property {string} description - 简短描述
 * @property {string} version - 版本号
 * @property {string[]} triggers - 触发关键词
 * @property {string[]} tags - 分类标签
 * @property {boolean} enabled - 是否启用
 * @property {string} author - 作者
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 */

/**
 * 完整 Skill 结构
 * @typedef {Object} Skill
 * @property {SkillMeta} meta - 元数据
 * @property {string} instructions - 完整指令内容
 * @property {string[]} references - 参考文档列表
 * @property {string[]} assets - 资源文件列表
 */

class SkillService {
  constructor() {
    this.skillsCache = new Map();
    this.indexCache = null;
    this.initialized = false;
  }

  /**
   * 初始化 Skill 服务
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // 确保 skills 目录存在
      await fs.mkdir(SKILLS_DIR, { recursive: true });

      // 加载或创建索引文件
      await this._loadOrCreateIndex();

      // 扫描并同步 skills
      await this._syncSkills();

      this.initialized = true;
      console.log(`[SkillService] 初始化完成，已加载 ${this.indexCache.skills.length} 个 Skills`);
    } catch (error) {
      console.error('[SkillService] 初始化失败:', error);
      throw error;
    }
  }

  /**
   * 加载或创建索引文件
   */
  async _loadOrCreateIndex() {
    try {
      const data = await fs.readFile(INDEX_FILE, 'utf-8');
      this.indexCache = JSON.parse(data);
    } catch (error) {
      // 文件不存在，创建默认索引
      this.indexCache = {
        version: '1.0.0',
        description: 'PromptAtelier Skills 索引文件',
        lastUpdated: new Date().toISOString().split('T')[0],
        skills: []
      };
      await this._saveIndex();
    }
  }

  /**
   * 保存索引文件
   */
  async _saveIndex() {
    this.indexCache.lastUpdated = new Date().toISOString().split('T')[0];
    await fs.writeFile(INDEX_FILE, JSON.stringify(this.indexCache, null, 2), 'utf-8');
  }

  /**
   * 扫描 skills 目录并同步索引
   */
  async _syncSkills() {
    try {
      const entries = await fs.readdir(SKILLS_DIR, { withFileTypes: true });
      const skillDirs = entries.filter(e => e.isDirectory());

      const foundSkills = [];

      for (const dir of skillDirs) {
        const skillPath = path.join(SKILLS_DIR, dir.name);
        const skillMdPath = path.join(skillPath, 'SKILL.md');

        try {
          await fs.access(skillMdPath);
          const meta = await this._parseSkillMeta(skillMdPath, dir.name);
          if (meta) {
            foundSkills.push(meta);
          }
        } catch {
          // 目录中没有 SKILL.md，跳过
          continue;
        }
      }

      // 合并现有配置（保留 enabled 状态）
      const existingMap = new Map(
        this.indexCache.skills.map(s => [s.id, s])
      );

      this.indexCache.skills = foundSkills.map(skill => {
        const existing = existingMap.get(skill.id);
        return {
          ...skill,
          enabled: existing?.enabled ?? true
        };
      });

      await this._saveIndex();
    } catch (error) {
      console.error('[SkillService] 同步 Skills 失败:', error);
    }
  }

  /**
   * 解析 SKILL.md 文件的元数据
   * @param {string} filePath - SKILL.md 文件路径
   * @param {string} dirName - 目录名作为默认 ID
   * @returns {SkillMeta|null}
   */
  async _parseSkillMeta(filePath, dirName) {
    try {
      let content = await fs.readFile(filePath, 'utf-8');
      
      // 移除 BOM 并统一换行符
      content = content.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      
      // 解析 YAML frontmatter
      const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
      if (!frontmatterMatch) {
        console.warn(`[SkillService] ${dirName}/SKILL.md 缺少 frontmatter`);
        console.warn(`[SkillService] 文件内容前50字符: "${content.substring(0, 50).replace(/\n/g, '\\n')}"`);
        return null;
      }

      const frontmatter = frontmatterMatch[1];
      const meta = this._parseYamlFrontmatter(frontmatter);

      return {
        id: meta.id || dirName,
        name: meta.name || dirName,
        description: meta.description || '',
        version: meta.version || '1.0.0',
        triggers: meta.triggers || [],
        tags: meta.tags || [],
        author: meta.author || 'PromptAtelier',
        enabled: true,
        createdAt: meta.created || new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0]
      };
    } catch (error) {
      console.error(`[SkillService] 解析 ${filePath} 失败:`, error);
      return null;
    }
  }

  /**
   * 简单的 YAML frontmatter 解析器
   * @param {string} yaml - YAML 内容
   * @returns {Object}
   */
  _parseYamlFrontmatter(yaml) {
    const result = {};
    const lines = yaml.split('\n');
    let currentKey = null;
    let inArray = false;
    let arrayValues = [];

    for (const line of lines) {
      const trimmed = line.trim();
      
      // 数组项
      if (trimmed.startsWith('- ') && inArray) {
        arrayValues.push(trimmed.substring(2).trim().replace(/^["']|["']$/g, ''));
        continue;
      }

      // 如果之前在收集数组，保存它
      if (inArray && currentKey) {
        result[currentKey] = arrayValues;
        inArray = false;
        arrayValues = [];
      }

      // 键值对
      const kvMatch = trimmed.match(/^(\w+):\s*(.*)$/);
      if (kvMatch) {
        const [, key, value] = kvMatch;
        currentKey = key;

        if (value === '' || value === '[]') {
          // 可能是数组开始
          inArray = true;
          arrayValues = [];
        } else if (value.startsWith('[') && value.endsWith(']')) {
          // 内联数组
          result[key] = value.slice(1, -1).split(',').map(v => 
            v.trim().replace(/^["']|["']$/g, '')
          ).filter(v => v);
        } else {
          // 普通值
          result[key] = value.replace(/^["']|["']$/g, '');
        }
      }
    }

    // 处理最后一个数组
    if (inArray && currentKey) {
      result[currentKey] = arrayValues;
    }

    return result;
  }

  /**
   * 获取所有 Skills 列表（仅元数据）
   * @param {Object} options - 筛选选项
   * @param {boolean} options.enabledOnly - 仅返回启用的
   * @param {string[]} options.tags - 按标签筛选
   * @returns {SkillMeta[]}
   */
  async listSkills(options = {}) {
    await this.initialize();

    let skills = [...this.indexCache.skills];

    if (options.enabledOnly) {
      skills = skills.filter(s => s.enabled);
    }

    if (options.tags && options.tags.length > 0) {
      skills = skills.filter(s => 
        s.tags.some(tag => options.tags.includes(tag))
      );
    }

    return skills;
  }

  /**
   * 获取单个 Skill 的完整信息
   * @param {string} skillId - Skill ID
   * @returns {Skill|null}
   */
  async getSkill(skillId) {
    await this.initialize();

    // 检查缓存
    if (this.skillsCache.has(skillId)) {
      return this.skillsCache.get(skillId);
    }

    const meta = this.indexCache.skills.find(s => s.id === skillId);
    if (!meta) {
      return null;
    }

    try {
      const skillDir = path.join(SKILLS_DIR, skillId);
      const skillMdPath = path.join(skillDir, 'SKILL.md');

      // 读取完整内容
      const content = await fs.readFile(skillMdPath, 'utf-8');
      
      // 提取指令部分（frontmatter 之后的内容）
      const instructions = content.replace(/^---\n[\s\S]*?\n---\n*/, '').trim();

      // 扫描 references 目录
      const references = await this._listDirFiles(path.join(skillDir, 'references'));

      // 扫描 assets 目录
      const assets = await this._listDirFiles(path.join(skillDir, 'assets'));

      const skill = {
        meta,
        instructions,
        references,
        assets
      };

      // 缓存
      this.skillsCache.set(skillId, skill);

      return skill;
    } catch (error) {
      console.error(`[SkillService] 加载 Skill ${skillId} 失败:`, error);
      return null;
    }
  }

  /**
   * 列出目录中的文件
   * @param {string} dirPath - 目录路径
   * @returns {string[]}
   */
  async _listDirFiles(dirPath) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      return entries.filter(e => e.isFile()).map(e => e.name);
    } catch {
      return [];
    }
  }

  /**
   * 根据用户输入匹配相关 Skills
   * @param {string} userInput - 用户输入
   * @param {number} maxResults - 最大返回数量
   * @returns {SkillMeta[]}
   */
  async matchSkills(userInput, maxResults = 3) {
    await this.initialize();

    const enabledSkills = this.indexCache.skills.filter(s => s.enabled);
    const inputLower = userInput.toLowerCase();
    const inputWords = inputLower.split(/\s+/);

    // 计算匹配分数
    const scored = enabledSkills.map(skill => {
      let score = 0;

      // 触发词匹配（高权重）
      for (const trigger of skill.triggers) {
        const triggerLower = trigger.toLowerCase();
        if (inputLower.includes(triggerLower)) {
          score += 10;
        } else if (inputWords.some(word => triggerLower.includes(word))) {
          score += 5;
        }
      }

      // 名称匹配
      if (inputLower.includes(skill.name.toLowerCase())) {
        score += 8;
      }

      // 描述匹配
      const descLower = skill.description.toLowerCase();
      for (const word of inputWords) {
        if (word.length > 2 && descLower.includes(word)) {
          score += 2;
        }
      }

      // 标签匹配
      for (const tag of skill.tags) {
        if (inputLower.includes(tag.toLowerCase())) {
          score += 3;
        }
      }

      return { skill, score };
    });

    // 排序并返回
    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .map(s => s.skill);
  }

  /**
   * 启用/禁用 Skill
   * @param {string} skillId - Skill ID
   * @param {boolean} enabled - 是否启用
   * @returns {boolean}
   */
  async setSkillEnabled(skillId, enabled) {
    await this.initialize();

    const skill = this.indexCache.skills.find(s => s.id === skillId);
    if (!skill) {
      return false;
    }

    skill.enabled = enabled;
    skill.updatedAt = new Date().toISOString().split('T')[0];
    await this._saveIndex();

    // 清除缓存
    this.skillsCache.delete(skillId);

    return true;
  }

  /**
   * 创建新 Skill
   * @param {Object} skillData - Skill 数据
   * @returns {SkillMeta}
   */
  async createSkill(skillData) {
    await this.initialize();

    const {
      id,
      name,
      description,
      triggers = [],
      tags = [],
      instructions,
      author = 'User'
    } = skillData;

    // 验证 ID
    if (!id || !/^[a-z0-9-]+$/.test(id)) {
      throw new Error('Skill ID 必须是小写字母、数字和连字符');
    }

    // 检查是否已存在
    if (this.indexCache.skills.some(s => s.id === id)) {
      throw new Error(`Skill ${id} 已存在`);
    }

    // 创建目录结构
    const skillDir = path.join(SKILLS_DIR, id);
    await fs.mkdir(skillDir, { recursive: true });
    await fs.mkdir(path.join(skillDir, 'references'), { recursive: true });
    await fs.mkdir(path.join(skillDir, 'assets'), { recursive: true });

    // 生成 SKILL.md 内容
    const skillMd = this._generateSkillMd({
      id,
      name,
      description,
      triggers,
      tags,
      author,
      instructions
    });

    await fs.writeFile(path.join(skillDir, 'SKILL.md'), skillMd, 'utf-8');

    // 更新索引
    const meta = {
      id,
      name,
      description,
      version: '1.0.0',
      triggers,
      tags,
      author,
      enabled: true,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };

    this.indexCache.skills.push(meta);
    await this._saveIndex();

    console.log(`[SkillService] 创建 Skill: ${id}`);
    return meta;
  }

  /**
   * 生成 SKILL.md 文件内容
   * @param {Object} data - Skill 数据
   * @returns {string}
   */
  _generateSkillMd(data) {
    const triggersYaml = data.triggers.map(t => `  - "${t}"`).join('\n');
    const tagsYaml = data.tags.map(t => `  - "${t}"`).join('\n');

    return `---
id: ${data.id}
name: ${data.name}
description: ${data.description}
version: 1.0.0
author: ${data.author}
created: ${new Date().toISOString().split('T')[0]}
triggers:
${triggersYaml || '  # 添加触发关键词'}
tags:
${tagsYaml || '  # 添加分类标签'}
---

${data.instructions || '# ' + data.name + '\n\n在此编写 Skill 指令...'}
`;
  }

  /**
   * 删除 Skill
   * @param {string} skillId - Skill ID
   * @returns {boolean}
   */
  async deleteSkill(skillId) {
    await this.initialize();

    const index = this.indexCache.skills.findIndex(s => s.id === skillId);
    if (index === -1) {
      return false;
    }

    // 删除目录
    const skillDir = path.join(SKILLS_DIR, skillId);
    try {
      await fs.rm(skillDir, { recursive: true, force: true });
    } catch (error) {
      console.error(`[SkillService] 删除 Skill 目录失败:`, error);
    }

    // 更新索引
    this.indexCache.skills.splice(index, 1);
    await this._saveIndex();

    // 清除缓存
    this.skillsCache.delete(skillId);

    console.log(`[SkillService] 删除 Skill: ${skillId}`);
    return true;
  }

  /**
   * 更新 Skill
   * @param {string} skillId - Skill ID
   * @param {Object} updates - 更新数据
   * @returns {SkillMeta|null}
   */
  async updateSkill(skillId, updates) {
    await this.initialize();

    const skill = await this.getSkill(skillId);
    if (!skill) {
      return null;
    }

    const {
      name = skill.meta.name,
      description = skill.meta.description,
      triggers = skill.meta.triggers,
      tags = skill.meta.tags,
      instructions = skill.instructions
    } = updates;

    // 重新生成 SKILL.md
    const skillMd = this._generateSkillMd({
      id: skillId,
      name,
      description,
      triggers,
      tags,
      author: skill.meta.author,
      instructions
    });

    const skillMdPath = path.join(SKILLS_DIR, skillId, 'SKILL.md');
    await fs.writeFile(skillMdPath, skillMd, 'utf-8');

    // 更新索引
    const metaIndex = this.indexCache.skills.findIndex(s => s.id === skillId);
    if (metaIndex !== -1) {
      this.indexCache.skills[metaIndex] = {
        ...this.indexCache.skills[metaIndex],
        name,
        description,
        triggers,
        tags,
        updatedAt: new Date().toISOString().split('T')[0]
      };
      await this._saveIndex();
    }

    // 清除缓存
    this.skillsCache.delete(skillId);

    return this.indexCache.skills[metaIndex];
  }

  /**
   * 为提示词生成构建 Skills 上下文
   * @param {string} userInput - 用户输入
   * @returns {string} - Skills 上下文字符串
   */
  async buildSkillsContext(userInput) {
    const matchedSkills = await this.matchSkills(userInput, 3);
    
    if (matchedSkills.length === 0) {
      return '';
    }

    const contexts = [];
    
    for (const meta of matchedSkills) {
      const skill = await this.getSkill(meta.id);
      if (skill && skill.instructions) {
        contexts.push(`
## 🎯 Skill: ${skill.meta.name}

${skill.instructions}
`);
      }
    }

    if (contexts.length === 0) {
      return '';
    }

    return `
---
## 💡 已激活的专业 Skills

以下是根据您的需求自动匹配的专业能力：

${contexts.join('\n---\n')}
---
`;
  }

  /**
   * 重新扫描 Skills 目录
   */
  async rescan() {
    this.skillsCache.clear();
    await this._syncSkills();
    console.log(`[SkillService] 重新扫描完成，发现 ${this.indexCache.skills.length} 个 Skills`);
    return this.indexCache.skills;
  }

  /**
   * 导出 Skill 为 JSON
   * @param {string} skillId - Skill ID
   * @returns {Object|null}
   */
  async exportSkill(skillId) {
    const skill = await this.getSkill(skillId);
    if (!skill) {
      return null;
    }

    return {
      exportVersion: '1.0',
      exportDate: new Date().toISOString(),
      skill: {
        ...skill.meta,
        instructions: skill.instructions
      }
    };
  }

  /**
   * 从 JSON 导入 Skill
   * @param {Object} data - 导入数据
   * @returns {SkillMeta}
   */
  async importSkill(data) {
    if (!data.skill || !data.skill.id) {
      throw new Error('无效的导入数据');
    }

    const { skill } = data;
    
    // 检查是否已存在
    if (this.indexCache.skills.some(s => s.id === skill.id)) {
      // 生成新 ID
      skill.id = `${skill.id}-imported-${Date.now()}`;
    }

    return await this.createSkill({
      id: skill.id,
      name: skill.name,
      description: skill.description,
      triggers: skill.triggers,
      tags: skill.tags,
      instructions: skill.instructions,
      author: skill.author || 'Imported'
    });
  }
}

// 导出单例
module.exports = new SkillService();
