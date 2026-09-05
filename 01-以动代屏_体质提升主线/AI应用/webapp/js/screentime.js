(function(){
  const $ = id => document.getElementById(id);

  // 阶段建议（娱乐屏幕时长上限，小时；每日户外建议分钟）
  const STAGE = {
    '幼儿':  { screen: 1,   outdoor: 120, label: '幼儿（3-6 岁）' },
    '小学':  { screen: 1.5, outdoor: 90,  label: '小学（7-12 岁）' },
    '初中':  { screen: 2,   outdoor: 60,  label: '初中（13-15 岁）' },
    '高中':  { screen: 2.5, outdoor: 45,  label: '高中（16-18 岁）' },
    '成人':  { screen: 3,   outdoor: 30,  label: '成人（19 岁以上）' }
  };

  // 趣味运动菜单改由 fun-games.js 统一渲染（5 个固定项目，可点击弹窗）
  // 滑块联动
  const screenInput = $('s-screen');
  const screenVal = $('s-screen-val');
  screenInput.addEventListener('input', ()=>{ screenVal.textContent = screenInput.value; });

  // 评估
  $('s-submit').addEventListener('click', ()=>{
    const stage = $('s-stage').value;
    const screen = parseFloat(screenInput.value);
    const outdoor = parseFloat($('s-outdoor').value);
    const cfg = STAGE[stage];
    const wrap = $('s-result');
    const report = $('s-report');

    let level, color, advice;
    if(screen <= cfg.screen){
      level = '✅ 屏幕使用处于合理范围';
      color = '#187061';
      advice = '继续保持！配合规律的户外活动，屏幕时间管理得不错。';
    } else if(screen <= cfg.screen + 1){
      level = '⚠️ 屏幕使用略偏高';
      color = '#b8860b';
      advice = '娱乐屏幕已超出本阶段建议上限，建议用趣味运动替代部分刷屏时间。';
    } else {
      level = '🔴 屏幕使用明显过量';
      color = '#e63946';
      advice = '娱乐屏幕远超建议上限，长期易影响视力、体重与睡眠，需立即用「以动代屏」方式干预。';
    }

    let outdoorTip = '';
    if(outdoor <= 0.5){
      outdoorTip = '当前户外活动严重不足，应优先把屏幕时间「挪」到户外——从每天 20 分钟跳房子、跳绳开始。';
    } else if(outdoor < cfg.outdoor/60){
      outdoorTip = '户外活动有基础，可再增加到约 '+Math.round(cfg.outdoor)+' 分钟/天，效果更佳。';
    } else {
      outdoorTip = '户外活动达标，继续保持，让运动成为和屏幕一样的日常习惯。';
    }

    report.innerHTML =
      '<p style="color:'+color+';font-weight:600;font-size:16px">'+level+'</p>'+
      '<p>本阶段建议娱乐屏幕 ≤ <b>'+cfg.screen+' 小时</b>/天，你当前 <b>'+screen+' 小时</b>；'+
      '建议每日户外/运动 ≥ <b>'+Math.round(cfg.outdoor)+' 分钟</b>。</p>'+
      '<p>'+advice+'</p>'+
      '<p>'+outdoorTip+'</p>'+
      '<p style="margin-top:10px">👉 点下方按钮，生成一份可执行的「健康用网契约」。</p>';
    wrap.hidden = false;
    $('s-contract-box').hidden = true;
  });

  // 生成契约
  $('s-contract').addEventListener('click', ()=>{
    const stage = $('s-stage').value;
    const screen = parseFloat(screenInput.value);
    const cfg = STAGE[stage];
    const limit = Math.min(screen, cfg.screen); // 承诺不超过建议上限
    const outdoorMin = Math.round(cfg.outdoor);
    const text =
'【健康用网契约】\n'+
'适用阶段：'+cfg.label+'\n\n'+
'我（孩子）承诺：\n'+
'1. 每天娱乐屏幕时间不超过 '+limit+' 小时；\n'+
'2. 每天保证 '+outdoorMin+' 分钟以上户外/运动时间；\n'+
'3. 吃饭、睡前 1 小时不碰屏幕；\n'+
'4. 先动起来再做电子游戏——遇到好玩的运动先试一试。\n\n'+
'家长/监护人承诺：\n'+
'1. 以身作则，减少不必要的刷屏；\n'+
'2. 每周陪我完成至少 1 次趣味运动（跳房子 / 跳绳 / 三人两足 / 接力赛等）。\n\n'+
'立约人：__________    监护人：__________    日期：______';
    $('s-contract-text').textContent = text;
    $('s-contract-box').hidden = false;
    // 存文本用于复制
    $('s-contract-box').dataset.text = text;
  });

  $('s-copy-contract').addEventListener('click', ()=>{
    const t = $('s-contract-box').dataset.text || '';
    if(!t) return;
    navigator.clipboard.writeText(t).then(()=>alert('✅ 契约已复制')).catch(()=>alert('复制失败，请手动选择'));
  });
})();
