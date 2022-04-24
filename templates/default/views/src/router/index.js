import Vue from 'vue'
import VueRouter from 'vue-router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css';

import Dashboard from "@/views/Dashboard.vue";
import Login from "@/views/Auth/Login.vue";
import Profile from "@/views/Auth/Profile.vue";

import Error404 from "@/views/Errors/404.vue";
import Error403 from "@/views/Errors/403.vue";
// Import Model Components Here. Do not remove this line

Vue.use(VueRouter)

const routes = [
  {
    path: "/login",
    name: "Login",
    component: Login,
    meta: { layout: "empty", auth : false },
  },
  {
    path: "/",
    name: "Dashboard",
    component: Dashboard,
    meta: { auth : true },
  },
  {
    path: "/403",
    name: "Forbidden",
    component: Error403,
    meta: { layout: "empty", auth : false },
  },
  {
    path: "/profile",
    name: "Profile",
    component: Profile,
    meta: { auth : true },
  },
 // Import Model Routes Here. Do not remove this line
  {
    path: "*",
    component: Error404,
  },

];

const router = new VueRouter({
  mode: 'history',
  baseUrl: process.env.BASE_URL,
  linkActiveClass: 'is-active',
  scrollBehavior: (t) => {
      return {
          y: 0
      }
  },
  routes
});

router.beforeResolve((to, from, next) => {
  if (to.name) {
      NProgress.start()
  }
  next();
});

router.afterEach((to, from) => {
  // Complete the animation of the route progress bar.
  NProgress.done();
})

export default router
