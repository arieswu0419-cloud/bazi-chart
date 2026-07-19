// 人格解碼 能量分析表：以生日（年月日＋時，時可省略）＋擇日（分析當下年月日）為輸入的數字命理計算。
// 對照參考網站 https://www.event.meta-academy.biz/metagroup-renge-jie-ma，
// 用 3 份實際存下來的報告 PDF（吳慧琳/姜兆源/姜筱郡）＋現場操作計算頁（meta-academy-renge）逐欄核對。

function digitSum(n) {
  return String(Math.abs(n)).split("").reduce((s, c) => s + Number(c), 0);
}

function reduceToSingle(n) {
  let cur = Math.abs(n);
  while (cur >= 10) cur = digitSum(cur);
  return cur;
}

function numberDigits(n) {
  return String(Math.abs(n)).split("").map(Number);
}

// 天賦數／主命數：原始總和逐位相加直到個位數；chain 記錄過程中每個兩位數以上的中間值（不含最終個位數）
function reduceChainExcludingFinal(raw) {
  const chain = [];
  let cur = raw;
  while (cur >= 10) {
    chain.push(cur);
    cur = digitSum(cur);
  }
  return { chain, final: cur };
}

// 階段數表格用：完整顯示原始值＋所有中間值＋最終個位數；若原始值本身已是個位數，重複顯示一次
function stageSeq(raw) {
  const seq = [raw];
  let cur = raw;
  while (cur >= 10) {
    cur = digitSum(cur);
    seq.push(cur);
  }
  if (seq.length === 1) seq.push(cur);
  return seq;
}

// 日的數位逐步化簡到個位數的過程（不含日本身的原始值）；日是個位數的話就沒有額外值
function dayReductionExtra(day) {
  const extra = [];
  let cur = day;
  while (cur >= 10) {
    cur = digitSum(cur);
    extra.push(cur);
  }
  return extra;
}

// 九宮連線密碼：固定 12 格圖例（跟每個人的生日無關，是參考網站的固定表格）
const CODE_LINES = [
  { nums: [1, 4, 7], name: "腦力務實線", shadow: "貪財線" },
  { nums: [1, 2, 3], name: "藝術線", shadow: "任性線" },
  { nums: [1, 5, 9], name: "事業線", shadow: "偏執線" },
  { nums: [2, 6], name: "和平線", shadow: "失衡線" },
  { nums: [2, 5, 8], name: "感應感情線", shadow: "口舌線" },
  { nums: [4, 5, 6], name: "組織線", shadow: "完美主義線" },
  { nums: [3, 5, 7], name: "人緣線", shadow: "小人線" },
  { nums: [4, 8], name: "勤奮線", shadow: "顧慮線" },
  { nums: [3, 6, 9], name: "靈感智慧線", shadow: "空想線" },
  { nums: [7, 8, 9], name: "權力線", shadow: "貴人線" },
  { nums: [2, 4], name: "靈巧線", shadow: "奸詐線" },
  { nums: [6, 8], name: "誠實線", shadow: "虛榮線" }
];

function calculateRenge({ year, month, day, qYear, qMonth, qDay, hour, name }) {
  const Yraw = digitSum(year);
  const Mraw = digitSum(month);
  const Draw = digitSum(day);

  const talentRaw = Yraw + Mraw + Draw;
  const { chain: talentChain, final: mainNumber } = reduceChainExcludingFinal(talentRaw);
  const talentDisplay = talentChain.length ? talentChain.join("/") : String(mainNumber);

  // 年數能量用的是「實歲」概念的擇日年，不是選單上選的西元年本身：如果擇日的月/日還沒到生日的月/日，
  // 要當作還沒過生日，年份要減 1 才算對（跟真實年齡「還沒過生日不算長一歲」是同一個道理）。
  // 這是拿同一筆生日、只改擇日的月/日/年分別測試（10 筆以上組合）才抓出來的規則——原本以為年數能量只看
  // 擇日年份本身，用固定生日+固定擇日=2021-11-29（3 份 PDF 剛好都是生日在擇日之前，測不出這個規則）驗證，
  // 換一組生日在擇日之後的資料測試才發現對不上，改成「實歲年」才跟參考網站一致。
  // 月/日數能量沒有這個問題，已用大範圍調整擇日月/日/年分別測試過，兩者都只跟各自對應的擇日分量有關。
  const birthdayPassed = qMonth * 100 + qDay >= month * 100 + day;
  const effectiveQYear = birthdayPassed ? qYear : qYear - 1;
  const yearEnergy = reduceToSingle(reduceToSingle(month) + reduceToSingle(day) + reduceToSingle(effectiveQYear));
  const monthEnergy = reduceToSingle(reduceToSingle(year) + reduceToSingle(day) + reduceToSingle(qMonth));
  const dayEnergy = reduceToSingle(reduceToSingle(year) + reduceToSingle(month) + reduceToSingle(qDay));

  // 人生階段能量表：每一欄都是「累加多一個出生時間分量的 digitSum（只做一次，不逐位反覆化簡）」，
  // 60-79=年，40-59=年+月，20-39/80-99=年+月+日，0-19=年+月+日+時。用實際計算頁現場測試（同一筆生日，
  // 只改「時」欄位：0 → 10/1、8 → 18/9、14 → 15/6、19 → 20/2）逐一核對出來，0-19 欄需要出生時辰才能算。
  const stage1Raw = Yraw;
  const stage2Raw = Yraw + Mraw;
  const stage3Raw = talentRaw;
  const hasHour = hour !== null && hour !== undefined && hour !== "";
  const Hraw = hasHour ? digitSum(hour) : null;
  const stage4Raw = hasHour ? talentRaw + Hraw : null;
  const stages = [
    { label: "60-79", value: stageSeq(stage1Raw).join("/") },
    { label: "40-59", value: stageSeq(stage2Raw).join("/") },
    { label: "20-39\n80-99", value: stageSeq(stage3Raw).join("/") },
    hasHour
      ? { label: "0-19", value: stageSeq(stage4Raw).join("/") }
      : { label: "0-19", value: null, unconfirmed: true, needsHour: true }
  ];

  // 「目前歲數對應的階段欄」：用實歲（effectiveQYear－生日年）判斷落在哪個階段區間，
  // 0-19 用 0-19 欄（沒有時辰就用時辰＝0 計算，跟時辰無關的地方一律這樣處理），20-39 用 20-39 欄，
  // 40-59 用 40-59 欄，60-79 用 60-79 欄，80-99 跟 20-39 同一欄。
  // 這一欄同時是「空缺數／九宮連線密碼」數字池的一部分，也是「九宮能量圖」橘色（階段數）疊色的依據——
  // 用吳慧琳（實歲45，40-59 欄）、姜兆源（實歲16，0-19 欄）、姜筱郡（實歲20，20-39 欄）三筆資料，
  // 加上一筆實歲55（40-59 欄）的新資料交叉驗證，證實兩個地方用的是同一個「目前歲數對應欄」，
  // 不是固定用 20-39/80-99 那一欄。
  const currentAge = effectiveQYear - year;
  const stage4RawForAge = talentRaw + digitSum(hasHour ? hour : 0);
  let currentBracketRaw;
  let currentBracketIndex;
  if (currentAge < 20) { currentBracketRaw = stage4RawForAge; currentBracketIndex = 3; }
  else if (currentAge < 40) { currentBracketRaw = stage3Raw; currentBracketIndex = 2; }
  else if (currentAge < 60) { currentBracketRaw = stage2Raw; currentBracketIndex = 1; }
  else if (currentAge < 80) { currentBracketRaw = stage1Raw; currentBracketIndex = 0; }
  else { currentBracketRaw = stage3Raw; currentBracketIndex = 2; }
  stages[currentBracketIndex].current = true;

  // 「數字池」：生日年/月/日本身的數字＋日的 digitSum（Draw，只有日，不含年/月自己的 digitSum）
  // ＋天賦數的完整化簡過程（天賦數本身是個位數、沒有化簡過程可顯示時，改用主命數本身頂替）
  // ＋目前歲數對應的階段欄＋年數能量。
  // 用現場測試（固定生日、改變擇日／時辰／生日本身，含一筆天賦數剛好是個位數「5」的資料）證實：
  // 年/月各自的 digitSum（Yraw/Mraw）不能算進池子——只有 Draw（日的 digitSum）才要算，這是唯一
  // 讓「靈巧線24」這種生日本身沒有 4 但要算命中的案例成立、同時不會誤把 Yraw/Mraw 引入的多餘數字也算進去的組合。
  // 空缺數＝1~9 之中不在這個池子裡的數字；九宮連線密碼的 12 條線（含 4 條兩格連線）也是用同一個池子判斷是否命中——
  // 現場測試 5 筆資料、12 條線逐一核對全部吻合。
  const talentChainOrMain = talentChain.length ? talentChain : [mainNumber];
  const digitSet = new Set();
  [year, month, day].forEach((n) => numberDigits(n).forEach((d) => digitSet.add(d)));
  numberDigits(Draw).forEach((d) => digitSet.add(d));
  talentChainOrMain.forEach((v) => numberDigits(v).forEach((d) => digitSet.add(d)));
  stageSeq(currentBracketRaw).forEach((v) => numberDigits(v).forEach((d) => digitSet.add(d)));
  numberDigits(yearEnergy).forEach((d) => digitSet.add(d));
  // 主命數本身一定在數字池內：官網（event.meta-academy.biz/metagroup-renge-jie-ma）實測——生日
  // 1984-2-19、擇日 2026-7-18（天賦數34→主命數7）官網空缺數＝只有 5（不含 7），且含 7 的連線
  // （腦力務實線147、權力線789）亮。原本 talentChainOrMain 只取天賦數化簡「過程」([34]) 不含最後
  // 的主命數 7，導致主命數被誤判成空缺、含它的連線也不亮；補上主命數本身即與官網一致
  // （九宮能量圖藍色本來就以主命數畫格7，此修正同時消除兩者的矛盾）。
  numberDigits(mainNumber).forEach((d) => digitSet.add(d));
  const gapNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((d) => !digitSet.has(d));

  const codeLines = CODE_LINES.map((line) => ({
    nums: line.nums,
    name: line.name,
    shadow: line.shadow,
    matched: line.nums.every((d) => digitSet.has(d))
  }));

  // 九宮能量圖：1-9 每格一個「電池」，依 5 個類別疊加色塊，每個類別的數字裡每出現一次某個位數就疊一格。
  // 藍(主命數)=mainNumber 本身；紫(年數能量)=yearEnergy 本身；
  // 粉(天賦數)=天賦數化簡過程（跟上面數字池用的是同一個 talentChainOrMain，天賦數是個位數時改用主命數頂替）；
  // 綠(生日數)=生日年/月/日原始數字＋「日」化簡到個位數過程中的中間值（dayReductionExtra，這是用吳慧琳這筆日=19 兩步化簡的資料才抓出來的）；
  // 橘(階段數)=目前歲數對應的階段欄（跟上面數字池用的是同一個 currentBracketRaw）。
  const energyCounts = { blue: {}, pink: {}, green: {}, orange: {}, purple: {} };
  const addDigits = (bucket, n) => {
    numberDigits(n).forEach((d) => {
      if (d >= 1 && d <= 9) bucket[d] = (bucket[d] || 0) + 1;
    });
  };
  addDigits(energyCounts.blue, mainNumber);
  addDigits(energyCounts.purple, yearEnergy);
  talentChainOrMain.forEach((v) => addDigits(energyCounts.pink, v));
  [year, month, day].forEach((n) => addDigits(energyCounts.green, n));
  dayReductionExtra(day).forEach((v) => addDigits(energyCounts.green, v));
  stageSeq(currentBracketRaw).forEach((v) => addDigits(energyCounts.orange, v));

  const energyGrid = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => ({
    digit: d,
    blue: energyCounts.blue[d] || 0,
    pink: energyCounts.pink[d] || 0,
    green: energyCounts.green[d] || 0,
    orange: energyCounts.orange[d] || 0,
    purple: energyCounts.purple[d] || 0
  }));

  // 天賦卓越數：天賦數化簡過程中出現 11/22/33/44 才觸發；11 另外依「化簡前一步」（29/38/47）挑更細緻的版本
  const masterHit = talentChain.find((v) => v === 11 || v === 22 || v === 33 || v === 44);
  let masterNumberInfo = null;
  if (masterHit && typeof RENGE_MASTER_NUMBERS !== "undefined") {
    const idx = talentChain.indexOf(masterHit);
    const precursor = idx > 0 ? talentChain[idx - 1] : null;
    const entry = RENGE_MASTER_NUMBERS[masterHit];
    const subText = masterHit === 11 && precursor && entry.subs && entry.subs[precursor] ? entry.subs[precursor] : null;
    masterNumberInfo = { number: masterHit, text: subText || entry.generic };
  }

  // 九宮能量圖圈數含義：1~9 全部列出（不再只列主命中有的數字）——官方教材的圈數對照表本來就涵蓋
  // 「沒有圈（空缺數）」：沒有圈用各數字專屬的空缺說明、1/2 圈用通用說明、3-4 圈與 5 圈以上用各數字專屬說明。
  // 空缺（0圈）的數字不寫數字「0」，顯示「沒有圈（空缺數）」，跟官方投影片的欄位名稱一致。
  const circleMeanings = typeof RENGE_CIRCLE_MEANING_BY_DIGIT !== "undefined"
    ? energyGrid
        .map((g) => ({ digit: g.digit, total: g.blue + g.pink + g.green + g.orange + g.purple }))
        .map((g) => {
          const info = RENGE_CIRCLE_MEANING_BY_DIGIT[g.digit];
          let text;
          if (g.total === 0) text = info.zero;
          else if (g.total <= 2) text = RENGE_CIRCLE_MEANING_GENERAL.find((x) => x.range === String(g.total)).text;
          else if (g.total <= 4) text = info.high;
          else text = info.over;
          return { digit: g.digit, count: g.total, isGap: g.total === 0, text };
        })
    : [];

  // 天賦數細項說明：官方教材同一個主命數底下，依「化簡前的兩位數」（每次＋9）分成好幾段更精確的描述。
  // 用官方 pptx（深層探索篇 天賦數1~9）逐張核對出來的分段結構：
  //   主命數1~3 沒有「純個位數」段（生日數位總和最小是4，湊不出1/2/3），段0起點是 num+9（10/1、11/2、12/3…）；
  //   主命數4~9 的段0是「總和恰為個位數」的純能量段（4/4、5/5…），兩位數段（13/4、14/5…）從段1開始。
  // 之前那版沒處理純能量段，導致主命數4~9 的兩位數天賦數全部錯位一段（例如 13/4 誤顯示 4/4 的內容）。
  // 用 talentChain 的原始值（尚未化簡的那個兩位數，例如「37/10」的 37）反推屬於第幾段；
  // 對不上就整段都顯示，不強行猜測。
  const pickTalentSegment = (num, chain) => {
    const full = typeof RENGE_TALENT !== "undefined" ? RENGE_TALENT[num] : null;
    if (!full) return null;
    const segments = full.split("／");
    const hasPureSegment = num >= 4;
    if (!chain.length) {
      // 天賦數本身就是個位數：主命數4~9 直接對應純能量段；1~3 理論上不會發生，保底顯示全文
      return hasPureSegment ? { text: segments[0], matched: true } : { text: full, matched: false };
    }
    const precursor = chain[0];
    const base = num + 9;
    const offset = hasPureSegment ? 1 : 0;
    const idx = Math.round((precursor - base) / 9) + offset;
    if (idx >= offset && idx < segments.length && base + (idx - offset) * 9 === precursor) {
      return { text: segments[idx], matched: true };
    }
    return { text: full, matched: false };
  };

  // 人生階段數說明：目前歲數所在那一欄（currentBracketRaw）化簡到底的個位數，直接對照「年數能量」1-9 表
  const currentStageDigit = reduceToSingle(currentBracketRaw);
  const stageExplain = typeof RENGE_YEAR_ENERGY !== "undefined" ? {
    digit: currentStageDigit,
    ageLabel: stages[currentBracketIndex].label.replace("\n", " "),
    stageValue: stages[currentBracketIndex].value,
    content: RENGE_YEAR_ENERGY[currentStageDigit]
  } : null;

  const reference = typeof RENGE_TRAITS !== "undefined" ? {
    mainNumber,
    talentDisplay,
    name: RENGE_NUMBER_NAMES[mainNumber],
    traits: RENGE_TRAITS[mainNumber],
    investment: RENGE_INVESTMENT[mainNumber],
    sales: RENGE_SALES[mainNumber],
    recruiting: RENGE_RECRUITING[mainNumber],
    relationship: RENGE_RELATIONSHIP[mainNumber],
    career: RENGE_CAREER[mainNumber],
    talent: pickTalentSegment(mainNumber, talentChain),
    masterNumber: masterNumberInfo,
    comparison: RENGE_COMPARISON_GROUPS[mainNumber],
    attraction: RENGE_ATTRACTION[mainNumber],
    circleMeanings,
    stageExplain
  } : null;

  return {
    name,
    birthDisplay: year + " " + month + " " + day,
    choiceDisplay: qYear + " " + qMonth + " " + qDay,
    talentDisplay,
    mainNumber,
    yearEnergy,
    monthEnergy,
    dayEnergy,
    stages,
    gapNumbers,
    codeLines,
    energyGrid,
    reference
  };
}
