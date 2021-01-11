<template>
  <div class="hero is-primary is-bold">
    <div class="hero-body">
      <span class="title">SecureDrop</span>
    </div>
  </div>

  <Uploader/>
</template>

<script>
import Uploader from './components/Uploader.vue'

export default {
  name: 'App',
  components: {
    Uploader
  }
}
</script>

<style>

</style>
