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

// 跟 js/app.js 判斷「舊帳號（沒有 permissions 欄位）」時用的 fallback 完全一致：
// 畫面上顯示的初始勾選狀態要跟使用者登入後實際看到的權限一樣，管理者才不會誤判目前狀態
function effectivePermissions(data) {
  return data.permissions || { bazi: true, renge: true, lifenum: true };
}

function renderUserRow(uid, data) {
  const perms = effectivePermissions(data);
  const tr = document.createElement("tr");
  tr.innerHTML =
    "<td>" + (data.name || "") + "</td>" +
    "<td>" + (data.email || "") + "</td>" +
    '<td><button class="admin-status-btn ' + (data.status === "approved" ? "approved" : "pending") + '" data-uid="' + uid + '">' +
      (STATUS_LABEL[data.status] || data.status || "未知") + "</button></td>" +
    '<td class="admin-checkbox-cell"><input type="checkbox" data-uid="' + uid + '" data-perm="bazi" ' + (perms.bazi ? "checked" : "") + "></td>" +
    '<td class="admin-checkbox-cell"><input type="checkbox" data-uid="' + uid + '" data-perm="renge" ' + (perms.renge ? "checked" : "") + "></td>" +
    '<td class="admin-checkbox-cell"><input type="checkbox" data-uid="' + uid + '" data-perm="lifenum" ' + (perms.lifenum ? "checked" : "") + "></td>" +
    "<td>" + formatCreatedAt(data.createdAt) + "</td>";
  return tr;
}

async function loadUsers() {
  const tbody = document.getElementById("adminTableBody");
  tbody.innerHTML = '<tr><td colspan="7">載入中...</td></tr>';
  try {
    const snap = await db.collection("users").orderBy("createdAt", "desc").get();
    tbody.innerHTML = "";
    if (snap.empty) {
      tbody.innerHTML = '<tr><td colspan="7">目前沒有任何帳號</td></tr>';
      return;
    }
    snap.forEach((doc) => {
      tbody.appendChild(renderUserRow(doc.id, doc.data()));
    });
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="7">載入失敗：' + err.message + "</td></tr>";
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

// 權限勾選框：改一格就把同一列三個 checkbox 目前的勾選狀態一起讀出來，整包 permissions 物件寫回去，
// 不用 dot-notation 只改單一欄位——如果是舊帳號（原本沒有 permissions 欄位），只寫一個欄位會變成
// 該欄位有值、另外兩個欄位完全不存在，畫面上的 fallback（沒有 permissions 就視為全部開放）就不會再套用，
// 反而會讓另外兩個沒被動到的報告從「原本開放」變成「看起來像被關閉」，所以一律整包寫完整的三個欄位
async function togglePermission(uid, permKey, checked, checkboxEl, row) {
  checkboxEl.disabled = true;
  const perms = {
    bazi: row.querySelector('[data-perm="bazi"]').checked,
    renge: row.querySelector('[data-perm="renge"]').checked,
    lifenum: row.querySelector('[data-perm="lifenum"]').checked
  };
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
});
