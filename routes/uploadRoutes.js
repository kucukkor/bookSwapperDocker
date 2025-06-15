const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");

// Upload klasörünü oluştur
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer konfigürasyonu
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Benzersiz dosya adı oluştur
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Dosya filtreleme (sadece resim dosyaları)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Sadece resim dosyaları yüklenebilir!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Tek resim upload
router.post("/single", verifyToken, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Dosya yüklenmedi" });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ 
      message: "Dosya başarıyla yüklendi",
      imageUrl: imageUrl,
      filename: req.file.filename
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Çoklu resim upload (max 5 resim)
router.post("/multiple", verifyToken, upload.array('images', 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "Dosya yüklenmedi" });
    }

    const imageUrls = req.files.map(file => `/uploads/${file.filename}`);
    res.json({ 
      message: "Dosyalar başarıyla yüklendi",
      imageUrls: imageUrls,
      count: req.files.length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 