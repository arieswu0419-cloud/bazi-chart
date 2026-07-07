let currentChart = null;
let selectedDayun = null;
let selectedLiunian = null;

requireApprovedUser(function () {});

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
