
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "OTAĞ HUB - SSB Teknoloji Yönetimi",
    icon: path.join(__dirname, 'public/favicon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  // Geliştirme aşamasında localhost'u, production'da build edilmiş dosyayı yükle
  const startUrl = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, 'dist/index.html')}`;

  win.loadURL(startUrl);

  // Menü çubuğunu gizle (isteğe bağlı)
  // win.setMenuBarVisibility(false);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
