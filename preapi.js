(function () {
  const probe = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 7, 1, 96, 0, 1, 123])
  try { Module._opusSIMD = WebAssembly.validate(probe) } catch { Module._opusSIMD = false }
})()

Module.onRuntimeInitialized = function () {
  if (Module.onload) Module.onload()
  Module.loaded = true
}

if (!Module.locateFile) {
  Module.locateFile = function (url, dir) {
    if (url === 'libopus.wasm') {
      if (Module.wasmURL) return Module.wasmURL                                    // ← honour ctor arg
      if (typeof LIBOPUS_WASM_URL !== 'undefined') return LIBOPUS_WASM_URL        // env override
      if (typeof document !== 'undefined' && document.currentScript)
        return new URL(url, document.currentScript.src).href
      return dir + url                                                            // fallback
    }
    return dir + url
  }
}
