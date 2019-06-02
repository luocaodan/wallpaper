import {app, Menu, Tray, BrowserWindow, nativeImage, ipcMain, dialog} from 'electron'
import ImageChanger from './tools/image_changer'
import AutoLaunch from 'auto-launch'
import {getSettings, saveSettings} from "../configuration";
import db from '../datastore';
import Constant from "../constant";
import Logger from "../logger";

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

// 省电拦截
const { powerSaveBlocker } = require('electron')

const id = powerSaveBlocker.start('prevent-app-suspension')
powerSaveBlocker.stop(id)

// 系统托盘

let mainWindow
let contextMenu
let tray
let imageChanger
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
    frame: false,
    show: false,
    icon: nativeImage.createFromPath(
      require('path').join(__static, 'tray.png')
    )
  })

  mainWindow.loadURL(winURL)

  mainWindow.on('ready-to-show', () => {
    // do nothing
  })

  mainWindow.on('close', (event) => {
    event.preventDefault()
    hideMainWindow()
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

function hideMainWindow() {
  mainWindow.hide()
  mainWindow.setSkipTaskbar(true)
}

function navigate(route) {
  showMainWindow();
  mainWindow.webContents.send('navigate', route);
}

function createTray() {
  tray = new Tray(require('path').join(__static, 'tray.png'))
  contextMenu = Menu.buildFromTemplate([
    // { label: '显示', click: () => showMainWindow() },
    { label: '设置', click: () => navigate('/settings') },
    { label: '上一张', click: () => imageChanger.previousImage() },
    { label: '下一张', click: () => imageChanger.nextImage() },
    { label: '保存当前壁纸', click: () => imageChanger.saveCurrentImage() },
    { label: '打包日志', click: () => Logger.packLogs() },
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

export function disablePreviousImage() {
  contextMenu.items[1].enabled = false;
  tray.setContextMenu(contextMenu);
}

export function enablePreviousImage() {
  if (contextMenu.items[1].enabled) {
    return;
  }
  contextMenu.items[1].enabled = true;
  tray.setContextMenu(contextMenu);
}

function initApp() {
  if (!getSettings('imgSrc')) {
    saveSettings('categories', ['美女']);
    saveSettings('imgSrc', 'lovewallpaper');
    saveSettings('interval', 10);
    saveSettings('savePath', require('path').join(app.getPath('pictures'), 'wallpapers'));
    saveSettings('preDownload', true);
  }
}

function initDB() {
  if (!db.read('total')) {
    for (let category of Constant.Categories) {
      db.set(`${category}:cnt`, 0);
    }
    db.set('total', 1);
  }
}

function initIPC() {
  ipcMain.on('updateCategories', () => {
    imageChanger.updateCategories();
  });
  ipcMain.on('updateInterval', () => {
    imageChanger.updateInterval();
  })
  ipcMain.on('openDirDialog', (event) => {
    dialog.showOpenDialog({
      properties: ['openDirectory']
    }, (filePaths => {
      if (filePaths) {
        event.sender.send('openedDir', filePaths[0]);
      }
    }))
  })
  ipcMain.on('closeSettings', () => {
    hideMainWindow();
  })
}

app.on('ready', () => {
  initApp()
  initDB()
  imageChanger = new ImageChanger();
  createTray()
  createWindow()
  initIPC()
})

if (process.env.NODE_ENV !== 'development') {
  // auto launch
  const wallpaperLauncher = new AutoLaunch({
    name: 'wallpaper'
  })

  wallpaperLauncher.enable()

  wallpaperLauncher.isEnabled()
    .then(function (isEnabled) {
      if (isEnabled) {
        return;
      }
      wallpaperLauncher.enable();
    })
  // .catch(function(err){
  //   handle error
  // });
}

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
