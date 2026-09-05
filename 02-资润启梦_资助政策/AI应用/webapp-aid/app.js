/* ===== 资润启梦 · 学生资助自助 PWA ===== */
(function () {
  'use strict';

  const QR_SECRET = 'TJS-Aid-2026-SDX';

  /* ---------- 工具 ---------- */
  function $(id) { return document.getElementById(id); }
  function toast(msg) {
    const t = $('toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { t.hidden = true; }, 2200);
  }

  /* ---------- 配置 ---------- */
  let config = {};
  function loadConfig() {
    try { config = JSON.parse(localStorage.getItem('aid_config') || '{}'); } catch (e) { config = {}; }
  }
  function saveConfig() { localStorage.setItem('aid_config', JSON.stringify(config)); }
  function getApiKey() { return localStorage.getItem('aid_apikey') || ''; }
  function getModel() { return localStorage.getItem('aid_model') || 'qwen-turbo'; }

  function saveKey(key) {
    localStorage.setItem('aid_apikey', key);
    const el = $('apiKey'); if (el) el.value = key;
    const st = $('keyStatus'); if (st) st.textContent = '✓ 密钥已设置';
  }
  function saveModel(m) { localStorage.setItem('aid_model', m); }

  /* ---------- 密钥加解密 ---------- */
  function xorCipher(str, key) {
    let r = '';
    for (let i = 0; i < str.length; i++) r += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    return r;
  }
  function encryptKey(plain) { return 'TJS1:' + btoa(xorCipher(plain, QR_SECRET)); }
  function decryptPayload(payload) {
    payload = (payload || '').trim();
    if (payload.indexOf('TJS1:') === 0) {
      try { return xorCipher(atob(payload.slice(5)), QR_SECRET); } catch (e) { return ''; }
    }
    return payload;
  }

  /* ---------- 导航 ---------- */
  function goto(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === pageId));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.nav === pageId));
    window.scrollTo(0, 0);
  }
  function initNav() {
    document.querySelectorAll('.nav-item').forEach(b => b.addEventListener('click', () => goto(b.dataset.nav)));
    document.querySelectorAll('[data-goto]').forEach(b => b.addEventListener('click', () => {
      goto(b.dataset.goto);
      const scrollTo = b.dataset.scroll;
      if (scrollTo) {
        setTimeout(() => {
          const el = document.getElementById(scrollTo);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 60);
      }
    }));
  }

  /* ---------- 徽章链接兜底（PWA standalone 兼容） ---------- */
  function initBadgeLinks() {
    document.querySelectorAll('.badge-link').forEach(a => {
      a.addEventListener('click', e => {
        const href = a.getAttribute('href');
        if (href) { e.preventDefault(); window.open(href, '_blank'); }
      });
    });
  }

  /* ---------- 扫码填入 ---------- */
  let scanStream = null;
  async function openScanner() {
    const modal = $('scanModal'), area = $('scanArea'), tip = $('scanTip');
    modal.hidden = false; tip.textContent = '正在启动摄像头…';
    try {
      scanStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const video = document.createElement('video');
      video.srcObject = scanStream; video.setAttribute('playsinline', ''); video.play();
      area.appendChild(video); tip.textContent = '将二维码对准框内';
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      (function scan() {
        if (modal.hidden) return;
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth; canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = window.jsQR ? jsQR(img.data, img.width, img.height) : null;
          if (code) {
            const key = decryptPayload(code.data);
            if (key) { saveKey(key); tip.textContent = '✓ 扫码成功，密钥已填入'; setTimeout(closeScanner, 800); return; }
          }
        }
        requestAnimationFrame(scan);
      })();
    } catch (e) { tip.textContent = '摄像头启动失败：' + e.message; }
  }
  function closeScanner() {
    const modal = $('scanModal'); modal.hidden = true;
    if (scanStream) { scanStream.getTracks().forEach(t => t.stop()); scanStream = null; }
    const v = $('scanArea').querySelector('video'); if (v) v.remove();
  }

  /* ---------- 生成二维码 ---------- */
  function generateQR() {
    const key = getApiKey();
    if (!key) { toast('请先填入 API Key'); return; }
    const enc = encryptKey(key);
    const show = $('qrShow'); show.innerHTML = '';
    try {
      const qr = qrcode(0, 'M'); qr.addData(enc); qr.make();
      show.innerHTML = qr.createImgTag(6, 8);
      $('qrModal').hidden = false;
    } catch (e) { toast('生成失败：' + e.message); }
  }

  /* ---------- 图片放大 ---------- */
  function initImgZoom() {
    document.querySelectorAll('[data-zoom]').forEach(img => {
      img.addEventListener('click', () => {
        $('imgZoom').src = img.src; $('imgModal').hidden = false;
      });
    });
    $('closeImgBtn').addEventListener('click', () => { $('imgModal').hidden = true; });
  }

  /* ---------- 政策卡片数据（含来源与原文） ---------- */
  const POLICIES = [
    { name: '本专科生国家奖学金', amount: '10000元/年', desc: '奖励纳入全国招生计划内特别优秀的全日制本专科在校生，全国每年奖励约 12 万名，每生每年 10000 元，颁发国家统一印制的荣誉证书。' },
    { name: '山东省政府奖学金', amount: '6000元/年', desc: '奖励纳入全国招生计划内特别优秀的全日制本专科在校生，每生每年 6000 元，颁发省统一印制的荣誉证书（山东省每年约 3000 名）。' },
    { name: '本专科生国家励志奖学金', amount: '6000元/年', desc: '奖励纳入全国招生计划内、品学兼优的家庭经济困难全日制本专科在校生，每生每年 6000 元。' },
    { name: '山东省政府励志奖学金', amount: '5000元/年', desc: '奖励纳入全国招生计划内、品学兼优的家庭经济困难全日制本专科在校生，每生每年 5000 元（山东省每年约 8000 名）。' },
    { name: '本专科生国家助学金', amount: '平均3700元/年', desc: '资助家庭经济困难全日制本专科在校生，平均资助标准每生每年 3700 元，高校在 2500—5000 元内分 2—3 档确定；全日制在校退役士兵学生全部享受，每生每年 3700 元。' },
    { name: '生源地信用助学贷款', amount: '本专科≤20000元/年', desc: '家庭经济困难学生向户籍所在县（市、区）学生资助机构申请，优先用于学费住宿费、超出部分弥补生活费；本专科每人每年最高 20000 元，在校利息由国家承担，期限学制加 15 年、最长 22 年，利率按 LPR 减 70 个基点。' },
    { name: '普通高校免学费', amount: '≤8000元/年', desc: '对山东籍全日制本专科生中的脱贫享受政策家庭学生、防止返贫监测帮扶对象免除学费，每生每年最高不超过 8000 元。' },
    { name: '新生入学"绿色通道"', amount: '缓交学费住宿费', desc: '家庭经济特别困难新生可先办理入学手续，入学后高校资助部门根据具体情况开展困难认定，再采取相应资助措施。' },
    { name: '勤工助学', amount: '按劳计酬', desc: '学有余力的学生利用课余时间参加高校组织的勤工助学活动，通过劳动取得合法报酬，改善学习和生活条件。' },
    { name: '家庭经济困难认定', amount: '三档认定', desc: '每学年开展，综合学生家庭经济状况民主评议，分为特殊困难、困难、一般困难三档，是申请助学金、助学贷款、困难补助等的前置条件。' },
    { name: '服兵役高校学生国家教育资助', amount: '≤20000元/年', desc: '对应征入伍、招收为军士、退役后复学（入学）的高校学生实行学费补偿、国家助学贷款代偿与学费减免，本专科生每生每年最高 20000 元。' },
    { name: '校内资助', amount: '高校自设', desc: '学校利用事业收入及社会捐助资金，设立校内奖学金、助学金、临时困难补助、伙食补贴、学费减免等项目，对困难学生给予补充资助。' }
  ];
  function renderPolicies() {
    const grid = $('policyGrid'); if (!grid) return;
    const OFFICIAL = 'https://sdxszz.sdei.edu.cn/List/11';
    grid.innerHTML = POLICIES.map(p => `
      <div class="policy-card">
        <h4>${p.name}</h4>
        <div class="pc-amount">${p.amount}</div>
        <p>${p.desc}</p>
        <button class="pc-link" data-url="${OFFICIAL}">查看官方政策</button>
      </div>`).join('');
    grid.querySelectorAll('.pc-link').forEach(btn => {
      btn.addEventListener('click', () => window.open(btn.dataset.url, '_blank'));
    });
  }

  /* ---------- 申请与认证流程 ---------- */
  const FLOWS = {
    rending: {
      title: '家庭经济困难认定流程',
      steps: [
        { h: '学生申请', p: '每学年 9 月，学生自愿申请，填写《家庭经济困难学生认定申请表》并提交相关证明材料。' },
        { h: '班级评议', p: '班级认定评议小组结合家访、日常消费等情况民主评议，提出认定档次建议（特殊困难 / 困难 / 一般困难）。' },
        { h: '院系审核', p: '院系认定工作组审核，拟定名单并公示不少于 5 个工作日。' },
        { h: '学校审批', p: '学校学生资助工作领导小组审批，建立困难学生信息档案，作为各项资助资格基础。' }
      ],
      note: '认定结果有效期一般为一年，是申请助学金、助学贷款、困难补助等的前置条件。'
    },
    grant: {
      title: '国家助学金申请流程',
      steps: [
        { h: '认定在前', p: '先通过当学年家庭经济困难认定，取得受助资格基础。' },
        { h: '本人申请', p: '学生向所在院系提交助学金申请，如实说明家庭经济状况。' },
        { h: '院系评审', p: '院系组织评审，拟定受助名单与档次（2500—5000 元 / 年，分 2—3 档）并公示。' },
        { h: '学校审定', p: '学校审核确定受助学生名单，报上级学生资助管理部门备案。' },
        { h: '资金发放', p: '按学年 / 学期将助学金发放至学生本人银行卡（平均 3700 元 / 年）。' }
      ],
      note: '退役士兵学生按规定全部享受本专科生国家助学金，不受困难认定比例限制。'
    },
    loan: {
      title: '生源地信用助学贷款办理流程',
      steps: [
        { h: '在线申请', p: '登录国家开发银行助学贷款学生在线系统或“国家助学贷款”APP 注册、申请，导出《申请表》。' },
        { h: '资格认定', p: '已办理预申请或持困难认定证明，到户籍所在县（市、区）资助中心办理。' },
        { h: '现场签约', p: '学生与共同借款人携身份证、录取通知书（或学生证）、申请表到户籍地县级资助管理中心签订借款合同。' },
        { h: '回执录入', p: '到校后将《受理证明》交学校资助中心，由学校录入电子回执。' },
        { h: '银行放款', p: '贷款优先抵扣学费、住宿费，剩余部分转入学生本人账户；在校期间利息由财政承担。' }
      ],
      note: '本专科生每人每年最高可贷 20000 元，期限学制加 15 年、最长不超过 22 年。'
    },
    green: {
      title: '绿色通道入学流程',
      steps: [
        { h: '提前准备', p: '无法按时凑齐学费、住宿费的新生，可在录取通知书附件中填写《绿色通道申请表》，或到校现场申请。' },
        { h: '现场办理', p: '报到当天到“绿色通道”服务点，提交申请表 / 困难证明，办理学费住宿费缓交手续。' },
        { h: '先行入学', p: '先办理注册、住宿等入学手续，正常开启大学生活，不因费用问题耽误报到。' },
        { h: '后续认定', p: '入学后参加家庭经济困难认定，再落实助学金、助学贷款、困难补助等配套资助。' }
      ],
      note: '绿色通道只缓交、不减免，后续仍需按政策办理认定与资助申请。'
    }
  };
  function renderFlow(key) {
    const flow = FLOWS[key]; const body = $('flowBody'); if (!body || !flow) return;
    body.innerHTML = `
      <p class="flow-title">${flow.title}</p>
      <div class="flow-list">
        ${flow.steps.map((s, i) => `
          <div class="flow-step${i === 0 ? ' active' : ''}">
            <span class="fs-dot"></span>
            <h5>${i + 1}. ${s.h}</h5>
            <p>${s.p}</p>
          </div>`).join('')}
      </div>
      <p class="flow-note">📌 ${flow.note}</p>`;
  }
  function initFlowTabs() {
    const tabs = document.querySelectorAll('#flowTabs .flow-tab');
    tabs.forEach(tab => tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.toggle('active', t === tab));
      renderFlow(tab.dataset.flow);
    }));
    renderFlow('rending');
  }

  /* ---------- 团队成员 ---------- */
  const TEAM = {
    teacher: '董怡静',
    members: [
      { name: '姚珂', role: '负责人', leader: true },
      { name: '纪文慧', role: '现场志愿者' },
      { name: '李楠', role: '现场志愿者' },
      { name: '丁豪佳', role: '现场志愿者' },
      { name: '郭思彤', role: '现场志愿者' },
      { name: '杨雨萌', role: '现场志愿者' },
      { name: '李金彤', role: '摄像' },
      { name: '阎宗宁', role: '撰稿' },
      { name: '田佳乐', role: '记录' }
    ]
  };
  function renderTeam() {
    const box = $('teamMembers'); if (!box) return;
    box.innerHTML = TEAM.members.map(m =>
      `<div class="tm${m.leader ? ' leader' : ''}">${m.name}<small>${m.role}</small></div>`
    ).join('');
  }

  /* ---------- 活动掠影轮播 ---------- */
  let slideTimer = null;
  function initSlideshow() {
    const slides = $('slides'), dots = $('slideDots'); if (!slides) return;
    const imgs = [];
    for (let i = 1; i <= 15; i++) imgs.push(`assets/gallery/g${i}.jpg`);
    slides.innerHTML = imgs.map(src => `<div class="slide"><img src="${src}" alt="活动照片" loading="lazy"></div>`).join('');
    dots.innerHTML = imgs.map((_, i) => `<span class="${i === 0 ? 'active' : ''}"></span>`).join('');
    const dotEls = dots.querySelectorAll('span');
    let idx = 0;
    function show(n) {
      idx = (n + imgs.length) % imgs.length;
      slides.style.transform = `translateX(-${idx * 100}%)`;
      dotEls.forEach((d, i) => d.classList.toggle('active', i === idx));
    }
    dotEls.forEach((d, i) => d.addEventListener('click', () => { show(i); restart(); }));
    function restart() { clearInterval(slideTimer); slideTimer = setInterval(() => show(idx + 1), 3500); }
    restart();
  }

  /* ---------- 行动主导文件弹窗 ---------- */
  function initNotice() {
    const btn = $('viewNoticeBtn'); if (!btn) return;
    btn.addEventListener('click', () => {
      const scroll = $('noticeScroll');
      if (scroll && !scroll.dataset.loaded) {
        let html = '';
        for (let i = 1; i <= 10; i++) html += `<img src="assets/notice/n${String(i).padStart(2, '0')}.png" alt="通知第${i}页">`;
        scroll.innerHTML = html;
        scroll.dataset.loaded = '1';
      }
      $('noticeModal').hidden = false;
    });
    $('closeNoticeBtn').addEventListener('click', () => { $('noticeModal').hidden = true; });
  }

  /* ---------- 设置初始化 ---------- */
  function initSettings() {
    const key = getApiKey();
    $('apiKey').value = key;
    $('keyStatus').textContent = key ? '✓ 密钥已设置' : '未设置密钥';
    $('modelName').value = getModel();

    const ak = $('apiKey');
    ak.addEventListener('change', () => saveKey(ak.value.trim()));
    ak.addEventListener('blur', () => { const v = ak.value.trim(); if (v) saveKey(v); });
    const mn = $('modelName');
    mn.addEventListener('change', () => saveModel(mn.value.trim()));
    mn.addEventListener('blur', () => saveModel(mn.value.trim()));

    $('scanKeyBtn').addEventListener('click', openScanner);
    $('genQrBtn').addEventListener('click', generateQR);
    $('clearKeyBtn').addEventListener('click', () => {
      localStorage.removeItem('aid_apikey'); ak.value = ''; $('keyStatus').textContent = '已清除密钥';
    });
    $('closeScanBtn').addEventListener('click', closeScanner);
    $('closeQrBtn').addEventListener('click', () => { $('qrModal').hidden = true; });
  }

  /* ---------- PWA ---------- */
  let deferredPrompt = null;
  function initPWA() {
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault(); deferredPrompt = e; $('installBtn').hidden = false;
    });
    $('installBtn').addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; $('installBtn').hidden = true;
    });
  }

  /* ---------- 初始化 ---------- */
  function init() {
    loadConfig();
    initNav();
    initBadgeLinks();
    initImgZoom();
    renderPolicies();
    initFlowTabs();
    renderTeam();
    initSlideshow();
    initNotice();
    initSettings();
    initPWA();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('service-worker.js').catch(() => {});
    }
  }

  window.AidApp = { getApiKey, getModel, toast };
  document.addEventListener('DOMContentLoaded', init);
})();
