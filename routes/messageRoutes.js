const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const verifyToken = require("../middleware/authMiddleware");

// ✅ Mesaj gönder
router.post("/", verifyToken, async (req, res) => {
  try {
    const { conversationId, text } = req.body;

    // Konuşma var mı ve kullanıcı buna dahil mi?
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(req.user.id)) {
      return res.status(403).json({ message: "Bu konuşmaya erişimin yok." });
    }

    const message = new Message({
      conversation: conversationId,
      sender: req.user.id,
      text,
    });

    const saved = await message.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Belirli bir konuşmanın tüm mesajlarını getir
router.get("/:conversationId", verifyToken, async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(req.user.id)) {
      return res.status(403).json({ message: "Bu konuşmaya erişimin yok." });
    }

    const messages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: 1 })
      .populate("sender", "username");

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
