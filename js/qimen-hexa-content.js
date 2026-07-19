/*
 * 奇門 64 卦說明內容（紅盤／藍盤共用）
 * 卦意採通行《易經》簡明斷語；「64卦＋八門」說明＝卦意＋該宮八門吉凶合成一句。
 * 只呈現盤面 8 宮實際出現的卦（每宮上卦＝天盤星本宮卦、下卦＝八門本門宮卦）。
 */

const HEXA64_DESC = {
  乾: "剛健自強，萬事開創之始", 坤: "柔順包容，厚德載物宜守", 屯: "萬事起頭難，宜守不宜進",
  蒙: "啟蒙未明，宜求教學習", 需: "時機未到，耐心等待", 訟: "爭執口舌，宜和解莫訟",
  師: "動眾興師，師出須有名", 比: "親附團結，擇善而從", 小畜: "小有積蓄，蓄勢待發",
  履: "如履虎尾，謹慎而行", 泰: "天地交泰，通達吉順", 否: "閉塞不通，宜守待變",
  同人: "與人同心，合作有成", 大有: "大有所獲，盛極宜謙", 謙: "謙遜受益，有終之吉",
  豫: "安樂喜悅，防逸樂過度", 隨: "隨順時勢，擇善而隨", 蠱: "積弊當革，整治更新",
  臨: "以上臨下，漸盛之時", 觀: "觀察省思，靜觀其變", 噬嗑: "咬合除障，明斷立信",
  賁: "文飾其外，重實莫虛華", 剝: "剝落衰退，宜止不宜行", 復: "一陽來復，否極泰來",
  無妄: "守正避禍，勿存妄念", 大畜: "大有蘊蓄，養賢待時", 頤: "頤養身心，謹言節食",
  大過: "負重過甚，非常之時", 坎: "重重險陷，守信涉險", 離: "附麗光明，柔順則吉",
  咸: "兩情相感，交感而通", 恆: "恆久有常，持之以恆", 遯: "退避隱遁，全身遠害",
  大壯: "壯盛有力，戒恃強妄動", 晉: "晉升進展，光明上進", 明夷: "光明受挫，韜光養晦",
  家人: "齊家有道，內正外成", 睽: "乖離違背，異中求同", 蹇: "跛足難行，反身修德",
  解: "險難解除，宜速把握", 損: "先損後得，損己益人", 益: "損上益下，進取有利",
  夬: "決斷去疾，果決而行", 姤: "不期而遇，防柔侵剛", 萃: "群聚匯萃，聚眾以正",
  升: "柔順上升，積小成高", 困: "受困窮阻，守正待時", 井: "井養不窮，修德惠人",
  革: "改革變故，順天應人", 鼎: "鼎新立業，穩重圖成", 震: "震動驚惶，恐懼修省",
  艮: "知止而止，靜止安分", 漸: "循序漸進，穩步有成", 歸妹: "急進失序，慎始防終",
  豐: "豐盛盛大，日中則昃", 旅: "旅居在外，小心謹慎", 巽: "謙遜順入，申命行事",
  兌: "喜悅和悅，防口舌是非", 渙: "渙散離散，聚而後成", 節: "節制有度，過節則苦",
  中孚: "誠信感通，虛心待物", 小過: "小有過越，宜下不宜上", 既濟: "事已成就，防盛極而衰",
  未濟: "事尚未濟，謹慎可期"
};

// 八門一句話（吉凶＋象意），門名用單字對照（盤面顯示單字）
const QIMEN_MEN_DESC = {
  開: { jx: "吉", text: "開創通達、貴人提攜，宜開展新局" },
  休: { jx: "吉", text: "休養生息、和合順遂，宜休整謀定" },
  生: { jx: "吉", text: "生機獲利、營謀有成，宜求財置產" },
  傷: { jx: "凶", text: "損傷爭鬥，防傷害與波折" },
  杜: { jx: "凶", text: "閉塞阻隔，宜守宜藏不宜進" },
  景: { jx: "平", text: "文書聲名、宴樂文章，防虛華血光" },
  死: { jx: "凶", text: "停滯凶危，諸事不宜、宜靜制動" },
  驚: { jx: "凶", text: "驚恐官非，防口舌是非虛驚" }
};

// 產兩張表：
// 表1「宮位對應 64 卦說明」：宮位（卦宮＋方位）｜64卦（上卦/下卦）｜卦意
// 表2「64 卦＋八門說明」：宮位｜64卦＋門｜合成說明（卦意；配○門(吉凶)：門意）
// hexByGong: {g:{upper,lower,name}}（8 宮）；menByGong: {g:門單字}；gongInfo: {g:{gua,dir}}
function buildHexaTablesHtml(hexByGong, menByGong, gongInfo) {
  const gongs = [1, 8, 3, 4, 9, 2, 7, 6].filter((g) => hexByGong && hexByGong[g]);
  if (!gongs.length) return "";
  const rows1 = gongs.map((g) => {
    const h = hexByGong[g];
    return "<tr><td>" + gongInfo[g].gua + "宮（" + gongInfo[g].dir + "）</td>" +
      '<td class="qhx-name">' + h.name + "</td>" +
      "<td>" + h.upper + "上" + h.lower + "下</td>" +
      "<td>" + (HEXA64_DESC[h.name] || "") + "</td></tr>";
  }).join("");
  const rows2 = gongs.map((g) => {
    const h = hexByGong[g];
    const men = menByGong[g] || "";
    const md = QIMEN_MEN_DESC[men];
    const combined = (HEXA64_DESC[h.name] || "") +
      (md ? "；配" + men + "門（" + md.jx + "）：" + md.text : "");
    return "<tr><td>" + gongInfo[g].gua + "宮（" + gongInfo[g].dir + "）</td>" +
      '<td class="qhx-name">' + h.name + "＋" + men + "門</td>" +
      "<td>" + combined + "</td></tr>";
  }).join("");
  return '<div class="zibai-section-title" style="margin-top:16px">宮位對應 64 卦說明</div>' +
    '<div class="qhx-wrap"><table class="qhx-table"><thead><tr><th>宮位</th><th>64卦</th><th>卦象</th><th>卦意</th></tr></thead><tbody>' + rows1 + "</tbody></table></div>" +
    '<div class="zibai-section-title" style="margin-top:16px">64 卦＋八門說明</div>' +
    '<div class="qhx-wrap"><table class="qhx-table"><thead><tr><th>宮位</th><th>64卦＋八門</th><th>說明</th></tr></thead><tbody>' + rows2 + "</tbody></table></div>";
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { HEXA64_DESC, QIMEN_MEN_DESC, buildHexaTablesHtml };
}
