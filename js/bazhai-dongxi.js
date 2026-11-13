// ================= 八宅：東四命・西四命（整理自《八宅秘籍》Fengshui Republic）=================
// 書中每一命卦一章：個人吉凶方配 24 山、四吉方／四凶方說明，再逐一「X 命配 Y 宅」列大門、主臥、灶頭九宮。
// 逐頁比對後歸納出書中規則（坎命配坎／坤／巽宅、坤命配坤宅等頁逐格核對）：
//   大門：宅卦遊年四吉宮整宮＝大吉；四凶宮內「納甲歸卦屬宅之吉卦」的山＝平吉（書中橘圈），其餘不宜。
//   主臥：床安宅之四吉宮；床頭可朝方位＝宅之坐、向、左、右四正向中屬「宅主命卦四吉方」者。
//   灶頭：灶安宅之四凶宮（坐凶）；灶口（火門）朝宅主命卦吉方（向吉），灶背靠對向之牆。
// 依賴 fengshui-zibai-engine.js：ZB_GUA_CHAR、ZB_EAST_GUA、ZB_PALACE_TO_DIR、ZB_DIR_TO_PALACE、ZB_DIR_NAME、
//   ZB_PALACE_MOUNTAINS、ZB_NAJIA_GUA、ZB_COMPASS_CW、ZB_SCREEN_CW、zbGameStars。

// 書中命卦標題：一白星命…九紫星命
const BZDX_STAR_NAME = { 1: "一白", 2: "二黑", 3: "三碧", 4: "四綠", 6: "六白", 7: "七赤", 8: "八白", 9: "九紫" };
const BZDX_EAST = [1, 9, 3, 4];
const BZDX_WEST = [6, 2, 8, 7];
const BZDX_JI = ["生氣", "延年", "天醫", "伏位"];
const BZDX_XIONG = ["禍害", "六煞", "五鬼", "絕命"];

// 書中遊年星名、吉凶等級（與本系統其他頁之等級略異，此頁依書）及方位意義（依書意改寫）
const BZDX_STAR_TEXT = {
  生氣: { xing: "貪狼", lv: "最吉", tone: "good",
    desc: "擴增生命力、增強活動力的方位，能加強競爭力。善用可帶來財氣、活力、自信與領導力，積極進取，發揮比原有更高的戰鬥力。" },
  延年: { xing: "武曲", lv: "大吉", tone: "good",
    desc: "凝聚、和諧、穩健、調和事物的方位。善用可帶來姻緣運、貴人運、官運、創業運，在感情、升職加薪及人際關係上增進協調與處理能力。" },
  天醫: { xing: "巨門", lv: "中吉", tone: "good",
    desc: "氣場祥和的方位，顧名思義可帶來健康體魄、消除煩惱、舒緩壓力，使生理作息穩定、心理健康快樂，並常遇貴人相助。" },
  伏位: { xing: "輔弼", lv: "小吉", tone: "good",
    desc: "使情緒穩定、冷靜思考的方位，協助分辨立場、提高自覺。善用可為財運、工作、健康及人際關係帶來平安與穩定。" },
  禍害: { xing: "祿存", lv: "小凶", tone: "bad",
    desc: "處事常遇波折、干擾，奔波勞累卻無所得，甚至危害健康。錯用易招煩惱雜事、缺乏自信、意志薄弱、受騙背叛、容易疲勞。" },
  六煞: { xing: "文曲", lv: "中凶", tone: "bad",
    desc: "易造成心理負擔、低沉抑鬱、凡事想不開，失去樂觀與活力，容易犯錯、謀事難成。錯用易招煩惱、失眠、紛爭、感情波折、判斷力薄弱。" },
  五鬼: { xing: "廉貞", lv: "大凶", tone: "bad",
    desc: "使人脾氣暴躁、易怒、爭吵、橫禍、破大財，並破壞人際關係。錯用易招小人、焦躁、破財、患病、訴訟，做事徒勞無功。" },
  絕命: { xing: "破軍", lv: "最凶", tone: "bad",
    desc: "最不理想的方位，使人情緒低潮、憂愁煩悶、凡事往壞處想，對心理層面破壞極大。錯用易在健康、心理、人際、家庭及事業上帶來意外橫禍。" }
};

const BZDX_OPP = { N: "S", S: "N", E: "W", W: "E", NE: "SW", SW: "NE", SE: "NW", NW: "SE" };

function bzdxStarMap(gua) {
  const byStar = {}, byDir = {}, byGua = {};
  zbGameStars(gua).forEach((s) => { byStar[s.star] = s; byDir[s.dir] = s; byGua[s.gua] = s; });
  return { byStar, byDir, byGua };
}

// X 命配 Y 宅（宅卦＝坐山所屬卦）
function bzdxMatch(mingGua, zhaiGua) {
  const ming = bzdxStarMap(mingGua);
  const zhai = bzdxStarMap(zhaiGua);
  const sitDir = ZB_PALACE_TO_DIR[zhaiGua];
  const i = ZB_COMPASS_CW.indexOf(sitDir);
  // 宅之四正向：坐、右、向、左（羅盤順時針每 90°）
  const axes = [0, 2, 4, 6].map((k) => ZB_COMPASS_CW[(i + k) % 8]);
  const okDirs = axes.filter((d) => ming.byDir[d].tone === "good");
  const palaces = ZB_COMPASS_CW.map((dir) => {
    const s = zhai.byDir[dir];
    const good = s.tone === "good";
    const mts = ZB_PALACE_MOUNTAINS[ZB_DIR_TO_PALACE[dir]];
    const pingji = good ? [] : mts.filter((m) => zhai.byGua[ZB_NAJIA_GUA[m]].tone === "good");
    return { dir, star: s.star, good, mountains: mts, pingji };
  });
  return {
    mingGua, zhaiGua, sitDir,
    mingEast: BZDX_EAST.includes(mingGua),
    zhaiEast: BZDX_EAST.includes(zhaiGua),
    match: BZDX_EAST.includes(mingGua) === BZDX_EAST.includes(zhaiGua),
    palaces, okDirs,
    mingByDir: ming.byDir
  };
}

// ---------- 版面 ----------
function bzdxDirList(dirs, ming) {
  return dirs.map((d) => ZB_DIR_NAME[d] + "（" + ming[d].star + "）").join("、");
}

// 九宮（向首朝上，與本頁八宅盤同一方向）；kind＝door / bed / stove
function bzdxGridHtml(m, kind) {
  const facing = BZDX_OPP[m.sitDir];
  const fi = ZB_COMPASS_CW.indexOf(facing);
  const byDir = {};
  m.palaces.forEach((p) => { byDir[p.dir] = p; });
  let cells = '<div class="zibai-cell zibai-cell-center bzdx-cell bzdx-center" style="grid-row:2;grid-column:2"><b>' +
    ZB_GUA_CHAR[m.zhaiGua] + "</b><i>宅</i></div>";
  const labels = [];
  for (let k = 0; k < 8; k++) {
    const dir = ZB_COMPASS_CW[(fi + k) % 8];
    const pos = ZB_SCREEN_CW[k];
    const p = byDir[dir];
    let cls = "bzdx-off", sub = "";
    if (kind === "door") {
      if (p.good) { cls = "bzdx-daji"; sub = "大吉"; }
      else if (p.pingji.length) { cls = "bzdx-xiong"; sub = '<span class="bzdx-chip">' + p.pingji.join("") + "</span>"; }
      else { cls = "bzdx-xiong"; sub = "不宜"; }
    } else if (kind === "bed") {
      if (p.good) { cls = "bzdx-use"; sub = "宜床"; }
      else { cls = "bzdx-xiong"; sub = "不宜"; }
    } else {
      if (!p.good) { cls = "bzdx-use"; sub = "宜灶"; }
      else { cls = "bzdx-off"; sub = "不宜"; }
    }
    cells += '<div class="zibai-cell bzdx-cell ' + cls + '" style="grid-row:' + pos.r + ";grid-column:" + pos.c + '">' +
      "<b>" + p.star + "</b><i>" + sub + "</i></div>";
    labels.push('<span class="zibai-dir ' + zbPosClass(pos.r, pos.c) + '">' + ZB_DIR_NAME[dir] + "</span>");
  }
  const title = { door: "大門", bed: "主臥", stove: "灶頭" }[kind];
  const okTxt = m.okDirs.map((d) => ZB_DIR_NAME[d]).join("、");
  const legend = kind === "door"
    ? '<span class="bzdx-lg bzdx-daji"></span>大吉宮　<span class="bzdx-lg bzdx-pj"></span>平吉之山'
    : (kind === "bed" ? "床頭朝：" : "灶口朝：") + "<b>" + okTxt + "</b>";
  return '<div class="bzdx-gridbox"><div class="bzdx-gridtitle">' + title + "</div>" +
    '<div class="zibai-grid bzdx-grid">' + cells + labels.join("") + "</div>" +
    '<div class="bzdx-legend">' + legend + "</div></div>";
}

function bzdxGuaCard(g, selGua, userGua) {
  const d = ZB_PALACE_TO_DIR[g];
  const ming = bzdxStarMap(g).byStar;
  const cls = "bzdx-card" + (g === selGua ? " active" : "") + (g === userGua ? " mine" : "");
  return '<button type="button" class="' + cls + '" data-bzdx-gua="' + g + '">' +
    '<span class="bzdx-card-num">' + g + "</span>" +
    '<span class="bzdx-card-gua">' + ZB_GUA_CHAR[g] + "命</span>" +
    '<span class="bzdx-card-sub">' + BZDX_STAR_NAME[g] + "星命・" + ZB_DIR_NAME[d] + "</span>" +
    '<span class="bzdx-card-sub">生氣' + ming.生氣.dirName + "・延年" + ming.延年.dirName + "</span>" +
    (g === userGua ? '<span class="bzdx-card-mine">宅主命卦</span>' : "") + "</button>";
}

// selGua：目前檢視之命卦；userGua：表單算出之宅主命卦；zhaiGua：表單座向之宅卦（可被總覽表點選覆寫）
function buildBazhaiDongxiHtml(selGua, userGua, zhaiGua, formZhaiGua) {
  const ming = bzdxStarMap(selGua);
  const east = BZDX_EAST.includes(selGua);
  let h = "";

  // 一、東四命・西四命總表
  h += '<div class="zibai-section"><div class="zibai-section-title">東四命・西四命</div>' +
    '<div class="bzdx-group"><div class="bzdx-group-h">東四命<small>坎・離・震・巽　吉方：北、南、東、東南</small></div>' +
    '<div class="bzdx-cards">' + BZDX_EAST.map((g) => bzdxGuaCard(g, selGua, userGua)).join("") + "</div></div>" +
    '<div class="bzdx-group"><div class="bzdx-group-h">西四命<small>乾・坤・艮・兌　吉方：西北、西南、東北、西</small></div>' +
    '<div class="bzdx-cards">' + BZDX_WEST.map((g) => bzdxGuaCard(g, selGua, userGua)).join("") + "</div></div>" +
    '<div class="zibai-note">點選命卦卡可查看其他命卦。命卦五：男寄坤（2）、女寄艮（8）。坐北（坎）、坐南（離）、坐東（震）、坐東南（巽）之宅為東四宅；坐西北（乾）、坐西南（坤）、坐東北（艮）、坐西（兌）之宅為西四宅。東四命宜住東四宅，西四命宜住西四宅。</div></div>';

  // 二、本命四吉方・四凶方
  const row = (star) => {
    const s = ming.byStar[star], t = BZDX_STAR_TEXT[star];
    return "<tr><td><b class=\"" + (t.tone === "good" ? "bz-good" : "bz-bad") + "\">" + star + "方</b><br><small>" + t.xing + "・" + t.lv + "</small></td>" +
      "<td><b>" + s.dirName + "</b><br><small>" + s.guaChar + "卦</small></td><td>" + t.desc + "</td></tr>";
  };
  h += '<div class="zibai-section"><div class="zibai-section-title">' + selGua + " " + ZB_GUA_CHAR[selGua] + "命（" +
    BZDX_STAR_NAME[selGua] + "星命・" + (east ? "東" : "西") + "四命）四吉方・四凶方</div>" +
    '<table class="bzdx-table"><thead><tr><th>遊年</th><th>方位</th><th>說明</th></tr></thead><tbody>' +
    '<tr class="bzdx-tr-h"><td colspan="3">四吉方</td></tr>' + BZDX_JI.map(row).join("") +
    '<tr class="bzdx-tr-h bad"><td colspan="3">四凶方</td></tr>' + BZDX_XIONG.map(row).join("") +
    "</tbody></table></div>";

  // 三、本命配八宅總覽
  const order = east ? BZDX_EAST.concat(BZDX_WEST) : BZDX_WEST.concat(BZDX_EAST);
  let rows = "";
  order.forEach((z) => {
    const m = bzdxMatch(selGua, z);
    const sit = ZB_PALACE_MOUNTAINS[z].join("");
    const doors = m.palaces.filter((p) => p.good).map((p) => ZB_DIR_NAME[p.dir]).join("、");
    rows += '<tr class="bzdx-zrow' + (z === zhaiGua ? " active" : "") + '" data-bzdx-zhai="' + z + '">' +
      "<td><b>" + ZB_GUA_CHAR[z] + "宅</b>" + (z === formZhaiGua ? '<br><small class="bzdx-here">本宅</small>' : "") + "</td>" +
      "<td>坐" + ZB_DIR_NAME[ZB_PALACE_TO_DIR[z]] + "<br><small>" + sit + "山</small></td>" +
      "<td>" + (m.zhaiEast ? "東四宅" : "西四宅") + "<br>" +
        (m.match ? '<b class="bz-good">相配</b>' : '<b class="bz-bad">不配</b>') + "</td>" +
      "<td>" + doors + "</td>" +
      "<td>" + m.okDirs.map((d) => ZB_DIR_NAME[d]).join("、") + "</td></tr>";
  });
  h += '<div class="zibai-section"><div class="zibai-section-title">' + ZB_GUA_CHAR[selGua] + "命配八宅</div>" +
    '<table class="bzdx-table bzdx-ztable"><thead><tr><th>宅卦</th><th>坐向</th><th>相配</th><th>大門大吉方</th><th>床頭／灶口宜朝</th></tr></thead><tbody>' +
    rows + "</tbody></table>" +
    '<div class="zibai-note">點選任一列查看該宅的大門、主臥、灶頭九宮。「本宅」為上方陽宅面向所得之宅卦。床頭、灶口限宅之坐、向、左、右四正向（依牆面擺設），取其中屬宅主命卦吉方者。</div></div>';

  // 四、X 命配 Y 宅：大門／主臥／灶頭
  const m = bzdxMatch(selGua, zhaiGua);
  const pj = m.palaces.filter((p) => !p.good && p.pingji.length)
    .map((p) => ZB_DIR_NAME[p.dir] + p.star + "宮之" + p.pingji.join("、") + "山").join("；");
  const goodPal = m.palaces.filter((p) => p.good).map((p) => ZB_DIR_NAME[p.dir] + p.star).join("、");
  const badPal = m.palaces.filter((p) => !p.good).map((p) => ZB_DIR_NAME[p.dir] + p.star).join("、");
  h += '<div class="zibai-section"><div class="zibai-section-title">' + ZB_GUA_CHAR[selGua] + "命配" + ZB_GUA_CHAR[zhaiGua] + "宅（" +
    (m.match ? "宅命相配" : "東西相混，宅命不配") + "）</div>" +
    '<div class="bzdx-grids">' + bzdxGridHtml(m, "door") + bzdxGridHtml(m, "bed") + bzdxGridHtml(m, "stove") + "</div>" +
    '<div class="zibai-block"><div class="zibai-block-b">' +
      "<b>大門</b>：開在宅之四吉宮（" + goodPal + "）為大吉；" +
        (pj ? "凶宮中可取" + pj + "為平吉（該山納甲屬宅之吉卦）" : "凶宮無可取之山") + "。<div class=\"zibai-hr\"></div>" +
      "<b>主臥</b>：安於" + goodPal + "宮，床頭朝 " + bzdxDirList(m.okDirs, m.mingByDir) + "。<div class=\"zibai-hr\"></div>" +
      "<b>灶頭</b>：坐凶向吉，灶安於" + badPal + "宮壓凶，灶口（火門）朝 " + bzdxDirList(m.okDirs, m.mingByDir) +
        "，灶背靠" + m.okDirs.map((d) => ZB_DIR_NAME[BZDX_OPP[d]]).join("／") + "側牆。" +
      (m.match ? "" : '<div class="zibai-hr"></div><span class="bz-bad">宅命不配</span>：宅之吉宮多落在本命凶方，宜以床頭、灶口、書桌座向取本命吉方補救，並多用宅中吉山。') +
    "</div></div>" +
    '<div class="zibai-disclaimer">※ 整理自《八宅秘籍》各命卦「個人吉凶方配 24 山」與「命配八宅」大門、主臥、灶頭圖。九宮以向首朝上（書中以坐山朝上），宮內遊年星為宅卦遊年；床頭、灶口方向依宅主命卦。</div></div>';
  return h;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { bzdxMatch, buildBazhaiDongxiHtml };
}
