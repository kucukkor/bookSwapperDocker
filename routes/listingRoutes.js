const express = require("express");
const router = express.Router();
const Listing = require("../models/Listing");
const TradeOffer = require("../models/TradeOffer");
const verifyToken = require("../middleware/authMiddleware");

// 1. Tüm aktif listing'leri getir (herkese açık)
router.get("/", async (req, res) => {
  try {
    const { category, city, condition, author } = req.query;
    
    let filter = { 
      status: "active" 
    };
    
    // Filtreleme
    if (category) filter.category = category;
    if (city) filter["location.city"] = city;
    if (condition) filter.condition = condition;
    if (author) filter.author = { $regex: author, $options: 'i' };
    
    const listings = await Listing.find(filter)
      .populate("owner", "username avatar location.city rating totalRatings")
      .sort({ createdAt: -1 });
      
    res.json(listings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. Kullanıcının listing'lerini getir (JWT gerekli)
router.get("/my", verifyToken, async (req, res) => {
  try {
    const listings = await Listing.find({ 
      owner: req.user.id 
    }).sort({ createdAt: -1 });
    
    res.json(listings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. Yeni listing oluştur (JWT gerekli)
router.post("/", verifyToken, async (req, res) => {
  try {
    const { 
      bookTitle, 
      author, 
      isbn, 
      category, 
      condition, 
      images, 
      description,
      publisher,
      publishedYear,
      language,
      tradePreferences,
      location 
    } = req.body;

    const newListing = new Listing({
      bookTitle,
      author,
      isbn,
      category,
      condition,
      images: images || [],
      description,
      publisher,
      publishedYear,
      language,
      tradePreferences,
      location,
      owner: req.user.id,
      status: "active"
    });

    const savedListing = await newListing.save();
    await savedListing.populate("owner", "username avatar location.city rating totalRatings");
    
    res.status(201).json(savedListing);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 4. Listing detayı getir ve view count artır
router.get("/:id", async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate("owner", "username avatar location.city rating totalRatings totalTrades");

    if (!listing) {
      return res.status(404).json({ message: "İlan bulunamadı" });
    }

    // View count artır (sadece aktif listing'ler için)
    if (listing.status === "active") {
      listing.viewCount += 1;
      await listing.save();
    }

    res.json(listing);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 5. Listing güncelle (sadece sahibi)
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ message: "İlan bulunamadı" });
    }

    if (listing.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Bu ilanı güncelleme yetkiniz yok" });
    }

    if (listing.status !== "active") {
      return res.status(400).json({ message: "Sadece aktif ilanlar güncellenebilir" });
    }

    // Aktif offer kontrolü - herhangi bir aktif offer varsa güncelleme yapılamaz
    const activeOffer = await TradeOffer.findOne({
      targetListing: req.params.id,
      status: { $in: ["pending", "chat_accepted"] }
    });

    if (activeOffer) {
      return res.status(400).json({ 
        message: "Bu ilana aktif bir teklif var. Güncelleme yapmak için önce teklifi reddetmelisiniz." 
      });
    }

    const { 
      bookTitle, 
      author, 
      isbn, 
      category, 
      condition, 
      images, 
      description,
      publisher,
      publishedYear,
      language,
      tradePreferences,
      location
    } = req.body;

    if (bookTitle !== undefined) listing.bookTitle = bookTitle;
    if (author !== undefined) listing.author = author;
    if (isbn !== undefined) listing.isbn = isbn;
    if (category !== undefined) listing.category = category;
    if (condition !== undefined) listing.condition = condition;
    if (images !== undefined) listing.images = images;
    if (description !== undefined) listing.description = description;
    if (publisher !== undefined) listing.publisher = publisher;
    if (publishedYear !== undefined) listing.publishedYear = publishedYear;
    if (language !== undefined) listing.language = language;
    if (tradePreferences !== undefined) listing.tradePreferences = tradePreferences;
    if (location !== undefined) listing.location = location;

    const updatedListing = await listing.save();
    res.json(updatedListing);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 6. Listing arşivle (sadece sahibi) - DELETE yerine
router.put("/:id/archive", verifyToken, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ message: "İlan bulunamadı" });
    }

    if (listing.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Bu ilanı arşivleme yetkiniz yok" });
    }

    if (listing.status !== "active") {
      return res.status(400).json({ message: "Sadece aktif ilanlar arşivlenebilir" });
    }

    // Aktif offer kontrolü - aktif offer varsa arşivlenemez
    const activeOffer = await TradeOffer.findOne({
      targetListing: req.params.id,
      status: { $in: ["pending", "chat_accepted"] }
    });

    if (activeOffer) {
      return res.status(400).json({ 
        message: "Bu ilana aktif bir teklif var. Arşivlemek için önce teklifi reddetmelisiniz." 
      });
    }

    // Arşivle
    listing.status = "removed";
    listing.archivedDate = new Date();
    await listing.save();
    
    res.json({ message: "İlan arşivlendi", listing });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 7. DELETE route'unu kaldır - artık kullanılmayacak
// router.delete() artık yok

module.exports = router;
