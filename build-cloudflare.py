# -*- coding: utf-8 -*-
"""
打包 Cloudflare Pages 上傳用資料夾：把正式站需要的檔案複製到 dist/，並壓成 zip。
用法：雙擊「打包Cloudflare.bat」或執行 python build-cloudflare.py
"""
import os, shutil, zipfile, datetime

ROOT = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(ROOT, "dist")

# 正式站要放上去的檔案／資料夾（README、firestore.rules、測試頁、bat、說明文件都不上傳）
INCLUDE_FILES = ["index.html", "login.html", "signup.html", "admin.html"]
INCLUDE_DIRS = ["css", "js", "assets"]

# Cloudflare Pages 專用設定檔：_headers（安全標頭）。不用 CSP，避免擋到 Firebase／jsdelivr／cdnjs 外部腳本。
# JS／CSS 不另設長期快取，沿用 Cloudflare 預設（ETag 重新驗證），避免改檔忘了升 ?v= 版號時被快取住。
HEADERS = """/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()

/*.html
  Cache-Control: no-cache
"""

def main():
    # 清空 dist 內容（不刪資料夾本身：Windows 上若有終端機停在 dist 裡會刪不掉）
    os.makedirs(DIST, exist_ok=True)
    for name in os.listdir(DIST):
        path = os.path.join(DIST, name)
        shutil.rmtree(path) if os.path.isdir(path) else os.remove(path)
    for f in INCLUDE_FILES:
        shutil.copy2(os.path.join(ROOT, f), os.path.join(DIST, f))
    for d in INCLUDE_DIRS:
        shutil.copytree(os.path.join(ROOT, d), os.path.join(DIST, d))
    with open(os.path.join(DIST, "_headers"), "w", encoding="utf-8", newline="\n") as fh:
        fh.write(HEADERS)

    # 壓成 zip（Cloudflare Pages「Upload assets」可直接拖曳 zip 或整個 dist 資料夾）
    stamp = datetime.date.today().strftime("%Y%m%d")
    zip_path = os.path.join(ROOT, "cloudflare-pages-%s.zip" % stamp)
    if os.path.exists(zip_path):
        os.remove(zip_path)
    count = 0
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
        for base, _, files in os.walk(DIST):
            for name in files:
                full = os.path.join(base, name)
                z.write(full, os.path.relpath(full, DIST))
                count += 1
    size = os.path.getsize(zip_path) / 1024 / 1024
    print("打包完成：dist/ 共 %d 個檔案，zip：%s（%.2f MB）" % (count, os.path.basename(zip_path), size))

if __name__ == "__main__":
    main()
