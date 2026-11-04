/* ==========================================================================
   本站默认 API —— 由「童健韶华」志愿服务队统一提供
   --------------------------------------------------------------------------
   学生打开页面不需要自己申请 Key：在「设置 → AI 服务」里选「本站默认」，
   输入调用码（tjsh2026）即可直接使用。

   ⚠️ 安全说明（重要，别删）：
   keyEnc 只是把 Key 做了 base64 + 倒序，**不是加密**。任何会看网页源码的人
   都能还原出来。调用码也写在文件里，所以这是一道「防误用」的门，不是「防盗」
   的墙。真要防止 Key 被拿走，必须改成后端代理（中转站 / Cloudflare Worker），
   那就不是纯静态站能解决的事了。详见《后期计划_Cloudflare迁移.md》。

   换 Key 的方法：
     1. 用 Python 算编码：base64.b64encode(key.encode()).decode()[::-1]
     2. 把结果替换下面 keyEnc 的值，重新发布即可
   ========================================================================== */
window.DEFAULT_API = {
  name: '通义千问 · 本站默认',
  endpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
  model: 'qwen-flash',          // qwen-turbo 免费额度已限流，改用它
  code: 'tjsh2026',             // 调用码
  keyEnc: '=ITMkNTNwQTM2QTZhVGN1kTZhNGNzI2MyUTOzkzN4E2Yts2c'
};
