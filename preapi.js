Module.onRuntimeInitialized = function () {
  if (Module.onload) Module.onload();
  Module.loaded = true;
};

Module.locateFile = function (url, scriptDirectory) {
  if (url === "libopus.wasm") {
    if (typeof LIBOPUS_WASM_URL !== "undefined") return LIBOPUS_WASM_URL;
    if (typeof document !== "undefined" && document.currentScript) {
      return new URL(url, document.currentScript.src).href;
    }
    return scriptDirectory + url;
  }
  return scriptDirectory + url;
};

