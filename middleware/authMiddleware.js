const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res.status(401).json({
      message: "Token bulunamadı, yetkisiz erişim!",
    });
  }

  // "Bearer TOKEN" formatından sadece TOKEN kısmını al
  const token = authHeader.startsWith("Bearer ") 
    ? authHeader.slice(7) 
    : authHeader;

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; // token'daki kullanıcı bilgilerini ekle
    next(); // bir sonraki middleware'e geç
  } catch (err) {
    res.status(400).json({
      message: "Geçersiz token!",
    });
  }
}

module.exports = verifyToken;
