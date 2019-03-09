import {app} from 'electron'
import axios from 'axios'
import fs from 'fs'
import path from 'path'

export default class ImageService {
  constructor(category) {
    this.category = category;
    this.endpoint = endpointMap[category];
    this.count = 0;
    this.prePath = ''
  }

  getNextImage() {
    const dataPath = app.getPath('userData')
    const imgPath = path.join(dataPath, 'wallpapers')
    if (!fs.existsSync(imgPath)) {
      fs.mkdir(imgPath);
    }
    const filename = `${this.category}-${this.count}`;
    const filepath = path.join(imgPath, filename);
    const imagesDataUrl = this.getImagesDataUrl();
    return this.getImagesData(imagesDataUrl)
      .then((res) => {
        return res.data
      })
      .then(data => {
        const wallpapers = data.res.wallpaper;
        const index = this.count % 20;
        const imgId = wallpapers[index].id;
        return this.getImage(imgId);
      })
      .then(res => {
        const reader = res.data;
        reader.pipe(fs.createWriteStream(filepath))
        return new Promise((resolve, reject) => {
          reader.on('end', () => {
            this.count++
            this.deletePrevious();
            this.prePath = filepath;
            resolve(filepath)
          })
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
    if (this.prePath === '') {
      return;
    }
    if (fs.existsSync(this.prePath)) {
      fs.unlink(this.prePath)
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
