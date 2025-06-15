#!/bin/bash

# Production Deployment Script for Book Swap Platform (IP-based)
set -e

echo "🚀 Starting Book Swap Production Deployment (IP-based)..."

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

# Get server IP
SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || hostname -I | awk '{print $1}')
echo -e "${GREEN}Server IP detected: $SERVER_IP${NC}"

echo -e "${YELLOW}📦 Building frontend...${NC}"
cd frontend

# Clean npm cache and remove lock file to avoid TailwindCSS v4 issues
echo -e "${YELLOW}🧹 Cleaning npm cache...${NC}"
npm cache clean --force
rm -f package-lock.json
rm -rf node_modules

# Install dependencies
npm install

# Build frontend
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

# Server IP
SERVER_IP=$SERVER_IP
EOF

# Update mongo-init.js with new password
MONGO_APP_PASSWORD=$(grep MONGO_APP_PASSWORD .env.prod | cut -d '=' -f2)
sed -i "s/bookswap_password_2024/$MONGO_APP_PASSWORD/g" mongo-init.js

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

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}Your Book Swap platform is now available at:${NC}"
echo -e "${GREEN}  - HTTP: http://$SERVER_IP${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Test the application: http://$SERVER_IP"
echo "2. Check logs: docker-compose -f docker-compose.prod.yml logs"
echo "3. Monitor services: docker-compose -f docker-compose.prod.yml ps"
echo ""
echo -e "${YELLOW}🔧 Useful commands:${NC}"
echo "- Restart services: docker-compose -f docker-compose.prod.yml restart"
echo "- View logs: docker-compose -f docker-compose.prod.yml logs [service_name]"
echo "- Update application: git pull && ./deploy-production.sh"
echo ""
echo -e "${YELLOW}⚠️  Security Note:${NC}"
echo "This deployment uses HTTP only. For production use, consider:"
echo "1. Getting a domain name"
echo "2. Setting up SSL/HTTPS with Let's Encrypt"
echo "3. Using a reverse proxy like Cloudflare" 