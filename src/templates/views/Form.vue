<template>
  <form ref="password_form" @submit.prevent="submit">

    <md-card>

      <md-card-header class="md-card-header-icon">
        <div class="card-icon">
          <md-icon>perm_identity</md-icon>
        </div>
        <h4 class="title">
          {{this.$route.params.id ? 'Edit' : 'Create'}} {{pascalName}}
        </h4>
      </md-card-header>

      <md-card-content v-if="loaded">
        <div class="md-layout">
          <!-- insert input fields here -->
        </div>
      </md-card-content>

      <md-card-actions>
        <md-button type="submit" :disabled="loading || errors.length">
          {{this.$route.params.id ? 'Update' : 'Create'}}
        </md-button>
      </md-card-actions>
    </md-card>

  </form>
</template>

<script>
import {handleError, handleSuccess} from "@/helpers/response";
export default {
  title: `{{pascalName}} Form`,
  name: "Form",
  data: () => ({
    body: {

    },
    loading:false,
    loaded:false,
  }),

  methods: {
    submit() {
      this.$validator.validateAll().then(valid => {
        if (valid) {
          this.loading = true;
          this.sendRequest().then(() => {
            this.loading = false;
          });
        }
      });
    },
    async sendRequest() {
      this.$store
        .dispatch("{{singular}}/createOrUpdate", this.body)
        .then(data => {
          handleSuccess(this, data.message);
        })
        .catch((response) => {
          handleError(this, response, 'Failed to perform action');
        });
    },
    fetchAndSetUser() {
      this.$store.dispatch('{{singular}}/fetch', this.$route.params.id).then((data) => {
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
