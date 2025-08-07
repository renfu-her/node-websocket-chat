# Image 欄位 Migration 和 Profile 功能更新

## 概述

本次更新為用戶系統添加了 `image` 欄位，並增強了個人資料管理功能，包括密碼更改功能。

## 主要變更

### 1. 資料庫 Migration (V4)

#### 新增 Migration 檔案
- **檔案**: `server/migrate-v4.js`
- **功能**: 添加 `image` 欄位到 `users` 表
- **執行命令**: `npm run migrate-v4`

#### Migration 內容
```sql
ALTER TABLE users ADD COLUMN image TEXT;
CREATE INDEX IF NOT EXISTS idx_users_image ON users(image);
```

### 2. 個人資料組件更新

#### UserProfile.vue 變更
- **載入用戶資料**: 從 `loginUser` 載入 `name` 和 `email`
- **密碼更改**: 添加密碼和確認密碼欄位
- **驗證功能**: 
  - 用戶名和電子郵件必填
  - 密碼長度至少6位
  - 密碼確認驗證
- **資料結構**: 使用 `name` 而非 `username`，移除 `nickname`

#### 表單欄位
```html
- 用戶名 (name)
- 電子郵件 (email)  
- 密碼 (password) - 可選，留空則不更改
- 確認密碼 (confirmPassword)
```

### 3. 後端 API 更新

#### 更新 Profile API
- **端點**: `PUT /api/update-profile`
- **參數**: `{ name, email, password?, image }`
- **功能**:
  - 更新用戶基本資料
  - 可選密碼更改（bcrypt 加密）
  - 圖片路徑更新

#### 資料庫操作
- **新增方法**: `dbOperations.updateUser(id, updateData)`
- **支援欄位**: `name`, `email`, `password`, `image`, `avatarUrl`
- **動態 SQL**: 只更新提供的欄位

### 4. 資料庫結構

#### Users 表結構
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  avatarUrl TEXT,
  image TEXT,           -- 新增欄位
  ip TEXT,
  deviceType TEXT,
  roomId TEXT,
  type TEXT DEFAULT 'user',
  time INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 使用方式

### 1. 執行 Migration
```bash
npm run migrate-v4
```

### 2. 啟動應用
```bash
npm run serve
```

### 3. 測試功能
1. 登入後點擊「個人資料」按鈕
2. 編輯用戶名和電子郵件
3. 可選：更改密碼
4. 上傳或更改頭像
5. 保存更改

## 技術細節

### 密碼處理
- 使用 bcrypt 進行密碼加密
- 只有填寫密碼時才進行加密和更新
- 密碼長度驗證（最少6位）

### 圖片處理
- 圖片儲存在 `public/static/img/user/`
- 支援的格式：所有圖片格式
- 檔案大小限制：5MB
- 檔案命名：`user-時間戳-隨機數.副檔名`

### 向後兼容
- 保持 `avatarUrl` 欄位以確保向後兼容
- `image` 欄位預設使用 `avatarUrl` 的值

## 安全考量

1. **密碼安全**: 使用 bcrypt 加密，鹽值為10
2. **檔案驗證**: 只允許圖片檔案上傳
3. **檔案大小限制**: 防止過大檔案上傳
4. **Token 驗證**: API 需要有效的認證 token

## 注意事項

1. Migration 會自動備份現有資料庫
2. 現有用戶的 `image` 欄位會預設為 `NULL`
3. 密碼更改是可選的，留空則保持原密碼
4. 所有 API 都需要有效的認證 token

## 未來改進

1. 實現真正的 JWT token 驗證
2. 添加電子郵件驗證功能
3. 實現密碼重置功能
4. 添加圖片壓縮和優化
5. 實現真正的資料庫更新而非模擬回應
