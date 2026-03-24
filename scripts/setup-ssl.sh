#!/bin/sh
# ─────────────────────────────────────────────────────────────────
# CMMC Dashboard — SSL/TLS Setup Script
# Obtains a Let's Encrypt certificate using Certbot
#
# Prerequisites:
#   - Domain name pointed at your server's IP
#   - Port 80 open (for ACME challenge)
#   - Docker Compose stack running (nginx must be up)
#
# Usage:
#   ./scripts/setup-ssl.sh yourdomain.example.com admin@example.com
#
# After running this:
#   1. Update docker-compose.yml to use nginx-ssl.conf
#   2. Expose port 443 on nginx
#   3. Restart: docker compose up -d
# ─────────────────────────────────────────────────────────────────
set -eu

DOMAIN="${1:-}"
EMAIL="${2:-}"

if [ -z "${DOMAIN}" ] || [ -z "${EMAIL}" ]; then
  echo "Usage: $0 <domain> <email>"
  echo "Example: $0 cmmc.mycompany.com admin@mycompany.com"
  exit 1
fi

echo "CMMC Dashboard — SSL Setup"
echo "=========================="
echo "Domain: ${DOMAIN}"
echo "Email:  ${EMAIL}"
echo ""

# Create certbot directories
mkdir -p ./certbot/www ./certbot/conf

# Step 1: Generate a temporary self-signed cert so nginx can start with SSL config
echo "[1/3] Generating temporary self-signed certificate..."
mkdir -p ./certbot/conf/live/cmmc
openssl req -x509 -nodes -newkey rsa:2048 \
  -keyout ./certbot/conf/live/cmmc/privkey.pem \
  -out ./certbot/conf/live/cmmc/fullchain.pem \
  -subj "/CN=${DOMAIN}" \
  -days 1 2>/dev/null
echo "  Done."

# Step 2: Switch to SSL nginx config and restart
echo ""
echo "[2/3] Please update your docker-compose.yml:"
echo "  - Change nginx volumes to use nginx-ssl.conf"
echo "  - Add port 443:443 to nginx"
echo "  - Add certbot volumes (see below)"
echo ""
echo "  Then run: docker compose up -d nginx"
echo ""
echo "  Required nginx volumes:"
echo "    - ./nginx-ssl.conf:/etc/nginx/nginx.conf:ro"
echo "    - ./certbot/conf:/etc/letsencrypt:ro"
echo "    - ./certbot/www:/var/www/certbot:ro"
echo ""
read -p "Press Enter when nginx is running with SSL config..." _

# Step 3: Obtain real certificate from Let's Encrypt
echo ""
echo "[3/3] Requesting certificate from Let's Encrypt..."
docker run --rm \
  -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
  -v "$(pwd)/certbot/www:/var/www/certbot" \
  certbot/certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email "${EMAIL}" \
  --agree-tos \
  --no-eff-email \
  -d "${DOMAIN}" \
  --cert-name cmmc

echo ""
echo "================================================================"
echo "  SSL certificate obtained successfully!"
echo "  Certificate: ./certbot/conf/live/cmmc/fullchain.pem"
echo "  Private key: ./certbot/conf/live/cmmc/privkey.pem"
echo "================================================================"
echo ""
echo "Restart nginx to pick up the real certificate:"
echo "  docker compose restart nginx"
echo ""
echo "IMPORTANT: Add a Certbot renewal cron job:"
echo "  0 12 * * * docker run --rm -v \$(pwd)/certbot/conf:/etc/letsencrypt -v \$(pwd)/certbot/www:/var/www/certbot certbot/certbot renew --quiet && docker compose restart nginx"
