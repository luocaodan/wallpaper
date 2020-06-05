const {app, dialog, ipcMain} = require('electron');
const {categories} = require('./constant.js');
const db = require('./datastore.js')
const imageChanger = require('./tools/image_changer')
const UI = require('./index')
const {getSettings, saveSettings} = require('./configuration')

function initApp() {
  if (!getSettings('imgSrc')) {
    saveSettings('categories', ['美女']);
    saveSettings('imgSrc', 'lovewallpaper');
    saveSettings('interval', 10);
    saveSettings('savePath', require('path').join(app.getPath('pictures'), 'wallpapers'));
    saveSettings('autoLaunch', true)
  }
}

function initDB() {
  if (!db.read('total')) {
    for (let category of categories) {
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
    UI.hideMainWindow();
  })
}

exports.init = function () {
  initApp();
  initDB();
  initIPC();
}