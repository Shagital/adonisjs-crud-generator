<template>
  <div class="md-layout text-center login-fix-page">
    <div class="md-layout-item md-size-100">
      <div class="text-center">
        <h3>Log in to Admin Dashboard</h3>

      </div>

    </div>

    <div
      class="md-layout-item md-size-33 md-medium-size-50 md-small-size-70 md-xsmall-size-100"
    >
      <form @submit.prevent="submit">
        <login-card header-color="green">
          <h4 slot="title" class="title">Log in</h4>

          <md-field
            class="form-group md-invalid"
            slot="inputs"
            style="margin-bottom: 28px"
          >
            <md-icon>email</md-icon>
            <label>Email...</label>
            <md-input v-validate="'required|email'" v-model="body.email" type="email" />
          </md-field>
          <small
            class="form-text text-danger"
            v-show="errors.has('email')"
          >{{errors.first('email')}}</small>
          <md-field class="form-group md-invalid" slot="inputs">
            <md-icon>lock_outline</md-icon>
            <label>Password...</label>
            <md-input v-model="body.password" v-validate="'required|min:8'" type="password" />
          </md-field>
          <small
            class="form-text text-danger"
            v-show="errors.has('password')"
          >{{errors.first('password')}}</small>
          <md-button
            :disabled="loading"
            slot="footer"
            type="submit"
            class="md-simple md-success md-lg"
          >
            Lets Go
          </md-button>
        </login-card>
      </form>
    </div>
  </div>
</template>

<script>
import { LoginCard } from "@/components";
import {handleError} from "@/helpers/response";

export default {
  title:'Login',
  components: {
    LoginCard,
  },
  computed: {

  },
  data: () => ({
    body: {
      email: "",
      password: ""
    },
    loading:false,
  }),
  methods: {
    submit() {
      this.$validator.validateAll().then(valid => {
        if (valid) {
          this.loading = true;
          this.login().then(() => {
            this.loading = false;
          });
        }
      });
    },
    async login() {
      return this.$auth
        .login({
          data: this.body,
          rememberMe: true,
          staySignedIn: true,
          redirect: false,

        }).then((res) => {
        localStorage.setItem('default_auth_token', res.data.data.token);
        this.$auth.refresh().then(() => {
          this.$router.push({name: "home"});
        });
      }).catch(async ({response}) => {
          handleError(this, response, 'Failed to Login');
      })
    },
  },
};
</script>
<style scoped>
.login-fix-page {
  padding-bottom: 7em;
  padding-top: 4em;
}
</style>

