// ================= 命理諮詢「個人通勝」=================
// 依出生資料（bazi-engine.js 的 calculateBazi 結果）產生指定年份 1～12 月的個人擇日月曆，一個月一張 A4。
// 每日內容：建除（lunar-javascript）、廿八宿、農曆與干支、本命日別、適合／不適合、喜財貴方位、大吉／次吉／小吉五行。
// 本命日別依「本命日柱（日主、夫妻宮）＋本命年柱」與個人喜用神判斷，每個人不同（同年生也不同）：
//   天克地冲＝當日干支與本命日柱或年柱天剋地沖｜冲＝日支沖本命日支或年支｜三刑＝刑本命年支
//   回頭殺＝月支是年支「回頭貢殺」三合局的庫、且日支落在該三合局（例：申子辰年生人，丑月的巳酉丑日）
//   貴人＝日干或年干的天乙貴人｜人緣＝與年支三合、六合，或與日支六合
//   旺財＝日主祿位，或財星為喜用時的財星日｜旺財健康＝日主長生
//   三殺＝年支三合局的三殺方｜喜用＝當日天干、地支五行皆為本命喜用｜其餘為平日
// 適合／不適合：建除宜忌＋本命日別，再依當日天干對日主的十神（為喜用加一項適合、為忌加一項不適合）。
// 大吉／次吉／小吉：本命喜忌（BaziReport.natal）加上當日干、日支、月支五行的生剋，取分數最高的三個五行。
(function () {
  const ELEMS = ["木", "火", "土", "金", "水"];
  const GEN_BY = {}, CTRL_BY = {};
  ELEMS.forEach((e) => { GEN_BY[GENERATES[e]] = e; CTRL_BY[CONTROLS[e]] = e; });
  const GAN_CHONG = [["甲", "庚"], ["乙", "辛"], ["丙", "壬"], ["丁", "癸"]];
  const HUITOU = { 申子辰: "巳酉丑", 巳酉丑: "寅午戌", 寅午戌: "亥卯未", 亥卯未: "申子辰" };
  const KU = { 申子辰: "辰", 巳酉丑: "丑", 寅午戌: "戌", 亥卯未: "未" };
  const SANSHA = { 申子辰: "巳午未", 寅午戌: "亥子丑", 巳酉丑: "寅卯辰", 亥卯未: "申酉戌" };
  const SAN_XING = ["寅巳申", "丑戌未"];
  const ZI_XING = "辰午酉亥";
  const XI = { 甲: "東北", 己: "東北", 乙: "西北", 庚: "西北", 丙: "西南", 辛: "西南", 丁: "正南", 壬: "正南", 戊: "東南", 癸: "東南" };
  const CAI = { 甲: "東北", 乙: "東北", 丙: "西南", 丁: "西南", 戊: "正北", 己: "正北", 庚: "正東", 辛: "正東", 壬: "正南", 癸: "正南" };
  const YANG_GUI = { 甲: "未", 乙: "申", 丙: "酉", 丁: "亥", 戊: "丑", 己: "子", 庚: "丑", 辛: "寅", 壬: "卯", 癸: "巳" };
  const ZHI_DIR = { 子: "正北", 丑: "東北", 寅: "東北", 卯: "正東", 辰: "東南", 巳: "東南", 午: "正南", 未: "西南", 申: "西南", 酉: "正西", 戌: "西北", 亥: "西北" };
  const WX_COLOR = { 金: "白、銀、金色", 水: "黑、灰、藍色", 木: "青、綠色", 火: "紅、紫、橙色", 土: "黃、咖啡、大地色" };
  const MONTH_EN = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
  // 建除十二神 → 現代生活用語的宜忌（依傳統建除宜忌改寫）
  const JIANCHU = {
    建: { yi: ["開工", "求職面試", "出行", "擬定計畫"], ji: ["動土裝修"] },
    除: { yi: ["打掃除舊", "丟棄雜物", "理髮", "健康檢查", "戒除習慣"], ji: ["婚嫁喜事"] },
    滿: { yi: ["開市", "成交", "聚會", "採購"], ji: ["非急迫手術"] },
    平: { yi: ["裝修", "整理環境", "例行事務"], ji: ["大額投資"] },
    定: { yi: ["簽約", "成交", "訂婚", "入宅安床"], ji: ["訴訟", "遠行"] },
    執: { yi: ["執行計畫", "收尾建檔", "修繕"], ji: ["開市", "搬家"] },
    破: { yi: ["拆除", "丟棄雜物", "健康檢查"], ji: ["簽約", "開市", "婚嫁"] },
    危: { yi: ["靜思", "安床", "祈福"], ji: ["登高", "冒險活動"] },
    成: { yi: ["開市", "成交", "簽約", "入學", "婚嫁"], ji: ["訴訟"] },
    收: { yi: ["收款", "存錢", "採購", "入學"], ji: ["遠行", "開工"] },
    開: { yi: ["開工", "開市", "求職", "學習", "出行"], ji: ["動土"] },
    閉: { yi: ["閉關學習", "儲蓄", "修補", "休息"], ji: ["開市", "出行"] }
  };

  const uniq = (arr) => arr.filter((v, i) => arr.indexOf(v) === i);
  const triadOf = (z) => Object.keys(ZHI_SANHE).find((k) => k.indexOf(z) >= 0);
  const pairHit = (list, a, b) => list.some((p) => (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // 當日天干對日主的十神類別 → 個人化的適合（十神為喜用）／不適合（十神為忌）
  const SS_CAT = { 比肩: "比劫", 劫財: "比劫", 食神: "食傷", 傷官: "食傷", 正財: "財", 偏財: "財", 正官: "官殺", 七殺: "官殺", 正印: "印", 偏印: "印" };
  const xingHit = (a, b) => (a === b && ZI_XING.indexOf(a) >= 0) || pairHit([["子", "卯"]], a, b) ||
    SAN_XING.some((g) => g.indexOf(a) >= 0 && g.indexOf(b) >= 0 && a !== b);
  const liuheHit = (a, b) => ZHI_LIUHE.some((p) => (p[0] === a && p[1] === b) || (p[1] === a && p[0] === b));

  // 本命日別：負面（天克地冲＞冲＞回頭殺＞三刑）優先；其次正面（人緣、貴人、旺財可並列）；再次三殺；
  // 再次喜用日（干支皆為喜用）；其餘為平日。B＝本命資料 { yG, yZ, dG, dZ, natal }
  function dayType(B, dG, dZ, mZ) {
    const triad = triadOf(B.yZ);
    const tkdc = [[B.dG, B.dZ], [B.yG, B.yZ]].some(([g, z]) => pairHit(ZHI_CHONG, z, dZ) && pairHit(GAN_CHONG, g, dG));
    if (tkdc) return { key: "天克地冲", label: "本命天克地冲日", kind: "bad" };
    if (pairHit(ZHI_CHONG, B.dZ, dZ) || pairHit(ZHI_CHONG, B.yZ, dZ)) return { key: "冲", label: "本命冲日", kind: "bad" };
    const ht = HUITOU[triad];
    if (mZ === KU[ht] && ht.indexOf(dZ) >= 0) return { key: "回頭殺", label: "本命回頭殺", kind: "bad" };
    if (xingHit(B.yZ, dZ)) return { key: "三刑", label: "本命三刑日", kind: "bad" };
    const pos = [];
    if ((triad.indexOf(dZ) >= 0 && dZ !== B.yZ) || liuheHit(B.yZ, dZ) || liuheHit(B.dZ, dZ)) pos.push("人緣");
    if ((TIANYI_GUIREN[B.dG] || []).indexOf(dZ) >= 0 || (TIANYI_GUIREN[B.yG] || []).indexOf(dZ) >= 0) pos.push("貴人");
    const caiElem = CONTROLS[WUXING_OF_GAN[B.dG]];
    if (getDiShi(B.dG, dZ) === "長生") pos.push("旺財健康");
    else if (LU_SHEN[B.dG] === dZ || (WUXING_OF_ZHI[dZ] === caiElem && B.natal.fav(caiElem) > 0)) pos.push("旺財");
    if (pos.length) return { key: pos.join(""), label: "本命" + pos.join("") + "日", kind: "good", pos };
    if (SANSHA[triad].indexOf(dZ) >= 0) return { key: "三殺", label: "本命三殺日", kind: "bad" };
    if (B.natal.fav(WUXING_OF_GAN[dG]) > 0 && B.natal.fav(WUXING_OF_ZHI[dZ]) > 0) return { key: "喜用", label: "本命喜用日", kind: "good", pos: [] };
    return { key: "平", label: "本命平日", kind: "flat" };
  }

  // ---------- 通用個人宜忌：15 類標準事項 ----------
  // 每日對每一類事項打分：建除十二神基礎分 ＋ 黃道／黑道 ＋ 個人條件（貴人、祿、財喜、驛馬、桃花、文昌、六合三合、喜用、
  // 十神喜忌、沖日柱／年支、天克地冲、三刑、六害、三殺、回頭殺、月破、歲破、忌神日）。
  // 分數 ≥1.5 列為「適合」（最多 5 項）、≤−1.5 列為「不適合」（最多 4 項）。
  const ACTS = [
    { k: "簽約交易", yi: "簽約成交", ji: "簽約" }, { k: "開市求財", yi: "開市收款", ji: "開市" }, { k: "投資置產", yi: "投資置產", ji: "大額投資" },
    { k: "求職面試", yi: "面試見上司", ji: "面試求職" }, { k: "合作洽談", yi: "洽談合作", ji: "重要談判" }, { k: "出行遠行", yi: "出行出差", ji: "遠行" },
    { k: "搬遷入宅", yi: "搬家入宅", ji: "搬家" }, { k: "婚嫁喜慶", yi: "嫁娶約會宴客", ji: "嫁娶喜事" }, { k: "動土修造", yi: "動土裝修安床", ji: "動土裝修" },
    { k: "求醫療養", yi: "看診調養", ji: "非急迫手術" }, { k: "學習考試", yi: "學習考試申請", ji: "考試報名" }, { k: "祈福靜修", yi: "祈福靜修", ji: "" },
    { k: "除舊整理", yi: "理髮打掃丟棄", ji: "" }, { k: "借貸作保", yi: "", ji: "借貸作保" }, { k: "爭訟衝突", yi: "", ji: "爭執訴訟" }
  ];
  // 建除十二神對各事項的基礎分（依傳統建除宜忌整理）
  const JC_BASE = {
    建: { 出行遠行: 1, 求職面試: 1, 開市求財: 1, 學習考試: 1, 祈福靜修: 1, 動土修造: -2 },
    除: { 除舊整理: 2, 求醫療養: 2, 祈福靜修: 1, 婚嫁喜慶: -1, 開市求財: -1 },
    滿: { 開市求財: 2, 簽約交易: 1, 婚嫁喜慶: 1, 合作洽談: 1, 求醫療養: -2 },
    平: { 動土修造: 1, 除舊整理: 1, 投資置產: -1 },
    定: { 簽約交易: 2, 婚嫁喜慶: 1, 搬遷入宅: 1, 動土修造: 1, 合作洽談: 1, 出行遠行: -1, 爭訟衝突: -1 },
    執: { 簽約交易: 1, 合作洽談: 1, 動土修造: 1, 開市求財: -1, 搬遷入宅: -1 },
    破: { 除舊整理: 2, 求醫療養: 1, 簽約交易: -2, 開市求財: -2, 婚嫁喜慶: -2, 投資置產: -2, 搬遷入宅: -1, 出行遠行: -1, 動土修造: -1, 合作洽談: -1 },
    危: { 祈福靜修: 1, 出行遠行: -2, 投資置產: -1, 動土修造: -1 },
    成: { 簽約交易: 2, 開市求財: 2, 婚嫁喜慶: 2, 搬遷入宅: 1, 學習考試: 1, 求職面試: 1, 爭訟衝突: -1 },
    收: { 開市求財: 1, 投資置產: 1, 學習考試: 1, 出行遠行: -1, 動土修造: -1 },
    開: { 開市求財: 2, 求職面試: 2, 學習考試: 2, 出行遠行: 1, 合作洽談: 1, 動土修造: -2 },
    閉: { 學習考試: 1, 祈福靜修: 1, 開市求財: -2, 出行遠行: -2, 搬遷入宅: -1 }
  };
  const ZHI12 = "子丑寅卯辰巳午未申酉戌亥";
  const LIUHAI = [["子", "未"], ["丑", "午"], ["寅", "巳"], ["卯", "辰"], ["申", "亥"], ["酉", "戌"]];
  const ZHI_OF_ELEM = { 木: "寅卯", 火: "巳午", 土: "辰戌丑未", 金: "申酉", 水: "亥子" };
  const POSITIVE = ACTS.filter((x) => x.yi && x.k !== "除舊整理" && x.k !== "祈福靜修").map((x) => x.k);
  const otherZhi = (z) => { const p = ZHI_CHONG.find((q) => q.indexOf(z) >= 0); return p[0] === z ? p[1] : p[0]; };

  // 本命擇日規則（一次算好，每日打分與總則頁共用）
  function personalRules(B, tsZ) {
    const triadY = triadOf(B.yZ), triadD = triadOf(B.dZ);
    const N = B.natal;
    const favE = ELEMS.filter((e) => N.fav(e) > 0), badE = ELEMS.filter((e) => N.fav(e) < 0);
    const zhiOf = (es) => uniq(es.map((e) => ZHI_OF_ELEM[e].split("")).flat());
    const caiE = N.ce.財, yinE = N.ce.印, guanE = N.ce.官殺;
    return {
      gui: uniq((TIANYI_GUIREN[B.dG] || []).concat(TIANYI_GUIREN[B.yG] || [])),
      lu: LU_SHEN[B.dG],
      caiZhi: N.fav(caiE) > 0 ? ZHI_OF_ELEM[caiE].split("") : [], caiE, caiFav: N.fav(caiE) > 0,
      yima: uniq([TRIAD_STAR[triadY].驛馬, TRIAD_STAR[triadD].驛馬]),
      taohua: uniq([TRIAD_STAR[triadY].桃花, TRIAD_STAR[triadD].桃花]),
      wenchang: WEN_CHANG[B.dG], yinE, yinFav: N.fav(yinE) > 0, guanE, guanFav: N.fav(guanE) > 0,
      liuheD: ZHI_LIUHE.filter((p) => p.indexOf(B.dZ) >= 0).map((p) => (p[0] === B.dZ ? p[1] : p[0])),
      sanheY: triadY.split("").filter((z) => z !== B.yZ),
      favE, badE, favZhi: zhiOf(favE), badZhi: zhiOf(badE),
      chongD: otherZhi(B.dZ), chongY: otherZhi(B.yZ),
      tkdc: [[B.dG, B.dZ], [B.yG, B.yZ]].map(([g, z]) => { const gp = GAN_CHONG.find((p) => p.indexOf(g) >= 0); return gp ? (gp[0] === g ? gp[1] : gp[0]) + otherZhi(z) : null; }).filter(Boolean),
      xing: ZHI12.split("").filter((z) => xingHit(B.yZ, z) || xingHit(B.dZ, z)),
      hai: uniq(LIUHAI.filter((p) => p.indexOf(B.dZ) >= 0 || p.indexOf(B.yZ) >= 0).map((p) => (p[0] === B.dZ || p[0] === B.yZ ? p[1] : p[0]))),
      sansha: SANSHA[triadY].split(""), huitouMonth: KU[HUITOU[triadY]], huitouDays: HUITOU[triadY].split(""),
      tsZ, suipo: otherZhi(tsZ)
    };
  }

  function activities(jc, huangdao, R, B, dG, dZ, mZ, t, ten) {
    const sc = {};
    ACTS.forEach((x) => { sc[x.k] = 0; });
    const add = (k, v) => { sc[k] += v; };
    const addAll = (v, keys) => (keys || POSITIVE).forEach((k) => add(k, v));
    Object.entries(JC_BASE[jc] || {}).forEach(([k, v]) => add(k, v));
    addAll(huangdao ? 0.5 : -0.5);
    add("爭訟衝突", -0.5);
    // 個人吉象
    if (R.gui.indexOf(dZ) >= 0) { add("求職面試", 2); add("合作洽談", 2); add("簽約交易", 1); add("求醫療養", 1); add("祈福靜修", 1); }
    if (R.lu === dZ) { add("開市求財", 2); add("投資置產", 1); }
    if (R.caiFav && (WUXING_OF_GAN[dG] === R.caiE || WUXING_OF_ZHI[dZ] === R.caiE)) { add("開市求財", 1.5); add("投資置產", 1.5); add("簽約交易", 1); }
    if (R.yima.indexOf(dZ) >= 0) { add("出行遠行", 2); add("搬遷入宅", 1); }
    if (R.taohua.indexOf(dZ) >= 0) { add("婚嫁喜慶", 2); add("合作洽談", 0.5); }
    if (R.wenchang === dZ) { add("學習考試", 2); add("求職面試", 0.5); }
    if (R.liuheD.indexOf(dZ) >= 0) { add("婚嫁喜慶", 1.5); add("合作洽談", 1); add("簽約交易", 1); }
    if (R.sanheY.indexOf(dZ) >= 0) { add("合作洽談", 1); add("婚嫁喜慶", 1); add("開市求財", 0.5); }
    if (B.natal.fav(WUXING_OF_GAN[dG]) > 0 && B.natal.fav(WUXING_OF_ZHI[dZ]) > 0) addAll(0.5);
    // 十神喜忌（當日天干對日主）
    const TEN = {
      比劫: ten.good ? { 合作洽談: 1 } : { 借貸作保: -2, 投資置產: -1, 合作洽談: -0.5 },
      食傷: ten.good ? { 學習考試: 0.5, 合作洽談: 1 } : { 求職面試: -1.5, 合作洽談: -1, 爭訟衝突: -1 },
      財: ten.good ? { 開市求財: 1, 投資置產: 0.5 } : { 投資置產: -1, 開市求財: -0.5, 借貸作保: -1 },
      官殺: ten.good ? { 求職面試: 1.5 } : { 爭訟衝突: -2, 求職面試: -1, 出行遠行: -0.5 },
      印: ten.good ? { 學習考試: 1.5, 求醫療養: 0.5 } : { 學習考試: -0.5, 簽約交易: -0.5 }
    };
    Object.entries(TEN[ten.cat] || {}).forEach(([k, v]) => add(k, v));
    // 個人凶象
    if (dZ === R.chongD) { add("婚嫁喜慶", -3); add("簽約交易", -2); add("合作洽談", -1.5); add("搬遷入宅", -1); add("求醫療養", -1); }
    if (dZ === R.chongY) { add("出行遠行", -2); add("搬遷入宅", -2); add("動土修造", -1.5); add("簽約交易", -1); }
    if (t.key === "天克地冲") { addAll(-2); add("借貸作保", -2); }
    if (R.xing.indexOf(dZ) >= 0) { add("爭訟衝突", -2); add("求醫療養", -1.5); add("簽約交易", -1); add("合作洽談", -1); }
    if (R.hai.indexOf(dZ) >= 0) { add("合作洽談", -1); add("婚嫁喜慶", -1); }
    if (R.sansha.indexOf(dZ) >= 0) { add("動土修造", -3); add("搬遷入宅", -2); }
    if (t.key === "回頭殺") { add("投資置產", -2); add("簽約交易", -1.5); add("搬遷入宅", -1); add("借貸作保", -1); }
    if (pairHit(ZHI_CHONG, dZ, mZ)) { add("動土修造", -1.5); add("搬遷入宅", -1.5); add("出行遠行", -1); add("簽約交易", -1); }
    if (dZ === R.suipo) { add("搬遷入宅", -1.5); add("動土修造", -1.5); add("婚嫁喜慶", -1); add("出行遠行", -1); }
    if (B.natal.fav(WUXING_OF_GAN[dG]) < 0 && B.natal.fav(WUXING_OF_ZHI[dZ]) < 0) addAll(-0.5);
    const rank = ACTS.map((x) => ({ x, s: sc[x.k] }));
    const yi = rank.filter((r) => r.x.yi && r.s >= 1.5).sort((p, q) => q.s - p.s).slice(0, 5).map((r) => r.x.yi);
    const ji = rank.filter((r) => r.x.ji && r.s <= -1.5).sort((p, q) => p.s - q.s).slice(0, 4).map((r) => r.x.ji);
    return { yi: yi.length ? yi : ["例行事務", "日常採買"], ji, score: sc };
  }

  // 大吉／次吉／小吉：本命喜忌為主，當日五行生扶者加分、剋制者扣分
  function luckyElems(natal, dG, dZ, mZ) {
    const w = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
    w[WUXING_OF_GAN[dG]] += 1; w[WUXING_OF_ZHI[dZ]] += 1.2; w[WUXING_OF_ZHI[mZ]] += 0.6;
    return ELEMS.map((e) => ({ e, s: natal.fav(e) * 0.5 + 0.8 * w[GEN_BY[e]] + 0.3 * w[e] - 0.5 * w[CTRL_BY[e]] }))
      .sort((a, b) => b.s - a.s).slice(0, 3).map((x) => x.e);
  }

  function build(chart, year) {
    const natal = BaziReport.natal(chart);
    const yG = chart.pillars[3].gan.char, yZ = chart.pillars[3].zhi.char;
    const B = { yG, yZ, dG: chart.dayGan, dZ: chart.pillars[1].zhi.char, natal };
    const tsZ = Solar.fromYmd(year, 6, 1).getLunar().getYearZhiExact();
    const R = personalRules(B, tsZ);
    const T = (v) => s2t(String(v == null ? "" : v));
    const months = [];
    for (let m = 1; m <= 12; m++) {
      const days = [];
      const n = new Date(year, m, 0).getDate();
      for (let d = 1; d <= n; d++) {
        // 以中午判斷：交節日（如立春 04:02）當天依節後月令論，與市售通勝一致
        const l = Solar.fromYmdHms(year, m, d, 12, 0, 0).getLunar();
        const dG = l.getDayGan(), dZ = l.getDayZhi(), mZ = l.getMonthZhiExact();
        const jc = T(l.getZhiXing());
        const t = dayType(B, dG, dZ, mZ);
        const ss = getShiShen(chart.dayGan, dG);
        const ten = { ss, cat: SS_CAT[ss], good: natal.fav(WUXING_OF_GAN[dG]) > 0 };
        const lm = l.getMonth();
        days.push({
          d, dow: new Date(year, m - 1, d).getDay(), jc, xiu: T(l.getXiu()),
          huangdao: l.getDayTianShenType() === "黄道",
          lunar: l.getDay() === 1 ? (lm < 0 ? "閏" : "") + T(l.getMonthInChinese()) + "月" : T(l.getDayInChinese()),
          monthGz: l.getMonthInGanZhiExact(), dayGz: dG + dZ, ss, type: t, act: activities(jc, l.getDayTianShenType() === "黄道", R, B, dG, dZ, mZ, t, ten),
          xi: XI[dG], cai: CAI[dG], gui: ZHI_DIR[YANG_GUI[dG]], lucky: luckyElems(natal, dG, dZ, mZ)
        });
      }
      months.push({ m, days });
    }
    return { chart, year, natal, yG, yZ, dG: B.dG, dZ: B.dZ, rules: R, months };
  }

  // 一個月一張 A4（794×1123px＝96dpi）。日曆用 table 排版：html2canvas 對 grid 的支援不穩定。
  function renderMonth(M, m) {
    const mo = M.months[m - 1], c = M.chart;
    const first = mo.days[0].dow, rows = Math.ceil((first + mo.days.length) / 7);
    const cellH = Math.floor(878 / rows); // 日曆可用高度約 878px，依週數平均分配
    const page = document.createElement("div");
    page.className = "ts-page";
    const genderText = c.gender === "male" ? "男" : "女";
    let h = '<div class="ts-head"><div class="ts-brand"><img src="assets/logo.png" alt=""><span>個人擇日通勝</span></div>' +
      '<div class="ts-who"><b>' + esc(c.name) + "</b>　" + genderText + "・本命" + M.yG + M.yZ + "年（" + c.shengxiao + "）・" + M.dG + M.dZ + "日</div></div>" +
      '<div class="ts-bar">' + M.year + " 年 " + m + " 月　" + MONTH_EN[m - 1] + " " + M.year + "</div>" +
      '<table class="ts-cal"><thead><tr>' + ["日", "一", "二", "三", "四", "五", "六"].map((w, i) =>
        '<th class="' + (i === 0 || i === 6 ? "ts-we" : "") + '">' + ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][i] + " " + w + "</th>").join("") + "</tr></thead><tbody>";
    for (let r = 0; r < rows; r++) {
      h += "<tr>";
      for (let k = 0; k < 7; k++) {
        const idx = r * 7 + k - first;
        const x = mo.days[idx];
        if (!x) { h += '<td class="ts-empty"><div class="ts-c" style="height:' + cellH + 'px"></div></td>'; continue; }
        const t = x.type;
        h += '<td><div class="ts-c" style="height:' + cellH + 'px">' +
          '<div class="ts-top"><span class="ts-d">' + x.d + '</span><span class="ts-jc' + (x.huangdao ? " ts-red" : "") + '">' + x.jc + "</span>" +
          '<span class="ts-sep">｜</span><span class="ts-xiu">' + x.xiu + '</span><span class="ts-lunar' + (x.lunar.indexOf("月") >= 0 ? " ts-red" : "") + '">' + x.lunar + "</span></div>" +
          '<div class="ts-gz">' + x.monthGz + "月　" + x.dayGz + "日・" + x.ss + "</div>" +
          '<div class="ts-type ts-' + t.kind + '">' + t.label + "</div>" +
          '<div class="ts-yi"><b>適合：</b>' + x.act.yi.join("、") + "</div>" +
          '<div class="ts-ji"><b>不適合：</b>' + (x.act.ji.join("、") || "—") + "</div>" +
          '<div class="ts-bot"><table><tr><td>喜：' + x.xi + "</td><td>大吉：" + x.lucky[0] + "</td></tr>" +
          "<tr><td>財：" + x.cai + "</td><td>次吉：" + x.lucky[1] + "</td></tr>" +
          "<tr><td>貴：" + x.gui + "</td><td>小吉：" + x.lucky[2] + "</td></tr></table></div>" +
          "</div></td>";
      }
      h += "</tr>";
    }
    h += "</tbody></table>" +
      '<div class="ts-foot"><div><b>本命日別</b>（依本命日柱' + M.dG + M.dZ + "、年柱" + M.yG + M.yZ + "與喜用神）：貴人＝日干或年干天乙貴人｜人緣＝與年支三合六合、與日支六合｜" +
      "旺財＝日主祿位或喜用財星日｜旺財健康＝日主長生｜喜用＝干支皆為喜用｜冲＝沖日支或年支，干支皆沖為天克地冲｜三刑＝刑年支｜三殺＝年支三殺方｜回頭殺＝回頭貢殺。" +
      "日干支後為當日天干對日主的十神；紅字建除為黃道日。</div>" +
      "<div><b>適合／不適合</b>：十五類通用事項（簽約、開市、投資、求職、合作、出行、搬遷、婚嫁、動土、求醫、學習、祈福、除舊、借貸、爭訟）依建除宜忌加上本命條件逐日評分，詳見第一頁「個人擇日總則」。</div>" +
      "<div><b>大吉／次吉／小吉</b>：本命喜用神結合當日干支五行。" + ELEMS.map((e) => e + "：" + WX_COLOR[e]).join("｜") + "</div>" +
      '<div class="ts-note">Aries 命理工作室　·　本內容依傳統擇日規則推算，僅供參考，重大決定請自行斟酌。</div></div>';
    page.innerHTML = h;
    return page;
  }


  // 個人擇日總則（A4 一頁，放在十二個月之前）：本命要點、專屬吉日、要避開的日子、通用事項對照
  function renderGuide(M) {
    const c = M.chart, R = M.rules, N = M.natal;
    const page = document.createElement("div");
    page.className = "ts-page ts-guide";
    const genderText = c.gender === "male" ? "男" : "女";
    const zl = (arr) => (arr && arr.length ? arr.map((z) => z + "日").join("、") : "無");
    const el = (arr) => (arr.length ? arr.join("、") : "無");
    const row = (cells) => "<tr>" + cells.map((x, i) => (i === 0 ? '<th>' + x + "</th>" : "<td>" + x + "</td>")).join("") + "</tr>";
    const tbl = (head, rows) => '<table class="ts-gt"><thead><tr>' + head.map((h) => "<th>" + h + "</th>").join("") + "</tr></thead><tbody>" + rows.join("") + "</tbody></table>";
    const favTxt = (e) => e + "（" + N.role(e) + "）";
    const bodyWx = N.D, mz = c.pillars[2].zhi.char;
    let h = '<div class="ts-head"><div class="ts-brand"><img src="assets/logo.png" alt=""><span>個人擇日通勝</span></div>' +
      '<div class="ts-who"><b>' + esc(c.name) + "</b>　" + genderText + "・本命" + M.yG + M.yZ + "年（" + c.shengxiao + "）・" + M.dG + M.dZ + "日</div></div>" +
      '<div class="ts-bar">' + M.year + " 年　個人擇日總則　PERSONAL DATE SELECTION GUIDE</div>" +
      '<div class="ts-gintro">這一頁是你專屬的擇日原則。後面十二個月的「適合／不適合」就是依這些原則，把每一天對十五類通用事項逐日評分而來；凡遇大事，先看這一頁，再翻到當月挑日子。</div>' +
      '<div class="ts-gsec">一、本命要點</div>' +
      tbl(["項目", "內容"], [
        row(["日主", M.dG + "（" + bodyWx + "）・" + N.level + "，生於" + mz + "月"]),
        row(["喜用五行", el(R.favE.map(favTxt)) + "　→ 這些五行的日子（" + zl(R.favZhi) + "）與顏色對你有利"]),
        row(["忌神五行", el(R.badE.map(favTxt)) + "　→ 這些五行的日子（" + zl(R.badZhi) + "）減少重大決定"]),
        row(["取用理由", esc(N.reason) + (N.tiaohou ? "；" + esc(N.tiaohou) : "")])
      ]) +
      '<div class="ts-gcols"><div>' +
      '<div class="ts-gsec">二、你的專屬吉日</div>' +
      tbl(["吉日", "地支日", "最適合做"], [
        row(["貴人日", zl(R.gui), "面試、見上司、談合作、求助、就醫"]),
        row(["祿日", zl([R.lu]), "開市、收款、談價、投資"]),
        row(["財星日", R.caiFav ? zl(R.caiZhi) : "財星非喜用，略過", "開市求財、投資置產、簽約"]),
        row(["驛馬日", zl(R.yima), "出行、出差、搬遷、外派"]),
        row(["桃花日", zl(R.taohua), "約會、聯誼、嫁娶、宴客"]),
        row(["文昌日", zl([R.wenchang]), "學習、考試、申請、簽文件"]),
        row(["六合日", zl(R.liuheD) + "（合日支）", "嫁娶、合作、簽約"]),
        row(["三合日", zl(R.sanheY) + "（合年支）", "合作、聚會、開市"])
      ]) + "</div><div>" +
      '<div class="ts-gsec">三、你要避開的日子</div>' +
      tbl(["凶日", "條件", "不宜"], [
        row(["沖日柱", R.chongD + "日", "嫁娶、簽約、合作、搬家、手術"]),
        row(["沖年支", R.chongY + "日", "遠行、搬家、動土、簽約"]),
        row(["天克地冲", R.tkdc.length ? R.tkdc.map((x) => x + "日").join("、") : "無", "一切重大決定"]),
        row(["三刑日", zl(R.xing), "爭訟、手術、簽約、談判"]),
        row(["六害日", zl(R.hai), "合作、嫁娶（易生嫌隙）"]),
        row(["三殺日", zl(R.sansha), "動土、裝修、搬家"]),
        row(["回頭殺", R.huitouMonth + "月的" + R.huitouDays.join("、") + "日", "投資、簽約、搬家"]),
        row(["歲破・月破", M.year + " 年" + R.suipo + "日；每月沖月支之日", "搬家、動土、嫁娶、遠行"])
      ]) + "</div></div>" +
      '<div class="ts-gsec">四、十五類通用事項：怎麼為自己挑日子</div>' +
      tbl(["事項", "優先選", "要避開"], [
        row(["簽約交易", "成、定日；貴人日、六合日、財星日", "破日、沖日柱、天克地冲、三刑、回頭殺"]),
        row(["開市求財", "滿、成、開日；祿日、財星日", "破、閉日；沖日、忌神日"]),
        row(["投資置產", "收日；祿日、財星日", "破日、回頭殺、比劫忌神日、歲破"]),
        row(["求職面試", "開、建、成日；貴人日、官星喜用日", "傷官忌神日、沖日、三刑"]),
        row(["合作洽談", "定、執、滿日；貴人日、六合三合日", "沖日柱、三刑、六害、天克地冲"]),
        row(["出行遠行", "建、開日；驛馬日", "危、閉、破日；沖年支、月破"]),
        row(["搬遷入宅", "定、成日；驛馬日", "三殺、沖年支、歲破月破、回頭殺"]),
        row(["婚嫁喜慶", "成、定、滿日；桃花日、六合三合日", "沖日柱（夫妻宮）、破日、六害、三刑"]),
        row(["動土修造", "平、定、執日", "三殺、建、開、破日；沖年支、月破"]),
        row(["求醫療養", "除、成日；貴人日、印星喜用日", "滿、破日；三刑、沖日柱"]),
        row(["學習考試", "開、建、成、收日；文昌日、印星喜用日", "印星忌神日、破日"]),
        row(["祈福靜修", "危、閉、除日；貴人日", "破日"]),
        row(["除舊整理", "除、破、平日（破舊立新）", "—"]),
        row(["借貸作保", "—", "比劫忌神日、破日、天克地冲、回頭殺"]),
        row(["爭訟衝突", "—", "三刑、官殺忌神日、破、成日（宜和不宜訟）"])
      ]) +
      '<div class="ts-foot"><div><b>說明</b>：吉凶日依本命日柱' + M.dG + M.dZ + "、年柱" + M.yG + M.yZ + "與喜用神推算；建除十二神為傳統通書的日神，黃道日加分、黑道日減分。" +
      "同一天若吉凶並見，以沖、刑、殺等凶象優先，重大決定另擇他日。</div>" +
      '<div class="ts-note">Aries 命理工作室　·　本內容依傳統擇日規則推算，僅供參考，重大決定請自行斟酌。</div></div>';
    page.innerHTML = h;
    return page;
  }

  window.TongSheng = { build, renderMonth, renderGuide, ACTS };
})();
