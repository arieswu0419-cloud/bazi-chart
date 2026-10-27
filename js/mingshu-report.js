// ================= 八字「八字命書報告」=================
// 依 bazi-engine.js 的排盤結果（app.js 的 currentChart）組出整本個人命書的 DOM 區塊，再由 app.js 逐區塊轉成 PDF。
// 章節仿《個人命書》：封面、八字命卷、大運流年、目錄、我是誰、能量提升、事業、財富、健康、人緣、感情、文昌、
// 神煞、心靈（脈輪）、人生階段、特贈福利（吉凶方／當年運勢／九宮飛星）、對照表。
// 文字取自 mingshu-content.js／mingshu-content2.js，依日主、十神比重前二、五行喜忌與強弱、神煞、合沖關係挑選組合。
(function () {
  const C = window.MINGSHU_CONTENT, C2 = window.MINGSHU_CONTENT2;
  const ELEMS = ["木", "火", "土", "金", "水"];
  const ZHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  const GANS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  const ANIMAL = { 子: "鼠", 丑: "牛", 寅: "虎", 卯: "兔", 辰: "龍", 巳: "蛇", 午: "馬", 未: "羊", 申: "猴", 酉: "雞", 戌: "狗", 亥: "豬" };
  const CHONG = { 子: "午", 午: "子", 丑: "未", 未: "丑", 寅: "申", 申: "寅", 卯: "酉", 酉: "卯", 辰: "戌", 戌: "辰", 巳: "亥", 亥: "巳" };
  const LIUHE = { 子: "丑", 丑: "子", 寅: "亥", 亥: "寅", 卯: "戌", 戌: "卯", 辰: "酉", 酉: "辰", 巳: "申", 申: "巳", 午: "未", 未: "午" };
  const SANHE = { 申子辰: "水", 亥卯未: "木", 寅午戌: "火", 巳酉丑: "金" };
  const TAOHUA = { 申子辰: "酉", 寅午戌: "卯", 巳酉丑: "午", 亥卯未: "子" };
  const GOD_ORDER = ["正官", "七殺", "正財", "偏財", "食神", "傷官", "正印", "偏印", "比肩", "劫財"];
  const CAT = { 比肩: "比劫", 劫財: "比劫", 食神: "食傷", 傷官: "食傷", 正財: "財", 偏財: "財", 正官: "官殺", 七殺: "官殺", 正印: "印", 偏印: "印" };
  const DIR_OF_ZHI = { 子: "正北", 丑: "東北", 寅: "東北", 卯: "正東", 辰: "東南", 巳: "東南", 午: "正南", 未: "西南", 申: "西南", 酉: "正西", 戌: "西北", 亥: "西北" };
  const CHAPTER = {
    whoami: { title: "我是誰？", en: "WHO AM I", color: "#C8102E" },
    career: { title: "事業篇", en: "CAREER", color: "#F07C2A" },
    wealth: { title: "財富篇", en: "WEALTH", color: "#D9A300" },
    health: { title: "健康篇", en: "HEALTH", color: "#9CB023" },
    people: { title: "人緣篇", en: "RELATIONSHIP", color: "#6FA83A" },
    love: { title: "感情篇", en: "LOVE", color: "#2F9E5B" },
    study: { title: "文昌篇", en: "WISDOM", color: "#1F9A80" },
    shensha: { title: "神煞篇", en: "STARS", color: "#2098A4" },
    chakra: { title: "心靈篇", en: "CHAKRA", color: "#2E8FC2" },
    stages: { title: "人生階段的策略", en: "LIFE STAGES", color: "#3C7BC8" },
    bonus1: { title: "特贈福利（一）", en: "BONUS 1", color: "#4A63C4" },
    bonus2: { title: "特贈福利（二）", en: "BONUS 2", color: "#5B53B8" },
    bonus3: { title: "特贈福利（三）", en: "BONUS 3", color: "#6E46A8" },
    ref: { title: "對照表", en: "REFERENCE", color: "#7B3FA0" }
  };
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const uniq = (a) => a.filter((v, i) => v && a.indexOf(v) === i);
  const triadOf = (z) => Object.keys(SANHE).find((k) => k.indexOf(z) >= 0);
  const yearZhi = (y) => ZHI[((y - 4) % 12 + 12) % 12];
  const yearGan = (y) => GANS[((y - 4) % 10 + 10) % 10];
  const DEG = {};
  C2.MOUNTAINS.forEach((m) => m.items.forEach((it) => { DEG[it[0]] = it[1]; }));
  const degOf = (z) => (DEG[z] ? DEG[z].replace("–", "°～") + "°" : "");
  const num = (v) => Number(v) || 0;

  function currentYear() {
    const now = new Date(), y = now.getFullYear();
    const lc = Solar.fromYmd(y, 6, 1).getLunar().getJieQiTable()["立春"];
    const lichun = new Date(lc.getYear(), lc.getMonth() - 1, lc.getDay(), lc.getHour(), lc.getMinute(), lc.getSecond());
    return now < lichun ? y - 1 : y;
  }
  const yearsBranch = (branches, from, to) => { const out = []; for (let y = from; y <= to; y++) if (branches.indexOf(yearZhi(y)) >= 0) out.push(y); return out; };
  const yearsStem = (stems, from, to) => { const out = []; for (let y = from; y <= to; y++) if (stems.indexOf(yearGan(y)) >= 0) out.push(y); return out; };
  const monthOfZhi = (z) => ({ 寅: "2月（立春後）", 卯: "3月（驚蟄後）", 辰: "4月（清明後）", 巳: "5月（立夏後）", 午: "6月（芒種後）", 未: "7月（小暑後）", 申: "8月（立秋後）", 酉: "9月（白露後）", 戌: "10月（寒露後）", 亥: "11月（立冬後）", 子: "12月（大雪後）", 丑: "1月（小寒後）" }[z]);

  // ---------- 模型 ----------
  function build(chart, opts) {
    opts = opts || {};
    const year = opts.year || currentYear();
    const dg = chart.dayGan, D = WUXING_OF_GAN[dg];
    const P = { 時: chart.pillars[0], 日: chart.pillars[1], 月: chart.pillars[2], 年: chart.pillars[3] };
    const yz = P.年.zhi.char, mz = P.月.zhi.char, dz = P.日.zhi.char, tz = P.時.zhi.char;
    const birthYear = Number(chart.solarText.slice(0, 4)), bMonth = Number(chart.solarText.slice(5, 7)), bDay = Number(chart.solarText.slice(8, 10));
    const age = year - birthYear;
    const to = birthYear + 90, from = year;
    const isMale = chart.gender === "male";
    const N = window.BaziReport ? BaziReport.natal(chart) : null;

    // 十神比重前二＝能量（一）（二）
    const godPct = {}; GOD_ORDER.forEach((g) => { godPct[g] = num(chart.shishenPct[g]); });
    const gods = GOD_ORDER.map((g) => ({ g, pct: godPct[g] })).sort((a, b) => b.pct - a.pct || GOD_ORDER.indexOf(a.g) - GOD_ORDER.indexOf(b.g));
    let top = gods.filter((x) => x.pct > 0).slice(0, 2).map((x) => x.g);
    const dzMain = (P.日.hideGans[0] || {}).shiShen;
    if (top.length < 2 && dzMain && top.indexOf(dzMain) < 0) top.push(dzMain);
    if (top.length < 2) top = top.concat(gods.map((x) => x.g).filter((g) => top.indexOf(g) < 0)).slice(0, 2);
    const catPct = {}; Object.keys(CAT).forEach((g) => { catPct[CAT[g]] = (catPct[CAT[g]] || 0) + godPct[g]; });

    // 喜用五行
    const wx = {}; ELEMS.forEach((e) => { wx[e] = num(chart.wuxingPct[e]); });
    let favs = [];
    if (N) {
      favs = ELEMS.filter((e) => N.fav(e) > 0).sort((a, b) => N.fav(b) - N.fav(a));
      if (favs.length < 2) favs = favs.concat(ELEMS.filter((e) => N.fav(e) === 0));
    } else favs = ELEMS.slice().sort((a, b) => wx[a] - wx[b]).slice(0, 2);
    favs = favs.slice(0, 3);
    const weakest = ELEMS.slice().sort((a, b) => wx[a] - wx[b])[0];
    const strongest = ELEMS.slice().sort((a, b) => wx[b] - wx[a])[0];

    // 財富：財星所在之支、破財／橫財年份
    const caiZhi = uniq(["年", "月", "日", "時"].filter((k) => P[k].hideGans.some((h) => CAT[h.shiShen] === "財")).map((k) => P[k].zhi.char));
    const breakBranches = uniq((caiZhi.length ? caiZhi : [yz]).map((z) => CHONG[z]));
    const breakYears = yearsBranch(breakBranches, from, to);
    const pianCaiStem = GANS.filter((g) => getShiShen(dg, g) === "偏財");
    const windfallYears = yearsStem(pianCaiStem, from, to);
    const yearGodGan = P.年.shiShenGan;
    const inheritGood = N ? N.fav(P.年.gan.wuxing) > 0 : false;

    // 健康：月支同／沖之年
    const healthYears = yearsBranch(uniq([mz, CHONG[mz]]), from, to);

    // 人緣：貴人生肖、黃金年份、絆腳石
    const tianyi = TIANYI_GUIREN[dg] || [];
    const nobles = {
      社交: uniq([LIUHE[dz]]), 事業: uniq([GUO_YIN[dg], TIAN_GUAN[dg]]), 情感: uniq([HONG_LUAN[yz], TIAN_XI[yz]]),
      投資: triadOf(dz).split("").filter((z) => z !== dz), 最有力: tianyi
    };
    const goldenYears = yearsBranch(tianyi, from, to);
    const obstacleYears = yearsBranch([CHONG[yz]], from, to);
    const obstacleMonth = monthOfZhi(CHONG[dz]);

    // 感情：配偶星
    const spouseCands = isMale ? ["正財", "偏財"] : ["正官", "七殺"];
    let spouseGod = spouseCands.slice().sort((a, b) => godPct[b] - godPct[a])[0];
    let spouseFrom = "配偶星";
    if (godPct[spouseGod] === 0) { spouseGod = dzMain || spouseGod; spouseFrom = "夫妻宮藏干"; }
    const caiP = catPct.財 || 0, guanP = catPct.官殺 || 0;
    const caiFav = N ? N.fav(N.ce.財) > 0 : true, guanFav = N ? N.fav(N.ce.官殺) > 0 : true;
    const richLevel = (caiP >= 14 && guanP >= 14 && (caiFav || guanFav)) ? "good" : (caiP >= 10 || guanP >= 10) ? "mid" : "weak";

    // 文昌
    const yinP = catPct.印 || 0, shiP = catPct.食傷 || 0;
    const lvl = (p) => (p >= 25 ? "Strong" : p >= 10 ? "Mid" : "Weak");
    const wenchang = WEN_CHANG[dg], xuetang = XUE_TANG_REAL[dg];
    const studyBranches = uniq([wenchang, xuetang]);
    const wenchangYears = yearsBranch([wenchang], from, to);

    // 神煞（四柱）
    const shensha = [];
    ["年", "月", "日", "時"].forEach((k) => (P[k].shensha || []).forEach((n) => {
      let s = shensha.find((x) => x.name === n);
      if (!s) { s = { name: n, where: [] }; shensha.push(s); }
      s.where.push(k + "柱");
    }));

    // 脈輪
    const chakras = C.CHAKRAS.map((ck) => {
      let v, level;
      if (ck.src.kind === "elem") { v = wx[ck.src.elem]; level = v < 12 ? "不足" : v > 32 ? "過盛" : "平衡"; }
      else { v = catPct[ck.src.cat] || 0; level = v < 10 ? "不足" : v > 30 ? "過盛" : "平衡"; }
      return Object.assign({}, ck, { value: v, level, basis: ck.src.kind === "elem" ? "五行" + ck.src.elem + " " + v + "%" : ck.src.cat + "星 " + Math.round(v * 10) / 10 + "%" });
    });

    // 人生階段（大運由少到老）
    const stages = chart.daYunList.slice().reverse().map((d) => ({
      startAge: d.startAge, endAge: d.endAge, startYear: d.startYear, endYear: d.startYear + 9, gz: d.gan.char + d.zhi.char,
      god: d.shiShen, zhiGod: (d.hideGans[0] || {}).shiShen, current: d.isCurrent, fav: N ? N.fav(d.gan.wuxing) : 0
    }));

    // 八宅：命卦、八方、太歲、相沖、桃花
    const gua = zbLifeGua(birthYear, bMonth, bDay, isMale);
    const stars = zbGameStars(gua.num);
    const taisui = { zhi: yz, dir: DIR_OF_ZHI[yz], deg: degOf(yz) };
    const chong = { zhi: CHONG[yz], dir: DIR_OF_ZHI[CHONG[yz]], deg: degOf(CHONG[yz]) };
    const peachZ = TAOHUA[triadOf(yz)];
    const peach = { zhi: peachZ, dir: DIR_OF_ZHI[peachZ], deg: degOf(peachZ) };

    // 當年運勢（沿用流年報告的評分）
    let yearly = null;
    if (window.BaziReport) {
      try {
        const R = BaziReport.analyze(chart, { year });
        const rate = (s) => (s >= 1.1 ? "大吉" : s >= 0.4 ? "吉" : s >= -0.9 ? "平" : "注意");
        yearly = { gz: R.gz, overall: rate(R.yearScore), domains: R.domains, rels: R.rels, ss: R.ss };
      } catch (e) { yearly = null; }
    }
    // 九宮飛星
    const yStar = zbYearStar(year);
    const pan = zbFly(yStar, true);

    return {
      chart, year, age, birthYear, dg, D, P, yz, mz, dz, tz, isMale, N, top, godPct, catPct, wx, favs, weakest, strongest,
      caiZhi, breakBranches, breakYears, pianCaiStem, windfallYears, yearGodGan, inheritGood, healthYears,
      nobles, goldenYears, obstacleYears, obstacleMonth, spouseGod, spouseFrom, richLevel,
      yinP, shiP, yinLvl: lvl(yinP), shiLvl: lvl(shiP), wenchang, xuetang, studyBranches, wenchangYears,
      shensha, chakras, stages, gua, stars, taisui, chong, peach, yearly, yStar, pan
    };
  }

  // ---------- DOM ----------
  function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  const p = (t) => '<p class="mb-p">' + t + "</p>";
  const ps = (t) => String(t).split("\n").filter(Boolean).map(p).join("");
  const h = (t, sub) => '<div class="mb-h">' + esc(t) + (sub ? '<span class="mb-h-sub">' + esc(sub) + "</span>" : "") + "</div>";
  const h3 = (t) => '<div class="mb-h3">' + t + "</div>";
  const tip = (title, body) => '<div class="mb-tip"><div class="mb-tip-t">' + esc(title) + "</div>" + ps(body) + "</div>";
  const badge = (t) => '<span class="mb-badge">' + esc(t) + "</span>";
  const tbl = (cols, rows) => '<table class="mb-table"><thead><tr>' + cols.map((c) => "<th" + (c[1] ? ' style="width:' + c[1] + '%"' : "") + ">" + esc(c[0]) + "</th>").join("") + "</tr></thead><tbody>" +
    rows.map((r) => "<tr>" + r.map((v, i) => "<td" + (i === 0 ? ' class="mb-first"' : "") + ">" + v + "</td>").join("") + "</tr>").join("") + "</tbody></table>";
  const yearsText = (ys) => (ys.length ? ys.join("、") : "本命未見相關年份");
  const animals = (zs) => zs.map((z) => "屬" + ANIMAL[z] + "的人（" + z + "）").join("、");
  const animalIcons = (zs) => '<div class="mb-animals">' + zs.map((z) => '<div class="mb-animal"><div class="mb-animal-c">' + ANIMAL[z] + '</div><div class="mb-animal-t">屬' + ANIMAL[z] + "的人</div></div>").join("") + "</div>";
  const GENDER_TEXT = { male: "男", female: "女" };

  function render(M, src) {
    src = src || {};
    const root = el("div", "zr-report mb-report");
    let breakNext = false;
    const add = (html, cls, ch) => {
      const b = el("div", "zr-block mb-block" + (cls ? " " + cls : ""), html);
      if (ch) b.style.setProperty("--mbc", CHAPTER[ch].color);
      if (breakNext) { b.dataset.pdfBreakBefore = ""; breakNext = false; }
      root.appendChild(b);
      return b;
    };
    const cover = (ch, extra) => {
      const c = CHAPTER[ch];
      breakNext = true;
      add('<div class="mb-cover" style="background:' + c.color + '"><div class="mb-cover-ring"></div><div class="mb-cover-en">' + esc(c.en) + '</div><div class="mb-cover-t">' + esc(c.title) + "</div>" + (extra ? '<div class="mb-cover-x">' + extra + "</div>" : "") + "</div>", "mb-cover-block", ch);
      breakNext = true;
    };
    const intro = (ch, text) => add('<div class="mb-quote"><div class="mb-quote-mark">“</div>' + ps(text) + "</div>", "", ch);
    const chart = M.chart, name = chart.name;

    // ---- 封面 ----
    add('<div class="mb-book"><div class="mb-book-top">Aries 命理</div><div class="mb-book-title">命　書</div><div class="mb-book-sub">以你為名的人生</div>' +
      '<div class="mb-book-name">' + esc(name) + '</div><div class="mb-book-info">' + esc(GENDER_TEXT[chart.gender] || "") + "　｜　" + esc(chart.solarText) + "<br>" + esc(chart.lunarText) +
      "<br>生肖" + esc(chart.shengxiao) + "　命格 " + esc(chart.geju) + '</div><div class="mb-book-foot">依本人八字自動編撰　' + M.year + " 年版</div></div>", "mb-cover-block");
    breakNext = true;

    // ---- 八字命卷 / 大運 / 流年（複製排盤畫面） ----
    if (src.info) {
      add(h("八字命卷", "BAZI CHART"), "", "whoami");
      [src.info, src.pillars, src.note, src.summary].forEach((s) => { if (s) { const b = add("", "mb-clone"); b.appendChild(s.cloneNode(true)); } });
    }
    if (src.dayun && src.dayun.length) {
      breakNext = true;
      add(h("大運與流年", "LUCK PILLARS"), "", "whoami");
      src.dayun.forEach((s) => { const b = add("", "mb-clone mb-clone-tbl"); b.appendChild(s.cloneNode(true)); });
    }

    // ---- 目錄 ----
    breakNext = true;
    const toc = [
      ["我是誰？", "你的特質與能量、專長、正面與負面能量、內心的寶藏、獨特競爭力、最旺你的能量提升"],
      ["事業篇", "職場工作態度、最佳工作方式、專屬黃金事業、匹配的職位、領導者類型、九運事業攻略"],
      ["財富篇", "尋找財富寶藏、投資理財觀念、財富來自哪裡、主動收入 VS 被動收入、繼承祖業、小心破財、天降橫財"],
      ["健康篇", "健康警號燈、做思維的主人、需注意的年份"],
      ["人緣篇", "你是什麼類型的交際者、貴人與黃金時間點、誰是你生活裡的絆腳石"],
      ["感情篇", "配偶的潛在特質、婚姻與財富的契機"],
      ["文昌篇", "學習能力、才華與天賦、最佳學習年份、適合培養的才藝、書房的位置"],
      ["神煞篇", "你有多少個神、多少個煞"],
      ["心靈篇", "七大脈輪的能量分析"],
      ["人生階段的策略", "每一步大運的主題與策略"],
      ["特贈福利", "個人吉凶方、太歲與相沖方位、桃花位、" + M.year + " 個人運勢、" + M.year + " 九宮飛星"],
      ["對照表", "命卦、十二地支對照表、二十四山、風水小常識"]
    ];
    add('<div class="mb-toc-t">目　錄</div><div class="mb-toc">' + toc.map((t, i) => '<div class="mb-toc-row"><div class="mb-toc-n" style="background:' + Object.values(CHAPTER)[Math.min(i, 10)].color + '">' + String(i + 1).padStart(2, "0") + '</div><div><div class="mb-toc-h">' + esc(t[0]) + '</div><div class="mb-toc-d">' + esc(t[1]) + "</div></div></div>").join("") + "</div>");

    // ---- 我是誰 ----
    const DM = C.DAY_MASTER[M.dg];
    cover("whoami", esc(name) + "　｜　日主 " + M.dg + "（" + DM.image + "）");
    intro("whoami", C2.INTRO.whoami);
    add(h("你的特質與能量", "日主 " + M.dg + "・" + DM.image) + '<div class="mb-kw">' + esc(DM.keyword) + "</div>" + ps(DM.traits), "", "whoami");
    add(h3("你的專長") + ps(DM.strength) + h3("你的正面能量") + ps(DM.positive), "", "whoami");
    add(h3("你的負面能量") + ps(DM.negative), "", "whoami");
    add('<div class="mb-card">' + h3("如何發掘你內心的寶藏") + ps(DM.treasure) + "</div>", "", "whoami");
    add('<div class="mb-card">' + h3("你的獨特競爭力") + ps(DM.edge) + "</div>", "", "whoami");
    // 能量提升
    breakNext = true;
    add(h("最旺你的能量提升", "FIVE ELEMENTS") + ps(C2.INTRO.energy) +
      (M.N ? p("你的日主" + M.dg + "屬" + M.D + "，" + M.N.level + "；" + M.N.reason + "。五行喜用：<b>" + M.favs.map((e) => e + "（" + M.N.role(e) + "）").join("、") + "</b>。") : ""), "", "whoami");
    M.favs.forEach((e) => {
      const E = C.ELEMENT[e];
      add('<div class="mb-elem"><div class="mb-elem-c mb-wx-' + e + '">' + e + '</div><div class="mb-elem-b">' +
        '<div class="mb-elem-row"><b>最旺你的方位：</b>' + esc(E.dirs) + "（" + esc(E.degs) + "）</div>" +
        '<div class="mb-elem-row"><b>最旺你的顏色：</b>' + esc(E.colors) + "</div>" +
        '<div class="mb-elem-row"><b>最旺你的號碼：</b>' + esc(E.numbers) + "</div>" +
        p("每個人都有屬於自己最旺的方向與顏色。方位可以用在居住、辦公座位與發展的方向；顏色可以用在衣著、配件與空間；號碼可以用在手機、車牌、密碼。" + esc(E.life)) + p(esc(E.habit)) + "</div></div>", "", "whoami");
    });

    // ---- 事業篇 ----
    const G1 = C.TEN_GOD[M.top[0]], G2 = C.TEN_GOD[M.top[1]];
    const eLabel = (i) => "能量（" + ["一", "二"][i] + "）" + M.top[i] + "・" + Math.round(M.godPct[M.top[i]] * 10) / 10 + "%";
    cover("career", "能量（一）" + M.top[0] + "　能量（二）" + M.top[1]);
    intro("career", C2.INTRO.career);
    add(h("你在職場上的工作態度") + badge(eLabel(0)) + '<div class="mb-kw">' + esc(G1.keyword) + "</div>" + ps(G1.attitude), "", "career");
    add(badge(eLabel(1)) + '<div class="mb-kw">' + esc(G2.keyword) + "</div>" + ps(G2.attitude), "", "career");
    add(h("適合你的最佳工作方式") + badge(eLabel(0)) + G1.styles.map((s) => h3(esc(s.t)) + p(esc(s.d))).join(""), "", "career");
    add(badge(eLabel(1)) + G2.styles.map((s) => h3(esc(s.t)) + p(esc(s.d))).join(""), "", "career");
    add(h("專屬於你的黃金事業") + badge(eLabel(0)) + G1.careers.map((s) => h3(esc(s.t)) + p(esc(s.d))).join(""), "", "career");
    add(badge(eLabel(1)) + G2.careers.map((s) => h3(esc(s.t)) + p(esc(s.d))).join(""), "", "career");
    add(h("與你性格匹配的職場職位") + badge(eLabel(0)) + G1.positions.map((s) => h3(esc(s.t)) + p(esc(s.d))).join("") + badge(eLabel(1)) + G2.positions.map((s) => h3(esc(s.t)) + p(esc(s.d))).join(""), "", "career");
    add(h("你是什麼類型的領導者") + badge(eLabel(0)) + h3(esc(G1.leader.t)) + p(esc(G1.leader.d)) + badge(eLabel(1)) + h3(esc(G2.leader.t)) + p(esc(G2.leader.d)), "", "career");
    if (typeof INDUSTRY_TRENDS_BY_ELEMENT !== "undefined" && INDUSTRY_TRENDS_BY_ELEMENT[M.D]) {
      const ind = INDUSTRY_TRENDS_BY_ELEMENT[M.D], st = typeof DAYUN_STRATEGY_BY_ELEMENT !== "undefined" ? DAYUN_STRATEGY_BY_ELEMENT[M.D] : null;
      breakNext = true;
      add(h("九運的事業攻略", "2024–2043 離火九運") + p("我們常聽到「九運」，到底是什麼？三元九運每二十年一運，2024 到 2043 年是「九紫離火運」，火的行業與特質當令。不管你現在做什麼行業，了解九運的趨勢，把自己的能量與時代的能量對接，事業會走得更順。") +
        (st ? h3(esc(st.title)) + p("<b>" + esc(st.position) + "</b>") + ps(esc(st.body)) : ""), "", "career");
      add(h3("九運行業趨勢｜日主屬" + M.D) + p(esc(ind.intro)) + ind.categories.map((cat) => '<div class="mb-ind"><div class="mb-ind-t">' + esc(cat.name) + "</div><ul class='mb-list'>" + cat.items.map((it) => "<li>" + esc(it) + "</li>").join("") + "</ul></div>").join(""), "", "career");
    }

    // ---- 財富篇 ----
    cover("wealth", "財星：" + (M.caiZhi.length ? "藏於" + M.caiZhi.join("、") + "支" : "原局不現"));
    intro("wealth", C2.INTRO.wealth);
    add(h("尋找財富寶藏") + ps(C2.WEALTH_GENERIC.treasure) + h3("你的致富類型") +
      [G1, G2].map((G, i) => '<div class="mb-card">' + badge(eLabel(i)) + h3(esc(G.wealth.t)) + p(esc(G.wealth.d)) + "</div>").join(""), "", "wealth");
    add(h("投資理財的觀念") + ps(G1.invest) + (M.top[1] !== M.top[0] ? p(esc(G2.invest)) : ""), "", "wealth");
    const zf = M.godPct.正財, pf = M.godPct.偏財;
    add(h("主動收入 VS 被動收入") + ps(C2.WEALTH_GENERIC.activeVsPassive) +
      tbl([["收入類型", 30], ["你的能量", 20], ["說明", 50]], [["正財（主動收入）", zf + "%", "薪資、接案、業績等靠時間與勞力換取的收入，以及儲蓄累積的能力"], ["偏財（被動／機會財）", pf + "%", "投資獲利、分紅、租金、副業等資產與機會帶來的收入"]]) +
      p(esc(zf > pf + 5 ? C2.WEALTH_GENERIC.activeTip : pf > zf + 5 ? C2.WEALTH_GENERIC.passiveTip : C2.WEALTH_GENERIC.balancedTip)), "", "wealth");
    add(h("你有繼承祖業的福氣嗎？") + ps(C2.WEALTH_GENERIC.inheritIntro) +
      p("你的年柱天干為<b>" + esc(M.yearGodGan) + "</b>" + (M.N ? "（" + M.N.role(M.P.年.gan.wuxing) + "）" : "") + "，年支" + M.yz + "藏" + M.P.年.hideGans.map((hg) => hg.char + esc(hg.shiShen)).join("、") + "。") +
      p(esc(CAT[M.yearGodGan] === "財" ? "年柱見財星，代表祖上或長輩有一定的經濟基礎，你有機會得到長輩在金錢或資產上的支持；" + (M.inheritGood ? "且為喜用，這份資源對你是實質的助力，好好運用，可以成為事業的起點。" : "但不屬喜用，長輩的資源可能伴隨著期待與壓力，接手時要有自己的規劃。") :
        CAT[M.yearGodGan] === "印" ? "年柱見印星，代表祖上或長輩留給你的多半是教育、名聲、文化或房產等無形與有形的根基。" + (M.inheritGood ? "印為喜用，長輩是你的貴人，學業與事業都能得到支持。" : "印不為喜用，長輩的照顧有時會變成束縛，要學會在感恩中獨立。") :
        CAT[M.yearGodGan] === "官殺" ? "年柱見官殺，代表祖上或長輩重視規矩與地位，家教較嚴，可能有公職或管理的背景。你繼承的多半是名聲與責任，而不是現成的財富。" :
        CAT[M.yearGodGan] === "食傷" ? "年柱見食傷，代表祖上或長輩有才華、有技藝，你繼承的是天賦與手藝，而不是現成的家業；靠這份才華自己開創，是你最好的路。" :
        "年柱見比劫，代表祖上或長輩多半靠自己打拚，家中的資源需要與兄弟姊妹或親族分享。你要繼承的不是財產，而是那份白手起家的精神。")) +
      p(esc(M.N && M.N.fav(M.P.年.gan.wuxing) > 0 ? "整體而言，長輩與祖上的能量對你是助力，多與長輩親近、善用家族的資源，對你有加分。" : "整體而言，與其等待家族的資源，不如把重心放在自己的累積上，你的財富要靠自己一磚一瓦建立。")), "", "wealth");
    add(h("注意！小心破財！") + ps(C2.WEALTH_GENERIC.breakIntro) +
      '<div class="mb-years"><div class="mb-years-l">年份</div><div class="mb-years-v">' + yearsText(M.breakYears) + "</div></div>" +
      '<div class="mb-years"><div class="mb-years-l">月份</div><div class="mb-years-v">' + M.breakBranches.map(monthOfZhi).join("、") + "</div></div>" +
      p("推算依據：你的財星藏於" + (M.caiZhi.length ? M.caiZhi.join("、") + "支" : "原局不現，以年支" + M.yz + "代之") + "，逢" + M.breakBranches.join("、") + "年、" + M.breakBranches.join("、") + "月相沖，財星受動，支出與耗損容易增加。") +
      tip("小貼士", "在這些年份與月份：不借貸、不作保、不衝動投資；把大額支出排在計畫內（繳稅、保險、必要的添購），用「有計畫的花」化解「意外的失」。"), "", "wealth");
    add(h("我命中是否有天降橫財？") + ps(C2.WEALTH_GENERIC.windfallIntro) +
      '<div class="mb-years"><div class="mb-years-l">年份</div><div class="mb-years-v">' + yearsText(M.windfallYears) + "</div></div>" +
      p("推算依據：日主" + M.dg + "的偏財星為<b>" + M.pianCaiStem.join("、") + "</b>，天干逢" + M.pianCaiStem.join("、") + "之年，偏財入命，意外之財與投資機會較旺。" + (M.godPct.偏財 > 0 ? "你的原局本身帶偏財（" + M.godPct.偏財 + "%），橫財的緣分比一般人深。" : "你的原局偏財不現，橫財要靠流年帶來，遇到時更要珍惜。")) +
      tip("橫財小貼士", "橫財不比正財長久，所以在這些年份要把握機會，也要先存一半。投資的話記得做功課，不要憑運氣。"), "", "wealth");

    // ---- 健康篇 ----
    const EW = C.ELEMENT[M.weakest], ES = C.ELEMENT[M.strongest];
    cover("health", "最弱五行 " + M.weakest + " " + M.wx[M.weakest] + "%　最旺五行 " + M.strongest + " " + M.wx[M.strongest] + "%");
    intro("health", C2.INTRO.health);
    add(h("健康警號燈！") + p("你的五行強弱：" + ELEMS.map((e) => e + " " + M.wx[e] + "%").join("、") + "。") +
      '<div class="mb-card">' + h3("最弱的五行：" + M.weakest + "（" + esc(EW.organs) + "）") + p(esc(EW.weak)) + "</div>" +
      '<div class="mb-card">' + h3("最旺的五行：" + M.strongest + "（" + esc(ES.organs) + "）") + p(esc(ES.strong)) + "</div>" +
      tip("健康小貼士", "季節上，" + M.weakest + "對應" + EW.season + "季，是你調養的季節；情緒上，" + M.strongest + "過旺時容易累積「" + ES.mood + "」的情緒，要有意識地釋放。"), "", "health");
    add(h("做思維的主人") + ps(C2.HEALTH_GENERIC.mind) + tip("實用小貼士", "每天睡前花十分鐘，把今天讓你有情緒的事寫下來，然後問自己：這件事一年後還重要嗎？大多數的答案是否定的。"), "", "health");
    add(h("需注意的年份") + ps(C2.HEALTH_GENERIC.yearsIntro) +
      '<div class="mb-years big"><div class="mb-years-v">' + yearsText(M.healthYears) + "</div></div>" +
      p("推算依據：你的月支（身體根基）為" + M.mz + "，逢" + M.mz + "年（伏吟）與" + CHONG[M.mz] + "年（相沖）時，身體與情緒容易出狀況。") +
      tip("實用小貼士", C2.HEALTH_GENERIC.yearsTip), "", "health");

    // ---- 人緣篇 ----
    cover("people", "最有力的貴人：" + M.nobles.最有力.map((z) => "屬" + ANIMAL[z]).join("、"));
    intro("people", C2.INTRO.people);
    add(h("你在他人眼中是什麼類型的交際者") + badge(eLabel(0)) + h3(esc(G1.social.t)) + p(esc(G1.social.d)) + badge(eLabel(1)) + h3(esc(G2.social.t)) + p(esc(G2.social.d)) +
      tip("小貼士", "多參加與你專業相關的社群與活動，先付出、再求回報。記得「分享就是愛」，而仁慈是最值得深交的個性。"), "", "people");
    add(h("你的貴人與黃金時間點") + ps(C2.PEOPLE_GENERIC.nobleIntro), "", "people");
    [["社交、朋友圈、人脈方面的貴人", "社交", "日支" + M.dz + "六合"], ["事業方面的貴人", "事業", "國印、天官貴人"], ["情感方面的貴人", "情感", "紅鸞、天喜"], ["投資方面的貴人", "投資", "日支" + M.dz + "三合"], ["最有力的貴人", "最有力", "天乙貴人"]].forEach((row) => {
      const zs = M.nobles[row[1]];
      add('<div class="mb-card">' + h3(esc(row[0])) + p(esc(C2.PEOPLE_GENERIC.nobleCats[row[1]])) + animalIcons(zs) + '<div class="mb-note">推算依據：' + esc(row[2]) + "　→　" + zs.join("、") + "</div></div>", "", "people");
    });
    add(h3("黃金時間年份") + '<div class="mb-years big"><div class="mb-years-v">' + yearsText(M.goldenYears) + "</div></div>" + ps(C2.PEOPLE_GENERIC.goldenYears) + '<div class="mb-note">推算依據：天乙貴人在' + M.nobles.最有力.join("、") + "，逢此地支之年。</div>", "", "people");
    add(h("「誰」會是你生活裡的絆腳石") + ps(C2.PEOPLE_GENERIC.obstacleIntro) +
      '<div class="mb-years"><div class="mb-years-l">年份</div><div class="mb-years-v">' + yearsText(M.obstacleYears) + "</div></div>" +
      '<div class="mb-years"><div class="mb-years-l">月份</div><div class="mb-years-v">' + M.obstacleMonth + "</div></div>" +
      '<div class="mb-note">推算依據：年支' + M.yz + "逢" + CHONG[M.yz] + "年相沖（外部環境與長輩）；日支" + M.dz + "逢" + CHONG[M.dz] + "月相沖（身邊的人與感情）。</div>" +
      tip("小貼士", "「隨時提醒自己不要和爭執之人一般見識，且有助於遇貴人。」在這些時間點，少說多聽、不涉入他人的紛爭，就是最好的保護。"), "", "people");

    // ---- 感情篇 ----
    const SG = C.TEN_GOD[M.spouseGod];
    cover("love", (M.isMale ? "妻星" : "夫星") + "：" + M.spouseGod + "　夫妻宮：" + M.dz);
    intro("love", C2.INTRO.love);
    add(h("你的配偶的潛在特質") + p(esc(C.SPOUSE_NOTE[M.isMale ? "male" : "female"])) +
      tbl([["項目", 30], ["內容", 70]], [[(M.isMale ? "妻星" : "夫星") + "（" + M.spouseFrom + "）", M.spouseGod + (M.spouseFrom === "配偶星" ? "・" + M.godPct[M.spouseGod] + "%" : "")], ["夫妻宮（日支）", M.dz + "（" + WUXING_OF_ZHI[M.dz] + "）・藏干 " + M.P.日.hideGans.map((hg) => hg.char + esc(hg.shiShen)).join("、")], ["夫妻宮十二長生", esc(M.P.日.diShi)]]) +
      h3("對方的潛在特質") + p(esc(SG.partner)) +
      p(esc({ 木: "夫妻宮屬木，對方多半有成長性與上進心，重視學習與未來。", 火: "夫妻宮屬火，對方多半熱情、外向、有活力，感情表達直接。", 土: "夫妻宮屬土，對方多半穩重、務實、顧家，是可以長久依靠的類型。", 金: "夫妻宮屬金，對方多半有原則、講義氣、外表或品味出眾。", 水: "夫妻宮屬水，對方多半聰明、靈活、感性，重視心靈的交流。" }[WUXING_OF_ZHI[M.dz]])) +
      p(esc(M.N && M.N.fav(WUXING_OF_ZHI[M.dz]) > 0 ? "夫妻宮為喜用，配偶對你是助力，婚後運勢容易提升，另一半能帶給你實質的幫助。" : "夫妻宮不屬喜用，代表感情需要多一點經營與包容，相處上要學會給彼此空間，關係才能長久。")), "", "love");
    add(h("你的八字是否藏著「因婚姻而提升」的契機？") + ps(C2.LOVE_GENERIC.richIntro) +
      tbl([["星曜", 30], ["比重", 20], ["喜忌", 50]], [["財星（正財＋偏財）", Math.round(M.catPct.財 * 10) / 10 + "%", M.N ? M.N.role(M.N.ce.財) : "—"], ["官星（正官＋七殺）", Math.round(M.catPct.官殺 * 10) / 10 + "%", M.N ? M.N.role(M.N.ce.官殺) : "—"]]) +
      p(esc(C2.LOVE_GENERIC[M.richLevel === "good" ? "richGood" : M.richLevel === "mid" ? "richMid" : "richWeak"])), "", "love");

    // ---- 文昌篇 ----
    cover("study", "文昌位：" + DIR_OF_ZHI[M.wenchang] + "（" + M.wenchang + "）");
    intro("study", C2.INTRO.study);
    add(h("你學習的能力") + p("你的印星比重 " + Math.round(M.yinP * 10) / 10 + "%。") + p(esc(C2.STUDY_GENERIC["ability" + M.yinLvl])) + p(esc(DM.study)), "", "study");
    add(h("找出屬於自己的才華") + p("你的食傷比重 " + Math.round(M.shiP * 10) / 10 + "%。") + p(esc(C2.STUDY_GENERIC["talent" + M.shiLvl])), "", "study");
    add(h("你的天賦和潛能") + badge(eLabel(0)) + p(esc(G1.talent)) + badge(eLabel(1)) + p(esc(G2.talent)), "", "study");
    add(h("你的最佳學習年份") + ps(C2.STUDY_GENERIC.bestYears) + animalIcons(M.studyBranches) +
      '<div class="mb-years big"><div class="mb-years-v">' + yearsText(yearsBranch(M.studyBranches, M.year, M.year + 24)) + "</div></div>" +
      '<div class="mb-note">推算依據：日主' + M.dg + "的文昌在" + M.wenchang + "、學堂在" + M.xuetang + "，逢此地支之年（列出未來二十五年）。</div>", "", "study");
    add(h("適合學習及培養的才藝") + p("你可以把精神與體力專注在一項特殊的技藝上，依你的日主與能量，以下方向最容易學出成果：") +
      '<div class="mb-card">' + h3("日主" + M.dg + "・" + DM.image) + p(esc(DM.arts)) + "</div>" +
      '<div class="mb-card">' + h3("能量（一）" + M.top[0]) + p(esc(G1.careers.slice(0, 3).map((c) => c.t).join("、"))) + "</div>", "", "study");
    add(h("小貼士：書房的位置") + ps(C2.STUDY_GENERIC.roomTip) +
      '<div class="mb-card"><div class="mb-elem-row"><b>你的文昌位：</b>' + DIR_OF_ZHI[M.wenchang] + "（" + M.wenchang + "山，" + degOf(M.wenchang) + "）</div>" +
      '<div class="mb-elem-row"><b>文昌年：</b>' + yearsText(M.wenchangYears.slice(0, 8)) + "</div></div>" +
      p("站在家或房間的中心點，用指南針找出 " + degOf(M.wenchang) + " 的方向，把書桌設在那裡，或讓座位面向該方位。"), "", "study");

    // ---- 神煞篇 ----
    cover("shensha", "四柱共 " + M.shensha.length + " 個神煞");
    intro("shensha", C2.INTRO.shensha);
    add(h("你有多少個神，多少個煞？") + tbl([["神煞", 30], ["所在", 25], ["性質", 45]], M.shensha.map((s) => [esc(s.name), s.where.join("、"), typeof SHENSHA_EXPLAIN !== "undefined" && SHENSHA_EXPLAIN[s.name] ? esc(SHENSHA_EXPLAIN[s.name].body.split("\n")[0]) : "—"])) +
      p("以下逐一說明每個神煞的意義，以及它在你生命中可能帶來的影響。"), "", "shensha");
    M.shensha.forEach((s) => {
      const info = typeof SHENSHA_EXPLAIN !== "undefined" ? SHENSHA_EXPLAIN[s.name] : null;
      if (!info) return;
      add('<div class="mb-ss"><div class="mb-ss-t">' + esc(s.name) + '<span class="mb-ss-w">' + s.where.join("、") + "</span></div>" + (info.verse ? '<div class="mb-ss-v">' + esc(info.verse).replace(/\n/g, "<br>") + "</div>" : "") + '<div class="mb-ss-b">' + esc(info.body).replace(/\n/g, "<br>") + "</div></div>", "", "shensha");
    });

    // ---- 心靈篇 ----
    cover("chakra", M.chakras.filter((c) => c.level !== "平衡").map((c) => c.key + c.level).join("　") || "七輪平衡");
    intro("chakra", C2.INTRO.chakra);
    add(h("你的脈輪能量分析") + '<div class="mb-chakra-list">' + M.chakras.map((c) => '<div class="mb-ck-row"><div class="mb-ck-dot" style="background:' + c.color + '"></div><div class="mb-ck-name">' + c.key + '</div><div class="mb-ck-lv mb-lv-' + (c.level === "不足" ? "lack" : c.level === "過盛" ? "excess" : "ok") + '">' + c.level + '</div><div class="mb-ck-basis">' + esc(c.basis) + "</div></div>").join("") + "</div>" +
      '<div class="mb-note">對應方法：海底輪＝土、臍輪＝水、太陽輪＝火、心輪＝木、喉輪＝金（五行低於 12% 為不足、高於 32% 為過盛）；眉心輪＝印星、頂輪＝食傷（低於 10% 為不足、高於 30% 為過盛）。</div>', "", "chakra");
    M.chakras.forEach((c) => {
      add('<div class="mb-ck"><div class="mb-ck-head"><div class="mb-ck-big" style="background:' + c.color + '"></div><div><div class="mb-ck-t">' + c.key + '<span class="mb-ck-lv mb-lv-' + (c.level === "不足" ? "lack" : c.level === "過盛" ? "excess" : "ok") + '">能量' + c.level + "</span></div><div class=\"mb-ck-sub\">" + esc(c.where) + "・" + esc(c.colorName) + "・" + esc(c.theme) + "</div></div></div>" +
        p(esc(c.desc)) + p("<b>掌管的身體部位：</b>" + esc(c.body)) + p("<b>人生課題：</b>" + esc(c.lesson)) +
        p("<b>" + (c.level === "不足" ? "能量不足時" : c.level === "過盛" ? "能量過盛時" : "能量平衡時") + "：</b>" + esc(c.level === "不足" ? c.lack : c.level === "過盛" ? c.excess : c.balance)) +
        p("<b>療癒" + c.key + "的晶石：</b>" + esc(c.stones)) + "</div>", "", "chakra");
    });

    // ---- 人生階段 ----
    cover("stages", "目前大運：" + (M.stages.find((s) => s.current) ? M.stages.find((s) => s.current).gz + "（" + M.stages.find((s) => s.current).god + "）" : "尚未起運"));
    intro("stages", C2.INTRO.stages);
    M.stages.forEach((s, i) => {
      const T = C.TEN_GOD[s.god];
      add('<div class="mb-stage' + (s.current ? " cur" : "") + '"><div class="mb-stage-age">' + s.startAge + "歲～" + s.endAge + "歲<span>（" + s.startYear + "～" + s.endYear + "年）</span>" + (s.current ? '<span class="mb-badge">現在</span>' : "") + "</div>" +
        '<div class="mb-stage-gz">大運 ' + s.gz + "・天干" + esc(s.god) + "・地支" + esc(s.zhiGod || "") + (M.N ? "・" + M.N.role(WUXING_OF_GAN[s.gz[0]]) : "") + "</div>" +
        p(esc(T ? T.stage : "")) + "</div>", "", "stages");
      if (i === M.stages.length - 1) add(tip("人生階段小貼士", C2.STAGES_TIP), "", "stages");
    });

    // ---- 特贈福利（一）----
    cover("bonus1", "命卦：" + M.gua.gua + "卦（" + M.gua.groupName + "）");
    intro("bonus1", C2.INTRO.bonus1);
    const good = M.stars.filter((s) => C2.BAZHAI_ROLE[s.star].kind === "吉"), bad = M.stars.filter((s) => C2.BAZHAI_ROLE[s.star].kind === "凶");
    add(h("個人吉凶方", "命卦 " + M.gua.num + " " + M.gua.gua + "卦・" + M.gua.groupName) +
      p("你出生於 " + M.gua.lichunYear + " 年（以立春為界），" + (M.isMale ? "男" : "女") + "命，命卦為<b>" + M.gua.gua + "卦</b>，屬" + M.gua.groupName + "。依八宅遊年，你的四吉方與四凶方如下：") +
      tbl([["吉凶", 12], ["星名", 16], ["方位", 16], ["作用或所造成的影響", 56]], good.concat(bad).map((s) => { const r = C2.BAZHAI_ROLE[s.star]; return [r.kind === "吉" ? "四吉" : "四凶", r.role + "（" + s.star + "）", s.dirName, esc(s.note)]; })), "", "bonus1");
    M.stars.forEach((s) => {
      const r = C2.BAZHAI_ROLE[s.star];
      add('<div class="mb-card ' + (r.kind === "吉" ? "good" : "bad") + '">' + h3(r.role + "方（" + s.dirName + "）・" + s.star + "・" + r.kind) + p(esc(r.desc)) + "</div>", "", "bonus1");
    });
    add(h("個人太歲方位") + ps(C2.BAZHAI_EXTRA.taisui) + tbl([["個人太歲方位", 40], ["方位／度數", 60]], [[M.taisui.zhi + "（" + ANIMAL[M.taisui.zhi] + "）", M.taisui.dir + "　" + M.taisui.deg]]), "", "bonus1");
    add(h("個人相沖方位") + ps(C2.BAZHAI_EXTRA.chong) + tbl([["個人相沖方位", 40], ["方位／度數", 60]], [[M.chong.zhi + "（" + ANIMAL[M.chong.zhi] + "）", M.chong.dir + "　" + M.chong.deg]]), "", "bonus1");
    add(h("個人桃花位") + ps(C2.BAZHAI_EXTRA.peach) + tbl([["個人桃花位", 40], ["方位／度數", 60]], [[M.peach.zhi + "（" + ANIMAL[M.peach.zhi] + "）", M.peach.dir + "　" + M.peach.deg]]), "", "bonus1");

    // ---- 特贈福利（二）----
    const STAR = { 大吉: "★★★★★", 吉: "★★★★☆", 平: "★★★☆☆", 注意: "★★☆☆☆" };
    const DOMAIN_TXT = {
      overall: { 大吉: "整體運勢旺盛，機會與貴人齊來，適合主動出擊、推動重要計畫。", 吉: "整體運勢順利，按部就班會有不錯的收穫。", 平: "整體運勢平穩，適合守成與累積，不急著做重大改變。", 注意: "整體運勢起伏較大，宜低調守成、謹慎行事，把健康與情緒放在第一位。" },
      wealth: { 大吉: "財運旺盛，進財機會多，適合累積資產與投資規劃。", 吉: "財運穩中有升，正財可期，投資宜穩健。", 平: "財運平平，收支平衡，量入為出。", 注意: "財運需留意，避免借貸、作保與投機，守住現金。" },
      career: { 大吉: "事業有突破，升遷、新機會與表現舞台都可能出現。", 吉: "工作推進順利，有被看見的機會。", 平: "工作平穩，適合累積經驗與專業。", 注意: "職場壓力與變動多，宜守本分，避免與上司同事衝突。" },
      health: { 大吉: "精神體力佳，是建立運動習慣的好時機。", 吉: "身體大致穩定，維持規律作息即可。", 平: "注意作息與飲食，定期保養。", 注意: "健康要優先顧好，安排檢查，避免熬夜與高風險活動。" },
      love: { 大吉: "感情有喜，單身者易遇良緣，有伴者感情升溫。", 吉: "感情互動良好，適合規劃共同目標。", 平: "感情平穩，多花時間經營。", 注意: "伴侶間容易有摩擦，多傾聽、少指責。" }
    };
    cover("bonus2", M.year + " 年個人運勢");
    intro("bonus2", C2.INTRO.bonus2);
    if (M.yearly) {
      const Y = M.yearly;
      add(h(M.year + " 個人運勢", Y.gz + "年・生肖" + chart.shengxiao) +
        '<div class="mb-luck"><div class="mb-luck-row"><div class="mb-luck-n">流年運勢</div><div class="mb-luck-s">' + STAR[Y.overall] + "</div></div>" + p(esc(DOMAIN_TXT.overall[Y.overall])) +
        [["財富運", "wealth"], ["事業運", "career"], ["健康運", "health"], ["感情運", "love"]].map((d) => '<div class="mb-luck-row"><div class="mb-luck-n">' + d[0] + '</div><div class="mb-luck-s">' + STAR[Y.domains[d[1]].rating] + "</div></div>" + p(esc(DOMAIN_TXT[d[1]][Y.domains[d[1]].rating]))).join("") + "</div>" +
        (Y.rels.length ? h3("流年與本命的關係") + "<ul class='mb-list'>" + Y.rels.slice(0, 6).map((r) => "<li><b>" + esc(r.label) + "：</b>" + esc(r.text.replace(/^[^：]*：/, "")) + "</li>").join("") + "</ul>" : "") +
        (Y.ss.length ? p("<b>流年神煞：</b>" + Y.ss.join("、")) : ""), "", "bonus2");
    } else add(p("（本頁需配合流年分析模組）"), "", "bonus2");

    // ---- 特贈福利（三）----
    cover("bonus3", M.year + " 風水更新・" + M.yStar + " 入中");
    intro("bonus3", C2.INTRO.bonus3);
    const POS = [[4, "東南"], [9, "南"], [2, "西南"], [3, "東"], [5, "中宮"], [7, "西"], [8, "東北"], [1, "北"], [6, "西北"]];
    const STAR_SHORT = { 1: "一白", 2: "二黑", 3: "三碧", 4: "四綠", 5: "五黃", 6: "六白", 7: "七赤", 8: "八白", 9: "九紫" };
    add(h(M.year + " 年九宮飛星", yearGan(M.year) + yearZhi(M.year) + "年・" + STAR_SHORT[M.yStar] + "入中") +
      '<div class="mb-fx">' + POS.map((q) => { const st = M.pan[q[0]], F = C2.FLYING_STAR[st]; return '<div class="mb-fx-c mb-fx-' + (F.kind === "大凶" || F.kind === "凶" ? "bad" : F.kind === "大吉" ? "best" : "good") + '"><div class="mb-fx-d">' + q[1] + '</div><div class="mb-fx-n">' + st + '</div><div class="mb-fx-t">' + esc(F.name.slice(0, 2)) + esc(F.name.slice(2, 4)) + '</div><div class="mb-fx-k">' + esc(F.theme.split("、").slice(0, 2).join("、")) + "</div></div>"; }).join("") + "</div>" +
      p("方位以上南下北、左東右西（風水慣用）排列。站在家或辦公室的中心點量方位，再對照下列各星的宜忌。"), "", "bonus3");
    POS.forEach((q) => {
      const st = M.pan[q[0]], F = C2.FLYING_STAR[st];
      add('<div class="mb-fxc mb-fx-' + (F.kind === "大凶" || F.kind === "凶" ? "bad" : F.kind === "大吉" ? "best" : "good") + '"><div class="mb-fxc-n">' + st + '</div><div class="mb-fxc-b"><div class="mb-fxc-t">' + q[1] + "方・" + esc(F.name) + "（" + F.kind + "）</div><div class=\"mb-fxc-k\">" + esc(F.theme) + "</div>" + p(esc(F.desc)) + '<div class="mb-fxc-row"><span class="mb-yi">宜</span>' + esc(F.good) + '</div><div class="mb-fxc-row"><span class="mb-ji">忌</span>' + esc(F.bad) + "</div></div></div>", "", "bonus3");
    });

    // ---- 對照表 ----
    cover("ref");
    intro("ref", C2.INTRO.ref);
    add(h("命卦") + p("命卦依出生年（以立春為界）與性別推算：男命以 11 減去年份各位數字相加後的個位數（餘數為 0 作 9），女命以年份各位數字相加後的個位數加 4，所得數字即為命卦（5 則男作坤、女作艮）。1 坎、2 坤、3 震、4 巽、6 乾、7 兌、8 艮、9 離；1、3、4、9 為東四命，2、6、7、8 為西四命。") +
      tbl([["你的命卦", 30], ["內容", 70]], [["命卦", M.gua.num + " " + M.gua.gua + "卦（" + M.gua.groupName + "・五行屬" + M.gua.wx + "）"], ["四吉方", good.map((s) => s.star + " " + s.dirName).join("、")], ["四凶方", bad.map((s) => s.star + " " + s.dirName).join("、")]]), "", "ref");
    add(h("十二地支對照表") + tbl([["地支", 12], ["生肖", 12], ["時辰", 24], ["節氣月份（約）", 36], ["五行", 16]], C2.ZHI_HOURS.map((z) => [z.zhi, z.animal, z.hour, z.month, z.wx])), "", "ref");
    add(h("二十四山方位度數") + tbl([["八方", 20], ["二十四山（度數）", 80]], C2.MOUNTAINS.map((m) => [m.dir, m.items.map((it) => it[0] + " " + it[1] + "°").join("　")])), "", "ref");
    add(h("風水小常識") + C2.FENGSHUI_TIPS.map((t) => h3(esc(t.t)) + p(esc(t.d))).join(""), "", "ref");
    add('<div class="mb-end">本命書依本人八字以規則式推算自動編撰，內容為通用解說，僅供個人參考，不作為任何醫療、投資或法律建議。<br>Aries 命理　' + esc(name) + "　" + M.year + "</div>");
    return root;
  }

  window.MingshuReport = { build, render, CHAPTER, currentYear };
})();
