<template>
  <div class="flex">
    <!-- Backdrop -->
    <div
      :class="sidebarOpen ? 'block' : 'hidden'"
      @click="toggleSidebar"
      class="fixed z-20 inset-0 bg-black opacity-50 transition-opacity lg:hidden"
    ></div>
    <!-- End Backdrop -->

    <div
      :class="sidebarOpen ? 'translate-x-0 ease-out' : '-translate-x-full ease-in'"
      class="fixed z-30 inset-y-0 left-0 w-64 transition duration-300 transform bg-gray-900 overflow-y-auto lg:translate-x-0 lg:static lg:inset-0"
    >
      <div class="flex items-center justify-center mt-8">
        <div class="flex items-center">
          <img :src="`/logo.jpeg`" width="50px" height="50px" :alt="$appName">

        </div>
      </div>

      <nav class="mt-10">
         <div
        :class="`items-center duration-200 mt-4 py-2 px-6 border-l-4 ${$route.name === 'Dashboard' ? activeClass : inactiveClass}`"

        >
        <router-link
        :class="`text-white`"
          to="/"
        >

          <i class="icon-dashboard"></i>{{$t('dashboard')}}
        </router-link>
        </div>
        <!-- INSERT NEW ENDPOINTS HERE. DO NOT REMOVE THIS LINE -->

      </nav>
    </div>
  </div>
</template>

<script >
export default {
  data() {
    return {
      activeClass: "bg-gray-600 bg-opacity-25 text-gray-100 border-gray-100",
       activeChildClass: "bg-gray-800 bg-opacity-35 text-gray-200 border-gray-200",
      inactiveClass: "border-gray-800 text-gray-500 hover:bg-gray-600 hover:bg-opacity-25 hover:text-gray-100",
      inactiveChildClass: "border-gray-900 text-gray-600 hover:bg-gray-700 hover:bg-opacity-35 hover:text-gray-200",

    };
  },
  computed: {
    sidebarOpen() {
      return this.$store.getters["global/sidebar_open"];
    },
    user() {
      let u = this.$auth.user();
      u.roles_list = u.roles_list || [];
      return u;
    },
    expandedMenu() {
      return this.$store.getters["global/expanded_menu"];
    }

  },
  methods: {
    toggleSidebar() {
      this.$store.commit("global/SET_SIDEBAR_OPEN", !this.sidebarOpen);
    },
    toggleExpandMenu(name) {
      let expanded = this.expandedMenu == name ? null : name;
      this.$store.commit("global/SET_EXPANDED_MENU", expanded);
    }
  },
  created() {

  }
};
</script>
