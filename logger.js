const fs = require('fs')
const path = require('path')
const zlib = require('zlib')
const {app, Notification, shell} = require('electron')

const logPath = path.join(app.getPath('userData'), 'log.txt');

module.exports = class Logger {
  static error(msg) {
    const message = `[${new Date().toLocaleString()}] Error: ${msg}`;
    console.error(message);
    this.writeLine(message)
  }

  static log(msg) {
    const message = `[${new Date().toLocaleString()}] Info: ${msg}`;
    console.log(message);
    this.writeLine(message)
  }

  static writeLine(msg) {
    fs.writeFile(logPath, msg + '\n', {flag: 'a'}, (err) => {
      if (err) {
        console.error('write file error');
      }
    })
  }

  static packLogs() {
    const gzip = zlib.createGzip();
    const is = fs.createReadStream(logPath);
    const desktop = app.getPath('desktop');
    const gzipLogPath = path.join(desktop, 'log.txt.gz');
    const os = fs.createWriteStream(gzipLogPath);
    const gzipStream = is.pipe(gzip);
    gzipStream.pipe(os);
    gzipStream.on('end', () => {
      const notification = new Notification({
        title: '日志已打包',
        body: '日志文件 log.txt.gz'
      });
      notification.show();
      // 打开桌面文件夹
      shell.showItemInFolder(gzipLogPath);
    })
  }
}

