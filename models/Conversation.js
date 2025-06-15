const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    tradeOffer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TradeOffer",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "ended"],
      default: "active",
    },
    endedAt: {
      type: Date,
    },
    endReason: {
      type: String,
      enum: ["offer_accepted", "offer_rejected", "offer_archived"],
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index'ler
conversationSchema.index({ participants: 1, status: 1 });
conversationSchema.index({ tradeOffer: 1 });

module.exports = mongoose.model("Conversation", conversationSchema);
