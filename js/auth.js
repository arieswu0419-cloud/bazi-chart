// 系統維護帳號，跟 firestore.rules 裡的 isAdmin() 判斷條件是同一個 email，兩邊要保持一致
const ADMIN_EMAIL = "arieswu0419@gmail.com";

function showMsg(el, text, type) {
  el.textContent = text;
  el.className = "form-msg show " + type;
}

async function handleSignup(e) {
  e.preventDefault();
  const name = document.getElementById("su-name").value.trim();
  const email = document.getElementById("su-email").value.trim();
  const password = document.getElementById("su-password").value;
  const password2 = document.getElementById("su-password2").value;
  const msg = document.getElementById("su-msg");

  if (password !== password2) {
    showMsg(msg, "兩次輸入的密碼不一致", "error");
    return;
  }
  if (password.length < 6) {
    showMsg(msg, "密碼至少需要 6 個字元", "error");
    return;
  }

  try {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    await cred.user.updateProfile({ displayName: name });
    await db.collection("users").doc(cred.user.uid).set({
      name: name,
      email: email,
      status: "pending",
      // 三個報告權限預設全部關閉，審核通過後要由系統維護帳號登入後台手動開啟
      permissions: { bazi: false, renge: false, lifenum: false },
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    await auth.signOut();
    showMsg(msg, "申請成功，請等待管理者審核。審核通過後即可登入使用。", "success");
    document.getElementById("signup-form").reset();
  } catch (err) {
    showMsg(msg, translateAuthError(err), "error");
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById("li-email").value.trim();
  const password = document.getElementById("li-password").value;
  const msg = document.getElementById("li-msg");

  try {
    const cred = await auth.signInWithEmailAndPassword(email, password);
    const doc = await db.collection("users").doc(cred.user.uid).get();
    const status = doc.exists ? doc.data().status : null;

    if (status === "approved") {
      window.location.href = "index.html";
    } else if (status === "pending") {
      await auth.signOut();
      showMsg(msg, "您的帳號尚在審核中，請等待管理者核准後再登入。", "info");
    } else {
      await auth.signOut();
      showMsg(msg, "找不到有效的帳號資料，請聯絡管理者。", "error");
    }
  } catch (err) {
    showMsg(msg, translateAuthError(err), "error");
  }
}

function translateAuthError(err) {
  const map = {
    "auth/email-already-in-use": "這個 Email 已經被註冊過了",
    "auth/invalid-email": "Email 格式不正確",
    "auth/weak-password": "密碼強度不足，至少需要 6 個字元",
    "auth/user-not-found": "帳號或密碼錯誤",
    "auth/wrong-password": "帳號或密碼錯誤",
    "auth/invalid-credential": "帳號或密碼錯誤",
    "auth/user-disabled": "此帳號已被管理者停用，請聯絡管理者",
    "auth/too-many-requests": "嘗試次數過多，請稍後再試"
  };
  return map[err.code] || ("發生錯誤：" + err.message);
}

// 保護頁面用：放在 index.html，檢查登入與審核狀態
function requireApprovedUser(onReady) {
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }
    const doc = await db.collection("users").doc(user.uid).get();
    const status = doc.exists ? doc.data().status : null;
    if (status !== "approved") {
      await auth.signOut();
      window.location.href = "login.html";
      return;
    }
    onReady(user, doc.data());
  });
}

// 保護頁面用：放在 admin.html，只有系統維護帳號本人登入才能進入，其餘一律導回登入頁
function requireAdmin(onReady) {
  auth.onAuthStateChanged((user) => {
    if (!user || user.email !== ADMIN_EMAIL) {
      window.location.href = "login.html";
      return;
    }
    onReady(user);
  });
}

async function handleLogout() {
  await auth.signOut();
  window.location.href = "login.html";
}
