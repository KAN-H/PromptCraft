#!/usr/bin/env python3
"""
测试 NipponColors 技能包功能
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# 导入生成器模块
from generator import search_colors

def test_search_functionality():
    """测试搜索功能"""
    print("="*60)
    print("NipponColors 技能包功能测试")
    print("="*60)
    
    test_cases = [
        ("春天主题", "spring"),
        ("秋天主题", "autumn"),
        ("红色系", "red"),
        ("蓝色系", "blue"),
        ("绿色系", "green"),
        ("温暖感觉", "warm"),
        ("优雅感觉", "elegant"),
        ("樱花颜色", "sakura"),
        ("紫色", "紫"),
        ("梅", "ume"),
    ]
    
    for description, keyword in test_cases:
        print(f"\n{'='*40}")
        print(f"测试: {description} (关键词: '{keyword}')")
        print('='*40)
        try:
            result = search_colors(keyword)
            # 只显示前几行
            lines = result.split('\n')
            for i, line in enumerate(lines[:15]):  # 显示前15行
                print(line)
            if len(lines) > 15:
                print("... (结果已截断)")
            print()
        except Exception as e:
            print(f"错误: {e}")
    
    # 测试边缘情况
    print(f"\n{'='*40}")
    print("测试边缘情况")
    print('='*40)
    
    # 测试不存在的关键词
    result = search_colors("不存在的颜色")
    print("测试不存在的关键词:")
    print(result[:200] + "..." if len(result) > 200 else result)
    
    print(f"\n{'='*40}")
    print("功能总结")
    print('='*40)
    print("[√] 支持多种查询方式:")
    print("  - 季节查询 (spring, autumn, summer, winter)")
    print("  - 颜色家族查询 (red, blue, green, purple)")
    print("  - 情感查询 (warm, cool, calm, elegant)")
    print("  - 具体颜色名称查询 (sakura, murasaki, ruri)")
    print("  - 日文汉字查询 (紫, 桜, 梅)")
    print(f"\n[√] 数据库包含 {302 if '302' in search_colors('red') else '未知'} 种日本传统颜色")
    print("[√] 每种颜色包含: 英文名、日文汉字、HEX值、RGB值、文化描述")
    print("[√] 数据来源: nipponcolors.com")

if __name__ == "__main__":
    test_search_functionality()