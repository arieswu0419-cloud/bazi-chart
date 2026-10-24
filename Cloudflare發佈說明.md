# 發佈到 Cloudflare Pages

## 一、打包

雙擊 `打包Cloudflare.bat`（或執行 `python build-cloudflare.py`），會產生：

- `dist/` 資料夾：正式站檔案（index / login / signup / admin 四個頁面 + css / js / assets + `_headers`）
- `cloudflare-pages-日期.zip`：同一份內容的壓縮檔

不會放進去的：`README.md`、`firestore.rules`、`test-hongpan.html`、說明文件、bat 腳本。

## 二、上傳（免費，不用信用卡）

1. 登入 https://dash.cloudflare.com （沒有帳號就免費註冊）
2. 左側「Workers & Pages」→「Create」→ 切到「Pages」分頁 →「Upload assets」
3. 專案名稱輸入例如 `aries-mingli`（這會變成網址 `aries-mingli.pages.dev`）
4. 把 `dist` 資料夾整個拖進去（或拖 zip）→「Deploy site」
5. 約 30 秒後會給你網址 `https://aries-mingli.pages.dev`

之後每次更新：重新打包 → 進該專案 →「Create new deployment」→ 再拖一次。

## 三、必做：讓 Firebase 允許新網址登入

否則登入會顯示錯誤（Firebase 只放行已授權網域）。

1. 開 https://console.firebase.google.com/project/aries-chart/authentication/settings
2. 「Authorized domains」→「Add domain」→ 輸入 `aries-mingli.pages.dev`（換成你實際的專案名稱）
3. 儲存後即可在新網址登入

## 四、（選用）用 GitHub 自動部署

若希望 `git push` 後自動更新，改用 Git 整合：

1. 先把本機修改 commit 並 push 到 GitHub `arieswu0419-cloud/bazi-chart`
2. Cloudflare「Create」→「Pages」→「Connect to Git」→ 選該倉庫
3. Build settings：Framework preset 選 `None`，Build command 留空，Build output directory 填 `/`
4. 之後每次 push 到 main 就自動部署

注意：Git 整合會上傳整個倉庫（含 README、firestore.rules、test-hongpan.html），
這些檔案沒有機密，只是多佔一點空間；`.gitignore` 已排除 `dist/` 與 zip。

## 五、（選用）命令列部署

```
npx wrangler login
npx wrangler pages deploy dist --project-name=aries-mingli
```

## 六、自訂網域（選用，免費）

Cloudflare 專案 →「Custom domains」→「Set up a custom domain」→ 依指示加 DNS 紀錄。
加完同樣要到 Firebase「Authorized domains」加入該網域。

## 常見問題

- **登入按下去沒反應或顯示 unauthorized-domain**：第三步沒做。
- **改了 JS 但網站沒變**：確認 html 裡的 `?v=` 版號有升（例如 v282 → v283），再重新打包上傳。
- **admin.html 移除帳號顯示 permission denied**：`firestore.rules` 尚未貼到 Firebase 主控台發布。
