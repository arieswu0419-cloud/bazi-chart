// ================= 紫微斗數「轉流年PDF分析報告」=================
// 依 iztro 排盤結果（app.js 的 zwState.a）組出流年分析報告 DOM，再由 app.js 逐區塊轉成 PDF。
// 版面比照「吳宥萱／何佳穎 2026–2027 流年分析報告」Word 範本（深紅 #650707 主色、01–09 章節）。
// 解讀文字為規則式組合：星曜特質＋四化入宮＋煞吉星＋對宮沖忌，評分只用來排「大吉／吉／平／注意」。
(function () {
  const ZHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  const PALACES = ["命宮", "兄弟", "夫妻", "子女", "財帛", "疾厄", "遷移", "僕役", "官祿", "田宅", "福德", "父母"];
  const DEFAULT_PICKS = ["官祿", "財帛", "疾厄"];
  const MUTS = ["祿", "權", "科", "忌"];
  const MUT_KEY = { 祿: "lu", 權: "quan", 科: "ke", 忌: "ji" };
  const LAYER_LABEL = { natal: "生年", decadal: "大限", yearly: "流年" };
  const BRIGHT = { 廟: 1, 旺: 1, 得: 0.5, 利: 0.5, 平: 0, 不: -0.3, 閑: -0.3, 陷: -1 };
  const BRIGHT_TEXT = { 不: "閑" }; // 與命盤畫面用字一致
  const MUT_SCORE = {
    natal: { 祿: 2, 權: 1, 科: 1, 忌: -2 },
    decadal: { 祿: 2.5, 權: 1.2, 科: 1.2, 忌: -3 },
    yearly: { 祿: 3, 權: 1.5, 科: 1.5, 忌: -3.5 }
  };
  const CLASH_SCORE = { natal: -1, decadal: -1.5, yearly: -2 };
  // 輔星／流曜（運X＝大限、流X＝流年，去掉前綴後同義）
  const FLOW_BASE = { 祿: "祿存", 羊: "擎羊", 陀: "陀羅", 昌: "文昌", 曲: "文曲", 魁: "天魁", 鉞: "天鉞", 馬: "天馬", 鸞: "紅鸞", 喜: "天喜" };
  const LUCKY = { 祿存: 1.5, 天魁: 1, 天鉞: 1, 左輔: 0.5, 右弼: 0.5, 文昌: 0.5, 文曲: 0.5, 年解: 0.5, 紅鸞: 0.3, 天喜: 0.3 };
  const SHA = { 擎羊: -1.5, 陀羅: -1.5, 火星: -1, 鈴星: -1, 地空: -1, 地劫: -1 };
  const RATING_BIG = { 大吉: "旺", 吉: "順", 平: "穩", 注意: "防" };

  // ---------- 解讀文字庫 ----------
  // 十四主星：特質／事業／財帛／健康／感情
  const STAR = {
    紫微: { trait: "帝星，主尊貴、領導與自尊，喜有輔弼朝拱", career: "適合管理、決策、主導型職位", wealth: "理財有格局，重視地位與資產", health: "脾胃、消化系統", love: "重視對方的尊重與體面" },
    天機: { trait: "智慧之星，主謀略、分析與變動，思慮多", career: "適合企劃、研究、顧問、資訊與幕僚工作", wealth: "靠專業與腦力生財，收入隨變動起伏", health: "肝膽、神經緊繃、失眠、四肢筋骨", love: "想得多，溝通重於形式" },
    太陽: { trait: "光明之星，主名聲、付出與主動熱心", career: "適合公職、教育、傳播、管理與對外角色", wealth: "先名後利，錢財來去較大方", health: "眼睛、血壓、心臟與頭部", love: "付出型，喜歡照顧對方" },
    武曲: { trait: "正財星，主剛毅果決、執行力強", career: "適合金融、財務、技術、工程類工作", wealth: "善賺錢也善管錢，重實質報酬", health: "呼吸道、肺、鼻、牙齒骨骼", love: "務實、不善表達" },
    天同: { trait: "福星，主溫和、協調與享受", career: "適合服務、福利、教育、餐飲與協調型工作", wealth: "財來自人緣與服務，偏穩定", health: "泌尿、腎臟、水腫與體重", love: "重感受、喜和諧" },
    廉貞: { trait: "次桃花，主才幹、手腕，也主是非", career: "適合公關、法律、業務、技術專業", wealth: "正偏財並見，須防是非破財", health: "血液循環、心血管、婦科、皮膚", love: "感情豐富，易有波折" },
    天府: { trait: "財庫之星，主穩重、保守與包容", career: "適合管理、財務、行政等守成型職位", wealth: "守財能力強，善於累積", health: "脾胃、消化", love: "穩定、重承諾" },
    太陰: { trait: "財星兼田宅主，主細膩、內斂與累積", career: "適合財務、不動產、企劃與幕後工作", wealth: "善儲蓄，利不動產與長期累積", health: "腎、婦科、內分泌、眼睛", love: "細膩溫柔，重安全感" },
    貪狼: { trait: "桃花星，主慾望、交際與多才多藝", career: "適合業務、行銷、娛樂、餐飲與跨領域發展", wealth: "機會財、人脈財，偏財運強", health: "肝腎、生殖泌尿、作息與飲酒", love: "桃花多、魅力強" },
    巨門: { trait: "暗星，主口才、研究，也主口舌是非", career: "適合法律、教學、顧問、業務與媒體", wealth: "靠口才與專業生財，先難後成", health: "食道、消化、口腔與呼吸道", love: "溝通是關鍵，易起口角" },
    天相: { trait: "印星，主輔佐、公正與重形象", career: "適合行政、秘書、公關與管理輔佐", wealth: "收入穩定，重體面花費", health: "膀胱、皮膚、泌尿系統", love: "重視和諧與承諾" },
    天梁: { trait: "蔭星，主照顧、解厄、老成持重", career: "適合醫療、保險、社福、顧問與公職", wealth: "財來自專業與庇蔭，不宜投機", health: "胃、乳房、慢性病，但有解厄之力", love: "喜歡照顧對方，略帶說教" },
    七殺: { trait: "將星，主衝勁、開創與獨立", career: "適合開拓業務、外派、技術與創業", wealth: "財來自衝刺，起伏較大", health: "呼吸道、骨骼、外傷開刀", love: "個性強，彼此需要空間" },
    破軍: { trait: "耗星，主破舊立新、變動與冒險", career: "適合改革、轉型、創業與技術變革", wealth: "財來財去、先破後成", health: "泌尿生殖、腸胃、外傷", love: "起伏大，需要用心經營" }
  };
  const MINOR = {
    左輔: "團隊助力與貴人", 右弼: "暗中助力與人緣", 文昌: "文書、考試與名聲", 文曲: "才藝、口才與文書",
    天魁: "長輩、上司的提拔", 天鉞: "異性或暗中貴人", 祿存: "穩定收入、守成之財", 天馬: "變動、奔波與外出",
    擎羊: "競爭、衝突、外傷開刀", 陀羅: "拖延、糾纏與慢性問題", 火星: "突發、急躁與發炎", 鈴星: "悶燒型壓力與暗中衝突",
    地空: "想法落空、不宜投機", 地劫: "突發破耗、努力與回報有落差", 紅鸞: "喜事與人緣", 天喜: "喜慶與好心情", 年解: "化解災厄"
  };
  const MINOR_HEALTH = {
    擎羊: "外傷、開刀、發炎", 陀羅: "慢性病、筋骨痠痛", 火星: "發炎、燙傷、急症", 鈴星: "神經緊張、暗疾",
    地空: "神經衰弱、虛耗", 地劫: "突發小病", 天馬: "奔波勞累、作息不定"
  };
  // 十二宮：主題／四化入宮／對宮沖忌／煞星多／吉星多／平穩，及建議
  const PAL = {
    命宮: { theme: "自身運勢與狀態", domain: "trait", lu: "自身運勢旺，機會主動找上門", quan: "主導性強、責任加重", ke: "形象與名聲提升，遇事有貴人", ji: "壓力與煩惱多，凡事想得多", chong: "外在環境的變動直接衝擊自己，決定要放慢", sha: "脾氣急、競爭多，防衝動與意外", good: "整體順遂，適合主動出擊", calm: "平穩，按部就班即可",
      advice: ["重大決定放慢半拍，先想清楚再行動", "維持規律作息，保持體力與判斷力"], adviceJi: "低調行事，避免衝動與正面衝突", adviceLu: "主動爭取想要的機會，今年是出手的時候" },
    兄弟: { theme: "手足、同事與現金流", domain: "trait", lu: "手足同事有助力，現金流尚穩", quan: "同輩間有競爭，合作需要主導", ke: "同儕口碑好，互相幫襯", ji: "與手足同事有摩擦，現金周轉吃緊", chong: "與同輩的金錢往來要清楚", sha: "同輩競爭激烈", good: "同事手足關係融洽", calm: "同輩關係平順",
      advice: ["與手足、同事的金錢往來留字據", "保留一筆不動用的現金"], adviceJi: "不替人作保、不輕易借貸給親友", adviceLu: "善用同事與手足的資源合作" },
    夫妻: { theme: "感情、伴侶與合作關係", domain: "love", lu: "感情和睦，伴侶或合作對象帶來助益", quan: "伴侶強勢，關係中有主導權之爭", ke: "感情平穩，彼此尊重", ji: "感情摩擦、溝通不良", chong: "外在事務影響感情，需多花時間相處", sha: "一言不合易起衝突", good: "感情與合作關係順利", calm: "感情平穩",
      advice: ["固定安排兩人相處的時間", "重要事情當面溝通，不靠訊息"], adviceJi: "情緒上來時先暫停，隔天再談", adviceLu: "單身者把握人際場合，有伴者適合規劃共同目標" },
    子女: { theme: "子女、晚輩、下屬與合夥投資", domain: "trait", lu: "晚輩下屬帶來喜事，合夥投資有小利", quan: "對子女晚輩操心、管教加重", ke: "子女晚輩表現佳", ji: "為子女晚輩操心，合夥投資宜保守", chong: "合夥與投資的變數多", sha: "與晚輩下屬易有衝突", good: "子女晚輩與合夥關係順利", calm: "子女晚輩平順",
      advice: ["合夥、投資前把權責與出場條件寫清楚", "多花時間陪伴子女或帶領晚輩"], adviceJi: "暫緩新的合夥與加碼投資", adviceLu: "適合培養接班人或小額副業" },
    財帛: { theme: "收入、理財與用錢態度", domain: "wealth", lu: "收入增加、進財順利", quan: "掌握財務主導權，收入靠能力爭取", ke: "財務穩健，理財有方", ji: "財務壓力大，支出多或周轉吃緊", chong: "外在因素造成破財，預算要保守", sha: "為錢與人爭，防衝動消費與投資", good: "財運順，適合累積", calm: "收支平穩",
      advice: ["薪資入帳後自動轉存，先存後花", "緊急預備金至少 6 個月生活費", "投資以看得懂、長期、分散為原則"], adviceJi: "不宜大額購置、借貸與替人作保", adviceLu: "把握進帳機會，獎金優先存下來" },
    疾厄: { theme: "身體狀況與健康", domain: "health", lu: "身體狀況平穩，有病能解", quan: "身體負荷大、容易勞累", ke: "小病易遇良醫化解", ji: "健康要留意，宜定期檢查", chong: "外在壓力轉成身體耗損", sha: "防外傷、發炎與急症", good: "體力充沛", calm: "健康平穩",
      advice: ["安排一次完整健康檢查", "固定睡眠時間，避免長期熬夜", "運動以低衝擊、有暖身為主"], adviceJi: "身體有不適盡早就醫，不要硬撐", adviceLu: "趁狀況好時建立運動習慣" },
    遷移: { theme: "外出、出差與對外發展", domain: "trait", lu: "外出有利，對外發展順", quan: "外務繁忙，在外掌控力強", ke: "在外有好名聲與貴人", ji: "外出不順，防交通與是非", chong: "外出與變動多，計畫要預留彈性", sha: "外出防意外與糾紛", good: "外地與對外事務順利", calm: "外出平順",
      advice: ["開車騎車放慢速度，行程預留彈性", "出差前把文件與行程確認清楚"], adviceJi: "避免夜間長途駕駛與高風險活動", adviceLu: "適合外派、出差、拓展外地客戶" },
    僕役: { theme: "朋友、客戶與人際關係", domain: "trait", lu: "朋友客戶帶來助力與財源", quan: "人際中需要掌握主導", ke: "人際口碑好", ji: "人際糾紛，防小人與損友", chong: "人際變動影響自己", sha: "朋友部屬間有暗爭", good: "人緣佳、助力多", calm: "人際平順",
      advice: ["經營關鍵客戶與人脈，定期聯繫", "與朋友的金錢往來保持清楚"], adviceJi: "說話留餘地，避免捲入他人糾紛", adviceLu: "多參加聚會與社群，客戶與機會從人脈來" },
    官祿: { theme: "事業、工作與職涯", domain: "career", lu: "事業機會多，工作順利", quan: "職權擴大、責任加重", ke: "工作表現受肯定，利升遷與考核", ji: "工作壓力大，防口舌與變動", chong: "外在環境影響工作，防組織調整", sha: "職場競爭激烈", good: "事業順遂，可主動爭取", calm: "工作平穩",
      advice: ["整理工作成果與數據，為考績、轉職或升遷備好作品集", "重要合約、職責範圍留下書面紀錄", "選定一項證照或進修課程強化專業"], adviceJi: "少在公開場合批評上司或同事，重要共識留文字", adviceLu: "主動爭取新專案、升遷或轉職機會" },
    田宅: { theme: "家庭、居住與不動產", domain: "trait", lu: "家運順，利置產與裝修", quan: "家中事務需要主導，可規劃置產", ke: "家宅平安，居住環境改善", ji: "家中事務煩心，房產支出或搬遷", chong: "家庭與居住有變動", sha: "家中易有口角或修繕支出", good: "家宅安穩", calm: "家中平順",
      advice: ["置產或房貸規劃先算清楚現金流", "整理居家環境，處理該修繕的地方"], adviceJi: "不衝動下訂房產，家中大事多商量", adviceLu: "適合規劃置產、換屋或裝修" },
    福德: { theme: "心情、興趣與精神生活", domain: "trait", lu: "心情愉快、懂得享受生活", quan: "想法堅定，但精神壓力大", ke: "心境平和，利進修學習", ji: "情緒煩憂、睡眠品質差", chong: "外在壓力影響心情", sha: "容易焦慮急躁", good: "精神飽滿", calm: "心情平穩",
      advice: ["培養一項固定的興趣或運動當作壓力出口", "利用空檔進修或考證照"], adviceJi: "長期失眠或情緒低落就尋求專業協助", adviceLu: "適合安排旅行或學習新事物" },
    父母: { theme: "長輩、上司與文書", domain: "trait", lu: "長輩上司提攜，文書申請順利", quan: "上司強勢、規範多", ke: "與長輩上司相處融洽，文書吉", ji: "與長輩上司意見不合，文書合約要細審", chong: "長輩健康或公司政策有變動", sha: "與上司長輩易有衝突", good: "上司長輩支持", calm: "與長輩上司相處平順",
      advice: ["多關心長輩健康", "重要文件與合約逐條確認再簽"], adviceJi: "與上司溝通先講結論、留書面紀錄", adviceLu: "主動向上司爭取支持與資源" }
  };
  const BODY_IN = {
    命宮: "命身同宮，個性鮮明，凡事靠自己", 夫妻: "人生重心在伴侶與合作關係", 財帛: "重視財務與物質上的安全感",
    遷移: "常在外奔波，外地與對外發展機會多", 官祿: "事業是人生的重心", 福德: "重視精神生活與興趣"
  };

  // ---------- 小工具 ----------
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const bright = (s) => { const b = BRIGHT_TEXT[s.brightness] || s.brightness || ""; return b ? "（" + b + "）" : ""; };
  const flowBase = (n) => (n.length === 2 && (n[0] === "運" || n[0] === "流") ? FLOW_BASE[n[1]] || n : n);
  const pad2 = (n) => String(n).padStart(2, "0");

  function rate(score) { return score >= 4 ? "大吉" : score >= 1.5 ? "吉" : score >= -1.5 ? "平" : "注意"; }

  // ---------- 分析 ----------
  // 三層盤面：natal＝本命、decadal＝大限（含本命）、yearly＝流年（含大限與本命）。
  // 同一宮在不同章節要用對應層級看：本命章節不能混入大限／流年的四化與流曜。
  const LEVELS = { natal: ["natal"], decadal: ["natal", "decadal"], yearly: ["natal", "decadal", "yearly"] };
  const flowLayer = (n) => (n[0] === "運" ? "decadal" : "yearly"); // 運X＝大限、流X／年解＝流年
  function view(r, level) {
    const L = LEVELS[level];
    const here = r.allHere.filter((m) => L.indexOf(m.layer) >= 0);
    const clash = r.allClash.filter((m) => L.indexOf(m.layer) >= 0);
    const flow = r.allFlow.filter((n) => L.indexOf(flowLayer(n)) >= 0);
    let score = 0;
    r.p.majorStars.forEach((s) => { score += BRIGHT[s.brightness] || 0; });
    if (!r.p.majorStars.length) score -= 0.3;
    here.forEach((m) => { score += MUT_SCORE[m.layer][m.mut]; });
    clash.forEach((m) => { score += CLASH_SCORE[m.layer]; });
    const lucky = [], sha = [];
    r.p.minorStars.map((s) => s.name).concat(flow).forEach((n) => {
      const b = flowBase(n);
      if (LUCKY[b] !== undefined) { score += LUCKY[b]; lucky.push(n); }
      if (SHA[b] !== undefined) { score += SHA[b]; sha.push(n); }
    });
    score = Math.round(score * 10) / 10;
    return Object.assign({}, r, { level, here, clash, flow, lucky, sha, score, rating: rate(score) });
  }

  function analyze(a, o) {
    const h = a.horoscope(o.year + "-6-30 12:00");
    const dec = h.decadal, yr = h.yearly;
    const starPos = {};
    a.palaces.forEach((p, i) => p.majorStars.concat(p.minorStars).forEach((s) => { starPos[s.name] = i; }));
    const muts = [];
    a.palaces.forEach((p, i) => p.majorStars.concat(p.minorStars).forEach((s) => { if (s.mutagen) muts.push({ star: s.name, mut: s.mutagen, layer: "natal", idx: i }); }));
    muts.sort((x, y) => MUTS.indexOf(x.mut) - MUTS.indexOf(y.mut));
    dec.mutagen.forEach((star, k) => muts.push({ star, mut: MUTS[k], layer: "decadal", idx: starPos[star] }));
    yr.mutagen.forEach((star, k) => muts.push({ star, mut: MUTS[k], layer: "yearly", idx: starPos[star] }));

    const raw = a.palaces.map((p, i) => ({
      i, p, branch: p.earthlyBranch, stem: p.heavenlyStem, natalName: p.name,
      decName: dec.palaceNames[i], yrName: yr.palaceNames[i],
      allHere: muts.filter((m) => m.idx === i),
      allClash: muts.filter((m) => m.mut === "忌" && m.idx === (i + 6) % 12),
      allFlow: (dec.stars && dec.stars[i] || []).map((s) => s.name).concat((yr.stars && yr.stars[i] || []).map((s) => s.name)),
      oppStars: a.palaces[(i + 6) % 12].majorStars.map((s) => s.name)
    }));
    const pals = raw.map((r) => view(r, "yearly"));

    // 流月：斗君（流年支起正月逆數至生月，再順數至生時）
    const dou = ((ZHI.indexOf(yr.earthlyBranch) - (o.lunarMonth - 1) + o.tIdx) % 12 + 12) % 12;
    const months = [];
    const leap = LunarYear.fromYear(o.year).getLeapMonth();
    for (let m = 1; m <= 12; m++) {
      const start = Lunar.fromYmd(o.year, m, 1).getSolar();
      const next = m === 12 ? Lunar.fromYmd(o.year + 1, 1, 1).getSolar() : Lunar.fromYmd(o.year, m + 1, 1).getSolar();
      const endDate = new Date(next.getYear(), next.getMonth() - 1, next.getDay() - 1);
      const branch = ZHI[(dou + m - 1) % 12];
      months.push({
        m, leap: leap === m, branch, pal: pals.find((x) => x.branch === branch),
        range: start.getMonth() + "/" + start.getDay() + "–" + (endDate.getMonth() + 1) + "/" + endDate.getDate()
      });
    }
    const soulIdx = a.palaces.findIndex((p) => p.name === "命宮");
    const bodyIdx = a.palaces.findIndex((p) => p.isBodyPalace);
    return { a, o, h, dec, yr, raw, pals, muts, months, dou: ZHI[dou], soulIdx, bodyIdx, ganzhi: yr.heavenlyStem + yr.earthlyBranch };
  }

  // ---------- 文字組合 ----------
  const mutTag = (m) => LAYER_LABEL[m.layer] + m.mut;
  // 星曜清單：主星（亮度＋各層四化）、重要輔星、流曜（只列該層級看得到的）
  function starsText(x) {
    const tags = (name) => x.here.filter((m) => m.star === name).map((m) => " " + mutTag(m)).join("");
    const parts = x.p.majorStars.map((s) => s.name + bright(s) + tags(s.name));
    if (!x.p.majorStars.length) parts.push("空宮");
    x.p.minorStars.forEach((s) => {
      const t = tags(s.name);
      if (t || LUCKY[s.name] !== undefined || SHA[s.name] !== undefined || s.name === "天馬") parts.push(s.name + t);
    });
    x.flow.forEach((n) => { if (n !== "年解" && n.slice(1) !== "喜" && n.slice(1) !== "鸞") parts.push(n); });
    return parts.join("、");
  }
  // 一句話重點：先看本層四化（忌＞祿＞對宮沖忌），再看下層四化，最後看煞吉星與總分
  function phrase(x, name) {
    const d = PAL[name];
    const cur = x.level;
    const at = (mut, lower) => x.here.some((m) => m.mut === mut && (lower ? m.layer !== cur : m.layer === cur));
    const anyLu = x.here.some((m) => m.mut === "祿") || x.lucky.some((n) => flowBase(n) === "祿存");
    const clashAny = x.clash.length > 0;
    const withClash = (t) => (clashAny ? t + "；但" + d.chong : t);
    if (at("忌") && anyLu) return "祿忌同宮，先是非後得利：" + d.lu + "，但" + d.ji;
    if (at("忌")) return d.ji;
    if (at("祿")) return withClash(d.lu);
    if (x.clash.some((m) => m.layer === cur)) return anyLu ? d.lu + "；但" + d.chong : d.chong;
    if (at("忌", true)) return d.ji;
    if (at("權")) return withClash(d.quan);
    if (at("科")) return withClash(d.ke);
    if (at("祿", true)) return withClash(d.lu);
    if (at("權", true)) return withClash(d.quan);
    if (at("科", true)) return withClash(d.ke);
    if (clashAny) return d.chong;
    if (x.sha.length >= 2) return d.sha;
    if (x.score >= 1.5) return d.good;
    return d.calm;
  }
  function bulletsFor(x, name) {
    const out = [];
    const dom = PAL[name].domain;
    if (x.p.majorStars.length) {
      x.p.majorStars.forEach((s) => {
        const st = STAR[s.name];
        if (st) out.push("<b>" + s.name + bright(s) + "：</b>" + st.trait + (dom !== "trait" ? "；" + st[dom] + "。" : "。"));
      });
    } else {
      out.push("<b>空宮：</b>本宮無主星，借對宮" + (x.oppStars.length ? x.oppStars.join("、") : "星曜") + "論，受外在環境影響較大。");
    }
    x.here.forEach((m) => {
      out.push("<b>" + LAYER_LABEL[m.layer] + m.star + "化" + m.mut + "：</b>" + PAL[name][MUT_KEY[m.mut]] + "。");
    });
    x.clash.forEach((m) => {
      out.push("<b>對宮有" + LAYER_LABEL[m.layer] + m.star + "化忌沖入：</b>" + PAL[name].chong + "。");
    });
    const luckyDesc = uniq(x.lucky.map((n) => n + "（" + MINOR[flowBase(n)] + "）"));
    const shaDesc = uniq(x.sha.map((n) => n + "（" + MINOR[flowBase(n)] + "）"));
    if (luckyDesc.length) out.push("<b>吉星：</b>" + luckyDesc.join("、") + "。");
    if (shaDesc.length) out.push("<b>煞星：</b>" + shaDesc.join("、") + "。");
    return out;
  }
  const uniq = (arr) => arr.filter((v, i) => arr.indexOf(v) === i);

  // ---------- DOM ----------
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  const h1 = (num, text) => '<div class="zr-h1"><span class="zr-num">' + num + "</span>" + esc(text) + "</div>";
  const h2 = (text) => '<div class="zr-h2">' + esc(text) + "</div>";
  const callout = (html) => '<div class="zr-callout">' + html + "</div>";
  const ul = (items, cls) => '<ul class="' + (cls || "zr-list") + '">' + items.map((t) => "<li>" + t + "</li>").join("") + "</ul>";
  const ol = (items) => '<ol class="zr-olist">' + items.map((t) => "<li>" + t + "</li>").join("") + "</ol>";
  const RATING_CLS = { 大吉: "zr-r-great", 吉: "zr-r-good", 平: "zr-r-flat", 注意: "zr-r-warn" };
  function table(cols, rows, opt) {
    opt = opt || {};
    const head = "<tr>" + cols.map((c) => '<th style="width:' + c[1] + '%">' + esc(c[0]) + "</th>").join("") + "</tr>";
    const body = rows.map((r) => "<tr>" + r.map((v, i) => {
      if (opt.rating && i === r.length - 1) return '<td class="zr-rate ' + RATING_CLS[v] + '">' + v + "</td>";
      return "<td" + (i === 0 ? ' class="zr-first' + (opt.darkFirst ? " zr-first-dark" : "") + '"' : "") + ">" + v + "</td>";
    }).join("") + "</tr>").join("");
    return '<table class="zr-table"><thead>' + head + "</thead><tbody>" + body + "</tbody></table>";
  }

  function render(R, charts) {
    const a = R.a, o = R.o, dec = R.dec, yr = R.yr, P = R.pals;
    const root = el("div", "zr-report");
    // 每個區塊是 PDF 分頁的最小單位；pageBreak＝強制新頁（比照範本「十二宮總表」另起一頁）
    const add = (html, pageBreak) => {
      const b = el("div", "zr-block", html);
      if (pageBreak) b.setAttribute("data-pdf-break-before", "");
      root.appendChild(b);
      return b;
    };
    const byYr = (name) => P.find((x) => x.yrName === name);
    const byDec = (name) => view(R.raw.find((x) => x.decName === name), "decadal");
    const byNatal = (name) => view(R.raw.find((x) => x.natalName === name), "natal");
    const soulN = view(R.raw[R.soulIdx], "natal"), bodyN = view(R.raw[R.bodyIdx], "natal");
    const picks = o.picks;
    const genderText = o.gender === "male" ? "男" : "女";
    const yinYang = "甲丙戊庚壬".indexOf(a.chineseDate.charAt(0)) >= 0 ? "陽" : "陰";
    const natalMuts = R.muts.filter((m) => m.layer === "natal");
    const decMuts = R.muts.filter((m) => m.layer === "decadal");
    const yrMuts = R.muts.filter((m) => m.layer === "yearly");
    const mutWhere = (m) => m.star + m.mut + "（" + P[m.idx].branch + "·" + P[m.idx].natalName + "）";
    const yrSoul = byYr("命宮"), decSoul = byDec("命宮");
    const nominalAge = R.h.age && R.h.age.nominalAge;

    // 封面
    add('<div class="zr-kicker">紫微斗數　·　</div>' +
      '<div class="zr-title">' + o.year + " " + R.ganzhi + " 流年分析報告</div>" +
      '<div class="zr-sub"><b>' + esc(o.name) + "</b>　｜　" + yinYang + genderText + "・" + a.fiveElementsClass + "・命宮" + soulN.stem + soulN.branch + "・身宮" + bodyN.stem + bodyN.branch + "</div>" +
      '<div class="zr-rule"></div>' +
      '<div class="zr-cards">' + picks.map((name) => {
        const x = byYr(name);
        return '<div class="zr-card"><div class="zr-card-label">' + name + " · " + o.year + '</div><div class="zr-card-big">' + RATING_BIG[x.rating] +
          '</div><div class="zr-card-desc">' + esc(phrase(x, name)) + "</div></div>";
      }).join("") + "</div>");

    // 01 命盤基本資料
    let n = 1;
    const num = () => pad2(n++);
    const b = o.birth;
    add(h1(num(), "命盤基本資料") + callout(
      "目前大限「" + dec.heavenlyStem + dec.earthlyBranch + "限（" + decSoul.p.decadal.range[0] + "–" + decSoul.p.decadal.range[1] + " 歲）」，大限命宮落在本命" + decSoul.natalName +
      "；" + o.year + " 年流年命宮在" + yrSoul.branch + "，即本命" + yrSoul.natalName + "、大限" + yrSoul.decName + "。本報告依這三層盤面疊合，分析全年運勢與" + picks.join("、") + "。"));
    add(table([["項目", 19], ["內容", 81]], [
      ["出生", "公元 " + b.y + "-" + pad2(b.mo) + "-" + pad2(b.d) + " " + pad2(b.h) + ":" + pad2(b.mi) + "（農曆" + esc(o.lunarText) + " " + a.time + "），" + yinYang + genderText + "，肖" + a.zodiac],
      ["命局", a.fiveElementsClass + "；命主" + a.soul + "、身主" + a.body],
      ["命宮 / 身宮", "命宮 " + soulN.stem + soulN.branch + "（" + (soulN.p.majorStars.map((s) => s.name).join("、") || "空宮") + "）；身宮 " + bodyN.stem + bodyN.branch + "，與" + bodyN.natalName + "同宮"],
      ["生年四化（" + a.chineseDate.charAt(0) + "）", natalMuts.map(mutWhere).join("、")],
      ["現行大限", dec.heavenlyStem + dec.earthlyBranch + " " + decSoul.p.decadal.range[0] + "–" + decSoul.p.decadal.range[1] + " 歲，大限四化：" + decMuts.map((m) => m.star + m.mut).join("、")],
      [o.year + " 流年", R.ganzhi + (nominalAge ? "，虛 " + nominalAge + " 歲" : "") + "；流年命宮在" + yrSoul.branch + "（本命" + yrSoul.natalName + "）；流年四化：" + yrMuts.map((m) => m.star + m.mut).join("、")]
    ], { darkFirst: true }));
    (charts || []).forEach((c, k) => {
      add((k === 0 ? h2("命盤圖") : "") + '<div class="zr-fig"><img src="' + c.src + '"><div class="zr-cap">' + esc(c.caption) + "</div></div>");
    });

    // 02 本命盤核心格局
    const soulStars = soulN.p.majorStars;
    add(h1(num(), "本命盤核心格局") + callout(
      "命宮" + soulN.stem + soulN.branch + (soulStars.length ? "坐" + soulStars.map((s) => s.name + bright(s)).join("、") + "，" + STAR[soulStars[0].name].trait : "無主星，借對宮" + soulN.oppStars.join("、") + "論") +
      "；身宮落" + bodyN.natalName + "，" + (BODY_IN[bodyN.natalName] || "") + "。"));
    const natalBullets = ["<b>命宮 " + soulN.stem + soulN.branch + "：" + esc(starsText(soulN)) + "。</b> " +
      bulletsFor(soulN, "命宮").filter((t) => t.indexOf("化") < 0).map((t) => t.replace(/<\/?b>/g, "")).join(" ")];
    natalBullets.push("<b>身宮 " + bodyN.stem + bodyN.branch + "（" + bodyN.natalName + "）：" + esc(starsText(bodyN)) + "。</b> " + (BODY_IN[bodyN.natalName] || "") + "。");
    natalMuts.forEach((m) => {
      const x = P[m.idx];
      natalBullets.push("<b>生年" + m.star + "化" + m.mut + "入" + x.natalName + "（" + x.branch + "）：</b>" + PAL[x.natalName][MUT_KEY[m.mut]] + "，這是一生的" + (m.mut === "忌" ? "功課" : "優勢") + "所在。");
    });
    add(ul(natalBullets));

    // 03 大限總論
    const decRange = decSoul.p.decadal.range[0] + "–" + decSoul.p.decadal.range[1];
    add(h1(num(), "大限" + dec.heavenlyStem + dec.earthlyBranch + "（" + decRange + " 歲）總論") + callout(
      "大限命宮在" + decSoul.branch + "（本命" + decSoul.natalName + "），" + esc(starsText(decSoul)) + "。這十年的主軸是「" + phrase(decSoul, "命宮") + "」；" +
      "大限化忌在" + decMuts.filter((m) => m.mut === "忌").map((m) => "限" + P[m.idx].decName + "（本命" + P[m.idx].natalName + "）").join("") + "，是這十年最需要經營的地方。"));
    add(table([["大限宮位", 12], ["宮支（本命宮）", 16], ["主要星曜", 34], ["解讀", 38]],
      ["命宮", "財帛", "官祿", "遷移", "疾厄", "夫妻"].map((name) => {
        const x = byDec(name);
        return ["限" + (name === "命宮" ? "命" : name), x.branch + "（" + x.natalName + "）", esc(starsText(x)), esc(phrase(x, name))];
      })));
    add(h2("大限四化重點") + ul(decMuts.map((m) => {
      const x = P[m.idx];
      return "大限" + m.star + "化" + m.mut + "入限" + x.decName + "（本命" + x.natalName + "）：" + PAL[x.decName][MUT_KEY[m.mut]] + "。";
    })));

    // 04 十二宮總表
    const best = P.slice().sort((p, q) => q.score - p.score)[0], worst = P.slice().sort((p, q) => p.score - q.score)[0];
    add(h1(num(), "流年十二宮總表") + callout(
      o.year + " 年流年命宮在" + yrSoul.branch + "（本命" + yrSoul.natalName + "、大限" + yrSoul.decName + "），" + esc(starsText(yrSoul)) + "，全年主軸是「" + phrase(yrSoul, "命宮") + "」。" +
      "最有利的是年" + best.yrName + "（" + best.branch + "），最需留意的是年" + worst.yrName + "（" + worst.branch + "）。"), true);
    const order = [];
    for (let k = 0; k < 12; k++) order.push(P[(soulN.i - k + 12) % 12]);
    add(table([["宮支", 7], ["本命宮位·主星", 19], ["大限", 10], [o.year + " " + R.ganzhi + " 流年", 55], ["評估", 9]],
      order.map((x) => [x.branch, x.natalName + "·" + (x.p.majorStars.map((s) => s.name).join("、") || "空宮"), "限" + x.decName,
        (picks.indexOf(x.yrName) >= 0 || x.yrName === "命宮" ? "<b>" + x.yrName + "</b>" : x.yrName) + "：" + esc(starsText(x)) + "。" + esc(phrase(x, x.yrName)), x.rating]),
      { rating: true }));
    add('<div class="zr-note">粗體為流年命宮與本報告選定的重點宮位。評估綜合主星亮度、生年／大限／流年四化、對宮化忌與煞吉星。</div>');

    // 任選三宮專章
    picks.forEach((name) => {
      const nx = byNatal(name), dx = byDec(name), yx = byYr(name);
      add(h1(num(), name + "專章") + callout(
        o.year + " 年的" + name + "評估為「" + yx.rating + "」：流年" + name + "在" + yx.branch + "（本命" + yx.natalName + "、大限" + yx.decName + "），" + phrase(yx, name) + "。" +
        "本命" + name + "看先天傾向，大限" + name + "看這十年，流年" + name + "看今年的應事。"));
      add(h2("本命" + name + "：" + nx.stem + nx.branch + "，" + starsText(nx)) +
        ul(bulletsFor(nx, name)));
      add(h2("大限" + name + "：" + dx.branch + "（本命" + dx.natalName + "），" + starsText(dx)) +
        ul(bulletsFor(dx, name)));
      add(h2(o.year + " " + R.ganzhi + "：流年" + name + "在" + yx.branch + "（本命" + yx.natalName + "），" + starsText(yx)) + ul(bulletsFor(yx, name)));
      if (name === "疾厄") {
        // 同一宮支只列一次（例如流年疾厄剛好落在本命命宮）
        const rows = [["本命疾厄 " + nx.stem + nx.branch, nx], ["大限疾厄 " + dx.branch, dx], ["流年疾厄 " + yx.branch, yx], ["命宮 " + soulN.stem + soulN.branch, soulN]]
          .filter(([, x], k, arr) => arr.findIndex(([, y]) => y.branch === x.branch) === k).map(([label, x]) => {
          const stars = x.p.majorStars.map((s) => s.name);
          const shaNames = uniq(x.sha.map(flowBase).concat(x.p.minorStars.map((s) => s.name).filter((nm) => MINOR_HEALTH[nm])));
          const desc = stars.map((s) => STAR[s].health + "（" + s + "）").concat(shaNames.filter((s) => MINOR_HEALTH[s]).map((s) => MINOR_HEALTH[s] + "（" + s + "）"));
          return [label, stars.join("、") || "空宮", desc.join("；") || "—"];
        });
        add(h2("身體系統對照") + table([["宮位", 20], ["主星", 18], ["傳統對應的留意方向", 62]], rows, { darkFirst: true }));
      }
      const hasJi = yx.here.some((m) => m.mut === "忌") || yx.clash.some((m) => m.layer === "yearly");
      const hasLu = yx.here.some((m) => m.mut === "祿");
      const adv = PAL[name].advice.slice();
      if (hasJi) adv.unshift(PAL[name].adviceJi);
      if (hasLu) adv.unshift(PAL[name].adviceLu);
      add(h2(name + "建議") + ol(adv));
      if (name === "財帛") add('<div class="zr-note">本報告不構成投資建議，實際的資產配置請以自身財務狀況為準，必要時請教持牌的理財專業人士。</div>');
      if (name === "疾厄") add('<div class="zr-note">以上為命理上提示的留意方向，不是醫學診斷；身體有任何不適，請以醫師評估為準。</div>');
    });

    // 流月重點
    const ms = R.months.slice();
    const top = ms.slice().sort((p, q) => q.pal.score - p.pal.score).slice(0, 2).sort((p, q) => p.m - q.m);
    const low = ms.slice().sort((p, q) => p.pal.score - q.pal.score).slice(0, 2).sort((p, q) => p.m - q.m);
    const MN = ["正", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"];
    add(h1(num(), "流月重點") + callout(
      "全年最強的月份是農曆" + top.map((x) => MN[x.m - 1] + "月").join("、") + "，最需保守的是" + low.map((x) => MN[x.m - 1] + "月").join("、") + "。流月以斗君起算（" + o.year + " 斗君在" + R.dou + "），國曆日期由農曆換算。"));
    add(table([["農曆月", 12], ["國曆", 15], ["流月宮位", 20], ["重點", 44], ["評估", 9]],
      ms.map((x) => [o.year + " " + MN[x.m - 1] + "月" + (x.leap ? "<br>（含閏月）" : ""), x.range, x.branch + "（本命" + x.pal.natalName + "、年" + x.pal.yrName + "）",
        esc(starsText(x.pal).split("、").slice(0, 4).join("、")) + "：" + esc(phrase(x.pal, x.pal.yrName)), x.pal.rating]), { rating: true }));

    // 總結與行動清單
    add(h1(num(), "總結與行動清單") + callout(
      o.year + " 年整體主軸：「" + phrase(yrSoul, "命宮") + "」。" + picks.map((name) => name + "「" + byYr(name).rating + "」").join("、") + "；把握" + top.map((x) => MN[x.m - 1] + "月").join("、") + "，" + low.map((x) => MN[x.m - 1] + "月").join("、") + "保守行事。"));
    add(table([["面向", 14], ["評估", 10], ["重點", 76]], picks.map((name) => {
      const x = byYr(name);
      return [name, x.rating, "<b>" + RATING_BIG[x.rating] + "：</b>" + esc(phrase(x, name))];
    }).concat([["關鍵月份", "—", "有利：" + top.map((x) => MN[x.m - 1] + "月（" + x.range + "）").join("、") + "；保守：" + low.map((x) => MN[x.m - 1] + "月（" + x.range + "）").join("、")]])));
    const todo = picks.map((name) => {
      const x = byYr(name);
      const hasJi = x.here.some((m) => m.mut === "忌") || x.clash.some((m) => m.layer === "yearly");
      return name + "：" + (hasJi ? PAL[name].adviceJi : x.here.some((m) => m.mut === "祿") ? PAL[name].adviceLu : PAL[name].advice[0]);
    });
    if (yrSoul.sha.length >= 2 || byYr("遷移").here.some((m) => m.layer === "yearly" && m.mut === "忌")) todo.push("外出交通放慢速度，避免衝動決定與高風險活動");
    todo.push("每季回顧一次本報告的流月提醒，提前安排重要計畫");
    add(ul(todo, "zr-check"));
    add(h2("說明") + ul([
      "紫微斗數是傳統文化的詮釋工具，適合用來自我反思與規劃；健康請以醫師診斷為準，理財請以自身財務狀況與專業意見為準。"
    ]) + '<div class="zr-end">Aries 命理工作室　·　' + new Date().getFullYear() + "/" + (new Date().getMonth() + 1) + "/" + new Date().getDate() + " 產生</div>");
    return root;
  }

  window.ZiweiReport = { PALACES, DEFAULT_PICKS, analyze, render };
})();
