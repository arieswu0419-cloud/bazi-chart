// ================= 八宅：東四命・西四命（整理自《八宅秘籍》Fengshui Republic）=================
// 書中每一命卦一章：個人吉凶方配 24 山、四吉方／四凶方說明，再逐一「X 命配 Y 宅」列大門、主臥、灶頭九宮。
// 逐頁比對後歸納出書中規則（坎命配坎／坤／巽宅、坤命配坤宅等頁逐格核對）：
//   大門：可開於宅卦生氣、延年、天醫三宮（伏位為坐山，書中不畫門），及四凶宮內「納甲歸卦屬宅之吉卦」的山（書中橘圈）；
//         門色依門所在之牆朝向：朝宅主命卦吉方＝大吉（深紅），朝其他方＝平吉（橘）。
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

// 先天八卦卦位（換成後天方位）：乾南、坤北、離東、坎西、兌東南、震東北、巽西南、艮西北。
// 八宅用法（網路流傳之八宅安床法，例：巽命夫、乾命妻）：命卦之先天卦位對本人「不作凶論，亦不作吉論」＝中平。
// 夫妻東西命不同時，取「一方吉方＋另一方先天卦位」之方安床，一吉一平、兩不相沖，謂之兩全。
const BZDX_XIANTIAN_DIR = { 6: "S", 2: "N", 9: "E", 1: "W", 7: "SE", 3: "NE", 4: "SW", 8: "NW" };
// 某命卦在 dir 方的遊年吉凶，先天卦位之凶方改作中平：回傳 "good" | "ping" | "bad"
function bzdxTone(gua, byDir, dir) {
  if (byDir[dir].tone === "good") return "good";
  return BZDX_XIANTIAN_DIR[gua] === dir ? "ping" : "bad";
}
// 兩人（東西命不同）依先天八卦可兩全之方：一人吉、另一人先天中平
function bzdxXiantianBoth(g1, g2) {
  const a = bzdxStarMap(g1).byDir, b = bzdxStarMap(g2).byDir;
  return ZB_COMPASS_CW.filter((d) => {
    const ta = bzdxTone(g1, a, d), tb = bzdxTone(g2, b, d);
    return (ta === "good" && tb === "ping") || (ta === "ping" && tb === "good");
  });
}

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

// ---- 宅命相配圖（SVG，比照書中九宮）：向首朝上；外圈 24 山、深紅框內方位字。
//      大門＝牆上雙開門；主臥＝床組（床頭板靠哪面牆＝床頭朝該方）；灶頭＝雙口爐灶（背靠牆、灶口朝對面）。
const BZDX_SVG = { M: 16, B: 20, C: 90 };
BZDX_SVG.G0 = BZDX_SVG.M + BZDX_SVG.B;            // 九宮內框起點
BZDX_SVG.W = BZDX_SVG.G0 * 2 + BZDX_SVG.C * 3;    // 全圖邊長
const BZDX_RED = "#7a1f1f", BZDX_ORANGE = "#E87A3B";

// 格（r,c）的第 side 側（0上 1右 2下 3左）上、沿順時針方向比例 t 的點
function bzdxSidePt(r, c, side, t) {
  const S = BZDX_SVG, x0 = S.G0 + (c - 1) * S.C, y0 = S.G0 + (r - 1) * S.C, x1 = x0 + S.C, y1 = y0 + S.C;
  if (side === 0) return [x0 + t * S.C, y0];
  if (side === 1) return [x1, y0 + t * S.C];
  if (side === 2) return [x1 - t * S.C, y1];
  return [x0, y1 - t * S.C];
}
// 由框邊的點沿 side 外推到距圖邊 off 的位置（24 山字、方位字用）
function bzdxPush(pt, side, off) {
  const W = BZDX_SVG.W;
  if (side === 0) return [pt[0], off];
  if (side === 1) return [W - off, pt[1]];
  if (side === 2) return [pt[0], W - off];
  return [off, pt[1]];
}
function bzdxCornerPt(s1, s2, off) {
  const W = BZDX_SVG.W, sides = [s1, s2];
  return [sides.includes(1) ? W - off : off, sides.includes(2) ? W - off : off];
}
function bzdxText(x, y, txt, size, color, bold) {
  return '<text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" font-size="' + size + '"' + (bold ? ' font-weight="700"' : "") +
    ' fill="' + color + '" text-anchor="middle" dominant-baseline="central">' + txt + "</text>";
}
function bzdxPlace(pt, side, inner, scale) {
  return '<g transform="translate(' + pt[0].toFixed(1) + "," + pt[1].toFixed(1) + ") rotate(" + (side * 90) + ")" +
    (scale ? " scale(" + scale + ")" : "") + '">' + inner + "</g>";
}
// 雙開門：牆在 y=0，兩扇門向室內（+y）開
function bzdxDoorSvg(color) {
  return '<line x1="-12" y1="0" x2="12" y2="0" stroke="#fff" stroke-width="3"/>' +
    '<g fill="none" stroke="' + color + '" stroke-width="1.8" stroke-linecap="round">' +
    '<path d="M-12 0 L-12 12 A12 12 0 0 0 0 0"/><path d="M12 0 L12 12 A12 12 0 0 1 0 0"/></g>';
}
// 床組：床頭板靠牆（y=0），兩側床頭櫃、雙枕、被
function bzdxBedSvg() {
  return '<g stroke="#5b2a1a" stroke-width="1">' +
    '<rect x="-19" y="1.5" width="6" height="6" fill="#d9b48a"/><rect x="13" y="1.5" width="6" height="6" fill="#d9b48a"/>' +
    '<rect x="-11" y="1.5" width="22" height="27" rx="1.5" fill="#fff"/>' +
    '<rect x="-11" y="14" width="22" height="14.5" fill="#c9604a"/>' +
    '<rect x="-11" y="1.5" width="22" height="3.5" fill="#5b2a1a"/>' +
    '<rect x="-9" y="6.5" width="8" height="5" rx="1.5" fill="#fff"/><rect x="1" y="6.5" width="8" height="5" rx="1.5" fill="#fff"/></g>';
}
// 爐灶：背靠牆（y=0），雙口爐，前緣粗線＝灶口
function bzdxStoveSvg() {
  const burner = (cx) => '<circle cx="' + cx + '" cy="9.5" r="4.2" fill="none"/>' +
    '<line x1="' + (cx - 5.5) + '" y1="9.5" x2="' + (cx + 5.5) + '" y2="9.5"/>' +
    '<line x1="' + cx + '" y1="4" x2="' + cx + '" y2="15"/>';
  return '<g stroke="' + BZDX_RED + '" stroke-width="1.1">' +
    '<rect x="-16" y="1.5" width="32" height="16" rx="1.5" fill="#fff"/>' + burner(-7.5) + burner(7.5) +
    '<line x1="-16" y1="17.5" x2="16" y2="17.5" stroke-width="2.4"/></g>';
}

// 先天卦位反查：後天方位 → 該方之先天卦
const BZDX_XIANTIAN_AT = {};
Object.keys(BZDX_XIANTIAN_DIR).forEach((g) => { BZDX_XIANTIAN_AT[BZDX_XIANTIAN_DIR[g]] = Number(g); });
const BZDX_TONE_TXT = { good: ["吉", "#2e9e4b"], ping: ["平", "#1f5fa8"], bad: ["凶", "#d13b3b"] };

// ---- 財位 ----
// 本命財位＝命卦生氣方（《八宅秘籍》：生氣貪狼最吉，「可帶來財氣、活力」）。
// 流年財位＝流年紫白八白左輔星所飛到之方（與個人命書九宮飛星說明一致）；year 為立春年，八白入中時為 "C"。
function bzdxWealth(mingGua, spouseGua, year) {
  const pan = zbFly(zbYearStar(year), true);
  const pal = Object.keys(pan).find((k) => pan[k] === 8);
  return {
    year,
    ben: bzdxStarMap(mingGua).byStar.生氣.dir,
    sp: spouseGua && spouseGua !== mingGua ? bzdxStarMap(spouseGua).byStar.生氣.dir : null,
    liu: ZB_PALACE_TO_DIR[pal]
  };
}
// 金元寶圖示（中心 cx,cy；寬約 26）＋下方標籤
function bzdxIngotPath() {
  return '<path d="M-13,-2 C-11,-9 -7,-4 -5,-3 L5,-3 C7,-4 11,-9 13,-2 C12,6 6,9 0,9 C-6,9 -12,6 -13,-2 Z" fill="#F5C21B" stroke="#A8720A" stroke-width="1.1" stroke-linejoin="round"/>' +
    '<ellipse cx="0" cy="-4" rx="5.6" ry="4.6" fill="#FFE27A" stroke="#A8720A" stroke-width="1.1"/>' +
    '<path d="M-8,3 C-4,6 4,6 8,3" fill="none" stroke="#fff3b0" stroke-width="1.2" stroke-linecap="round"/>';
}
function bzdxIngotSvg(cx, cy, label, color) {
  return '<g transform="translate(' + cx.toFixed(1) + "," + cy.toFixed(1) + ') scale(1.35)">' + bzdxIngotPath() + "</g>" +
    bzdxText(cx, cy + 22, label, 11, color, true);
}
const BZDX_WEALTH_COLOR = { 本命: "#C8161D", 流年: "#1f5fa8", 配偶: "#7B1FA2" };

// kind＝door / bed / stove / cai（財位；wealth＝bzdxWealth 結果）/ xt（先天八卦宅卦圖）；sp＝配偶命卦，可為 null
function bzdxGridHtml(m, kind, sp, wealth) {
  const S = BZDX_SVG;
  const facing = BZDX_OPP[m.sitDir];
  const fi = ZB_COMPASS_CW.indexOf(facing);
  const byDir = {};
  m.palaces.forEach((p) => { byDir[p.dir] = p; });
  // 命卦吉方 → 螢幕側（0上＝向首、1右、2下＝坐山、3左）
  const okSides = m.okDirs.map((d) => ((ZB_COMPASS_CW.indexOf(d) - fi + 8) % 8) / 2);
  const midBand = S.M + S.B / 2;

  let svg = '<rect x="' + S.M + '" y="' + S.M + '" width="' + (S.W - 2 * S.M) + '" height="' + (S.W - 2 * S.M) +
    '" fill="' + BZDX_RED + '" rx="3"/>' +
    '<rect x="0.5" y="0.5" width="' + (S.W - 1) + '" height="' + (S.W - 1) + '" fill="none" stroke="#c9a96b"/>';
  let icons = "", labels = "";
  // 中宮：宅卦
  const c0 = S.G0 + S.C;
  const xt = kind === "xt";
  // 先天圖：宅主（m.mingGua）與配偶各方吉／平／凶，及先天兩全之方
  const mingDir = xt ? bzdxStarMap(m.mingGua).byDir : null, spDir = xt && sp ? bzdxStarMap(sp).byDir : null;
  const xtBoth = xt && sp && BZDX_EAST.includes(m.mingGua) !== BZDX_EAST.includes(sp) ? bzdxXiantianBoth(m.mingGua, sp) : [];
  svg += '<rect x="' + c0 + '" y="' + c0 + '" width="' + S.C + '" height="' + S.C + '" fill="' + BZDX_RED + '" stroke="#fff" stroke-width="2"/>' +
    (xt
      ? bzdxText(c0 + S.C / 2, c0 + S.C / 2 - 12, ZB_GUA_CHAR[BZDX_XIANTIAN_AT[m.sitDir]], 30, "#fff", true) +
        bzdxText(c0 + S.C / 2, c0 + S.C / 2 + 24, "後天" + ZB_GUA_CHAR[m.zhaiGua] + "宅", 11, "#f3dcc0", true)
      : kind === "cai" && wealth.liu === "C"
      // 流年八白入中：財位在宅之中央
      ? bzdxText(c0 + S.C / 2, c0 + S.C / 2 - 20, ZB_GUA_CHAR[m.zhaiGua], 26, "#fff", true) +
        bzdxIngotSvg(c0 + S.C / 2, c0 + S.C / 2 + 8, "流年", "#FFE9A8")
      : '<text x="' + (c0 + S.C / 2) + '" y="' + (c0 + S.C / 2) + '" font-size="32" font-weight="800" fill="#fff" text-anchor="middle" dominant-baseline="central">' +
        ZB_GUA_CHAR[m.zhaiGua] + "</text>");

  for (let k = 0; k < 8; k++) {
    const dir = ZB_COMPASS_CW[(fi + k) % 8];
    const pos = ZB_SCREEN_CW[k];
    const p = byDir[dir];
    const x = S.G0 + (pos.c - 1) * S.C, y = S.G0 + (pos.r - 1) * S.C;
    if (xt) {
      // 大字＝此方之先天卦；小字＝後天卦・宅之遊年星；下行＝宅主／配偶在此方之吉、平（先天卦位）、凶
      const both = xtBoth.includes(dir);
      const cx = x + S.C / 2, cy = y + S.C / 2;
      const tone = (g, byD) => { const t = BZDX_TONE_TXT[bzdxTone(g, byD, dir)]; return '<tspan fill="' + t[1] + '">' + ZB_GUA_CHAR[g] + t[0] + "</tspan>"; };
      svg += '<rect x="' + x + '" y="' + y + '" width="' + S.C + '" height="' + S.C + '" fill="' +
        (both ? "#DDF0D3" : (p.good ? "#fff" : "#E4E4E4")) + '" stroke="' + BZDX_RED + '" stroke-width="1"/>' +
        bzdxText(cx, cy - 20, ZB_GUA_CHAR[BZDX_XIANTIAN_AT[dir]], 24, BZDX_RED, true) +
        bzdxText(cx, cy + 6, "後天" + ZB_GUA_CHAR[ZB_DIR_TO_PALACE[dir]] + "・" + p.star, 10, p.good ? "#2e9e4b" : "#666", true) +
        '<text x="' + cx.toFixed(1) + '" y="' + (cy + 22).toFixed(1) + '" font-size="11" font-weight="700" text-anchor="middle" dominant-baseline="central">' +
          tone(m.mingGua, mingDir) + (sp ? " " + tone(sp, spDir) : "") + "</text>" +
        (both ? bzdxText(cx, cy + 36, "先天兩全", 9, "#2e7d32", true) : "");
      // 本人先天卦位（中平）加藍框
      [m.mingGua].concat(sp ? [sp] : []).forEach((g) => {
        if (BZDX_XIANTIAN_DIR[g] === dir) svg += '<rect x="' + (x + 2.5) + '" y="' + (y + 2.5) + '" width="' + (S.C - 5) + '" height="' + (S.C - 5) +
          '" fill="none" stroke="#1f5fa8" stroke-width="1.6" stroke-dasharray="4 2"/>';
      });
    } else if (kind === "cai") {
      // 財位圖：本命（生氣方）、流年（八白）、配偶本命各畫一顆金元寶；財位宮底色淡金
      const tags = [];
      if (wealth.ben === dir) tags.push("本命");
      if (wealth.liu === dir) tags.push("流年");
      if (wealth.sp === dir) tags.push("配偶");
      const cx = x + S.C / 2, cy = y + S.C / 2;
      svg += '<rect x="' + x + '" y="' + y + '" width="' + S.C + '" height="' + S.C + '" fill="' +
        (tags.length ? "#FFF1BF" : (p.good ? "#fff" : "#D6D6D6")) + '" stroke="' + BZDX_RED + '" stroke-width="1"/>' +
        bzdxText(cx, tags.length ? cy - 27 : cy, p.star, tags.length ? 13 : 15, "#333", true);
      tags.forEach((t, i) => { svg += bzdxIngotSvg(cx + (i - (tags.length - 1) / 2) * 40, cy + 3, t, BZDX_WEALTH_COLOR[t]); });
    } else {
      svg += '<rect x="' + x + '" y="' + y + '" width="' + S.C + '" height="' + S.C + '" fill="' + (p.good ? "#fff" : "#D6D6D6") +
        '" stroke="' + BZDX_RED + '" stroke-width="1"/>' + bzdxText(x + S.C / 2, y + S.C / 2, p.star, 15, "#333", true);
    }

    // 本宮三山（順時針）在外牆上的位置：邊格沿外牆 1/6、1/2、5/6；角格首山在前一面牆中點、中山在角、末山在後一面牆中点
    const slots = [];
    let s1 = -1, s2 = -1;
    if (k % 2 === 0) {
      const sd = k / 2;
      [1 / 6, 1 / 2, 5 / 6].forEach((t) => slots.push({ side: sd, pt: bzdxSidePt(pos.r, pos.c, sd, t) }));
    } else {
      s1 = (k - 1) / 2; s2 = ((k + 1) / 2) % 4;
      slots.push({ side: s1, pt: bzdxSidePt(pos.r, pos.c, s1, 0.5) });
      slots.push({ side: -1 });
      slots.push({ side: s2, pt: bzdxSidePt(pos.r, pos.c, s2, 0.5) });
    }
    // 外圈 24 山字（大門圖中平吉之山加橘圈）
    slots.forEach((sl, j) => {
      const op = sl.side >= 0 ? bzdxPush(sl.pt, sl.side, S.M / 2) : bzdxCornerPt(s1, s2, S.M / 2);
      const mt = p.mountains[j];
      const pj = kind === "door" && p.pingji.includes(mt);
      if (pj) labels += '<circle cx="' + op[0].toFixed(1) + '" cy="' + op[1].toFixed(1) + '" r="7.5" fill="' + BZDX_ORANGE + '"/>';
      labels += bzdxText(op[0], op[1], mt, 10, pj ? "#fff" : "#6b571c", true);
    });
    // 方位字（深紅框內，左右兩側直排）
    const nm = ZB_DIR_NAME[dir];
    if (k % 2 === 0) {
      const lp = bzdxPush(bzdxSidePt(pos.r, pos.c, k / 2, 0.5), k / 2, midBand);
      if ((k === 2 || k === 6) && nm.length === 2) {
        labels += bzdxText(lp[0], lp[1] - 6, nm[0], 10, "#fff", true) + bzdxText(lp[0], lp[1] + 6, nm[1], 10, "#fff", true);
      } else labels += bzdxText(lp[0], lp[1], nm, 10, "#fff", true);
    } else {
      // 角落方位字放在角格上緣／下緣的框內，靠角
      const lp = bzdxCornerPt(s1, s2, midBand);
      const dx = [s1, s2].includes(1) ? -14 : 14;
      labels += bzdxText(lp[0] + dx, lp[1], nm, 10, "#fff", true);
    }

    // 圖示
    if (kind === "door") {
      if (p.star === "伏位") {
        // 伏位＝坐山（宅之背），書中不畫門：大門不開在坐山
        svg += bzdxText(x + S.C / 2, y + S.C / 2 + 20, "坐山・不開門", 10, "#b3261e", true);
      } else {
        // 可開門位置：生氣／延年／天醫宮每一面外牆中點；凶宮只在平吉之山。
        // 門色依門所在之牆朝向：朝宅主命卦吉方＝大吉（深紅），否則平吉（橘）。
        slots.forEach((sl, j) => {
          if (sl.side < 0) return;
          if (p.good ? (k % 2 === 0 && j !== 1) : !p.pingji.includes(p.mountains[j])) return;
          icons += bzdxPlace(sl.pt, sl.side, bzdxDoorSvg(okSides.includes(sl.side) ? BZDX_RED : BZDX_ORANGE));
        });
      }
    } else if ((kind === "bed" && p.good) || (kind === "stove" && !p.good)) {
      okSides.forEach((sd) => {
        // 床：床頭板靠 sd 側牆（頭朝 sd）；灶：灶口朝 sd，故背靠對側牆
        const wall = kind === "bed" ? sd : (sd + 2) % 4;
        icons += bzdxPlace(bzdxSidePt(pos.r, pos.c, wall, 0.5), wall, kind === "bed" ? bzdxBedSvg() : bzdxStoveSvg(), 0.85);
      });
    }
  }

  const title = { door: "大門", bed: "主臥", stove: "灶頭", cai: "財位", xt: "先天八卦宅卦" }[kind];
  const okTxt = m.okDirs.map((d) => ZB_DIR_NAME[d]).join("、");
  const ingotLg = '<svg class="bzdx-ingot-lg" viewBox="-15 -11 30 22" xmlns="http://www.w3.org/2000/svg">' + bzdxIngotPath() + "</svg>";
  const legend = kind === "cai"
    // 每項（元寶＋文字）包成不可拆的一組，整列過寬時以組為單位換行
    ? [["本命", ZB_GUA_CHAR[m.mingGua] + "命生氣方"], ["流年", wealth.year + " 年八白"]]
        .concat(wealth.sp ? [["配偶", ZB_GUA_CHAR[sp] + "命生氣方"]] : [])
        .map((it) => '<span class="bzdx-lgi">' + ingotLg + it[0] + "＝" + it[1] + "</span>").join("")
    : xt
    ? '<span class="bzdx-lg" style="background:#DDF0D3;border:1px solid #9cc98a"></span>先天兩全　' +
      '<span class="bzdx-lg" style="border:1.5px dashed #1f5fa8"></span>本人先天卦位（中平）　' +
      '<span class="bzdx-lg" style="background:#E4E4E4"></span>宅之凶宮'
    : kind === "door"
    ? '<span class="bzdx-lg" style="background:' + BZDX_RED + '"></span>大吉（門朝' + okTxt + '）　<span class="bzdx-lg" style="background:' + BZDX_ORANGE + '"></span>平吉'
    : (kind === "bed" ? "床頭朝：" : "灶口朝：") + "<b>" + okTxt + "</b>";
  return '<div class="bzdx-gridbox"><div class="bzdx-gridtitle">' + title + "</div>" +
    '<svg class="bzdx-svg' + (xt ? " xt" : "") + '" viewBox="0 0 ' + S.W + " " + S.W + '" xmlns="http://www.w3.org/2000/svg">' +
    svg + icons + labels + "</svg>" +
    '<div class="bzdx-legend">' + legend + "</div></div>";
}

function bzdxGuaCard(g, selGua, userGua, spouseGua) {
  const d = ZB_PALACE_TO_DIR[g];
  const ming = bzdxStarMap(g).byStar;
  const cls = "bzdx-card" + (g === selGua ? " active" : "") + (g === userGua ? " mine" : "") +
    (g === spouseGua && g !== userGua ? " spouse" : "");
  return '<button type="button" class="' + cls + '" data-bzdx-gua="' + g + '">' +
    '<span class="bzdx-card-num">' + g + "</span>" +
    '<span class="bzdx-card-gua">' + ZB_GUA_CHAR[g] + "命</span>" +
    '<span class="bzdx-card-sub">' + BZDX_STAR_NAME[g] + "星命・" + ZB_DIR_NAME[d] + "</span>" +
    '<span class="bzdx-card-sub">生氣' + ming.生氣.dirName + "・延年" + ming.延年.dirName + "</span>" +
    '<span class="bzdx-card-tags">' +
      (g === userGua ? '<span class="bzdx-card-mine">宅主</span>' : "") +
      (g === spouseGua ? '<span class="bzdx-card-sp">配偶</span>' : "") + "</span></button>";
}

// 宅之四正向（坐、右、向、左）
function bzdxAxes(zhaiGua) {
  const i = ZB_COMPASS_CW.indexOf(ZB_PALACE_TO_DIR[zhaiGua]);
  return [0, 2, 4, 6].map((k) => ZB_COMPASS_CW[(i + k) % 8]);
}

// 夫妻命卦合參：八方對照兩人遊年星
function bzdxCoupleHtml(userGua, spouseGua) {
  const a = bzdxStarMap(userGua).byDir, b = bzdxStarMap(spouseGua).byDir;
  const ae = BZDX_EAST.includes(userGua), be = BZDX_EAST.includes(spouseGua);
  const same = ae === be;
  // 先天卦位之凶方標「先天中平」
  const cell = (gua, s, d) => {
    const t = bzdxTone(gua, gua === userGua ? a : b, d);
    return '<b class="' + (t === "good" ? "bz-good" : "bz-bad") + '">' + s.star + "</b>" +
      (BZDX_XIANTIAN_DIR[gua] === d ? '<br><small class="bzdx-xt' + (t === "ping" ? " ping" : "") + '">' +
        ZB_GUA_CHAR[gua] + "先天位" + (t === "ping" ? "・中平" : "") + "</small>" : "");
  };
  const xtBoth = same ? [] : bzdxXiantianBoth(userGua, spouseGua);
  let rows = "";
  ZB_COMPASS_CW.forEach((d) => {
    const ta = bzdxTone(userGua, a, d), tb = bzdxTone(spouseGua, b, d);
    const ga = ta === "good", gb = tb === "good";
    const xt = xtBoth.includes(d);
    const tag = ga && gb ? '<span class="zibai-tag zb-tone-good">兩人皆吉</span>'
      : xt ? '<span class="zibai-tag zb-tone-good">先天兩全</span><br><small>' + (ga ? "宅主吉・配偶平" : "宅主平・配偶吉") + "</small>"
      : ga ? '<span class="zibai-tag zb-tone-neu">宅主吉</span>'
      : gb ? '<span class="zibai-tag zb-tone-neu">配偶吉</span>'
      : '<span class="zibai-tag zb-tone-bad">兩人皆凶</span>';
    rows += "<tr" + (ga && gb ? ' class="bzdx-both"' : xt ? ' class="bzdx-xtrow"' : "") + "><td><b>" + ZB_DIR_NAME[d] + "</b></td><td>" +
      cell(userGua, a[d], d) + "</td><td>" + cell(spouseGua, b[d], d) + "</td><td>" + tag + "</td></tr>";
  });
  const both = ZB_COMPASS_CW.filter((d) => a[d].tone === "good" && b[d].tone === "good").map((d) => ZB_DIR_NAME[d]);
  const xtLine = (g) => ZB_GUA_CHAR[g] + "命先天卦位在" + ZB_DIR_NAME[BZDX_XIANTIAN_DIR[g]] +
    (bzdxTone(g, bzdxStarMap(g).byDir, BZDX_XIANTIAN_DIR[g]) === "ping" ? "（本為" + bzdxStarMap(g).byDir[BZDX_XIANTIAN_DIR[g]].star + "，先天作中平）" : "（本已是吉方）");
  const intro = "宅主 <b>" + userGua + " " + ZB_GUA_CHAR[userGua] + "命</b>（" + (ae ? "東" : "西") + "四命）、配偶 <b>" +
    spouseGua + " " + ZB_GUA_CHAR[spouseGua] + "命</b>（" + (be ? "東" : "西") + "四命）。" +
    (same
      ? "兩人同屬" + (ae ? "東" : "西") + "四命，四吉方相同（" + both.join("、") + "），宅之吉凶對兩人一致，依宅主擇宅、擺設即可兼顧。"
      : "兩人東西相異，後天八方沒有兩人皆吉之方。大門、灶頭以宅主（家中主要經濟支柱）為準；主臥則可借<b>先天八卦</b>調和：" +
        "命卦之先天卦位對本人不作凶論（中平），取「一人吉方、另一人先天卦位」之方安床，一吉一平、兩不相沖。" +
        '<div class="zibai-hr"></div>' + xtLine(userGua) + "；" + xtLine(spouseGua) + "。" +
        (xtBoth.length
          ? '主臥宜安於 <b class="bz-good">' + xtBoth.map((d) => ZB_DIR_NAME[d]).join("、") + "</b> 方，為先天兩全之位。"
          : '<span class="bz-bad">兩人先天卦位皆落在對方凶方，無先天兩全之位</span>，床頭以宅主吉方為準，配偶睡在靠其本命吉方一側，書桌、座位各取本命吉方補足。'));
  return '<div class="zibai-section"><div class="zibai-section-title">夫妻命卦合參</div>' +
    '<div class="zibai-block"><div class="zibai-block-b">' + intro + "</div></div>" +
    '<table class="bzdx-table bzdx-couple"><thead><tr><th>方位</th><th>宅主 ' + ZB_GUA_CHAR[userGua] + "命</th><th>配偶 " +
    ZB_GUA_CHAR[spouseGua] + "命</th><th>合參</th></tr></thead><tbody>" + rows + "</tbody></table>" +
    (same ? "" : '<div class="zibai-note">先天卦位：乾南、坤北、離東、坎西、兌東南、震東北、巽西南、艮西北。「先天兩全」為一人吉、一人中平，非兩人皆吉。</div>') +
    "</div>";
}

// selGua：目前檢視之命卦；userGua：表單算出之宅主命卦；zhaiGua：表單座向之宅卦（可被總覽表點選覆寫）；
// spouseGua：配偶命卦（未填為 null）；year：流年財位之立春年（未給則取今天所屬立春年）
function buildBazhaiDongxiHtml(selGua, userGua, zhaiGua, formZhaiGua, spouseGua, year) {
  spouseGua = spouseGua || null;
  if (!year) { const now = new Date(); year = zbYuanYear(now.getFullYear(), now.getMonth() + 1, now.getDate()); }
  const ming = bzdxStarMap(selGua);
  const east = BZDX_EAST.includes(selGua);
  let h = "";

  // 一、東四命・西四命總表
  h += '<div class="zibai-section"><div class="zibai-section-title">東四命・西四命</div>' +
    '<div class="bzdx-group"><div class="bzdx-group-h">東四命<small>坎・離・震・巽　吉方：北、南、東、東南</small></div>' +
    '<div class="bzdx-cards">' + BZDX_EAST.map((g) => bzdxGuaCard(g, selGua, userGua, spouseGua)).join("") + "</div></div>" +
    '<div class="bzdx-group"><div class="bzdx-group-h">西四命<small>乾・坤・艮・兌　吉方：西北、西南、東北、西</small></div>' +
    '<div class="bzdx-cards">' + BZDX_WEST.map((g) => bzdxGuaCard(g, selGua, userGua, spouseGua)).join("") + "</div></div>" +
    '<div class="zibai-note">點選命卦卡可查看其他命卦。命卦五：男寄坤（2）、女寄艮（8）。坐北（坎）、坐南（離）、坐東（震）、坐東南（巽）之宅為東四宅；坐西北（乾）、坐西南（坤）、坐東北（艮）、坐西（兌）之宅為西四宅。東四命宜住東四宅，西四命宜住西四宅。</div></div>';

  // 一之二、夫妻命卦合參（有填配偶才顯示）
  if (spouseGua) h += bzdxCoupleHtml(userGua, spouseGua);

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
    const doors = m.palaces.filter((p) => p.good && p.star !== "伏位").map((p) => ZB_DIR_NAME[p.dir]).join("、");
    rows += '<tr class="bzdx-zrow' + (z === zhaiGua ? " active" : "") + '" data-bzdx-zhai="' + z + '">' +
      "<td><b>" + ZB_GUA_CHAR[z] + "宅</b>" + (z === formZhaiGua ? '<br><small class="bzdx-here">本宅</small>' : "") + "</td>" +
      "<td>坐" + ZB_DIR_NAME[ZB_PALACE_TO_DIR[z]] + "<br><small>" + sit + "山</small></td>" +
      "<td>" + (m.zhaiEast ? "東四宅" : "西四宅") + "<br>" +
        (m.match ? '<b class="bz-good">相配</b>' : '<b class="bz-bad">不配</b>') + "</td>" +
      (spouseGua ? "<td>" + (BZDX_EAST.includes(spouseGua) === m.zhaiEast ? '<b class="bz-good">相配</b>' : '<b class="bz-bad">不配</b>') + "</td>" : "") +
      "<td>" + doors + "</td>" +
      "<td>" + m.okDirs.map((d) => ZB_DIR_NAME[d]).join("、") + "</td></tr>";
  });
  h += '<div class="zibai-section"><div class="zibai-section-title">' + ZB_GUA_CHAR[selGua] + "命配八宅</div>" +
    '<table class="bzdx-table bzdx-ztable"><thead><tr><th>宅卦</th><th>坐向</th><th>相配</th>' +
    (spouseGua ? "<th>配偶<br>" + ZB_GUA_CHAR[spouseGua] + "命</th>" : "") +
    "<th>大門宜開宮</th><th>門／床頭／灶口宜朝</th></tr></thead><tbody>" +
    rows + "</tbody></table>" +
    '<div class="zibai-note">點選任一列查看該宅的大門、主臥、灶頭九宮。「本宅」為上方陽宅面向所得之宅卦。門、床頭、灶口限宅之坐、向、左、右四正向（依牆面擺設），取其中屬宅主命卦吉方者；大門開在朝此方的牆上為大吉。</div></div>';

  // 四、X 命配 Y 宅：大門／主臥／灶頭
  const m = bzdxMatch(selGua, zhaiGua);
  const pj = m.palaces.filter((p) => !p.good && p.pingji.length)
    .map((p) => ZB_DIR_NAME[p.dir] + p.star + "宮之" + p.pingji.join("、") + "山").join("；");
  const goodPal = m.palaces.filter((p) => p.good).map((p) => ZB_DIR_NAME[p.dir] + p.star).join("、");
  const badPal = m.palaces.filter((p) => !p.good).map((p) => ZB_DIR_NAME[p.dir] + p.star).join("、");
  const doorPal = m.palaces.filter((p) => p.good && p.star !== "伏位").map((p) => ZB_DIR_NAME[p.dir] + p.star).join("、");
  const fuwei = m.palaces.find((p) => p.star === "伏位");
  // 配偶床頭：宅四正向中屬配偶吉方者，並標出與宅主共同可用之方
  let spouseBed = "";
  if (spouseGua) {
    const sp = bzdxStarMap(spouseGua).byDir;
    const spDirs = bzdxAxes(zhaiGua).filter((d) => sp[d].tone === "good");
    const common = spDirs.filter((d) => m.okDirs.includes(d));
    spouseBed = "配偶 " + ZB_GUA_CHAR[spouseGua] + "命床頭宜朝 " +
      spDirs.map((d) => ZB_DIR_NAME[d] + "（" + sp[d].star + "）").join("、") + "；" +
      (common.length
        ? '兩人共同可用：<b class="bz-good">' + common.map((d) => ZB_DIR_NAME[d]).join("、") + "</b>，床頭優先朝此方。"
        : '<span class="bz-bad">四正向中無兩人共同吉方</span>，床頭以' + ZB_GUA_CHAR[selGua] + "命吉方為準，配偶睡位靠其本命吉方一側。");
    // 東西命不同：依先天八卦取兩全之宮安床（宅之吉宮優先）
    if (BZDX_EAST.includes(selGua) !== BZDX_EAST.includes(spouseGua)) {
      const xt = bzdxXiantianBoth(selGua, spouseGua);
      const pal = (d) => m.palaces.find((p) => p.dir === d);
      const inGood = xt.filter((d) => pal(d).good), other = xt.filter((d) => !pal(d).good);
      spouseBed += xt.length
        ? "依先天八卦，" + (inGood.length
            ? '主臥宜安於 <b class="bz-good">' + inGood.map((d) => ZB_DIR_NAME[d] + pal(d).star).join("、") + "宮</b>（先天兩全且為宅之吉宮）"
            : "先天兩全之方為" + other.map((d) => ZB_DIR_NAME[d]).join("、") + "，惟落在宅之凶宮，不宜安床") +
          (inGood.length && other.length ? "；" + other.map((d) => ZB_DIR_NAME[d]).join("、") + "方雖兩全，惟為宅之凶宮" : "") + "。"
        : "兩人先天卦位皆落在對方凶方，無先天兩全之位。";
    }
  }
  // 單人宅命不配：本命先天卦位若落在宅之吉宮，可作臥房（同上先天中平原則）
  let xtSingle = "";
  if (!m.match) {
    const xd = BZDX_XIANTIAN_DIR[selGua];
    const xp = m.palaces.find((p) => p.dir === xd);
    xtSingle = bzdxTone(selGua, m.mingByDir, xd) === "ping" && xp.good
      ? "依先天八卦：" + ZB_GUA_CHAR[selGua] + "命先天卦位在" + ZB_DIR_NAME[xd] + "，對本命不作凶論（中平），又是宅之" + xp.star +
        '吉宮，<b class="bz-good">' + ZB_DIR_NAME[xd] + "宮宜作" + ZB_GUA_CHAR[selGua] + "命之臥房</b>。"
      : "";
  }
  // 財位：本命（生氣方）、流年（八白）、配偶本命
  const wealth = bzdxWealth(selGua, spouseGua, year);
  const palAt = (d) => m.palaces.find((p) => p.dir === d);
  const inZhai = (d) => { const p = palAt(d); return "宅之" + p.star + (p.good ? "吉宮" : "凶宮"); };
  const benP = palAt(wealth.ben);
  let caiTxt = "本命財位在 <b>" + ZB_DIR_NAME[wealth.ben] + "</b>（" + ZB_GUA_CHAR[selGua] + "命生氣方，主財氣與活力），落在" + inZhai(wealth.ben) + "，" +
    (benP.good ? "宜作客廳、辦公桌、收銀或放保險箱之處，保持明亮整潔。" : "宅氣不助，宜保持整潔少堆雜物，改以座位、辦公桌面向此方取用。");
  if (wealth.sp) caiTxt += "配偶 " + ZB_GUA_CHAR[spouseGua] + "命本命財位在 <b>" + ZB_DIR_NAME[wealth.sp] + "</b>（" + inZhai(wealth.sp) + "）。";
  caiTxt += wealth.year + " 年流年財位在 <b>" + (wealth.liu === "C" ? "中宮" : ZB_DIR_NAME[wealth.liu]) + "</b>（八白左輔星飛臨" +
    (wealth.liu === "C" ? "，入中宮，宅之中央宜保持明亮整潔" : "，" + inZhai(wealth.liu)) + "），可擺聚寶盆、水晶或紅紫色物品催旺；流年財位每年立春更換。" +
    (wealth.liu === wealth.ben ? '<b class="bz-good">今年本命財位與流年財位同在' + ZB_DIR_NAME[wealth.ben] + "，財氣最旺，宜重點佈置。</b>" : "");
  h +='<div class="zibai-section"><div class="zibai-section-title">' + ZB_GUA_CHAR[selGua] + "命配" + ZB_GUA_CHAR[zhaiGua] + "宅（" +
    (m.match ? "宅命相配" : "東西相混，宅命不配") + "）</div>" +
    '<div class="bzdx-grids four">' + bzdxGridHtml(m, "door") + bzdxGridHtml(m, "bed") + bzdxGridHtml(m, "stove") +
      bzdxGridHtml(m, "cai", spouseGua, wealth) + "</div>" +
    '<div class="zibai-block"><div class="zibai-block-b">' +
      "<b>大門</b>：可開於" + doorPal + "宮" +
        (pj ? "，凶宮中可取" + pj + "（該山納甲屬宅之吉卦）" : "") + "；" +
        ZB_DIR_NAME[fuwei.dir] + "伏位為坐山（宅之背），不開大門。門開在朝 " + bzdxDirList(m.okDirs, m.mingByDir) +
        " 之牆上為大吉，朝其他方向為平吉。<div class=\"zibai-hr\"></div>" +
      "<b>主臥</b>：安於" + goodPal + "宮，床頭朝 " + bzdxDirList(m.okDirs, m.mingByDir) + "。" + spouseBed +
        "<div class=\"zibai-hr\"></div>" +
      "<b>灶頭</b>：坐凶向吉，灶安於" + badPal + "宮壓凶，灶口（火門）朝 " + bzdxDirList(m.okDirs, m.mingByDir) +
        "，灶背靠" + m.okDirs.map((d) => ZB_DIR_NAME[BZDX_OPP[d]]).join("／") + "側牆。" +
        "<div class=\"zibai-hr\"></div><b>財位</b>：" + caiTxt +
      (m.match ? "" : '<div class="zibai-hr"></div><span class="bz-bad">宅命不配</span>：宅之吉宮多落在本命凶方，宜以床頭、灶口、書桌座向取本命吉方補救，並多用宅中吉山。' + xtSingle) +
    "</div></div></div>";

  // 五、先天八卦宅卦（頁面最下方）
  const xtZhai = BZDX_XIANTIAN_AT[m.sitDir];
  const palOf = (d) => m.palaces.find((p) => p.dir === d);
  const xtPos = (g) => {
    const d = BZDX_XIANTIAN_DIR[g], p = palOf(d), t = bzdxTone(g, bzdxStarMap(g).byDir, d);
    return ZB_GUA_CHAR[g] + "命先天卦位在" + ZB_DIR_NAME[d] + "（宅之" + p.star + (p.good ? "吉" : "凶") + "宮）" +
      (t === "ping" ? "，此方對" + ZB_GUA_CHAR[g] + "命作中平" : "，此方本是" + ZB_GUA_CHAR[g] + "命吉方");
  };
  let xtAdvice;
  if (spouseGua && BZDX_EAST.includes(selGua) !== BZDX_EAST.includes(spouseGua)) {
    const xb = bzdxXiantianBoth(selGua, spouseGua);
    const ok = xb.filter((d) => palOf(d).good);
    xtAdvice = ok.length
      ? '主臥宜安於 <b class="bz-good">' + ok.map((d) => ZB_DIR_NAME[d] + palOf(d).star).join("、") + "宮</b>：先天兩全，又是宅之吉宮。"
      : xb.length ? "先天兩全之方（" + xb.map((d) => ZB_DIR_NAME[d]).join("、") + "）皆落在宅之凶宮，本宅不宜依此安床，床頭以" + ZB_GUA_CHAR[selGua] + "命吉方為準。"
      : "兩人先天卦位皆落在對方凶方，無先天兩全之位，床頭以" + ZB_GUA_CHAR[selGua] + "命吉方為準。";
  } else {
    const d = BZDX_XIANTIAN_DIR[selGua], p = palOf(d);
    xtAdvice = bzdxTone(selGua, m.mingByDir, d) === "ping" && p.good
      ? '<b class="bz-good">' + ZB_DIR_NAME[d] + p.star + "宮</b>為" + ZB_GUA_CHAR[selGua] + "命先天卦位（中平）又是宅之吉宮，宅命不配時可作臥房。"
      : m.match ? "宅命相配，依後天吉方安排即可，先天卦位僅供參考。"
      : ZB_GUA_CHAR[selGua] + "命先天卦位不在宅之吉宮，宅命不配時仍以床頭、灶口取本命吉方補救。";
  }
  h += '<div class="zibai-section"><div class="zibai-section-title">' + ZB_GUA_CHAR[zhaiGua] + "宅先天八卦（先天" +
    ZB_GUA_CHAR[xtZhai] + "宅）</div>" +
    '<div class="bzdx-grids">' + bzdxGridHtml(m, "xt", spouseGua) + "</div>" +
    '<div class="zibai-block"><div class="zibai-block-b">' +
      "本宅坐" + ZB_DIR_NAME[m.sitDir] + "，後天為" + ZB_GUA_CHAR[zhaiGua] + "宅；先天八卦此方為<b>" + ZB_GUA_CHAR[xtZhai] +
      "</b>，即本宅之先天宅卦。圖中各宮大字為先天卦、小字為後天卦與宅之遊年星，下行為各人在該方之吉、平、凶。" +
      '<div class="zibai-hr"></div>' + xtPos(selGua) + "。" + (spouseGua && spouseGua !== selGua ? xtPos(spouseGua) + "。" : "") +
      '<div class="zibai-hr"></div>' + xtAdvice +
    "</div></div>" +
    '<div class="zibai-note">先天八卦：乾南、坤北、離東、坎西、兌東南、震東北、巽西南、艮西北。命卦之先天卦位對本人不作凶論（中平）；「先天兩全」為一人吉、一人中平。</div></div>';
  return h;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { bzdxMatch, buildBazhaiDongxiHtml };
}
