const Assess = (function() {

  const $ = id => document.getElementById(id);

  function init() {
    $('a-submit').addEventListener('click', submit);
    $('a-copy').addEventListener('click', copyReport);
  }

  function validate() {
    const age = Number($('a-age').value);
    const height = Number($('a-height').value);
    const weight = Number($('a-weight').value);
    if (!age || !height || !weight) { alert('请填写性别、年龄、身高、体重'); return null; }
    if (age < 6 || age > 100) { alert('年龄范围 6~100 周岁'); return null; }
    if (height < 50 || height > 250) { alert('身高范围 50~250cm'); return null; }
    if (weight < 10 || weight > 300) { alert('体重范围 10~300kg'); return null; }
    return {
      gender: $('a-gender').value,
      age, height, weight,
      waist: $('a-waist').value,
      hip: $('a-hip').value,
      sport: $('a-sport').value,
      history: $('a-history').value
    };
  }

  function calc(d) {
    const h = d.height / 100;
    const bmi = d.weight / (h * h);
    const bmr = d.gender === 'male'
      ? 10 * d.weight + 6.25 * d.height - 5 * d.age + 5
      : 10 * d.weight + 6.25 * d.height - 5 * d.age - 161;
    return { bmi, bmr };
  }

  function buildPrompt(d, bmi, bmr) {
    return `你是资深运动医学、健康管理专家。严格按照4大板块输出Markdown格式报告，不要输出无关闲聊。
必须包含4个部分：
## 1.体质综合评估
根据BMI数值判断偏瘦/正常/超重/肥胖，分析当前身体状态、潜在健康风险。
## 2.健康常量参考
给出基础代谢BMR数值、每日建议饮水量区间、适配年龄的推荐睡眠时长。
## 3.运动禁忌与风险提示
结合体重、伤病情况给出运动保护建议：超重重点提示膝踝关节防护；偏瘦提示避免高强度空腹训练、预防低血糖；存在旧伤标注对应规避动作。
## 4. 11天启动健身计划（必须用 Markdown 表格，禁止用纯文字列表）
请用如下固定表头的 Markdown 表格输出连续 11 天计划：
天数 | 训练重点 | 具体安排（动作 / 组数 / 时长）
要求：
- 第1天至第11天每天一行；明确标注其中 2~3 个休息日（如"第4天｜休息｜完全休息或散步20分钟"）；
- "训练重点"只写 3~8 字（如：有氧燃脂、下肢力量、核心稳定、全身放松）；
- "具体安排"用分号分隔动作，单行不超过 36 字，避免过长换行；
- 交替安排有氧与力量训练，兼顾新手友好；
- 表格前后不要再加文字说明，直接给表格。
禁止任何医疗诊断话术，只做健康生活指导。
用户基础数据：
性别：${d.gender === 'male' ? '男' : '女'}
年龄：${d.age}岁
身高：${d.height}cm
体重：${d.weight}kg
BMI：${bmi.toFixed(2)}
估算基础代谢BMR：${Math.round(bmr)} kcal/天
腰围：${d.waist || '未填写'}
臀围：${d.hip || '未填写'}
运动偏好：${d.sport || '无'}
既往身体情况：${d.history || '无特殊伤病记录'}`;
  }

  async function callAI(prompt) {
    // 统一走 ApiCfg：自动区分「本站默认 API」和「用户自己的 API / 中转站」
    if (!window.ApiCfg || !ApiCfg.ready()) throw new Error('NOKEY');
    const model = ApiCfg.model();
    const t0 = Date.now();
    try {
      const res = await ApiCfg.chat([{ role: 'user', content: prompt }]);
      if (window.Track) Track.track('assess', 'ai_call', {
        model: model, ok: true, ms: Date.now() - t0,
        in_tokens: res.usage.input_tokens, out_tokens: res.usage.output_tokens
      });
      return res.text;
    } catch (e) {
      if (window.Track) Track.track('assess', 'ai_call', {
        model: model, ok: false, ms: Date.now() - t0, err: String(e.message || e)
      });
      if (e && e.status) throw new Error('接口返回 ' + e.status);
      throw e;
    }
  }

  let cacheText = '';

  async function submit() {
    const d = validate();
    if (!d) return;
    const { bmi, bmr } = calc(d);
    const prompt = buildPrompt(d, bmi, bmr);
    const btn = $('a-submit');
    const wrap = $('a-result');
    const loading = $('a-loading');
    const report = $('a-report');
    btn.disabled = true;
    wrap.hidden = false;
    loading.style.display = 'block';
    report.style.display = 'none';
    report.innerHTML = '';
    try {
      const content = await callAI(prompt);
      cacheText = content;
      report.innerHTML = marked.parse(content);
      report.querySelectorAll('table').forEach(t => {
        const w = document.createElement('div');
        w.className = 'table-wrap';
        t.parentNode.insertBefore(w, t);
        w.appendChild(t);
      });
      loading.style.display = 'none';
      report.style.display = 'block';
    } catch (err) {
      loading.style.display = 'none';
      // 没连上 AI（没配 Key / 失效 / 断网）→ 弹提示，一键去 AI 服务
      if (window.AINotice) AINotice.check(err);
      let msg = '生成失败：';
      if (err.message === 'NOKEY') {
        msg = (window.ApiCfg && ApiCfg.mode() === 'default')
          ? '还没解锁本站默认 API。到「设置 → AI 服务」输入调用码即可使用。'
          : '还没填自己的 API Key。到「设置 → AI 服务」填写，或改用本站默认 API。';
      }
      else msg = '生成失败：' + (err.message || '网络或接口错误');
      report.style.display = 'block';
      report.innerHTML = '<p style="color:#e63946">' + msg + '</p>';
    } finally {
      btn.disabled = false;
    }
  }

  function copyReport() {
    if (!cacheText) return;
    navigator.clipboard.writeText(cacheText).then(() => alert('报告已复制')).catch(() => alert('复制失败，请手动选择文本'));
  }

  return { init };
})();
