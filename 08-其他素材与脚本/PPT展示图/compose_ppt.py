from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

ROOT = Path(r'C:\Users\Yanzongning\Desktop\童健韶华资料库')
OUT = ROOT / 'PPT展示图'
FD = Path(r'C:\Windows\Fonts')

W, H = 1920, 1080
TEAL = (32, 140, 120)        # #208c78
TEAL_L = (32, 180, 154)      # #20b49a
DARK = (18, 40, 36)
TEXT = (33, 43, 54)
TEXT2 = (92, 102, 112)
BG = (242, 247, 245)

bold = lambda s: ImageFont.truetype(str(FD / 'msyhbd.ttc'), s)
reg = lambda s: ImageFont.truetype(str(FD / 'msyh.ttc'), s)

img = Image.new('RGB', (W, H), BG)
d = ImageDraw.Draw(img)

# 顶部品牌色带
def draw_header():
    hdr = Image.new('RGB', (W, 210))
    hd = ImageDraw.Draw(hdr)
    for y in range(210):
        t = y / 210
        hd.line([(0, y), (W, y)], fill=(
            int(TEAL_L[0] * (1 - t) + TEAL[0] * t),
            int(TEAL_L[1] * (1 - t) + TEAL[1] * t),
            int(TEAL_L[2] * (1 - t) + TEAL[2] * t)
        ))
    img.paste(hdr, (0, 0))

    # 团队 logo
    logo = Image.open(ROOT / '团队logo.png').convert('RGBA')
    logo.thumbnail((90, 90))
    img.paste(logo, (60, 60), logo)

    d.text((170, 90), '童健韶华志愿服务队', font=bold(32), fill='white')
    d.text((170, 132), 'AI 健康应用矩阵', font=reg(22), fill=(220, 245, 240))

    d.text((W // 2, 75), '童健韶华 · AI 健康应用', font=bold(58), fill='white', anchor='mm')
    d.text((W // 2, 150), 'AI 体质检测助手  +  AI 健身教练', font=reg(30),
           fill=(220, 245, 240), anchor='mm')

draw_header()


def phone_mockup(cx, cy, screenshot_path, app_name, tagline, accent):
    fw, fh = 420, 700

    # 阴影
    d.rounded_rectangle([cx - fw // 2 + 8, cy + 8, cx + fw // 2 + 8, cy + fh + 8],
                        radius=40, fill=(30, 45, 40))
    # 机身
    d.rounded_rectangle([cx - fw // 2, cy, cx + fw // 2, cy + fh],
                        radius=40, fill=(255, 255, 255),
                        outline=(210, 220, 215), width=5)

    # 截图缩放后居中贴入
    shot = Image.open(screenshot_path).convert('RGB')
    sw, sh = shot.size
    target_w = fw - 28
    target_h = fh - 28
    scale = min(target_w / sw, target_h / sh)
    shot = shot.resize((int(sw * scale), int(sh * scale)), Image.Resampling.LANCZOS)
    paste_x = cx - shot.width // 2
    paste_y = cy + (fh - shot.height) // 2
    img.paste(shot, (paste_x, paste_y))

    # 刘海
    d.rounded_rectangle([cx - 45, cy + 14, cx + 45, cy + 26], radius=6, fill=(40, 40, 40))

    # 应用名称标签
    ly = cy + fh + 28
    d.rounded_rectangle([cx - 200, ly, cx + 200, ly + 56], radius=14, fill=accent)
    d.text((cx, ly + 28), app_name, font=bold(30), fill='white', anchor='mm')

    # 一句话说明
    ly += 62
    d.text((cx, ly), tagline, font=reg(22), fill=TEXT2, anchor='mm')


# 左侧：AI 体质检测助手
phone_mockup(
    540, 240,
    OUT / 'shots' / 'assess.png',
    'AI 体质检测助手',
    '输入身体数据，AI 生成体质评估 + 11 天启动计划',
    TEAL
)

# 右侧：AI 健身教练
phone_mockup(
    1380, 240,
    OUT / 'shots' / 'fitness_coach.png',
    'AI 健身教练',
    '记录训练与身体数据，AI 教练给出分析与营养指导',
    TEAL_L
)

# 底部流程
d.text((W // 2, 1060), '输入数据  →  AI 分析  →  健康评估 / 训练建议',
       font=reg(24), fill=TEXT2, anchor='mm')
d.text((W // 2, 1085), '志愿服务 · 公益科普 · 智能健康',
       font=reg(18), fill=(120, 130, 125), anchor='mm')

out_path = OUT / '应用展示_16x9.png'
img.save(out_path)
print('saved', out_path)
