/*
 * 奇門數字（號碼奇門）引擎
 *
 * 依教材《奇門數字》電子書（Meta 玄商集團）：一個宮位由六個符號組成，取號碼「最後六位」，
 * 依序對應 九星／八神／宮位／天盤干／地盤干／八門（0 為空亡；天/地盤干 0＝癸）。
 * 排盤呈現如書中單宮圖，並解讀六個符號的資訊。
 */

// 位置順序（第 1~6 個數字）
const QSZ_ORDER = ["xing", "shen", "gong", "tian", "di", "men"];

// 各符號的「數字 → 符號」對照（洛書九宮）
const QSZ_MAP = {
  xing: { 1: "天蓬", 2: "天芮", 3: "天沖", 4: "天輔", 5: "天禽", 6: "天心", 7: "天柱", 8: "天任", 9: "天英", 0: "空亡" },
  shen: { 1: "值符", 2: "螣蛇", 3: "太陰", 4: "六合", 5: "白虎", 6: "玄武", 7: "九地", 8: "九天", 9: "值符", 0: "空亡" },
  gong: { 1: "坎", 2: "坤", 3: "震", 4: "巽", 5: "中宮", 6: "乾", 7: "兌", 8: "艮", 9: "離", 0: "空亡" },
  men: { 1: "休門", 2: "死門", 3: "傷門", 4: "杜門", 5: "死門", 6: "開門", 7: "驚門", 8: "生門", 9: "景門", 0: "空亡" },
  tian: { 1: "甲", 2: "乙", 3: "丙", 4: "丁", 5: "戊", 6: "己", 7: "庚", 8: "辛", 9: "壬", 0: "癸" },
  di: { 1: "甲", 2: "乙", 3: "丙", 4: "丁", 5: "戊", 6: "己", 7: "庚", 8: "辛", 9: "壬", 0: "癸" }
};

// 各符號五行（供著色）
const QSZ_WX = {
  xing: { 天蓬: "水", 天芮: "土", 天沖: "木", 天輔: "木", 天禽: "土", 天心: "金", 天柱: "金", 天任: "土", 天英: "火" },
  men: { 休門: "水", 死門: "土", 傷門: "木", 杜門: "木", 開門: "金", 驚門: "金", 生門: "土", 景門: "火" },
  gong: { 坎: "水", 坤: "土", 震: "木", 巽: "木", 中宮: "土", 乾: "金", 兌: "金", 艮: "土", 離: "火" },
  gan: { 甲: "木", 乙: "木", 丙: "火", 丁: "火", 戊: "土", 己: "土", 庚: "金", 辛: "金", 壬: "水", 癸: "水" }
};
function qszWx(k, v) {
  if (k === "tian" || k === "di") return QSZ_WX.gan[v] || "";
  return (QSZ_WX[k] && QSZ_WX[k][v]) || "";
}

// 各類型的定位與意義（書版總格說明）
const QSZ_META = {
  xing: { label: "九星", pos: "tl", mean: "性格、發展、時機（發展機會、方向）" },
  shen: { label: "八神", pos: "tc", mean: "想法、觀念、運勢（思維與想法）" },
  tian: { label: "天盤干", pos: "tr", mean: "外表行為，結果吉或兇" },
  men: { label: "八門", pos: "mc", mean: "自己、心態、行為、表現" },
  gong: { label: "宮位", pos: "bl", mean: "定位、環境、平臺（處境、做事平台）" },
  di: { label: "地盤干", pos: "br", mean: "內在想法，結果吉或兇" }
};

// 吉凶分類
const QSZ_MEN_JX = { 開門: "吉", 休門: "吉", 生門: "吉", 景門: "平", 杜門: "凶", 傷門: "凶", 死門: "凶", 驚門: "凶" };
const QSZ_XING_JX = { 天心: "吉", 天任: "吉", 天輔: "吉", 天禽: "吉", 天沖: "小吉", 天蓬: "凶", 天芮: "凶", 天柱: "凶", 天英: "凶" };
const QSZ_SHEN_JX = { 值符: "吉", 六合: "吉", 太陰: "吉", 九天: "吉", 九地: "吉", 螣蛇: "凶", 白虎: "凶", 玄武: "凶" };
const QSZ_GAN_JX = { 乙: "三奇（吉）", 丙: "三奇（吉）", 丁: "三奇（吉）", 甲: "六儀", 戊: "六儀", 己: "六儀", 庚: "六儀（多凶）", 辛: "六儀（多凶）", 壬: "六儀", 癸: "六儀" };

// 空亡各符號含義（書版第 14 頁）
const QSZ_KONG = {
  gong: "缺乏發揮自己能力的機會、才能被低估、沒資源",
  shen: "缺乏決策能力、孤立無助、孤軍作戰",
  xing: "缺乏計劃和目標、沒領導力、時機不對",
  men: "不積極、缺乏熱情、效率低、多阻礙"
};

// 主入口：傳入 6 位數字字串（或會自動取最後 6 位），回傳排盤資料
function calcQimenShuzi(input) {
  const digits = String(input).replace(/\D/g, "");
  const six = digits.slice(-6);
  if (six.length < 6) return null;
  const arr = six.split("").map(Number);
  const cells = {};
  QSZ_ORDER.forEach((k, i) => {
    const d = arr[i];
    const v = QSZ_MAP[k][d];
    let jx = "";
    if (k === "men") jx = QSZ_MEN_JX[v] || "";
    else if (k === "xing") jx = QSZ_XING_JX[v] || "";
    else if (k === "shen") jx = QSZ_SHEN_JX[v] || "";
    else if (k === "tian" || k === "di") jx = QSZ_GAN_JX[v] || "";
    if (v === "空亡") jx = "空亡";
    cells[k] = { digit: d, value: v, jx, wx: qszWx(k, v), meta: QSZ_META[k], kong: v === "空亡" ? (QSZ_KONG[k] || "沒有、落空、缺陷、沒方向、成果少") : "" };
  });
  // 天盤干＋地盤干 → 81 格局（重用 qimen-engine 的 getGeju81）
  let geju = null;
  if (cells.tian.value !== "空亡" && cells.di.value !== "空亡" && typeof getGeju81 === "function") {
    geju = getGeju81(cells.tian.value, cells.di.value);
  }
  return { six, cells, geju };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { calcQimenShuzi, QSZ_MAP, QSZ_ORDER };
}
