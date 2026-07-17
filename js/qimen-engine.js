/*
 * 奇門遁甲命盤引擎
 * 參考資料：
 * 1. http://www.teacher.aedocenter.com/mywebB/Newbook-9/nh-19.htm、nh-20.htm（奇門遁甲教學二、三）
 *    → 廿四節氣配九局口訣、符首（六甲旬首）對照表、地盤三奇六儀佈局公式（已用官網 2 筆資料交叉驗證）
 * 2. C:\Users\aries\OneDrive\圖片\ClaudeCode\奇門遁甲\奇門格局.pdf（Meta Academy 教材，跟八字課程同一家）
 *    → 天盤＋地盤 81 格局對照表（9×9 天干組合，含名稱與吉凶解義）
 * 3. 現場實測參考站：https://product.meta-academy.biz/qimenminpan?date=choose-date&year=Y&month=M&day=D&hour=H&min=Mi&type=qimenmingpan
 * 4. 使用者提供的「拆補法」六旬三元權威說明＋2022-09-15辛未日（陰遁三局）驗證範例
 *    → 局數三元判斷的正確公式（見下方 getYuanIdxOfDay／determineJu 註解）
 *
 * 目前狀態（尚未完成，僅供內部測試）：
 * - 局數判斷、符首、地盤三奇六儀佈局：已用三筆官網資料＋使用者提供的權威公式交叉驗證，關鍵細節：
 *   1. 符首要用「時柱」的旬首，不是日柱（奇門遁甲是時家之學）
 *   2. 局數用標準拆補法：日柱本身在六十甲子的序號決定「元別」（上／中／下，跟節氣時刻無關，
 *      純粹看日柱是六十甲子第幾位），再用「現實中目前所在的節氣」去查表對應局數
 *   3. 符首落中宮時寄坤二宮一起計算（五宮無星無門）
 * - 值符值使＋天盤九星／人盤八門飛佈：已用 3 筆官網資料驗證（1992-02-02 陽六局反吟伏吟特殊格局、
 *   2026-06-15 陽九局、2025-08-20 陰八局），星、門逐宮全部對上，關鍵發現：
 *   1. 值符星落宮＝「時干」在地盤上的位置（符首常遺加時幹）
 *   2. 值使門落宮＝沿「洛書飛泊順序」（排地盤用的那個順序）走「時辰在符首旬內的順序數」步，
 *      陽遁從符首所在宮（fuShouGong）起走，陰遁從「值符星已算好的新宮」起走
 *      （陰遁這條規則只用 1 筆資料驗證過，可能還需要更多資料確認）
 *      → 值符星和值使門通常會落在不同宮，不是同一宮，這點跟直覺不同要注意
 *   3. 其餘 8 星／8 門的旋轉，用的不是排地盤用的「洛書飛泊順序」（坎坤震巽中乾兌艮離，按數字 1-9 走），
 *      而是後天八卦圖上「空間實際順時針方向」（巽離坤兌乾坎艮震，不含中宮）－－這是最容易搞混、
 *      也是這次真正測出來的關鍵：兩種順序都是「繞九宮一圈」但路徑不同，排地盤／算值使步數用前者，
 *      九星八門旋轉排列用後者
 *   4. 每宮天盤顯示兩個天干：前者是「隨星移動後」的天盤干、後者是原本地盤固定的干
 * - 八神（神盤）飛佈：以值符星落宮為首，其餘 7 神按固定順序沿「空間順時針（陽遁）／逆時針（陰遁）」排列，
 *   尚未用官網資料驗證
 * - 64 卦：測過每宮六十四卦＝天盤干對應卦（上卦）＋地盤干對應卦（下卦）疊起來，但同一個天干在不同測資裡
 *   對應到不同的卦（例如丙在一筆資料是巽、另一筆資料是兌），單純「干→卦」對照表不成立，還沒找到正確規則
 * - 門迫／宮迫／入墓／六儀擊刑等格局提示：尚未實作，跟 81 格局表是不同機制
 */

const ZHI_ORDER_QM = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const GAN_ORDER_QM = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];

// 洛書九宮飛泊固定順序（口訣：中宮飛出乾，次與兌艮連，離坎接坤位，震循巽入中）
// 用宮位數字表示（1坎 2坤 3震 4巽 5中 6乾 7兌 8艮 9離），陽遁順此順序、陰遁逆此順序
// 這個順序只用在「排地盤三奇六儀」，跟九星／八門飛佈用的順序不同（見下面 SPATIAL_CW_ORDER）
const FEI_BO_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9];

// 九宮格「空間實際順時針」順序（後天八卦圖上的位置，不含中宮）：
//   巽(左上) 離(上) 坤(右上)
//   震(左)   中     兌(右)
//   艮(左下) 坎(下) 乾(右下)
// 順時針：巽→離→坤→兌→乾→坎→艮→震→(回到巽)
// 排九星（天盤）、八門（人盤）飛佈時，陽遁沿這個順序走、陰遁反過來走，
// 跟排地盤三奇六儀用的「洛書飛泊順序」是不同路徑，這是這次測資料才抓到的關鍵區別
const SPATIAL_CW_ORDER = [4, 9, 2, 7, 6, 1, 8, 3];

// 九宮方位／卦名／五行對照（宮位數字 → 資訊）
const GONG_INFO = {
  1: { gua: "坎", dir: "正北", wuxing: "水" },
  2: { gua: "坤", dir: "西南", wuxing: "土" },
  3: { gua: "震", dir: "正東", wuxing: "木" },
  4: { gua: "巽", dir: "東南", wuxing: "木" },
  5: { gua: "中", dir: "中宮", wuxing: "土" },
  6: { gua: "乾", dir: "西北", wuxing: "金" },
  7: { gua: "兌", dir: "正西", wuxing: "金" },
  8: { gua: "艮", dir: "東北", wuxing: "土" },
  9: { gua: "離", dir: "正南", wuxing: "火" }
};

// 九星本位（固定配置，宮位數字 → 星名），中宮寄坤二宮（一般寄宮做法，與地盤禽星寄宮一致）
const XING_BEN_WEI = { 1: "天蓬", 2: "天芮", 3: "天衝", 4: "天輔", 5: "天禽", 6: "天心", 7: "天柱", 8: "天任", 9: "天英" };
// 八門本位（固定配置，宮位數字 → 門名），五宮無門、寄二宮
const MEN_BEN_WEI = { 1: "休", 2: "死", 3: "傷", 4: "杜", 6: "開", 7: "驚", 8: "生", 9: "景" };
// 八神固定排列順序（值符起，陽遁順排、陰遁逆排）：第 5、6 個神的名稱依陰陽遁季節不同
// 冬至到夏至（陽遁半年）＝勾陳、朱雀；夏至到冬至（陰遁半年）＝白虎、玄武
const SHEN_ORDER_YANG = ["值符", "騰蛇", "太陰", "六合", "勾陳", "朱雀", "九地", "九天"];
const SHEN_ORDER_YIN = ["值符", "騰蛇", "太陰", "六合", "白虎", "玄武", "九地", "九天"];

// 符首（六甲旬首）對照表：日柱所在的旬 → 符首代表的六儀天干
// 甲子同六戊、甲戌同六己、甲申同六庚、甲午同六辛、甲辰同六壬、甲寅同六癸
const XUN_SHOU_LIST = [
  { xun: "甲子", startIdx: 0, yi: "戊" },
  { xun: "甲戌", startIdx: 10, yi: "己" },
  { xun: "甲申", startIdx: 20, yi: "庚" },
  { xun: "甲午", startIdx: 30, yi: "辛" },
  { xun: "甲辰", startIdx: 40, yi: "壬" },
  { xun: "甲寅", startIdx: 50, yi: "癸" }
];

// 廿四節氣配九局口訣（陽遁：冬至～芒種／陰遁：夏至～大雪），每個節氣三個數字＝上元／中元／下元局數
const JU_TABLE_YANG = {
  冬至: [1, 7, 4], 驚蟄: [1, 7, 4], 小寒: [2, 8, 5],
  大寒: [3, 9, 6], 春分: [3, 9, 6], 雨水: [9, 6, 3],
  清明: [4, 1, 7], 立夏: [4, 1, 7], 立春: [8, 5, 2],
  穀雨: [5, 2, 8], 小滿: [5, 2, 8], 芒種: [6, 3, 9]
};
const JU_TABLE_YIN = {
  夏至: [9, 3, 6], 白露: [9, 3, 6], 小暑: [8, 2, 5],
  大暑: [7, 1, 4], 秋分: [7, 1, 4], 立秋: [2, 5, 8],
  寒露: [6, 9, 3], 立冬: [6, 9, 3], 處暑: [1, 4, 7],
  霜降: [5, 8, 2], 小雪: [5, 8, 2], 大雪: [4, 7, 1]
};
// 陽遁節氣（冬至到芒種前）／陰遁節氣（夏至到大雪前）
const YANG_JIEQI_ORDER = ["冬至", "小寒", "大寒", "立春", "雨水", "驚蟄", "春分", "清明", "穀雨", "立夏", "小滿", "芒種"];
const YIN_JIEQI_ORDER = ["夏至", "小暑", "大暑", "立秋", "處暑", "白露", "秋分", "寒露", "霜降", "立冬", "小雪", "大雪"];

// lunar-javascript 的節氣名稱有些是簡體字，統一轉回繁體以便對照上面的表
const JIEQI_SIMP_TO_TRAD = { 惊蛰: "驚蟄", 谷雨: "穀雨", 小满: "小滿", 芒种: "芒種", 处暑: "處暑" };
function normalizeJieQiName(name) {
  return JIEQI_SIMP_TO_TRAD[name] || name;
}

// 宮位右下角直式標籤（使用者提供的規則，尚未全部補齊，缺的先不顯示）：
// A. 八門對應的人生領域文字（8 個都有給）
const MEN_MEANING = { 休: "家庭", 生: "財帛", 傷: "地位", 杜: "智慧", 景: "形象", 死: "田宅", 驚: "心靈", 開: "官祿" };
// B/C. 坤／乾宮固定加顯示六親文字（母親／父親），跟門的文字並列（不是取代），用 2026-07-10 01:30
// 官網資料核對出來：乾六宮同時顯示「父親」跟「財帛」（生門的文字）兩組，不是只顯示六親字；
// 其餘 6 宮的六親文字使用者尚未給，先不補
const GONG_KINSHIP = { 坤: "母親", 乾: "父親" };
// D/E. 八門五行（跟人盤配色用的五行一致）＋ 五行相剋表：門剋宮 → 門迫；宮剋門 → 宮迫（兩個方向互斥，
// 同一組五行不會同時觸發），用使用者給的例子核對過：巽木剋死門土＝宮迫、杜門木剋艮土＝門迫
const MEN_WUXING = { 休: "水", 死: "土", 傷: "木", 杜: "木", 開: "金", 驚: "金", 生: "土", 景: "火" };
const WX_CONQUERS_QM = { 火: "金", 土: "水", 水: "火", 金: "木", 木: "土" };
// F. 九星對應文字，目前使用者只給了這兩個，其餘 7 星先不補
const XING_MEANING = { 天芮: "健康", 天輔: "教育" };
// G. 八神對應文字，目前使用者只給了這一個，其餘 7 神先不補
const SHEN_MEANING = { 六合: "感情" };
// H. 天干入墓：四維宮（隅宮：乾六、艮八、巽四、坤二）各自對應固定的入墓天干，四正宮（坎一、震三、
//    離九、兌七）不會有入墓。原本依「十天干除甲隱遁外、其餘9干五行墓庫落辰戌丑未」的理論推算，
//    但用使用者提供的官方對照圖重新核對後發現坤二宮實際上是「甲、癸」（不是原本推算的「癸、乙」），
//    乾六宮是「乙、丙、戊」（比原本推算多一個乙）：巽四宮辛壬、艮八宮丁己庚兩宮跟原本推算一致，
//    沒有變動。甲雖然在其餘計算裡是隱干、不會出現在地盤／天盤上，但對照圖裡坤宮明確列了甲，這裡
//    仍照圖列出（實務上因為天地盤本來就不會出現甲，坤宮的「甲入墓」在目前資料結構下不會被觸發，
//    純粹是忠實呈現對照表）。不論天盤干或地盤干，只要落入對應宮位就各自觸發（兩個都觸發就各自
//    顯示一次，同干只顯示一次）。
//    各宮對應的墓庫地支（使用者補充的背景資料，目前程式沒有用到地支比對，純粹記錄依據）：
//    巽四宮＝辰、坤二宮＝未、乾六宮＝戌、艮八宮＝丑（即傳統五行「辰戌丑未」四庫）。
const RUMU_STEMS = { 乾: ["乙", "丙", "戊"], 艮: ["丁", "己", "庚"], 巽: ["辛", "壬"], 坤: ["甲", "癸"] };

// I/J. 兄弟＝月柱天干落在天盤的宮位、子女＝時柱天干落在天盤的宮位（跟命宮用日柱天干是同一套邏輯，
// 只是換一個柱位；不是綁在命宮本身，是各自獨立找自己那一柱的天干落宮）；落中宮時都寄坤二宮，
// 落宮判斷已在呼叫端（calculateQimenHeader）算好，這裡只接現成的布林值
function buildCornerWords(g, men, xing, shen, tianGan, diGan, isXiongDi, isZiNu, isYiMaGong) {
  const words = [];
  if (MEN_MEANING[men]) words.push({ text: MEN_MEANING[men], type: "main" });
  const gua = GONG_INFO[g].gua;
  const kin = GONG_KINSHIP[gua];
  if (kin) words.push({ text: kin, type: "kin" });
  const menWx = MEN_WUXING[men];
  const gongWx = GONG_INFO[g].wuxing;
  if (menWx && WX_CONQUERS_QM[menWx] === gongWx) words.push({ text: "門迫", type: "menpo" });
  if (menWx && WX_CONQUERS_QM[gongWx] === menWx) words.push({ text: "宮迫", type: "gongpo" });
  if (XING_MEANING[xing]) words.push({ text: XING_MEANING[xing], type: "xing" });
  if (SHEN_MEANING[shen]) words.push({ text: SHEN_MEANING[shen], type: "shen" });
  if (isXiongDi) words.push({ text: "兄弟", type: "xiongdi" });
  if (isZiNu) words.push({ text: "子女", type: "zinu" });
  // 驛馬落宮：驛馬地支用固定羅盤位置（跟空亡／天乙同一張表）換算成宮位，該宮加註「遷移」
  if (isYiMaGong) words.push({ text: "遷移", type: "yima" });
  // 入墓：只看天盤干跟宮位的關係，不看地盤干（原本天地盤各自判斷，使用者確認入墓只認天盤干，
  // 地盤干不列入判斷，已移除地盤干這條分支）
  const rumuList = RUMU_STEMS[gua] || [];
  if (rumuList.includes(tianGan)) words.push({ text: tianGan + "入墓", type: "rumu" });
  return words;
}

// 天盤＋地盤 81 格局對照表（來自 奇門格局.pdf，天干組合 → [名稱, 解義]）
// key 格式："天盤干+地盤干"，例如 "乙乙"
const GEJU_81 = {
  乙乙: ["日奇伏吟", "宜靜不宜動。不利求名利。道路彎曲，進展不大，慢。"],
  乙丙: ["奇儀順遂", "日月齊聚，謀事多吉。貴人多，遷官進職。"],
  乙丁: ["奇儀相佐", "日星齊聚，木火通明。最利文書，考試。有機會、易成。"],
  乙戊: ["陰害陽門", "利女人或暗中行事，不利於公開。門吉尚可謀事，門凶則凶。"],
  乙己: ["日奇入墓", "機會被埋沒。貴人難以發揮，助力減。遇凶更凶，遇吉開門為地遁。"],
  乙庚: ["日奇被刑", "爭吵，訴訟，對立。陰上陽下，違反常規，夫妻同床異夢。"],
  乙辛: ["青龍逃走", "破財，損兵，人才流失。離去，消失。"],
  乙壬: ["日奇入地", "主有長幼悖亂，官訟是非，謀害之事。"],
  乙癸: ["奇入地網", "宜退，躲避災難。宜修道、隱藏策謀。不利進攻。"],
  丙乙: ["日月並行", "利於合作，合夥，共同謀事。"],
  丙丙: ["月奇悖師", "火上澆油。容易偏激過火，亂了方寸，宜冷靜。"],
  丙丁: ["星奇朱雀", "平安喜樂，利貴人文書。遇吉門為天遁、人遁。"],
  丙戊: ["飛鳥跌穴", "好事歸來，謀事多吉。測病則凶。"],
  丙己: ["火悖入刑", "丙為希望，己為私欲，表裡不一，奸詐之象。"],
  丙庚: ["熒入太白", "賊必離。鬥爭，衝動壞事，破財擋災。測病則吉。"],
  丙辛: ["日月相會", "利於合作，合夥，共同謀事可成。"],
  丙壬: ["火入天羅", "是非，矛盾，變化。宜靜不宜動。"],
  丙癸: ["悖師華蓋", "小人破壞，暗箭傷人，招來禍害。"],
  丁乙: ["玉女奇生", "主新的變化。宜開始計劃，但不宜攻。主結婚吉。"],
  丁丙: ["星隨月轉", "貴人強大。但要做能駕馭的事，不然因小失大。"],
  丁丁: ["奇入太陰", "利文書。丁奇伏吟也吉，謀事可望。"],
  丁戊: ["青龍轉光", "吉，主遇到困難出現轉機，希望。"],
  丁己: ["火入勾陳", "陰人壞事。主奸私仇怨、宜防備小人。"],
  丁庚: ["玉女刑殺", "主消息受阻隔。謀事裹足不前又回到原點。"],
  丁辛: ["玉女伏虎", "諸事不順。罪人獲釋、貴人入囚。易犯錯誤。"],
  丁壬: ["五神互合", "百事可成，得貴人輔助。淫穢之合。"],
  丁癸: ["朱雀投江", "音訊全無，石沉大海，謀事難成。"],
  戊乙: ["青龍和會", "利於合作，資源整合，能得助力。不利單獨行事。"],
  戊丙: ["青龍返首", "求名求利、百事皆吉。測病則凶。"],
  戊丁: ["青龍耀明", "機會重返，謀事可望。"],
  戊戊: ["青龍伏吟", "障礙重重，停滯不前。以守為攻。"],
  戊己: ["貴人入獄", "貴人難求，難有助力。錢入陷阱，不利合夥。"],
  戊庚: ["值符飛宮", "懷才不遇，主換人換平台。吉事不吉，凶事更凶。"],
  戊辛: ["青龍折足", "半途而廢，夭折，損傷，意外，錯誤。"],
  戊壬: ["青龍破獄", "龍入囚，不利的變化。"],
  戊癸: ["青龍華蓋", "主避災。合夥門吉事吉，門凶則凶。"],
  己乙: ["墓神不明", "事不明確，看不清前路，宜退居觀望。不宜進取。"],
  己丙: ["火悖地戶", "火落土中，希望落空。合作不成，互相攻擊。"],
  己丁: ["朱雀入墓", "先凶後吉，浴火重生。宜緩謀，後有轉機。"],
  己戊: ["犬遇青龍", "展現才華，方得貴人助力。新事物，新機會。"],
  己己: ["地戶逢鬼", "貪欲重，陷阱四伏。百事不遂，謀事多凶。"],
  己庚: ["刑格返名", "陰謀，阻礙，破壞，波折重重。"],
  己辛: ["游魂入墓", "陰魂鬼魅，小人作祟、看不清晰。宜謹慎。"],
  己壬: ["地網高張", "爭端，是非，暗流洶湧，危機處處。宜守。"],
  己癸: ["地刑玄武", "暗中破壞，偷盜，犯罪，欺騙。需防範。"],
  庚乙: ["太白逢星", "牽絆，留念。退而求其次，宜與異性合作。"],
  庚丙: ["太白入熒", "賊必到，主破財，勞心費力。主攻，先發制人。"],
  庚丁: ["太白受刑", "金屋藏嬌。婚外情，男女關係起爭執。"],
  庚戊: ["太白伏宮", "忌求財，合夥；因錢鬧翻，傷人傷財。"],
  庚己: ["太白大刑", "談判失敗，惹上官非，牢獄之災。身心靈受折磨。"],
  庚庚: ["太白同宮", "戰格。爭鬥，競爭，橫禍，不利合作。宜攻，方能制敵。"],
  庚辛: ["太白重鋒", "出行有災，越久越凶。一山不容二虎，不利合夥。"],
  庚壬: ["太白退位", "路途迷失，音訊難通，障礙，變動。"],
  庚癸: ["太白沖刑", "相沖，對立，分開。漂泊不定。"],
  辛乙: ["白虎猖狂", "諸事不吉。分離，破壞，凶狠，家敗。"],
  辛丙: ["干合悖師", "因財致訟，不利合夥。門吉則吉，門凶則凶。"],
  辛丁: ["獄神得奇", "求財獲利倍增，意外收穫。犯錯也被寬恕。"],
  辛戊: ["困龍被傷", "破財，缺損。應安分守己，宜守不宜攻。"],
  辛己: ["入獄自刑", "自己造成錯誤，有苦難言。奴欺主，背叛。"],
  辛庚: ["白虎出力", "兩虎相鬥，不利合作。"],
  辛辛: ["伏吟天庭", "自刑；自己犯錯，引來惡果。瑕疵，漏洞百出。"],
  辛壬: ["凶蛇入獄", "爭吵，纏繞。"],
  辛癸: ["天牢華蓋", "判斷錯誤，誤入歧途。"],
  壬乙: ["小蛇得勢", "貴人相助，得以發展。宜以柔克剛。"],
  壬丙: ["水蛇入火", "口舌，阻礙，混亂，兩敗俱傷。"],
  壬丁: ["干合蛇刑", "先凶後吉，利於談判，合作。"],
  壬戊: ["小蛇化龍", "成長，進步，有助力之象。運勢好轉。"],
  壬己: ["反吟蛇刑", "相沖，矛盾，對立。宜守，動則凶。"],
  壬庚: ["太白擒蛇", "進展受阻。宜公平中立，明辨是非，善惡分明。"],
  壬辛: ["螣蛇相纏", "陷阱，欺瞞，內憂外患，問題加劇。"],
  壬壬: ["蛇入天羅", "秩序混亂，危機到來。"],
  壬癸: ["陰陽重地", "曖昧醜事被揭發，關係渾濁，糾纏不清。"],
  癸乙: ["華蓋逢星", "謀事多吉，但宜低調內斂。遇凶則凶。"],
  癸丙: ["華蓋悖師", "陰人破害，小人當道。動則出亂。"],
  癸丁: ["騰蛇夭矯", "杯弓蛇影，患得患失，問題糾纏不清。"],
  癸戊: ["天乙會合", "利資源整合，合作。臨吉門利財。遇凶招官非。"],
  癸己: ["華蓋地戶", "陷阱四伏，宜藏身遁形。靜守無凶，動則不利。"],
  癸庚: ["太白入網", "相沖。有危機，阻礙，衝突。不宜合作。"],
  癸辛: ["網蓋天牢", "地網難逃，寸步難行，行則被套牢。測病大凶。"],
  癸壬: ["復見螣蛇", "一再不成，重複著錯誤。另謀高就，另謀對象。"],
  癸癸: ["天網四張", "大凶格。謀事難成，靜觀其變。退一步海闊天空。"]
};

// 天乙：即「天乙值符星」（值符也）目前飛臨的宮位——值符隨時干飛宮，找「時干」目前落在天盤的哪一宮
// （不是固定地盤位置，天盤干是轉動過的）。跟子女是同一個算式（都是找時干落在天盤的宮位），直接共用
// calculateQimenHeader 裡已經算好的 ziNuGong，不用另外重算。用 2026-07-11 15:30 丙申時這筆使用者提供
// 的資料驗證：時干丙，天盤干顯示丙的宮位是坤二宮（圖上丙戊那格），坤二宮方位西南，跟使用者給的答案
// 「天乙：西南」完全吻合。

function getGeju81(tianGan, diGan) {
  const entry = GEJU_81[tianGan + diGan];
  return entry ? { name: entry[0], desc: entry[1] } : null;
}

// 六儀擊刑：固定的儀→宮對照（跟排地盤的局數無關，是六儀本身「隱藏的甲」與該宮地支構成三刑的固定關係）
// 甲子戊落震三宮、甲戌己落坤二宮、甲申庚落艮八宮、甲午辛落離九宮、甲辰壬落巽四宮、甲寅癸落巽四宮
// 判斷條件：只看天盤干是否為目標天干（該儀真正落到這個宮位上），地盤干不列入判斷──
// 跟入墓的判斷邏輯（只看天盤干）保持一致。原本以為地盤干是特定奇（乙，或三奇乙丙丁）會化解，
// 用 2004-06-07 11:45 這筆資料核對出破綻：坤2宮天盤干己（符合）、地盤干乙，照「乙能化解」的舊
// 判斷式應該不觸發，但官網仍然標示六儀擊刑，可見地盤干不管是什麼都不影響判斷。改成「只看天盤干」
// 之後，目前手上所有資料都吻合：
//   1992-02-02 00:01：離9（天盤辛）、艮8（天盤庚）→ 觸發
//   2013-04-14 03:45：離9（天盤辛）→ 觸發
//   2004-01-14 11:45：坤2（天盤己）→ 觸發
//   2004-06-07 11:45：坤2（天盤己）、巽4（天盤癸）→ 觸發
const JI_XING_MAP = { 3: ["戊"], 2: ["己"], 8: ["庚"], 9: ["辛"], 4: ["壬", "癸"] };
function hasJiXing(gong, tianGan, diGan) {
  const targets = JI_XING_MAP[gong];
  if (!targets) return false;
  return targets.includes(tianGan);
}

// 空亡：時柱天干地支代入公式算出旬空的兩個地支（跟符首一樣用時柱，時家之學），
// 公式：(地支索引－天干索引＋10) mod 12，算出來的地支跟它後面一個地支就是空亡
// 已用使用者提供的「乙未」範例驗證：乙=1,未=7 → (7-1+10)%12=4=辰，下一個5=巳 → 空亡辰、巳
function getKongWang(gan, zhi) {
  const ganIdx = GAN_ORDER_QM.indexOf(gan);
  const zhiIdx = ZHI_ORDER_QM.indexOf(zhi);
  const idx1 = (zhiIdx - ganIdx + 10) % 12;
  const idx2 = (idx1 + 1) % 12;
  return [ZHI_ORDER_QM[idx1], ZHI_ORDER_QM[idx2]];
}

// 驛馬：地支三合局「長生」的對沖地支，固定對照表（跟空亡一樣用時柱地支，時家之學）
// 申子辰（三合水局，長生申）驛馬寅、寅午戌（三合火局，長生寅）驛馬申、
// 亥卯未（三合木局，長生亥）驛馬巳、巳酉丑（三合金局，長生巳）驛馬亥
// 已用使用者提供的「乙未」範例驗證：未屬亥卯未木局，驛馬在巳
const YIMA_MAP = {
  申: "寅", 子: "寅", 辰: "寅",
  寅: "申", 午: "申", 戌: "申",
  亥: "巳", 卯: "巳", 未: "巳",
  巳: "亥", 酉: "亥", 丑: "亥"
};
function getYiMa(zhi) {
  return YIMA_MAP[zhi];
}

// 找出某個干支在六十甲子中的序號（0-59）
function getJiaZi60Index(gan, zhi) {
  const ganIdx = GAN_ORDER_QM.indexOf(gan);
  const zhiIdx = ZHI_ORDER_QM.indexOf(zhi);
  for (let i = 0; i < 60; i++) {
    if (i % 10 === ganIdx && i % 12 === zhiIdx) return i;
  }
  return -1;
}

// 找出日柱干支在六十甲子中的旬首（符首）
function getXunShou(dayGan, dayZhi) {
  const jiaZiIdx = getJiaZi60Index(dayGan, dayZhi);
  const decade = Math.floor(jiaZiIdx / 10);
  return XUN_SHOU_LIST[decade]; // { xun, yi }
}

// 拆補法：日柱的「元別」（上／中／下）純粹由日柱本身的六十甲子序號決定，跟節氣時刻無關。
// 六十甲子每 5 天一元（符頭固定是甲或己），12 個元頭依「上中下」規律循環四次：
// 甲子(上)己巳(中)甲戌(下) 己卯(上)甲申(中)己丑(下) 甲午(上)己亥(中)甲辰(下) 己酉(上)甲寅(中)己未(下)
// 用使用者提供的權威資料驗證：2022-09-15 辛未日（六十甲子第 7 位）算出中元，跟原文「白露中元第三天」
// 完全吻合，局數也對上「陰遁三局」
function getYuanIdxOfDay(dayGan, dayZhi) {
  const jiaZiIdx = getJiaZi60Index(dayGan, dayZhi);
  const yuanBlock = Math.floor(jiaZiIdx / 5);
  return yuanBlock % 3; // 0=上元、1=中元、2=下元
}

// 依節氣（現實中目前所在的節氣）＋日柱元別判斷局數與陰陽遁（標準拆補法：
// 「直接用六旬三元表確定這一天是上中下三元哪一元，然後按照現實中是什麼節氣就直接起這個節氣的那一元的局」）
function determineJu(jieQiNameRaw, yuanIdx) {
  const jieQiName = normalizeJieQiName(jieQiNameRaw);
  const isYang = YANG_JIEQI_ORDER.includes(jieQiName);
  const table = isYang ? JU_TABLE_YANG[jieQiName] : JU_TABLE_YIN[jieQiName];
  if (!table) return null;
  return { isYang, ju: table[yuanIdx], yuanIdx };
}

// 排地盤：依局數與陰陽遁，將 戊己庚辛壬癸丁丙乙 依飛泊順序（陽順陰逆）填入九宮
// 傳回 { 1: "戊", 2: "己", ... 9: "乙" }（不含中宮 5，中宮寄二宮）
function buildDiPan(ju, isYang) {
  const stems = ["戊", "己", "庚", "辛", "壬", "癸", "丁", "丙", "乙"];
  const order = isYang ? FEI_BO_ORDER : FEI_BO_ORDER.slice().reverse();
  const startPos = order.indexOf(ju);
  const diPan = {};
  for (let i = 0; i < 9; i++) {
    const gong = order[(startPos + i) % 9];
    diPan[gong] = stems[i];
  }
  return diPan;
}

// 找出某個天干在地盤上所在的宮位
function findGongOfStem(diPan, stem) {
  for (const g of Object.keys(diPan)) {
    if (diPan[g] === stem) return Number(g);
  }
  return null;
}

// 找出某顆星目前飛到哪個宮位（用天盤九星，不是本位表，因為星會隨局轉動）
function findGongOfStar(tianPanXing, starName) {
  for (const g of Object.keys(tianPanXing)) {
    if (tianPanXing[g] === starName) return Number(g);
  }
  return null;
}

// 值符星落宮：找「時干」在地盤上的位置（符首常遺加時幹），中宮寄坤二宮
function findXingTargetGong(diPan, timeGan, fuShouGong) {
  // 時干是「甲」時：甲遁藏於六儀，本身不會出現在地盤上（地盤只有戊己庚辛壬癸丁丙乙九個天干），
  // findGongOfStem 會找不到、回傳 null；這種時辰本身就是符首所在的那個時辰（甲子／甲寅…都是六甲旬首本時），
  // 值符星依規則就是留在符首宮不動，直接回傳 fuShouGong，不能讓 null 流到後面的旋轉計算裡
  if (timeGan === "甲") return fuShouGong;
  let g = findGongOfStem(diPan, timeGan);
  if (g === 5) g = 2;
  return g;
}

// 值使門落宮：沿著「洛書飛泊順序」（排地盤用的那個順序，不是空間順序），從符首「原始」所在宮
// （rawFuShouGong，符首落中宮時這裡仍是5，不能先寄二宮）走「時辰在符首旬內的順序數」步，
// 陽遁順此順序走、陰遁逆此順序走，走完之後才套用「5寄二宮」。
// 關鍵修正：起點要用「原始」符首宮（可能是5），不是已經寄二宮之後的 fuShouGong——
// 用 5 筆資料交叉核對出來：
//   1. 1988-04-14 03:31（陽一局，raw符首宮1，順序數2）→ 值使門落3宮
//   2. 1982-05-30 10:45（陽五局，raw符首宮1，順序數3）→ 值使門落4宮
//   3. 2013-04-14 03:45（陽四局，raw符首宮5→寄2，順序數4）→ 值使門落9宮
//      （這筆是關鍵：如果用寄宮後的2當起點，陽遁原本的公式會算出6宮，
//      跟使用者提供的命盤圖對不上；改用原始5當起點，走4步剛好落9宮，完全吻合）
//   4. 林振豪 1982-07-26 18:00（陰七局，raw符首宮5→寄2，順序數1）→ 值使門落4宮
//   5. 2026-07-10 01:30（陰二局，raw符首宮1，順序數3）→ 值使門落7宮
// 五筆資料用「原始符首宮起走、陽順陰逆、只走1倍順序數」這個更簡單的公式完全吻合，
// 不需要先前陰遁「走2倍步數」的權宜修正（那個修正只是湊巧讓當時手上兩筆陰遁資料對上，
// 拿新資料代入才發現真正缺的環節是起點要用原始符首宮，不是寄宮後的）。
function findMenTargetGong(rawFuShouGong, hourIndexInXun, isYang) {
  const order = FEI_BO_ORDER;
  const startIdx = order.indexOf(rawFuShouGong);
  const steps = isYang ? hourIndexInXun : -hourIndexInXun;
  let g = order[((startIdx + steps) % 9 + 9) % 9];
  if (g === 5) g = 2;
  return g;
}

// 排天盤九星：值符星從 fuShouGong 移到 xingTargetGong，其餘 8 星依照固定順序（蓬芮沖輔禽心柱任英）
// 沿著「空間實際順時針（陽遁）／逆時針（陰遁）」跟著位移同樣的量，天干隨著星一起移動
function buildTianPan(diPan, fuShouGong, xingTargetGong, isYang) {
  const order = isYang ? SPATIAL_CW_ORDER : SPATIAL_CW_ORDER.slice().reverse();
  const oldIdx = order.indexOf(fuShouGong);
  const newIdx = order.indexOf(xingTargetGong);
  const delta = (newIdx - oldIdx + 8) % 8;

  const tianPanXing = {};
  const tianPanGan = {};
  order.forEach((newGong, newPos) => {
    const oldPos = (newPos - delta + 8) % 8;
    const oldGong = order[oldPos];
    tianPanXing[newGong] = XING_BEN_WEI[oldGong];
    tianPanGan[newGong] = diPan[oldGong];
  });
  return { tianPanXing, tianPanGan, delta };
}

// 排人盤八門：值使門從 fuShouGong 移到 menTargetGong，其餘 7 門依照固定順序（休死傷杜開驚生景）
// 沿著「空間實際順時針（陽遁）／逆時針（陰遁）」跟著位移同樣的量
function buildRenPan(fuShouGong, menTargetGong, isYang) {
  const order = isYang ? SPATIAL_CW_ORDER : SPATIAL_CW_ORDER.slice().reverse();
  const oldIdx = order.indexOf(fuShouGong);
  const newIdx = order.indexOf(menTargetGong);
  const delta = (newIdx - oldIdx + 8) % 8;

  const renPanMen = {};
  order.forEach((newGong, newPos) => {
    const oldPos = (newPos - delta + 8) % 8;
    const oldGong = order[oldPos];
    renPanMen[newGong] = MEN_BEN_WEI[oldGong];
  });
  return { renPanMen, delta };
}

// 排八神：值符為首，落在 targetGong，其餘 7 神沿「空間順時針（陽遁）／逆時針（陰遁）」依序排列，
// 第 5、6 個神的名稱依陽遁／陰遁（也就是冬至～夏至／夏至～冬至半年）切換勾陳朱雀或白虎玄武
function buildShenPan(targetGong, isYang) {
  const order = isYang ? SPATIAL_CW_ORDER : SPATIAL_CW_ORDER.slice().reverse();
  const nameOrder = isYang ? SHEN_ORDER_YANG : SHEN_ORDER_YIN;
  const startPos = order.indexOf(targetGong);
  const shenPan = {};
  for (let i = 0; i < 8; i++) {
    const gong = order[(startPos + i) % 8];
    shenPan[gong] = nameOrder[i];
  }
  return shenPan;
}

// 十年大運：起運宮（1-10 那一格）＝「年支」在外圈地支羅盤上固定對應的宮位，
// 從年支落宮開始，沿著九星八門旋轉用的「空間實際順時針」路徑依序填入 1-10、11-20...71-80 八個十年區間。
// 用三筆使用者提供的正確結果核對過：2026-07-10 01:30（男，年柱丙午，陽干）、2026-01-11 18:31
// （男，年柱乙巳，陰干）都要順飛才對得上；原本以為女生要逆飛，但 1988-04-14 03:31（女，年柱戊辰，
// 起運宮巽四宮）這筆資料顯示女生同樣要順飛（逆飛會把11-20排到震三宮，錯誤；順飛排到離九宮才對），
// 三筆資料一起確認這套系統其實不分性別一律順飛，不用再看性別。
const AGE_DECADE_LABELS = ["1-10", "11-20", "21-30", "31-40", "41-50", "51-60", "61-70", "71-80"];
const ZHI_TO_GONG_QM = { 子: 1, 丑: 8, 寅: 8, 卯: 3, 辰: 4, 巳: 4, 午: 9, 未: 2, 申: 2, 酉: 7, 戌: 6, 亥: 6 };
function buildDayun(yearGan, yearZhi, gender) {
  const shunFei = true;
  const order = SPATIAL_CW_ORDER;
  const startGong = ZHI_TO_GONG_QM[yearZhi];
  const startIdx = order.indexOf(startGong);
  const decadeByGong = {};
  for (let i = 0; i < 8; i++) {
    decadeByGong[order[(startIdx + i) % 8]] = AGE_DECADE_LABELS[i];
  }
  return { startGong, shunFei, decadeByGong };
}

// 右上角資訊表格「格局」欄位：十種特殊格局判斷，符合的用逗號分開列出，都不符合顯示「無」
// 1/3. 九星伏吟／反吟：看天盤九星的旋轉量（buildTianPan 算出來的 delta，跟排地盤用的空間順時針順序一致）
//      delta=0（值符星沒動）＝伏吟；delta=4（轉了半圈、飛到正對面宮位）＝反吟
// 2/4. 八門伏吟／反吟：同一套邏輯，改看人盤八門的旋轉量（buildRenPan 算出來的 delta）
// 5/6. 天干伏吟／反吟：天盤干是用跟九星「同一個 delta」轉動的（buildTianPan 裡星跟干一起位移），
//    所以天干伏吟／反吟本質上跟九星伏吟／反吟是同一個觸發時機，直接共用 xingDelta 判斷，不用逐宮比對。
//    這裡本來逐宮掃「戊加辛／己加壬／庚加癸」等特定組合，但用兩筆使用者資料交叉驗證後發現：
//    2026-11-10 04:30（xingDelta=0，全盤伏吟）不該有反吟，2026-02-11 18:31（xingDelta=4，
//    確認九星反吟成立）反吟裡也要有天干反吟──兩筆資料都指向「天干反吟＝xingDelta===4」這個更簡單、
//    更一致的判斷方式，逐宮掃描的舊寫法反而漏判了第二筆資料，所以拿掉了。
const TIANFU_SHI_MAP = { 甲: "甲戌", 己: "甲戌", 乙: "甲申", 庚: "甲申", 丙: "甲午", 辛: "甲午", 丁: "甲辰", 壬: "甲辰", 戊: "甲寅", 癸: "甲寅" };
// 玉女守門時：原本用「日干對應固定時柱」查表判斷，已依使用者提供的完整演算法改寫（見下方
// isYuNuShouMen），這張查表已不再使用，刪除。
const WUBUYU_SHI_MAP = { 甲: ["庚午"], 乙: ["辛巳"], 丙: ["壬辰"], 丁: ["癸卯"], 戊: ["甲寅"], 己: ["乙丑"], 庚: ["丙子", "丙戌"], 辛: ["丁酉"], 壬: ["戊申"], 癸: ["己未"] };
// 天網四張：六癸時（時干為癸）依日干五鼠遁對應到哪個癸時，天盤癸會被帶到地盤癸的位置而成局；
// 戊日／癸日同樣起壬子，都會遇到癸丑時，癸日自己又額外在癸亥時遇到（日干時干都是癸，特別大凶）
const TIANWANG_SHI_MAP = { 甲: "癸酉", 己: "癸酉", 乙: "癸未", 庚: "癸未", 丙: "癸巳", 辛: "癸巳", 丁: "癸卯", 壬: "癸卯", 戊: "癸丑", 癸: "癸丑" };

// 玉女守門時：使用者提供的完整演算法（取代原本查表判斷）——
// 1. 地盤丁奇：三奇六儀排入地盤後，「丁」固定落在某一宮（地盤本身跟時辰無關，只跟局數有關）
// 2. 求時辰旬首：時柱所在的甲旬（本檔案 xunShou 已經算好）
// 3. 鎖定原始值符星／值使門：該旬首六儀在地盤的原始本宮（rawFuShouGong，符首落中宮時是5，
//    這裡沿用跟值符星顯示一致的「寄二宮」慣例）
// 4. 飛宮定律：值符星飛到 xingTargetGong（隨時干）、值使門飛到 menTargetGong（隨時辰旬內順序數）
// 5. 重疊判定：只看「值使門」飛到的新宮位是否剛好是步驟1的丁奇宮，值符星的位置不列入判斷。
//    這條規則改過兩次才定案，用 3 筆資料才抓出真正的關鍵：
//    - 1988-04-14 03:31：值符星4宮、值使門3宮，丁奇宮是7宮，兩個都沒對上 → 官網「無」
//    - 1988-04-14 11:45：值符星3宮、值使門7宮，丁奇宮是7宮，只有值使門對上 → 官網「玉女時」
//    - 1982-05-30 10:45：值符星2宮、值使門4宮，丁奇宮是2宮，只有值符星對上 → 官網「無」
//    第三筆資料是關鍵：值符星對上丁奇宮那筆並不成立，值使門對上那筆才成立，代表只有值使門
//    落在丁奇宮才算數，值符星的位置其實無關，原本「兩個都要」或「其中一個就算」的判斷式都不對。
function isYuNuShouMen(diPan, menTargetGong) {
  const dingGong = findGongOfStem(diPan, "丁");
  if (dingGong === null) return false;
  return menTargetGong === dingGong;
}

// 「時干入墓」（上方格局欄）＝「時柱天干自坐墓庫」：時支正好是時干的墓庫地支才顯示，
// 跟盤面落宮無關，純看時柱本身。墓庫（陰陽別墓，跟 RUMU_STEMS 同系統）：
// 甲墓未、乙墓戌、丙墓戌、丁墓丑、戊墓戌、己墓丑、庚墓丑、辛墓辰、壬墓辰、癸墓未。
// 用官網 /qimen 時盤 3 筆截圖定案（2026-07-01 時柱戊戌→顯示、07-17 庚戌／07-04 甲戌→不顯示）：
// 07-01 時干戊的天盤落離9 不在乾6，證明先前「陽干落墓宮」版是錯的；自坐墓版同時解釋
// 最早「時干乙誤標」懸案——乙墓戌，但六十甲子沒有乙戌這一柱，所以時干乙永遠不會觸發。
// 實際可能觸發的時柱只有六柱：丙戌、丁丑、戊戌、己丑、壬辰、癸未。
const SHIGAN_MU_ZHI = { 甲: "未", 乙: "戌", 丙: "戌", 丁: "丑", 戊: "戌", 己: "丑", 庚: "丑", 辛: "辰", 壬: "辰", 癸: "未" };

function detectQimenPatterns({ xingDelta, menDelta, dayGan, timeGan, timeZhi, diPan, xingTargetGong, menTargetGong }) {
  const labels = [];
  if (xingDelta === 0) labels.push("九星伏吟");
  if (menDelta === 0) labels.push("八門伏吟");
  if (xingDelta === 4) labels.push("九星反吟");
  if (menDelta === 4) labels.push("八門反吟");
  if (xingDelta === 0) labels.push("天干伏吟");
  if (xingDelta === 4) labels.push("天干反吟");

  // 時干入墓：時柱自坐墓庫（見上方 SHIGAN_MU_ZHI 註解），純看時柱干支
  if (SHIGAN_MU_ZHI[timeGan] === timeZhi) labels.push("時干入墓");

  const timeGanZhi = timeGan + timeZhi;
  if (TIANFU_SHI_MAP[dayGan] === timeGanZhi) labels.push("天輔時");
  if (isYuNuShouMen(diPan, menTargetGong)) labels.push("玉女時");
  if ((WUBUYU_SHI_MAP[dayGan] || []).includes(timeGanZhi)) labels.push("五不遇時");
  if (TIANWANG_SHI_MAP[dayGan] === timeGanZhi) labels.push("天網四張");
  if (dayGan === "癸" && timeGanZhi === "癸亥") labels.push("天網四張(特別大凶)");

  return labels.length ? labels.join("，") : "無";
}

// ---- 主入口：目前只算到「局數／符首／值符（星）」，值符值使的方位與九宮飛盤還沒做 ----
function calculateQimenHeader({ year, month, day, hour, minute, name, gender, yiMaBasis, kongWangBasis }) {
  const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
  const lunar = solar.getLunar();
  const ec = lunar.getEightChar();
  // 晚子時（23:00-23:59）要算隔天的日柱：跟 js/bazi-engine.js 同一個問題，sect(2) 這個小時窗
  // 不會進位日柱，改用 sect(1) 才對（用 2026-07-15 23:43 這筆資料核對出來，見 bazi-engine.js 同一處註解）
  ec.setSect(1);

  // 符首用「時柱」的旬首（時家之學，不是日柱）
  const timeGan = ec.getTimeGan();
  const timeZhi = ec.getTimeZhi();
  const xunShou = getXunShou(timeGan, timeZhi);
  // 空亡／驛馬：使用者明確指出「奇門命盤報告」頁籤跟獨立的「奇門遁甲」頁面是兩套不同演算法，不能共用
  // 同一個結果，呼叫端各自傳入 kongWangBasis／yiMaBasis: "day" 或 "time" 決定查表用哪組干支。
  // 空亡－奇門命盤（"day"）：用 2026-07-10 01:30 這筆官網資料核對出來，時柱丁丑落在甲戌旬
  // （跟符首同一個旬，算出空亡申酉），但官網實際標示的空亡是午未，换成日柱乙酉（落在甲申旬）
  // 代入公式才對得上（午未正是甲申旬的空亡）。
  // 空亡－奇門遁甲（"time"）：用 2026-07-16 12:44 這筆使用者提供的參考盤核對出來，時柱甲午代入
  // 公式 (6-0+10)%12=4=辰、下一個5=巳，正好對上畫面標示的空亡辰、巳；同一筆資料若改用日柱
  // 辛卯代入則算出午未，跟參考盤對不上，證實奇門遁甲的空亡要用時柱而不是日柱。
  // 驛馬－奇門命盤（"day"）／奇門遁甲（"time"）：查同一張三合局對沖表（申子辰馬在寅、寅午戌馬在申、
  // 巳酉丑馬在亥、亥卯未馬在巳）。
  const kongWang = getKongWang(kongWangBasis === "time" ? timeGan : ec.getDayGan(), kongWangBasis === "time" ? timeZhi : ec.getDayZhi());
  const yiMa = getYiMa(yiMaBasis === "time" ? timeZhi : ec.getDayZhi());

  // 上方四柱表格：跟八字報告排盤方式一致，直接沿用 bazi-engine.js 的 ganPart／zhiPart（同一頁全域函式）。
  // 月柱改用 getEffectiveMonthGanZhi（bazi-engine.js，節氣進位到整點），跟八字報告的月柱顯示一致；
  // 這裡只影響「顯示的月柱」，不影響下面的局數／符首判斷（那段驗證過官網用的是精確到分鐘，不是
  // 進位到整點，兩者是各自獨立的欄位、互不影響，見 getEffectiveMonthGanZhi 註解）
  const effMonth = getEffectiveMonthGanZhi(solar);
  const siZhu = [
    { label: "時柱", gan: ganPart(timeGan), zhi: zhiPart(timeZhi) },
    { label: "日柱", gan: ganPart(ec.getDayGan()), zhi: zhiPart(ec.getDayZhi()) },
    { label: "月柱", gan: ganPart(effMonth.gan), zhi: zhiPart(effMonth.zhi) },
    { label: "年柱", gan: ganPart(ec.getYearGan()), zhi: zhiPart(ec.getYearZhi()) }
  ];

  // 局數（拆補法）：現實中目前所在的節氣 ＋ 日柱本身在六十甲子的元別（上／中／下）。
  // getPrevJieQi 這個布林參數是「是否只比對到日期、忽略時分」，傳 true 會在節氣當天但實際交節時刻
  // 還沒到時就提早算成那個節氣（用 2026-07-07 02:26 這筆資料核對出來：小暑實際交節時刻是當天
  // 09:56:57，02:26 明明還沒交節，傳 true 卻直接回傳小暑，導致局數、值符、值使、八神、天地盤干、
  // 八門全部算錯，只有九星剛好因為這筆資料是伏吟格局才沒受影響）；改傳 false 才會精確比對到分鐘。
  const prevJieQi = lunar.getPrevJieQi(false);
  const jieQiName = prevJieQi.getName();
  const yuanIdx = getYuanIdxOfDay(ec.getDayGan(), ec.getDayZhi());
  const juInfo = determineJu(jieQiName, yuanIdx);

  const diPan = buildDiPan(juInfo.ju, juInfo.isYang);
  const rawFuShouGong = findGongOfStem(diPan, xunShou.yi);
  // 中宮沒有自己的星（五宮無星無門），符首落中宮時寄坤二宮一起計算
  // （拿 2025-08-20 15:30 陰八局的實測資料核對出來：符首辛落中宮，官網顯示值符是天芮＝坤二宮固定星）
  // 這個寄宮後的 fuShouGong 用在值符星／值使門「顯示」的地方；值使門「走幾步」的計算則要用
  // 寄宮前的 rawFuShouGong（見 findMenTargetGong 註解）
  let fuShouGong = rawFuShouGong;
  if (fuShouGong === 5) fuShouGong = 2;
  const fuShouXing = XING_BEN_WEI[fuShouGong];

  // 值符星落宮：時干在地盤上的位置；值使門落宮：符首宮沿洛書飛泊順序走「時辰在旬內順序數」步
  const xingTargetGong = findXingTargetGong(diPan, timeGan, fuShouGong);
  const hourIndexInXun = xunShou.startIdx === undefined ? 0 : (() => {
    // 時柱在六十甲子中的序數，減去符首（旬首）的序數，就是「時辰在旬內的第幾個」
    const timeGanIdx = GAN_ORDER_QM.indexOf(timeGan);
    const timeZhiIdx = ZHI_ORDER_QM.indexOf(timeZhi);
    let timeJiaZiIdx = -1;
    for (let i = 0; i < 60; i++) {
      if (i % 10 === timeGanIdx && i % 12 === timeZhiIdx) { timeJiaZiIdx = i; break; }
    }
    return timeJiaZiIdx - xunShou.startIdx;
  })();
  const menTargetGong = findMenTargetGong(rawFuShouGong, hourIndexInXun, juInfo.isYang);

  const { tianPanXing, tianPanGan, delta: xingDelta } = buildTianPan(diPan, fuShouGong, xingTargetGong, juInfo.isYang);
  const { renPanMen, delta: menDelta } = buildRenPan(fuShouGong, menTargetGong, juInfo.isYang);
  const shenPan = buildShenPan(xingTargetGong, juInfo.isYang);
  const dayun = buildDayun(ec.getYearGan(), ec.getYearZhi(), gender);

  // 命宮／兄弟／子女：分別找日柱／月柱／時柱天干落在天盤的宮位。這裡有兩種「找不到」要分開處理：
  // 1. 天干是「甲」：甲遁藏於六儀，本來就不會出現在天盤上。甲只會跟子、戌、申、午、辰、寅這6個地支
  //    搭配（六甲旬首：甲子戊、甲戌己、甲申庚、甲午辛、甲辰壬、甲寅癸），所以先用該柱的地支查出
  //    對應的儀，再找這個儀目前落在天盤的哪一宮，就是甲該去的宮位。原本誤用「值符星目前所在宮位」
  //    （xingTargetGong），用 2033-02-14 01:45 這筆資料核對出錯：月柱甲寅，儀是癸，天盤癸落在
  //    乾六宮，兄弟應該在乾六宮，但值符星那時在離九宮，兩者不是同一宮，可見不能直接套用值符星宮位。
  // 2. 天干不是甲，但剛好落中宮（中宮不在天盤 8 宮之列）：寄到「天芮星」目前飛到的宮位（不是固定
  //    坤二宮）──中宮寄坤二宮是地盤（未轉動前）的慣例，天盤干是轉動過的，所以要跟著「天芮」這顆
  //    星轉動後的位置走，用 2026-07-10 01:30 這筆資料核對出來──時干丁落中宮，此局天芮星轉到震三宮，
  //    子女正確應該寄到震三宮，不是坤二宮。
  const tianRuiGong = findGongOfStar(tianPanXing, "天芮");
  const JIA_XUN_YI_BY_ZHI = { 子: "戊", 戌: "己", 申: "庚", 午: "辛", 辰: "壬", 寅: "癸" };
  const findTianPanGong = (gan, zhi) => {
    if (gan === "甲") {
      const yi = JIA_XUN_YI_BY_ZHI[zhi];
      const g = findGongOfStem(tianPanGan, yi);
      return g === null ? tianRuiGong : g;
    }
    const g = findGongOfStem(tianPanGan, gan);
    return g === null ? tianRuiGong : g;
  };
  const mingGong = findTianPanGong(ec.getDayGan(), ec.getDayZhi());
  const xiongdiGong = findTianPanGong(ec.getMonthGan(), ec.getMonthZhi());
  const ziNuGong = findTianPanGong(timeGan, timeZhi);
  const yiMaGong = ZHI_TO_GONG_QM[yiMa];
  const tianYi = { gong: ziNuGong, dir: GONG_INFO[ziNuGong].dir };

  const gongs = {};
  [1, 2, 3, 4, 6, 7, 8, 9].forEach((g) => {
    const tianGan = tianPanGan[g];
    const diGan = diPan[g];
    const geju = getGeju81(tianGan, diGan);
    gongs[g] = {
      gong: g,
      gua: GONG_INFO[g].gua,
      dir: GONG_INFO[g].dir,
      xing: tianPanXing[g],
      men: renPanMen[g],
      shen: shenPan[g],
      tianGan,
      diGan,
      jiXing: hasJiXing(g, tianGan, diGan),
      geju,
      isMingGong: g === mingGong,
      isZiNu: g === ziNuGong,
      dayunLabel: dayun.decadeByGong[g],
      cornerWords: buildCornerWords(g, renPanMen[g], tianPanXing[g], shenPan[g], tianGan, diGan, g === xiongdiGong, g === ziNuGong, g === yiMaGong)
    };
  });

  const patternText = detectQimenPatterns({ gongs, xingDelta, menDelta, dayGan: ec.getDayGan(), timeGan, timeZhi, diPan, xingTargetGong, menTargetGong });

  return {
    name,
    gender,
    solarText: year + "-" + String(month).padStart(2, "0") + "-" + String(day).padStart(2, "0") + " " + String(hour).padStart(2, "0") + ":" + String(minute).padStart(2, "0"),
    lunarText: lunar.toString(),
    siZhu,
    juInfo,
    patternText,
    xunShou,
    kongWang,
    yiMa,
    tianYi,
    diPan,
    fuShouGong,
    fuShouXing,
    fuShouDir: GONG_INFO[fuShouGong].dir,
    xingTargetGong,
    menTargetGong,
    dayun,
    gongs
  };
}
