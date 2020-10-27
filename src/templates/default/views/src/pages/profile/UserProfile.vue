<template>
  <div class="md-layout md-gutter">
    <div class="md-layout-item md-size-122 md-small-size-100">
      <div class="md-layout-item md-size-100">
        <user-edit-card :user="$auth.user()"/>
      </div>
      <div class="md-layout-item md-size-100">
        <user-password-card :user="$auth.user()"/>
      </div>
    </div>
  </div>
</template>

<script>
  import UserEditCard from "@/pages/profile/EditProfileCard.vue";
  import UserPasswordCard from "@/pages/profile/EditPasswordCard.vue";

  export default {
    name: "user-profile-example",

    components: {
      "user-edit-card": UserEditCard,
      "user-password-card": UserPasswordCard
    },

    data: () => ({

    }),

    created() {

    },

    methods: {

    }
  }
</script>
