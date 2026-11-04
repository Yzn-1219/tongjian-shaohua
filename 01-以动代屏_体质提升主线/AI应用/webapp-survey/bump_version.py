# -*- coding: utf-8 -*-
"""
童健韶华 · 版本号管理
------------------------------------------------------------
每次改完东西，发布前跑一次：

    python bump_version.py "这次改了什么"

做四件事（全自动，别再手改这三个地方）：
  1) version.js            ver 的修订号 +1，刷新日期与说明
  2) app/service-worker.js BUILD 同步（缓存名 tjs-health-<ver> 与自动刷新参数都由它派生）
  3) 版本记录.md            追加一行
  4) 打印新版本号，可直接贴进汇报

只想升次版本号：python bump_version.py --minor "说明"
只想知道当前版本：python bump_version.py --show
"""
import io
import os
import re
import sys
import datetime

BASE = os.path.dirname(os.path.abspath(__file__))
VER_JS = os.path.join(BASE, 'version.js')
SW_JS = os.path.join(BASE, 'app', 'service-worker.js')
LOG_MD = os.path.join(BASE, '版本记录.md')


def read(path):
    with io.open(path, encoding='utf-8', newline='') as f:
        return f.read()


def write(path, text):
    with io.open(path, 'w', encoding='utf-8', newline='') as f:
        f.write(text)


def parse(text):
    ver = re.search(r"window\.TJSH_VER\s*=\s*'([^']+)'", text)
    date = re.search(r"window\.TJSH_DATE\s*=\s*'([^']*)'", text)
    note = re.search(r"window\.TJSH_NOTE\s*=\s*'([^']*)'", text)
    return (ver.group(1) if ver else 'v0.0.0',
            date.group(1) if date else '',
            note.group(1) if note else '')


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    flags = [a for a in sys.argv[1:] if a.startswith('--')]

    body = read(VER_JS)
    ver, old_date, old_note = parse(body)

    if '--show' in flags:
        print('当前版本 %s（%s）%s' % (ver, old_date, old_note))
        return

    m = re.match(r'v(\d+)\.(\d+)\.(\d+)$', ver)
    if not m:
        print('version.js 里的版本号格式不对：%r，应为 v1.2.3' % ver)
        sys.exit(1)
    major, minor, patch = (int(x) for x in m.groups())
    if '--major' in flags:
        major, minor, patch = major + 1, 0, 0
    elif '--minor' in flags:
        major, minor, patch = major, minor + 1, 0
    else:
        patch += 1
    new_ver = 'v%d.%d.%d' % (major, minor, patch)
    today = datetime.date.today().strftime('%Y-%m-%d')
    note = args[0].strip() if args else '日常更新'

    # 1) version.js
    body = re.sub(r"(window\.TJSH_VER\s*=\s*')[^']*(')",
                  lambda x: x.group(1) + new_ver + x.group(2), body, count=1)
    body = re.sub(r"(window\.TJSH_DATE\s*=\s*')[^']*(')",
                  lambda x: x.group(1) + today + x.group(2), body, count=1)
    body = re.sub(r"(window\.TJSH_NOTE\s*=\s*')[^']*(')",
                  lambda x: x.group(1) + note.replace("'", '’') + x.group(2), body, count=1)
    write(VER_JS, body)

    # 2) service-worker.js 的 BUILD
    sw = read(SW_JS)
    if not re.search(r"^const BUILD = '[^']*';$", sw, re.M):
        print('service-worker.js 里找不到 const BUILD 那一行，先手动确认一下结构')
        sys.exit(1)
    sw = re.sub(r"^const BUILD = '[^']*';$", "const BUILD = '%s';" % new_ver, sw, count=1, flags=re.M)
    write(SW_JS, sw)

    # 3) 版本记录.md
    if not os.path.exists(LOG_MD):
        write(LOG_MD, '# 版本记录\n\n| 版本 | 日期 | 这次改了什么 |\n| --- | --- | --- |\n')
    log = read(LOG_MD)
    if not log.endswith('\n'):
        log += '\n'
    log += '| %s | %s | %s |\n' % (new_ver, today, note.replace('|', '/'))
    write(LOG_MD, log)

    print('版本 %s → %s（%s）%s' % (ver, new_ver, today, note))
    print('已同步：version.js / app/service-worker.js（缓存名 tjs-health-%s）' % new_ver)
    print('别忘了：改了 app/ 里的文件后重新发布，链接不变')


if __name__ == '__main__':
    main()
