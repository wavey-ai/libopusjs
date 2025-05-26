#!/usr/bin/env bash
set -euo pipefail

# ---------- 1 · compile both artefacts ---------------------------------
echo "Building libopus"
make -s # invokes the Makefile we created

echo ""
echo "Running sine-wave test (baseline build)…"
LIBOPUS_WASM_URL=release/libopus.wasm node test-sine-wave.js

# ---------- 4 · short summary of generated PCM -------------------------
echo ""
echo "Test Results Summary:"
echo "----------------------------------------"
if [[ -f original-sine.pcm && -f decoded-sine.pcm ]]; then
  ori=$(stat -f%z original-sine.pcm 2>/dev/null || stat -c%s original-sine.pcm)
  dec=$(stat -f%z decoded-sine.pcm 2>/dev/null || stat -c%s decoded-sine.pcm)
  printf "original-sine.pcm: %.2f MB\n" "$(bc -l <<<"$ori/1048576")"
  printf "decoded-sine.pcm : %.2f MB\n" "$(bc -l <<<"$dec/1048576")"
  [[ $ori -eq $dec ]] && echo "Files are identical in size." ||
    echo "File size differs by $((dec - ori)) bytes."
  echo ""
  echo "Play them with:"
  echo "  ffplay -f s16le -ar 48000 -ch_layout stereo original-sine.pcm"
  echo "  ffplay -f s16le -ar 48000 -ch_layout stereo decoded-sine.pcm"
else
  echo "PCM files not found."
fi
