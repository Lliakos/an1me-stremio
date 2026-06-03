# An1me.to Stremio Addon 🎌

Greek anime addon for Stremio — pulls content from [an1me.to](https://an1me.to) including Greek subtitled and dubbed anime.

## Features

- 🔍 **Search** anime by title
- 📺 **3 catalogs**: Popular, Currently Airing, Movies
- 📖 **Full metadata**: titles, descriptions, genres, episode lists
- 🎬 **Streams**: extracts direct video URLs, HLS streams, and embedded players

## Setup

### Prerequisites
- [Node.js](https://nodejs.org) v16 or higher
- npm (comes with Node.js)

### Install & Run

```bash
# 1. Install dependencies
npm install

# 2. Start the addon server
node addon.js
```

The server starts at `http://127.0.0.1:7000`

### Add to Stremio

**Option A — Auto install (easiest):**
1. Open Stremio
2. Go to **Addons** → top-right search/URL bar
3. Paste: `http://127.0.0.1:7000/manifest.json`
4. Click **Install**

**Option B — Manual:**
1. Start the server with `node addon.js`
2. Open your browser and go to `http://127.0.0.1:7000`
3. Click the **Install** button on the addon page

## Hosting Online (Optional)

If you want to use the addon on multiple devices (TV, phone, etc.) without keeping your PC on:

### Free hosting on Render.com
1. Push this folder to a GitHub repo
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect your repo, set:
   - **Build Command:** `npm install`
   - **Start Command:** `node addon.js`
4. Set environment variable: `PORT=10000`
5. Deploy — you'll get a public HTTPS URL like `https://your-addon.onrender.com`
6. Install in Stremio using that URL + `/manifest.json`

## File Structure

```
an1me-stremio/
├── addon.js          ← Main addon code
├── package.json      ← Dependencies
└── README.md         ← This file
```

## How It Works

The addon scrapes **an1me.to** using the following URL patterns:

| Purpose     | URL Pattern                                      |
|-------------|--------------------------------------------------|
| Search      | `/search/?s_keyword=QUERY&s_orderby=popular`    |
| Popular     | `/search/?s_orderby=popular`                     |
| Airing      | `/search/?s_status[]=airing`                     |
| Movies      | `/anime-type/movie/`                             |
| Anime page  | `/anime/{slug}/`                                 |
| Watch       | `/watch/{slug}-episode-{N}/`                     |

## Notes

- This addon is for **personal use only**
- Streams are served directly from an1me.to — no content is hosted by this addon
- The addon respects the site's structure; if an1me.to updates its HTML layout, you may need to update the CSS selectors in `addon.js`
"# an1me-stremio" 
