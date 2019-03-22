import {app} from 'electron'
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import db from '../../datastore'
import {getSettings} from "../../configuration";
import Logger from "../../logger";

const dataPath = app.getPath('userData')
const imgPath = path.join(dataPath, 'wallpapers')

export default class ImageService {
  constructor(category, cnt) {
    this.category = category;
    this.endpoint = endpointMap[category];
    this.count = cnt;
    this.prePath = ''
    // 正在下载的文件
    this.pendings = [];
    this.gettingNext = false;
  }

  getNextImage() {
    if (this.gettingNext) {
      return new Promise((resolve, reject) => {
        reject('downloading');
      })
    }
    if (!fs.existsSync(imgPath)) {
      fs.mkdirSync(imgPath);
    }
    const filename = `${this.category}-${this.count}`;
    const filepath = path.join(imgPath, filename);
    if (fs.existsSync(filepath) && !this.pendings.includes(filepath)) {
      Logger.log('hit: ' + filepath)
      return new Promise((resolve, reject) => {
        this.iterateNext(filepath)
        resolve(filepath);
      })
    }
    Logger.log('downloading: ' + filepath)
    this.gettingNext = true;
    const imagesDataUrl = this.getImagesDataUrl();
    return this.getImagesData(imagesDataUrl)
      .then((res) => {
        return res.data
      })
      .then(data => {
        const wallpapers = data.res.wallpaper;
        const index = this.count % 20;
        const imgId = wallpapers[index].id;
        if (getSettings('preDownload')) {
          for (let k = index + 1;k < 20;k++) {
            const filename = `${this.category}-${this.count+k-index}`;
            const sleep = Math.floor(Math.random() * 5);
            setTimeout(() => {
              this.preDownload(
                wallpapers[k].id, path.join(imgPath, filename)
              );
            }, sleep * 1000);
          }
        }
        return this.getImage(imgId);
      })
      .then(res => {
        const reader = res.data;
        reader.pipe(fs.createWriteStream(filepath))
        return new Promise((resolve, reject) => {
          reader.on('end', () => {
            this.gettingNext = false;
            this.iterateNext(filepath)
            resolve(filepath)
          })
        })
      })
      .catch(e => {
        this.gettingNext = false;
        Logger.error(e);
      })
  }

  iterateNext(filepath) {
    this.count++
    db.set(`${this.category}:cnt`, this.count)
    this.deletePrevious();
    this.prePath = filepath;
  }

  preDownload(imgId, filepath) {
    Logger.log('predownloading: ' + filepath);
    this.pendings.push(filepath);
    this.getImage(imgId)
      .then(res => {
        const reader = res.data;
        reader.pipe(fs.createWriteStream(filepath))
        reader.on('end', () => {
          const pIndex = this.pendings.findIndex((i) => i === filepath);
          this.pendings.splice(pIndex, 1);
        })
      })
  }

  getImageList(seq) {
    const dataUrl = `${this.endpoint}?skip=${seq * 20}`;
    return this.getImagesData(dataUrl);
  }

  getImagesData(imagesDataUrl) {
    return axios.get(imagesDataUrl, {
      headers: {
        'User-Agent': 'picasso,170,windows'
      }
    })
  }

  getImage(id) {
    const imgUrl = `http://img.aibizhi.adesk.com/${id}`;
    return axios.get(imgUrl, {
      responseType: 'stream'
    })
  }

  getImagesDataUrl() {
    const skip = Math.round(this.count / 20) * 20;
    return `${this.endpoint}?skip=${skip}`;
  }

  deletePrevious() {
    const files = fs.readdirSync(imgPath);
    for (let file of files) {
      if (file.startsWith(`${this.category}-`)) {
        const cnt = parseInt(file.split('-')[1]);
        if (cnt < this.count - 2) {
          const delPath = path.join(imgPath, file);
          fs.unlink(delPath);
          Logger.log('deleted: ' + delPath);
        }
      }
    }
  }
}

const endpointMap = {}
let count = 0;
const urlFmt = () => {
  return `http://service.aibizhi.adesk.com/v1/wallpaper/category/4e4d610cdf714d296600000${count++}/wallpaper`
}

const categories = [
  '美女', '动物', '风景', '动漫',
  '卡通', '机械', '男人', '游戏'
]
for (let category of categories) {
  endpointMap[category] = urlFmt();
}
