import os
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

BASE = Path(r'C:\Users\Yanzongning\Desktop\童健韶华资料库')
PPT_DIR = BASE / 'PPT展示图'
FD = Path(r'C:\Windows\Fonts')

bold = lambda s: ImageFont.truetype(str(FD / 'msyhbd.ttc'), s)
reg = lambda s: ImageFont.truetype(str(FD / 'msyh.ttc'), s)

# 蓝白色系
BLUE_PRIMARY = (14, 116, 214)     # #0e74d6 科技蓝
BLUE_LIGHT = (56, 189, 248)       # #38bdf8 天空蓝
BLUE_BG = (243, 247, 252)         # 极浅科技冷白底色
CARD_BG = (255, 255, 255)
TEXT_MUTED = (140, 155, 170)

# 4:3 比例
W, H = 1920, 1440

def make_circle_logo(logo_path, size):
    """将logo裁剪为精致圆形白底徽章"""
    im = Image.open(logo_path).convert('RGBA').resize((size, size), Image.Resampling.LANCZOS)
    mask = Image.new('L', (size, size), 0)
    md = ImageDraw.Draw(mask)
    md.ellipse([0, 0, size, size], fill=255)
    
    # 创建带圆白底和外圈描边的圆形logo
    out = Image.new('RGBA', (size, size), (255, 255, 255, 0))
    od = ImageDraw.Draw(out)
    od.ellipse([0, 0, size, size], fill=(255, 255, 255, 255))
    out.paste(im, (0, 0), mask)
    
    # 描边
    od.ellipse([1, 1, size-2, size-2], outline=(255, 255, 255, 220), width=3)
    return out

def generate_4x3_content_bg(out_name):
    img = Image.new('RGB', (W, H), BLUE_BG)
    d = ImageDraw.Draw(img)

    # 1. 顶部科技蓝渐变 Header 条
    top_h = 160
    top_bar = Image.new('RGB', (W, top_h))
    tbd = ImageDraw.Draw(top_bar)
    for y in range(top_h):
        t = y / top_h
        tbd.line([(0, y), (W, y)], fill=(
            int(BLUE_LIGHT[0] * (1 - t) + BLUE_PRIMARY[0] * t),
            int(BLUE_LIGHT[1] * (1 - t) + BLUE_PRIMARY[1] * t),
            int(BLUE_LIGHT[2] * (1 - t) + BLUE_PRIMARY[2] * t)
        ))
    img.paste(top_bar, (0, 0))

    # 顶部装饰流线（细浅蓝线）
    d.line([(0, top_h), (W, top_h)], fill=(186, 230, 253), width=2)

    # 圆形 Logo 处理
    logo_p = BASE / '团队logo.png'
    if logo_p.exists():
        logo_size = 96
        circle_logo = make_circle_logo(logo_p, logo_size)
        logo_x = 55
        logo_y = (top_h - logo_size) // 2
        
        # Logo 阴影
        d.ellipse([logo_x + 3, logo_y + 3, logo_x + logo_size + 3, logo_y + logo_size + 3], fill=(8, 70, 130))
        img.paste(circle_logo, (logo_x, logo_y), circle_logo)

    # 顶部文字：团队名称与项目定位
    text_x = 175
    d.text((text_x, 52), '童健韶华志愿服务队', font=bold(28), fill='white')
    d.text((text_x, 96), '以动代屏 · 青少年体质提升与健康赋能行动', font=reg(20), fill=(224, 242, 254))

    # 2. 中间大面积留白内容区（蓝调微边框白底大卡片）
    margin_x = 50
    content_y = top_h + 35
    content_w = W - margin_x * 2
    content_h = H - content_y - 80

    # 卡片外微阴影与纯白卡片
    d.rounded_rectangle([margin_x + 5, content_y + 5, margin_x + content_w + 5, content_y + content_h + 5], 
                        radius=24, fill=(220, 230, 242))
    d.rounded_rectangle([margin_x, content_y, margin_x + content_w, content_y + content_h], 
                        radius=24, fill=CARD_BG, outline=(224, 234, 246), width=1)

    # 3. 底部页脚：彻底删除资润启梦和麦香传韵，只保留童健韶华健康志愿服务相关
    foot_y = H - 50
    d.text((margin_x + 20, foot_y), '© 2026 童健韶华志愿服务队 · 数字化健康与志愿公益行动', font=reg(18), fill=TEXT_MUTED)
    d.text((W - margin_x - 20, foot_y), '以动代屏 · 青春赋能 · 智能健康', font=reg(18), fill=TEXT_MUTED, anchor='rt')

    out_p = PPT_DIR / out_name
    img.save(out_p, quality=95)
    print(f'Saved: {out_p}')

if __name__ == '__main__':
    generate_4x3_content_bg('童健韶华_蓝白4x3_正文背景.png')
