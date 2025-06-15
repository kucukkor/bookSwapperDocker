const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema(
  {
    // Kitap Bilgileri
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
      maxlength: 1000,
    },
    
    // Yayın Bilgileri (isteğe bağlı)
    publisher: {
      type: String,
    },
    publishedYear: {
      type: Number,
    },
    language: {
      type: String,
      default: "Türkçe",
    },
    
    // Sahip Bilgileri
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
    // Takas Tercihleri
    tradePreferences: {
      wantedCategories: [{
        type: String, // Frontend'den gelecek
      }],
      wantedAuthors: [{
        type: String,
      }],
      notes: {
        type: String,
        maxlength: 500,
      }
    },
    
    // Lokasyon
    location: {
      city: {
        type: String,
        required: true,
      },
      district: {
        type: String,
      },
      shippingAvailable: {
        type: Boolean,
        default: false,
      }
    },
    
    // Durum
    status: {
      type: String,
      enum: ["active", "pending", "completed", "removed"],
      default: "active",
    },
    
    // İstatistikler
    viewCount: {
      type: Number,
      default: 0,
    },
    favoriteCount: {
      type: Number,
      default: 0,
    },
    offerCount: {
      type: Number,
      default: 0,
    },
    
    // Takas Bilgileri
    completedTradeOffer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TradeOffer",
    },
    completedDate: {
      type: Date,
    }
  },
  {
    timestamps: true,
  }
);

// Index'ler
listingSchema.index({ status: 1, category: 1 });
listingSchema.index({ owner: 1, status: 1 });
listingSchema.index({ "location.city": 1, status: 1 });

module.exports = mongoose.model("Listing", listingSchema);
