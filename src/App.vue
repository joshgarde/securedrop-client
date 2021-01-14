<template>
  <div class="hero is-primary is-bold">
    <div class="hero-body">
      <span class="title">
        <i class="fas fa-user-secret"></i>
        SecureDrop
      </span>
    </div>
  </div>

  <Uploader v-if="!isDownloadPath"/>
  <Downloader v-if="isDownloadPath"/>
</template>

<script>
import Uploader from './components/Uploader.vue'
import Downloader from './components/Downloader.vue'

export default {
  name: 'App',
  components: {
    Uploader, Downloader
  },
  computed: {
    isDownloadPath() {
      return window.location.pathname !== '/';
    }
  }
}
</script>

<style>

</style>
