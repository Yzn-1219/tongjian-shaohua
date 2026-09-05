// ============================================================
// 童健韶华 AI 助手 —— 通义千问代理（Cloudflare Worker）
// 作用：隐藏 API Key，前端只调用此 Worker，密钥存于环境变量。
// 部署：Cloudflare 面板「Workers」→ 新建 → 粘贴本文件 →
//       在「设置 → 变量」中添加 DASHSCOPE_KEY = 你的 sk-...
//       保存后获得 *.workers.dev 地址，填入助手的「设置」。
// ============================================================
export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: cors });

    let body;
    try { body = await request.json(); } catch (e) { return new Response('Bad JSON', { status: 400, headers: cors }); }

    const prompt = body.prompt || (body.input && body.input.messages && body.input.messages[0].content);
    const model = body.model || 'qwen-turbo';
    if (!prompt) return new Response('Missing prompt', { status: 400, headers: cors });
    if (!env.DASHSCOPE_KEY) return new Response('Server missing DASHSCOPE_KEY', { status: 500, headers: cors });

    const upstream = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + env.DASHSCOPE_KEY
      },
      body: JSON.stringify({
        model: model,
        input: { messages: [{ role: 'user', content: prompt }] },
        parameters: { result_format: 'message' }
      })
    });
    const data = await upstream.json();
    const content = data && data.output && data.output.choices && data.output.choices[0].message.content;
    return new Response(JSON.stringify({ content: content || '' }), {
      status: 200,
      headers: Object.assign({ 'Content-Type': 'application/json' }, cors)
    });
  }
};
