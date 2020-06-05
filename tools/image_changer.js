const ImagesService = require("../services/images_service");
const wallpaper = require('wallpaper')
const {getSettings} = require("../configuration");
const db = require('../datastore')
const Logger = require("../logger")
const fs = require('fs');
const path = require('path')
const Tool = require("./tool");
const UI = require("../index")

class ImageChanger {
  constructor() {
    this.changer = null;
    this.imagesServices = [];
    this.updateInterval();
    this.updateCategories();
    // 是否正在设置壁纸
    this.setting = false;
    this.currentFilePath = null;
  }

  updateCategories() {
    this.resetChanger();
    this.imagesServices = [];
    const categories = getSettings('categories');
    let total = 0;
    for (let category of categories) {
      let cnt = db.read(`${category}:cnt`);
      this.imagesServices.push(
          new ImagesService(category, cnt)
      );
      total += cnt;
    }
    if (total) {
      db.set('total', total);
    }
    this.startChanger();
  }

  updateInterval() {
    this.resetChanger();
    const minute = 60 * 1000;
    this.interval = minute * getSettings('interval');
    this.startChanger();
  }

  startChanger() {
    this.changer = setInterval(() => {
      this.change();
    }, this.interval)
  }

  change(isPrevious = false) {
    if (this.setting) {
      return;
    }
    const total = db.read('total');
    if (total === 0) {
      UI.disablePreviousImage();
      return;
    }
    Logger.log('changer start');
    const indexs = Array.from({length: this.imagesServices.length},
        (v, k) => k);
    let [randIndex, chooseIndex] = Tool.randChoose(indexs);
    if (isPrevious) {
      // 查找 count 不为 0 的分类
      while (this.imagesServices[randIndex].isEmpty()) {
        indexs.splice(chooseIndex, 1);
        [randIndex, chooseIndex] = Tool.randChoose(indexs);
      }
    }
    this.imagesServices[randIndex].getNextImage(isPrevious)
    .then((filepath) => {
      this.setting = true;
      Logger.log('setting wallpaper: ' + filepath);
      this.currentFilePath = filepath;
      return wallpaper.set(filepath)
    })
    .then(() => {
      this.setting = false;
      db.set('currentFilePath', this.currentFilePath);
      Logger.log('changer end');
      UI.enablePreviousImage();
      let tmp = db.read('total');
      tmp = isPrevious ? tmp - 1 : tmp + 1;
      db.set('total', tmp);
    })
    .catch(e => {
      if (e.startsWith('concurrent')) {
        Logger.error(e);
        return;
      }
      if (e.startsWith('previous')) {
        return;
      }
      if (e.startsWith('wallpaper')) {
        Logger.error(e);
        return;
      }
      // 删除失败文件
      Logger.error(`download or set ${this.currentFilePath} error, deleting...`)
      const filepath = e;
      Tool.deleteFile(filepath);
      Logger.log('changer end');
    })
  }

  resetChanger() {
    if (this.changer) {
      clearInterval(this.changer);
    }
  }

  saveCurrentImage() {
    if (!this.currentFilePath) {
      this.currentFilePath = db.read('currentFilePath');
      if (!this.currentFilePath) {
        return;
      }
    }
    const savePath = getSettings('savePath');
    if (!fs.existsSync(savePath)) {
      fs.mkdirSync(savePath);
    }
    const filename = path.basename(this.currentFilePath);
    const dest = path.join(savePath, `${filename}.jpg`)
    if (!fs.existsSync(dest)) {
      fs.copyFileSync(this.currentFilePath, dest);
    }
  }

  nextImage() {
    this.resetChanger();
    this.change();
    this.startChanger();
  }

  previousImage() {
    this.resetChanger();
    this.change(true);
    this.startChanger();
  }
}

module.exports = new ImageChanger()
