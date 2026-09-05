import os
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

BASE = Path(r'C:\Users\Yanzongning\Desktop\童健韶华资料库')
PPT_DIR = BASE / 'PPT展示图'
FD = Path(r'C:\Windows\Fonts')

bold = lambda s: ImageFont.truetype(str(FD / 'msyhbd.ttc'), s)
reg = lambda s: ImageFont.truetype(str(FD / 'msyh.ttc'), s)

# 团队品牌色
TEAL_PRIMARY = (15, 118, 110)      # #0f766e
TEAL_LIGHT = (20, 184, 166)        # #14b8a6
TEAL_BG = (244, 248, 246)          # 极浅薄荷绿灰
CARD_BG = (255, 255, 255)
TEXT_MUTED = (140, 150, 155)

def make_ppt_background(width, height, out_name):
    img = Image.new('RGB', (width, height), TEAL_BG)
    d = ImageDraw.Draw(img)

    # 1. 顶部微光渐变条
    top_h = int(height * 0.12)
    top_bar = Image.new('RGB', (width, top_h))
    tbd = ImageDraw.Draw(top_bar)
    for y in range(top_h):
        t = y / top_h
        tbd.line([(0, y), (width, y)], fill=(
            int(TEAL_LIGHT[0] * (1 - t) + TEAL_PRIMARY[0] * t),
            int(TEAL_LIGHT[1] * (1 - t) + TEAL_PRIMARY[1] * t),
            int(TEAL_LIGHT[2] * (1 - t) + TEAL_PRIMARY[2] * t)
        ))
    img.paste(top_bar, (0, 0))

    # 顶部装饰流线（细线）
    d.line([(0, top_h), (width, top_h)], fill=(167, 243, 208), width=2)

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
    d.text((text_x, int(top_h * 0.65)), '聚微光 · 筑童心 · 为童健韶华 · 青春赋能行动', font=reg(int(top_h * 0.18)), fill=(220, 245, 240))

    # 2. 中间大面积留白内容区（卡片式微底衬）
    margin_x = int(width * 0.03)
    content_y = top_h + int(height * 0.025)
    content_w = width - margin_x * 2
    content_h = height - content_y - int(height * 0.06)

    # 微阴影与白底卡片
    d.rounded_rectangle([margin_x + 4, content_y + 4, margin_x + content_w + 4, content_y + content_h + 4], 
                        radius=20, fill=(225, 233, 230))
    d.rounded_rectangle([margin_x, content_y, margin_x + content_w, content_y + content_h], 
                        radius=20, fill=CARD_BG, outline=(226, 235, 232), width=1)

    # 3. 底部页脚
    foot_y = height - int(height * 0.04)
    d.text((margin_x + 15, foot_y), '© 2026 童健韶华志愿服务队 · 数字化健康与志愿公益实践', font=reg(int(height * 0.016)), fill=TEXT_MUTED)
    d.text((width - margin_x - 15, foot_y), '以动代屏 · 资润启梦 · 麦香传韵', font=reg(int(height * 0.016)), fill=TEXT_MUTED, anchor='rt')

    out_p = PPT_DIR / out_name
    img.save(out_p, quality=95)
    print(f'Saved: {out_p}')

if __name__ == '__main__':
    # 生成 16:9 与 4:3 两个通用 PPT 正文背景模板
    make_ppt_background(1920, 1080, '童健韶华_PPT正文背景_16x9.png')
    make_ppt_background(1920, 1440, '童健韶华_PPT正文背景_4x3.png')
    print('ALL BACKGROUNDS GENERATED!')
