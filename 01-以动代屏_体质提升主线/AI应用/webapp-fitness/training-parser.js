// ===== 自然语言训练解析器 =====
const TrainingParser = (function() {

  const PARTS = [
    { id: 'cardio', name: '有氧', keywords: ['跑步','跑','快走','游泳','骑车','跳绳','椭圆','划船机','爬楼','hiit','波比','动感'] },
    { id: 'chest', name: '胸部', keywords: ['卧推','推胸','夹胸','飞鸟','俯卧撑','双杠','胸'] },
    { id: 'back', name: '背部', keywords: ['引体','划船','下拉','硬拉','背阔','背'] },
    { id: 'legs', name: '腿部', keywords: ['深蹲','箭步','臀','髋','提踵','腿举','保加利亚','臀桥','腿'] },
    { id: 'shoulder', name: '肩部', keywords: ['推举','侧平举','前平举','后束','面拉','阿诺德','肩'] },
    { id: 'arms', name: '手臂', keywords: ['弯举','臂屈伸','锤式','肱二','肱三','二头','三头','臂'] },
    { id: 'core', name: '核心', keywords: ['平板','卷腹','核心','腰腹','仰卧起坐','俄罗斯','悬垂举腿','腹肌'] },
    { id: 'stretch', name: '拉伸', keywords: ['拉伸','瑜伽','放松','舒展','泡沫轴','开肩'] },
    { id: 'rest', name: '休息日', keywords: ['休息','没练','躺平','歇','恢复日','没动','偷懒','放假'] },
  ];

  const MET_RATE = { cardio: 8, legs: 6, chest: 5, back: 5, shoulder: 5, arms: 4, core: 4, stretch: 2, rest: 0 };

  function parse(text) {
    if (!text || !text.trim()) return null;
    const t = text.trim();

    // 1. 部位识别（取最早出现的）
    let partId = null, partName = '', partPos = Infinity;
    for (const p of PARTS) {
      for (const kw of p.keywords) {
        const idx = t.indexOf(kw);
        if (idx >= 0 && idx < partPos) {
          partPos = idx;
          partId = p.id;
          partName = p.name;
        }
      }
    }
    // rest 权重最低：仅在没有其他部位命中时才判为休息日
    if (partId === 'rest') {
      const nonRestParts = PARTS.filter(p => p.id !== 'rest');
      let hasNonRest = false;
      for (const p of nonRestParts) {
        for (const kw of p.keywords) {
          if (t.indexOf(kw) >= 0) { hasNonRest = true; break; }
        }
        if (hasNonRest) break;
      }
      if (hasNonRest) {
        // 重新找非 rest 部位
        partPos = Infinity;
        for (const p of nonRestParts) {
          for (const kw of p.keywords) {
            const idx = t.indexOf(kw);
            if (idx >= 0 && idx < partPos) {
              partPos = idx;
              partId = p.id;
              partName = p.name;
            }
          }
        }
      }
    }

    // 2. 时长提取
    const duration = extractDuration(t);

    // 3. 组次提取
    const setsReps = extractSetsReps(t);

    // 4. 重量提取
    const weight = extractWeight(t);

    // 5. 置信度
    let conf = 0;
    if (partId) conf += 0.5;
    if (duration > 0 || setsReps.length > 0 || weight > 0) conf += 0.3;
    else conf += 0.1;
    if (t.length > 2) conf += 0.2;
    conf = Math.min(conf, 1.0);

    // 6. 消耗估算
    const calories = Math.round((duration || 0) * (MET_RATE[partId] || 5));

    // 7. 重组展示文本
    const display = reassemble(t, partName, duration, setsReps, weight);

    // 8. 是否休息日
    const isRest = partId === 'rest';

    return { partId, partName, duration, setsReps, weight, calories, confidence: conf, display, isRest };
  }

  function extractDuration(t) {
    // 中文特殊表达
    if (/半小时|半个钟/.test(t)) return 30;
    if (/一个半小时/.test(t)) return 90;
    const hMatch = t.match(/(\d+)个?小时/);
    if (hMatch) {
      const h = parseInt(hMatch[1]);
      const mMatch = t.match(/(\d+)分/);
      return h * 60 + (mMatch ? parseInt(mMatch[1]) : 0);
    }
    // 数字+单位
    const m = t.match(/(\d+)\s*(分钟|分|min|m(?![a-z]))/i);
    if (m) return parseInt(m[1]);
    return 0;
  }

  function extractSetsReps(t) {
    const results = [];
    // 符号式 4×8 / 4x8 / 4*8
    const symRe = /(\d+)\s*[×x*]\s*(\d+)/gi;
    let m;
    while ((m = symRe.exec(t)) !== null) {
      results.push({ sets: parseInt(m[1]), reps: parseInt(m[2]) });
    }
    // 中文式 4组8次 / 4组8个 / 4组8下
    const cnRe = /(\d+)\s*组\s*(\d+)\s*(?:次|个|下)/g;
    while ((m = cnRe.exec(t)) !== null) {
      const exists = results.some(r => r.sets === parseInt(m[1]) && r.reps === parseInt(m[2]));
      if (!exists) results.push({ sets: parseInt(m[1]), reps: parseInt(m[2]) });
    }
    // 残缺式：仅"4组"或"8次"
    if (results.length === 0) {
      const setsOnly = t.match(/(\d+)\s*组/);
      const repsOnly = t.match(/(\d+)\s*(?:次|个|下)/);
      if (setsOnly || repsOnly) {
        results.push({ sets: setsOnly ? parseInt(setsOnly[1]) : 0, reps: repsOnly ? parseInt(repsOnly[1]) : 0 });
      }
    }
    return results;
  }

  function extractWeight(t) {
    // @70kg / 70kg / 70公斤
    let m = t.match(/@?\s*(\d+(?:\.\d+)?)\s*kg/i);
    if (m) return parseFloat(m[1]);
    m = t.match(/(\d+(?:\.\d+)?)\s*公斤/);
    if (m) return parseFloat(m[1]);
    // 市斤 140斤 → 70kg
    m = t.match(/(\d+(?:\.\d+)?)\s*斤/);
    if (m) return Math.round(parseFloat(m[1]) / 2);
    return 0;
  }

  function reassemble(t, partName, duration, setsReps, weight) {
    // 去人称/时间前缀
    let s = t.replace(/^(我|今天|刚|刚刚|刚刚才)\s*/g, '');
    // 去句尾语气词
    s = s.replace(/(了|啦|嘛|吧|呢)$/g, '');
    // 去多余标点
    s = s.trim();
    return s;
  }

  function getPartColor(partId) {
    const map = { cardio:'#e63946', chest:'#f59e0b', back:'#3b82f6', legs:'#8b5cf6',
                  shoulder:'#06b6d4', arms:'#ec4899', core:'#10b981', stretch:'#6366f1', rest:'#9ca3af' };
    return map[partId] || '#9ca3af';
  }

  function getPartName(partId) {
    const p = PARTS.find(p => p.id === partId);
    return p ? p.name : '';
  }

  return { parse, PARTS, MET_RATE, getPartColor, getPartName };
})();
