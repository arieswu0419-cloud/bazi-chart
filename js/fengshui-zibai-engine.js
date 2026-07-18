/*
 * 紫白風水（玄空飛星）排盤引擎
 *
 * 依「陽宅落成年（立春換運）」定元運，依「陽宅面向角度（0~360）」定 24 山向，
 * 排出 運盤／山星（山盤）／向星（向盤）三盤，並把九宮依「向首朝上」旋轉呈現。
 *
 * 演算法（已對照 九運宅/八運宅/七運宅.pdf 全 24 山向逐格反推驗證）：
 *   1. 運盤：中宮＝運數，順飛（洛書路徑 中→乾→兌→艮→離→坎→坤→震→巽，數字逐格 +1）。
 *   2. 向星：取「向首所在宮」的運盤數入中，看該數所屬卦中「與向首同元龍（地/天/人）」之字，
 *           其陰陽定順逆（陽順陰逆）；入中數若為 5（無卦），改用向首本身之陰陽。
 *   3. 山星：取「坐山所在宮」的運盤數入中，規則同上，改用坐山之元龍/陰陽。
 *   4. 版面：向首方位固定置於九宮上方中央，其餘七方位依羅盤順時針對位。
 *
 * 元運（立春換運）：六運1964-1983、七運1984-2003、八運2004-2023、九運2024-2043。
 * 需要全域 Solar（lunar-javascript）計算立春；載入順序在 lunar.js 之後。
 */

// ---- 24 山：依角度順序（中心 0,15,...345），每山跨 15°、以中心 ±7.5° 為界 ----
// gua＝所屬卦（洛書宮數 1坎2坤3震4巽6乾7兌8艮9離）；el＝元龍 0地1天2人；yang＝陰陽（true陽順/false陰逆）
// dir＝八方位代碼。
const ZB_MOUNTAINS = [
  { name: "子", gua: 1, el: 1, yang: false, dir: "N"  }, //   0°
  { name: "癸", gua: 1, el: 2, yang: false, dir: "N"  }, //  15°
  { name: "丑", gua: 8, el: 0, yang: false, dir: "NE" }, //  30°
  { name: "艮", gua: 8, el: 1, yang: true,  dir: "NE" }, //  45°
  { name: "寅", gua: 8, el: 2, yang: true,  dir: "NE" }, //  60°
  { name: "甲", gua: 3, el: 0, yang: true,  dir: "E"  }, //  75°
  { name: "卯", gua: 3, el: 1, yang: false, dir: "E"  }, //  90°
  { name: "乙", gua: 3, el: 2, yang: false, dir: "E"  }, // 105°
  { name: "辰", gua: 4, el: 0, yang: false, dir: "SE" }, // 120°
  { name: "巽", gua: 4, el: 1, yang: true,  dir: "SE" }, // 135°
  { name: "巳", gua: 4, el: 2, yang: true,  dir: "SE" }, // 150°
  { name: "丙", gua: 9, el: 0, yang: true,  dir: "S"  }, // 165°
  { name: "午", gua: 9, el: 1, yang: false, dir: "S"  }, // 180°
  { name: "丁", gua: 9, el: 2, yang: false, dir: "S"  }, // 195°
  { name: "未", gua: 2, el: 0, yang: false, dir: "SW" }, // 210°
  { name: "坤", gua: 2, el: 1, yang: true,  dir: "SW" }, // 225°
  { name: "申", gua: 2, el: 2, yang: true,  dir: "SW" }, // 240°
  { name: "庚", gua: 7, el: 0, yang: true,  dir: "W"  }, // 255°
  { name: "酉", gua: 7, el: 1, yang: false, dir: "W"  }, // 270°
  { name: "辛", gua: 7, el: 2, yang: false, dir: "W"  }, // 285°
  { name: "戌", gua: 6, el: 0, yang: false, dir: "NW" }, // 300°
  { name: "乾", gua: 6, el: 1, yang: true,  dir: "NW" }, // 315°
  { name: "亥", gua: 6, el: 2, yang: true,  dir: "NW" }, // 330°
  { name: "壬", gua: 1, el: 0, yang: true,  dir: "N"  }  // 345°
];

// 各卦（宮）依元龍序 [地,天,人] 的 24 山字，供「入中之數」查同元龍字定陰陽
const ZB_PALACE_MOUNTAINS = {
  1: ["壬", "子", "癸"], 2: ["未", "坤", "申"], 3: ["甲", "卯", "乙"],
  4: ["辰", "巽", "巳"], 6: ["戌", "乾", "亥"], 7: ["庚", "酉", "辛"],
  8: ["丑", "艮", "寅"], 9: ["丙", "午", "丁"]
};
// 24 山名 → 陰陽（true 陽順 / false 陰逆）
const ZB_YANG = {};
ZB_MOUNTAINS.forEach((m) => { ZB_YANG[m.name] = m.yang; });

// 八方位 ↔ 洛書宮數
const ZB_DIR_TO_PALACE = { N: 1, NE: 8, E: 3, SE: 4, S: 9, SW: 2, W: 7, NW: 6 };
const ZB_PALACE_TO_DIR = { 1: "N", 8: "NE", 3: "E", 4: "SE", 9: "S", 2: "SW", 7: "W", 6: "NW", 5: "C" };
const ZB_DIR_NAME = { N: "北", NE: "東北", E: "東", SE: "東南", S: "南", SW: "西南", W: "西", NW: "西北", C: "中" };

// 洛書順飛路徑（宮數，5＝中宮）：中→乾→兌→艮→離→坎→坤→震→巽
const ZB_FLY_PATH = [5, 6, 7, 8, 9, 1, 2, 3, 4];

// 從中宮數 start 起飛（順 forward=true / 逆 false），回傳 { 宮數: 星數 }
function zbFly(start, forward) {
  const res = {};
  let n = start;
  for (let i = 0; i < 9; i++) {
    res[ZB_FLY_PATH[i]] = n;
    n = forward ? (n % 9) + 1 : ((n - 2 + 9) % 9) + 1;
  }
  return res;
}

// 角度 → 24 山索引（每 15° 一山，四捨五入到最近中心）
function zbMountainIndex(angle) {
  const a = ((angle % 360) + 360) % 360;
  return Math.round(a / 15) % 24;
}

// 元運（立春換運）。回傳 { period, label, range }
function zbPeriodFromDate(year, month, day) {
  const yy = zbYuanYear(year, month, day);
  // 三元九運：一運 1864 起、每 20 年一運
  const period = ((Math.floor((yy - 1864) / 20)) % 9 + 9) % 9 + 1;
  const start = 1864 + Math.floor((yy - 1864) / 20) * 20;
  return { period, yuanYear: yy, range: start + "~" + (start + 19) };
}

// 立春換年：Jan 一律算前一年、3 月以後算當年、2 月比對立春日
function zbYuanYear(year, month, day) {
  if (month > 2) return year;
  if (month < 2) return year - 1;
  const lc = zbLichunDay(year); // 該年立春的「日」（2 月）
  return day >= lc ? year : year - 1;
}

// 取某西元年立春的日（2 月），失敗時退回 4（立春多為 2/3~2/5）
function zbLichunDay(year) {
  try {
    const table = Solar.fromYmd(year, 2, 20).getLunar().getJieQiTable();
    const lc = table["立春"];
    if (lc && lc.getYear() === year && lc.getMonth() === 2) return lc.getDay();
  } catch (e) { /* fall through */ }
  return 4;
}

// 主入口：排一張紫白飛星盤
// 參數 { angle(0~360 整數), period(1~9) 或改由 year/month/day 自動判運 }
function calculateZibai(opts) {
  let period = opts.period;
  let periodInfo = null;
  if (period == null && opts.year != null) {
    periodInfo = zbPeriodFromDate(opts.year, opts.month, opts.day);
    period = periodInfo.period;
  }

  const angle = ((Math.round(opts.angle) % 360) + 360) % 360;
  const fIdx = zbMountainIndex(angle);
  const sIdx = (fIdx + 12) % 24;         // 坐山＝向首對沖（+180°）
  const facing = ZB_MOUNTAINS[fIdx];     // 向首
  const sitting = ZB_MOUNTAINS[sIdx];    // 坐山

  const yun = zbFly(period, true);       // 運盤（順飛）

  // 向星：向首所在宮的運盤數入中
  const facePalace = ZB_DIR_TO_PALACE[facing.dir];
  const nVal = yun[facePalace];
  const xiang = zbFly(nVal, zbEnterYang(nVal, facing));

  // 山星：坐山所在宮的運盤數入中
  const sitPalace = ZB_DIR_TO_PALACE[sitting.dir];
  const mVal = yun[sitPalace];
  const shan = zbFly(mVal, zbEnterYang(mVal, sitting));

  // 九宮（依宮數 1~9）
  const palaces = {};
  [1, 2, 3, 4, 5, 6, 7, 8, 9].forEach((p) => {
    palaces[p] = { palace: p, dir: ZB_PALACE_TO_DIR[p], yun: yun[p], shan: shan[p], xiang: xiang[p] };
  });

  return {
    period,
    periodInfo,
    angle,
    facing, sitting,
    zuoXiang: sitting.name + "山" + facing.name + "向",
    facingDegText: zbDegText(fIdx),
    palaces,
    cells: zbLayout(palaces, facing.dir) // 依向首朝上排好的九宮版面
  };
}

// 入中之數的陰陽（順/逆）：一般取同元龍字之陰陽；入中為 5（無卦）則用山/向本身
function zbEnterYang(num, mountain) {
  if (num === 5) return mountain.yang;
  const name = ZB_PALACE_MOUNTAINS[num][mountain.el];
  return ZB_YANG[name];
}

// 24 山向首角度區間文字（如 甲：67.6-82.5°）
function zbDegText(idx) {
  const c = idx * 15;
  const lo = ((c - 7.4) % 360 + 360) % 360;
  const hi = (c + 7.5) % 360;
  const f = (x) => (Math.round(x * 10) / 10).toString();
  return f(lo) + "-" + f(hi) + "°";
}

// 版面：3×3 螢幕格（row,col 1-indexed），向首置頂中，其餘依羅盤順時針對位
// 螢幕順時針序（自上方中央起）與羅盤順時針序（自向首起）一一對應。
const ZB_SCREEN_CW = [
  { r: 1, c: 2 }, { r: 1, c: 3 }, { r: 2, c: 3 }, { r: 3, c: 3 },
  { r: 3, c: 2 }, { r: 3, c: 1 }, { r: 2, c: 1 }, { r: 1, c: 1 }
];
const ZB_COMPASS_CW = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

function zbLayout(palaces, facingDir) {
  const f = ZB_COMPASS_CW.indexOf(facingDir);
  const cells = [];
  // 中宮
  const center = palaces[5];
  cells.push({ r: 2, c: 2, dir: "C", dirName: "", center: true,
    yun: center.yun, shan: center.shan, xiang: center.xiang });
  // 外八宮
  for (let k = 0; k < 8; k++) {
    const dir = ZB_COMPASS_CW[(f + k) % 8];
    const p = palaces[ZB_DIR_TO_PALACE[dir]];
    const pos = ZB_SCREEN_CW[k];
    cells.push({ r: pos.r, c: pos.c, dir, dirName: ZB_DIR_NAME[dir], center: false,
      yun: p.yun, shan: p.shan, xiang: p.xiang });
  }
  return cells;
}

// ============================================================
//  盤面格局分析（玄空飛星）——標準理氣訣法，無 PDF 可對照，供參
// ============================================================

function zbFacingSitPalace(res) {
  return { fp: ZB_DIR_TO_PALACE[res.facing.dir], sp: ZB_DIR_TO_PALACE[res.sitting.dir] };
}

// 四大格局：到山到向／上山下水／雙星到向／雙星到坐
function zbGeju(res) {
  const yun = res.period, P = res.palaces;
  const { fp, sp } = zbFacingSitPalace(res);
  const xToX = P[fp].xiang === yun, sToS = P[sp].shan === yun, sToX = P[fp].shan === yun, xToS = P[sp].xiang === yun;
  if (xToX && sToS) return { name: "旺山旺向（到山到向）", tone: "good", desc: "當運向星到向、山星到坐山，主丁財兩旺之上格。向方宜見水（低、動、水），坐方宜見山（高、實、靜）。" };
  if (sToX && xToS) return { name: "上山下水", tone: "bad", desc: "當運山星到向、向星到坐，主損丁破財之下格。惟向方有山、坐方有水（巒頭顛倒相就）可反凶為吉，否則宜化解。" };
  if (xToX && sToX) return { name: "雙星到向", tone: "neutral", desc: "山星、向星令星俱到向首，旺財不旺丁。向方宜見水並聚人氣（客廳／開門），另於旺山星方補丁。" };
  if (xToS && sToS) return { name: "雙星到坐（雙星到山）", tone: "neutral", desc: "山星、向星令星俱到坐山，旺丁不旺財。坐方宜見水或開後門納氣以助財。" };
  return { name: "令星到偏宮", tone: "neutral", desc: "當運令星未落正向或正坐，須合巒頭與各宮飛星細論。" };
}

// 合十／三般卦／連珠／入囚／伏反吟／七星打劫
function zbFormations(res) {
  const yun = res.period, P = res.palaces, all = [1, 2, 3, 4, 5, 6, 7, 8, 9], out = [];
  const { fp, sp } = zbFacingSitPalace(res);
  if (all.every((p) => P[p].yun + P[p].xiang === 10)) out.push({ name: "向盤合十", tone: "good", desc: "向盤與運盤（地盤）全局合十，主催財、旺人緣、逢凶化吉。" });
  if (all.every((p) => P[p].yun + P[p].shan === 10)) out.push({ name: "山盤合十", tone: "good", desc: "山盤與運盤（地盤）全局合十，主旺丁添貴、逢凶化吉。" });
  const triads = [[1, 4, 7], [2, 5, 8], [3, 6, 9]];
  const sameTriad = (a, b, c) => triads.some((t) => [a, b, c].every((n) => t.includes(n)));
  if (all.every((p) => sameTriad(P[p].yun, P[p].shan, P[p].xiang)))
    out.push({ name: "父母三般卦", tone: "good", desc: "九宮每宮運/山/向皆成一四七、二五八、三六九之三般，通貫三元三才，主大貴、諸事化解（三般卦不忌上山下水）。" });
  const consec = (a, b, c) => {
    const s = new Set([a, b, c]); if (s.size !== 3) return false;
    for (let n = 1; n <= 9; n++) { if ([n, n % 9 + 1, (n + 1) % 9 + 1].every((x) => s.has(x))) return true; } return false;
  };
  if (all.every((p) => consec(P[p].yun, P[p].shan, P[p].xiang)))
    out.push({ name: "連珠三般卦", tone: "good", desc: "九宮每宮三星相連（連珠三般），一氣貫通、生生不息，主富貴綿延。" });
  if (P[5].xiang === yun) out.push({ name: "向星入囚", tone: "bad", desc: "當運向星（令星）飛入中宮受制，主退財、宅運不展，宜俟交運或以巒頭化解。" });
  if (P[5].shan === yun) out.push({ name: "山星入囚", tone: "bad", desc: "當運山星（令星）入中宮受制，主損丁、人口不旺。" });
  const outer = [1, 2, 3, 4, 6, 7, 8, 9];
  const fufan = (key) => { if (P[5][key] !== 5) return null; if (outer.every((p) => P[p][key] === p)) return "fu"; if (outer.every((p) => P[p][key] === 10 - p)) return "fan"; return null; };
  const fs = fufan("shan"), fx = fufan("xiang");
  if (fs === "fu") out.push({ name: "山盤伏吟", tone: "bad", desc: "山盤與地盤（元旦盤）相同（五黃入中順飛），伏吟，主哭泣、疾病、人口不安。" });
  if (fs === "fan") out.push({ name: "山盤反吟", tone: "bad", desc: "山盤與地盤全局合十顛倒（五黃入中逆飛），反吟，主動盪、傷病、破敗。" });
  if (fx === "fu") out.push({ name: "向盤伏吟", tone: "bad", desc: "向盤與地盤相同，伏吟，主氣滯、事重複、破財。" });
  if (fx === "fan") out.push({ name: "向盤反吟", tone: "bad", desc: "向盤反吟，主反覆、官非、破財。" });
  if (fp === 9 || fp === 1) {
    if (sameTriad(P[fp].xiang, P[5].xiang, P[sp].xiang) && P[fp].xiang === yun)
      out.push({ name: "七星打劫", tone: "good", desc: "向首（" + (fp === 9 ? "離" : "坎") + "宮）、中宮、坐宮向星成三般且旺向，得七星打劫之格，能借未來之氣、提前發福（須向方有水配合）。" });
  }
  return out;
}

// 正神／零神／照神（依元運）
function zbZhengLing(res) {
  const yun = res.period;
  const zdir = ZB_PALACE_TO_DIR[yun], ldir = ZB_PALACE_TO_DIR[10 - yun];
  const adj = (d) => { const i = ZB_COMPASS_CW.indexOf(d); return [ZB_COMPASS_CW[(i + 7) % 8], ZB_COMPASS_CW[(i + 1) % 8]].map((x) => ZB_DIR_NAME[x]); };
  return {
    zheng: ZB_DIR_NAME[zdir], ling: ZB_DIR_NAME[ldir],
    zhengZhao: adj(zdir), lingZhao: adj(ldir),
    desc: "正神方（" + ZB_DIR_NAME[zdir] + "，當運星本方）宜高、實、靜，見水主破財；零神方（" + ZB_DIR_NAME[ldir] +
      "，對宮）宜低、動、見水，為當運財神方。零神兩旁（" + adj(ldir).join("、") + "）為零照神，亦宜見水助財；正神兩旁（" + adj(zdir).join("、") + "）為正照神，宜實。"
  };
}

// 城門訣（向首兩旁宮，取天元龍陰陽逆飛能引令星者為正城門）
function zbChengMen(res) {
  const yun = res.period, P = res.palaces;
  const fi = ZB_COMPASS_CW.indexOf(res.facing.dir);
  return [ZB_COMPASS_CW[(fi + 7) % 8], ZB_COMPASS_CW[(fi + 1) % 8]].map((d) => {
    const pal = ZB_DIR_TO_PALACE[d], g = P[pal].yun;
    const tianYuan = ZB_PALACE_MOUNTAINS[pal] ? ZB_PALACE_MOUNTAINS[pal][1] : null;
    const yy = tianYuan ? ZB_YANG[tianYuan] : true;
    return { name: ZB_DIR_NAME[d], diPan: g, yinyang: yy ? "陽" : "陰", valid: zbFly(g, yy)[pal] === yun };
  });
}

// 煞氣／旺氣（掃描九宮顯著飛星）
function zbWangSha(res) {
  const yun = res.period, out = [];
  res.cells.forEach((c) => {
    if (c.center) return;
    const notes = [];
    if (c.xiang === yun) notes.push({ tone: "good", txt: "當運旺向星到此——財位，宜見水、開門、擺動態以催財。" });
    if (c.shan === yun) notes.push({ tone: "good", txt: "當運旺山星到此——丁位，宜見山、安床、高實靜以旺人丁。" });
    if (c.xiang === 5 || c.shan === 5) notes.push({ tone: "bad", txt: "五黃廉貞到此——大凶災星，忌動土修造，宜靜，以金（銅鈴／六帝錢）洩化。" });
    if (c.xiang === 2 || c.shan === 2) notes.push({ tone: "bad", txt: "二黑病符到此——主疾病，忌久留，以金洩土氣化解。" });
    if (c.xiang === 3 || c.shan === 3) notes.push({ tone: "warn", txt: "三碧是非到此——主口舌官非，宜靜，以紅（火）洩或以金剋。" });
    if ((c.xiang === 7 || c.shan === 7) && yun !== 7) notes.push({ tone: "warn", txt: "七赤破軍到此（退運）——主破財口舌，以水洩金氣化解。" });
    if (notes.length) out.push({ dir: c.dirName, notes });
  });
  return out;
}

function analyzeZibai(res) {
  return { geju: zbGeju(res), formations: zbFormations(res), zhengling: zbZhengLing(res), chengmen: zbChengMen(res), wangsha: zbWangSha(res) };
}

// ============================================================
//  宅主命卦（八宅）——命卦推演＋游年翻卦四吉四凶方
// ============================================================
const ZB_GUA_CHAR = { 1: "坎", 2: "坤", 3: "震", 4: "巽", 6: "乾", 7: "兌", 8: "艮", 9: "離" };
const ZB_GUA_WX = { 1: "水", 2: "土", 3: "木", 4: "木", 6: "金", 7: "金", 8: "土", 9: "火" };
const ZB_EAST_GUA = [1, 9, 3, 4]; // 東四命

function zbDigitRoot(n) {
  let s = String(Math.abs(n)).split("").reduce((a, d) => a + (+d), 0);
  while (s > 9) s = String(s).split("").reduce((a, d) => a + (+d), 0);
  return s;
}

// 命卦：西元年（立春換年）數字根，男 11−根、女 根＋4，得 5 男作坤2女作艮8
function zbLifeGua(year, month, day, isMale) {
  const yy = zbYuanYear(year, month, day);
  const S = zbDigitRoot(yy);
  let g = isMale ? (11 - S) : (S + 4);
  g = ((g - 1) % 9 + 9) % 9 + 1;
  if (g === 5) g = isMale ? 2 : 8;
  const group = ZB_EAST_GUA.includes(g) ? "東" : "西";
  const dir = ZB_PALACE_TO_DIR[g];
  return { num: g, gua: ZB_GUA_CHAR[g], group, groupName: group + "四命", dir, dirName: ZB_DIR_NAME[dir], wx: ZB_GUA_WX[g], lichunYear: yy, isMale };
}

// 游年翻卦：由本卦依序翻爻（上中下…）得八方游年星
const ZB_BAGUA_LINES = { 1: [0, 1, 0], 9: [1, 0, 1], 3: [1, 0, 0], 4: [0, 1, 1], 6: [1, 1, 1], 2: [0, 0, 0], 8: [0, 0, 1], 7: [1, 1, 0] };
const ZB_LINES_TO_GUA = {};
Object.keys(ZB_BAGUA_LINES).forEach((k) => { ZB_LINES_TO_GUA[ZB_BAGUA_LINES[k].join(",")] = +k; });
// 翻爻序（0下爻1中爻2上爻，累進）：生氣上、五鬼中、延年下、六煞中、禍害上、天醫中、絕命下，末伏位＝本卦
const ZB_GAME_SEQ = [["生氣", 2], ["五鬼", 1], ["延年", 0], ["六煞", 1], ["禍害", 2], ["天醫", 1], ["絕命", 0]];
const ZB_GAME_META = {
  生氣: { tone: "good", lv: "大吉", wx: "木", note: "貪狼，主活力、名利、添丁" },
  延年: { tone: "good", lv: "大吉", wx: "金", note: "武曲，主健康長壽、感情和合" },
  天醫: { tone: "good", lv: "中吉", wx: "土", note: "巨門，主健康、財富、貴人" },
  伏位: { tone: "good", lv: "小吉", wx: "木", note: "輔弼，主平穩、蓄氣安定" },
  絕命: { tone: "bad", lv: "大凶", wx: "金", note: "破軍，主重病、破敗、絕嗣" },
  五鬼: { tone: "bad", lv: "大凶", wx: "火", note: "廉貞，主火災、官非、小人" },
  六煞: { tone: "warn", lv: "次凶", wx: "水", note: "文曲，主是非、桃花、破財" },
  禍害: { tone: "warn", lv: "小凶", wx: "土", note: "祿存，主口舌、疾病、爭執" }
};
function zbGameStars(gua) {
  let lines = ZB_BAGUA_LINES[gua].slice();
  const map = { 伏位: gua };
  ZB_GAME_SEQ.forEach(([star, li]) => { lines = lines.slice(); lines[li] ^= 1; map[star] = ZB_LINES_TO_GUA[lines.join(",")]; });
  return ["生氣", "延年", "天醫", "伏位", "絕命", "五鬼", "六煞", "禍害"].map((star) => {
    const gg = map[star], dir = ZB_PALACE_TO_DIR[gg];
    return Object.assign({ star, gua: gg, guaChar: ZB_GUA_CHAR[gg], dir, dirName: ZB_DIR_NAME[dir] }, ZB_GAME_META[star]);
  });
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { calculateZibai, zbPeriodFromDate, zbMountainIndex, zbFly, ZB_MOUNTAINS, analyzeZibai, zbLifeGua, zbGameStars };
}
