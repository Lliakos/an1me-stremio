const { addonBuilder } = require('stremio-addon-sdk');
const fetch = require('node-fetch');
const cheerio = require('cheerio');

const BASE_URL = 'https://an1me.to';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'el-GR,el;q=0.9,en-US;q=0.8,en;q=0.7',
  'Referer': 'https://an1me.to/'
};

const manifest = {
  id: 'gr.an1me.stremio',
  version: '1.0.0',
  name: 'An1me.to — Greek Anime',
  description: 'Ελληνικά anime με υπότιτλους και μεταγλωττισμένα από το an1me.to',
  logo: 'https://an1me.to/wp-content/uploads/2024/12/logo_copy.png',
  catalogs: [
    {
      type: 'series',
      id: 'an1me_popular',
      name: 'An1me — Δημοφιλέστερα',
      extra: [{ name: 'search', isRequired: false }, { name: 'skip' }]
    },
    {
      type: 'series',
      id: 'an1me_airing',
      name: 'An1me — Τρέχουσες Σειρές',
      extra: [{ name: 'skip' }]
    },
    {
      type: 'movie',
      id: 'an1me_movies',
      name: 'An1me — Ταινίες Anime',
      extra: [{ name: 'search', isRequired: false }, { name: 'skip' }]
    }
  ],
  resources: ['catalog', 'meta', 'stream'],
  types: ['series', 'movie'],
  idPrefixes: ['an1me:']
};

const builder = new addonBuilder(manifest);

// ─── HELPERS ─────────────────────────────────────────────────────────────────

async function fetchPage(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return cheerio.load(await res.text());
}

function parseAnimeCards($, type) {
  const items = [];
  $('article, .anime-card, .post, [class*="anime-item"], [class*="item"]').each((_, el) => {
    const $el = $(el);
    const link = $el.find('a[href*="/anime/"]').first().attr('href') ||
                 $el.closest('a[href*="/anime/"]').attr('href');
    if (!link) return;

    const slug = link.replace(BASE_URL, '').replace(/^\/anime\//, '').replace(/\/$/, '');
    const title = $el.find('h2, h3, .title, [class*="title"]').first().text().trim() ||
                  $el.find('a').first().attr('title') || slug;
    const poster = $el.find('img').first().attr('src') ||
                   $el.find('img').first().attr('data-src') || '';

    if (slug && title) {
      items.push({
        id: `an1me:${slug}`,
        type: type || 'series',
        name: title,
        poster: poster,
        posterShape: 'poster'
      });
    }
  });
  return items;
}

// ─── CATALOG ─────────────────────────────────────────────────────────────────

builder.defineCatalogHandler(async ({ type, id, extra }) => {
  try {
    const skip = parseInt(extra.skip) || 0;
    const page = Math.floor(skip / 20) + 1;
    let url;

    if (extra.search) {
      const q = encodeURIComponent(extra.search);
      const t = type === 'movie' ? '&s_type%5B%5D=movie' : '';
      url = `${BASE_URL}/search/?s_keyword=${q}&s_orderby=popular${t}&paged=${page}`;
    } else if (id === 'an1me_popular') {
      url = `${BASE_URL}/search/?s_orderby=popular&paged=${page}`;
    } else if (id === 'an1me_airing') {
      url = `${BASE_URL}/search/?s_orderby=popular&s_status%5B%5D=airing&paged=${page}`;
    } else if (id === 'an1me_movies') {
      url = `${BASE_URL}/anime-type/movie/page/${page}/`;
    } else {
      return { metas: [] };
    }

    const $ = await fetchPage(url);
    const metas = parseAnimeCards($, type);
    return { metas };
  } catch (e) {
    console.error('Catalog error:', e.message);
    return { metas: [] };
  }
});

// ─── META ─────────────────────────────────────────────────────────────────────

builder.defineMetaHandler(async ({ type, id }) => {
  try {
    const slug = id.replace('an1me:', '');
    const url = `${BASE_URL}/anime/${slug}/`;
    const $ = await fetchPage(url);

    const title = $('h1').first().text().trim() || slug;
    const description = $('[class*="overview"] p, [class*="synopsis"] p, .entry-content p').first().text().trim();
    const poster = $('meta[property="og:image"]').attr('content') ||
                   $('[class*="poster"] img, [class*="cover"] img').first().attr('src') || '';

    const genres = [];
    $('a[href*="/genre/"]').each((_, el) => {
      const g = $(el).text().trim();
      if (g) genres.push(g);
    });

    const videos = [];
    const episodeLinks = new Map();

    $('a[href*="/watch/"]').each((_, el) => {
      const href = $(el).attr('href') || '';
      const match = href.match(/\/watch\/(.+)-episode-(\d+)/);
      if (match) {
        const epNum = parseInt(match[2]);
        const epSlug = match[1];
        if (!episodeLinks.has(epNum)) {
          episodeLinks.set(epNum, { num: epNum, slug: epSlug, href });
        }
      }
    });

    [...episodeLinks.values()]
      .sort((a, b) => a.num - b.num)
      .forEach(ep => {
        videos.push({
          id: `an1me:${slug}:${ep.num}`,
          title: `Επεισόδιο ${ep.num}`,
          season: 1,
          episode: ep.num,
          released: new Date(2000 + Math.floor(ep.num / 100), 0, 1).toISOString()
        });
      });

    const meta = {
      id,
      type,
      name: title,
      poster,
      background: poster,
      description,
      genres,
      videos: videos.length > 0 ? videos : undefined
    };

    return { meta };
  } catch (e) {
    console.error('Meta error:', e.message);
    return { meta: null };
  }
});

// ─── STREAM ───────────────────────────────────────────────────────────────────

builder.defineStreamHandler(async ({ type, id }) => {
  try {
    const parts = id.replace('an1me:', '').split(':');
    const slug = parts[0];
    const episode = parts[1];

    let watchUrl;
    if (type === 'movie') {
      watchUrl = `${BASE_URL}/watch/${slug}-episode-1/`;
    } else {
      watchUrl = `${BASE_URL}/watch/${slug}-episode-${episode}/`;
    }

    const $ = await fetchPage(watchUrl);
    const streams = [];

    const videoSrc = $('video source').attr('src') || $('video').attr('src');
    if (videoSrc) {
      streams.push({
        url: videoSrc,
        title: '▶ An1me.to — Direct',
        behaviorHints: { notWebReady: false }
      });
    }

    const html = $.html();
    const hlsMatch = html.match(/["'](https?:\/\/[^"']+\.m3u8[^"']*)/);
    if (hlsMatch) {
      streams.push({
        url: hlsMatch[1],
        title: '▶ An1me.to — HLS',
        behaviorHints: { notWebReady: false }
      });
    }

    $('iframe[src]').each((_, el) => {
      const src = $(el).attr('src');
      if (src && !src.includes('facebook') && !src.includes('twitter')) {
        streams.push({
          externalUrl: src.startsWith('//') ? `https:${src}` : src,
          title: '▶ An1me.to — Player',
          behaviorHints: { notWebReady: true }
        });
      }
    });

    if (streams.length === 0) {
      streams.push({
        externalUrl: watchUrl,
        title: '▶ Άνοιγμα στο An1me.to',
        behaviorHints: { notWebReady: true }
      });
    }

    return { streams };
  } catch (e) {
    console.error('Stream error:', e.message);
    return { streams: [] };
  }
});

// ─── VERCEL NATIVE HANDLER ────────────────────────────────────────────────────
const addonInterface = builder.getInterface();

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  // Parse path segments manually to avoid routing package bugs
  const urlPath = req.url.split('?')[0];

  if (urlPath === '/' || urlPath === '/manifest.json') {
    return res.status(200).json(addonInterface.manifest);
  }

  // Matches path patterns like /catalog/series/an1me_popular.json
  const match = urlPath.match(/^\/([^/]+)\/([^/]+)\/([^/]+)\.json$/);
  if (match) {
    const [_, resource, type, encodedId] = match;
    const id = decodeURIComponent(encodedId);

    // Extract query variables for searching or skipping pages
    const urlObj = new URL(req.url, `http://${req.headers.host}`);
    const extra = {};
    if (urlObj.searchParams.has('search')) extra.search = urlObj.searchParams.get('search');
    if (urlObj.searchParams.has('skip')) extra.skip = urlObj.searchParams.get('skip');

    try {
      const result = await addonInterface.get(resource, { type, id, extra });
      return res.status(200).json(result);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(404).json({ error: 'Not found' });
};