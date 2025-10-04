const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 450,
    height: 620,
    icon: path.join(__dirname, 'build', 'icon.ico'), // custom icon
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,        // keep false for security
      contextIsolation: true,        // keep true for security
      preload: path.join(__dirname, 'preload.js')
    }
  });

  Menu.setApplicationMenu(null); // completely remove default menu
  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
