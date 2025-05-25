#!/usr/bin/env node

// Test for libopus.mjs - Encode/decode 60 second sine wave with debug info
import createOpusModule from './release/libopus.mjs';
import fs from 'fs';

// Audio parameters
const SAMPLE_RATE = 48000;
const CHANNELS = 2; // Stereo
const FRAME_SIZE = 960; // 20ms at 48kHz
const BITRATE = 128000;
const DURATION_SECONDS = 60;
const FREQUENCY = 440; // A4 note

const TOTAL_SAMPLES = SAMPLE_RATE * DURATION_SECONDS * CHANNELS;
const SAMPLES_PER_FRAME = FRAME_SIZE * CHANNELS;

console.log('Opus Sine Wave Test (Debug Version)');
console.log(`Duration: ${DURATION_SECONDS}s`);
console.log(`Sample Rate: ${SAMPLE_RATE}Hz`);
console.log(`Channels: ${CHANNELS}`);
console.log(`Frame Size: ${FRAME_SIZE}`);
console.log(`Bitrate: ${BITRATE}bps`);
console.log(`Frequency: ${FREQUENCY}Hz`);
console.log(`Total Samples: ${TOTAL_SAMPLES}`);
console.log(`Samples Per Frame: ${SAMPLES_PER_FRAME}`);
console.log('');

async function generateSineWave() {
  console.log('Generating sine wave...');

  const samples = new Int16Array(TOTAL_SAMPLES);
  const amplitude = 16384; // Half of int16 range for safety

  for (let i = 0; i < TOTAL_SAMPLES; i += CHANNELS) {
    const t = (i / CHANNELS) / SAMPLE_RATE;
    const sampleValue = Math.sin(2 * Math.PI * FREQUENCY * t) * amplitude;

    // Stereo: same signal on both channels
    samples[i] = sampleValue;     // Left
    samples[i + 1] = sampleValue; // Right
  }

  console.log(`✓ Generated ${TOTAL_SAMPLES} samples (${(TOTAL_SAMPLES * 2 / 1024 / 1024).toFixed(1)}MB)`);
  return samples;
}

async function testOpusEncoding() {
  try {
    console.log('Initializing Opus module...');
    const Module = await createOpusModule();
    console.log('✓ Opus module loaded');

    // Generate sine wave
    const originalSamples = await generateSineWave();

    // Create encoder and decoder
    console.log('Creating encoder and decoder...');
    const encoder = new Module.Encoder(CHANNELS, SAMPLE_RATE, BITRATE, FRAME_SIZE);
    const decoder = new Module.Decoder(CHANNELS, SAMPLE_RATE, FRAME_SIZE);
    console.log('✓ Encoder and decoder created');

    // Test with just first few frames for debugging
    const testFrames = 10;
    console.log(`\nTesting first ${testFrames} frames for debugging...`);

    for (let frame = 0; frame < testFrames; frame++) {
      const start = frame * SAMPLES_PER_FRAME;
      const end = start + SAMPLES_PER_FRAME;
      const frameData = originalSamples.slice(start, end);

      console.log(`\nFrame ${frame}:`);
      console.log(`  Input samples: ${frameData.length}`);
      console.log(`  First few samples: [${frameData.slice(0, 4).join(', ')}]`);

      const encResult = encoder.enc_frame(frameData);
      console.log(`  Encode result: ok=${encResult.ok}, size=${encResult.encodedData?.length || 0}`);

      if (encResult.ok) {
        const decResult = decoder.dec_frame(encResult.encodedData);
        console.log(`  Decode result: decodedSize=${decResult.decodedSize}, outputLength=${decResult.output.length}`);

        if (decResult.output.length > 0) {
          console.log(`  First few decoded: [${decResult.output.slice(0, 4).join(', ')}]`);

          // Compare first few samples
          const errors = [];
          for (let i = 0; i < Math.min(4, frameData.length, decResult.output.length); i++) {
            const error = Math.abs(frameData[i] - decResult.output[i]);
            errors.push(error);
          }
          console.log(`  Sample errors: [${errors.join(', ')}]`);
        } else {
          console.log('  ✗ No decoded output!');
        }
      }
    }

    // Now run full test
    console.log('\nRunning full encoding test...');
    const encodedChunks = [];
    const totalFrames = Math.floor(TOTAL_SAMPLES / SAMPLES_PER_FRAME);
    let encodedBytes = 0;
    let failedFrames = 0;

    for (let frame = 0; frame < totalFrames; frame++) {
      const start = frame * SAMPLES_PER_FRAME;
      const end = start + SAMPLES_PER_FRAME;
      const frameData = originalSamples.slice(start, end);

      if (frameData.length === SAMPLES_PER_FRAME) {
        const result = encoder.enc_frame(frameData);
        if (result.ok) {
          encodedChunks.push(result.encodedData);
          encodedBytes += result.encodedData.length;
        } else {
          failedFrames++;
          if (failedFrames < 5) { // Only log first few failures
            console.error(`✗ Encoding failed at frame ${frame}`);
          }
        }
      }

      // Progress indicator
      if (frame % 1000 === 0) {
        const progress = ((frame / totalFrames) * 100).toFixed(1);
        process.stdout.write(`\rEncoding progress: ${progress}%`);
      }
    }

    console.log(`\n✓ Encoding complete: ${encodedChunks.length} frames, ${(encodedBytes / 1024).toFixed(1)}KB`);
    if (failedFrames > 0) {
      console.log(`⚠ Failed frames: ${failedFrames}`);
    }

    // Calculate compression ratio
    const originalSize = TOTAL_SAMPLES * 2; // 2 bytes per sample
    const compressionRatio = (originalSize / encodedBytes).toFixed(1);
    console.log(`Compression ratio: ${compressionRatio}:1 (${((1 - encodedBytes / originalSize) * 100).toFixed(1)}% reduction)`);

    // Decode the audio
    console.log('Starting decoding...');
    const decodedSamples = new Int16Array(TOTAL_SAMPLES);
    let decodedOffset = 0;
    let failedDecodes = 0;

    for (let i = 0; i < encodedChunks.length; i++) {
      const result = decoder.dec_frame(encodedChunks[i]);

      if (result.decodedSize > 0 && result.output.length > 0) {
        const frameLength = Math.min(result.output.length, TOTAL_SAMPLES - decodedOffset);
        for (let j = 0; j < frameLength; j++) {
          decodedSamples[decodedOffset + j] = result.output[j];
        }
        decodedOffset += frameLength;
      } else {
        failedDecodes++;
        if (failedDecodes < 5) { // Only log first few failures
          console.error(`✗ Decoding failed at chunk ${i}: decodedSize=${result.decodedSize}, outputLength=${result.output.length}`);
        }
      }

      // Progress indicator
      if (i % 1000 === 0) {
        const progress = ((i / encodedChunks.length) * 100).toFixed(1);
        process.stdout.write(`\rDecoding progress: ${progress}%`);
      }
    }

    console.log(`\n✓ Decoding complete: ${decodedOffset} samples decoded`);
    if (failedDecodes > 0) {
      console.log(`⚠ Failed decodes: ${failedDecodes}`);
    }

    // Calculate audio quality metrics
    console.log('Calculating quality metrics...');
    let sumSquaredError = 0;
    let maxError = 0;
    let nonZeroSamples = 0;

    const samplesCompared = Math.min(originalSamples.length, decodedSamples.length);

    for (let i = 0; i < samplesCompared; i++) {
      if (decodedSamples[i] !== 0) nonZeroSamples++;

      const error = Math.abs(originalSamples[i] - decodedSamples[i]);
      sumSquaredError += error * error;
      maxError = Math.max(maxError, error);
    }

    const mse = sumSquaredError / samplesCompared;
    const rmse = Math.sqrt(mse);
    const snr = rmse > 0 ? 20 * Math.log10(32767 / rmse) : Infinity;

    console.log(`Quality Metrics:`);
    console.log(`   Samples compared: ${samplesCompared}`);
    console.log(`   Non-zero decoded samples: ${nonZeroSamples}`);
    console.log(`   RMSE: ${rmse.toFixed(2)}`);
    console.log(`   SNR: ${snr.toFixed(2)} dB`);
    console.log(`   Max Error: ${maxError}`);

    // Save original and decoded PCM files
    console.log('Saving files...');

    // Convert Int16Array to Buffer for file writing
    const originalBuffer = Buffer.from(originalSamples.buffer);
    const decodedBuffer = Buffer.from(decodedSamples.buffer);

    fs.writeFileSync('original-sine.pcm', originalBuffer);
    fs.writeFileSync('decoded-sine.pcm', decodedBuffer);

    console.log('✓ Files saved:');
    console.log(`   original-sine.pcm (${(originalBuffer.length / 1024 / 1024).toFixed(1)}MB)`);
    console.log(`   decoded-sine.pcm (${(decodedBuffer.length / 1024 / 1024).toFixed(1)}MB)`);

    // Cleanup
    encoder.destroy();
    decoder.destroy();

    console.log('');
    console.log('Test completed successfully!');
    console.log('');
    console.log('To play the files:');
    console.log(`   ffplay -f s16le -ar ${SAMPLE_RATE} -ac ${CHANNELS} original-sine.pcm`);
    console.log(`   ffplay -f s16le -ar ${SAMPLE_RATE} -ac ${CHANNELS} decoded-sine.pcm`);

  } catch (error) {
    console.error('✗ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testOpusEncoding();
