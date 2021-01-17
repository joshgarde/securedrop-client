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
            <p class="is-size-4">{{filename}}</p>
            <p class="is-size-6">Size: {{size}} bytes</p>
          </div>
        </div>

        <div class="field is-horizontal">
          <div class="field-label is-normal">
            <label class="label">SHA-512</label>
          </div>
          <div class="field-body">
            <div class="field">
              <p class="control is-expanded">
                <input class="input" type="text" v-bind:value="sha512">
              </p>
            </div>
          </div>
        </div>

        <div class="field is-horizontal">
          <div class="field-label is-normal">
            <label class="label">SHA-256</label>
          </div>
          <div class="field-body">
            <div class="field">
              <p class="control is-expanded">
                <input class="input" type="text" v-bind:value="sha256">
              </p>
            </div>
          </div>
        </div>

        <button class="button is-primary" v-on:click="download">
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
import {b64toab} from '../helpers/converters';
const fileDownload = require('js-file-download');

var id, key, authtext;

export default {
  name: 'Downloader',
  data: () => {
    return {
      sha512: '',
      sha256: '',
      filename: '',
      size: -1
    }
  },
  methods: {
    async download() {
      await retrieveFile(id, key, authtext, this.filename);
    }
  },
  async mounted() {
    id = getId();
    key = await getKey();

    let metadata = await retrieveMetadata(id, key);
    console.log(`[INFO] Decrypted metadata: ${JSON.stringify(metadata)}`);

    this.sha512 = metadata.hash.sha512;
    this.sha256 = metadata.hash.sha256;
    this.filename = metadata.filename;
    this.size = metadata.size;

    authtext = metadata.authtext;
  }
}

async function retrieveFile(id, key, authtext, filename) {
  let presignResponse = (await axios.post(`/download/${id}`, {body: {authtext: authtext}})).data;

  if (!presignResponse.success) return false;

  let downloadUrl = presignResponse['download-url'];
  let rawDownload = await (await axios(downloadUrl, {responseType: 'blob'})).data.arrayBuffer();

  let iv = rawDownload.slice(0, 12);
  let encrypted = rawDownload.slice(12);

  let decrypted = await crypto.subtle.decrypt(
    {name: 'AES-GCM', iv}, key, encrypted
  );

  fileDownload(decrypted, filename);
}

async function retrieveMetadata(id, key) {
  let response = (await axios(`/metadata/${id}`)).data;

  if (!response.success) return false;

  let raw = b64toab(response.metadata);
  let iv = raw.slice(0, 12);
  let encrypted = raw.slice(12);

  let decrypted = await crypto.subtle.decrypt(
    {name: 'AES-GCM', iv}, key, encrypted
  );

  let decoder = new TextDecoder();
  let metadata = JSON.parse(decoder.decode(decrypted));

  return metadata;
}

async function getKey() {
  if (location.hash.length <= 1) return null;

  let rawKey = b64toab(location.hash.slice(1));
  let key = await crypto.subtle.importKey('raw', rawKey, 'AES-GCM', false, ['encrypt', 'decrypt']);

  return key;
}

function getId() {
  if (location.pathname.length <= 1) return null;

  return location.pathname.slice(1);
}
</script>
