(function(){
  // ---------- 导航 ----------
  const tabs = document.querySelectorAll('.tab');
  const pages = document.querySelectorAll('.page');
  tabs.forEach(t=>{
    t.addEventListener('click', ()=>{
      const id = t.dataset.tab;
      tabs.forEach(x=>x.classList.toggle('active', x===t));
      pages.forEach(p=>p.classList.toggle('active', p.id==='page-'+id));
      window.scrollTo(0,0);
    });
  });

  // ---------- 设置（存本机 localStorage） ----------
  const KEYS = {mode:'tjs_mode', proxy:'tjs_proxy', key:'tjs_key', model:'tjs_model'};
  const cfg = {
    get mode(){ return localStorage.getItem(KEYS.mode) || 'key'; },
    get proxy(){ return localStorage.getItem(KEYS.proxy) || ''; },
    get key(){ return localStorage.getItem(KEYS.key) || ''; },
    get model(){ return localStorage.getItem(KEYS.model) || 'qwen-turbo'; }
  };
  window.AppConfig = cfg;

  const modeSel = document.getElementById('cfg-mode');
  const proxyWrap = document.getElementById('cfg-proxy-wrap');
  const keyWrap = document.getElementById('cfg-key-wrap');
  const proxyInput = document.getElementById('cfg-proxy');
  const keyInput = document.getElementById('cfg-key');
  const modelInput = document.getElementById('cfg-model');
  const statusEl = document.getElementById('cfg-status');
  const scanBtn = document.getElementById('cfg-scan');
  const genBtn = document.getElementById('cfg-genqr');

  let realKey = cfg.key; // 真实 Key 只存在内存 + localStorage，UI 永远显示掩码

  function syncModeUI(){
    const m = modeSel.value;
    proxyWrap.hidden = (m !== 'proxy');
    keyWrap.hidden = (m !== 'key');
  }

  function maskKey(){
    keyInput.value = '●●●●●●●●●●●●  已通过扫码隐藏';
    keyInput.type = 'text';
    keyInput.setAttribute('readonly', 'readonly');
    keyInput.classList.add('key-masked');
    keyInput.setAttribute('data-masked', '1');
  }
  function unmaskKey(){
    keyInput.value = '';
    keyInput.type = 'password';
    keyInput.removeAttribute('readonly');
    keyInput.classList.remove('key-masked');
    keyInput.removeAttribute('data-masked');
  }

  function saveAll(statusMsg){
    const m = modeSel.value;
    const keyToSave = (keyInput.getAttribute('data-masked') === '1')
      ? (realKey || '')
      : keyInput.value.trim();
    localStorage.setItem(KEYS.mode, m);
    localStorage.setItem(KEYS.proxy, proxyInput.value.trim());
    localStorage.setItem(KEYS.key, keyToSave);
    localStorage.setItem(KEYS.model, modelInput.value.trim() || 'qwen-turbo');
    if(keyToSave && !keyInput.getAttribute('data-masked')) maskKey();
    if(statusMsg){
      statusEl.textContent = statusMsg;
      setTimeout(()=>{ statusEl.textContent=''; }, 2600);
    }
  }

  // 初始化 UI
  modeSel.value = cfg.mode;
  proxyInput.value = cfg.proxy;
  modelInput.value = cfg.model;
  syncModeUI();
  if(realKey) maskKey();

  // 防止复制 / 查看真实 Key
  keyInput.addEventListener('copy', e=>e.preventDefault());
  keyInput.addEventListener('cut', e=>e.preventDefault());
  keyInput.addEventListener('contextmenu', e=>e.preventDefault());
  keyInput.addEventListener('selectstart', e=>{
    if(keyInput.getAttribute('data-masked') === '1') e.preventDefault();
  });
  keyInput.addEventListener('keydown', e=>{
    if(keyInput.getAttribute('data-masked') === '1' && (e.ctrlKey || e.metaKey) && (e.key==='c' || e.key==='a')) e.preventDefault();
  });

  modeSel.addEventListener('change', syncModeUI);

  document.getElementById('cfg-save').addEventListener('click', ()=>{
    saveAll('✅ 设置已保存到本机。');
  });

  // ---------- 轻量对称加密（XOR + Base64），仅用于扫码二维码混淆 ----------
  const QR_SECRET = 'TJS-XiaoShao-2026-SDX';   // 固定口令，加解密同源（非高安全，仅防明文泄露）
  function xorCipher(str, key){
    let out = '';
    for(let i=0;i<str.length;i++){
      out += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return out;
  }
  function encryptKey(plain){
    if(!plain) return '';
    return 'TJS1:' + btoa(xorCipher(plain, QR_SECRET));
  }
  function decryptPayload(payload){
    payload = (payload || '').trim();
    if(payload.indexOf('TJS1:') === 0){
      try { return xorCipher(atob(payload.slice(5)), QR_SECRET); }
      catch(e){ return ''; }
    }
    return payload;   // 兼容旧的明文二维码
  }

  // ---------- 生成 Key 二维码（组织者用，加密输出） ----------
  genBtn.addEventListener('click', ()=>{
    const val = (keyInput.getAttribute('data-masked') === '1') ? realKey : keyInput.value.trim();
    if(!val){ statusEl.textContent='⚠️ 请先在上方填入 Key，再生成二维码'; setTimeout(()=>statusEl.textContent='',2600); return; }
    try{
      const qr = qrcode(0, 'M');
      qr.addData(encryptKey(val));
      qr.make();
      document.getElementById('qr-show').innerHTML = qr.createImgTag(8, 12);
      document.getElementById('qr-modal').hidden = false;
    }catch(e){
      statusEl.textContent='⚠️ 生成失败：' + (e&&e.message?e.message:e);
      setTimeout(()=>statusEl.textContent='',2600);
    }
  });
  document.getElementById('qr-close').addEventListener('click', ()=>{
    document.getElementById('qr-modal').hidden = true;
  });

  // ---------- 扫码填入（参与者用） ----------
  let scanStream = null, scanRAF = null, scanning = false;
  const scanModal = document.getElementById('scan-modal');
  const scanTip = document.getElementById('scan-tip');

  scanBtn.addEventListener('click', startScan);
  document.getElementById('scan-close').addEventListener('click', stopScan);

  async function startScan(){
    if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
      statusEl.textContent='⚠️ 当前环境不支持摄像头（需 HTTPS 或本机打开）';
      setTimeout(()=>statusEl.textContent='',2600); return;
    }
    let stream;
    try{
      stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:'environment' }, audio:false });
    }catch(e){
      statusEl.textContent='⚠️ 无法打开摄像头：' + (e&&e.message?e.message:e);
      setTimeout(()=>statusEl.textContent='',2600); return;
    }
    scanStream = stream;
    const video = document.getElementById('scan-video');
    video.srcObject = scanStream;
    scanTip.textContent = '将本工具生成的二维码对准取景框（自动解密）…';
    scanModal.hidden = false;
    try{ await video.play(); }catch(e){}
    scanning = true;
    scanLoop();
  }

  function scanLoop(){
    if(!scanning) return;
    const video  = document.getElementById('scan-video');
    const canvas = document.getElementById('scan-canvas');
    if(video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth){
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      try{
        const img  = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(img.data, img.width, img.height, { inversionAttempts:'attemptBoth' });
        if(code && code.data){
          const val = decryptPayload(code.data);
          if(!val){
            scanTip.textContent = '⚠️ 未能识别：这不是本工具生成的加密码';
            return;
          }
          realKey = val;
          modeSel.value = 'key';
          syncModeUI();
          maskKey();
          saveAll('✅ 已解密并自动保存 Key（已隐藏）');
          scanTip.textContent = '✅ 已解密：' + (val.length>22?val.slice(0,14)+'…':val) + '，已自动保存并隐藏';
          stopScan();
          setTimeout(()=>{ scanModal.hidden = true; }, 900);
          return;
        }
      }catch(e){}
    }
    scanRAF = requestAnimationFrame(scanLoop);
  }

  function stopScan(){
    scanning = false;
    if(scanRAF) cancelAnimationFrame(scanRAF);
    if(scanStream){ scanStream.getTracks().forEach(t=>t.stop()); scanStream = null; }
  }

  // ---------- PWA 安装 ----------
  let deferredPrompt = null;
  const installBtn = document.getElementById('installBtn');
  window.addEventListener('beforeinstallprompt', (e)=>{
    e.preventDefault(); deferredPrompt = e; installBtn.hidden = false;
  });
  installBtn.addEventListener('click', async ()=>{
    if(!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null; installBtn.hidden = true;
  });
  window.addEventListener('appinstalled', ()=>{ installBtn.hidden = true; });

  // ---------- Service Worker（离线缓存） ----------
  if('serviceWorker' in navigator){
    window.addEventListener('load', ()=>{
      navigator.serviceWorker.register('service-worker.js').catch(err=>console.warn('SW 注册失败', err));
    });
  }

  // ---------- 离线提示 ----------
  const toast = document.createElement('div');
  toast.className = 'offline-toast';
  toast.textContent = '📴 当前离线，AI 生成需联网';
  document.body.appendChild(toast);
  function updateOnline(){
    if(!navigator.onLine) toast.classList.add('show');
    else toast.classList.remove('show');
  }
  window.addEventListener('online', updateOnline);
  window.addEventListener('offline', updateOnline);
  updateOnline();

  // ---------- 合照轮播 ----------
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
    prev.addEventListener('click', ()=>go(idx-1));
    next.addEventListener('click', ()=>go(idx+1));
    let timer = setInterval(()=>go(idx+1), 4000);
    gallery.addEventListener('click', ()=>clearInterval(timer));
  })();

  // ---------- 政策文件查看弹窗 ----------
  const PLAN_DOCS = {
    plan1: { title: '《体育强国建设"十五五"规划》', pages: 17 },
    plan2: { title: '《全民健身计划（2026—2030年）》', pages: 7 }
  };
  const docModal  = document.getElementById('doc-modal');
  const docViewer = document.getElementById('doc-viewer');
  const docTitle  = document.getElementById('doc-title');
  document.querySelectorAll('.doc-item').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const info = PLAN_DOCS[btn.dataset.plan];
      if(!info) return;
      docTitle.textContent = info.title;
      let html = '';
      for(let i=1;i<=info.pages;i++){
        const n = String(i).padStart(2,'0');
        html += '<img class="doc-page" src="docs/imgs/' + btn.dataset.plan + '-' + n + '.jpg" alt="' + info.title + ' 第' + i + '页" loading="lazy">';
      }
      docViewer.innerHTML = html;
      docModal.hidden = false;
    });
  });
  function closeDoc(){
    docModal.hidden = true;
    docViewer.innerHTML = '';
  }
  document.getElementById('doc-close').addEventListener('click', closeDoc);
  docModal.addEventListener('click', e=>{ if(e.target === docModal) closeDoc(); });
})();
