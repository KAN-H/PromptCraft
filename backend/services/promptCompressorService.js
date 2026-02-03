/**
 * PromptCompressorService - 提示词压缩服务
 * 
 * 为超轻量模型（如 0.6B Qwen，2048 token 限制）提供提示词压缩功能
 * 通过多层次压缩策略，在保持核心语义的同时大幅减少 token 消耗
 * 
 * @version 1.0.0
 * @author PromptCraft Team
 */

/**
 * 压缩等级枚举
 */
const CompressionLevel = {
  FULL: 0,      // 完整模式 - 不压缩
  LITE: 1,      // 精简模式 - 约 4K tokens
  ULTRA: 2      // 超轻量模式 - 约 1.5K tokens
};

/**
 * Token 限制预设
 */
const TokenLimits = {
  FULL: Infinity,
  LITE: 4096,
  ULTRA: 1500
};

class PromptCompressorService {
  constructor() {
    // 中文字符平均 token 系数（粗略估算）
    this.chineseTokenRatio = 0.6;
    // 英文单词平均 token 系数
    this.englishTokenRatio = 1.3;
  }

  /**
   * 估算文本的 token 数量
   * 使用简化算法：中文约 1.5-2 字符/token，英文约 4 字符/token
   * 
   * @param {string} text - 输入文本
   * @returns {number} - 估算的 token 数量
   */
  estimateTokens(text) {
    if (!text) return 0;
    
    // 分离中英文
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
    const numbers = (text.match(/\d+/g) || []).length;
    const punctuation = (text.match(/[^\w\s\u4e00-\u9fa5]/g) || []).length;
    
    // 粗略估算
    const chineseTokens = chineseChars * this.chineseTokenRatio;
    const englishTokens = englishWords * this.englishTokenRatio;
    const otherTokens = (numbers + punctuation) * 0.5;
    
    return Math.ceil(chineseTokens + englishTokens + otherTokens);
  }

  /**
   * 获取压缩等级的目标 token 限制
   * 
   * @param {number} level - 压缩等级
   * @returns {number} - token 限制
   */
  getTokenLimit(level) {
    switch (level) {
      case CompressionLevel.LITE:
        return TokenLimits.LITE;
      case CompressionLevel.ULTRA:
        return TokenLimits.ULTRA;
      default:
        return TokenLimits.FULL;
    }
  }

  /**
   * 压缩 Skill 上下文
   * 
   * @param {string} skillContext - 原始 Skill 上下文
   * @param {number} level - 压缩等级
   * @returns {string} - 压缩后的上下文
   */
  compressSkillContext(skillContext, level = CompressionLevel.FULL) {
    if (!skillContext || level === CompressionLevel.FULL) {
      return skillContext;
    }

    // 解析出各个 Skill
    const skillBlocks = this._parseSkillBlocks(skillContext);
    
    if (skillBlocks.length === 0) {
      return skillContext;
    }

    const compressedBlocks = skillBlocks.map(block => {
      if (level === CompressionLevel.ULTRA) {
        // 超轻量模式：只保留 Skill 名称和一句话描述
        return this._compressSkillUltra(block);
      } else {
        // 精简模式：保留核心指令，移除示例
        return this._compressSkillLite(block);
      }
    });

    // 重新组装
    if (level === CompressionLevel.ULTRA) {
      return `
【已激活专业技能】
${compressedBlocks.join('\n')}
`;
    } else {
      return `
---
## 💡 已激活的专业 Skills（精简版）

${compressedBlocks.join('\n---\n')}
---
`;
    }
  }

  /**
   * 解析 Skill 块
   * @private
   */
  _parseSkillBlocks(context) {
    const blocks = [];
    const regex = /## 🎯 Skill: (.+?)\n([\s\S]*?)(?=## 🎯 Skill:|$)/g;
    let match;
    
    while ((match = regex.exec(context)) !== null) {
      blocks.push({
        name: match[1].trim(),
        content: match[2].trim()
      });
    }
    
    return blocks;
  }

  /**
   * 超轻量压缩 Skill - 只保留名称和核心描述
   * @private
   */
  _compressSkillUltra(block) {
    // 提取第一段作为核心描述
    const lines = block.content.split('\n').filter(l => l.trim());
    let coreDesc = '';
    
    // 查找角色定位或第一个有意义的段落
    for (const line of lines) {
      if (line.includes('角色定位') || line.includes('你是')) {
        coreDesc = line.replace(/^#+\s*/, '').replace(/[【】]/g, '');
        break;
      }
    }
    
    if (!coreDesc && lines.length > 0) {
      // 取第一行有意义的内容
      coreDesc = lines.find(l => l.length > 10 && !l.startsWith('#')) || lines[0];
    }
    
    // 限制长度
    if (coreDesc.length > 50) {
      coreDesc = coreDesc.substring(0, 50) + '...';
    }
    
    return `• ${block.name}: ${coreDesc}`;
  }

  /**
   * 精简压缩 Skill - 保留核心指令，移除示例和详细说明
   * @private
   */
  _compressSkillLite(block) {
    const lines = block.content.split('\n');
    const compressedLines = [];
    let skipSection = false;
    let inCodeBlock = false;
    
    for (const line of lines) {
      // 检测代码块
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        // 跳过代码块
        continue;
      }
      
      if (inCodeBlock) {
        continue;
      }
      
      // 跳过示例部分
      if (line.includes('示例') || line.includes('Example') || line.includes('参考案例')) {
        skipSection = true;
        continue;
      }
      
      // 跳过注意事项等次要部分
      if (line.includes('注意事项') || line.includes('⚠️')) {
        skipSection = true;
        continue;
      }
      
      // 遇到新的主标题时停止跳过
      if (line.startsWith('## ') || line.startsWith('### ')) {
        skipSection = false;
      }
      
      if (!skipSection) {
        // 压缩列表项
        if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
          // 只保留关键列表项
          if (line.length < 100) {
            compressedLines.push(line);
          }
        } else if (line.trim()) {
          compressedLines.push(line);
        }
      }
    }
    
    return `## 🎯 ${block.name}\n\n${compressedLines.join('\n')}`;
  }

  /**
   * 压缩系统提示词
   * 
   * @param {string} systemPrompt - 原始系统提示词
   * @param {number} level - 压缩等级
   * @param {Array} userMustInclude - 用户必须包含的关键信息
   * @returns {string} - 压缩后的系统提示词
   */
  compressSystemPrompt(systemPrompt, level = CompressionLevel.FULL, userMustInclude = []) {
    if (!systemPrompt || level === CompressionLevel.FULL) {
      return systemPrompt;
    }

    if (level === CompressionLevel.ULTRA) {
      return this._buildUltraSystemPrompt(userMustInclude);
    } else {
      return this._buildLiteSystemPrompt(systemPrompt, userMustInclude);
    }
  }

  /**
   * 构建超轻量系统提示词
   * @private
   */
  _buildUltraSystemPrompt(userMustInclude = []) {
    let prompt = `你是AI图像生成专家。根据用户需求生成英文图像提示词。

【输出要求】
1. 只输出英文提示词
2. 包含：主体、风格、色彩、构图
3. 适配 Midjourney/DALL-E/SD`;

    if (userMustInclude.length > 0) {
      prompt += `\n\n【必须包含】\n${userMustInclude.map(item => `- ${item.label}: ${item.value}`).join('\n')}`;
    }

    return prompt;
  }

  /**
   * 构建精简系统提示词
   * @private
   */
  _buildLiteSystemPrompt(originalPrompt, userMustInclude = []) {
    // 移除示例部分
    let prompt = originalPrompt
      .replace(/【示例参考】[\s\S]*?(?=【|$)/g, '')
      .replace(/【Example】[\s\S]*?(?=【|$)/g, '')
      .replace(/示例：[\s\S]*?(?=\n\n|$)/g, '');
    
    // 移除过长的风格指导细节
    prompt = prompt.replace(/【设计风格倾向】[\s\S]*?(?=【|$)/g, match => {
      // 只保留前 200 字符
      if (match.length > 250) {
        return match.substring(0, 250) + '...\n\n';
      }
      return match;
    });

    // 移除行业特性的详细描述
    prompt = prompt.replace(/【行业特性考量】[\s\S]*?(?=【|$)/g, match => {
      if (match.length > 200) {
        return match.substring(0, 200) + '...\n\n';
      }
      return match;
    });

    // 确保用户关键信息保留
    if (userMustInclude.length > 0) {
      const keyInfoSection = `\n【必须包含的用户信息】\n${userMustInclude.map(item => `- ${item.label}: ${item.value}`).join('\n')}\n`;
      
      // 如果原文没有，添加上
      if (!prompt.includes('必须包含')) {
        prompt += keyInfoSection;
      }
    }

    return prompt;
  }

  /**
   * 压缩结构化提示词（用户消息）
   * 
   * @param {string} structuredPrompt - 原始结构化提示词
   * @param {number} level - 压缩等级
   * @returns {string} - 压缩后的提示词
   */
  compressStructuredPrompt(structuredPrompt, level = CompressionLevel.FULL) {
    if (!structuredPrompt || level === CompressionLevel.FULL) {
      return structuredPrompt;
    }

    if (level === CompressionLevel.ULTRA) {
      // 超轻量：只保留核心段落
      return this._extractCoreContent(structuredPrompt);
    } else {
      // 精简：移除冗余描述
      return this._removePaddingContent(structuredPrompt);
    }
  }

  /**
   * 提取核心内容
   * @private
   */
  _extractCoreContent(prompt) {
    const sections = prompt.split(/【.*?】/);
    const headers = prompt.match(/【.*?】/g) || [];
    
    // 优先保留的段落
    const priorityKeywords = ['设计任务', '任务', '角色', '要求', '必须'];
    const coreSections = [];
    
    headers.forEach((header, index) => {
      const content = sections[index + 1]?.trim();
      if (!content) return;
      
      // 检查是否是优先段落
      const isPriority = priorityKeywords.some(kw => header.includes(kw));
      
      if (isPriority) {
        // 限制每个段落的长度
        const limitedContent = content.length > 150 
          ? content.substring(0, 150) + '...'
          : content;
        coreSections.push(`${header}\n${limitedContent}`);
      }
    });
    
    return coreSections.join('\n\n') || prompt.substring(0, 500);
  }

  /**
   * 移除填充内容（精简模式）
   * @private
   */
  _removePaddingContent(prompt) {
    // 首先进行基础清理
    let result = prompt
      // 移除过多的换行
      .replace(/\n{3,}/g, '\n\n')
      // 移除纯装饰性内容
      .replace(/[═─]{3,}/g, '')
      // 移除空的段落标题
      .replace(/【[^】]+】\s*\n\s*\n/g, '');

    // 精简模式：对各段落进行压缩
    const sections = result.split(/(?=【)/);
    const compressedSections = [];
    
    // 定义需要压缩或移除的段落
    const removeKeywords = ['推荐关键词', '输出格式', '参考案例'];
    const truncateKeywords = ['专业背景', '设计背景'];
    const keepKeywords = ['角色定位', '设计任务', '设计要求'];
    
    for (const section of sections) {
      if (!section.trim()) continue;
      
      // 提取段落标题
      const headerMatch = section.match(/【([^】]+)】/);
      const header = headerMatch ? headerMatch[1] : '';
      
      // 检查是否需要移除
      if (removeKeywords.some(kw => header.includes(kw))) {
        continue; // 跳过这个段落
      }
      
      // 检查是否需要截断
      if (truncateKeywords.some(kw => header.includes(kw))) {
        // 只保留前 100 字符的内容
        const content = section.replace(/【[^】]+】\n?/, '');
        const truncated = content.length > 100 
          ? content.substring(0, 100).trim() + '...'
          : content;
        compressedSections.push(`【${header}】\n${truncated}`);
        continue;
      }
      
      // 对于保留的关键段落，压缩列表项
      if (keepKeywords.some(kw => header.includes(kw))) {
        // 保留但压缩过长的列表项
        const compressedSection = section.replace(/^(\s*[-•]\s+.{60}).+$/gm, '$1...');
        compressedSections.push(compressedSection);
        continue;
      }
      
      // 其他段落：保留但限制长度
      const content = section.replace(/【[^】]+】\n?/, '');
      if (content.length > 150) {
        const truncated = content.substring(0, 150).trim() + '...';
        compressedSections.push(`【${header}】\n${truncated}`);
      } else {
        compressedSections.push(section);
      }
    }
    
    return compressedSections.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  /**
   * 完整的压缩流程
   * 
   * @param {Object} params - 压缩参数
   * @param {string} params.systemPrompt - 系统提示词
   * @param {string} params.structuredPrompt - 结构化提示词
   * @param {string} params.skillsContext - Skills 上下文
   * @param {number} params.level - 压缩等级
   * @param {Array} params.userMustInclude - 用户必须包含的信息
   * @returns {Object} - 压缩结果
   */
  compress(params) {
    const {
      systemPrompt = '',
      structuredPrompt = '',
      skillsContext = '',
      level = CompressionLevel.FULL,
      userMustInclude = []
    } = params;

    // 压缩各部分
    const compressedSystem = this.compressSystemPrompt(systemPrompt, level, userMustInclude);
    const compressedStructured = this.compressStructuredPrompt(structuredPrompt, level);
    const compressedSkills = this.compressSkillContext(skillsContext, level);

    // 估算 token
    const originalTokens = this.estimateTokens(systemPrompt + structuredPrompt + skillsContext);
    const compressedTokens = this.estimateTokens(compressedSystem + compressedStructured + compressedSkills);

    return {
      systemPrompt: compressedSystem,
      structuredPrompt: compressedStructured,
      skillsContext: compressedSkills,
      stats: {
        originalTokens,
        compressedTokens,
        savedTokens: originalTokens - compressedTokens,
        compressionRatio: originalTokens > 0 
          ? Math.round((1 - compressedTokens / originalTokens) * 100) 
          : 0
      }
    };
  }

  /**
   * 根据目标 token 限制自动选择压缩等级
   * 
   * @param {number} estimatedTokens - 估算的 token 数
   * @param {number} targetLimit - 目标限制
   * @returns {number} - 推荐的压缩等级
   */
  recommendCompressionLevel(estimatedTokens, targetLimit = 2048) {
    if (estimatedTokens <= targetLimit * 0.8) {
      return CompressionLevel.FULL;
    } else if (estimatedTokens <= targetLimit * 1.5) {
      return CompressionLevel.LITE;
    } else {
      return CompressionLevel.ULTRA;
    }
  }

  /**
   * 获取压缩等级的描述
   * 
   * @param {number} level - 压缩等级
   * @returns {Object} - 等级描述
   */
  getLevelInfo(level) {
    const info = {
      [CompressionLevel.FULL]: {
        name: '完整模式',
        nameEn: 'Full',
        description: '保留所有内容，适合 8K+ token 的模型',
        icon: '📝',
        targetTokens: '无限制'
      },
      [CompressionLevel.LITE]: {
        name: '精简模式',
        nameEn: 'Lite',
        description: '移除示例，保留核心指令，适合 4K token 的模型',
        icon: '📄',
        targetTokens: '~4K'
      },
      [CompressionLevel.ULTRA]: {
        name: '超轻量模式',
        nameEn: 'Ultra',
        description: '极度精简，只保留核心要素，适合 2K token 的超轻量模型',
        icon: '⚡',
        targetTokens: '~1.5K'
      }
    };
    
    return info[level] || info[CompressionLevel.FULL];
  }
}

// 导出
const promptCompressor = new PromptCompressorService();

module.exports = {
  PromptCompressorService,
  promptCompressor,
  CompressionLevel,
  TokenLimits
};
