# -*- coding: utf-8 -*-
"""
把云服务配置 + SDK 全部内联进 HTML。

原因：站点发布后整站（含子资源）必须带 ?sharecode= 才能访问，
而相对路径的 <script src> 不会携带查询串，子资源必然 403。
内联后页面只剩一个文档请求，彻底不依赖子资源，也不再依赖 jsdelivr。

用法：python inline.py
可重复运行（已是内联状态时不再改动）。
"""
import io
import os
import re

BASE = os.path.dirname(os.path.abspath(__file__))
SDK_PATH = os.path.join(BASE, 'vendor', 'workbuddy-cloud.js')
CONFIG_PATH = os.path.join(BASE, 'config.js')

CONFIG_BLOCK = """<!-- 云服务配置（内联，勿加外链） -->
<script>
window.SURVEY_CONFIG = {
  endpoint: 'https://tjsh-survey.app.workbuddy.host',
  oauthRelayBaseUrl: 'https://www.workbuddy.cn/v2/as/genie-baas/oauth',
  publishableKey: 'wbpk_NHWfU1y1zIFSXtjU02OiJc_FQDT2qnSoJeO9MtoZpPpsBOII0UrKJy0'
};
</script>"""


def read(p):
    with io.open(p, 'r', encoding='utf-8') as f:
        return f.read()


def write(p, s):
    with io.open(p, 'w', encoding='utf-8', newline='\n') as f:
        f.write(s)


def main():
    sdk = read(SDK_PATH)
    sdk_block = ('<!-- 云 SDK 内联（vendor/workbuddy-cloud.js），避免子资源 403 -->\n'
                 '<script>\n' + sdk + '\n</script>')

    # 匹配原有的任意一种外链写法（config.js 外链 + cdn 外链），整段替换
    pattern = re.compile(
        r'[ \t]*<script src="config\.js"></script>\s*\r?\n'
        r'[ \t]*<script src="https?://[^"]*workbuddy-cloud-sdk[^"]*"></script>',
        re.I)

    for name in ('index.html', 'admin.html'):
        path = os.path.join(BASE, name)
        html = read(path)

        if 'workbuddy-cloud-sdk' in html or '<script src="config.js">' in html:
            repl = CONFIG_BLOCK + '\n' + sdk_block
            new, n = pattern.subn(lambda m: repl, html)
            if n == 0:
                print('!! %s 未匹配到外链片段，请手工检查' % name)
                continue
            write(path, new)
            print('OK %s 已内联（替换 %d 处），%d 字节' % (name, n, os.path.getsize(path)))
        else:
            print('-- %s 已是内联状态，跳过' % name)


if __name__ == '__main__':
    main()
