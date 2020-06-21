const {app} = require('electron');
const {categories} = require('./constant.js');
const db = require('./datastore.js')
const {getSettings, saveSettings} = require('./configuration')

function initSettings() {
  if (!getSettings('imgSrc')) {
    saveSettings('categories', ['美女']);
    saveSettings('imgSrc', 'lovewallpaper');
    saveSettings('interval', 10);
    saveSettings('savePath', require('path').join(app.getPath('pictures'), 'wallpapers'));
    saveSettings('autoLaunch', true)
  }
}

function initDB() {
  const total = db.read('total')
  if (total === undefined) {
    for (let category of categories) {
      db.set(`${category}:cnt`, 0);
    }
    db.set('total', 0);
  }
}



module.exports = {
  initSettings: initSettings,
  initDB: initDB
}