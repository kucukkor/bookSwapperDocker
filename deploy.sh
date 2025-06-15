#!/bin/bash

# Book Swap Deployment Script for DigitalOcean
# Usage: ./deploy.sh

set -e

echo "🚀 Starting Book Swap deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

# Update system
echo -e "${YELLOW}📦 Updating system packages...${NC}"
apt update && apt upgrade -y

# Install Docker
echo -e "${YELLOW}🐳 Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    usermod -aG docker $SUDO_USER
    rm get-docker.sh
else
    echo "Docker already installed"
fi

# Install Docker Compose
echo -e "${YELLOW}🐙 Installing Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
else
    echo "Docker Compose already installed"
fi

# Install Git
echo -e "${YELLOW}📥 Installing Git...${NC}"
if ! command -v git &> /dev/null; then
    apt install -y git
else
    echo "Git already installed"
fi

# Install Node.js and npm (for building frontend)
echo -e "${YELLOW}📦 Installing Node.js...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
else
    echo "Node.js already installed"
fi

# Create application directory
echo -e "${YELLOW}📁 Setting up application directory...${NC}"
mkdir -p /opt/bookswap
cd /opt/bookswap

# Set up firewall
echo -e "${YELLOW}🔥 Configuring firewall...${NC}"
ufw --force enable
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp

# Create systemd service for auto-start
echo -e "${YELLOW}⚙️ Creating systemd service...${NC}"
cat > /etc/systemd/system/bookswap.service << EOF
[Unit]
Description=Book Swap Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/bookswap
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

# Enable the service
systemctl enable bookswap.service

# Create backup script
echo -e "${YELLOW}💾 Creating backup script...${NC}"
cat > /opt/bookswap/backup.sh << 'EOF'
#!/bin/bash
# Backup script for Book Swap

BACKUP_DIR="/opt/bookswap/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup MongoDB
docker exec bookswap_mongodb mongodump --host localhost --port 27017 --username admin --password your_secure_password_here --authenticationDatabase admin --db bookswap --out /tmp/backup_$DATE

# Copy backup from container
docker cp bookswap_mongodb:/tmp/backup_$DATE $BACKUP_DIR/

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz uploads/

# Keep only last 7 days of backups
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /opt/bookswap/backup.sh

# Create cron job for daily backups
echo -e "${YELLOW}⏰ Setting up daily backups...${NC}"
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/bookswap/backup.sh >> /var/log/bookswap-backup.log 2>&1") | crontab -

# Create log rotation
echo -e "${YELLOW}📝 Setting up log rotation...${NC}"
cat > /etc/logrotate.d/bookswap << EOF
/var/log/bookswap-backup.log {
    daily
    missingok
    rotate 30
    compress
    notifempty
    create 644 root root
}
EOF

echo -e "${GREEN}✅ Server setup completed!${NC}"
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Clone your repository to /opt/bookswap"
echo "2. Build your frontend and place it in /opt/bookswap/frontend/build"
echo "3. Update passwords in docker-compose.yml"
echo "4. Run: docker-compose up -d"
echo ""
echo -e "${GREEN}🎉 Your server is ready for deployment!${NC}" 