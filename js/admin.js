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
const PERM_KEYS = ["bazi", "renge", "lifenum", "qimen", "qimenDunjia", "qimenHongpan", "qimenSansheng", "guanyin", "jigong", "fengshui", "mingpian", "zibai"];
function effectivePermissions(data) {
  const raw = data.permissions;
  if (!raw) {
    return { bazi: true, renge: true, lifenum: true, qimen: true, qimenDunjia: false, qimenHongpan: false, qimenSansheng: false, guanyin: false, jigong: false, fengshui: false, mingpian: false, zibai: false };
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
    zibai: !!raw.zibai
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
    "<td>" + formatCreatedAt(data.createdAt) + "</td>";
  return tr;
}

async function loadUsers() {
  const tbody = document.getElementById("adminTableBody");
  tbody.innerHTML = '<tr><td colspan="15">載入中...</td></tr>';
  try {
    const snap = await db.collection("users").orderBy("createdAt", "desc").get();
    tbody.innerHTML = "";
    if (snap.empty) {
      tbody.innerHTML = '<tr><td colspan="15">目前沒有任何帳號</td></tr>';
      return;
    }
    snap.forEach((doc) => {
      tbody.appendChild(renderUserRow(doc.id, doc.data()));
    });
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="15">載入失敗：' + err.message + "</td></tr>";
  }
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

// 姓名查詢：純前端篩選已載入的表格列，輸入關鍵字即時比對姓名（不分大小寫），清空關鍵字顯示全部
function filterUsersByName(keyword) {
  const kw = keyword.trim().toLowerCase();
  document.querySelectorAll("#adminTableBody tr[data-name]").forEach((tr) => {
    tr.style.display = tr.dataset.name.toLowerCase().includes(kw) ? "" : "none";
  });
}

requireAdmin(function () {
  loadUsers();

  document.getElementById("adminTableBody").addEventListener("click", (e) => {
    const btn = e.target.closest(".admin-status-btn");
    if (btn) toggleStatus(btn.dataset.uid, btn);
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
});
