import Vue from 'vue'
import axios from 'axios'
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';

import App from './App'
import router from './router'
import db from '../datastore'

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false

Vue.prototype.$db = db;

Vue.use(ElementUI, { size: 'small', zIndex: 3000 });

new Vue({
  components: { App },
  router,
  template: '<App/>'
}).$mount('#app')

