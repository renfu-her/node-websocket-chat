const io=require("./io");
const {getNetworkIPv4}=require("./utils");
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const server = require('http').createServer(app);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/",express.static('dist'));
app.use("/assets/images",express.static('upload'));
app.use("/static/img/user",express.static('public/static/img/user'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'public/static/img/user';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)){
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'user-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

const PORT=3000;

// API Routes
app.post('/api/upload-avatar', upload.single('avatar'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // 使用正確的圖片路徑格式
    const imageUrl = `/static/img/user/${req.file.filename}`;
    res.json({ 
      success: true, 
      avatarUrl: imageUrl,
      image: imageUrl, // 同時設置 image 欄位
      message: 'Avatar uploaded successfully' 
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

app.put('/api/update-profile', async (req, res) => {
  try {
    const { name, email, password, image } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    // 這裡應該驗證 token 並獲取用戶 ID
    // 暫時從請求體中獲取用戶 ID（實際應該從 token 解析）
    const userId = req.body.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }
    
    const bcrypt = require('bcryptjs');
    const db = require('./db');
    
    // 構建更新資料 - email 不應該被更新
    const updateData = {
      name: name,
      image: image || ''
    };
    
    // 如果有密碼，則加密
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }
    
    // 實際更新資料庫
    try {
      await db.updateUser(userId, updateData);
      
      // 獲取更新後的用戶資料
      const updatedUser = await db.findUserById(userId);
      
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({ 
        success: true, 
        user: updatedUser,
        message: 'Profile updated successfully' 
      });
    } catch (dbError) {
      console.error('Database update error:', dbError);
      res.status(500).json({ error: 'Database update failed' });
    }
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Profile update failed' });
  }
});

io.attach(server);
//启动服务器
server.listen(PORT,()=> {
  const address=getNetworkIPv4().address;
  console.info("- Local:   http://localhost:"+PORT);
  console.info(`- Network: http://${address}:`+PORT)
});
