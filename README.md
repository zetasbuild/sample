# 📺 DualView Panel (Next.js Edition)

A modern full-stack **Next.js** application featuring:
1. **YouTube Player Panel**: Copy & paste any YouTube URL to watch with clean responsive embedding.
2. **Website Viewer Panel**: Copy & paste any website link with an integrated **Smart Bypass Proxy** to eliminate iframe restrictions (`X-Frame-Options` & CSP).
3. **Admin Panel & Authentication**: Secure sign-in to customize presets, monitor user activity history, and control proxy settings.

---

## ⚡ Quick Start

The app is currently running live on:
👉 **[http://localhost:3000](http://localhost:3000)**

To run or restart manually:
```bash
# Run Development Server (Next.js Turbopack)
npm run dev

# Or build & run Production Server
npm run build
npm start
```

---

## 🔐 Admin Panel & Login

- **Admin Login Route**: **[/login](http://localhost:3000/login)**
- **Admin Dashboard**: **[/admin](http://localhost:3000/admin)** (protected route)

### Default Admin Credentials
| Field | Value |
| :--- | :--- |
| **Username** | `admin` |
| **Password** | `admin123` |

*(A **"Fill Demo Credentials"** button is also available on the login page for 1-click test access).*

### Admin Features
- 📺 **YouTube Admin View**: Dedicated manager for YouTube presets, playback test player, and YouTube watch history.
- 🌐 **Website Admin View**: Dedicated manager for Website bookmarks, live preview test, Smart Bypass proxy settings, and browsing history.
- 🔀 **Split Dual Admin View**: Edit and preview both YouTube and Website management simultaneously.
- 🔑 **Set Login Username & Password**: Full controls inside the Admin Panel to update the admin username and password with instant saving and verification.

---

## 🎯 Key Panel Features

### 1. YouTube Panel
- Supports **all standard YouTube formats**:
  - `https://www.youtube.com/watch?v=VIDEO_ID`
  - `https://youtu.be/VIDEO_ID`
  - `https://www.youtube.com/shorts/VIDEO_ID`
  - `https://www.youtube.com/live/VIDEO_ID`
  - Timestamps (`?t=90` or `?t=1m30s`)
- **One-click Paste Button** (`navigator.clipboard` integration).
- Clean 16:9 responsive embed container (`youtube-nocookie.com`).
- Recent video history chips.

### 2. Website Viewer Panel (Admin Links View-Only)
- **View-Only Mode**: Users can **only select and view links added by the Admin** (prevents browsing to random/unauthorized sites).
- **Admin Directory Tabs**: Displays clean clickable badges/tabs for all admin-approved bookmarks.
- **Smart Bypass Proxy** (`/api/proxy?url=...`):
  - Strips `X-Frame-Options` and `Content-Security-Policy` headers.
  - Injects `<base href="...">` so relative CSS/images resolve to the original site.
  - Allows sites like Wikipedia, Hacker News, MDN, OpenStreetMap to render inside the frame.
- Browser mock header with URL display, reload button, and external tab pop-out.

### 3. Layout Modes
- **🔀 Split View**: Watch YouTube and browse the website simultaneously (columns or rows).
- **📺 YouTube Only**: Expands YouTube player to full screen width.
- **🌐 Website Only**: Expands Website viewer to full screen width.
- **Orientation Toggle**: Switch between Side-by-Side (Columns) and Stacked (Rows).
