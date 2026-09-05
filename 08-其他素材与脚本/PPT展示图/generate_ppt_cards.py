import os
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

BASE = Path(r'C:\Users\Yanzongning\Desktop\童健韶华资料库')
PPT_DIR = BASE / 'PPT展示图'
FD = Path(r'C:\Windows\Fonts')

bold = lambda s: ImageFont.truetype(str(FD / 'msyhbd.ttc'), s)
reg = lambda s: ImageFont.truetype(str(FD / 'msyh.ttc'), s)

# 主题配色
TEAL_PRIMARY = (15, 118, 110)      # #0f766e
TEAL_LIGHT = (20, 184, 166)        # #14b8a6
TEAL_DARK = (13, 78, 74)
BG = (241, 245, 244)               # 柔和浅绿灰底色
CARD_BG = (255, 255, 255)
TEXT_MAIN = (31, 41, 55)
TEXT_MUTED = (107, 114, 128)

def draw_header_bar(img, d, W, title, subtitle):
    hdr_h = 160
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
        logo.thumbnail((80, 80))
        img.paste(logo, (50, 40), logo)

    d.text((150, 52), '童健韶华志愿服务队', font=bold(26), fill='white')
    d.text((150, 92), 'AI 赋能青少年健康成长 · 数字化志愿服务', font=reg(18), fill=(220, 245, 240))

    d.text((W // 2, 60), title, font=bold(46), fill='white', anchor='mm')
    d.text((W // 2, 112), subtitle, font=reg(22), fill=(220, 245, 240), anchor='mm')

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
        d.rounded_rectangle([cx - 100, tag_y, cx + 100, tag_y + 36], radius=10, fill=TEAL_PRIMARY)
        d.text((cx, tag_y + 18), label_text, font=bold(18), fill='white', anchor='mm')


# ==============================================================================
# 单张生成函数：左侧【双二维码(网站码+API码)】+ 流程说明 + 右侧示例手机图
# ==============================================================================
def generate_single_ppt(out_filename, title, subtitle, app_name, app_badge, 
                        app_summary, workflow_steps, app_qr_path, api_qr_path,
                        phone_shots):
    W, H = 1920, 1080
    img = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(img)

    # 1. 顶部栏
    draw_header_bar(img, d, W, title, subtitle)

    # 2. 左侧控制面板（卡片式）
    lx, ly, lw, lh = 60, 190, 680, 830
    d.rounded_rectangle([lx + 6, ly + 6, lx + lw + 6, ly + lh + 6], radius=24, fill=(220, 230, 226))
    d.rounded_rectangle([lx, ly, lx + lw, ly + lh], radius=24, fill=CARD_BG)

    # 应用主徽标与名称
    d.rounded_rectangle([lx + 36, ly + 36, lx + 180, ly + 76], radius=12, fill=TEAL_PRIMARY)
    d.text((lx + 108, ly + 56), app_badge, font=bold(20), fill='white', anchor='mm')
    d.text((lx + 200, ly + 56), app_name, font=bold(32), fill=TEXT_MAIN, anchor='lm')

    # 一句话核心定位（彩色背景框）
    d.rounded_rectangle([lx + 36, ly + 96, lx + lw - 36, ly + 158], radius=14, fill=(236, 253, 245), outline=(167, 243, 208), width=1)
    d.text((lx + 56, ly + 127), app_summary, font=bold(21), fill=TEAL_PRIMARY, anchor='lm')

    # 双二维码并排展示区（左：网站二维码，右：API 密钥二维码）
    qr_card_y = ly + 175
    qr_card_w = 286
    qr_card_h = 325

    # ① 网站二维码卡片
    q1_x = lx + 36
    d.rounded_rectangle([q1_x, qr_card_y, q1_x + qr_card_w, qr_card_y + qr_card_h], radius=16, fill=(248, 250, 252), outline=(226, 232, 240), width=1)
    qr1_img = Image.open(app_qr_path).convert('RGB').resize((185, 185), Image.Resampling.LANCZOS)
    img.paste(qr1_img, (q1_x + (qr_card_w - 185) // 2, qr_card_y + 20))
    d.text((q1_x + qr_card_w // 2, qr_card_y + 232), '① 网站二维码', font=bold(20), fill=TEAL_PRIMARY, anchor='mm')
    d.text((q1_x + qr_card_w // 2, qr_card_y + 268), '手机扫码直达小程序', font=reg(15), fill=TEXT_MUTED, anchor='mm')
    d.text((q1_x + qr_card_w // 2, qr_card_y + 294), '支持浏览器/PWA安装', font=reg(14), fill=(140, 150, 160), anchor='mm')

    # ② API 密钥二维码卡片
    q2_x = lx + 36 + qr_card_w + 36
    d.rounded_rectangle([q2_x, qr_card_y, q2_x + qr_card_w, qr_card_y + qr_card_h], radius=16, fill=(248, 250, 252), outline=(226, 232, 240), width=1)
    qr2_img = Image.open(api_qr_path).convert('RGB').resize((185, 185), Image.Resampling.LANCZOS)
    img.paste(qr2_img, (q2_x + (qr_card_w - 185) // 2, qr_card_y + 20))
    d.text((q2_x + qr_card_w // 2, qr_card_y + 232), '② AI 密钥二维码', font=bold(20), fill=TEAL_PRIMARY, anchor='mm')
    d.text((q2_x + qr_card_w // 2, qr_card_y + 268), '进入设置扫码填入', font=reg(15), fill=TEXT_MUTED, anchor='mm')
    d.text((q2_x + qr_card_w // 2, qr_card_y + 294), '一键激活 AI 智能调用', font=reg(14), fill=(140, 150, 160), anchor='mm')

    # 下方：使用流程 1-2-3
    flow_y = ly + 522
    d.text((lx + 36, flow_y), '📌 三步极速上手流程', font=bold(22), fill=TEXT_MAIN)
    flow_y += 38

    step_w = (lw - 72 - 30) // 3
    for i, (stitle, sdesc) in enumerate(workflow_steps):
        sx = lx + 36 + i * (step_w + 15)
        d.rounded_rectangle([sx, flow_y, sx + step_w, flow_y + 175], radius=14, fill=(248, 250, 252), outline=(226, 232, 240), width=1)
        
        # 步骤序号圆圈
        d.ellipse([sx + 18, flow_y + 18, sx + 54, flow_y + 54], fill=TEAL_PRIMARY)
        d.text((sx + 36, flow_y + 36), str(i + 1), font=bold(20), fill='white', anchor='mm')
        
        d.text((sx + 64, flow_y + 36), stitle, font=bold(18), fill=TEXT_MAIN, anchor='lm')
        
        # 换行说明
        d.text((sx + 18, flow_y + 72), sdesc, font=reg(15), fill=TEXT_MUTED)

    # 左侧卡片底部安全与开源标识
    d.text((lx + lw // 2, ly + lh - 25), '🔒 密钥仅存本地 · 安全透明 · 志愿公益 · 扫码即用', font=reg(15), fill=TEXT_MUTED, anchor='mm')


    # 3. 右侧：示例界面展示（三手机并排展示）
    # 区域：x=770 ~ 1860 (w=1090), y=190 ~ 1020
    pw, ph = 320, 640
    gap = 40
    total_w = 3 * pw + 2 * gap
    start_x = 770 + (1090 - total_w) // 2 + pw // 2
    for i, (spath, slabel) in enumerate(phone_shots):
        cx = start_x + i * (pw + gap)
        phone_mockup(img, d, cx, 240, pw, ph, spath, slabel)

    # 4. 底部右侧提示
    d.text((1315, 1040), '📱 手机端真实界面示例 · 响应式 PWA 设计', font=reg(17), fill=TEXT_MUTED, anchor='mm')

    # 保存
    out_p = PPT_DIR / out_filename
    img.save(out_p, quality=95)
    print(f'Saved: {out_p}')


# ==============================================================================
# 1. 生成【AI体质检测助手】PPT展示图（含网站码 + API密钥码）
# ==============================================================================
generate_single_ppt(
    out_filename='PPT展示_AI体质检测助手.png',
    title='AI 体质检测助手 · 项目展示',
    subtitle='青少年体质智能评估与个性化运动指导系统',
    app_name='AI 体质检测助手',
    app_badge='独立 PWA',
    app_summary='智能分析体质数据，一键生成专属健康报告与 11 天运动计划',
    workflow_steps=[
        ('扫码打开程序', '扫左侧①网站码打开\n支持添加到主屏幕'),
        ('扫码导入密钥', '在设置页点扫码填入\n扫右侧②API码自动导入'),
        ('生成评估报告', '填身体指标秒级分析\n获取11天定制运动菜单')
    ],
    app_qr_path=PPT_DIR / 'qr_assess.png',
    api_qr_path=PPT_DIR / 'qr_api_key.png',
    phone_shots=[
        (PPT_DIR / 'AI成长助手截图' / '屏幕截图 2026-08-28 201653.png', '① 身体数据填报'),
        (PPT_DIR / 'AI成长助手截图' / '屏幕截图 2026-08-28 201703.png', '② AI 评估与禁忌'),
        (PPT_DIR / 'AI成长助手截图' / '屏幕截图 2026-08-28 201718.png', '③ 11天运动计划')
    ]
)


# ==============================================================================
# 2. 生成【AI健身教练】PPT展示图（含网站码 + API密钥码）
# ==============================================================================
generate_single_ppt(
    out_filename='PPT展示_AI健身教练.png',
    title='AI 健身教练 · 项目展示',
    subtitle='数字化健身追踪与全天候智能私教辅助系统',
    app_name='AI 健身教练 (健身助手)',
    app_badge='全功能 PWA',
    app_summary='训练打卡、身体追踪、图表统计与 AI 教练深度对话一网打尽',
    workflow_steps=[
        ('扫码打开程序', '扫左侧①网站码打开\n支持添加到主屏幕'),
        ('扫码导入密钥', '在设置页点扫码填入\n扫右侧②API码自动导入'),
        ('开启智能私教', '记录训练与身体数据\n一键获取专业点评指导')
    ],
    app_qr_path=PPT_DIR / 'qr_fitness.png',
    api_qr_path=PPT_DIR / 'qr_api_key.png',
    phone_shots=[
        (PPT_DIR / 'AI教练截图' / '屏幕截图 2026-08-28 201218.png', '① 训练与打卡记录'),
        (PPT_DIR / 'AI教练截图' / '屏幕截图 2026-08-28 201257.png', '② 身体数据追踪'),
        (PPT_DIR / 'AI教练截图' / '屏幕截图 2026-08-28 201412.png', '③ AI 私教深度点评')
    ]
)

print('ALL DONE WITH DUAL QR CODES!')
