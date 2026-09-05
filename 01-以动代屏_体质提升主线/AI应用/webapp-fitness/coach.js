// ===== AI 健身教练 + 目标进度 =====
const Coach = (function() {

  function init() {
    document.getElementById('coachBtn').addEventListener('click', generate);
  }

  async function generate() {
    const btn = document.getElementById('coachBtn');
    const result = document.getElementById('coachResult');
    const key = App.getApiKey();

    btn.disabled = true;
    btn.textContent = '🤔 AI 教练正在分析…';
    result.hidden = false;
    result.innerHTML = '<div class="loading-tip">正在分析训练数据，请稍候…</div>';

    if (!key) {
      renderLocalStats();
      btn.disabled = false;
      btn.textContent = '🤔 生成教练分析';
      return;
    }

    try {
      // 收集数据
      const trainings = await DB.getRecentTrainings(20);
      const bodyData = await DB.getRecentBodyData(5);
      const cfg = App.getConfig();

      if (trainings.length === 0) {
        result.innerHTML = '<div class="loading-tip">暂无训练数据，请先记录训练</div>';
        btn.disabled = false;
        btn.textContent = '🤔 生成教练分析';
        return;
      }

      // 数据摘要（喂给 AI + 页面展示）
      const nonRest = trainings.filter(t => !t.isRest);
      const totalMin = nonRest.reduce((s, t) => s + (t.duration || 0), 0);
      const totalCal = nonRest.reduce((s, t) => s + (t.calories || 0), 0);

      // 构造 prompt
      const sysPrompt = `你是专业私人健身教练 AI。基于用户的训练记录和身体数据，给出结构化报告，必须按以下三个一级标题分段（使用 Markdown 二级标题）：

## 本周训练分析
分析本周训练频率、总时长、消耗、覆盖部位、薄弱环节与亮点，用 2-4 句话概括，必要时用要点列出。

## 明日训练建议
给出明天的训练部位、推荐动作、组次次数、预计时长。请用 Markdown 表格列出，表头为：动作 | 部位 | 组次 | 次数 | 时长(分)。

## 营养建议
结合用户目标与本周训练量，给出每日热量与蛋白质摄入建议、饮食搭配要点，用要点列出。

要求：语言简洁专业、有可操作性，不要空话套话；数字尽量具体；全程使用中文。`;

      const trainingSummary = trainings.map(t => {
        const d = new Date(t.created_at);
        return `${t.date} ${t.part}: ${t.exercises} (${t.duration}min, ${t.calories}kcal)${t.isRest ? ' [休息日]' : ''}`;
      }).join('\n');

      const bodySummary = bodyData.length > 0 ?
        bodyData.map(b => `${b.date}: 体重${b.weight||'?'}kg 体脂${b.body_fat||'?'}% BMI${b.bmi||'?'}`).join('\n') : '暂无身体数据';

      const userPrompt = `【基础数据】
身高: ${cfg.height||'?'}cm  体重: ${cfg.weight||'?'}kg  体脂: ${cfg.bodyFat||'?'}%  年龄: ${cfg.age||'?'}  性别: ${cfg.gender==='male'?'男':'女'}

【训练目标】
目标: ${cfg.goal||'maintain'}  目标体重: ${cfg.targetWeight||'?'}kg  每周频率: ${cfg.weeklyFreq||'?'}次

【营养目标】
每日热量: ${cfg.dailyCalories||'?'}kcal  蛋白质: ${cfg.dailyProtein||'?'}g

【最近训练记录】
${trainingSummary}

【最近身体数据】
${bodySummary}`;

      const resp = await callAI(key, sysPrompt, userPrompt);

      const meta = {
        trainCount: nonRest.length,
        totalMin,
        totalCal,
        hasKey: true
      };
      renderStructuredReport(resp, meta);

      // 目标进度
      await renderGoalProgress(cfg, bodyData);

    } catch (e) {
      result.innerHTML = `<div class="loading-tip">分析失败：${e.message}<br><br>已切换为本地统计模式：</div>`;
      renderLocalStats();
    }

    btn.disabled = false;
    btn.textContent = '🤔 生成教练分析';
  }

  async function callAI(key, sysPrompt, userPrompt) {
    const model = App.getModel();
    const resp = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + key
      },
      body: JSON.stringify({
        model: model,
        input: { messages: [
          { role: 'system', content: sysPrompt },
          { role: 'user', content: userPrompt }
        ]},
        parameters: { result_format: 'message' }
      })
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`API ${resp.status}: ${err.slice(0, 200)}`);
    }

    const data = await resp.json();
    return data.output.choices[0].message.content;
  }

  // 把 AI 的 Markdown 报告拆成结构化卡片
  function renderStructuredReport(md, meta) {
    const result = document.getElementById('coachResult');
    const lines = (md || '').split('\n');
    const sections = [];
    let cur = null;

    for (const line of lines) {
      if (/^##\s+/.test(line.trim())) {
        if (cur && (cur.body.join('').trim() || true)) sections.push(cur);
        cur = { title: line.replace(/^##\s+/, '').replace(/^#+\s*/, '').trim(), body: [] };
      } else {
        if (!cur) cur = { title: '教练分析', body: [] };
        cur.body.push(line);
      }
    }
    if (cur) sections.push(cur);

    const iconFor = (t) => {
      if (/分析|总结|周/.test(t)) return '📊';
      if (/建议|计划|明日/.test(t)) return '💡';
      if (/营养|饮食|蛋白|热量/.test(t)) return '🥗';
      if (/注意|风险|提醒|安全/.test(t)) return '⚠️';
      return '📌';
    };

    const cards = sections.map(s => {
      const bodyMd = s.body.join('\n').trim();
      const bodyHtml = bodyMd ? marked.parse(bodyMd) : '<p class="coach-empty">（本节无内容）</p>';
      return `<div class="coach-card">
        <div class="coach-card-head">
          <span class="coach-icon">${iconFor(s.title)}</span>
          <span class="coach-card-title">${s.title}</span>
        </div>
        <div class="coach-card-body">${bodyHtml}</div>
      </div>`;
    }).join('');

    const dateStr = new Date().toLocaleString('zh-CN', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const summaryHtml = meta ? `<div class="coach-summary">
        <div class="cs-chip"><span class="cs-num">${meta.trainCount}</span><span class="cs-label">本周训练(次)</span></div>
        <div class="cs-chip"><span class="cs-num">${meta.totalMin}</span><span class="cs-label">总时长(分)</span></div>
        <div class="cs-chip"><span class="cs-num">${meta.totalCal}</span><span class="cs-label">消耗(kcal)</span></div>
      </div>` : '';

    result.innerHTML = `<div class="coach-report">
      <div class="coach-banner">
        <div class="coach-banner-title">🤖 AI 健身教练分析报告</div>
        <div class="coach-banner-date">生成于 ${dateStr}</div>
      </div>
      ${summaryHtml}
      ${cards}
    </div>`;
  }

  function renderLocalStats() {
    const result = document.getElementById('coachResult');
    DB.getRecentTrainings(7).then(trainings => {
      const nonRest = trainings.filter(t => !t.isRest);
      const totalMin = nonRest.reduce((s, t) => s + (t.duration || 0), 0);
      const totalCal = nonRest.reduce((s, t) => s + (t.calories || 0), 0);
      const parts = {};
      nonRest.forEach(t => { parts[t.part] = (parts[t.part] || 0) + 1; });
      const partList = Object.entries(parts).map(([p, c]) => `${p}(${c}次)`).join('、');

      const md = `### 本周训练
- **训练次数**：${nonRest.length} 次
- **训练总时长**：${totalMin} 分钟
- **消耗热量**：${totalCal} kcal
- **训练部位分布**：${partList || '暂无'}

> ⚠️ 当前未填入 API Key，以上为本地基础统计。前往「设置」扫码填入密钥后，可获得 AI 私人教练的完整分析与训练计划。`;

      result.innerHTML = `<div class="coach-report">
        <div class="coach-banner">
          <div class="coach-banner-title">📊 本地训练统计</div>
          <div class="coach-banner-date">未启用 AI 教练</div>
        </div>
        <div class="coach-card">
          <div class="coach-card-head"><span class="coach-icon">📊</span><span class="coach-card-title">本周训练概览</span></div>
          <div class="coach-card-body">${marked.parse(md)}</div>
        </div>
      </div>`;
    });
  }

  async function renderGoalProgress(cfg, bodyData) {
    const block = document.getElementById('goalProgressBlock');
    if (!cfg.targetWeight || bodyData.length === 0) {
      block.hidden = true;
      return;
    }

    const latest = bodyData[bodyData.length - 1];
    const current = latest.weight;
    const target = cfg.targetWeight;
    const start = cfg.weight || current;

    let progress = 0;
    if (start !== target) {
      progress = 1 - Math.abs(target - current) / Math.abs(target - start);
    } else {
      progress = 1;
    }
    progress = Math.max(0, Math.min(1, progress));

    block.hidden = false;
    document.getElementById('goalProgressFill').style.width = (progress * 100).toFixed(0) + '%';
    document.getElementById('goalProgressText').textContent =
      `当前 ${current}kg → 目标 ${target}kg（完成 ${Math.round(progress * 100)}%）`;
  }

  return { init };
})();
