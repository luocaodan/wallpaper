const {app} = require('electron')
const axios = require('axios')
const fs = require('fs')
const path = require('path')
const db = require('../datastore')
const Logger = require("../logger")
const Tool = require("../tools/tool")

const dataPath = app.getPath('userData')
const imgPath = path.join(dataPath, 'wallpapers')

module.exports = class ImageService {
  constructor(category, cnt) {
    this.category = category;
    this.endpoint = endpointMap[category];
    this.count = cnt;
    this.prePath = '';
    // 正在下载的文件
    this.pendings = [];
    this.gettingNext = false;
  }

  getNextImage(isPrevious) {
    if (this.gettingNext) {
      return new Promise((resolve, reject) => {
        reject('concurrent error: downloading');
      })
    }
    if (isPrevious) {
      // 上一张
      this.count -= 2;
      if (this.count < 0) {
        return new Promise((resolve, reject) => {
          reject('previous end')
        })
      }
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
        Logger.log(filepath)
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
      if (!wallpapers.length) {
        return new Promise((resolve, reject) => {
          reject('wallpaper run out');
        })
      }
      const index = this.count % 20;
      const imgId = wallpapers[index].id;
      for (let k = index + 1; k < 20; k++) {
        const filename = `${this.category}-${this.count + k - index}`;
        const sleep = Math.floor(Math.random() * 5);
        setTimeout(() => {
          this.preDownload(
              wallpapers[k].id, path.join(imgPath, filename)
          );
        }, sleep * 1000);
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
      return new Promise((resolve, reject) => {
        reject(filepath);
      })
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
    if (fs.existsSync(filepath)) {
      return;
    }
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
    .catch(e => {
      Logger.error(`predownload error: ${filepath}, deleting`)
      // 删除失败文件
      Tool.deleteFile(filepath);
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
          Tool.deleteFile(delPath);
        }
      }
    }
  }

  isEmpty() {
    return this.count === 0;
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
