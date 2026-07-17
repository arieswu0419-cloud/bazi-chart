let currentChart = null;
let selectedDayun = null;
let selectedLiunian = null;
let selectedMainPillar = null;
let currentRenge = null;
let currentLifenum = null;
let currentQimen = null;
let currentQimenDunjia = null;

// 上方綠色導覽列的「目前所在頁面」反白狀態：離開「命理諮詢」進到名片風水/數字易經/濟公棋卦等子頁面時，
// 該子頁面的按鍵要換成反白（跟命理諮詢原本的樣式一樣，見 .main-nav-link.active），命理諮詢本身要跟著
// 退回一般樣式；傳 null 代表回到命理諮詢（首頁）。
function setActiveNav(feature) {
  document.querySelectorAll(".main-nav-link").forEach((el) => el.classList.remove("active"));
  if (feature) {
    const btn = document.querySelector('.main-nav-link[data-feature="' + feature + '"]');
    if (btn) btn.classList.add("active");
  } else {
    const homeLink = document.querySelector(".main-nav-link:not([data-feature])");
    if (homeLink) homeLink.classList.add("active");
  }
}

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
// 濟公棋卦／數字易經／名片風水）本來就沒有上線過，一律預設關閉，要管理者手動開通。
// （數字易經沿用舊的 fengshui 權限欄位名稱，只改畫面上顯示的名稱，避免已核准帳號的權限跟著跑掉）
// 帳號有 permissions 欄位但沒有某個新欄位（簽入舊版三欄位物件的帳號）：qimen 沿用「舊帳號視為開放」的邏輯
// （避免現有使用者權限系統上線後突然失去奇門命盤的使用權），其餘新欄位一律視為未開放。
function effectivePermissions(data) {
  const raw = data.permissions;
  if (!raw) {
    return { bazi: true, renge: true, lifenum: true, qimen: true, qimenDunjia: false, qimenHongpan: false, guanyin: false, jigong: false, fengshui: false, mingpian: false };
  }
  return {
    bazi: !!raw.bazi,
    renge: !!raw.renge,
    lifenum: !!raw.lifenum,
    qimen: raw.qimen !== undefined ? !!raw.qimen : true,
    qimenDunjia: !!raw.qimenDunjia,
    qimenHongpan: !!raw.qimenHongpan,
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

  // 上方綠色區塊的新功能導覽按鍵：名片風水／數字易經已經開發完成，直接切換到該畫面；
  // 其餘還在開發中的功能維持提示（權限欄位名稱仍沿用舊的 fengshui，只改畫面上顯示的名稱）
  const navPermKeys = { qimenDunjia: "奇門遁甲", qimenHongpan: "奇門紅盤", guanyin: "觀音棋卦", jigong: "濟公棋卦", fengshui: "數字易經", mingpian: "名片風水" };
  document.querySelectorAll(".main-nav-link[data-feature]").forEach((btn) => {
    const key = btn.dataset.perm;
    btn.addEventListener("click", function () {
      if (!perms[key]) {
        showToast("此功能您未發放權限", "error");
        return;
      }
      if (key === "mingpian") {
        showMingpianView();
        return;
      }
      if (key === "fengshui") {
        showShuziView();
        return;
      }
      if (key === "jigong") {
        showJigongView();
        return;
      }
      if (key === "qimenDunjia") {
        showQimenDunjiaView();
        return;
      }
      if (key === "qimenHongpan") {
        showQimenHongpanView();
        return;
      }
      showToast(navPermKeys[key] + "功能開發中，敬請期待。", "info");
    });
  });

  document.getElementById("changePasswordNavBtn").addEventListener("click", showChangePasswordView);
});

// 所有「取代 mainView 的功能視圖」清單：切換視圖前先全部隱藏，再顯示目標視圖。
// 修正：從奇門遁甲直接點導覽列切到奇門紅盤（或任兩個功能頁互切）時，前一頁沒被隱藏、
// 兩個畫面上下疊在一起——每個 showXxxView 原本只藏 mainView，沒藏其他功能視圖。
const FEATURE_VIEW_IDS = ["changePasswordView", "qimenDunjiaView", "qimenHongpanView", "jigongView", "shuziView", "mingpianView"];
function hideAllFeatureViews() {
  FEATURE_VIEW_IDS.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
}

// ================= 修改密碼 =================
function showChangePasswordView() {
  hideAllFeatureViews();
  document.getElementById("mainView").style.display = "none";
  document.getElementById("changePasswordView").style.display = "";
}
function hideChangePasswordView() {
  document.getElementById("changePasswordView").style.display = "none";
  document.getElementById("mainView").style.display = "";
  document.getElementById("changePasswordForm").reset();
  document.getElementById("cp-msg").className = "form-msg";
  document.getElementById("cp-msg").textContent = "";
}
document.getElementById("changePasswordBackBtn").addEventListener("click", hideChangePasswordView);

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
  fillYearMonthDaySelects(
    document.getElementById("shuzi-lunar-year"), document.getElementById("shuzi-lunar-month"), document.getElementById("shuzi-lunar-day"), today
  );
  fillYearMonthDaySelects(
    document.getElementById("qd-byear"), document.getElementById("qd-bmonth"), document.getElementById("qd-bday"), today
  );
  fillYearMonthDaySelects(
    document.getElementById("hp-byear"), document.getElementById("hp-bmonth"), document.getElementById("hp-bday"), today
  );
  // 時間欄位維持單一個 <input type="time">（24 小時制 HH:MM 一欄），不拆成時／分兩個下拉選單；
  // 分鐘精度還是保留在這欄裡面，24 節氣交界時刻的判斷不受影響
  document.getElementById("f-btime").value =
    String(today.getHours()).padStart(2, "0") + ":" + String(today.getMinutes()).padStart(2, "0");
  document.getElementById("qd-btime").value =
    String(today.getHours()).padStart(2, "0") + ":" + String(today.getMinutes()).padStart(2, "0");
  document.getElementById("hp-btime").value =
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

  currentQimen = calculateQimenHeader({ year, month, day, hour, minute, name, gender, yiMaBasis: "day", kongWangBasis: "day" });
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
  selectedMainPillar = null;
  document.getElementById("shenshaExplainCard").style.display = "none";
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

// 整頁鋪滿底色（用在頁面本身有主題色的報告，例如人格解碼的金黃色），要在該頁任何文字／圖片
// 畫上去之前呼叫，不然會蓋掉已經畫好的內容
function fillPdfPageBg(pdf, pageWidth, pageHeight, color) {
  if (!color) return;
  pdf.setFillColor(color);
  pdf.rect(0, 0, pageWidth, pageHeight, "F");
}

// 把一個區塊 canvas 貼進 PDF，太高會自動分頁；回傳「最後一頁內容畫到哪個 Y 位置」，
// 讓呼叫端知道要接著從哪裡往下放東西（例如結尾文字）。pageBg 有給值時，新分頁也會先鋪底色
// （第一頁的底色要由呼叫端自己在畫任何內容之前先鋪好，這裡只處理「新分頁」的情況）
function addCanvasToPdf(pdf, canvas, margin, pageWidth, pageHeight, startY, pageBg) {
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
    fillPdfPageBg(pdf, pageWidth, pageHeight, pageBg);
    pdf.addImage(imgData, "JPEG", margin, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    lastBottom = position + imgHeight;
  }
  return lastBottom;
}

// 依「區塊」逐一畫進 PDF：每個區塊（例如一個表格／一張卡片）先各自 html2canvas 轉成圖片，
// 如果整塊放不進當頁剩餘空間，就直接整塊換到下一頁，不會像單一大圖那樣被硬切一半；
// 只有單一區塊本身就比一整頁還高時，才不得已用 addCanvasToPdf 的切頁邏輯畫（沒有更好的辦法）。
// backgroundColor 是每個區塊自己 html2canvas 時的底色（填補區塊內透明的地方）；pageBg 則是
// 整張 PDF 頁面（含區塊間空白）的底色，兩者通常給同一個顏色，但概念上是不同層。
async function addSectionsToPdf(pdf, sections, margin, pageWidth, pageHeight, startY, backgroundColor, pageBg) {
  const imgWidth = pageWidth - margin * 2;
  const maxHeight = pageHeight - margin * 2;
  let y = startY;
  for (const el of sections) {
    // 標了 data-pdf-break-before 的區塊強制另起新頁（除非已經在某頁最上方）——例如人格解碼的
    // 「數字對照表」整塊要從新的一頁開始
    if (el.dataset && el.dataset.pdfBreakBefore !== undefined && y > margin) {
      pdf.addPage();
      fillPdfPageBg(pdf, pageWidth, pageHeight, pageBg);
      y = margin;
    }
    // 區塊間距預設 6mm；元素標了 data-pdf-gap 就改用那個值（例如數字對照表逐列匯出時設成 0，
    // 讓列與列之間只靠各自的底線分隔，不會多出一段空白看起來像是斷開的區塊）
    const gap = el.dataset && el.dataset.pdfGap !== undefined ? Number(el.dataset.pdfGap) : 6;
    const canvas = await html2canvas(el, { scale: 1.5, backgroundColor: backgroundColor || "#ffffff" });
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    if (imgHeight > maxHeight) {
      if (y > startY) { pdf.addPage(); fillPdfPageBg(pdf, pageWidth, pageHeight, pageBg); y = margin; }
      y = addCanvasToPdf(pdf, canvas, margin, pageWidth, pageHeight, y, pageBg) + gap;
      continue;
    }
    if (y + imgHeight > pageHeight - margin) {
      pdf.addPage();
      fillPdfPageBg(pdf, pageWidth, pageHeight, pageBg);
      y = margin;
    }
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.85), "JPEG", margin, y, imgWidth, imgHeight);
    y += imgHeight + gap;
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
    await addSectionsToPdf(pdf, dayunSections, margin, pageWidth, pageHeight, margin);

    // 日主定策／陰陽性格／九運行業趨勢另外強制換頁；神煞解釋是點選才動態呈現的內容，不匯出
    pdf.addPage();
    const strategySections = Array.from(document.querySelectorAll("#dayunStrategyCard > *"));
    const dayunBottom = await addSectionsToPdf(pdf, strategySections, margin, pageWidth, pageHeight, margin);

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
function buildPillarsTable(pillars, selectedIdx) {
  const rows = [
    { label: "十神", cell: (p) => p.shiShenGan },
    { label: "天干", cell: (p) => charCell(p.gan) },
    { label: "地支", cell: (p) => zhiCell(p) },
    { label: "藏干", cell: (p) => hideCell(p) },
    { label: "長生", cell: (p) => p.diShi },
    { label: "神煞", cell: (p) => shenshaCell(p) }
  ];

  let html = '<table class="pillars-table"><tbody><tr><td class="label-cell"></td>';
  pillars.forEach((p, i) => {
    const sel = i === selectedIdx ? " col-selected" : "";
    html += '<td class="col-head' + sel + '" data-idx="' + i + '">' + p.headLabel + "</td>";
  });
  html += "</tr>";
  rows.forEach((row) => {
    html += '<tr><td class="label-cell">' + row.label + "</td>";
    pillars.forEach((p, i) => {
      const sel = i === selectedIdx ? " col-selected" : "";
      html += '<td class="' + sel.trim() + '">' + row.cell(p) + "</td>";
    });
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

  renderMainPillars(data);

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
  renderDayunStrategy(data.dayGan);
}

// 日主定策／陰陽性格／九運行業趨勢：只顯示日主天干對應的那一種五行與陰陽，不列出全部五行
function renderDayunStrategy(dayGan) {
  const card = document.getElementById("dayunStrategyCard");
  const panel = document.getElementById("dayunStrategyPanel");
  const element = WUXING_OF_GAN[dayGan];
  const isYang = YINYANG_OF_GAN[dayGan] === 1;
  const strategy = DAYUN_STRATEGY_BY_ELEMENT[element];
  const industry = INDUSTRY_TRENDS_BY_ELEMENT[element];
  const personality = isYang ? YINYANG_PERSONALITY.yang : YINYANG_PERSONALITY.yin;

  let html = '<p class="dayun-strategy-head">日主：' + dayGan + '（' + (isYang ? "陽" : "陰") + element + '）</p>';

  html += '<div class="dayun-strategy-block">' +
    "<h3>日主定策</h3>" +
    '<p class="dayun-strategy-title">' + strategy.title + "</p>" +
    '<p class="dayun-strategy-position">' + strategy.position + "</p>" +
    '<p class="dayun-strategy-body">' + strategy.body.replace(/\n/g, "<br>") + "</p>" +
    "</div>";

  html += '<div class="dayun-strategy-block">' +
    "<h3>陰陽性格｜" + personality.title + "</h3>" +
    '<p class="dayun-strategy-core">' + personality.core + "</p>" +
    '<ul class="dayun-strategy-list">' + personality.points.map((p) => "<li>" + p + "</li>").join("") + "</ul>" +
    '<p class="dayun-strategy-subhead">' + personality.imbalance.title + "</p>" +
    '<ul class="dayun-strategy-list">' + personality.imbalance.points.map((p) => "<li>" + p + "</li>").join("") + "</ul>" +
    "</div>";

  html += '<div class="dayun-strategy-block">' +
    "<h3>九運行業趨勢｜" + element + "</h3>" +
    '<p class="dayun-strategy-body">' + industry.intro + "</p>" +
    industry.categories.map((cat) =>
      '<div class="dayun-industry-cat"><p class="dayun-strategy-subhead">' + cat.name + "</p>" +
      '<ul class="dayun-strategy-list">' + cat.items.map((it) => "<li>" + it + "</li>").join("") + "</ul></div>"
    ).join("") +
    "</div>";

  panel.innerHTML = html;
  card.style.display = "block";
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
      const dySel = data.daYunList[selectedDayun];
      showShenshaExplain("大運 " + dySel.startYear + "（" + dySel.startAge + "歲）", dySel.shensha);
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
      const lnSel = dy.liunian[selectedLiunian];
      showShenshaExplain("流年 " + lnSel.year + "（" + lnSel.age + "歲）", lnSel.shensha);
    };
  });
}

// 四柱：欄位標題可點選查看該柱神煞解釋（跟大運／流年一樣的整欄反白＋點選機制）
function renderMainPillars(data) {
  const pillarsGrid = document.getElementById("pillarsGrid");
  const mainPillars = data.pillars.map((p) => ({ ...p, headLabel: p.label }));
  pillarsGrid.innerHTML = buildPillarsTable(mainPillars, selectedMainPillar);
  Array.from(pillarsGrid.querySelectorAll(".col-head")).forEach((cell) => {
    cell.onclick = function () {
      selectedMainPillar = Number(this.dataset.idx);
      renderMainPillars(data);
      const p = data.pillars[selectedMainPillar];
      showShenshaExplain(p.label, p.shensha);
    };
  });
}

// 神煞解釋：點選四柱／大運／流年欄位標題時動態呈現，不隨報告持久保存、不列入 PDF 匯出
function showShenshaExplain(pillarLabel, shenshaNames) {
  const card = document.getElementById("shenshaExplainCard");
  const panel = document.getElementById("shenshaExplainPanel");
  card.style.display = "block";

  let html = '<p class="shensha-explain-pillar">' + pillarLabel + "</p>";
  if (!shenshaNames || !shenshaNames.length) {
    html += '<p class="shensha-explain-empty">此柱無神煞。</p>';
  } else {
    html += shenshaNames.map((name) => {
      const info = typeof SHENSHA_EXPLAIN !== "undefined" ? SHENSHA_EXPLAIN[name] : null;
      if (!info) {
        return '<div class="shensha-explain-item"><h4>' + name + '</h4><p class="shensha-explain-body">尚無說明資料。</p></div>';
      }
      const verse = info.verse ? '<p class="shensha-explain-verse">歌訣：' + info.verse.replace(/\n/g, "<br>") + "</p>" : "";
      return '<div class="shensha-explain-item"><h4>' + name + "</h4>" + verse +
        '<p class="shensha-explain-body">' + info.body.replace(/\n/g, "<br>") + "</p></div>";
    }).join("");
  }
  panel.innerHTML = html;
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

  document.getElementById("rengeReferenceTable").innerHTML = data.reference ? buildRengeReferenceHtml(data.reference) : "";
}

function rengeBulletList(arr) {
  return "<ul>" + arr.map((x) => "<li>" + x + "</li>").join("") + "</ul>";
}

// 數字對照表整張表格太高，一定會跨頁；把每一列複製成獨立的暫存表格（離屏放置，寬度跟現有表格對齊），
// 讓 addSectionsToPdf 逐列判斷要不要換頁，換頁時才不會把同一列從中間切斷。用完要記得 cleanup 移除暫存節點。
function buildRengeRowSections() {
  const valueEl = document.getElementById("rengeReferenceTable");
  const tableEl = valueEl ? valueEl.querySelector("table.renge-ref-table") : null;
  const panel = valueEl ? valueEl.closest(".renge-panel") : null;
  if (!tableEl || !panel) return { panel, sections: [], cleanup: () => {} };

  const tempEls = [];
  const sections = [];
  // 數字對照表整塊從新的一頁開始：標題區塊標上 pdfBreakBefore（匯出時 addSectionsToPdf 會強制換頁），
  // cleanup 時再移除，不影響畫面
  const titleEl = panel.querySelector(".renge-box-title");
  if (titleEl) {
    titleEl.dataset.pdfBreakBefore = "1";
    sections.push(titleEl);
  }

  const tableWidth = tableEl.offsetWidth;
  // 用 .rows（HTMLTableElement 原生屬性）取全部 <tr>，不用 .children——瀏覽器解析表格時會自動幫裸 <tr> 包一層
  // 隱性的 <tbody>，.children 只會拿到那個 <tbody> 本身，不是逐列的 <tr>
  // 每一列拆成獨立表格後，該列在自己的暫存表格裡會變成唯一一列，觸發 .renge-ref-table 的
  // 「tr:last-child 不畫底線」規則，導致分隔線消失、只靠 addSectionsToPdf 的區塊間距撐開視覺——
  // 改用專屬的 renge-pdf-row 樣式（見 style.css），底線一律都畫，並把區塊間距歸零（data-pdf-gap="0"），
  // 這樣列與列之間才會是「一條分隔線」而不是「一段空白」。
  const makeWrapper = (content, extraClass) => {
    const wrapper = document.createElement("table");
    wrapper.className = "renge-pdf-row" + (extraClass ? " " + extraClass : "");
    wrapper.style.cssText = "position:absolute;left:-9999px;top:0;width:" + tableWidth + "px";
    wrapper.dataset.pdfGap = "0";
    wrapper.appendChild(content);
    document.body.appendChild(wrapper);
    tempEls.push(wrapper);
    sections.push(wrapper);
  };

  Array.from(tableEl.rows).forEach((tr) => {
    // 列裡若含較長的子表格（例如 1~9 圈數含義表），再往下拆成「子表格一列＝一個區塊」，
    // 換頁才不會把子表格從某一列中間切斷；第一段帶原本的標籤欄＋子表格表頭，之後各段
    // 留空白標籤欄維持欄寬對齊（子表格本身有 table-layout:fixed 固定欄寬，各段欄位會對齊）
    const sub = tr.querySelector("table.renge-ref-subtable");
    if (sub && sub.rows.length > 3) {
      const labelCell = tr.cells[0];
      const headerRow = sub.rows[0] && sub.rows[0].querySelector("th") ? sub.rows[0] : null;
      const bodyRows = Array.from(sub.rows).filter((r) => r !== headerRow);
      bodyRows.forEach((r, i) => {
        const newTr = document.createElement("tr");
        const lab = labelCell.cloneNode(true);
        if (i > 0) lab.innerHTML = "";
        newTr.appendChild(lab);
        const valTd = document.createElement("td");
        valTd.className = "renge-ref-value";
        const miniTable = document.createElement("table");
        miniTable.className = sub.className;
        if (i === 0 && headerRow) miniTable.appendChild(headerRow.cloneNode(true));
        miniTable.appendChild(r.cloneNode(true));
        valTd.appendChild(miniTable);
        newTr.appendChild(valTd);
        // 圈數含義表（renge-circle-table）畫面上已改成淡灰橫線，拆列匯出的暫存表格
        // 也不能再畫 .renge-pdf-row 的橘色分隔線，改用無框變體（見 style.css）
        makeWrapper(newTr, sub.classList.contains("renge-circle-table") ? "renge-pdf-row-plain" : "");
      });
      return;
    }
    makeWrapper(tr.cloneNode(true));
  });

  return {
    panel,
    sections,
    cleanup: () => {
      tempEls.forEach((el) => el.remove());
      if (titleEl) delete titleEl.dataset.pdfBreakBefore;
    }
  };
}

function buildRengeReferenceHtml(ref) {
  const rows = [];
  const row = (label, html) =>
    '<tr><td class="renge-ref-label">' + label + '</td><td class="renge-ref-value">' + html + "</td></tr>";

  rows.push(row(ref.mainNumber + " " + ref.name, rengeBulletList(ref.traits.characteristics)));
  rows.push(row(ref.name + "（主命數）正面", rengeBulletList(ref.traits.positive)));
  rows.push(row(ref.name + "（主命數）負面", rengeBulletList(ref.traits.negative)));
  rows.push(row("致命傷", "「" + ref.traits.fatalFlaw + "」"));
  rows.push(row("忠言", "「" + ref.traits.motto + "」"));
  rows.push(row("增聘人才", rengeBulletList(ref.recruiting)));
  rows.push(row("銷售", rengeBulletList(ref.sales)));
  rows.push(row("感情篇", rengeBulletList(ref.relationship)));
  rows.push(row("投資理財觀", rengeBulletList(ref.investment)));
  rows.push(row("工作觀職位配對", rengeBulletList(ref.career)));
  rows.push(row("天賦數 " + ref.talentDisplay, "<p>" + ref.talent.text + "</p>"));

  if (ref.masterNumber) {
    rows.push(row("天賦卓越數（" + ref.masterNumber.number + "）", "<p>" + ref.masterNumber.text + "</p>"));
  }

  if (ref.comparison) {
    let cmpHtml;
    if (ref.comparison.special) {
      cmpHtml = "<table class=\"renge-ref-subtable\">" + ref.comparison.rows.map((r) =>
        "<tr><td>" + r.digit + "</td><td>" + r.text + "</td></tr>"
      ).join("") + "</table>";
    } else {
      // 直接列出「自己」與「對比數字」兩欄，欄名用實際數字
      cmpHtml =
        '<div class="renge-cmp-pair">' +
        '<div><div class="renge-cmp-head">自己的數字傾向</div>' + rengeBulletList(ref.comparison.self) + "</div>" +
        '<div><div class="renge-cmp-head">對比數字 ' + ref.comparison.partner + " 的傾向</div>" + rengeBulletList(ref.comparison.other) + "</div>" +
        "</div>";
    }
    rows.push(row("人格解碼比較", cmpHtml));
  }

  if (ref.attraction) {
    const attrHtml =
      rengeBulletList(ref.attraction.text) +
      '<div class="renge-cmp-head" style="margin-top:8px">貴人能量</div>' +
      rengeBulletList(ref.attraction.lucky);
    rows.push(row("吸引力法則<br>貴人能量", attrHtml));
  }

  if (ref.circleMeanings && ref.circleMeanings.length) {
    // 1~9 全部列出（含空缺數）；空缺（0圈）不寫數字「0」，顯示官方對照表的欄位名稱「沒有圈（空缺數）」
    const cmHtml =
      "<table class=\"renge-ref-subtable renge-circle-table\"><tr><th>數字</th><th>圈數</th><th>含義</th></tr>" +
      ref.circleMeanings.map((m) =>
        "<tr" + (m.isGap ? ' class="renge-gap-row"' : "") + "><td>" + m.digit + "</td><td>" +
        (m.isGap ? "沒有圈<br>（空缺數）" : m.count + "圈") + "</td><td>" + m.text + "</td></tr>"
      ).join("") +
      "</table>";
    rows.push(row("九宮能量圖圈數含義<br>（1~9，含空缺數）", cmHtml));
  }

  if (ref.stageExplain && ref.stageExplain.content) {
    const s = ref.stageExplain;
    const stageHtml =
      '<div class="renge-cmp-head">生態循環</div>' + rengeBulletList(s.content.cycle) +
      '<div class="renge-cmp-head" style="margin-top:8px">事業</div>' + rengeBulletList(s.content.career) +
      '<div class="renge-cmp-head" style="margin-top:8px">感情</div>' + rengeBulletList(s.content.love) +
      '<div class="renge-cmp-head" style="margin-top:8px">總能量和策略</div>' + rengeBulletList(s.content.overall);
    rows.push(row("人生階段數（" + s.stageValue + "，" + s.ageLabel + "歲）說明", stageHtml));
  }

  return '<table class="renge-ref-table">' + rows.join("") + "</table>";
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
    const RENGE_BG = "#ffffff";

    // 整頁鋪白色底（含個人資料等各區塊自己的透明底色也是用這個顏色補），要在畫logo／標題之前先鋪好，不然會蓋掉
    fillPdfPageBg(pdf, pageWidth, pageHeight, RENGE_BG);

    const logoImg = document.querySelector(".brand img");
    pdf.addImage(logoImg, "PNG", margin, 8, 12, 12);
    const title = textToImage("Aries 人格解碼報告", 20, "#212529");
    pdf.addImage(title.dataUrl, "PNG", margin + 16, 8 + (12 - title.heightMM) / 2, title.widthMM, title.heightMM);

    // 逐區塊（基本資訊／生日數天賦數主命數／人生階段能量／九宮連線密碼與能量圖）換頁，避免表格被硬切一半；
    // 擇日下拉選單那個區塊標了 data-html2canvas-ignore，不該進 PDF（html2canvas 對 <select> 這種原生表單
    // 元件常常渲染不出來，之前沒濾掉會讓 PDF 最上面出現一塊空白或錯位的區域）
    const topSections = Array.from(document.querySelectorAll("#rengeCard > *:not(.card-head):not([data-html2canvas-ignore])"));
    // 數字對照表那個大表格改成逐列拆開（見 buildRengeRowSections），避免換頁時把某一列從中間切斷
    const { panel: refPanel, sections: refRowSections, cleanup: cleanupRefRows } = buildRengeRowSections();
    const rengeSections = topSections.flatMap((el) => (el === refPanel ? refRowSections : [el]));
    try {
      await addSectionsToPdf(pdf, rengeSections, margin, pageWidth, pageHeight, 26, RENGE_BG, RENGE_BG);
    } finally {
      cleanupRefRows();
    }

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
// showName：奇門命盤報告頁籤沿用真人姓名要顯示，獨立的奇門遁甲頁面沒有姓名欄位、不顯示這一列
function buildQimenInfoTable(data, showName) {
  const rows = [
    ["陽曆", data.solarText, "符首", data.xunShou.xun],
    ["農曆", data.lunarText, "天乙", data.tianYi.dir],
    ["時間", data.solarText.split(" ")[1], "值符", data.fuShouXing],
    ["格局", data.patternText, "值使", GONG_INFO[data.menTargetGong].dir]
  ];
  let html = '<table class="qimen-info-table"><tbody>';
  if (showName) {
    // 姓名右側再加一欄「性別」（只有奇門命盤會顯示這一列，奇門遁甲 showName=false 不受影響）
    const genderText = data.gender === "female" ? "女" : "男";
    html += '<tr><td class="qi-label">姓名</td><td class="qi-value">' + (data.name || "") +
      '</td><td class="qi-label">性別</td><td class="qi-value">' + genderText + "</td></tr>";
  }
  rows.forEach((r) => {
    html += "<tr><td class=\"qi-label\">" + r[0] + '</td><td class="qi-value">' + r[1] +
      '</td><td class="qi-label">' + r[2] + '</td><td class="qi-value">' + r[3] + "</td></tr>";
  });
  html += "</tbody></table>";
  return html;
}

// 奇門紅盤專用資訊表：比照 buildQimenInfoTable，但右側「天乙」欄取消，改成 符首／值符／值使／長生。
// 長生下拉＝十天干（比照復科，預設「日干」），選擇後外環 12 地支旁的十二長生字連動更新
// （見 renderQimenHongpan 的 change 監聽；演算法 hpChangShengMap 在紅盤引擎）
const HP_CS_GAN_OPTIONS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
function buildQimenHongpanInfoTable(data) {
  const dayGan = data.siZhu[1].gan.char;
  const csOptions = HP_CS_GAN_OPTIONS.map((g) =>
    '<option value="' + g + '"' + (g === dayGan ? " selected" : "") + ">" + g + "</option>").join("");
  const csSelect = '<select class="hp-changsheng-select" id="hp-changsheng">' + csOptions + "</select>";
  const rows = [
    ["陽曆", data.solarText, "符首", data.xunShou.xun],
    ["農曆", data.lunarText, "值符", data.fuShouXing],
    ["時間", data.solarText.split(" ")[1], "值使", GONG_INFO[data.menTargetGong].dir],
    ["格局", data.patternText, "長生", csSelect]
  ];
  let html = '<table class="qimen-info-table"><tbody>';
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
const QIMEN_MEN_COLOR = { 休: "#004B97", 死: "#796400", 傷: "#548C00", 杜: "#548C00", 開: "#EAC100", 驚: "#EAC100", 生: "#796400", 景: "#EA0000" };
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

// 點選九宮格解說：八卦／八門／神盤／九星／天干（天盤干、地盤干共用同一組天干解說）意涵，
// 內容整理自使用者提供的奇門遁甲先修班課程講義（先修班1/2/3.pdf），以白話改寫呈現
const QIMEN_EXPLAIN = {
  gua: {
    乾: "五行屬金，象徵天、剛健與至高統御之力，代表領導、正統、開創與宏觀格局。",
    坎: "五行屬水，象徵幽深內斂、生機潛藏，代表智慧、蓄勢待發與貴人暗助。",
    艮: "五行屬土，象徵高山厚重、止靜承載，代表穩固累積、停頓沉澱與轉化樞紐。",
    震: "五行屬木，象徵雷霆震動、破土而出，代表爆發力、競爭衝勁與威嚴氣勢。",
    巽: "五行屬木，象徵風之無孔不入、順勢滲透，代表柔性謀略、教化與洞察滲透力。",
    離: "五行屬火，象徵烈日光明、萬物彰顯，代表文明、名譽、熱情與外顯魅力。",
    坤: "五行屬土，象徵大地厚德載物，代表包容承載、務實沉澱與終局歸藏。",
    兌: "五行屬金，象徵澤水喜悅與毀折交鋒，代表言辭辯才、震盪衝擊與人心波動。"
  },
  // 八門改成「天賦性格／正面顯化／負面表徵」三維度表格，內容整理自先修班1.pdf 第六章「人盤八門」
  // 逐門詳解（原文另有「核心特徵」一段，使用者只要求這三個維度，故不收錄）
  men: {
    開: {
      trait: "坦蕩剛毅、宏觀統御、秩序規則——正義感強、光明磊落，具領袖氣場與宏觀視野，抗壓力強，重契約與紀律，習慣建立秩序依規而行。",
      positive: "商業擴張、品牌打響、貴人扶持財祿亨通；命理主學識淵博、名望卓越，能成為團隊中流砥柱。",
      negative: "遇門迫易剛愎自用、固步自封；凶局時易生官非訴訟、商業洩密，及頭部與心腦血管疾病。"
    },
    休: {
      trait: "溫和內斂、圓融智慧、注重品質——同理心強，行事低調，以柔克剛化解危機，重情守諾利於長線合作。",
      positive: "內部機制優化、資產風險對沖、貴人暗中資助；命理主生活優渥、廣結善緣、常得暗助，是團隊定海神針。",
      negative: "遇門迫易意志消沉、優柔寡斷；凶局時易內部暗鬥、合同拖延破局，及腎臟泌尿系統、慢性疲勞或抑鬱問題。"
    },
    生: {
      trait: "敦厚務實、財富敏銳、穩健固本——重實質利益與結果落地，具長線眼光與控局能力，重信譽利建立長期聯盟。",
      positive: "投資回報豐厚、資產擴張穩固、財源廣進；命理主財富運勢高，善於理財，是格局宏大的實幹型領袖。",
      negative: "遇凶格易顧固不化、抗拒變革；凶局時易債務危機、資金鏈斷裂，及脾胃消化系統、代謝或皮膚腫瘤問題。"
    },
    傷: {
      trait: "剛毅果斷、好勝攻堅、重義高效——雷厲風行，不畏挑戰，天生競爭意識強，屬開拓型悍將，重效率與實質結果。",
      positive: "核心競爭力領先、成功淘汰對手、清理不良資產；命理主魄力驚人、執行力強，多為破局先鋒或高壓管理層。",
      negative: "遇凶格易獨斷專行、暴躁決策；凶局時易法律訴訟、財務崩塌，及骨折意外、肝膽或神經系統受損。"
    },
    杜: {
      trait: "沉穩內斂、深度鑽研、守密固本——寡言務實，思維縱深，具匠人精神，行事審慎防範意識強，合規操守佳。",
      positive: "核心技術與商業機密穩固，利於科研製造業擴張；命理主學識深邃技術高超，多為核心專家或風控指揮官。",
      negative: "遇凶格易固執孤僻、作繭自封；凶局時易全盤停滯、資金鏈被卡，及經絡氣血瘀滯、肝膽或神經系統問題。"
    },
    景: {
      trait: "才華橫溢、重名愛羽、急躁多謀——審美與表達天賦佳，追求榮譽與形象，善整合資源包裝概念，惟情緒易起伏。",
      positive: "品牌知名度提升、文化產業擴張、合約順利簽署；命理主學識淵博氣質高雅，多為公關發言人或規劃師。",
      negative: "遇凶格易好大喜功、虛張聲勢；凶局時易名譽爆雷、合同陷阱，及心腦血管、視力系統與熱毒問題。"
    },
    死: {
      trait: "堅韌沉穩、守常執著、內秀長情——耐力包容心強，步步為營重原則，長期默默耕耘累積實力，惟略顯孤僻。",
      positive: "房地產土地資產穩健收益、抗風險能力強；命理主為人守信重義，多為重資產領域執掌者或風控決策人。",
      negative: "遇凶格易頑固作繭自封、轉型停滯；凶局時易破產清算、資金套牢，及脾胃病變、腫瘤或慢性疾病。"
    },
    驚: {
      trait: "雄辯果敢、洞察秋毫、剛愎多疑——言辭犀利危機直覺強，善捕捉對手破綻，惟情緒敏感易多疑樹敵。",
      positive: "法務訴訟勝訴、危機公關逆襲、輿論攻勢奏效；命理主口才絕倫直覺敏銳，多為金牌律師或危機處理專家。",
      negative: "遇凶格易草木皆兵、決策失誤；凶局時易惡意訴訟、名譽爆雷，及呼吸系統、精神恐慌或牙齒骨骼刑傷。"
    }
  },
  // 神盤／十神改成「天賦性格／正面顯化／負面表徵」三維度表格，內容整理自先修班2.pdf 第八章「易道十神象意」逐神詳解
  shen: {
    值符: {
      trait: "氣宇軒昂、穩健控局、重信厚德——先天氣場宏大自帶領袖氣質，行事光明磊落不屑瑣事，思維具高度系統性，極重契約與社會責任。",
      positive: "集團架構牢固確立、壟斷性資源對接、重大戰略合作達成；命理主根基尊貴仕途亨通，多為財團掌舵人或行業泰斗。",
      negative: "遇凶格易獨斷專行、傲慢專橫、官僚主義；凶局或能量失衡時易核心權力劇烈動盪、企業遭遇信任危機。"
    },
    騰蛇: {
      trait: "直覺敏銳、機變多謀、敏感多疑——先天具驚人第六感與環境洞察力，善捕捉常人難察覺的變化，行事柔中帶剛，惟易生危機感。",
      positive: "虛擬經濟與數位化產業、網絡流量巧妙運用；命理主天資機敏多出奇謀，屬團隊中的戰略奇兵或危機預警核心。",
      negative: "遇凶格易精神恐慌、草木皆兵、決策流於虛妄；凶局時易合同糾紛、虛假資訊、欺詐爆雷。"
    },
    太陰: {
      trait: "沉穩內斂、思想縝密、靈覺內省——先天具深邃智慧與超然定力，喜怒不形於色行事低調務實，善於在孤寂中保持專注。",
      positive: "核心技術專利、商業機密、隱名股東與隱性資本；命理主學識深邃德行高尚，多為核心專家或風控最高指揮官。",
      negative: "遇凶格易孤僻偏激、作繭自封、猜忌內耗；能量失衡時易遭幕後小人中傷、資訊滯後與競爭對手絞殺。"
    },
    六合: {
      trait: "圓融和藹、重諾守信、妥協折中——先天具卓越親和力與社交天賦，行事謙遜寬厚善平衡多方利益，人緣極佳不喜結怨。",
      positive: "集團合併、招商加盟、團隊凝聚與國際貿易合作；命理主仕途亨通，多為外交家、併購專家或金牌中介人。",
      negative: "遇凶格易優柔寡斷、受制於人、社交恐懼；凶局時易合同圈套、合夥人背叛清算、股權糾紛。"
    },
    勾陳: {
      trait: "執著守常、務實沉穩、念舊長情——先天具極強耐力守信度與長線專注力，行事務實不輕言放棄，重情重義忠誠度高。",
      positive: "實體產業、資產配置長期穩定；命理主根基厚重長壽篤實，多為實體工業巨頭或企業風控合規官。",
      negative: "遇凶格易因循守舊、頑固不化、心理強迫；凶局時易固定資產套牢、資金鏈斷裂、舊帳未清又添新訟。"
    },
    朱雀: {
      trait: "辯才無礙、重名愛羽、思維敏捷——先天具卓越言辭表達與審美天賦，行事雷厲風行極具語言感召力，追求名譽形象。",
      positive: "品牌知名度確立、網絡流量引爆、合同簽署；命理主學識淵博名望卓越，多為金牌演說家或首席戰略規劃師。",
      negative: "遇凶格易好大喜功、虛張聲勢、情緒反覆；凶局時易惡意訴訟、名譽爆雷、合同埋藏毀滅性條款。"
    },
    九地: {
      trait: "敦厚務實、長線定力、重信守常——先天具極強耐力包容心與人格韌性，行事低調沉穩注重信譽累積，不貪一時之功。",
      positive: "土地儲備、資產配置、底層供應鏈建設；命理主根基厚重德行深遠，多為實體工業巨頭或風控合規官。",
      negative: "遇凶格易優柔寡斷、因循守舊、社交恐懼；凶局時易固定資產套牢、資金流動性匱乏、轉型遲緩被淘汰。"
    },
    九天: {
      trait: "志存高遠、銳意開拓、剛健不息——具宏大格局觀與卓越抱負，行事氣魄宏大自帶領袖氣場，善捕捉商機不懼框架束縛。",
      positive: "集團架構、品牌提升、核心技術壟斷、國際化網絡拓展；命理主魄力驚人位高權重，多為跨國財團掌舵人。",
      negative: "遇凶格易好高騖遠、虛張聲勢、急功近利；凶局時易決策脫離實際、財務崩塌、市場信任危機。"
    },
    白虎: {
      trait: "剛毅果斷、雷厲風行、威嚴懾人——無所畏懼具英雄氣概，行事直截了當抗壓力強，自帶不怒自威的強大氣場。",
      positive: "核心技術壁壘、市場份額搶占；命理主魄力驚人執掌生殺大權，多為開疆悍將或金牌訴訟律師。",
      negative: "遇凶格易頑固暴躁、獨斷專行、魯莽衝動；凶局時易突發災禍、法律官非、財務崩潰。"
    },
    玄武: {
      trait: "智謀深邃、變通圓融、機敏多謀——先天具極高智商與博弈天賦，行事低調隱秘善解構人性暗流，遇危機能保持冷靜。",
      positive: "隱名資本募集、供應鏈隱秘打通、知識產權防禦；命理主大智若愚手腕極高，多為金融風投巨擘或高維玄學泰斗。",
      negative: "遇凶格易偷竊違法、欺詐爆雷、認知偏執；凶局時易核心商業機密洩露、資金遭暗中蠶食、合同欺詐。"
    }
  },
  // 九星改成「天賦性格／正面顯化／負面表徵」三維度表格，內容整理自先修班1.pdf 第七章「天盤九星」逐星詳解
  xing: {
    天心: {
      trait: "格局高遠、睿智嚴謹、仁慈博愛——具卓越宏觀視野與領袖氣場，行事光明磊落，崇尚秩序契約，內心具涵養萬物的胸懷。",
      positive: "企業核心架構、官方資本、壟斷性資源掌控；奇門風水主門庭威嚴、官貴扶持、加官進爵。",
      negative: "遇凶格易傲慢專斷、固步自封；健康上主頭部腦部中樞神經問題、肺疾或骨骼系統受創。"
    },
    天蓬: {
      trait: "雄圖大略、逆向破局、吞吐包容——具超越常人膽識與宏觀格局，行事大刀闊斧不畏艱險，善於亂局中洞察商機精準一擊。",
      positive: "風險投資、跨國供應鏈破局、逆勢崛起兼併收購；奇門風水主暗財大發、水法納吉、名揚海外。",
      negative: "遇凶格易膽大妄為、孤注一擲；健康上主腎臟泌尿系統衰竭、中毒或生殖系統病變。"
    },
    天任: {
      trait: "厚德包容、穩健長線、忠厚守諾——堅韌不拔任勞任怨，作風沉穩務實，擅長固守宏觀戰略方向，重視團隊基礎建設。",
      positive: "實體產業、資產穩健增值、土地基建項目；奇門風水主基業穩如泰山、田產豐厚、鎖財聚財。",
      negative: "遇凶格易固步自封、因循守舊；健康上主脾胃消化系統惡變、脊椎骨骼病變、慢性勞損。"
    },
    天衝: {
      trait: "剛毅果斷、銳意開拓、高效直爽——無所畏懼行事雷厲風行直截了當，長於捕捉對手漏洞正面突擊，注重效率絕不拖泥帶水。",
      positive: "新產品線快速爆破、攻克競爭壁壘、強勢搶占市場；奇門風水主武職發跡、威名顯赫。",
      negative: "遇凶格易獨斷專行、魯莽衝動；健康上主急性肝膽系統惡變、肢體神經受損或意外災禍。"
    },
    天輔: {
      trait: "儒雅深邃、深謀遠慮、和合重義——具卓越學識底蘊與文化氣質，思想開闊行事謙遜圓融，善構建多方共贏戰略聯盟。",
      positive: "企業核心文化、全球化品牌、政企資源對接；奇門風水主文才輩出、家風清正、聚引高端人脈。",
      negative: "遇凶格易優柔寡斷、閉門造車；健康上主神經功能紊亂、氣血瘀滯、肝膽隱疾或精神抑鬱。"
    },
    天英: {
      trait: "熱誠重名、名望驅動、急躁多謀——具卓越審美表達天賦與敏銳洞察力，作風熱情具領袖感召力，惟情緒易起伏追求表面華麗。",
      positive: "品牌知名度、文化傳媒產業、國際合同簽署；奇門風水主門庭大發、名望顯赫、官貴臨門。",
      negative: "遇凶格易急功近利、虛張聲勢；健康上主心腦血管暴裂、視力系統受損、熱毒引發臟腑惡變。"
    },
    天芮: {
      trait: "隱忍嚴謹、善於糾錯、樂學長情——具耐力容納力與危機直覺，善捕捉潛在漏洞深挖根基，具修學天賦精益求精。",
      positive: "合規審計、核心技術難題攻克、組織架構正向改革；奇門風水主地產物業增值、暗財深藏、出醫療教育之才。",
      negative: "遇凶格易顧固不化、疑神疑鬼；健康上主脾胃系統病變、免疫系統崩潰、慢性傳染病。"
    },
    天柱: {
      trait: "雄辯剛烈、危機直覺、獨樹一幟——具卓越言辭表達與辯駁天賦，行事犀利果敢直言不諱，善於談判博弈中直擊痛點。",
      positive: "法務訴訟勝訴、危機公關逆襲、話語權確立；奇門風水主聲名大噪、威震四海、御敵防禦。",
      negative: "遇凶格易剛愎自用、多疑嫉妒；健康上主呼吸系統惡變、音聲器官受損、牙齒骨骼刑傷。"
    },
    天禽: {
      trait: "剛正統御、穩健控局、重信厚德——天生自帶領袖氣場與中正人格，胸懷寬廣行事光明磊落，具極高道德操守與擔當。",
      positive: "集團構建、控股權確立、核心主業擴張；奇門風水主中央納吉、八方朝拱、家運昌盛。",
      negative: "遇凶格易獨斷專行、官僚守舊；健康上主中樞神經系統癱瘓、脾胃消化系統問題、新陳代謝紊亂。"
    }
  },
  // 十天干（天盤干／地盤干共用）改成「天賦性格／正面顯化／負面表徵」三維度表格，
  // 內容整理自先修班1.pdf 第四章「天地盤干象意」逐干詳解
  gan: {
    甲: {
      trait: "剛毅不阿、宏觀視野、直道而行——性格堅韌如參天大樹，具強烈自尊心與責任擔當，思維具方向性，作風正派重信守諾。",
      positive: "商戰兵法中代表企業核心競爭力強、佔據市場先機；命理主學識淵博、名望卓越，能成為團隊頂樑柱。",
      negative: "遇庚金或白虎剋伐、落宮不利時易固執己見、獨斷專行；出頭之木易成眾矢之的，呈現疲憊折損或決策失誤。"
    },
    乙: {
      trait: "隱忍堅篤、審時度勢、依附借力——性格溫和內斂，環境適應力與抗壓韌性強，善於人際協調化解衝突，具合作意識。",
      positive: "利輕資產運營、品牌策劃、公關危機處理；奇門風水主得女性貴人相助、藝術文化產業大發。",
      negative: "遇辛金沖剋或落凶格時易猶疑寡斷、糾纏依附；健康上主肝膽功能受損、經絡不通、免疫力低下。"
    },
    丙: {
      trait: "剛烈熱誠、霸道主導、直道攻堅——性格急躁充滿激情，作風雷厲風行，具強烈正義感與領袖氣場，惟易流於急躁自負。",
      positive: "品牌迅速爆紅、市場擴張、公關全面勝訴；奇門風水主門庭大發、名聲顯赫、貴人權貴扶持。",
      negative: "遇壬水沖剋或入墓絕之地時易亂衝亂撞、暴躁失控；健康上主心腦血管疾病、血壓暴增、視力神經受損。"
    },
    丁: {
      trait: "外柔內剛、務實高效、靈動多變——性格溫和謙遜實則主見韌性強，思維縝密洞察力佳，善幕後策劃，惟易思慮過重焦慮。",
      positive: "利核心專利、前沿科技研發、精準營銷；奇門風水主文星高照、智慧啟迪與財富暗滋。",
      negative: "遇癸水沖剋或落凶格時易孤芳自賞、鑽牛角尖；健康上主心臟機能受損、眼疾、神經衰弱失眠。"
    },
    戊: {
      trait: "敦厚誠信、固執保守、沉穩控局——性格穩重包容、務實守諾，惟主觀傾向維持現狀，缺乏變通力，擅長重資產長線規劃。",
      positive: "資金鏈充裕、資產運營穩固、房地產擴張；奇門風水主家財萬貫、地產豐厚、聚財鎖財。",
      negative: "遇四凶或入凶格時易頑固不化、作繭自封；健康上主脾胃消化系統宿疾、皮膚病變、代謝阻滯。"
    },
    己: {
      trait: "寬厚多謀、優柔貪執、迂迴控局——性格包容內斂細膩踏實，善暗中籌謀，惟內心多思敏感易拖泥帶水，缺乏斷然破局魄力。",
      positive: "利幕後規劃、商業機密防守、創意孵化；奇門風水主家風寬厚、地皮增值、暗財滋生。",
      negative: "遇凶格時易泥足深陷、糾紛難自拔；健康上主消化系統問題、濕氣聚積慢性病、皮膚或免疫失調。"
    },
    庚: {
      trait: "剛毅果斬、暴戾獨斷、直線強攻——性格剛硬不阿雷厲風行，破壞力與執行力強，惟主觀帶攻擊性缺乏包容迂迴智慧。",
      positive: "行業壟斷地位確立、強力兼併對手、核心攻堅突破；奇門風水主威武顯赫、掌生殺大權。",
      negative: "遇四凶或入墓絕之地時主血光刑傷、法律訴訟；健康上主大腸肺部惡疾、骨折刑傷、腦溢血車禍。"
    },
    辛: {
      trait: "剛毅果敢、偏激偏執、精準打擊——高冷孤傲行事狠辣追求完美，對瑕疵零容忍，惟內心敏感多疑易鑽牛角尖。",
      positive: "核心技術破局、精細化質量控制、合規內審；奇門風水主威嚴赫赫、轉型成功、技術稱雄。",
      negative: "遇凶格時主決裂分離、牢獄刑罰；健康上主肺部呼吸系統惡疾、骨質增生、針藥中毒或動手術。"
    },
    壬: {
      trait: "寬廣豪邁、隨波流蕩、潮汐控局——性格智謀深遠包容力強，具全球視野，惟過於澎湃易情緒化、方向迷茫，善借勢合圍。",
      positive: "全球化戰略、跨國供應鏈打通、資金募集；奇門風水主財源滾滾、名揚四海。",
      negative: "遇凶格時主大勢失控、資金爆雷；健康上主腎臟泌尿系統問題、嚴重水腫。"
    },
    癸: {
      trait: "深謀遠慮、流變陰沉、暗中執棋——性格深沉內斂智計百出，洞察力適應力強，惟因過於深匿易流於多疑敏感、悲觀。",
      positive: "大數據網絡建設、商業機密布防、隱形壟斷；奇門風水主暗財滋生、謀略深遠、後代聰慧。",
      negative: "遇凶格時主網絡癱瘓、全盤被動；健康上主生殖泌尿系統惡疾、血液毒素、長期失眠神經衰弱。"
    }
  }
};

function qimenExplainRow(label, char, dict) {
  const text = char ? (dict[char] || "找不到資料") : "中宮寄坤二宮，請查看坤二宮的解說";
  return "<tr><td class=\"qe-label\">" + label + '</td><td class="qe-char">' + (char || "－") +
    '</td><td class="qe-text">' + text + "</td></tr>";
}

// 八門／九星／天盤干／地盤干解說改成「天賦性格／正面顯化／負面表徵」三維度表格，一項橫跨 3 列，
// 前兩欄（標籤／字）用 rowspan 合併
function qimenExplainDimRows(label, char, dict) {
  const d = char ? dict[char] : null;
  if (!char) {
    return "<tr><td class=\"qe-label\">" + label + '</td><td class="qe-char">－</td>' +
      '<td class="qe-text">中宮寄坤二宮，請查看坤二宮的解說</td></tr>';
  }
  if (!d) {
    return "<tr><td class=\"qe-label\">" + label + '</td><td class="qe-char">' + char + "</td>" +
      '<td class="qe-text">找不到資料</td></tr>';
  }
  const dims = [["天賦性格", d.trait], ["正面顯化", d.positive], ["負面表徵", d.negative]];
  return dims.map((dim, i) =>
    "<tr>" +
    (i === 0 ? '<td class="qe-label" rowspan="3">' + label + '</td><td class="qe-char" rowspan="3">' + char + "</td>" : "") +
    '<td class="qe-text"><span class="qe-dim">' + dim[0] + "：</span>" + dim[1] + "</td></tr>"
  ).join("");
}

// 點選九宮格顯示的解說表格：八卦／八門／神盤／九星／天盤干／地盤干；data 由呼叫端傳入
// （奇門命盤報告頁籤用 currentQimen，獨立的奇門遁甲頁面用 currentQimenDunjia，兩邊各自的盤不能混用）
function buildQimenExplain(gong, data) {
  let gua, men, shen, xing, tianGan, diGan, title;
  if (gong === 5) {
    gua = "坤";
    xing = "天禽";
    tianGan = data.diPan[5];
    diGan = data.diPan[5];
    men = null;
    shen = null;
    title = "中宮";
  } else {
    const c = data.gongs[gong];
    gua = c.gua; xing = c.xing; tianGan = c.tianGan; diGan = c.diGan; men = c.men; shen = c.shen;
    title = gua + "宮（" + GONG_INFO[gong].dir + "）";
  }
  let html = '<div class="qimen-explain-title">' + title + " 解說</div>";
  html += '<table class="qimen-explain-table"><tbody>';
  html += qimenExplainRow("八卦", gua, QIMEN_EXPLAIN.gua);
  html += qimenExplainDimRows("八門", men, QIMEN_EXPLAIN.men);
  html += qimenExplainDimRows("神盤", shen, QIMEN_EXPLAIN.shen);
  html += qimenExplainDimRows("九星", xing, QIMEN_EXPLAIN.xing);
  html += qimenExplainDimRows("天盤干", tianGan, QIMEN_EXPLAIN.gan);
  html += qimenExplainDimRows("地盤干", diGan, QIMEN_EXPLAIN.gan);
  html += "</tbody></table>";
  return html;
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

// 九宮格＋外圍羅盤共用組字：bottomLabelFn(c) 決定每個宮位中下方要顯示的文字──
// 原本的「奇門命盤報告」頁籤顯示十年大運（如 1-10），新增的「奇門遁甲」獨立頁面則顯示
// 天盤干＋地盤干組合的格局名稱（如己己→地戶逢鬼），兩邊共用同一套版面只差這一行文字。
// centerLabel：中宮圓圈文字（命盤報告用「命」，獨立的奇門遁甲頁面沒有真人命主概念，改用「時」）。
// cornerWordsFn(c)：右下角格局提示字，兩邊算法不同，各自傳入。
// dayHourMode：只有獨立的奇門遁甲頁面傳 true——移除左側「命」圓圈標記，改在右上角天／地盤干左側用
// 小字顯示「日」（日柱天干落宮，即 isMingGong）／「時」（時柱天干落宮，即 isZiNu），兩者都是
// js/qimen-engine.js 既有算好的欄位，落中宮時已經照使用者要求寄到天芮星目前飛到的宮位，不用另外處理。
// numberFn(g)：門圓右側要顯示的 1~9 數字，只有獨立的奇門遁甲頁面傳入（見 computeQimenDunjiaGongNumbers）。
// 這個數字另外還分內盤／外盤樣式：離坤兌巽（9,2,7,4）陽遁時是內盤（灰底圓）、坎乾艮震（1,6,8,3）
// 陽遁時是外盤（白底）；陰遁時兩組屬性整組互換（使用者提供的規則），中宮不分內外盤、樣式不變
function buildQimenGridHtml(data, bottomLabelFn, centerLabel, cornerWordsFn, dayHourMode, numberFn) {
  let gridHtml = "";
  QIMEN_GRID_LAYOUT.forEach(({ g, row, col }) => {
    if (g === 5) {
      // 中宮：跟其它宮位同一套版面（星左上、干右上、卦左下），星固定天禽不動、卦固定坤（中宮寄坤二宮）、
      // 中間圓圈用「命」取代門名，深灰底白字
      const centerGan = data.diPan[5];
      gridHtml +=
        '<div class="qimen-cell qimen-center" data-gong="5" style="grid-row:' + row + ";grid-column:" + col + '">' +
        '<div class="qimen-xing earth">天禽</div>' +
        '<div class="qimen-gan-stack">' + qimenGanOnly(centerGan) + qimenGanOnly(centerGan) + "</div>" +
        '<div class="qimen-cell-center">' +
        '<div class="qimen-circle-zone">' +
        '<div class="qimen-men-circle qimen-center-circle">' + centerLabel + "</div>" +
        "</div>" +
        (numberFn ? '<div class="qimen-gong-number">' + numberFn(5) + "</div>" : "") +
        "</div>" +
        '<div class="qimen-cell-bottom earth">坤</div>' +
        "</div>";
      return;
    }
    const c = data.gongs[g];
    const menColor = QIMEN_MEN_COLOR[c.men] || "#666";
    const xingWx = QIMEN_XING_WUXING_CLASS[c.xing] || "";
    const guaWx = QIMEN_GUA_WUXING_CLASS[c.gua] || "";
    const cornerWords = cornerWordsFn(c, g) || [];
    const wordToSpan = (w) => '<span class="qw-' + w.type + '">' + w.text + "</span>";
    // 右下角最多放 3 組，第 4 組起改放左下角（八卦字右側），一樣由右往左排列，避免跟中下大運文字擠在一起重疊
    const cornerWordsHtml = cornerWords.slice(0, 3).map(wordToSpan).join("");
    const cornerWordsLeftHtml = cornerWords.slice(3).map(wordToSpan).join("");
    // 「日」「時」同宮時黑底圓＋白字，各自一顆圓，時排在日下面（不同宮只有其中一顆）
    const dayHourBadges = [];
    if (dayHourMode && c.isMingGong) dayHourBadges.push("日");
    if (dayHourMode && c.isZiNu) dayHourBadges.push("時");
    const dayHourHtml = dayHourBadges.length
      ? '<div class="qimen-daytime-stack">' +
        dayHourBadges.map((t) => '<div class="qimen-daytime-label">' + t + "</div>").join("") +
        "</div>"
      : "";
    const topRightHtml = dayHourMode
      ? '<div class="qimen-topright-row">' +
        dayHourHtml +
        '<div class="qimen-gan-stack">' + qimenGanOnly(c.tianGan) + qimenGanOnly(c.diGan) + "</div>" +
        "</div>"
      : (c.isMingGong ? '<div class="qimen-ming-circle">命</div>' : "") +
        '<div class="qimen-gan-stack">' + qimenGanOnly(c.tianGan) + qimenGanOnly(c.diGan) + "</div>";
    gridHtml +=
      '<div class="qimen-cell" data-gong="' + g + '" style="grid-row:' + row + ";grid-column:" + col + '">' +
      '<div class="qimen-xing ' + xingWx + '">' + (c.xing || "") + "</div>" +
      topRightHtml +
      '<div class="qimen-shen">' + (c.shen || "") + "</div>" +
      '<div class="qimen-cell-center">' +
      '<div class="qimen-circle-zone">' +
      '<div class="qimen-men-circle" style="background:' + menColor + '">' + (c.men || "") + "</div>" +
      "</div>" +
      (numberFn
        ? '<div class="qimen-gong-number' + (qimenDunjiaIsInnerGong(g, data.juInfo.isYang) ? " qimen-gong-number-inner" : "") + '">' + numberFn(g) + "</div>"
        : "") +
      '<div class="qimen-bottom-info">' +
      (c.jiXing ? '<div class="qimen-jixing">六儀擊刑</div>' : "") +
      '<div class="qimen-dayun">' + (bottomLabelFn(c) || "") + "</div>" +
      "</div>" +
      "</div>" +
      '<div class="qimen-cell-bottom ' + guaWx + '">' + c.gua + "</div>" +
      '<div class="qimen-corner-words">' + cornerWordsHtml + "</div>" +
      (cornerWordsLeftHtml ? '<div class="qimen-corner-words-left">' + cornerWordsLeftHtml + "</div>" : "") +
      "</div>";
  });
  return gridHtml;
}

// hexByGong：只有奇門遁甲頁面會傳（命盤頁傳 undefined），傳入時在 8 個方位格加顯示該宮的 64 卦
// （上下兩個卦象符號＋卦名，見 computeQimenDunjiaHexagrams）
// changShengByZhi：只有奇門紅盤會傳（地支→十二長生單字對照，如 寅→長），傳入時在每個地支旁
// 顯示該字（同一個 qc-zhi-item 容器內，字級跟地支一致），並帶 data-zhi 供右上「長生」下拉連動改字
function buildQimenCompassHtml(data, gridHtml, hexByGong, changShengByZhi) {
  let compassHtml = "";
  // 十二地支羅盤的連續橘色外框：先鋪一層跨滿整個地支帶（含中間九宮格區域）的金色底＋橘框，
  // 之後畫的九宮格會蓋住中間，只留下地支帶那一圈是連續的，不會在地支跟地支中間露出空隙
  compassHtml += '<div class="qc-zhi-frame" style="grid-row:2/7;grid-column:2/7"></div>';
  const QC_CORNER_GONGS = [2, 4, 6, 8];
  const trigramsHtml = (hex) => '<span class="qc-hex-trigrams"><span>' + GUA_TO_TRIGRAM[hex.upper] +
    '</span><span>' + GUA_TO_TRIGRAM[hex.lower] + "</span></span>";
  // 直式 64 卦（東南／東／東北／西南／西／西北）：卦象圖示在上、卦名在下且「一字換行」（直排）
  const hexVertical = (g) => {
    const hex = hexByGong && hexByGong[g];
    return hex ? '<div class="qc-hexagram">' + trigramsHtml(hex) + '<span class="qc-hex-name-v">' + hex.name + "</span></div>" : "";
  };
  // 水平 64 卦（南／北）：卦象圖示＋卦名並排、不換行（呼叫端會在方位數字後留間隔再接這段）
  const hexHorizontal = (g) => {
    const hex = hexByGong && hexByGong[g];
    return hex ? '<span class="qc-hex-gap"></span>' + trigramsHtml(hex) + '<span class="qc-hex-name-h">' + hex.name + "</span>" : "";
  };
  QIMEN_DIR_LAYOUT.forEach(({ g, row, col }) => {
    const dir = GONG_INFO[g].dir;
    if (QC_CORNER_GONGS.includes(g)) {
      // 四隅方（東南／西南／西北／東北）：方位格只放方位＋宮數（直式），64 卦另外移到旁邊地支處（見下方）
      compassHtml += '<div class="qc-dir qc-dir-corner" style="grid-row:' + row + ";grid-column:" + col + '">' +
        '<span class="qc-dir-text">' + dir + '</span><span class="qc-dir-num">' + g + "</span></div>";
    } else if (g === 9 || g === 1) {
      // 南（9）／北（1）：水平呈現——方位＋數字，空一段間隔，再接卦象圖示＋卦名（都不換行）
      const shortDir = dir.replace("正", "");
      compassHtml += '<div class="qc-dir qc-dir-horiz" style="grid-row:' + row + ";grid-column:" + col + '">' +
        '<span class="qc-dir-label">' + shortDir + g + "</span>" + hexHorizontal(g) + "</div>";
    } else {
      // 東（3）／西（7）：方位、數字、64卦（卦名直排一字一行）各自一行
      const shortDir = dir.replace("正", "");
      compassHtml += '<div class="qc-dir" style="grid-row:' + row + ";grid-column:" + col + '">' +
        '<span class="qc-dir-label">' + shortDir + '</span><span class="qc-dir-num">' + g + "</span>" + hexVertical(g) + "</div>";
    }
  });
  // 四隅 64 卦：依使用者要求移到鄰近地支旁——巽4→辰旁靠上、坤2→申旁靠上、艮8→寅旁靠下、乾6→戌旁靠下
  // （辰在 r3c2、申在 r3c6、寅在 r5c2、戌在 r5c6，這裡放在對應的最外圈欄 c1／c7，跟地支同一列、上下對齊）
  if (hexByGong) {
    const QC_CORNER_HEX_POS = {
      4: { row: 3, col: 1, valign: "top" },
      2: { row: 3, col: 7, valign: "top" },
      8: { row: 5, col: 1, valign: "bottom" },
      6: { row: 5, col: 7, valign: "bottom" }
    };
    Object.keys(QC_CORNER_HEX_POS).forEach((g) => {
      const p = QC_CORNER_HEX_POS[g];
      compassHtml += '<div class="qc-corner-hex qc-corner-hex-' + p.valign + '" style="grid-row:' + p.row + ";grid-column:" + p.col + '">' + hexVertical(Number(g)) + "</div>";
    });
  }
  QIMEN_ZHI_LAYOUT.forEach(({ zhi, row, col, vertical }) => {
    let badges = "";
    if (data.kongWang.includes(zhi)) badges += '<span class="qc-badge qc-badge-kong">空</span>';
    if (data.yiMa === zhi) badges += '<span class="qc-badge qc-badge-yima">馬</span>';
    // 十二長生：跟在地支正後方（地支→長生→空/馬圓圈的順序，比照復科「巳臨空」排法）
    const csHtml = changShengByZhi
      ? '<span class="qc-changsheng" data-zhi="' + zhi + '">' + (changShengByZhi[zhi] || "") + "</span>"
      : "";
    // 左右兩側（col 2／6）欄位很窄，空亡／驛馬圓圈要換行放在地支下方，不能像上下兩側那樣放在右邊（會被擠出格子）
    const isNarrowCol = col === 2 || col === 6;
    compassHtml += '<div class="qc-zhi-ring" style="grid-row:' + row + ";grid-column:" + col + '">' +
      '<span class="qc-zhi-item' + (isNarrowCol ? " qc-zhi-item-stack" : "") + '"><span' + (vertical ? ' class="qc-zhi-v"' : "") + ">" + zhi + "</span>" + csHtml + badges + "</span></div>";
  });
  compassHtml += '<div class="qimen-grid" id="qimenGrid">' + gridHtml + "</div>";
  return compassHtml;
}

// 三詐：使用者已更正為每個各自「天盤干＋八門＋八神配太陰」三條件同時成立才觸發
// （取代原本只看神盤對應表的版本）
const SAN_QI = ["乙", "丙", "丁"];
// 三詐：天盤干是三奇（乙／丙／丁）＋八門是開／休／生三吉門之一，再看八神——太陰＝真詐、六合＝休詐、
// 九地＝重詐。用官網奇門時盤核對出來（真詐：丙+開+太陰、乙+生+太陰；休詐：丁+休+六合；
// 重詐：乙+開+九地、丙+生+九地），取代先前那版錯誤的固定天盤干／八門對照。
const SAN_JI_MEN = ["開", "休", "生"];
const SAN_ZHA_BY_SHEN = { 太陰: "真詐", 六合: "休詐", 九地: "重詐" };

// 五假：用官網奇門時盤大量反推（含反例驗證）出來的公式，每個各自「八門＋天盤干＋八神」三條件同時成立。
// 反例佐證：癸／己／壬＋景＋九天→無天假（天假一定要三奇）；丁＋杜＋騰蛇→無地假（一定要陰神太陰／六合／九地）；
// 辛／癸＋驚＋九天→無人假（一定要壬）；己＋傷＋六合→無神假（一定要九地）；
// 癸＋死＋太陰、戊＋死＋九地(無癸)→無鬼假（一定要九地且天盤或地盤含癸）。
const YIN_SHEN = ["太陰", "六合", "九地"];
const WU_JIA_RULES = [
  { name: "天假", men: "景", tianGans: ["乙", "丙", "丁"], shens: ["九天"] },
  { name: "地假", men: "杜", tianGans: ["丁", "己", "癸"], shens: YIN_SHEN },
  { name: "人假", men: "驚", tianGans: ["壬"], shens: ["九天"] },
  { name: "神假", men: "傷", tianGans: ["己"], shens: ["九地"] },
  { name: "鬼假", men: "死", tianGans: "含癸", shens: ["九地"] }
];

// 九遁：用官網奇門時盤反推。已啟用（多筆或 classic 驗證）：
//   天遁＝丙＋生門＋神(九天或六合)（官網掃10種神確認只有這2種觸發）、神遁＝丙＋生門＋九天、
//   風遁＝乙＋三吉門＋巽宮4（3筆，地盤干不限）、
//   雲遁＝乙＋三吉門＋地盤辛（3筆，不限宮：震3/兌7/巽4）、龍遁＝乙＋三吉門(開/休/生)＋坎宮1（5筆，神不限）、
//   人遁＝丁＋休門＋太陰（2筆，不限宮）、鬼遁＝乙＋杜門＋九地（5筆，不限宮）。
//   註：乙落坎宮杜門是鬼遁（非龍遁）；丁＋開門＋九地是重詐（非鬼遁）。
// 停用中（見下方註解）：
//   地遁——原本用單一筆反推成「乙＋開門＋地盤己」，但 2029-7-15 17:51 巽宮4（乙／己＋開＋九地）官網只有風遁
//     沒有地遁，證明「地盤己」不是正解、真正條件跟宮位／八神有關（坎1有、巽4沒有），待多筆重推。
//   虎遁——尚未在官網抓到實例（classic：乙＋開門＋艮宮8）。
const JIU_DUN_RULES = [
  { name: "天遁", tianGan: "丙", men: "生", shens: ["九天", "六合"] }, // 丙+生門+神(九天或六合)：官網掃10種神只有這2種觸發天遁，驗證完整
  { name: "神遁", tianGan: "丙", men: "生", shen: "九天" }, // 丙+生門+九天（天遁的九天那支同時也是神遁）
  { name: "風遁", tianGan: "乙", mens: ["開", "休", "生"], gong: 4 }, // 乙+三吉門+巽宮4（宮位規則，地盤干不限：官網見壬/己/辛），驗證3筆
  { name: "雲遁", tianGan: "乙", mens: ["開", "休", "生"], diGan: "辛" }, // 乙+三吉門+地盤辛（不限宮：官網見震3/兌7/巽4），驗證3筆
  { name: "龍遁", tianGan: "乙", mens: ["開", "休", "生"], gong: 1 }, // 乙+三吉門(開/休/生)+坎宮1（神不限：官網見九天/白虎/玄武；坎宮乙落杜門是鬼遁不是龍遁），驗證5筆
  { name: "人遁", tianGan: "丁", men: "休", shen: "太陰" }, // 丁+休門+太陰（不限宮：官網見乾6/巽4），驗證2筆
  { name: "鬼遁", tianGan: "乙", men: "杜", shen: "九地" }, // 乙+杜門+九地（不限宮：官網見坎1/巽4/艮8，地盤干不限），驗證5筆
  // 以下尚未定案／未驗證，先停用以免誤標：
  // { name: "地遁", tianGan: "乙", men: "開", diGan: "己" }, // 非單純地盤己：乙+開+dg己在坎1有地遁、巽4沒有，宮/神條件未定，待多筆重推
  // { name: "虎遁", tianGan: "乙", men: "開", gong: 8 }
];

// 奇門遁甲獨立頁面的右下角格局提示：入墓＋門迫／宮迫（跟奇門命盤報告同一套判斷，直接沿用
// c.cornerWords 裡現成算好的結果）＋三詐＋五假（天假地假神假鬼假人假）＋九遁
function qimenDunjiaCornerWords(data) {
  return (c, g) => {
    const words = (c.cornerWords || []).filter((w) => w.type === "rumu" || w.type === "menpo" || w.type === "gongpo");
    // 相佐（值符得奇相佐）：八神「值符」所在的那一宮，若該宮地盤干是三奇（乙／丙／丁）就顯示「相佐」。
    // 用官網奇門時盤 7 筆核對出來（5 筆值符宮地盤三奇都出現、2 筆值符宮地盤是六儀壬/戊都沒有）。
    if (c.shen === "值符" && SAN_QI.includes(c.diGan)) {
      words.push({ text: "相佐", type: "xiangzuo" });
    }
    // 權怡（相佐的天盤鏡像）：八神「值符」所在的宮，若該宮天盤干是三奇（乙／丙／丁）就顯示「權怡」。
    // 用官網奇門時盤核對出來（2029-7-6 11:51 值符宮丙／丙、2029-7-6 9:51 值符宮丙／乙 都出現；
    // 值符宮天盤是六儀庚／辛／己等的盤都沒有）。
    if (c.shen === "值符" && SAN_QI.includes(c.tianGan)) {
      words.push({ text: "權怡", type: "quanyi" });
    }
    if (SAN_QI.includes(c.tianGan) && SAN_JI_MEN.includes(c.men) && SAN_ZHA_BY_SHEN[c.shen]) {
      words.push({ text: SAN_ZHA_BY_SHEN[c.shen], type: "sanzha" });
    }
    // 五假（天假／地假／人假／神假／鬼假）：門＋天盤干＋神三條件（鬼假的干條件是「天盤或地盤含癸」）
    WU_JIA_RULES.forEach((rule) => {
      if (c.men !== rule.men) return;
      if (!rule.shens.includes(c.shen)) return;
      if (rule.tianGans === "含癸") {
        if (c.tianGan !== "癸" && c.diGan !== "癸") return;
      } else if (!rule.tianGans.includes(c.tianGan)) {
        return;
      }
      words.push({ text: rule.name, type: "wujia" });
    });
    JIU_DUN_RULES.forEach((rule) => {
      if (c.tianGan !== rule.tianGan) return;
      if (rule.men && c.men !== rule.men) return;
      if (rule.mens && !rule.mens.includes(c.men)) return;
      if (rule.shen && c.shen !== rule.shen) return;
      if (rule.shens && !rule.shens.includes(c.shen)) return;
      if (rule.diGan && c.diGan !== rule.diGan) return;
      if (rule.gong && g !== rule.gong) return;
      words.push({ text: rule.name, type: "jiudun" });
    });
    return words;
  };
}

// 奇門遁甲獨立頁面：門圓右側 1~9 數字＝「時家紫白飛星」。用官網「奇門時盤」（qimenshipan）大量
// 交叉驗證出來的完整公式（先前那版憑猜測的時干支 mod 9 已作廢）：
// 1. 陰陽遁看節氣（冬至→夏至 陽遁順飛、夏至→冬至 陰遁逆飛）＝juInfo.isYang，跟局數同一套判斷。
// 2. 子時起星（中宮數基準）＝看「日柱地支」的三合組：
//      陽遁—子午卯酉組起1、寅申巳亥組起7、辰戌丑未組起4；
//      陰遁—子午卯酉組起9、寅申巳亥組起3、辰戌丑未組起6。
// 3. 從子時起，每過一個時辰，中宮數 陽遁+1／陰遁−1（用時柱地支序 子0…亥11 當步數），mod 9（1~9）。
// 4. 把算好的中宮數放中宮，再沿「洛書飛泊」順序（中5→乾6→兌7→艮8→離9→坎1→坤2→震3→巽4）
//    陽遁順飛（+1）／陰遁逆飛（−1）依序填入九宮，就得到每個宮位的 1~9 數字。
// 驗證：官網奇門時盤 2000-06-22、2000-04-16、2013-06-22、2000-12-05 等多筆，含 6 種三合組×陰陽遁
//   起星組合與逐時辰飛佈，九宮數字全部對上。內外盤灰底圓／白底樣式另見 qimenDunjiaIsInnerGong。
const ZHI_INDEX_ZB = { 子: 0, 丑: 1, 寅: 2, 卯: 3, 辰: 4, 巳: 5, 午: 6, 未: 7, 申: 8, 酉: 9, 戌: 10, 亥: 11 };
const ZIBAI_C0_YANG = { 子: 1, 午: 1, 卯: 1, 酉: 1, 寅: 7, 申: 7, 巳: 7, 亥: 7, 辰: 4, 戌: 4, 丑: 4, 未: 4 };
const ZIBAI_C0_YIN = { 子: 9, 午: 9, 卯: 9, 酉: 9, 寅: 3, 申: 3, 巳: 3, 亥: 3, 辰: 6, 戌: 6, 丑: 6, 未: 6 };
// 洛書飛泊順序：中→乾→兌→艮→離→坎→坤→震→巽
const ZIBAI_FLY_ORDER = [5, 6, 7, 8, 9, 1, 2, 3, 4];
function computeQimenDunjiaGongNumbers(data) {
  const isYang = data.juInfo.isYang;
  const dayZhi = data.siZhu[1].zhi.char;
  const timeZhi = data.siZhu[0].zhi.char;
  const norm = (n) => (((n - 1) % 9) + 9) % 9 + 1; // 任意整數收斂到 1~9
  const c0 = (isYang ? ZIBAI_C0_YANG : ZIBAI_C0_YIN)[dayZhi];
  const step = ZHI_INDEX_ZB[timeZhi];
  const center = norm(isYang ? c0 + step : c0 - step);
  const numbers = {};
  ZIBAI_FLY_ORDER.forEach((gong, i) => {
    numbers[gong] = norm(isYang ? center + i : center - i);
  });
  return (g) => numbers[g];
}

// 奇門遁甲獨立頁面：九宮數字的內盤／外盤樣式。使用者提供的規則——離坤兌乾（9,2,7,6）跟坎艮震巽
// （1,8,3,4）這兩組宮位，陽遁／陰遁時的內外盤屬性剛好互換：
//   陽遁：離坤兌乾＝內盤（灰底圓）、坎艮震巽＝外盤（白底）
//   陰遁：離坤兌乾＝外盤（白底）、坎艮震巽＝內盤（灰底圓）
// 陽遁／陰遁的判斷（data.juInfo.isYang）已經是用精確到分鐘的節氣時刻算出來的（lunar-javascript
// 的 getPrevJieQi 本身就是照實際時刻找節氣，不是只看日期），不用另外處理分鐘精度。中宮不分內外盤。
const QIMEN_DUNJIA_YANG_INNER_GONGS = [9, 2, 7, 6];
const QIMEN_DUNJIA_YIN_INNER_GONGS = [1, 8, 3, 4];
function qimenDunjiaIsInnerGong(g, isYang) {
  return (isYang ? QIMEN_DUNJIA_YANG_INNER_GONGS : QIMEN_DUNJIA_YIN_INNER_GONGS).includes(g);
}

// 奇門遁甲外環 64 卦：橘色羅盤 8 個卦位各顯示一個易經六十四卦（比照參考站，命盤頁不顯示）。
// 演算法（用官網 15 張盤、120 個卦交叉驗證，涵蓋陽遁／陰遁／不同局數／符首本時與非本時／1978~2030）：
//   基準——符首本時（甲子／甲戌…時）每宮顯示自己後天八卦的「純卦」（坎宮＝坎為水、離宮＝離為火…）。
//   隨時辰前進，上卦環跟著「天盤（值符星）飛佈量」反方向轉、下卦環跟著「人盤（值使門）飛佈量」反方向轉。
//   具體：用九宮空間順時針環 SPATIAL_CW_ORDER（巽4→離9→坤2→兌7→乾6→坎1→艮8→震3），
//   xingDelta＝符首宮到值符星宮在環上的順時針步數、menDelta＝符首宮到值使門宮的步數；
//   每宮上卦＝該宮在環上往反方向退 xingDelta 步那格的後天八卦、下卦＝退 menDelta 步那格的後天八卦，
//   上卦疊下卦查 64 卦名。時干＝甲時值符星不動（xingTargetGong===fuShouGong）、delta=0，剛好就是純卦
//   基準盤，不用特別處理。
const GUA_TO_TRIGRAM = { 乾: "☰", 兌: "☱", 離: "☲", 震: "☳", 巽: "☴", 坎: "☵", 艮: "☶", 坤: "☷" };
const HEXA_64 = {
  乾乾: "乾", 乾坤: "否", 乾坎: "訟", 乾離: "同人", 乾震: "無妄", 乾巽: "姤", 乾艮: "遯", 乾兌: "履",
  坤乾: "泰", 坤坤: "坤", 坤坎: "師", 坤離: "明夷", 坤震: "復", 坤巽: "升", 坤艮: "謙", 坤兌: "臨",
  坎乾: "需", 坎坤: "比", 坎坎: "坎", 坎離: "既濟", 坎震: "屯", 坎巽: "井", 坎艮: "蹇", 坎兌: "節",
  離乾: "大有", 離坤: "晉", 離坎: "未濟", 離離: "離", 離震: "噬嗑", 離巽: "鼎", 離艮: "旅", 離兌: "睽",
  震乾: "大壯", 震坤: "豫", 震坎: "解", 震離: "豐", 震震: "震", 震巽: "恆", 震艮: "小過", 震兌: "歸妹",
  巽乾: "小畜", 巽坤: "觀", 巽坎: "渙", 巽離: "家人", 巽震: "益", 巽巽: "巽", 巽艮: "漸", 巽兌: "中孚",
  艮乾: "大畜", 艮坤: "剝", 艮坎: "蒙", 艮離: "賁", 艮震: "頤", 艮巽: "蠱", 艮艮: "艮", 艮兌: "損",
  兌乾: "夬", 兌坤: "萃", 兌坎: "困", 兌離: "革", 兌震: "隨", 兌巽: "大過", 兌艮: "咸", 兌兌: "兌"
};
function computeQimenDunjiaHexagrams(data) {
  const spIdx = (g) => SPATIAL_CW_ORDER.indexOf(g);
  const homeGua = (k) => GONG_INFO[SPATIAL_CW_ORDER[((k % 8) + 8) % 8]].gua;
  const fs = data.fuShouGong, xt = data.xingTargetGong, mt = data.menTargetGong;
  const xingDelta = ((spIdx(xt) - spIdx(fs)) % 8 + 8) % 8;
  const menDelta = ((spIdx(mt) - spIdx(fs)) % 8 + 8) % 8;
  const out = {};
  [1, 2, 3, 4, 6, 7, 8, 9].forEach((g) => {
    const i = spIdx(g);
    const upper = homeGua(i - xingDelta);
    const lower = homeGua(i - menDelta);
    out[g] = { upper, lower, name: HEXA_64[upper + lower] || "" };
  });
  return out;
}

function renderQimen(data) {
  document.getElementById("qimenCard").style.display = "block";

  document.getElementById("qimenPillars").innerHTML = buildQimenPillarsTable(data.siZhu);
  document.getElementById("qimenInfoPanel").innerHTML = buildQimenInfoTable(data, true);

  const gridHtml = buildQimenGridHtml(data, (c) => c.dayunLabel, "命", (c) => c.cornerWords, false, null);
  document.getElementById("qimenCompass").innerHTML = buildQimenCompassHtml(data, gridHtml);
  document.getElementById("qimenExplain").style.display = "none";
  document.getElementById("qimenExplain").innerHTML = "";
}

// 奇門遁甲（獨立頁面）：跟奇門命盤報告完全同一套介面與功能，差異：
// 1. 九宮格中下方文字改成天盤干＋地盤干組合的格局名稱（GEJU_81），不顯示十年大運
// 2. 中宮圓圈文字改「時」（這裡沒有真人命主，只是選一個時刻起盤）
// 3. 移除左側「命」圓圈標記，改在右上角天／地盤干左側顯示「日」／「時」小字（日柱／時柱天干落宮）
// 4. 右下角格局提示字只保留「入墓」＋門迫／宮迫，其餘（門的意義／六親／星意義／神意義／兄弟／子女／
//    遷移）都不顯示，改顯示三詐／五假（天假地假人假）／九遁（見 qimenDunjiaCornerWords）
// 5. 門圓右側新增 1~9 數字（見 computeQimenDunjiaGongNumbers）
// 中下格局文字：天盤干若為三奇（乙／丙／丁）且觸發入墓，在原本的81格局名稱「上方」換行加顯示
// 「乙奇入墓」／「丙奇入墓」／「丁奇入墓」（兩個都要顯示，不能互相取代——使用者確認原本的81格局
// 名稱要保留）；其餘六儀（戊己庚辛壬癸）入墓時不套用這個規則，維持只顯示81格局名稱，
// 右下角小字繼續顯示「入墓」（見 qimenDunjiaCornerWords，未受影響）
const SAN_QI_RUMU_TEXT = { 乙: "乙奇入墓", 丙: "丙奇入墓", 丁: "丁奇入墓" };

// 升殿：天盤干是乙／丙／丁且落入指定宮位才觸發，跟入墓一樣加在原本81格局名稱「上方」
// （乙落震宮／丙落離宮／丁落兌宮），入墓判斷用的 RUMU_STEMS 宮位（乾艮巽坤）跟這裡的
// 宮位（震離兌）不重疊，兩者不會同時觸發同一格。原本「丁落兌宮或離宮」的離宮已拿掉——
// 用使用者提供的5筆真實盤核對出來，丁落離宮時畫面只顯示「奇遊祿位」，沒有「丁奇升殿」，
// 兩者衝突，使用者確認離宮這條併入奇遊祿位、從升殿規則移除
const SHENG_DIAN_RULES = [
  { tianGan: "乙", guas: ["震"], text: "乙奇升殿" },
  { tianGan: "丙", guas: ["離"], text: "丙奇升殿" },
  { tianGan: "丁", guas: ["兌"], text: "丁奇升殿" }
];

// 奇遊祿位：天盤干（三奇之一）落入自己的十干祿方位、且八門是開／休／生三吉門之一才觸發——
// 乙祿在卯（震宮）、丙祿在巳（巽宮）、丁祿在午（離宮）。三吉門這個條件是用「乙落震宮」的7筆
// 真實盤核對出來的：2022-07-13／2023-07-08（門休）、2022-04-13（門開）三筆有觸發，
// 2022-07-08／2029-12-03（門死）、2022-07-17（門景）、2022-07-19（門傷）四筆都沒觸發，
// 7筆全部吻合「門必須是開/休/生」；原本丙／丁那5筆確認資料（2026-09-12／2026-12-09／
// 2020-08-15／2026-07-01／2020-11-15）剛好全部是三吉門，沒能測出這個條件，但邏輯上三奇同一
// 套規則比較合理，使用者確認三奇都套用三吉門這個條件
const QI_LU_MEN = ["開", "休", "生"];
const QI_YOU_LU_WEI_RULES = [
  { tianGan: "乙", guas: ["震"] },
  { tianGan: "丙", guas: ["巽"] },
  { tianGan: "丁", guas: ["離"] }
];

// 受刑：天盤干丙／丁落入坎宮（水），丙丁屬火，水火相沖，跟使用者提供的4筆真實盤核對出來
// （2026-06-05／2009-08-08／2029-06-06 丙落坎宮、2018-06-05 丁落坎宮，4筆都只出現這個
// 宮位這個提示，沒有例外）。坎宮不在 RUMU_STEMS／SHENG_DIAN_RULES／QI_YOU_LU_WEI_RULES
// 任何一個既有規則的宮位清單裡，不會互相衝突。
// 例外：地盤干跟天盤干同樣是丁（丁＋丁）落坎宮時不算受刑——原本4筆確認資料剛好都是
// 地盤干跟天盤干不同（丙＋癸／丙＋壬／丁＋癸／丙＋壬），沒測到同干的情況；用使用者提供的
// 2017-12-11 07:16 這筆盤核對出來，丁＋丁落坎宮畫面只顯示「奇入太陰」，沒有「丁奇受刑」，
// 需要排除地盤干＝天盤干（同干不算相沖）的情況
const SHOU_XING_TEXT = { 丙: "丙奇受刑", 丁: "丁奇受刑" };

// 玉女守門：天盤干／地盤干都是丁（丁＋丁），且落在巽宮或離宮（地支巳／午，跟丁同屬火）才觸發。
// 跟奇遊祿位（丁落離宮，任何地盤干都算）條件會重疊——用使用者提供的2筆真實盤核對出來
// （1987-10-13 06:16 離宮丁＋丁、1987-10-6 06:16 巽宮丁＋丁），使用者確認兩條規則同時成立時
// 兩個提示都要顯示，不是互斥取代，所以這裡獨立判斷、不影響 QI_YOU_LU_WEI_RULES 的邏輯
function isYuNuShouMenDunjia(c) {
  return c.tianGan === "丁" && c.diGan === "丁" && (c.gua === "巽" || c.gua === "離");
}

// 三奇入墓（中下格局的「乙奇入墓／丙奇入墓／丁奇入墓」）：純粹看天盤干（三奇）落哪個宮位，
// 用官網奇門時盤核對出來——乙落乾宮或坤宮、丙落乾宮、丁落艮宮就顯示。乾／艮那幾個跟 RUMU_STEMS
// （六儀入墓對照，同時也顯示右下角小字「X入墓」）一致，直接沿用；乙另外多一個「坤宮」（乙木墓
// 在未＝坤宮的五行墓，RUMU_STEMS 沒有這條，所以在坤宮只顯示格局行「乙奇入墓」、右下角不顯示
// 「乙入墓」）。
// 之前那版「天盤干乙＋日／時柱天干落宮就顯示」是錯的：當時拿來核對的 5 筆剛好都是乙落坤宮，被
// 誤判成跟日／時柱有關；用 2024-02-01 00:30 這筆（乙落震宮、又是日柱落宮）核對出破綻——官網震宮
// 只顯示「乙奇升殿」沒有入墓，證實跟日／時柱無關，真正就是看宮位（乙＝乾或坤）。
function qimenDunjiaBottomLabel(c) {
  const geju = getGeju81(c.tianGan, c.diGan);
  const gejuName = geju ? geju.name : "";
  const extraLines = [];
  if (SAN_QI_RUMU_TEXT[c.tianGan] && (RUMU_STEMS[c.gua] || []).includes(c.tianGan)) {
    extraLines.push(SAN_QI_RUMU_TEXT[c.tianGan]);
  }
  if (c.tianGan === "乙" && c.gua === "坤") {
    extraLines.push("乙奇入墓");
  }
  const shengDian = SHENG_DIAN_RULES.find((r) => r.tianGan === c.tianGan && r.guas.includes(c.gua));
  if (shengDian) extraLines.push(shengDian.text);
  const qiYouLuWei = QI_YOU_LU_WEI_RULES.find((r) => r.tianGan === c.tianGan && r.guas.includes(c.gua));
  if (qiYouLuWei && QI_LU_MEN.includes(c.men)) extraLines.push("奇遊祿位");
  if (isYuNuShouMenDunjia(c)) extraLines.push("玉女守門");
  if (SHOU_XING_TEXT[c.tianGan] && c.gua === "坎" && c.diGan !== c.tianGan) extraLines.push(SHOU_XING_TEXT[c.tianGan]);
  if (!extraLines.length) return gejuName;
  return gejuName ? extraLines.join("<br>") + "<br>" + gejuName : extraLines.join("<br>");
}

function renderQimenDunjia(data) {
  document.getElementById("qimenDunjiaCard").style.display = "block";

  document.getElementById("qimenDunjiaPillars").innerHTML = buildQimenPillarsTable(data.siZhu);
  document.getElementById("qimenDunjiaInfoPanel").innerHTML = buildQimenInfoTable(data, false);

  const gridHtml = buildQimenGridHtml(
    data,
    qimenDunjiaBottomLabel,
    "時",
    qimenDunjiaCornerWords(data),
    true,
    computeQimenDunjiaGongNumbers(data)
  );
  document.getElementById("qimenDunjiaCompass").innerHTML = buildQimenCompassHtml(data, gridHtml, computeQimenDunjiaHexagrams(data));
  document.getElementById("qimenDunjiaExplain").style.display = "none";
  document.getElementById("qimenDunjiaExplain").innerHTML = "";
}

// 點選任一宮位格子，下方顯示該宮八卦／八門／神盤／九星／天盤干／地盤干解說；用 document 事件代理，
// 因為每次 renderQimen／renderQimenDunjia 都會整個重畫九宮格，個別格子上的監聽器不會保留。
// 「奇門命盤報告」頁籤跟獨立的「奇門遁甲」頁面各自有一份盤（currentQimen／currentQimenDunjia）跟
// 解說面板（qimenExplain／qimenDunjiaExplain），依格子所在的九宮格容器決定要用哪一份，不能混用
document.addEventListener("click", function (e) {
  const cell = e.target.closest(".qimen-cell");
  if (!cell) return;
  const inDunjia = !!cell.closest("#qimenDunjiaCompass");
  const data = inDunjia ? currentQimenDunjia : currentQimen;
  if (!data) return;
  const gong = Number(cell.dataset.gong);
  const panel = document.getElementById(inDunjia ? "qimenDunjiaExplain" : "qimenExplain");
  document.querySelectorAll(".qimen-cell.qimen-cell-selected").forEach((el) => el.classList.remove("qimen-cell-selected"));
  cell.classList.add("qimen-cell-selected");
  panel.innerHTML = buildQimenExplain(gong, data);
  panel.style.display = "block";
});

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

    // 點選九宮格才會出現的解說區塊沒點開時是 display:none，html2canvas 對 0 大小的元素會產生無效尺寸的
    // canvas，匯出時要濾掉，否則 jsPDF addImage 會拿到 NaN 高度而出錯
    const qimenSections = Array.from(document.querySelectorAll("#qimenCard > *:not(.card-head)"))
      .filter((el) => getComputedStyle(el).display !== "none");
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

// ================= 奇門遁甲（獨立頁面，複製奇門命盤報告的介面與功能，僅九宮格中下方文字改顯示格局名稱）=================
function showQimenDunjiaView() {
  hideAllFeatureViews();
  document.getElementById("mainView").style.display = "none";
  document.getElementById("qimenDunjiaView").style.display = "";
  setActiveNav("奇門遁甲");
}
function hideQimenDunjiaView() {
  document.getElementById("qimenDunjiaView").style.display = "none";
  document.getElementById("mainView").style.display = "";
  setActiveNav(null);
}
document.getElementById("qimenDunjiaBackBtn").addEventListener("click", hideQimenDunjiaView);

// 這個獨立頁面不收姓名／性別（只用來起盤查詢，不是命盤），gender 只是 calculateQimenHeader 內部
// buildDayun 需要的參數，這裡不會顯示大運（九宮格中下方已改顯示格局名稱），隨便帶哪個值都不影響結果
function runQimenDunjia(year, month, day, hour, minute) {
  currentQimenDunjia = calculateQimenHeader({ year, month, day, hour, minute, name: "", gender: "male", yiMaBasis: "time", kongWangBasis: "time" });
  renderQimenDunjia(currentQimenDunjia);
}

document.getElementById("qimenDunjiaPickBtn").addEventListener("click", function () {
  const year = Number(document.getElementById("qd-byear").value);
  const month = Number(document.getElementById("qd-bmonth").value);
  const day = Number(document.getElementById("qd-bday").value);
  const timeVal = document.getElementById("qd-btime").value;
  if (!timeVal) {
    alert("請先選擇時間");
    return;
  }
  const [hour, minute] = timeVal.split(":").map(Number);
  runQimenDunjia(year, month, day, hour, minute);
});

document.getElementById("qimenDunjiaNowBtn").addEventListener("click", function () {
  const now = new Date();
  document.getElementById("qd-byear").value = String(now.getFullYear());
  document.getElementById("qd-bmonth").value = String(now.getMonth() + 1);
  document.getElementById("qd-bday").value = String(now.getDate());
  document.getElementById("qd-btime").value =
    String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
  runQimenDunjia(now.getFullYear(), now.getMonth() + 1, now.getDate(), now.getHours(), now.getMinutes());
});

document.getElementById("exportQimenDunjiaPdfBtn").addEventListener("click", async function () {
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
    const title = textToImage("Aries 奇門遁甲—預測卜卦", 20, "#212529");
    pdf.addImage(title.dataUrl, "PNG", margin + 16, 8 + (12 - title.heightMM) / 2, title.widthMM, title.heightMM);

    // 點選九宮格才會出現的解說區塊沒點開時是 display:none，html2canvas 對 0 大小的元素會產生無效尺寸的
    // canvas，匯出時要濾掉，否則 jsPDF addImage 會拿到 NaN 高度而出錯
    const qimenSections = Array.from(document.querySelectorAll("#qimenDunjiaCard > *:not(.card-head)"))
      .filter((el) => getComputedStyle(el).display !== "none");
    await addSectionsToPdf(pdf, qimenSections, margin, pageWidth, pageHeight, 26);

    addPageNumbers(pdf, pageWidth, pageHeight);

    pdf.save("奇門遁甲—預測卜卦.pdf");
  } catch (err) {
    alert("匯出失敗：" + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = originalLabel;
  }
});

// ================= 奇門紅盤（獨立頁面，洋紅配色；四柱／八卦位置沿用，天地盤干/神/星/門的排盤 =================
// Phase 2 完成：排盤改用獨立的 js/qimen-hongpan-engine.js（calculateQimenHongpan），
// 機制（值符／值使／星門神旋轉／格局欄）與定局公式（年支＋農曆月＋農曆日＋時支 mod 9，
// 小奇門起數法）皆以 45 張復科時盤截圖反推定案、全數驗證，任意年份適用（詳見引擎檔頭）。
let currentQimenHongpan = null;
function showQimenHongpanView() {
  hideAllFeatureViews();
  document.getElementById("mainView").style.display = "none";
  document.getElementById("qimenHongpanView").style.display = "";
  setActiveNav("奇門紅盤");
}
function hideQimenHongpanView() {
  document.getElementById("qimenHongpanView").style.display = "none";
  document.getElementById("mainView").style.display = "";
  setActiveNav(null);
}
document.getElementById("qimenHongpanBackBtn").addEventListener("click", hideQimenHongpanView);

// 紅盤宮位底部文字：只放 81 格局名（跟復科紅盤一致；入墓改由引擎算好的角字顯示，
// 不用遁甲頁的 qimenDunjiaBottomLabel——那包含九遁／玉女守門等遁甲頁專屬規則，紅盤沒有）。
// getGeju81 是 81 格局對照「資料表」（Meta Academy PDF，兩頁同一來源），屬渲染層共用資料，非排盤邏輯。
function qimenHongpanBottomLabel(c) {
  const geju = getGeju81(c.tianGan, c.diGan);
  return geju ? geju.name : "";
}

function renderQimenHongpan(data) {
  document.getElementById("qimenHongpanCard").style.display = "block";
  document.getElementById("qimenHongpanPillars").innerHTML = buildQimenPillarsTable(data.siZhu);
  document.getElementById("qimenHongpanInfoPanel").innerHTML = buildQimenHongpanInfoTable(data);
  // 角字（門迫／宮迫／入墓）與外環 64 卦都由紅盤引擎逐宮算好直接取用；
  // 64 卦顯示位置／字級／直排橫排沿用遁甲頁同一套 buildQimenCompassHtml（傳第三參數即啟用）；
  // 第四參數＝十二長生對照（預設用日干起），外環地支旁顯示長生字
  const gridHtml = buildQimenGridHtml(data, qimenHongpanBottomLabel, "時", (c) => c.cornerWords || [], true, computeQimenDunjiaGongNumbers(data));
  document.getElementById("qimenHongpanCompass").innerHTML =
    buildQimenCompassHtml(data, gridHtml, data.hexagrams, hpChangShengMap(data.siZhu[1].gan.char));
  // 右上「長生」下拉連動：改選天干時，外環 12 個長生字就地改字（select 每次 render 重建，監聽跟著掛回）
  document.getElementById("hp-changsheng").addEventListener("change", function () {
    const map = hpChangShengMap(this.value);
    document.querySelectorAll("#qimenHongpanCompass .qc-changsheng").forEach((el) => {
      el.textContent = map[el.dataset.zhi] || "";
    });
  });
  document.getElementById("qimenHongpanExplain").style.display = "none";
  document.getElementById("qimenHongpanExplain").innerHTML = "";
}

function runQimenHongpan(year, month, day, hour, minute) {
  currentQimenHongpan = calculateQimenHongpan({ year, month, day, hour, minute });
  renderQimenHongpan(currentQimenHongpan);
}

document.getElementById("qimenHongpanPickBtn").addEventListener("click", function () {
  const year = Number(document.getElementById("hp-byear").value);
  const month = Number(document.getElementById("hp-bmonth").value);
  const day = Number(document.getElementById("hp-bday").value);
  const timeVal = document.getElementById("hp-btime").value;
  if (!timeVal) {
    alert("請先選擇時間");
    return;
  }
  const [hour, minute] = timeVal.split(":").map(Number);
  runQimenHongpan(year, month, day, hour, minute);
});

document.getElementById("qimenHongpanNowBtn").addEventListener("click", function () {
  const now = new Date();
  document.getElementById("hp-byear").value = String(now.getFullYear());
  document.getElementById("hp-bmonth").value = String(now.getMonth() + 1);
  document.getElementById("hp-bday").value = String(now.getDate());
  document.getElementById("hp-btime").value =
    String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
  runQimenHongpan(now.getFullYear(), now.getMonth() + 1, now.getDate(), now.getHours(), now.getMinutes());
});

document.getElementById("exportQimenHongpanPdfBtn").addEventListener("click", async function () {
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
    const title = textToImage("Aries 奇門紅盤—時盤", 20, "#212529");
    pdf.addImage(title.dataUrl, "PNG", margin + 16, 8 + (12 - title.heightMM) / 2, title.widthMM, title.heightMM);

    const sections = Array.from(document.querySelectorAll("#qimenHongpanCard > *:not(.card-head)"))
      .filter((el) => getComputedStyle(el).display !== "none");
    await addSectionsToPdf(pdf, sections, margin, pageWidth, pageHeight, 26);

    addPageNumbers(pdf, pageWidth, pageHeight);

    pdf.save("奇門紅盤—時盤.pdf");
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

// ================= 名片風水 =================
// 姓名／公司名分數改為使用者自行看著「風水分析」畫出來的九宮格數字圖，自行判斷後手動輸入
// （原本用 OCR 自動辨識姓名／公司名位置的做法準確度太差，已移除）；名片底色分數則仍用整張圖片
// 像素分析自動判斷，使用者可手動覆蓋；生肖分數鎖定不可調整（固定對照表查出來的）。
const mpState = { h: { imgW: 0, imgH: 0 }, v: { imgW: 0, imgH: 0 } };

function showMingpianView() {
  hideAllFeatureViews();
  document.getElementById("mainView").style.display = "none";
  document.getElementById("mingpianView").style.display = "";
  setActiveNav("名片風水");
}
function hideMingpianView() {
  document.getElementById("mingpianView").style.display = "none";
  document.getElementById("mainView").style.display = "";
  setActiveNav(null);
  mpStopCamera();
  mpResetAll();
}
document.getElementById("mingpianBackBtn").addEventListener("click", hideMingpianView);

// ================= 數字易經 =================
function showShuziView() {
  hideAllFeatureViews();
  document.getElementById("mainView").style.display = "none";
  document.getElementById("shuziView").style.display = "";
  setActiveNav("數字易經");
}
function hideShuziView() {
  document.getElementById("shuziView").style.display = "none";
  document.getElementById("mainView").style.display = "";
  setActiveNav(null);
  // 使用者輸入的數字不留存：離開頁面就清空，不會留在畫面或記憶體裡
  ["shuzi-input-num", "shuzi-input-name", "shuzi-input-id", "shuzi-input-plate"].forEach((id) => {
    document.getElementById(id).value = "";
  });
  fillYearMonthDaySelects(
    document.getElementById("shuzi-lunar-year"), document.getElementById("shuzi-lunar-month"), document.getElementById("shuzi-lunar-day"), new Date()
  );
  document.getElementById("shuziStatus").textContent = "";
  document.getElementById("shuziResults").innerHTML = "";
  document.querySelectorAll('input[name="shuziItem"]').forEach((cb) => { cb.checked = true; });
}
document.getElementById("shuziBackBtn").addEventListener("click", hideShuziView);

// 四吉卦／四凶卦（數字易經.pdf 第2、7頁），用來決定星曜徽章顏色
const SHUZI_GOOD_STARS = ["伏位", "延年", "生氣", "天醫"];
function shuziStarBadgeHtml(star) {
  if (!star) return "－";
  const cls = SHUZI_GOOD_STARS.includes(star) ? "good" : "bad";
  return '<span class="shuzi-star-badge ' + cls + '">' + star + "</span>";
}

// 八星滑動配對結果區塊（純數字／姓名／身份證號／車牌共用）
function shuziPairBlockHtml(digits) {
  const result = shuziAnalyze(digits);
  if (!result) return '<p class="shuzi-status">至少需要 2 位數字才能配對</p>';
  const rows = result.pairs.map((p, i) =>
    "<tr><td>第" + (i + 1) + "組</td><td class=\"shuzi-code\">" + p.code + "</td><td>" + shuziStarBadgeHtml(p.star) + "</td></tr>"
  ).join("");
  const meaning = shuziSumMeaning(result.sum);
  const meaningHtml = meaning
    ? '<div class="shuzi-sum-meaning"><span class="shuzi-star-badge ' + (meaning.luck === "吉" ? "good" : meaning.luck === "凶" ? "bad" : "") + '">' + meaning.luck + '</span>' + meaning.text + '</div>'
    : '';
  return (
    '<div class="shuzi-result">' +
      '<div class="shuzi-last-pair">' +
        '<span class="shuzi-result-label">末二碼（磁場最終結論）</span>' +
        '<span class="shuzi-code">' + result.lastPair.code + '</span>' +
        shuziStarBadgeHtml(result.lastPair.star) +
      '</div>' +
      '<table class="shuzi-pairs-table"><tr><th>順序</th><th>配對</th><th>八星</th></tr>' + rows + '</table>' +
      '<div class="shuzi-sum">數字總和：' + result.sum + '</div>' +
      meaningHtml +
    '</div>'
  );
}

// 身份證號卦象結果區塊
function shuziGuaBlockHtml(r) {
  return (
    '<div class="shuzi-gua-result">' +
      '<div class="shuzi-gua-process">中間6碼 ' + r.middle.join("") + '　→　' + r.sums.join("、") + '　→　最終 ' + r.finalDigits.join("、") + '（' + r.pattern + '）</div>' +
      '<h3 class="shuzi-gua-name">' + r.gua.name + '</h3>' +
      '<div class="shuzi-gua-field"><span class="shuzi-gua-label">性格</span><p>' + r.gua.personality + '</p></div>' +
      '<div class="shuzi-gua-field"><span class="shuzi-gua-label">愛情</span><p>' + r.gua.love + '</p></div>' +
      '<div class="shuzi-gua-field"><span class="shuzi-gua-label">事業</span><p>' + r.gua.career + '</p></div>' +
      '<div class="shuzi-gua-field"><span class="shuzi-gua-label">未來</span><p>' + r.gua.future + '</p></div>' +
    '</div>'
  );
}

function shuziItemChecked(name) {
  return document.querySelector('input[name="shuziItem"][value="' + name + '"]').checked;
}

// 使用者原始輸入的文字／數字直接寫進畫面跟 PDF，避免用 innerHTML 拼接時被當成 HTML 標籤解析
function shuziEscapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
function shuziRawInputHtml(label, raw) {
  return '<div class="shuzi-raw-input">您輸入的' + label + '：<strong>' + shuziEscapeHtml(raw) + '</strong></div>';
}
// 使用者若不小心貼上含 <b>、</b> 等標籤文字，要先清掉，不然字母 b 會被誤當成車牌／身份證號的英文字母去參與運算
function shuziStripTags(str) {
  return str.replace(/<\/?[a-zA-Z][^>]*>/g, "");
}

document.getElementById("shuziAnalyzeBtn").addEventListener("click", function () {
  const statusEl = document.getElementById("shuziStatus");
  const blocks = [];
  const errors = [];

  if (shuziItemChecked("純數字")) {
    const raw = shuziStripTags(document.getElementById("shuzi-input-num").value);
    const digits = raw.replace(/[^0-9]/g, "");
    if (digits) {
      if (digits.length < 2) {
        errors.push("純數字：請輸入至少 2 位數字");
      } else {
        blocks.push(
          '<section class="shuzi-item-result"><h3 class="shuzi-item-heading">純數字（市話手機末6碼）</h3>' +
          shuziRawInputHtml("純數字（市話手機末6碼）", raw) +
          shuziPairBlockHtml(digits) +
          '</section>'
        );
      }
    }
  }

  if (shuziItemChecked("姓名")) {
    const raw = shuziStripTags(document.getElementById("shuzi-input-name").value.trim());
    if (raw) {
      const nameResult = shuziNameToDigits(raw);
      if (nameResult.error) {
        errors.push("姓名：" + nameResult.error);
      } else {
        const breakdown = nameResult.breakdown.map((b) => b.char + "(" + b.strokes + "畫)").join(" ");
        blocks.push(
          '<section class="shuzi-item-result"><h3 class="shuzi-item-heading">姓名</h3>' +
          shuziRawInputHtml("姓名", raw) +
          '<div class="shuzi-gua-process">' + breakdown + '　→　' + nameResult.digits + '</div>' +
          shuziPairBlockHtml(nameResult.digits) +
          '</section>'
        );
      }
    }
  }

  if (shuziItemChecked("身份證號")) {
    const raw = shuziStripTags(document.getElementById("shuzi-input-id").value.trim());
    if (raw) {
      const r = shuziIdCardCombinedAnalyze(raw);
      if (r.error) {
        errors.push("身份證號：" + r.error);
      } else {
        blocks.push(
          '<section class="shuzi-item-result"><h3 class="shuzi-item-heading">身份證號</h3>' +
          shuziRawInputHtml("身份證號", raw) +
          '<div class="shuzi-gua-process">字母 ' + r.letter + ' 對應數字 ' + r.letterNum + '，併入號碼後：' + r.mergedDigits + '</div>' +
          shuziPairBlockHtml(r.mergedDigits) +
          '<h4 class="shuzi-sub-heading">卦象分析</h4>' +
          shuziGuaBlockHtml(r.gua) +
          '</section>'
        );
      }
    }
  }

  if (shuziItemChecked("農曆生日")) {
    const gYear = document.getElementById("shuzi-lunar-year").value;
    const gMonth = document.getElementById("shuzi-lunar-month").value;
    const gDay = document.getElementById("shuzi-lunar-day").value;
    const rawLabel = "西元" + gYear + "年" + gMonth + "月" + gDay + "日";
    const lb = shuziLunarBirthdayToDigits(gYear, gMonth, gDay);
    if (lb.error) {
      errors.push("農曆生日：" + lb.error);
    } else {
      blocks.push(
        '<section class="shuzi-item-result"><h3 class="shuzi-item-heading">農曆生日</h3>' +
        shuziRawInputHtml("西元出生年/月/日", rawLabel) +
        '<div class="shuzi-gua-process">換算農曆：民國' + lb.rocYear + '年' + lb.lunar.lMonth + '月' + lb.lunar.lDay + '日' + (lb.lunar.isLeap ? "（閏月）" : "") + '　→　' + lb.digits + '</div>' +
        shuziPairBlockHtml(lb.digits) +
        '</section>'
      );
    }
  }

  if (shuziItemChecked("車牌")) {
    const raw = shuziStripTags(document.getElementById("shuzi-input-plate").value.trim());
    if (raw) {
      const plateResult = shuziPlateToDigits(raw);
      if (plateResult.error) {
        errors.push("車牌：" + plateResult.error);
      } else if (plateResult.digits.length < 2) {
        errors.push("車牌：請輸入至少 2 碼英數字");
      } else {
        blocks.push(
          '<section class="shuzi-item-result"><h3 class="shuzi-item-heading">車牌</h3>' +
          shuziRawInputHtml("車牌", raw) +
          '<div class="shuzi-gua-process">英文字母對應數字後：' + plateResult.digits + '</div>' +
          shuziPairBlockHtml(plateResult.digits) +
          '</section>'
        );
      }
    }
  }

  if (!blocks.length && !errors.length) {
    statusEl.textContent = "請至少勾選一個項目並輸入內容";
    document.getElementById("shuziResults").innerHTML = "";
    return;
  }
  statusEl.textContent = errors.join("；");
  document.getElementById("shuziResults").innerHTML = blocks.join("");
});

document.getElementById("exportShuziPdfBtn").addEventListener("click", async function () {
  const btn = this;
  if (!document.getElementById("shuziResults").innerHTML.trim()) {
    document.getElementById("shuziStatus").textContent = "請先產生分析結果再匯出 PDF";
    return;
  }
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
    const title = textToImage("Aries 數字易經分析報告", 20, "#212529");
    pdf.addImage(title.dataUrl, "PNG", margin + 16, 8 + (12 - title.heightMM) / 2, title.widthMM, title.heightMM);

    const sections = Array.from(document.querySelectorAll("#shuziResults > *"))
      .filter((el) => getComputedStyle(el).display !== "none");
    await addSectionsToPdf(pdf, sections, margin, pageWidth, pageHeight, 26);

    addPageNumbers(pdf, pageWidth, pageHeight);
    pdf.save("數字易經分析報告.pdf");
  } catch (err) {
    alert("匯出失敗：" + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = originalLabel;
  }
});

// ================= 濟公棋卦・前世因果 =================
function showJigongView() {
  hideAllFeatureViews();
  document.getElementById("mainView").style.display = "none";
  document.getElementById("jigongView").style.display = "";
  setActiveNav("濟公棋卦");
}
function hideJigongView() {
  document.getElementById("jigongView").style.display = "none";
  document.getElementById("mainView").style.display = "";
  setActiveNav(null);
  jigongClearBoard();
}
document.getElementById("jigongBackBtn").addEventListener("click", hideJigongView);

const JIGONG_POS_ORDER = ["center", "left", "right", "top", "bottom"];
const jigongState = { pieces: { center: null, left: null, right: null, top: null, bottom: null }, selected: null };

// 「當前選擇」用跟盤面棋子同樣造型的圓形圖示呈現（紅/黑框線＋棋子字），沒選擇時顯示文字「尚未選擇」
function jigongUpdateSelectedLabel() {
  const labelEl = document.getElementById("jigongSelectedLabel");
  if (!jigongState.selected) {
    labelEl.textContent = "尚未選擇";
    return;
  }
  const piece = jigongFindPiece(jigongState.selected);
  labelEl.innerHTML = '<span class="jigong-selected-icon ' + piece.color + '">' + piece.char + "</span>";
}

function jigongRenderPalette() {
  const redPieces = JIGONG_PIECES.filter((p) => p.color === "red");
  const blackPieces = JIGONG_PIECES.filter((p) => p.color === "black");
  const rowHtml = (pieces) => pieces.map((p) =>
    '<button type="button" class="jigong-piece-btn ' + p.color + (jigongState.selected === p.char ? " selected" : "") + '" data-char="' + p.char + '">' + p.char + "</button>"
  ).join("");
  document.getElementById("jigongPiecePalette").innerHTML =
    '<div class="jigong-piece-row">' + rowHtml(redPieces) + "</div>" +
    '<div class="jigong-piece-row">' + rowHtml(blackPieces) + "</div>";
  document.querySelectorAll(".jigong-piece-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      jigongState.selected = this.dataset.char;
      jigongRenderPalette();
      jigongUpdateSelectedLabel();
    });
  });
}

function jigongRenderBoard() {
  JIGONG_POS_ORDER.forEach((pos) => {
    const el = document.querySelector('.jigong-pos[data-pos="' + pos + '"]');
    const pieceSpan = el.querySelector(".jigong-pos-piece");
    const char = jigongState.pieces[pos];
    if (char) {
      const piece = jigongFindPiece(char);
      pieceSpan.textContent = char;
      pieceSpan.className = "jigong-pos-piece filled " + piece.color;
    } else {
      pieceSpan.textContent = "";
      pieceSpan.className = "jigong-pos-piece";
    }
  });
}

function jigongClearBoard() {
  JIGONG_POS_ORDER.forEach((pos) => { jigongState.pieces[pos] = null; });
  jigongState.selected = null;
  jigongUpdateSelectedLabel();
  jigongRenderPalette();
  jigongRenderBoard();
  jigongRenderResult();
}

function jigongRenderResult() {
  const resultEl = document.getElementById("jigongResult");
  if (!jigongState.pieces.center) {
    resultEl.innerHTML = '<p class="jigong-placeholder">請放上 5 支棋。第一支（中宮）決定前世性別與身分。</p>';
    return;
  }
  const gender = document.querySelector('input[name="jigongGender"]:checked').value;
  const currentGenderLabel = gender === "female" ? "女" : "男";
  const r = calculateJigongPastLife(jigongState.pieces);

  let relationHtml;
  if (r.noMatchNote) {
    relationHtml = '<p class="jigong-relation-line">' + r.noMatchNote + "</p>";
  } else {
    relationHtml = r.relations.map((rel) =>
      '<p class="jigong-relation-line">' + rel.labelA + " " + rel.charA + " ↔ " + rel.labelB + " " + rel.charB +
      "（同字" + (rel.sameColor ? "同色" : "異色") + "）→ " + rel.text + "</p>"
    ).join("");
  }

  resultEl.innerHTML =
    '<div class="jigong-result-block"><h3>前世自身（依中宮第一支棋）</h3>' +
    '<p class="jigong-result-highlight">前世性別：' + r.pastLifeGender + "（第一支" + (r.centerColor === "red" ? "紅" : "黑") + "棋；現在性別：" + currentGenderLabel + "）</p>" +
    '<p class="jigong-result-highlight">前世身分：' + r.identity + "</p></div>" +
    '<div class="jigong-result-block"><h3>前世關係（5 個位置兩兩配對）</h3>' + relationHtml + "</div>" +
    '<div class="jigong-result-block jigong-reminder-block"><h3>提醒</h3>' +
    "<p>今生關係 ≠ 前世關係。今生是夫妻，前世可能是家人、合作伙伴、上司下屬，甚至是新緣分。</p></div>";
}

document.querySelectorAll('input[name="jigongGender"]').forEach((el) => el.addEventListener("change", jigongRenderResult));

document.getElementById("jigongBoard").addEventListener("click", function (e) {
  const posEl = e.target.closest(".jigong-pos");
  if (!posEl) return;
  const pos = posEl.dataset.pos;
  if (jigongState.selected) {
    jigongState.pieces[pos] = jigongState.selected;
    jigongState.selected = null;
    jigongUpdateSelectedLabel();
    jigongRenderPalette();
  } else if (jigongState.pieces[pos]) {
    // 沒有選棋子時點擊已放置的位置＝移除該棋子，方便修改
    jigongState.pieces[pos] = null;
  }
  jigongRenderBoard();
  jigongRenderResult();
});

document.getElementById("jigongClearBtn").addEventListener("click", jigongClearBoard);

document.getElementById("jigongRandom5Btn").addEventListener("click", function () {
  JIGONG_POS_ORDER.forEach((pos) => {
    jigongState.pieces[pos] = JIGONG_PIECES[Math.floor(Math.random() * JIGONG_PIECES.length)].char;
  });
  jigongState.selected = null;
  jigongUpdateSelectedLabel();
  jigongRenderPalette();
  jigongRenderBoard();
  jigongRenderResult();
});

document.getElementById("jigongRandomNextBtn").addEventListener("click", function () {
  const nextPos = JIGONG_POS_ORDER.find((pos) => !jigongState.pieces[pos]);
  if (!nextPos) return;
  jigongState.pieces[nextPos] = JIGONG_PIECES[Math.floor(Math.random() * JIGONG_PIECES.length)].char;
  jigongRenderBoard();
  jigongRenderResult();
});

document.getElementById("exportJigongPdfBtn").addEventListener("click", async function () {
  const btn = this;
  if (!jigongState.pieces.center) {
    alert("請先放上棋子（至少中宮）再匯出 PDF");
    return;
  }
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
    const title = textToImage("Aries 濟公棋卦・前世因果報告", 20, "#212529");
    pdf.addImage(title.dataUrl, "PNG", margin + 16, 8 + (12 - title.heightMM) / 2, title.widthMM, title.heightMM);

    const sections = [document.getElementById("jigongBoard"), document.getElementById("jigongResult")];
    await addSectionsToPdf(pdf, sections, margin, pageWidth, pageHeight, 26);

    addPageNumbers(pdf, pageWidth, pageHeight);
    pdf.save("濟公棋卦-前世因果報告.pdf");
  } catch (err) {
    alert("匯出失敗：" + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = originalLabel;
  }
});

jigongRenderPalette();
jigongRenderBoard();

(function initMingpianSelects() {
  const zodiacSel = document.getElementById("mp-zodiac");
  zodiacSel.innerHTML = MP_ZODIAC_ORDER.map((z) => '<option value="' + z + '">' + z + "</option>").join("");
  zodiacSel.value = "鼠";
  document.getElementById("mp-zodiac-score").value = MP_ZODIAC_SCORE["鼠"];
  zodiacSel.addEventListener("change", function () {
    document.getElementById("mp-zodiac-score").value = MP_ZODIAC_SCORE[this.value];
    mpRecomputeTotal();
  });

  const colorSel = document.getElementById("mp-color");
  colorSel.innerHTML = MP_COLOR_LIST.map((c) => '<option value="' + c.name + '">' + c.name + "</option>").join("") +
    '<option value="彩色">彩色</option>';
  colorSel.value = "白";
  document.getElementById("mp-color-score").value = MP_COLOR_SCORE["白"];
  colorSel.addEventListener("change", function () {
    document.getElementById("mp-color-score").value = MP_COLOR_SCORE[this.value];
    mpRecomputeTotal();
  });
  document.getElementById("mp-color-score").addEventListener("input", mpRecomputeTotal);
  document.getElementById("mp-name-score").addEventListener("input", mpRecomputeTotal);
  document.getElementById("mp-company-score").addEventListener("input", mpRecomputeTotal);
})();

function mpRecomputeTotal() {
  const n = Number(document.getElementById("mp-name-score").value) || 0;
  const z = Number(document.getElementById("mp-zodiac-score").value) || 0;
  const c = Number(document.getElementById("mp-color-score").value) || 0;
  const co = Number(document.getElementById("mp-company-score").value) || 0;
  const total = n + z + c + co;
  document.getElementById("mp-total-score").textContent = total;
  document.getElementById("mp-total-fortune").textContent = mpFortuneText(total);
  const category = mpFortuneCategory(total);
  const badge = document.getElementById("mp-total-category");
  badge.textContent = category || "";
  badge.className = "mingpian-category-badge" + (category ? " " + MP_CATEGORY_CLASS[category] : "");
}

// 橫式（9x5.5）／直式（5.5x9，橫式轉90度）名片各自獨立一組上傳＋結果，ID 後面加 V 代表直式那一組
const MP_ORIENTATIONS = {
  h: { img: "mingpianPreviewImg", hint: "mingpianUploadHint", file: "mingpianFileInput", cam: "mingpianCameraBtn", canvas: "mingpianResultCanvas", resultHint: "mingpianResultHint", grid: null, ratio: 9 / 5.5 },
  v: { img: "mingpianPreviewImgV", hint: "mingpianUploadHintV", file: "mingpianFileInputV", cam: "mingpianCameraBtnV", canvas: "mingpianResultCanvasV", resultHint: "mingpianResultHintV", grid: null, ratio: 5.5 / 9 }
};
MP_ORIENTATIONS.h.grid = MP_GRID_SCORE;
MP_ORIENTATIONS.v.grid = MP_GRID_SCORE_V;

// 換一張新的名片圖片（不管是從檔案選取還是拍照）：預覽並清空上一次分析的結果，
// 避免使用者誤以為新圖片沿用舊分數
function mpSetPreviewImage(dataUrl, orientation) {
  const o = MP_ORIENTATIONS[orientation || "h"];
  const img = document.getElementById(o.img);
  img.src = dataUrl;
  img.style.display = "";
  document.getElementById(o.hint).style.display = "none";

  document.getElementById("mingpianAnalyzeStatus").textContent = "";
  document.getElementById(o.canvas).style.display = "none";
  document.getElementById(o.resultHint).style.display = "";
  mpRecomputeTotal();
}

// 使用者拍照／分析的資料一律不留存：離開名片風水頁面（按返回）就整組清空，
// 不會留在畫面或記憶體裡等下次進來被看到——本來就沒有寫進 Firestore／localStorage，
// 名片底色分析也是瀏覽器端 canvas 像素分析，圖片不會被上傳到任何伺服器
function mpResetAll() {
  ["h", "v"].forEach((key) => {
    const o = MP_ORIENTATIONS[key];
    const img = document.getElementById(o.img);
    img.src = "";
    img.style.display = "none";
    document.getElementById(o.hint).style.display = "";
    document.getElementById(o.file).value = "";
    document.getElementById(o.canvas).style.display = "none";
    document.getElementById(o.resultHint).style.display = "";
  });
  document.getElementById("mingpianAnalyzeStatus").textContent = "";

  document.getElementById("mp-name").value = "";
  document.getElementById("mp-name-score").value = 0;
  document.getElementById("mp-gender").value = "male";
  document.getElementById("mp-zodiac").value = "鼠";
  document.getElementById("mp-zodiac-score").value = MP_ZODIAC_SCORE["鼠"];
  document.getElementById("mp-color").value = "白";
  document.getElementById("mp-color-score").value = MP_COLOR_SCORE["白"];
  document.getElementById("mp-company").value = "";
  document.getElementById("mp-company-score").value = 0;

  mpState.h.imgW = 0;
  mpState.h.imgH = 0;
  mpState.v.imgW = 0;
  mpState.v.imgH = 0;
  mpRecomputeTotal();
}

document.getElementById("mingpianFileInput").addEventListener("change", function () {
  const file = this.files && this.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) { mpSetPreviewImage(e.target.result, "h"); };
  reader.readAsDataURL(file);
});
document.getElementById("mingpianFileInputV").addEventListener("change", function () {
  const file = this.files && this.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) { mpSetPreviewImage(e.target.result, "v"); };
  reader.readAsDataURL(file);
});

// 自訂拍照畫面：用 getUserMedia 開啟相機直接在頁面內預覽，疊加白色框線導引使用者對齊名片
// （橫式框線比例 9:5.5，直式框線比例 5.5:9），拍照時只裁切框線範圍內的畫面，而不是整個鏡頭視野，
// 確保輸出圖片的長寬比跟名片實際比例一致
let mpCameraStream = null;
let mpCameraOrientation = "h";

function mpStopCamera() {
  if (mpCameraStream) {
    mpCameraStream.getTracks().forEach((t) => t.stop());
    mpCameraStream = null;
  }
  document.getElementById("mingpianCameraOverlay").style.display = "none";
}

async function mpOpenCamera(orientation) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showToast("此瀏覽器不支援相機拍照，請改用「選擇圖片」上傳", "error");
    return;
  }
  try {
    mpCameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
  } catch (err) {
    showToast("無法開啟相機：" + err.message, "error");
    return;
  }
  mpCameraOrientation = orientation;
  const frame = document.querySelector(".mingpian-camera-frame");
  const wrap = document.getElementById("mingpianCameraVideoWrap");
  const o = MP_ORIENTATIONS[orientation];
  document.querySelector(".mingpian-camera-hint").textContent = orientation === "v" ?
    "請將名片對齊白框（比例 5.5 x 9 公分）拍攝" : "請將名片對齊白框（比例 9 x 5.5 公分）拍攝";
  const video = document.getElementById("mingpianCameraVideo");
  video.srcObject = mpCameraStream;
  document.getElementById("mingpianCameraOverlay").style.display = "flex";

  // 相機預覽的長寬比因裝置而異，要等影像metadata載入、wrap真正撐開高度後，才能算出框線在
  // 「寬」「高」兩個方向都不會超出預覽畫面的最大尺寸（不然直式框線在橫式預覽畫面裡會被裁掉一截）
  const sizeFrame = () => {
    const wrapRect = wrap.getBoundingClientRect();
    const margin = 0.86;
    let fw = wrapRect.width * margin;
    let fh = fw / o.ratio;
    if (fh > wrapRect.height * margin) {
      fh = wrapRect.height * margin;
      fw = fh * o.ratio;
    }
    frame.style.width = fw + "px";
    frame.style.height = fh + "px";
  };
  if (video.videoWidth) {
    sizeFrame();
  } else {
    video.addEventListener("loadedmetadata", sizeFrame, { once: true });
  }
}
document.getElementById("mingpianCameraBtn").addEventListener("click", () => mpOpenCamera("h"));
document.getElementById("mingpianCameraBtnV").addEventListener("click", () => mpOpenCamera("v"));

document.getElementById("mingpianCameraCancelBtn").addEventListener("click", mpStopCamera);

document.getElementById("mingpianCaptureBtn").addEventListener("click", function () {
  const video = document.getElementById("mingpianCameraVideo");
  const wrap = document.getElementById("mingpianCameraVideoWrap");
  const frame = document.querySelector(".mingpian-camera-frame");
  const wrapRect = wrap.getBoundingClientRect();
  const frameRect = frame.getBoundingClientRect();
  const scaleX = video.videoWidth / wrapRect.width;
  const scaleY = video.videoHeight / wrapRect.height;
  const sx = (frameRect.left - wrapRect.left) * scaleX;
  const sy = (frameRect.top - wrapRect.top) * scaleY;
  const sw = frameRect.width * scaleX;
  const sh = frameRect.height * scaleY;

  const o = MP_ORIENTATIONS[mpCameraOrientation];
  const outW = mpCameraOrientation === "v" ? 550 : 900;
  const outH = Math.round(outW / o.ratio);
  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  canvas.getContext("2d").drawImage(video, sx, sy, sw, sh, 0, 0, outW, outH);

  mpSetPreviewImage(canvas.toDataURL("image/jpeg", 0.92), mpCameraOrientation);
  mpStopCamera();
});

// 名片底色：把圖片縮小取樣成 60x60，每個像素找最接近的顏色分類，佔比 50% 以上才採用，否則歸類「彩色」
function mpAnalyzeColor(img) {
  const sampleSize = 60;
  const tmp = document.createElement("canvas");
  tmp.width = sampleSize;
  tmp.height = sampleSize;
  const ctx = tmp.getContext("2d");
  ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
  const data = ctx.getImageData(0, 0, sampleSize, sampleSize).data;
  const counts = {};
  for (let i = 0; i < data.length; i += 4) {
    const name = mpNearestColorName(data[i], data[i + 1], data[i + 2]);
    counts[name] = (counts[name] || 0) + 1;
  }
  const total = sampleSize * sampleSize;
  let best = null;
  let bestCount = 0;
  Object.keys(counts).forEach((name) => {
    if (counts[name] > bestCount) { bestCount = counts[name]; best = name; }
  });
  return best && bestCount / total >= 0.5 ? best : "彩色";
}

// 右側結果圖：畫出原圖＋紅線（水平垂直三等分，九宮格線）＋藍線（通過中心點的 8 等分線，第一條在
// 22.5 度）＋每個宮位中央的紅色分數數字（橫式：左上2／左中1／左下8／中上3／正中9／中下7／右上4／
// 右中5／右下6；直式：左上8／左中7／左下6／中上1／正中9／中下5／右上2／右中3／右下4，兩種排法
// 都在中上、中下另外加註「客戶空間」「利潤空間」），使用者自己看圖判斷姓名／公司名落在哪個宮位、
// 手動把對應分數填進下方欄位。用向量畫線＋畫字而不是套用固定比例的點陣疊圖，才能保證線條角度／
// 文字位置精準，不會因為照片長寬比不同而跟著跑位
function mpDrawResultCanvas(orientation) {
  const o = MP_ORIENTATIONS[orientation];
  const canvas = document.getElementById(o.canvas);
  const img = document.getElementById(o.img);
  const dim = mpState[orientation];
  if (!img.src || !dim.imgW) return;
  const w = dim.imgW;
  const h = dim.imgH;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);

  const cellW = w / 3;
  const cellH = h / 3;

  // 紅線：水平／垂直三等分線（九宮格的格線本身）
  ctx.strokeStyle = "rgba(234,0,0,0.85)";
  ctx.lineWidth = Math.max(2, w * 0.004);
  ctx.beginPath();
  ctx.moveTo(cellW, 0); ctx.lineTo(cellW, h);
  ctx.moveTo(cellW * 2, 0); ctx.lineTo(cellW * 2, h);
  ctx.moveTo(0, cellH); ctx.lineTo(w, cellH);
  ctx.moveTo(0, cellH * 2); ctx.lineTo(w, cellH * 2);
  ctx.stroke();

  // 藍線：通過畫面水平／垂直中心點的 8 等分線（4 條線、每條間隔 45 度，第一條在 22.5 度）
  const cx = w / 2;
  const cy = h / 2;
  const diag = Math.sqrt(w * w + h * h);
  ctx.strokeStyle = "rgba(0,75,151,0.75)";
  ctx.lineWidth = Math.max(1, w * 0.0025);
  ctx.beginPath();
  [22.5, 67.5, 112.5, 157.5].forEach((deg) => {
    const rad = (deg * Math.PI) / 180;
    const dx = Math.cos(rad) * diag;
    const dy = Math.sin(rad) * diag;
    ctx.moveTo(cx - dx, cy - dy);
    ctx.lineTo(cx + dx, cy + dy);
  });
  ctx.stroke();

  // 九宮格分數數字（紅字），中上／中下額外加註區塊名稱
  const grid = o.grid;
  const fontSize = Math.max(16, Math.round(w * 0.045));
  ctx.fillStyle = "rgba(234,0,0,0.95)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const cellCenter = (row, col) => ({ x: cellW * (col + 0.5), y: cellH * (row + 0.5) });
  const labels = [
    { row: 0, col: 0, score: grid[0][0] },
    { row: 0, col: 1, score: grid[0][1], zone: "客戶空間" },
    { row: 0, col: 2, score: grid[0][2] },
    { row: 1, col: 0, score: grid[1][0] },
    { row: 1, col: 1, score: grid[1][1] },
    { row: 1, col: 2, score: grid[1][2] },
    { row: 2, col: 0, score: grid[2][0] },
    { row: 2, col: 1, score: grid[2][1], zone: "利潤空間" },
    { row: 2, col: 2, score: grid[2][2] }
  ];
  labels.forEach((l) => {
    const { x, y } = cellCenter(l.row, l.col);
    if (l.zone) {
      ctx.font = "bold " + fontSize + "px sans-serif";
      ctx.fillText(String(l.score), x, y - fontSize * 0.4);
      ctx.font = "bold " + Math.round(fontSize * 0.55) + "px sans-serif";
      ctx.fillText(l.zone, x, y + fontSize * 0.5);
    } else {
      ctx.font = "bold " + fontSize + "px sans-serif";
      ctx.fillText(String(l.score), x, y);
    }
  });

  canvas.style.display = "";
  document.getElementById(o.resultHint).style.display = "none";
}

document.getElementById("mingpianAnalyzeBtn").addEventListener("click", function () {
  const imgH = document.getElementById("mingpianPreviewImg");
  const imgV = document.getElementById("mingpianPreviewImgV");
  const hasH = imgH.src && imgH.style.display !== "none";
  const hasV = imgV.src && imgV.style.display !== "none";
  const statusEl = document.getElementById("mingpianAnalyzeStatus");
  if (!hasH && !hasV) {
    showToast("請先上傳名片圖片", "error");
    return;
  }

  statusEl.textContent = "正在分析名片底色...";
  const colorImg = hasH ? imgH : imgV;
  const colorName = mpAnalyzeColor(colorImg);
  document.getElementById("mp-color").value = colorName;
  document.getElementById("mp-color-score").value = MP_COLOR_SCORE[colorName];

  if (hasH) {
    mpState.h.imgW = imgH.naturalWidth;
    mpState.h.imgH = imgH.naturalHeight;
    mpDrawResultCanvas("h");
  }
  if (hasV) {
    mpState.v.imgW = imgV.naturalWidth;
    mpState.v.imgH = imgV.naturalHeight;
    mpDrawResultCanvas("v");
  }
  mpRecomputeTotal();
  statusEl.innerHTML = mpAnalyzeTipsHtml();
});

// 「套用分析」完成後顯示的完整名片風水設計原則（使用者提供的 23 條規則）。
// 第7、9、20、21+22 條各自附一張參考圖（使用者存到 assets/mingpian-tipN.png）
function mpAnalyzeTipsHtml() {
  return "分析完成，請對照右側九宮格數字，自行判斷公司名／姓名落在哪個宮位並填入分數。<br><br>" +
    "1.公司名不可被紅色字水平或垂直中間切半，亦不可被藍色斜線條切到，自行累加跨宮位紅色數字總分。<br>" +
    "2.姓名不可被紅色字水平或垂直中間切半，亦不可被藍色斜線條切到，自行累加跨宮位紅色數字總分。<br>" +
    "3.名片底色以佔全部面積超過50%顏色為主。<br>" +
    "4.名片的四周不要加框，會造成發展上的受限<br>" +
    "5.姓名的四周不要框起來，否則會拓展不出去<br>" +
    "6.名字不可放在名片的中宮，否則會「忙、茫、盲」又賺不到錢<br>" +
    "7.公司名與人名皆不要置於「空煞、地劫、無主、孤寡」線上。<br>" +
    '<img src="assets/mingpian-tip7.png" alt="空煞線、地劫線、孤寡線、無主線示意圖">' +
    "8.姓名勿受壓迫，四周要有些空白空間<br>" +
    "9.姓名的「第一個字」不要被任何線切到（含斜線）<br>" +
    '<img src="assets/mingpian-tip9.png" alt="姓名第一個字不可被線切到示意圖">' +
    "10.姓名間距不要太寬或字體太大<br>" +
    "11.姓名不要用太細或軟弱的字體<br>" +
    "12.姓名若是黑色的，旁邊的字不要是紅色的（因：水火會相剋）<br>" +
    "13.名片上設計的線條不要切到藍色斜線，虛線不忌<br>" +
    "14.名片的顏色不要太多，避免五行雜亂<br>" +
    "15.名片的底色，最好與所屬行業同色或相生，白色適合各行各業。<br>" +
    "【藍色．綠色】家具．園藝．農夫．作家．文教店．服飾．敬神物品．裝潢．醫療．藥物<br>" +
    "【紅色．紫色】照明．光學．廚師．理髮．化妝品．表演．繪畫美術．菸酒．攝影．化工．眼鏡．加油站．教育．顧問<br>" +
    "【黃色．棕色】房地產．建築．水泥．陶瓷器．飼料．售現成農作物．石雕．營養師<br>" +
    "【灰色．銀色】電器．樂器．金屬加工．五金．醫療儀器．汽車．軍警．珠寶．銀樓<br>" +
    "【黑色．極深藍】水利．水產．旅遊．冷凍．清潔業．運輸．網購．貿易．音響．股票．金融．財稅<br>" +
    "如無法確認行業五行，名片底色就使用白色<br>" +
    "16.名片除了自己的名字之外，避免同時印第二個人的名字<br>" +
    "17.頭銜太多的人，有時人情包袱也會變大，無法專心工作<br>" +
    "18.名片字體勿排列歪斜<br>" +
    "19.實體字：楷書．中/粗明體．中/粗圓體．中/粗黑體．隸書<br>" +
    "20.虛體字：行書．細明體．細圓體．細黑體．浪漫字體<br>" +
    '<img src="assets/mingpian-tip20.png" alt="實體字與虛體字示意圖">' +
    "21.依在公司的職務性質與男女，調配適當的位置<br>" +
    "22.依個人與公司的關係，選擇上下排列的位置<br>" +
    '<img src="assets/mingpian-tip21.png" alt="職務性別與位置配置示意圖">' +
    "23.姓名、公司名至少有一個才計算「名片風水總分」";
}

document.getElementById("exportMingpianPdfBtn").addEventListener("click", async function () {
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
    const title = textToImage("Aries 名片風水報告", 20, "#212529");
    pdf.addImage(title.dataUrl, "PNG", margin + 16, 8 + (12 - title.heightMM) / 2, title.widthMM, title.heightMM);

    // 按鍵、狀態文字等不該進 PDF 的區塊都標了 data-html2canvas-ignore，這裡也要濾掉，
    // 不然 html2canvas 對 <button> 這種元素直接截圖會整個匯出失敗（親測會丟例外）
    const sections = Array.from(document.querySelectorAll("#mingpianCard > *:not(.card-head):not([data-html2canvas-ignore])"))
      .filter((el) => getComputedStyle(el).display !== "none");
    await addSectionsToPdf(pdf, sections, margin, pageWidth, pageHeight, 26);

    addPageNumbers(pdf, pageWidth, pageHeight);

    const filename = (document.getElementById("mp-name").value || "名片風水") + "-名片風水報告.pdf";
    pdf.save(filename);
  } catch (err) {
    alert("匯出失敗：" + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = originalLabel;
  }
});
