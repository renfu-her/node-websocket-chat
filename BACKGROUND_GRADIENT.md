# 背景漸變設計

## 概述

應用程序現在使用動態的黃藍色系漸變背景，替代了原來的靜態背景圖片。

## 設計特點

### 顏色方案
- **主要色調**: 黃藍色系
- **漸變方向**: 135度對角線
- **顏色組合**:
  - `#667eea` (藍色) - 0%
  - `#764ba2` (紫色) - 25%
  - `#f093fb` (粉紫色) - 50%
  - `#f5576c` (粉紅色) - 75%
  - `#4facfe` (天藍色) - 100%

### 動畫效果
- **動畫類型**: 漸變位置移動
- **動畫時長**: 15秒
- **動畫類型**: 無限循環
- **緩動函數**: ease

## 實現細節

### CSS 漸變定義
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%);
background-size: 400% 400%;
animation: gradientShift 15s ease infinite;
```

### 動畫關鍵幀
```css
@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
```

## 應用範圍

### 桌面版
- 主應用容器 (`.main-app-warp`)
- 全屏背景漸變

### 移動版
- 設置頁面封面 (`.iChat-setting-cover`)
- 保持與桌面版一致的視覺效果

## 視覺效果

1. **動態變化**: 背景顏色會緩慢流動，創造生動的視覺體驗
2. **色彩豐富**: 從藍色到黃色的漸變，提供溫暖而現代的感覺
3. **無縫循環**: 動畫無縫循環，不會有突兀的跳轉
4. **響應式**: 在不同設備上都能正常顯示

## 性能考慮

- 使用 CSS 漸變而非圖片，減少加載時間
- 動畫使用 GPU 加速，性能優化
- 漸變大小設置為 400%，確保動畫效果流暢

## 自定義選項

如需調整漸變效果，可以修改以下參數：

### 顏色調整
```css
/* 修改顏色值 */
background: linear-gradient(135deg, 
  #your-color-1 0%, 
  #your-color-2 25%, 
  #your-color-3 50%, 
  #your-color-4 75%, 
  #your-color-5 100%
);
```

### 動畫速度調整
```css
/* 修改動畫時長 */
animation: gradientShift 10s ease infinite; /* 更快 */
animation: gradientShift 20s ease infinite; /* 更慢 */
```

### 漸變方向調整
```css
/* 修改漸變方向 */
background: linear-gradient(45deg, ...);   /* 45度 */
background: linear-gradient(90deg, ...);   /* 水平 */
background: linear-gradient(180deg, ...);  /* 垂直 */
```

## 瀏覽器兼容性

- **現代瀏覽器**: 完全支持
- **舊版瀏覽器**: 會顯示靜態漸變（無動畫）
- **移動瀏覽器**: 完全支持

## 文件修改

修改的文件：
- `src/components/MainApp.vue` - 更新背景樣式
