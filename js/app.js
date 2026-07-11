let currentChart = null;
let selectedDayun = null;
let selectedLiunian = null;
let currentRenge = null;
let currentLifenum = null;
let currentQimen = null;

// 右上角浮出提示（取代 alert()，避免整頁被原生對話框卡住），跟 admin.js 的 adminMsg() 同一套 3 秒自動消失邏輯
function showToast(text, type) {
  const el = document.getElementById("navToast");
  el.textContent = text;
  el.className = "form-msg nav-toast show " + type;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { el.className = "form-msg nav-toast"; }, 3000);
}

// 權限計算：跟 js/admin.js 的 effectivePermissions() 是同一套規則，畫面初始狀態才會一致。
// 帳號完全沒有 permissions 欄位＝這個權限系統上線前就已核准的舊帳號，八字／人格解碼／生命靈數／奇門命盤
// 沿用舊行為視為開放（那時候就已經在用了，不能讓人一覺醒來被鎖住）；五個新的導覽功能（奇門遁甲／觀音棋卦／
// 濟公棋卦／陽宅風水／名片風水）本來就沒有上線過，一律預設關閉，要管理者手動開通。
// 帳號有 permissions 欄位但沒有某個新欄位（簽入舊版三欄位物件的帳號）：qimen 沿用「舊帳號視為開放」的邏輯
// （避免現有使用者權限系統上線後突然失去奇門命盤的使用權），其餘新欄位一律視為未開放。
function effectivePermissions(data) {
  const raw = data.permissions;
  if (!raw) {
    return { bazi: true, renge: true, lifenum: true, qimen: true, qimenDunjia: false, guanyin: false, jigong: false, fengshui: false, mingpian: false };
  }
  return {
    bazi: !!raw.bazi,
    renge: !!raw.renge,
    lifenum: !!raw.lifenum,
    qimen: raw.qimen !== undefined ? !!raw.qimen : true,
    qimenDunjia: !!raw.qimenDunjia,
    guanyin: !!raw.guanyin,
    jigong: !!raw.jigong,
    fengshui: !!raw.fengshui,
    mingpian: !!raw.mingpian
  };
}

let currentPerms = null;

requireApprovedUser(function (user, data) {
  if (user.email === ADMIN_EMAIL) {
    document.getElementById("adminLink").style.display = "";
  }

  const perms = effectivePermissions(data);
  currentPerms = perms;

  if (!perms.bazi) {
    document.getElementById("baziSubmitBtn").style.display = "none";
    document.getElementById("tabBazi").style.display = "none";
  }
  if (!perms.renge) {
    document.getElementById("rengeSubmitBtn").style.display = "none";
    document.getElementById("tabRenge").style.display = "none";
  }
  if (!perms.lifenum) {
    document.getElementById("lifenumSubmitBtn").style.display = "none";
    document.getElementById("tabLifenum").style.display = "none";
  }
  if (!perms.qimen) {
    document.getElementById("qimenSubmitBtn").style.display = "none";
    document.getElementById("tabQimen").style.display = "none";
  }

  if (!perms.bazi && !perms.renge && !perms.lifenum && !perms.qimen) {
    document.getElementById("permissionNote").style.display = "";
  } else if (!perms.bazi) {
    // 預設頁籤是八字報告，如果這個人沒有八字權限，切到他有權限的第一個頁籤，避免打開就是空白頁
    setActiveTab(perms.renge ? "renge" : (perms.lifenum ? "lifenum" : "qimen"));
  }

  // 上方綠色區塊的五個新功能導覽按鍵：有權限就顯示「開發中」提示，沒有權限就提示未開放
  const navPermKeys = { qimenDunjia: "奇門遁甲", guanyin: "觀音棋卦", jigong: "濟公棋卦", fengshui: "陽宅風水", mingpian: "名片風水" };
  document.querySelectorAll(".main-nav-link[data-feature]").forEach((btn) => {
    const key = btn.dataset.perm;
    btn.addEventListener("click", function () {
      if (!perms[key]) {
        showToast("此功能您未發放權限", "error");
        return;
      }
      showToast(navPermKeys[key] + "功能開發中，敬請期待。", "info");
    });
  });
});

// 擇日欄位（選日子）／出生年月日時欄位：都是年/月/日(/時)下拉，預設今天（出生時間也預設現在，使用者可自行修改）
function fillYearMonthDaySelects(yearSel, monthSel, daySel, today) {
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
}
(function initDateFields() {
  const today = new Date();
  fillYearMonthDaySelects(
    document.getElementById("f-qyear"), document.getElementById("f-qmonth"), document.getElementById("f-qday"), today
  );
  fillYearMonthDaySelects(
    document.getElementById("f-byear"), document.getElementById("f-bmonth"), document.getElementById("f-bday"), today
  );
  // 時間欄位維持單一個 <input type="time">（24 小時制 HH:MM 一欄），不拆成時／分兩個下拉選單；
  // 分鐘精度還是保留在這欄裡面，24 節氣交界時刻的判斷不受影響
  document.getElementById("f-btime").value =
    String(today.getHours()).padStart(2, "0") + ":" + String(today.getMinutes()).padStart(2, "0");
})();

// 出生日期／時間：組成跟原本 <input type="date">/<input type="time"> 一樣格式的字串（YYYY-MM-DD／HH:MM），
// 給下面各報告的 submit handler 沿用同一套讀值方式
function getBirthDateVal() {
  const y = document.getElementById("f-byear").value;
  const m = String(document.getElementById("f-bmonth").value).padStart(2, "0");
  const d = String(document.getElementById("f-bday").value).padStart(2, "0");
  return y + "-" + m + "-" + d;
}
function getBirthTimeVal() {
  return document.getElementById("f-btime").value;
}

// 頁籤切換：八字報告／人格解碼報告／生命靈數／奇門遁甲
function setActiveTab(tab) {
  document.getElementById("tabBazi").classList.toggle("active", tab === "bazi");
  document.getElementById("tabRenge").classList.toggle("active", tab === "renge");
  document.getElementById("tabLifenum").classList.toggle("active", tab === "lifenum");
  document.getElementById("tabQimen").classList.toggle("active", tab === "qimen");
  document.getElementById("baziTabPanel").style.display = tab === "bazi" ? "" : "none";
  document.getElementById("rengeTabPanel").style.display = tab === "renge" ? "" : "none";
  document.getElementById("lifenumTabPanel").style.display = tab === "lifenum" ? "" : "none";
  document.getElementById("qimenTabPanel").style.display = tab === "qimen" ? "" : "none";
}
document.getElementById("tabBazi").addEventListener("click", function () { setActiveTab("bazi"); });
document.getElementById("tabRenge").addEventListener("click", function () { setActiveTab("renge"); });
document.getElementById("tabLifenum").addEventListener("click", function () { setActiveTab("lifenum"); });
document.getElementById("tabQimen").addEventListener("click", function () { setActiveTab("qimen"); });

document.getElementById("rengeSubmitBtn").addEventListener("click", function () {
  const name = document.getElementById("f-name").value.trim();
  const dateVal = getBirthDateVal();
  if (!name || !dateVal) {
    alert("請先輸入姓名與出生日期（國曆）");
    return;
  }
  const [year, month, day] = dateVal.split("-").map(Number);
  const qYear = Number(document.getElementById("f-qyear").value);
  const qMonth = Number(document.getElementById("f-qmonth").value);
  const qDay = Number(document.getElementById("f-qday").value);
  // 0-19 階段數需要出生時辰才能算，跟八字報告共用同一個「出生時間」欄位
  const timeVal = getBirthTimeVal();
  const hour = timeVal ? Number(timeVal.split(":")[0]) : null;

  currentRenge = calculateRenge({ year, month, day, qYear, qMonth, qDay, hour, name });
  renderRenge(currentRenge);
  setActiveTab("renge");
});

document.getElementById("lifenumSubmitBtn").addEventListener("click", function () {
  const name = document.getElementById("f-name").value.trim();
  const dateVal = getBirthDateVal();
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

document.getElementById("qimenSubmitBtn").addEventListener("click", function () {
  const name = document.getElementById("f-name").value.trim();
  const dateVal = getBirthDateVal();
  const timeVal = getBirthTimeVal();
  if (!name || !dateVal || !timeVal) {
    alert("請先輸入姓名、出生日期（國曆）與出生時間");
    return;
  }
  const [year, month, day] = dateVal.split("-").map(Number);
  const [hour, minute] = timeVal.split(":").map(Number);
  const gender = document.getElementById("f-gender").value;

  currentQimen = calculateQimenHeader({ year, month, day, hour, minute, name, gender });
  renderQimen(currentQimen);
  setActiveTab("qimen");
});

// 紫微斗數報告：功能尚未開發，先放按鍵佔位
document.getElementById("qimenDivineSubmitBtn").addEventListener("click", function () {
  showToast("紫微斗數報告功能開發中，敬請期待。", "info");
});

document.getElementById("baziForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const name = document.getElementById("f-name").value.trim();
  const gender = document.getElementById("f-gender").value;
  const dateVal = getBirthDateVal();
  const timeVal = getBirthTimeVal();
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

// 依「區塊」逐一畫進 PDF：每個區塊（例如一個表格／一張卡片）先各自 html2canvas 轉成圖片，
// 如果整塊放不進當頁剩餘空間，就直接整塊換到下一頁，不會像單一大圖那樣被硬切一半；
// 只有單一區塊本身就比一整頁還高時，才不得已用 addCanvasToPdf 的切頁邏輯畫（沒有更好的辦法）。
async function addSectionsToPdf(pdf, sections, margin, pageWidth, pageHeight, startY, backgroundColor) {
  const imgWidth = pageWidth - margin * 2;
  const maxHeight = pageHeight - margin * 2;
  let y = startY;
  for (const el of sections) {
    const canvas = await html2canvas(el, { scale: 1.5, backgroundColor: backgroundColor || "#ffffff" });
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    if (imgHeight > maxHeight) {
      if (y > startY) { pdf.addPage(); y = margin; }
      y = addCanvasToPdf(pdf, canvas, margin, pageWidth, pageHeight, y) + 6;
      continue;
    }
    if (y + imgHeight > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.85), "JPEG", margin, y, imgWidth, imgHeight);
    y += imgHeight + 6;
  }
  return y;
}

// 每一頁下方置中加上「頁次/總頁次」，數字跟斜線 jsPDF 內建字型就能畫，不用像中文標題那樣先轉成圖片；
// 要等所有內容都畫完、確定總頁數之後才能跑這段，所以固定放在 pdf.save() 之前呼叫
function addPageNumbers(pdf, pageWidth, pageHeight) {
  const total = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    pdf.setPage(i);
    pdf.setFontSize(10);
    pdf.setTextColor(120, 120, 120);
    pdf.text(i + " / " + total, pageWidth / 2, pageHeight - 6, { align: "center" });
  }
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
    const title = textToImage("Aries 奇門遁甲命盤報告", 20, "#212529");
    pdf.addImage(title.dataUrl, "PNG", margin + 16, 8 + (12 - title.heightMM) / 2, title.widthMM, title.heightMM);

    // 逐區塊（命盤資訊／四柱表格／天干地支合沖／五行十神）換頁，避免任何一個表格被硬切一半
    const resultSections = Array.from(document.querySelectorAll("#resultCard > *:not(.card-head)"));
    await addSectionsToPdf(pdf, resultSections, margin, pageWidth, pageHeight, 26);

    // 大運流年另外強制換頁，不要被切一半；表格說明文字（點選欄位標題...）不匯出
    pdf.addPage();
    const dayunSections = Array.from(document.querySelectorAll("#dayunCard > *"));
    const dayunBottom = await addSectionsToPdf(pdf, dayunSections, margin, pageWidth, pageHeight, margin);

    const closing = textToImage("-----八字報告請交由專業人士分析-----", 12, "#5F5E5A");
    let closingY = dayunBottom + 8;
    if (closingY + closing.heightMM > pageHeight - margin) {
      pdf.addPage();
      closingY = margin;
    }
    pdf.addImage(closing.dataUrl, "PNG", (pageWidth - closing.widthMM) / 2, closingY, closing.widthMM, closing.heightMM);

    addPageNumbers(pdf, pageWidth, pageHeight);

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
    const title = textToImage("Aries 奇門遁甲命盤報告", 20, "#212529");
    pdf.addImage(title.dataUrl, "PNG", margin + 16, 8 + (12 - title.heightMM) / 2, title.widthMM, title.heightMM);

    // 逐區塊（基本資訊／生日數天賦數主命數／人生階段能量／九宮連線密碼與能量圖）換頁，避免表格被硬切一半
    const rengeSections = Array.from(document.querySelectorAll("#rengeCard > *:not(.card-head)"));
    await addSectionsToPdf(pdf, rengeSections, margin, pageWidth, pageHeight, 26, "#F5D800");

    addPageNumbers(pdf, pageWidth, pageHeight);

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

// 圈記號用 SVG 畫同心圖形：圓圈(深灰)/三角形(藍，正三角形)/正方形(紅，加粗)，同一種形狀出現多次就疊出對應數量的同心圖形
const LN_MARK_COLORS = { circle: "#4B4B4B", triangle: "#1D4ED8", square: "#C0392B" };
function lifenumTrianglePoints(cx, cy, R) {
  // 正三角形（等邊三角形）：三個頂點都在半徑 R 的圓上，角度間隔 120 度（-90°/150°/30°）
  const top = cx + "," + (cy - R);
  const bl = (cx - R * 0.866) + "," + (cy + R * 0.5);
  const br = (cx + R * 0.866) + "," + (cy + R * 0.5);
  return top + " " + bl + " " + br;
}
function lifenumMarkSvg(digit, m) {
  const cx = 28, cy = 28;
  let shapes = "";
  // 由外而內畫，數量越多同心圖形越密；圓圈/三角形/正方形各自獨立疊加，半徑跟著數量遞減
  for (let i = 0; i < m.circle; i++) {
    const r = 22 - i * 4;
    if (r > 3) shapes += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + LN_MARK_COLORS.circle + '" stroke-width="1.6"/>';
  }
  for (let i = 0; i < m.triangle; i++) {
    // 三角形整體比圓圈略小一點
    const r = (20 - i * 5) * 0.85;
    if (r > 3) shapes += '<polygon points="' + lifenumTrianglePoints(cx, cy, r) + '" fill="none" stroke="' + LN_MARK_COLORS.triangle + '" stroke-width="1.6"/>';
  }
  for (let i = 0; i < m.square; i++) {
    const half = 17 - i * 4;
    if (half > 2) shapes += '<rect x="' + (cx - half) + '" y="' + (cy - half) + '" width="' + (half * 2) + '" height="' + (half * 2) + '" fill="none" stroke="' + LN_MARK_COLORS.square + '" stroke-width="2.6"/>';
  }
  return (
    '<svg viewBox="0 0 56 56" class="ln-mark-svg">' + shapes +
    '<text x="' + cx + '" y="' + (cy + 1) + '" text-anchor="middle" dominant-baseline="central" font-style="italic" font-size="19" fill="#212529">' + digit + "</text>" +
    "</svg>"
  );
}

function renderLifenum(data) {
  document.getElementById("lifenumCard").style.display = "block";

  // 左邊的 1-9,0 對照格：依 gridMarks 疊圓圈(生日本身)/三角形(三者之合化簡過程)/方框(生命密碼)
  let gridHtml = '<div class="lifenum-grid">';
  LIFENUM_GRID_LAYOUT.forEach(({ d, row, col }) => {
    gridHtml += '<div class="lifenum-grid-cell" style="grid-row:' + row + ";grid-column:" + col + '">' + lifenumMarkSvg(d, data.gridMarks[d]) + "</div>";
  });
  gridHtml += "</div>";

  // 右邊新增一個累計數量表：跟左邊同一份 digitCounts（圓圈1/三角形2/方框4 加總），純文字呈現「數字 + 有N個」
  let countHtml = '<div class="lifenum-count-grid">';
  LIFENUM_GRID_LAYOUT.forEach(({ d, row, col }) => {
    countHtml +=
      '<div class="lifenum-count-cell" style="grid-row:' + row + ";grid-column:" + col + '">' +
      '<div class="lc-digit">' + d + "</div>" +
      '<div class="lc-count">有 <span class="lc-num">' + data.digitCounts[d] + "</span> 個</div>" +
      "</div>";
  });
  countHtml += "</div>";

  document.getElementById("lifenumGridBox").innerHTML = '<div class="lifenum-grid-row">' + gridHtml + countHtml + "</div>";

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
    ? "<div>40歲以前：<b>" + data.star.number + "．" + data.star.trigram + "．" + data.star.wuxing + "</b>（" + data.star.planet + "）</div>" +
      (data.star.hasSecond
        ? "<div>40歲以後：<b>" + data.star.secondNumber + "．" + data.star.secondInfo.trigram + "．" + data.star.secondInfo.wuxing + "</b>（" + data.star.secondInfo.planet + "）</div>"
        : "")
    : '<span class="renge-unconfirmed">請先選擇性別</span>';
  const colorGroupHtml = (groups) => groups.map((g) => "<div><b>" + g.relation + "：</b>" + g.colors.join("／") + "</div>").join("");
  const colorText = data.colorGroups
    ? (data.star.hasSecond
        ? "<div class=\"ln-color-group\"><u>40歲以前</u>" + colorGroupHtml(data.colorGroups) + "</div>" +
          "<div class=\"ln-color-group\"><u>40歲以後</u>" + colorGroupHtml(data.secondColorGroups) + "</div>"
        : colorGroupHtml(data.colorGroups))
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
      '<div class="lt-minus">' + trait.minus.map((t) => "<p>(－) " + t + "</p>").join("") + "</div>"
    : "";

  // 人生功課：內容取自「人生功課.pdf」，含計算過程＋對應的缺憾數解讀文字
  document.getElementById("lifenumLessonCard").innerHTML =
    "<h3>人生功課 " + data.lifeLesson + "</h3>" +
    '<p class="ln-calc">計算方式：日基數與月基數相減，所得的數字。' + data.lifeLessonCalc + "</p>" +
    '<p class="ln-lesson">' + data.lifeLessonText + "</p>";

  function starBlock(title, info) {
    return (
      "<h3>" + title + " " + info.number + "．" + info.trigram + "．" + info.wuxing + "《" + info.planet + "》</h3>" +
      "<p>" + info.desc + "</p>" +
      '<p class="ln-health">健康：' + info.health + "</p>" +
      '<p class="ln-bed">您最適合的床單顏色是～五行屬《' + info.bedGood.split("：")[0] + "》的顏色：" + info.bedGood.split("：")[1] + "</p>" +
      '<p class="ln-bed">您不適合的床單顏色是～五行屬《' + info.bedBad.split("：")[0] + "》的顏色：" + info.bedBad.split("：")[1] + "</p>"
    );
  }
  // 九星：內容取自「九星五行.pdf」，含個性、健康、床單顏色建議；中秋後出生者 40 歲後轉換的第二個星另外列出
  document.getElementById("lifenumStarCard").innerHTML = data.star
    ? starBlock("九星五行（40歲以前）", data.star) +
      (data.star.hasSecond ? '<hr class="ln-divider">' + starBlock("九星五行（40歲以後）", data.star.secondInfo) : "")
    : "";

  function traitBlock(title, trait) {
    return (
      "<h3>" + title + "</h3>" +
      '<div class="lt-plus">' + trait.plus.map((t) => "<p>(+) " + t + "</p>").join("") + "</div>" +
      '<div class="lt-minus">' + trait.minus.map((t) => "<p>(－) " + t + "</p>").join("") + "</div>"
    );
  }
  // 別人眼中的你／影響最大的數：對照同一份 1-9 個性解讀表（LINE_NOTE_260709_4.jpg／_5.jpg）
  document.getElementById("lifenumOtherSideCard").innerHTML = data.otherSideTrait
    ? traitBlock("別人眼中的你 " + data.otherSideView + "：" + data.otherSideTrait.title, data.otherSideTrait)
    : "";

  document.getElementById("lifenumMostInfluentialCard").innerHTML = data.mostInfluentialTraits.length
    ? data.mostInfluentialTraits.map((mt) =>
        traitBlock("影響最大的數 " + mt.digit + "：" + mt.trait.title, mt.trait)
      ).join('<hr class="ln-divider">')
    : "";

  // 補數使用建議：內容取自課程 PPT 82 頁，水晶珠珠依補數顆數／顏色使用，4/7/8 另有特定用途
  const complementList = data.complementDetails.length
    ? data.complementDetails.map((c) =>
        "<li>補數 <b>" + c.digit + "</b>（" + c.colorName + "）" + (c.usage ? "：可用 " + c.digit + " 顆水晶珠，用途「" + c.usage + "」" : "：可用該數字顏色的水晶珠，依需求佩戴") + "</li>"
      ).join("")
    : "<li>沒有缺（補數），代表這個人本身沒有明顯缺乏的數字特質</li>";
  const lineBenefitHtml = data.complementLineBenefits.length
    ? "<p>補數剛好湊成以下連線，可以視需求特別補強：" + data.complementLineBenefits.map((b) => b.nums + "→" + b.benefit).join("、") + "</p>"
    : "";
  document.getElementById("lifenumComplementCard").innerHTML =
    "<h3>補數怎麼用</h3>" +
    "<ul class=\"ln-complement-list\">" + complementList + "</ul>" +
    lineBenefitHtml +
    '<p class="ln-note">生命靈數的缺數（補數）建議買水晶珠珠佩戴，不建議串成手鍊或項鍊；補數水晶珠以顏色為數字能量（依需求使用），也可依需求常用該數字。每個人的生命屬性不同，沒有好壞區分：沒有缺就代表相對不會呈現這個數字的缺點，一樣可以視特定需求做補數連線。</p>';

  // 五行健康對照：內容取自課程講義的五行相生圖（器官／情緒失衡／顏色），並標示使用者本身九星對應的五行
  document.getElementById("lifenumWuxingHealthCard").innerHTML =
    "<h3>五行與健康</h3>" +
    '<table class="lifenum-wuxing-table">' +
    "<tr><td>五行</td><td>對應器官</td><td>情緒失衡</td><td>對應顏色</td></tr>" +
    data.wuxingHealth.map((w) =>
      "<tr" + (data.star && data.star.wuxing === w.wuxing ? ' class="ln-my-wuxing"' : "") + ">" +
      "<td>" + w.wuxing + "</td><td>" + w.organs + "</td><td>" + w.emotion + "</td><td>" + w.colors.join("／") + "</td></tr>"
    ).join("") +
    "</table>" +
    (data.star ? '<p class="ln-note">您本身九星五行屬「' + data.star.wuxing + '」，上表粉紅底色請您特別注意器官與情緒。</p>' : "");
}

// 奇門遁甲：上方四柱表格（時日月年），跟八字報告同一種天干地支呈現方式，但沒有十神／藏干／神煞列
function buildQimenPillarsTable(siZhu) {
  let html = '<table class="qimen-pillars-table"><tbody><tr>';
  siZhu.forEach((p) => { html += '<td class="col-head">' + p.label.replace("柱", "") + "</td>"; });
  html += "</tr><tr>";
  siZhu.forEach((p) => { html += "<td>" + charCell(p.gan) + "</td>"; });
  html += "</tr><tr>";
  siZhu.forEach((p) => { html += "<td>" + charCell(p.zhi) + "</td>"; });
  html += "</tr></tbody></table>";
  return html;
}

// 右上資訊表格：陽曆／符首、農曆／天乙、時間／值符、格局／值使，兩兩並排（比照參考畫面排版）
function buildQimenInfoTable(data) {
  const rows = [
    ["陽曆", data.solarText, "符首", data.xunShou.xun],
    ["農曆", data.lunarText, "天乙", data.tianYi.dir],
    ["時間", data.solarText.split(" ")[1], "值符", data.fuShouXing],
    ["格局", data.patternText, "值使", GONG_INFO[data.menTargetGong].dir]
  ];
  let html = '<table class="qimen-info-table"><tbody>';
  html += '<tr><td class="qi-label">姓名</td><td class="qi-value" colspan="3">' + (data.name || "") + "</td></tr>";
  rows.forEach((r) => {
    html += "<tr><td class=\"qi-label\">" + r[0] + '</td><td class="qi-value">' + r[1] +
      '</td><td class="qi-label">' + r[2] + '</td><td class="qi-value">' + r[3] + "</td></tr>";
  });
  html += "</tbody></table>";
  return html;
}

// 九宮格排位：跟畫面上實際的方位對應（左上巽4、上離9、右上坤2、左震3、中5、右兌7、左下艮8、下坎1、右下乾6）
const QIMEN_GRID_LAYOUT = [
  { g: 4, row: 1, col: 1 }, { g: 9, row: 1, col: 2 }, { g: 2, row: 1, col: 3 },
  { g: 3, row: 2, col: 1 }, { g: 5, row: 2, col: 2 }, { g: 7, row: 2, col: 3 },
  { g: 8, row: 3, col: 1 }, { g: 1, row: 3, col: 2 }, { g: 6, row: 3, col: 3 }
];
// 八門顏色沿用既有五行色票（休水、死土、傷木、杜木、開金、驚金、生土、景火）
const QIMEN_MEN_COLOR = { 休: "#185FA5", 死: "#854F0B", 傷: "#3B6D11", 杜: "#3B6D11", 開: "#B8860B", 驚: "#B8860B", 生: "#854F0B", 景: "#A32D2D" };
// 九星五行（使用者指定）：天蓬水／天衝天輔木／天英火／天任天芮天禽土／天心天柱金
const QIMEN_XING_WUXING_CLASS = {
  天蓬: "water", 天衝: "wood", 天輔: "wood", 天英: "fire",
  天任: "earth", 天芮: "earth", 天禽: "earth", 天心: "metal", 天柱: "metal"
};
// 八卦五行（使用者指定）：巽震木／艮坤土／坎水／乾兌金／離火
const QIMEN_GUA_WUXING_CLASS = {
  巽: "wood", 震: "wood", 艮: "earth", 坤: "earth",
  坎: "water", 乾: "metal", 兌: "metal", 離: "fire"
};
// 九宮格天盤／地盤干只顯示字本身、依五行上色，不顯示陰陽符號（跟四柱表格的 charCell 不同）
function qimenGanOnly(gan) {
  const p = ganPart(gan);
  return '<span class="qimen-gan-char ' + p.cls + '">' + p.char + "</span>";
}

// 外層羅盤：8 個方位＋宮位數字（固定位置，7x7 格的 4 角＋4 邊中央）
const QIMEN_DIR_LAYOUT = [
  { g: 4, row: 1, col: 1 }, { g: 9, row: 1, col: 4 }, { g: 2, row: 1, col: 7 },
  { g: 3, row: 4, col: 1 }, { g: 7, row: 4, col: 7 },
  { g: 8, row: 7, col: 1 }, { g: 1, row: 7, col: 4 }, { g: 6, row: 7, col: 7 }
];
// 第二層：十二地支，每個邊（上／下／左／右）各自水平／垂直三等分，中間格放四正（子午卯酉，維持水平字），
// 兩側格放其餘 8 個地支（水平邊放橫式字、垂直邊放直式字），不再用「角宮兩支疊放」的舊排法
const QIMEN_ZHI_LAYOUT = [
  { zhi: "辰", row: 3, col: 2, vertical: true },   // 左側上方（巽四宮外側）
  { zhi: "巳", row: 2, col: 3, vertical: false },  // 上方左邊（巽四宮外側）
  { zhi: "午", row: 2, col: 4, vertical: false },  // 上方中間（離九宮，四正）
  { zhi: "未", row: 2, col: 5, vertical: false },  // 上方右邊（坤二宮外側）
  { zhi: "申", row: 3, col: 6, vertical: true },   // 右側上方（坤二宮外側）
  { zhi: "卯", row: 4, col: 2, vertical: false },  // 左側中間（震三宮，四正）
  { zhi: "酉", row: 4, col: 6, vertical: false },  // 右側中間（兌七宮，四正）
  { zhi: "寅", row: 5, col: 2, vertical: true },   // 左側下方（艮八宮外側）
  { zhi: "戌", row: 5, col: 6, vertical: true },   // 右側下方（乾六宮外側）
  { zhi: "丑", row: 6, col: 3, vertical: false },  // 下方左邊（艮八宮外側）
  { zhi: "子", row: 6, col: 4, vertical: false },  // 下方中間（坎一宮，四正）
  { zhi: "亥", row: 6, col: 5, vertical: false }   // 下方右邊（乾六宮外側）
];

function renderQimen(data) {
  document.getElementById("qimenCard").style.display = "block";

  document.getElementById("qimenPillars").innerHTML = buildQimenPillarsTable(data.siZhu);
  document.getElementById("qimenInfoPanel").innerHTML = buildQimenInfoTable(data);

  let gridHtml = "";
  QIMEN_GRID_LAYOUT.forEach(({ g, row, col }) => {
    if (g === 5) {
      // 中宮：跟其它宮位同一套版面（星左上、干右上、卦左下），星固定天禽不動、卦固定坤（中宮寄坤二宮）、
      // 中間圓圈用「命」取代門名，深灰底白字
      const centerGan = data.diPan[5];
      gridHtml +=
        '<div class="qimen-cell qimen-center" style="grid-row:' + row + ";grid-column:" + col + '">' +
        '<div class="qimen-xing earth">天禽</div>' +
        '<div class="qimen-gan-stack">' + qimenGanOnly(centerGan) + qimenGanOnly(centerGan) + "</div>" +
        '<div class="qimen-cell-center">' +
        '<div class="qimen-circle-zone">' +
        '<div class="qimen-men-circle qimen-center-circle">命</div>' +
        "</div>" +
        "</div>" +
        '<div class="qimen-cell-bottom earth">坤</div>' +
        "</div>";
      return;
    }
    const c = data.gongs[g];
    const menColor = QIMEN_MEN_COLOR[c.men] || "#666";
    const xingWx = QIMEN_XING_WUXING_CLASS[c.xing] || "";
    const guaWx = QIMEN_GUA_WUXING_CLASS[c.gua] || "";
    const cornerWords = c.cornerWords || [];
    const wordToSpan = (w) => '<span class="qw-' + w.type + '">' + w.text + "</span>";
    // 右下角最多放 3 組，第 4 組起改放左下角（八卦字右側），一樣由右往左排列，避免跟中下大運文字擠在一起重疊
    const cornerWordsHtml = cornerWords.slice(0, 3).map(wordToSpan).join("");
    const cornerWordsLeftHtml = cornerWords.slice(3).map(wordToSpan).join("");
    gridHtml +=
      '<div class="qimen-cell" style="grid-row:' + row + ";grid-column:" + col + '">' +
      '<div class="qimen-xing ' + xingWx + '">' + (c.xing || "") + "</div>" +
      (c.isMingGong ? '<div class="qimen-ming-circle">命</div>' : "") +
      '<div class="qimen-gan-stack">' + qimenGanOnly(c.tianGan) + qimenGanOnly(c.diGan) + "</div>" +
      '<div class="qimen-shen">' + (c.shen || "") + "</div>" +
      '<div class="qimen-cell-center">' +
      '<div class="qimen-circle-zone">' +
      '<div class="qimen-men-circle" style="background:' + menColor + '">' + (c.men || "") + "</div>" +
      "</div>" +
      '<div class="qimen-bottom-info">' +
      (c.jiXing ? '<div class="qimen-jixing">六儀擊刑</div>' : "") +
      '<div class="qimen-dayun">' + (c.dayunLabel || "") + "</div>" +
      "</div>" +
      "</div>" +
      '<div class="qimen-cell-bottom ' + guaWx + '">' + c.gua + "</div>" +
      '<div class="qimen-corner-words">' + cornerWordsHtml + "</div>" +
      (cornerWordsLeftHtml ? '<div class="qimen-corner-words-left">' + cornerWordsLeftHtml + "</div>" : "") +
      "</div>";
  });

  let compassHtml = "";
  // 十二地支羅盤的連續橘色外框：先鋪一層跨滿整個地支帶（含中間九宮格區域）的金色底＋橘框，
  // 之後畫的九宮格會蓋住中間，只留下地支帶那一圈是連續的，不會在地支跟地支中間露出空隙
  compassHtml += '<div class="qc-zhi-frame" style="grid-row:2/7;grid-column:2/7"></div>';
  const QC_CORNER_GONGS = [2, 4, 6, 8];
  QIMEN_DIR_LAYOUT.forEach(({ g, row, col }) => {
    const dir = GONG_INFO[g].dir;
    if (QC_CORNER_GONGS.includes(g)) {
      // 四隅方（東南／西南／西北／東北）：直式文字，宮位數字放下方
      compassHtml += '<div class="qc-dir qc-dir-corner" style="grid-row:' + row + ";grid-column:" + col + '">' +
        '<span class="qc-dir-text">' + dir + '</span><span class="qc-dir-num">' + g + "</span></div>";
    } else {
      // 四正方（東／西／南／北）：拿掉「正」字
      compassHtml += '<div class="qc-dir" style="grid-row:' + row + ";grid-column:" + col + '">' + dir.replace("正", "") + g + "</div>";
    }
  });
  QIMEN_ZHI_LAYOUT.forEach(({ zhi, row, col, vertical }) => {
    let badges = "";
    if (data.kongWang.includes(zhi)) badges += '<span class="qc-badge qc-badge-kong">空</span>';
    if (data.yiMa === zhi) badges += '<span class="qc-badge qc-badge-yima">馬</span>';
    // 左右兩側（col 2／6）欄位很窄，空亡／驛馬圓圈要換行放在地支下方，不能像上下兩側那樣放在右邊（會被擠出格子）
    const isNarrowCol = col === 2 || col === 6;
    compassHtml += '<div class="qc-zhi-ring" style="grid-row:' + row + ";grid-column:" + col + '">' +
      '<span class="qc-zhi-item' + (isNarrowCol ? " qc-zhi-item-stack" : "") + '"><span' + (vertical ? ' class="qc-zhi-v"' : "") + ">" + zhi + "</span>" + badges + "</span></div>";
  });
  compassHtml += '<div class="qimen-grid" id="qimenGrid">' + gridHtml + "</div>";
  document.getElementById("qimenCompass").innerHTML = compassHtml;
}

document.getElementById("exportQimenPdfBtn").addEventListener("click", async function () {
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
    const title = textToImage("Aries 奇門遁甲命盤報告", 20, "#212529");
    pdf.addImage(title.dataUrl, "PNG", margin + 16, 8 + (12 - title.heightMM) / 2, title.widthMM, title.heightMM);

    const qimenSections = Array.from(document.querySelectorAll("#qimenCard > *:not(.card-head)"));
    await addSectionsToPdf(pdf, qimenSections, margin, pageWidth, pageHeight, 26);

    addPageNumbers(pdf, pageWidth, pageHeight);

    const filename = (currentQimen ? currentQimen.name : "奇門遁甲") + "-奇門遁甲命盤報告.pdf";
    pdf.save(filename);
  } catch (err) {
    alert("匯出失敗：" + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = originalLabel;
  }
});

document.getElementById("exportLifenumPdfBtn").addEventListener("click", async function () {
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
    const title = textToImage("Aries 奇門遁甲命盤報告", 20, "#212529");
    pdf.addImage(title.dataUrl, "PNG", margin + 16, 8 + (12 - title.heightMM) / 2, title.widthMM, title.heightMM);

    // 生命靈數報告內容區塊很多（主表格／九宮格個性說明／連線密碼／各種解讀卡片），逐區塊換頁，
    // 避免同一個表格被硬切成兩半，跨頁看起來斷掉
    const lifenumSections = Array.from(document.querySelectorAll("#lifenumCard > div:not(.card-head)"));
    await addSectionsToPdf(pdf, lifenumSections, margin, pageWidth, pageHeight, 26);

    addPageNumbers(pdf, pageWidth, pageHeight);

    const filename = (currentLifenum ? currentLifenum.name : "生命靈數") + "-生命靈數報告.pdf";
    pdf.save(filename);
  } catch (err) {
    alert("匯出失敗：" + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = originalLabel;
  }
});
