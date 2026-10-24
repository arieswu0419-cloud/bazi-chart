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
  const TYPE_YI = { 貴人: ["拜訪貴人", "面試求助"], 人緣: ["聯誼", "約會", "業務拜訪"], 旺財: ["談薪", "收款"], 健康: ["運動健身"] };
  const ERRANDS = ["日常採買", "理髮", "丟棄雜物", "例行檢查"];
  const TYPE_JI = { 冲: ["簽約", "遠行", "搬家"], 天克地冲: ["簽約", "遠行", "搬家", "重大決定"], 三刑: ["爭執訴訟", "非急迫手術"], 三殺: ["動土", "搬家"], 回頭殺: ["重大決定", "合夥"] };

  const uniq = (arr) => arr.filter((v, i) => arr.indexOf(v) === i);
  const triadOf = (z) => Object.keys(ZHI_SANHE).find((k) => k.indexOf(z) >= 0);
  const pairHit = (list, a, b) => list.some((p) => (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // 當日天干對日主的十神類別 → 個人化的適合（十神為喜用）／不適合（十神為忌）
  const SS_CAT = { 比肩: "比劫", 劫財: "比劫", 食神: "食傷", 傷官: "食傷", 正財: "財", 偏財: "財", 正官: "官殺", 七殺: "官殺", 正印: "印", 偏印: "印" };
  const TEN_YI = { 比劫: "合作洽談", 食傷: "創作發表", 財: "理財規劃", 官殺: "面試拜訪長官", 印: "學習考試" };
  const TEN_JI = { 比劫: "借貸作保", 食傷: "頂撞上司", 財: "衝動消費", 官殺: "違規冒險", 印: "拖延決定" };
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

  function activities(jc, t, ten) {
    const base = JIANCHU[jc] || { yi: [], ji: [] };
    let yi, ji;
    if (t.kind === "bad") {
      yi = ERRANDS.slice();
      ji = uniq((TYPE_JI[t.key] || []).concat(ten.good ? [] : [TEN_JI[ten.cat]], base.ji));
    } else {
      const extra = ten.good ? [TEN_YI[ten.cat]] : [];
      (t.pos || []).forEach((p) => {
        if (p === "旺財健康") extra.push(...TYPE_YI.旺財, ...TYPE_YI.健康);
        else extra.push(...(TYPE_YI[p] || []));
      });
      ji = uniq((ten.good ? [] : [TEN_JI[ten.cat]]).concat(base.ji));
      yi = uniq(extra.concat(base.yi)).filter((x) => ji.indexOf(x) < 0).slice(0, 7);
    }
    return { yi, ji };
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
          monthGz: l.getMonthInGanZhiExact(), dayGz: dG + dZ, ss, type: t, act: activities(jc, t, ten),
          xi: XI[dG], cai: CAI[dG], gui: ZHI_DIR[YANG_GUI[dG]], lucky: luckyElems(natal, dG, dZ, mZ)
        });
      }
      months.push({ m, days });
    }
    return { chart, year, natal, yG, yZ, dG: B.dG, dZ: B.dZ, months };
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
      "<div><b>大吉／次吉／小吉</b>：本命喜用神結合當日干支五行。" + ELEMS.map((e) => e + "：" + WX_COLOR[e]).join("｜") + "</div>" +
      '<div class="ts-note">Aries 命理工作室　·　本內容依傳統擇日規則推算，僅供參考，重大決定請自行斟酌。</div></div>';
    page.innerHTML = h;
    return page;
  }

  window.TongSheng = { build, renderMonth };
})();
