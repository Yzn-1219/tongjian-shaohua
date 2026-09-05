import os
from PIL import Image, ImageDraw, ImageFont

ASSETS = r'C:\Users\Yanzongning\Desktop\童健韶华资料库\使用指引\assets'
OUT = r'C:\Users\Yanzongning\Desktop\童健韶华资料库\使用指引\使用指引.png'
FD = r'C:\Windows\Fonts'

W, H = 1240, 1754
bg=(241,245,244); primary=(15,118,110); primary_l=(20,184,166)
card=(255,255,255); text=(31,41,55); text2=(107,114,128)

reg = lambda s: ImageFont.truetype(os.path.join(FD,'msyh.ttc'), s)
bold = lambda s: ImageFont.truetype(os.path.join(FD,'msyhbd.ttc'), s)

img = Image.new('RGB',(W,H), bg)
d = ImageDraw.Draw(img)

# 头部渐变
hdr_h=520
hdr=Image.new('RGB',(W,hdr_h)); hd=ImageDraw.Draw(hdr)
for y in range(hdr_h):
    t=y/hdr_h
    hd.line([(0,y),(W,y)], fill=(int(primary_l[0]*(1-t)+primary[0]*t),
                                 int(primary_l[1]*(1-t)+primary[1]*t),
                                 int(primary_l[2]*(1-t)+primary[2]*t)))
img.paste(hdr,(0,0))

def rr(x,y,w,h,r,fill=None,outline=None,width=1):
    d.rounded_rectangle([x,y,x+w,y+h], radius=r, fill=fill, outline=outline, width=width)

def badge(cx,cy,radius,path,pad=6):
    d.ellipse([cx-radius,cy-radius,cx+radius,cy+radius], fill=card)
    im=Image.open(path).convert('RGBA').resize(((radius-pad)*2,)*2)
    m=Image.new('L',im.size,0); ImageDraw.Draw(m).ellipse([0,0,*im.size],fill=255)
    im.putalpha(m); img.paste(im,(cx-im.size[0]//2,cy-im.size[1]//2),im)

badge(W//2,165,108,os.path.join(ASSETS,'team-logo.png'))

d.text((W//2,412),'微光向暖 · 资润启梦', font=bold(54), fill='white', anchor='mm')
d.text((W//2,472),'学生资助自助小程序 · 使用指引', font=reg(27), fill=(255,255,255), anchor='mm')

def wrap(text,font,maxw):
    lines=[]; cur=''
    for ch in text:
        if ch=='\n': lines.append(cur); cur=''; continue
        if d.textlength(cur+ch,font=font)<=maxw: cur+=ch
        else: lines.append(cur); cur=ch
    if cur: lines.append(cur)
    return lines

# 两个二维码卡片
card_y=560; card_h=620; card_w=510; left_x=70; right_x=660
data=[(os.path.join(ASSETS,'app-aid-qr.png'),'① 网站二维码','扫码打开小程序'),
      (os.path.join(ASSETS,'api-key-qr.png'),'② AI 密钥二维码','扫码填入密钥')]
for i,(qp,title,sub) in enumerate(data):
    x=left_x if i==0 else right_x
    rr(x,card_y,card_w,card_h,18,fill=card)
    qr=Image.open(qp).convert('RGB').resize((360,360))
    img.paste(qr,(x+(card_w-360)//2, card_y+70))
    d.text((x+card_w//2, card_y+70+360+34), title, font=bold(30), fill=primary, anchor='mm')
    d.text((x+card_w//2, card_y+70+360+72), sub, font=reg(22), fill=text2, anchor='mm')

# 步骤
sx=70; sy=1220; sw=1100; sh=470
rr(sx,sy,sw,sh,18,fill=card)
d.text((sx+44,sy+34),'三步上手', font=bold(32), fill=primary)
steps=[
 '用手机扫左边「网站二维码」打开小程序（或浏览器访问网址，建议"添加到主屏幕"安装）。',
 '进入底部「设置」，点「扫码填入」扫右边「AI 密钥二维码」自动导入；也可手动粘贴密钥到「API Key」框。',
 '密钥填好后即可畅用：浏览资助政策、查看原文，并随时向 AI 问答咨询资助问题。']
step_y=sy+86; step_h=120
for i,t in enumerate(steps):
    cy=step_y+i*step_h+22
    d.ellipse([sx+40-22,cy-22,sx+40+22,cy+22], fill=primary)
    d.text((sx+40,cy), str(i+1), font=bold(26), fill='white', anchor='mm')
    lines=wrap(t,reg(23), sw-90-50)
    ty=step_y+i*step_h+4
    for ln in lines:
        d.text((sx+90, ty), ln, font=reg(23), fill=text, anchor='lt'); ty+=33

# 页脚声明
note='本小程序为志愿服务公益作品，禁止商用。AI 内容依据公开资助政策资料生成，具体以最新政策文件及资助中心解释为准。'
nl=wrap(note,reg(20), W-140)
ny=H-30-len(nl)*28
d.rectangle([60,ny-14,W-60,ny-14+len(nl)*28+24], fill=card, outline=(229,231,235), width=1)
yy=ny
for ln in nl:
    d.text((W//2,yy), ln, font=reg(20), fill=text2, anchor='mm'); yy+=28

img.save(OUT)
print('saved', OUT, img.size)
