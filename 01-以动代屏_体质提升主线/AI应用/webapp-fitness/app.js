// ===== 主应用：导航 / 设置 / PWA / 扫码 / 加解密 =====
const App = (function() {

  const QR_SECRET = 'TJS-Fitness-2026-SDX';
  let config = {};

  function init() {
    loadConfig();
    bindNav();
    bindSettings();
    Fitness.init();
    Coach.init();
    initPWA();
    checkOnline();
    // 首次渲染
    DB.open().then(async () => {
      await Fitness.refreshAll();
      await Fitness.refreshBody();
    });
  }

  // ===== 导航 =====
  function bindNav() {
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const page = tab.dataset.page;
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById('page-' + page).classList.add('active');
        if (page === 'body') Fitness.refreshBody();
        if (page === 'home') Fitness.refreshAll();
      });
    });
  }

  // ===== 配置 =====
  function loadConfig() {
    try {
      config = JSON.parse(localStorage.getItem('fitness_config') || '{}');
    } catch (e) { config = {}; }
    // 密钥
    const key = localStorage.getItem('fitness_apikey') || '';
    document.getElementById('apiKey').value = key;
    document.getElementById('keyStatus').textContent = key ? '✓ 密钥已设置' : '未设置密钥';
    // 模型名称
    document.getElementById('modelName').value = getModel();

    // 填充设置表单
    const fields = ['height','age','gender','goal','targetWeight','weeklyFreq','dailyCalories','dailyProtein'];
    fields.forEach(f => {
      const el = document.getElementById('cfg' + f.charAt(0).toUpperCase() + f.slice(1));
      if (el && config[f] !== undefined) el.value = config[f];
    });
  }

  function saveConfig() {
    const fields = ['height','age','gender','goal','targetWeight','weeklyFreq','dailyCalories','dailyProtein'];
    const newCfg = {};
    fields.forEach(f => {
      const el = document.getElementById('cfg' + f.charAt(0).toUpperCase() + f.slice(1));
      if (el) {
        const val = el.value;
        if (val !== '') {
          if (['height','age','targetWeight','weeklyFreq','dailyCalories','dailyProtein'].includes(f)) {
            newCfg[f] = parseFloat(val);
          } else {
            newCfg[f] = val;
          }
        }
      }
    });
    config = Object.assign(config, newCfg);
    localStorage.setItem('fitness_config', JSON.stringify(config));
    document.getElementById('cfgSaveStatus').textContent = '设置已保存 ✓';
    setTimeout(() => document.getElementById('cfgSaveStatus').textContent = '', 2000);
  }

  function getConfig() {
    try {
      return Object.assign({}, config, JSON.parse(localStorage.getItem('fitness_config') || '{}'));
    } catch (e) { return config; }
  }

  function getApiKey() {
    return localStorage.getItem('fitness_apikey') || '';
  }

  function getModel() {
    return localStorage.getItem('fitness_model') || 'qwen-turbo';
  }

  function saveModel(model) {
    if (!model) return;
    localStorage.setItem('fitness_model', model);
  }

  // ===== 设置页绑定 =====
  function bindSettings() {
    // 保存配置：失焦即存
    const cfgFields = document.querySelectorAll('[id^="cfg"]');
    cfgFields.forEach(el => {
      el.addEventListener('change', saveConfig);
      el.addEventListener('blur', saveConfig);
    });

    // 密钥相关
    document.getElementById('scanKeyBtn').addEventListener('click', openScanner);
    document.getElementById('scanCloseBtn').addEventListener('click', closeScanner);
    document.getElementById('genQrBtn').addEventListener('click', generateQR);
    document.getElementById('qrCloseBtn').addEventListener('click', () => {
      document.getElementById('qrModal').hidden = true;
    });
    document.getElementById('clearKeyBtn').addEventListener('click', () => {
      localStorage.removeItem('fitness_apikey');
      document.getElementById('apiKey').value = '';
      document.getElementById('keyStatus').textContent = '已清除密钥';
    });

    // 手动输入密钥：失焦即存
    const apiKeyInput = document.getElementById('apiKey');
    apiKeyInput.addEventListener('change', () => saveKey(apiKeyInput.value.trim()));
    apiKeyInput.addEventListener('blur', () => {
      const v = apiKeyInput.value.trim();
      if (v) saveKey(v);
    });

    // 模型名称：失焦即存
    const modelInput = document.getElementById('modelName');
    modelInput.addEventListener('change', () => saveModel(modelInput.value.trim()));
    modelInput.addEventListener('blur', () => saveModel(modelInput.value.trim()));
  }

  // ===== Key 加解密 =====
  function xorCipher(str, key) {
    let result = '';
    for (let i = 0; i < str.length; i++) {
      result += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  }

  function encryptKey(plain) {
    return 'TJS1:' + btoa(xorCipher(plain, QR_SECRET));
  }

  function decryptPayload(payload) {
    payload = (payload || '').trim();
    if (payload.indexOf('TJS1:') === 0) {
      try {
        return xorCipher(atob(payload.slice(5)), QR_SECRET);
      } catch (e) { return ''; }
    }
    return payload; // 兼容旧明文码
  }

  // ===== 扫码填入 =====
  let scanStream = null;

  async function openScanner() {
    const modal = document.getElementById('scanModal');
    const area = document.getElementById('scanArea');
    const tip = document.getElementById('scanTip');
    modal.hidden = false;
    tip.textContent = '正在启动摄像头…';

    try {
      scanStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const video = document.createElement('video');
      video.srcObject = scanStream;
      video.setAttribute('playsinline', '');
      video.play();
      area.appendChild(video);

      tip.textContent = '将二维码对准框内';

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      function scan() {
        if (modal.hidden) return;
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
            const key = decryptPayload(code.data);
            if (key) {
              saveKey(key);
              tip.textContent = '✓ 扫码成功，密钥已填入';
              setTimeout(closeScanner, 800);
              return;
            }
          }
        }
        requestAnimationFrame(scan);
      }
      scan();
    } catch (e) {
      tip.textContent = '摄像头启动失败：' + e.message;
    }
  }

  function closeScanner() {
    const modal = document.getElementById('scanModal');
    modal.hidden = true;
    if (scanStream) {
      scanStream.getTracks().forEach(t => t.stop());
      scanStream = null;
    }
    const area = document.getElementById('scanArea');
    const video = area.querySelector('video');
    if (video) video.remove();
  }

  function saveKey(key) {
    localStorage.setItem('fitness_apikey', key);
    document.getElementById('apiKey').value = key;
    document.getElementById('keyStatus').textContent = '✓ 密钥已设置';
  }

  // ===== 生成二维码 =====
  function generateQR() {
    const key = getApiKey();
    if (!key) {
      Fitness.toast('请先填入 API Key');
      return;
    }
    const encrypted = encryptKey(key);
    const modal = document.getElementById('qrModal');
    const show = document.getElementById('qrShow');
    show.innerHTML = '';
    try {
      const qr = qrcode(0, 'M');
      qr.addData(encrypted);
      qr.make();
      const img = qr.createImgTag(6, 8);
      show.innerHTML = img;
    } catch (e) {
      Fitness.toast('生成失败：' + e.message);
    }
    modal.hidden = false;
  }

  // ===== PWA =====
  let deferredPrompt = null;
  function initPWA() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      document.getElementById('installBtn').hidden = false;
    });

    document.getElementById('installBtn').addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        deferredPrompt = null;
        document.getElementById('installBtn').hidden = true;
      }
    });

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('service-worker.js').catch(() => {});
    }
  }

  // ===== 离线检测 =====
  function checkOnline() {
    const toast = document.getElementById('offlineToast');
    function update() {
      toast.classList.toggle('show', !navigator.onLine);
    }
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    update();
  }

  return { init, getConfig, getApiKey, getModel };
})();

// 启动
document.addEventListener('DOMContentLoaded', App.init);

// ===== 校徽/系徽/官网链接 - PWA window.open 兜底 =====
(function(){
  document.querySelectorAll('.badge-link, .visit-site, .brand-badges a, .affiliation a').forEach(a=>{
    a.addEventListener('click', e=>{
      const url = a.getAttribute('href');
      if(!url) return;
      e.preventDefault();
      window.open(url, '_blank', 'noopener');
    });
  });
})();

// ===== 关于我们 - 活动照片轮播 =====
(function(){
  const gallery = document.getElementById('group-gallery');
  if(!gallery) return;
  const track = document.getElementById('group-track');
  const prev  = document.getElementById('group-prev');
  const next  = document.getElementById('group-next');
  const dotsWrap = document.getElementById('group-dots');
  const slides = track.children.length;
  let idx = 0;
  for(let i=0;i<slides;i++){
    const d = document.createElement('span');
    d.className = 'dot' + (i===0?' active':'');
    dotsWrap.appendChild(d);
  }
  const dots = dotsWrap.children;
  function go(n){
    idx = (n + slides) % slides;
    track.style.transform = 'translateX(-' + idx*100 + '%)';
    for(let i=0;i<dots.length;i++) dots[i].classList.toggle('active', i===idx);
  }
  prev.addEventListener('click', (e)=>{ e.stopPropagation(); go(idx-1); });
  next.addEventListener('click', (e)=>{ e.stopPropagation(); go(idx+1); });
  let timer = setInterval(()=>go(idx+1), 4000);
  gallery.addEventListener('click', ()=>clearInterval(timer));
})();
