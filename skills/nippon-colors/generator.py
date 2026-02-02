import csv
import json
import os
from typing import List, Dict, Optional

class NipponColorDatabase:
    """处理日本传统颜色数据库，支持188种颜色"""
    
    def __init__(self, csv_path: str):
        self.colors_data = []
        self.csv_path = csv_path
        self.load_colors()
        
    def load_colors(self):
        """从CSV文件加载颜色数据"""
        if not os.path.exists(self.csv_path):
            raise FileNotFoundError(f"CSV file not found: {self.csv_path}")
            
        with open(self.csv_path, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                self.colors_data.append({
                    'english_name': row['English Name'],
                    'hex': row['Hex'],
                    'rgb': row['RGB'],
                    'japanese_kanji': row['Japanese (Kanji)'],
                    'japanese_hiragana': row['Japanese (Hiragana)']
                })
                
    def search_by_keyword(self, keyword: str) -> List[Dict]:
        """根据关键词搜索颜色"""
        results = []
        keyword_lower = keyword.lower()
        
        for color in self.colors_data:
            # 检查所有字段是否包含关键词
            if (
                keyword_lower in color['english_name'].lower() or
                keyword_lower in color['japanese_kanji'] or
                keyword_lower in color['japanese_hiragana'].lower() or
                keyword_lower in color['hex'].lower()
            ):
                results.append(color)
                
        return results
        
    def search_by_season(self, season: str) -> List[Dict]:
        """根据季节搜索颜色"""
        season_colors = {
            "spring": ["sakura", "ume", "nadeshiko", "tsutsuji", "momiji", "yanagi", "wakana", "wakakusa"],
            "summer": ["ao", "mizu", "sora", "ruri", "aizome", "hasu", "suiren", "hotaru"],
            "autumn": ["kaki", "koukei", "kuchiba", "inaho", "momiji", "koyo", "yamabuki", "kuri"],
            "winter": ["yuki", "koori", "shiro", "gin", "sumi", "tsuki", "fuji", "shimofuri"]
        }
        
        season_lower = season.lower()
        if season_lower not in season_colors:
            return []
            
        season_keywords = season_colors[season_lower]
        results = []
        
        for color in self.colors_data:
            color_name_lower = color['english_name'].lower()
            if any(keyword in color_name_lower for keyword in season_keywords):
                results.append(color)
                
        return results
    
    def search_by_color_family(self, color_family: str) -> List[Dict]:
        """根据颜色家族搜索"""
        color_families = {
            "red": ["beni", "akane", "benihi", "kurenai", "enji", "hien", "hiro", "shinshu"],
            "blue": ["ao", "ruri", "aizome", "sora", "mizu", "aomidori", "fuji", "hisoku"],
            "green": ["midori", "moegi", "wakamidori", "yanagi", "matcha", "matsu", "yomogi"],
            "purple": ["murasaki", "ayame", "shikon", "fuji", "usumurasaki", "kokimurasaki"],
            "yellow": ["yamabuki", "kogane", "kuchi", "lemon", "tanpopo", "ukon"],
            "brown": ["kaki", "chairo", "kobicha", "kogecha", "kurikawacha", "edo"],
            "pink": ["sakura", "momo", "ume", "nadeshiko", "usubeni", "hanairo"],
            "white": ["shiro", "shironeri", "gofun", "yuki", "byakuro", "hakushi"],
            "black": ["kuro", "sumi", "karasu", "namari", "kurocha", "kurotobi"],
            "gray": ["hai", "nezumi", "sabiiro", "umenezumi", "shironezumi"]
        }
        
        family_lower = color_family.lower()
        if family_lower not in color_families:
            return []
            
        family_keywords = color_families[family_lower]
        results = []
        
        for color in self.colors_data:
            color_name_lower = color['english_name'].lower()
            if any(keyword in color_name_lower for keyword in family_keywords):
                results.append(color)
                
        return results
    
    def search_by_emotion(self, emotion: str) -> List[Dict]:
        """根据情感搜索颜色"""
        emotion_colors = {
            "warm": ["akane", "beni", "kurenai", "yamabuki", "kaki", "daidai", "kouyou"],
            "cool": ["ao", "ruri", "mizu", "sora", "hisoku", "fuji", "shironeri"],
            "calm": ["midori", "yanagi", "matcha", "aoni", "byakuro", "usumurasaki"],
            "energetic": ["benihi", "yamabuki", "hotaru", "mikan", "orenji", "tanpopo"],
            "elegant": ["murasaki", "fuji", "shikon", "gin", "kinu", "byakuro"],
            "natural": ["kaki", "yanagi", "matsu", "ume", "sakura", "kusa", "tsuchi"]
        }
        
        emotion_lower = emotion.lower()
        if emotion_lower not in emotion_colors:
            return []
            
        emotion_keywords = emotion_colors[emotion_lower]
        results = []
        
        for color in self.colors_data:
            color_name_lower = color['english_name'].lower()
            if any(keyword in color_name_lower for keyword in emotion_keywords):
                results.append(color)
                
        return results
        
    def get_color_by_name(self, name: str) -> Optional[Dict]:
        """根据名称精确查找颜色"""
        for color in self.colors_data:
            if name.lower() == color['english_name'].lower():
                return color
        return None
        
    def get_all_colors(self) -> List[Dict]:
        """获取所有颜色数据"""
        return self.colors_data
        
    def search_by_english_name(self, name: str) -> Optional[Dict]:
        """根据英文名查找颜色"""
        for color in self.colors_data:
            if name.lower() == color['english_name'].lower():
                return color
        return None
        
    def search_by_japanese_kanji(self, kanji: str) -> List[Dict]:
        """根据日文汉字查找颜色"""
        results = []
        for color in self.colors_data:
            if kanji in color['japanese_kanji']:
                results.append(color)
        return results
    
    def get_total_colors_count(self) -> int:
        """获取颜色总数"""
        return len(self.colors_data)

def generate_description(color: Dict) -> str:
    """为颜色生成详细描述"""
    color_name = color['english_name'].lower()
    
    # 颜色描述数据库
    color_descriptions = {
        "sakura": "樱花的颜色，淡粉色带有一丝温柔，象征着春天的美好、生命的短暂和纯洁的爱情。",
        "momo": "桃花的粉色，甜美而柔和，代表着女性美、温柔和幸福。",
        "ume": "梅花的颜色，淡雅的粉紫色，象征着坚韧、希望和早春的气息。",
        "nadeshiko": "抚子花的粉色，优雅而含蓄，代表着日本女性的传统美德和温柔。",
        "tsutsuji": "杜鹃花的鲜艳红色，热情而华丽，象征着春天的活力和美丽。",
        "murasaki": "传统的紫色，在日本文化中代表着高贵、优雅和神秘，曾是贵族的颜色。",
        "ruri": "琉璃的深蓝色，宝石般的光泽，象征着深邃、智慧和神秘。",
        "ao": "纯净的蓝色，像清澈的天空和海洋，代表着自由、冷静和广阔。",
        "midori": "自然的绿色，像新生的树叶，象征着生命力、成长和希望。",
        "kaki": "柿子的暖橘色，成熟而温暖，代表着秋天的丰收、温暖和满足。",
        "yamabuki": "山吹花的金黄色，明亮而温暖，象征着财富、希望和阳光。",
        "yuki": "雪白色，纯净无瑕，代表着纯洁、宁静和冬天的美。",
        "kuro": "深邃的黑色，庄重而神秘，象征着力量、优雅和夜晚。",
        "shiro": "纯洁的白色，简洁明亮，代表着纯洁、神圣和新的开始。",
        "beni": "传统的红色，鲜艳而热情，象征着生命力、热情和喜庆。",
        "kurenai": "深红色，像秋天的枫叶，热烈而深沉，代表着热情和成熟。",
        "aizome": "靛蓝染料的颜色，沉稳而优雅，代表着日本的传统染色工艺和文化。",
        "matcha": "抹茶的绿色，清新自然，代表着禅意、平静和日本茶道文化。",
        "byakuro": "白练的淡黄色，柔和温暖，代表着传统和服的优雅和精致。",
        "fuji": "藤花的淡紫色，优雅浪漫，象征着春天的美好和短暂的美丽。",
    }
    
    # 检查是否有特定描述
    for key in color_descriptions:
        if key in color_name:
            return color_descriptions[key]
    
    # 根据颜色家族生成通用描述
    hex_val = color['hex'].lower()
    
    # 红色系
    if 'red' in color_name or '#ff' in hex_val[:3] or '#dc' in hex_val[:3] or 'beni' in color_name or 'akane' in color_name:
        return "红色系的传统日本颜色，象征着热情、生命力和喜庆，常用于节日和庆典。"
    
    # 蓝色系
    elif 'blue' in color_name or '#00' in hex_val[:3] or '#41' in hex_val[:3] or 'ao' in color_name or 'ruri' in color_name:
        return "蓝色系的传统日本颜色，代表着冷静、智慧和深远，常用于表现天空和海洋。"
    
    # 绿色系
    elif 'green' in color_name or '#3c' in hex_val[:3] or '#66' in hex_val[:3] or 'midori' in color_name:
        return "绿色系的传统日本颜色，象征着自然、生长和生命力，与日本庭园和自然景观紧密相关。"
    
    # 紫色系
    elif 'purple' in color_name or '#8a' in hex_val[:3] or '#93' in hex_val[:3] or 'murasaki' in color_name:
        return "紫色系的传统日本颜色，代表着高贵、优雅和神秘，历史上是贵族和皇室的颜色。"
    
    # 黄色/橙色系
    elif 'yellow' in color_name or 'orange' in color_name or '#ff8' in hex_val[:4] or '#d2' in hex_val[:3] or 'yamabuki' in color_name:
        return "黄色/橙色系的传统日本颜色，温暖而明亮，象征着阳光、财富和活力。"
    
    # 棕色系
    elif 'brown' in color_name or '#8b' in hex_val[:3] or '#a0' in hex_val[:3] or 'chairo' in color_name or 'kaki' in color_name:
        return "棕色系的传统日本颜色，稳重而自然，代表着大地、传统和成熟。"
    
    # 粉色系
    elif 'pink' in color_name or '#f5' in hex_val[:3] or '#f9' in hex_val[:3]:
        return "粉色系的传统日本颜色，温柔而甜美，常用于表现花卉和女性美。"
    
    # 白色系
    elif 'white' in color_name or '#ff' in hex_val == '#ffffff' or '#f8' in hex_val[:3] or 'shiro' in color_name:
        return "白色系的传统日本颜色，纯净而简洁，象征着纯洁、神圣和新的开始。"
    
    # 黑色系
    elif 'black' in color_name or '#00' in hex_val == '#000000' or '#39' in hex_val[:3] or 'kuro' in color_name:
        return "黑色系的传统日本颜色，庄重而神秘，代表着力量、优雅和夜晚。"
    
    # 灰色系
    elif 'gray' in color_name or '#b7' in hex_val[:3] or '#69' in hex_val[:3] or 'hai' in color_name:
        return "灰色系的传统日本颜色，中性而沉稳，代表着平衡、传统和简约。"
    
    else:
        return f"传统的日本颜色 {color['english_name']}，具有独特的文化意义和美学价值。"

def format_color_result(color: Dict) -> str:
    """格式化颜色结果"""
    description = generate_description(color)
    return f"**{color['english_name']} ({color['japanese_kanji']})** / {color['hex']} {color['rgb']}\n   - **感觉**：{description}"

def search_colors(keyword: str) -> str:
    """根据关键词搜索颜色的主函数"""
    # 优先使用清理后的CSV文件
    cleaned_path = os.path.join(os.path.dirname(__file__), 'colors_cleaned.csv')
    if os.path.exists(cleaned_path):
        db_path = cleaned_path
    else:
        db_path = os.path.join(os.path.dirname(__file__), 'colors_full.csv')
    db = NipponColorDatabase(db_path)
    
    # 检查是否是特殊查询类型
    results = []
    special_queries = {
        "spring": db.search_by_season("spring"),
        "summer": db.search_by_season("summer"),
        "autumn": db.search_by_season("autumn"),
        "fall": db.search_by_season("autumn"),
        "winter": db.search_by_season("winter"),
        "red": db.search_by_color_family("red"),
        "blue": db.search_by_color_family("blue"),
        "green": db.search_by_color_family("green"),
        "purple": db.search_by_color_family("purple"),
        "yellow": db.search_by_color_family("yellow"),
        "brown": db.search_by_color_family("brown"),
        "pink": db.search_by_color_family("pink"),
        "white": db.search_by_color_family("white"),
        "black": db.search_by_color_family("black"),
        "gray": db.search_by_color_family("gray"),
        "warm": db.search_by_emotion("warm"),
        "cool": db.search_by_emotion("cool"),
        "calm": db.search_by_emotion("calm"),
        "energetic": db.search_by_emotion("energetic"),
        "elegant": db.search_by_emotion("elegant"),
        "natural": db.search_by_emotion("natural"),
    }
    
    keyword_lower = keyword.lower()
    if keyword_lower in special_queries:
        results = special_queries[keyword_lower]
    else:
        # 普通关键词搜索
        results = db.search_by_keyword(keyword)
    
    if not results:
        # 尝试模糊搜索
        all_colors = db.get_all_colors()
        for color in all_colors:
            if keyword_lower in color['english_name'].lower()[:3] or keyword_lower in color['japanese_hiragana'].lower()[:3]:
                results.append(color)
        
        if not results:
            return f"抱歉，没有找到与关键词 '{keyword}' 匹配的日本传统颜色。数据库包含{db.get_total_colors_count()}种颜色，您可以尝试其他关键词如：春、夏、秋、冬、红、蓝、绿等。"
    
    formatted_results = [format_color_result(color) for color in results[:8]]  # 最多返回8个结果
    
    response = f"根据您的查询 '{keyword}'，找到了以下日本传统色：\n"
    for i, result in enumerate(formatted_results, 1):
        response += f"{i}. {result}\n"
    
    if len(results) > 8:
        response += f"\n... 还有 {len(results) - 8} 个结果未显示。"
    
    response += f"\n*数据库包含 {db.get_total_colors_count()} 种日本传统颜色，数据参考自 Nipponcolors.com*"
    
    return response

if __name__ == "__main__":
    # 示例使用
    print("="*60)
    print("日本传统色数据库测试")
    print("="*60)
    
    print("\n1. 测试季节查询（春天）：")
    print(search_colors("spring"))
    
    print("\n" + "="*60)
    print("\n2. 测试颜色家族查询（蓝色）：")
    print(search_colors("blue"))
    
    print("\n" + "="*60)
    print("\n3. 测试情感查询（温暖）：")
    print(search_colors("warm"))
    
    print("\n" + "="*60)
    print("\n4. 测试具体颜色查询（樱花）：")
    print(search_colors("sakura"))
    
    print("\n" + "="*60)
    print("\n5. 测试日文查询（紫）：")
    print(search_colors("紫"))