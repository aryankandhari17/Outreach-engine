const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const zlib = require('zlib');
const { autoUpdater } = require('electron-updater');

// Prevent duplicate app windows from multiple launches.
const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
}

// Auto-updater configuration
autoUpdater.autoDownload = true;       // Download silently in background
autoUpdater.autoInstallOnAppQuit = true; // Install when the app is next quit

function setupAutoUpdater() {
  autoUpdater.checkForUpdatesAndNotify().catch(() => {
    // Silently ignore — no internet, no GitHub token, dev environment, etc.
  });

  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Ready',
      message: 'A new version of OutreachEngine has been downloaded.',
      detail: 'The update will be installed when you quit the app, or you can restart now.',
      buttons: ['Restart Now', 'Later'],
      defaultId: 0
    }).then(({ response }) => {
      if (response === 0) autoUpdater.quitAndInstall();
    });
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0A0A0B',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  win.loadFile('index.html');
}

if (gotSingleInstanceLock) {
  app.on('second-instance', () => {
    const existingWindow = BrowserWindow.getAllWindows()[0];
    if (!existingWindow) return;
    if (existingWindow.isMinimized()) existingWindow.restore();
    existingWindow.focus();
  });

  app.whenReady().then(() => {
    createWindow();
    setupAutoUpdater();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('dialog:openFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'CSV', extensions: ['csv'] }]
  });
  if (canceled) return null;
  const filePath = filePaths[0];
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = require('path').basename(filePath);
  return { content, fileName };
});

ipcMain.handle('dialog:saveFile', async (event, { csvData, suggestedName }) => {
  const date = new Date().toISOString().split('T')[0];
  const defaultName = suggestedName || `labs22-lead-engine-${date}.csv`;
  const { canceled, filePath } = await dialog.showSaveDialog({
    defaultPath: defaultName,
    filters: [{ name: 'CSV', extensions: ['csv'] }]
  });
  if (canceled) return false;
  fs.writeFileSync(filePath, csvData, 'utf-8');
  return true;
});

// Export all tier groups as a named folder containing per-tier CSVs
ipcMain.handle('dialog:saveExportGroup', async (event, { date, tiers }) => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Choose where to save the export folder',
    properties: ['openDirectory', 'createDirectory']
  });
  if (canceled || !filePaths || !filePaths[0]) return { success: false };

  const parentDir = filePaths[0];
  const folderName = `Labs22OutreachEngine-${date}`;
  const exportDir = path.join(parentDir, folderName);

  if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });

  for (const tier of tiers) {
    const tierDir = path.join(exportDir, tier.name);
    if (!fs.existsSync(tierDir)) fs.mkdirSync(tierDir, { recursive: true });
    fs.writeFileSync(path.join(tierDir, tier.filename), tier.csvData, 'utf-8');
  }

  return { success: true, folderPath: exportDir };
});

// Leads are saved to a visible /data folder inside the project directory.
// A .backup.json is kept from the previous save so no data is ever silently lost.
const DATA_DIR = path.join(__dirname, 'data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');
const LEADS_BACKUP = path.join(DATA_DIR, 'leads.backup.json');

ipcMain.handle('state:save', async (event, data) => {
  if (!Array.isArray(data)) { console.error('[OutreachEngine] state:save blocked — data is not an array'); return; }
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  // Rotate current save to backup before overwriting
  if (fs.existsSync(LEADS_FILE)) fs.copyFileSync(LEADS_FILE, LEADS_BACKUP);
  fs.writeFileSync(LEADS_FILE, JSON.stringify(data, null, 2), 'utf-8');
});

ipcMain.handle('state:load', async () => {
  // app.getPath('userData') must be called inside the handler (app is ready by then)
  const LEGACY_FILE = path.join(app.getPath('userData'), 'leads_state.json');
  // Try primary file first, then backup, then legacy userData path
  for (const filePath of [LEADS_FILE, LEADS_BACKUP, LEGACY_FILE]) {
    if (fs.existsSync(filePath)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        if (Array.isArray(parsed)) {
          if (parsed.length === 0) {
            console.warn(`[OutreachEngine] state:load — ${path.basename(filePath)} is an empty array, trying next source...`);
            continue;  // Skip empty arrays, try backup/legacy
          }
          // If loaded from backup or legacy, migrate to primary location
          if (filePath !== LEADS_FILE) {
            console.log(`[OutreachEngine] state:load — recovered ${parsed.length} leads from ${path.basename(filePath)}`);
            if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
            fs.writeFileSync(LEADS_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
          }
          return parsed;
        }
      } catch (e) {
        console.error(`[OutreachEngine] state:load — ${path.basename(filePath)} corrupted:`, e.message);
      }
    }
  }
  console.warn('[OutreachEngine] state:load — no valid leads file found');
  return null;
});

ipcMain.handle('templates:readFile', async (event, relativePath) => {
  const safeRel = String(relativePath || '').replace(/\.\./g, '').replace(/^[\\/]/, '');
  const fullPath = path.join(__dirname, 'templates', safeRel);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath, 'utf-8');
});

function normalizeTargetUrl(urlStr) {
  let target = String(urlStr || '').trim();
  if (!target.startsWith('http')) target = 'https://' + target;
  return target;
}

function getUrlCandidates(urlStr) {
  const first = normalizeTargetUrl(urlStr);
  const candidates = [first];
  try {
    const u = new URL(first);
    if (!u.hostname.startsWith('www.')) {
      const withWww = new URL(u.href);
      withWww.hostname = 'www.' + u.hostname;
      candidates.push(withWww.href);
    } else {
      const withoutWww = new URL(u.href);
      withoutWww.hostname = u.hostname.replace(/^www\./, '');
      candidates.push(withoutWww.href);
    }
  } catch (e) {}
  return [...new Set(candidates)];
}

function compactText(text) {
  return String(text || '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function stripAnimatedZeroStats(text) {
  return String(text || '').replace(
    /\b0\s*\+?(?:\s+\w+){0,3}\s+(?:million|billion|thousand|years?|months?|days?|weeks?|hours?|customers?|users?|projects?|clients?|countries|brands?|hotels?|properties|locations?|stores?|partners?|banks?|orders?|sales?|reviews?|cities|markets?|languages?|awards?|stories|members?|installations?|deployments?|implementations?)\b(?:\s+\w+){0,5}/gi,
    ' '
  ).replace(/\s+/g, ' ').trim();
}

function buildScraperNotes(sourceHtml, visibleText, media = {}) {
  const notes = [];
  const counterUnitRe = /\b0\s*\+?\s*(?:million|billion|thousand|years?|months?|days?|weeks?|hours?|customers?|users?|projects?|clients?|countries|brands?|hotels?|properties|locations?|stores?|partners?|banks?|orders?|sales?|reviews?|cities|markets?|languages?|awards?|stories|members?|installations?|deployments?|implementations?)\b/gi;
  const zeroTagCount = sourceHtml ? ((sourceHtml.match(/>\s*0\s*<\/[a-z][a-z0-9]*>/gi) || []).length) : 0;
  const counterPhraseCount = (visibleText.match(counterUnitRe) || []).length;
  if ((zeroTagCount >= 4 && counterPhraseCount >= 3) || media.animatedCounterHints > 0) {
    notes.push('[SCRAPER NOTE: This site appears to use animated stat counters. Zero-valued stat phrases have been stripped or should be ignored. Do NOT cite any specific numeric stats unless the rendered text shows the final non-zero value clearly.]');
  }

  const wordCount = visibleText.split(/\s+/).filter(Boolean).length;
  const lowerBody = visibleText.toLowerCase();
  const placeholderPhrases = ['launching soon', 'coming soon', 'site under construction', 'under construction', 'be back soon', 'site under maintenance', 'stay tuned', 'launching shortly', 'we are coming'];
  const placeholderHits = placeholderPhrases.filter(p => lowerBody.includes(p)).length;
  const wordTokens = lowerBody.match(/\b[a-z]{4,}\b/g) || [];
  const wordFreq = {};
  wordTokens.forEach(w => { wordFreq[w] = (wordFreq[w] || 0) + 1; });
  const maxRepeat = Math.max(0, ...Object.values(wordFreq));
  const dominantRatio = wordTokens.length ? maxRepeat / wordTokens.length : 0;
  if ((placeholderHits >= 1 && wordCount < 250) || (maxRepeat >= 5 && dominantRatio > 0.15 && wordCount < 300)) {
    notes.push('[SCRAPER NOTE: Site appears to be a placeholder, launching-soon, or under-construction page. Do NOT invent specific details from sparse text.]');
  }
  if (media.videoCount || media.canvasCount || media.animatedElementCount) {
    notes.push(`[RENDERED MEDIA NOTE: Detected ${media.videoCount || 0} video element(s), ${media.canvasCount || 0} canvas element(s), and ${media.animatedElementCount || 0} animated/transitioning element(s). Treat video/animation content as present but unreadable unless nearby text or alt labels describe it.]`);
  }
  return notes;
}

async function renderPageSnapshot(url) {
  const win = new BrowserWindow({
    show: false,
    width: 1365,
    height: 1800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  try {
    await Promise.race([
      win.loadURL(url, { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36' }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Rendered load timeout')), 18000))
    ]);
    await new Promise(resolve => setTimeout(resolve, 2500));

    return await win.webContents.executeJavaScript(`
      (() => {
        const clean = (s) => String(s || '').replace(/\\s+/g, ' ').trim();
        const meta = (name) => {
          const el = document.querySelector('meta[name="' + name + '"], meta[property="' + name + '"]');
          return el ? clean(el.getAttribute('content')) : '';
        };
        const visible = (el) => {
          if (!el) return false;
          const style = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          return style && style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0;
        };
        const textOf = (sel, max = 80) => Array.from(document.querySelectorAll(sel))
          .filter(visible).map(el => clean(el.innerText || el.textContent)).filter(Boolean).slice(0, max);
        const sameOriginLinks = Array.from(document.querySelectorAll('a[href]'))
          .filter(visible)
          .map(a => {
            try {
              const u = new URL(a.href, location.href);
              return { text: clean(a.innerText || a.getAttribute('aria-label') || a.title || ''), href: u.href, origin: u.origin };
            } catch(e) { return null; }
          })
          .filter(Boolean);
        const media = {
          videoCount: document.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="vimeo"]').length,
          canvasCount: document.querySelectorAll('canvas').length,
          animatedElementCount: Array.from(document.querySelectorAll('body *')).filter(el => {
            const s = window.getComputedStyle(el);
            return s && ((s.animationName && s.animationName !== 'none') || (s.transitionDuration && s.transitionDuration !== '0s'));
          }).length,
          animatedCounterHints: document.body.innerText.match(/\\b0\\s*\\+?\\s*(years?|clients?|projects?|customers?|countries|brands?|hotels?|properties|locations?)\\b/gi)?.length || 0,
          imageAltText: Array.from(document.images).map(img => clean(img.alt)).filter(Boolean).slice(0, 40)
        };
        const bodyClone = document.body.cloneNode(true);
        bodyClone.querySelectorAll('script, style, noscript, template, svg').forEach(n => n.remove());
        return {
          url: location.href,
          title: clean(document.title),
          description: meta('description') || meta('og:description'),
          siteName: meta('og:site_name'),
          headings: textOf('h1,h2,h3', 120),
          buttons: textOf('button, [role="button"], input[type="submit"], a.btn, a.button', 80),
          links: sameOriginLinks,
          media,
          text: clean(bodyClone.innerText || bodyClone.textContent || '')
        };
      })();
    `);
  } finally {
    if (!win.isDestroyed()) win.destroy();
  }
}

function scoreInternalLink(link, origin) {
  if (!link || link.origin !== origin) return -1;
  const href = (link.href || '').toLowerCase();
  const text = (link.text || '').toLowerCase();
  if (!href || href.includes('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return -1;
  if (/\.(pdf|jpg|jpeg|png|gif|webp|zip|docx?|xlsx?)($|\?)/i.test(href)) return -1;
  if (/(privacy|terms|cookie|login|signin|cart|checkout|facebook|instagram|linkedin|twitter|youtube)/i.test(href)) return -1;
  let score = 0;
  const combined = href + ' ' + text;
  [
    [/about|story|company|who-we-are/, 90],
    [/services|solutions|what-we-do|capabilities|expertise/, 85],
    [/products|brands|properties|portfolio|work|projects|case-stud/, 80],
    [/partner|partnership|franchise|invest|owners|developers/, 75],
    [/contact|book|demo|enquir|inquir|get-started/, 60]
  ].forEach(([re, points]) => { if (re.test(combined)) score += points; });
  if (text.length > 2 && text.length < 40) score += 5;
  return score;
}

function combineRenderedSnapshots(snapshots, sourceHtml = '') {
  const chunks = [];
  const allNotes = [];
  const seenLines = new Set();
  snapshots.forEach((snap, idx) => {
    const text = stripAnimatedZeroStats(compactText(snap.text || ''));
    buildScraperNotes(sourceHtml, text, snap.media || {}).forEach(n => { if (!allNotes.includes(n)) allNotes.push(n); });
    const lines = text.split(/(?<=[.!?])\s+|\n+/).map(compactText).filter(Boolean);
    const deduped = [];
    lines.forEach(line => {
      const key = line.toLowerCase();
      if (key.length < 4 || seenLines.has(key)) return;
      seenLines.add(key);
      deduped.push(line);
    });
    chunks.push([
      `--- RENDERED PAGE ${idx + 1}: ${snap.url} ---`,
      snap.title && `Title: ${snap.title}`,
      snap.siteName && `Site Name: ${snap.siteName}`,
      snap.description && `Description: ${snap.description}`,
      snap.headings?.length && `Visible Headings: ${snap.headings.join(' | ')}`,
      snap.buttons?.length && `Visible Buttons / Next Steps: ${snap.buttons.join(' | ')}`,
      snap.media?.imageAltText?.length && `Image Alt Text: ${snap.media.imageAltText.join(' | ')}`,
      deduped.slice(0, idx === 0 ? 220 : 120).join(' ')
    ].filter(Boolean).join('\n'));
  });
  return [
    '[SCRAPER METHOD: Rendered browser extraction. The app loaded the site with JavaScript enabled, waited for client-rendered text, extracted visible text layers, headings, buttons, links, image alt text, and media/animation signals across the homepage plus key internal pages. Video/canvas/animation content is detected but not interpreted unless text describes it.]',
    allNotes.join('\n'),
    chunks.join('\n\n')
  ].filter(Boolean).join('\n\n').substring(0, 30000);
}

async function scrapeRenderedSite(urlStr) {
  const target = normalizeTargetUrl(urlStr);
  const origin = new URL(target).origin;
  const home = await renderPageSnapshot(target);
  const chosen = [];
  const seen = new Set([home.url.replace(/\/$/, '')]);
  (home.links || [])
    .map(link => ({ link, score: scoreInternalLink(link, origin) }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .forEach(item => {
      const key = item.link.href.replace(/\/$/, '');
      if (chosen.length >= 4 || seen.has(key)) return;
      seen.add(key);
      chosen.push(item.link.href);
    });

  const snapshots = [home];
  for (const href of chosen) {
    try {
      const snap = await renderPageSnapshot(href);
      if (snap && snap.text && snap.text.length > 80) snapshots.push(snap);
    } catch (e) {
      console.warn('[OutreachEngine] Rendered subpage scrape failed:', href, e.message);
    }
  }
  return combineRenderedSnapshots(snapshots);
}

async function scrapeStaticSite(urlStr) {
  const target = normalizeTargetUrl(urlStr);
  const html = await fetchHtml(target);
  const getMeta = (name) => {
    const m = html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'))
              || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["']`, 'i'));
    return m ? m[1].trim() : '';
  };
  const title = (html.match(/<title[^>]*>([^<]+)<\/title>/i) || [])[1] || '';
  const desc = getMeta('description') || getMeta('og:description');
  const ogTitle = getMeta('og:title');
  const ogSiteName = getMeta('og:site_name');
  const bodyText = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const cleanBody = stripAnimatedZeroStats(bodyText);
  const notes = buildScraperNotes(html, cleanBody);
  const meta = [
    '[SCRAPER METHOD: Static HTML fallback. Rendered extraction failed or returned too little text.]',
    ...notes,
    title && `Title: ${title}`,
    ogTitle && ogTitle !== title && `OG Title: ${ogTitle}`,
    ogSiteName && `Site Name: ${ogSiteName}`,
    desc && `Description: ${desc}`
  ].filter(Boolean).join('\n');
  return (meta + '\n\n' + cleanBody).substring(0, 12000);
}

ipcMain.handle('scrape:url', async (event, urlStr) => {
  const candidates = getUrlCandidates(urlStr);
  let lastError = null;

  for (const candidate of candidates) {
    try {
      const rendered = await scrapeRenderedSite(candidate);
      const renderedWords = rendered.split(/\s+/).filter(Boolean).length;
      if (rendered && renderedWords > 120) return rendered;
      console.warn('[OutreachEngine] Rendered scrape too thin, falling back to static scrape:', candidate);
    } catch (error) {
      lastError = error;
      console.error('Rendered scrape error:', candidate, error);
    }

    try {
      return await scrapeStaticSite(candidate);
    } catch (fallbackError) {
      lastError = fallbackError;
      console.error('Static scrape fallback error:', candidate, fallbackError);
    }
  }

  console.error('Scrape failed for all URL candidates:', candidates, lastError);
  return null;
});

function fetchHtml(url, redirectCount = 0) {
  if (redirectCount > 5) return Promise.reject(new Error('Too many redirects'));
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const options = {
      rejectUnauthorized: false,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate',
        'Cache-Control': 'max-age=0',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
      }
    };
    const req = client.get(url, options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const next = res.headers.location.startsWith('http') ? res.headers.location : new URL(res.headers.location, url).href;
        res.resume();
        return resolve(fetchHtml(next, redirectCount + 1));
      }
      // Reject 4xx/5xx — don't pass error pages to the AI
      if (res.statusCode >= 400) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode} from ${url}`));
      }
      const encoding = res.headers['content-encoding'];
      let stream = res;
      if (encoding === 'gzip') stream = res.pipe(zlib.createGunzip());
      else if (encoding === 'deflate') stream = res.pipe(zlib.createInflate());
      const chunks = [];
      stream.on('data', chunk => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      stream.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}
ipcMain.handle('open:external', async (event, url) => {
  shell.openExternal(url);
});

ipcMain.handle('ai:call', async (event, { url, method, headers, body }) => {
  try {
    const init = { method: method || 'POST', headers };
    const upperMethod = (init.method || '').toUpperCase();
    if (body !== undefined && upperMethod !== 'GET' && upperMethod !== 'HEAD') {
      init.body = JSON.stringify(body);
    }
    const response = await fetch(url, init);
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('Main process AI call error:', error);
    return { ok: false, error: error.message };
  }
});
