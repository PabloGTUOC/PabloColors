# PabloColors

A self-hosted web app for managing Fujifilm X-series film simulation recipes. Runs on a Synology NAS, accessible from anywhere via a Cloudflare Tunnel. When accessed locally in Chrome with a Fujifilm X100VI connected over USB-C, it can read and write camera recipe slots C1–C7 directly.

---

## Prerequisites

- Synology NAS running **Container Manager** (Docker)
- Existing **NGINX** service on the NAS acting as a reverse proxy
- Existing **`cloudflared` Docker container** managing a Cloudflare Tunnel (PabloColors does not own or run this)
- **Chrome** (required for camera features — WebUSB is Chromium-only)
- A USB-C cable to connect the Fujifilm X100VI to the machine running Chrome

---

## Deployment

### 1. Clone the repository

```bash
git clone https://github.com/PabloGTUOC/PabloColors.git
cd PabloColors
```

### 2. Create the data directory on the NAS

```bash
mkdir -p /volume1/docker/pablocolors/data/photos
```

### 3. Generate credentials

**Session secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**bcrypt password hash:**
```bash
node -e "const b=require('bcryptjs'); b.hash('yourpassword', 12).then(console.log)"
```
> If `bcryptjs` is not installed globally, run `npm install bcryptjs` in a temp directory first.

### 4. Create the `.env` file

Copy `.env.example` and fill in your values:

```bash
cp .env.example .env
```

```env
PORT=3000
SESSION_SECRET=<output from step 3>
ADMIN_USERNAME=pablo
ADMIN_PASSWORD_HASH=<bcrypt hash from step 3>
DATA_DIR=/app/data
```

### 5. Build and start the container

```bash
docker-compose up -d --build
```

The container starts and listens on `localhost:3000` on the NAS host.

---

## NGINX configuration

Add a new server block to the existing NGINX config to route the PabloColors subdomain to the container:

```nginx
server {
    listen 443 ssl;
    server_name pablocolors.yourdomain.com;

    # SSL handled by Cloudflare Tunnel — adjust if terminating locally
    location / {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;

        # Required for session cookies over proxy
        proxy_set_header   Upgrade           $http_upgrade;
        proxy_set_header   Connection        "upgrade";
    }
}
```

Replace `pablocolors.yourdomain.com` with your actual subdomain and `3000` with your chosen host port if changed.

Reload NGINX after saving:
```bash
nginx -s reload
```

---

## Cloudflare Tunnel configuration

In the existing `cloudflared` config (typically `config.yml`), add a new ingress rule for the PabloColors subdomain. The tunnel infrastructure itself does not need to change — only this config entry:

```yaml
ingress:
  - hostname: pablocolors.yourdomain.com
    service: http://localhost:80   # points to NGINX
  # ... other rules
  - service: http_status:404
```

Alternatively, route directly to the container, bypassing NGINX:

```yaml
ingress:
  - hostname: pablocolors.yourdomain.com
    service: http://localhost:3000
  - service: http_status:404
```

Restart the `cloudflared` container after updating the config:
```bash
docker restart cloudflared
```

---

## Camera usage (Chrome + USB-C only)

Camera features — reading and writing recipe slots C1–C7 — require:

1. **Chrome** (or any Chromium-based browser). WebUSB is not available in Safari or Firefox.
2. **HTTPS or localhost** context. The Cloudflare Tunnel provides HTTPS automatically. Local dev (`localhost:5173`) also works.
3. **Camera USB mode set to "PC Connection (USB RAW Conv./Remote Control)"** (also shown as "X RAW Studio" mode in some firmware versions):
   - On the X100VI: `Menu → Connection Setting → USB Setting → USB RAW Conv./Remote Control`
4. Connect the camera to the Mac/PC running Chrome via USB-C.
5. Open PabloColors in Chrome and click **Connect camera** in the bottom panel.
6. Chrome will show a device picker — select the X100VI.

> Camera features are automatically hidden when the app is accessed from a non-Chromium browser or when WebUSB is unavailable (e.g. from a mobile device or a browser extension context).

---

## Updating

```bash
git pull
docker-compose up -d --build
```

The SQLite database and photos in `/volume1/docker/pablocolors/data/` are preserved across rebuilds via the bind mount.

---

## Backup

Two things need to be backed up:

| Item | Path on NAS |
|---|---|
| Recipe database | `/volume1/docker/pablocolors/data/pablocolors.db` |
| Sample photos | `/volume1/docker/pablocolors/data/photos/` |

Copy both to your preferred backup destination. Synology Hyper Backup can include these paths automatically if the task covers `/volume1/docker/pablocolors/`.

---

## Known limitations

| Limitation | Detail |
|---|---|
| Camera features are Chromium-only | WebUSB is not implemented in Safari or Firefox. No workaround. |
| Camera must be local | WebUSB runs in the browser — the NAS cannot reach the camera. Camera features only work when the camera is physically connected to the device running Chrome. |
| User gesture required to connect | Chrome requires a button click to initiate WebUSB access. There is no auto-connect on page load. |
| Single user | Credentials are set via environment variables at deploy time. There is no registration flow or multi-user support. |
| X100VI only (MVP) | Protocol mappings are confirmed for the X100VI (X-Trans V / X-Processor 5). Other Fujifilm bodies may work but are untested. |
| RAW conversion | Out of scope. The app manages recipe slots only. |
