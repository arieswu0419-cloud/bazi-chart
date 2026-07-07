// 請在建立 Firebase 專案後，把「專案設定」裡的 SDK 設定值貼到這裡取代下面的內容。
// 這些是前端公開金鑰（apiKey 等），本來就會出現在瀏覽器端程式碼中，不是密碼，
// 真正的存取安全是靠 Firestore 安全規則（見 firestore.rules）和 Authentication 控管。
const firebaseConfig = {
  apiKey: "AIzaSyCyAf_F9tatF2DKMswtChDPqGcaKd_4tq8",
  authDomain: "aries-chart.firebaseapp.com",
  projectId: "aries-chart",
  storageBucket: "aries-chart.firebasestorage.app",
  messagingSenderId: "993588636098",
  appId: "1:993588636098:web:f455b46caa5aacfdc90e5b",
  measurementId: "G-SNLFX7HZ4X"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
