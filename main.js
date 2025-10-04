const { app, BrowserWindow } = require('electron/main');
const path = require('path');

const createWindow = () => {
  const win = new BrowserWindow({
    width: 500,
    height: 750,
    autoHideMenuBar: true, 
    icon: path.join(__dirname, "assets/images/icon.ico")
  })

  win.loadFile('index.html')
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