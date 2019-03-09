import ImagesService from "../services/images_service";
import wallpaper from 'wallpaper'

export default class {
  constructor(category) {
    this.imagesService = new ImagesService(category);
    setInterval(() => {
      this.imagesService.getNextImage()
        .then(filepath => {
          wallpaper.set(filepath)
        })
    }, 3000)
  }
}
