// ================= 命理諮詢「十二星座」=================
// 個人星座個性＋選定年份的每月運勢。行星位置用 JPL「Keplerian Elements for Approximate Positions of the
// Major Planets」（Standish，1800–2050 年表）推算地心黃經，再加歲差換成當日分點（回歸黃道），
// 太陽星座以出生當下的太陽黃經判定（台灣時間 UTC+8），交界日也準確；1800–2050 年外精度略降但星座判定仍可用。
// 每月運勢採「太陽宮位法」（以本命太陽星座為第一宮的整宮制）：太陽主題、金星感情財運、火星行動力、水星逆行；
// 木星／土星決定全年的機會與功課。解讀為規則式文字組合，評估只用來排「大吉／吉／平／注意」。
(function () {
  // ---------- 天文 ----------
  const RAD = Math.PI / 180;
  // [a, e, I, L, 近日點經度ϖ, 升交點Ω] 與每世紀變化率（J2000 黃道與分點）
  const ELEMENTS = {
    mercury: [[0.38709927, 0.20563593, 7.00497902, 252.25032350, 77.45779628, 48.33076593],
      [0.00000037, 0.00001906, -0.00594749, 149472.67411175, 0.16047689, -0.12534081]],
    venus: [[0.72333566, 0.00677672, 3.39467605, 181.97909950, 131.60246718, 76.67984255],
      [0.00000390, -0.00004107, -0.00078890, 58517.81538729, 0.00268329, -0.27769418]],
    earth: [[1.00000261, 0.01671123, -0.00001531, 100.46457166, 102.93768193, 0.0],
      [0.00000562, -0.00004392, -0.01294668, 35999.37244981, 0.32327364, 0.0]],
    mars: [[1.52371034, 0.09339410, 1.84969142, -4.55343205, -23.94362959, 49.55953891],
      [0.00001847, 0.00007882, -0.00813131, 19140.30268499, 0.44441088, -0.29257343]],
    jupiter: [[5.20288700, 0.04838624, 1.30439695, 34.39644051, 14.72847983, 100.47390909],
      [-0.00011607, -0.00013253, -0.00183714, 3034.74612775, 0.21252668, 0.20469106]],
    saturn: [[9.53667594, 0.05386179, 2.48599187, 49.95424423, 92.59887831, 113.66242448],
      [-0.00125060, -0.00050991, 0.00193609, 1222.49362201, -0.41897216, -0.28867794]]
  };
  function helio(name, T) {
    const [e0, r] = ELEMENTS[name];
    const [a, e, I, L, wbar, O] = e0.map((v, i) => v + r[i] * T);
    const w = wbar - O;
    let M = ((L - wbar) % 360 + 540) % 360 - 180;
    const Mr = M * RAD;
    let E = Mr + e * Math.sin(Mr);
    for (let k = 0; k < 8; k++) E -= (E - e * Math.sin(E) - Mr) / (1 - e * Math.cos(E));
    const xp = a * (Math.cos(E) - e), yp = a * Math.sqrt(1 - e * e) * Math.sin(E);
    const cw = Math.cos(w * RAD), sw = Math.sin(w * RAD), cO = Math.cos(O * RAD), sO = Math.sin(O * RAD), cI = Math.cos(I * RAD);
    return [(cw * cO - sw * sO * cI) * xp + (-sw * cO - cw * sO * cI) * yp,
      (cw * sO + sw * cO * cI) * xp + (-sw * sO + cw * cO * cI) * yp];
  }
  // 地心回歸黃經（度，0＝牡羊座 0°）
  function geoLon(name, jd) {
    const T = (jd - 2451545.0) / 36525;
    const [ex, ey] = helio("earth", T);
    let x, y;
    if (name === "sun") { x = -ex; y = -ey; } else { const [px, py] = helio(name, T); x = px - ex; y = py - ey; }
    const lon = Math.atan2(y, x) / RAD + 1.396971 * T; // J2000 → 當日分點（一般歲差）
    return (lon % 360 + 360) % 360;
  }
  const jdOf = (y, m, d, h, mi) => Date.UTC(y, m - 1, d, (h || 0) - 8, mi || 0) / 86400000 + 2440587.5; // 台灣時間
  const signOf = (lon) => Math.floor(lon / 30); // 0＝牡羊 … 11＝雙魚

  // ---------- 文字庫 ----------
  const ELEMENT_TEXT = { 火: "熱情、主動、行動派", 土: "務實、穩定、重結果", 風: "理性、溝通、重交流", 水: "感性、直覺、重情感" };
  const MODE_TEXT = { 開創: "喜歡起頭、帶動新局", 固定: "專注持久、意志堅定", 變動: "靈活應變、適應力強" };
  const SIGNS = [
    { name: "牡羊座", range: "3/21–4/19", el: "火", mode: "開創", ruler: "火星", color: "紅色", match: "獅子座、射手座、雙子座",
      key: "勇敢、直接、行動力", intro: "牡羊座是黃道第一個星座，像剛點燃的火，想到就做、喜歡當第一個開路的人。個性直率坦白，不喜歡拐彎抹角，遇到困難會正面迎擊。",
      good: ["行動力強，說做就做", "勇於挑戰、不怕失敗", "直率真誠，好相處"], bad: ["急躁沒耐心", "容易衝動做決定", "三分鐘熱度"],
      love: "喜歡主動追求，感情熱烈直接；需要對方給自由與新鮮感。", career: "適合需要衝勁與開創的工作：業務開發、創業、運動、急難救援、專案啟動。", money: "賺錢靠衝勁，花錢也快；適合設定自動儲蓄，避免衝動消費。", health: "頭部、臉部；容易頭痛、發炎與運動傷害，注意情緒與血壓。", lesson: "學會放慢半拍，把開始的事做完。" },
    { name: "金牛座", range: "4/20–5/20", el: "土", mode: "固定", ruler: "金星", color: "綠色", match: "處女座、摩羯座、巨蟹座",
      key: "穩定、務實、享受", intro: "金牛座重視安全感與實際成果，做事穩紮穩打，一旦決定就很有毅力。懂得欣賞美好的事物，品味好、重視生活品質。",
      good: ["穩定可靠、有耐心", "理財能力好", "品味佳、懂得生活"], bad: ["固執不易改變", "對變動容易焦慮", "佔有慾較強"],
      love: "慢熱但專一，重視承諾與實際的照顧，喜歡穩定長久的關係。", career: "適合財務、金融、不動產、設計美學、餐飲與需要耐心累積的專業。", money: "天生的理財高手，善於累積與保值，適合長期投資。", health: "喉嚨、頸部與甲狀腺；注意飲食過量與體重。", lesson: "接受變化，有時改變才是更安全的選擇。" },
    { name: "雙子座", range: "5/21–6/21", el: "風", mode: "變動", ruler: "水星", color: "黃色", match: "天秤座、水瓶座、牡羊座",
      key: "聰明、好奇、善溝通", intro: "雙子座反應快、好奇心強，對什麼都有興趣，擅長溝通與資訊整合。點子多、口才好，在人群中常是氣氛帶動者。",
      good: ["反應快、學習力強", "口才好、人緣佳", "多才多藝、適應力強"], bad: ["容易分心", "想法多變", "不易深入專注"],
      love: "需要能聊天的伴侶，重視心靈交流與趣味；怕無聊與被束縛。", career: "適合媒體、行銷、業務、教學、寫作、資訊與需要大量溝通的工作。", money: "收入來源多元，適合斜槓；注意花費分散、不易存錢。", health: "肩膀、手臂、呼吸道與神經系統；注意用腦過度與失眠。", lesson: "選定重點、深耕一項專長。" },
    { name: "巨蟹座", range: "6/22–7/22", el: "水", mode: "開創", ruler: "月亮", color: "銀白色", match: "天蠍座、雙魚座、金牛座",
      key: "顧家、溫柔、重感情", intro: "巨蟹座外表溫和、內心敏感，非常重視家庭與身邊的人，照顧人是天性。記憶力好、念舊，對有安全感的環境特別依戀。",
      good: ["體貼溫柔、會照顧人", "重情重義", "直覺敏銳"], bad: ["情緒起伏大", "容易缺乏安全感", "放不下過去"],
      love: "專情顧家，愛一個人會全心付出；需要被呵護與穩定的承諾。", career: "適合餐飲、教育、照護、不動產、人資與服務型工作。", money: "儲蓄意識強，重視家庭開銷的安全感；適合保守穩健的理財。", health: "胸部與胃部；情緒壓力容易反映在腸胃。", lesson: "照顧別人之前先照顧好自己的情緒。" },
    { name: "獅子座", range: "7/23–8/22", el: "火", mode: "固定", ruler: "太陽", color: "金色", match: "牡羊座、射手座、天秤座",
      key: "自信、慷慨、領導", intro: "獅子座天生自帶光芒，喜歡被肯定、也願意照顧身邊的人。重視榮譽與面子，做事大器、有領導魅力。",
      good: ["自信大方、有魅力", "慷慨熱心", "有領導力與責任感"], bad: ["愛面子", "自尊心強、不服輸", "容易主觀"],
      love: "熱情浪漫、喜歡被崇拜，也會把對方當寶；需要真心的讚美與重視。", career: "適合管理、表演、公關、教育、品牌與需要站上舞台的工作。", money: "花錢大方、重視品質；財運不錯，但要預留儲蓄。", health: "心臟、脊椎與背部；注意心血管與過度勞累。", lesson: "放下面子，學會傾聽與示弱。" },
    { name: "處女座", range: "8/23–9/22", el: "土", mode: "變動", ruler: "水星", color: "米白色", match: "金牛座、摩羯座、天蠍座",
      key: "細心、完美、服務", intro: "處女座觀察細膩、做事有條理，追求把事情做到最好。務實負責，樂於幫助別人解決問題，是團隊中可靠的那一位。",
      good: ["細心負責", "分析力強、有條理", "樂於助人"], bad: ["要求完美、容易挑剔", "愛操心", "對自己太嚴格"],
      love: "用行動表達愛，細心照顧對方生活；慢熱、需要時間建立信任。", career: "適合醫療、會計、品管、研究、編輯、行政與專業技術工作。", money: "精打細算、理財謹慎，適合記帳與穩健規劃。", health: "腸胃與消化系統；容易因焦慮造成腸胃不適。", lesson: "接受不完美，允許自己放鬆。" },
    { name: "天秤座", range: "9/23–10/23", el: "風", mode: "開創", ruler: "金星", color: "粉藍色", match: "雙子座、水瓶座、獅子座",
      key: "和諧、優雅、公平", intro: "天秤座重視公平與和諧，擅長協調人際關係，品味好、有美感。待人有禮、懂得換位思考，是天生的外交家。",
      good: ["善於協調溝通", "有美感與品味", "公平客觀"], bad: ["猶豫不決", "怕衝突、容易委屈自己", "依賴他人意見"],
      love: "重視浪漫與互相尊重，喜歡優雅體貼的伴侶；感情是人生重要的一部分。", career: "適合設計、時尚、法律、公關、人資、顧問與協調型工作。", money: "收入不錯但重享受，花在美的事物上；合夥求財有利。", health: "腰部與腎臟；注意作息平衡與水分代謝。", lesson: "勇敢做決定，說出真正的想法。" },
    { name: "天蠍座", range: "10/24–11/22", el: "水", mode: "固定", ruler: "冥王星（傳統：火星）", color: "深紅色", match: "巨蟹座、雙魚座、處女座",
      key: "深刻、專注、洞察", intro: "天蠍座情感深刻、意志堅強，看事情能直達核心。重視忠誠與信任，一旦投入就全力以赴，有很強的韌性與重生的力量。",
      good: ["洞察力強", "專注、有毅力", "忠誠重承諾"], bad: ["多疑、不易信任人", "佔有慾強", "記仇、情緒內藏"],
      love: "愛得深也愛得專，需要絕對的信任與忠誠；感情濃烈。", career: "適合研究、心理、金融投資、醫療、調查與需要深入鑽研的工作。", money: "對金錢敏銳，善於投資與管理共同財務。", health: "生殖泌尿系統；注意壓抑情緒造成的身心問題。", lesson: "學會放下與信任，讓感情流動。" },
    { name: "射手座", range: "11/23–12/21", el: "火", mode: "變動", ruler: "木星", color: "紫色", match: "牡羊座、獅子座、水瓶座",
      key: "自由、樂觀、探索", intro: "射手座熱愛自由與冒險，樂觀開朗，喜歡旅行、學習與探索人生的意義。說話直接幽默，走到哪裡都帶來歡樂。",
      good: ["樂觀開朗", "視野開闊、好學", "真誠直率"], bad: ["不受拘束、怕承諾", "說話太直", "粗心大意"],
      love: "喜歡能一起探索世界的伴侶，需要自由空間；感情重真誠與共同成長。", career: "適合教育、旅遊、出版、外貿、法律與需要開拓視野的工作。", money: "財運起伏、來得快去得也快；投資宜控制風險。", health: "臀部、大腿與肝臟；注意運動傷害與飲食過量。", lesson: "把熱情轉成持續的承諾。" },
    { name: "摩羯座", range: "12/22–1/19", el: "土", mode: "開創", ruler: "土星", color: "深灰色", match: "金牛座、處女座、雙魚座",
      key: "負責、堅毅、目標", intro: "摩羯座目標明確、責任心重，相信一步一腳印的努力。成熟穩重、自律性強，越晚越有成就。",
      good: ["自律、有責任感", "目標明確、耐力強", "務實可靠"], bad: ["太嚴肅、不易放鬆", "給自己壓力大", "不擅表達情感"],
      love: "感情慢熱但長久，用行動與承擔表達愛；重視對方的穩定與上進。", career: "適合管理、公職、工程、財務、建築與需要長期經營的事業。", money: "理財保守穩健，擅長長期累積，中年後財運漸佳。", health: "骨骼、關節與牙齒、皮膚；注意過勞與筋骨痠痛。", lesson: "給自己休息與享受的空間。" },
    { name: "水瓶座", range: "1/20–2/18", el: "風", mode: "固定", ruler: "天王星（傳統：土星）", color: "電光藍", match: "雙子座、天秤座、射手座",
      key: "獨立、創新、博愛", intro: "水瓶座思想獨立、走在時代前面，喜歡新事物與與眾不同的想法。重視友情與群體，對人一視同仁，有理想與人道關懷。",
      good: ["創意十足、想法前衛", "獨立自主", "重友情、有理想"], bad: ["情感疏離", "固執己見", "不按常理出牌"],
      love: "像朋友般的伴侶最適合，重視精神契合與彼此的空間。", career: "適合科技、網路、研究、社會公益、創新產業與自由工作。", money: "收入常來自創新或不尋常的管道；理財要更有紀律。", health: "小腿、腳踝與循環系統；注意神經緊繃。", lesson: "讓理性與情感取得平衡，說出感受。" },
    { name: "雙魚座", range: "2/19–3/20", el: "水", mode: "變動", ruler: "海王星（傳統：木星）", color: "海水綠", match: "巨蟹座、天蠍座、摩羯座",
      key: "浪漫、同理、想像", intro: "雙魚座感受力豐富，富有同情心與想像力，容易感受到別人的情緒。浪漫而有藝術天分，願意為所愛的人付出。",
      good: ["同理心強、溫柔", "想像力與藝術天分", "直覺敏銳"], bad: ["容易逃避現實", "界線模糊、心太軟", "情緒化"],
      love: "浪漫多情、願意犧牲奉獻；要小心為愛委屈自己。", career: "適合藝術、音樂、設計、醫療照護、心理諮商與宗教靈性工作。", money: "對錢較沒概念，容易心軟借錢；需要有人協助理財或自動儲蓄。", health: "雙腳與免疫系統；注意睡眠與情緒能量。", lesson: "設定界線，把夢想落實成計畫。" }
  ];
  // 太陽宮位法（第 N 宮＝本命太陽星座往後數 N−1 個星座）
  const HOUSES = [
    { name: "自我宮", theme: "自我、形象與新開始", sun: "生日月份能量最強，適合許願、立定目標、改變形象", tip: "主動出擊，把想做的事開個頭" },
    { name: "財帛宮", theme: "金錢、收入與價值感", sun: "注意力回到金錢與資源，適合檢視收支、爭取收入", tip: "記帳、整理財務，把錢花在有價值的地方" },
    { name: "溝通宮", theme: "溝通、學習、短程移動", sun: "訊息多、聯絡頻繁，適合學習、簽約、短程出差", tip: "把想法說清楚，順手完成文書與聯絡" },
    { name: "家庭宮", theme: "家庭、居所與內在安全感", sun: "重心回到家庭，適合整理居家、陪伴家人", tip: "放慢腳步，處理家中事務與自己的情緒" },
    { name: "戀愛宮", theme: "戀愛、創作與娛樂", sun: "心情愉快、桃花與創意都旺，適合約會、玩樂、發揮才華", tip: "安排休閒與約會，讓自己被看見" },
    { name: "工作宮", theme: "工作日常與健康", sun: "工作量增加，適合調整作息、提升效率與照顧健康", tip: "把例行事務做好，安排健康檢查" },
    { name: "伴侶宮", theme: "伴侶、合作與人際", sun: "人際與合作成為主題，關係中的需求與分歧會浮現", tip: "多聽對方意見，談合作、經營伴侶關係" },
    { name: "轉化宮", theme: "共同財務、親密與轉化", sun: "適合處理貸款、保險、共同財務，也是自我整理的時候", tip: "清理不需要的東西與關係，避免金錢糾紛" },
    { name: "遠行宮", theme: "遠行、進修與信念", sun: "視野打開，適合旅行、進修、考試、接觸新觀念", tip: "安排學習或旅行，為長遠目標充電" },
    { name: "事業宮", theme: "事業、名聲與目標", sun: "事業運的高峰，表現容易被上司與外界看見", tip: "爭取表現與升遷，設定職涯目標" },
    { name: "社群宮", theme: "朋友、社群與願望", sun: "朋友與團體帶來機會，適合拓展人脈、規劃願望", tip: "參加聚會與社群，向朋友尋求合作" },
    { name: "休養宮", theme: "休息、潛意識與整理", sun: "生日前的沉澱期，體力與運勢較低，適合休息與收尾", tip: "減少應酬，多休息、整理思緒，為新的一年做準備" }
  ];
  const VENUS = ["魅力提升、人緣好，適合打扮與表白", "財運佳，容易有進帳或想添購好東西", "人際互動甜蜜，適合聯絡感情、談合作", "家庭和樂，適合布置居家、家人聚會",
    "桃花最旺的時候，戀愛與娛樂運都好", "工作環境融洽，同事關係和諧", "伴侶關係甜蜜，單身者有機會遇到對象", "親密感加深，也可能有共同財務的好消息",
    "異地或旅途中的緣分，適合一起旅行", "職場人緣好，有利談判與爭取資源", "朋友聚會多，可能經朋友介紹認識對象", "暗戀或隱密的情感浮現，適合獨處與療癒"];
  const MARS = ["行動力爆棚，衝勁足，但注意脾氣與衝動", "為錢努力，適合積極爭取收入，忌衝動購物", "說話直接、行程繁忙，注意交通與口角", "家務與家人事務多，注意家中口角",
    "熱情高漲，運動與玩樂運強，戀愛主動", "工作量大、效率高，注意過勞與小傷", "與人競爭或意見衝突增加，合作要多溝通", "精力投入深層議題，注意財務爭執",
    "想往外跑、學新東西，旅行注意安全", "事業衝刺期，有魄力也容易與上司衝突", "團隊合作有動力，朋友間注意意見分歧", "精力較低、容易疲倦，適合在幕後默默準備"];
  const JUPITER = ["個人幸運年的起點，機會主動找上門，適合開創新局", "財運擴張，收入有成長機會，也要防過度花費", "學習、溝通、寫作與人脈拓展順利", "家庭與居住有好消息，利搬家、置產、家庭擴充",
    "戀愛、創作、子女運旺，生活樂趣增加", "工作機會多、職場環境改善，也是調養身體的好時機", "貴人與伴侶運佳，利結婚、合作簽約", "共同財務、投資與保險有收穫，適合深度自我成長",
    "利進修、留學、出國與擴展視野", "事業運大好，有升遷與名聲提升的機會", "朋友與社群帶來機會，願望容易實現", "低調累積福報的一年，適合修身養性、做公益"];
  const SATURN = ["自我要求變高，壓力來自責任，適合重新定位人生方向", "金錢壓力與理財功課，需要節流與長期規劃", "學習與溝通需要更嚴謹，文書合約要細心", "家庭責任加重，可能需要照顧家人或處理房產",
    "戀愛與創作需要耐心經營，感情走向務實", "工作負擔加重，要注意健康與作息紀律", "關係面臨考驗，適合認真面對承諾與合作條件", "共同財務、債務與信任議題需要整理",
    "信念與長期計畫接受考驗，進修需要毅力", "事業進入打底期，努力會在之後得到回報", "人際圈篩選與重整，留下真正的朋友", "內在整理期，適合放下過去、照顧身心"];
  // 太陽宮位基本分：生日月最強，第 5／9 宮（三分）與 10／11 宮次之，第 12 宮休養期最低
  const SUN_SCORE = [3, 1, 1, 0, 3, -1, 1, -1, 2, 2, 2, -2];
  const VENUS_SCORE = [1, 1, 0.5, 0.5, 1, 0, 1, 0.5, 0.5, 0.5, 0.5, -0.5];
  const MARS_SCORE = [0.5, 0.5, 0, -0.5, 0.5, -0.5, -0.5, -0.5, 0, 0.5, 0, -1];
  const rate = (s) => (s >= 4 ? "大吉" : s >= 2 ? "吉" : s >= 0 ? "平" : "注意");

  // ---------- 推算 ----------
  function analyze(o) {
    const b = o.birth;
    const jdBirth = jdOf(b.y, b.mo, b.d, b.h, b.mi);
    const sunLon = geoLon("sun", jdBirth);
    const natal = signOf(sunLon);
    const venusSign = signOf(geoLon("venus", jdBirth)), marsSign = signOf(geoLon("mars", jdBirth));
    const house = (s) => (s - natal + 12) % 12; // 0＝第一宮
    // 逐日行星位置（中午 12 點）
    const days = [];
    for (let t = Date.UTC(o.year, 0, 1); t < Date.UTC(o.year + 1, 0, 1); t += 86400000) {
      const d = new Date(t), jd = jdOf(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), 12, 0);
      const row = { m: d.getUTCMonth() + 1, d: d.getUTCDate() };
      ["sun", "mercury", "venus", "mars", "jupiter", "saturn"].forEach((p) => { row[p] = geoLon(p, jd); });
      // 水星逆行＝中午前後 2 小時黃經在減少（用當下速度判斷，留日才不會晚一兩天）
      row.mercRetro = ((geoLon("mercury", jd + 1 / 12) - geoLon("mercury", jd - 1 / 12) + 540) % 360 - 180) < 0;
      days.push(row);
    }
    // 某行星在一段日子內的星座分段：[{ sign, from:"m/d", to:"m/d", n }]
    const segments = (rows, p) => {
      const out = [];
      rows.forEach((r) => {
        const s = signOf(r[p]), last = out[out.length - 1];
        if (last && last.sign === s) { last.to = r.m + "/" + r.d; last.n++; } else out.push({ sign: s, from: r.m + "/" + r.d, to: r.m + "/" + r.d, n: 1 });
      });
      return out;
    };
    const major = (segs) => segs.slice().sort((x, y) => y.n - x.n)[0];
    // 水逆期間（全年）；每天記下所屬的那一段，月表顯示完整期間（跨月時兩個月都顯示同一段，不會只剩一天）
    const retro = [];
    days.forEach((r, i) => {
      if (r.mercRetro && !(i && days[i - 1].mercRetro)) retro.push({ from: r.m + "/" + r.d, to: r.m + "/" + r.d, sign: signOf(r.mercury) });
      if (r.mercRetro) { retro[retro.length - 1].to = r.m + "/" + r.d; r.retroPeriod = retro[retro.length - 1]; }
    });
    const months = [];
    for (let m = 1; m <= 12; m++) {
      const rows = days.filter((r) => r.m === m);
      const sunSegs = segments(rows, "sun"), venusSeg = major(segments(rows, "venus")), marsSeg = major(segments(rows, "mars"));
      const sunMain = major(sunSegs);
      const retroDays = rows.filter((r) => r.mercRetro);
      const hSun = house(sunMain.sign), hVenus = house(venusSeg.sign), hMars = house(marsSeg.sign);
      let score = SUN_SCORE[hSun] + VENUS_SCORE[hVenus] + MARS_SCORE[hMars] - (retroDays.length >= 10 ? 1 : retroDays.length ? 0.5 : 0);
      months.push({
        m, sunSegs: sunSegs.map((s) => ({ ...s, house: house(s.sign) })), hSun, hVenus, hMars, venusSign: venusSeg.sign, marsSign: marsSeg.sign,
        retro: retroDays.length ? retroDays[0].retroPeriod : null,
        score, rating: rate(score)
      });
    }
    const jupiter = segments(days, "jupiter").map((s) => ({ ...s, house: house(s.sign) }));
    const saturn = segments(days, "saturn").map((s) => ({ ...s, house: house(s.sign) }));
    return { o, natal, sunLon, venusSign, marsSign, months, jupiter, saturn, retro };
  }

  // ---------- 版面（沿用紫微報告的 zr-* 樣式）----------
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const pad2 = (n) => String(n).padStart(2, "0");
  const SN = (i) => SIGNS[i].name;
  const HN = (h) => "第" + (h + 1) + "宮" + HOUSES[h].name.replace(/宮$/, "");
  const MN = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"];
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
  const h1 = (num, text) => '<div class="zr-h1"><span class="zr-num">' + num + "</span>" + esc(text) + "</div>";
  const h2 = (text) => '<div class="zr-h2">' + esc(text) + "</div>";
  const callout = (html) => '<div class="zr-callout">' + html + "</div>";
  const ul = (items, cls) => '<ul class="' + (cls || "zr-list") + '">' + items.map((t) => "<li>" + t + "</li>").join("") + "</ul>";
  const planetLine = (segs, label) => segs.map((s) => s.from + (s.from !== s.to ? "–" + s.to : "") + " " + label + "在" + SN(s.sign) + "（" + HN(s.house) + "）").join("；");

  function render(R) {
    const o = R.o, S = SIGNS[R.natal];
    const root = document.createElement("div");
    root.className = "zr-report xz-report";
    // 每個區塊是 PDF 分頁的最小單位；pageBreak＝強制新頁
    const add = (html, pageBreak) => {
      const b = document.createElement("div");
      b.className = "zr-block";
      b.innerHTML = html;
      if (pageBreak) b.setAttribute("data-pdf-break-before", "");
      root.appendChild(b);
      return b;
    };
    const b = o.birth;
    const genderText = o.gender === "male" ? "男" : "女";

    // 封面
    const best = R.months.slice().sort((x, y) => y.score - x.score).slice(0, 3).sort((x, y) => x.m - y.m);
    const low = R.months.slice().sort((x, y) => x.score - y.score).slice(0, 2).sort((x, y) => x.m - y.m);
    add('<div class="zr-kicker">十二星座　·　</div><div class="zr-title">' + S.name + "・" + o.year + " 年運勢報告</div>" +
      '<div class="zr-sub"><b>' + esc(o.name) + "</b>　｜　" + genderText + "・" + S.el + "象・" + S.mode + "星座・守護星" + S.ruler + "</div>" +
      '<div class="zr-rule"></div>' +
      '<div class="zr-cards">' +
      '<div class="zr-card"><div class="zr-card-label">太陽星座</div><div class="zr-card-big">' + S.name.replace("座", "") + '</div><div class="zr-card-desc">' + S.range + "・" + S.key + "</div></div>" +
      '<div class="zr-card"><div class="zr-card-label">' + o.year + ' 最旺月份</div><div class="zr-card-big">' + best.map((x) => x.m).join("・") + '<span style="font-size:14px">月</span></div><div class="zr-card-desc">' + best.map((x) => HOUSES[x.hSun].theme.split("、")[0]).join("、") + "運勢最佳</div></div>" +
      '<div class="zr-card"><div class="zr-card-label">' + o.year + ' 需留意</div><div class="zr-card-big">' + low.map((x) => x.m).join("・") + '<span style="font-size:14px">月</span></div><div class="zr-card-desc">放慢腳步、多休息，重要決定再三確認</div></div>' +
      "</div>");

    // 01 個人星座資料
    add(h1("01", "個人星座資料") + callout("你的太陽星座是<b>" + S.name + "</b>（出生時太陽位於" + S.name + " " + (R.sunLon % 30).toFixed(1) + "°），屬" + S.el + "象、" + S.mode + "星座：" +
      ELEMENT_TEXT[S.el] + "，" + MODE_TEXT[S.mode] + "。"));
    add(table([["項目", 18], ["內容", 82]], [
      ["出生", "公元 " + b.y + "-" + pad2(b.mo) + "-" + pad2(b.d) + " " + pad2(b.h) + ":" + pad2(b.mi) + "（台灣時間），" + genderText],
      ["太陽星座", S.name + "（" + S.range + "）"],
      ["元素／模式", S.el + "象（" + ELEMENT_TEXT[S.el] + "）／" + S.mode + "（" + MODE_TEXT[S.mode] + "）"],
      ["守護星", S.ruler],
      ["金星星座", SN(R.venusSign) + "——" + SIGNS[R.venusSign].love],
      ["火星星座", SN(R.marsSign) + "——行動風格帶有" + SIGNS[R.marsSign].key.split("、")[0] + "、" + SIGNS[R.marsSign].key.split("、")[1] + "的特質"],
      ["幸運色／速配", S.color + "／" + S.match]
    ], { darkFirst: true }));
    add('<div class="zr-note">金星星座看感情與審美、火星星座看行動與企圖心；上升與月亮星座需要出生地點與更精密的星曆，本報告不列入。</div>');

    // 02 星座個性分析
    add(h1("02", S.name + "個性分析") + callout(S.intro));
    add(h2("優點與盲點") + table([["優點", 50], ["需要注意", 50]], S.good.map((g, i) => [g, S.bad[i]]), { darkFirst: true }));
    add(h2("各面向特質") + table([["面向", 14], ["分析", 86]], [
      ["感情", S.love], ["事業", S.career], ["財運", S.money], ["健康", S.health], ["人生課題", S.lesson]
    ]));

    // 03 年度大運（木星／土星）
    add(h1("03", o.year + " 年度大運") + callout(
      "木星帶來擴張與機會，土星帶來責任與功課。以" + S.name + "為第一宮，" + o.year + " 年木星走" +
      R.jupiter.map((s) => HN(s.house)).join("→") + "，土星走" + R.saturn.map((s) => HN(s.house)).join("→") + "。"));
    add(h2("木星：今年的幸運領域") + ul(R.jupiter.map((s) => "<b>" + s.from + "–" + s.to + " 木星在" + SN(s.sign) + "（" + HN(s.house) + "）：</b>" + JUPITER[s.house] + "。")));
    add(h2("土星：今年的功課") + ul(R.saturn.map((s) => "<b>" + s.from + "–" + s.to + " 土星在" + SN(s.sign) + "（" + HN(s.house) + "）：</b>" + SATURN[s.house] + "。")));
    add(h2("水星逆行") + ul(R.retro.length ? R.retro.map((r) => "<b>" + r.from + "–" + r.to + "（" + SN(r.sign) + "，" + HN((r.sign - R.natal + 12) % 12) + "）：</b>" +
      "溝通、交通、合約與電子產品容易出狀況，" + HOUSES[(r.sign - R.natal + 12) % 12].theme.split("、")[0] + "相關事務多確認、少做重大決定。") : ["今年沒有水星逆行。"]));

    // 04 每月運勢
    add(h1("04", o.year + " 每月運勢") + callout(
      "全年最旺的是" + best.map((x) => MN[x.m - 1] + "月").join("、") + "，需要放慢的是" + low.map((x) => MN[x.m - 1] + "月").join("、") +
      "。每月主題看太陽走到你的第幾宮；金星看感情與財運，火星看行動力。"), true);
    add(table([["月份", 9], ["本月主題（太陽）", 33], ["感情財運（金星）", 23], ["行動力（火星）", 26], ["評估", 9]],
      R.months.map((x) => [x.m + " 月", "<b>" + HOUSES[x.hSun].theme + "</b><br>" + HOUSES[x.hSun].sun + (x.retro ? '<br><span style="color:#650707">水逆 ' + x.retro.from + "–" + x.retro.to + "</span>" : ""),
        VENUS[x.hVenus], MARS[x.hMars], x.rating]), { rating: true }));
    R.months.forEach((x) => {
      add(h2(o.year + " 年 " + x.m + " 月　" + HOUSES[x.hSun].theme + "（" + x.rating + "）") + ul([
        "<b>太陽：</b>" + planetLine(x.sunSegs, "太陽") + "。" + HOUSES[x.hSun].sun + "。",
        "<b>金星在" + SN(x.venusSign) + "（" + HN(x.hVenus) + "）：</b>" + VENUS[x.hVenus] + "。",
        "<b>火星在" + SN(x.marsSign) + "（" + HN(x.hMars) + "）：</b>" + MARS[x.hMars] + "。"
      ].concat(x.retro ? ["<b>水星逆行 " + x.retro.from + "–" + x.retro.to + "：</b>簽約、購買 3C、出遠門前多確認，舊事與舊人可能回頭。"] : [])
        .concat(["<b>本月建議：</b>" + HOUSES[x.hSun].tip + "。"])));
    });

    // 05 總結
    add(h1("05", "總結與提醒") + callout(S.name + "的你在 " + o.year + " 年：把握" + best.map((x) => MN[x.m - 1] + "月").join("、") + "主動出擊；" +
      low.map((x) => MN[x.m - 1] + "月").join("、") + "放慢步調、多休息。木星帶來的機會在「" + R.jupiter.map((s) => HOUSES[s.house].theme.split("、")[0]).join("、") +
      "」，土星要你用心經營「" + R.saturn.map((s) => HOUSES[s.house].theme.split("、")[0]).join("、") + "」。"));
    add(ul(["發揮" + S.name + "的優勢：" + S.good.join("、"), "提醒自己：" + S.lesson, "水逆期間重要合約、大筆購物與出遠門多留緩衝"], "zr-check") +
      h2("說明") + ul(["星座運勢是傳統文化的詮釋工具，適合用來自我反思與規劃；重要決定請以自身狀況與專業意見為準。"]) +
      '<div class="zr-end">Aries 命理工作室　·　' + new Date().getFullYear() + "/" + (new Date().getMonth() + 1) + "/" + new Date().getDate() + " 產生</div>");
    return root;
  }

  window.Xingzuo = { SIGNS, analyze, render, geoLon, jdOf };
})();
