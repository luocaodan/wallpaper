const fs = require('fs')
const Logger = require('../logger');

module.exports = class Tool {
  static deleteFile(filepath) {
    if (fs.existsSync(filepath)) {
      fs.unlink(filepath, (err) => {
        if (err) {
          Logger.error(`delete ${filepath} error`)
        }
        else {
          Logger.log(`deleted ${filepath}`)
        }
      });
    }
  }

  static randChoose(array) {
    let randIndex = Math.floor(Math.random() * array.length);
    return [array[randIndex], randIndex];
  }
}