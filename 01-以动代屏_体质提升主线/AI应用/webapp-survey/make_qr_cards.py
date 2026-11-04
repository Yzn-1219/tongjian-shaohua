# -*- coding: utf-8 -*-
"""
生成「课前问卷 / 课后问卷」二维码（纯码 + 投屏卡片 + 并排大图）
------------------------------------------------------------
用法：python make_qr_cards.py

产出（默认写到 问卷系统/二维码/）：
  qr_pre.png        课前 · 纯二维码 1200×1200（插 PPT 用）
  qr_post.png       课后 · 纯二维码 1200×1200
  qr_pre_card.png   课前 · 卡片版 900×1300（打印 / 单独发群）
  qr_post_card.png  课后 · 卡片版 900×1300
  qr_both.png       课前 + 课后 并排 1900×1300（投屏一页讲清）
同时把纯码覆盖到「新生体质健康宣讲/assets/qr_pre.png、qr_post.png」（PPT 里引用的是这两个名字）。
"""
import os

import qrcode
from qrcode.constants import ERROR_CORRECT_M
from PIL import Image, ImageDraw, ImageFont

BASE = "https://tjsh-survey.app.workbuddy.host/?sharecode=JJ77UNDWFZ"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "二维码")
PPT_ASSETS = r"C:\Users\Yanzongning\Desktop\童健韶华资料库\班级宣讲\新生体质健康宣讲\assets"
os.makedirs(OUT, exist_ok=True)

FONT_B = r"C:\Windows\Fonts\msyhbd.ttc"   # 微软雅黑 Bold
FONT_R = r"C:\Windows\Fonts\msyh.ttc"     # 微软雅黑

TEAL = (13, 125, 106)      # 课前
BLUE = (29, 78, 216)       # 课后
SLATE = (51, 65, 85)       # 主页面
ORANGE = (194, 65, 12)     # 后台（队内）
INK = (15, 23, 42)
GRAY = (100, 116, 139)
LIGHT = (226, 232, 240)

ITEMS = [
    dict(
        key="pre", no="①", title="课前问卷", color=TEAL,
        sub="宣讲开始前填 · 7 道题 · 约 40 秒",
        tip="进教室先扫码，一分钟不到就填完",
        url=BASE + "&p=pre",
    ),
    dict(
        key="post", no="②", title="课后问卷", color=BLUE,
        sub="宣讲结束后填 · 7 道题 · 约 40 秒",
        tip="讲完最后再扫一次，两份数据一对比就是效果",
        url=BASE + "&p=post",
    ),
]

# 队内用的两张：问卷主页面、后台看板（不给学生）
ITEMS_EXTRA = [
    dict(
        key="home", no="🏠", title="问卷主页面", color=SLATE,
        sub="两个入口的总门 · 默认进课前卷",
        tip="群里发一个链接时的默认落点",
        url=BASE,
    ),
    dict(
        key="admin", no="📊", title="后台看板（队内）", color=ORANGE,
        sub="输口令进入 · 只给数据员",
        tip="讲完当场打开看前后对比，记得导出 CSV 留档",
        url=BASE.replace("/?sharecode=", "/admin.html?sharecode="),
    ),
]


def font(path, size):
    return ImageFont.truetype(path, size)


def make_qr(url, px=1200):
    """整数倍缩放，保证码点锐利"""
    qr = qrcode.QRCode(error_correction=ERROR_CORRECT_M, box_size=10, border=2)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white").convert("RGB")
    n = img.size[0]
    k = max(1, round(px / n))
    return img.resize((n * k, n * k), Image.NEAREST)


def center_text(d, box, text, f, fill):
    x0, y0, x1, y1 = box
    bb = d.textbbox((0, 0), text, font=f)
    w, h = bb[2] - bb[0], bb[3] - bb[1]
    d.text((x0 + (x1 - x0 - w) / 2 - bb[0], y0 + (y1 - y0 - h) / 2 - bb[1]), text, font=f, fill=fill)


def wrap(d, text, f, maxw):
    """按像素宽度折行（中文逐字折）"""
    lines, cur = [], ""
    for ch in text:
        t = cur + ch
        if d.textlength(t, font=f) <= maxw:
            cur = t
        else:
            lines.append(cur)
            cur = ch
    if cur:
        lines.append(cur)
    return lines


def card(item, w=900, h=1300):
    img = Image.new("RGB", (w, h), "white")
    d = ImageDraw.Draw(img)

    # 外框
    d.rounded_rectangle([0, 0, w - 1, h - 1], radius=44, outline=LIGHT, width=2)

    # 顶栏
    d.rounded_rectangle([0, 0, w - 1, 300], radius=44, fill=item["color"])
    d.rectangle([0, 240, w - 1, 300], fill=item["color"])

    # 序号圆
    d.ellipse([54, 58, 174, 178], fill=(255, 255, 255))
    center_text(d, (54, 58, 174, 178), item["no"], font(FONT_B, 68), item["color"])

    d.text((200, 62), item["title"], font=font(FONT_B, 64), fill=(255, 255, 255))
    d.text((204, 146), item["sub"], font=font(FONT_R, 27), fill=(255, 255, 255))

    # 二维码
    # 用「模块整数倍」的原生尺寸，避免非整数缩放把码点拉成毛边
    qr = make_qr(item["url"], 600)
    qw = qr.size[0]
    qx = (w - qw) // 2
    qy = 350 + (600 - qw) // 2
    d.rounded_rectangle([qx - 22, qy - 22, qx + qw + 22, qy + qw + 22],
                        radius=24, outline=LIGHT, width=2, fill="white")
    img.paste(qr, (qx, qy))

    # 提示
    y = qy + qw + 44
    center_text(d, (40, y, w - 40, y + 44), item["tip"], font(FONT_B, 30), INK)

    y2 = y + 62
    center_text(d, (40, y2, w - 40, y2 + 34), "微信扫一扫 / 手机相机扫码", font(FONT_R, 24), GRAY)

    # 链接（手动输入备用）
    y3 = y2 + 52
    f13 = font(FONT_R, 17)
    for line in wrap(d, item["url"], f13, w - 120):
        bb = d.textbbox((0, 0), line, font=f13)
        d.text(((w - (bb[2] - bb[0])) / 2, y3), line, font=f13, fill=(148, 163, 184))
        y3 += 24

    # 页脚
    d.line([60, h - 92, w - 60, h - 92], fill=(241, 245, 249), width=2)
    center_text(d, (40, h - 78, w - 40, h - 34),
                "山东药品食品职业学院 ·「童健韶华」志愿服务队", font(FONT_R, 20), GRAY)
    center_text(d, (40, h - 36, w - 40, h - 8),
                "数据不记名，只用于本次宣讲效果统计", font(FONT_R, 17), (180, 190, 200))
    return img


def main():
    plain = {}
    for it in ITEMS + ITEMS_EXTRA:
        q = make_qr(it["url"], 1200)
        p = os.path.join(OUT, "qr_%s.png" % it["key"])
        q.save(p, "PNG", optimize=True)
        plain[it["key"]] = q
        print("纯码  %s  %dx%d  %dKB" % (p, q.size[0], q.size[1], os.path.getsize(p) // 1024))

        c = card(it)
        pc = os.path.join(OUT, "qr_%s_card.png" % it["key"])
        c.save(pc, "PNG", optimize=True)
        print("卡片  %s  %dx%d  %dKB" % (pc, c.size[0], c.size[1], os.path.getsize(pc) // 1024))

    # 并排大图（投屏用）
    cw, ch, gap = 900, 1300, 60
    both = Image.new("RGB", (cw * 2 + gap, ch), (248, 250, 252))
    for i, it in enumerate(ITEMS):
        both.paste(card(it), (i * (cw + gap), 0))
    pb = os.path.join(OUT, "qr_both.png")
    both.save(pb, "PNG", optimize=True)
    print("并排  %s  %dx%d  %dKB" % (pb, both.size[0], both.size[1], os.path.getsize(pb) // 1024))

    # 同步给 PPT 用的纯码（只要课前/课后）
    if os.path.isdir(PPT_ASSETS):
        for it in ITEMS:
            dst = os.path.join(PPT_ASSETS, "qr_%s.png" % it["key"])
            plain[it["key"]].save(dst, "PNG", optimize=True)
        print("已同步纯码到：%s" % PPT_ASSETS)

    # 站点内引用（英文名，避免中文路径）：assets/qr_*.png
    SITE_ASSETS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets")
    for it in ITEMS + ITEMS_EXTRA:
        make_qr(it["url"], 560).save(
            os.path.join(SITE_ASSETS, "qr_%s.png" % it["key"]), "PNG", optimize=True)
    print("已写入站点资源：%s" % SITE_ASSETS)

    print("\n链接：")
    for it in ITEMS + ITEMS_EXTRA:
        print("  %s  %s" % (it["title"], it["url"]))


if __name__ == "__main__":
    main()
