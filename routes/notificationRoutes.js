const express = require("express");
const router = express.Router();
const NotificationService = require("../services/notificationService");
const verifyToken = require("../middleware/authMiddleware");

// 1. Kullanıcının bildirimlerini getir (JWT gerekli)
router.get("/", verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    
    const result = await NotificationService.getUserNotifications(req.user.id, {
      page: parseInt(page),
      limit: parseInt(limit),
      unreadOnly: unreadOnly === 'true'
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. Okunmamış bildirim sayısını getir (JWT gerekli)
router.get("/unread-count", verifyToken, async (req, res) => {
  try {
    const result = await NotificationService.getUserNotifications(req.user.id, {
      page: 1,
      limit: 1,
      unreadOnly: true
    });

    res.json({ unreadCount: result.unreadCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. Bildirimleri okundu işaretle (JWT gerekli)
router.put("/mark-read", verifyToken, async (req, res) => {
  try {
    const { notificationIds = [] } = req.body;
    
    await NotificationService.markAsRead(req.user.id, notificationIds);
    
    res.json({ message: "Bildirimler okundu olarak işaretlendi" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. Tüm bildirimleri okundu işaretle (JWT gerekli)
router.put("/mark-all-read", verifyToken, async (req, res) => {
  try {
    await NotificationService.markAsRead(req.user.id);
    
    res.json({ message: "Tüm bildirimler okundu olarak işaretlendi" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 