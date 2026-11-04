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
    const key = App.getApiKey();
    if (!key) throw new Error('NOKEY');
    const model = App.getModel();
    const r = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
      body: JSON.stringify({ model, input: { messages: [{ role: 'user', content: prompt }] }, parameters: { result_format: 'message' } })
    });
    if (!r.ok) throw new Error('接口返回 ' + r.status);
    const j = await r.json();
    return j.output.choices[0].message.content;
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
      let msg = '生成失败：';
      if (err.message === 'NOKEY') msg = '请先到「设置」填写 API Key（可扫码填入）。';
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
