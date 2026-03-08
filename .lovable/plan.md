

## Self-Hosting BuildForge for Office/LAN Use

Since this is a React + Vite app with a Lovable Cloud backend, here's how to make it work on a local office server:

### What's Already Possible

The frontend is a standard Vite/React app that can be built and served from any machine. The command `npm run build` produces a static `dist/` folder that any web server (nginx, Apache, or even `npx serve`) can host on a local network.

### The Challenge

The app currently depends on Lovable Cloud (Supabase) for authentication, database, and edge functions. To run fully locally without internet, you'd need to replace the entire backend — which is a major architectural rewrite.

### Recommended Approach: Hybrid Local Server

Keep the cloud backend but host the frontend on your office server so the team accesses it from the LAN.

**Steps to implement:**

1. **Add a production build script** and a simple `server.js` using Node's built-in HTTP or a lightweight static server
2. **Create a setup guide** (`SELF_HOST.md`) with instructions:
   - Run `npm run build` to generate the `dist/` folder
   - Serve it on the office network (e.g., `npx serve dist -l 8080`)
   - Team accesses via `http://192.168.x.x:8080`
3. **The cloud backend still handles** auth, database, and edge functions over the internet

### Alternative: Full Offline Mode

If internet access is truly unavailable, we would need to:
- Set up a local Supabase instance (Docker-based, requires technical setup)
- Update environment variables to point to the local instance
- This is a DevOps task outside Lovable's scope but I can provide the configuration guide

### What I'll Create

- A `SELF_HOST.md` documentation file with step-by-step instructions for hosting on an office LAN
- A simple `serve.cjs` script for easy local serving

This keeps all existing functionality intact while letting your office team access the app without publishing to the internet.

