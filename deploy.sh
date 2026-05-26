#!/bin/bash
set -e

# --- Configuration ---
NAS_IP="192.168.50.174"
NAS_USER="root"
NAS_PATH="/srv/dev-disk-by-uuid-cccff270-64d8-4abd-bd78-a4bfdea7493b/docker-data/pablo-colors"

# App Settings (Change these to your preferred credentials/keys)
ADMIN_USERNAME="pablo"
# Generate password hash with: node -e "const b=require('bcryptjs');b.hash('casapps',12).then(console.log)"
ADMIN_PASSWORD_HASH='$2b$12$SM.lwirHWJFDg1jLpu9Ra.iAo8f8vuJDEy0A20kQITezS1VNbygNu'
# Generate session secret with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
SESSION_SECRET="adb503068dc165745c8f255c90fc76a8ce359100ab210d33cc109d2768aa02ab"
PORT="3000"
# ---------------------

echo "→ Building pablocolors-app image (linux/amd64)..."
docker build --platform linux/amd64 -f server/Dockerfile -t pablocolors-app:latest .

echo "→ Saving image..."
docker save pablocolors-app:latest | gzip > /tmp/pablocolors-app.tar.gz

echo "→ Transferring to NAS..."
scp /tmp/pablocolors-app.tar.gz $NAS_USER@$NAS_IP:/tmp/

echo "→ Loading and restarting on NAS..."
ssh $NAS_USER@$NAS_IP << EOF
  docker load < /tmp/pablocolors-app.tar.gz
  
  # Stop and remove existing container if it exists
  docker stop pablocolors-app 2>/dev/null || true
  docker rm pablocolors-app 2>/dev/null || true
  
  # Ensure the data directory exists
  mkdir -p $NAS_PATH
  
  # Run the new container
  docker run -d \
    --name pablocolors-app \
    --network proxy-network \
    --restart unless-stopped \
    -p $PORT:3000 \
    -v $NAS_PATH:/app/data \
    -e ADMIN_USERNAME="$ADMIN_USERNAME" \
    -e ADMIN_PASSWORD_HASH='$ADMIN_PASSWORD_HASH' \
    -e SESSION_SECRET="$SESSION_SECRET" \
    -e PORT=3000 \
    -e NODE_ENV=production \
    -e DATA_DIR=/app/data \
    pablocolors-app:latest

  rm /tmp/pablocolors-app.tar.gz
  echo "✓ Done"
EOF

echo "→ Cleaning up local temp files..."
rm /tmp/pablocolors-app.tar.gz

echo "✓ Deploy complete!"
