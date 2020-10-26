<template>
    <md-card>

      <md-card-header class="md-card-header-icon">
        <div class="card-icon">
          <md-icon>perm_identity</md-icon>
        </div>
        <h4 class="title">
          Edit Profile
        </h4>
      </md-card-header>

      <md-card-content>

        <div class="md-layout">
          <label class="md-layout-item md-size-15 md-form-label">
            Name
          </label>
          <div class="md-layout-item">
            <md-field class="md-invalid">
              <md-input :disabled="true" v-model="user.name"/>
            </md-field>
          </div>
        </div>

        <div class="md-layout">
          <label class="md-layout-item md-size-15 md-form-label">
            Email
          </label>
          <div class="md-layout-item">
            <md-field class="md-invalid">
              <md-input :disabled="true" v-model="user.email"/>
            </md-field>
          </div>
        </div>

      </md-card-content>

    </md-card>
</template>
<script>

  export default {
    name: "edit-profile-card",

    props: {
      user: Object
    },

    data() {
      return {
        default_img: process.env.VUE_APP_APP_BASE_URL + "/img/placeholder.jpg",
      }
    },

    methods: {


    }
  };
</script>

<style></style>
