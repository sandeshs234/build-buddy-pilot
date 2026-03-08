# Self-Hosting BuildForge on Office LAN

This guide explains how to host BuildForge on your office network so your team can access it via a local IP address (e.g., `http://192.168.1.100:8080`).

## Prerequisites

- **Node.js 18+** installed on the server machine ([Download](https://nodejs.org/))
- **Internet connection** on the server (the cloud backend still requires internet for auth, database, and functions)
- The server machine should have a **static local IP** on your office network

## Quick Start (5 minutes)

### 1. Clone & Install

```bash
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm install
```

### 2. Build the App

```bash
npm run build
```

This creates a `dist/` folder with all production-ready files.

### 3. Start the Server

```bash
node serve.cjs
```

The server starts on port **8080** by default. You'll see:

```
BuildForge running at:
  Local:   http://localhost:8080
  Network: http://192.168.x.x:8080
```

### 4. Share with Your Team

Share the **Network URL** with your office team. They can open it in any browser — no installation needed.

## Configuration

### Change the Port

```bash
PORT=3000 node serve.cjs
```

### Run in Background (Linux/Mac)

```bash
npm run build
nohup node serve.cjs &
```

### Run as a Windows Service

Use [pm2](https://pm2.keymetrics.io/) for production:

```bash
npm install -g pm2
pm2 start serve.cjs --name buildforge
pm2 save
pm2 startup   # Auto-start on boot
```

## Alternative: Use `npx serve`

If you prefer not to use the custom server script:

```bash
npm run build
npx serve dist -l 8080
```

## Alternative: Use Nginx

For a more robust setup, use Nginx as a reverse proxy:

```nginx
server {
    listen 8080;
    server_name _;
    root /path/to/buildforge/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## Network Requirements

| Service | Direction | Purpose |
|---------|-----------|---------|
| Office LAN (port 8080) | Inbound | Team accesses the app |
| Internet (HTTPS) | Outbound | Backend API calls (auth, database) |

> **Note:** The server machine needs internet access for the cloud backend to work. Team members' computers only need LAN access to the server.

## Fully Offline Setup (Advanced)

If your office has **no internet**, you can run a local Supabase instance using Docker:

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. Run Supabase locally:
   ```bash
   npx supabase init
   npx supabase start
   ```
3. Update `.env` with the local Supabase URL and keys
4. Rebuild: `npm run build`
5. Start: `node serve.cjs`

This requires more technical setup. See [Supabase Self-Hosting Docs](https://supabase.com/docs/guides/self-hosting) for details.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't access from other computers | Check firewall allows port 8080 |
| "Connection refused" | Ensure `serve.cjs` is running |
| Login/data not working | Check server has internet access |
| Slow loading | Run `npm run build` (not dev mode) |
