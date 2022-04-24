<template>
<div class="mt-5">
  <h3 class="text-gray-700 text-3xl font-medium">404</h3>
    <h4 class="text-gray-700 text-3xl font-medium">{{$t('not_found', {resource: 'Page'})}}</h4>
    <h4 class="text-gray-700 text-3xl font-medium"><router-link :to="{name: 'Dashboard'}">{{$t('go_home')}}</router-link></h4>
</div>
</template>
<script>
export default {
  title : 'Page Not Found'
}
</script>
