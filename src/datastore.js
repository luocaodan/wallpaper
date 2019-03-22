import path from 'path'
import { app, remote } from 'electron'
import nconf from "nconf";

const APP = process.type === 'renderer' ? remote.app : app;
const store = new nconf.Provider();
store.file({
  file: path.join(APP.getPath('userData'), 'data.json')
});

function read(key) {
  store.load();
  return store.get(key);
}

function set(key, value) {
  store.set(key, value);
  store.save();
}

export default { read, set }
