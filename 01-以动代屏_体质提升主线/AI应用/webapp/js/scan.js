(function(){
  const keyInput  = document.getElementById('cfg-key');
  const scanBtn   = document.getElementById('cfg-scan');
  const genBtn    = document.getElementById('cfg-genqr');
  const eyeBtn    = document.getElementById('cfg-toggle-eye');
  const statusEl  = document.getElementById('cfg-status');

  function setStatus(msg, warn){
    statusEl.textContent = msg;
    statusEl.style.color = warn ? '#c0392b' : '';
    setTimeout(()=>{ statusEl.textContent=''; statusEl.style.color=''; }, 3200);
  }

  // ---------- 显示 / 隐藏 Key ----------
  let eyeOn = false;
  eyeBtn.addEventListener('click', ()=>{
    eyeOn = !eyeOn;
    keyInput.type = eyeOn ? 'text' : 'password';
    eyeBtn.textContent = eyeOn ? '🙈 隐藏' : '👁 显示';
  });

  // ---------- 生成 Key 二维码（组织者用） ----------
  genBtn.addEventListener('click', ()=>{
    const val = keyInput.value.trim();
    if(!val){ setStatus('⚠️ 请先在上方填入 Key，再生成二维码', true); return; }
    try{
      const qr = qrcode(0, 'M');
      qr.addData(val);
      qr.make();
      document.getElementById('qr-show').innerHTML = qr.createImgTag(8, 12);
      document.getElementById('qr-modal').hidden = false;
    }catch(e){ setStatus('⚠️ 生成失败：' + (e && e.message ? e.message : e), true); }
  });
  document.getElementById('qr-close').addEventListener('click', ()=>{
    document.getElementById('qr-modal').hidden = true;
  });

  // ---------- 扫码填入（参与者用） ----------
  let scanStream = null, scanRAF = null, scanning = false;

  scanBtn.addEventListener('click', startScan);
  document.getElementById('scan-close').addEventListener('click', stopScan);

  async function startScan(){
    if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
      setStatus('⚠️ 当前环境不支持摄像头（需 HTTPS 或本机打开）', true); return;
    }
    let stream;
    try{
      stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:'environment' }, audio:false });
    }catch(e){
      setStatus('⚠️ 无法打开摄像头：' + (e && e.message ? e.message : e), true); return;
    }
    scanStream = stream;
    const video = document.getElementById('scan-video');
    video.srcObject = scanStream;
    document.getElementById('scan-tip').textContent = '将含 Key 的二维码对准取景框…';
    document.getElementById('scan-modal').hidden = false;
    try{ await video.play(); }catch(e){ /* autoplay 可能需交互，按钮已交互 */ }
    scanning = true;
    scanLoop();
  }

  function scanLoop(){
    if(!scanning) return;
    const video  = document.getElementById('scan-video');
    const canvas = document.getElementById('scan-canvas');
    const tip    = document.getElementById('scan-tip');
    if(video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth){
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      try{
        const img  = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(img.data, img.width, img.height, { inversionAttempts:'attemptBoth' });
        if(code && code.data){
          const val = code.data.trim();
          keyInput.value = val;
          tip.textContent = '✅ 已读取：' + (val.length > 22 ? val.slice(0,14) + '…' : val);
          stopScan();
          setStatus('✅ 已从二维码填入 Key（记得点「保存设置」）', false);
          setTimeout(()=>{ document.getElementById('scan-modal').hidden = true; }, 800);
          return;
        }
      }catch(e){ /* 单帧解码失败，继续 */ }
    }
    scanRAF = requestAnimationFrame(scanLoop);
  }

  function stopScan(){
    scanning = false;
    if(scanRAF) cancelAnimationFrame(scanRAF);
    if(scanStream){ scanStream.getTracks().forEach(t=>t.stop()); scanStream = null; }
  }
})();
