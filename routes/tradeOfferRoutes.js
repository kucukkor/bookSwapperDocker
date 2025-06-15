const express = require("express");
const router = express.Router();
const TradeOffer = require("../models/TradeOffer");
const Listing = require("../models/Listing");
const Conversation = require("../models/Conversation");
const NotificationService = require("../services/notificationService");
const verifyToken = require("../middleware/authMiddleware");

// 1. Alınan offer'ları getir (JWT gerekli)
router.get("/received", verifyToken, async (req, res) => {
  try {
    const offers = await TradeOffer.find({
      toUser: req.user.id,
      status: { $in: ["pending", "chat_accepted", "accepted", "rejected"] }
    })
    .populate("fromUser", "username email avatar location.city rating totalRatings")
    .populate("targetListing", "bookTitle author category")
    .sort({ createdAt: -1 });
    
    res.json(offers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. Gönderilen offer'ları getir (JWT gerekli)
router.get("/sent", verifyToken, async (req, res) => {
  try {
    const offers = await TradeOffer.find({
      fromUser: req.user.id
    })
    .populate("toUser", "username email avatar location.city rating totalRatings")
    .populate("targetListing", "bookTitle author category")
    .sort({ createdAt: -1 });
    
    res.json(offers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. Yeni offer gönder (JWT gerekli)
router.post("/", verifyToken, async (req, res) => {
  try {
    const {
      targetListingId,
      offeredBook,
      message
    } = req.body;

    // Target listing'in var olduğunu kontrol et
    const targetListing = await Listing.findById(targetListingId);
    if (!targetListing) {
      return res.status(404).json({ message: "Hedef ilan bulunamadı" });
    }

    if (targetListing.status !== "active") {
      return res.status(400).json({ message: "Bu ilan artık aktif değil" });
    }

    // Kendi ilanına teklif veremez
    if (targetListing.owner.toString() === req.user.id) {
      return res.status(400).json({ message: "Kendi ilanınıza teklif veremezsiniz" });
    }

    // Bu listing'e zaten aktif bir offer var mı kontrol et (herhangi bir kullanıcıdan)
    const anyActiveOffer = await TradeOffer.findOne({
      targetListing: targetListingId,
      status: { $in: ["pending", "chat_accepted"] }
    });

    if (anyActiveOffer) {
      return res.status(400).json({ message: "Bu ilana zaten aktif bir teklif var. Lütfen daha sonra tekrar deneyin." });
    }

    // Aynı kullanıcının daha önce reddedilen offer'ı var mı kontrol et
    const rejectedOffer = await TradeOffer.findOne({
      fromUser: req.user.id,
      targetListing: targetListingId,
      status: "rejected"
    });

    if (rejectedOffer) {
      return res.status(400).json({ message: "Bu ilana daha önce reddedilen bir teklifiniz var. Tekrar teklif gönderemezsiniz." });
    }

    const newOffer = new TradeOffer({
      fromUser: req.user.id,
      toUser: targetListing.owner,
      targetListing: targetListingId,
      offeredBook,
      message,
      status: "pending"
    });

    const savedOffer = await newOffer.save();
    await savedOffer.populate("fromUser", "username email avatar location.city rating totalRatings");
    await savedOffer.populate("targetListing", "bookTitle author category");
    
    // Target listing'in offer count'unu artır
    targetListing.offerCount += 1;
    await targetListing.save();
    
    // Bildirim gönder
    await NotificationService.notifyNewOffer(savedOffer);
    
    res.status(201).json(savedOffer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 4. Chat'i kabul et (1. aşama - JWT gerekli)
router.put("/:id/accept-chat", verifyToken, async (req, res) => {
  try {
    const offer = await TradeOffer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({ message: "Teklif bulunamadı" });
    }

    if (offer.toUser.toString() !== req.user.id) {
      return res.status(403).json({ message: "Bu teklifi kabul etme yetkiniz yok" });
    }

    if (offer.status !== "pending") {
      return res.status(400).json({ message: "Bu teklif zaten yanıtlanmış" });
    }

    // Chat'i kabul et
    offer.status = "chat_accepted";
    offer.chatAcceptedDate = new Date();
    await offer.save();

    // Conversation oluştur
    const conversation = new Conversation({
      participants: [offer.fromUser, offer.toUser],
      listing: offer.targetListing,
      tradeOffer: offer._id,
      status: "active"
    });
    await conversation.save();

    // Offer'a conversation'ı bağla
    offer.conversation = conversation._id;
    await offer.save();

    // Sistem mesajı ekle
    const Message = require("../models/Message");
    const systemMessage = new Message({
      conversation: conversation._id,
      sender: offer.toUser,
      content: "Chat kabul edildi. Artık konuşabilirsiniz!",
      messageType: "system"
    });
    await systemMessage.save();

    await offer.populate("fromUser", "username email avatar");
    await offer.populate("conversation");

    // Bildirim gönder
    await NotificationService.notifyOfferChatAccepted(offer);

    res.json({ 
      message: "Chat kabul edildi, konuşma başlatıldı", 
      offer,
      conversationId: conversation._id 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 5. Offer'ı kabul et (2. aşama - JWT gerekli)
router.put("/:id/accept-offer", verifyToken, async (req, res) => {
  try {
    const { responseMessage } = req.body;
    const offer = await TradeOffer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({ message: "Teklif bulunamadı" });
    }

    if (offer.toUser.toString() !== req.user.id) {
      return res.status(403).json({ message: "Bu teklifi kabul etme yetkiniz yok" });
    }

    if (offer.status !== "chat_accepted") {
      return res.status(400).json({ message: "Önce chat'i kabul etmelisiniz" });
    }

    // Offer'ı kabul et
    offer.status = "accepted";
    offer.responseMessage = responseMessage;
    offer.responseDate = new Date();
    offer.completedDate = new Date();
    await offer.save();

    // Her iki listing'i de completed yap
    await Listing.findByIdAndUpdate(offer.targetListing, {
      status: "completed",
      completedTradeOffer: offer._id,
      completedDate: new Date()
    });

    // Conversation'ı sonlandır
    if (offer.conversation) {
      await Conversation.findByIdAndUpdate(offer.conversation, {
        status: "ended",
        endedAt: new Date(),
        endReason: "offer_accepted"
      });

      // Sistem mesajı ekle
      const Message = require("../models/Message");
      const systemMessage = new Message({
        conversation: offer.conversation,
        sender: offer.toUser,
        content: "Teklif kabul edildi! Takas tamamlandı. Chat sonlandırıldı.",
        messageType: "system"
      });
      await systemMessage.save();
    }

    // Bildirim gönder
    await NotificationService.notifyOfferAccepted(offer);

    res.json({ message: "Teklif kabul edildi, takas tamamlandı", offer });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 6. Offer'ı reddet (JWT gerekli)
router.put("/:id/reject", verifyToken, async (req, res) => {
  try {
    const { responseMessage } = req.body;
    const offer = await TradeOffer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({ message: "Teklif bulunamadı" });
    }

    if (offer.toUser.toString() !== req.user.id) {
      return res.status(403).json({ message: "Bu teklifi reddetme yetkiniz yok" });
    }

    if (!["pending", "chat_accepted"].includes(offer.status)) {
      return res.status(400).json({ message: "Bu teklif zaten yanıtlanmış" });
    }

    offer.status = "rejected";
    offer.responseMessage = responseMessage;
    offer.responseDate = new Date();
    await offer.save();

    // Conversation varsa sonlandır
    if (offer.conversation) {
      await Conversation.findByIdAndUpdate(offer.conversation, {
        status: "ended",
        endedAt: new Date(),
        endReason: "offer_rejected"
      });

      // Sistem mesajı ekle
      const Message = require("../models/Message");
      const systemMessage = new Message({
        conversation: offer.conversation,
        sender: offer.toUser,
        content: "Teklif reddedildi. Chat sonlandırıldı.",
        messageType: "system"
      });
      await systemMessage.save();
    }

    // Bildirim gönder
    await NotificationService.notifyOfferRejected(offer);

    res.json({ message: "Teklif reddedildi", offer });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 7. Offer'ı iptal et (sadece gönderen - JWT gerekli)
router.put("/:id/cancel", verifyToken, async (req, res) => {
  try {
    const offer = await TradeOffer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({ message: "Teklif bulunamadı" });
    }

    if (offer.fromUser.toString() !== req.user.id) {
      return res.status(403).json({ message: "Bu teklifi iptal etme yetkiniz yok" });
    }

    if (!["pending", "chat_accepted"].includes(offer.status)) {
      return res.status(400).json({ message: "Bu teklif iptal edilemez" });
    }

    offer.status = "cancelled";
    await offer.save();

    // Bildirim gönder
    await NotificationService.notifyOfferCancelled(offer);

    res.json({ message: "Teklif iptal edildi", offer });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 8. Offer detayı getir (JWT gerekli)
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const offer = await TradeOffer.findById(req.params.id)
      .populate("fromUser", "username email avatar location phone preferences totalTrades rating totalRatings")
      .populate("toUser", "username email avatar location phone preferences totalTrades rating totalRatings")
      .populate("targetListing")
      .populate("conversation");

    if (!offer) {
      return res.status(404).json({ message: "Teklif bulunamadı" });
    }

    // Sadece ilgili kullanıcılar görebilir
    if (![offer.fromUser._id.toString(), offer.toUser._id.toString()].includes(req.user.id)) {
      return res.status(403).json({ message: "Bu teklifi görme yetkiniz yok" });
    }

    res.json(offer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 9. Offer arşivle (sadece gönderen - UPDATE/DELETE yerine)
router.put("/:id/archive", verifyToken, async (req, res) => {
  try {
    const offer = await TradeOffer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({ message: "Teklif bulunamadı" });
    }

    if (offer.fromUser.toString() !== req.user.id) {
      return res.status(403).json({ message: "Bu teklifi arşivleme yetkiniz yok" });
    }

    // Kabul edilmiş offer'lar arşivlenemez (zaten arşivde)
    if (offer.status === "accepted") {
      return res.status(400).json({ message: "Kabul edilmiş teklifler zaten arşivdedir" });
    }

    // Aktif offer'ı arşivle (reddedilmiş gibi işle)
    if (["pending", "chat_accepted"].includes(offer.status)) {
      offer.status = "rejected";
      offer.responseMessage = "Kullanıcı tarafından arşivlendi";
      offer.responseDate = new Date();
      offer.archivedByUser = true;
      await offer.save();

      // Conversation varsa sonlandır
      if (offer.conversation) {
        const Conversation = require("../models/Conversation");
        await Conversation.findByIdAndUpdate(offer.conversation, {
          status: "ended",
          endedAt: new Date(),
          endReason: "offer_archived"
        });
      }

      res.json({ message: "Teklif arşivlendi", offer });
    } else {
      res.status(400).json({ message: "Bu teklif arşivlenemez" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 