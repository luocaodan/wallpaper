const {app, Menu, Tray, BrowserWindow, nativeImage, powerSaveBlocker, ipcMain} = require('electron')
const {initDB} = require('./init.js')
const imageChanger = require('./tools/image_changer')
const autoLaunch = require('./auto_lanuch')
const Logger = require("./logger")
const path = require('path')

const id = powerSaveBlocker.start('prevent-app-suspension')
powerSaveBlocker.stop(id)

// 系统托盘
let mainWindow
let contextMenu
let tray
function createWindow() {
  mainWindow = new BrowserWindow({
    height: 500,
    useContentSize: true,
    width: 800,
    webPreferences: {
      nodeIntegration: true
    },
    frame: false,
    show: false,
    icon: './static/img/icon.png'
  })

  if (process.platform === 'darwin') {
    app.dock.setIcon(path.join(__dirname, 'static/img/icon.png'))
  }

  mainWindow.loadFile("index.html")

  mainWindow.on('ready-to-show', () => {
    hideDock()
  })

  mainWindow.on('close', (event) => {
    event.preventDefault()
    hideMainWindow()
  })

  mainWindow.on('show', () => {
    showDock()
  })
  mainWindow.on('hide', () => {
    hideDock()
  })
}

function showMainWindow() {
  mainWindow.setSkipTaskbar(false)
  mainWindow.show()
}

function hideMainWindow() {
  mainWindow.hide()
  mainWindow.setSkipTaskbar(true)
  hideDock()
}

function showDock() {
  if (process.platform === 'darwin') {
    app.dock.setIcon(path.join(__dirname, 'static/img/icon.png'))
    app.dock.show()
  }
}

function hideDock() {
  if (process.platform === 'darwin') {
    app.dock.hide()

  }
}

function createTray() {
  const trayPath = path.join(__dirname, 'static/img/tray.png');
  const image = nativeImage.createFromPath(trayPath);
  image.setTemplateImage(true)
  tray = new Tray(image)
  contextMenu = Menu.buildFromTemplate([
    { label: '设置', click: () => showMainWindow() },
    { label: '上一张', click: () => imageChanger.previousImage() },
    { label: '下一张', click: () => imageChanger.nextImage() },
    { label: '保存当前壁纸', click: () => imageChanger.saveCurrentImage() },
    { label: '打包日志', click: () => Logger.packLogs() },
    { label: '退出', click: () => app.exit(0) },
  ])

  tray.setToolTip("wallpaper")
  tray.setContextMenu(contextMenu)
  tray.on('click', () => {
    const visible = mainWindow.isVisible();
    visible ? mainWindow.hide() : mainWindow.show()
    mainWindow.setSkipTaskbar(!visible)
  })
}

app.on('ready', () => {
  initDB()
  initIPC()
  createTray()
  createWindow()
  // 是否开机启动
  autoLaunch.process()
})

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

exports.hideMainWindow = hideMainWindow

exports.disablePreviousImage = function () {
  contextMenu.items[1].enabled = false;
  tray.setContextMenu(contextMenu);
}

exports.enablePreviousImage = function () {
  if (contextMenu.items[1].enabled) {
    return;
  }
  contextMenu.items[1].enabled = true;
  tray.setContextMenu(contextMenu);
}


