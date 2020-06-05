const nconf = require('nconf')
const {app, remote} = require('electron')
const path = require('path')

const APP = process.type === 'renderer' ? remote.app : app;

function saveSettings(key, value) {
  nconf.file({
    file: path.join(
        APP.getPath('home'),
        '.wallpaper.json'
    )
  })
  nconf.set(key, value);
  nconf.save();
}

function getSettings(key) {
  nconf.file({
    file: path.join(
        APP.getPath('home'),
        '.wallpaper.json'
    )
  })
  nconf.load();
  return nconf.get(key);
}

exports.saveSettings = saveSettings
exports.getSettings = getSettings