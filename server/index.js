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
    
    const avatarUrl = `/static/img/user/${req.file.filename}`;
    res.json({ 
      success: true, 
      avatarUrl: avatarUrl,
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
    // 暫時使用請求中的資料進行更新
    const bcrypt = require('bcryptjs');
    
    // 構建更新資料
    const updateData = {
      name: name,
      email: email,
      image: image || ''
    };
    
    // 如果有密碼，則加密
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }
    
    // 這裡應該實際更新資料庫
    // 暫時返回模擬資料
    const updatedUser = { 
      id: 'user_id', 
      name: updateData.name, 
      email: updateData.email, 
      image: updateData.image,
      avatarUrl: updateData.image // 保持向後兼容
    };
    
    res.json({ 
      success: true, 
      user: updatedUser,
      message: 'Profile updated successfully' 
    });
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
