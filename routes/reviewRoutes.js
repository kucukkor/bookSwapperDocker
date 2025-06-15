const express = require("express");
const router = express.Router();
const Review = require("../models/Review");
const TradeOffer = require("../models/TradeOffer");
const User = require("../models/User");
const NotificationService = require("../services/notificationService");
const verifyToken = require("../middleware/authMiddleware");

// 1. Bekleyen review'ları getir (JWT gerekli)
router.get("/pending", verifyToken, async (req, res) => {
  try {
    // Kullanıcının review vermesi gereken tamamlanmış offer'ları bul
    const completedOffers = await TradeOffer.find({
      $or: [
        { fromUser: req.user.id },
        { toUser: req.user.id }
      ],
      status: "accepted"
    }).populate("fromUser", "username").populate("toUser", "username");

    const pendingReviews = [];

    for (const offer of completedOffers) {
      // Bu offer için kullanıcının review verip vermediğini kontrol et
      const existingReview = await Review.findOne({
        tradeOffer: offer._id,
        reviewer: req.user.id
      });

      if (!existingReview) {
        // Review verilmemiş, pending listesine ekle
        const revieweeId = offer.fromUser._id.toString() === req.user.id 
          ? offer.toUser._id 
          : offer.fromUser._id;
        
        const revieweeName = offer.fromUser._id.toString() === req.user.id 
          ? offer.toUser.username 
          : offer.fromUser.username;

        pendingReviews.push({
          tradeOffer: offer,
          revieweeId,
          revieweeName
        });
      }
    }

    res.json(pendingReviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. Review gönder (JWT gerekli)
router.post("/", verifyToken, async (req, res) => {
  try {
    const { tradeOfferId, revieweeId, rating, comment } = req.body;

    // TradeOffer'ın var olduğunu ve tamamlandığını kontrol et
    const tradeOffer = await TradeOffer.findById(tradeOfferId);
    if (!tradeOffer) {
      return res.status(404).json({ message: "Takas bulunamadı" });
    }

    if (tradeOffer.status !== "accepted") {
      return res.status(400).json({ message: "Sadece tamamlanmış takaslar için review verilebilir" });
    }

    // Kullanıcının bu takasın bir parçası olduğunu kontrol et
    if (![tradeOffer.fromUser.toString(), tradeOffer.toUser.toString()].includes(req.user.id)) {
      return res.status(403).json({ message: "Bu takas için review verme yetkiniz yok" });
    }

    // Reviewee'nin doğru olduğunu kontrol et
    const expectedRevieweeId = tradeOffer.fromUser.toString() === req.user.id 
      ? tradeOffer.toUser.toString() 
      : tradeOffer.fromUser.toString();

    if (revieweeId !== expectedRevieweeId) {
      return res.status(400).json({ message: "Yanlış kullanıcıya review vermeye çalışıyorsunuz" });
    }

    // Daha önce review verilmiş mi kontrol et
    const existingReview = await Review.findOne({
      tradeOffer: tradeOfferId,
      reviewer: req.user.id,
      reviewee: revieweeId
    });

    if (existingReview) {
      return res.status(400).json({ message: "Bu takas için zaten review verdiniz" });
    }

    // Review oluştur
    const newReview = new Review({
      tradeOffer: tradeOfferId,
      reviewer: req.user.id,
      reviewee: revieweeId,
      rating,
      comment
    });

    const savedReview = await newReview.save();

    // TradeOffer'daki review status'unu güncelle
    if (tradeOffer.fromUser.toString() === req.user.id) {
      tradeOffer.reviewStatus.fromUserReviewed = true;
    } else {
      tradeOffer.reviewStatus.toUserReviewed = true;
    }

    // Her iki kullanıcı da review verdiyse bothReviewed = true
    if (tradeOffer.reviewStatus.fromUserReviewed && tradeOffer.reviewStatus.toUserReviewed) {
      tradeOffer.reviewStatus.bothReviewed = true;
    }

    await tradeOffer.save();

    // Reviewee'nin rating'ini güncelle
    const reviewee = await User.findById(revieweeId);
    const totalRating = (reviewee.rating * reviewee.totalRatings) + rating;
    reviewee.totalRatings += 1;
    reviewee.rating = totalRating / reviewee.totalRatings;
    
    // Pending reviews sayısını azalt
    if (reviewee.pendingReviews > 0) {
      reviewee.pendingReviews -= 1;
    }

    await reviewee.save();

    // Bildirim gönder
    await NotificationService.notifyReviewReceived(savedReview);

    await savedReview.populate("reviewee", "username");
    res.status(201).json(savedReview);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 3. Kullanıcının aldığı review'ları getir
router.get("/received/:userId", async (req, res) => {
  try {
    const reviews = await Review.find({
      reviewee: req.params.userId,
      isVisible: true
    })
    .populate("reviewer", "username avatar")
    .populate("tradeOffer", "createdAt")
    .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. Kullanıcının verdiği review'ları getir (JWT gerekli)
router.get("/given", verifyToken, async (req, res) => {
  try {
    const reviews = await Review.find({
      reviewer: req.user.id
    })
    .populate("reviewee", "username avatar")
    .populate("tradeOffer", "createdAt")
    .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 