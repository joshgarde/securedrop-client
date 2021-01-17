export function abtob64(ab) {
  let view = new Uint8Array(ab);
  let tempBuffer = '';

  for (let i = 0; i < view.length; i++) {
    tempBuffer += String.fromCharCode(view[i]);
  }

  return btoa(tempBuffer);
}

export function b64toab(b64) {
  let rawString = atob(b64);
  return strtoab(rawString);
}

export function strtoab(str) {
  let ab = new ArrayBuffer(str.length);
  let view = new Uint8Array(ab);

  for (let i = 0; i < view.length; i++) {
    view[i] = str.charCodeAt(i);
  }

  return ab;
}

export function abtohex(ab) {
  let array = Array.from(new Uint8Array(ab));
  return array.map(b => b.toString(16).padStart(2, '0')).join('');
}
