const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    // Takas Bilgileri
    tradeOffer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TradeOffer",
      required: true,
    },
    
    // Değerlendiren ve Değerlendirilen
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reviewee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
    // Değerlendirme
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      maxlength: 500,
    },
    
    // Zorunlu Review Sistemi
    isRequired: {
      type: Boolean,
      default: true,
    },
    reminderCount: {
      type: Number,
      default: 0,
    },
    
    // Durum
    isVisible: {
      type: Boolean,
      default: true,
    }
  },
  {
    timestamps: true,
  }
);

// Index'ler
reviewSchema.index({ reviewer: 1, reviewee: 1, tradeOffer: 1 }, { unique: true });
reviewSchema.index({ reviewee: 1, isVisible: 1 });

module.exports = mongoose.model("Review", reviewSchema); 