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

if (typeof module !== "undefined" && module.exports) {
  module.exports = { calculateZibai, zbPeriodFromDate, zbMountainIndex, zbFly, ZB_MOUNTAINS };
}
