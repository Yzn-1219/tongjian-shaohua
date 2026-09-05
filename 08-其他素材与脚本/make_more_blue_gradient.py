from PIL import Image
import numpy as np

width, height = 1920, 1080

# 制作更具蓝色主调、白为辅色调、白蓝相接的舒缓平滑纯色渐变底图
# 方案 A: 经典左上到右下舒缓蓝白流光渐变（天空蓝 #0284C7 -> 冰海蓝 #38BDF8 -> 柔蓝 #BAE6FD -> 纯白 #FFFFFF）
# 方案 B: 环形/宽对角线弥散渐变，非常平和舒缓，蓝白相融

arr = np.zeros((height, width, 3), dtype=np.uint8)

for y in range(height):
    for x in range(width):
        # 宽对角线缓动
        u = x / width
        v = y / height
        
        # 偏向左上方与中部的舒缓蔚蓝场
        factor = (u * 0.45 + v * 0.75) # 0 到 1.2
        # 平滑 S 曲线
        t = np.clip(factor, 0.0, 1.0)
        t = t * t * (3 - 2 * t)
        
        # 蓝白两端色值 (顶部左侧呈现明亮纯净的科技天蓝，温和过渡到右下方的柔白)
        # 蓝调端点：RGB (176, 216, 248) ~ #B0D8F8 (柔和纯正天蓝，绝不刺眼，也不深沉)
        # 白调端点：RGB (255, 255, 255)
        # 中间过渡带有少许青空泛光
        
        # R: 180 -> 255
        # G: 220 -> 255
        # B: 248 -> 255
        r = int((1 - t) * 175 + t * 255)
        g = int((1 - t) * 215 + t * 255)
        b = int((1 - t) * 248 + t * 255)
        
        arr[y, x] = [r, g, b]

img = Image.fromarray(arr)
img.save("以动代屏_童健韶华_体质提升篇_汇报/assets/cover_bg_pure_blue_white.png", "PNG")
img.save("PPT展示图/童健韶华_舒缓蓝白渐变底图.png", "PNG")
print("Saved clean soft blue-white gradient!")
