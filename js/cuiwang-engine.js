/*
 * 奇門催旺（催財佈局）引擎
 *
 * 依使用者輸入的西元日期區間，逐日、逐時辰計算「奇門藍盤」，找出可催旺（催財）的宮位並評分。
 * 排盤直接呼叫 js/qimen-engine.js 的 calculateQimenHeader（＝奇門藍盤），只讀取九宮八卦格局。
 *
 * 催旺分數規則（反推自使用者提供之《催旺許願日.xlsx》，對 200 筆「吉門三奇」樣本 200/200 全中）：
 *   催旺宮位＝某宮「天盤干為三奇（乙丙丁）」且「該宮門為吉門（開／休／生）」。
 *   分數 ＝ 7 ＋ 神分 ＋ 門分，clamp 至 [7,10]：
 *     神分：九天 +3、值符 +2、九地/六合 +0、太陰 −1、凶神（騰蛇/白虎/玄武/勾陳/朱雀）−2
 *     門分：生 +0、休/開 +2
 *   物品＝該三奇天干之象意（十天干對照，見 CW_WUPIN）；佈局方位＝該宮方位。
 *   沖＝當日日柱地支對沖之生肖，該生肖者不宜佈局。
 */

const CW_SANQI = { 乙: 1, 丙: 1, 丁: 1 };      // 三奇
const CW_JIMEN = { 開: 1, 休: 1, 生: 1 };      // 吉門
const CW_SHEN_SCORE = { 九天: 3, 值符: 2, 九地: 0, 六合: 0, 太陰: -1 }; // 其餘凶神 −2
const CW_MEN_SCORE = { 生: 0, 休: 2, 開: 2 };
const CW_SANQI_NAME = { 乙: "乙（日奇）", 丙: "丙（月奇）", 丁: "丁（星奇）" };

// 三奇象意（催旺物品，整理自《催旺許願日.xlsx》十天干表）
const CW_WUPIN = {
  乙: "小草/小花/繩子/草藥/藤製品/木雕/圖畫/麵條/天鵝/頭髮/門/窗/床/椅/吸管/毛筆/龍",
  丙: "圓形物品/光碟/武器/灶爐/燈/燈泡/電器/電腦/球類/照明設備/眼鏡/電話",
  丁: "蠟燭/釘子/打火機/香烟/火柴/牙籤/電話/手機/圖釘/拐杖/鞭炮/小刀/燈/注射器"
};

// 12 時辰（每時辰奇門局相同，取代表整點）
const CW_SHICHEN = [
  { name: "早子時", range: "23:00-00:59", hour: 0 }, { name: "丑時", range: "01:00-02:59", hour: 2 },
  { name: "寅時", range: "03:00-04:59", hour: 4 }, { name: "卯時", range: "05:00-06:59", hour: 6 },
  { name: "辰時", range: "07:00-08:59", hour: 8 }, { name: "巳時", range: "09:00-10:59", hour: 10 },
  { name: "午時", range: "11:00-12:59", hour: 12 }, { name: "未時", range: "13:00-14:59", hour: 14 },
  { name: "申時", range: "15:00-16:59", hour: 16 }, { name: "酉時", range: "17:00-18:59", hour: 18 },
  { name: "戌時", range: "19:00-20:59", hour: 20 }, { name: "亥時", range: "21:00-22:59", hour: 22 }
];

const CW_ZHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const CW_ZODIAC = { 子: "鼠", 丑: "牛", 寅: "虎", 卯: "兔", 辰: "龍", 巳: "蛇", 午: "馬", 未: "羊", 申: "猴", 酉: "雞", 戌: "狗", 亥: "豬" };

function cwScore(gan, men, shen) {
  if (!CW_SANQI[gan] || !CW_JIMEN[men]) return null; // 非三奇或非吉門 → 不宜催旺
  const sScore = CW_SHEN_SCORE[shen] !== undefined ? CW_SHEN_SCORE[shen] : -2;
  const s = 7 + sScore + (CW_MEN_SCORE[men] || 0);
  return Math.max(7, Math.min(10, s));
}

// 評一個時辰：掃八宮（排除中5），取分數最高之催旺宮
function cwEvalHour(year, month, day, hour) {
  const data = calculateQimenHeader({ year, month, day, hour, minute: 0, name: "", gender: "male", yiMaBasis: "time", kongWangBasis: "time" });
  let best = null;
  [1, 2, 3, 4, 6, 7, 8, 9].forEach((g) => {
    const c = data.gongs[g];
    if (!c) return;
    const sc = cwScore(c.tianGan, c.men, c.shen);
    if (sc === null) return;
    if (!best || sc > best.score) {
      best = {
        gong: g, dir: c.dir, gan: c.tianGan, ganName: CW_SANQI_NAME[c.tianGan],
        wupin: CW_WUPIN[c.tianGan], men: c.men, shen: c.shen, xing: c.xing,
        geju: c.geju ? c.geju.name : "", gejuDesc: c.geju ? c.geju.desc : "", score: sc
      };
    }
  });
  return { juInfo: data.juInfo, best };
}

// 主入口：日期區間 → 每日 12 時辰
function analyzeCuiwangRange(fromY, fromM, fromD, toY, toM, toD, maxDays) {
  const start = new Date(fromY, fromM - 1, fromD);
  const end = new Date(toY, toM - 1, toD);
  const days = [];
  let d = new Date(start), n = 0;
  const cap = maxDays || 62;
  while (d <= end && n < cap) {
    const y = d.getFullYear(), m = d.getMonth() + 1, dd = d.getDate();
    // 日柱（用 lunar-javascript；晚子時歸明日與藍盤一致）
    const solar = Solar.fromYmdHms(y, m, dd, 12, 0, 0);
    const ec = solar.getLunar().getEightChar();
    ec.setSect(1);
    const dayGZ = ec.getDayGan() + ec.getDayZhi();
    const dayZhi = ec.getDayZhi();
    const chongZhi = CW_ZHI[(CW_ZHI.indexOf(dayZhi) + 6) % 12];
    const hours = CW_SHICHEN.map((sc) => {
      const r = cwEvalHour(y, m, dd, sc.hour);
      return { shi: sc.name, range: sc.range, juInfo: r.juInfo, best: r.best };
    });
    days.push({
      date: y + "-" + ("0" + m).slice(-2) + "-" + ("0" + dd).slice(-2),
      dayGZ, chongZhi, chongZodiac: CW_ZODIAC[chongZhi],
      hours
    });
    d.setDate(d.getDate() + 1); n++;
  }
  return { days, truncated: d <= end };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { analyzeCuiwangRange, cwEvalHour, cwScore, CW_WUPIN };
}
