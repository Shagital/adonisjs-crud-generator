<template>
  <div class="fixed-plugin" v-click-outside="closeDropDown">
    <div class="dropdown show-dropdown" :class="{ show: isOpen }">
      <a data-toggle="dropdown">
        <i class="fa fa-cog fa-2x" @click="toggleDropDown"> </i>
      </a>
      <ul class="dropdown-menu" :class="{ show: isOpen }">
        <li class="header-title">Sidebar Filters</li>
        <li class="adjustments-line text-center">
          <span
              v-for="item in sidebarColors"
              :key="item.color"
              class="badge filter"
              :class="[`badge-${item.color}`, { active: item.active }]"
              :data-color="item.color"
              @click="changeSidebarBackground(item)"
          >
          </span>
        </li>
        <li class="header-title">Sidebar Background</li>
        <li class="adjustments-line text-center">
          <span
              v-for="item in sidebarBg"
              :key="item.colorBg"
              class="badge filter"
              :class="[`badge-${item.colorBg}`, { active: item.active }]"
              :data-color="item.colorBg"
              @click="changeSidebarBg(item)"
          >
          </span>
        </li>
        <li class="adjustments-line sidebar-mini">
          Sidebar Mini
          <md-switch
              :value="!sidebarMini"
              @change="val => updateValue('sidebarMini', val)"
          ></md-switch>
        </li>

      </ul>
    </div>
  </div>
</template>
<script>
  import Vue from "vue";
  import SocialSharing from "vue-social-sharing";
  import VueGitHubButtons from "vue-github-buttons";
  import "vue-github-buttons/dist/vue-github-buttons.css";

  Vue.use(SocialSharing);
  Vue.use(VueGitHubButtons, {useCache: true});
  export default {
    props: {
      sidebarMini: Boolean,
      sidebarImg: Boolean
    },
    data() {
      return {
        buyUrl: "",
        isOpen: false,
        backgroundImage: null,
        sidebarColors: [
          {color: "purple", active: false},
          {color: "azure", active: false},
          {color: "green", active: true},
          {color: "orange", active: false},
          {color: "rose", active: false},
          {color: "danger", active: false}
        ],
        sidebarBg: [
          {colorBg: "black", active: true},
          {colorBg: "white", active: false},
          {colorBg: "red", active: false}
        ],
      };
    },
    methods: {
      toggleDropDown() {
        this.isOpen = !this.isOpen;
      },
      closeDropDown() {
        this.isOpen = false;
      },
      toggleList(list, itemToActivate) {
        list.forEach(listItem => {
          listItem.active = false;
        });
        itemToActivate.active = true;
      },
      updateValue(name, val) {
        this.$emit(`update:${name}`, val);
      },
      changeSidebarBackground(item) {
        this.$emit("update:color", item.color);
        this.toggleList(this.sidebarColors, item);
      },
      changeSidebarBg(item) {
        this.$emit("update:colorBg", item.colorBg);
        this.toggleList(this.sidebarBg, item);
      },
    }
  };
</script>
<style>
  .centered-row {
    display: flex;
    height: 100%;
    align-items: center;
  }

  .button-container .btn {
    margin-right: 10px;
  }

  .centered-buttons {
    display: flex;
    justify-content: center;
  }
</style>
