// ================= 紫微斗數「轉命盤分析報告」（問測式命盤解析） =================
// 章法比照《斗數論命實例解析》的問測案例：
//   【問測】標題 → 提問內容（出生資料＋問題）→ 回覆內容（針對所問直接作答）
//   → 命盤解析及內容說明：本命盤圖＋本命解析、大限盤圖＋大限解析、流年盤圖＋流年解析 → 結語與建議。
// 排盤資料來自 iztro（app.js 的 zwState.a），評分與四化／流曜工具沿用 js/ziwei-report.js（ZiweiReport.view 等），
// 文字庫在 js/ziwei-mingpan-content.js。
(function () {
  const C = window.ZW_MP_CONTENT;
  const ZR = window.ZiweiReport;
  const ZHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  const MAJOR14 = ["紫微", "天機", "太陽", "武曲", "天同", "廉貞", "天府", "太陰", "貪狼", "巨門", "天相", "天梁", "七殺", "破軍"];
  const SHA_GROUP = { 擎羊: "羊陀", 陀羅: "羊陀", 火星: "火鈴", 鈴星: "火鈴", 地空: "空劫", 地劫: "空劫" };
  const LUCKY_GROUP = { 左輔: "輔弼", 右弼: "輔弼", 文昌: "昌曲", 文曲: "昌曲", 天魁: "魁鉞", 天鉞: "魁鉞", 祿存: "祿存", 天馬: "天馬", 紅鸞: "鸞喜", 天喜: "鸞喜" };
  const FLOW_BASE = { 祿: "祿存", 羊: "擎羊", 陀: "陀羅", 昌: "文昌", 曲: "文曲", 魁: "天魁", 鉞: "天鉞", 馬: "天馬", 鸞: "紅鸞", 喜: "天喜" };
  const MUTS = ["祿", "權", "科", "忌"];
  const BRIGHT_TEXT = { 不: "閑" };
  const GOOD_BRIGHT = { 廟: 1, 旺: 1, 得: 1, 利: 1 };
  const PEACH = ["紅鸞", "天喜", "咸池", "天姚"];
  const HORSE_BRANCH = { 寅: 1, 申: 1, 巳: 1, 亥: 1 }; // 四馬地
  const TOMB_BRANCH = { 辰: 1, 戌: 1, 丑: 1, 未: 1 }; // 四墓地
  // 問測主題：標題、預設提問、重點宮位（依序）、回覆要談的面向
  const TOPICS = {
    感情婚姻: { title: "桃花與婚姻", ask: "想請老師幫我看看感情與婚姻，什麼時候會有好的姻緣？對象會是什麼樣的人？", pals: ["夫妻", "福德", "命宮", "子女"], tags: ["love", "timing"] },
    事業工作: { title: "工作運與事業方向", ask: "最近為工作的方向很迷惑，想請老師幫我看看適合什麼樣的工作，今年的工作運如何？", pals: ["官祿", "命宮", "遷移", "僕役"], tags: ["career", "year"] },
    財運創業: { title: "財運與創業時機", ask: "想請老師看看我的財運，現在事業上應該守還是該攻？流年到幾歲的時候再來做生意會比較好？", pals: ["財帛", "田宅", "官祿", "命宮"], tags: ["wealth", "startup"] },
    健康: { title: "健康與身體狀況", ask: "想請老師幫我看看身體健康方面要注意什麼，近年要留意哪些問題？", pals: ["疾厄", "命宮", "福德", "父母"], tags: ["health"] },
    轉行出國: { title: "轉行與出外發展", ask: "想請老師幫我看看是否適合轉行或到外地發展，命盤上我的專長與方向是什麼？", pals: ["遷移", "官祿", "命宮", "父母"], tags: ["career", "move"] },
    綜合命盤: { title: "整體命盤分析", ask: "想請老師幫我整體分析紫微命盤，個性、事業、感情、財運與健康各方面。", pals: ["命宮", "夫妻", "官祿", "財帛", "田宅", "疾厄", "福德", "父母", "僕役", "遷移", "子女", "兄弟"], tags: ["love", "career", "wealth", "health", "timing"] }
  };
  const PAL_ORDER = ["命宮", "父母", "福德", "田宅", "官祿", "僕役", "遷移", "疾厄", "財帛", "子女", "夫妻", "兄弟"]; // iztro 宮位順序（命宮起順行）

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const uniq = (arr) => arr.filter((v, i) => arr.indexOf(v) === i);
  const bright = (s) => { const b = BRIGHT_TEXT[s.brightness] || s.brightness || ""; return b ? "（" + b + "）" : ""; };
  const flowBase = (n) => (n.length === 2 && (n[0] === "運" || n[0] === "流") ? FLOW_BASE[n[1]] || n : n);
  const pad2 = (n) => String(n).padStart(2, "0");
  const join = (arr, sep) => arr.filter(Boolean).join(sep || "、");

  // ---------- 盤面模型 ----------
  function model(a) {
    const pal = a.palaces.map((p, i) => ({
      i, p, name: p.name, stem: p.heavenlyStem, branch: p.earthlyBranch, body: p.isBodyPalace,
      majors: p.majorStars, minors: p.minorStars, adjs: p.adjectiveStars,
      majorNames: p.majorStars.map((s) => s.name), minorNames: p.minorStars.map((s) => s.name), adjNames: p.adjectiveStars.map((s) => s.name),
      range: p.decadal.range
    }));
    const byName = {}; pal.forEach((x) => { byName[x.name] = x; });
    const starIdx = {};
    pal.forEach((x) => x.majorNames.concat(x.minorNames, x.adjNames).forEach((n) => { starIdx[n] = x.i; }));
    const natalMuts = [];
    pal.forEach((x) => x.majors.concat(x.minors).forEach((s) => { if (s.mutagen) natalMuts.push({ star: s.name, mut: s.mutagen, idx: x.i }); }));
    natalMuts.sort((p, q) => MUTS.indexOf(p.mut) - MUTS.indexOf(q.mut));
    return { a, pal, byName, starIdx, natalMuts };
  }
  const tri = (i) => [i, (i + 4) % 12, (i + 8) % 12, (i + 6) % 12];
  const opp = (i) => (i + 6) % 12;
  const flank = (i) => [(i + 1) % 12, (i + 11) % 12];
  function allNames(M, i) { const x = M.pal[i]; return x.majorNames.concat(x.minorNames, x.adjNames); }
  function inSet(M, idxs, name) { return idxs.some((i) => allNames(M, i).indexOf(name) >= 0); }
  const inTri = (M, i, name) => inSet(M, tri(i), name);
  function groups(names, map) { const g = {}; names.forEach((n) => { const k = map[flowBase(n)]; if (k) (g[k] = g[k] || []).push(n); }); return g; }
  function starLine(x, muts) {
    const tag = (n) => (muts || []).filter((m) => m.star === n).map((m) => "化" + m.mut).join("");
    const parts = x.majors.map((s) => s.name + bright(s) + tag(s.name));
    if (!parts.length) parts.push("空宮");
    x.minors.forEach((s) => parts.push(s.name + tag(s.name)));
    x.adjs.forEach((s) => { if (PEACH.indexOf(s.name) >= 0) parts.push(s.name); });
    return parts.join("、");
  }
  const majorsText = (x) => (x.majorNames.length ? x.majorNames.join("") : "");
  const isGood = (s) => GOOD_BRIGHT[s.brightness] === 1;

  // ---------- 格局偵測（本命） ----------
  function detectPatterns(M) {
    const soul = M.byName["命宮"], si = soul.i, T = tri(si), out = [];
    const has = (n) => inTri(M, si, n);
    const starAt = (n) => M.starIdx[n];
    const add = (id, where) => { if (C.PATTERNS[id]) out.push({ id, where: where || "" }); };
    const majorsTri = uniq(T.map((i) => M.pal[i].majorNames).flat());
    // 機月同梁
    if (["天機", "太陰", "天同", "天梁"].filter((n) => majorsTri.indexOf(n) >= 0).length >= 3 && soul.majorNames.some((n) => ["天機", "太陰", "天同", "天梁"].indexOf(n) >= 0)) add("機月同梁");
    // 日月並明／反背
    const sun = M.pal[starAt("太陽")].majors.find((s) => s.name === "太陽"), moon = M.pal[starAt("太陰")].majors.find((s) => s.name === "太陰");
    if (has("太陽") && has("太陰") && isGood(sun) && isGood(moon)) add("日月並明");
    else if (!isGood(sun) && !isGood(moon) && (has("太陽") || has("太陰"))) add("日月反背");
    // 府相朝垣：府相自三方會命（命宮非府相本身亦可）
    if (has("天府") && has("天相")) add("府相朝垣");
    // 君臣慶會／輔弼拱命
    const fuBiTri = ["左輔", "右弼"].filter(has).length, fuBiFlank = ["左輔", "右弼"].filter((n) => inSet(M, flank(si), n)).length;
    if (soul.majorNames.indexOf("紫微") >= 0 && (fuBiTri >= 1 || fuBiFlank === 2 || ["文昌", "文曲"].filter(has).length === 2)) add("君臣慶會");
    else if (fuBiTri === 2 || fuBiFlank === 2) add("輔弼拱命");
    if (soul.majorNames.indexOf("紫微") >= 0 && soul.majorNames.indexOf("天府") >= 0) add("紫府同宮");
    // 三奇佳會
    const mutTri = (mut) => M.natalMuts.some((m) => m.mut === mut && T.indexOf(m.idx) >= 0);
    if (mutTri("祿") && mutTri("權") && mutTri("科")) add("三奇佳會");
    // 祿馬交馳（命／財／遷 三方四正：祿存或化祿與天馬同會）
    const luIdxs = M.natalMuts.filter((m) => m.mut === "祿").map((m) => m.idx).concat([starAt("祿存")]);
    const horse = starAt("天馬");
    if (horse != null && luIdxs.some((li) => li === horse || tri(horse).indexOf(li) >= 0) && T.indexOf(horse) >= 0) add("祿馬交馳");
    // 陽梁昌祿（任一宮三方四正同會四星）
    for (let i = 0; i < 12; i++) {
      const t = tri(i);
      if (inSet(M, t, "太陽") && inSet(M, t, "天梁") && inSet(M, t, "文昌") && (inSet(M, t, "祿存") || M.natalMuts.some((m) => m.mut === "祿" && t.indexOf(m.idx) >= 0))) { add("陽梁昌祿", M.pal[i].name); break; }
    }
    // 梁馬飄蕩（天梁與天馬同宮或對照）
    const liang = starAt("天梁");
    if (horse != null && liang != null && (horse === liang || opp(horse) === liang)) add("梁馬飄蕩", M.pal[horse].name === "命宮" || M.pal[liang].name === "命宮" ? "命宮" : M.pal[horse].name);
    // 武貪同行
    if (starAt("武曲") === starAt("貪狼")) add("武貪同行", M.pal[starAt("武曲")].name);
    if (soul.majorNames.some((n) => ["七殺", "破軍", "貪狼"].indexOf(n) >= 0)) add("殺破狼");
    if (soul.majorNames.indexOf("巨門") >= 0 && (soul.branch === "子" || soul.branch === "午")) add("石中隱玉");
    if (soul.majorNames.indexOf("巨門") >= 0 && soul.majorNames.indexOf("太陽") >= 0) add("巨日同宮");
    const tan = starAt("貪狼");
    if (tan != null && (starAt("火星") === tan || starAt("鈴星") === tan)) add("火貪鈴貪", M.pal[tan].name);
    // 羊陀夾（永遠夾祿存宮）
    const lucun = starAt("祿存");
    if (lucun != null) add("羊陀夾", M.pal[lucun].name);
    const kong = starAt("地空"), jie = starAt("地劫");
    if (kong != null && jie != null && flank(si).indexOf(kong) >= 0 && flank(si).indexOf(jie) >= 0 && kong !== jie) add("空劫夾命");
    // 雙祿交流（命三方同時見祿存與化祿）
    if (T.indexOf(lucun) >= 0 && M.natalMuts.some((m) => m.mut === "祿" && T.indexOf(m.idx) >= 0 && m.idx !== lucun)) add("雙祿交流");
    // 倒祿（祿存與空劫同宮或被拱）
    if (lucun != null && [kong, jie].some((k) => k === lucun || tri(lucun).slice(1).indexOf(k) >= 0)) add("倒祿", M.pal[lucun].name);
    // 財逢煞庫逢空
    const cai = M.byName["財帛"], tian = M.byName["田宅"];
    if (cai.minorNames.some((n) => SHA_GROUP[n]) && tian.minorNames.some((n) => SHA_GROUP[n] === "空劫")) add("財逢煞庫逢空");
    if (!out.some((o) => o.id === "君臣慶會" || o.id === "輔弼拱命")) {
      if (["文昌", "文曲"].filter(has).length === 2 || ["文昌", "文曲"].filter((n) => inSet(M, flank(si), n)).length === 2) add("昌曲拱命");
    }
    if (["天魁", "天鉞"].filter(has).length === 2 || ["天魁", "天鉞"].filter((n) => inSet(M, flank(si), n)).length === 2) add("魁鉞拱命");
    if (!soul.majorNames.length) add("命無正曜");
    return out;
  }

  // ---------- 單宮解析（本命） ----------
  // role＝宮位角色（夫妻／財帛…），x＝該宮；回傳段落陣列
  function palaceParagraphs(M, role, gender) {
    const x = M.byName[role];
    const out = [];
    const mutsHere = M.natalMuts.filter((m) => m.idx === x.i);
    const o = M.pal[opp(x.i)];
    const main = [];
    if (role === "命宮") {
      main.push(soulPersonality(M, gender));
    } else {
      const lib = C.P[role] || {};
      if (x.majorNames.length) x.majorNames.forEach((n) => { if (lib[n]) main.push(lib[n]); });
      else {
        main.push(role + "宮無主星，借對宮" + (o.majorNames.join("") || "星曜") + "來論，此事受外在環境與對方影響較大。");
        o.majorNames.forEach((n) => { if (lib[n]) main.push(lib[n]); });
      }
    }
    // 四化
    mutsHere.forEach((m) => { const t = ZR.PAL[role] && ZR.PAL[role][{ 祿: "lu", 權: "quan", 科: "ke", 忌: "ji" }[m.mut]]; if (t) main.push("生年" + m.star + "化" + m.mut + "坐" + role + "，" + t + "。"); });
    const jiOpp = M.natalMuts.filter((m) => m.mut === "忌" && m.idx === opp(x.i));
    jiOpp.forEach((m) => main.push("對宮" + m.star + "化忌沖入，" + (ZR.PAL[role] ? ZR.PAL[role].chong : "") + "。"));
    out.push(main.join(""));
    // 煞吉
    const sha = groups(x.minorNames, SHA_GROUP), lucky = groups(x.minorNames.concat(x.adjNames), LUCKY_GROUP);
    const sec = [];
    Object.keys(sha).forEach((g) => { if (C.SHA[role] && C.SHA[role][g]) sec.push(C.SHA[role][g]); });
    Object.keys(lucky).forEach((g) => { if (C.LUCKY[role] && C.LUCKY[role][g]) sec.push(C.LUCKY[role][g]); });
    // 三方煞曜匯聚
    const triSha = uniq(tri(x.i).slice(1).map((i) => M.pal[i].minorNames.filter((n) => SHA_GROUP[n])).flat());
    if (triSha.length >= 2 && role !== "命宮") sec.push("三方又會" + triSha.join("、") + "，煞星匯聚，" + role + "所主之事起伏更大，更要用心經營。");
    const triLucky = uniq(tri(x.i).slice(1).map((i) => M.pal[i].minorNames.filter((n) => ["左輔", "右弼", "天魁", "天鉞", "文昌", "文曲"].indexOf(n) >= 0)).flat());
    if (triLucky.length >= 2 && !Object.keys(sha).length) sec.push("三方會" + triLucky.join("、") + "等吉星拱照，雖有困難也總會有及時的助力出現。");
    if (sec.length) out.push(sec.join(""));
    // 宮位專屬
    const extra = specialNotes(M, role, gender);
    if (extra) out.push(extra);
    return out;
  }
  function soulPersonality(M, gender) {
    const x = M.byName["命宮"], o = M.pal[opp(x.i)];
    const names = x.majorNames.length ? x.majorNames : o.majorNames;
    const parts = [];
    if (!x.majorNames.length) parts.push(C.SOUL_EMPTY + "對宮為" + (o.majorNames.join("") || "空宮") + "，借來論命：");
    const combo = names.length === 2 ? C.COMBO[names[0] + names[1]] || C.COMBO[names[1] + names[0]] : null;
    if (combo) parts.push(combo.t);
    else names.forEach((n) => { const s = C.SOUL[n]; if (s) parts.push(s.t); });
    names.forEach((n) => { const s = C.SOUL[n]; if (s && s[gender === "female" ? "f" : "m"]) parts.push(s[gender === "female" ? "f" : "m"]); });
    const dim = x.majors.filter((s) => !isGood(s) && s.brightness && s.brightness !== "平");
    if (dim.length) parts.push(dim.map((s) => s.name).join("、") + "落陷，星曜的優點打了折扣、缺點較易顯現，更要靠後天修養。");
    const body = M.pal.find((p) => p.body);
    if (body && C.BODY[body.name]) parts.push(C.BODY[body.name]);
    return parts.join("");
  }
  function specialNotes(M, role, gender) {
    const x = M.byName[role], notes = [];
    const has = (n) => inTri(M, x.i, n);
    if (role === "命宮") {
      const peach = PEACH.filter(has);
      if (peach.length >= 2) notes.push("命宮三方會照" + peach.join("、") + "，異性緣不差，人際上討喜。");
      if (x.body === false && M.pal.find((p) => p.body) && M.pal.find((p) => p.body).name === "財帛") notes.push("身居財帛，對金錢相當重視，但若個性偏穩定，就難有積極的動作，這是本性的問題。");
    }
    if (role === "夫妻") {
      const horse = x.minorNames.indexOf("天馬") >= 0, liang = has("天梁"), yang = has("太陽");
      if (HORSE_BRANCH[x.branch] && horse) notes.push("夫妻宮落四馬地又天馬正坐" + (liang ? "，再會天梁，為梁馬飄蕩之局，戀情來來去去、多有速食型愛情的感覺，不易有穩定之時" : "，感情多變動、聚少離多") + "。");
      const luLiang = M.natalMuts.some((m) => m.star === "天梁" && m.mut === "祿" && tri(x.i).indexOf(m.idx) >= 0);
      if (luLiang) notes.push("天梁化祿會照夫妻宮，天梁是老人星，婚配對象以年長為宜，且以整體結構看來仍以晚婚為佳。");
      else if (liang || yang) notes.push("夫妻宮會照" + (liang ? "天梁" : "太陽") + "，配偶年紀多較自己為長、個性成熟直爽。");
      const sha = x.minorNames.filter((n) => SHA_GROUP[n]);
      if (sha.length >= 2) notes.push("夫妻宮煞星" + sha.join("、") + "同度，感情路上波折較多，宜晚婚並慎選對象。");
      notes.push("夫妻宮除了表示未來配偶的樣貌與個性外，其實也暗示了自己喜歡的異性類型，知己知彼，有心儀對象時不妨參考。");
    }
    if (role === "財帛") {
      const fuXiang = has("天府") && has("天相"), lu = has("祿存") || M.natalMuts.some((m) => m.mut === "祿" && tri(x.i).indexOf(m.idx) >= 0);
      if (fuXiang && !lu) notes.push("財宮府相不會祿，無大富可言，但只要不投機，其實還算穩定。");
      if (fuXiang && lu) notes.push("府祿相三合會財宮，理財守財的能力相當不錯。");
      if (has("太陽") && has("太陰")) notes.push("財宮日月拱照，財源寬廣、財來不缺。");
      const body = M.pal.find((p) => p.body);
      if (body && body.name === "財帛") notes.push("身居財帛，一生以錢財為重心，為財打拚，寄人籬下領死薪水多非所願。");
    }
    if (role === "田宅") {
      const kongjie = x.minorNames.filter((n) => SHA_GROUP[n] === "空劫");
      const oppKJ = M.pal[opp(x.i)].minorNames.filter((n) => SHA_GROUP[n] === "空劫");
      if (!kongjie.length && oppKJ.length) notes.push("田宅宮對宮" + oppKJ.join("、") + "正沖，財庫有損，得中有失，不易守成。");
      if (has("紫微") && x.majorNames.indexOf("天相") >= 0) notes.push("田宅宮天相正坐又會照紫微，應有祖蔭可得。");
    }
    if (role === "官祿") {
      const soul = M.byName["命宮"], names = soul.majorNames.length ? soul.majorNames : M.pal[opp(soul.i)].majorNames;
      const jobs = uniq(names.concat(x.majorNames).map((n) => C.JOBS[n] || []).flat()).slice(0, 8);
      if (jobs.length) notes.push("綜合命宮與官祿宮的星曜組合，適合的方向有：" + jobs.join("、") + "。");
      if (has("太陽") && has("巨門")) notes.push("三方會照太陽與巨門，太陽能驅巨門之暗，口才必佳，相當適合以口為業的工作，例如教師、律師、講師、業務等。");
      if (has("太陽") && has("太陰") && !x.majorNames.some((n) => n === "太陽" || n === "太陰")) notes.push("官祿宮逢日月拱照，有名有利。");
    }
    if (role === "僕役") {
      const sha = x.minorNames.filter((n) => SHA_GROUP[n]), ji = M.natalMuts.some((m) => m.mut === "忌" && m.idx === x.i);
      if (sha.length + (ji ? 1 : 0) >= 2) notes.push("僕役宮相當糟糕，看來不太容易有知心好友，且易受友拖累，因此交友狀況須特別注意，忌替人作保。");
    }
    if (role === "父母") {
      const lucun = x.minorNames.indexOf("祿存") >= 0;
      const kj = tri(x.i).slice(1).map((i) => M.pal[i].minorNames.filter((n) => SHA_GROUP[n] === "空劫")).flat();
      const ji = M.natalMuts.some((m) => m.mut === "忌" && tri(x.i).indexOf(m.idx) >= 0);
      if (lucun && kj.length >= 2 && ji) notes.push("父母宮坐祿，幼時家境定當不錯；但羊陀夾父母宮，又逢空劫對拱、再會化忌，表示與父母親緣分較淺，縱家境良好也難受父母庇蔭，父母親的波動比較大，還是比較適合靠自己。");
      else if (kj.length >= 2) notes.push("父母宮逢空劫對拱，與父母緣分較淡，年幼離家或各自獨立的味道較濃。");
    }
    return notes.join("");
  }

  // ---------- 大限／流年分析 ----------
  function levelAnalysis(M, R, level, o) {
    const H = level === "decadal" ? R.dec : R.yr;
    const label = level === "decadal" ? "大限" : "流年";
    const soulIdx = H.index;
    const names = H.palaceNames;
    const idxOf = (name) => names.indexOf(name);
    const vw = (name) => ZR.view(R.raw[idxOf(name)], level);
    const soul = vw("命宮");
    const flowAt = (i) => (H.stars && H.stars[i] || []).map((s) => s.name);
    const triFlow = uniq(tri(soulIdx).map(flowAt).flat());
    const triNatalMinor = uniq(tri(soulIdx).map((i) => M.pal[i].minorNames).flat());
    const shaAll = uniq(triNatalMinor.filter((n) => SHA_GROUP[n]).concat(triFlow.filter((n) => SHA_GROUP[flowBase(n)])));
    const luckyAll = uniq(triNatalMinor.filter((n) => ["左輔", "右弼", "天魁", "天鉞", "文昌", "文曲"].indexOf(n) >= 0).concat(triFlow.filter((n) => ["昌", "曲", "魁", "鉞"].indexOf(n[1]) >= 0)));
    const muts = H.mutagen.map((star, k) => ({ star, mut: MUTS[k], idx: M.starIdx[star] }));
    const mutText = muts.map((m) => m.star + "化" + m.mut + "入" + label.charAt(0) + names[m.idx] + "（本命" + M.pal[m.idx].name + "）").join("、");
    // 祿：祿存／生年祿／本層化祿／流祿 在命三方
    const T = tri(soulIdx);
    const luSources = [];
    if (T.indexOf(M.starIdx["祿存"]) >= 0) luSources.push("祿存");
    M.natalMuts.filter((m) => m.mut === "祿" && T.indexOf(m.idx) >= 0).forEach((m) => luSources.push("生年" + m.star + "化祿"));
    muts.filter((m) => m.mut === "祿" && T.indexOf(m.idx) >= 0).forEach((m) => luSources.push(label + m.star + "化祿"));
    if (triFlow.some((n) => n[1] === "祿")) luSources.push(label.charAt(0) + "祿存");
    const kongjie = ["地空", "地劫"].filter((n) => T.indexOf(M.starIdx[n]) >= 0);
    const peach = uniq(T.map((i) => M.pal[i].adjNames.filter((n) => n === "紅鸞" || n === "天喜")).flat().concat(triFlow.filter((n) => n[1] === "鸞" || n[1] === "喜")));
    const ji = muts.find((m) => m.mut === "忌");
    const jiClash = ji && opp(ji.idx) === soulIdx;
    const soulSha = uniq(M.pal[soulIdx].minorNames.filter((n) => SHA_GROUP[n]).concat(flowAt(soulIdx).filter((n) => SHA_GROUP[flowBase(n)])));
    let verdict = soul.rating;
    if (soulSha.length >= 2 && (verdict === "吉" || verdict === "大吉")) verdict = "平";
    const keys = ["財帛", "官祿", "夫妻", "田宅", "疾厄", "福德"].map((name) => {
      const v = vw(name);
      return { name, v, text: ZR.phrase(v, name), stars: ZR.starsText(v) };
    });
    return { level, label, H, soul, soulIdx, names, muts, mutText, shaAll, luckyAll, luSources, kongjie, peach, ji, jiClash, verdict, keys, vw, soulSha };
  }
  const RATE_WORD = { 大吉: "相當漂亮", 吉: "尚稱穩定、有發展", 平: "平穩、好壞參半", 注意: "較為辛苦，需多留意" };
  function levelParagraphs(M, L, o, range) {
    const soulX = M.pal[L.soulIdx];
    const s1 = [];
    const who = L.level === "decadal" ? range[0] + "～" + range[1] + " 大限" : o.year + " 年流年";
    s1.push("此" + who + "命宮落在本命" + soulX.name + "（" + soulX.stem + soulX.branch + "），" + (soulX.majorNames.length ? "坐" + soulX.majors.map((s) => s.name + bright(s)).join("、") : "無主星，借對宮" + (M.pal[opp(L.soulIdx)].majorNames.join("") || "星曜") + "論") + "，" +
      (soulX.majorNames.length ? (L.level === "decadal" ? C.DECADAL : C.YEARLY)[soulX.majorNames[0]] : (L.level === "decadal" ? C.DECADAL : C.YEARLY)["空宮"]));
    s1.push(L.label + "四化：" + L.mutText + "。");
    if (L.jiClash) s1.push(L.label + L.ji.star + "化忌自對宮沖" + L.label + "命，外在環境的變動直接衝擊自己，做任何事都感到有點卡卡的，看似順利的卻一再因故延宕。");
    else if (L.ji && tri(L.soulIdx).indexOf(L.ji.idx) >= 0) s1.push(L.label + L.ji.star + "化忌落在" + L.label.charAt(0) + L.names[L.ji.idx] + "，正在命宮三方，所主之事要多花心力。");
    const s2 = [];
    if (L.luSources.length >= 2) s2.push(L.label + "命宮三方" + L.luSources.join("、") + "同會，形成雙祿交流，手頭上應該有點閒錢，是求財有利的結構。");
    else if (L.luSources.length === 1) s2.push("三方會" + L.luSources[0] + "，仍有進財之機。");
    if (L.kongjie.length === 2) s2.push("但三方地空、地劫雙煞來拱，得亦復失，有勞而無獲的現象" + (L.luSources.length ? "，祿逢空劫形成倒祿之局，吉處藏凶，千萬不可貿然擴張" : "") + "。");
    else if (L.kongjie.length === 1) s2.push("三方見" + L.kongjie[0] + "，計畫易有落空之處，宜保守。");
    const shaOnly = L.shaAll.filter((n) => SHA_GROUP[flowBase(n)] !== "空劫");
    if (shaOnly.length >= 2) s2.push("三方又會" + shaOnly.join("、") + (L.luckyAll.length ? "，雖有" + L.luckyAll.join("、") + "等吉星相助而不致全面挫敗，但波折起伏總是難免" : "，煞星匯聚，挫折定然難以避免，凡事宜守不宜攻") + "。");
    else if (L.luckyAll.length >= 2) s2.push("三方逢" + L.luckyAll.join("、") + "來拱，在吉星的助力下，縱有困難也會有及時的助力出現。");
    if (L.peach.length) s2.push(L.label + "命宮三方見" + L.peach.join("、") + (L.luSources.length ? "，又逢化祿引動，紅鸞星動之兆明顯，感情上有正緣出現的機會" : "，人緣桃花活絡") + "。");
    if (L.soulSha.length >= 2) s2.push(L.label + "命宮" + L.soulSha.join("、") + "煞星正坐，縱有吉星與四化相助，也比較會有好事多磨的情況。");
    s2.push("整體而言，這個" + L.label + "的命宮結構" + RATE_WORD[L.verdict] + "。");
    return [s1.join(""), s2.join("")];
  }

  // ---------- 婚緣／創業時機掃描 ----------
  function scanDecades(M, R0, o, fromRange, count) {
    const out = [];
    let r = fromRange;
    for (let k = 0; k < count && r; k++) {
      const year = o.lunarYear + r[0] - 1 + 5;
      const R = k === 0 ? R0 : ZR.analyze(M.a, { year, picks: [], lunarMonth: o.lunarMonth, tIdx: o.tIdx });
      const L = levelAnalysis(M, R, "decadal", o);
      out.push({ range: r, R, L });
      const next = M.pal.find((p) => p.range[0] === r[1] + 1);
      r = next ? next.range : null;
    }
    return out;
  }
  function marriageHint(M, decs, gender) {
    for (const d of decs) {
      const L = d.L;
      const names = L.names;
      const spouse = names.indexOf("夫妻"), fude = names.indexOf("福德");
      const idxs = uniq([L.soulIdx, spouse, fude]);
      const flow = (i) => (L.H.stars && L.H.stars[i] || []).map((s) => s.name);
      const peach = idxs.some((i) => M.pal[i].adjNames.some((n) => n === "紅鸞" || n === "天喜") || flow(i).some((n) => n[1] === "鸞" || n[1] === "喜") || M.pal[opp(i)].adjNames.some((n) => n === "紅鸞" || n === "天喜"));
      const lu = idxs.some((i) => tri(i).some((t) => M.pal[t].minorNames.indexOf("祿存") >= 0 || M.natalMuts.some((m) => m.mut === "祿" && m.idx === t) || L.muts.some((m) => m.mut === "祿" && m.idx === t)));
      const spouseV = L.vw("夫妻");
      if (peach && lu && spouseV.rating !== "注意") return { range: d.range, strong: true, spouseV };
    }
    for (const d of decs) { const v = d.L.vw("夫妻"); if (v.rating === "大吉" || v.rating === "吉") return { range: d.range, strong: false, spouseV: v }; }
    return null;
  }
  function startupHint(decs) {
    for (const d of decs) {
      const L = d.L, cai = L.vw("財帛"), guan = L.vw("官祿");
      const good = (v) => v.rating === "大吉" || v.rating === "吉";
      if (good(L.soul) && (good(cai) || good(guan)) && L.kongjie.length < 2) return { range: d.range, L };
    }
    return null;
  }

  // ---------- 回覆內容 ----------
  function reply(M, o, pats, cur, nxt, Y, decs) {
    const T = TOPICS[o.topic] || TOPICS.綜合命盤;
    const soul = M.byName["命宮"], gender = o.gender;
    const age = o.nominalAge;
    const you = gender === "female" ? "女生" : "男生";
    const ps = [];
    // 開場：個性
    const names = soul.majorNames.length ? soul.majorNames : M.pal[opp(soul.i)].majorNames;
    const combo = names.length === 2 ? C.COMBO[names[0] + names[1]] || C.COMBO[names[1] + names[0]] : null;
    let open = (age ? "今年虛歲 " + age + " 歲。" : "") + "以你的命盤看來，";
    open += soul.majorNames.length ? "命宮坐" + soul.majorNames.join("") + "，" : "命宮無主星，借對宮" + names.join("") + "來論，";
    open += combo ? combo.t : names.map((n) => (C.SOUL[n] || {}).t || "").join("");
    names.forEach((n) => { const s = C.SOUL[n]; if (s && s[gender === "female" ? "f" : "m"]) open += s[gender === "female" ? "f" : "m"]; });
    ps.push(open);
    // 格局
    const mainPats = pats.filter((p) => ["機月同梁", "日月並明", "府相朝垣", "君臣慶會", "紫府同宮", "三奇佳會", "祿馬交馳", "陽梁昌祿", "武貪同行", "殺破狼", "石中隱玉", "巨日同宮", "火貪鈴貪", "輔弼拱命", "雙祿交流"].indexOf(p.id) >= 0);
    if (mainPats.length) {
      const p0 = C.PATTERNS[mainPats[0].id];
      ps.push("你的格局屬於「" + mainPats[0].id + "」格，古曰：「" + p0.quote + "。」" + p0.desc + (mainPats.length > 1 ? "另外也成" + mainPats.slice(1, 3).map((p) => p.id).join("、") + "之局。" : ""));
    }
    const tags = T.tags;
    // 事業
    if (tags.indexOf("career") >= 0) {
      const guan = M.byName["官祿"], sha = guan.minorNames.filter((n) => SHA_GROUP[n]);
      const jobs = uniq(names.concat(guan.majorNames).map((n) => C.JOBS[n] || []).flat()).slice(0, 6);
      let t = "就你命宮星宿組合來說，比較適合" + jobs.join("、") + "這類工作。";
      if (sha.length) t += "官祿宮見" + sha.join("、") + "，工作上難免勞碌波折、付出多於收穫，若大限行運不佳就會更感挫折，宜以專業技術立身。";
      if (inTri(M, guan.i, "太陽") && inTri(M, guan.i, "巨門")) t += "命盤三方同時會照太陽與巨門，口才必佳，以口為業更能發揮。";
      const yg = Y.vw("官祿"), cg = cur.L.vw("官祿");
      t += "以大限來看，大限官祿" + RATE_WORD[cg.rating] + "；今年流年官祿宮" + ZR.phrase(yg, "官祿") + (yg.rating === "注意" ? "，今年工作上應該滿辛苦的，多忍忍，這段時間就當成磨練經驗吧" : yg.rating === "大吉" || yg.rating === "吉" ? "，今年是可以主動爭取的一年" : "") + "。";
      ps.push(t);
    }
    if (tags.indexOf("move") >= 0) {
      const qian = M.byName["遷移"];
      let t = "遷移宮" + (qian.majorNames.length ? "坐" + qian.majorNames.join("") : "無主星") + "，" + (C.P.遷移[qian.majorNames[0]] || "");
      if (pats.some((p) => p.id === "梁馬飄蕩")) t += "命盤成梁馬飄蕩之格，喜遠離出生地，離鄉發展反而自在；";
      if (qian.minorNames.indexOf("天馬") >= 0 || soul.minorNames.indexOf("天馬") >= 0) t += "天馬入命遷，一生閒不下來，出外求財有利；";
      const sha = qian.minorNames.filter((n) => SHA_GROUP[n]);
      t += sha.length ? "但遷移見" + sha.join("、") + "，在外要防是非與意外，計畫留彈性。" : "出外發展是可以考慮的方向。";
      ps.push(t);
    }
    // 感情
    if (tags.indexOf("love") >= 0) {
      const fq = M.byName["夫妻"], fqo = M.pal[opp(fq.i)];
      const spouseStars = fq.majorNames.length ? fq.majorNames : fqo.majorNames;
      let t = "至於感情問題，你的夫妻宮" + (fq.majorNames.length ? "坐" + fq.majorNames.join("") : "無主星，借對宮" + fqo.majorNames.join("")) + "，" + spouseStars.map((n) => C.P.夫妻[n] || "").join("");
      const sp = specialNotes(M, "夫妻", gender);
      if (sp) t += sp.replace("夫妻宮除了表示未來配偶的樣貌與個性外，其實也暗示了自己喜歡的異性類型，知己知彼，有心儀對象時不妨參考。", "");
      const peach = PEACH.filter((n) => inTri(M, soul.i, n));
      if (peach.length >= 2) t += "命宮三方會照" + peach.join("、") + "，照理說異性緣不差，若目前感情不順，問題多半出在大限行進上，命好也要限好。";
      ps.push(t);
      if (tags.indexOf("timing") >= 0) {
        const mh = marriageHint(M, decs, gender);
        const curL = cur.L;
        let t2 = "";
        if (mh && mh.strong) t2 += "你" + (mh.range[0] <= age && age <= mh.range[1] ? "目前走的" : mh.range[0] > age ? "即將走的" : "") + "是 " + mh.range[0] + "–" + mh.range[1] + " 這個大限，大限命宮或福德、夫妻宮見鸞喜，又逢化祿引動，大有紅鸞星動之兆，姻緣應成於此時，所以真的不要想太多，你絕對不會孤單一輩子的。";
        else if (mh) t2 += mh.range[0] + "–" + mh.range[1] + " 大限的夫妻宮結構相對穩定，是感情較有機會定下來的十年。";
        else t2 += "近幾個大限的夫妻宮結構都偏多波折，感情宜寧缺勿濫，先把自己過好，緣分自然會來。";
        if (curL.vw("夫妻").rating === "注意") t2 += "目前這個大限夫妻宮逢煞，桃花多於正緣，得亦復失，錯過也就罷了，與其忙於戀愛，不如把重心放在自我成長上。";
        ps.push(t2);
      }
    }
    // 財運
    if (tags.indexOf("wealth") >= 0) {
      const cai = M.byName["財帛"], tian = M.byName["田宅"];
      let t = "至於財運部分，財帛宮" + (cai.majorNames.length ? "坐" + cai.majorNames.join("") : "無主星") + "，" + (cai.majorNames.length ? cai.majorNames.map((n) => C.P.財帛[n] || "").join("") : "借對宮論，財運隨環境起伏。");
      const csha = cai.minorNames.filter((n) => SHA_GROUP[n]), tkj = tian.minorNames.filter((n) => SHA_GROUP[n] === "空劫").concat(M.pal[opp(tian.i)].minorNames.filter((n) => SHA_GROUP[n] === "空劫"));
      if (csha.length && tkj.length) t += "而財逢煞、庫逢空，錢財來來去去很難有剩下來，建議你要做好金錢的管理。";
      else if (tkj.length) t += "田宅宮（財庫）逢" + tkj.join("、") + "，財庫有損，得中有失，不易守成，但只要不投機，其實還算穩定。";
      else if (csha.length) t += "財宮見" + csha.join("、") + "，得財較為辛勞，三方煞星匯聚更主為財煩惱。";
      if (pats.some((p) => p.id === "祿馬交馳")) t += "命盤成祿馬交馳格，適合動中求財、在外發展。";
      if (pats.some((p) => p.id === "武貪同行")) t += "武貪同宮，「武貪不發少年人」，屬先貧後富的晚發格局，年輕創業多有挫折，中年之後反而有成。";
      if (pats.some((p) => p.id === "倒祿")) t += "祿存逢空劫，形成倒祿之局，得而復失，求財務必見好就收。";
      ps.push(t);
      if (tags.indexOf("startup") >= 0) {
        const L = cur.L, yr = Y;
        let t2 = "至於攻守，以大限來看，" + levelParagraphs(M, L, o, cur.range)[1].replace(/^/, "");
        const yGood = yr.verdict === "大吉" || yr.verdict === "吉", dGood = L.verdict === "大吉" || L.verdict === "吉";
        if (dGood && yGood) t2 += "大限與流年皆有利，是可以出擊的時候，但仍要守住底線、分批投入。";
        else if (!dGood && yGood) t2 += "大限不佳但今年流年得利，不妨抄個短線，務必見好就收、切忌拉長戰線，否則流年一過便打回原形。";
        else if (dGood && !yGood) t2 += "大限尚可但今年流年不利，創業宜暫緩，先蓄積能量，明年再看。";
        else t2 += "大限與流年皆不利，創業萬萬不宜，若貿然出手，恐怕損失會比上次還嚴重，建議最好三思，先在職場上發展、吃人頭路，壓力不會那樣大。";
        const sh = startupHint(decs.slice(1));
        if (sh) t2 += "以整體行運看來，創業要有成可能要到 " + sh.range[0] + "–" + sh.range[1] + " 大限之後，可以趁這段時間蓄積能量與人脈。";
        ps.push(t2);
      }
    }
    // 健康
    if (tags.indexOf("health") >= 0) {
      const ji = M.byName["疾厄"], sha = ji.minorNames.filter((n) => SHA_GROUP[n]);
      let t = "健康方面，疾厄宮" + (ji.majorNames.length ? "坐" + ji.majorNames.join("") + "，" + ji.majorNames.map((n) => C.P.疾厄[n]).join("") : "無主星，借對宮" + M.pal[opp(ji.i)].majorNames.join("") + "論，" + M.pal[opp(ji.i)].majorNames.map((n) => C.P.疾厄[n] || "").join(""));
      if (sha.length) t += Object.keys(groups(sha, SHA_GROUP)).map((g) => C.SHA.疾厄[g]).join("");
      const yj = Y.vw("疾厄"), cj = cur.L.vw("疾厄");
      t += "大限疾厄宮" + RATE_WORD[cj.rating] + "，流年疾厄" + ZR.phrase(yj, "疾厄") + "。身體有不適就要及早就醫，不要硬撐。";
      ps.push(t);
    }
    // 收尾：大限比較＋建議
    const curGood = cur.L.verdict === "大吉" || cur.L.verdict === "吉";
    const nxtGood = nxt && (nxt.L.verdict === "大吉" || nxt.L.verdict === "吉");
    const soulSha = soul.minorNames.filter((n) => SHA_GROUP[n]);
    let end = "";
    if (soulSha.some((n) => SHA_GROUP[n] === "空劫") || M.natalMuts.some((m) => m.mut === "忌" && (m.idx === soul.i || m.idx === M.byName["福德"].i))) end += C.ADVICE.修心;
    if (!curGood && nxtGood) end += C.ADVICE.忍耐;
    else if (curGood) end += C.ADVICE.把握;
    else end += "人生就是這樣，起起伏伏，不會有永遠順風，也不會有永遠逆風，看開點，不要想太多，這段時間就當成磨練經驗吧！";
    if (names.some((n) => n === "太陰" || n === "天機" || n === "巨門")) end += "最重要的是要改改鑽牛角尖的毛病，忍一時風平浪靜，退一步海闊天空。";
    end += C.ADVICE.義工;
    ps.push(end);
    return ps;
  }

  // ---------- build ----------
  function build(a, o) {
    const M = model(a);
    const R = ZR.analyze(a, { year: o.year, picks: [], lunarMonth: o.lunarMonth, tIdx: o.tIdx });
    o.nominalAge = R.h.age && R.h.age.nominalAge;
    const pats = detectPatterns(M);
    const curRange = M.pal[R.dec.index].range;
    const decs = scanDecades(M, R, o, curRange, 4);
    const cur = decs[0], nxt = decs[1] || null;
    const Y = levelAnalysis(M, R, "yearly", o);
    const natalViews = M.pal.map((x) => ZR.view(R.raw[x.i], "natal"));
    return { M, R, o, pats, cur, nxt, decs, Y, natalViews, topic: TOPICS[o.topic] || TOPICS.綜合命盤, replyParas: reply(M, o, pats, cur, nxt, Y, decs) };
  }

  // ---------- render ----------
  function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  const h1 = (text) => '<div class="zr-h1 mp-h1">' + esc(text) + "</div>";
  const h2 = (text) => '<div class="zr-h2">' + esc(text) + "</div>";
  const para = (t) => '<p class="mp-p">' + esc(t) + "</p>";
  const RATING_CLS = { 大吉: "zr-r-great", 吉: "zr-r-good", 平: "zr-r-flat", 注意: "zr-r-warn" };
  function table(cols, rows, opt) {
    opt = opt || {};
    const head = "<tr>" + cols.map((c) => '<th style="width:' + c[1] + '%">' + esc(c[0]) + "</th>").join("") + "</tr>";
    const body = rows.map((r) => "<tr>" + r.map((v, i) => {
      if (opt.rating && i === r.length - 1) return '<td class="zr-rate ' + RATING_CLS[v] + '">' + v + "</td>";
      return "<td" + (i === 0 ? ' class="zr-first"' : "") + ">" + v + "</td>";
    }).join("") + "</tr>").join("");
    return '<table class="zr-table"><thead>' + head + "</thead><tbody>" + body + "</tbody></table>";
  }

  function render(B, charts) {
    const { M, R, o, pats, cur, nxt, Y, natalViews, topic } = B;
    const a = M.a, soul = M.byName["命宮"], body = M.pal.find((p) => p.body);
    const root = el("div", "zr-report mp-report");
    const add = (html, brk) => { const b = el("div", "zr-block", html); if (brk) b.setAttribute("data-pdf-break-before", ""); root.appendChild(b); return b; };
    const genderText = o.gender === "male" ? "男" : "女";
    const yinYang = "甲丙戊庚壬".indexOf(a.chineseDate.charAt(0)) >= 0 ? "陽" : "陰";
    const b = o.birth, now = new Date();
    const nowText = now.getFullYear() + "-" + pad2(now.getMonth() + 1) + "-" + pad2(now.getDate()) + " " + pad2(now.getHours()) + ":" + pad2(now.getMinutes());
    const question = (o.question || "").trim() || topic.ask;
    const natalMutText = M.natalMuts.map((m) => m.star + "化" + m.mut + "（" + M.pal[m.idx].name + "）").join("、");

    // 封面
    add('<div class="zr-kicker">紫微斗數　·　命盤分析報告</div>' +
      '<div class="zr-title">【問測】' + esc(topic.title) + "</div>" +
      '<div class="zr-sub"><b>' + esc(o.name) + "</b>　｜　" + yinYang + genderText + "・" + a.fiveElementsClass + "・命宮" + soul.stem + soul.branch + "・身宮" + (body ? body.stem + body.branch : "") + "</div>" +
      '<div class="zr-rule"></div>' +
      '<div class="mp-ask"><div class="mp-ask-h">｜提問時間｜　' + nowText + "</div>" +
      '<div class="mp-ask-body">' + esc(question) + "</div>" +
      '<div class="mp-ask-body">我是國曆 ' + b.y + " 年 " + b.mo + " 月 " + b.d + " 日 " + a.time + "出生（農曆" + esc(o.lunarText) + "），" + genderText + "生。</div></div>");
    add(table([["項目", 19], ["內容", 81]], [
      ["出生", "公元 " + b.y + "-" + pad2(b.mo) + "-" + pad2(b.d) + " " + pad2(b.h) + ":" + pad2(b.mi) + "（農曆" + esc(o.lunarText) + " " + a.time + "），" + yinYang + genderText + "，肖" + a.zodiac + (o.nominalAge ? "，今年虛歲 " + o.nominalAge : "")],
      ["命局", a.fiveElementsClass + "；命主" + a.soul + "、身主" + a.body],
      ["命宮 / 身宮", "命宮 " + soul.stem + soul.branch + "（" + (soul.majorNames.join("、") || "空宮") + "）；身宮 " + (body ? body.stem + body.branch + "，在" + body.name : "")],
      ["生年四化（" + a.chineseDate.charAt(0) + "）", natalMutText],
      ["現行大限", R.dec.heavenlyStem + R.dec.earthlyBranch + " " + cur.range[0] + "–" + cur.range[1] + " 歲，大限命宮在本命" + M.pal[R.dec.index].name + "；大限四化：" + R.dec.mutagen.map((s, k) => s + MUTS[k]).join("、")],
      [o.year + " 流年", R.ganzhi + "，流年命宮在本命" + M.pal[R.yr.index].name + "（" + M.pal[R.yr.index].branch + "）；流年四化：" + R.yr.mutagen.map((s, k) => s + MUTS[k]).join("、")],
      ["格局", pats.length ? pats.map((p) => p.id + (p.where && p.where !== "命宮" ? "（" + p.where + "）" : "")).join("、") : "—"]
    ]));

    // 回覆內容
    add(h1("｜回覆內容｜"));
    B.replyParas.forEach((t, k) => add(para(t)));

    // 命盤解析及內容說明
    add(h1("｜命盤解析及內容說明｜"), true);
    if (charts && charts[0]) add('<div class="zr-fig"><img src="' + charts[0].src + '"><div class="zr-cap">' + esc(charts[0].caption) + "</div></div>");
    add('<div class="mp-chart-title">本命盤</div>');
    // 命宮
    const soulMuts = M.natalMuts.filter((m) => m.idx === soul.i);
    add(h2("命宮 " + soul.stem + soul.branch + "：" + starLine(soul, soulMuts)) + palaceParagraphs(M, "命宮", o.gender).map(para).join(""));
    // 格局
    if (pats.length) {
      add(h2("格局") + pats.slice(0, 6).map((p) => { const P = C.PATTERNS[p.id]; return para("「" + p.id + "」" + (p.where && p.where !== "命宮" ? "（" + p.where + "）" : "") + "，古曰：「" + P.quote + "。」" + P.desc); }).join(""));
    }
    // 各宮：主題宮位完整解析
    const full = topic.pals.filter((n) => n !== "命宮");
    full.forEach((role) => {
      const x = M.byName[role];
      add(h2(role + "宮 " + x.stem + x.branch + (x.body ? "（身宮）" : "") + "：" + starLine(x, M.natalMuts.filter((m) => m.idx === x.i))) + palaceParagraphs(M, role, o.gender).map(para).join(""));
    });
    // 其餘各宮簡述
    const rest = PAL_ORDER.filter((n) => n !== "命宮" && full.indexOf(n) < 0);
    if (rest.length) {
      add(h2("其餘各宮簡述") + '<ul class="zr-list">' + rest.map((role) => {
        const x = M.byName[role];
        return "<li><b>" + role + "宮 " + x.stem + x.branch + "（" + esc(starLine(x, M.natalMuts.filter((m) => m.idx === x.i))) + "）：</b>" + esc(palaceParagraphs(M, role, o.gender)[0]) + "</li>";
      }).join("") + "</ul>");
    }
    // 本命十二宮總表
    const order = []; for (let k = 0; k < 12; k++) order.push(M.pal[(soul.i - k + 12) % 12]);
    add(h2("本命十二宮總表") + table([["宮位", 11], ["干支", 9], ["星曜", 46], ["一句話", 25], ["評估", 9]],
      order.map((x) => { const v = natalViews[x.i]; return [x.name + (x.body ? "（身）" : ""), x.stem + x.branch, esc(starLine(x, M.natalMuts.filter((m) => m.idx === x.i))), esc(ZR.phrase(v, x.name)), v.rating]; }), { rating: true }) +
      '<div class="zr-note">評估綜合主星亮度、生年四化、對宮化忌與煞吉星，只用來標示相對強弱。</div>');

    // 大限盤
    if (charts && charts[1]) add('<div class="zr-fig"><img src="' + charts[1].src + '"><div class="zr-cap">' + esc(charts[1].caption) + "</div></div>", true);
    add('<div class="mp-chart-title">' + cur.range[0] + "～" + cur.range[1] + " 大限本命盤</div>");
    add(levelParagraphs(M, cur.L, o, cur.range).map(para).join(""));
    add(h2("大限各宮重點") + table([["大限宮位", 12], ["宮支（本命宮）", 16], ["星曜", 36], ["解讀", 27], ["評估", 9]],
      cur.L.keys.map((k) => ["限" + k.name, k.v.branch + "（" + k.v.natalName + "）", esc(k.stars), esc(k.text), k.v.rating]), { rating: true }));
    const marriageNote = cur.L.peach.length && cur.L.luSources.length ? "此大限命宮三方見鸞喜又逢祿引動，是姻緣易成的十年。" : "";
    const spouseV = cur.L.vw("夫妻");
    const decExtra = [];
    if (spouseV.sha.length >= 2 || spouseV.rating === "注意") decExtra.push("此大限夫妻宮逢" + (spouseV.sha.join("、") || "煞") + "，本身桃花就會多於正緣，三方再見煞則得亦復失；既然是桃花，錯過也就罷了。");
    if (marriageNote) decExtra.push(marriageNote);
    if (decExtra.length) add(decExtra.map(para).join(""));
    // 下一大限
    if (nxt) {
      const better = ["注意", "平", "吉", "大吉"].indexOf(nxt.L.verdict) - ["注意", "平", "吉", "大吉"].indexOf(cur.L.verdict);
      const nxtMarry = nxt.L.peach.length && nxt.L.luSources.length ? "不過此大限命宮三方見" + nxt.L.peach.join("、") + "又逢祿引動，紅鸞星動，感情上反而是正緣易成的十年。" : "";
      add(h2("下一大限 " + nxt.range[0] + "～" + nxt.range[1] + " 歲前瞻") + para(levelParagraphs(M, nxt.L, o, nxt.range)[0] + (better > 0 ? "整體而言，下個大限看起來會比這個大限好得多，整體運勢會有轉機，所以這段時間多忍耐。" : better < 0 ? "下個大限的結構比目前這個大限更需要小心，趁現在把基礎打穩，好事多磨也不意外。" : "下個大限與目前大限的強弱相當，重點在流年的起伏。") + nxtMarry));
    }

    // 流年盤
    if (charts && charts[2]) add('<div class="zr-fig"><img src="' + charts[2].src + '"><div class="zr-cap">' + esc(charts[2].caption) + "</div></div>", true);
    add('<div class="mp-chart-title">' + o.year + " 年流年大限盤</div>");
    const yParas = levelParagraphs(M, Y, o, cur.range);
    const curGood = cur.L.verdict === "大吉" || cur.L.verdict === "吉", yGood = Y.verdict === "大吉" || Y.verdict === "吉";
    yParas.push("命主問命當年為 " + o.year + " 年（" + R.ganzhi + "）。" + (curGood && yGood ? "大限與流年皆有利，正是風雲際會之時，該出手就出手。" : curGood && !yGood ? "大限尚佳但流年不利，大限再好，畢竟是十年的總和，還要觀察流年方可斷吉凶，今年多忍忍，明年應該會順利得多。" : !curGood && yGood ? "大限不利但流年得益，縱有收穫也只是短線，務必見好就收。" : "大限與流年皆不利，確實是相當挫折的時候，但流年畢竟只主一年之運，奉勸趁此機會好好修心，把挫折當作逆增上緣。") + C.ADVICE.三才);
    add(yParas.map(para).join(""));
    add(h2("流年各宮重點") + table([["流年宮位", 12], ["宮支（本命宮）", 16], ["星曜", 36], ["解讀", 27], ["評估", 9]],
      Y.keys.map((k) => ["年" + k.name, k.v.branch + "（" + k.v.natalName + "）", esc(k.stars), esc(k.text), k.v.rating]), { rating: true }));

    // 結語與建議
    const adv = [];
    const names = soul.majorNames.length ? soul.majorNames : M.pal[opp(soul.i)].majorNames;
    names.forEach((n) => { if (C.SOUL[n]) adv.push("心性：" + C.SOUL[n].mind + "。"); });
    pats.slice(0, 3).forEach((p) => adv.push(p.id + "：" + C.PATTERNS[p.id].tip + "。"));
    topic.pals.slice(0, 3).forEach((role) => { const v = natalViews[M.byName[role].i]; const hasJi = v.here.some((m) => m.mut === "忌") || v.clash.length; adv.push(role + "：" + (hasJi ? ZR.PAL[role].adviceJi : v.here.some((m) => m.mut === "祿") ? ZR.PAL[role].adviceLu : ZR.PAL[role].advice[0]) + "。"); });
    adv.push("行運：" + (curGood ? "目前大限有利，把握機會、打穩基礎。" : "目前大限較辛苦，沉潛蓄力，" + (nxt ? nxt.range[0] + " 歲起的下一大限" + (nxt.L.verdict === "大吉" || nxt.L.verdict === "吉" ? "明顯轉好" : "再評估") : "") + "。"));
    add(h1("｜結語與建議｜") + '<ol class="zr-olist">' + uniq(adv).map((t) => "<li>" + esc(t) + "</li>").join("") + "</ol>" +
      para("命是天定不可違，但後天運勢是掌在自己手上的；佛家說「欲知前世因，今生受者是；欲知來世果，今生做者是」，多行善、多積福，自然會有改變的機會，祝福你。") +
      '<div class="zr-note">紫微斗數是傳統文化的詮釋工具，適合用來自我反思與規劃；健康請以醫師診斷為準，理財與投資請以自身財務狀況與專業意見為準。</div>' +
      '<div class="zr-end">Aries 命理工作室　·　' + now.getFullYear() + "/" + (now.getMonth() + 1) + "/" + now.getDate() + " 產生</div>");
    return root;
  }

  window.ZiweiMingpan = { TOPICS, build, render, detectPatterns, model };
})();
