import Vue from "vue";
import VueRouter from "vue-router";
import NProgress from 'nprogress'
import 'nprogress/nprogress.css';

Vue.use(VueRouter);

// router setup
import routes from "./routes";

// configure router
const router = new VueRouter({
  mode: "hash",
  routes, // short for routes: routes
  scrollBehavior: to => {
    if (to.hash) {
      return {selector: to.hash};
    } else {
      return {x: 0, y: 0};
    }
  },
  linkExactActiveClass: "nav-item active"
});

router.beforeEach((to, from, next) => {
  if (to.name) {
    NProgress.start()
  }
  return next();
});

router.afterEach((to, from) => {
  // Complete the animation of the route progress bar.
  NProgress.done();
})

export default router;
