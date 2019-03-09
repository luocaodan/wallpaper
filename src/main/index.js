import {app, Menu, Tray, BrowserWindow} from 'electron'
import ImageChanger from './tools/image_changer'
import AutoLaunch from 'auto-launch'

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

// 系统托盘

let mainWindow
let tray
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

function createWindow() {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 600,
    useContentSize: true,
    width: 900,
    // frame: false,
    show: false,
  })

  mainWindow.loadURL(winURL)

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('close', (event) => {
    event.preventDefault()
    mainWindow.hide()
    mainWindow.setSkipTaskbar(true)
  })

  mainWindow.on('show', () => {
    tray.setHighlightMode('always')
  })
  mainWindow.on('hide', () => {
    tray.setHighlightMode('never')
  })
}

function showMainWindow() {
  mainWindow.setSkipTaskbar(false)
  mainWindow.show()
}

function createTray() {
  tray = new Tray(require('path').join(__static, 'tray.png'))
  const contextMenu = Menu.buildFromTemplate([
    { label: '显示', click: () => showMainWindow() },
    { label: '退出', click: () => app.exit(0) },
  ])

  tray.setToolTip("Sirga's Wallpaper")
  tray.setContextMenu(contextMenu)
  tray.on('click', () => {
    const visible = mainWindow.isVisible();
    visible ? mainWindow.hide() : mainWindow.show()
    mainWindow.setSkipTaskbar(!visible)
  })
}

app.on('ready', () => {
  createTray()
  createWindow()
  new ImageChanger('美女')
})

// auto launch
const wallpaperLauncher = new AutoLaunch({
  name: 'wallpaper'
})

wallpaperLauncher.enable()

wallpaperLauncher.isEnabled()
  .then(function(isEnabled){
    if(isEnabled){
      return;
    }
    wallpaperLauncher.enable();
  })
  .catch(function(err){
    // handle error
  });

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
