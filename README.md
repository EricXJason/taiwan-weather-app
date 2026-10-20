# 臺灣天氣預報 (Taiwan Weather Forecast)

一個基於 Angular 19 與中央氣象署 (CWA) 開放資料 API 所打造的臺灣即時與未來天氣預報網頁應用，重點展示前端細緻排版、資料視覺化與 API 串接整合能力。

## 核心特色

- **互動式臺灣地圖**：採用 D3.js 搭配 TopoJSON Client，實現主島縣市向量地圖的流暢渲染、懸停聚焦與選取連動。
- **即時氣象資料串接**：串接中央氣象署開放資料平臺 API，支援全臺 22 縣市及鄉鎮市區之即時與未來天氣資料。
- **全方位氣象指標**：完整展示平均氣溫、體感溫度、高低溫、降雨機率、相對濕度、露點溫度、舒適度指數、風速風向及紫外線指數。
- **一週未來預報折疊面板**：支援多時段未來預報展開與收合，清晰呈現早晚與日期預報。
- **氛圍感視覺設計**：具備 Canvas 動態幾何粒子系統、天氣狀態動態背景（晴天/多雲/雨天）平滑淡入轉場。
- **全裝置響應式設計**：針對行動端（Mobile）、平板（Tablet）與桌面端（Desktop）進行嚴格排版最佳化。

## 技術棧

- **核心框架**：Angular 19 (Standalone Components)
- **程式語言**：TypeScript
- **樣式設計**：SCSS (Vanilla CSS Grid & Flexbox)
- **地圖視覺化**：D3.js v7, TopoJSON Client
- **動態效果**：HTML5 Canvas Particle System
- **資料來源**：交通部中央氣象署開放資料平臺 (CWA Open Data)

## 本地開發與建置

```bash
# 啟動本地開發伺服器
ng serve

# 執行正式環境打包
ng build
```
