# 🎯 Frontend Sayfa Akışları ve Test Senaryoları Rehberi

## 📋 İçindekiler
1. [Authentication Sayfaları](#authentication-sayfaları)
2. [Ana Sayfa ve Listing Sayfaları](#ana-sayfa-ve-listing-sayfaları)
3. [Teklif Sistemi Sayfaları](#teklif-sistemi-sayfaları)
4. [Mesajlaşma Sayfaları](#mesajlaşma-sayfaları)
5. [Profil Sayfaları](#profil-sayfaları)
6. [Review Sayfaları](#review-sayfaları)
7. [Bildirim Sayfaları](#bildirim-sayfaları)
8. [Kritik Akışlar ve Test Senaryoları](#kritik-akışlar-ve-test-senaryoları)

---

## 🔐 Authentication Sayfaları

### 📝 Kayıt Sayfası (`/auth/register`)

#### **Sayfa İçeriği:**
- Username input (min 3 karakter)
- Email input (email formatı)
- Password input (min 6 karakter)
- FirstName input (min 2 karakter)
- LastName input (min 2 karakter)
- City input (min 2 karakter)
- "Kayıt Ol" butonu
- "Zaten hesabın var mı? Giriş yap" linki

#### **Yapılabilecek İşlemler:**
✅ **İzin Verilen:**
- Form doldurma
- Validasyon kontrolü (real-time)
- Kayıt işlemi
- Login sayfasına geçiş

❌ **İzin Verilmeyen:**
- Boş form gönderme
- Geçersiz email formatı
- Kısa username/password/firstName/lastName/city
- Duplicate email/username

#### **Test Senaryoları:**

**✅ Başarılı Senaryolar:**
```javascript
// Geçerli kayıt
{
  username: "testuser123",
  email: "test@example.com", 
  password: "123456",
  firstName: "Test",
  lastName: "User",
  city: "İstanbul"
}
→ Başarı mesajı → Login sayfasına yönlendir
```

**❌ Hata Senaryoları:**
```javascript
// Kısa username
{username: "ab"} → "Kullanıcı adı en az 3 karakter olmalıdır"

// Geçersiz email
{email: "invalid-email"} → "Geçerli bir e-posta adresi giriniz"

// Kısa şifre
{password: "123"} → "Şifre en az 6 karakter olmalıdır"

// Kısa isim
{firstName: "A"} → "İsim en az 2 karakter olmalıdır"

// Kısa soyisim
{lastName: "B"} → "Soyisim en az 2 karakter olmalıdır"

// Kısa şehir
{city: "İ"} → "Şehir en az 2 karakter olmalıdır"

// Duplicate email
{email: "alice@test.com"} → "Bu e-posta zaten kullanılıyor"

// Duplicate username
{username: "alice"} → "Bu kullanıcı adı zaten kullanılıyor"
```

#### **UI Davranışları:**
- Real-time validasyon (input blur'da)
- Loading state (kayıt sırasında)
- Error messages (input altında)
- Success message (kayıt sonrası)

---

### 🔑 Giriş Sayfası (`/auth/login`)

#### **Sayfa İçeriği:**
- Email input
- Password input
- "Giriş Yap" butonu
- "Hesabın yok mu? Kayıt ol" linki

#### **Yapılabilecek İşlemler:**
✅ **İzin Verilen:**
- Form doldurma
- Giriş işlemi
- Register sayfasına geçiş

❌ **İzin Verilmeyen:**
- Boş form gönderme
- Geçersiz credentials

#### **Test Senaryoları:**

**✅ Başarılı Giriş:**
```javascript
{
  email: "alice@test.com",
  password: "123456"
}
→ Token alınır → localStorage'a kaydedilir → Ana sayfaya yönlendir
```

**❌ Hata Senaryoları:**
```javascript
// Yanlış şifre
{email: "alice@test.com", password: "wrong"} 
→ "E-posta veya şifre yanlış"

// Olmayan kullanıcı
{email: "notexist@test.com", password: "123456"}
→ "E-posta veya şifre yanlış"
```

#### **Giriş Sonrası Akış:**
1. Token localStorage'a kaydedilir
2. User bilgileri state'e kaydedilir
3. Socket.IO bağlantısı kurulur
4. Ana sayfaya yönlendirilir

---

## 📚 Ana Sayfa ve Listing Sayfaları

### 🏠 Ana Sayfa (`/`)

#### **Sayfa İçeriği:**
- Arama/filtreleme bölümü
- Aktif ilanlar listesi (grid/list view)
- Pagination
- Kategori filtreleri
- Şehir filtreleri

#### **Yapılabilecek İşlemler:**
✅ **İzin Verilen (Herkese):**
- İlanları görüntüleme
- Filtreleme/arama
- İlan detayına gitme
- Pagination

✅ **İzin Verilen (Giriş Yapmış):**
- Teklif gönderme
- İlan favorileme
- Kendi ilanını oluşturma

❌ **İzin Verilmeyen:**
- Kendi ilanına teklif gönderme
- Inactive ilanları görme

#### **Filtreleme Özellikleri:**
```javascript
// Query parameters
{
  category: "Roman",
  city: "İstanbul", 
  condition: "yeni",
  author: "Orhan",
  page: 1,
  limit: 12
}
```

#### **Test Senaryoları:**

**✅ Filtreleme Testleri:**
- Kategori seçimi → Sadece o kategorideki kitaplar
- Şehir seçimi → Sadece o şehirdeki ilanlar
- Durum seçimi → Sadece o durumdaki kitaplar
- Yazar arama → İsim içeren kitaplar

**✅ Pagination Testleri:**
- Sayfa değiştirme → URL güncellenir
- Limit değiştirme → Sayfa başına ilan sayısı

---

### 📖 İlan Detay Sayfası (`/listings/:id`)

#### **Sayfa İçeriği:**
- Kitap bilgileri (başlık, yazar, kategori, durum)
- Resim galerisi
- Açıklama
- İlan sahibi bilgileri
- Konum bilgisi
- "Teklif Gönder" butonu (giriş yapmış kullanıcılar için)
- Görüntülenme sayısı

#### **Yapılabilecek İşlemler:**
✅ **İzin Verilen (Herkese):**
- İlan detaylarını görme
- Resim galerisini görme
- İlan sahibinin public profiline gitme

✅ **İzin Verilen (Giriş Yapmış):**
- Teklif gönderme (modal açılır)
- İlanı favorileme

✅ **İzin Verilen (İlan Sahibi):**
- İlanı düzenleme
- İlanı arşivleme

❌ **İzin Verilmeyen:**
- Kendi ilanına teklif gönderme
- Başkasının ilanını düzenleme/arşivleme
- Inactive ilana teklif gönderme

#### **Test Senaryoları:**

**✅ Görüntüleme Testleri:**
- İlan açılır → viewCount +1 artar
- Resim galerisi → Tüm resimler görüntülenir
- İlan sahibi linki → Public profile açılır

**✅ Teklif Gönderme Testleri:**
```javascript
// Başarılı teklif
Giriş yapmış kullanıcı + Başkasının ilanı + Aktif ilan
→ Teklif modal'ı açılır

// Başarısız teklif
Kendi ilanı → "Kendi ilanınıza teklif gönderemezsiniz"
Giriş yapmamış → Login sayfasına yönlendir
```

**✅ İlan Sahibi Testleri:**
```javascript
// Kendi ilanında
"Düzenle" ve "Arşivle" butonları görünür

// Aktif teklif varsa
"Bu ilana aktif teklif var, düzenleyemezsiniz" mesajı
Düzenle/Arşivle butonları disabled
```

---

### 🏠 Kendi İlanlarım (`/listings/my`)

#### **Sayfa İçeriği:**
- Kullanıcının tüm ilanları (tüm status'lar)
- Status badge'leri (active, pending, completed, removed)
- Her ilan için aksiyon butonları
- İstatistikler (toplam görüntülenme, teklif sayısı)

#### **Yapılabilecek İşlemler:**
✅ **İzin Verilen:**
- Tüm ilanları görme (status'a göre filtreleme)
- Aktif ilanları düzenleme/arşivleme
- İlan detayına gitme
- Yeni ilan oluşturma

❌ **İzin Verilmeyen:**
- Aktif teklifi olan ilanı düzenleme/arşivleme
- Completed/removed ilanları düzenleme

#### **Status Açıklamaları:**
- **Active**: İlan aktif, teklif alabilir
- **Pending**: İlana aktif teklif var
- **Completed**: Takas tamamlandı
- **Removed**: İlan arşivlendi

#### **Arşivleme Sistemi:**
```javascript
// Arşivleme Kuralları
- Sadece "active" status'taki ilanlar arşivlenebilir
- Aktif teklifi olan ilanlar arşivlenemez
- Arşivlenen ilan status'u "removed" olur
- Arşivlenen ilanlar ana sayfada görünmez
- Kullanıcı kendi arşivlenen ilanlarını "İlanlarım" sayfasında görebilir
- Arşivleme işlemi geri alınamaz (kalıcı)
```

#### **Test Senaryoları:**

**✅ İlan Yönetimi Testleri:**
```javascript
// Aktif ilan
Status: "active" → Düzenle/Arşivle butonları aktif

// Aktif teklifi olan ilan  
Status: "pending" → Düzenle/Arşivle butonları disabled
"Bu ilana aktif teklif var" uyarısı

// Tamamlanmış ilan
Status: "completed" → Sadece görüntüleme
"Takas tamamlandı" badge'i

// Arşivlenmiş ilan
Status: "removed" → Sadece görüntüleme
"Arşivlendi" badge'i
```

**✅ Arşivleme Testleri:**
```javascript
// Başarılı arşivleme
Active ilan + Teklif yok → Arşivleme başarılı
❌ Aktif ilan + Pending teklif → "Aktif teklif var" hatası
❌ Aktif ilan + Chat_accepted teklif → "Aktif teklif var" hatası
✅ Completed ilan → Zaten arşivlenmiş, buton görünmez
✅ Removed ilan → Zaten arşivlenmiş, buton görünmez
```

---

### ➕ Yeni İlan Oluştur (`/listings/create`)

#### **Sayfa İçeriği:**
- Kitap bilgileri formu (başlık, yazar, kategori, durum)
- Resim yükleme (max 5 resim)
- Açıklama alanı
- Yayıncı, yıl, dil bilgileri
- İstenen kategoriler/yazarlar
- Konum bilgisi
- Kargo seçeneği
- "İlanı Yayınla" butonu

#### **Yapılabilecek İşlemler:**
✅ **İzin Verilen:**
- Form doldurma
- Resim yükleme (drag&drop veya browse)
- Preview görme
- İlan oluşturma

❌ **İzin Verilmeyen:**
- Zorunlu alanları boş bırakma
- 5'ten fazla resim yükleme
- Geçersiz resim formatı

#### **Validasyon Kuralları:**
```javascript
// Zorunlu alanlar
bookTitle: "min 2 karakter",
author: "min 2 karakter", 
category: "seçilmeli",
condition: "seçilmeli",
city: "seçilmeli"

// Opsiyonel alanlar
description: "max 1000 karakter",
isbn: "geçerli format",
publishedYear: "1900-2024 arası"
```

#### **Test Senaryoları:**

**✅ Form Validasyon Testleri:**
```javascript
// Eksik zorunlu alan
{bookTitle: ""} → "Kitap başlığı gereklidir"

// Geçersiz yıl
{publishedYear: 2030} → "Geçerli bir yıl giriniz"

// Çok uzun açıklama
{description: "1000+ karakter"} → "Açıklama çok uzun"
```

**✅ Resim Yükleme Testleri:**
```javascript
// Başarılı yükleme
5MB altı JPG/PNG → Upload başarılı

// Başarısız yükleme  
5MB üstü dosya → "Dosya çok büyük"
PDF dosyası → "Sadece resim dosyaları"
6. resim → "Maksimum 5 resim"
```

**✅ İlan Oluşturma Testleri:**
```javascript
// Başarılı oluşturma
Tüm zorunlu alanlar dolu → İlan oluşturulur → "İlanlarım" sayfasına yönlendir

// Başarısız oluşturma
Eksik alan → Form hatası göster
```

---

## 🤝 Teklif Sistemi Sayfaları

### 📨 Aldığım Teklifler (`/offers/received`)

#### **Sayfa İçeriği:**
- Gelen teklifler listesi
- Her teklif için: teklif eden kullanıcı, kitap bilgileri, durum
- Status badge'leri (pending, chat_accepted, accepted, rejected)
- Aksiyon butonları (Chat Kabul Et, Teklifi Kabul Et, Reddet)

#### **Yapılabilecek İşlemler:**
✅ **İzin Verilen:**
- Teklifleri görüntüleme
- Chat kabul etme (1. aşama)
- Teklif kabul etme (2. aşama)
- Teklif reddetme
- Teklif detayına gitme

❌ **İzin Verilmeyen:**
- Başkasının tekliflerini görme
- Zaten işlem yapılmış teklifleri değiştirme

#### **2-Aşamalı Teklif Akışı:**

**1. Aşama - Chat Kabul:**
```javascript
Status: "pending" 
→ "Chat Kabul Et" butonu görünür
→ Tıklanınca: Conversation oluşur, status "chat_accepted" olur
```

**2. Aşama - Teklif Kabul:**
```javascript
Status: "chat_accepted"
→ "Teklifi Kabul Et" butonu görünür  
→ Tıklanınca: İlanlar otomatik arşivlenir, review zorunluluğu başlar
```

#### **Test Senaryoları:**

**✅ Teklif Akış Testleri:**
```javascript
// Pending teklif
Status: "pending" → Sadece "Chat Kabul Et" ve "Reddet" butonları

// Chat kabul edilmiş
Status: "chat_accepted" → "Teklifi Kabul Et", "Reddet" ve "Mesajlaş" butonları

// Kabul edilmiş
Status: "accepted" → Sadece "Mesajları Gör" ve "Review Ver" butonları

// Reddedilmiş
Status: "rejected" → Sadece görüntüleme
```

**✅ Chat Kabul Testleri:**
```javascript
// Başarılı chat kabul
Pending teklif + "Chat Kabul Et" 
→ Conversation oluşur
→ Notification gönderilir
→ Status "chat_accepted" olur
```

**✅ Teklif Kabul Testleri:**
```javascript
// Başarılı teklif kabul
Chat_accepted teklif + "Teklifi Kabul Et"
→ Her iki listing otomatik "completed" olur (arşivlenir)
→ Conversation sonlanır  
→ Review zorunluluğu başlar
→ Notification gönderilir
```

---

### 📤 Gönderdiğim Teklifler (`/offers/sent`)

#### **Sayfa İçeriği:**
- Gönderilen teklifler listesi
- Hedef ilan bilgileri
- Teklif edilen kitap bilgileri
- Status takibi
- İptal butonu (pending teklifler için)

#### **Yapılabilecek İşlemler:**
✅ **İzin Verilen:**
- Teklifleri görüntüleme
- Pending teklifleri iptal etme
- Teklif detayına gitme
- Mesajlaşma (chat kabul edildiyse)

❌ **İzin Verilmeyen:**
- Kabul edilmiş/reddedilmiş teklifleri iptal etme
- Teklif içeriğini değiştirme

#### **Test Senaryoları:**

**✅ Teklif Takip Testleri:**
```javascript
// Pending teklif
Status: "pending" → "İptal Et" butonu + "Bekliyor" badge'i

// Chat kabul edilmiş  
Status: "chat_accepted" → "Mesajlaş" butonu + "Chat Kabul Edildi" badge'i

// Kabul edilmiş
Status: "accepted" → "Tamamlandı" badge'i + "Review Ver" butonu

// Reddedilmiş
Status: "rejected" → "Reddedildi" badge'i
```

**✅ İptal Testleri:**
```javascript
// Başarılı iptal
Pending teklif + "İptal Et" 
→ Confirmation modal
→ Status "cancelled" olur
→ Notification gönderilir
```

---

### 💬 Teklif Gönderme Modal

#### **Modal İçeriği:**
- Hedef ilan bilgileri (readonly)
- Teklif edilecek kitap formu
- Resim yükleme
- Açıklama alanı
- "Teklif Gönder" butonu

#### **Yapılabilecek İşlemler:**
✅ **İzin Verilen:**
- Form doldurma
- Resim yükleme
- Teklif gönderme

❌ **İzin Verilmeyen:**
- Kendi ilanına teklif gönderme
- Reddedilen ilana tekrar teklif
- Aktif teklifi olan ilana teklif

#### **Test Senaryoları:**

**✅ Teklif Gönderme Testleri:**
```javascript
// Başarılı teklif
Başkasının aktif ilanı + Dolu form
→ Teklif oluşturulur
→ Notification gönderilir
→ Modal kapanır
```

**❌ Hata Testleri:**
```javascript
// Kendi ilanına teklif
Own listing → "Kendi ilanınıza teklif gönderemezsiniz"

// Reddedilen ilana teklif
Previously rejected → "Bu ilana daha önce reddedilen teklifiniz var"

// Aktif teklifi olan ilana
Active offer exists → "Bu ilana aktif bir teklif var, lütfen daha sonra tekrar deneyin"
```

---

## 💬 Mesajlaşma Sayfaları

### 📨 Conversation Listesi (`/messages`)

#### **Sayfa İçeriği:**
- Aktif conversation'lar listesi
- Her conversation için: karşı taraf bilgileri, son mesaj, tarih
- Okunmamış mesaj sayısı
- Online/offline durumu

#### **Yapılabilecek İşlemler:**
✅ **İzin Verilen:**
- Conversation'ları görüntüleme
- Conversation'a girme
- Arama/filtreleme

❌ **İzin Verilmeyen:**
- Başkasının conversation'larını görme
- Manuel conversation oluşturma

#### **Test Senaryoları:**

**✅ Conversation Listesi Testleri:**
```javascript
// Aktif conversation
isActive: true → Conversation listede görünür

// Sonlanmış conversation  
isActive: false → "Conversation sonlandı" badge'i

// Okunmamış mesaj
Unread messages → Badge ile sayı göster
```

---

### 💬 Chat Sayfası (`/messages/:conversationId`)

#### **Sayfa İçeriği:**
- Mesaj geçmişi
- Mesaj gönderme alanı
- Karşı taraf bilgileri
- Conversation durumu
- Teklif bilgileri (sidebar)

#### **Yapılabilecek İşlemler:**
✅ **İzin Verilen (Aktif Conversation):**
- Mesaj gönderme
- Mesaj geçmişini görme
- Real-time mesaj alma

✅ **İzin Verilen (Sonlanmış Conversation):**
- Mesaj geçmişini görme

❌ **İzin Verilmeyen:**
- Sonlanmış conversation'da mesaj gönderme
- Başkasının conversation'ına erişim
- 1000 karakterden uzun mesaj

#### **Test Senaryoları:**

**✅ Mesajlaşma Testleri:**
```javascript
// Aktif conversation
isActive: true → Mesaj gönderme alanı aktif

// Sonlanmış conversation
isActive: false → "Bu conversation sonlandı" mesajı
Mesaj gönderme alanı disabled
```

**✅ Real-time Testleri:**
```javascript
// Mesaj gönderme
Socket.emit('sendMessage') → Karşı tarafa anlık iletim

// Mesaj alma
Socket.on('newMessage') → UI'da anlık görünüm

// Conversation sonlanması
Socket.on('conversationEnded') → UI güncellenir
```

---

## 👤 Profil Sayfaları

### 🔒 Kendi Profilim (`/profile/me`)

#### **Sayfa İçeriği:**
- Profil bilgileri (tam detay)
- İstatistikler (toplam takas, rating, etc.)
- Kişisel bilgiler (email, telefon)
- Preferences ayarları
- "Profili Düzenle" butonu

#### **Yapılabilecek İşlemler:**
✅ **İzin Verilen:**
- Tüm bilgileri görme
- Profil düzenleme sayfasına gitme
- Preferences değiştirme

❌ **İzin Verilmeyen:**
- Başkasının private profilini görme

#### **Test Senaryoları:**

**✅ Profil Görüntüleme Testleri:**
```javascript
// Kendi profili
Own profile → Tüm bilgiler görünür (email, telefon, preferences)

// İstatistikler
Rating, totalTrades, successfulTrades → Doğru hesaplanmış değerler
```

---

### ✏️ Profil Düzenleme (`/profile/edit`)

#### **Sayfa İçeriği:**
- Profil bilgileri formu
- Avatar yükleme
- Konum bilgileri
- Kişisel bilgiler
- "Kaydet" butonu

#### **Yapılabilecek İşlemler:**
✅ **İzin Verilen:**
- Profil bilgilerini güncelleme
- Avatar değiştirme
- Konum güncelleme

❌ **İzin Verilmeyen:**
- Zorunlu alanları boşaltma
- Geçersiz format girme

#### **Test Senaryoları:**

**✅ Profil Güncelleme Testleri:**
```javascript
// Başarılı güncelleme
Valid data → Profil güncellenir → Success mesajı

// Validasyon hataları
{firstName: ""} → "İsim en az 2 karakter olmalıdır"
{phone: "123"} → "Geçerli bir telefon numarası giriniz"
```

---

### 🌐 Public Profil (`/profile/:userId`)

#### **Sayfa İçeriği:**
- Public profil bilgileri
- Rating ve istatistikler
- Alınan review'lar
- Aktif ilanlar

#### **Yapılabilecek İşlemler:**
✅ **İzin Verilen (Herkese):**
- Public bilgileri görme
- Review'ları okuma
- Aktif ilanları görme

❌ **İzin Verilmeyen:**
- Private bilgileri görme (email, telefon)
- Profili düzenleme

#### **Test Senaryoları:**

**✅ Public Profil Testleri:**
```javascript
// Public bilgiler
username, avatar, bio, location.city, rating → Görünür

// Private bilgiler  
email, phone, preferences → Görünmez

// Review'lar
isVisible: true olan review'lar → Reviewer bilgileriyle birlikte
```

---

## ⭐ Review Sayfaları

### 📝 Bekleyen Review'lar (`/reviews/pending`)

#### **Sayfa İçeriği:**
- Bekleyen review'lar listesi
- Her review için: takas bilgileri, karşı taraf
- Review formu (rating + comment)
- "Review Gönder" butonu

#### **Yapılabilecek İşlemler:**
✅ **İzin Verilen:**
- Bekleyen review'ları görme
- Review gönderme
- Takas detaylarını görme

❌ **İzin Verilmeyen:**
- Zaten verilen review'ı tekrar verme
- Başkasının review'ını verme

#### **Test Senaryoları:**

**✅ Review Gönderme Testleri:**
```javascript
// Başarılı review
{rating: 5, comment: "Harika takas"} 
→ Review kaydedilir
→ User rating güncellenir
→ Notification gönderilir
```

**✅ Zorunlu Review Testleri:**
```javascript
// Tamamlanan takas
Accepted offer → Pending review oluşur
Both users → Review vermek zorunda
```

---

### 📊 Verdiğim Review'lar (`/reviews/given`)

#### **Sayfa İçeriği:**
- Verilen review'lar listesi
- Review detayları
- Takas bilgileri

#### **Yapılabilecek İşlemler:**
✅ **İzin Verilen:**
- Verilen review'ları görme
- Review detaylarını görme

❌ **İzin Verilmeyen:**
- Review'ları düzenleme/arşivleme

---

## 🔔 Bildirim Sayfaları

### 🔔 Bildirimler (`/notifications`)

#### **Sayfa İçeriği:**
- Bildirim listesi (pagination)
- Bildirim türlerine göre filtreleme
- Okundu/okunmadı durumu
- "Tümünü Okundu İşaretle" butonu

#### **Yapılabilecek İşlemler:**
✅ **İzin Verilen:**
- Bildirimleri görme
- Okundu işaretleme
- Filtreleme
- İlgili sayfaya gitme (notification tıklama)

❌ **İzin Verilmeyen:**
- Başkasının bildirimlerini görme
- Bildirimleri arşivleme

#### **Test Senaryoları:**

**✅ Bildirim Testleri:**
```javascript
// Yeni bildirim
Real-time notification → UI'da anlık görünüm

// Bildirim tıklama
Notification click → İlgili sayfaya yönlendir

// Okundu işaretleme
Mark as read → Badge güncellenir
```

---

## 🎯 Kritik Akışlar ve Test Senaryoları

### 🔄 Tam Takas Akışı

#### **Akış Adımları:**
1. **Alice** Harry Potter ilanı oluşturur
2. **Bob** Alice'in ilanını görür, teklif gönderir
3. **Alice** teklifi görür, chat'i kabul eder
4. **Conversation** oluşur, mesajlaşma başlar
5. **Alice** teklifi kabul eder
6. **İlanlar** otomatik arşivlenir, conversation sonlanır
7. **Her iki kullanıcı** review vermek zorunda
8. **Review'lar** verilir, rating'ler güncellenir

#### **Test Senaryosu:**
```javascript
// 1. İlan Oluşturma
Alice → /listings/create → Harry Potter ilanı
Status: "active"

// 2. Teklif Gönderme  
Bob → /listings/:id → "Teklif Gönder" → Dune teklifi
Offer Status: "pending"

// 3. Chat Kabul
Alice → /offers/received → "Chat Kabul Et"
Offer Status: "chat_accepted"
Conversation oluşur

// 4. Mesajlaşma
Alice & Bob → /messages/:conversationId → Mesajlaşma
Real-time messaging

// 5. Teklif Kabul
Alice → /offers/received → "Teklifi Kabul Et"
Offer Status: "accepted"
Listings Status: "completed" (otomatik arşivlenir)
Conversation isActive: false

// 6. Review Verme
Alice & Bob → /reviews/pending → Review formu
Both users → Review gönder
Ratings güncellenir
```

---

### 🗂️ Arşivleme Sistemi Edge Case'leri

#### **Manuel Arşivleme Kuralları:**
```javascript
// Başarılı manuel arşivleme
1. Alice → Aktif ilanı var (status: "active")
2. İlana aktif teklif yok
3. Alice → "Arşivle" butonu → Confirmation modal
4. Onay → Status "removed" olur
5. İlan ana sayfadan kaldırılır
6. "İlanlarım" sayfasında "Arşivlendi" badge'i ile görünür

// Başarısız manuel arşivleme
1. Alice → İlanına Bob'dan pending teklif var
2. "Arşivle" butonu disabled
3. Tooltip: "Bu ilana aktif teklif var, arşivleyemezsiniz"
4. Önce teklifi kabul et/reddet, sonra arşivle
```

#### **Otomatik Arşivleme (Takas Tamamlandığında):**
```javascript
// Teklif kabul edildiğinde otomatik arşivleme
1. Alice → Bob'un teklifini kabul eder
2. Sistem otomatik olarak:
   - Alice'in ilanı → status: "completed"
   - Bob'un teklif ettiği kitap (virtual listing) → status: "completed"
   - Her iki ilan ana sayfadan kaldırılır
   - Kullanıcılar "İlanlarım" sayfasında "Takas Tamamlandı" badge'i ile görür
   - Geri alınamaz (kalıcı)
```

#### **Arşivleme Test Senaryoları:**
```javascript
// Manuel Arşivleme Testleri
✅ Aktif ilan + Teklif yok → Arşivleme başarılı
❌ Aktif ilan + Pending teklif → "Aktif teklif var" hatası
❌ Aktif ilan + Chat_accepted teklif → "Aktif teklif var" hatası
✅ Completed ilan → Zaten arşivlenmiş, buton görünmez
✅ Removed ilan → Zaten arşivlenmiş, buton görünmez

// Otomatik Arşivleme Testleri  
✅ Teklif kabul → Her iki ilan otomatik "completed"
✅ Ana sayfa → Arşivlenen ilanlar görünmez
✅ İlanlarım → "Takas Tamamlandı" badge'i
❌ Completed ilan → Düzenle/Arşivle butonları yok
```

---

### 🚫 Edge Case Testleri

#### **Single Active Offer Rule:**
```javascript
// Senaryo: Aynı ilana birden fazla teklif
1. Bob → Alice'in ilanına teklif gönderir (pending)
2. Charlie → Aynı ilana teklif göndermeye çalışır
   → "Bu ilana aktif bir teklif var, lütfen daha sonra tekrar deneyin"
3. Alice → Bob'un teklifini reddeder
4. Charlie → Şimdi teklif gönderebilir
```

#### **Rejected Offer Rule:**
```javascript
// Senaryo: Reddedilen ilana tekrar teklif
1. Bob → Alice'in ilanına teklif gönderir
2. Alice → Teklifi reddeder
3. Bob → Aynı ilana tekrar teklif göndermeye çalışır
   → "Bu ilana daha önce reddedilen teklifiniz var"
```

#### **Update/Archive Restrictions:**
```javascript
// Senaryo: Aktif teklifi olan ilanı düzenleme/arşivleme
1. Alice → İlan oluşturur
2. Bob → Teklif gönderir (pending)
3. Alice → İlanı düzenlemeye/arşivlemeye çalışır
   → "Bu ilana aktif teklif var, düzenleyemezsiniz/arşivleyemezsiniz"
   → Düzenle/Arşivle butonları disabled
```

#### **Arşivleme Sonrası Davranışlar:**
```javascript
// Manuel arşivleme sonrası
1. Alice → İlanını manuel arşivler
2. İlan ana sayfadan kaldırılır
3. Teklif gönderme linki deaktif olur
4. İlan detay sayfası → "Bu ilan arşivlenmiştir" mesajı
5. Geri getirme seçeneği yok

// Otomatik arşivleme sonrası (takas)
1. Takas tamamlanır → İlanlar otomatik arşivlenir
2. Her iki kullanıcı → "İlanlarım" sayfasında "Takas Tamamlandı"
3. Review verme zorunluluğu başlar
4. Conversation sonlanır ama mesaj geçmişi kalır
```

---

### 🔐 Güvenlik Testleri

#### **Authentication Tests:**
```javascript
// Token expire
1. User giriş yapar → Token alır
2. 24 saat sonra → Token expire olur
3. API call → 401 Unauthorized
4. Otomatik logout → Login sayfasına yönlendir
```

#### **Authorization Tests:**
```javascript
// Başkasının verisine erişim
1. Alice giriş yapmış
2. Bob'un offer'ına erişmeye çalışır
   → 403 Forbidden
3. Charlie'nin conversation'ına erişmeye çalışır
   → 403 Forbidden
```

---

### 📱 Responsive ve UX Testleri

#### **Mobile Responsive:**
```javascript
// Mobil cihazlarda
- Navigation → Hamburger menu
- Listing grid → Single column
- Chat → Full screen
- Forms → Touch-friendly inputs
```

#### **Loading States:**
```javascript
// API çağrıları sırasında
- Skeleton loading → Content yüklenene kadar
- Button loading → İşlem sırasında disabled
- Page loading → Spinner göster
```

#### **Error Handling:**
```javascript
// Network hataları
- API down → "Bağlantı hatası" mesajı
- Timeout → "İşlem zaman aşımına uğradı"
- 500 error → "Sunucu hatası" mesajı
```

---

### 🎨 UI/UX Validation Testleri

#### **Form Validations:**
```javascript
// Real-time validation
- Input blur → Validation check
- Form submit → Tüm alanları kontrol et
- Error display → Input altında kırmızı mesaj
- Success feedback → Yeşil check mark
```

#### **Confirmation Dialogs:**
```javascript
// Kritik işlemler için
- İlan arşivleme → "Bu ilanı arşivlemek istediğinizden emin misiniz?" modal
- Teklif iptal → "Bu teklifi iptal etmek istediğinizden emin misiniz?" dialog
- Logout → "Çıkış yapmak istediğinizden emin misiniz?"
```

#### **Notification Feedback:**
```javascript
// İşlem sonrası feedback
- Success → Yeşil toast notification
- Error → Kırmızı toast notification  
- Info → Mavi toast notification
- Warning → Sarı toast notification
```

---

## 🎯 Sayfa Bazlı Test Checklist

### ✅ Her Sayfa İçin Genel Testler

#### **Authentication:**
- [ ] Giriş yapmamış kullanıcı → Login'e yönlendir
- [ ] Token expire → Otomatik logout
- [ ] Yetkisiz erişim → 403 error

#### **Loading & Error States:**
- [ ] Loading spinner → API çağrısı sırasında
- [ ] Error boundary → Hata durumunda
- [ ] Empty state → Veri yoksa

#### **Responsive Design:**
- [ ] Mobile → Doğru görünüm
- [ ] Tablet → Layout uygun
- [ ] Desktop → Full functionality

#### **SEO & Accessibility:**
- [ ] Page title → Doğru başlık
- [ ] Meta description → Sayfa açıklaması
- [ ] Alt text → Resimler için
- [ ] Keyboard navigation → Tab ile gezinme

Bu rehber ile frontend'inizin her sayfasını ve akışını detaylı olarak test edebilir, kullanıcı deneyimini optimize edebilirsiniz! 