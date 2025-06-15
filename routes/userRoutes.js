const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const verifyToken = require("../middleware/authMiddleware");

// Kullanıcı Kaydı
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, city } = req.body;

    // Temel validasyonlar
    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return res.status(400).json({ message: "Kullanıcı adı en az 3 karakter olmalıdır" });
    }

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: "E-posta adresi gereklidir" });
    }

    // Email format kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Geçerli bir e-posta adresi giriniz" });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ message: "Şifre en az 6 karakter olmalıdır" });
    }

    // Yeni zorunlu alanlar
    if (!firstName || typeof firstName !== 'string' || firstName.trim().length < 2) {
      return res.status(400).json({ message: "İsim en az 2 karakter olmalıdır" });
    }

    if (!lastName || typeof lastName !== 'string' || lastName.trim().length < 2) {
      return res.status(400).json({ message: "Soyisim en az 2 karakter olmalıdır" });
    }

    if (!city || typeof city !== 'string' || city.trim().length < 2) {
      return res.status(400).json({ message: "Şehir en az 2 karakter olmalıdır" });
    }

    // Username benzersizlik kontrolü
    const existingUsername = await User.findOne({ username: username.trim() });
    if (existingUsername) {
      return res.status(400).json({ message: "Bu kullanıcı adı zaten kullanılıyor" });
    }

    // E-posta zaten kayıtlı mı?
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "Bu e-posta zaten kullanılıyor" });
    }

    // Şifreyi hashle
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Yeni kullanıcı oluştur
    const newUser = new User({
      username: username.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      location: {
        city: city.trim()
      }
    });

    await newUser.save();
    res.status(201).json({ message: "Kayıt başarılı" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Giriş Yap
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validasyonlar
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: "E-posta adresi gereklidir" });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ message: "Şifre gereklidir" });
    }

    // Email format kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Geçerli bir e-posta adresi giriniz" });
    }

    // Kullanıcı kontrolü
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: "E-posta veya şifre yanlış" });
    }

    // Şifre eşleşme kontrolü
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "E-posta veya şifre yanlış" });
    }

    // JWT oluştur
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "24h", // 24 saat
    });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Korumalı Profil Rotası (Kendi profili)
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Public Profil Rotası (Başkalarının profili)
router.get("/profile/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select(
      "username avatar bio location.city rating totalRatings totalTrades successfulTrades createdAt"
    );
    
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }
    
    // Kullanıcının aldığı review'ları getir
    const Review = require("../models/Review");
    const reviews = await Review.find({
      reviewee: req.params.userId,
      isVisible: true
    })
    .populate("reviewer", "username avatar")
    .populate("tradeOffer", "createdAt")
    .sort({ createdAt: -1 });
    
    res.json({
      ...user.toObject(),
      reviews
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Profil güncelleme (JWT gerekli)
router.put("/profile", verifyToken, async (req, res) => {
  try {
    const { firstName, lastName, bio, phone } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

    // Validasyonlar
    if (firstName !== undefined) {
      if (!firstName || typeof firstName !== 'string' || firstName.trim().length < 2) {
        return res.status(400).json({ message: "İsim en az 2 karakter olmalıdır" });
      }
      user.firstName = firstName.trim();
    }

    if (lastName !== undefined) {
      if (!lastName || typeof lastName !== 'string' || lastName.trim().length < 2) {
        return res.status(400).json({ message: "Soyisim en az 2 karakter olmalıdır" });
      }
      user.lastName = lastName.trim();
    }

    if (bio !== undefined) {
      if (typeof bio !== 'string' || bio.length > 500) {
        return res.status(400).json({ message: "Bio en fazla 500 karakter olabilir" });
      }
      user.bio = bio.trim();
    }

    if (phone !== undefined) {
      if (phone && (typeof phone !== 'string' || !/^[0-9+\-\s()]{10,15}$/.test(phone))) {
        return res.status(400).json({ message: "Geçerli bir telefon numarası giriniz" });
      }
      user.phone = phone ? phone.trim() : null;
    }

    await user.save();
    
    // Şifreyi çıkararak döndür
    const updatedUser = await User.findById(req.user.id).select("-password");
    res.json({ message: "Profil güncellendi", user: updatedUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Avatar güncelleme (JWT gerekli)
router.put("/profile/avatar", verifyToken, async (req, res) => {
  try {
    const { avatar } = req.body;
    
    if (!avatar || typeof avatar !== 'string') {
      return res.status(400).json({ message: "Geçerli bir avatar URL'i gereklidir" });
    }

    // URL validasyonu
    try {
      new URL(avatar);
    } catch {
      return res.status(400).json({ message: "Geçerli bir URL formatı giriniz" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

    user.avatar = avatar;
    await user.save();

    res.json({ message: "Avatar güncellendi", avatar: user.avatar });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Konum güncelleme (JWT gerekli)
router.put("/profile/location", verifyToken, async (req, res) => {
  try {
    const { city, district, address } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

    // Validasyonlar
    if (city !== undefined) {
      if (!city || typeof city !== 'string' || city.trim().length < 2) {
        return res.status(400).json({ message: "Şehir en az 2 karakter olmalıdır" });
      }
      user.location.city = city.trim();
    }

    if (district !== undefined) {
      if (district && (typeof district !== 'string' || district.trim().length < 2)) {
        return res.status(400).json({ message: "İlçe en az 2 karakter olmalıdır" });
      }
      user.location.district = district ? district.trim() : null;
    }

    if (address !== undefined) {
      if (address && (typeof address !== 'string' || address.length > 200)) {
        return res.status(400).json({ message: "Adres en fazla 200 karakter olabilir" });
      }
      user.location.address = address ? address.trim() : null;
    }

    await user.save();

    res.json({ message: "Konum güncellendi", location: user.location });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
