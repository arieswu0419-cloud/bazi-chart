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

// 數字總和 1～36 吉凶說明（數字易經.pdf 第12～13頁「汽/機車選牌技巧－數字總和」，PDF原文只給到36，
// 沒有更大的數字對照，超過36的總和目前沒有依據可以顯示說明）
const SHUZI_SUM_MEANINGS = {
  1: { text: "繁榮發達，信用得固，萬人仰望，可獲成功。", luck: "吉" },
  2: { text: "動搖不安，一榮一枯，一盛一衰，勞而無功。", luck: "凶" },
  3: { text: "立身出世，有貴人助，天賜吉祥，四海名揚。", luck: "吉" },
  4: { text: "日被雲遮，苦難折磨，非有毅力，難望成功。", luck: "凶" },
  5: { text: "陰陽和合，精神愉快，榮譽達利，一門興隆。", luck: "吉" },
  6: { text: "萬寶集門，天降幸運，立志奮發，得成大功。", luck: "吉" },
  7: { text: "精力旺盛，頭腦明敏，排除萬難，必獲成功。", luck: "吉" },
  8: { text: "努力發達，貫徹志望，不忘進退，可期成功。", luck: "吉" },
  9: { text: "雖抱奇才，有才無命，獨營無力，財利難望。", luck: "凶" },
  10: { text: "烏雲遮月，暗淡無光，空費心力，徒勞無功。", luck: "凶" },
  11: { text: "草木逢春，枝葉沾露，穩健著實，必得人望。", luck: "吉" },
  12: { text: "薄弱無力，孤立無援，外祥內苦，謀事難成。", luck: "凶" },
  13: { text: "天賦吉運，能得人望，善用智慧，必獲成功。", luck: "吉" },
  14: { text: "忍得苦難，必有後福，是成是敗，惟靠堅毅。", luck: "凶" },
  15: { text: "謙恭做事，外得人和，大事成就，一門興隆。", luck: "吉" },
  16: { text: "能獲眾望，成就大業，名利雙收，盟主四方。", luck: "吉" },
  17: { text: "排除萬難，有貴人助，把握時機，可得成功。", luck: "吉" },
  18: { text: "經商做事，順利昌隆，如能慎始，百事亨通。", luck: "吉" },
  19: { text: "成功雖早，慎防虧空，內外不和，障礙重重。", luck: "凶" },
  20: { text: "智高志大，歷盡艱難，焦心憂勞，進退兩難。", luck: "凶" },
  21: { text: "先歷困苦，後得幸福，霜雪梅花，春來怒放。", luck: "吉" },
  22: { text: "秋草逢霜，懷才不遇，憂愁怨苦，事不如意。", luck: "凶" },
  23: { text: "旭日昇天，名顯四方，漸次進展，終成大業。", luck: "吉" },
  24: { text: "錦繡前程，須靠自力，多用智謀，能奏大功。", luck: "吉" },
  25: { text: "天時地利，只久人和，講信修睦，即可成功。", luck: "吉" },
  26: { text: "波瀾起伏，千變萬化，凌駕萬難，必可成功。", luck: "凶帶吉" },
  27: { text: "一成一敗，一盛一衰，惟靠謹慎，可守成功。", luck: "吉帶凶" },
  28: { text: "魚臨旱地，難逃惡運，此數大凶，不如更名。", luck: "凶" },
  29: { text: "如龍得雲，青雲直上，智謀奮進，才略奏功。", luck: "吉" },
  30: { text: "吉凶參半，得失相伴，投機取巧，如賭一樣。", luck: "吉帶凶" },
  31: { text: "此數大吉，名利雙收，漸進向上，大業成就。", luck: "吉" },
  32: { text: "池中之龍，風雲際會，一躍上天，成功可望。", luck: "吉" },
  33: { text: "意氣用事，人和必失，如能慎始，必可昌隆。", luck: "吉" },
  34: { text: "災難不絕，難望成功，此數大凶，不如更名。", luck: "凶" },
  35: { text: "處事嚴謹，進退保守，學智兼具，成就非凡。", luck: "吉" },
  36: { text: "波瀾重疊，常陷窮困，動不如靜，有才無命。", luck: "凶" }
};
function shuziSumMeaning(sum) {
  return SHUZI_SUM_MEANINGS[sum] || null;
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

// 身份證號專用演算法（數字易經.pdf 第5～9頁）：跟上面的八星滑動配對是完全不同的機制。
// 身分證後面9位數字，去掉第1個跟最後2個，剩中間6個兩兩相加成3個數字，超過9的再各自加一次
// 變成個位數，最後3個個位數的單（奇）雙（偶）組合對應「卦象一～八」。
// 已用課程範例 A212295535 核對：中間6碼1,2,2,9,5,5→(1+2,2+9,5+5)=(3,11,10)→11再加1+1=2、
// 10再加1+0=1→最終3,2,1→單雙單→卦象三
function shuziReduceToSingleDigit(n) {
  while (n > 9) {
    n = String(n).split("").reduce((s, d) => s + Number(d), 0);
  }
  return n;
}

const SHUZI_GUA_TABLE = {
  單單單: {
    name: "卦象一：單單單",
    personality: "這是一支充滿陽剛氣息的卦。得到這一卦的人，有極強的自信、做事果斷，有排除一切困難、奮力向前衝的勇氣，是個像陽光一般開朗、熱情的人。",
    love: "請問問自己，是不是太熱情呢？與普通異性交往時，別過份投入，免得真命天子誤會。",
    career: "適合從事有關服務社會、人群的工作，如警察、律師以及法律相關工作。",
    future: "自古多情空餘恨！十五至二十歲之間容易遇到多角戀情，珍惜眼前的緣份，別為了自己的快樂而破壞別人的幸福。"
  },
  單單雙: {
    name: "卦象二：單單雙",
    personality: "這類人有靈活的交際手腕、聰明、清晰的頭腦，是個不折不扣的機會主義者。唯一要注意的是防人之心太重，容易把善意誤會成惡意。",
    love: "處處防範著別人，其實是不想自己受傷害。試著打開心扉，讓別人進來吧。",
    career: "聰明敏捷、反應快、手腕圓滑，適合當政治家、公關、談判人員。",
    future: "屬於較幸運的一群，稍加努力便會成功，但不勞而獲的運氣往往曇花一現，仍須努力耕耘。"
  },
  單雙單: {
    name: "卦象三：單雙單",
    personality: "這類人性格堅毅、有耐心，懂得在適合的時間做適合自己的角色，是個懂得協調、輔助別人的人。",
    love: "對愛情從不強求，相信緣聚緣滅皆有定數，即使遇到喜歡的人也不會主動追求，因此錯過不少機會。",
    career: "富有藝術天份、追求完美，適合當音樂家、填詞家、設計師等藝術創作工作。",
    future: "追求完美是好事，但稍過份便會變成挑剔；未來雖有多段情緣，若不珍惜恐怕會一一溜走。"
  },
  單雙雙: {
    name: "卦象四：單雙雙",
    personality: "性格飄忽不定，一分鐘前後可能完全不同，實在極難猜測，如同「晴時多雲偶陣雨」。",
    love: "無定風向，難以被約束；內心其實有極固執、純真的一面，不斷追逐渴望至死不渝的愛情。",
    career: "安穩的工作對他來說太沉悶，較適合刺激、有滿足感的工作，如攝影家、記者、海關人員等。",
    future: "未來取決於一念之間，良緣難求要當機立斷；緣份將至時好好把握，別讓真情溜走。"
  },
  雙單單: {
    name: "卦象五：雙單單",
    personality: "做事有點畏縮、怕事，但內心非常善良；總是默默去做，不計較得失，相信「沉默是金」。",
    love: "不相信愛情神話，只相信實實在在、平平凡凡的愛情，是真正的踏實派，安全感十足。",
    career: "踏實穩重，較適合自己開創事業，如當醫生及建築師等。",
    future: "千里馬也需伯樂知遇，若想享受成功的喜悅，就該勇敢放手去完成自己的理想。"
  },
  雙雙單: {
    name: "卦象六：雙雙單",
    personality: "性格率直、剛強，胸襟寬大，能包容別人的短處，是個不折不扣的君子。",
    love: "直接表露感情、不畏縮，對愛情永不言悔，是真正的專情者；表白時別太直接以免嚇壞對方。",
    career: "做事直接、認真、一絲不苟，較適合當律師、會計師、海關人員等。",
    future: "明知不可為而為之，結果不難想像；重新振作，未來也許會有另一段新戀情發生。"
  },
  雙雙雙: {
    name: "卦象七：雙雙雙",
    personality: "八卦中最陰柔的一卦，個性溫柔內向，缺點是有點懦弱，即使心中極想要也不會與人相爭。",
    love: "性格內向、對愛情非常敏感，卻不懂表達情感以致誤會頻生；一旦投入情海便傾盡全力尋覓。",
    career: "溫柔而心思細密，極適合學術性質工作，如教師、研究員、資料蒐集員、撰稿員等。",
    future: "比愛情重要的事情很多，未來幾年非常幸運，好好把握機會。"
  },
  雙單雙: {
    name: "卦象八：雙單雙",
    personality: "充滿陰柔略帶陽剛之氣，表面文靜怕事，內心卻剛強、有自己的原則，是外柔內剛的人。",
    love: "對愛情有點幻想也很執著，但從不奢望天長地久，能將夢想與現實分得十分清楚。",
    career: "頭腦清晰、觸覺敏銳，適合從事出版社編輯、時事評論員等工作。",
    future: "凡事皆有定數，莫勉強為之，隨緣就好；內心有股不屈的傲氣，就算面對失敗也不肯認輸。"
  }
};

function shuziIdCardAnalyze(idStr) {
  const digitsOnly = String(idStr).replace(/[^0-9]/g, "");
  if (digitsOnly.length !== 9) {
    return { error: "身份證號請輸入英文字母後面的完整 9 碼數字（例如 A212295535 的 212295535）" };
  }
  const d = digitsOnly.split("").map(Number);
  // 去掉第1個跟最後2個，剩中間6個
  const middle = d.slice(1, 7);
  const sums = [middle[0] + middle[1], middle[2] + middle[3], middle[4] + middle[5]];
  const finalDigits = sums.map(shuziReduceToSingleDigit);
  const pattern = finalDigits.map((n) => (n % 2 === 1 ? "單" : "雙")).join("");
  const gua = SHUZI_GUA_TABLE[pattern];
  return { middle, sums, finalDigits, pattern, gua };
}

// 英文字母→數字對照表（A=1、B=2...M=13、N=14...Z=26，依使用者提供的圖示表格）
const SHUZI_LETTER_CODES = {};
"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach((ch, i) => { SHUZI_LETTER_CODES[ch] = i + 1; });

// 車牌號碼：依原本順序把每個字元轉成數字（英文字母查上面的對照表、數字保留、其餘符號忽略），
// 例如 ABC-1234 → A=1,B=2,C=3 + 1,2,3,4 → 1231234，再跟純數字一樣走八星滑動配對
function shuziPlateToDigits(plate) {
  const chars = String(plate).toUpperCase().split("").filter((c) => /[A-Z0-9]/.test(c));
  if (!chars.length) return { error: "請輸入車牌號碼" };
  const digits = chars.map((c) => (/[0-9]/.test(c) ? c : String(SHUZI_LETTER_CODES[c]))).join("");
  return { digits };
}

// 身份證號完整分析：字母換算數字後併入號碼，跑一次八星滑動配對；同時保留原本的三位數卦象分析
function shuziIdCardCombinedAnalyze(rawIdStr) {
  const trimmed = String(rawIdStr).trim().toUpperCase();
  const m = trimmed.match(/^([A-Z])([0-9]+)$/);
  if (!m) {
    return { error: "請輸入正確格式：1 個英文字母加上身份證後面的數字（例如 A212295535）" };
  }
  const letter = m[1];
  const digitsOnly = m[2];
  const gua = shuziIdCardAnalyze(digitsOnly);
  if (gua.error) return { error: gua.error };
  const letterNum = SHUZI_LETTER_CODES[letter];
  const mergedDigits = String(letterNum) + digitsOnly;
  return { letter, letterNum, digitsOnly, mergedDigits, gua };
}

// 農曆生日：西元出生年月日先換算成農曆（js/lunar-convert.js），農曆年轉成民國年（不補零），
// 月份不補零，日期若為個位數要補0（數字易經.pdf「農曆生日」單元），例：民國76年2月8日→76208
function shuziLunarBirthdayToDigits(gYear, gMonth, gDay) {
  const lunar = solarToLunar(gYear, gMonth, gDay);
  if (lunar.error) return { error: lunar.error };
  const rocYear = lunar.lYear - 1911;
  const monthStr = String(lunar.lMonth);
  const dayStr = lunar.lDay < 10 ? "0" + lunar.lDay : String(lunar.lDay);
  return { lunar, rocYear, digits: String(rocYear) + monthStr + dayStr };
}

// 姓名筆劃：與「姓名學」頁採相同的筆劃計算方式（app.js 的 xmStrokes）——優先查
// 康熙字典姓名學筆劃（js/name-kangxi-strokes.js, KANGXI_STROKES，共20537字），查無時
// 退回教育部《國語辭典簡編本》筆畫（js/name-strokes-data.js, SHUZI_NAME_STROKES）。把筆劃
// 數字串接成數字字串，之後跟純數字／車牌一樣走八星滑動配對。
function shuziNameStrokes(ch) {
  if (typeof KANGXI_STROKES !== "undefined" && KANGXI_STROKES[ch] != null) return KANGXI_STROKES[ch];
  if (typeof SHUZI_NAME_STROKES !== "undefined" && SHUZI_NAME_STROKES[ch] != null) return SHUZI_NAME_STROKES[ch];
  return null;
}
function shuziNameToDigits(name) {
  const chars = Array.from(String(name).trim()).filter((c) => c.trim() !== "");
  if (!chars.length) return { error: "請輸入姓名" };
  const breakdown = [];
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const strokes = shuziNameStrokes(ch);
    if (strokes == null) {
      return { error: "「" + ch + "」查無筆劃資料，請確認是否為正確的繁體字" };
    }
    breakdown.push({ char: ch, strokes });
  }
  const digits = breakdown.map((b) => String(b.strokes)).join("");
  return { breakdown, digits };
}
