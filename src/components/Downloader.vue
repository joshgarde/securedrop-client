<template>
  <div id="downloader">
    <div class="section container">
      <div class="box hero is-large has-text-centered">
        <h1 class="title">
          <i class="far fa-check-circle has-text-success"></i>
          Your drop is ready!
        </h1>
        <i class="fas fa-file fa-6x"></i>
        <div class="columns">
          <div class="column">
            <p class="is-size-4">filename.txt</p>
            <p class="is-size-6">Size: 1024kb</p>
          </div>
        </div>
        <button class="button is-primary">
          <i class="fas fa-download"></i> Download
        </button>
        <hr>
        <p class="is-size-7">Your download is protected by end-to-end encryption</p>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'Downloader',
  methods: {

  }
}

async function getKey() {
  if (location.hash.length <= 1) return null;

  let rawKey = atob(location.hash.slice(1));
  let key = crypto.subtle.importKey(
    ''
  )

}
</script>
