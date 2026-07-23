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

// 短卦名→完整資料（HEXA64_DATA 見 js/qimen-hexa64-content.js）；查無則回退舊 HEXA64_DESC
function hexaFull(name) {
  const d = typeof HEXA64_DATA !== "undefined" ? HEXA64_DATA[name] : null;
  return d && d.full ? d.full : name;
}
function hexaIntro(name) {
  const d = typeof HEXA64_DATA !== "undefined" ? HEXA64_DATA[name] : null;
  return d && d.intro ? d.intro : (HEXA64_DESC[name] || "");
}
function hexaDoor(name, men) {
  const d = typeof HEXA64_DATA !== "undefined" ? HEXA64_DATA[name] : null;
  return d && d.doors ? d.doors[men] : null;
}

// 底部總覽兩張表（點宮才展開詳解，故此處為精簡索引）：
// 表1「宮位對應 64 卦說明」：宮位｜64卦(全名)｜卦象｜卦意(卦辭+特質)
// 表2「64 卦＋八門說明」：宮位｜64卦＋門(全名)｜標語
function buildHexaTablesHtml(hexByGong, menByGong, gongInfo) {
  const gongs = [1, 8, 3, 4, 9, 2, 7, 6].filter((g) => hexByGong && hexByGong[g]);
  if (!gongs.length) return "";
  const rows1 = gongs.map((g) => {
    const h = hexByGong[g];
    return "<tr><td>" + gongInfo[g].gua + "宮（" + gongInfo[g].dir + "）</td>" +
      '<td class="qhx-name">' + hexaFull(h.name) + "</td>" +
      "<td>" + h.upper + "上" + h.lower + "下</td>" +
      "<td>" + hexaIntro(h.name) + "</td></tr>";
  }).join("");
  const rows2 = gongs.map((g) => {
    const h = hexByGong[g], men = menByGong[g] || "";
    const dr = hexaDoor(h.name, men);
    return "<tr><td>" + gongInfo[g].gua + "宮（" + gongInfo[g].dir + "）</td>" +
      '<td class="qhx-name">' + hexaFull(h.name) + "＋" + men + "門</td>" +
      "<td>" + (dr && dr.tag ? dr.tag : "") + "</td></tr>";
  }).join("");
  return '<div class="qhx-hint">點選上方任一宮格，即可展開該宮「宮位對應 64 卦說明」與「64 卦＋八門說明」完整內容。</div>' +
    '<div class="zibai-section-title" style="margin-top:12px">宮位對應 64 卦說明</div>' +
    '<div class="qhx-wrap"><table class="qhx-table"><thead><tr><th>宮位</th><th>64卦</th><th>卦象</th><th>卦意</th></tr></thead><tbody>' + rows1 + "</tbody></table></div>" +
    '<div class="zibai-section-title" style="margin-top:16px">64 卦＋八門說明</div>' +
    '<div class="qhx-wrap"><table class="qhx-table"><thead><tr><th>宮位</th><th>64卦＋八門</th><th>標語</th></tr></thead><tbody>' + rows2 + "</tbody></table></div>";
}

// 八門說明串接格式（依教材／使用者指定）：標語、關鍵詞為短語列表→頓號/點號一律轉「。」；
// 卦象引導、玄商策略、易道速斷為完整句→保留內部標點，各段以「。」收尾串接成一段。
function qhxNormList(x) { return x ? x.replace(/[、．，]/g, "。").replace(/。+/g, "。").replace(/。$/, "") + "。" : ""; }
function qhxNormSent(x) { return x ? (/[。！？]$/.test(x) ? x : x + "。") : ""; }
function qhxDoorText(dr) {
  if (!dr) return "";
  return qhxNormList(dr.tag) + qhxNormList(dr.kw) + qhxNormSent(dr.guide) + qhxNormSent(dr.strategy) + qhxNormSent(dr.speed);
}

// 點宮展開的完整卡片：宮位對應 64 卦說明（卦辭+特質）＋ 64 卦＋八門說明（標語＋關鍵詞＋卦象引導＋玄商策略＋易道速斷串接）
// hex: {upper,lower,name(短名)}；men: 門單字
function buildHexaCard(hex, men) {
  if (!hex) return "";
  const full = hexaFull(hex.name), intro = hexaIntro(hex.name), dr = hexaDoor(hex.name, men);
  let h = '<div class="qhx-card">';
  h += '<div class="qhx-card-h">宮位對應 64 卦說明</div>';
  h += '<div class="qhx-card-b"><div class="qhx-gua">' + full +
    '<span class="qhx-xiang">' + hex.upper + "上" + hex.lower + "下</span></div>" +
    (intro ? '<div class="qhx-text">' + intro + "</div>" : "") + "</div>";
  h += '<div class="qhx-card-h" style="margin-top:10px">64 卦＋八門說明</div>';
  h += '<div class="qhx-card-b"><div class="qhx-gua">' + full + "＋" + men + "門</div>" +
    '<div class="qhx-text">' + (dr ? qhxDoorText(dr) : "查無說明資料。") + "</div></div>";
  h += "</div>";
  return h;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { HEXA64_DESC, QIMEN_MEN_DESC, buildHexaTablesHtml, buildHexaCard };
}
