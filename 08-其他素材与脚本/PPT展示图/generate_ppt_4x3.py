import os
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

BASE = Path(r'C:\Users\Yanzongning\Desktop\童健韶华资料库')
PPT_DIR = BASE / 'PPT展示图'
FD = Path(r'C:\Windows\Fonts')

bold = lambda s: ImageFont.truetype(str(FD / 'msyhbd.ttc'), s)
reg = lambda s: ImageFont.truetype(str(FD / 'msyh.ttc'), s)

# 配色系统
TEAL_PRIMARY = (15, 118, 110)      # #0f766e
TEAL_LIGHT = (20, 184, 166)        # #14b8a6
TEAL_DARK = (13, 78, 74)
BG = (241, 245, 244)               # 浅绿灰底色
CARD_BG = (255, 255, 255)
TEXT_MAIN = (31, 41, 55)
TEXT_MUTED = (107, 114, 128)

# 4:3 画布尺寸: 1920 x 1440
W, H = 1920, 1440

def draw_header_bar(img, d, title, subtitle):
    hdr_h = 150
    hdr = Image.new('RGB', (W, hdr_h))
    hd = ImageDraw.Draw(hdr)
    for y in range(hdr_h):
        t = y / hdr_h
        hd.line([(0, y), (W, y)], fill=(
            int(TEAL_LIGHT[0] * (1 - t) + TEAL_PRIMARY[0] * t),
            int(TEAL_LIGHT[1] * (1 - t) + TEAL_PRIMARY[1] * t),
            int(TEAL_LIGHT[2] * (1 - t) + TEAL_PRIMARY[2] * t)
        ))
    img.paste(hdr, (0, 0))

    # 团队 logo
    logo_p = BASE / '团队logo.png'
    if logo_p.exists():
        logo = Image.open(logo_p).convert('RGBA')
        logo.thumbnail((75, 75))
        img.paste(logo, (50, 38), logo)

    d.text((140, 48), '童健韶华志愿服务队', font=bold(26), fill='white')
    d.text((140, 90), 'AI 赋能青少年体质健康 · 数字化双应用矩阵', font=reg(18), fill=(220, 245, 240))

    d.text((W // 2, 55), title, font=bold(46), fill='white', anchor='mm')
    d.text((W // 2, 108), subtitle, font=reg(22), fill=(220, 245, 240), anchor='mm')

def phone_mockup(img, d, cx, cy, fw, fh, shot_path, label_text=None):
    # 阴影
    d.rounded_rectangle([cx - fw // 2 + 6, cy + 6, cx + fw // 2 + 6, cy + fh + 6],
                        radius=32, fill=(215, 225, 222))
    # 机身外框
    d.rounded_rectangle([cx - fw // 2, cy, cx + fw // 2, cy + fh],
                        radius=32, fill=CARD_BG, outline=(200, 215, 210), width=4)

    # 贴截图
    shot = Image.open(shot_path).convert('RGB')
    sw, sh = shot.size
    target_w = fw - 20
    target_h = fh - 20
    scale = min(target_w / sw, target_h / sh)
    shot_resized = shot.resize((int(sw * scale), int(sh * scale)), Image.Resampling.LANCZOS)
    paste_x = cx - shot_resized.width // 2
    paste_y = cy + (fh - shot_resized.height) // 2
    img.paste(shot_resized, (paste_x, paste_y))

    # 顶部听筒/灵动岛装饰
    d.rounded_rectangle([cx - 35, cy + 10, cx + 35, cy + 20], radius=5, fill=(45, 55, 50))

    # 底部标签
    if label_text:
        tag_y = cy + fh + 16
        d.rounded_rectangle([cx - 110, tag_y, cx + 110, tag_y + 38], radius=10, fill=TEAL_PRIMARY)
        d.text((cx, tag_y + 19), label_text, font=bold(18), fill='white', anchor='mm')


def generate_combined_ppt_4x3_large_shots():
    img = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(img)

    # 1. 顶部 Header
    draw_header_bar(img, d, 
                    '童健韶华 · AI 智能健康双应用', 
                    'AI 体质检测助手（科学评估）  +  AI 健身教练（日常追踪） · 双轮驱动数字化方案')

    card_w, card_h = 890, 1240
    card_y = 175

    qr_api = Image.open(PPT_DIR / 'qr_api_key.png').convert('RGB')

    # =========================================================================
    # 左侧模块：AI 体质检测助手
    # =========================================================================
    lx = 50
    d.rounded_rectangle([lx + 6, card_y + 6, lx + card_w + 6, card_y + card_h + 6], radius=24, fill=(220, 230, 226))
    d.rounded_rectangle([lx, card_y, lx + card_w, card_y + card_h], radius=24, fill=CARD_BG)

    # 标题与徽章
    d.rounded_rectangle([lx + 32, card_y + 24, lx + 170, card_y + 64], radius=10, fill=TEAL_PRIMARY)
    d.text((lx + 101, card_y + 44), '应用一 · 评估', font=bold(18), fill='white', anchor='mm')
    d.text((lx + 185, card_y + 44), 'AI 体质检测助手', font=bold(30), fill=TEXT_MAIN, anchor='lm')

    # 一句话定位
    d.rounded_rectangle([lx + 32, card_y + 76, lx + card_w - 32, card_y + 130], radius=12, fill=(236, 253, 245), outline=(167, 243, 208), width=1)
    d.text((lx + 48, card_y + 103), '💡 填写身体数据，AI 深度计算体质指标并定制 11 天运动计划', font=bold(18), fill=TEAL_PRIMARY, anchor='lm')

    # 上半部：左边双二维码（185x260），右边特色功能点
    qr_y = card_y + 145
    qw, qh = 180, 260
    
    # 网站码
    d.rounded_rectangle([lx + 32, qr_y, lx + 32 + qw, qr_y + qh], radius=14, fill=(248, 250, 252), outline=(226, 232, 240), width=1)
    qr1 = Image.open(PPT_DIR / 'qr_assess.png').convert('RGB').resize((140, 140), Image.Resampling.LANCZOS)
    img.paste(qr1, (lx + 32 + (qw - 140) // 2, qr_y + 16))
    d.text((lx + 32 + qw // 2, qr_y + 180), '① 网站二维码', font=bold(18), fill=TEAL_PRIMARY, anchor='mm')
    d.text((lx + 32 + qw // 2, qr_y + 212), '手机扫码直达', font=reg(14), fill=TEXT_MUTED, anchor='mm')
    d.text((lx + 32 + qw // 2, qr_y + 236), '支持添加至桌面', font=reg(13), fill=(140, 150, 160), anchor='mm')

    # API码
    d.rounded_rectangle([lx + 226, qr_y, lx + 226 + qw, qr_y + qh], radius=14, fill=(248, 250, 252), outline=(226, 232, 240), width=1)
    qr_api_scaled = qr_api.resize((140, 140), Image.Resampling.LANCZOS)
    img.paste(qr_api_scaled, (lx + 226 + (qw - 140) // 2, qr_y + 16))
    d.text((lx + 226 + qw // 2, qr_y + 180), '② API密钥码', font=bold(18), fill=TEAL_PRIMARY, anchor='mm')
    d.text((lx + 226 + qw // 2, qr_y + 212), '设置页扫码导入', font=reg(14), fill=TEXT_MUTED, anchor='mm')
    d.text((lx + 226 + qw // 2, qr_y + 236), '一键激活AI调用', font=reg(13), fill=(140, 150, 160), anchor='mm')

    # 右侧：4 项核心亮点列表 (x: 430 ~ 858)
    feat_x = lx + 430
    feat_y = qr_y + 5
    d.text((feat_x, feat_y), '✨ 核心功能亮点', font=bold(20), fill=TEXT_MAIN)
    feat_y += 35
    feats_1 = [
        ('多维指标填报', '性别/年龄/身高/体重/腰臀围全覆盖'),
        ('AI 体质定级', '秒级计算 BMI、常量指标与评级'),
        ('识别运动禁忌', '深度识别伤病史，标注高危动作'),
        ('11天运动方案', '量身定制科学渐进式启动计划')
    ]
    for title, desc in feats_1:
        d.rounded_rectangle([feat_x, feat_y, lx + card_w - 32, feat_y + 50], radius=8, fill=(248, 250, 252), outline=(226, 232, 240), width=1)
        d.ellipse([feat_x + 12, feat_y + 16, feat_x + 28, feat_y + 32], fill=TEAL_PRIMARY)
        d.text((feat_x + 20, feat_y + 24), '✓', font=bold(13), fill='white', anchor='mm')
        d.text((feat_x + 36, feat_y + 14), title, font=bold(16), fill=TEXT_MAIN)
        d.text((feat_x + 36, feat_y + 32), desc, font=reg(12), fill=TEXT_MUTED)
        feat_y += 56

    # 中部：三步使用流程横条
    step_y = qr_y + qh + 20
    d.text((lx + 32, step_y), '📌 三步极速上手流程', font=bold(20), fill=TEXT_MAIN)
    step_y += 32
    steps_1 = [
        ('1. 扫码打开', '扫①码手机直达\n可添加到主屏幕'),
        ('2. 导入密钥', '在设置页点扫码填入\n扫②码自动激活'),
        ('3. 生成报告', '录入指标一键分析\n获取11天定制方案')
    ]
    sw = (card_w - 64 - 24) // 3
    for i, (st, sd) in enumerate(steps_1):
        sx = lx + 32 + i * (sw + 12)
        d.rounded_rectangle([sx, step_y, sx + sw, step_y + 80], radius=10, fill=(248, 250, 252), outline=(226, 232, 240), width=1)
        d.ellipse([sx + 18, step_y + 16, sx + 44, step_y + 42], fill=TEAL_PRIMARY)
        d.text((sx + 31, step_y + 29), str(i + 1), font=bold(16), fill='white', anchor='mm')
        d.text((sx + 52, step_y + 29), st, font=bold(16), fill=TEXT_MAIN, anchor='lm')
        d.text((sx + 18, step_y + 54), sd.replace('\n', ' · '), font=reg(13), fill=TEXT_MUTED)

    # 下半部：【超大真实双手机展示】(占据下半部核心空间，垂直铺满至底部)
    # 尺寸：pw=380, ph=500
    pw, ph = 380, 500
    phone_y = step_y + 105
    phone_mockup(img, d, lx + 230, phone_y, pw, ph, 
                 PPT_DIR / 'AI成长助手截图' / '屏幕截图 2026-08-28 201653.png', 
                 '① 身体数据填报')
    phone_mockup(img, d, lx + 660, phone_y, pw, ph, 
                 PPT_DIR / 'AI成长助手截图' / '屏幕截图 2026-08-28 201703.png', 
                 '② AI评估与计划')

    # 左侧底部安全说明
    d.text((lx + card_w // 2, card_y + card_h - 18), '🔒 数据本地存储 · 密钥安全隔离 · 志愿公益科普 · 扫码即用', font=reg(14), fill=TEXT_MUTED, anchor='mm')


    # =========================================================================
    # 右侧模块：AI 健身教练
    # =========================================================================
    rx = 980
    d.rounded_rectangle([rx + 6, card_y + 6, rx + card_w + 6, card_y + card_h + 6], radius=24, fill=(220, 230, 226))
    d.rounded_rectangle([rx, card_y, rx + card_w, card_y + card_h], radius=24, fill=CARD_BG)

    # 标题与徽章
    d.rounded_rectangle([rx + 32, card_y + 24, rx + 170, card_y + 64], radius=10, fill=TEAL_PRIMARY)
    d.text((rx + 101, card_y + 44), '应用二 · 追踪', font=bold(18), fill='white', anchor='mm')
    d.text((rx + 185, card_y + 44), 'AI 健身教练 (健身助手)', font=bold(30), fill=TEXT_MAIN, anchor='lm')

    # 一句话定位
    d.rounded_rectangle([rx + 32, card_y + 76, rx + card_w - 32, card_y + 130], radius=12, fill=(236, 253, 245), outline=(167, 243, 208), width=1)
    d.text((rx + 48, card_y + 103), '💡 每日运动打卡、身体围度图表追踪与全天候 AI 私教指导', font=bold(18), fill=TEAL_PRIMARY, anchor='lm')

    # 双二维码
    d.rounded_rectangle([rx + 32, qr_y, rx + 32 + qw, qr_y + qh], radius=14, fill=(248, 250, 252), outline=(226, 232, 240), width=1)
    qr2 = Image.open(PPT_DIR / 'qr_fitness.png').convert('RGB').resize((140, 140), Image.Resampling.LANCZOS)
    img.paste(qr2, (rx + 32 + (qw - 140) // 2, qr_y + 16))
    d.text((rx + 32 + qw // 2, qr_y + 180), '① 网站二维码', font=bold(18), fill=TEAL_PRIMARY, anchor='mm')
    d.text((rx + 32 + qw // 2, qr_y + 212), '手机扫码直达', font=reg(14), fill=TEXT_MUTED, anchor='mm')
    d.text((rx + 32 + qw // 2, qr_y + 236), '支持添加至桌面', font=reg(13), fill=(140, 150, 160), anchor='mm')

    # API码
    d.rounded_rectangle([rx + 226, qr_y, rx + 226 + qw, qr_y + qh], radius=14, fill=(248, 250, 252), outline=(226, 232, 240), width=1)
    img.paste(qr_api_scaled, (rx + 226 + (qw - 140) // 2, qr_y + 16))
    d.text((rx + 226 + qw // 2, qr_y + 180), '② API密钥码', font=bold(18), fill=TEAL_PRIMARY, anchor='mm')
    d.text((rx + 226 + qw // 2, qr_y + 212), '设置页扫码导入', font=reg(14), fill=TEXT_MUTED, anchor='mm')
    d.text((rx + 226 + qw // 2, qr_y + 236), '一键激活AI私教', font=reg(13), fill=(140, 150, 160), anchor='mm')

    # 右侧：4 项核心亮点列表 (x: 430 ~ 858)
    feat_rx = rx + 430
    feat_ry = qr_y + 5
    d.text((feat_rx, feat_ry), '✨ 核心功能亮点', font=bold(20), fill=TEXT_MAIN)
    feat_ry += 35
    feats_2 = [
        ('结构化动作打卡', '胸/背/腿部位自选与热量预估'),
        ('身体长周期追踪', '体重/体脂率/围度趋势曲线图'),
        ('运动量统计激励', '周/月训练频次与持续打卡记录'),
        ('AI 私教深度点评', '根据数据生成调整建议与饮食指导')
    ]
    for title, desc in feats_2:
        d.rounded_rectangle([feat_rx, feat_ry, rx + card_w - 32, feat_ry + 50], radius=8, fill=(248, 250, 252), outline=(226, 232, 240), width=1)
        d.ellipse([feat_rx + 12, feat_ry + 16, feat_rx + 28, feat_ry + 32], fill=TEAL_PRIMARY)
        d.text((feat_rx + 20, feat_ry + 24), '✓', font=bold(13), fill='white', anchor='mm')
        d.text((feat_rx + 36, feat_ry + 14), title, font=bold(16), fill=TEXT_MAIN)
        d.text((feat_rx + 36, feat_ry + 32), desc, font=reg(12), fill=TEXT_MUTED)
        feat_ry += 56

    # 中部：三步使用流程横条
    d.text((rx + 32, step_y), '📌 三步极速上手流程', font=bold(20), fill=TEXT_MAIN)
    steps_2 = [
        ('1. 扫码打开', '扫①码手机直达\n可添加到主屏幕'),
        ('2. 导入密钥', '在设置页点扫码填入\n扫②码自动激活'),
        ('3. 记录与指导', '每日打卡训练数据\n随时召唤AI私教点评')
    ]
    for i, (st, sd) in enumerate(steps_2):
        sx = rx + 32 + i * (sw + 12)
        d.rounded_rectangle([sx, step_y + 32, sx + sw, step_y + 112], radius=10, fill=(248, 250, 252), outline=(226, 232, 240), width=1)
        d.ellipse([sx + 18, step_y + 48, sx + 44, step_y + 74], fill=TEAL_PRIMARY)
        d.text((sx + 31, step_y + 61), str(i + 1), font=bold(16), fill='white', anchor='mm')
        d.text((sx + 52, step_y + 61), st, font=bold(16), fill=TEXT_MAIN, anchor='lm')
        d.text((sx + 18, step_y + 86), sd.replace('\n', ' · '), font=reg(13), fill=TEXT_MUTED)

    # 下半部：【超大真实双手机展示】(占据下半部核心空间，垂直铺满至底部)
    phone_mockup(img, d, rx + 230, phone_y, pw, ph, 
                 PPT_DIR / 'AI教练截图' / '屏幕截图 2026-08-28 201218.png', 
                 '① 训练打卡记录')
    phone_mockup(img, d, rx + 660, phone_y, pw, ph, 
                 PPT_DIR / 'AI教练截图' / '屏幕截图 2026-08-28 201412.png', 
                 '② AI私教深度点评')

    # 右侧底部安全说明
    d.text((rx + card_w // 2, card_y + card_h - 18), '🔒 数据本地存储 · 密钥安全隔离 · 志愿公益科普 · 扫码即用', font=reg(14), fill=TEXT_MUTED, anchor='mm')

    # 底部居中安全声明
    d.text((W // 2, 1424), '🔒 本地 IndexedDB 离线存储 · 密钥客户端加密传输 · 志愿服务公益作品 · 扫码即用', font=reg(15), fill=TEXT_MUTED, anchor='mm')

    out_p = PPT_DIR / 'PPT展示_双应用合一_4x3.png'
    img.save(out_p, quality=95)
    print(f'Saved: {out_p}')

if __name__ == '__main__':
    generate_combined_ppt_4x3_large_shots()
