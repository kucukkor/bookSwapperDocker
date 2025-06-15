# 📚 Book-Swap Frontend Entegrasyon Rehberi

## 🎯 Sistem Genel Bakış

Book-Swap, kullanıcıların kitap takası yapabildiği kapsamlı bir platform. Sistem 2-aşamalı teklif sistemi, zorunlu review sistemi ve gerçek zamanlı mesajlaşma özelliklerine sahip.

### 🏗️ Temel Mimari
- **Backend**: Node.js + Express + MongoDB + Socket.IO
- **Authentication**: JWT Token (24 saat geçerli)
- **Real-time**: Socket.IO ile anlık mesajlaşma
- **File Upload**: Multer ile resim yükleme

---

## 🔐 Authentication Sistemi

### 📝 Kullanıcı Kaydı
**Endpoint**: `POST /api/users/register`

**Request Body**:
```json
{
  "username": "string (min: 3 karakter)",
  "email": "string (geçerli email formatı)",
  "password": "string (min: 6 karakter)",
  "firstName": "string (min: 2 karakter)",
  "lastName": "string (min: 2 karakter)",
  "city": "string (min: 2 karakter)"
}
```

**Başarılı Response**:
```json
{
  "message": "Kayıt başarılı"
}
```

**Validasyon Hataları**:
```json
// Kısa username
{ "message": "Kullanıcı adı en az 3 karakter olmalıdır" }

// Geçersiz email
{ "message": "Geçerli bir e-posta adresi giriniz" }

// Kısa şifre
{ "message": "Şifre en az 6 karakter olmalıdır" }

// Kısa isim
{ "message": "İsim en az 2 karakter olmalıdır" }

// Kısa soyisim
{ "message": "Soyisim en az 2 karakter olmalıdır" }

// Kısa şehir
{ "message": "Şehir en az 2 karakter olmalıdır" }

// Duplicate username
{ "message": "Bu kullanıcı adı zaten kullanılıyor" }

// Duplicate email
{ "message": "Bu e-posta zaten kullanılıyor" }
```

### 🔑 Giriş
**Endpoint**: `POST /api/users/login`

**Request Body**:
```json
{
  "email": "string (geçerli email formatı)",
  "password": "string"
}
```

**Başarılı Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "68364332f5486e2bb3ce296e",
    "username": "testuser",
    "email": "test@example.com"
  }
}
```

**Frontend Token Yönetimi**:
```javascript
// Token'ı localStorage'a kaydet
localStorage.setItem('token', response.token);

// Her API isteğinde header'a ekle
headers: {
  'Authorization': `Bearer ${localStorage.getItem('token')}`
}
```

---

## 👤 Kullanıcı Profil Sistemi

### 🔒 Kendi Profili (Private)
**Endpoint**: `GET /api/users/profile`
**Auth**: JWT Token gerekli

**Response**: Tüm kullanıcı bilgileri (email, telefon, preferences dahil)

### 🌐 Public Profil (Başkalarının)
**Endpoint**: `GET /api/users/profile/:userId`
**Auth**: Token gerekmez

**Response**:
```json
{
  "_id": "683626ebb9aead212f5fdf64",
  "username": "alice",
  "avatar": "https://example.com/avatar.jpg",
  "bio": "Kitap sevdalısı",
  "location": {
    "city": "İstanbul"
  },
  "rating": 4.5,
  "totalRatings": 2,
  "totalTrades": 5,
  "successfulTrades": 5,
  "createdAt": "2025-05-27T20:56:11.825Z",
  "reviews": [
    {
      "_id": "68363b76637832cbe91476a4",
      "reviewer": {
        "_id": "68362723b9aead212f5fdf67",
        "username": "bob",
        "avatar": "https://example.com/bob-avatar.jpg"
      },
      "rating": 5,
      "comment": "Harika bir takas deneyimi!",
      "createdAt": "2025-05-27T22:23:50.053Z"
    }
  ]
}
```

### ✏️ Profil Güncelleme
**Endpoint**: `PUT /api/users/profile`
**Auth**: JWT Token gerekli

**Request Body**:
```json
{
  "firstName": "string (min: 2 karakter, opsiyonel)",
  "lastName": "string (min: 2 karakter, opsiyonel)",
  "bio": "string (max: 500 karakter, opsiyonel)",
  "phone": "string (10-15 karakter, opsiyonel)"
}
```

**Validasyon Kuralları**:
- Dolu alanlar boşaltılamaz
- firstName/lastName minimum 2 karakter
- Bio maksimum 500 karakter
- Telefon regex: `/^[0-9+\-\s()]{10,15}$/`

### 🖼️ Avatar Güncelleme
**Endpoint**: `PUT /api/users/profile/avatar`

**Request Body**:
```json
{
  "avatar": "https://example.com/avatar.jpg"
}
```

### 📍 Konum Güncelleme
**Endpoint**: `PUT /api/users/profile/location`

**Request Body**:
```json
{
  "city": "string (min: 2 karakter, zorunlu)",
  "district": "string (min: 2 karakter, opsiyonel)",
  "address": "string (max: 200 karakter, opsiyonel)"
}
```

---

## 📖 Listing (İlan) Sistemi

### 📋 Listing Modeli
```json
{
  "_id": "ObjectId",
  "user": "ObjectId (ref: User)",
  "bookTitle": "string (zorunlu)",
  "author": "string (zorunlu)",
  "isbn": "string (opsiyonel)",
  "category": "string (zorunlu)",
  "condition": "enum: ['yeni', 'çok_iyi', 'iyi', 'orta', 'kötü']",
  "images": ["string array (max: 5)"],
  "description": "string",
  "publisher": "string",
  "publishedYear": "number",
  "language": "string (default: 'Türkçe')",
  "wantedCategories": ["string array"],
  "wantedAuthors": ["string array"],
  "notes": "string",
  "location": {
    "city": "string (zorunlu)",
    "district": "string"
  },
  "shippingAvailable": "boolean (default: false)",
  "status": "enum: ['active', 'pending', 'completed', 'removed']",
  "viewCount": "number (default: 0)",
  "favoriteCount": "number (default: 0)",
  "offerCount": "number (default: 0)",
  "completedTradeOffer": "ObjectId (ref: TradeOffer)",
  "completedDate": "Date",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### 📚 Tüm İlanları Getir
**Endpoint**: `GET /api/listings`
**Auth**: Token gerekmez

**Query Parameters**:
```
?category=roman&city=istanbul&condition=yeni&author=orhan&page=1&limit=10
```

**Response**: Sadece `status: 'active'` olan ilanlar

### 🏠 Kendi İlanlarım
**Endpoint**: `GET /api/listings/my`
**Auth**: JWT Token gerekli

**Response**: Kullanıcının tüm ilanları (tüm status'lar dahil)

### ➕ İlan Oluştur
**Endpoint**: `POST /api/listings`
**Auth**: JWT Token gerekli

**Request Body**:
```json
{
  "bookTitle": "Harry Potter ve Felsefe Taşı",
  "author": "J.K. Rowling",
  "isbn": "9789750718053",
  "category": "Fantastik",
  "condition": "çok_iyi",
  "images": [
    "http://localhost:3000/uploads/book1.jpg",
    "http://localhost:3000/uploads/book2.jpg"
  ],
  "description": "Çok temiz durumda, hiç kullanılmamış gibi",
  "publisher": "YKY",
  "publishedYear": 2001,
  "language": "Türkçe",
  "wantedCategories": ["Bilim Kurgu", "Fantastik"],
  "wantedAuthors": ["Isaac Asimov", "Frank Herbert"],
  "notes": "Sadece İstanbul içi takas",
  "location": {
    "city": "İstanbul",
    "district": "Kadıköy"
  },
  "shippingAvailable": true
}
```

### 📖 İlan Detayı
**Endpoint**: `GET /api/listings/:id`
**Auth**: Token gerekmez

**Özellik**: Her görüntülemede `viewCount` 1 artar

### ✏️ İlan Güncelle
**Endpoint**: `PUT /api/listings/:id`
**Auth**: JWT Token gerekli (sadece ilan sahibi)

**Kısıtlama**: Aktif teklif varsa güncelleme yapılamaz

### 🗑️ İlan Sil (Arşivle)
**Endpoint**: `DELETE /api/listings/:id`
**Auth**: JWT Token gerekli (sadece ilan sahibi)

**Kısıtlama**: Aktif teklif varsa silinmez

---

## 🤝 TradeOffer (Teklif) Sistemi

### 🎯 2-Aşamalı Teklif Sistemi

1. **Pending**: Teklif gönderildi, karşı taraf henüz görmedi
2. **Chat Accepted**: Karşı taraf chat'i kabul etti → Conversation oluştu
3. **Accepted**: Karşı taraf teklifi kabul etti → İlanlar arşivlendi
4. **Rejected**: Teklif reddedildi
5. **Cancelled**: Teklif gönderen iptal etti

### 📋 TradeOffer Modeli
```json
{
  "_id": "ObjectId",
  "fromUser": "ObjectId (ref: User)",
  "toUser": "ObjectId (ref: User)",
  "targetListing": "ObjectId (ref: Listing)",
  "bookTitle": "string (teklif edilen kitap)",
  "author": "string",
  "category": "string",
  "condition": "enum",
  "images": ["string array"],
  "description": "string",
  "status": "enum: ['pending', 'chat_accepted', 'accepted', 'rejected', 'cancelled']",
  "chatAcceptedDate": "Date",
  "responseDate": "Date",
  "completedDate": "Date",
  "conversation": "ObjectId (ref: Conversation)",
  "fromUserReviewed": "boolean (default: false)",
  "toUserReviewed": "boolean (default: false)",
  "bothReviewed": "boolean (default: false)",
  "createdAt": "Date"
}
```

### 📨 Aldığım Teklifler
**Endpoint**: `GET /api/offers/received`
**Auth**: JWT Token gerekli

### 📤 Gönderdiğim Teklifler
**Endpoint**: `GET /api/offers/sent`
**Auth**: JWT Token gerekli

### ➕ Teklif Gönder
**Endpoint**: `POST /api/offers`
**Auth**: JWT Token gerekli

**Request Body**:
```json
{
  "targetListing": "68364332f5486e2bb3ce296e",
  "bookTitle": "Dune",
  "author": "Frank Herbert",
  "category": "Bilim Kurgu",
  "condition": "iyi",
  "images": ["http://localhost:3000/uploads/dune.jpg"],
  "description": "Çok güzel durumda Dune kitabı"
}
```

**Kısıtlamalar**:
- Kendi ilanına teklif gönderilemez
- Aynı ilana daha önce reddedilen teklif varsa yeni teklif gönderilemez
- İlana aktif teklif varsa yeni teklif gönderilemez

### 💬 Chat Kabul Et (1. Aşama)
**Endpoint**: `PUT /api/offers/:id/accept-chat`
**Auth**: JWT Token gerekli (sadece teklif alan)

**Sonuç**: 
- Status: `pending` → `chat_accepted`
- Conversation oluşturulur
- Notification gönderilir

### ✅ Teklifi Kabul Et (2. Aşama)
**Endpoint**: `PUT /api/offers/:id/accept-offer`
**Auth**: JWT Token gerekli (sadece teklif alan)

**Sonuç**:
- Status: `chat_accepted` → `accepted`
- Her iki listing de `status: 'completed'` olur
- Conversation sonlandırılır
- Review zorunluluğu başlar

### ❌ Teklifi Reddet
**Endpoint**: `PUT /api/offers/:id/reject`
**Auth**: JWT Token gerekli (sadece teklif alan)

### 🚫 Teklifi İptal Et
**Endpoint**: `PUT /api/offers/:id/cancel`
**Auth**: JWT Token gerekli (sadece teklif gönderen)

---

## 💬 Mesajlaşma Sistemi

### 🔄 Socket.IO Entegrasyonu

**Frontend Bağlantı**:
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: localStorage.getItem('token')
  }
});

// Mesaj gönder
socket.emit('sendMessage', {
  conversationId: 'conversation_id',
  content: 'Merhaba!'
});

// Mesaj dinle
socket.on('newMessage', (message) => {
  console.log('Yeni mesaj:', message);
});

// Conversation'a katıl
socket.emit('joinConversation', 'conversation_id');
```

### 📋 Conversation Modeli
```json
{
  "_id": "ObjectId",
  "participants": ["ObjectId array (2 user)"],
  "tradeOffer": "ObjectId (ref: TradeOffer)",
  "isActive": "boolean (default: true)",
  "lastMessage": "ObjectId (ref: Message)",
  "lastMessageAt": "Date",
  "createdAt": "Date"
}
```

### 💌 Message Modeli
```json
{
  "_id": "ObjectId",
  "conversation": "ObjectId (ref: Conversation)",
  "sender": "ObjectId (ref: User)",
  "content": "string (max: 1000 karakter)",
  "isRead": "boolean (default: false)",
  "createdAt": "Date"
}
```

### 📨 Conversation'larım
**Endpoint**: `GET /api/conversations`
**Auth**: JWT Token gerekli

### 💬 Mesajları Getir
**Endpoint**: `GET /api/conversations/:id/messages`
**Auth**: JWT Token gerekli

### ✉️ Mesaj Gönder
**Endpoint**: `POST /api/conversations/:id/messages`
**Auth**: JWT Token gerekli

**Request Body**:
```json
{
  "content": "Merhaba! Kitap hala müsait mi?"
}
```

---

## ⭐ Review (Değerlendirme) Sistemi

### 📋 Review Modeli
```json
{
  "_id": "ObjectId",
  "tradeOffer": "ObjectId (ref: TradeOffer)",
  "reviewer": "ObjectId (ref: User)",
  "reviewee": "ObjectId (ref: User)",
  "rating": "number (1-5)",
  "comment": "string (max: 500 karakter)",
  "isRequired": "boolean (default: true)",
  "reminderCount": "number (default: 0)",
  "isVisible": "boolean (default: true)",
  "createdAt": "Date"
}
```

### 📝 Bekleyen Review'larım
**Endpoint**: `GET /api/reviews/pending`
**Auth**: JWT Token gerekli

### ⭐ Review Gönder
**Endpoint**: `POST /api/reviews`
**Auth**: JWT Token gerekli

**Request Body**:
```json
{
  "tradeOffer": "68364332f5486e2bb3ce296e",
  "reviewee": "68364332f5486e2bb3ce296e",
  "rating": 5,
  "comment": "Harika bir takas deneyimi! Kitap açıklandığı gibi mükemmel durumdaydı."
}
```

### 📊 Aldığım Review'lar
**Endpoint**: `GET /api/reviews/received/:userId`
**Auth**: Token gerekmez (public)

### 📝 Verdiğim Review'lar
**Endpoint**: `GET /api/reviews/given`
**Auth**: JWT Token gerekli

---

## 📁 Dosya Yükleme Sistemi

### 📸 Tek Resim Yükle
**Endpoint**: `POST /api/upload/single`
**Auth**: JWT Token gerekli
**Content-Type**: `multipart/form-data`

**Form Data**:
```
image: File (max: 5MB, sadece resim)
```

**Response**:
```json
{
  "message": "Dosya başarıyla yüklendi",
  "filename": "1732738620123-book.jpg",
  "url": "http://localhost:3000/uploads/1732738620123-book.jpg"
}
```

### 📸 Çoklu Resim Yükle
**Endpoint**: `POST /api/upload/multiple`
**Auth**: JWT Token gerekli

**Form Data**:
```
images: File[] (max: 5 dosya, her biri max 5MB)
```

### 🖼️ Resim Erişimi
**URL**: `http://localhost:3000/uploads/filename.jpg`
**Auth**: Token gerekmez (public)

---

## 🔔 Notification Sistemi

### 📋 Notification Modeli
```json
{
  "_id": "ObjectId",
  "user": "ObjectId (ref: User)",
  "type": "enum: ['new_offer', 'offer_chat_accepted', 'offer_accepted', 'offer_rejected', 'offer_cancelled', 'new_message', 'conversation_ended', 'review_required', 'review_received', 'listing_created']",
  "title": "string",
  "message": "string",
  "data": "Object (ek bilgiler)",
  "isRead": "boolean (default: false)",
  "priority": "enum: ['low', 'medium', 'high']",
  "createdAt": "Date"
}
```

### 🔔 Bildirimlerim
**Endpoint**: `GET /api/notifications`
**Auth**: JWT Token gerekli

**Query Parameters**:
```
?page=1&limit=20&unread=true
```

### 🔢 Okunmamış Sayısı
**Endpoint**: `GET /api/notifications/unread-count`
**Auth**: JWT Token gerekli

### ✅ Okundu İşaretle
**Endpoint**: `PUT /api/notifications/mark-read`
**Auth**: JWT Token gerekli

**Request Body**:
```json
{
  "notificationIds": ["id1", "id2", "id3"]
}
```

### ✅ Tümünü Okundu İşaretle
**Endpoint**: `PUT /api/notifications/mark-all-read`
**Auth**: JWT Token gerekli

---

## 🛡️ Güvenlik Sistemi

### 🔐 JWT Token Yönetimi
- Token süresi: 24 saat
- Header format: `Authorization: Bearer <token>`
- Token geçersizse: `401 Unauthorized`

### 🚫 Erişim Kontrolleri
- **Offer Privacy**: Sadece katılımcılar erişebilir
- **Conversation Privacy**: Sadece katılımcılar erişebilir
- **Profile Update**: Sadece kendi profili
- **Listing Update/Delete**: Sadece ilan sahibi

### 🔒 Validasyon Güvenliği
- Tüm input'lar sanitize edilir
- SQL injection koruması (MongoDB NoSQL injection)
- XSS koruması
- File upload güvenliği (sadece resim, boyut limiti)

---

## 🧪 Test Senaryoları ve Edge Cases

### ✅ Test Edilmiş Senaryolar

#### **Authentication Tests**:
```bash
# Kısa username
POST /api/users/register {"username": "ab"} 
→ "Kullanıcı adı en az 3 karakter olmalıdır"

# Geçersiz email
POST /api/users/register {"email": "invalid-email"}
→ "Geçerli bir e-posta adresi giriniz"

# Kısa şifre
POST /api/users/register {"password": "123"}
→ "Şifre en az 6 karakter olmalıdır"
```

#### **Profile Update Tests**:
```bash
# Zorunlu alanı boşaltma
PUT /api/users/profile {"firstName": ""}
→ "İsim en az 2 karakter olmalıdır"

# Geçersiz telefon
PUT /api/users/profile {"phone": "123"}
→ "Geçerli bir telefon numarası giriniz"
```

#### **Offer System Tests**:
```bash
# Kendi ilanına teklif
POST /api/offers {"targetListing": "own_listing_id"}
→ "Kendi ilanınıza teklif gönderemezsiniz"

# Reddedilen ilana tekrar teklif
POST /api/offers {"targetListing": "rejected_listing_id"}
→ "Bu ilana daha önce reddedilen teklifiniz var"

# Aktif teklif varken yeni teklif
POST /api/offers {"targetListing": "active_offer_listing_id"}
→ "Bu ilana aktif bir teklif var, lütfen daha sonra tekrar deneyin"
```

#### **2-Stage Offer Flow Test**:
1. ✅ User A creates listing
2. ✅ User B sends offer → Status: `pending`
3. ✅ User A accepts chat → Status: `chat_accepted`, Conversation created
4. ✅ User A accepts offer → Status: `accepted`, Listings archived
5. ✅ Both users must review each other

#### **Review System Tests**:
```bash
# Zorunlu review kontrolü
GET /api/reviews/pending
→ Tamamlanan takaslar için bekleyen review'lar

# Review sonrası rating güncelleme
POST /api/reviews
→ User rating otomatik hesaplanır
```

### 🚨 Kritik Edge Cases

#### **Single Active Offer Rule**:
- Bir ilana aynı anda sadece 1 aktif teklif olabilir
- Aktif teklif varken yeni teklif "daha sonra dene" mesajı alır
- Bu rejected sayılmaz, kullanıcı daha sonra tekrar deneyebilir

#### **Update/Delete Restrictions**:
- Aktif teklif varsa listing güncellenemez/silinemez
- Offer immutable (gönderdikten sonra değiştirilemez)
- Sadece arşivleme yapılır, gerçek delete yok

#### **Conversation Lifecycle**:
- Chat sadece offer chat_accepted olunca oluşur
- Offer accepted/rejected olunca conversation sonlanır
- Sonlanan conversation'da yeni mesaj gönderilemez

---

## 🎨 Frontend Entegrasyon Önerileri

### 📱 Sayfa Yapısı Önerisi

```
/
├── /auth
│   ├── /login
│   └── /register
├── /listings
│   ├── / (tüm ilanlar)
│   ├── /my (kendi ilanlarım)
│   ├── /create (yeni ilan)
│   └── /:id (ilan detayı)
├── /offers
│   ├── /received (aldığım teklifler)
│   └── /sent (gönderdiğim teklifler)
├── /messages
│   ├── / (conversation listesi)
│   └── /:id (mesaj detayı)
├── /profile
│   ├── /me (kendi profilim)
│   ├── /edit (profil düzenle)
│   └── /:userId (başkasının profili)
├── /reviews
│   ├── /pending (bekleyen review'lar)
│   └── /given (verdiğim review'lar)
└── /notifications
```

### 🔄 State Management Önerisi

```javascript
// Global State Structure
{
  auth: {
    token: string,
    user: User,
    isAuthenticated: boolean
  },
  listings: {
    all: Listing[],
    my: Listing[],
    current: Listing,
    loading: boolean
  },
  offers: {
    received: TradeOffer[],
    sent: TradeOffer[],
    loading: boolean
  },
  conversations: {
    list: Conversation[],
    current: Conversation,
    messages: Message[],
    loading: boolean
  },
  notifications: {
    list: Notification[],
    unreadCount: number,
    loading: boolean
  },
  reviews: {
    pending: Review[],
    given: Review[],
    loading: boolean
  }
}
```

### 🎯 Kritik Frontend Akışları

#### **Teklif Gönderme Akışı**:
1. Listing detayında "Teklif Gönder" butonu
2. Modal/sayfa açılır → Kitap bilgileri formu
3. Resim yükleme (multiple upload)
4. Form validasyonu
5. API call → Success/Error handling
6. Başarılıysa offers/sent sayfasına yönlendir

#### **Teklif Kabul Akışı**:
1. Received offers listesinde "Chat Kabul Et" butonu
2. API call → Conversation oluşur
3. "Teklifi Kabul Et" butonu aktif olur
4. Kabul edilirse → Review sayfasına yönlendir

#### **Mesajlaşma Akışı**:
1. Socket.IO bağlantısı kur
2. Conversation'a join ol
3. Real-time mesaj dinle
4. Mesaj gönder
5. Conversation sonlandığında UI'ı güncelle

#### **Review Akışı**:
1. Pending reviews listesi
2. Review formu (rating + comment)
3. Submit → Success feedback
4. Profile rating'i güncelle

### 🎨 UI/UX Önerileri

#### **Listing Card**:
```jsx
<ListingCard>
  <Image src={listing.images[0]} />
  <Title>{listing.bookTitle}</Title>
  <Author>by {listing.author}</Author>
  <Condition>{listing.condition}</Condition>
  <Location>{listing.location.city}</Location>
  <ViewCount>{listing.viewCount} görüntülenme</ViewCount>
  <OfferButton>Teklif Gönder</OfferButton>
</ListingCard>
```

#### **Offer Status Badges**:
```jsx
const statusColors = {
  pending: 'yellow',
  chat_accepted: 'blue', 
  accepted: 'green',
  rejected: 'red',
  cancelled: 'gray'
};
```

#### **Real-time Indicators**:
- Yeni mesaj badge'i
- Online/offline status
- Typing indicator
- Unread notification count

### 📊 Analytics ve Monitoring

#### **Tracking Events**:
- Listing views
- Offer sends/accepts
- Message sends
- Review submissions
- User registrations

#### **Error Handling**:
```javascript
// API Error Handler
const handleApiError = (error) => {
  if (error.status === 401) {
    // Token expired → Logout
    logout();
    redirect('/login');
  } else if (error.status === 403) {
    // Forbidden → Show error
    showError('Bu işlem için yetkiniz yok');
  } else {
    // Generic error
    showError(error.message || 'Bir hata oluştu');
  }
};
```

---

## 🚀 Deployment Notları

### 🌍 Environment Variables
```env
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/bookswap
JWT_SECRET=your-super-secret-key
PORT=3000
```

### 📁 Static Files
- Upload klasörü production'da persistent olmalı
- CDN kullanımı önerilir
- Image optimization yapılmalı

### 🔒 Production Security
- CORS ayarları
- Rate limiting
- Helmet.js güvenlik headers
- MongoDB connection security

---

## 📞 Test Kullanıcıları

Geliştirme sırasında kullanabileceğiniz test kullanıcıları:

```json
{
  "alice": {
    "email": "alice@test.com",
    "password": "123456",
    "id": "683626ebb9aead212f5fdf64"
  },
  "bob": {
    "email": "bob@test.com", 
    "password": "123456",
    "id": "68362723b9aead212f5fdf67"
  },
  "charlie": {
    "email": "charlie@test.com",
    "password": "123456",
    "id": "68362723b9aead212f5fdf68"
  }
}
```

Bu kullanıcılar arasında örnek takaslar, mesajlar ve review'lar mevcut.

---

## 🎯 Sonuç

Bu rehber, Book-Swap platformunun frontend entegrasyonu için gereken tüm bilgileri içermektedir. Sistem tamamen test edilmiş ve production-ready durumdadır. 

**Kritik Noktalar**:
- 2-aşamalı teklif sistemi
- Zorunlu review sistemi  
- Real-time mesajlaşma
- Kapsamlı validasyonlar
- Güvenlik kontrolleri

Frontend geliştirme sırasında bu dökümantasyonu referans alarak, robust ve kullanıcı dostu bir arayüz geliştirebilirsiniz. 