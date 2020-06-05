const AutoLaunch = require('auto-launch');
const {getSettings} = require('./configuration')

const wallpaperLauncher = new AutoLaunch({
  name: 'wallpaper'
})

function process() {
  // const isAuto = getSettings('autoLaunch')
  // if (isAuto) {
  //   enable()
  // }
  // else {
  //   disable()
  // }
}

function enable() {
  wallpaperLauncher.enable()
  wallpaperLauncher.isEnabled()
  .then(function (isEnabled) {
    if (isEnabled) {
      return;
    }
    wallpaperLauncher.enable();
  })
}

function disable() {
  wallpaperLauncher.disable()
  wallpaperLauncher.isEnabled()
  .then(function (isEnabled) {
    if (!isEnabled) {
      return;
    }
    wallpaperLauncher.disable();
  })
}

module.exports = {
  enable: enable,
  disable: disable,
  process: process
}