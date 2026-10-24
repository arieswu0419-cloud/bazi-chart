@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 命理系統本機伺服器啟動中...
echo 瀏覽器將開啟 http://localhost:8000/login.html
echo 關閉此視窗即可停止伺服器。
start "" "http://localhost:8000/login.html"
python -m http.server 8000 --bind 127.0.0.1
