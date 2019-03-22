import ImagesService from "../services/images_service";
import wallpaper from 'wallpaper'
import {getSettings} from "../../configuration";
import db from '../../datastore'
import Logger from "../../logger";
import fs from 'fs';
import path from 'path'

export default class ImageChanger {
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
    for (let category of categories) {
      this.imagesServices.push(
        new ImagesService(category, db.read(`${category}:cnt`))
      );
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

  change() {
    if (this.setting) {
      return;
    }
    Logger.log('changer start');
    const randIndex = Math.floor(Math.random() * this.imagesServices.length);
    this.imagesServices[randIndex].getNextImage()
      .then((filepath) => {
        this.setting = true;
        Logger.log('setting wallpaper: ' + filepath)
        this.currentFilePath = filepath;
        db.set('currentFilePath', filepath);
        return wallpaper.set(filepath)
      })
      .then(() => {
        this.setting = false;
        Logger.log('changer end')
      })
      .catch(e => {
        Logger.error(e);
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
}
