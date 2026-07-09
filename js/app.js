let currentChart = null;
let selectedDayun = null;
let selectedLiunian = null;
let currentRenge = null;
let currentLifenum = null;

requireApprovedUser(function () {});

// 擇日欄位：年/月/日下拉，預設今天
(function initQChoiceFields() {
  const today = new Date();
  const yearSel = document.getElementById("f-qyear");
  const monthSel = document.getElementById("f-qmonth");
  const daySel = document.getElementById("f-qday");

  const thisYear = today.getFullYear();
  let yearHtml = "";
  for (let y = thisYear - 100; y <= thisYear + 10; y++) yearHtml += '<option value="' + y + '">' + y + "</option>";
  yearSel.innerHTML = yearHtml;

  let monthHtml = "";
  for (let m = 1; m <= 12; m++) monthHtml += '<option value="' + m + '">' + m + "</option>";
  monthSel.innerHTML = monthHtml;

  let dayHtml = "";
  for (let d = 1; d <= 31; d++) dayHtml += '<option value="' + d + '">' + d + "</option>";
  daySel.innerHTML = dayHtml;

  yearSel.value = String(thisYear);
  monthSel.value = String(today.getMonth() + 1);
  daySel.value = String(today.getDate());
})();

// 頁籤切換：八字報告／人格解碼報告／生命靈數
function setActiveTab(tab) {
  document.getElementById("tabBazi").classList.toggle("active", tab === "bazi");
  document.getElementById("tabRenge").classList.toggle("active", tab === "renge");
  document.getElementById("tabLifenum").classList.toggle("active", tab === "lifenum");
  document.getElementById("baziTabPanel").style.display = tab === "bazi" ? "" : "none";
  document.getElementById("rengeTabPanel").style.display = tab === "renge" ? "" : "none";
  document.getElementById("lifenumTabPanel").style.display = tab === "lifenum" ? "" : "none";
}
document.getElementById("tabBazi").addEventListener("click", function () { setActiveTab("bazi"); });
document.getElementById("tabRenge").addEventListener("click", function () { setActiveTab("renge"); });
document.getElementById("tabLifenum").addEventListener("click", function () { setActiveTab("lifenum"); });

document.getElementById("rengeSubmitBtn").addEventListener("click", function () {
  const name = document.getElementById("f-name").value.trim();
  const dateVal = document.getElementById("f-date").value;
  if (!name || !dateVal) {
    alert("請先輸入姓名與出生日期（國曆）");
    return;
  }
  const [year, month, day] = dateVal.split("-").map(Number);
  const qYear = Number(document.getElementById("f-qyear").value);
  const qMonth = Number(document.getElementById("f-qmonth").value);
  const qDay = Number(document.getElementById("f-qday").value);
  // 0-19 階段數需要出生時辰才能算，跟八字報告共用同一個「出生時間」欄位；沒填就留白，其餘欄位不受影響
  const timeVal = document.getElementById("f-time").value;
  const hour = timeVal ? Number(timeVal.split(":")[0]) : null;

  currentRenge = calculateRenge({ year, month, day, qYear, qMonth, qDay, hour, name });
  renderRenge(currentRenge);
  setActiveTab("renge");
});

document.getElementById("lifenumSubmitBtn").addEventListener("click", function () {
  const name = document.getElementById("f-name").value.trim();
  const dateVal = document.getElementById("f-date").value;
  if (!name || !dateVal) {
    alert("請先輸入姓名與出生日期（國曆）");
    return;
  }
  const [year, month, day] = dateVal.split("-").map(Number);
  const gender = document.getElementById("f-gender").value;

  currentLifenum = calculateLifeNumber({ year, month, day, gender, name });
  renderLifenum(currentLifenum);
  setActiveTab("lifenum");
});

document.getElementById("baziForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const name = document.getElementById("f-name").value.trim();
  const gender = document.getElementById("f-gender").value;
  const dateVal = document.getElementById("f-date").value;
  const timeVal = document.getElementById("f-time").value;
  if (!dateVal || !timeVal) return;

  const [year, month, day] = dateVal.split("-").map(Number);
  const [hour, minute] = timeVal.split(":").map(Number);

  currentChart = calculateBazi({ year, month, day, hour, minute, gender, name });
  selectedDayun = currentChart.daYunList.findIndex((d) => d.isCurrent);
  if (selectedDayun < 0) selectedDayun = 0;
  selectedLiunian = null;
  renderChart(currentChart);
});

const GENDER_TEXT = { male: "男", female: "女" };

// jsPDF 內建字型不支援中文，直接用 pdf.text() 寫中文會變亂碼，
// 所以標題文字改成先畫在 canvas 上（用瀏覽器自己的字型引擎），再當成圖片貼進 PDF
function textToImage(text, fontPx, color) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const scale = 3;
  const font = "600 " + fontPx + 'px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
  ctx.font = font;
  const width = Math.ceil(ctx.measureText(text).width) + 4;
  const height = Math.ceil(fontPx * 1.4);
  canvas.width = width * scale;
  canvas.height = height * scale;
  ctx.scale(scale, scale);
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textBaseline = "middle";
  ctx.fillText(text, 2, height / 2);
  const PX_TO_MM = 0.264583;
  return { dataUrl: canvas.toDataURL("image/png"), widthMM: width * PX_TO_MM, heightMM: height * PX_TO_MM };
}

// 把一個區塊 canvas 貼進 PDF，太高會自動分頁；回傳「最後一頁內容畫到哪個 Y 位置」，
// 讓呼叫端知道要接著從哪裡往下放東西（例如結尾文字）
function addCanvasToPdf(pdf, canvas, margin, pageWidth, pageHeight, startY) {
  const imgData = canvas.toDataURL("image/jpeg", 0.85);
  const imgWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let position = startY;
  pdf.addImage(imgData, "JPEG", margin, position, imgWidth, imgHeight);
  let heightLeft = imgHeight - (pageHeight - startY);
  let lastBottom = Math.min(startY + imgHeight, pageHeight);
  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "JPEG", margin, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    lastBottom = position + imgHeight;
  }
  return lastBottom;
}

document.getElementById("exportPdfBtn").addEventListener("click", async function () {
  const btn = this;
  const originalLabel = btn.textContent;
  btn.disabled = true;
  btn.textContent = "匯出中...";
  try {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4", true);
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10;

    const logoImg = document.querySelector(".brand img");
    pdf.addImage(logoImg, "PNG", margin, 8, 12, 12);
    const title = textToImage("Aries9419 八字報告", 20, "#212529");
    pdf.addImage(title.dataUrl, "PNG", margin + 16, 8 + (12 - title.heightMM) / 2, title.widthMM, title.heightMM);

    const resultCanvas = await html2canvas(document.getElementById("resultCard"), { scale: 1.5, backgroundColor: "#ffffff" });
    addCanvasToPdf(pdf, resultCanvas, margin, pageWidth, pageHeight, 26);

    // 大運流年另外強制換頁，不要被切一半；表格說明文字（點選欄位標題...）不匯出
    pdf.addPage();
    const dayunCanvas = await html2canvas(document.getElementById("dayunCard"), { scale: 1.5, backgroundColor: "#ffffff" });
    const dayunBottom = addCanvasToPdf(pdf, dayunCanvas, margin, pageWidth, pageHeight, margin);

    const closing = textToImage("-----八字報告請交由專業人士分析-----", 12, "#5F5E5A");
    let closingY = dayunBottom + 8;
    if (closingY + closing.heightMM > pageHeight - margin) {
      pdf.addPage();
      closingY = margin;
    }
    pdf.addImage(closing.dataUrl, "PNG", (pageWidth - closing.widthMM) / 2, closingY, closing.widthMM, closing.heightMM);

    const filename = (currentChart ? currentChart.name : "八字") + "-八字命盤.pdf";
    pdf.save(filename);
  } catch (err) {
    alert("匯出失敗：" + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = originalLabel;
  }
});

function charCell(part) {
  return '<span class="p-char ' + part.cls + '">' + part.char + '<span class="p-sign">' + part.sign + part.wuxing + "</span></span>";
}
function zhiCell(p) {
  const xk = p.xunkong && p.xunkong.length ? '<span class="xunkong">' + p.xunkong.join(" ") + "</span>" : "";
  return xk + charCell(p.zhi);
}
function hideCell(p) {
  return p.hideGansDisplay.map((h) =>
    '<span class="hide-col"><span class="' + h.cls + '">' + h.char + '</span><span class="hg-ss">' + (h.shiShen || "") + "</span></span>"
  ).join("");
}
function shenshaCell(p) {
  return p.shensha.length ? p.shensha.map((s) => "<div>" + s + "</div>").join("") : '<div class="muted">—</div>';
}

// pillars: 陣列，每個元素需有 {headLabel, shiShenGan, gan, zhi, hideGansDisplay, diShi, shensha}
function buildPillarsTable(pillars) {
  const rows = [
    { label: "十神", cell: (p) => p.shiShenGan },
    { label: "天干", cell: (p) => charCell(p.gan) },
    { label: "地支", cell: (p) => zhiCell(p) },
    { label: "藏干", cell: (p) => hideCell(p) },
    { label: "長生", cell: (p) => p.diShi },
    { label: "神煞", cell: (p) => shenshaCell(p) }
  ];

  let html = '<table class="pillars-table"><tbody><tr><td class="label-cell"></td>';
  pillars.forEach((p) => { html += '<td class="col-head">' + p.headLabel + "</td>"; });
  html += "</tr>";
  rows.forEach((row) => {
    html += '<tr><td class="label-cell">' + row.label + "</td>";
    pillars.forEach((p) => { html += "<td>" + row.cell(p) + "</td>"; });
    html += "</tr>";
  });
  html += "</tbody></table>";
  return html;
}

function renderChart(data) {
  document.getElementById("resultCard").style.display = "block";
  document.getElementById("dayunCard").style.display = "block";

  const info = document.getElementById("infoPanel");
  info.innerHTML =
    "<p>姓名：" + data.name + "</p>" +
    "<p>性別：" + (GENDER_TEXT[data.gender] || "") + "</p>" +
    "<p>陽曆生辰：" + data.solarText + "</p>" +
    "<p>農曆生辰：" + data.lunarText + "</p>" +
    "<p>生肖：" + data.shengxiao + "</p>" +
    "<p>命格：" + data.geju + "</p>";

  const mainPillars = data.pillars.map((p) => ({ ...p, headLabel: p.label }));
  document.getElementById("pillarsGrid").innerHTML = buildPillarsTable(mainPillars);

  document.getElementById("ganNote").textContent = data.ganNoteText;
  document.getElementById("zhiNote").textContent = data.zhiNoteText;

  const wxBars = document.getElementById("wuxingBars");
  wxBars.innerHTML = "";
  const wxOrder = ["金", "水", "木", "火", "土"];
  const wxColor = { 木: "#3B6D11", 火: "#A32D2D", 土: "#854F0B", 金: "#B8860B", 水: "#185FA5" };
  wxOrder.forEach((wx) => {
    const pct = data.wuxingPct[wx] || 0;
    const row = document.createElement("div");
    row.className = "bar-row";
    row.innerHTML =
      '<span class="name" style="background:' + wxColor[wx] + '">' + wx + '</span>' +
      '<div class="bar-track"><div class="bar-fill" style="width:' + pct + '%;background:' + wxColor[wx] + '"></div></div>' +
      '<span class="pct">' + pct + '%</span>';
    wxBars.appendChild(row);
  });

  const ssGrid = document.getElementById("shishenGrid");
  ssGrid.innerHTML = "";
  const leftCol = ["劫財", "比肩", "傷官", "食神", "正財"];
  const rightCol = ["偏財", "正官", "七殺", "正印", "偏印"];
  for (let i = 0; i < 5; i++) {
    const l = leftCol[i], r = rightCol[i];
    const row = document.createElement("div");
    row.className = "ss-pair";
    row.innerHTML =
      '<span class="ss-name">' + l + '</span><span class="ss-val">' + data.shishenPct[l] + '%</span>' +
      '<span class="ss-name">' + r + '</span><span class="ss-val">' + data.shishenPct[r] + '%</span>';
    ssGrid.appendChild(row);
  }

  renderDayun(data);
}

// 大運／流年：跟四柱同一種寬表格樣式，欄位標題可以點選，點了哪欄哪欄就整欄反白
function buildDayunTable(items, selectedIdx, ageLabelOf) {
  const rows = [
    { label: "十神", cell: (p) => p.shiShen || "" },
    { label: "天干", cell: (p) => charCell(p.gan) },
    { label: "地支", cell: (p) => zhiCell(p) },
    { label: "藏干", cell: (p) => hideCell(p) },
    { label: "長生", cell: (p) => p.diShi },
    { label: "神煞", cell: (p) => shenshaCell(p) }
  ];

  let html = '<table class="dayun-table"><tbody><tr><td class="label-cell"></td>';
  items.forEach((p, i) => {
    const sel = i === selectedIdx ? " col-selected" : "";
    html += '<td class="col-head' + sel + '" data-idx="' + i + '">' + ageLabelOf(p) + "</td>";
  });
  html += "</tr>";
  rows.forEach((row) => {
    html += '<tr><td class="label-cell">' + row.label + "</td>";
    items.forEach((p, i) => {
      const sel = i === selectedIdx ? " col-selected" : "";
      html += '<td class="' + sel.trim() + '">' + row.cell(p) + "</td>";
    });
    html += "</tr>";
  });
  html += "</tbody></table>";
  return html;
}

function renderDayun(data) {
  const dayunContainer = document.getElementById("dayunTable");
  dayunContainer.innerHTML = buildDayunTable(
    data.daYunList,
    selectedDayun,
    (p) => '<span class="age-label">' + p.startYear + "</span>" + p.startAge + "歲"
  );
  Array.from(dayunContainer.querySelectorAll(".col-head")).forEach((cell) => {
    cell.onclick = function () {
      selectedDayun = Number(this.dataset.idx);
      selectedLiunian = null;
      renderDayun(data);
    };
  });

  const dy = data.daYunList[selectedDayun];
  document.getElementById("liunianLabel").textContent =
    "流年（" + dy.liunian[dy.liunian.length - 1].year + " - " + dy.liunian[0].year + "）";

  if (selectedLiunian === null) {
    const idx = dy.liunian.findIndex((ln) => ln.isCurrent);
    selectedLiunian = idx >= 0 ? idx : 0;
  }

  const liunianContainer = document.getElementById("liunianTable");
  liunianContainer.innerHTML = buildDayunTable(
    dy.liunian,
    selectedLiunian,
    (p) => '<span class="age-label">' + p.year + "</span>" + p.age + "歲"
  );
  Array.from(liunianContainer.querySelectorAll(".col-head")).forEach((cell) => {
    cell.onclick = function () {
      selectedLiunian = Number(this.dataset.idx);
      renderDayun(data);
    };
  });
}

function unconfirmedSpan() {
  return '<span class="renge-unconfirmed">待確認</span>';
}

function renderRenge(data) {
  document.getElementById("rengeCard").style.display = "block";

  const info = document.getElementById("rengeInfoPanel");
  info.innerHTML =
    "<p>姓名：" + data.name + "</p>" +
    "<p>生日（西元年/月/日）：" + data.birthDisplay + "</p>" +
    "<p>擇日（西元年/月/日）：" + data.choiceDisplay + "</p>";

  let stageHtml = '<table class="renge-stage-table"><tr><td class="renge-stage-label">歲數</td>';
  data.stages.forEach((s) => {
    stageHtml += '<td class="' + (s.current ? "renge-stage-current" : "") + '">' + s.label.replace("\n", "<br>") + "</td>";
  });
  stageHtml += '</tr><tr><td class="renge-stage-label">階段數<span class="dot orange"></span></td>';
  data.stages.forEach((s) => {
    let cell;
    if (s.needsHour) cell = '<span class="renge-unconfirmed">需填出生時間</span>';
    else if (s.unconfirmed) cell = unconfirmedSpan();
    else cell = s.value;
    stageHtml += '<td class="renge-stage-value' + (s.current ? " renge-stage-current" : "") + '">' + cell + "</td>";
  });
  stageHtml += "</tr></table>";
  document.getElementById("rengeStageTable").innerHTML = stageHtml;

  let codeHtml = '<table class="renge-code-table">';
  for (let r = 0; r < 3; r++) {
    codeHtml += "<tr>";
    for (let c = 0; c < 4; c++) {
      const line = data.codeLines[r * 4 + c];
      const cls = line.matched ? "matched" : "";
      codeHtml +=
        '<td class="' + cls + '"><span class="code-name">' + line.name + "</span>" +
        '<span class="code-num">' + line.nums.join("") + "</span>" +
        '<span class="code-shadow">' + line.shadow + "</span></td>";
    }
    codeHtml += "</tr>";
  }
  codeHtml += "</table>";
  document.getElementById("rengeCodeTable").innerHTML = codeHtml;

  document.getElementById("rengeNumberBoxes").innerHTML =
    '<div class="renge-number-box"><div class="label">生日數<span class="dot green"></span></div><div class="value">' + data.birthDisplay + "</div></div>" +
    '<div class="renge-number-box dark"><div class="label">天賦數<span class="dot pink"></span></div><div class="value">' + data.talentDisplay + "</div></div>" +
    '<div class="renge-number-box dark"><div class="label">主命數<span class="dot blue"></span></div><div class="value">' + data.mainNumber + "</div></div>";

  document.getElementById("rengeEnergyRow").innerHTML =
    '<div class="renge-energy-box"><div class="label">年數能量<span class="dot purple"></span></div><div class="value">' + data.yearEnergy + "</div></div>" +
    '<div class="renge-energy-box"><div class="label">月數能量</div><div class="value">' + data.monthEnergy + "</div></div>" +
    '<div class="renge-energy-box"><div class="label">日數能量</div><div class="value">' + data.dayEnergy + "</div></div>" +
    '<div class="renge-energy-box"><div class="label">空缺數</div><div class="value">' + (data.gapNumbers.length ? data.gapNumbers.join(",") : "無") + "</div></div>";

  // 電池滿格固定 10 格：先疊有顏色的格數，剩下的格數用灰色補滿（比照參考網站的電池圖示）
  const ENERGY_COLORS = ["blue", "pink", "green", "orange", "purple"];
  const BATTERY_SLOTS = 10;
  document.getElementById("rengeEnergyGrid").innerHTML = data.energyGrid.map((cell) => {
    const segs = [];
    ENERGY_COLORS.forEach((c) => {
      for (let i = 0; i < cell[c]; i++) segs.push('<div class="renge-energy-seg ' + c + '"></div>');
    });
    while (segs.length < BATTERY_SLOTS) segs.push('<div class="renge-energy-seg grey"></div>');
    return (
      '<div class="renge-energy-cell"><span class="digit">' + cell.digit + "</span>" +
      '<div class="renge-energy-bar">' + segs.join("") + "</div></div>"
    );
  }).join("");
}

document.getElementById("exportRengePdfBtn").addEventListener("click", async function () {
  const btn = this;
  const originalLabel = btn.textContent;
  btn.disabled = true;
  btn.textContent = "匯出中...";
  try {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4", true);
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10;

    const logoImg = document.querySelector(".brand img");
    pdf.addImage(logoImg, "PNG", margin, 8, 12, 12);
    const title = textToImage("Aries9419 人格解碼報告", 20, "#212529");
    pdf.addImage(title.dataUrl, "PNG", margin + 16, 8 + (12 - title.heightMM) / 2, title.widthMM, title.heightMM);

    const rengeCanvas = await html2canvas(document.getElementById("rengeCard"), { scale: 1.5, backgroundColor: "#F5D800" });
    addCanvasToPdf(pdf, rengeCanvas, margin, pageWidth, pageHeight, 26);

    const filename = (currentRenge ? currentRenge.name : "人格解碼") + "-人格解碼報告.pdf";
    pdf.save(filename);
  } catch (err) {
    alert("匯出失敗：" + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = originalLabel;
  }
});

// 九宮格排版：1/2/3、4/5/6、7/8/9,0（0 額外放在第 3 列第 4 欄），用明確的 row/col 定位，不依賴 CSS auto-flow
const LIFENUM_GRID_LAYOUT = [
  { d: 1, row: 1, col: 1 }, { d: 2, row: 1, col: 2 }, { d: 3, row: 1, col: 3 },
  { d: 4, row: 2, col: 1 }, { d: 5, row: 2, col: 2 }, { d: 6, row: 2, col: 3 },
  { d: 7, row: 3, col: 1 }, { d: 8, row: 3, col: 2 }, { d: 9, row: 3, col: 3 }, { d: 0, row: 3, col: 4 }
];

function renderLifenum(data) {
  document.getElementById("lifenumCard").style.display = "block";

  // 左邊的 1-9,0 對照格：依 gridMarks 疊圓圈(生日本身)/三角形(三者之合化簡過程)/方框(生命密碼)
  let gridHtml = '<div class="lifenum-grid">';
  LIFENUM_GRID_LAYOUT.forEach(({ d, row, col }) => {
    const m = data.gridMarks[d];
    let marks = "";
    if (m.circle) marks += '<span class="ln-mark">○</span>';
    for (let i = 0; i < m.triangle; i++) marks += '<span class="ln-mark">△</span>';
    if (m.square) marks += '<span class="ln-mark">□</span>';
    gridHtml += '<div class="lifenum-grid-cell" style="grid-row:' + row + ";grid-column:" + col + '"><span class="ln-digit">' + d + '</span><span class="ln-marks">' + marks + "</span></div>";
  });
  gridHtml += "</div>";
  document.getElementById("lifenumGridBox").innerHTML = gridHtml;

  const yStr = String(data.year);
  const mStr = String(data.month).padStart(2, "0");
  const dStr = String(data.day).padStart(2, "0");

  let mainHtml = '<table class="lifenum-main-table">';
  mainHtml +=
    "<tr><td class=\"ln-label\">姓名</td><td class=\"ln-value\" colspan=\"2\">" + (data.name || "") + "</td>" +
    '<td class="ln-label blue">西元出生年</td><td class="ln-value">' + yStr + "</td>" +
    '<td class="ln-label blue">月</td><td class="ln-value">' + mStr + "</td>" +
    '<td class="ln-label blue">日</td><td class="ln-value">' + dStr + "</td>" +
    '<td class="ln-label green">三者之合</td><td class="ln-value">' + data.sanZheDisplay + "</td>" +
    '<td class="ln-label pink">生命密碼</td><td class="ln-value strong">' + data.lifeCode + "</td></tr>";
  mainHtml +=
    '<tr><td class="ln-label pink" colspan="3">人生功課</td><td class="ln-value" colspan="5">' + data.lifeLesson + "</td>" +
    '<td class="ln-label pink" colspan="3">補數</td><td class="ln-value" colspan="3">' +
    (data.complementNumbers.length ? data.complementNumbers.join("、") : "無") + "</td></tr>";
  mainHtml +=
    '<tr><td class="ln-label blue" colspan="3">影響最大的數</td><td class="ln-value" colspan="5">' +
    (data.mostInfluential.length ? data.mostInfluential.join("、") : "—") + "</td>" +
    '<td class="ln-label blue" colspan="3">別人眼中的你</td><td class="ln-value" colspan="3">' + data.otherSideView + "</td></tr>";

  const starText = data.star
    ? data.star.number + "．" + data.star.trigram + "．" + data.star.wuxing + "（" + data.star.planet + "）" +
      (data.star.hasSecond ? "<br><span class=\"ln-note\">農曆生日在中秋後，40歲後轉換為：" + data.star.secondNumber + "．" + data.star.secondInfo.trigram + "．" + data.star.secondInfo.wuxing + "</span>" : "")
    : '<span class="renge-unconfirmed">請先選擇性別</span>';
  const colorText = data.colorGroups
    ? data.colorGroups.map((g) => "<div><b>" + g.relation + "：</b>" + g.colors.join("／") + "</div>").join("")
    : "—";
  mainHtml +=
    '<tr><td class="ln-label green" colspan="3">九星五行</td><td class="ln-value" colspan="5">' + starText + "</td>" +
    '<td class="ln-label green" colspan="3">帶來加分的顏色</td><td class="ln-value" colspan="3">' + colorText + "</td></tr>";
  mainHtml += "</table>";
  document.getElementById("lifenumMainTable").innerHTML = mainHtml;

  document.getElementById("lifenumTypeBox").innerHTML =
    '<table class="lifenum-type-table">' +
    [0, 3, 6].map((row) =>
      "<tr>" + LIFENUM_TYPE_BOX.slice(row, row + 3).map((t) =>
        '<td class="lt-' + t.color + '"><div class="lt-name">' + t.name + "（" + t.n + "）</div><div class=\"lt-desc\">" + t.desc + "</div></td>"
      ).join("") + "</tr>"
    ).join("") +
    "</table>";

  document.getElementById("lifenumCodeLines").innerHTML =
    '<table class="lifenum-lines-table">' +
    [0, 4, 8].map((row) =>
      "<tr>" + data.codeLines.slice(row, row + 4).map((l) =>
        '<td class="' + (l.matched ? "matched" : "") + '"><span class="ll-num">' + l.nums.join("") + "</span><span class=\"ll-name\">" + l.name + "</span></td>"
      ).join("") + "</tr>"
    ).join("") +
    "</table>";

  const trait = data.trait;
  document.getElementById("lifenumTraitCard").innerHTML = trait
    ? "<h3>生命密碼 " + data.lifeCode + "：" + trait.title + "</h3>" +
      '<div class="lt-plus">' + trait.plus.map((t) => "<p>(+) " + t + "</p>").join("") + "</div>" +
      '<div class="lt-minus">' + trait.minus.map((t) => "<p>(－) " + t + "</p>").join("") + "</div>" +
      "<h4>人生功課 " + data.lifeLesson + "</h4><p class=\"ln-lesson\">" + data.lifeLessonText + "</p>"
    : "";

  document.getElementById("lifenumStarCard").innerHTML = data.star
    ? "<h3>九星五行 " + data.star.number + "．" + data.star.trigram + "．" + data.star.wuxing + "（" + data.star.type + "）</h3>" +
      "<p>" + data.star.desc + "</p><p class=\"ln-health\">健康：" + data.star.health + "</p>"
    : "";
}
