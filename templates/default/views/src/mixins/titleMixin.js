function getTitle (vm) {
  const { title } = vm.$options

  return title;
}

export default {
  mounted () {
      let title = getTitle(this)

      if(Array.isArray(title)) {
        let computedTItle = '';
        for(let key of title) {
          computedTItle += `${this.$t(key)} | `
        };

        title = computedTItle;
      }
      if (title) {
          document.title = `${title}${this.$t('admin_dashboard_title')} | ${this.$appName}`
      }
  }
}
