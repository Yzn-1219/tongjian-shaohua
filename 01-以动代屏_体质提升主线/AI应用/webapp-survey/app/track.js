/**
 * 使用埋点 —— 把「App 被打开」「AI 被调用」写进云端 app_events 表。
 *
 * 设计要点：
 * - 不引 SDK，直接用 fetch 打数据面接口（只需 publishableKey 头），十几行就够；
 * - 批量 + 延迟发送，不阻塞任何用户操作；
 * - 只记录模块、模型名、token 数、耗时、成败，**绝不记录 API Key、提示词和报告内容**；
 * - 任何异常都吞掉——统计失败不能影响用户使用。
 */
(function () {
  var ENDPOINT = 'https://tjsh-survey.app.workbuddy.host/.cloud/database/rest/app_events';
  var KEY = 'wbpk_NHWfU1y1zIFSXtjU02OiJc_FQDT2qnSoJeO9MtoZpPpsBOII0UrKJy0';

  var queue = [];
  var timer = null;

  function send(row) {
    try {
      fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wb-webapp-access-key': KEY,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(row),
        keepalive: true
      }).catch(function () {});
    } catch (e) { /* 静默 */ }
  }

  function flush() {
    timer = null;
    if (!queue.length) return;
    var batch = queue.splice(0, 20);
    for (var i = 0; i < batch.length; i++) send(batch[i]);
  }

  function track(app, action, extra) {
    try {
      var row = { app: app, action: action };
      if (extra) {
        for (var k in extra) {
          var v = extra[k];
          if (v === undefined || v === null || v === '') continue;
          if (typeof v === 'string') v = v.slice(0, 200);
          row[k] = v;
        }
      }
      if (row.ms !== undefined) row.ms = Math.round(row.ms);
      queue.push(row);
      if (!timer) timer = setTimeout(flush, 1000);
    } catch (e) { /* 静默 */ }
  }

  // 离开页面时把残留的发出去
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') flush();
  });

  window.Track = { track: track, flush: flush };
})();
