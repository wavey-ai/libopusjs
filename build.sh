#!/usr/bin/env bash
set -e

rm -rf release && mkdir release

COMMON_FLAGS=(
  -Iopus/include
  -Lopus/.libs -lopus
  --pre-js preapi.js
  --post-js api.js
  -s MODULARIZE=1
  -s EXPORT_NAME="createOpusModule"
  -s ENVIRONMENT='web,webview,worker,node'
  -s EXPORTED_FUNCTIONS='["_opus_malloc","_opus_free","_malloc","_free"]'
  -s EXPORTED_RUNTIME_METHODS='["HEAP8","HEAPU8","HEAP16","HEAPU16","HEAP32","HEAPU32"]'

  # fixed 16 MB linear memory – no growth
  -s INITIAL_MEMORY=16MB
  -s ALLOW_MEMORY_GROWTH=0

  # leaner/faster code & smaller wasm
  -O3
  -flto
  -DNDEBUG
  -fno-exceptions
  -fno-rtti
  -msimd128            # SIMD for Opus: ~15-20 % speed-up on modern browsers
  -s MALLOC='emmalloc' # lightweight allocator
  -s EXIT_RUNTIME=0
  -s ASSERTIONS=0
  --minify 0
  -s WASM=1
  -s SINGLE_FILE=0
  -s FILESYSTEM=0
)

echo "Building ES-module version…"
em++ api.cpp "${COMMON_FLAGS[@]}" -s EXPORT_ES6=1 -o release/libopus.mjs "$@"

echo "Building classic JS version…"
em++ api.cpp "${COMMON_FLAGS[@]}" -o release/libopus.js "$@"

echo
echo "Build complete:"
echo "- release/libopus.mjs"
echo "- release/libopus.js"
echo "- release/libopus.wasm"
