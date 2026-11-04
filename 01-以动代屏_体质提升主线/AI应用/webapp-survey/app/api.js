/* ==========================================================================
   统一的 AI 接入层 —— 全站所有要用 AI 的地方都走这里
   --------------------------------------------------------------------------
   两套来源，用户在「设置 → AI 服务」里选：
     1. 本站默认（default-api.js）：输一次调用码就能用，无需自己申请 Key
     2. 我自己的 API：填自己的 Key；接口地址可留空用通义千问，也可填中转站
        （OpenAI 兼容格式，如 https://xxx/v1/chat/completions）

   对外接口：
     ApiCfg.mode()            当前模式 'default' | 'own'
     ApiCfg.ready()           现在能不能调（默认模式要已解锁）
     ApiCfg.key() / model() / endpoint()
     ApiCfg.unlock(code)      验证调用码
     ApiCfg.chat(messages, {maxTokens, temperature, model})  → { text, usage }
   依赖：default-api.js 必须先加载。
   ========================================================================== */
(function () {
  'use strict';

  var D = window.DEFAULT_API || {};

  function decode(enc) {
    try { return atob(String(enc || '').split('').reverse().join('')); }
    catch (e) { return ''; }
  }
  var DEFAULT_KEY = decode(D.keyEnc);
  var DEFAULT_CODE = (D.code || 'tjsh2026').toLowerCase();

  /* ---- 云端可改配置：后台页面维护，优先级高于文件内置值 ---- */
  var CFG_URL = 'https://tjsh-survey.app.workbuddy.host/.cloud/database/rest/app_config';
  var WBKEY = 'wbpk_NHWfU1y1zIFSXtjU02OiJc_FQDT2qnSoJeO9MtoZpPpsBOII0UrKJy0';
  var REMOTE = null;     // { name, endpoint, model, key, code }
  var remoteP = null;

  function applyRemote(cfg) {
    if (!cfg) return;
    REMOTE = cfg;
    if (cfg.name) ApiCfg.defaultName = cfg.name;
    if (cfg.model) ApiCfg.defaultModel = cfg.model;
    ApiCfg.defaultReady = !!(cfg.key || DEFAULT_KEY);
    if (cfg.code) DEFAULT_CODE = String(cfg.code).trim().toLowerCase();
  }

  var K = {
    mode: 'fitness_apimode',      // 'default' | 'own'
    code: 'fitness_code_ok',      // '1' 已解锁
    ownKey: 'fitness_apikey',
    endpoint: 'fitness_endpoint',
    model: 'fitness_model'
  };

  function get(k, def) {
    try { var v = localStorage.getItem(k); return v === null ? (def || '') : v; }
    catch (e) { return def || ''; }
  }
  function set(k, v) {
    try { if (v === null || v === undefined || v === '') localStorage.removeItem(k); else localStorage.setItem(k, v); }
    catch (e) {}
  }

  var ApiCfg = {
    defaultReady: !!DEFAULT_KEY,
    defaultName: D.name || '本站默认 API',
    defaultModel: D.model || 'qwen-flash',

    mode: function () {
      var m = get(K.mode, 'default');
      return m === 'own' ? 'own' : 'default';
    },
    setMode: function (m) {
      set(K.mode, m === 'own' ? 'own' : 'default');
      render();
      if (m === 'own') {
        var el = document.getElementById('apiKey');
        if (el) el.value = get(K.ownKey, '');
      }
    },

    unlocked: function () { return get(K.code, '') === '1'; },
    unlock: function (code) {
      var ok = String(code || '').trim().toLowerCase() === DEFAULT_CODE;
      if (ok) set(K.code, '1');
      render();
      return ok;
    },
    lock: function () { set(K.code, ''); render(); },

    key: function () {
      if (this.mode() === 'default') return this.unlocked() ? ((REMOTE && REMOTE.key) || DEFAULT_KEY) : '';
      return get(K.ownKey, '');
    },
    endpoint: function () {
      if (this.mode() === 'default') return (REMOTE && REMOTE.endpoint) || D.endpoint || '';
      return get(K.endpoint, '') || (REMOTE && REMOTE.endpoint) || D.endpoint || '';
    },
    model: function () {
      if (this.mode() === 'default') return this.defaultModel;
      return get(K.model, '') || this.defaultModel;
    },
    ready: function () { return !!this.key(); },

    // 状态文案，给各个页面直接拿去显示
    statusText: function () {
      if (this.mode() === 'default') {
        if (!this.defaultReady) return '本站默认 API 还没配置好，请联系管理员';
        return this.unlocked() ? ('正在使用「' + this.defaultName + '」· ' + this.defaultModel)
                               : '还没输调用码，输入后即可使用本站默认 API';
      }
      var k = get(K.ownKey, '');
      return k ? ('正在使用「我自己的 API」· ' + this.model()) : '还没填自己的 API Key';
    },

    /* ---------- 从云端拉最新默认配置（失败就用文件内置值，不报错） ---------- */
    load: function (force) {
      if (remoteP && !force) return remoteP;
      remoteP = fetch(CFG_URL + '?select=k,v', { headers: { 'x-wb-webapp-access-key': WBKEY } })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (rows) {
          var row = (rows || []).filter(function (x) { return x.k === 'ai'; })[0];
          if (!row || !row.v) return null;
          var cfg = JSON.parse(row.v);
          applyRemote(cfg);
          render();
          return cfg;
        })
        .catch(function () { return null; });
      return remoteP;
    },
    remote: function () { return REMOTE; },

    /* ---------- 真正发请求：自动区分通义千问原生 / OpenAI 兼容 ---------- */
    chat: function (messages, opt) {
      var self = this;
      return this.load().then(function () { return self._chat(messages, opt); });
    },

    _chat: function (messages, opt) {
      opt = opt || {};
      var self = this;
      var key = this.key();
      if (!key) return Promise.reject(new Error('NOKEY'));

      var ep = this.endpoint();
      var model = opt.model || this.model();
      var native = /\/services\/aigc\/text-generation\/generation/.test(ep);
      var body;

      if (native) {
        body = { model: model, input: { messages: messages }, parameters: { result_format: 'message' } };
        if (opt.maxTokens) body.parameters.max_tokens = opt.maxTokens;
        if (opt.temperature !== undefined) body.parameters.temperature = opt.temperature;
      } else {
        body = { model: model, messages: messages, stream: false };
        if (opt.maxTokens) body.max_tokens = opt.maxTokens;
        if (opt.temperature !== undefined) body.temperature = opt.temperature;
      }

      return fetch(ep, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
        body: JSON.stringify(body)
      }).then(function (r) {
        if (!r.ok) {
          var err = new Error('接口返回 ' + r.status);
          err.status = r.status;
          throw err;
        }
        return r.json();
      }).then(function (j) {
        var text = native
          ? (j.output && j.output.choices && j.output.choices[0] && j.output.choices[0].message.content)
          : (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content);
        var u = j.usage || {};
        return {
          text: text || '',
          model: model,
          usage: {
            input_tokens: u.input_tokens || u.prompt_tokens || 0,
            output_tokens: u.output_tokens || u.completion_tokens || 0
          }
        };
      });
    }
  };

  window.ApiCfg = ApiCfg;
  // 页面一打开就预拉云端配置，等用户输调用码时已经就绪
  setTimeout(function () { try { ApiCfg.load(); } catch (e) {} }, 0);

  /* ======================= 设置页 UI ======================= */
  var FUNCS = [
    { icon: '🤖', name: 'AI 小童', desc: '综合问答（体测 / 奖助 / 锻炼）' },
    { icon: '📋', name: '体质评估', desc: '生成体质报告与运动建议' },
    { icon: '🤔', name: 'AI 教练', desc: '按训练记录给阶段建议' }
  ];

  function $(id) { return document.getElementById(id); }

  function render() {
    var mode = ApiCfg.mode();
    var ready = ApiCfg.ready();

    var cur = $('apiCurrent');
    if (cur) {
      cur.textContent = ApiCfg.statusText();
      cur.className = 'api-current ' + (ready ? 'ok' : 'warn');
    }

    var rd = $('apiModeDefault'), ro = $('apiModeOwn');
    if (rd) rd.checked = mode === 'default';
    if (ro) ro.checked = mode === 'own';
    var labels = document.querySelectorAll('.api-mode');
    if (labels.length === 2) {
      labels[0].classList.toggle('on', mode === 'default');
      labels[1].classList.toggle('on', mode === 'own');
    }

    var bd = $('apiDefaultBox'), bo = $('apiOwnBox');
    if (bd) bd.hidden = mode !== 'default';
    if (bo) bo.hidden = mode !== 'own';

    var cs = $('apiCodeStatus');
    if (cs) {
      if (!ApiCfg.defaultReady) {
        cs.textContent = '⚠️ 本站默认 API 尚未配置 Key';
        cs.className = 'cfg-status bad';
      } else if (ApiCfg.unlocked()) {
        cs.textContent = '✓ 已解锁，可以直接使用';
        cs.className = 'cfg-status good';
      } else {
        cs.textContent = '需要输入调用码才能使用';
        cs.className = 'cfg-status';
      }
    }
    var cb = $('apiCodeBtn');
    if (cb) cb.textContent = ApiCfg.unlocked() ? '已解锁' : '解锁';

    var ks = $('keyStatus');
    if (ks) {
      var own = get(K.ownKey, '');
      ks.textContent = own ? '✓ 已填入自己的 Key（只存在本机）' : '填好后自动生效，不用点保存';
    }
    var mi = $('modelName');
    if (mi && !mi.value) mi.value = get(K.model, '') || ApiCfg.defaultModel;
    var ei = $('apiEndpoint');
    if (ei) ei.value = get(K.endpoint, '');

    var list = $('apiFuncList');
    if (list) {
      var badge = mode === 'default'
        ? (ready ? '本站默认 · 可用' : '本站默认 · 待解锁')
        : (ready ? '自己的 Key · 可用' : '自己的 Key · 未填');
      list.innerHTML = FUNCS.map(function (f) {
        return '<div class="api-func">' +
          '<span class="af-ic">' + f.icon + '</span>' +
          '<span class="af-tx"><b>' + f.name + '</b><small>' + f.desc + '</small></span>' +
          '<span class="af-tag ' + (ready ? 'ok' : 'warn') + '">' + badge + '</span>' +
          '</div>';
      }).join('');
    }
  }

  function bind() {
    if (!$('apiModeDefault')) return;

    $('apiModeDefault').addEventListener('change', function () { ApiCfg.setMode('default'); });
    $('apiModeOwn').addEventListener('change', function () { ApiCfg.setMode('own'); });

    var btn = $('apiCodeBtn'), inp = $('apiCode');
    function doUnlock() {
      if (!inp) return;
      var v = inp.value.trim();
      if (!v) { inp.focus(); return; }
      if (ApiCfg.unlock(v)) {
        inp.value = '';
        if (window.toast) toast('调用码正确，本站默认 API 已解锁');
      } else {
        var cs = $('apiCodeStatus');
        if (cs) { cs.textContent = '调用码不对，再试一次'; cs.className = 'cfg-status bad'; }
        if (window.toast) toast('调用码不对');
      }
    }
    if (btn) btn.addEventListener('click', doUnlock);
    if (inp) inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') doUnlock(); });

    var lk = $('apiCodeReset');
    if (lk) lk.addEventListener('click', function () { ApiCfg.lock(); if (window.toast) toast('已锁定默认 API'); });

    var ei = $('apiEndpoint');
    if (ei) {
      var saveEp = function () { set(K.endpoint, ei.value.trim()); render(); };
      ei.addEventListener('change', saveEp);
      ei.addEventListener('blur', saveEp);
    }

    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
