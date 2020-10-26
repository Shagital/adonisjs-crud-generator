<template>
  <footer class="footer">
    <div class="container">
      <nav>
        <ul>
          <li>
            <a v-if="$route.meta.rtlActive" href="https://github.com/shagital/adonisjs-crud-generator" target="_blank">
              منزل
            </a>
            <a v-else href="https://github.com/shagital/adonisjs-crud-generator" target="_blank">
              CRUD Generator
            </a>
          </li>
          <li>
            <a href="https://www.adonisjs.com/" target="_blank">
              Adonisjs
            </a>
          </li>

        </ul>
      </nav>
      <div class="copyright text-center">
        &copy; {{ new Date().getFullYear() }},
        made with <i class="fa fa-heart heart"></i>
        by
        <a href="https://github.com/shagital" target="_blank">Shagital</a>
      </div>
    </div>
  </footer>
</template>
<script>
export default {};
</script>
<style></style>
