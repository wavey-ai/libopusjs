Module["onRuntimeInitialized"] = function () {
  if (Module.onload)
    Module.onload();
  Module.loaded = true;
}

// Handle WASM file loading in different environments
Module["locateFile"] = function (url, scriptDirectory) {
  if (url === "libopus.wasm") {
    // For bundlers that handle WASM imports
    if (typeof LIBOPUS_WASM_URL !== "undefined") {
      return LIBOPUS_WASM_URL;
    }
    // For ES modules, use a safer approach that doesn't break the optimizer
    if (typeof document !== 'undefined' && document.currentScript) {
      // Browser environment with current script
      return new URL(url, document.currentScript.src).href;
    }
    // For module environments, the default behavior should work
    return scriptDirectory + url;
  }
  return scriptDirectory + url;
}
