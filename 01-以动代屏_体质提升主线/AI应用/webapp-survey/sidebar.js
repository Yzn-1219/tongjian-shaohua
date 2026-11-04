/* ==========================================================================
   童健韶华 · 全站左侧项目栏（DOM 生成 + 高亮 + 抽屉 + sharecode 继承）
   —— 四个页面共用这一份，改菜单只改下面的 ITEMS 数组。
   页面只需要：
     1) <link rel="stylesheet" href="sidebar.css">（app/ 下用 ../sidebar.css）
     2) <body class="has-sidebar" data-page="survey">（app/ 再加 is-app）
     3) 手机端菜单按钮：<button class="sb-toggle" id="sbToggle">（app 若没有会自动插入）
     4) <script src="sidebar.js"></script>（app/ 下用 ../sidebar.js）
   ========================================================================== */
(function () {
  'use strict';

  // /** 菜单定义：g = 分组标题，其余为一项 */
  var ITEMS = [
    { g: '智能功能' },
    { k: 'xiaotong', i: '🤖', t: 'AI 小童',  h: 'xiaotong.html' },
    { k: 'assess',   i: '📋', t: '体质评估', h: 'app/?page=assess' },
    { k: 'coach',    i: '🤔', t: 'AI 教练',  h: 'app/?page=coach' },
    { g: '健康管理' },
    { k: 'training', i: '💪', t: '训练打卡', h: 'app/?page=training' },
    { k: 'body',     i: '⚖️', t: '身体数据', h: 'app/?page=body' },
    { k: 'survey',   i: '📝', t: '体质问卷', h: 'index.html' },
    { g: '更多' },
    { k: 'home',     i: '🏠', t: '应用首页', h: 'app/' },
    { k: 'about',    i: 'ℹ️', t: '关于我们', h: 'about.html' },
    { k: 'guide',    i: '📘', t: '使用指引', h: 'guide.html' },
    { k: 'settings', i: '⚙️', t: '设置',     h: 'app/?page=settings' },
    { k: 'api',      i: '🔌', t: 'AI 服务',  h: 'app/?page=settings&focus=api' }
  ];

  // 本文件所在目录（绝对 URL），这样在 app/ 子目录里也能正确指向根目录页面
  var me = document.currentScript ||
    [].slice.call(document.querySelectorAll('script[src*="sidebar.js"]')).pop();
  var BASE = me ? me.src.replace(/sidebar\.js(\?.*)?$/, '') : '';

  var sc = '';
  try { sc = new URLSearchParams(location.search).get('sharecode') || ''; } catch (e) {}

  function link(h) {
    var url = BASE + h;
    if (!sc) return url;
    return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'sharecode=' + encodeURIComponent(sc);
  }

  var cur = document.body.getAttribute('data-page') || '';

  // ---------- 生成侧栏 ----------
  var aside = document.createElement('aside');
  aside.className = 'sidebar';
  aside.id = 'sidebar';

  var html = '<div class="sb-brand">' +
    '<img src="' + BASE + 'assets/logo.png" alt="童健韶华队徽" />' +
    '<div><b>童健韶华</b><span>AI 智能健康</span></div></div>';

  ITEMS.forEach(function (it) {
    if (it.g) { html += '<div class="sb-group">' + it.g + '</div>'; return; }
    html += '<a class="sb-item" data-nav="' + it.k + '" href="#" rel="nofollow">' +
      '<i>' + it.i + '</i><span>' + it.t + '</span></a>';
  });

  html += '<div class="sb-foot">山东药品食品职业学院<br />质量管理系 ·「童健韶华」志愿服务队' +
    '<div class="sb-ver" id="sbVer">版本 —</div></div>';
  aside.innerHTML = html;

  // ---------- 版本号（唯一来源：根目录 version.js）----------
  (function () {
    function paint() {
      var el = document.getElementById('sbVer');
      if (!el || !window.TJSH_VER) return;
      el.textContent = '版本 ' + window.TJSH_VER + ' · ' + (window.TJSH_DATE || '');
      el.title = window.TJSH_NOTE || '';
    }
    if (window.TJSH_VER) { paint(); }
    else {
      var vs = document.createElement('script');
      vs.src = BASE + 'version.js';
      vs.onload = paint;
      document.head.appendChild(vs);
    }
  })();

  var mask = document.createElement('div');
  mask.className = 'sb-mask';
  mask.id = 'sbMask';

  document.body.appendChild(aside);
  document.body.appendChild(mask);

  // ---------- 填链接 ----------
  var nodes = aside.querySelectorAll('.sb-item');
  var byKey = {};
  ITEMS.forEach(function (it, idx) {
    if (it.g) return;
    byKey[it.k] = null;
  });

  Array.prototype.forEach.call(nodes, function (a) {
    var k = a.getAttribute('data-nav');
    var def = null;
    for (var i = 0; i < ITEMS.length; i++) {
      if (ITEMS[i].k === k) { def = ITEMS[i]; break; }
    }
    if (!def) return;
    byKey[k] = a;
    if (k === cur) return;                 // 当前页：保持 # 并在下面阻止跳转
    a.href = link(def.h);
  });

  // ---------- 高亮 ----------
  function mark(key) {
    Array.prototype.forEach.call(nodes, function (a) {
      a.classList.toggle('on', a.getAttribute('data-nav') === key);
    });
  }
  mark(cur);

  // ---------- 抽屉 ----------
  var btn = document.getElementById('sbToggle');
  if (!btn) {
    // App 页的头部结构不同，自动插一个菜单按钮
    var brand = document.querySelector('.app-header .brand');
    if (brand) {
      btn = document.createElement('button');
      btn.className = 'sb-toggle';
      btn.id = 'sbToggle';
      btn.setAttribute('aria-label', '打开菜单');
      btn.innerHTML = '<span></span><span></span><span></span>';
      brand.insertBefore(btn, brand.firstChild);
    }
  }
  function open(v) {
    aside.classList.toggle('open', v);
    mask.classList.toggle('on', v);
  }
  if (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      open(!aside.classList.contains('open'));
    });
  }
  mask.addEventListener('click', function () { open(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') open(false); });

  // 点当前页那一项：不跳转，只收抽屉
  aside.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('.sb-item') : null;
    if (a && a.getAttribute('data-nav') === cur) e.preventDefault();
    open(false);
  });

  // ---------- App 页：跟着底部标签切换高亮 ----------
  var view = document.getElementById('view');
  if (view) {
    function sync() {
      var act = view.querySelector('.page.active');
      if (!act) return;
      var k = act.id.replace(/^page-/, '');
      if (k !== cur) { cur = k; mark(k); }
    }
    sync();
    try {
      new MutationObserver(sync).observe(view, {
        subtree: true, attributes: true, attributeFilter: ['class']
      });
    } catch (e) {
      setInterval(sync, 500);
    }
  }

  window.Sidebar = { mark: mark, open: open, items: ITEMS };

  // ---------- 手机端一次性提示 ----------
  // 屏幕窄的时候项目栏是收起的，很多人不知道左上角能点开，所以第一次进 App 提示一次。
  (function () {
    if (!document.getElementById('view')) return;          // 只在 App 页提示
    if (window.innerWidth >= 900) return;                  // 桌面端侧栏常驻，不用提示
    try {
      if (localStorage.getItem('tjsh_hint_nav') === '1') return;
      localStorage.setItem('tjsh_hint_nav', '1');
    } catch (e) { return; }

    var hint = document.createElement('div');
    hint.className = 'sb-hint';
    hint.textContent = '点左上角 ≡ 可以跳到体质问卷、AI 小童、关于我们';
    document.body.appendChild(hint);
    setTimeout(function () { hint.classList.add('on'); }, 900);
    setTimeout(function () { hint.classList.remove('on'); }, 6500);
    setTimeout(function () { if (hint.parentNode) hint.parentNode.removeChild(hint); }, 7200);
    if (btn) btn.addEventListener('click', function () { hint.classList.remove('on'); }, { once: true });
  })();
})();
