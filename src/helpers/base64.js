export function abtob64(ab) {
  let view = new Uint8Array(ab);
  let tempBuffer = '';

  for (let i = 0; i < view.length; i++) {
    tempBuffer += String.fromCharCode(view[i]);
  }

  return btoa(tempBuffer);
}
