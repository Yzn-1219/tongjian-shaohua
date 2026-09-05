from PIL import Image, ImageDraw
import numpy as np

# 尺寸 1920x1080 (16:9 / 适配 1280x720)
width, height = 1920, 1080

# 创建对角线柔和蓝白平滑渐变
# 起点左上/顶部：温润柔和天蓝色 (#E0F2FE -> #BAE6FD -> #38BDF8 微光)
# 终点右下/大面积：纯净白/极淡云白 (#FFFFFF / #F8FAFC)
# 也可以做非常舒缓平和的弧形/对角线蓝白微渐变

image = Image.new("RGBA", (width, height), (255, 255, 255, 255))
arr = np.zeros((height, width, 4), dtype=np.float32)

# 构造温和的渐变场 (平和、舒缓、蓝为主调微光，白为大面积辅色，蓝白交融)
# 顶部左侧/上方是舒缓的静谧蓝 (#1E40AF -> #0284C7 -> #38BDF8 -> #E0F2FE -> #FFFFFF)
# 让过渡非常宽广柔和 (Sigma 大，无生硬边界)

for y in range(height):
    for x in range(width):
        # 归一化坐标
        nx = x / width
        ny = y / height
        
        # 距离左上/顶部的渐变因子 (缓动函数 smoothstep)
        # 从左上到右下，主要在上部和左侧有温和天蓝，向下向右自然过渡到纯净白
        dist = (nx * 0.4 + ny * 0.8) # 0.0 ~ 1.2
        
        # 柔和平滑曲线
        t = np.clip(dist, 0.0, 1.0)
        t = t * t * (3 - 2 * t) # smoothstep
        
        # 颜色插值：
        # 左上浅海天蓝: RGB (218, 238, 253) ~ #DAEEFD -> 中间 (238, 246, 255) -> 纯白 (255, 255, 255)
        # 或者更具专业质感的：
        # 上半部/左侧有柔和蓝调 RGB(202, 230, 251) ~ #CAE6FB
        # 底部大面积纯净微蓝白 RGB(255, 255, 255)
        r = (1 - t) * 205 + t * 255
        g = (1 - t) * 230 + t * 255
        b = (1 - t) * 250 + t * 255
        
        arr[y, x, 0] = r
        arr[y, x, 1] = g
        arr[y, x, 2] = b
        arr[y, x, 3] = 255

img_grad = Image.fromarray(arr.astype(np.uint8))

# 添加顶部边缘一条极细微静谧深蓝到透明的光晕（增加纵深与沉稳感）
top_glow = Image.new("RGBA", (width, height), (0, 0, 0, 0))
draw = ImageDraw.Draw(top_glow)
for y in range(180):
    alpha = int((1.0 - y / 180.0) ** 2 * 35) # 极轻微
    draw.line([(0, y), (width, y)], fill=(2, 132, 199, alpha))

final_img = Image.alpha_composite(img_grad, top_glow)

# 保存到底图路径
final_img.save("以动代屏_童健韶华_体质提升篇_汇报/assets/cover_bg_pure_blue_white.png", "PNG")
final_img.save("PPT展示图/童健韶华_舒缓蓝白渐变底图.png", "PNG")
print("Successfully generated smooth blue-white background image!")
