#!/usr/bin/env node

import createOpusModule from './release/libopus.mjs'
import fs from 'fs'

const SRC = 'testdata/harvard01.pcm'
const ENC = 'testdata/harvard01.enc'
const DEC = 'testdata/harvard01_dec.pcm'

const SR = 16000
const CH = 1
const FR = 320
const BR = 32000
const SPF = FR * CH

const pcmBuf = fs.readFileSync(SRC)
const pcm = new Int16Array(pcmBuf.buffer, pcmBuf.byteOffset, pcmBuf.byteLength >> 1)
const frames = Math.floor(pcm.length / SPF)

const Module = await createOpusModule()
const enc = new Module.Encoder(CH, SR, BR, FR)
const dec = new Module.Decoder(CH, SR, FR)

const chunks = []
for (let i = 0; i < frames; i++) {
  const s = i * SPF
  const r = enc.enc_frame(pcm.subarray(s, s + SPF))
  if (r.ok) chunks.push(r.encodedData)
}
fs.writeFileSync(ENC, Buffer.concat(chunks.map(c => Buffer.from(c))))

const out = new Int16Array(frames * SPF)
let off = 0
for (const c of chunks) {
  const r = dec.dec_frame(c)
  if (r.decodedSize > 0) {
    out.set(r.output, off)
    off += r.output.length
  }
}
fs.writeFileSync(DEC, Buffer.from(out.buffer, 0, off << 1))

enc.destroy()
dec.destroy()

const layout = CH === 1 ? 'mono' : 'stereo'
console.log('\nPlay decoded PCM:')
console.log(`ffplay -f s16le -ar ${SR} -ch_layout ${layout} ${DEC}\n`)
console.log('Play encoded Opus:')
console.log(`ffmpeg -f opus -ar ${SR} -ch_layout ${layout} -i ${ENC} -f s16le - | ffplay -f s16le -ar ${SR} -ch_layout ${layout} -`)

