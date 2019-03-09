import ImagesService from "../services/images_service";
import wallpaper from 'wallpaper'

export default class {
  constructor(category) {
    const minute = 60 * 1000
    this.imagesService = new ImagesService(category);

    setInterval(() => {
      this.imagesService.getNextImage()
        .then(filepath => {
          wallpaper.set(filepath)
        })
    }, 10 * minute)
  }
}
