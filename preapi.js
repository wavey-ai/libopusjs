
(function () {
  const probe = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 7, 1, 96, 0, 1, 123])
  try { Module._opusSIMD = WebAssembly.validate(probe) } catch { Module._opusSIMD = false }
})()

Module.onRuntimeInitialized = function () {
  if (Module.onload) Module.onload()
  Module.loaded = true
}

Module.locateFile = function (url, dir) {
  if (url === 'libopus.wasm') {
    if (typeof LIBOPUS_WASM_URL !== 'undefined') return LIBOPUS_WASM_URL       // manual override
    // Curreent Makefile is not yet building with Intrinsics
    // url = Module._opusSIMD ? 'libopus-simd.wasm' : 'libopus.wasm'              // auto-detect
    if (typeof document !== 'undefined' && document.currentScript) return new URL(url, document.currentScript.src).href
    return dir + url
  }
  return dir + url
}

