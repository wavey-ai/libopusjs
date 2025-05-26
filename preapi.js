/* preapi.js – minimal glue shared by libopus.mjs / libopus.js              */
/* runs before the compiled wasm/JS boot-straps.                           */

Module.onRuntimeInitialized = () => {
  Module.loaded = true;
  if (Module.onload) Module.onload();
};

/* Resolve the .wasm beside the current script (works in browser & Worker). */
Module.locateFile = (url, scriptDir) => {
  if (url.endsWith('.wasm')) {
    if (typeof LIBOPUS_WASM_URL !== 'undefined') return LIBOPUS_WASM_URL;
    if (typeof document !== 'undefined' && document.currentScript)
      return new URL(url, document.currentScript.src).href;
  }
  return scriptDir + url;
};

