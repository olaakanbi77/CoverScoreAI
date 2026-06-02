#!/bin/bash
set -e

DOMAIN="coverscore.site"
PORT=3016

echo "🚀 Starting CoverScore VPS Setup..."

# 1. Install required packages
echo "📦 Installing Nginx and Certbot..."
apt-get update
apt-get install -y nginx certbot python3-certbot-nginx

# 2. Configure Nginx
echo "⚙️ Configuring Nginx reverse proxy..."
cat > /etc/nginx/sites-available/$DOMAIN <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
nginx -t
systemctl reload nginx

echo "✅ Nginx configured successfully!"
echo ""
echo "⚠️ IMPORTANT: Before running SSL setup, ensure your Namecheap DNS A Record points to 163.245.210.111"
echo "To install SSL certificates automatically, run:"
echo "certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo ""
echo "🎉 VPS Setup Complete! Your app is ready on port 3016 and mapped to port 80."
