const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Sistem bildirimleri için null olabilir
    },
    type: {
      type: String,
      enum: [
        "new_offer",
        "offer_chat_accepted", 
        "offer_accepted",
        "offer_rejected",
        "offer_cancelled",
        "new_message",
        "conversation_ended",
        "review_required",
        "review_received",
        "listing_created"
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 100,
    },
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },
    data: {
      // İlgili ID'ler ve ek bilgiler
      listingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Listing",
      },
      offerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TradeOffer",
      },
      conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation",
      },
      reviewId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review",
      },
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
  },
  {
    timestamps: true,
  }
);

// Index'ler
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema); 