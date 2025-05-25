#!/bin/bash

echo "Building Opus library..."
./build.sh

if [ $? -ne 0 ]; then
  echo "Build failed!"
  exit 1
fi

echo ""
echo "Running sine wave test..."
node test-sine-wave.js

if [ $? -eq 0 ]; then
  echo ""
  echo "Test Results Summary:"
  echo "----------------------------------------"

  if [ -f "original-sine.pcm" ] && [ -f "decoded-sine.pcm" ]; then
    original_size=$(stat -f%z "original-sine.pcm" 2>/dev/null || stat -c%s "original-sine.pcm" 2>/dev/null)
    decoded_size=$(stat -f%z "decoded-sine.pcm" 2>/dev/null || stat -c%s "decoded-sine.pcm" 2>/dev/null)

    echo "Original PCM: $(echo "scale=1; $original_size / 1024 / 1024" | bc -l)MB"
    echo "Decoded PCM:  $(echo "scale=1; $decoded_size / 1024 / 1024" | bc -l)MB"

    if [ "$original_size" -eq "$decoded_size" ]; then
      echo "File sizes match perfectly"
    else
      echo "Warning: File size difference: $(($decoded_size - $original_size)) bytes"
    fi

    echo ""
    echo "To listen to the results:"
    echo "   Original: ffplay -f s16le -ar 48000 -ac 2 original-sine.pcm"
    echo "   Decoded:  ffplay -f s16le -ar 48000 -ac 2 decoded-sine.pcm"
    echo ""
    echo "To analyze with Audacity:"
    echo "   Import as Raw data: Signed 16-bit PCM, 48000Hz, Stereo"
  else
    echo "PCM files not found"
  fi
else
  echo "Test failed!"
  exit 1
fi
