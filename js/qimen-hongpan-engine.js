/*
 * 奇門紅盤（時盤）引擎 —— 獨立實作，不與 qimen-engine.js（奇門命盤／奇門遁甲）共用任何邏輯
 * 對照基準：https://product.meta-academy.biz/yidao?date=now&type=qimenshipan（復科官網時盤）
 *
 * 反推依據：使用者提供的 26 張復科時盤截圖（2026-07-16 ～ 2027-09-16，含每月一張＋
 * 2026-09/10/11 月內每隔數日加密取樣），以「值符星＋值使方位＋格局欄＋盤面天地盤干」交叉驗證。
 *
 * 【排盤機制——26 張全部吻合，視為已確定】
 * 1. 符首＝時柱旬首（甲子戊…甲寅癸）；值符星＝符首儀在地盤所在宮的本位星，
 *    儀落中五宮時寄坤二宮、值符顯示天芮（12 張含中宮案例驗證）。
 * 2. 值使門落宮＝從符首「原始宮位」（落中宮時起點仍是 5）沿洛書數字順序 1→9 走
 *    「時辰在旬內的序數」步，陽遁順走、陰遁逆走，走到 5 算一步不跳過，最後落 5 才寄坤二。
 *    （2026-11-08 盤：7 宮逆走 2 步落 5 寄坤＝值使西南，實證「落5寄二」；
 *      2026-09-10 盤：起點 5 逆走 6 步落艮八＝值使東北，實證「起點用原始 5」。）
 * 3. 九星（天盤干隨星）、八門的旋轉：沿後天八卦「空間順時針」環（巽離坤兌乾坎艮震），
 *    陽遁順、陰遁逆，值符星飛到「時干在地盤的宮」（時干＝甲時用旬儀、落中五寄坤二）。
 * 4. 八神：值符起、沿空間環陽順陰逆；第 5、6 神全年固定用「白虎、玄武」——
 *    陽遁盤（2027-03-16 陽一局）逐宮驗證過，復科紅盤不用勾陳朱雀。
 * 5. 格局欄＝九星/八門/天干伏吟反吟（旋轉量 0／4）＋五不遇時（時干＝日干＋6，七殺）。
 * 6. 空亡、驛馬用「時柱」干支（外環空／馬標記，2026-07-16 盤空亡辰巳實證）。
 *
 * 【定局法——已定案，45 張截圖全數吻合】
 * 局數 ＝（年支序 ＋ 農曆月 ＋ 農曆日 ＋ 時支序）mod 9（0 作 9；支序：子1 丑2 … 亥12）
 * ＝梅花易數／小奇門的起數法——復科紅盤＝小奇門式定局＋轉盤式排盤，不是拆補也不是置閏。
 * 陰陽遁：冬至（含交節時刻）～夏至前＝陽遁、夏至～冬至前＝陰遁（lunar-javascript 精確節氣）；
 * 遁的切換不打斷局數序列（實測 2026-12-21 陰9 → 12-22 陽1 → 12-23 陽2，公式連續）。
 *
 * 推導歷程：26 張跨月截圖先鎖定機制與「逐日+1」；2026-12-05~18、12-20~24 連續日盤
 * 發現同日不同時辰局數不同（12-10 子時陰3、辰時陰7）→ 逐時辰+1 → 收斂出上式；
 * 朔日的「大月−1／小月+0」跳動其實是公式跨月界的自然結果。45 筆樣本（2026-07~2027-09，
 * 含跨大雪、跨冬至、跨農曆年）全部代入無一例外。
 *
 * 年支換年點＝立春（精確到交節時刻，同八字年柱）——用 2027-02-04/05/06 三張連續盤定案：
 *   02-05 早上（立春已過、正月初一未到）實測陽9，只有「立春換年」（未8+12+29+5=54≡9）吻合，
 *   「正月初一換年」（午7→8）不合；02-04 早上（立春當天、交節時刻前）仍用午年 → 精確時刻切換。
 *   注意混合制：年支隨立春，但月、日仍用「農曆」數（02-05 用十二月29，非寅月）。
 *
 * 邊角案例（2028-06-22／06-23／07-17 晚上 11:12 三張樣本定案，全部驗證完畢）：
 *   1. 閏月＝取本月月數：2028 閏五月初一（06-23）實測陰7＝申9+5+1+子1，閏五月算 5 不算 6；
 *      閏五月廿五（07-17）陰4 再次確認。
 *   2. 晚子時（23 時起）：日柱進位隔日（06-23 23:12 顯示日庚辰）、時支取子，
 *      但「農曆月日不進位」——06-22 23:12 實測陰9＝申9+5+30+子1，用五月三十而非閏五月初一。
 */

const HP_GAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const HP_ZHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

// 宮位資訊（1坎…9離）
const HP_GONG = {
  1: { gua: "坎", dir: "正北", wx: "水" },
  2: { gua: "坤", dir: "西南", wx: "土" },
  3: { gua: "震", dir: "正東", wx: "木" },
  4: { gua: "巽", dir: "東南", wx: "木" },
  5: { gua: "中", dir: "中宮", wx: "土" },
  6: { gua: "乾", dir: "西北", wx: "金" },
  7: { gua: "兌", dir: "正西", wx: "金" },
  8: { gua: "艮", dir: "東北", wx: "土" },
  9: { gua: "離", dir: "正南", wx: "火" }
};
const HP_XING = { 1: "天蓬", 2: "天芮", 3: "天衝", 4: "天輔", 5: "天禽", 6: "天心", 7: "天柱", 8: "天任", 9: "天英" };
const HP_MEN = { 1: "休", 2: "死", 3: "傷", 4: "杜", 6: "開", 7: "驚", 8: "生", 9: "景" };
// 八神：復科紅盤全年固定這一組（陽遁盤逐宮驗證過，沒有勾陳朱雀）
const HP_SHEN = ["值符", "騰蛇", "太陰", "六合", "白虎", "玄武", "九地", "九天"];
// 空間順時針環（巽離坤兌乾坎艮震）；九星八門八神的旋轉都走這個環
const HP_SPATIAL = [4, 9, 2, 7, 6, 1, 8, 3];
// 三奇六儀入地盤順序；符首旬→儀
const HP_YI_SEQ = ["戊", "己", "庚", "辛", "壬", "癸", "丁", "丙", "乙"];
const HP_XUN = [
  { xun: "甲子", startIdx: 0, yi: "戊" },
  { xun: "甲戌", startIdx: 10, yi: "己" },
  { xun: "甲申", startIdx: 20, yi: "庚" },
  { xun: "甲午", startIdx: 30, yi: "辛" },
  { xun: "甲辰", startIdx: 40, yi: "壬" },
  { xun: "甲寅", startIdx: 50, yi: "癸" }
];
// 甲（遁干）依地支找旬儀：日／時干是甲時，用該柱地支查儀再找天盤宮
const HP_JIA_YI_BY_ZHI = { 子: "戊", 戌: "己", 申: "庚", 午: "辛", 辰: "壬", 寅: "癸" };
// 六儀擊刑（天盤干版，與復科紅盤 2027-04-16 陽三局「戊繫刑落震」等案例一致）
const HP_JI_XING = { 3: ["戊"], 2: ["己"], 8: ["庚"], 9: ["辛"], 4: ["壬", "癸"] };
// 天干入墓（四隅宮，看天盤干）
const HP_RUMU = { 乾: ["乙", "丙", "戊"], 艮: ["丁", "己", "庚"], 巽: ["辛", "壬"], 坤: ["甲", "癸"] };
// 門五行＋相剋（門剋宮＝門迫、宮剋門＝宮迫；復科紅盤逐格標示，多盤驗證同規則）
const HP_MEN_WX = { 休: "水", 死: "土", 傷: "木", 杜: "木", 開: "金", 驚: "金", 生: "土", 景: "火" };
const HP_WX_KE = { 火: "金", 土: "水", 水: "火", 金: "木", 木: "土" };
// 驛馬（時支三合長生對沖）
const HP_YIMA = { 申: "寅", 子: "寅", 辰: "寅", 寅: "申", 午: "申", 戌: "申", 亥: "巳", 卯: "巳", 未: "巳", 巳: "亥", 酉: "亥", 丑: "亥" };

// 十二長生（外環地支旁小字、右上「長生」天干下拉連動）：標準十二長生，陽干順行、陰干逆行，
// 長生起支：甲亥 丙寅 戊寅 庚巳 壬申（順）；乙午 丁酉 己酉 辛子 癸卯（逆）。
// 復科實測驗證：2026-07-16 選丙（寅長順行）12/12、08-16 壬（申長順行）12/12、
// 09-16 癸（卯長逆行）12/12、2027-01-16 乙（午長逆行）12/12；
// 下拉預設＝日干（2026-12-05~18 連續盤下拉值序列癸甲乙丙丁戊己庚辛壬癸甲乙丙＝日干序列，完全吻合）。
const HP_CS_STAGES = ["長", "沐", "冠", "臨", "帝", "衰", "病", "死", "墓", "絕", "胎", "養"];
const HP_CS_START = { 甲: "亥", 丙: "寅", 戊: "寅", 庚: "巳", 壬: "申", 乙: "午", 丁: "酉", 己: "酉", 辛: "子", 癸: "卯" };
function hpChangShengMap(gan) {
  const start = hpZhiIdx(HP_CS_START[gan]);
  const forward = hpGanIdx(gan) % 2 === 0; // 甲丙戊庚壬＝陽干順行，乙丁己辛癸＝陰干逆行
  const map = {};
  for (let i = 0; i < 12; i++) {
    map[HP_ZHI[((start + (forward ? i : -i)) % 12 + 12) % 12]] = HP_CS_STAGES[i];
  }
  return map;
}

// 外環 64 卦（從復科紅盤截圖反推，19 個卦位驗證全中：2026-07-16 小過益鼎蒙明夷需履萃、
// 08-16 未濟謙隨小畜姤歸妹剝既濟、12-16 蒙小過益；09-16 星門轉量相同→八宮全純卦亦吻合）：
// 每宮上卦＝該宮「天盤星」的本宮後天卦、下卦＝該宮「八門」的本門宮後天卦，上疊下查 64 卦名。
const HP_XING_HOME = { 天蓬: 1, 天芮: 2, 天衝: 3, 天輔: 4, 天心: 6, 天柱: 7, 天任: 8, 天英: 9 };
const HP_MEN_HOME = { 休: 1, 死: 2, 傷: 3, 杜: 4, 開: 6, 驚: 7, 生: 8, 景: 9 };
const HP_HEXA_64 = {
  乾乾: "乾", 乾坤: "否", 乾坎: "訟", 乾離: "同人", 乾震: "無妄", 乾巽: "姤", 乾艮: "遯", 乾兌: "履",
  坤乾: "泰", 坤坤: "坤", 坤坎: "師", 坤離: "明夷", 坤震: "復", 坤巽: "升", 坤艮: "謙", 坤兌: "臨",
  坎乾: "需", 坎坤: "比", 坎坎: "坎", 坎離: "既濟", 坎震: "屯", 坎巽: "井", 坎艮: "蹇", 坎兌: "節",
  離乾: "大有", 離坤: "晉", 離坎: "未濟", 離離: "離", 離震: "噬嗑", 離巽: "鼎", 離艮: "旅", 離兌: "睽",
  震乾: "大壯", 震坤: "豫", 震坎: "解", 震離: "豐", 震震: "震", 震巽: "恆", 震艮: "小過", 震兌: "歸妹",
  巽乾: "小畜", 巽坤: "觀", 巽坎: "渙", 巽離: "家人", 巽震: "益", 巽巽: "巽", 巽艮: "漸", 巽兌: "中孚",
  艮乾: "大畜", 艮坤: "剝", 艮坎: "蒙", 艮離: "賁", 艮震: "頤", 艮巽: "蠱", 艮艮: "艮", 艮兌: "損",
  兌乾: "夬", 兌坤: "萃", 兌坎: "困", 兌離: "革", 兌震: "隨", 兌巽: "大過", 兌艮: "咸", 兌兌: "兌"
};

function hpGanIdx(g) { return HP_GAN.indexOf(g); }
function hpZhiIdx(z) { return HP_ZHI.indexOf(z); }
function hpJiaZi60(gan, zhi) {
  const g = hpGanIdx(gan), z = hpZhiIdx(zhi);
  for (let i = 0; i < 60; i++) if (i % 10 === g && i % 12 === z) return i;
  return -1;
}

// 陰陽遁：冬至（含）→夏至（不含）為陽遁，其餘陰遁；用 lunar-javascript 精確節氣時刻
const HP_YANG_JIEQI = ["冬至", "小寒", "大寒", "立春", "雨水", "驚蟄", "春分", "清明", "穀雨", "立夏", "小滿", "芒種"];
const HP_JIEQI_S2T = { 惊蛰: "驚蟄", 谷雨: "穀雨", 小满: "小滿", 芒种: "芒種", 处暑: "處暑" };

// 定局公式（51 筆復科時盤實測全數吻合，見檔頭）：
// 局數 ＝（年支序 ＋ 農曆月 ＋ 農曆日 ＋ 時支序）mod 9，0 作 9；支序子1…亥12。
// lunarMonth 傳 lunar-javascript 的 getMonth()（閏月為負值，取絕對值）；
// yearZhi 用「八字年柱地支」（立春精確時刻換年，2027-02-05 樣本定案），月、日仍用農曆數。
function hpDetermineJu(lunarMonth, lunarDay, yearZhi, timeZhi) {
  const n = (hpZhiIdx(yearZhi) + 1) + Math.abs(lunarMonth) + lunarDay + (hpZhiIdx(timeZhi) + 1);
  return ((n - 1) % 9 + 9) % 9 + 1;
}

// 地盤三奇六儀：戊起局數宮，陽遁 1→9 順填、陰遁逆填（含中五）
function hpBuildDiPan(ju, isYang) {
  const diPan = {};
  let p = ju;
  HP_YI_SEQ.forEach((s) => {
    diPan[p] = s;
    p = isYang ? (p % 9) + 1 : ((p + 7) % 9) + 1;
  });
  return diPan;
}
function hpFindStem(diPan, stem) {
  for (let g = 1; g <= 9; g++) if (diPan[g] === stem) return g;
  return null;
}

// 值使門落宮：原始符首宮起、洛書 1→9 陽順陰逆走 steps 步（5 算一步），落 5 寄坤二
function hpMenTarget(rawFuGong, steps, isYang) {
  let g = rawFuGong;
  for (let i = 0; i < steps; i++) g = isYang ? (g % 9) + 1 : ((g + 7) % 9) + 1;
  return g === 5 ? 2 : g;
}

// 沿空間環把本位盤旋轉 delta 格（九星／八門共用）
function hpRotate(benWei, fromGong, toGong, isYang, diPan) {
  const order = isYang ? HP_SPATIAL : HP_SPATIAL.slice().reverse();
  const delta = (order.indexOf(toGong) - order.indexOf(fromGong) + 8) % 8;
  const outA = {}, outB = {};
  order.forEach((newGong, newPos) => {
    const oldGong = order[(newPos - delta + 8) % 8];
    outA[newGong] = benWei[oldGong];
    if (diPan) outB[newGong] = diPan[oldGong];
  });
  return { plate: outA, gans: outB, delta };
}

// ---- 核心排盤（純函式，可單獨測試）：陰陽遁＋局數＋日時柱 → 全盤 ----
function hpBuildPan({ isYang, ju, dayGan, dayZhi, timeGan, timeZhi }) {
  const diPan = hpBuildDiPan(ju, isYang);

  // 符首（時柱旬）
  const timeIdx = hpJiaZi60(timeGan, timeZhi);
  const xunShou = HP_XUN[Math.floor(timeIdx / 10)];
  const hourIndexInXun = timeIdx - xunShou.startIdx;

  const rawFuGong = hpFindStem(diPan, xunShou.yi);
  const fuShouGong = rawFuGong === 5 ? 2 : rawFuGong;
  const fuShouXing = HP_XING[fuShouGong]; // 中五寄坤二顯示天芮

  // 值符星落宮＝時干地盤宮（甲時＝符首宮；落中五寄坤二）
  let xingTargetGong;
  if (timeGan === "甲") {
    xingTargetGong = fuShouGong;
  } else {
    const g = hpFindStem(diPan, timeGan);
    xingTargetGong = g === 5 ? 2 : g;
  }
  const menTargetGong = hpMenTarget(rawFuGong, hourIndexInXun, isYang);

  const xingRot = hpRotate(HP_XING, fuShouGong, xingTargetGong, isYang, diPan);
  const menRot = hpRotate(HP_MEN, fuShouGong, menTargetGong, isYang, null);

  // 八神：值符隨值符星、空間環陽順陰逆
  const order = isYang ? HP_SPATIAL : HP_SPATIAL.slice().reverse();
  const shenPan = {};
  const startPos = order.indexOf(xingTargetGong);
  HP_SHEN.forEach((s, i) => { shenPan[order[(startPos + i) % 8]] = s; });

  // 格局欄：五不遇時（時干＝日干＋6）＋伏吟反吟
  // 順序照復科：五不遇時在前（2028-06-23 表頭「五不遇時, 八門反吟」實證），吟類依門→星→干
  const labels = [];
  if ((hpGanIdx(dayGan) + 6) % 10 === hpGanIdx(timeGan)) labels.push("五不遇時");
  if (menRot.delta === 0) labels.push("八門伏吟");
  if (xingRot.delta === 0) labels.push("九星伏吟");
  if (xingRot.delta === 0) labels.push("天干伏吟");
  if (menRot.delta === 4) labels.push("八門反吟");
  if (xingRot.delta === 4) labels.push("九星反吟");
  if (xingRot.delta === 4) labels.push("天干反吟");

  return {
    diPan, xunShou, hourIndexInXun, rawFuGong, fuShouGong, fuShouXing,
    xingTargetGong, menTargetGong,
    tianPanXing: xingRot.plate, tianPanGan: xingRot.gans, renPanMen: menRot.plate,
    shenPan, xingDelta: xingRot.delta, menDelta: menRot.delta,
    patternText: labels.length ? labels.join(", ") : "無"
  };
}

// 空亡（時柱）：(支-干+10) mod 12 起連兩支
function hpKongWang(gan, zhi) {
  const i1 = (hpZhiIdx(zhi) - hpGanIdx(gan) + 10) % 12;
  return [HP_ZHI[i1], HP_ZHI[(i1 + 1) % 12]];
}

// 某干在天盤的宮位（甲→依地支查旬儀；找不到＝落中宮的干，寄天芮星目前位置）
function hpTianPanGongOf(gan, zhi, tianPanGan, tianPanXing) {
  let target = gan === "甲" ? HP_JIA_YI_BY_ZHI[zhi] : gan;
  for (let g = 1; g <= 9; g++) if (tianPanGan[g] === target) return g;
  for (let g = 1; g <= 9; g++) if (tianPanXing[g] === "天芮") return g;
  return null;
}

// ---- 主入口：跟 calculateQimenHeader 相同的回傳形狀，供紅盤頁共用渲染函式 ----
// （共用的只有「畫面渲染」；排盤邏輯全部在本檔案，與 qimen-engine.js 無關）
function calculateQimenHongpan({ year, month, day, hour, minute }) {
  const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
  const lunar = solar.getLunar();
  const ec = lunar.getEightChar();
  ec.setSect(1); // 晚子時進位日柱（跟復科一致）

  const timeGan = ec.getTimeGan(), timeZhi = ec.getTimeZhi();
  const dayGan = ec.getDayGan(), dayZhi = ec.getDayZhi();

  // 陰陽遁：目前節氣屬冬至~芒種＝陽遁
  const jieQiName = HP_JIEQI_S2T[lunar.getPrevJieQi(false).getName()] || lunar.getPrevJieQi(false).getName();
  const isYang = HP_YANG_JIEQI.includes(jieQiName);

  // 定局：小奇門公式（年支＋農曆月＋農曆日＋時支）；年支用八字年柱（立春精確換年），月日用農曆
  const ju = hpDetermineJu(lunar.getMonth(), lunar.getDay(), ec.getYearZhi(), timeZhi);
  const pan = hpBuildPan({ isYang, ju, dayGan, dayZhi, timeGan, timeZhi });

  const kongWang = hpKongWang(timeGan, timeZhi);
  const yiMa = HP_YIMA[timeZhi];

  // 日／時徽章＝日干／時干在天盤的宮位
  const dayBadgeGong = hpTianPanGongOf(dayGan, dayZhi, pan.tianPanGan, pan.tianPanXing);
  const timeBadgeGong = hpTianPanGongOf(timeGan, timeZhi, pan.tianPanGan, pan.tianPanXing);

  const gongs = {};
  [1, 2, 3, 4, 6, 7, 8, 9].forEach((g) => {
    const men = pan.renPanMen[g];
    const tianGan = pan.tianPanGan[g];
    const gua = HP_GONG[g].gua;
    // 角字：門迫／宮迫＋入墓（復科紅盤逐格顯示；擊刑另用 jiXing 徽章）
    const cornerWords = [];
    const menWx = HP_MEN_WX[men], gongWx = HP_GONG[g].wx;
    if (menWx && HP_WX_KE[menWx] === gongWx) cornerWords.push({ text: "門迫", type: "menpo" });
    if (menWx && HP_WX_KE[gongWx] === menWx) cornerWords.push({ text: "宮迫", type: "gongpo" });
    if ((HP_RUMU[gua] || []).includes(tianGan)) cornerWords.push({ text: tianGan + "入墓", type: "rumu" });
    // 宮位右中的灰色天干（從 2026-07-17 酉時復科截圖反推，8 宮全中）：
    // ＝該宮八門「本門宮」位置上的天盤干（門景→9宮天盤、門休→1宮天盤…）；
    // 本門宮若正是天芮落宮，中宮寄干一併帶出（實證：坎1生門→艮8天盤丙＋寄干壬＝「丙壬」）
    const menHome = HP_MEN_HOME[men];
    const grayGans = [pan.tianPanGan[menHome]];
    if (pan.tianPanXing[menHome] === "天芮") grayGans.push(pan.diPan[5]);
    gongs[g] = {
      gong: g,
      gua,
      dir: HP_GONG[g].dir,
      xing: pan.tianPanXing[g],
      men,
      shen: pan.shenPan[g],
      tianGan,
      diGan: pan.diPan[g],
      jiXing: (HP_JI_XING[g] || []).includes(tianGan),
      isMingGong: g === dayBadgeGong, // 「日」徽章（沿用渲染欄位名）
      isZiNu: g === timeBadgeGong,    // 「時」徽章
      grayGans,
      cornerWords
    };
  });

  // 外環 64 卦：上卦＝天盤星本宮卦、下卦＝門本宮卦（演算法出處與驗證見檔頭常數區註解）
  const hexagrams = {};
  [1, 2, 3, 4, 6, 7, 8, 9].forEach((g) => {
    const upper = HP_GONG[HP_XING_HOME[pan.tianPanXing[g]]].gua;
    const lower = HP_GONG[HP_MEN_HOME[pan.renPanMen[g]]].gua;
    hexagrams[g] = { upper, lower, name: HP_HEXA_64[upper + lower] || "" };
  });

  // 四柱表：沿用全站 ganPart／zhiPart 呈現（渲染層工具，非排盤邏輯）
  const siZhu = [
    { label: "時柱", gan: ganPart(timeGan), zhi: zhiPart(timeZhi) },
    { label: "日柱", gan: ganPart(dayGan), zhi: zhiPart(dayZhi) },
    { label: "月柱", gan: ganPart(ec.getMonthGan()), zhi: zhiPart(ec.getMonthZhi()) },
    { label: "年柱", gan: ganPart(ec.getYearGan()), zhi: zhiPart(ec.getYearZhi()) }
  ];

  return {
    solarText: year + "-" + String(month).padStart(2, "0") + "-" + String(day).padStart(2, "0") + " " +
      String(hour).padStart(2, "0") + ":" + String(minute).padStart(2, "0"),
    lunarText: lunar.toString(),
    siZhu,
    juInfo: { isYang, ju },
    patternText: pan.patternText,
    xunShou: pan.xunShou,
    kongWang,
    yiMa,
    diPan: pan.diPan,
    fuShouGong: pan.fuShouGong,
    fuShouXing: pan.fuShouXing,
    fuShouDir: HP_GONG[pan.fuShouGong].dir,
    xingTargetGong: pan.xingTargetGong,
    menTargetGong: pan.menTargetGong,
    hexagrams,
    gongs
  };
}

// 供測試頁使用（瀏覽器直接掛全域即可；此檔不依賴模組系統）
if (typeof module !== "undefined" && module.exports) {
  module.exports = { hpBuildPan, hpDetermineJu, hpBuildDiPan, hpMenTarget, HP_GONG };
}
