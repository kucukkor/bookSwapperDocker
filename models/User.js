const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // Temel Bilgiler
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    
    // Profil Bilgileri
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    avatar: {
      type: String, // Profil fotoğrafı URL/path
    },
    bio: {
      type: String,
      maxlength: 500,
    },
    
    // İletişim Bilgileri
    phone: {
      type: String,
    },
    location: {
      city: {
        type: String,
      },
      district: {
        type: String,
      }
    },
    
    // Hesap Durumu
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    
    // İstatistikler
    totalTrades: {
      type: Number,
      default: 0,
    },
    successfulTrades: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
    
    // Review Durumu
    pendingReviews: {
      type: Number,
      default: 0,
    },
    
    // Tercihler
    preferences: {
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      showLocation: {
        type: Boolean,
        default: true,
      },
      showPhone: {
        type: Boolean,
        default: false,
      }
    },
    
    // Tarihler
    lastLoginAt: {
      type: Date,
    },
    verifiedAt: {
      type: Date,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
