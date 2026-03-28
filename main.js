const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

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
  return fs.readFileSync(filePaths[0], 'utf-8');
});

ipcMain.handle('dialog:saveFile', async (event, csvData) => {
  const date = new Date().toISOString().split('T')[0];
  const { canceled, filePath } = await dialog.showSaveDialog({
    defaultPath: `labs22-lead-engine-${date}.csv`,
    filters: [{ name: 'CSV', extensions: ['csv'] }]
  });
  if (canceled) return false;
  fs.writeFileSync(filePath, csvData, 'utf-8');
  return true;
});

ipcMain.handle('state:save', async (event, data) => {
  const userDataPath = app.getPath('userData');
  const filePath = path.join(userDataPath, 'leads_state.json');
  fs.writeFileSync(filePath, JSON.stringify(data), 'utf-8');
});

ipcMain.handle('state:load', async () => {
  const userDataPath = app.getPath('userData');
  const filePath = path.join(userDataPath, 'leads_state.json');
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
  return null;
});

ipcMain.handle('scrape:url', async (event, urlStr) => {
  try {
    let target = urlStr;
    if (!target.startsWith('http')) {
      target = 'https://' + target;
    }
    const html = await fetchHtml(target);
    const text = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return text.substring(0, 3000);
  } catch (error) {
    console.error('Scrape error:', error);
    return null;
  }
});

function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { rejectUnauthorized: false }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchHtml(res.headers.location.startsWith('http') ? res.headers.location : new URL(res.headers.location, url).href));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => {
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
    const response = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(body)
    });
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('Main process AI call error:', error);
    return { ok: false, error: error.message };
  }
});
