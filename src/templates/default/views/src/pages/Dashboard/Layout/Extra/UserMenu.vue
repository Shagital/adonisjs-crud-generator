<template>
  <div class="user">
    <div class="user-info">
      <a
        data-toggle="collapse"
        :aria-expanded="!isClosed"
        @click.stop="toggleMenu"
        @click.capture="clicked"
      >
        <span v-if="$route.meta.rtlActive">
          {{ rtlTitle }}
          <b class="caret"></b>
        </span>
        <span v-else>
          {{ title }}
          <b class="caret"></b>
        </span>
      </a>

      <collapse-transition>
        <div v-show="!isClosed">
          <ul class="nav">
            <slot>
              <li>
                <a v-if="$route.meta.rtlActive" @click="goToProfile">
                  <span class="sidebar-mini">مع</span>
                  <span class="sidebar-normal">ملف</span>
                </a>
                <a v-else @click="goToProfile">
                  <span class="sidebar-mini">MP</span>
                  <span class="sidebar-normal">My Profile</span>
                </a>
              </li>
              <li>
                <a v-if="$route.meta.rtlActive" @click="logout">
                  <span class="sidebar-mini">و</span>
                  <span class="sidebar-normal">إعدادات</span>
                </a>
                <a v-else @click="logout">
                  <span class="sidebar-mini">L</span>
                  <span class="sidebar-normal">Logout</span>
                </a>
              </li>
            </slot>
          </ul>
        </div>
      </collapse-transition>
    </div>
  </div>
</template>
<script>
export default {

  data() {
    return {
      isClosed: true,
      title: 'Profile',
      rtlTitle: "Profile",
    };
  },

  async created() {
    this.title = this.$auth.user().name
  },

  methods: {
    clicked: function(e) {
      e.preventDefault();
    },
    toggleMenu: function() {
      this.isClosed = !this.isClosed;
    },
    goToProfile() {
      this.$router.push({name: "admin-profile"})
    },
    logout() {
      this.$auth.logout();
      this.$router.push({name:'Login'})
    }
  }
}
</script>
<style>
.collapsed {
  transition: opacity 1s;
}
</style>
