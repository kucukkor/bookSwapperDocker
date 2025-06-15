const express = require("express");
const router = express.Router();
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const TradeOffer = require("../models/TradeOffer");
const NotificationService = require("../services/notificationService");
const verifyToken = require("../middleware/authMiddleware");

// 1. Kullanıcının conversation'larını getir (JWT gerekli)
router.get("/", verifyToken, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id
    })
    .populate("participants", "username avatar")
    .populate("listing", "bookTitle author")
    .populate("tradeOffer", "status offeredBook")
    .sort({ lastMessageAt: -1 });

    res.json(conversations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. Conversation detayı ve mesajları getir (JWT gerekli)
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate("participants", "username avatar")
      .populate("listing", "bookTitle author")
      .populate("tradeOffer", "status offeredBook");

    if (!conversation) {
      return res.status(404).json({ message: "Konuşma bulunamadı" });
    }

    // Sadece katılımcılar görebilir
    if (!conversation.participants.some(p => p._id.toString() === req.user.id)) {
      return res.status(403).json({ message: "Bu konuşmayı görme yetkiniz yok" });
    }

    // Mesajları getir
    const messages = await Message.find({
      conversation: req.params.id
    })
    .populate("sender", "username avatar")
    .sort({ createdAt: 1 });

    res.json({
      conversation,
      messages
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. Mesaj gönder (JWT gerekli)
router.post("/:id/messages", verifyToken, async (req, res) => {
  try {
    const { content } = req.body;

    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({ message: "Konuşma bulunamadı" });
    }

    // Sadece katılımcılar mesaj gönderebilir
    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({ message: "Bu konuşmaya mesaj gönderme yetkiniz yok" });
    }

    // Conversation aktif mi kontrol et
    if (conversation.status !== "active") {
      return res.status(400).json({ message: "Bu konuşma sonlanmıştır. Artık mesaj gönderemezsiniz." });
    }

    // Mesaj oluştur
    const newMessage = new Message({
      conversation: req.params.id,
      sender: req.user.id,
      content,
      messageType: "text"
    });

    const savedMessage = await newMessage.save();
    await savedMessage.populate("sender", "username avatar");

    // Conversation'ın lastMessageAt'ini güncelle
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Bildirim gönder (gönderen hariç diğer katılımcılara)
    await NotificationService.notifyNewMessage(savedMessage, conversation);

    res.status(201).json(savedMessage);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 4. Mesajları okundu olarak işaretle (JWT gerekli)
router.put("/:id/messages/read", verifyToken, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({ message: "Konuşma bulunamadı" });
    }

    // Sadece katılımcılar işaretleyebilir
    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({ message: "Bu konuşmadaki mesajları işaretleme yetkiniz yok" });
    }

    // Kullanıcının gönderdiği mesajlar hariç diğerlerini okundu yap
    await Message.updateMany({
      conversation: req.params.id,
      sender: { $ne: req.user.id },
      isRead: false
    }, {
      isRead: true,
      readAt: new Date()
    });

    res.json({ message: "Mesajlar okundu olarak işaretlendi" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
