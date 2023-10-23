#include <emscripten.h>
#include <opus.h>
#include <iostream>

class Encoder {
public:
  Encoder(int _channels, long int _samplerate, long int _bitrate, int _frame_size)
      : enc(NULL), samplerate(_samplerate), channels(_channels), bitrate(_bitrate), frame_size(_frame_size) {
    int err;
    enc = opus_encoder_create(samplerate, channels, OPUS_APPLICATION_AUDIO, &err);

    if (enc == NULL) {
      // Handle error: maybe throw an exception or set an error flag
    }
  }

  size_t enc_frame(const int16_t *data, int size, char **encodedBuffer) {
    size_t max_size = frame_size * channels * 2;  // frame_size * channels * sizeof(int16_t)
    return opus_encode(enc, data, frame_size, (unsigned char *)*encodedBuffer, max_size);
  }

  ~Encoder() {
    if (enc) opus_encoder_destroy(enc);
  }

private:
  long int bitrate, samplerate;
  int channels, frame_size;
  OpusEncoder *enc;
};

class Decoder {
public:
  Decoder(int _channels, long int _samplerate, int _frame_size)
      : dec(NULL), samplerate(_samplerate), channels(_channels), frame_size(_frame_size) {
    int err;
    dec = opus_decoder_create(samplerate, channels, &err);

    if (dec == NULL) {
      // Handle error: maybe throw an exception or set an error flag
    }
  }

  size_t dec_frame(const char *data, size_t size, int16_t *decodedBuffer) {
    return opus_decode(dec, (const unsigned char *)data, size, decodedBuffer, frame_size, 0);
  }

  ~Decoder() {
    if (dec) opus_decoder_destroy(dec);
  }

private:
  long int samplerate;
  int channels, frame_size;
  OpusDecoder *dec;
};

extern "C" {
EMSCRIPTEN_KEEPALIVE Encoder *Encoder_new(int channels, long int samplerate, long int bitrate, int frame_size) {
  return new Encoder(channels, samplerate, bitrate, frame_size);
}

EMSCRIPTEN_KEEPALIVE void Encoder_delete(Encoder *self) {
  delete self;
}

EMSCRIPTEN_KEEPALIVE size_t Encoder_enc_frame(Encoder *self, const int16_t *data, int size, char **encodedBuffer) {
  return self->enc_frame(data, size, encodedBuffer);
}

EMSCRIPTEN_KEEPALIVE Decoder *Decoder_new(int channels, long int samplerate, int frame_size) {
  return new Decoder(channels, samplerate, frame_size);
}

EMSCRIPTEN_KEEPALIVE void Decoder_delete(Decoder *self) {
  delete self;
}

EMSCRIPTEN_KEEPALIVE size_t Decoder_dec_frame(Decoder *self, const char *data, size_t size, int16_t *decodedBuffer) {
  return self->dec_frame(data, size, decodedBuffer);
}
}
