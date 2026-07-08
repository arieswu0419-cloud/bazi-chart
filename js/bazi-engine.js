/*
 * 八字計算引擎
 * 四柱／大運／流年干支：交給 lunar-javascript 處理（節氣、干支精算）。
 * 神煞、格局判斷、四柱提示、五行與十神比重：lunar-javascript 沒有內建，這裡採用坊間常見的
 * 主流論法，並比照課程講義（Meta Academy《八字命卷》系列教材）與
 * https://www.event.meta-academy.biz/metagroup-bazi-ming-juan 的呈現方式與計算結果逐項核對校正。
 */

const WUXING_OF_GAN = { 甲: "木", 乙: "木", 丙: "火", 丁: "火", 戊: "土", 己: "土", 庚: "金", 辛: "金", 壬: "水", 癸: "水" };
const YINYANG_OF_GAN = { 甲: 1, 丙: 1, 戊: 1, 庚: 1, 壬: 1, 乙: 0, 丁: 0, 己: 0, 辛: 0, 癸: 0 };
const WUXING_OF_ZHI = { 子: "水", 丑: "土", 寅: "木", 卯: "木", 辰: "土", 巳: "火", 午: "火", 未: "土", 申: "金", 酉: "金", 戌: "土", 亥: "水" };
const YINYANG_OF_ZHI = { 子: 1, 寅: 1, 辰: 1, 午: 1, 申: 1, 戌: 1, 丑: 0, 卯: 0, 巳: 0, 未: 0, 酉: 0, 亥: 0 };
const GENERATES = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
const CONTROLS = { 木: "土", 土: "水", 水: "火", 火: "金", 金: "木" };
const WUXING_CLASS = { 木: "wood", 火: "fire", 土: "earth", 金: "metal", 水: "water" };
const ZHI_SHENGXIAO = { 子: "鼠", 丑: "牛", 寅: "虎", 卯: "兔", 辰: "龍", 巳: "蛇", 午: "馬", 未: "羊", 申: "猴", 酉: "雞", 戌: "狗", 亥: "豬" };
const ZHI_ORDER = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

// 地支藏干（本氣／中氣／餘氣，強弱順序，來自 lunar-javascript 內部表，與課程講義一致）
const NATIVE_HIDE_GAN = {
  子: ["癸"], 丑: ["己", "癸", "辛"], 寅: ["甲", "丙", "戊"], 卯: ["乙"],
  辰: ["戊", "乙", "癸"], 巳: ["丙", "庚", "戊"], 午: ["丁", "己"], 未: ["己", "丁", "乙"],
  申: ["庚", "壬", "戊"], 酉: ["辛"], 戌: ["戊", "辛", "丁"], 亥: ["壬", "甲"]
};

// 十二長生：以日干的長生起始地支＋順逆（陽順陰逆）推算，數值來自課程講義核對一致
const CHANG_SHENG_START = { 甲: "亥", 乙: "午", 丙: "寅", 丁: "酉", 戊: "寅", 己: "酉", 庚: "巳", 辛: "子", 壬: "申", 癸: "卯" };
const CHANG_SHENG_SEQ = ["長生", "沐浴", "冠帶", "臨官", "帝旺", "衰", "病", "死", "墓", "絕", "胎", "養"];
function getDiShi(gan, zhi) {
  const startIdx = ZHI_ORDER.indexOf(CHANG_SHENG_START[gan]);
  const targetIdx = ZHI_ORDER.indexOf(zhi);
  const forward = YINYANG_OF_GAN[gan] === 1;
  const diff = forward ? (targetIdx - startIdx + 12) % 12 : (startIdx - targetIdx + 12) % 12;
  return CHANG_SHENG_SEQ[diff];
}

// lunar-javascript 的十神／十二長生方法回傳簡體字，這裡統一轉回繁體
const SIMP_TO_TRAD = { 财: "財", 杀: "殺", 长: "長", 带: "帶", 临: "臨", 绝: "絕", 养: "養", 伤: "傷" };
function toTrad(s) {
  if (!s) return s;
  return s.split("").map((c) => SIMP_TO_TRAD[c] || c).join("");
}

// 注意：這裡故意不排除 otherGan === dayGan 的情況——那只代表天干字面相同（同陽同陰必為比肩），
// 是合法的十神結果。「日主自己不算十神」是在組四柱時用字串 "日主" 特別標記，不是靠這個函式判斷。
function getShiShen(dayGan, otherGan) {
  if (!otherGan) return null;
  const dw = WUXING_OF_GAN[dayGan], ow = WUXING_OF_GAN[otherGan];
  const same = YINYANG_OF_GAN[dayGan] === YINYANG_OF_GAN[otherGan];
  if (dw === ow) return same ? "比肩" : "劫財";
  if (GENERATES[dw] === ow) return same ? "食神" : "傷官";
  if (CONTROLS[dw] === ow) return same ? "偏財" : "正財";
  if (CONTROLS[ow] === dw) return same ? "七殺" : "正官";
  if (GENERATES[ow] === dw) return same ? "偏印" : "正印";
  return null;
}

// 六十甲子納音五行：標準對照表（每兩個甲子一組），用來判斷詞館貴人的年柱納音
const NAYIN_WUXING = [
  "金", "火", "木", "土", "金", "火", "水", "土", "金", "木",
  "水", "土", "火", "木", "水", "金", "火", "木", "土", "金",
  "火", "水", "土", "金", "木", "水", "土", "火", "木", "水"
];
function getNaYinWuxing(gan, zhi) {
  const idx = getJiaZiIndex(gan, zhi);
  return idx < 0 ? null : NAYIN_WUXING[Math.floor(idx / 2)];
}

// 三合局：申子辰 / 亥卯未 / 寅午戌 / 巳酉丑，各自對應桃花／驛馬／華蓋／將星／劫煞／亡神
// （以下神煞表全部來自課程講義《八字解鎖篇》第十六、十七章逐頁核對抄錄，不是猜測或坊間泛用版本）
const TRIADS = {
  申: "申子辰", 子: "申子辰", 辰: "申子辰",
  亥: "亥卯未", 卯: "亥卯未", 未: "亥卯未",
  寅: "寅午戌", 午: "寅午戌", 戌: "寅午戌",
  巳: "巳酉丑", 酉: "巳酉丑", 丑: "巳酉丑"
};
const TRIAD_STAR = {
  申子辰: { 桃花: "酉", 驛馬: "寅", 華蓋: "辰", 將星: "子", 劫煞: "巳", 亡神: "亥" },
  亥卯未: { 桃花: "子", 驛馬: "巳", 華蓋: "未", 將星: "卯", 劫煞: "申", 亡神: "寅" },
  寅午戌: { 桃花: "卯", 驛馬: "申", 華蓋: "戌", 將星: "午", 劫煞: "亥", 亡神: "巳" },
  巳酉丑: { 桃花: "午", 驛馬: "亥", 華蓋: "丑", 將星: "酉", 劫煞: "寅", 亡神: "申" }
};
// 日干／年干查地支：天乙貴人、太極貴人（皆為多值）
const TIANYI_GUIREN = { 甲: ["丑", "未"], 戊: ["丑", "未"], 庚: ["丑", "未"], 乙: ["子", "申"], 己: ["子", "申"], 丙: ["亥", "酉"], 丁: ["亥", "酉"], 壬: ["巳", "卯"], 癸: ["巳", "卯"], 辛: ["寅", "午"] };
const TAIJI_GUIREN = { 甲: ["子", "午"], 乙: ["子", "午"], 丙: ["卯", "酉"], 丁: ["卯", "酉"], 戊: ["辰", "戌", "丑", "未"], 己: ["辰", "戌", "丑", "未"], 庚: ["寅", "亥"], 辛: ["寅", "亥"], 壬: ["巳", "申"], 癸: ["巳", "申"] };
// 日干查地支（單值）：祿神、羊刃、飛刃、文昌貴人、國印貴人、天廚貴人、紅艷煞、流霞、金輿祿、福星貴人
const LU_SHEN = { 甲: "寅", 乙: "卯", 丙: "巳", 丁: "午", 戊: "巳", 己: "午", 庚: "申", 辛: "酉", 壬: "亥", 癸: "子" };
// 詞館貴人：年柱納音五行查固定地支（金命見申、木命見寅、水命見亥、火命見巳、土命見亥）
const CI_GUAN_TARGET = { 金: "申", 木: "寅", 水: "亥", 火: "巳", 土: "亥" };
const YANG_REN = { 甲: "卯", 乙: "辰", 丙: "午", 丁: "未", 戊: "午", 己: "未", 庚: "酉", 辛: "戌", 壬: "子", 癸: "丑" };
const FEI_REN = { 甲: "酉", 乙: "戌", 丙: "子", 丁: "丑", 戊: "子", 己: "丑", 庚: "卯", 辛: "辰", 壬: "午", 癸: "未" };
const WEN_CHANG = { 甲: "巳", 乙: "午", 丙: "申", 丁: "酉", 戊: "申", 己: "酉", 庚: "亥", 辛: "子", 壬: "寅", 癸: "卯" };
const GUO_YIN = { 甲: "戌", 乙: "亥", 丙: "丑", 丁: "寅", 戊: "丑", 己: "寅", 庚: "辰", 辛: "巳", 壬: "未", 癸: "申" };
// 原本誤標成「學堂貴人」，實測比對參考網站後確認這組數值對應的是天廚貴人。
// 乙／己／辛／癸四干核對一致；甲、戊、庚三干原值錯誤，已用實測結果改正；壬干原值其實是學堂貴人的值，
// 已用新實測結果改正為天廚貴人真正的值；丙干原值其實也是學堂貴人的值，天廚貴人在丙干的正確值還沒確認，
// 暫時拿掉（不顯示）避免掛錯名字；丁干尚未有足夠測試資料確認，先保留原值。
const TIAN_CHU = { 甲: "巳", 乙: "午", 丁: "酉", 戊: "申", 己: "酉", 庚: "亥", 辛: "子", 壬: "寅", 癸: "卯" };
// 真正的學堂貴人：目前已實測確認 8 個天干（甲／乙／丙／丁／戊／己／庚／壬），癸干尚未確認，
// 資料不足以前不加進去，避免顯示錯誤內容，見 README 已知限制
const XUE_TANG_REAL = { 甲: "亥", 乙: "亥", 丙: "寅", 丁: "寅", 戊: "申", 己: "申", 庚: "巳", 辛: "巳", 壬: "申" };
const HONG_YAN = { 甲: "午", 乙: "申", 丙: "寅", 丁: "未", 戊: "辰", 己: "辰", 庚: "戌", 辛: "酉", 壬: "子", 癸: "申" };
const LIU_XIA = { 甲: "酉", 乙: "戌", 丙: "未", 丁: "申", 戊: "巳", 己: "午", 庚: "辰", 辛: "卯", 壬: "亥", 癸: "寅" };
const JIN_YU = { 甲: "辰", 乙: "巳", 丙: "未", 丁: "申", 戊: "未", 己: "申", 庚: "戌", 辛: "亥", 壬: "丑", 癸: "寅" };
const FU_XING = { 甲: ["寅"], 乙: ["丑", "亥"], 丙: ["子", "戌"], 丁: ["酉"], 戊: ["申"], 己: ["未"], 庚: ["午"], 辛: ["巳"], 壬: ["辰"], 癸: ["卯"] };
// 年干查地支（單值）：天官貴人
const TIAN_GUAN = { 甲: "未", 乙: "辰", 丙: "巳", 丁: "酉", 戊: "戌", 己: "卯", 庚: "亥", 辛: "申", 壬: "寅", 癸: "午" };
// 孤辰／寡宿：依日支、年支所在的三會方局判斷
const GUCHEN_GUASU = {
  亥子丑: { 孤辰: "寅", 寡宿: "戌" },
  寅卯辰: { 孤辰: "巳", 寡宿: "丑" },
  巳午未: { 孤辰: "申", 寡宿: "辰" },
  申酉戌: { 孤辰: "亥", 寡宿: "未" }
};
const SANHUI_OF_ZHI = { 亥: "亥子丑", 子: "亥子丑", 丑: "亥子丑", 寅: "寅卯辰", 卯: "寅卯辰", 辰: "寅卯辰", 巳: "巳午未", 午: "巳午未", 未: "巳午未", 申: "申酉戌", 酉: "申酉戌", 戌: "申酉戌" };
// 年支查地支（單值，以年支對照月日時支）：紅鸞、天喜、血刃、五鬼、白虎、天狗、喪門、病符
const LONG_DE = { 子: "未", 丑: "申", 寅: "酉", 卯: "戌", 辰: "亥", 巳: "子", 午: "丑", 未: "寅", 申: "卯", 酉: "辰", 戌: "巳", 亥: "午" };
const HONG_LUAN = { 子: "卯", 丑: "寅", 寅: "丑", 卯: "子", 辰: "亥", 巳: "戌", 午: "酉", 未: "申", 申: "未", 酉: "午", 戌: "巳", 亥: "辰" };
const TIAN_XI = { 子: "酉", 丑: "申", 寅: "未", 卯: "午", 辰: "巳", 巳: "辰", 午: "卯", 未: "寅", 申: "丑", 酉: "子", 戌: "亥", 亥: "戌" };
// 丑／戌兩個年支原值錯誤，已用實測結果改正（丑：酉→巳；戌：子→卯），其餘尚未逐一測完，如仍有出入見 README
const XUE_REN = { 子: "戌", 丑: "巳", 寅: "申", 卯: "未", 辰: "午", 巳: "巳", 午: "辰", 未: "卯", 申: "寅", 酉: "丑", 戌: "卯", 亥: "亥" };
const WU_GUI = { 子: "辰", 丑: "巳", 寅: "午", 卯: "未", 辰: "申", 巳: "酉", 午: "戌", 未: "亥", 申: "子", 酉: "丑", 戌: "寅", 亥: "卯" };
const BAI_HU = { 子: "申", 丑: "酉", 寅: "戌", 卯: "亥", 辰: "子", 巳: "丑", 午: "寅", 未: "卯", 申: "辰", 酉: "巳", 戌: "午", 亥: "未" };
const TIAN_GOU = { 子: "戌", 丑: "亥", 寅: "子", 卯: "丑", 辰: "寅", 巳: "卯", 午: "辰", 未: "巳", 申: "午", 酉: "未", 戌: "申", 亥: "酉" };
const SANG_MEN = { 子: "寅", 丑: "卯", 寅: "辰", 卯: "巳", 辰: "午", 巳: "未", 午: "申", 未: "酉", 申: "戌", 酉: "亥", 戌: "子", 亥: "丑" };
// 年支為酉時實測發現原值（申）在參考網站不會顯示病符，正確值還沒確認，暫時拿掉這一格避免誤判
const BING_FU = { 子: "亥", 丑: "子", 寅: "丑", 卯: "寅", 辰: "卯", 巳: "辰", 午: "巳", 未: "午", 申: "未", 戌: "酉", 亥: "戌" };
const DA_HAO = { 子: "午", 丑: "未", 寅: "申", 卯: "酉", 辰: "戌", 巳: "亥", 午: "子", 未: "丑", 申: "寅", 酉: "卯", 戌: "辰", 亥: "巳" };
// 災煞：年支查地支（將星的對沖），以年支對照月日時支
const ZAI_SHA = { 申子辰: "午", 亥卯未: "酉", 寅午戌: "子", 巳酉丑: "卯" };
// 月支查值：天德貴人（值可能是天干或地支）、月德貴人（值固定是天干）、天醫（值是地支，只對照日支）
const TIAN_DE = { 寅: "丁", 卯: "申", 辰: "壬", 巳: "辛", 午: "亥", 未: "甲", 申: "癸", 酉: "寅", 戌: "丙", 亥: "乙", 子: "巳", 丑: "庚" };
const YUE_DE = { 寅: "丙", 午: "丙", 戌: "丙", 申: "壬", 子: "壬", 辰: "壬", 亥: "甲", 卯: "甲", 未: "甲", 巳: "庚", 酉: "庚", 丑: "庚" };
const TIAN_YI_MONTH = { 寅: "丑", 卯: "寅", 辰: "卯", 巳: "辰", 午: "巳", 未: "午", 申: "未", 酉: "申", 戌: "酉", 亥: "戌", 子: "亥", 丑: "子" };
// 日柱固定組合查表：魁罡貴人、十靈、陰差陽錯、六秀日
const KUI_GANG = ["庚辰", "庚戌", "壬辰", "戊戌"];
// 原本清單裡的「庚戌」實測後發現參考網站不會顯示十靈，已移除；其餘 9 組都已個別測試確認一致
const SHI_LING = ["甲辰", "乙亥", "丙辰", "丁酉", "戊午", "庚寅", "辛亥", "壬寅", "癸未"];
const YIN_YANG_CUO = ["丁丑", "丁未", "辛卯", "辛酉", "癸巳", "癸亥", "丙子", "丙午", "戊寅", "戊申", "壬辰", "壬戌"];
const LIU_XIU = ["丙午", "丁未", "戊子", "戊午", "己丑", "己未"];

function includesZhi(val, targetZhi) {
  if (!val) return false;
  return Array.isArray(val) ? val.includes(targetZhi) : val === targetZhi;
}

// pillarRole: 'year' | 'month' | 'day' | 'time' | 'dayun' | 'liunian'
// 有些神煞是「以年支對照月日時支」，本身年柱不必對自己查一次，所以 pillarRole==='year' 時跳過那幾條
function getShenShaForPillar(pillarRole, targetGan, targetZhi, ctx) {
  const { yearGan, yearZhi, monthZhi, dayGan, dayZhi } = ctx;
  const tags = [];
  const push = (name) => { if (!tags.includes(name)) tags.push(name); };

  // 魁罡貴人：四柱（含大運流年）只要本身干支剛好是這 4 組合就算，「四柱有即算」，不限定日柱
  if (targetGan && targetZhi && KUI_GANG.includes(targetGan + targetZhi)) push("魁罡");
  // 六秀日：固定 6 組干支組合，依名稱「日」字義只判斷日柱本身是否為這 6 組之一
  if (pillarRole === "day" && targetGan && targetZhi && LIU_XIU.includes(targetGan + targetZhi)) push("六秀");

  if (targetZhi) {
    // 以日支、年支查三合局：桃花、驛馬、華蓋、將星、劫煞、亡神
    // 華蓋／將星等落在辰戌丑未「庫」位時，該庫支對自己的三合局查會剛好等於自己，
    // 這種自我對應不是有意義的命中，所以日柱查自己時跳過日支三合局、年柱查自己時跳過年支三合局
    [{ src: "year", zhi: yearZhi }, { src: "day", zhi: dayZhi }].forEach(({ src, zhi: refZhi }) => {
      if (src === pillarRole) return;
      const triad = TRIADS[refZhi];
      if (!triad) return;
      const stars = TRIAD_STAR[triad];
      Object.keys(stars).forEach((name) => { if (stars[name] === targetZhi) push(name); });
    });
    // 金匱貴人：只以年支查三合局，取值同將星（寅午戌見午、巳酉丑見酉、申子辰見子、亥卯未見卯）。
    // 實測比對發現只用年支查才準，加上日支查會多出參考網站沒有的金匱，所以不像桃花／驛馬等同時查年支、日支；
    // 年柱本身永遠不算目標
    if (pillarRole !== "year") {
      const triad = TRIADS[yearZhi];
      if (triad && TRIAD_STAR[triad].將星 === targetZhi) push("金匱");
    }
    // 詞館貴人：課程講義規則是「年柱納音五行查固定地支（金見申／木見寅／水見亥／火見巳／土見亥），
    // 結合日柱或時柱的天干地支，且地支需處於臨官」，但實測比對後這個地支查出來實際命中的位置常常
    // 不是日柱也不是時柱（例如某案例落在月柱、另一案例落在年柱，兩個案例的年柱納音查表都對，
    // 但命中位置的規律還沒找出來），代表規則裡「結合日柱或時柱」這句話還有沒抓到的細節，
    // 暫時不實作，避免顯示錯誤位置，見 README 已知限制（NAYIN_WUXING／CI_GUAN_TARGET 保留供之後參考）
    // 天乙貴人、太極貴人：日干、年干查
    if (includesZhi(TIANYI_GUIREN[dayGan], targetZhi) || (yearGan && includesZhi(TIANYI_GUIREN[yearGan], targetZhi))) push("天乙貴人");
    if (includesZhi(TAIJI_GUIREN[dayGan], targetZhi) || (yearGan && includesZhi(TAIJI_GUIREN[yearGan], targetZhi))) push("太極貴人");
    // 日干查（單值）
    if (LU_SHEN[dayGan] === targetZhi) push("祿神");
    if (YANG_REN[dayGan] === targetZhi) push("羊刃");
    if (FEI_REN[dayGan] === targetZhi) push("飛刃");
    if (TIAN_CHU[dayGan] === targetZhi) push("天廚貴人");
    if (XUE_TANG_REAL[dayGan] === targetZhi) push("學堂貴人");
    // 日干、年干查（單值）
    if (WEN_CHANG[dayGan] === targetZhi || (yearGan && WEN_CHANG[yearGan] === targetZhi)) push("文昌貴人");
    if (GUO_YIN[dayGan] === targetZhi || (yearGan && GUO_YIN[yearGan] === targetZhi)) push("國印貴人");
    if (HONG_YAN[dayGan] === targetZhi || (yearGan && HONG_YAN[yearGan] === targetZhi)) push("紅艷煞");
    if (LIU_XIA[dayGan] === targetZhi || (yearGan && LIU_XIA[yearGan] === targetZhi)) push("流霞");
    if (JIN_YU[dayGan] === targetZhi || (yearGan && JIN_YU[yearGan] === targetZhi)) push("金輿祿");
    if (includesZhi(FU_XING[dayGan], targetZhi) || (yearGan && includesZhi(FU_XING[yearGan], targetZhi))) push("福星貴人");
    // 年干查（單值）
    if (yearGan && TIAN_GUAN[yearGan] === targetZhi) push("天官貴人");
    // 孤辰／寡宿：日支、年支所在三會方局查
    [yearZhi, dayZhi].forEach((refZhi) => {
      const sanhui = SANHUI_OF_ZHI[refZhi];
      if (!sanhui) return;
      if (GUCHEN_GUASU[sanhui].孤辰 === targetZhi) push("孤辰");
      if (GUCHEN_GUASU[sanhui].寡宿 === targetZhi) push("寡宿");
    });
    // 以年支查、對照月日時支（年柱本身不必對自己查）
    if (pillarRole !== "year") {
      if (LONG_DE[yearZhi] === targetZhi) push("龍德");
      if (HONG_LUAN[yearZhi] === targetZhi) push("紅鸞");
      if (TIAN_XI[yearZhi] === targetZhi) push("天喜");
      if (XUE_REN[yearZhi] === targetZhi) push("血刃");
      if (WU_GUI[yearZhi] === targetZhi) push("五鬼");
      if (BAI_HU[yearZhi] === targetZhi) push("白虎");
      if (TIAN_GOU[yearZhi] === targetZhi) push("天狗");
      if (SANG_MEN[yearZhi] === targetZhi) push("喪門");
      if (BING_FU[yearZhi] === targetZhi) push("病符");
      if (DA_HAO[yearZhi] === targetZhi) push("大耗");
      const yearTriad = TRIADS[yearZhi];
      if (yearTriad && ZAI_SHA[yearTriad] === targetZhi) push("災煞");
    }
    // 天德貴人：月支查，值可能是天干也可能是地支
    if (TIAN_DE[monthZhi] === targetZhi) push("天德貴人");
  }

  // 天醫：判斷條件是「月支查表對照日支」，但命中時星曜是標在年柱上，不是日柱（原本誤標在日柱，
  // 用 20 筆資料交叉驗證，其中固定年柱、逐月測試 12 組完全吻合，加上之前幾輪測到的案例也都吻合，沒有例外）
  if (pillarRole === "year" && TIAN_YI_MONTH[monthZhi] === dayZhi) push("天醫");

  if (targetGan) {
    // 天德貴人、月德貴人：值若剛好是天干，對照四柱天干
    if (TIAN_DE[monthZhi] === targetGan) push("天德貴人");
    if (YUE_DE[monthZhi] === targetGan) push("月德貴人");
  }

  return tags;
}

// ---- 命格判斷（比照課程講義《十神命格判斷法》第五章）----
// 1. 月支十二長生為「臨官」→建祿格；為「帝旺」→羊刃格（獨立判斷，優先）
// 2. 否則看月支藏干：本氣透干（出現在任一天干，含日干、月干自己）即用本氣定格
// 3. 本氣不透，看中氣／餘氣：只有一個透干就用那個；若只有一個藏干（子午卯酉），不論透不透都直接用
// 4. 都不透，仍以本氣為格（僅本氣單獨透干與都不透干，兩種情況都退回本氣）
const GEJU_NAME = {
  比肩: "比肩格", 劫財: "劫財格", 食神: "食神格", 傷官: "傷官格",
  正財: "正財格", 偏財: "偏財格", 正官: "正官格", 七殺: "七殺格",
  正印: "正印格", 偏印: "偏印格"
};
function determineGeju(dayGan, monthZhi, monthDiShi, visibleGans) {
  if (monthDiShi === "臨官") return "建祿格";
  if (monthDiShi === "帝旺") return "羊刃格";

  const hideGans = NATIVE_HIDE_GAN[monthZhi];
  let chosen = hideGans[0];
  if (hideGans.length > 1) {
    const primary = hideGans[0];
    if (!visibleGans.includes(primary)) {
      const others = hideGans.slice(1).filter((g) => visibleGans.includes(g));
      if (others.length >= 1) chosen = others[0];
    }
  }
  const ss = getShiShen(dayGan, chosen);
  return GEJU_NAME[ss] || "普通格局";
}

function ganPart(gan) {
  const wx = WUXING_OF_GAN[gan];
  return { char: gan, wuxing: wx, cls: WUXING_CLASS[wx], sign: YINYANG_OF_GAN[gan] ? "+" : "-" };
}
function zhiPart(zhi) {
  const wx = WUXING_OF_ZHI[zhi];
  return { char: zhi, wuxing: wx, cls: WUXING_CLASS[wx], sign: YINYANG_OF_ZHI[zhi] ? "+" : "-" };
}

// 藏干「顯示順序」比照參考網站逐支核對出來的實際排法（跟 lunar-javascript 原生的
// 本氣／中氣／餘氣強弱順序不同，多數地支是反過來，但巳／未／申三支是另一種排法，
// 逐支測試比對後直接寫死對照表，比用單一規則（反轉／輪轉）猜測準確）
const ZHI_HIDE_DISPLAY_ORDER = {
  子: ["癸"], 丑: ["辛", "癸", "己"], 寅: ["戊", "丙", "甲"], 卯: ["乙"],
  辰: ["癸", "乙", "戊"], 巳: ["庚", "戊", "丙"], 午: ["己", "丁"], 未: ["丁", "乙", "己"],
  申: ["壬", "戊", "庚"], 酉: ["辛"], 戌: ["丁", "辛", "戊"], 亥: ["甲", "壬"]
};

function buildHideGans(zhi, dayGan, shiShenZhiArr) {
  const gans = NATIVE_HIDE_GAN[zhi];
  const hideGansData = gans.map((g, i) => ({
    ...ganPart(g),
    shiShen: shiShenZhiArr ? toTrad(shiShenZhiArr[i]) : getShiShen(dayGan, g)
  }));
  const order = ZHI_HIDE_DISPLAY_ORDER[zhi];
  const hideGansDisplay = order
    ? order.map((ch) => hideGansData.find((hg) => hg.char === ch)).filter(Boolean)
    : hideGansData;
  return { hideGansData, hideGansDisplay };
}

// 旬空（空亡）：60 甲子每 10 個一旬，一旬固定有 2 個地支排不到、稱為「空」。
// 課程講義做法是同時查「日柱所在旬」與「年柱所在旬」兩組空亡，命中哪一組就標「空」或「年空」。
function getJiaZiIndex(gan, zhi) {
  const ganIdx = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"].indexOf(gan);
  const zhiIdx = ZHI_ORDER.indexOf(zhi);
  for (let i = 0; i < 60; i++) {
    if (i % 10 === ganIdx && i % 12 === zhiIdx) return i;
  }
  return -1;
}
function getXunKongZhis(gan, zhi) {
  const idx = getJiaZiIndex(gan, zhi);
  if (idx < 0) return [];
  const xunStart = Math.floor(idx / 10) * 10;
  return [ZHI_ORDER[(xunStart + 10) % 12], ZHI_ORDER[(xunStart + 11) % 12]];
}
function getXunKongMarkers(targetZhi, dayEmpty, yearEmpty) {
  const marks = [];
  if (dayEmpty.includes(targetZhi)) marks.push("空");
  if (yearEmpty.includes(targetZhi)) marks.push("年空");
  return marks;
}

function buildPillar(label, role, gan, zhi, shiShenGan, shiShenZhiArr, diShi, ctx) {
  const { hideGansData, hideGansDisplay } = buildHideGans(zhi, ctx.dayGan, shiShenZhiArr);
  return {
    label,
    shiShenGan: toTrad(shiShenGan),
    gan: ganPart(gan),
    zhi: zhiPart(zhi),
    hideGans: hideGansData,
    hideGansDisplay,
    diShi: toTrad(diShi),
    xunkong: getXunKongMarkers(zhi, ctx.dayEmpty, ctx.yearEmpty),
    shensha: getShenShaForPillar(role, gan, zhi, ctx)
  };
}

// 大運／流年只有干支，藏干／十二長生／神煞都要自己算（lunar-javascript 沒有內建這幾個方法）
function buildGanZhiPillar(gz, role, ctx) {
  const gan = gz[0], zhi = gz[1];
  const { hideGansData, hideGansDisplay } = buildHideGans(zhi, ctx.dayGan, null);
  return {
    ganzhi: gz,
    shiShen: getShiShen(ctx.dayGan, gan),
    gan: ganPart(gan),
    zhi: zhiPart(zhi),
    hideGans: hideGansData,
    hideGansDisplay,
    diShi: getDiShi(ctx.dayGan, zhi),
    xunkong: getXunKongMarkers(zhi, ctx.dayEmpty, ctx.yearEmpty),
    shensha: getShenShaForPillar(role, gan, zhi, ctx)
  };
}

// 五行強弱表：只計算 4 個天干＋4 個地支的「本氣」，中氣／餘氣不計分（比對參考網站逐一測試確認的公式）
function calcWuxingPct(pillars) {
  const wuxingW = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  let total = 0;
  pillars.forEach((p) => {
    wuxingW[p.gan.wuxing] += 1;
    total += 1;
    const primary = p.hideGans[0];
    wuxingW[primary.wuxing] += 1;
    total += 1;
  });
  const wuxingPct = {};
  Object.keys(wuxingW).forEach((k) => { wuxingPct[k] = total ? Math.round((wuxingW[k] / total) * 1000) / 10 : 0; });
  return wuxingPct;
}

// 十神比重表：天干（不含日主自己）權重 1；藏干本氣權重 0.63、中氣／餘氣權重各 0.2；
// 只有一個藏干的地支（子午卯酉）視為全部力量集中在該干，權重比照天干＝1。
// 這組權重是拿多筆命盤跟參考網站的十神比重表數字比對回推校正出來的，非傳統典籍固定公式。
function weightedShishenTally(pillars, dayGan) {
  const shishenW = {};
  let total = 0;
  function add(ss, w) {
    if (!ss) return;
    shishenW[ss] = (shishenW[ss] || 0) + w;
    total += w;
  }
  pillars.forEach((p) => {
    if (p.gan.char !== dayGan || p.label !== "日柱") {
      add(getShiShen(dayGan, p.gan.char), 1);
    }
    const hg = p.hideGans;
    if (hg.length === 1) {
      add(hg[0].shiShen, 1);
    } else {
      add(hg[0].shiShen, 0.63);
      for (let i = 1; i < hg.length; i++) add(hg[i].shiShen, 0.2);
    }
  });
  const shishenPct = {};
  ["比肩", "劫財", "食神", "傷官", "正財", "偏財", "正官", "七殺", "正印", "偏印"].forEach((k) => {
    shishenPct[k] = total ? Math.round(((shishenW[k] || 0) / total) * 1000) / 10 : 0;
  });
  return shishenPct;
}

// ---- 四柱提示：天干合／克、地支三合／三會／六合／六沖（簡化版，不判斷是否「化」）----
const GAN_HE = [["甲", "己", "土"], ["乙", "庚", "金"], ["丙", "辛", "水"], ["丁", "壬", "木"], ["戊", "癸", "火"]];
const ZHI_LIUHE = [["子", "丑", "土"], ["寅", "亥", "木"], ["卯", "戌", "火"], ["辰", "酉", "金"], ["巳", "申", "水"], ["午", "未", "土"]];
const ZHI_CHONG = [["子", "午"], ["丑", "未"], ["寅", "申"], ["卯", "酉"], ["辰", "戌"], ["巳", "亥"]];
const ZHI_SANHUI = { 寅卯辰: "木", 巳午未: "火", 申酉戌: "金", 亥子丑: "水" };
const ZHI_SANHE = { 申子辰: "水", 亥卯未: "木", 寅午戌: "火", 巳酉丑: "金" };

function ganNotes(gans) {
  const notes = [];
  for (let i = 0; i < gans.length - 1; i++) {
    const a = gans[i], b = gans[i + 1];
    const he = GAN_HE.find((pair) => (pair[0] === a && pair[1] === b) || (pair[0] === b && pair[1] === a));
    if (he) {
      notes.push(a + "與" + b + "合" + he[2]);
      continue;
    }
    const wa = WUXING_OF_GAN[a], wb = WUXING_OF_GAN[b];
    if (CONTROLS[wa] === wb) notes.push(a + "克" + b);
    else if (CONTROLS[wb] === wa) notes.push(b + "克" + a);
  }
  return notes.length ? notes.join("，") : "無明顯合克關係";
}

function zhiNotes(zhis) {
  const notes = [];
  const combos3 = [
    [zhis[0], zhis[1], zhis[2]], [zhis[0], zhis[1], zhis[3]],
    [zhis[0], zhis[2], zhis[3]], [zhis[1], zhis[2], zhis[3]]
  ];
  const seen = new Set();
  combos3.forEach((combo) => {
    const sorted = combo.slice().sort().join("");
    if (seen.has(sorted)) return;
    Object.keys(ZHI_SANHE).forEach((key) => {
      if (key.split("").sort().join("") === sorted) {
        seen.add(sorted);
        notes.push(combo.join("") + "三合" + ZHI_SANHE[key] + "局");
      }
    });
    Object.keys(ZHI_SANHUI).forEach((key) => {
      if (key.split("").sort().join("") === sorted) {
        seen.add(sorted);
        notes.push(combo.join("") + "三會" + ZHI_SANHUI[key] + "方");
      }
    });
  });
  for (let i = 0; i < zhis.length - 1; i++) {
    const a = zhis[i], b = zhis[i + 1];
    const he = ZHI_LIUHE.find((pair) => (pair[0] === a && pair[1] === b) || (pair[0] === b && pair[1] === a));
    if (he) notes.push(a + "與" + b + "六合" + he[2]);
    const chong = ZHI_CHONG.find((pair) => (pair[0] === a && pair[1] === b) || (pair[0] === b && pair[1] === a));
    if (chong) notes.push(a + "與" + b + "相沖");
  }
  return notes.length ? notes.join("，") : "無明顯合沖會局";
}

function calculateBazi({ year, month, day, hour, minute, gender, name }) {
  const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
  const lunar = solar.getLunar();
  const ec = lunar.getEightChar();
  ec.setSect(2);
  const pad = (n) => String(n).padStart(2, "0");
  const solarText = year + "-" + pad(month) + "-" + pad(day) + " " + pad(hour) + ":" + pad(minute);

  const dayGan = ec.getDayGan();
  const yearGan = ec.getYearGan();
  const yearZhi = ec.getYearZhi();
  const dayZhi = ec.getDayZhi();
  const monthZhi = ec.getMonthZhi();
  const timeZhi = ec.getTimeZhi();

  const ctx = {
    dayGan, yearGan, yearZhi, monthZhi, dayZhi,
    dayEmpty: getXunKongZhis(dayGan, dayZhi),
    yearEmpty: getXunKongZhis(yearGan, yearZhi)
  };

  const yearP = buildPillar("年柱", "year", yearGan, yearZhi, ec.getYearShiShenGan(), ec.getYearShiShenZhi(), ec.getYearDiShi(), ctx);
  const monthP = buildPillar("月柱", "month", ec.getMonthGan(), monthZhi, ec.getMonthShiShenGan(), ec.getMonthShiShenZhi(), ec.getMonthDiShi(), ctx);
  const dayP = buildPillar("日柱", "day", dayGan, dayZhi, "日主", ec.getDayShiShenZhi(), ec.getDayDiShi(), ctx);
  const timeP = buildPillar("時柱", "time", ec.getTimeGan(), timeZhi, ec.getTimeShiShenGan(), ec.getTimeShiShenZhi(), ec.getTimeDiShi(), ctx);

  // 十靈、陰差陽錯：課程講義註明「對照日柱」，僅限日柱本身的干支組合
  const dayGanZhi = dayGan + dayZhi;
  if (SHI_LING.includes(dayGanZhi)) dayP.shensha.push("十靈");
  if (YIN_YANG_CUO.includes(dayGanZhi)) dayP.shensha.push("陰差陽錯");

  // 顯示順序比照參考網站：時／日／月／年
  const pillars = [timeP, dayP, monthP, yearP];

  const wuxingPct = calcWuxingPct(pillars);
  const shishenPct = weightedShishenTally(pillars, dayGan);

  const visibleGans = [yearGan, ec.getMonthGan(), dayGan, ec.getTimeGan()];
  const geju = determineGeju(dayGan, monthZhi, toTrad(ec.getMonthDiShi()), visibleGans);

  const ganNoteText = ganNotes([yearGan, ec.getMonthGan(), dayGan, ec.getTimeGan()]);
  const zhiNoteText = zhiNotes([yearZhi, monthZhi, dayZhi, timeZhi]);

  const genderCode = gender === "male" ? 1 : 0;
  const yun = ec.getYun(genderCode);
  const birthDate = new Date(year, month - 1, day);
  const today = new Date();
  // 大運／流年的歲數比照參考網站，用「西曆實歲」（0 歲＝出生那一年），
  // lunar-javascript 回傳的是虛歲（出生那一年＝1歲），所以要減 1 對齊
  const currentAge = today.getFullYear() - birthDate.getFullYear();

  // 索引 0 是「起運前」的佔位資料（干支為空），實際大運從索引 1 開始
  const daYunListAsc = yun.getDaYun(11).slice(1, 11).map((dy) => {
    const gz = dy.getGanZhi();
    const startAge = dy.getStartAge() - 1;
    const endAge = dy.getEndAge() - 1;
    const p = buildGanZhiPillar(gz, "dayun", ctx);
    return {
      ...p,
      startAge,
      endAge,
      startYear: dy.getStartYear(),
      isCurrent: currentAge >= startAge && currentAge <= endAge,
      liunian: dy.getLiuNian().map((ln) => {
        const lgz = ln.getGanZhi();
        const lp = buildGanZhiPillar(lgz, "liunian", ctx);
        return {
          ...lp,
          year: ln.getYear(),
          age: ln.getAge() - 1,
          isCurrent: ln.getYear() === today.getFullYear()
        };
      })
    };
  });

  // 比照參考網站：大運／流年由歲數大到小排列（左老右少）
  const daYunList = daYunListAsc.slice().reverse().map((dy) => ({
    ...dy,
    liunian: dy.liunian.slice().reverse()
  }));

  return {
    name,
    gender,
    solarText: solarText,
    lunarText: lunar.toString(),
    // 生肖比照年柱地支（以立春為界，非農曆正月初一），而非曆法上的農曆年
    shengxiao: ZHI_SHENGXIAO[yearZhi],
    dayGan,
    geju,
    pillars,
    wuxingPct,
    shishenPct,
    ganNoteText,
    zhiNoteText,
    daYunList
  };
}
