<template>
  <div class="settings">
    <h1 class="settings-title">设置</h1>
    <el-form ref="settingsForm" :model="settings" label-width="80px">
      <el-form-item label="图片源">
        <el-select v-model="settings.imgSrc" @change="save('imgSrc')">
          <el-option label="爱壁纸" value="lovewallpaper"
                     key="lovewallpaper">
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="图片类别">
        <el-select v-model="settings.categories"
                   @change="save('categories')" multiple>
          <el-option v-for="(category, index) in categories"
                     :value="category" :key="index"
                     :label="category">
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="更换间隔">
        <el-slider v-model="settings.interval"
                   @change="save('interval')" class="interval-slider"
                   :min="1" :max="60" show-input>
        </el-slider>
      </el-form-item>
      <el-form-item label="保存位置">
        <span class="save-path">{{ settings.savePath }}</span>
        <el-button @click="changeSavePath">
          更改目录
        </el-button>
      </el-form-item>
      <el-form-item label="预下载">
        <el-switch @change="save('preDownload')" v-model="settings.preDownload">
        </el-switch>
      </el-form-item>
    </el-form>
  </div>
</template>
<script>
  import Constant from "../../constant";
  import { getSettings, saveSettings } from "../../configuration";
  import { ipcRenderer } from 'electron';

  export default {
    name: 'settings',
    data() {
      return {
        categories: Constant.Categories,
        settings: {
          categories: [],
          imgSrc: '',
          interval: 1,
          savePath: '',
          preDownload: true
        }
      }
    },
    mounted() {
      for (let s in this.settings) {
        this.settings[s] = getSettings(s);
      }
    },
    methods: {
      save(attr) {
        saveSettings(attr, this.settings[attr]);
        if (attr === 'categories') {
          ipcRenderer.send('updateCategories');
        }
        if (attr === 'interval') {
          ipcRenderer.send('updateInterval');
        }
      },
      changeSavePath() {
        ipcRenderer.send('openDirDialog');
        ipcRenderer.on('openedDir', (event, savePath) => {
          if (savePath) {
            this.settings.savePath = savePath;
            this.save('savePath');
          }
        })
      }
    }
  }
</script>
<style scoped>
  .settings {
    margin: 20px;
  }

  .settings-title {
    padding-bottom: 20px;
    border-bottom: 1px solid #DCDFE6;
  }

  .interval-slider {
    width: 50%;
    margin: 0 10px;
  }

  .save-path {
    margin-right: 10px;
    color: #303133;
  }
</style>
