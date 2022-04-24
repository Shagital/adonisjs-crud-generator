import Vue from 'vue'
import App from './App.vue'
import VueAuth from '@websanova/vue-auth';
import router from './router';
import Axios from 'axios'
import VueAxios from 'vue-axios'
import VeeValidate from 'vee-validate';
import Multiselect from 'vue-multiselect'
import Vuex from 'vuex'
import Vuetable from 'vuetable-2';
import VCalendar from 'v-calendar';
import store from '@/store';
import {optional, numberWithCommas} from '@/helpers/global';
import titleMixin from '@/mixins/titleMixin';
import VueToast from 'vue-toast-notification';
import i18n from './helpers/i18n';

import './assets/main.css';
import './assets/material-icons/css/material-design-iconic-font.min.css'
import './assets/font-awesome/css/font-awesome.min.css'
import 'vue-multiselect/dist/vue-multiselect.min.css'
import 'vue-toast-notification/dist/theme-default.css';

import DashboardLayout from './components/DashboardLayout.vue';
import EmptyLayout from './components/EmptyLayout.vue';


Vue.component('default-layout', DashboardLayout);
Vue.component('empty-layout', EmptyLayout);
Vue.use(VCalendar, {
  componentPrefix: 'vc'
});

Vue.config.productionTip = process.env.NODE_ENV === 'production';
Vue.prototype.$baseApi = process.env.VUE_APP_BASE_URI || `{{baseUrl}}`;
Vue.prototype.$appName = process.env.VUE_APP_NAME || `{{appName}}`;

Vue.mixin(titleMixin);
Vue.use(VeeValidate, {
  fieldsBagName: 'veeFields'
});

Vue.use(VueToast);
Vue.use(VueAxios, Axios);
Vue.use(Vuex);

Vue.component('multiselect', Multiselect);
Vue.component('vuetable', Vuetable);
Vue.router = router;

Vue.prototype.$profileUrl = Vue.prototype.$baseApi + "/auth/me?include=roles,permissions";
Vue.prototype.$loginUrl = Vue.prototype.$baseApi + "/auth/login";
Vue.prototype.$logoutUrl = Vue.prototype.$baseApi + "/auth/logout";
Vue.prototype.$refreshUrl = Vue.prototype.$baseApi + "/auth/refresh";

Vue.use(VueAuth, {
  auth: {
    request: function (req, token) {
      let refreshToken = localStorage.getItem('default_refresh_token');
      let {pathname} = new URL(req.url);
      let lastPart = pathname.split('/').slice(-1).pop();

      let headers = {
        Authorization: 'Bearer ' + token,
      };

      if(refreshToken && lastPart == 'refresh') {
        headers['refresh-token'] = refreshToken
      }

      this.options.http._setHeaders.call(this, req, headers);
    },
    response: function (res) {

      let data = optional(res, 'data.data', res.data);

      if (data.token) {
        let parsedToken = data.token.split('Bearer ');

        parsedToken = parsedToken[parsedToken.length > 1 ? 1 : 0];
        localStorage.setItem('default_auth_token', parsedToken);
        localStorage.setItem('default_refresh_token', data.refreshToken);
        return parsedToken;
      }
    }
  },
  http: require('@websanova/vue-auth/drivers/http/axios.1.x.js'),
  router: require("@websanova/vue-auth/drivers/router/vue-router.2.x"),
  rolesVar: 'roles_list',
  loginData: {
    url: Vue.prototype.$loginUrl,
    fetchUser: false,
    method: "POST"
  },
  logoutData: {
    url: Vue.prototype.$logoutUrl,
    method: "GET"
  },
  refreshData: {
    url: Vue.prototype.$refreshUrl,
    method: "PATCH",
    enabled: true,
    interval: 8, // in minutes
    error (err) {
      if (err && err.response && err.response.status == 401) {
        localStorage.removeItem('default_auth_token'); // clear existing token
        router.currentRoute.name == 'Login' || router.push('/login')
      }
    },
  },
  fetchData: {
    url: Vue.prototype.$profileUrl,
    method: "GET",
    enabled: true,
  },
  forbiddenRedirect: '/403'
});

Vue.filter('optional', optional);
Vue.filter('numberWithCommas', numberWithCommas);

new Vue({
  i18n,
  router,
  store: new Vuex.Store(store),
  render: h => h(App)
}).$mount('#app');
