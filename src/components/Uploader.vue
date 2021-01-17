<template>
  <div id="uploader">
    <div class="section container">
      <div class="box hero is-medium" v-bind:class="{'is-dark': hovering}" v-on:drop="handleDrop" v-on:dragover="handleDragOver" v-on:dragenter="handleDragEnter" v-on:dragleave="handleDragLeave">
        <div class="hero-body">
          <!-- Greater Text -->
          <div v-if="isIdle">
            <h1 class="title has-text-centered">Drop your file here to begin</h1>
          </div>

          <!-- Hoverover text -->
          <div v-if="hovering">
            <h1 class="title has-text-centered">DROP IT!</h1>
          </div>

          <!-- Status -->
          <div v-if="processing">
            <h1 class="subtitle has-text-centered">{{stage}}</h1>
            <progress class="progress is-primary" max="100" v-bind:value="uploadProgress" v-if="uploadProgress >= 0">{{uploadProgress}}%</progress>
          </div>

          <!-- Share link screen -->
          <div v-if="done" class="has-text-centered">
            <div class="columns">
              <div class="column">
                <h1 class="title">
                  <i class="far fa-check-circle has-text-success"></i>
                  Package successfully dropped!
                </h1>
                <i class="fas fa-parachute-box fa-9x"></i>
              </div>
            </div>
            <div class="control">
              <input class="input has-text-centered" type="text" v-bind:value="downloadURL" readonly>
              <p>Use this link to share your drop securely</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import {abtob64, abtohex} from '../helpers/converters';

export default {
  name: 'Uploader',
  data: () => {
    return {
      hovering: false,
      processing: false,
      done: false,
      stage: '',
      uploadProgress: -1,
      downloadURL: '',
      success: false
    }
  },
  methods: {
    /* GUI Handlers */
    async handleDrop(event) {
      event.preventDefault();
      this.hovering = false;

      if (event.dataTransfer.files.length == 0) return;
      var file = event.dataTransfer.files[0];
      var fileBuffer = await file.arrayBuffer()

      this.processing = true;

      this.stage = "Generating encryption keys...";
      var keys = await generateKeys();
      var exportedKey = await exportKey(keys.keyPair);

      this.stage = "Generating metadata...";
      var metadata = await generateMetadata(keys.keyPair, keys.clearAuthtext, file, fileBuffer);

      this.stage = "Encrypting file...";
      var encryptedBuffer = await encryptFileBuffer(keys.keyPair, fileBuffer);

      /* Generate FormData to upload */
      this.stage = "Preparing to upload...";
      var formData = new FormData();
      formData.set('file', new Blob([encryptedBuffer.buffer]));
      formData.set('metadata', new Blob([metadata.buffer]));
      formData.set('authtext', new Blob([keys.clearAuthtext.buffer]));

      this.stage = "Uploading..."
      this.uploadProgress = 0;
      let response = await axios.post('/upload', formData, {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.lengthComputable) {
            let max = progressEvent.total;
            let value = progressEvent.loaded;

            this.uploadProgress = Math.floor((value / max) * 100);
          }
        }
      });
      let data = response.data;

      this.processing = false;
      this.done = true;
      this.success = data.success;

      this.downloadURL = `${location.origin}/${data.id}#${exportedKey}`
    },

    handleDragOver(event) {
      event.preventDefault();
      this.hovering = true;
    },

    handleDragEnter(event) {
      event.preventDefault();
      this.hovering = true;
    },

    handleDragLeave(event) {
      event.preventDefault();
      this.hovering = false;
    }
  },

  computed: {
    isIdle() {
      return !this.hovering && !this.processing && !this.done;
    }
  }
}

async function generateKeys() {
  var keyPair = await crypto.subtle.generateKey({
    name: "AES-GCM",
    length: 256
  }, true, ["encrypt", "decrypt"]);

  var auth = crypto.getRandomValues(new Uint8Array(16));

  var iv = crypto.getRandomValues(new Uint8Array(12));
  var encryptedAuth = new Uint8Array(await crypto.subtle.encrypt(
    {name: "AES-GCM", iv}, keyPair, auth
  ));

  var finalAuth = new Uint8Array(iv.byteLength + encryptedAuth.byteLength);
  finalAuth.set(iv, 0);
  finalAuth.set(encryptedAuth, iv.byteLength);

  return {
    encryptedAuthtext: finalAuth,
    clearAuthtext: auth,
    keyPair: keyPair
  };
}

async function generateMetadata(keyPair, clearAuthtext, file, fileBuffer) {
  var sha512 = await crypto.subtle.digest('SHA-512', fileBuffer);
  var sha256 = await crypto.subtle.digest('SHA-256', fileBuffer);

  var metadata = JSON.stringify({
    filename: file.name,
    size: file.size,
    hash: {
      sha512: abtohex(sha512),
      sha256: abtohex(sha256)
    },
    authtext: abtob64(clearAuthtext)
  });
  console.log(`[INFO] Generated metadata: ${metadata}`);

  var encoder = new TextEncoder();
  var rawMetadata = encoder.encode(metadata);

  var iv = crypto.getRandomValues(new Uint8Array(12));
  var encryptedMetadata = new Uint8Array(await crypto.subtle.encrypt(
    {name: "AES-GCM", iv}, keyPair, rawMetadata
  ));

  var finalMetadata = new Uint8Array(iv.byteLength + encryptedMetadata.byteLength);
  finalMetadata.set(iv, 0);
  finalMetadata.set(encryptedMetadata, iv.byteLength);

  return finalMetadata;
}

async function encryptFileBuffer(keyPair, fileBuffer) {
  var iv = crypto.getRandomValues(new Uint8Array(12))
  var encryptedBuffer = new Uint8Array(await crypto.subtle.encrypt(
    {name: "AES-GCM", iv}, keyPair, fileBuffer
  ));

  var finalOut = new Uint8Array(iv.byteLength + encryptedBuffer.byteLength);
  finalOut.set(iv, 0);
  finalOut.set(encryptedBuffer, iv.byteLength);

  return finalOut;
}

async function exportKey(keyPair) {
  let rawKey = await crypto.subtle.exportKey('raw', keyPair);
  let base64Key = abtob64(rawKey);
  return base64Key;
}
</script>
