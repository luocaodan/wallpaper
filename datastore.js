const path = require('path')
const {app} = require('electron')
const nconf = require("nconf");

function read(key) {
  nconf.file({
    file: path.join(app.getPath('userData'), 'data.json')
  });
  nconf.load();
  return nconf.get(key);
}

function set(key, value) {
  nconf.file({
    file: path.join(app.getPath('userData'), 'data.json')
  });
  nconf.set(key, value);
  nconf.save()
}

module.exports.read = read
module.exports.set = set
