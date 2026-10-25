// 系統維護頁：只有 ADMIN_EMAIL（見 js/auth.js）本人登入才能看到，用來核准帳號、開關三個報告的權限。
// 每個操作（核准/停權、勾選權限）都是即時寫回 Firestore，跟 firestore.rules 的 isAdmin() 判斷條件對應，
// 一般使用者即使照抄前端程式碼呼叫這些函式，也會被安全規則擋下來（規則只放行 token email 等於管理者的寫入）。

const STATUS_LABEL = { approved: "已核准", pending: "審核中" };

function adminMsg(text, type) {
  const el = document.getElementById("adminMsg");
  el.textContent = text;
  el.className = "form-msg show " + type;
  setTimeout(() => { el.className = "form-msg"; }, 3000);
}

function formatCreatedAt(ts) {
  if (!ts || !ts.toDate) return "—";
  const d = ts.toDate();
  const pad = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
}

// 跟 js/app.js 的 effectivePermissions() 是同一套規則，畫面上顯示的初始勾選狀態要跟使用者登入後
// 實際看到的權限一樣，管理者才不會誤判目前狀態。舊帳號（完全沒有 permissions 欄位）：八字／人格解碼／
// 生命靈數／奇門命盤沿用舊行為視為開放，五個新導覽功能一律未開放；有 permissions 欄位但缺新欄位的帳號：
// 奇門命盤沿用開放（避免現有使用者權限系統上線後突然被鎖），其餘新欄位視為未開放。
const PERM_KEYS = ["bazi", "renge", "lifenum", "qimen", "qimenDunjia", "qimenHongpan", "qimenSansheng", "guanyin", "jigong", "fengshui", "mingpian", "zibai", "bazhai", "cuiwang", "qimenshuzi", "ziwei", "xingming", "tongsheng", "xingzuo", "tiepan"];
function effectivePermissions(data) {
  const raw = data.permissions;
  if (!raw) {
    return { bazi: true, renge: true, lifenum: true, qimen: true, qimenDunjia: false, qimenHongpan: false, qimenSansheng: false, guanyin: false, jigong: false, fengshui: false, mingpian: false, zibai: false, bazhai: false, cuiwang: false, qimenshuzi: false, ziwei: false, xingming: false, tongsheng: false, xingzuo: false, tiepan: false };
  }
  return {
    bazi: !!raw.bazi,
    renge: !!raw.renge,
    lifenum: !!raw.lifenum,
    qimen: raw.qimen !== undefined ? !!raw.qimen : true,
    qimenDunjia: !!raw.qimenDunjia,
    qimenHongpan: !!raw.qimenHongpan,
    qimenSansheng: !!raw.qimenSansheng,
    guanyin: !!raw.guanyin,
    jigong: !!raw.jigong,
    fengshui: !!raw.fengshui,
    mingpian: !!raw.mingpian,
    zibai: !!raw.zibai,
    bazhai: !!raw.bazhai,
    cuiwang: !!raw.cuiwang,
    qimenshuzi: !!raw.qimenshuzi,
    ziwei: !!raw.ziwei,
    xingming: !!raw.xingming,
    tongsheng: !!raw.tongsheng,
    xingzuo: !!raw.xingzuo,
    tiepan: !!raw.tiepan
  };
}

function renderUserRow(uid, data) {
  const perms = effectivePermissions(data);
  const tr = document.createElement("tr");
  tr.dataset.name = data.name || "";
  const checkboxCells = PERM_KEYS.map((key) =>
    '<td class="admin-checkbox-cell"><input type="checkbox" data-uid="' + uid + '" data-perm="' + key + '" ' + (perms[key] ? "checked" : "") + "></td>"
  ).join("");
  tr.innerHTML =
    "<td>" + (data.name || "") + "</td>" +
    "<td>" + (data.email || "") + "</td>" +
    '<td><button class="admin-status-btn ' + (data.status === "approved" ? "approved" : "pending") + '" data-uid="' + uid + '">' +
      (STATUS_LABEL[data.status] || data.status || "未知") + "</button></td>" +
    checkboxCells +
    "<td>" + formatCreatedAt(data.createdAt) + "</td>" +
    '<td class="admin-lastlogin-cell">' + (data.lastLoginAt ? formatCreatedAt(data.lastLoginAt) : '<span class="admin-self-tag">尚未登入</span>') + "</td>" +
    // 管理者本人的帳號不提供移除（避免把自己刪掉後台就進不來）
    '<td class="admin-op-cell">' +
      '<button class="admin-reset-btn" data-email="' + (data.email || "") + '" data-name="' + (data.name || "") + '">重設密碼</button>' +
      (data.email === ADMIN_EMAIL
        ? '<span class="admin-self-tag">管理者</span>'
        : '<button class="admin-delete-btn" data-uid="' + uid + '" data-name="' + (data.name || "") + '" data-email="' + (data.email || "") + '">移除</button>') +
    "</td>";
  return tr;
}

// ===== 分頁狀態：一次抓全部帳號到記憶體，用戶端依姓名關鍵字篩選後每頁 20 筆 =====
const PAGE_SIZE = 20;
let allUsers = [];       // [{id, data}] 依申請時間由新到舊
let filteredUsers = [];  // 套用姓名關鍵字後的清單
let currentPage = 1;
let searchKeyword = "";

async function loadUsers() {
  const tbody = document.getElementById("adminTableBody");
  tbody.innerHTML = '<tr><td colspan="24">載入中...</td></tr>';
  try {
    // 不用 orderBy("createdAt")：Firestore 的 orderBy 會靜默略過「缺該欄位」的文件，
    // 導致 createdAt 缺值／serverTimestamp 尚未解析的帳號（例如剛註冊）在後台看不到。
    // 改抓全部、用戶端排序（缺 createdAt 者排最後，仍會顯示）。
    const snap = await db.collection("users").get();
    allUsers = [];
    snap.forEach((doc) => allUsers.push({ id: doc.id, data: doc.data() }));
    allUsers.sort((a, b) => {
      const ta = a.data.createdAt, tb = b.data.createdAt;
      const va = ta && ta.toMillis ? ta.toMillis() : 0;
      const vb = tb && tb.toMillis ? tb.toMillis() : 0;
      return vb - va; // 由新到舊；缺 createdAt 者（0）排最後
    });
    applyFilter();
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="24">載入失敗：' + err.message + "</td></tr>";
  }
}

// 套用姓名關鍵字（不分大小寫）→ 回到第 1 頁重畫
function applyFilter() {
  const kw = searchKeyword.trim().toLowerCase();
  filteredUsers = kw ? allUsers.filter((u) => (u.data.name || "").toLowerCase().includes(kw)) : allUsers.slice();
  currentPage = 1;
  renderPage();
}

function totalPages() {
  return Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
}

// 畫出目前頁的 20 筆＋分頁列
function renderPage() {
  const tbody = document.getElementById("adminTableBody");
  const pages = totalPages();
  if (currentPage > pages) currentPage = pages;
  if (currentPage < 1) currentPage = 1;
  tbody.innerHTML = "";
  if (filteredUsers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="24">' + (allUsers.length === 0 ? "目前沒有任何帳號" : "沒有符合「" + searchKeyword.trim() + "」的帳號") + "</td></tr>";
  } else {
    const startIdx = (currentPage - 1) * PAGE_SIZE;
    filteredUsers.slice(startIdx, startIdx + PAGE_SIZE).forEach((u) => tbody.appendChild(renderUserRow(u.id, u.data)));
  }
  renderPager();
}

function renderPager() {
  const el = document.getElementById("adminPager");
  if (!el) return;
  const pages = totalPages();
  const total = filteredUsers.length;
  const from = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const to = Math.min(currentPage * PAGE_SIZE, total);
  let html = '<span class="admin-pager-info">第 ' + from + '–' + to + ' 筆，共 ' + total + ' 筆' +
    (searchKeyword.trim() ? '（全部 ' + allUsers.length + ' 筆）' : '') + '</span>';
  html += '<span class="admin-pager-btns">' +
    '<button type="button" data-page="1" ' + (currentPage <= 1 ? "disabled" : "") + '>«</button>' +
    '<button type="button" data-page="' + (currentPage - 1) + '" ' + (currentPage <= 1 ? "disabled" : "") + '>上一頁</button>';
  // 頁碼：最多顯示目前頁前後各 2 頁
  const lo = Math.max(1, currentPage - 2), hi = Math.min(pages, currentPage + 2);
  for (let p = lo; p <= hi; p++) {
    html += '<button type="button" data-page="' + p + '" class="' + (p === currentPage ? "current" : "") + '">' + p + "</button>";
  }
  html += '<button type="button" data-page="' + (currentPage + 1) + '" ' + (currentPage >= pages ? "disabled" : "") + '>下一頁</button>' +
    '<button type="button" data-page="' + pages + '" ' + (currentPage >= pages ? "disabled" : "") + '>»</button>' +
    '<span class="admin-pager-info">' + currentPage + ' / ' + pages + ' 頁</span></span>';
  el.innerHTML = html;
}

// ===== 匯出 CSV：把「目前篩選結果」全部（不只目前頁）匯出，欄位與後台表格一致 =====
// 權限欄位標題對照後台表頭；CSV 前面加 UTF-8 BOM，Excel 直接開啟中文才不會變亂碼
const PERM_LABELS = {
  bazi: "八字", renge: "人格解碼", lifenum: "生命靈數", qimen: "奇門命盤", qimenDunjia: "奇門藍盤",
  qimenHongpan: "奇門紅盤", qimenSansheng: "奇門三勝宮", guanyin: "觀音棋卦", jigong: "濟公棋卦",
  fengshui: "數字易經", mingpian: "名片風水", zibai: "紫白風水", bazhai: "八宅風水", cuiwang: "奇門催旺",
  qimenshuzi: "奇門數字", ziwei: "紫微斗數", xingming: "姓名學", tongsheng: "個人通勝", xingzuo: "十二星座", tiepan: "鐵版神數"
};

function csvCell(v) {
  const t = v === null || v === undefined ? "" : String(v);
  // 含逗號、雙引號、換行時用雙引號包起來，內部雙引號改成兩個
  return /[",\r\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
}

function buildCsv(users) {
  const header = ["姓名", "Email", "狀態"].concat(PERM_KEYS.map((k) => PERM_LABELS[k] || k), ["申請時間", "最後登入"]);
  const lines = [header.map(csvCell).join(",")];
  users.forEach((u) => {
    const d = u.data;
    const perms = effectivePermissions(d);
    const row = [
      d.name || "",
      d.email || "",
      STATUS_LABEL[d.status] || d.status || "未知"
    ].concat(
      PERM_KEYS.map((k) => (perms[k] ? "是" : "否")),
      [formatCreatedAt(d.createdAt), d.lastLoginAt ? formatCreatedAt(d.lastLoginAt) : "尚未登入"]
    );
    lines.push(row.map(csvCell).join(","));
  });
  return "\ufeff" + lines.join("\r\n") + "\r\n";
}

function exportCsv() {
  if (!filteredUsers.length) { adminMsg("沒有可匯出的帳號", "error"); return; }
  const csv = buildCsv(filteredUsers);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const stamp = d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + "-" + pad(d.getHours()) + pad(d.getMinutes());
  const a = document.createElement("a");
  a.href = url;
  a.download = "帳號資訊-" + stamp + (searchKeyword.trim() ? "-篩選" + searchKeyword.trim() : "") + ".csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  adminMsg("已匯出 " + filteredUsers.length + " 筆帳號資訊", "success");
}

function gotoPage(p) {
  const n = parseInt(p, 10);
  if (isNaN(n)) return;
  currentPage = Math.min(Math.max(1, n), totalPages());
  renderPage();
  document.getElementById("adminTable").scrollIntoView({ block: "start", behavior: "smooth" });
}

// 核准／停權：點一下在 approved 跟 pending 之間切換
async function toggleStatus(uid, btn) {
  const nextStatus = btn.classList.contains("approved") ? "pending" : "approved";
  btn.disabled = true;
  try {
    await db.collection("users").doc(uid).update({ status: nextStatus });
    btn.textContent = STATUS_LABEL[nextStatus];
    btn.classList.toggle("approved", nextStatus === "approved");
    btn.classList.toggle("pending", nextStatus === "pending");
    adminMsg("已更新狀態為「" + STATUS_LABEL[nextStatus] + "」", "success");
  } catch (err) {
    adminMsg("更新失敗：" + err.message, "error");
  } finally {
    btn.disabled = false;
  }
}

// 權限勾選框：改一格就把同一列九個 checkbox 目前的勾選狀態一起讀出來，整包 permissions 物件寫回去，
// 不用 dot-notation 只改單一欄位——如果是舊帳號（原本沒有 permissions 欄位），只寫一個欄位會變成
// 該欄位有值、其餘欄位完全不存在，畫面上的 fallback 就不會再套用，反而會讓其餘沒被動到的項目從
// 「原本開放」變成「看起來像被關閉」，所以一律整包寫完整的九個欄位
async function togglePermission(uid, permKey, checked, checkboxEl, row) {
  checkboxEl.disabled = true;
  const perms = {};
  PERM_KEYS.forEach((key) => { perms[key] = row.querySelector('[data-perm="' + key + '"]').checked; });
  try {
    await db.collection("users").doc(uid).update({ permissions: perms });
    adminMsg("已更新權限", "success");
  } catch (err) {
    checkboxEl.checked = !checked;
    adminMsg("更新失敗：" + err.message, "error");
  } finally {
    checkboxEl.disabled = false;
  }
}

// 移除帳號：刪除該使用者的 users 文件（審核狀態＋全部權限），需 firestore.rules 的 delete 規則放行管理者。
// Firebase Authentication 的登入帳號（Email／密碼）無法從前端刪除，只能在 Firebase 主控台手動刪；
// 被移除的使用者若再登入，login 流程會自動補建 pending 文件、回到「審核中」，不會直接取得任何權限。
async function deleteUser(uid, btn, row) {
  const name = btn.dataset.name || "";
  const email = btn.dataset.email || "";
  const ok = window.confirm("確定要移除這個帳號嗎？\n\n姓名：" + name + "\nEmail：" + email + "\n\n移除後該帳號的審核狀態與全部權限會被刪除，無法再登入使用。");
  if (!ok) return;
  btn.disabled = true;
  btn.textContent = "移除中…";
  try {
    await db.collection("users").doc(uid).delete();
    allUsers = allUsers.filter((u) => u.id !== uid);
    filteredUsers = filteredUsers.filter((u) => u.id !== uid);
    renderPage(); // 重畫目前頁（後面的帳號會遞補上來，頁數也會跟著更新）
    adminMsg("已移除帳號「" + (name || email) + "」", "success");
  } catch (err) {
    btn.disabled = false;
    btn.textContent = "移除";
    adminMsg("移除失敗：" + err.message + (err.code === "permission-denied" ? "（請確認 firestore.rules 的 delete 規則已在 Firebase 主控台發布）" : ""), "error");
  }
}

// 重設密碼：替該帳號寄一封 Firebase 重設密碼信（使用者到信箱點連結自行設定新密碼）。
// 管理者無法直接指定或查看密碼，只能代為觸發寄信。
async function sendResetMail(btn) {
  const email = btn.dataset.email;
  const name = btn.dataset.name || email;
  if (!email) { adminMsg("此帳號沒有 Email，無法寄送", "error"); return; }
  if (!window.confirm("要寄送重設密碼信給「" + name + "」（" + email + "）嗎？")) return;
  btn.disabled = true;
  try {
    await sendResetMailTo(email);
    adminMsg("重設密碼信已寄出至 " + email, "success");
  } catch (err) {
    adminMsg("寄送失敗：" + err.message, "error");
  } finally {
    btn.disabled = false;
  }
}

// 姓名查詢：關鍵字即時比對姓名（不分大小寫），結果一樣每頁 20 筆；清空關鍵字顯示全部
function filterUsersByName(keyword) {
  searchKeyword = keyword;
  applyFilter();
}

requireAdmin(function () {
  loadUsers();

  document.getElementById("adminTableBody").addEventListener("click", (e) => {
    const btn = e.target.closest(".admin-status-btn");
    if (btn) { toggleStatus(btn.dataset.uid, btn); return; }
    const del = e.target.closest(".admin-delete-btn");
    if (del) { deleteUser(del.dataset.uid, del, del.closest("tr")); return; }
    const rst = e.target.closest(".admin-reset-btn");
    if (rst) sendResetMail(rst);
  });

  document.getElementById("adminTableBody").addEventListener("change", (e) => {
    const el = e.target;
    if (el.matches('input[type="checkbox"][data-perm]')) {
      togglePermission(el.dataset.uid, el.dataset.perm, el.checked, el, el.closest("tr"));
    }
  });

  document.getElementById("adminSearch").addEventListener("input", (e) => {
    filterUsersByName(e.target.value);
  });

  document.getElementById("adminExportBtn").addEventListener("click", exportCsv);

  document.getElementById("adminPager").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-page]");
    if (b && !b.disabled) gotoPage(b.dataset.page);
  });
});
