function Encoder(channels, samplerate, bitrate, frame_size) {
  this.enc = Module._Encoder_new(channels, samplerate, bitrate, frame_size);
  this.encodedBuffer = null;
}

Encoder.prototype.destroy = function() {
  Module._Encoder_delete(this.enc);
}

Encoder.prototype.enc_frame = function(samples) {
  const sampleBytes = 2; // 2 bytes for int16_t
  const ptr = Module._malloc(samples.length * sampleBytes);
  const pdata = new Int16Array(Module.HEAP16.buffer, ptr, samples.length);
  pdata.set(samples);

  const encodedBufferPtr = Module._malloc(4); // 4 bytes for uint32_t

  const encodedBufferSize = Module._Encoder_enc_frame(this.enc, ptr, samples.length, encodedBufferPtr);
  const encodedBufferAddr = Module.HEAPU32[encodedBufferPtr >> 2];

  Module._free(ptr);
  Module._free(encodedBufferPtr);

  if (encodedBufferSize > 0) {
    const encodedData = new Uint8Array(Module.HEAPU8.buffer, encodedBufferAddr, encodedBufferSize);
    Module._free(encodedBufferAddr);
    return { ok: true, encodedData };
  } else {
    return { ok: false, encodedData: null };
  }
}

function Decoder(channels, samplerate, frame_size) {
  this.dec = Module._Decoder_new(channels, samplerate, frame_size);
  this.frame_size = frame_size;
  this.channels = channels;
}

Decoder.prototype.destroy = function() {
  Module._Decoder_delete(this.dec);
}

Decoder.prototype.dec_frame = function(data) {
  const sampleBytes = 2; // 2 bytes for int16_t
  const bufferPtr = Module._malloc(this.frame_size * this.channels * sampleBytes);
  const bufferView = new Int16Array(Module.HEAP16.buffer, bufferPtr, this.frame_size * this.channels);

  const dataPtr = Module._malloc(data.length);
  Module.HEAPU8.set(data, dataPtr);

  const decodedSize = Module._dec_frame(dataPtr, data.length, bufferPtr);

  const output = Array.from(bufferView);

  Module._free(bufferPtr);
  Module._free(dataPtr);

  return { decodedSize, output };
};

// Export objects
Module.Encoder = Encoder;
Module.Decoder = Decoder;

// Make the module global if not using Node.js
if (Module["ENVIRONMENT"] !== "NODE") {
  libopus = Module;
}
