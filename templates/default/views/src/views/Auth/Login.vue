<template>
  <div class="flex justify-center items-center h-screen bg-gray-200 px-6">
    <div class="p-6 max-w-sm w-full bg-white shadow-md rounded-md">
      <div class="flex justify-center items-center">
         <img :src="`logo.jpeg`" width="50px" height="50px" :alt="$appName">

      </div>

      <form class="mt-4" @submit.prevent="login">
        <label class="block">
          <span class="text-gray-700 text-sm">{{$t('login.email_label')}}</span>
          <input
            type="email"
            class="form-input mt-1 block w-full rounded-md focus:border-indigo-600"
            v-model="body.email"
            name="email"
            v-validate="'required|email'"
            data-vv-as="email"
            :placeholder="$t('login.email_placeholder')"
          />
          <small class="text-red-800" v-show="errors.has('email')">{{
            errors.first("email")
          }}</small>
        </label>

        <label class="block mt-3">
          <span class="text-gray-700 text-sm">{{$t('login.password_label')}}</span>
          <div class="mt-2 relative rounded-md shadow-sm">
          <input
            :type="passwordType"
            class="form-input mt-1 block w-full rounded-md focus:border-indigo-600"
            v-model="body.password"
            name="password"
            v-validate="'required|min:8'"
            data-vv-as="password"
            :placeholder="$t('login.password_placeholder')"
          />


         <span @click="togglePassword" class="show-password absolute p-4 inset-y-0 right-0 pl-3 flex items-center text-gray-600">
           <i :class="passwordType === 'password' ? 'zmdi zmdi-eye' : 'zmdi zmdi-eye-off'"></i>
            </span>

             <small class="text-red-800" v-show="errors.has('password')">{{
            errors.first("password")
          }}</small>
         </div>


        </label>

        <div class="flex justify-between items-center mt-4">

        </div>

        <div class="mt-6">
          <button
            :disabled="loading"
            type="submit"
            :class="`py-2 px-4 text-center bg-indigo-${loading ? 200 : 600} rounded-md w-full text-white text-sm hover:bg-indigo-${loading ? 100 : 500}`"
          >
            {{$t('login.button')}}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { handleError } from "@/helpers/response";
import { optional } from "@/helpers/global";

export default {
  title: ["login.title"],
  data() {
    return {
      passwordType: "password",
      body: {
        email: "",
        password: ""
      },
      loading: false,

    };
  },

  methods: {
    togglePassword() {
      this.passwordType =
        this.passwordType === "password" ? "text" : "password";
    },
    login() {
      this.$validator.validateAll().then(valid => {
        if (valid) {
          this.loading = true;
          this.submit();
        }
      });
    },
    submit() {
      this.$auth
        .login({
          data: this.body,
          rememberMe: this.body.rememberMe,
          staySignedIn: this.body.rememberMe,
          redirect: { name: "Dashboard" },
          staySignedIn: true,
          fetchUser: true
        })
        .then(res => {})
        .catch(err => {

          handleError(
            this,
            err.response,
            optional(err, 'response.data.message')
          );
        })
        .finally(() => {
          this.loading = false;
        });
    }
  },
  created() {}
};
</script>
