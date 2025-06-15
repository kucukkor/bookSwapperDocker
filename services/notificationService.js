const Notification = require("../models/Notification");

class NotificationService {
  // Bildirim oluştur
  static async createNotification({
    recipient,
    sender = null,
    type,
    title,
    message,
    data = {},
    priority = "medium"
  }) {
    try {
      const notification = new Notification({
        recipient,
        sender,
        type,
        title,
        message,
        data,
        priority
      });

      await notification.save();
      
      // Socket.IO ile real-time bildirim gönder (eğer varsa)
      if (global.io) {
        global.io.to(`user_${recipient}`).emit("newNotification", {
          id: notification._id,
          type,
          title,
          message,
          data,
          priority,
          createdAt: notification.createdAt
        });
      }

      return notification;
    } catch (error) {
      console.error("Bildirim oluşturma hatası:", error);
      return null;
    }
  }

  // Offer bildirimleri
  static async notifyNewOffer(offer) {
    await this.createNotification({
      recipient: offer.toUser,
      sender: offer.fromUser,
      type: "new_offer",
      title: "Yeni Teklif Aldınız!",
      message: `${offer.offeredBook.bookTitle} kitabı için yeni bir teklif aldınız.`,
      data: {
        offerId: offer._id,
        listingId: offer.targetListing
      },
      priority: "high"
    });
  }

  static async notifyOfferChatAccepted(offer) {
    await this.createNotification({
      recipient: offer.fromUser,
      sender: offer.toUser,
      type: "offer_chat_accepted",
      title: "Chat Kabul Edildi!",
      message: "Teklifiniz için chat kabul edildi. Artık konuşabilirsiniz!",
      data: {
        offerId: offer._id,
        conversationId: offer.conversation
      },
      priority: "high"
    });
  }

  static async notifyOfferAccepted(offer) {
    await this.createNotification({
      recipient: offer.fromUser,
      sender: offer.toUser,
      type: "offer_accepted",
      title: "Teklif Kabul Edildi! 🎉",
      message: "Teklifiniz kabul edildi! Takas tamamlandı.",
      data: {
        offerId: offer._id,
        listingId: offer.targetListing
      },
      priority: "high"
    });
  }

  static async notifyOfferRejected(offer) {
    await this.createNotification({
      recipient: offer.fromUser,
      sender: offer.toUser,
      type: "offer_rejected",
      title: "Teklif Reddedildi",
      message: "Maalesef teklifiniz reddedildi.",
      data: {
        offerId: offer._id,
        listingId: offer.targetListing
      },
      priority: "medium"
    });
  }

  static async notifyOfferCancelled(offer) {
    await this.createNotification({
      recipient: offer.toUser,
      sender: offer.fromUser,
      type: "offer_cancelled",
      title: "Teklif İptal Edildi",
      message: "Size gönderilen bir teklif iptal edildi.",
      data: {
        offerId: offer._id,
        listingId: offer.targetListing
      },
      priority: "low"
    });
  }

  // Mesaj bildirimleri
  static async notifyNewMessage(message, conversation) {
    // Gönderen hariç diğer katılımcılara bildir
    const recipients = conversation.participants.filter(
      p => p.toString() !== message.sender.toString()
    );

    for (const recipient of recipients) {
      await this.createNotification({
        recipient,
        sender: message.sender,
        type: "new_message",
        title: "Yeni Mesaj",
        message: "Size yeni bir mesaj geldi.",
        data: {
          conversationId: conversation._id,
          offerId: conversation.tradeOffer
        },
        priority: "medium"
      });
    }
  }

  // Conversation bildirimleri
  static async notifyConversationEnded(conversation, reason) {
    const reasonMessages = {
      "offer_accepted": "Teklif kabul edildi, chat sonlandırıldı.",
      "offer_rejected": "Teklif reddedildi, chat sonlandırıldı.",
      "offer_archived": "Teklif arşivlendi, chat sonlandırıldı."
    };

    for (const participant of conversation.participants) {
      await this.createNotification({
        recipient: participant,
        type: "conversation_ended",
        title: "Chat Sonlandırıldı",
        message: reasonMessages[reason] || "Chat sonlandırıldı.",
        data: {
          conversationId: conversation._id,
          offerId: conversation.tradeOffer
        },
        priority: "low"
      });
    }
  }

  // Review bildirimleri
  static async notifyReviewRequired(userId, tradeOffer) {
    await this.createNotification({
      recipient: userId,
      type: "review_required",
      title: "Değerlendirme Bekleniyor",
      message: "Tamamlanan takasınız için değerlendirme yapmanız gerekiyor.",
      data: {
        offerId: tradeOffer._id
      },
      priority: "medium"
    });
  }

  static async notifyReviewReceived(review) {
    await this.createNotification({
      recipient: review.reviewee,
      sender: review.reviewer,
      type: "review_received",
      title: "Yeni Değerlendirme Aldınız",
      message: `${review.rating} yıldızlı bir değerlendirme aldınız.`,
      data: {
        reviewId: review._id,
        offerId: review.tradeOffer
      },
      priority: "low"
    });
  }

  // Kullanıcının bildirimlerini getir
  static async getUserNotifications(userId, { page = 1, limit = 20, unreadOnly = false } = {}) {
    const filter = { recipient: userId };
    if (unreadOnly) {
      filter.isRead = false;
    }

    const notifications = await Notification.find(filter)
      .populate("sender", "username avatar")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false
    });

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      unreadCount
    };
  }

  // Bildirimleri okundu işaretle
  static async markAsRead(userId, notificationIds = []) {
    const filter = { recipient: userId };
    
    if (notificationIds.length > 0) {
      filter._id = { $in: notificationIds };
    } else {
      // Tüm bildirimleri okundu yap
      filter.isRead = false;
    }

    await Notification.updateMany(filter, {
      isRead: true,
      readAt: new Date()
    });

    return true;
  }

  // Eski bildirimleri temizle (30 gün)
  static async cleanOldNotifications() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    await Notification.deleteMany({
      createdAt: { $lt: thirtyDaysAgo },
      isRead: true
    });
  }
}

module.exports = NotificationService; 