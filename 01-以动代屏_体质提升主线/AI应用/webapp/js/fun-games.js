// ===== 趣味运动菜单（可点击弹窗）=====
(function(){
  const $ = id => document.getElementById(id);

  // 五个趣味运动项目，均按 13~15 人整体设计
  const FUN_GAMES = {
    hopscotch: {
      name: '跳房子', emoji: '🦶', tag: '平衡·协调',
      equipment: ['粉笔或宽胶带（地面画格用）', '沙包或小石块 1~2 个'],
      steps: [
        '用粉笔在平整地面画出 1~10 数字格，单格与双格交替，末端画一个"家"',
        '参与者单脚站立，把沙包投入第 1 格',
        '单脚跳入第 1 格，依次向前跳；遇到双格时双脚分别落在两格里',
        '跳到末端后转身往回跳，途中弯腰捡起沙包，原路返回起点',
        '下一位从第 2 格开始（沙包投第 2 格），依次递进；踩线或失去平衡即换人'
      ],
      advice: [
        '13~15 人分 3~4 组，每组轮流上场，以"成功完成的最高格数"排名',
        '可设"3 分钟计时挑战"：全队接力跳，累计通过格数，多者胜',
        '难度升级：蒙眼凭记忆跳、或边跳边背一首古诗'
      ],
      rules: [
        '沙包必须落在格内，压线或出格判失误',
        '单格单脚、双格双脚，中途换脚即失误',
        '捡沙包时身体不得越出格子边界'
      ],
      scoring: '个人：完成格数 × 10 分，失误得 0 分；团队：各组员得分之和 ÷ 人数 = 队均分，队均分高者胜。',
      safety: [
        '地面需平整防滑，避开湿滑与碎石路面',
        '参与者之间拉开间距，避免互相碰撞',
        '穿运动鞋，严禁推搡、起哄'
      ]
    },
    threelegged: {
      name: '两人三足', emoji: '🤝', tag: '协作·竞速',
      equipment: ['绑带或布条（每对 2 条）', '起点 / 终点标志物'],
      steps: [
        '两人并肩站立，将相邻的两条腿在脚踝处用布条绑在一起',
        '一起练习"一二一"口令，统一迈腿节奏',
        '听哨声从起点出发，齐步走到终点',
        '到达终点后解开布条，下一组立即出发',
        '可多组同时出发，以最后一人到达时间计成绩'
      ],
      advice: [
        '13~15 人两两配对成 6~7 组，多组同时出发计到达时间',
        '设"迎面接力"：两组各半，中点交接后返回，更考验配合',
        '趣味进阶：挑战"三人四足"（三人绑中间两腿）'
      ],
      rules: [
        '绑带中途脱落，须在原地重新绑好再继续',
        '必须两人同时越过终点线方算完成',
        '抢跑或拉扯他人，取消本轮成绩'
      ],
      scoring: '计时赛：用时最短组胜，得分 = 1000 ÷ 秒数；接力形式：全队总用时最短者胜。',
      safety: [
        '绑带松紧适中，勿勒伤皮肤，布条优于细绳',
        '跑道无杂物、无积水',
        '有人跌倒立即全体停下，避免连锁绊倒'
      ]
    },
    ropeskip: {
      name: '集体跳绳', emoji: '🪢', tag: '心肺·配合',
      equipment: ['长绳 2~3 根', '计时器 1 个'],
      steps: [
        '两人各持长绳一端站稳，间距约 3~4 米，匀速摇绳',
        '其余人列队，依次跑入绳中连续跳 1 次后跑出（"8 字跳"）',
        '或"集体同步"：多人同时进绳、齐声数拍一起跳',
        '在规定时间内累计成功次数',
        '摇绳者与跳绳者互换角色，保证人人参与'
      ],
      advice: [
        '13~15 人分 2~3 队，每队 2 人摇绳 + 其余跳',
        '项目 A：2 分钟累计跳次；项目 B：连续不中断最多次数',
        '"8 字跳"最考验团队配合，建议作为主赛'
      ],
      rules: [
        '摇绳者站稳、节奏均匀；跳绳者脚未绊绳方计 1 次',
        '中断后从 0 起计（或保留本队最高连续纪录）',
        '每队限时相同，超时停表'
      ],
      scoring: '团队总分 = 2 分钟次数 + 最高连续次数 × 2；另设"跳绳王"：个人连续跳最多者获奖。',
      safety: [
        '摇绳者间距充足，绳长以不扫地为宜',
        '地面防滑，绳周留出安全距离',
        '鞋带系紧，避免踩绳摔倒'
      ]
    },
    relay: {
      name: '接力赛跑', emoji: '🏃', tag: '速度·团队',
      equipment: ['接力棒或替代物（水瓶 / 沙包）', '起点终点标志、分组绳'],
      steps: [
        '将 13~15 人分 3~4 队，每队人数相等',
        '每队沿跑道排布，第一棒持棒从起点跑出',
        '到接力区将棒交予下一棒，依次传递',
        '最后一棒冲过终点，记录全队用时',
        '可设迎面接力（两队各半、中点交接）或环形接力'
      ],
      advice: [
        '迎面接力：两队各半，中点交接；环形接力：绕场地一圈',
        '趣味化：持物接力（端乒乓球 / 抱球跑）、障碍接力',
        '可设"混合赛"：每一棒分配不同任务'
      ],
      rules: [
        '必须在接力区内完成交接，出区判犯规',
        '掉棒须捡起后方可继续，不计时暂停',
        '抢跑或踩线，给予警告一次'
      ],
      scoring: '全队总用时最短队胜，得分 = 1000 ÷ 总秒数；多轮比赛取最好成绩。',
      safety: [
        '交接区明确标线，避免迎面冲撞',
        '跑道无障碍物、无湿滑',
        '跑动方向统一，禁止逆行'
      ]
    },
    beanbag: {
      name: '沙包游戏', emoji: '🎯', tag: '精准·投掷',
      equipment: ['沙包 4~6 个（软质）', '呼啦圈 1~2 个', '计分板 1 块'],
      steps: [
        '在投掷线前方 2~3 米处放 1~2 个呼啦圈（可叠放增加难度）',
        '参与者在投掷线后站定，手持沙包',
        '将沙包投出，使其落入呼啦圈内即得分',
        '每人限投若干次，累计圈内次数',
        '可移动呼啦圈距离或增设内圈，提升挑战'
      ],
      advice: [
        '13~15 人轮流投，每人 5 次机会',
        '进阶玩法：移动呼啦圈距离、双圈叠加（内圈高分）',
        '团队赛：各组累计进圈数，最高者胜'
      ],
      rules: [
        '沙包须完全落入圈内，压线不计分',
        '不得越过投掷线，越线投掷无效',
        '可设"指定圈"：本轮只计某一色呼啦圈'
      ],
      scoring: '进外圈 1 分 / 进内圈 3 分；每人 5 投，满分 15 分；团队 = 全队总分，最高者胜。',
      safety: [
        '统一投掷方向，其他人退至安全区等候',
        '禁止抛向人群，沙包以软质为宜',
        '捡包时注意来包，避免迎面相接'
      ]
    }
  };

  const ORDER = ['hopscotch','threelegged','ropeskip','relay','beanbag'];

  // 渲染菜单卡片
  function renderMenu(){
    const box = $('s-menu');
    if(!box) return;
    box.innerHTML = '';
    ORDER.forEach(key=>{
      const g = FUN_GAMES[key];
      const el = document.createElement('button');
      el.className = 'game-card';
      el.setAttribute('data-game', key);
      el.innerHTML =
        '<span class="game-emoji">'+g.emoji+'</span>'+
        '<span class="game-name">'+g.name+'</span>'+
        '<span class="game-tag">'+g.tag+'</span>'+
        '<span class="game-arrow">查看 ›</span>';
      el.addEventListener('click', ()=> openGame(key));
      box.appendChild(el);
    });
  }

  // 渲染弹窗内容
  function section(icon, title, items){
    return '<div class="game-sec">'+
      '<div class="game-sec-h"><span class="game-sec-ic">'+icon+'</span>'+title+'</div>'+
      '<ul class="game-sec-list">'+ items.map(i=>'<li>'+i+'</li>').join('') +'</ul>'+
    '</div>';
  }

  function openGame(key){
    const g = FUN_GAMES[key];
    if(!g) return;
    $('game-title').textContent = g.emoji + ' ' + g.name + ' · ' + g.tag;
    $('game-body').innerHTML =
      '<div class="game-equip">'+
        '<span class="ge-ic">🎒</span><b>所需物件：</b>'+
        g.equipment.map(e=>'<span class="ge-chip">'+e+'</span>').join('')+
      '</div>'+
      section('📋','操作步骤', g.steps)+
      section('💡','比赛建议', g.advice)+
      section('📜','比赛规则', g.rules)+
      section('🧮','计分模板', [g.scoring])+
      section('⚠️','安全须知', g.safety);
    const m = $('game-modal');
    m.hidden = false;
    m.querySelector('.modal-box').scrollTop = 0;
  }

  function closeGame(){ $('game-modal').hidden = true; }

  // 绑定
  function init(){
    renderMenu();
    const m = $('game-modal');
    if(m){
      $('game-close').addEventListener('click', closeGame);
      m.addEventListener('click', e=>{ if(e.target === m) closeGame(); });
    }
    document.addEventListener('keydown', e=>{ if(e.key === 'Escape' && m && !m.hidden) closeGame(); });
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
