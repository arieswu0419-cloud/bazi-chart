// 數字易經計算引擎：純函式，不碰 DOM。演算法整理自使用者提供的《數字易經.pdf》第4、11頁，
// 並用該檔案第4頁的兩組範例（王大明438、陳麗澕111915）逐步核對過。

// 八星×8組（64個雙位數代碼）對照表，來源：數字易經.pdf 第11頁「汽/機車選牌技巧」
const SHUZI_STAR_CODES = {
  伏位: ["11", "22", "33", "44", "66", "77", "88", "99"],
  延年: ["19", "91", "78", "87", "43", "34", "26", "62"],
  生氣: ["14", "41", "67", "76", "93", "39", "28", "82"],
  天醫: ["13", "31", "68", "86", "94", "49", "72", "27"],
  六煞: ["16", "61", "74", "47", "38", "83", "92", "29"],
  絕命: ["12", "21", "69", "96", "84", "48", "37", "73"],
  禍害: ["17", "71", "98", "89", "64", "46", "32", "23"],
  五鬼: ["18", "81", "97", "79", "36", "63", "42", "24"]
};
const SHUZI_CODE_TO_STAR = {};
Object.keys(SHUZI_STAR_CODES).forEach((star) => {
  SHUZI_STAR_CODES[star].forEach((code) => { SHUZI_CODE_TO_STAR[code] = star; });
});

// 「5 在中間」：直接忽略整個移除（其餘數字往前遞補），要重複處理到沒有中間的5為止；
// 用範例 8525→825→82,22 核對過（中間的5先被拿掉，變成825，825的尾5再套用下面的邊界規則）
function shuziRemoveMiddleFives(digits) {
  const arr = digits.slice();
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 1; i < arr.length - 1; i++) {
      if (arr[i] === "5") {
        arr.splice(i, 1);
        changed = true;
        break;
      }
    }
  }
  return arr;
}

// 產生相鄰兩兩一組（重疊式滑動窗口）；每一組內如果出現 0，或出現「已經沒有中間5、只可能落在
// 頭尾的5」，就把那個 0／5 換成同一組裡的另一個數字（等同伏位、自我複製）。
// 用範例核對過：
//   5開頭：5812→（組1的5換成8）88,81,12
//   5結尾：8125→（組3的5換成2）81,12,22
//   0開頭：0812→88,81,12；0結尾：8120→81,12,22
//   0在中間：8020→三組(8,0)(0,2)(2,0)裡的0都各自換成同組的另一個數字→88,22,22
function shuziBuildPairs(digits) {
  const arr = shuziRemoveMiddleFives(digits);
  const pairs = [];
  for (let i = 0; i < arr.length - 1; i++) {
    let a = arr[i];
    let b = arr[i + 1];
    if (a === "0" || a === "5") a = b;
    else if (b === "0" || b === "5") b = a;
    pairs.push(a + b);
  }
  return pairs;
}

function shuziLookupStar(code) {
  return SHUZI_CODE_TO_STAR[code] || null;
}

// 數字總和：0、5 在開頭／結尾時用相鄰數字取代（跟配對規則同精神），中間的5直接跳過不計；
// 中間的0沒有範例可以驗證確切取代規則，暫時採用「複製前一位數字」為預設（信心較低，如與您
// 手上的資料對不上，麻煩提供範例讓我再校正）。用範例核對過：111915→1+1+1+9+1+1=14（尾5換成1）
function shuziDigitSum(digits) {
  const n = digits.length;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const d = digits[i];
    if (d !== "0" && d !== "5") { sum += Number(d); continue; }
    if (i === 0 && n > 1) { sum += Number(digits[1]); continue; }
    if (i === n - 1 && n > 1) { sum += Number(digits[i - 1]); continue; }
    if (d === "5") continue;
    sum += Number(digits[i - 1] || 0);
  }
  return sum;
}

// 主入口：輸入任意數字字串，回傳末二碼（磁場最終結論）、逐組配對結果、數字總和
function shuziAnalyze(numberStr) {
  const digits = String(numberStr).replace(/[^0-9]/g, "").split("");
  if (digits.length < 2) return null;
  const pairs = shuziBuildPairs(digits);
  const pairResults = pairs.map((code) => ({ code, star: shuziLookupStar(code) }));
  const sum = shuziDigitSum(digits);
  return {
    digits: digits.join(""),
    pairs: pairResults,
    lastPair: pairResults.length ? pairResults[pairResults.length - 1] : null,
    sum
  };
}
