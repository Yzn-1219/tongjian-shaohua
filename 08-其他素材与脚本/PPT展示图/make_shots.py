from playwright.sync_api import sync_playwright
from pathlib import Path

BASE = Path(r'C:\Users\Yanzongning\Desktop\童健韶华资料库\PPT展示图')
SHOTS = BASE / 'shots'
SHOTS.mkdir(parents=True, exist_ok=True)

assess_url = (BASE.parent / 'AI体质检测助手' / 'index.html').as_uri()
fitness_url = 'https://cb0eb09ef8944dd381cf1c566d91dce4.app.workbuddy.link'

CHROME = (r'C:\Users\Yanzongning\AppData\Local\ms-playwright'
          r'\chromium-1234\chrome-win64\chrome.exe')

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=CHROME)
    ctx = browser.new_context(viewport={'width': 400, 'height': 860},
                              device_scale_factor=2)
    page = ctx.new_page()

    # 1) AI 体质检测助手（本地文件）
    page.goto(assess_url)
    page.wait_for_timeout(2000)
    page.screenshot(path=str(SHOTS / 'assess.png'))
    print('OK assess')

    # 2) 健身助手 -> AI 教练页
    page.goto(fitness_url)
    page.wait_for_timeout(6000)
    page.screenshot(path=str(SHOTS / 'fitness_home.png'))
    print('OK fitness home')
    try:
        page.click('[data-page="coach"]')
        page.wait_for_timeout(3000)
        page.screenshot(path=str(SHOTS / 'fitness_coach.png'))
        print('OK fitness coach')
    except Exception as e:
        print('coach click failed:', e)

    browser.close()
print('DONE')
