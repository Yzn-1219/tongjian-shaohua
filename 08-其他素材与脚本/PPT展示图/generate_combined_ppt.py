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

def draw_header_bar(img, d, W, title, subtitle):
    hdr_h = 140
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
        logo.thumbnail((70, 70))
        img.paste(logo, (45, 35), logo)

    d.text((130, 44), '童健韶华志愿服务队', font=bold(24), fill='white')
    d.text((130, 80), 'AI 赋能青少年体质健康 · 数字化双应用矩阵', font=reg(16), fill=(220, 245, 240))

    d.text((W // 2, 52), title, font=bold(42), fill='white', anchor='mm')
    d.text((W // 2, 98), subtitle, font=reg(20), fill=(220, 245, 240), anchor='mm')

def mini_phone_mockup(img, d, cx, cy, fw, fh, shot_path, label_text=None):
    # 阴影
    d.rounded_rectangle([cx - fw // 2 + 5, cy + 5, cx + fw // 2 + 5, cy + fh + 5],
                        radius=24, fill=(215, 225, 222))
    # 机身外框
    d.rounded_rectangle([cx - fw // 2, cy, cx + fw // 2, cy + fh],
                        radius=24, fill=CARD_BG, outline=(200, 215, 210), width=3)

    # 贴截图
    shot = Image.open(shot_path).convert('RGB')
    sw, sh = shot.size
    target_w = fw - 16
    target_h = fh - 16
    scale = min(target_w / sw, target_h / sh)
    shot_resized = shot.resize((int(sw * scale), int(sh * scale)), Image.Resampling.LANCZOS)
    paste_x = cx - shot_resized.width // 2
    paste_y = cy + (fh - shot_resized.height) // 2
    img.paste(shot_resized, (paste_x, paste_y))

    # 顶部装饰
    d.rounded_rectangle([cx - 25, cy + 8, cx + 25, cy + 16], radius=4, fill=(50, 60, 55))

    # 底部小标签
    if label_text:
        tag_y = cy + fh + 10
        d.rounded_rectangle([cx - 75, tag_y, cx + 75, tag_y + 28], radius=8, fill=TEAL_PRIMARY)
        d.text((cx, tag_y + 14), label_text, font=bold(14), fill='white', anchor='mm')


def generate_combined_ppt():
    W, H = 1920, 1080
    img = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(img)

    # 1. 顶部 Header
    draw_header_bar(img, d, W, 
                    '童健韶华 · AI 智能健康双应用', 
                    'AI 体质检测助手（科学评估）  +  AI 健身教练（日常追踪） · 双轮驱动数字化方案')

    card_w, card_h = 890, 890
    card_y = 165

    # =========================================================================
    # 左侧模块：AI 体质检测助手
    # =========================================================================
    lx = 50
    # 卡片底板
    d.rounded_rectangle([lx + 6, card_y + 6, lx + card_w + 6, card_y + card_h + 6], radius=24, fill=(220, 230, 226))
    d.rounded_rectangle([lx, card_y, lx + card_w, card_y + card_h], radius=24, fill=CARD_BG)

    # 标题与徽章
    d.rounded_rectangle([lx + 30, card_y + 25, lx + 160, card_y + 60], radius=10, fill=TEAL_PRIMARY)
    d.text((lx + 95, card_y + 42), '应用一 · 评估', font=bold(17), fill='white', anchor='mm')
    d.text((lx + 175, card_y + 42), 'AI 体质检测助手', font=bold(28), fill=TEXT_MAIN, anchor='lm')

    # 一句话定位
    d.rounded_rectangle([lx + 30, card_y + 75, lx + card_w - 30, card_y + 125], radius=10, fill=(236, 253, 245), outline=(167, 243, 208), width=1)
    d.text((lx + 45, card_y + 100), '💡 填写身体数据，AI 深度计算体质指标并定制 11 天渐进式运动启动方案', font=bold(16), fill=TEAL_PRIMARY, anchor='lm')

    # 左侧前半部（x: 30 ~ 380）：双二维码与核心亮点
    # 双二维码并排
    qr_y = card_y + 145
    qw, qh = 165, 235
    
    # 网站码
    d.rounded_rectangle([lx + 30, qr_y, lx + 30 + qw, qr_y + qh], radius=12, fill=(248, 250, 252), outline=(226, 232, 240), width=1)
    qr1 = Image.open(PPT_DIR / 'qr_assess.png').convert('RGB').resize((125, 125), Image.Resampling.LANCZOS)
    img.paste(qr1, (lx + 50, qr_y + 15))
    d.text((lx + 30 + qw // 2, qr_y + 160), '① 网站二维码', font=bold(16), fill=TEAL_PRIMARY, anchor='mm')
    d.text((lx + 30 + qw // 2, qr_y + 188), '手机扫码直达', font=reg(13), fill=TEXT_MUTED, anchor='mm')
    d.text((lx + 30 + qw // 2, qr_y + 210), '支持添加至桌面', font=reg(12), fill=(140, 150, 160), anchor='mm')

    # API码
    d.rounded_rectangle([lx + 210, qr_y, lx + 210 + qw, qr_y + qh], radius=12, fill=(248, 250, 252), outline=(226, 232, 240), width=1)
    qr_api = Image.open(PPT_DIR / 'qr_api_key.png').convert('RGB').resize((125, 125), Image.Resampling.LANCZOS)
    img.paste(qr_api, (lx + 230, qr_y + 15))
    d.text((lx + 210 + qw // 2, qr_y + 160), '② API密钥码', font=bold(16), fill=TEAL_PRIMARY, anchor='mm')
    d.text((lx + 210 + qw // 2, qr_y + 188), '设置页扫码导入', font=reg(13), fill=TEXT_MUTED, anchor='mm')
    d.text((lx + 210 + qw // 2, qr_y + 210), '一键激活AI调用', font=reg(12), fill=(140, 150, 160), anchor='mm')

    # 核心亮点与特性列表
    feat_y = qr_y + qh + 20
    d.text((lx + 30, feat_y), '✨ 核心亮点与功能', font=bold(18), fill=TEXT_MAIN)
    feat_y += 30
    feats_1 = [
        '录入性别/年龄/身高/体重/围度等基础数据',
        'AI 自动计算 BMI、常量参考与体质定级',
        '智能识别伤病史与专属运动禁忌要点',
        '输出 11 天科学渐进式运动启动计划'
    ]
    for ft in feats_1:
        d.ellipse([lx + 30, feat_y + 4, lx + 38, feat_y + 12], fill=TEAL_PRIMARY)
        d.text((lx + 46, feat_y), ft, font=reg(15), fill=TEXT_MAIN)
        feat_y += 28

    # 简易使用流程 1-2-3
    step_y = feat_y + 15
    d.text((lx + 30, step_y), '📌 极速上手流程', font=bold(18), fill=TEXT_MAIN)
    step_y += 30
    steps_1 = [
        ('1. 扫码打开', '扫①码访问小程序'),
        ('2. 导入密钥', '在设置页扫②码激活'),
        ('3. 生成报告', '填指标获取专属计划')
    ]
    sw = 108
    for i, (st, sd) in enumerate(steps_1):
        sx = lx + 30 + i * (sw + 12)
        d.rounded_rectangle([sx, step_y, sx + sw, step_y + 75], radius=10, fill=(248, 250, 252), outline=(226, 232, 240), width=1)
        d.text((sx + sw // 2, step_y + 24), st, font=bold(14), fill=TEAL_PRIMARY, anchor='mm')
        d.text((sx + sw // 2, step_y + 50), sd, font=reg(12), fill=TEXT_MUTED, anchor='mm')

    # 左侧后半部（x: 420 ~ 860）：双手机 Mockup 截图展示
    pw, ph = 215, 450
    phone_y = card_y + 155
    mini_phone_mockup(img, d, lx + 510, phone_y, pw, ph, 
                      PPT_DIR / 'AI成长助手截图' / '屏幕截图 2026-08-28 201653.png', 
                      '身体数据录入')
    mini_phone_mockup(img, d, lx + 750, phone_y, pw, ph, 
                      PPT_DIR / 'AI成长助手截图' / '屏幕截图 2026-08-28 201703.png', 
                      'AI健康评估报告')

    # 手机下方小说明
    d.text((lx + 630, phone_y + ph + 55), '📱 真实界面：输入指标 → 秒级生成体质报告', font=reg(14), fill=TEXT_MUTED, anchor='mm')


    # =========================================================================
    # 右侧模块：AI 健身教练
    # =========================================================================
    rx = 980
    # 卡片底板
    d.rounded_rectangle([rx + 6, card_y + 6, rx + card_w + 6, card_y + card_h + 6], radius=24, fill=(220, 230, 226))
    d.rounded_rectangle([rx, card_y, rx + card_w, card_y + card_h], radius=24, fill=CARD_BG)

    # 标题与徽章
    d.rounded_rectangle([rx + 30, card_y + 25, rx + 160, card_y + 60], radius=10, fill=TEAL_PRIMARY)
    d.text((rx + 95, card_y + 42), '应用二 · 追踪', font=bold(17), fill='white', anchor='mm')
    d.text((rx + 175, card_y + 42), 'AI 健身教练 (健身助手)', font=bold(28), fill=TEXT_MAIN, anchor='lm')

    # 一句话定位
    d.rounded_rectangle([rx + 30, card_y + 75, rx + card_w - 30, card_y + 125], radius=10, fill=(236, 253, 245), outline=(167, 243, 208), width=1)
    d.text((rx + 45, card_y + 100), '💡 每日运动打卡、身体围度图表追踪与全天候 AI 私教深度指导互动', font=bold(16), fill=TEAL_PRIMARY, anchor='lm')

    # 右侧前半部（x: 30 ~ 380）：双二维码与核心亮点
    # 网站码
    d.rounded_rectangle([rx + 30, qr_y, rx + 30 + qw, qr_y + qh], radius=12, fill=(248, 250, 252), outline=(226, 232, 240), width=1)
    qr2 = Image.open(PPT_DIR / 'qr_fitness.png').convert('RGB').resize((125, 125), Image.Resampling.LANCZOS)
    img.paste(qr2, (rx + 50, qr_y + 15))
    d.text((rx + 30 + qw // 2, qr_y + 160), '① 网站二维码', font=bold(16), fill=TEAL_PRIMARY, anchor='mm')
    d.text((rx + 30 + qw // 2, qr_y + 188), '手机扫码直达', font=reg(13), fill=TEXT_MUTED, anchor='mm')
    d.text((rx + 30 + qw // 2, qr_y + 210), '支持添加至桌面', font=reg(12), fill=(140, 150, 160), anchor='mm')

    # API码
    d.rounded_rectangle([rx + 210, qr_y, rx + 210 + qw, qr_y + qh], radius=12, fill=(248, 250, 252), outline=(226, 232, 240), width=1)
    img.paste(qr_api, (rx + 230, qr_y + 15))
    d.text((rx + 210 + qw // 2, qr_y + 160), '② API密钥码', font=bold(16), fill=TEAL_PRIMARY, anchor='mm')
    d.text((rx + 210 + qw // 2, qr_y + 188), '设置页扫码导入', font=reg(13), fill=TEXT_MUTED, anchor='mm')
    d.text((rx + 210 + qw // 2, qr_y + 210), '一键激活AI私教', font=reg(12), fill=(140, 150, 160), anchor='mm')

    # 核心亮点与特性列表
    d.text((rx + 30, feat_y - 30 * 4 - 15), '✨ 核心亮点与功能', font=bold(18), fill=TEXT_MAIN)
    feats_2 = [
        '部位/动作结构化选择与卡路里消耗预估',
        '体重、体脂率、腰臀围长周期趋势图表',
        '周/月运动量统计与打卡连续性激励',
        'AI 私教根据数据深度点评并给出营养方案'
    ]
    fy2 = qr_y + qh + 50
    for ft in feats_2:
        d.ellipse([rx + 30, fy2 + 4, rx + 38, fy2 + 12], fill=TEAL_PRIMARY)
        d.text((rx + 46, fy2), ft, font=reg(15), fill=TEXT_MAIN)
        fy2 += 28

    # 简易使用流程 1-2-3
    d.text((rx + 30, step_y), '📌 极速上手流程', font=bold(18), fill=TEXT_MAIN)
    steps_2 = [
        ('1. 扫码打开', '扫①码访问小程序'),
        ('2. 导入密钥', '在设置页扫②码激活'),
        ('3. 记录与对话', '打卡数据并问私教')
    ]
    for i, (st, sd) in enumerate(steps_2):
        sx = rx + 30 + i * (sw + 12)
        d.rounded_rectangle([sx, step_y + 30, sx + sw, step_y + 105], radius=10, fill=(248, 250, 252), outline=(226, 232, 240), width=1)
        d.text((sx + sw // 2, step_y + 54), st, font=bold(14), fill=TEAL_PRIMARY, anchor='mm')
        d.text((sx + sw // 2, step_y + 80), sd, font=reg(12), fill=TEXT_MUTED, anchor='mm')

    # 右侧后半部（x: 420 ~ 860）：双手机 Mockup 截图展示
    mini_phone_mockup(img, d, rx + 510, phone_y, pw, ph, 
                      PPT_DIR / 'AI教练截图' / '屏幕截图 2026-08-28 201218.png', 
                      '训练打卡与记录')
    mini_phone_mockup(img, d, rx + 750, phone_y, pw, ph, 
                      PPT_DIR / 'AI教练截图' / '屏幕截图 2026-08-28 201412.png', 
                      'AI私教深度点评')

    # 手机下方小说明
    d.text((rx + 630, phone_y + ph + 55), '📱 真实界面：训练打卡 → AI 私教智能指导', font=reg(14), fill=TEXT_MUTED, anchor='mm')

    # 底部居中安全声明
    d.text((W // 2, 1062), '🔒 数据本地存储 · 密钥安全隔离 · 志愿公益服务 · 即扫即用即体验', font=reg(15), fill=TEXT_MUTED, anchor='mm')

    out_p = PPT_DIR / 'PPT展示_双应用合一_16x9.png'
    img.save(out_p, quality=95)
    print(f'Saved: {out_p}')

if __name__ == '__main__':
    generate_combined_ppt()
