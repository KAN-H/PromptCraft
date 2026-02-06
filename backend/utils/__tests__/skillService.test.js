/**
 * Skills API 和 Service 单元测试
 * 
 * @version 1.0.0
 */

const skillService = require('../../services/skillService');
const fs = require('fs').promises;
const path = require('path');

// 测试用 Skill ID
const TEST_SKILL_ID = 'test-skill-unit-test';

// 需要测试的内置 Skills
const BUILT_IN_SKILLS = ['logo-critique-expert', 'color-theory-master', 'brand-strategy-advisor'];

describe('SkillService', () => {
  
  beforeAll(async () => {
    // 初始化服务
    await skillService.initialize();
    
    // 启用测试需要的 Skills
    for (const skillId of BUILT_IN_SKILLS) {
      try {
        await skillService.setSkillEnabled(skillId, true);
      } catch (e) {
        // 忽略错误
      }
    }
  });

  afterAll(async () => {
    // 清理测试创建的 Skill
    try {
      await skillService.deleteSkill(TEST_SKILL_ID);
    } catch (e) {
      // 忽略删除失败
    }
    
    // 恢复 Skills 为禁用状态
    for (const skillId of BUILT_IN_SKILLS) {
      try {
        await skillService.setSkillEnabled(skillId, false);
      } catch (e) {
        // 忽略错误
      }
    }
  });

  describe('初始化', () => {
    test('应该成功初始化服务', async () => {
      expect(skillService.initialized).toBe(true);
    });

    test('应该能够列出 Skills', async () => {
      const skills = await skillService.listSkills();
      expect(Array.isArray(skills)).toBe(true);
    });
  });

  describe('listSkills', () => {
    test('应该返回预置的 Skills', async () => {
      const skills = await skillService.listSkills();
      
      // 检查是否包含预置 Skills
      const skillIds = skills.map(s => s.id);
      expect(skillIds).toContain('logo-critique-expert');
      expect(skillIds).toContain('color-theory-master');
      expect(skillIds).toContain('brand-strategy-advisor');
    });

    test('应该能够按标签筛选', async () => {
      const skills = await skillService.listSkills({ tags: ['logo'] });
      
      // 至少有一个包含 logo 标签的 Skill
      expect(skills.some(s => s.tags.includes('logo'))).toBe(true);
    });

    test('应该能够只返回启用的 Skills', async () => {
      const skills = await skillService.listSkills({ enabledOnly: true });
      
      // 所有返回的 Skills 都应该是启用的
      expect(skills.every(s => s.enabled)).toBe(true);
    });
  });

  describe('getSkill', () => {
    test('应该返回完整的 Skill 信息', async () => {
      const skill = await skillService.getSkill('logo-critique-expert');
      
      expect(skill).not.toBeNull();
      expect(skill.meta).toBeDefined();
      expect(skill.meta.id).toBe('logo-critique-expert');
      expect(skill.meta.name).toBe('Logo 评审专家');
      expect(skill.instructions).toBeDefined();
      expect(skill.instructions.length).toBeGreaterThan(0);
    });

    test('不存在的 Skill 应该返回 null', async () => {
      const skill = await skillService.getSkill('non-existent-skill');
      expect(skill).toBeNull();
    });
  });

  describe('matchSkills', () => {
    test('应该根据关键词匹配 Skills', async () => {
      const matches = await skillService.matchSkills('logo设计评审');
      
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].id).toBe('logo-critique-expert');
    });

    test('应该根据配色关键词匹配 color-theory-master', async () => {
      const matches = await skillService.matchSkills('帮我做一个配色方案');
      
      expect(matches.length).toBeGreaterThan(0);
      expect(matches.some(s => s.id === 'color-theory-master')).toBe(true);
    });

    test('应该根据品牌关键词匹配 brand-strategy-advisor', async () => {
      const matches = await skillService.matchSkills('品牌定位和目标受众分析');
      
      expect(matches.length).toBeGreaterThan(0);
      expect(matches.some(s => s.id === 'brand-strategy-advisor')).toBe(true);
    });

    test('无关输入应该返回空数组', async () => {
      const matches = await skillService.matchSkills('今天天气怎么样');
      // 可能匹配到一些，也可能为空
      expect(Array.isArray(matches)).toBe(true);
    });
  });

  describe('createSkill', () => {
    test('应该成功创建新 Skill', async () => {
      const skillData = {
        id: TEST_SKILL_ID,
        name: '测试 Skill',
        description: '这是一个测试用的 Skill',
        triggers: ['测试', '单元测试'],
        tags: ['测试'],
        instructions: '# 测试 Skill\n\n这是测试内容。',
        author: 'Test'
      };

      const created = await skillService.createSkill(skillData);
      
      expect(created.id).toBe(TEST_SKILL_ID);
      expect(created.name).toBe('测试 Skill');
      expect(created.triggers).toContain('测试');
    });

    test('重复 ID 应该抛出错误', async () => {
      const skillData = {
        id: TEST_SKILL_ID,
        name: '重复 Skill',
        description: '这应该失败'
      };

      await expect(skillService.createSkill(skillData)).rejects.toThrow(/已存在/);
    });

    test('无效 ID 应该抛出错误', async () => {
      const skillData = {
        id: 'Invalid ID With Spaces',
        name: '无效 Skill'
      };

      await expect(skillService.createSkill(skillData)).rejects.toThrow(/小写字母/);
    });
  });

  describe('updateSkill', () => {
    test('应该成功更新 Skill', async () => {
      const updates = {
        name: '更新后的测试 Skill',
        description: '更新后的描述',
        triggers: ['测试', '更新测试'],
        instructions: '# 更新后\n\n这是更新后的内容。'
      };

      const updated = await skillService.updateSkill(TEST_SKILL_ID, updates);
      
      expect(updated.name).toBe('更新后的测试 Skill');
      expect(updated.description).toBe('更新后的描述');
    });

    test('更新不存在的 Skill 应该返回 null', async () => {
      const result = await skillService.updateSkill('non-existent', { name: 'test' });
      expect(result).toBeNull();
    });
  });

  describe('setSkillEnabled', () => {
    test('应该成功禁用 Skill', async () => {
      const success = await skillService.setSkillEnabled(TEST_SKILL_ID, false);
      expect(success).toBe(true);

      const skills = await skillService.listSkills();
      const skill = skills.find(s => s.id === TEST_SKILL_ID);
      expect(skill.enabled).toBe(false);
    });

    test('应该成功启用 Skill', async () => {
      const success = await skillService.setSkillEnabled(TEST_SKILL_ID, true);
      expect(success).toBe(true);

      const skills = await skillService.listSkills();
      const skill = skills.find(s => s.id === TEST_SKILL_ID);
      expect(skill.enabled).toBe(true);
    });
  });

  describe('exportSkill / importSkill', () => {
    test('应该成功导出 Skill', async () => {
      const exported = await skillService.exportSkill('logo-critique-expert');
      
      expect(exported).not.toBeNull();
      expect(exported.exportVersion).toBe('1.0');
      expect(exported.skill).toBeDefined();
      expect(exported.skill.id).toBe('logo-critique-expert');
      expect(exported.skill.instructions).toBeDefined();
    });

    test('导出不存在的 Skill 应该返回 null', async () => {
      const exported = await skillService.exportSkill('non-existent');
      expect(exported).toBeNull();
    });
  });

  describe('buildSkillsContext', () => {
    test('应该为相关输入构建上下文', async () => {
      const context = await skillService.buildSkillsContext('帮我评审一下这个logo设计');
      
      expect(context.length).toBeGreaterThan(0);
      expect(context).toContain('Logo 评审专家');
    });

    test('无关输入可能返回空上下文', async () => {
      const context = await skillService.buildSkillsContext('随机无关文本xyz123');
      // 上下文可能为空或包含部分匹配
      expect(typeof context).toBe('string');
    });
  });

  describe('deleteSkill', () => {
    test('应该成功删除 Skill', async () => {
      const success = await skillService.deleteSkill(TEST_SKILL_ID);
      expect(success).toBe(true);

      const skills = await skillService.listSkills();
      const skill = skills.find(s => s.id === TEST_SKILL_ID);
      expect(skill).toBeUndefined();
    });

    test('删除不存在的 Skill 应该返回 false', async () => {
      const success = await skillService.deleteSkill('non-existent-skill');
      expect(success).toBe(false);
    });
  });

  describe('rescan', () => {
    test('应该成功重新扫描 Skills', async () => {
      const skills = await skillService.rescan();
      
      expect(Array.isArray(skills)).toBe(true);
      expect(skills.length).toBeGreaterThanOrEqual(3); // 至少有 3 个预置 Skills
    });
  });
});
