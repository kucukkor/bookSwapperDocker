# 🚀 Book Swap - DigitalOcean Production Deployment Guide

## 📋 Gereksinimler

- DigitalOcean hesabı
- Domain adı (opsiyonel ama önerilen)
- SSH anahtarı
- Git repository'si

## 🖥️ 1. DigitalOcean Droplet Oluşturma

### Droplet Özellikleri:
- **OS**: Ubuntu 22.04 LTS
- **Plan**: Basic ($12/month - 2GB RAM, 1 vCPU, 50GB SSD)
- **Datacenter**: Frankfurt veya Amsterdam (Türkiye'ye yakın)
- **Authentication**: SSH Key (güvenlik için)

### Droplet Oluşturduktan Sonra:
```bash
# SSH ile bağlan
ssh root@YOUR_DROPLET_IP
```

## 🔧 2. Sunucu Kurulumu

### Otomatik Kurulum (Önerilen):
```bash
# Repository'yi klonla
cd /opt
git clone https://github.com/YOUR_USERNAME/Book_Swap.git bookswap
cd bookswap

# Deployment script'ini çalıştır
sudo ./deploy.sh
```

### Manuel Kurulum:
```bash
# Sistem güncelleme
apt update && apt upgrade -y

# Docker kurulumu
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Docker Compose kurulumu
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Node.js kurulumu (frontend build için)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs git

# Firewall ayarları
ufw enable
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
```

## 📁 3. Proje Dosyalarını Hazırlama

### Backend Hazırlığı:
```bash
cd /opt/bookswap

# .env dosyasını oluştur (production için)
cat > .env << EOF
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://bookswap_user:bookswap_password@mongodb:27017/bookswap
JWT_SECRET=your_super_secure_jwt_secret_change_this_immediately
EOF
```

### Frontend Build:
```bash
# Frontend klasörüne git
cd frontend

# Dependencies yükle
npm install

# Production build
npm run build

# Build dosyalarını doğru yere kopyala
mkdir -p /opt/bookswap/frontend/build
cp -r build/* /opt/bookswap/frontend/build/
```

## 🔐 4. Güvenlik Ayarları

### Şifreleri Değiştir:
`docker-compose.yml` dosyasında şu değerleri değiştir:
```yaml
environment:
  MONGO_INITDB_ROOT_PASSWORD: your_secure_password_here  # Değiştir!
  JWT_SECRET: your_super_secure_jwt_secret_here_change_this  # Değiştir!
```

`mongo-init.js` dosyasında:
```javascript
pwd: 'bookswap_password'  // Değiştir!
```

### SSH Güvenliği:
```bash
# Root login'i devre dışı bırak
sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
systemctl restart ssh

# Yeni kullanıcı oluştur
adduser bookswap
usermod -aG sudo bookswap
usermod -aG docker bookswap
```

## 🚀 5. Uygulamayı Başlatma

```bash
cd /opt/bookswap

# Containers'ı başlat
docker-compose up -d

# Logları kontrol et
docker-compose logs -f

# Servislerin durumunu kontrol et
docker-compose ps
```

## 🌐 6. Domain Bağlama (Opsiyonel)

### DNS Ayarları:
- A Record: `@` → `YOUR_DROPLET_IP`
- A Record: `www` → `YOUR_DROPLET_IP`

### SSL Sertifikası (Let's Encrypt):
```bash
# Certbot kurulumu
apt install certbot python3-certbot-nginx

# SSL sertifikası al
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Otomatik yenileme
crontab -e
# Ekle: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 7. Monitoring ve Bakım

### Sistem Durumu Kontrolü:
```bash
# Container durumları
docker-compose ps

# Sistem kaynakları
htop
df -h

# Loglar
docker-compose logs backend
docker-compose logs mongodb
docker-compose logs frontend
```

### Backup Kontrolü:
```bash
# Manuel backup
/opt/bookswap/backup.sh

# Backup dosyalarını kontrol et
ls -la /opt/bookswap/backups/
```

## 🔄 8. Güncelleme Süreci

```bash
cd /opt/bookswap

# Yeni kodu çek
git pull origin main

# Frontend'i yeniden build et
cd frontend
npm run build
cp -r build/* /opt/bookswap/frontend/build/

# Containers'ı yeniden başlat
cd /opt/bookswap
docker-compose down
docker-compose build --no-cache backend
docker-compose up -d
```

## 🆘 9. Sorun Giderme

### Yaygın Sorunlar:

#### Container başlamıyor:
```bash
docker-compose logs [service_name]
docker system prune -a
```

#### MongoDB bağlantı sorunu:
```bash
docker exec -it bookswap_mongodb mongo
# Bağlantıyı test et
```

#### Disk doldu:
```bash
# Docker temizliği
docker system prune -a --volumes

# Log temizliği
journalctl --vacuum-time=7d
```

#### Port çakışması:
```bash
# Port kullanımını kontrol et
netstat -tulpn | grep :80
netstat -tulpn | grep :3000
```

## 📈 10. Performance Optimizasyonu

### MongoDB Optimizasyonu:
```bash
# MongoDB container'ına gir
docker exec -it bookswap_mongodb mongo

# Index'leri kontrol et
use bookswap
db.users.getIndexes()
db.listings.getIndexes()
```

### Nginx Cache:
```nginx
# nginx.conf'a ekle
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 🔒 11. Güvenlik Checklist

- [ ] Güçlü şifreler kullanıldı
- [ ] SSH key authentication aktif
- [ ] Root login devre dışı
- [ ] Firewall yapılandırıldı
- [ ] SSL sertifikası kuruldu
- [ ] Regular backup'lar çalışıyor
- [ ] Log monitoring aktif

## 📞 12. Yararlı Komutlar

```bash
# Sistem restart sonrası otomatik başlatma
systemctl enable bookswap.service

# Manuel servis kontrolü
systemctl start bookswap.service
systemctl stop bookswap.service
systemctl status bookswap.service

# Real-time monitoring
watch docker-compose ps
tail -f /var/log/nginx/access.log

# Database backup restore
docker exec -i bookswap_mongodb mongorestore --host localhost --port 27017 --username admin --password your_password --authenticationDatabase admin --db bookswap /path/to/backup
```

## 🎉 Tebrikler!

Artık Book Swap uygulamanız production'da çalışıyor! 

**Erişim URL'leri:**
- Frontend: `http://YOUR_DROPLET_IP` veya `https://yourdomain.com`
- API: `http://YOUR_DROPLET_IP/api` veya `https://yourdomain.com/api`
- Health Check: `http://YOUR_DROPLET_IP/health`

**Önemli Notlar:**
- İlk kurulumdan sonra mutlaka şifreleri değiştirin
- Regular backup'ları kontrol edin
- Sistem güncellemelerini takip edin
- SSL sertifikasının otomatik yenilenmesini kontrol edin 