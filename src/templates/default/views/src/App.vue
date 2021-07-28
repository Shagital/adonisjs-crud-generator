<template>
  <div id="app">
    <nprogress-container></nprogress-container>
    <div class="preload" v-if="!authReady">
      <div class="">
        <div class="has-text-centered">
          <ripple color="black"></ripple>
        </div>
        <div class="preloader-title">{{$appName}} <strong>{{$t('admin')}}</strong></div>
      </div>
    </div>
    <transition mode="out-in" name="view">
      <component :is="layout">
        <router-view v-if="authReady" />
      </component>
    </transition>
     <footer style="text-align:center">Made with ❤️ by <a href="https://github.com/shagital">Shagital</a></footer>
  </div>
</template>

<script >
import NprogressContainer from "vue-nprogress/src/NprogressContainer";
import Ripple from '@/components/Ripple'

export default {
  components: {
    NprogressContainer,
    Ripple
  },
  data: () => ({
    authReady: false,
    defaultLayout : "default",
  }),
  beforeMount() {
    this.$auth.ready(() => {
      this.authReady = true;
    });
  },
  computed: {
    layout() {
      return `${this.$route.meta.layout || this.defaultLayout}-layout`;
    },
  },
};
</script>

<style lang="scss">
/*@import '../../sass/app';*/
.lds-ripple div {
  border-color: #0a5685;
}
.preload {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  .preloader-title {
    font-size: 2em;
    h6 {
      text-align: center;
    }
  }
}
.view-enter-active,
.view-leave-active {
  transition: opacity 0.1s ease-in-out;
}
.view-enter-to,
.view-leave {
  opacity: 1;
}
.view-enter,
.view-leave-to {
  opacity: 0;
}
.has-text-centered {
  text-align: center;
}
</style>
