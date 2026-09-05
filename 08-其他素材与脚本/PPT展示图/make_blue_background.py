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

def make_blue_ppt_background(width, height, out_name):
    img = Image.new('RGB', (width, height), BLUE_BG)
    d = ImageDraw.Draw(img)

    # 1. 顶部科技蓝渐变条
    top_h = int(height * 0.12)
    top_bar = Image.new('RGB', (width, top_h))
    tbd = ImageDraw.Draw(top_bar)
    for y in range(top_h):
        t = y / top_h
        tbd.line([(0, y), (width, y)], fill=(
            int(BLUE_LIGHT[0] * (1 - t) + BLUE_PRIMARY[0] * t),
            int(BLUE_LIGHT[1] * (1 - t) + BLUE_PRIMARY[1] * t),
            int(BLUE_LIGHT[2] * (1 - t) + BLUE_PRIMARY[2] * t)
        ))
    img.paste(top_bar, (0, 0))

    # 顶部装饰流线（细浅蓝线）
    d.line([(0, top_h), (width, top_h)], fill=(186, 230, 253), width=2)

    # 团队 logo
    logo_p = BASE / '团队logo.png'
    if logo_p.exists():
        logo = Image.open(logo_p).convert('RGBA')
        lw = int(top_h * 0.6)
        logo.thumbnail((lw, lw))
        img.paste(logo, (int(width * 0.03), int((top_h - lw) / 2)), logo)

    # 顶部文字
    text_x = int(width * 0.03) + lw + 15
    d.text((text_x, int(top_h * 0.3)), '童健韶华志愿服务队', font=bold(int(top_h * 0.28)), fill='white')
    d.text((text_x, int(top_h * 0.65)), '聚微光 · 筑童心 · 为童健韶华 · 青春赋能行动', font=reg(int(top_h * 0.18)), fill=(224, 242, 254))

    # 2. 中间大面积留白内容区（蓝调微边框卡片）
    margin_x = int(width * 0.03)
    content_y = top_h + int(height * 0.025)
    content_w = width - margin_x * 2
    content_h = height - content_y - int(height * 0.06)

    # 微阴影与纯白卡片
    d.rounded_rectangle([margin_x + 4, content_y + 4, margin_x + content_w + 4, content_y + content_h + 4], 
                        radius=20, fill=(220, 230, 242))
    d.rounded_rectangle([margin_x, content_y, margin_x + content_w, content_y + content_h], 
                        radius=20, fill=CARD_BG, outline=(224, 234, 246), width=1)

    # 3. 底部页脚
    foot_y = height - int(height * 0.04)
    d.text((margin_x + 15, foot_y), '© 2026 童健韶华志愿服务队 · 数字化健康与志愿公益实践', font=reg(int(height * 0.016)), fill=TEXT_MUTED)
    d.text((width - margin_x - 15, foot_y), '以动代屏 · 资润启梦 · 麦香传韵', font=reg(int(height * 0.016)), fill=TEXT_MUTED, anchor='rt')

    out_p = PPT_DIR / out_name
    img.save(out_p, quality=95)
    print(f'Saved: {out_p}')

if __name__ == '__main__':
    # 生成 16:9 与 4:3 两个蓝白系列 PPT 正文模板
    make_blue_ppt_background(1920, 1080, '童健韶华_蓝白PPT正文背景_16x9.png')
    make_blue_ppt_background(1920, 1440, '童健韶华_蓝白PPT正文背景_4x3.png')
    print('ALL BLUE BACKGROUNDS GENERATED!')
