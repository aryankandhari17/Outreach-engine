const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const zlib = require('zlib');
const { autoUpdater } = require('electron-updater');

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

app.whenReady().then(() => {
  createWindow();
  setupAutoUpdater();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

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

ipcMain.handle('scrape:url', async (event, urlStr) => {
  try {
    let target = urlStr;
    if (!target.startsWith('http')) {
      target = 'https://' + target;
    }
    const html = await fetchHtml(target);

    // Extract structured metadata (always present even on JS-rendered sites)
    const getMeta = (name) => {
      const m = html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'))
                || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["']`, 'i'));
      return m ? m[1].trim() : '';
    };
    const title = (html.match(/<title[^>]*>([^<]+)<\/title>/i) || [])[1] || '';
    const desc = getMeta('description') || getMeta('og:description');
    const ogTitle = getMeta('og:title');
    const ogSiteName = getMeta('og:site_name');

    // Extract JSON-LD structured data (rich product/org info)
    const jsonLdBlocks = [];
    const jsonLdRe = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let jm;
    while ((jm = jsonLdRe.exec(html)) !== null && jsonLdBlocks.length < 3) {
      try { jsonLdBlocks.push(JSON.stringify(JSON.parse(jm[1]))); } catch(e) {}
    }

    // Strip scripts/styles and get visible body text
    const bodyText = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const meta = [
      title && `Title: ${title}`,
      ogTitle && ogTitle !== title && `OG Title: ${ogTitle}`,
      ogSiteName && `Site Name: ${ogSiteName}`,
      desc && `Description: ${desc}`,
      jsonLdBlocks.length && `Structured Data: ${jsonLdBlocks.join(' | ')}`
    ].filter(Boolean).join('\n');

    const combined = (meta ? meta + '\n\n' : '') + bodyText;
    return combined.substring(0, 6000);
  } catch (error) {
    console.error('Scrape error:', error);
    return null;
  }
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
