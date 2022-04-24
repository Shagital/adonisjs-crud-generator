<template>
  <div :class="{ blur: !loaded }">
    <h3 class="text-gray-700 text-3xl font-semibold">
      {{ `Update Profile` }}
    </h3>

    <div class="mt-8">
      <div class="mt-4">
        <div class="p-6 bg-white rounded-md shadow-md">
          <form @submit.prevent="update" enctype="multipart/form-data">
            <div class="grid grid-cols-1 sm:grid-cols-1 gap-6 mt-4">

              <div>
                <label class="text-gray-700" for="title"><b>{{$t('profile.email_label')}} : </b></label>
                <input

                  class="form-input w-full mt-2 rounded-md focus:border-indigo-600"
                  v-validate="'required|email'"
                  v-model="user.email"
                />
                <small class="text-red-800" v-show="errors.has('email')">{{
                  errors.first("email")
                }}</small>

              </div>

<hr>
<h4>{{$t('profile.change_password')}}</h4>
 <div>
                <label class="text-gray-700" for="title"
                  ><b>{{$t('profile.old_password_label')}} : </b></label
                >
                <input
                  ref="old_password"
                  name="old_password"
                  type="password"
                  class="form-input w-full mt-2 rounded-md focus:border-indigo-600"
                  v-validate="'min:8'"
                  v-model="user.old_password"
                />
                <small class="text-red-800" v-show="errors.has('password')">{{
                  errors.first("old_password")
                }}</small>
              </div>

              <div v-if="user.old_password">
                <label class="text-gray-700" for="title"
                  ><b>{{$t('profile.password_label')}} : </b></label
                >
                <input
                  ref="password"
                  name="password"
                  type="password"
                  class="form-input w-full mt-2 rounded-md focus:border-indigo-600"
                  v-validate="'required|min:8'"
                  v-model="user.password"
                />
                <small class="text-red-800" v-show="errors.has('password')">{{
                  errors.first("password")
                }}</small>
              </div>

              <div v-if="user.password">
                <label class="text-gray-700" for="title"
                  ><b>{{$t('profile.confirm_password_label')}} : </b></label
                >
                <input
                  name="confirm_password"
                  type="password"
                  class="form-input w-full mt-2 rounded-md focus:border-indigo-600"
                  v-validate="'required|min:8|confirmed:password'"
                  v-model="user.confirm_password"
                />
                <small
                  class="form-text text-red-800"
                  v-show="errors.has('confirm_password')"
                  >{{ errors.first("confirm_password") }}</small
                >
              </div>

              <div class="flex justify-end mt-4">
                <button
                  :disabled="loading"
                  @click="update"
                  class="px-4 py-2 bg-gray-800 text-gray-200 rounded-md hover:bg-gray-700 focus:outline-none focus:bg-gray-700"
                >
                  {{$t('profile.button')}}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script >
import { handleError, handleSuccess } from "@/helpers/response";

export default {
  title: ['profile.title'],
  data() {
    return {
      loaded: false,
      loading: false,
      user: {},
    };
  },
  methods: {

    update() {
      this.$validator.validateAll().then((valid) => {
        if (valid) {
          this.loading = true;
          this.submit();
        }
      });
    },

    submit() {

      this.$store
        .dispatch("global/updateProfile", this.user)
        .then((res) => {

          handleSuccess(this, res.message || `Profile was updated successfully`);
          this.$auth.refresh();
        })
        .catch((err) => {

          handleError(this, err, "Failed to update profile");
        })
        .finally(() => (this.loading = false));
    },
  },
  computed: {},
  created() {
    Object.assign(this.user, {
      id: this.$auth.user().id,
      email: this.$auth.user().email,
    });
    this.loaded = true;
  },
};
</script>
