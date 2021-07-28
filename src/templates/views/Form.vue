<template>
  <div :class="{ blur: !loaded }">
    <h3 class="text-gray-700 text-3xl font-semibold">
            {{ this.$route.params.id ? $t('form.edit_title', {resource: `{{pascalName}} #${this.$route.params.id}`}) : $t('form.create_title', {resource: `{{pascalName}}` }) }}
    </h3>


    <div class="mt-8">
      <div class="mt-4">
        <div class="p-6 bg-white rounded-md shadow-md">
          <form @submit.prevent="save">
            <div class="grid grid-cols-1 sm:grid-cols-1 gap-6 mt-4">

                <!-- insert input fields here. Do not remove -->

                <button
                  :disabled="loading || errors.length"
                  @click="save"
                  :class="`px-6 mx-2 py-2 bg-red-${loading ? 200 : 800} text-gray-200 rounded-md hover:bg-red-700 focus:outline-none focus:bg-red-${loading ? 100 : 700}`"
                >
                  {{ this.$route.params.id ? $t('form.edit_title', {resource: `{{pascalName}}`}) : $t('form.create_title', {resource: `{{pascalName}}` }) }}
                </button>
              </div>

          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { handleError, handleSuccess } from "@/helpers/response";

export default {
  title: ['{{snakeCase}}.name', '{{snakeCase}}.plural'],
  data() {
    return {
      loaded: false,
      loading: false,
      body: {

      }
    };
  },
  methods: {
    save() {
      this.$validator.validateAll().then(valid => {
        if (valid) {
          this.sendRequest();
        }
      });
    },
    async sendRequest() {
      this.loading = true;

      this.$store
        .dispatch("{{singular}}/createOrUpdate", this.body)
        .then(({data, message}) => {
          handleSuccess(this, data.message || this.$route.params.id ? this.$t('success.update', {resource: `{{pascalName}} #${this.$route.params.id}`}) : this.$t('success.create', {resource: `{{pascalName}}`}));
        })
        .catch((response) => {
          handleError(this, response, this.$route.params.id ? this.$t('error.update', {resource: `{{pascalName}} #${this.$route.params.id}`}) : this.$t('error.create', {resource: `{{pascalName}}`}));
        })
        .finally(() => {
            this.loading = false;
        });
    },
    fetchAndSetUser() {
      this.loaded = false;
      this.$store.dispatch('{{singular}}/getSingle', this.$route.params.id).then((data) => {
        this.body = data;
        this.loaded = true;
      })
    }
  },
  created() {
    if(this.$route.params.id) {
      this.fetchAndSetUser();
    } else {
      this.loaded = true;
    }
  },
  watch: {
    '$route' (to, from) {
      // react to route changes...
      if(to.params.id) {
        this.fetchAndSetUser();
      } else {
        this.body = {};
      }
    }
  }
};
</script>

<style scoped>
.parent {
  display: flex;
  flex-wrap: wrap;
}

.child {
  flex: 1 0 21%; /* explanation below */
  margin: 5px;
  height: 100px;
}
</style>
