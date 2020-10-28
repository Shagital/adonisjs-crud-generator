<template>
  <div id="app">
    <nprogress-container></nprogress-container>
    <div class="preload" v-if="!loaded">
      <div class="">
        <div class="has-text-centered">
          <ripple color="black"></ripple>
        </div>
        <div class="preloader-title"></div>
      </div>
    </div>
    <transition mode="out-in" name="view">
      <router-view v-if="loaded"/>
    </transition>
  </div>
</template>
<script>
import NprogressContainer from 'vue-nprogress/src/NprogressContainer'
import Ripple from '@/components/PreLoader'
export default {
  components: {
    Ripple, NprogressContainer
  },
  data: () => ({
    loaded: false
  }),
  beforeMount() {
    this.$auth.ready(()=>{
      this.loaded = true
    })
  },
}
</script>

<style lang="scss">
.preload{
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  .preloader-title{
    text-align: center;
    font-size: 2em;
  }
}
.view-enter-active, .view-leave-active{
  transition: opacity 0.1s ease-in-out;
}
.view-enter-to, .view-leave{
  opacity: 1;
}
.view-enter, .view-leave-to{
  opacity: 0;
}
</style>
