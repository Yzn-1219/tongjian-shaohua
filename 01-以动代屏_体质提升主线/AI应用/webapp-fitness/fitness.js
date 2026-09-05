// ===== 健身功能：训练记录 / 历史 / 周图表 / 首页统计 =====
const Fitness = (function() {

  let selectedPart = null;
  let parseTimer = null;

  function init() {
    renderPartChips();
    bindEvents();
    renderTodayDate();
  }

  function renderTodayDate() {
    const now = new Date();
    const weekDays = ['日','一','二','三','四','五','六'];
    const dateStr = `${now.getMonth()+1}月${now.getDate()}日 周${weekDays[now.getDay()]}`;
    document.getElementById('todayDate').textContent = dateStr;
  }

  function renderPartChips() {
    const container = document.getElementById('partChips');
    container.innerHTML = '';
    TrainingParser.PARTS.forEach(p => {
      const chip = document.createElement('div');
      chip.className = 'part-chip';
      chip.dataset.part = p.id;
      chip.textContent = p.name;
      chip.addEventListener('click', () => {
        container.querySelectorAll('.part-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        selectedPart = p.id;
        triggerParse();
      });
      container.appendChild(chip);
    });
  }

  function bindEvents() {
    const input = document.getElementById('trainInput');
    input.addEventListener('input', () => {
      clearTimeout(parseTimer);
      parseTimer = setTimeout(triggerParse, 350);
    });

    document.getElementById('saveTrainBtn').addEventListener('click', saveTraining);
    document.getElementById('exportBtn').addEventListener('click', exportData);
    document.getElementById('importBtn').addEventListener('click', () => {
      document.getElementById('importFile').click();
    });
    document.getElementById('importFile').addEventListener('change', importData);
    document.getElementById('saveBodyBtn').addEventListener('click', saveBodyData);

    // 快捷模板
    document.querySelectorAll('.qt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tpl = btn.dataset.tpl;
        const part = btn.dataset.part;
        document.getElementById('trainInput').value = tpl;
        // 选对应部位
        document.querySelectorAll('.part-chip').forEach(c => {
          c.classList.toggle('active', c.dataset.part === part);
        });
        selectedPart = part;
        triggerParse();
      });
    });
  }

  function triggerParse() {
    const text = document.getElementById('trainInput').value.trim();
    const preview = document.getElementById('parsePreview');
    if (!text) { preview.hidden = true; return; }

    const result = TrainingParser.parse(text);
    if (!result) { preview.hidden = true; return; }

    const confIcon = result.confidence >= 0.8 ? '🟢' : result.confidence >= 0.5 ? '🟡' : '🟠';
    let html = `识别为 <b class="pp-part">${result.partName || '未识别'}</b>`;
    if (result.duration > 0) html += ` · ${result.duration}分钟`;
    if (result.setsReps.length > 0) html += ` · ${result.setsReps.map(s => `${s.sets}×${s.reps}`).join(' ')}`;
    if (result.weight > 0) html += ` · ${result.weight}kg`;
    if (result.calories > 0) html += ` · 约${result.calories}kcal`;
    html += ` <span class="pp-conf">${confIcon}</span>`;
    preview.innerHTML = html;
    preview.hidden = false;

    // 自动填入时长
    const durInput = document.getElementById('trainDuration');
    if (result.duration > 0 && !durInput.value) durInput.value = result.duration;
    const calInput = document.getElementById('trainCalories');
    if (result.calories > 0 && !calInput.value) calInput.value = result.calories;

    // 自动选部位
    if (result.partId && !selectedPart) {
      document.querySelectorAll('.part-chip').forEach(c => {
        c.classList.toggle('active', c.dataset.part === result.partId);
      });
      selectedPart = result.partId;
    }
  }

  async function saveTraining() {
    const text = document.getElementById('trainInput').value.trim();
    if (!text && !selectedPart) {
      toast('请输入训练内容或选择部位');
      return;
    }

    const parsed = TrainingParser.parse(text) || {};
    const partId = selectedPart || parsed.partId || 'rest';
    const partName = TrainingParser.getPartName(partId) || parsed.partName || '休息日';

    const rec = {
      date: new Date().toISOString().slice(0, 10),
      partId,
      part: partName,
      exercises: text || (partId === 'rest' ? '休息日' : partName),
      duration: parseInt(document.getElementById('trainDuration').value) || parsed.duration || 0,
      calories: parseInt(document.getElementById('trainCalories').value) || parsed.calories || 0,
      isRest: partId === 'rest',
      created_at: Date.now()
    };

    try {
      await DB.addTraining(rec);
      toast('已保存训练记录 ✓');
      clearInput();
      await refreshAll();
    } catch (e) {
      toast('保存失败：' + e.message);
    }
  }

  function clearInput() {
    document.getElementById('trainInput').value = '';
    document.getElementById('trainDuration').value = '';
    document.getElementById('trainCalories').value = '';
    document.getElementById('parsePreview').hidden = true;
    document.querySelectorAll('.part-chip').forEach(c => c.classList.remove('active'));
    selectedPart = null;
  }

  async function saveBodyData() {
    const weight = parseFloat(document.getElementById('bodyWeight').value);
    const bodyFat = parseFloat(document.getElementById('bodyFat').value);
    if (!weight && !bodyFat) { toast('请至少填写体重或体脂率'); return; }

    const cfg = App.getConfig();
    const height = cfg.height ? cfg.height / 100 : 0;

    // 输入即计算派生指标（有值才计算，确保可复算）
    const bmi = (weight && height) ? parseFloat((weight / (height * height)).toFixed(1)) : null;
    const bmr = (weight && height && cfg.age)
      ? Math.round(10 * weight + 625 * height - 5 * cfg.age + (cfg.gender === 'male' ? 5 : -161))
      : null;

    let muscle = null, water = null, bone = null, protein = null;
    if (weight && bodyFat) {
      const leanMass = weight * (1 - bodyFat / 100);   // 去脂体重
      muscle  = parseFloat((leanMass * 0.55).toFixed(1)); // 肌肉量 ≈ 去脂体重 55%
      water   = parseFloat((leanMass / weight * 70).toFixed(0)); // 水分率 %
      bone    = parseFloat((weight * 0.035).toFixed(1));        // 骨量 ≈ 体重 3.5%
      protein = parseFloat((leanMass / weight * 18).toFixed(0)); // 蛋白质率 %
    }

    const rec = {
      date: new Date().toISOString().slice(0, 10),
      weight: weight || null,
      body_fat: bodyFat || null,
      bmi, bmr,
      muscle, water, bone, protein,
      created_at: Date.now()
    };

    try {
      await DB.addBodyData(rec);
      toast('身体数据已保存 ✓');
      document.getElementById('bodyWeight').value = '';
      document.getElementById('bodyFat').value = '';
      await refreshBody();
    } catch (e) {
      toast('保存失败：' + e.message);
    }
  }

  async function refreshAll() {
    await Promise.all([renderHistory(), renderHome(), renderWeekChart()]);
  }

  async function refreshBody() {
    await renderBodyComp();
    await renderTrends();
  }

  // ===== 训练历史 =====
  async function renderHistory() {
    const container = document.getElementById('trainHistory');
    if (!container) return;
    const records = await DB.getRecentTrainings(10);
    if (!records.length) {
      container.innerHTML = '<p class="empty-hint">暂无训练记录</p>';
      return;
    }
    const weekDays = ['日','一','二','三','四','五','六'];
    container.innerHTML = '<div class="train-list">' + records.map(r => {
      const d = new Date(r.created_at);
      const color = TrainingParser.getPartColor(r.partId);
      if (r.isRest) {
        return `<div class="train-card rest">
          <div class="train-date"><div class="td-day">${d.getMonth()+1}/${d.getDate()}</div><div class="td-week">周${weekDays[d.getDay()]}</div></div>
          <div class="train-body"><span class="tb-part" style="background:${color}">休息日</span><div class="tb-ex">😴 休息也是训练的一部分</div></div>
          <button class="train-del" data-id="${r.id}">✕</button>
        </div>`;
      }
      let meta = [];
      if (r.duration) meta.push(`${r.duration}min`);
      if (r.calories) meta.push(`${r.calories}kcal`);
      return `<div class="train-card">
        <div class="train-date"><div class="td-day">${d.getMonth()+1}/${d.getDate()}</div><div class="td-week">周${weekDays[d.getDay()]}</div></div>
        <div class="train-body">
          <span class="tb-part" style="background:${color}">${r.part}</span>
          <div class="tb-ex">${r.exercises}</div>
          ${meta.length ? `<div class="tb-meta">${meta.join(' · ')}</div>` : ''}
        </div>
        <button class="train-del" data-id="${r.id}">✕</button>
      </div>`;
    }).join('') + '</div>';

    // 绑定删除
    container.querySelectorAll('.train-del').forEach(btn => {
      btn.addEventListener('click', async () => {
        await DB.deleteTraining(parseInt(btn.dataset.id));
        toast('已删除');
        await refreshAll();
      });
    });
  }

  // ===== 首页统计 =====
  async function renderHome() {
    const all = await DB.getAllTrainings();
    const today = new Date().toISOString().slice(0, 10);
    const weekStart = getWeekStart();
    const weekEnd = weekStart + 6 * 86400000;

    // 连续打卡
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      const has = all.some(t => t.date === d && !t.isRest);
      if (has) streak++;
      else if (i > 0) break;
    }
    document.getElementById('statStreak').textContent = streak;

    // 本周训练天
    const weekDays = new Set();
    let weekCalories = 0;
    all.forEach(t => {
      const ts = new Date(t.date).getTime();
      if (ts >= weekStart && ts <= weekEnd && !t.isRest) {
        weekDays.add(t.date);
        weekCalories += t.calories || 0;
      }
    });
    document.getElementById('statWeekDays').textContent = weekDays.size;
    document.getElementById('statWeekCalories').textContent = weekCalories;

    // 今日训练数
    const todayCount = all.filter(t => t.date === today && !t.isRest).length;
    document.getElementById('statTodayCount').textContent = todayCount;

    // 最近训练
    const recent = document.getElementById('recentTrainings');
    const recent5 = all.slice(0, 5);
    if (!recent5.length) {
      recent.innerHTML = '<p class="empty-hint">暂无记录</p>';
    } else {
      const weekDayNames = ['日','一','二','三','四','五','六'];
      recent.innerHTML = '<div class="recent-list">' + recent5.map(r => {
        const d = new Date(r.created_at);
        const color = TrainingParser.getPartColor(r.partId);
        const label = r.isRest ? '😴 休息日' : r.part;
        return `<div class="recent-item">
          <span class="recent-tag" style="background:${color}">${label}</span>
          <span class="recent-text">${r.exercises}</span>
          <span class="recent-date">${d.getMonth()+1}/${d.getDate()}</span>
        </div>`;
      }).join('') + '</div>';
    }
  }

  // ===== 周图表 =====
  async function renderWeekChart() {
    const container = document.getElementById('weekChart');
    if (!container) return;
    const all = await DB.getAllTrainings();
    const ws = getWeekStart();
    const today = new Date().toISOString().slice(0, 10);
    const weekLabels = ['一','二','三','四','五','六','日'];
    const todayDow = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

    let maxDur = 60;
    const data = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(ws + i * 86400000).toISOString().slice(0, 10);
      const dayTrainings = all.filter(t => t.date === date);
      const maxD = dayTrainings.length ? Math.max(...dayTrainings.map(t => t.duration || 0)) : 0;
      maxDur = Math.max(maxDur, maxD);
      data.push({ date, maxD, isRest: dayTrainings.length > 0 && dayTrainings.every(t => t.isRest), isToday: date === today });
    }

    container.innerHTML = '<div class="week-chart">' + data.map((d, i) => {
      const h = d.maxD > 0 ? Math.max(8, (d.maxD / maxDur) * 100) : (d.isRest ? 4 : 4);
      const cls = d.isRest ? 'rest' : '';
    const todayCls = d.isToday ? ' today-wrap' : '';
    return `<div class="week-bar-wrap${todayCls}">
        ${d.maxD > 0 ? `<span class="week-bar-min">${d.maxD}</span>` : ''}
        <div class="week-bar ${cls}${d.isToday ? ' today' : ''}" style="height:${h}px"></div>
        <span class="week-bar-label">${weekLabels[i]}</span>
      </div>`;
    }).join('') + '</div>';
  }

  // ===== 身体成分 =====
  async function renderBodyComp() {
    const data = await DB.getRecentBodyData(1);
    const latest = data[data.length - 1];
    const cfg = App.getConfig();

    if (!latest) {
      const els = ['bcWeight','bcBMI','bcBMR','bcBodyFat','bcMuscle','bcWater','bcBone','bcProtein'];
      els.forEach(id => document.getElementById(id).textContent = '--');
      return;
    }

    const w = latest.weight;
    const h = cfg.height ? cfg.height / 100 : 0;
    const bf = latest.body_fat;

    document.getElementById('bcWeight').textContent = w || '--';
    document.getElementById('bcBMI').textContent = latest.bmi || (w && h ? (w / (h * h)).toFixed(1) : '--');
    document.getElementById('bcBMR').textContent = latest.bmr ? latest.bmr + ' kcal' : '--';
    document.getElementById('bcBodyFat').textContent = bf || '--';

    if (w && bf) {
      const leanMass = w * (1 - bf / 100);
      // 优先用已存派生值，缺则当场重算
      document.getElementById('bcMuscle').textContent = latest.muscle != null ? latest.muscle : (leanMass * 0.55).toFixed(1);
      document.getElementById('bcWater').textContent  = latest.water != null ? latest.water : (leanMass / w * 70).toFixed(0);
      document.getElementById('bcBone').textContent   = latest.bone != null ? latest.bone : (w * 0.035).toFixed(1);
      document.getElementById('bcProtein').textContent = latest.protein != null ? latest.protein : (leanMass / w * 18).toFixed(0);
    }
  }

  // ===== 多指标趋势图（体重 / BMI / 体脂率）=====
  async function renderTrends() {
    const data = await DB.getRecentBodyData(60);
    miniTrend('trendWeight', data, 'weight', '体重', 'kg', '#208c78');
    miniTrend('trendBmi', data, 'bmi', 'BMI', '', '#f59e0b');
    miniTrend('trendFat', data, 'body_fat', '体脂率', '%', '#ec4899');
  }

  function miniTrend(containerId, data, key, label, unit, color) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const series = data
      .map(d => ({ v: parseFloat(d[key]) }))
      .filter(d => d.v != null && !isNaN(d.v));

    if (series.length === 0) {
      container.innerHTML = `<div class="mt-head"><span class="mt-label">${label}</span></div><div class="mt-empty">记录数据后显示</div>`;
      return;
    }

    const latest = series[series.length - 1];
    let deltaHtml = '';
    if (series.length >= 2) {
      const d = latest.v - series[series.length - 2].v;
      const isUp = d > 0;
      deltaHtml = `<span class="mt-delta ${isUp ? 'up' : 'down'}">${isUp ? '↑' : '↓'}${Math.abs(d).toFixed(1)}${unit}</span>`;
    }

    if (series.length < 2) {
      container.innerHTML = `<div class="mt-head"><span class="mt-label">${label}</span><span class="mt-current">${latest.v}${unit}</span></div><div class="mt-empty">再记录一次即可显示趋势</div>`;
      return;
    }

    // SVG 折线图
    const w = 300, h = 90, pad = 16;
    const vals = series.map(s => s.v);
    let min = Math.min(...vals), max = Math.max(...vals);
    if (min === max) { min -= 1; max += 1; }
    const range = max - min;
    const stepX = (w - pad * 2) / (series.length - 1);
    const pts = series.map((s, i) => [pad + i * stepX, h - pad - ((s.v - min) / range) * (h - pad * 2)]);
    const linePath = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const areaPath = linePath + ` L ${pts[pts.length-1][0].toFixed(1)} ${h - pad} L ${pts[0][0].toFixed(1)} ${h - pad} Z`;
    const gid = 'grad_' + containerId;

    container.innerHTML = `
      <div class="mt-head"><span class="mt-label">${label}</span><span class="mt-current">${latest.v}${unit} ${deltaHtml}</span></div>
      <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
        <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.28"/>
          <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
        </linearGradient></defs>
        <path d="${areaPath}" fill="url(#${gid})"/>
        <path d="${linePath}" fill="none" stroke="${color}" stroke-width="2" vector-effect="non-scaling-stroke"/>
        ${pts.map(p => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="2.6" fill="${color}"/>`).join('')}
      </svg>`;
  }

  // ===== 工具 =====
  function getWeekStart() {
    const now = new Date();
    const dow = now.getDay() === 0 ? 6 : now.getDay() - 1; // 周一为0
    const monday = new Date(now);
    monday.setDate(now.getDate() - dow);
    monday.setHours(0, 0, 0, 0);
    return monday.getTime();
  }

  async function exportData() {
    try {
      const data = await DB.exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fitness-data-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast('数据已导出 ✓');
    } catch (e) {
      toast('导出失败：' + e.message);
    }
  }

  async function importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await DB.importAll(data);
      toast('数据已导入 ✓');
      await refreshAll();
      await refreshBody();
    } catch (e) {
      toast('导入失败：' + e.message);
    }
    e.target.value = '';
  }

  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 2000);
  }

  return { init, refreshAll, refreshBody, renderHistory, renderHome, renderWeekChart,
           renderBodyComp, renderTrends, toast };
})();
