<template>
  <header
    class="flex justify-between items-center py-4 px-6 bg-white border-b-4 border-indigo-600"
  >
    <div class="flex items-center">
      <button
        @click="toggleSidebar"
        class="text-gray-500 focus:outline-none lg:hidden"
      >
        <svg
          class="h-6 w-6"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 6H20M4 12H20M4 18H11"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>


    </div>

    <div class="flex items-center">
      <span class="flex mx-4 text-gray-600 focus:outline-none">
        <svg
          class="h-6 w-6"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M15 17H20L18.5951 15.5951C18.2141 15.2141 18 14.6973 18 14.1585V11C18 8.38757 16.3304 6.16509 14 5.34142V5C14 3.89543 13.1046 3 12 3C10.8954 3 10 3.89543 10 5V5.34142C7.66962 6.16509 6 8.38757 6 11V14.1585C6 14.6973 5.78595 15.2141 5.40493 15.5951L4 17H9M15 17V18C15 19.6569 13.6569 21 12 21C10.3431 21 9 19.6569 9 18V17M15 17H9"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        {{$auth.user().email}}
      </span>

      <div class="relative">
        <button
          @click="toggleDropdown()"
          class="relative z-10 block h-8 w-8 rounded-full overflow-hidden shadow focus:outline-none"
        >

          <img
            class="h-full w-full object-cover"
            :src="$auth.user().photo || '/avatar.jpg'"
            :alt="$auth.user().username"
          />
        </button>

        <div
          v-show="dropdownOpen"
          @click="toggleDropdown()"
          class="fixed inset-0 h-full w-full z-10"
        ></div>

        <div
          v-show="dropdownOpen"
          class="absolute right-0 mt-2 py-2 w-48 bg-white rounded-md shadow-xl z-20"
        >
          <router-link
            :to="{name:'Profile'}"
            class="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-600 hover:text-white"
            >Profile</router-link
          >

          <a
          href="#"
            @click="logoutUser"
            class="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-600 hover:text-white"
            >Log out</a
          >
        </div>
      </div>
    </div>
  </header>
</template>

<script >
import {handleError} from '@/helpers/response';

export default {
  data() {
    return {

    };
  },
  computed: {
     sidebarOpen() {
      return this.$store.getters["global/sidebar_open"];
    },
    dropdownOpen() {
      return this.$store.getters["global/dropdown_open"];
    }
  },
  methods : {
     toggleSidebar() {
      this.$store.commit("global/SET_SIDEBAR_OPEN", !this.sidebarOpen);
    },
     toggleDropdown() {
      this.$store.commit("global/SET_DROPDOWN_OPEN", !this.dropdownOpen);
    },
    logoutUser() {
      let r = confirm('Are you sure you want to logout?');
      if(!r) return;

      this.$auth
        .logout({
          makeRequest: true,
          params: {}, // data: {} in axios
          redirect: false
          // etc...
        })
        .then(() => {
          //delete token
          localStorage.clear();
          this.$router.push({ name: "Login" });
        })
        .catch(e => {
          handleError(this, e, this.$t('error.default'));
        })

    },
  }
};
</script>
