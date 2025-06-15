#!/bin/bash

# Production Deployment Script for Book Swap Platform
set -e

echo "🚀 Starting Book Swap Production Deployment..."

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

# Get domain name
read -p "Enter your domain name (e.g., bookswap.example.com): " DOMAIN
if [ -z "$DOMAIN" ]; then
    echo -e "${RED}Domain name is required!${NC}"
    exit 1
fi

# Update nginx config with domain
sed -i "s/YOUR_DOMAIN_HERE/$DOMAIN/g" nginx.prod.conf

echo -e "${YELLOW}📦 Building frontend...${NC}"
cd frontend
npm install
npm run build
cd ..

echo -e "${YELLOW}🔧 Setting up environment variables...${NC}"
# Create .env.prod file
cat > .env.prod << EOF
# MongoDB Passwords
MONGO_ROOT_PASSWORD=$(openssl rand -base64 32)
MONGO_APP_PASSWORD=$(openssl rand -base64 32)

# JWT Secret
JWT_SECRET=$(openssl rand -base64 64)

# Domain
DOMAIN=$DOMAIN
EOF

# Update mongo-init.js with new password
MONGO_APP_PASSWORD=$(grep MONGO_APP_PASSWORD .env.prod | cut -d '=' -f2)
sed -i "s/bookswap_password_2024/$MONGO_APP_PASSWORD/g" mongo-init.js

echo -e "${YELLOW}🔒 Setting up SSL certificate...${NC}"
# Create SSL directory
mkdir -p ssl

# Get SSL certificate with Certbot
certbot certonly --standalone --non-interactive --agree-tos --email admin@$DOMAIN -d $DOMAIN

# Copy certificates to ssl directory
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ssl/
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ssl/

# Set proper permissions
chmod 644 ssl/fullchain.pem
chmod 600 ssl/privkey.pem

echo -e "${YELLOW}🐳 Starting Docker containers...${NC}"
# Stop any existing containers
docker-compose -f docker-compose.prod.yml down -v 2>/dev/null || true

# Build and start containers
docker-compose -f docker-compose.prod.yml --env-file .env.prod up --build -d

echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
sleep 30

# Check if services are running
if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo -e "${GREEN}✅ All services are running!${NC}"
else
    echo -e "${RED}❌ Some services failed to start. Check logs:${NC}"
    docker-compose -f docker-compose.prod.yml logs
    exit 1
fi

echo -e "${YELLOW}🔄 Setting up SSL certificate auto-renewal...${NC}"
# Add cron job for certificate renewal
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet --deploy-hook 'docker-compose -f /opt/bookswap/docker-compose.prod.yml restart frontend'") | crontab -

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}Your Book Swap platform is now available at:${NC}"
echo -e "${GREEN}  - HTTPS: https://$DOMAIN${NC}"
echo -e "${GREEN}  - HTTP: http://$DOMAIN (redirects to HTTPS)${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Test the application: https://$DOMAIN"
echo "2. Check logs: docker-compose -f docker-compose.prod.yml logs"
echo "3. Monitor services: docker-compose -f docker-compose.prod.yml ps"
echo ""
echo -e "${YELLOW}🔧 Useful commands:${NC}"
echo "- Restart services: docker-compose -f docker-compose.prod.yml restart"
echo "- View logs: docker-compose -f docker-compose.prod.yml logs [service_name]"
echo "- Update application: git pull && ./deploy-production.sh" 