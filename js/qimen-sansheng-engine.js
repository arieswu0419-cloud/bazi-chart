/*
 * 奇門三勝宮引擎 —— 年盤／月盤／日盤／時盤 四盤
 *
 * 排盤機制與「奇門藍盤」共用 js/qimen-engine.js 的建構函式（buildDiPan／getXunShou／
 * findGongOfStem／findXingTargetGong／findMenTargetGong／buildTianPan／buildRenPan／
 * buildShenPan／GONG_INFO／XING_BEN_WEI…），四盤差別只在「基準柱」與「局數」：
 *   年盤→年柱、月盤→月柱、日盤→日柱、時盤→時柱（決定符首／值符／值使／天盤旋轉）。
 *
 * 定局法（2026-07-18 逐字對照官網 /qimenallpan 前端原始碼，該頁純前端、免登入）：
 *   時盤：＝藍盤（節氣＋日柱元別拆補），直接呼叫 calculateQimenHeader。
 *   日盤：2025 年起官網改用乾淨公式——以冬至/夏至（實為近至日之符頭起點）為界，
 *         日局 = 陽遁 (days%9)+1、陰遁 9-(days%9)，days＝起點到當日(晚子時+1)的天數。
 *         官網硬編了 2024-12 ~ 2027-06 的分界日期，這裡照抄（RI_PERIODS）。
 *   月盤：官網硬編的日期區間表（2023-04 ~ 2030-12，每段約 10 個月、局遞減），一律陰遁。
 *   年盤：官網寫死「陰遁 7 局」（當前元運），照抄。
 * 註：官網 2023-2024 的日盤用另一套舊月表，此處未移植（過去年份、低頻）；
 *     年份超出官網硬表範圍時退回最近界線外推，可能與官網（官網本身也只維護到約 2030）略有出入。
 */

// ---- 日盤：陰陽遁分界與起點（照抄官網硬編；dun 1=陽遁 0=陰遁）----
const SANSHENG_RI_PERIODS = [
  { from: "2025-01-01 00:00", to: "2025-06-23 22:59", dun: 1, start: "2024-12-26" },
  { from: "2025-06-23 23:00", to: "2025-12-20 23:59", dun: 0, start: "2025-06-24" },
  { from: "2025-12-20 23:00", to: "2026-06-18 22:59", dun: 1, start: "2025-12-21" },
  { from: "2026-06-18 23:00", to: "2026-12-15 22:59", dun: 0, start: "2026-06-19" },
  { from: "2026-12-15 23:00", to: "2027-06-13 22:59", dun: 1, start: "2026-12-16" }
];

// ---- 月盤：日期區間 → 局數（照抄官網硬編）；一律陰遁 ----
const SANSHENG_YUE_TABLE = [
  { from: "2023-04-05", to: "2024-02-04", ju: 8 },
  { from: "2024-02-05", to: "2024-12-06", ju: 7 },
  { from: "2024-12-07", to: "2025-10-08", ju: 6 },
  { from: "2025-10-09", to: "2026-08-07", ju: 5 },
  { from: "2026-08-08", to: "2027-06-06", ju: 4 },
  { from: "2027-06-07", to: "2028-04-03", ju: 3 },
  { from: "2028-04-04", to: "2029-02-02", ju: 2 },
  { from: "2029-02-03", to: "2029-12-06", ju: 1 },
  { from: "2029-12-07", to: "2030-11-01", ju: 9 },
  { from: "2030-11-02", to: "2030-12-31", ju: 8 }
];

function sanshengPad(n) { return ("0" + n).slice(-2); }
function sanshengDateStr(y, m, d, h, mi) {
  return y + "-" + sanshengPad(m) + "-" + sanshengPad(d) + " " + sanshengPad(h) + ":" + sanshengPad(mi);
}

// 日盤局數（官網 newFormula）
function computeRiJu(y, m, d, h, mi) {
  const ds = sanshengDateStr(y, m, d, h, mi);
  const period = SANSHENG_RI_PERIODS.find((p) => ds >= p.from && ds <= p.to);
  if (!period) return null; // 超出官網硬表範圍
  const start = new Date(period.start + "T00:00:00+08:00");
  const end = new Date(y + "-" + sanshengPad(m) + "-" + sanshengPad(d) + "T00:00:00+08:00");
  if (h >= 23) end.setDate(end.getDate() + 1); // 晚子時進位隔日
  const days = Math.floor((end - start) / 86400000);
  const rem = Math.abs(days % 9);
  const ju = period.dun === 1 ? (rem + 1) : (9 - rem);
  return { isYang: period.dun === 1, ju: ((ju - 1) % 9 + 9) % 9 + 1 };
}

// 月盤局數（官網硬表，陰遁）
function computeYueJu(y, m, d) {
  const ds = y + "-" + sanshengPad(m) + "-" + sanshengPad(d);
  const row = SANSHENG_YUE_TABLE.find((r) => ds >= r.from && ds <= r.to);
  return { isYang: false, ju: row ? row.ju : 9 }; // 表外預設陰9（官網 else 分支）
}

// 年盤局數（官網寫死陰7）
function computeNianJu() { return { isYang: false, ju: 7 }; }

// ---- 用指定「基準柱＋局」組一張盤，重用 qimen-engine.js 的建構函式 ----
// 回傳與 calculateQimenHeader 相同的 data 形狀，供 buildQimenGridHtml/Compass 直接渲染。
function buildSanshengPlate(refGan, refZhi, isYang, ju, siZhu, lunarText, solarText) {
  const diPan = buildDiPan(ju, isYang);
  const xunShou = getXunShou(refGan, refZhi);
  const rawFuShouGong = findGongOfStem(diPan, xunShou.yi);
  let fuShouGong = rawFuShouGong;
  if (fuShouGong === 5) fuShouGong = 2;
  const fuShouXing = XING_BEN_WEI[fuShouGong];

  const xingTargetGong = findXingTargetGong(diPan, refGan, fuShouGong);
  const hourIndexInXun = getJiaZi60Index(refGan, refZhi) - xunShou.startIdx;
  const menTargetGong = findMenTargetGong(rawFuShouGong, hourIndexInXun, isYang);

  const { tianPanXing, tianPanGan } = buildTianPan(diPan, fuShouGong, xingTargetGong, isYang);
  const { renPanMen } = buildRenPan(fuShouGong, menTargetGong, isYang);
  const shenPan = buildShenPan(xingTargetGong, isYang);

  const kongWang = getKongWang(refGan, refZhi);
  const yiMa = getYiMa(refZhi);
  const yiMaGong = ZHI_TO_GONG_QM[yiMa];

  const gongs = {};
  [1, 2, 3, 4, 6, 7, 8, 9].forEach((g) => {
    const tianGan = tianPanGan[g];
    const diGan = diPan[g];
    gongs[g] = {
      gong: g, gua: GONG_INFO[g].gua, dir: GONG_INFO[g].dir,
      xing: tianPanXing[g], men: renPanMen[g], shen: shenPan[g],
      tianGan, diGan,
      jiXing: hasJiXing(g, tianGan, diGan),
      geju: getGeju81(tianGan, diGan),
      isMingGong: false, isZiNu: false,
      cornerWords: buildCornerWords(g, renPanMen[g], tianPanXing[g], shenPan[g], tianGan, diGan, false, false, g === yiMaGong)
    };
  });

  return {
    solarText, lunarText, siZhu,
    juInfo: { isYang, ju },
    xunShou, fuShouGong, fuShouXing, fuShouDir: GONG_INFO[fuShouGong].dir,
    xingTargetGong, menTargetGong,
    kongWang, yiMa, diPan, gongs, patternText: "無"
  };
}

// ---- 主入口：一次算出四盤 ----
function calculateSansheng({ year, month, day, hour, minute }) {
  const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
  const lunar = solar.getLunar();
  const ec = lunar.getEightChar();
  ec.setSect(1); // 晚子時歸明日（跟藍盤一致）

  const solarText = year + "-" + sanshengPad(month) + "-" + sanshengPad(day) + " " +
    sanshengPad(hour) + ":" + sanshengPad(minute);
  const lunarText = lunar.toString();

  // 四柱（時日月年）——月柱用節氣進位到整點的顯示版（跟藍盤／八字一致）
  const effMonth = getEffectiveMonthGanZhi(solar);
  const siZhu = [
    { label: "時柱", gan: ganPart(ec.getTimeGan()), zhi: zhiPart(ec.getTimeZhi()) },
    { label: "日柱", gan: ganPart(ec.getDayGan()), zhi: zhiPart(ec.getDayZhi()) },
    { label: "月柱", gan: ganPart(effMonth.gan), zhi: zhiPart(effMonth.zhi) },
    { label: "年柱", gan: ganPart(ec.getYearGan()), zhi: zhiPart(ec.getYearZhi()) }
  ];

  // 時盤 ＝ 藍盤（完全複製）
  const shi = calculateQimenHeader({ year, month, day, hour, minute, name: "", gender: "male", yiMaBasis: "time", kongWangBasis: "time" });

  // 日盤
  const riJu = computeRiJu(year, month, day, hour, minute);
  const ri = riJu ? buildSanshengPlate(ec.getDayGan(), ec.getDayZhi(), riJu.isYang, riJu.ju, siZhu, lunarText, solarText) : null;

  // 月盤
  const yueJu = computeYueJu(year, month, day);
  const yue = buildSanshengPlate(effMonth.gan, effMonth.zhi, yueJu.isYang, yueJu.ju, siZhu, lunarText, solarText);

  // 年盤
  const nianJu = computeNianJu();
  const nian = buildSanshengPlate(ec.getYearGan(), ec.getYearZhi(), nianJu.isYang, nianJu.ju, siZhu, lunarText, solarText);

  return { solarText, lunarText, siZhu, nian, yue, ri, shi };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { calculateSansheng, computeRiJu, computeYueJu, computeNianJu, buildSanshengPlate };
}
