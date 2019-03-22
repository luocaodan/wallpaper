import nconf from 'nconf'
import {app, remote} from 'electron'
import path from 'path'

const APP = process.type === 'renderer' ? remote.app : app;

nconf.file({
  file: path.join(
    APP.getPath('home'),
    '.wallpaper.json'
  )
})

function saveSettings(key, value) {
  nconf.set(key, value);
  nconf.save();
}

function getSettings(key) {
  nconf.load();
  return nconf.get(key);
}

export {saveSettings, getSettings}