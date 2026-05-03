# Deployment Guide – AI Viral Content Empire v12.0

## Quick Start Options

| Method | Best For | Effort |
|--------|---------|--------|
| [Local / VPS](#1-local--vps-deployment) | Self-hosted, full control | Low |
| [Docker Compose](#2-docker-compose-deployment) | Containerized, easy setup | Low |
| [PM2](#pm2-process-management) | Production VPS, auto-restart | Medium |
| [Systemd](#systemd-service) | Linux server, OS-level management | Medium |
| [Cloud VPS](#cloud-vps-recommendations) | AWS, DigitalOcean, Hetzner | Medium |

---

## 1. Local / VPS Deployment

### Prerequisites

- Node.js 20+ (`node --version`)
- pnpm (`npm install -g pnpm`)
- ffmpeg (`ffmpeg -version`)
- Git

### Steps

```bash
# 1. Clone
git clone https://github.com/your-org/ai-content-empire.git
cd ai-content-empire

# 2. Configure
cp .env.example .env
nano .env  # Set PEXELS_API_KEY at minimum

# 3. One-command setup
chmod +x setup.sh
./setup.sh

# 4. Start
node dist/index.js

# Or with auto-restart:
./setup.sh --start
```

The app starts at `http://localhost:3123`.

---

## 2. Docker Compose Deployment

### Prerequisites

- Docker Engine 24+
- Docker Compose v2.20+

### Steps

```bash
# 1. Clone
git clone https://github.com/your-org/ai-content-empire.git
cd ai-content-empire

# 2. Configure
cp .env.example .env
nano .env  # Set PEXELS_API_KEY at minimum

# 3. Create data directory
mkdir -p data

# 4. Start services
docker-compose up -d

# 5. Watch logs
docker-compose logs -f app

# 6. Health check
curl http://localhost:3123/api/health
```

### Docker Compose Commands

```bash
docker-compose up -d          # Start in background
docker-compose down           # Stop
docker-compose logs -f        # Follow logs
docker-compose ps             # Status
docker-compose restart app    # Restart app only
docker-compose pull           # Pull latest images
```

### Docker Images

| Dockerfile | Use Case | Size (approx) |
|-----------|---------|---------------|
| `main.Dockerfile` | Full-featured (CPU) | ~4GB |
| `main-cuda.Dockerfile` | NVIDIA GPU acceleration | ~6GB |
| `main-tiny.Dockerfile` | Minimal (fastest build) | ~2GB |

---

## 3. PM2 Process Management

```bash
# Install PM2
npm install -g pm2

# Start
pm2 start dist/index.js --name ai-content-empire \
  --max-memory-restart 4G \
  --restart-delay 3000

# Save process list (auto-restart on reboot)
pm2 save
pm2 startup

# Management
pm2 status
pm2 logs ai-content-empire
pm2 restart ai-content-empire
pm2 stop ai-content-empire
pm2 monit
```

---

## 4. Systemd Service

Create `/etc/systemd/system/ai-content-empire.service`:

```ini
[Unit]
Description=AI Viral Content Empire
After=network.target redis.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/ai-content-empire
EnvironmentFile=/opt/ai-content-empire/.env
ExecStart=/usr/bin/node /opt/ai-content-empire/dist/index.js
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=ai-content-empire
# Memory and CPU limits
MemoryLimit=6G
CPUQuota=400%

[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload
systemctl enable ai-content-empire
systemctl start ai-content-empire
systemctl status ai-content-empire
journalctl -u ai-content-empire -f
```

---

## 5. Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    client_max_body_size 500M;

    location / {
        proxy_pass http://localhost:3123;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

SSL with Let's Encrypt:
```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com
```

---

## Cloud VPS Recommendations

| Provider | Instance Type | vCPU | RAM | Storage | Est. Cost/mo |
|---------|--------------|------|-----|---------|-------------|
| Hetzner | CPX41 | 8 | 16GB | 240GB | ~$25 |
| DigitalOcean | 8vCPU 16GB | 8 | 16GB | 320GB | ~$96 |
| AWS | c5.2xlarge | 8 | 16GB | EBS | ~$120 |
| Vultr | 8vCPU 16GB | 8 | 16GB | 256GB | ~$80 |

Minimum recommended: **4 vCPU, 8GB RAM, 100GB SSD**

---

## Environment Variables

See [`.env.example`](../.env.example) for the full list.

### Critical for Production

```bash
PEXELS_API_KEY=           # REQUIRED
TENANT_KEYS_SECRET=       # Generate: openssl rand -hex 32
JWT_SECRET=               # Generate: openssl rand -hex 32
REDIS_ENABLED=true        # Enable job queue
REDIS_HOST=redis          # Redis hostname
LOG_LEVEL=warn            # Less verbose in production
DATA_DIR_PATH=/app/data   # Persistent data path
```

---

## Monitoring & Alerting

### Health Endpoint

```bash
curl http://localhost:3123/api/health
```

Expected response:
```json
{
  "status": "ok",
  "version": "12.0.0",
  "uptime": 3600,
  "services": { "redis": "connected", "pexels": "ok" }
}
```

### Health Check Script

```bash
./scripts/healthcheck.sh --verbose
```

### Docker Health Check

Built into `docker-compose.yml` — checks `/api/health` every 30s.

---

## Backup & Recovery

```bash
# Create backup
./scripts/backup.sh

# Scheduled backup (daily at 2am)
echo "0 2 * * * /opt/ai-content-empire/scripts/backup.sh" | crontab -

# Restore (copy JSON files back to DATA_DIR_PATH)
tar xzf backup_20260505.tar.gz -C ~/.ai-content-empire/
```

---

## Deployment Script

For production deploy with zero-downtime:

```bash
./scripts/deploy.sh
```

This script:
1. Validates `.env`
2. Installs production dependencies
3. Runs migrations
4. Builds the project
5. Restarts via PM2 or systemd
6. Runs a health check

---

## Troubleshooting

### App won't start

```bash
# Check logs
pm2 logs ai-content-empire
# or
journalctl -u ai-content-empire -n 50

# Verify build
ls dist/index.js
node dist/index.js  # run directly
```

### Videos not being created

1. Check `PEXELS_API_KEY` is valid
2. Check disk space: `df -h`
3. Check ffmpeg: `ffmpeg -version`
4. Check render job logs in `DATA_DIR_PATH/logs/`

### Redis connection failed

```bash
redis-cli ping  # should return PONG
# Check REDIS_HOST, REDIS_PORT, REDIS_PASSWORD in .env
```

### Out of memory

- Reduce `CONCURRENCY` (fewer parallel renders)
- Increase server RAM
- Use `main-tiny.Dockerfile` for lower memory footprint

### Port already in use

```bash
lsof -i :3123
# Change PORT in .env
```
