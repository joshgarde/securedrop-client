<template>
  <div id="uploader">
    <div class="section container">
      <div class="box hero is-large" v-bind:class="{'is-dark': hovering}" v-on:drop="handleDrop" v-on:dragover="handleDragOver" v-on:dragenter="handleDragEnter" v-on:dragleave="handleDragLeave">
        <div class="hero-body">
          <!-- Intro Text -->
          <h1 class="title has-text-centered" v-if="!hovering && !processing">
            Drop your file here to begin
          </h1>

          <!-- Hoverover text -->
          <h1 class="title has-text-centered" v-if="hovering">
            DROP IT!
          </h1>

          <!-- Status -->
          <div v-if="processing">
            <h1 class="subtitle has-text-centered">{{stage}}</h1>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Uploader',
  data: () => {
    return {
      hovering: false,
      processing: false,
      stage: ''
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
      var keys = await this.generateKeys();

      this.stage = "Generating metadata...";
      var metadata = await this.generateMetadata(keys.keyPair, keys.clearAuthtext, file, fileBuffer);

      this.stage = "Encrypting file...";
      var encryptedBuffer = await this.encryptFileBuffer(keys.keyPair, fileBuffer);

      /* Generate FormData to upload */
      this.stage = "Preparing to upload...";
      var formData = new FormData();
      formData.set('file', new Blob([encryptedBuffer.buffer]));
      formData.set('metadata', new Blob([metadata.buffer]));
      formData.set('authtext', new Blob([keys.clearAuthtext.buffer]));

      var request = new XMLHttpRequest();
      request.open("POST", "http://localhost:8080/");
      request.send(formData);
    },

    handleDragOver(event) {
      event.preventDefault();
    },

    handleDragEnter(event) {
      event.preventDefault();
      this.hovering = true;
    },

    handleDragLeave(event) {
      event.preventDefault();
      this.hovering = false;
    },

    /* Encryption backend */
    async generateKeys() {
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
    },

    async generateMetadata(keyPair, clearAuthtext, file, fileBuffer) {
      var hash = await crypto.subtle.digest('SHA-512', fileBuffer);
      var metadata = JSON.stringify({
        filename: file.name, hash, clearAuthtext
      });

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
    },

    async encryptFileBuffer(keyPair, fileBuffer) {
      console.log(keyPair)

      var iv = crypto.getRandomValues(new Uint8Array(12))
      var encryptedBuffer = new Uint8Array(await crypto.subtle.encrypt(
        {name: "AES-GCM", iv}, keyPair, fileBuffer
      ));

      var finalOut = new Uint8Array(iv.byteLength + encryptedBuffer.byteLength);
      finalOut.set(iv, 0);
      finalOut.set(encryptedBuffer, iv.byteLength);

      return finalOut;
    }
  }
}
</script>
