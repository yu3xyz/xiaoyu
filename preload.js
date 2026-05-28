const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  getPosition: () => ipcRenderer.invoke('get-position'),
  savePosition: (pos) => ipcRenderer.invoke('save-position', pos),
  setIgnoreMouseEvents: (ignore) => ipcRenderer.invoke('set-ignore-mouse-events', ignore),
  onOpenSettings: (callback) => ipcRenderer.on('open-settings', callback),
  windowDrag: (delta) => ipcRenderer.send('window-drag', delta)
});
