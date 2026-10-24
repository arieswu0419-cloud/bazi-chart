// ================= 八字「轉流年PDF分析報告」=================
// 依 bazi-engine.js 的排盤結果（app.js 的 currentChart）組出指定流年的分析報告 DOM，再由 app.js 逐區塊轉成 PDF。
// 版面沿用紫微流年報告的 zr-* 樣式（深紅 #650707 主色、01–12 章節）。
// 解讀為規則式組合：日主強弱定喜忌 → 流年／大運干支的喜忌與十神 → 與原局、大運的合沖刑害 → 各面向評分與文字。
// 評分只用來排「大吉／吉／平／注意」，文字一律以喜忌與合沖刑害為依據，不憑空推論。
(function () {
  const GANS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  const ELEMS = ["木", "火", "土", "金", "水"];
  const GENERATED_BY = {}, CONTROLLED_BY = {};
  ELEMS.forEach((e) => { GENERATED_BY[GENERATES[e]] = e; CONTROLLED_BY[CONTROLS[e]] = e; });
  const SS_CAT = { 比肩: "比劫", 劫財: "比劫", 食神: "食傷", 傷官: "食傷", 正財: "財", 偏財: "財", 正官: "官殺", 七殺: "官殺", 正印: "印", 偏印: "印" };
  const ROLE_FAV = { 用神: 2, 喜神: 1, 閒神: 0, 仇神: -1, 忌神: -2 };
  const ROLE_ORDER = ["用神", "喜神", "閒神", "仇神", "忌神"];
  const ROLE_DESC = {
    用神: "最需要的五行，大運流年遇到時運勢最順", 喜神: "生助用神，次要的助力", 閒神: "影響偏中性",
    仇神: "助長忌神，次要的阻力", 忌神: "已經過多或最傷日主，遇到時壓力最大"
  };
  const GAN_CHONG = [["甲", "庚"], ["乙", "辛"], ["丙", "壬"], ["丁", "癸"]];
  const ZHI_HAI = [["子", "未"], ["丑", "午"], ["寅", "巳"], ["卯", "辰"], ["申", "亥"], ["酉", "戌"]];
  const SAN_XING = ["寅巳申", "丑戌未"];
  const ZI_XING = "辰午酉亥";
  const TAOHUA = { 申子辰: "酉", 寅午戌: "卯", 巳酉丑: "午", 亥卯未: "子" };
  const YIMA = { 申子辰: "寅", 寅午戌: "申", 巳酉丑: "亥", 亥卯未: "巳" };
  const NAYIN = ["海中金", "爐中火", "大林木", "路旁土", "劍鋒金", "山頭火", "澗下水", "城頭土", "白蠟金", "楊柳木",
    "泉中水", "屋上土", "霹靂火", "松柏木", "長流水", "沙中金", "山下火", "平地木", "壁上土", "金箔金",
    "覆燈火", "天河水", "大驛土", "釵釧金", "桑柘木", "大溪水", "沙中土", "天上火", "石榴木", "大海水"];
  const PILLAR_MEANING = { 年: "長輩、祖業與早年根基", 月: "父母、工作環境與兄弟", 日: "自身與配偶（夫妻宮）", 時: "子女、晚輩與部屬", 大運: "現行大運", 流年: "流年" };
  const PALACE_ROW = { 年: "祖上、長輩", 月: "父母、工作環境", 日: "自身、配偶", 時: "子女、晚年" };
  const DAY_TRAIT = {
    甲: "參天大樹，正直有擔當、目標明確，但較固執、不易轉彎", 乙: "花草藤蘿，柔韌靈活、善於協調，懂得借力使力",
    丙: "太陽之火，熱情大方、樂於付出，好面子、情緒來得快", 丁: "燈燭之火，細膩溫暖、思慮周到，內心較敏感",
    戊: "高山厚土，穩重可靠、包容力強，步調偏慢", 己: "田園之土，務實細心、重視家庭，善於照顧與培育他人",
    庚: "刀劍之金，果斷剛毅、重義氣，說話直接", 辛: "珠玉之金，精緻講究、重品味與面子，自尊心強",
    壬: "江河之水，聰明靈活、眼界大，行動力強但不易定性", 癸: "雨露之水，敏銳內斂、善於觀察，想像力豐富"
  };
  const ORGAN = { 木: "肝膽、筋骨、神經", 火: "心血管、血壓、眼睛、睡眠", 土: "脾胃、消化、肌肉", 金: "肺、呼吸道、皮膚、大腸", 水: "腎、泌尿、生殖、內分泌" };
  const HEALTH_TIP = {
    木: "多伸展放鬆筋骨，少熬夜", 火: "控制血壓與情緒，睡眠要足", 土: "三餐定時，少生冷油膩",
    金: "秋冬防感冒過敏，皮膚保濕", 水: "多喝水、少憋尿，腰腹保暖"
  };
  const LUCK = {
    color: { 木: "綠、青", 火: "紅、紫、橙", 土: "黃、咖啡、米色", 金: "白、金、銀", 水: "黑、深藍、灰" },
    dir: { 木: "東方", 火: "南方", 土: "西南、東北", 金: "西方", 水: "北方" },
    num: { 木: "3、8", 火: "2、7", 土: "5、0", 金: "4、9", 水: "1、6" },
    habit: { 木: "養植物、閱讀進修、戶外健行", 火: "曬太陽、運動流汗、多參與社交", 土: "規律作息、園藝、穩定儲蓄", 金: "整理收納、配戴金屬飾品、肌力訓練", 水: "游泳、近水散步、充足睡眠" },
    work: { 木: "教育、文化出版、設計、醫藥、服飾", 火: "傳媒、科技電子、餐飲、美業、能源", 土: "不動產、營建、農業、倉儲、顧問", 金: "金融、機械、法務、科技硬體、珠寶", 水: "物流、貿易、資訊流通、旅遊、水產" }
  };

  // 各十神類別在各面向的解讀：[為忌時, 為喜用時]
  const CAT_TEXT = {
    比劫: {
      career: ["同儕競爭變多，功勞容易被分走", "人脈與團隊力量增強，適合合作推動大型專案"],
      wealth: ["比劫奪財，人情、合夥或衝動消費造成支出", "朋友手足帶來資源，合作可分得利益"],
      family: ["朋友、手足、同事往來頻繁，要防金錢糾紛", "朋友手足是今年的助力"]
    },
    食傷: {
      career: ["想法多、不服管，容易與上司意見衝突或想換跑道", "才華與表現被看見，利於技術、創作、業務與對外發表"],
      wealth: ["為了表現與投資自己花錢，收入不一定同步", "食傷生財，靠專業、作品與口碑增加收入"],
      family: ["晚輩、下屬或子女的事情需要多費心", "與晚輩、下屬或子女互動愉快"]
    },
    財: {
      career: ["業績與目標壓力大，容易為了錢疲於奔命", "工作以實質報酬為導向，有業績與獎金"],
      wealth: ["財多身弱，錢來得急也去得快，避免擴張與槓桿", "財星得用，收入與進財機會增加"],
      family: ["家庭開銷與父親方面的事務增加", "家中經濟穩定，有餘力照顧家人"]
    },
    官殺: {
      career: ["規範與壓力加重，上司要求多，防職場是非與小人", "官殺主職位與責任，利升遷、考核與承擔管理職"],
      wealth: ["為工作與責任花費，罰款規費等非自願支出增加", "職位提升帶動收入"],
      family: ["責任壓身，與家人相處時間變少", "家人以你為榮，責任中帶來成就"]
    },
    印: {
      career: ["思慮多、行動慢，容易錯失時機或過度依賴他人", "貴人、上司提攜，利考試、證照、進修與文書"],
      wealth: ["印星剋食傷，不利直接求財，學習與居住方面花費多", "收入穩定，適合長期投資自己與規劃置產"],
      family: ["長輩意見多，與母親或長輩相處需要耐心", "長輩照顧、家中有依靠"]
    }
  };
  const LOVE_TEXT = {
    female: {
      官殺: ["官殺為夫星而為忌，容易遇到強勢、帶來壓力的對象，或伴侶事務令人操心", "官殺為夫星，感情事件增加：單身者易遇合適對象，已婚者伴侶事業有進展"],
      食傷: ["食傷剋官殺，對伴侶要求多、說話直，容易口角", "表達力強，感情中懂得表現自己，但說話仍要留餘地"],
      比劫: ["比劫重，感情像朋友，各忙各的，需防第三者介入", "與伴侶像朋友般相處，互相支持"],
      財: ["財生官殺，為家庭與伴侶花錢，感情壓力來自現實面", "財生官殺，經濟穩定帶動感情穩定"],
      印: ["印星重，心思放在自己與家庭，感情步調較慢", "感情平穩踏實，重視家庭"]
    },
    male: {
      財: ["財為妻星而為忌，感情易有金錢或家庭現實壓力", "財為妻星，異性緣增加：單身者有好對象，已婚者重視家庭"],
      比劫: ["比劫奪財（妻星），感情易有競爭者，或因朋友影響感情", "朋友圈帶來異性緣，但要分清楚友情與感情"],
      食傷: ["食傷生財，願意為感情付出，但要防一時衝動", "食傷生財，懂得表達心意，感情加溫"],
      官殺: ["責任與壓力分散了陪伴伴侶的時間", "事業有成帶動感情穩定"],
      印: ["印剋食傷，表達較含蓄，感情步調慢", "感情平穩踏實，重視家庭"]
    }
  };
  const SUMMARY = {
    career: { 大吉: "職位與表現雙雙提升，適合主動爭取", 吉: "工作推進順利，有表現機會", 平: "工作平穩，按部就班累積", 注意: "壓力與變動多，宜低調守成" },
    wealth: { 大吉: "進財機會多，適合累積資產", 吉: "收入穩中有升", 平: "收支平衡，量入為出", 注意: "支出與破耗多，宜保守理財" },
    love: { 大吉: "感情有喜，利定情與修復關係", 吉: "感情升溫、互動良好", 平: "感情平穩，多花時間經營", 注意: "伴侶間易有摩擦，需要耐心溝通" },
    health: { 大吉: "精神體力佳", 吉: "身體大致穩定", 平: "注意作息，定期保養", 注意: "健康要優先顧好，定期檢查" },
    family: { 大吉: "家運興旺、貴人多", 吉: "家庭和睦、人緣佳", 平: "家庭人際平順", 注意: "家中與人際事務多，凡事多溝通" }
  };
  const KEYWORD = {
    career: { 大吉: "事業突破", 吉: "工作順利", 平: "穩定守成", 注意: "職場防守" },
    wealth: { 大吉: "財源廣進", 吉: "收入增加", 平: "收支平衡", 注意: "守財防損" },
    love: { 大吉: "感情喜事", 吉: "感情升溫", 平: "感情平穩", 注意: "伴侶磨合" },
    health: { 大吉: "精神飽滿", 吉: "體力穩定", 平: "規律保養", 注意: "健康優先" }
  };
  const ADVICE = {
    career: { good: ["主動爭取升遷、新專案或轉職機會", "整理工作成果與數據，為考核做準備"], bad: ["守住本分，重要決定與溝通留下書面紀錄", "少在公開場合批評上司或同事"], all: ["選定一項證照或進修課程強化專業"] },
    wealth: { good: ["把握進帳時機，獎金先存下來", "以長期、分散、看得懂的方式配置資產"], bad: ["不借錢給人、不作保、不衝動投資", "預留至少 6 個月生活費的預備金"], all: ["每月固定檢視收支，先存後花"] },
    love: { good: ["單身者多參加社交場合，有伴者適合規劃共同目標"], bad: ["固定安排兩人相處的時間，情緒上來先暫停", "重要事情當面溝通，不靠訊息"], all: ["多傾聽，少用要求的語氣"] },
    health: { good: ["趁狀況好時建立規律運動習慣"], bad: ["安排一次完整健康檢查", "開車、運動放慢速度，減少高風險活動"], all: ["固定睡眠時間，避免長期熬夜"] },
    family: { good: ["多陪伴家人，善用長輩與貴人的資源"], bad: ["與親友的金錢往來保持清楚", "多關心長輩健康"], all: ["人際往來說話留餘地"] }
  };
  const MONTH_PHRASE = {
    比劫: ["競爭多，防合夥與金錢糾紛", "人脈助力強，適合合作"], 食傷: ["想法多易衝動，說話留餘地", "表現佳，適合提案與發表"],
    財: ["支出多、壓力大，守住預算", "財運旺，適合談薪與收款"], 官殺: ["壓力與責任加重，低調守成", "利升遷考核，被賦予重任"],
    印: ["思慮多、行動慢，避免鑽牛角尖", "貴人相助，利學習與文書"]
  };
  const RATING_BIG = { 大吉: "旺", 吉: "順", 平: "穩", 注意: "防" };
  const DOMAIN_NAME = { career: "事業", wealth: "財運", love: "感情", health: "健康", family: "家庭人際" };
  const DOMAIN_LUCK = { career: "事業運", wealth: "財運", love: "感情運", health: "健康運", family: "家庭人際運" };

  // ---------- 小工具 ----------
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const pad2 = (n) => String(n).padStart(2, "0");
  const uniq = (arr) => arr.filter((v, i) => arr.indexOf(v) === i);
  const md = (d) => (d.getMonth() + 1) + "/" + d.getDate();
  const round1 = (x) => Math.round(x * 10) / 10;
  // 門檻依 8 組命盤 × 2026–2035 的分數分布校正：大吉約前一成、吉約前三成、注意約後兩成五
  function rate(score) { return score >= 1.1 ? "大吉" : score >= 0.4 ? "吉" : score >= -0.9 ? "平" : "注意"; }
  function jiaziIdx(gan, zhi) { for (let i = 0; i < 60; i++) if (GANS[i % 10] === gan && ZHI_ORDER[i % 12] === zhi) return i; return -1; }
  const nayin = (gan, zhi) => NAYIN[Math.floor(jiaziIdx(gan, zhi) / 2)] || "";
  const yearGanZhi = (y) => GANS[((y - 4) % 10 + 10) % 10] + ZHI_ORDER[((y - 4) % 12 + 12) % 12];
  const triadOf = (z) => Object.keys(ZHI_SANHE).find((k) => k.indexOf(z) >= 0);
  const pairHit = (list, a, b) => list.some((p) => (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a));

  // ---------- 原局：日主強弱與喜忌 ----------
  // 力量計分：天干每字 1（日主本身不計），地支藏干本氣／中氣／餘氣依 0.6／0.2／0.2（雙藏干 0.6／0.4），月令加倍（得令）。
  // 同類（比劫＋印）占比 ≥ 50% 為身強；身強時印重取財破印、比劫重取官殺制身；身弱時看最旺的異類決定取印或比劫。
  function analyzeNatal(chart) {
    const D = WUXING_OF_GAN[chart.dayGan];
    const ce = { 比劫: D, 食傷: GENERATES[D], 財: CONTROLS[D], 官殺: CONTROLLED_BY[D], 印: GENERATED_BY[D] };
    const catOfElem = {};
    Object.keys(ce).forEach((k) => { catOfElem[ce[k]] = k; });
    const w = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
    chart.pillars.forEach((p) => {
      if (p.label !== "日柱") w[p.gan.wuxing] += 1;
      const ws = { 1: [1], 2: [0.6, 0.4], 3: [0.6, 0.2, 0.2] }[p.hideGans.length];
      const mul = p.label === "月柱" ? 2 : 1;
      p.hideGans.forEach((h, i) => { w[h.wuxing] += ws[i] * mul; });
    });
    const total = ELEMS.reduce((s, e) => s + w[e], 0);
    const pct = {};
    ELEMS.forEach((e) => { pct[e] = Math.round(w[e] / total * 100); });
    const ratio = (w[ce.比劫] + w[ce.印]) / total;
    const strong = ratio >= 0.5;
    const level = ratio >= 0.6 ? "身強" : ratio >= 0.5 ? "偏強" : ratio >= 0.4 ? "偏弱" : "身弱";
    let roleCat, reason;
    if (strong) {
      if (w[ce.印] > w[ce.比劫]) {
        roleCat = { 用神: "財", 喜神: "食傷", 閒神: "官殺", 忌神: "印", 仇神: "比劫" };
        reason = "印星過旺，取財星破印、食傷洩秀";
      } else {
        roleCat = { 用神: "官殺", 喜神: "財", 閒神: "食傷", 忌神: "比劫", 仇神: "印" };
        reason = "比劫過旺，取官殺制身、財星生官";
      }
    } else {
      const opp = ["食傷", "財", "官殺"].sort((a, b) => w[ce[b]] - w[ce[a]]);
      if (opp[0] === "財") { roleCat = { 用神: "比劫", 喜神: "印" }; reason = "財星過旺，取比劫幫身扛財"; }
      else if (opp[0] === "官殺") { roleCat = { 用神: "印", 喜神: "比劫" }; reason = "官殺過旺，取印星化殺生身"; }
      else { roleCat = { 用神: "印", 喜神: "比劫" }; reason = "食傷洩身太過，取印星制食傷、生扶日主"; }
      roleCat.忌神 = opp[0]; roleCat.仇神 = opp[1]; roleCat.閒神 = opp[2];
    }
    const roleOfElem = {};
    Object.keys(roleCat).forEach((r) => { roleOfElem[ce[roleCat[r]]] = r; });
    const mz = chart.pillars[2].zhi.char;
    let tiaohou = "";
    if ("巳午未".indexOf(mz) >= 0 && w.水 < 1) tiaohou = "生於夏月、原局水少，氣候偏燥，宜補水調候";
    if ("亥子丑".indexOf(mz) >= 0 && w.火 < 1) tiaohou = "生於冬月、原局火少，氣候偏寒，宜補火調候";
    return { D, ce, catOfElem, w, pct, ratio, strong, level, roleCat, roleOfElem, reason, tiaohou,
      fav: (e) => ROLE_FAV[roleOfElem[e]], role: (e) => roleOfElem[e], elemOf: (r) => ce[roleCat[r]] };
  }

  // ---------- 合沖刑害 ----------
  const lbl = (o, kind) => (o.short === "大運" || o.short === "流年" || o.short === "流月" ? o.short : o.short + kind) + (kind === "干" ? o.gan : o.zhi);
  const PILLAR_EFFECT = {
    沖: { 年: "長輩、祖業或外地事務有變動", 月: "工作環境、職務或父母方面有變動", 日: "夫妻宮受沖，感情、居家與身體都有變化", 時: "子女、晚輩或部屬方面有變動", 大運: "與大運相沖，運勢起伏大、計畫多變", 流年: "與流年相沖，變動明顯" },
    合: { 年: "長輩與外部資源帶來助力", 月: "工作與合作關係融洽", 日: "夫妻宮逢合，感情升溫，利定情或修復關係", 時: "子女晚輩有喜、部屬配合度高", 大運: "與大運相合，順勢而為", 流年: "與流年相合，推進順利" }
  };
  // target：要分析的干支（流年或流月）；others：原局四柱＋大運（流月再加流年）。同一個字出現在多柱時合併成一條。
  function relations(target, others, N, chart) {
    const out = [];
    const T = target;
    const groupBy = (key) => {
      const g = {};
      others.forEach((o) => { (g[o[key]] = g[o[key]] || []).push(o); });
      return g;
    };
    const mk = (kind, label, who, text, score, d) => out.push({ kind, label, who, text, score: round1(score), d: d || {} });
    const add = (d, k, v) => { d[k] = (d[k] || 0) + v; };
    const shorts = (os) => os.map((o) => o.short);
    const catElemBonus = (d, elem, mult) => {
      const fe = N.fav(elem), cat = N.catOfElem[elem];
      if (cat === "財") add(d, "wealth", fe * 0.6 * mult);
      if (cat === "官殺") { add(d, "career", fe * 0.6 * mult); if (chart.gender === "female") add(d, "love", 0.4 * mult); }
      if (cat === "印") { add(d, "career", fe * 0.4 * mult); add(d, "family", fe * 0.3 * mult); }
      if (cat === "食傷") { add(d, "career", fe * 0.4 * mult); add(d, "wealth", fe * 0.3 * mult); }
      if (cat === "比劫") { add(d, "wealth", -0.4 * mult + fe * 0.2); add(d, "family", fe * 0.3 * mult); }
      if (cat === "財" && chart.gender === "male") add(d, "love", 0.4 * mult);
    };

    // 天干：五合、相沖
    const byGan = groupBy("gan");
    Object.keys(byGan).forEach((g) => {
      const os = byGan[g], who = lbl(T, "干") + "、" + os.map((o) => lbl(o, "干")).join("、");
      const he = GAN_HE.find((p) => (p[0] === T.gan && p[1] === g) || (p[1] === T.gan && p[0] === g));
      if (he) {
        const fe = N.fav(he[2]), d = {};
        const day = shorts(os).indexOf("日") >= 0;
        if (day) add(d, "love", 0.5);
        mk("干合", T.gan + g + "合", who, who + "相合（合" + he[2] + "）：" +
          (day ? "合住日主，容易被人事牽絆，也代表新的合作或感情緣分" : "牽動" + os.map((o) => PILLAR_MEANING[o.short]).join("、")) +
          (fe > 0 ? "；合出" + he[2] + "為喜用，有助力" : fe < 0 ? "；合出" + he[2] + "為忌，合中帶絆" : ""), fe > 0 ? 0.3 : fe < 0 ? -0.3 : 0, d);
      }
      if (pairHit(GAN_CHONG, T.gan, g)) {
        const d = {}, day = shorts(os).indexOf("日") >= 0;
        if (day) { add(d, "health", -0.3); add(d, "love", -0.3); }
        mk("干沖", T.gan + g + "沖", who, who + "相沖：" + (day ? "日主受沖，壓力直接落在自己身上" : os.map((o) => PILLAR_MEANING[o.short]).join("、") + "相關的人事有衝突"), -0.4, d);
      }
    });

    // 地支：六沖、六合、六害、相刑、自刑
    const byZhi = groupBy("zhi");
    Object.keys(byZhi).forEach((z) => {
      const os = byZhi[z], who = lbl(T, "支") + "、" + os.map((o) => lbl(o, "支")).join("、");
      const fz = N.fav(WUXING_OF_ZHI[z]);
      if (pairHit(ZHI_CHONG, T.zhi, z)) {
        const d = {};
        let s = -0.6;
        if (fz <= -1) s += 1.2;
        if (fz >= 1) s -= 0.6;
        os.forEach((o) => {
          if (o.short === "年") add(d, "family", -0.6);
          if (o.short === "月") add(d, "career", -0.8);
          if (o.short === "日") { add(d, "love", -1); add(d, "health", -0.6); }
          if (o.short === "時") add(d, "family", -0.5);
          if (o.short === "大運") s -= 0.4;
          if (o.short === "流年") s -= 0.3;
        });
        mk("沖", (T.zhi < z ? T.zhi + z : z + T.zhi).split("").sort((a, b) => ZHI_ORDER.indexOf(a) - ZHI_ORDER.indexOf(b)).join("") + "沖", who,
          who + "相沖：" + uniq(os.map((o) => PILLAR_EFFECT.沖[o.short])).join("；") +
          (fz <= -1 ? "；被沖的是" + N.role(WUXING_OF_ZHI[z]) + "，沖去阻礙，有破舊立新之效" : fz >= 1 ? "；被沖的是" + N.role(WUXING_OF_ZHI[z]) + "，原本的助力受到干擾" : ""), s, d);
      }
      const he = ZHI_LIUHE.find((p) => (p[0] === T.zhi && p[1] === z) || (p[1] === T.zhi && p[0] === z));
      if (he) {
        const fe = N.fav(he[2]), d = {};
        os.forEach((o) => {
          if (o.short === "日") add(d, "love", 0.8);
          if (o.short === "月") add(d, "career", 0.4);
          if (o.short === "年" || o.short === "時") add(d, "family", 0.3);
        });
        mk("合", T.zhi + z + "合", who, who + "六合（合" + he[2] + "）：" + uniq(os.map((o) => PILLAR_EFFECT.合[o.short])).join("；") +
          (fe > 0 ? "；合出" + he[2] + "為喜用，助力加分" : fe < 0 ? "；合出" + he[2] + "為忌，合中帶絆，易被人情牽制" : ""), fe > 0 ? 0.5 : fe < 0 ? -0.3 : 0.1, d);
      }
      if (pairHit(ZHI_HAI, T.zhi, z)) {
        mk("害", T.zhi + z + "害", who, who + "相害：防小人暗損與身體小恙，" + os.map((o) => PILLAR_MEANING[o.short]).join("、") + "方面多留意", -0.3, { family: -0.2, health: -0.2 });
      }
      const xingPair = (T.zhi === "子" && z === "卯") || (T.zhi === "卯" && z === "子") ||
        SAN_XING.some((g) => g.indexOf(T.zhi) >= 0 && g.indexOf(z) >= 0 && T.zhi !== z && !pairHit(ZHI_CHONG, T.zhi, z));
      const fullXing = SAN_XING.find((g) => g.indexOf(T.zhi) >= 0 && g.split("").filter((c) => c !== T.zhi).every((c) => byZhi[c]));
      if (xingPair && !(fullXing && fullXing.indexOf(z) >= 0)) {
        mk("刑", T.zhi + z + "刑", who, who + "相刑：易有口角、文書糾紛，留意小傷或發炎", -0.4, { health: -0.5 });
      }
      if (T.zhi === z && ZI_XING.indexOf(z) >= 0) {
        mk("自刑", z + z + "自刑", who, who + "自刑：情緒自擾、容易鑽牛角尖，凡事別過度要求自己", -0.3, { health: -0.2 });
      }
    });
    const fullXing = SAN_XING.find((g) => g.indexOf(T.zhi) >= 0 && g.split("").filter((c) => c !== T.zhi).every((c) => byZhi[c]));
    if (fullXing) {
      const os = fullXing.split("").filter((c) => c !== T.zhi).map((c) => byZhi[c][0]);
      const who = lbl(T, "支") + "、" + os.map((o) => lbl(o, "支")).join("、");
      mk("三刑", fullXing + "三刑", who, who + "湊成" + fullXing + "三刑：易有口角、官非文書糾紛，並留意手術、外傷", -1, { health: -1.2, family: -0.4, career: -0.3 });
    }

    // 三合／三會（全局）與半合
    const haveZhi = (c) => byZhi[c];
    Object.keys(ZHI_SANHE).forEach((k) => {
      if (k.indexOf(T.zhi) < 0) return;
      const rest = k.split("").filter((c) => c !== T.zhi);
      const elem = ZHI_SANHE[k], fe = N.fav(elem), cat = N.catOfElem[elem];
      const tail = "：" + elem + "（" + cat + "）氣勢增強" + (fe > 0 ? "，為" + N.role(elem) + "，相關面向加分" : fe < 0 ? "，為" + N.role(elem) + "，壓力加重" : "");
      if (rest.every(haveZhi)) {
        const os = rest.map((c) => byZhi[c][0]), d = {};
        catElemBonus(d, elem, 1);
        const who = lbl(T, "支") + "、" + os.map((o) => lbl(o, "支")).join("、");
        mk("三合", k + "三合" + elem + "局", who, who + "三合" + elem + "局" + tail, fe * 0.75, d);
      } else {
        rest.filter(haveZhi).forEach((c) => {
          const os = byZhi[c], d = {};
          catElemBonus(d, elem, 0.5);
          const who = lbl(T, "支") + "、" + os.map((o) => lbl(o, "支")).join("、");
          mk("半合", (k.indexOf(T.zhi) < k.indexOf(c) ? T.zhi + c : c + T.zhi) + "半合" + elem, who, who + "半合" + elem + "局" + tail, fe * 0.4, d);
        });
      }
    });
    Object.keys(ZHI_SANHUI).forEach((k) => {
      if (k.indexOf(T.zhi) < 0) return;
      const rest = k.split("").filter((c) => c !== T.zhi);
      if (!rest.every(haveZhi)) return;
      const elem = ZHI_SANHUI[k], fe = N.fav(elem), d = {};
      catElemBonus(d, elem, 1);
      const os = rest.map((c) => byZhi[c][0]), who = lbl(T, "支") + "、" + os.map((o) => lbl(o, "支")).join("、");
      mk("三會", k + "三會" + elem + "方", who, who + "三會" + elem + "方：" + elem + "（" + N.catOfElem[elem] + "）勢力最旺" + (fe > 0 ? "，為" + N.role(elem) + "，大有助益" : fe < 0 ? "，為" + N.role(elem) + "，壓力最大" : ""), fe * 0.8, d);
    });

    // 整柱：伏吟、天剋地沖
    others.forEach((o) => {
      if (o.gan === T.gan && o.zhi === T.zhi) {
        mk("伏吟", "伏吟" + (o.short.length === 1 ? o.short + "柱" : o.short), T.short + "與" + (o.short.length === 1 ? o.short + "柱" : o.short),
          T.short + "與" + (o.short.length === 1 ? o.short + "柱" : o.short) + "伏吟（同為" + T.gan + T.zhi + "）：舊事重演、情緒容易低落，" + PILLAR_MEANING[o.short] + "方面的老問題會再浮現", -0.6, {});
      } else if (pairHit(GAN_CHONG, T.gan, o.gan) && pairHit(ZHI_CHONG, T.zhi, o.zhi)) {
        mk("天剋地沖", "天剋地沖" + (o.short.length === 1 ? o.short + "柱" : o.short), T.short + "與" + (o.short.length === 1 ? o.short + "柱" : o.short),
          T.short + "與" + (o.short.length === 1 ? o.short + "柱" : o.short) + "天剋地沖：" + PILLAR_MEANING[o.short] + "是變動最劇烈的一環", -1, {});
      }
    });
    return out;
  }

  // 神煞（只取報告會用到的幾個）
  function shenshaOf(z, chart) {
    const dg = chart.dayGan, yz = chart.pillars[3].zhi.char, dz = chart.pillars[1].zhi.char;
    const out = [];
    if ((TIANYI_GUIREN[dg] || []).indexOf(z) >= 0) out.push("天乙貴人");
    if (WEN_CHANG[dg] === z) out.push("文昌");
    if (TAOHUA[triadOf(dz)] === z || TAOHUA[triadOf(yz)] === z) out.push("桃花");
    if (YIMA[triadOf(dz)] === z || YIMA[triadOf(yz)] === z) out.push("驛馬");
    if (HONG_LUAN[yz] === z) out.push("紅鸞");
    if (TIAN_XI[yz] === z) out.push("天喜");
    return out;
  }
  const SS_BONUS = { 天乙貴人: { all: 0.4, career: 0.4, family: 0.3 }, 文昌: { all: 0.2, career: 0.3 }, 紅鸞: { love: 0.5 }, 天喜: { love: 0.4 }, 桃花: { love: 0.3 }, 驛馬: {} };

  // ---------- 面向評分 ----------
  const CAT_DOMAIN_W = {
    career: { 官殺: 0.8, 印: 0.6, 食傷: 0.5, 財: 0.4, 比劫: 0.3 },
    wealth: { 財: 1, 食傷: 0.6, 比劫: 0.3, 官殺: 0.3, 印: 0.3 },
    health: { 官殺: 0.5, 印: 0.5, 食傷: 0.5, 財: 0.5, 比劫: 0.5 },
    family: { 印: 0.6, 比劫: 0.5, 食傷: 0.3, 財: 0.3, 官殺: 0.3 }
  };
  function domainScores(parts, rels, ss, N, chart) {
    // parts：[{ cat, elem, w }]，w＝天干 0.4、地支 0.6
    const D = {};
    const base = parts.reduce((s, p) => s + N.fav(p.elem) * p.w, 0);
    const relAll = rels.reduce((s, r) => s + r.score, 0);
    // 基本盤（干支喜忌、合沖總分）只占三成，其餘看與該面向相關的十神與合沖，避免忌神被重複扣分
    ["career", "wealth", "love", "health", "family"].forEach((k) => {
      let s = base * 0.3 + relAll * 0.3;
      parts.forEach((p) => {
        const f = N.fav(p.elem);
        if (k === "love") {
          const spouse = chart.gender === "female" ? "官殺" : "財";
          if (p.cat === spouse) s += (0.6 + f * 0.4) * p.w;
          else if ((chart.gender === "female" && p.cat === "食傷") || (chart.gender === "male" && p.cat === "比劫")) s -= 0.5 * p.w;
        } else if (k === "health") {
          // 健康不看財官好壞，只看是否剋身與五行喜忌；沖刑都記在扣分，故給 0.3 基準（依干支權重分攤）
          s += f * 0.2 * p.w + 0.3 * p.w;
          if (p.cat === "官殺" && f < 0) s -= 0.4 * p.w;
        } else {
          s += f * CAT_DOMAIN_W[k][p.cat] * p.w * 0.8;
          if (k === "wealth" && p.cat === "比劫") s -= 0.5 * p.w;
        }
      });
      rels.forEach((r) => { s += r.d[k] || 0; });
      ss.forEach((n) => { const b = SS_BONUS[n] || {}; s += (b[k] || 0) + (b.all || 0) * 0.5; });
      D[k] = { score: round1(s), rating: rate(s) };
    });
    return D;
  }

  // 節氣月：逐日比對月柱，找出 12 個「節」的交接日（以中午判斷，交節在午後者會晚一天，屬約略日期）
  function monthsOf(year) {
    const seq = [];
    let prev = null;
    for (let t = new Date(year, 0, 25); t <= new Date(year + 1, 1, 12); t.setDate(t.getDate() + 1)) {
      const ec = Solar.fromYmdHms(t.getFullYear(), t.getMonth() + 1, t.getDate(), 12, 0, 0).getLunar().getEightChar();
      const gz = ec.getMonthGan() + ec.getMonthZhi();
      if (gz !== prev) { seq.push({ gz, start: new Date(t) }); prev = gz; }
    }
    const i = seq.findIndex((m) => m.gz[1] === "寅");
    const ms = seq.slice(i, i + 13);
    return ms.slice(0, 12).map((m, k) => ({ gz: m.gz, start: m.start, end: new Date(ms[k + 1].start.getTime() - 864e5) }));
  }

  // ---------- 分析 ----------
  function analyze(chart, o) {
    const N = analyzeNatal(chart);
    const year = o.year;
    const gz = yearGanZhi(year);
    const P = { 年: chart.pillars[3], 月: chart.pillars[2], 日: chart.pillars[1], 時: chart.pillars[0] };
    const natalPos = ["年", "月", "日", "時"].map((k) => ({ short: k, gan: P[k].gan.char, zhi: P[k].zhi.char }));
    const birthYear = Number(chart.solarText.slice(0, 4));
    const dyAsc = chart.daYunList.slice().reverse();
    const dy = dyAsc.find((d) => year >= d.startYear && year <= d.startYear + 9) || null;
    const dyPos = dy ? { short: "大運", gan: dy.gan.char, zhi: dy.zhi.char } : null;
    const others = natalPos.concat(dyPos ? [dyPos] : []);
    const ln = { short: "流年", gan: gz[0], zhi: gz[1] };
    const partsOf = (g, z) => {
      const sg = getShiShen(chart.dayGan, g), sz = getShiShen(chart.dayGan, NATIVE_HIDE_GAN[z][0]);
      return [{ pos: "天干", char: g, ss: sg, cat: SS_CAT[sg], elem: WUXING_OF_GAN[g], w: 0.4 },
        { pos: "地支", char: z, ss: sz, cat: SS_CAT[sz], elem: WUXING_OF_ZHI[z], w: 0.6 }];
    };
    const yParts = partsOf(ln.gan, ln.zhi);
    const rels = relations(ln, others, N, chart);
    const ss = shenshaOf(ln.zhi, chart);
    const domains = domainScores(yParts, rels, ss, N, chart);
    const yearScore = round1(yParts.reduce((s, p) => s + N.fav(p.elem) * p.w, 0) * 0.6 + rels.reduce((s, r) => s + r.score, 0) * 0.5);

    const dyRows = dyAsc.map((d) => {
      const pp = partsOf(d.gan.char, d.zhi.char);
      const sc = pp.reduce((s, p) => s + N.fav(p.elem) * p.w, 0);
      return { d, parts: pp, score: round1(sc), rating: rate(sc), current: d === dy };
    });
    const dyRels = dyPos ? relations(dyPos, natalPos, N, chart) : [];

    const months = monthsOf(year).map((m) => {
      const pos = { short: "流月", gan: m.gz[0], zhi: m.gz[1] };
      const mParts = partsOf(pos.gan, pos.zhi);
      const r = relations(pos, others.concat([ln]), N, chart);
      const mss = shenshaOf(pos.zhi, chart);
      let sc = mParts.reduce((s, p) => s + N.fav(p.elem) * p.w, 0) * 0.6 + r.reduce((s, x) => s + x.score, 0) * 0.5;
      mss.forEach((n) => { sc += ((SS_BONUS[n] || {}).all || 0); });
      return Object.assign({}, m, { parts: mParts, rels: r, ss: mss, score: round1(sc), rating: rate(sc) });
    });
    return { chart, o, N, year, gz, ln, P, natalPos, birthYear, dy, dyPos, dyRows, dyRels, yParts, rels, ss, domains, yearScore, months };
  }

  // ---------- 文字組合 ----------
  const favWord = (N, e) => N.role(e);
  const isGood = (N, e) => N.fav(e) > 0;
  function partsSentence(R, parts) {
    return parts.map((p) => p.pos + p.char + "為" + p.ss + "（" + p.elem + "，" + favWord(R.N, p.elem) + "）").join("，");
  }
  function catBullets(R, domain) {
    const out = [];
    uniq(R.yParts.map((p) => p.cat)).forEach((cat) => {
      const ps = R.yParts.filter((p) => p.cat === cat);
      const good = isGood(R.N, ps[0].elem);
      const t = CAT_TEXT[cat][domain];
      if (t) out.push("<b>流年" + ps.map((p) => p.pos + p.char).join("、") + "（" + ps.map((p) => p.ss).join("、") + "，" + favWord(R.N, ps[0].elem) + "）：</b>" + t[good ? 1 : 0] + "。");
    });
    return out;
  }
  const relBullet = (r) => "<b>" + esc(r.label) + "：</b>" + esc(r.text.replace(/^[^：]*：/, "")) + "。";
  function adviceFor(domain, rating) {
    const a = ADVICE[domain];
    return (rating === "注意" || rating === "平" ? a.bad : a.good).concat(a.all);
  }
  function monthsWith(R, pred) { return R.months.filter(pred).map((m) => m.gz[1] + "月（" + md(m.start) + "起）"); }

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

  function render(R) {
    const c = R.chart, N = R.N, o = R.o, y = R.year;
    const root = el("div", "zr-report");
    const add = (html, pageBreak) => {
      const b = el("div", "zr-block", html);
      if (pageBreak) b.setAttribute("data-pdf-break-before", "");
      root.appendChild(b);
      return b;
    };
    const genderText = c.gender === "male" ? "男" : "女";
    const pillarsText = ["年", "月", "日", "時"].map((k) => R.P[k].gan.char + R.P[k].zhi.char).join(" ");
    const dayElem = N.D;
    const xuSui = y - R.birthYear + 1;
    const dyText = R.dy ? R.dy.gan.char + R.dy.zhi.char + "大運（" + R.dy.startYear + "–" + (R.dy.startYear + 9) + "，" + R.dy.startAge + "–" + R.dy.endAge + " 歲）" : "尚未起運";
    const elemRole = (r) => N.elemOf(r) + "（" + N.roleCat[r] + "）";
    const D = R.domains;
    let n = 1;
    const num = () => pad2(n++);

    // 封面
    add('<div class="zr-kicker">八字命理　·　</div>' +
      '<div class="zr-title">' + y + " " + R.gz + " 流年分析報告</div>" +
      '<div class="zr-sub"><b>' + esc(c.name) + "</b>　｜　" + genderText + "命・" + c.dayGan + dayElem + "日主・" + pillarsText + "</div>" +
      '<div class="zr-rule"></div>' +
      '<div class="zr-cards">' + ["career", "wealth", "health"].map((k) =>
        '<div class="zr-card"><div class="zr-card-label">' + DOMAIN_NAME[k] + " · " + y + '</div><div class="zr-card-big">' + RATING_BIG[D[k].rating] +
        '</div><div class="zr-card-desc">' + SUMMARY[k][D[k].rating] + "</div></div>").join("") + "</div>");

    // 01 命盤基本資料
    add(h1(num(), "命盤基本資料") + callout(
      esc(c.name) + "，" + genderText + "命，日主" + c.dayGan + dayElem + "，" + N.level + "，" + c.geju + "。" +
      y + " 年行" + dyText + "，流年" + R.gz + "：" + partsSentence(R, R.yParts) + "。"));
    const first = R.dyRows[0] && R.dyRows[0].d;
    add(table([["項目", 19], ["內容", 81]], [
      ["出生", "公元 " + esc(c.solarText) + "（農曆" + esc(c.lunarText) + "），" + genderText + "命，生肖" + c.shengxiao],
      ["四柱", pillarsText.split(" ").map((g, i) => g + ["年", "月", "日", "時"][i]).join("　")],
      ["日主", c.dayGan + dayElem + "，" + N.level + "（同類比劫與印星約占 " + Math.round(N.ratio * 100) + "%）"],
      ["格局", c.geju],
      ["喜用神", "用神 " + elemRole("用神") + "；喜神 " + elemRole("喜神")],
      ["忌神", "忌神 " + elemRole("忌神") + "；仇神 " + elemRole("仇神")],
      ["起運", first ? "約 " + first.startAge + " 歲起運（西元 " + first.startYear + " 年），每 10 年換一步大運" : "—"],
      ["現行大運", R.dy ? dyText + "：天干" + R.dy.shiShen + "、地支" + R.dy.hideGans[0].shiShen : "尚未起運"],
      [y + " 流年", R.gz + "（實歲 " + (y - R.birthYear) + "、虛歲 " + xuSui + "）；天干" + R.yParts[0].ss + "、地支" + R.yParts[1].ss]
    ], { darkFirst: true }));

    // 02 四柱排盤
    const ks = ["年", "月", "日", "時"];
    add(h1(num(), "四柱排盤") + table([["項目", 16], ["年柱", 21], ["月柱", 21], ["日柱", 21], ["時柱", 21]], [
      ["天干十神"].concat(ks.map((k) => R.P[k].shiShenGan || "日主")),
      ["天干"].concat(ks.map((k) => R.P[k].gan.char + "（" + R.P[k].gan.wuxing + "）")),
      ["地支"].concat(ks.map((k) => R.P[k].zhi.char + "（" + R.P[k].zhi.wuxing + "）")),
      ["藏干"].concat(ks.map((k) => R.P[k].hideGans.map((h) => h.char).join("、"))),
      ["藏干十神"].concat(ks.map((k) => R.P[k].hideGans.map((h) => h.shiShen).join("、"))),
      ["十二長生"].concat(ks.map((k) => R.P[k].diShi)),
      ["納音"].concat(ks.map((k) => nayin(R.P[k].gan.char, R.P[k].zhi.char))),
      ["神煞"].concat(ks.map((k) => (R.P[k].shensha || []).slice(0, 4).join("、") || "—")),
      ["宮位"].concat(ks.map((k) => PALACE_ROW[k]))
    ]));
    add('<div class="zr-note">天干合克：' + esc(c.ganNoteText) + "。地支合沖：" + esc(c.zhiNoteText) + "。</div>");

    // 03 日主強弱與喜忌
    // 章節標題＋導言＋第一個表格放同一區塊，PDF 分頁時不會把標題留在上一頁
    add(h1(num(), "日主強弱與喜忌") + callout(
      c.dayGan + dayElem + "日主" + N.level + "，" + N.reason + "：用神取" + elemRole("用神") + "，喜神為" + elemRole("喜神") + "，最怕" + elemRole("忌神") + "。") +
      table([["五行", 10], ["十神", 12], ["原局力量", 14], ["角色", 12], ["說明", 52]],
      ROLE_ORDER.map((r) => {
        const e = N.elemOf(r);
        return [e, N.roleCat[r], N.pct[e] + "%", r, ROLE_DESC[r]];
      }), { darkFirst: true }));
    const natalBul = [
      "<b>日主性格：</b>" + c.dayGan + dayElem + "如" + DAY_TRAIT[c.dayGan] + "。",
      "<b>強弱判斷：</b>月令" + R.P.月.zhi.char + "（" + R.P.月.zhi.wuxing + "），同類五行（" + N.ce.比劫 + "、" + N.ce.印 + "）約占 " + Math.round(N.ratio * 100) + "%，屬" + N.level + "。",
      "<b>最旺與最弱：</b>原局最旺是" + ELEMS.slice().sort((a, b) => N.pct[b] - N.pct[a])[0] + "，最弱是" + ELEMS.slice().sort((a, b) => N.pct[a] - N.pct[b])[0] + "；大運流年補到喜用神時運勢最順。"
    ];
    if (N.tiaohou) natalBul.push("<b>調候：</b>" + N.tiaohou + "。");
    add(ul(natalBul));

    // 04 大運
    const cur = R.dyRows.find((x) => x.current);
    add(h1(num(), "大運") + callout(R.dy ?
      y + " 年走" + dyText + "：天干" + R.dy.gan.char + "為" + cur.parts[0].ss + "（" + favWord(N, cur.parts[0].elem) + "），地支" + R.dy.zhi.char + "為" + cur.parts[1].ss + "（" + favWord(N, cur.parts[1].elem) + "），整體評估「" + cur.rating + "」。傳統上天干管前五年、地支管後五年。" +
      (R.dyRels.length ? "大運與原局：" + R.dyRels.slice(0, 3).map((r) => r.label).join("、") + "。" : "")
      : y + " 年尚未起運，以原局與流年為主。") +
      table([["大運", 10], ["年份", 18], ["實歲", 12], ["天干十神", 16], ["地支十神", 16], ["喜忌", 16], ["評估", 12]],
      R.dyRows.slice(0, 9).map((x) => {
        const name = x.d.gan.char + x.d.zhi.char;
        return [x.current ? "<b>" + name + "</b>" : name, x.d.startYear + "–" + (x.d.startYear + 9), x.d.startAge + "–" + x.d.endAge,
          x.parts[0].ss, x.parts[1].ss, favWord(N, x.parts[0].elem).replace("神", "") + "／" + favWord(N, x.parts[1].elem).replace("神", ""), x.rating];
      }), { rating: true }));
    add('<div class="zr-note">粗體為 ' + y + " 年所在的大運；喜忌欄依序為天干／地支五行在本命的角色。</div>");

    // 05 流年總論
    const topRels = R.rels.slice().sort((a, b) => Math.abs(b.score) - Math.abs(a.score));
    add(h1(num(), y + " " + R.gz + " 流年總論") + callout(
      y + " 年整體評估「" + rate(R.yearScore) + "」。" + partsSentence(R, R.yParts) + "。" +
      (topRels.length ? "與原局、大運的主要作用是" + topRels.slice(0, 3).map((r) => r.label).join("、") + "。" : "與原局、大運之間沒有明顯的合沖刑害，運勢以干支喜忌為主。") +
      (R.ss.length ? "流年地支帶" + R.ss.join("、") + "。" : "")), true);
    if (R.rels.length) add(table([["作用", 18], ["參與的干支", 26], ["影響", 56]], topRels.map((r) => [esc(r.label), esc(r.who), esc(r.text.replace(/^[^：]*：/, ""))])));
    add(h2("年度關鍵字") + '<div class="zr-cards">' + ["career", "wealth", "love", "health"].map((k) =>
      '<div class="zr-card"><div class="zr-card-label">' + DOMAIN_NAME[k] + '</div><div class="zr-card-big" style="font-size:20px">' + KEYWORD[k][D[k].rating] +
      '</div><div class="zr-card-desc">評估：' + D[k].rating + "</div></div>").join("") + "</div>");

    // 06–10 各面向
    const relsOf = (pred) => R.rels.filter(pred);
    const has = (r, s) => r.who.indexOf(s) >= 0;
    const domainSection = (k, title, bullets, extra) => {
      add(h1(num(), title) + callout(DOMAIN_LUCK[k] + "「" + D[k].rating + "」：" + SUMMARY[k][D[k].rating] + "。") + (bullets.length ? ul(bullets) : ""));
      if (extra) add(extra);
      add(h2(DOMAIN_NAME[k] + "建議") + ol(adviceFor(k, D[k].rating)));
    };
    // 事業
    const careerB = catBullets(R, "career");
    relsOf((r) => has(r, "月支") || has(r, "月干") || (r.d.career || 0) !== 0).slice(0, 3).forEach((r) => careerB.push(relBullet(r)));
    if (R.ss.indexOf("天乙貴人") >= 0) careerB.push("<b>天乙貴人：</b>流年逢貴人，有長官或前輩提攜。");
    if (R.ss.indexOf("文昌") >= 0) careerB.push("<b>文昌：</b>利考試、證照、寫作與文書。");
    if (R.ss.indexOf("驛馬") >= 0) careerB.push("<b>驛馬：</b>工作變動、出差或外派機會多。");
    const goodCareer = monthsWith(R, (m) => m.rating === "大吉" || m.rating === "吉");
    careerB.push("<b>時機：</b>" + (goodCareer.length ? "適合布局的月份是" + goodCareer.slice(0, 4).join("、") : "全年宜穩健推進") + "；" +
      "需保守的月份是" + (monthsWith(R, (m) => m.rating === "注意").slice(0, 3).join("、") || "無特別凶月") + "。");
    domainSection("career", "事業與工作運", careerB);
    // 財運
    const wealthB = catBullets(R, "wealth");
    relsOf((r) => (r.d.wealth || 0) !== 0).slice(0, 3).forEach((r) => wealthB.push(relBullet(r)));
    if (R.ss.indexOf("驛馬") >= 0) wealthB.push("<b>驛馬：</b>動中求財，外出、跑業務的收入較好。");
    wealthB.push("<b>財星：</b>" + N.ce.財 + "為本命財星，屬" + favWord(N, N.ce.財) + "；" + (isGood(N, N.ce.財) ? "遇到財星的月份收入較佳" : "財星為忌，錢財宜守不宜攻") + "。");
    const goodWealth = R.months.filter((m) => m.parts.some((p) => p.cat === "財" || p.cat === "食傷") && m.score > 0).map((m) => m.gz[1] + "月（" + md(m.start) + "起）");
    if (goodWealth.length) wealthB.push("<b>旺財月：</b>" + goodWealth.slice(0, 4).join("、") + "。");
    domainSection("wealth", "財運", wealthB, '<div class="zr-note">本報告不構成投資建議，實際資產配置請以自身財務狀況為準，必要時請教持牌的理財專業人士。</div>');
    // 感情
    const spouseCat = c.gender === "female" ? "官殺" : "財";
    const loveB = [];
    uniq(R.yParts.map((p) => p.cat)).forEach((cat) => {
      const ps = R.yParts.filter((p) => p.cat === cat), t = LOVE_TEXT[c.gender === "female" ? "female" : "male"][cat];
      if (t) loveB.push("<b>流年" + ps.map((p) => p.pos + p.char).join("、") + "（" + ps.map((p) => p.ss).join("、") + "）：</b>" + t[isGood(N, ps[0].elem) ? 1 : 0] + "。");
    });
    loveB.unshift("<b>配偶星：</b>" + (c.gender === "female" ? "女命以官殺為夫星" : "男命以財星為妻星") + "，即" + N.ce[spouseCat] + "；夫妻宮在日支" + R.P.日.zhi.char + "。");
    relsOf((r) => has(r, "日支") || has(r, "日干")).forEach((r) => loveB.push(relBullet(r)));
    ["桃花", "紅鸞", "天喜"].filter((s) => R.ss.indexOf(s) >= 0).forEach((s) => loveB.push("<b>" + s + "：</b>" + (s === "桃花" ? "異性緣增加，單身者機會多，有伴者要守分寸" : "有喜慶之象，利婚戀與家中喜事") + "。"));
    const loveMonths = R.months.filter((m) => m.rels.some((r) => r.kind === "合" && has(r, "日支")) || m.ss.indexOf("桃花") >= 0 || m.ss.indexOf("紅鸞") >= 0).map((m) => m.gz[1] + "月（" + md(m.start) + "起）");
    const loveBad = R.months.filter((m) => m.rels.some((r) => (r.kind === "沖" || r.kind === "三刑") && has(r, "日支"))).map((m) => m.gz[1] + "月（" + md(m.start) + "起）");
    if (loveMonths.length) loveB.push("<b>感情好時機：</b>" + loveMonths.slice(0, 3).join("、") + "。");
    if (loveBad.length) loveB.push("<b>易起摩擦：</b>" + loveBad.slice(0, 3).join("、") + "，多一點耐心。");
    domainSection("love", "感情與婚姻", loveB);
    // 健康
    const hRows = [];
    const pushH = (elem, basis) => { if (!hRows.some((h) => h[3] === elem)) hRows.push([ORGAN[elem], basis, HEALTH_TIP[elem], elem]); };
    R.yParts.forEach((p) => {
      if (p.cat === "官殺" && N.fav(p.elem) < 0) pushH(dayElem, "流年" + p.pos + p.char + "七殺／正官剋日主（" + dayElem + "）");
      if (N.fav(p.elem) <= -1) pushH(CONTROLS[p.elem], "流年" + p.elem + "為" + favWord(N, p.elem) + "，" + p.elem + "旺剋" + CONTROLS[p.elem]);
    });
    if (R.rels.some((r) => r.kind === "沖" && has(r, "日支"))) hRows.push(["整體作息與舊疾", "日支（身體宮）受沖", "身體不適盡早就醫，不要硬撐", ""]);
    if (R.rels.some((r) => r.kind === "三刑" || r.kind === "刑")) hRows.push(["外傷、手術", "地支相刑", "開車、運動、居家修繕放慢", ""]);
    if (!hRows.length) pushH(dayElem, "日主本身五行（" + dayElem + "）");
    const healthB = R.rels.filter((r) => (r.d.health || 0) < 0).slice(0, 3).map(relBullet);
    const hBad = R.months.filter((m) => m.rating === "注意" || m.rels.some((r) => (r.d.health || 0) <= -0.5)).map((m) => m.gz[1] + "月（" + md(m.start) + "起）");
    if (hBad.length) healthB.push("<b>需多保養的月份：</b>" + hBad.slice(0, 4).join("、") + "。");
    domainSection("health", "健康", healthB,
      table([["部位", 26], ["五行依據", 38], ["建議", 36]], hRows.map((h) => [h[0], esc(h[1]), h[2]]), { darkFirst: true }) +
      '<div class="zr-note">以上為命理上提示的留意方向，不是醫學診斷；身體有任何不適，請以醫師評估為準。</div>');
    // 家庭人際貴人
    const famB = catBullets(R, "family");
    relsOf((r) => has(r, "年支") || has(r, "時支") || has(r, "年干") || has(r, "時干")).slice(0, 3).forEach((r) => famB.push(relBullet(r)));
    if (R.rels.some((r) => (r.kind === "沖" || r.kind === "三刑") && (has(r, "日支") || has(r, "月支")))) famB.push("<b>居家：</b>日支或月支受沖刑，可能有搬遷、修繕或居住安排上的調整，置產與大筆裝修宜審慎。");
    const guiMonths = R.months.filter((m) => m.ss.indexOf("天乙貴人") >= 0).map((m) => m.gz[1] + "月（" + md(m.start) + "起）");
    famB.push("<b>貴人：</b>" + c.dayGan + "日的天乙貴人在" + (TIANYI_GUIREN[c.dayGan] || []).join("、") + (guiMonths.length ? "，" + y + " 年" + guiMonths.join("、") + "有人出手相助" : "") + "。");
    if (R.ss.indexOf("文昌") >= 0 || R.yParts.some((p) => p.cat === "印" && isGood(N, p.elem))) famB.push("<b>學習：</b>今年適合進修、考證照或培養新興趣。");
    domainSection("family", "家庭、人際與貴人", famB);

    // 11 流月
    const top = R.months.slice().sort((a, b) => b.score - a.score)[0], low = R.months.slice().sort((a, b) => a.score - b.score)[0];
    add(h1(num(), y + " 流月運勢") + callout(
      "最佳是" + top.gz[1] + "月（" + md(top.start) + "–" + md(top.end) + "），最需小心的是" + low.gz[1] + "月（" + md(low.start) + "–" + md(low.end) + "）。月份以節氣劃分，從立春到隔年立春前，國曆日期為約略值。") +
      table([["月令", 8], ["干支", 8], ["約略國曆", 15], ["十神", 13], ["主要作用", 22], ["重點", 25], ["評估", 9]],
      R.months.map((m) => {
        const main = m.rels.slice().sort((a, b) => Math.abs(b.score) - Math.abs(a.score)).slice(0, 2).map((r) => r.label).concat(m.ss.filter((s) => s !== "驛馬")).slice(0, 3);
        const cat = m.parts[1].cat;
        let phrase = MONTH_PHRASE[cat][m.score >= 0.5 ? 1 : 0];
        if (m.rels.some((r) => r.kind === "沖" && has(r, "日支"))) phrase += "；感情居家易有變動";
        else if (m.rels.some((r) => r.kind === "三刑")) phrase += "；防口角與意外";
        return [m.gz[1] + "月", m.gz, md(m.start) + "–" + md(m.end), m.parts[0].ss + "、" + m.parts[1].ss, esc(main.join("、") || "—"), phrase, m.rating];
      }), { rating: true }), true);

    // 12 開運建議與總結
    const yong = N.elemOf("用神"), xi = N.elemOf("喜神"), ji = N.elemOf("忌神"), chou = N.elemOf("仇神");
    add(h1(num(), "開運建議與總結") + callout(
      y + " 年的策略：" + ["career", "wealth", "love", "health"].map((k) => DOMAIN_NAME[k] + "「" + D[k].rating + "」").join("、") + "。" +
      "把握" + top.gz[1] + "月，" + low.gz[1] + "月放慢腳步；日常多補" + yong + "、" + xi + "，少沾" + ji + "、" + chou + "。"), true);
    add(h2("五行開運（補" + yong + xi + "、避" + ji + chou + "）") + table([["項目", 14], ["宜", 50], ["避", 36]], [
      ["顏色", LUCK.color[yong] + "；" + LUCK.color[xi], "大面積的" + LUCK.color[ji]],
      ["方位", LUCK.dir[yong] + "、" + LUCK.dir[xi], LUCK.dir[ji] + "不宜久待"],
      ["數字", LUCK.num[yong] + "、" + LUCK.num[xi], LUCK.num[ji]],
      ["習慣", LUCK.habit[yong] + "；" + LUCK.habit[xi], ji === "火" ? "熬夜、情緒起伏" : ji === "水" ? "作息日夜顛倒、過度思慮" : ji === "土" ? "久坐不動、過度思慮" : ji === "金" ? "與人硬碰硬" : "過度勞累、硬撐"],
      ["有利產業", LUCK.work[yong] + "；" + LUCK.work[xi], "以" + ji + "為主的產業不宜加碼"]
    ], { darkFirst: true }));
    const todo = ["career", "wealth", "love", "health"].map((k) => DOMAIN_NAME[k] + "：" + adviceFor(k, D[k].rating)[0]);
    todo.push(low.gz[1] + "月（" + md(low.start) + "–" + md(low.end) + "）重大決定放慢，" + top.gz[1] + "月（" + md(top.start) + "–" + md(top.end) + "）主動出擊");
    todo.push("每季回顧一次本報告的流月提醒，提前安排重要計畫");
    add(h2("行動清單") + ul(todo, "zr-check"));
    add(h2("說明") + ul([
      "本報告依節氣四柱排盤，日主強弱、喜忌與合沖刑害採規則式判讀；起運歲數與流月交接日為約略值，可能有數日至數月誤差。",
      "八字是傳統文化的詮釋工具，適合用來自我反思與規劃；健康請以醫師診斷為準，理財請以自身財務狀況與專業意見為準。"
    ]) + '<div class="zr-end">Aries 命理工作室　·　' + new Date().getFullYear() + "/" + (new Date().getMonth() + 1) + "/" + new Date().getDate() + " 產生</div>");
    return root;
  }

  window.BaziReport = { analyze, render };
})();
