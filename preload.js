const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openCSV: () => ipcRenderer.invoke('dialog:openFile'),
  saveCSV: (data) => ipcRenderer.invoke('dialog:saveFile', data),
  scrapeWebsite: (url) => ipcRenderer.invoke('scrape:url', url),
  saveState: (data) => ipcRenderer.invoke('state:save', data),
  loadState: () => ipcRenderer.invoke('state:load'),
  openExternal: (url) => ipcRenderer.invoke('open:external', url),
  aiCall: (params) => ipcRenderer.invoke('ai:call', params)
});
