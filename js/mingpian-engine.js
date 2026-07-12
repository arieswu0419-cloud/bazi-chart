// 名片風水計算引擎：純函式，不碰 DOM／canvas（圖片像素讀取、OCR 呼叫留在 app.js）

// 生肖分數：以立春為生肖轉換基準，鼠1～豬12（使用者直接選生肖，不需要另外算日期）
const MP_ZODIAC_ORDER = ["鼠", "牛", "虎", "兔", "龍", "蛇", "馬", "羊", "猴", "雞", "狗", "豬"];
const MP_ZODIAC_SCORE = {};
MP_ZODIAC_ORDER.forEach((z, i) => { MP_ZODIAC_SCORE[z] = i + 1; });

// 名片底色分數；淺藍／淺綠同分（跟使用者提供的對照圖一致）。
// rgb 是這個顏色分類的代表色，畫面像素分析時用來找「最接近哪一色」
const MP_COLOR_LIST = [
  { name: "黑", score: 1, rgb: [25, 25, 25] },
  { name: "紫", score: 2, rgb: [120, 40, 140] },
  { name: "白", score: 3, rgb: [245, 245, 245] },
  { name: "橘", score: 4, rgb: [235, 130, 30] },
  { name: "紅", score: 5, rgb: [210, 30, 30] },
  { name: "深綠", score: 6, rgb: [10, 80, 45] },
  { name: "深藍", score: 7, rgb: [10, 45, 110] },
  { name: "黃", score: 8, rgb: [235, 205, 30] },
  { name: "咖啡", score: 9, rgb: [110, 70, 40] },
  { name: "淺藍", score: 10, rgb: [140, 190, 230] },
  { name: "淺綠", score: 10, rgb: [155, 220, 155] },
  { name: "灰", score: 11, rgb: [150, 150, 150] }
];
const MP_COLOR_SCORE = {};
MP_COLOR_LIST.forEach((c) => { MP_COLOR_SCORE[c.name] = c.score; });
MP_COLOR_SCORE["彩色"] = 12;

// 九宮格分數（橫式名片 9cm x 5.5cm 水平垂直三等分）：左上2 中上3 右上4／左中1 正中9 右中5／左下8 中下7 右下6
const MP_GRID_SCORE = [
  [2, 3, 4],
  [1, 9, 5],
  [8, 7, 6]
];

// 直式名片（5.5cm x 9cm，把橫式名片轉90度）的九宮格分數：左上8 中上1 右上2／左中7 正中9 右中3／左下6 中下5 右下4
const MP_GRID_SCORE_V = [
  [8, 1, 2],
  [7, 9, 3],
  [6, 5, 4]
];

// 風水名片總分對應表：1～24，25分以後同一組文字循環
const MP_FORTUNE_TABLE = [
  "官司", "負債", "遷移", "擴展", "進財", "婚變", "置產", "離鄉",
  "高陞", "旅遊", "誣陷", "添丁", "破財", "貴人", "口角", "挫敗",
  "橫財", "喜事", "孤寡", "財旺", "疾病", "失竊", "桃花", "待發"
];

function mpFortuneText(total) {
  if (!total || total <= 0) return "－";
  const idx = (total - 1) % 24;
  return MP_FORTUNE_TABLE[idx];
}

// 大吉／平／大凶 分類：對照使用者提供的「24名片風水.png」逐格底色比對出來（粉紅=大吉共8個、
// 藍=平共4個、白色或灰色合併算大凶共12個），跟 MP_FORTUNE_TABLE 同一個索引順序
const MP_FORTUNE_CATEGORY = [
  "大凶", "大凶", "大凶", "大吉", "大吉", "大凶", "平", "大凶",
  "大吉", "平", "大凶", "大吉", "大凶", "大吉", "大凶", "大凶",
  "平", "大吉", "大凶", "大吉", "大凶", "大凶", "大吉", "平"
];
const MP_CATEGORY_CLASS = { 大吉: "cat-good", 平: "cat-ok", 大凶: "cat-bad" };

function mpFortuneCategory(total) {
  if (!total || total <= 0) return null;
  const idx = (total - 1) % 24;
  return MP_FORTUNE_CATEGORY[idx];
}

// 找像素 rgb 最接近 MP_COLOR_LIST 裡哪一個顏色分類（歐氏距離最短）
function mpNearestColorName(r, g, b) {
  let best = null;
  let bestDist = Infinity;
  MP_COLOR_LIST.forEach((c) => {
    const d = (r - c.rgb[0]) ** 2 + (g - c.rgb[1]) ** 2 + (b - c.rgb[2]) ** 2;
    if (d < bestDist) { bestDist = d; best = c; }
  });
  return best.name;
}
