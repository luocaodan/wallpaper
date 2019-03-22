import Vue from 'vue'
import Router from 'vue-router'
import {ipcRenderer} from "electron";

Vue.use(Router)

const router = new Router({
  routes: [
    // {
    //   path: '/',
    //   name: 'gallery',
    //   component: require('@/components/Gallery').default
    // },
    {
      path: '/settings',
      name: 'settings',
      component: require('@/components/Settings').default
    },
    {
      path: '*',
      redirect: '/settings'
    }
  ]
})


ipcRenderer.on('navigate', (event, route) => {
  router.push(route);
});


export default router;
