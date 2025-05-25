function Encoder(channels, samplerate, bitrate, frame_size) {
  this.enc = Module._Encoder_new(channels, samplerate, bitrate, frame_size);
  this.frame_size = frame_size;
  this.channels = channels;
}

Encoder.prototype.destroy = function () {
  Module._Encoder_delete(this.enc);
}

Encoder.prototype.enc_frame = function (samples) {
  // Check if Module and HEAPU8 are available
  if (!Module || !Module.HEAPU8) {
    console.error('Module or HEAPU8 not available');
    return { ok: false, encodedData: null };
  }

  const sampleBytes = 2; // 2 bytes for int16_t
  const inputPtr = Module._opus_malloc(samples.length * sampleBytes);

  if (!inputPtr) {
    console.error('Failed to allocate input memory');
    return { ok: false, encodedData: null };
  }

  // Use HEAP16 view for 16-bit samples instead of byte manipulation
  const heap16 = new Int16Array(Module.HEAPU8.buffer, inputPtr, samples.length);
  heap16.set(samples);

  // Allocate output buffer - max size for Opus frame  
  const maxOutputSize = 4000; // Max Opus frame size
  const outputPtr = Module._opus_malloc(maxOutputSize);

  if (!outputPtr) {
    console.error('Failed to allocate output memory');
    Module._opus_free(inputPtr);
    return { ok: false, encodedData: null };
  }

  const encodedSize = Module._Encoder_enc_frame(this.enc, inputPtr, samples.length, outputPtr, maxOutputSize);

  // Copy the encoded data
  let result;
  if (encodedSize > 0) {
    const encodedData = new Uint8Array(encodedSize);
    encodedData.set(Module.HEAPU8.subarray(outputPtr, outputPtr + encodedSize));
    result = { ok: true, encodedData };
  } else {
    result = { ok: false, encodedData: null };
  }

  // Clean up
  Module._opus_free(inputPtr);
  Module._opus_free(outputPtr);

  return result;
}

function Decoder(channels, samplerate, frame_size) {
  this.dec = Module._Decoder_new(channels, samplerate, frame_size);
  this.frame_size = frame_size;
  this.channels = channels;
}

Decoder.prototype.destroy = function () {
  Module._Decoder_delete(this.dec);
}

Decoder.prototype.dec_frame = function (data) {
  // Check if Module and HEAPU8 are available
  if (!Module || !Module.HEAPU8) {
    console.error('Module or HEAPU8 not available');
    return { decodedSize: 0, output: [] };
  }

  const inputPtr = Module._opus_malloc(data.length);

  if (!inputPtr) {
    console.error('Failed to allocate input memory');
    return { decodedSize: 0, output: [] };
  }

  // Copy input data to WASM memory
  Module.HEAPU8.set(data, inputPtr);

  const outputSize = this.frame_size * this.channels;
  const sampleBytes = 2; // 2 bytes for int16_t
  const outputPtr = Module._opus_malloc(outputSize * sampleBytes);

  if (!outputPtr) {
    console.error('Failed to allocate output memory');
    Module._opus_free(inputPtr);
    return { decodedSize: 0, output: [] };
  }

  const decodedSamples = Module._Decoder_dec_frame(this.dec, inputPtr, data.length, outputPtr);

  let result;
  if (decodedSamples > 0) {
    // FIXED: Create a proper Int16Array view of the output buffer
    // The key issue was likely incorrect buffer offset calculation
    const actualOutputSize = decodedSamples * this.channels;
    const heap16 = new Int16Array(Module.HEAPU8.buffer, outputPtr, actualOutputSize);

    // Copy to a regular array to avoid issues with detached buffers
    const output = new Array(actualOutputSize);
    for (let i = 0; i < actualOutputSize; i++) {
      output[i] = heap16[i];
    }

    result = { decodedSize: decodedSamples, output };
  } else {
    // Handle decoding errors
    console.error('Opus decoder returned:', decodedSamples);
    result = { decodedSize: 0, output: [] };
  }

  // Clean up
  Module._opus_free(inputPtr);
  Module._opus_free(outputPtr);

  return result;
};

// Export objects
Module.Encoder = Encoder;
Module.Decoder = Decoder;

// Expose memory management functions
Module._malloc = Module._opus_malloc;
Module._free = Module._opus_free;

// Only set global libopus in non-ES module environments
if (typeof globalThis !== 'undefined' && !globalThis.libopus) {
  globalThis.libopus = Module;
}

