<template>
  <div>
    <transition name="slide-fade">
      <div >
        <form class="d-form" @submit.prevent="save">
          <div class="grid grid-cols-6">

            <div >
              <span class="text-bold text-opacity-pale">{{$t('created_at')}} ({{$t('from')}})</span>
              <input
              type="date"
                v-model="params['created_at_from']"
                @input="setFilters('created_at_from',params['created_at_from'])"
                class="appearance-none rounded-r rounded-l sm:rounded-l-none border border-gray-400 border-b block pl-8 pr-6 py-2 bg-white text-sm placeholder-gray-400 text-gray-700 focus:bg-white focus:placeholder-gray-600"


              />
            </div>

               <div class="pl-6" >
              <span class="text-bold text-opacity-pale">{{$t('created_at')}} ({{$t('to')}})</span>
              <input
              type="date"
              class="appearance-none rounded-r rounded-l sm:rounded-l-none border border-gray-400 border-b block pl-8 pr-6 py-2 bg-white text-sm placeholder-gray-400 text-gray-700 focus:bg-white focus:placeholder-gray-600"

                v-model="params['created_at_to']"
                @input="setFilters('created_at_to',params['created_at_to'])"
                name="created_at_to"
              />
            </div>
          </div>
        </form>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  props: ["params", "visibleFilter"],
  methods: {
    setFilters(name, val) {
      val = typeof val === "object" ? (val && val.id ? val.id : val) : val;
      let data = {
        name,
        val
      };
      this.$emit("setFilters", data);
    }
  }
};
</script>
