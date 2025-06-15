# 🚀 API Endpoints Hızlı Referans

## 🔐 Authentication
| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| POST | `/api/users/register` | ❌ | Kullanıcı kaydı |
| POST | `/api/users/login` | ❌ | Giriş yap |

## 👤 User Profile
| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| GET | `/api/users/profile` | ✅ | Kendi profilim |
| GET | `/api/users/profile/:userId` | ❌ | Public profil (review'larla) |
| PUT | `/api/users/profile` | ✅ | Profil güncelle |
| PUT | `/api/users/profile/avatar` | ✅ | Avatar güncelle |
| PUT | `/api/users/profile/location` | ✅ | Konum güncelle |

## 📖 Listings
| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| GET | `/api/listings` | ❌ | Tüm aktif ilanlar |
| GET | `/api/listings/my` | ✅ | Kendi ilanlarım |
| POST | `/api/listings` | ✅ | Yeni ilan oluştur |
| GET | `/api/listings/:id` | ❌ | İlan detayı |
| PUT | `/api/listings/:id` | ✅ | İlan güncelle |
| DELETE | `/api/listings/:id` | ✅ | İlan sil (arşivle) |

## 🤝 Trade Offers
| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| GET | `/api/offers/received` | ✅ | Aldığım teklifler |
| GET | `/api/offers/sent` | ✅ | Gönderdiğim teklifler |
| POST | `/api/offers` | ✅ | Teklif gönder |
| GET | `/api/offers/:id` | ✅ | Teklif detayı |
| PUT | `/api/offers/:id/accept-chat` | ✅ | Chat kabul et (1. aşama) |
| PUT | `/api/offers/:id/accept-offer` | ✅ | Teklifi kabul et (2. aşama) |
| PUT | `/api/offers/:id/reject` | ✅ | Teklifi reddet |
| PUT | `/api/offers/:id/cancel` | ✅ | Teklifi iptal et |

## 💬 Conversations & Messages
| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| GET | `/api/conversations` | ✅ | Conversation'larım |
| GET | `/api/conversations/:id/messages` | ✅ | Mesajları getir |
| POST | `/api/conversations/:id/messages` | ✅ | Mesaj gönder |

## ⭐ Reviews
| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| GET | `/api/reviews/pending` | ✅ | Bekleyen review'larım |
| POST | `/api/reviews` | ✅ | Review gönder |
| GET | `/api/reviews/received/:userId` | ❌ | Kullanıcının aldığı review'lar |
| GET | `/api/reviews/given` | ✅ | Verdiğim review'lar |

## 📁 File Upload
| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| POST | `/api/upload/single` | ✅ | Tek resim yükle |
| POST | `/api/upload/multiple` | ✅ | Çoklu resim yükle |
| GET | `/uploads/:filename` | ❌ | Resim erişimi |

## 🔔 Notifications
| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| GET | `/api/notifications` | ✅ | Bildirimlerim |
| GET | `/api/notifications/unread-count` | ✅ | Okunmamış sayısı |
| PUT | `/api/notifications/mark-read` | ✅ | Okundu işaretle |
| PUT | `/api/notifications/mark-all-read` | ✅ | Tümünü okundu işaretle |

---

## 🎯 Status Codes

| Code | Açıklama |
|------|----------|
| 200 | Başarılı |
| 201 | Oluşturuldu |
| 400 | Geçersiz istek / Validasyon hatası |
| 401 | Yetkisiz (Token gerekli/geçersiz) |
| 403 | Yasak (Erişim yok) |
| 404 | Bulunamadı |
| 500 | Sunucu hatası |

---

## 🔑 Auth Header Format
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📊 Query Parameters

### Listings
```
GET /api/listings?category=roman&city=istanbul&condition=yeni&author=orhan&page=1&limit=10
```

### Notifications  
```
GET /api/notifications?page=1&limit=20&unread=true
```

---

## 🎨 Response Formats

### Success Response
```json
{
  "message": "İşlem başarılı",
  "data": { ... }
}
```

### Error Response
```json
{
  "message": "Hata açıklaması"
}
```

### Paginated Response
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
``` 