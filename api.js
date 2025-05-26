function Encoder(ch, rate, br, fsz) {
  this.ptr = Module._Encoder_new(ch, rate, br, fsz)
  this.fsz = fsz
  this.ch = ch
  this.in = Module._opus_malloc(fsz * ch * 2)
  this.out = Module._opus_malloc(4000)
}

Encoder.prototype.destroy = function () {
  Module._Encoder_delete(this.ptr)
  Module._opus_free(this.in)
  Module._opus_free(this.out)
}

Encoder.prototype.enc_frame = function (samples) {
  Module.HEAP16.set(samples, this.in >> 1)
  const n = Module._Encoder_enc_frame(this.ptr, this.in, samples.length, this.out, 4000)
  if (n <= 0) return { ok: false, encodedData: null }
  return { ok: true, encodedData: Module.HEAPU8.slice(this.out, this.out + n) }
}

function Decoder(ch, rate, fsz) {
  this.ptr = Module._Decoder_new(ch, rate, fsz)
  this.fsz = fsz
  this.ch = ch
  this.in = Module._opus_malloc(4000)
  this.out = Module._opus_malloc(fsz * ch * 2)
}

Decoder.prototype.destroy = function () {
  Module._Decoder_delete(this.ptr)
  Module._opus_free(this.in)
  Module._opus_free(this.out)
}

Decoder.prototype.dec_frame = function (data) {
  Module.HEAPU8.set(data, this.in)
  const d = Module._Decoder_dec_frame(this.ptr, this.in, data.length, this.out)
  if (d <= 0) return { decodedSize: 0, output: [] }
  const view = Module.HEAP16.subarray(this.out >> 1, (this.out >> 1) + d * this.ch)
  return { decodedSize: d, output: Array.from(view) }
}

Module.Encoder = Encoder
Module.Decoder = Decoder
