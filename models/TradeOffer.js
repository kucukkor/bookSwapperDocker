const mongoose = require("mongoose");

const tradeOfferSchema = new mongoose.Schema(
  {
    // Teklif Eden Kullanıcı
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
    // Hedef Kullanıcı ve Listing
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetListing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    
    // Teklif Edilen Kitap Bilgileri
    offeredBook: {
      bookTitle: {
        type: String,
        required: true,
      },
      author: {
        type: String,
        required: true,
      },
      isbn: {
        type: String,
      },
      category: {
        type: String, // Frontend'den gelecek
        required: true,
      },
      condition: {
        type: String,
        enum: ["yeni", "çok_iyi", "iyi", "orta"],
        required: true,
      },
      images: [{
        type: String,
      }],
      description: {
        type: String,
        maxlength: 500,
      },
      publisher: {
        type: String,
      },
      publishedYear: {
        type: Number,
      }
    },
    
    // Mesaj
    message: {
      type: String,
      maxlength: 1000,
    },
    
    // 2 Aşamalı Durum Sistemi
    status: {
      type: String,
      enum: [
        "pending",        // Offer gönderildi, chat henüz kabul edilmedi
        "chat_accepted",  // Chat kabul edildi, konuşma başladı
        "accepted",       // Offer kabul edildi, takas onaylandı
        "rejected",       // Offer reddedildi
        "cancelled"       // Offer iptal edildi
      ],
      default: "pending",
    },
    
    // Chat Kabul Tarihi
    chatAcceptedDate: {
      type: Date,
    },
    
    // Offer Yanıt
    responseMessage: {
      type: String,
      maxlength: 1000,
    },
    responseDate: {
      type: Date,
    },
    
    // Konuşma (Chat kabul edilince oluşur)
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
    },
    
    // Takas Tamamlanma
    completedDate: {
      type: Date,
    },
    
    // Review Durumu (Zorunlu)
    reviewStatus: {
      fromUserReviewed: {
        type: Boolean,
        default: false,
      },
      toUserReviewed: {
        type: Boolean,
        default: false,
      },
      bothReviewed: {
        type: Boolean,
        default: false,
      }
    }
  },
  {
    timestamps: true,
  }
);

// Index'ler
tradeOfferSchema.index({ fromUser: 1, status: 1 });
tradeOfferSchema.index({ toUser: 1, status: 1 });
tradeOfferSchema.index({ targetListing: 1, status: 1 });

module.exports = mongoose.model("TradeOffer", tradeOfferSchema); 