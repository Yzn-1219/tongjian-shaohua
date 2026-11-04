# 后期计划：问卷系统迁到 Cloudflare（备忘）

> 状态：**暂不执行**，先记下来。等这次宣讲跑完、确认要长期用，再动手。
> 记录时间：2026-11-01

---

## 一、为什么要考虑迁

现在的问卷跑在 WorkBuddy 云服务上：

- 静态页托管在 sites（`tjsh-survey.app.workbuddy.host`）
- 数据存在 WorkBuddy 云数据库（PostgREST 接口）
- **额度**：体验版 10 个应用名额、单应用 5,000 资源点/月，按月刷新、用不完不累积
- **风险**：官方没有 SLA；体验版标注「限时免费」；资源点用尽后云服务自动暂停，**官方文档没写数据保留期**

对「讲一次就归档」的用法完全够。但如果要变成服务队的长期工具（明年接着用、给别的系讲、加班级筛选），云端稳定性就不该由活动经费之外的东西决定。

---

## 二、迁成什么样

```
Cloudflare Pages（静态，免费）
├── index.html          问卷页（现有，把云 SDK 换成 fetch）
├── admin.html          后台看板（同上）
├── app/                童健韶华 AI 智能健康应用（纯前端，原样搬）
└── assets/             队徽、校徽、系徽

Pages Functions / Worker（免费额度内）
├── POST /api/submit    收一份答卷
├── GET  /api/list      后台拉数据（带口令校验）
└── GET  /api/count     完成页「第 N 份」

D1（SQLite，免费额度内）
└── survey_responses    字段与现在完全一致
```

---

## 三、要改的地方（清单）

1. **前端两处调用**
   - `index.html`：`cloud.database.from('survey_responses').insert(row)` → `fetch('/api/submit', {method:'POST', body: JSON.stringify(row)})`
   - `index.html`：完成页的计数 → `fetch('/api/count?phase=pre')`
   - `admin.html`：读取 → `fetch('/api/list?token=...')`

2. **删掉内联的云 SDK**（71KB），`inline.py` 整套逻辑就不需要了
   （顺带解决：现在为了绕开 sharecode 才内联，Cloudflare 没这个限制）

3. **建表 SQL 直接复用**：
   ```sql
   CREATE TABLE survey_responses (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     phase TEXT NOT NULL,
     screen TEXT, exercise TEXT, harm TEXT, scoring TEXT,
     policy TEXT, importance TEXT, action TEXT, help TEXT, when_start TEXT,
     created_at TEXT DEFAULT (datetime('now','localtime'))
   );
   ```

4. **后台口令改成服务端校验**：现在 `tjsh2026` 写在前端 JS 里，谁都能看到。迁过去顺手修掉。

5. **二维码要重生成**：域名会变，改 `make_qr.py` 里的 `BASE`，重新生成 `qr_pre.png` / `qr_post.png`，再用 `embed_qr.py` 重新插进 PPT 第 2、25 页。

---

## 四、免费额度（以官方为准，迁之前再核一遍）

- **Pages**：静态请求不限量，构建 500 次/月
- **Workers / Functions**：约 10 万次请求/天
- **D1**：约 5GB 存储、每天 500 万行读 / 10 万行写
- **不限时、不按月清零**，这是相比现在最大的好处

> 这些数字来自 Cloudflare 公开的免费套餐说明，可能调整，动手前务必去官网确认当天的政策。

---

## 五、工时与风险

- 工时：约半天（写 Worker 三个接口 + 改两处调用 + 调通 + 重出二维码）
- 风险一：国内访问 Cloudflare 偶尔会慢或抖，宣讲现场要提前测，**建议现场同时保留现在的地址做备用**
- 风险二：D1 是 SQLite，没有 PostgREST 那套 RLS，权限要靠 Worker 自己判断（这也是唯一的写入入口，反而更安全）
- 风险三：迁完旧数据要导一次（后台导出 CSV → 用脚本灌进 D1）

---

## 六、什么时候该动手

满足任意一条就该迁：

- 这套问卷要在**两场以上**活动里用
- 想加**班级筛选、趋势对比、多次宣讲汇总**
- 云端资源点开始告警，或会员到期
- 想把问卷入口正式放进 App 首页长期挂着

如果都没触发，就保持现状，**每次讲完导出一份 CSV 存档**即可。
