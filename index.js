const Message = require("./models/Message");
const Conversation = require("./models/Conversation");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const http = require("http");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Frontend adresinle sınırlandırılabilir
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Test endpoint
app.get("/", (req, res) => {
  res.send("BookSwap backend çalışıyor!");
});

// MongoDB bağlantısı
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB bağlantısı başarılı"))
  .catch((err) => console.error("❌ MongoDB bağlantı hatası:", err));

// Routes
const userRoutes = require("./routes/userRoutes");
const listingRoutes = require("./routes/listingRoutes");
const tradeOfferRoutes = require("./routes/tradeOfferRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const messageRoutes = require("./routes/messageRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

app.use("/api/users", userRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/offers", tradeOfferRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/notifications", notificationRoutes);

// Socket.IO bağlantısı
io.on("connection", (socket) => {
  console.log("🔌 Yeni kullanıcı bağlandı:", socket.id);

  // Kullanıcı authentication
  socket.on("authenticate", ({ userId }) => {
    socket.join(`user_${userId}`);
    console.log(`Kullanıcı ${userId} authenticated ve room'a katıldı`);
  });

  socket.on("joinRoom", ({ roomId }) => {
    socket.join(roomId);
    console.log(`Kullanıcı ${socket.id} oda ${roomId}'ye katıldı`);
  });

  socket.on("sendMessage", async ({ roomId, senderId, content }) => {
    try {
      // 1. Mesajı MongoDB'ye kaydet
      const newMessage = new Message({
        conversation: roomId,
        sender: senderId,
        content,
      });

      const savedMessage = await newMessage.save();

      // 2. Oda içindeki kullanıcılara anlık mesaj gönder
      io.to(roomId).emit("receiveMessage", {
        _id: savedMessage._id,
        conversation: savedMessage.conversation,
        sender: senderId,
        content: savedMessage.content,
        createdAt: savedMessage.createdAt,
      });
    } catch (err) {
      console.error("💥 Mesaj kaydetme hatası:", err.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Kullanıcı ayrıldı:", socket.id);
  });
});

// Sunucuyu başlat
server.listen(PORT, () => {
  console.log(`🚀 Sunucu ${PORT} portunda çalışıyor (Socket.IO ile)`);
});

// Socket.IO'yu global olarak erişilebilir yap
global.io = io;

module.exports = app;
