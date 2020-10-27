<template>
  <form ref="password_form" @submit.prevent="submit">

    <md-card>

      <md-card-header class="md-card-header-icon">
        <div class="card-icon">
          <md-icon>perm_identity</md-icon>
        </div>
        <h4 class="title">
          Change Password
        </h4>
      </md-card-header>

      <md-card-content>
        <div class="md-layout">
          <div class="md-layout-item md-size-100">
            <md-field class="md-invalid">
              <label>Old Password</label>
              <md-input name="old_password" v-validate="'required|min:8'" v-model="body.old_password" type="password"/>
            </md-field>
            <small
              class="form-text text-danger"
              v-show="errors.has('old_password')"
            >{{errors.first('old_password')}}</small>
            <md-field class="md-invalid">
              <label>New Password</label>
              <md-input ref="password" name="password" v-validate="'required|min:8'" v-model="body.password" type="password"/>
            </md-field>
            <small
              class="form-text text-danger"
              v-show="errors.has('password')"
            >{{errors.first('password')}}</small>
            <md-field class="md-invalid">
              <label>Confirm New Password</label>
              <md-input name="confirm_password" v-validate="'required|confirmed:password'" v-model="body.confirm_password" type="password"/>

            </md-field>
            <small
              class="form-text text-danger"
              v-show="errors.has('confirm_password')"
            >{{errors.first('confirm_password')}}</small>
          </div>
        </div>
      </md-card-content>

      <md-card-actions>
        <md-button type="submit" :disabled="loading || errors.length">
          Change Password
        </md-button>
      </md-card-actions>
    </md-card>

  </form>
</template>

<script>
import {handleError, handleSuccess} from "@/helpers/response";
  export default {
    title:'Edit Profile',
    name: "edit-password-card",
    data: () => ({
      body: {
        old_password: null,
        password: null,
        confirm_password: null
      },
      loading:false,
    }),

    methods: {
      submit() {
        this.$validator.validateAll().then(valid => {
          if (valid) {
            this.loading = true;
            this.changePassword().then(() => {
              this.loading = false;
            });
          }
        });
      },
      async changePassword() {
          this.$store
            .dispatch("profile/update", this.body)
            .then(data => {
              this.$auth.logout();
              handleSuccess(this, 'Password has been changed. Please login with new password');
            })
            .catch((response) => {
              handleError(this, response, 'Failed to Login');
            });
        },
      }
  };
</script>
