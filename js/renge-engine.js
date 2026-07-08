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

  // 年/月/日數能量是對稱的一組公式：各自把「生日的另外兩個部分」化到個位數＋對應的擇日部分化到個位數，加總後再化到個位數
  const yearEnergy = reduceToSingle(reduceToSingle(month) + reduceToSingle(day) + reduceToSingle(qYear));
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

  // 「數字池」：生日年/月/日本身的數字＋年月日各自的 digitSum＋天賦數的完整化簡過程＋年數能量。
  // 用現場測試（固定生日、改變擇日／時辰）證實 60-79／40-59 欄跟月/日數能量、0-19 欄都不影響這個池子，
  // 但 Yraw/Mraw/Draw 這三個中間值（不是天賦數本身，是年/月/日各自單獨的 digitSum）必須算進去，才能跟 3 份 PDF 逐一對上。
  // 空缺數＝1~9 之中不在這個池子裡的數字；九宮連線密碼的 12 條線（含 4 條兩格連線）也是用同一個池子判斷是否命中——
  // 現場測試 3 筆資料、12 條線逐一核對（36 格）全部吻合，包含「靈巧線24」這種生日本身沒有 4、但 Draw（日的 digitSum）算出 4 而命中的案例。
  const digitSet = new Set();
  [year, month, day].forEach((n) => numberDigits(n).forEach((d) => digitSet.add(d)));
  [Yraw, Mraw, Draw].forEach((v) => numberDigits(v).forEach((d) => digitSet.add(d)));
  stageSeq(stage3Raw).forEach((v) => numberDigits(v).forEach((d) => digitSet.add(d)));
  numberDigits(yearEnergy).forEach((d) => digitSet.add(d));
  const gapNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((d) => !digitSet.has(d));

  const codeLines = CODE_LINES.map((line) => ({
    nums: line.nums,
    name: line.name,
    shadow: line.shadow,
    matched: line.nums.every((d) => digitSet.has(d))
  }));

  // 九宮能量圖：1-9 每格一個「電池」，依 5 個類別疊加色塊，每個類別的數字裡每出現一次某個位數就疊一格。
  // 現場測試 3 筆資料、5 類別×9 位數全部核對一致：
  // 藍(主命數)=mainNumber 本身；紫(年數能量)=yearEnergy 本身；粉(天賦數)=天賦數化簡過程（不含主命數，即 talentChain）；
  // 綠(生日數)=生日年/月/日原始數字＋「日」化簡到個位數過程中的中間值（dayReductionExtra，這是用吳慧琳這筆日=19 兩步化簡的資料才抓出來的）；
  // 橘(階段數)=擇日年份對照生日算出的目前歲數所在的那個階段欄（0-19/20-39/40-59/60-79/80-99，80-99 跟 20-39 同一欄），
  // 只疊「目前歲數對應的那一欄」，不是全部 4 欄都疊——這點是拿吳慧琳（現場歲數落在 40-59）跟姜筱郡（落在 20-39）兩筆矛盾的資料才比對出來的。
  // 0-19 那一欄即使沒填時辰，這裡疊色塊時一律當時辰＝0 計算（現場測試姜兆源歲數落在 0-19 區間、時辰留白時仍然有疊色塊，看得出來是這樣算的）。
  const energyCounts = { blue: {}, pink: {}, green: {}, orange: {}, purple: {} };
  const addDigits = (bucket, n) => {
    numberDigits(n).forEach((d) => {
      if (d >= 1 && d <= 9) bucket[d] = (bucket[d] || 0) + 1;
    });
  };
  addDigits(energyCounts.blue, mainNumber);
  addDigits(energyCounts.purple, yearEnergy);
  talentChain.forEach((v) => addDigits(energyCounts.pink, v));
  [year, month, day].forEach((n) => addDigits(energyCounts.green, n));
  dayReductionExtra(day).forEach((v) => addDigits(energyCounts.green, v));
  const currentAge = qYear - year;
  const stage4RawForGrid = talentRaw + digitSum(hasHour ? hour : 0);
  let orangeRaw;
  if (currentAge < 20) orangeRaw = stage4RawForGrid;
  else if (currentAge < 40) orangeRaw = stage3Raw;
  else if (currentAge < 60) orangeRaw = stage2Raw;
  else if (currentAge < 80) orangeRaw = stage1Raw;
  else orangeRaw = stage3Raw;
  stageSeq(orangeRaw).forEach((v) => addDigits(energyCounts.orange, v));

  const energyGrid = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => ({
    digit: d,
    blue: energyCounts.blue[d] || 0,
    pink: energyCounts.pink[d] || 0,
    green: energyCounts.green[d] || 0,
    orange: energyCounts.orange[d] || 0,
    purple: energyCounts.purple[d] || 0
  }));

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
    energyGrid
  };
}
