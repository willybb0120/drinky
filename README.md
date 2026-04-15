# Drinky 💧

每日喝水紀錄 PWA，簡單快速記錄喝水量、追蹤每日達標狀況。

**[→ 立即使用](https://willybb0120.github.io/drinky)**

---

## 功能

- **環形進度圖** — 一眼看出今日喝水量與目標達成率
- **容器快速新增** — 點一下即記錄，支援多種容器設定
- **手動輸入** — 自由輸入任意 ml 數
- **月曆視圖** — 查看每月每天達標狀況
- **PWA 支援** — 可加入手機主畫面，離線也能使用

## 使用方式

用手機瀏覽器開啟 [https://willybb0120.github.io/drinky](https://willybb0120.github.io/drinky)，加入主畫面即可當 APP 使用。

## 本地開發

```bash
git clone https://github.com/willybb0120/drinky.git
cd drinky
python3 -m http.server 8080
# 開啟 http://localhost:8080
```

## 技術

純靜態網頁，無任何框架或套件依賴。

- HTML / CSS / JavaScript
- Web App Manifest + Service Worker（PWA）
- localStorage（資料儲存）
