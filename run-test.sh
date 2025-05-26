#!/usr/bin/env bash
set -euo pipefail

# ---------- 1 · compile both artefacts ---------------------------------
echo "Building libopus (+ SIMD) …"
make -s # invokes the Makefile we created

# ---------- 2 · run SIMD test ------------------------------------------
echo ""
echo "Running sine-wave test (SIMD build)…"
node test-sine-wave.js

# ---------- 3 · run baseline test --------------------------------------
echo ""
echo "Running sine-wave test (baseline build)…"
LIBOPUS_WASM_URL=release/libopus.wasm node test-sine-wave.js
