/* ==========================================================================
   童健韶华 · AI 未连接提示
   --------------------------------------------------------------------------
   任何 AI 调用「没成」的时候（没配 Key / 没解锁 / Key 失效 / 断网 / 接口地址不通），
   统一弹一张小卡片：说明现在没连上 AI，并给一个按钮**一键跳到「设置 → AI 服务」**。

   用法（三个 AI 入口共用这一份）：
     AINotice.check(err)        传错误对象，自动判断类型并弹卡，返回类型字符串
     AINotice.show({ kind:'nokey' })  直接指定类型
     AINotice.nokey()           还没配 Key 时的快捷入口
     AINotice.hide() / .go()    关掉 / 跳去配置

   kind：nokey（没配）· auth（Key 失效 401/403）· rate（太频繁 429）
         network（断网/地址不通）· unknown（其它）
   ========================================================================== */
(function () {
  'use strict';

  var me = document.currentScript ||
    [].slice.call(document.querySelectorAll('script[src*="ai-notice.js"]')).pop();
  var BASE = me ? me.src.replace(/ai-notice\.js(\?.*)?$/, '') : '';

  function sharecode() {
    try { return new URLSearchParams(location.search).get('sharecode') || ''; } catch (e) { return ''; }
  }

  function apiUrl() {
    var u = BASE + 'app/?page=settings&focus=api';
    var sc = sharecode();
    return sc ? u + '&sharecode=' + encodeURIComponent(sc) : u;
  }

  var COPY = {
    nokey: {
      icon: '🔌',
      title: '当前还没有连接到 AI',
      desc: '还没有可用的 API。点下面的按钮去配一下，配好就能直接用。',
      btn: '去配置 AI 服务 →'
    },
    auth: {
      icon: '🔑',
      title: 'AI 服务没通过验证',
      desc: 'API Key 可能失效、填错，或者额度用完了（401/403）。去 AI 服务那一栏换一个 Key 试试。',
      btn: '去检查 AI 服务 →'
    },
    rate: {
      icon: '⏳',
      title: 'AI 现在有点忙',
      desc: '调用太频繁被限流了（429）。等十几秒再点一次就好，不用改设置。',
      btn: '知道了'
    },
    network: {
      icon: '📡',
      title: '没有连上 AI',
      desc: '请求没发出去，可能是断网、校园网拦截，或接口地址不通。检查网络后重试，也可以去 AI 服务换一个接口地址。',
      btn: '去检查 AI 服务 →'
    },
    unknown: {
      icon: '⚠️',
      title: 'AI 调用失败了',
      desc: '这次没拿到结果。可以先重试一次；一直不行就去 AI 服务看看配置。',
      btn: '去检查 AI 服务 →'
    }
  };

  var CSS = [
    '.ai-notice{position:fixed;left:50%;bottom:96px;transform:translate(-50%,14px);',
    'width:calc(100% - 32px);max-width:430px;z-index:9999;box-sizing:border-box;',
    'background:#fff;border:1px solid #E2E8F0;border-left:4px solid #EA580C;border-radius:14px;',
    'box-shadow:0 12px 32px rgba(15,23,42,.16);padding:14px 15px 13px;',
    'font-family:"PingFang SC","Microsoft YaHei",system-ui,sans-serif;',
    'opacity:0;pointer-events:none;transition:opacity .22s,transform .22s}',
    '.ai-notice.on{opacity:1;pointer-events:auto;transform:translate(-50%,0)}',
    '.ai-notice .an-head{display:flex;align-items:flex-start;gap:9px}',
    '.ai-notice .an-ic{font-size:19px;line-height:1.2;flex:0 0 auto}',
    '.ai-notice .an-tt{font-size:14.5px;font-weight:700;color:#0F172A;margin:0 0 3px}',
    '.ai-notice .an-ds{font-size:12.5px;color:#64748B;line-height:1.6;margin:0}',
    '.ai-notice .an-x{position:absolute;top:9px;right:10px;border:0;background:transparent;',
    'color:#94A3B8;font-size:17px;line-height:1;cursor:pointer;padding:4px}',
    '.ai-notice .an-act{display:flex;gap:8px;margin-top:11px}',
    '.ai-notice .an-go{flex:1;border:0;border-radius:10px;background:#159c84;color:#fff;',
    'font-size:13px;font-weight:700;padding:10px 12px;cursor:pointer;font-family:inherit}',
    '.ai-notice .an-go:active{transform:scale(.98)}',
    '@media (min-width:900px){body.has-sidebar .ai-notice{left:calc(50% + 116px)}}',
    '.ai-notice.inline{position:static;left:auto;bottom:auto;transform:none;width:auto;max-width:none;',
    'opacity:1;pointer-events:auto;box-shadow:none;margin:14px 0 10px;border-left-width:4px}',
    '.ai-notice.inline .an-act{margin-top:9px}',
    '.ai-notice.inline .an-go{flex:0 0 auto;padding:9px 16px;text-decoration:none;display:inline-block}'
  ].join('');

  function injectCss() {
    if (document.getElementById('aiNoticeCss')) return;
    var st = document.createElement('style');
    st.id = 'aiNoticeCss';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  var box = null, timer = null;

  function ensure() {
    if (box) return box;
    injectCss();
    box = document.createElement('div');
    box.className = 'ai-notice';
    box.id = 'aiNotice';
    box.setAttribute('role', 'alert');
    document.body.appendChild(box);
    return box;
  }

  function hide() {
    if (!box) return;
    box.classList.remove('on');
    clearTimeout(timer);
  }

  function paint(el, opt) {
    opt = opt || {};
    var kind = opt.kind || 'unknown';
    var c = COPY[kind] || COPY.unknown;
    var showBtn = kind !== 'rate';

    el.innerHTML =
      '<button class="an-x" type="button" aria-label="关闭">×</button>' +
      '<div class="an-head"><span class="an-ic">' + c.icon + '</span>' +
      '<div><p class="an-tt">' + (opt.title || c.title) + '</p>' +
      '<p class="an-ds">' + (opt.desc || c.desc) + '</p></div></div>' +
      '<div class="an-act">' +
      (showBtn
        ? '<button class="an-go" type="button">' + (opt.btn || c.btn) + '</button>'
        : '<button class="an-go an-ok" type="button" style="background:#E2E8F0;color:#334155">' + (opt.btn || c.btn) + '</button>') +
      '</div>';

    var x = el.querySelector('.an-x');
    if (x) x.addEventListener('click', hide);
    var go = el.querySelector('.an-go');
    if (go) go.addEventListener('click', function () {
      if (showBtn) { API.go(); } else { hide(); }
    });

    return kind;
  }

  function show(opt) {
    var el = ensure();
    var kind = paint(el, opt);
    el.style.transform = 'translate(-50%,14px)';
    el.offsetHeight;                     // 触发一次重排，动画才会跑
    el.classList.add('on');
    clearTimeout(timer);
    if (opt && opt.autoHide) timer = setTimeout(hide, opt.autoHide);
    return kind;
  }

  // 内联版：渲染到页面里的某个容器（小童页底部有输入框，浮层会挡住，所以用这个）
  function showInline(target, opt) {
    if (!target) return show(opt);
    injectCss();
    var el = document.createElement('div');
    el.className = 'ai-notice inline';
    target.innerHTML = '';
    target.appendChild(el);
    return paint(el, opt);
  }

  // 跳转：在 App 里就切到「设置」并滚到那张卡；在别的页面就整页跳过去
  function go() {
    hide();
    var isApp = document.body && document.body.classList.contains('is-app');
    var tab = document.querySelector('.tab[data-page="settings"]');
    if (isApp && tab) {
      tab.click();
      setTimeout(function () {
        var card = document.getElementById('apiCard');
        if (!card) return;
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.style.transition = 'box-shadow .45s';
        card.style.boxShadow = '0 0 0 3px rgba(21,156,132,.45)';
        setTimeout(function () { card.style.boxShadow = ''; }, 1600);
      }, 320);
      return;
    }
    location.href = apiUrl();
  }

  // 判断错误属于哪一类
  function classify(err) {
    var m = String((err && err.message) || err || '');
    var st = err && (err.status || err.statusCode);
    if (/NOKEY/i.test(m)) return 'nokey';
    if (st === 401 || st === 403) return 'auth';
    if (st === 429) return 'rate';
    if (/\b40[13]\b/.test(m)) return 'auth';
    if (/\b429\b/.test(m)) return 'rate';
    if (/Failed to fetch|NetworkError|Load failed|ERR_|timeout|timed out|网络|超时/i.test(m)) return 'network';
    if (!st && /fetch|network|connect/i.test(m)) return 'network';
    return 'unknown';
  }

  var API = {
    show: show,
    hide: hide,
    go: go,
    classify: classify,
    // 传错误对象：判断类型 → 弹卡 → 返回类型
    check: function (err) { return show({ kind: classify(err) }); },
    // 内联版（小童页用）：渲染到指定容器里，不浮动
    showInline: showInline,
    checkInline: function (target, err) { return showInline(target, { kind: classify(err) }); },
    // 还没配 Key（请求都没发出去）
    nokey: function () { return show({ kind: 'nokey' }); },
    url: apiUrl
  };

  window.AINotice = API;
})();
