const { app, BrowserWindow } = require('electron/main')
const path = require('node:path')

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (!app.isPackaged) {
    // Load the local development server
    win.loadURL('http://127.0.0.1:4200');

    // Automatically open DevTools
    win.webContents.openDevTools();
  }
  else {
    // Construct the absolute path to your compiled index.html
    const indexPath = path.join(__dirname, '..', 'frontend', 'dist', 'frontend', 'browser', 'index.html');

    win.loadFile(indexPath);
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
