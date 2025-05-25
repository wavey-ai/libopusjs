#!/bin/bash

rm -rf release && mkdir release

# Minimal changes for Webpack + memory cap for real-time encoding
em++ api.cpp -Iopus/include -Lopus/.libs -lopus \
  --pre-js preapi.js \
  --post-js api.js \
  -s MODULARIZE=1 \
  -s EXPORT_ES6=1 \
  -s EXPORT_NAME="createOpusModule" \
  -s ENVIRONMENT='web,webview,worker,node' \
  -s EXPORTED_FUNCTIONS='["_opus_malloc","_opus_free"]' \
  -s INITIAL_MEMORY=2MB \
  -s MAXIMUM_MEMORY=16MB \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s WASM=1 \
  -s SINGLE_FILE=0 \
  -s FILESYSTEM=0 \
  -s ASSERTIONS=0 \
  -s MINIFY_HTML=0 \
  --minify 0 \
  -O2 \
  $@ \
  -o release/libopus.mjs

# Build 2: Classic JavaScript version (for importScripts/public loading)
echo "Building classic JavaScript version..."
em++ api.cpp -Iopus/include -Lopus/.libs -lopus \
  --pre-js preapi.js \
  --post-js api.js \
  -s MODULARIZE=1 \
  -s EXPORT_NAME="createOpusModule" \
  -s ENVIRONMENT='web,webview,worker' \
  -s EXPORTED_FUNCTIONS='["_opus_malloc","_opus_free"]' \
  -s INITIAL_MEMORY=2MB \
  -s MAXIMUM_MEMORY=16MB \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s WASM=1 \
  -s SINGLE_FILE=0 \
  -s FILESYSTEM=0 \
  -s ASSERTIONS=0 \
  -O2 \
  $@ \
  -o release/libopus.js

echo ""
echo "Build complete! Files generated:"
echo "ES Module (Webpack/bundlers):"
echo "- release/libopus.mjs"
echo "Classic JS (importScripts/public):"
echo "- release/libopus.js"
echo "Shared:"
echo "- release/libopus.wasm"
echo ""
echo "Memory settings: Initial 2MB, Maximum 16MB"
