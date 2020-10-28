// =========================================================
// * Vue Material Dashboard PRO - v1.4.0
// =========================================================
//
// * Product Page: https://www.creative-tim.com/product/vue-material-dashboard-pro
// * Copyright 2019 Creative Tim (https://www.creative-tim.com)
//
// * Coded by Creative Tim
//
// =========================================================
//
// * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

import Vue from "vue";
import Vuex from "vuex";
import axios from "axios";
import VueAuth from '@websanova/vue-auth';
import titleMixin from './mixins/titleMixin'

// Plugins
import App from "./App.vue";
import Chartist from "chartist";
import VueAxios from "vue-axios";
import VeeValidate from 'vee-validate';
import DashboardPlugin from "./material-dashboard";
import VueToast from 'vue-toast-notification';
import Vuetable from 'vuetable-2';
// Import any of available themes
import 'vue-toast-notification/dist/theme-default.css';

// plugin setup
Vue.mixin(titleMixin);
Vue.use(VeeValidate, {
  fieldsBagName: 'veeFields'
});
Vue.component('vuetable', Vuetable);
Vue.use(DashboardPlugin);
Vue.use(VueAxios, axios);
Vue.use(Vuex);
Vue.use(VueToast);

// router & store setup
import router from "./router";
import store from "./store";

// global library setup
Vue.prototype.$baseApi = '{{baseUrl}}';
Vue.prototype.$profileUrl = Vue.prototype.$baseApi + "/profile";
Vue.prototype.$loginUrl = Vue.prototype.$baseApi + "/login";
Vue.prototype.$logoutUrl = Vue.prototype.$baseApi + "/logout";

Vue.router = router;
// always clear session storage on page reload
Vue.use(VueAuth, {
  auth: {
    request: function (req, token) {
      this.options.http._setHeaders.call(this, req, {
        Authorization: 'Bearer ' + token,
      });
    },
    response: function (res) {
      // redundant check to ensure all requests resolve so the page doesn't get stuck loading
      var parsedToken = res.data.token;
      if (parsedToken) {
        parsedToken = parsedToken.split('Bearer ');

        parsedToken = parsedToken[parsedToken.length > 1 ? 1 : 0];
        localStorage.setItem('default_auth_token', parsedToken);
        return parsedToken;
      }
    }
  },
  http: require('@websanova/vue-auth/drivers/http/axios.1.x.js'),
  router: require("@websanova/vue-auth/drivers/router/vue-router.2.x"),
  loginData: {
    url: Vue.prototype.$loginUrl,
    fetchUser: true,
    method: "POST"
  },
  logoutData: {
    url: Vue.prototype.$logoutUrl,
    method: "GET"
  },
  refreshData: {
    url: Vue.prototype.$profileUrl,
    method: "GET",
    enabled: true,
    interval: 30
  },
  fetchData: {
    url: Vue.prototype.$profileUrl,
    method: "GET",
    enabled: true,
  }
});

/* eslint-disable no-new */
const app = new Vue({
  router: router,
  store: new Vuex.Store(store),
  el: "#app",
  render: h => h(App)
});

store.$app = app;

