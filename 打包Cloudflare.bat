@echo off
chcp 65001 >nul
cd /d "%~dp0"
python build-cloudflare.py
echo.
echo 上傳方式：Cloudflare 儀表板 → Workers ^& Pages → Create → Pages → Upload assets → 拖入 dist 資料夾或 zip
pause
