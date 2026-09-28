// src/services/audioStegoService.js
//
// Real LSB steganography for uncompressed PCM WAV audio. Parses the RIFF/WAVE
// container directly (no Web Audio decoding, which can resample/alter
// samples) so the exported WAV is byte-for-byte the original except for the
// LSBs actually used to carry the payload. Supports 16-bit PCM, the most
// common WAV sample format.

import { bytesToBits, bitsToBytes, writeLSBs, readLSBs } from "../utils/bitUtils";

const MINI_HEADER_BITS = 64;
const MAX_BIT_DEPTH = 4;

function readString(dv, offset, length) {
  let s = "";
  for (let i = 0; i < length; i++) s += String.fromCharCode(dv.getUint8(offset + i));
  return s;
}

/**
 * Minimal RIFF/WAVE parser. Returns the parsed format info plus the byte
 * offset and length of the `data` chunk (the actual PCM samples).
 */
function parseWav(arrayBuffer) {
  const dv = new DataView(arrayBuffer);
  if (readString(dv, 0, 4) !== "RIFF" || readString(dv, 8, 4) !== "WAVE") {
    throw new Error("Not a valid WAV file (missing RIFF/WAVE header).");
  }

  let offset = 12;
  let fmt = null;
  let dataOffset = -1;
  let dataLength = -1;

  while (offset + 8 <= dv.byteLength) {
    const chunkId = readString(dv, offset, 4);
    const chunkSize = dv.getUint32(offset + 4, true);
    const chunkBodyOffset = offset + 8;

    if (chunkId === "fmt ") {
      fmt = {
        audioFormat: dv.getUint16(chunkBodyOffset, true),
        numChannels: dv.getUint16(chunkBodyOffset + 2, true),
        sampleRate: dv.getUint32(chunkBodyOffset + 4, true),
        byteRate: dv.getUint32(chunkBodyOffset + 8, true),
        blockAlign: dv.getUint16(chunkBodyOffset + 12, true),
        bitsPerSample: dv.getUint16(chunkBodyOffset + 14, true),
      };
    } else if (chunkId === "data") {
      dataOffset = chunkBodyOffset;
      dataLength = chunkSize;
    }

    offset = chunkBodyOffset + chunkSize + (chunkSize % 2); // chunks are word-aligned
  }

  if (!fmt) throw new Error("WAV file has no fmt chunk.");
  if (dataOffset === -1) throw new Error("WAV file has no data chunk.");
  if (fmt.audioFormat !== 1) {
    throw new Error("Only uncompressed PCM WAV files are supported (audioFormat must be 1).");
  }
  if (fmt.bitsPerSample !== 16) {
    throw new Error(
      `Only 16-bit PCM WAV files are currently supported (this file is ${fmt.bitsPerSample}-bit).`
    );
  }

  return { fmt, dataOffset, dataLength };
}

export async function getAudioInfo(file) {
  const buffer = await file.arrayBuffer();
  const { fmt, dataLength } = parseWav(buffer);
  const sampleCount = dataLength / 2; // 16-bit = 2 bytes/sample
  const capacities = {};
  for (let bd = 1; bd <= MAX_BIT_DEPTH; bd++) {
    capacities[bd] = calculateAudioCapacity(sampleCount, bd);
  }
  const durationSeconds = sampleCount / fmt.numChannels / fmt.sampleRate;
  return { ...fmt, sampleCount, durationSeconds, capacities };
}

export function calculateAudioCapacity(sampleCount, bitDepth = 1) {
  const remainingSamples = sampleCount - MINI_HEADER_BITS;
  if (remainingSamples <= 0) return 0;
  const payloadBits = remainingSamples * bitDepth;
  return Math.max(0, Math.floor(payloadBits / 8));
}

/**
 * Embed payloadBytes into a WAV file's sample LSBs. Returns a new WAV Blob,
 * identical to the original except for the modified sample LSBs.
 */
export async function embedInAudio(file, payloadBytes, { bitDepth = 1 } = {}) {
  if (bitDepth < 1 || bitDepth > MAX_BIT_DEPTH) {
    throw new Error(`Bit depth must be between 1 and ${MAX_BIT_DEPTH}.`);
  }
  const originalBuffer = await file.arrayBuffer();
  const { dataOffset, dataLength } = parseWav(originalBuffer);
  const sampleCount = dataLength / 2;
  const capacity = calculateAudioCapacity(sampleCount, bitDepth);

  if (payloadBytes.length > capacity) {
    throw new Error(
      `Payload too large for this audio file at ${bitDepth}-bit depth. ` +
        `Capacity: ${capacity} bytes, payload: ${payloadBytes.length} bytes.`
    );
  }

  // Work on a copy so the original ArrayBuffer/file is never mutated.
  const outBuffer = originalBuffer.slice(0);
  const dv = new DataView(outBuffer);

  const headerBits = [];
  for (let b = 7; b >= 0; b--) headerBits.push((bitDepth >> b) & 1);
  for (let b = 31; b >= 0; b--) headerBits.push((payloadBytes.length >> b) & 1);
  for (let i = 0; i < 24; i++) headerBits.push(0);

  let sampleIndex = 0;
  const readSample = (i) => dv.getInt16(dataOffset + i * 2, true);
  const writeSample = (i, v) => dv.setInt16(dataOffset + i * 2, v, true);

  for (let i = 0; i < MINI_HEADER_BITS; i++) {
    const s = readSample(sampleIndex);
    const newS = writeLSBs(s & 0xffff, [headerBits[i]]);
    writeSample(sampleIndex, (newS << 16) >> 16); // preserve sign via Int16 wraparound
    sampleIndex++;
  }

  const payloadBits = bytesToBits(payloadBytes);
  let bitCursor = 0;
  while (bitCursor < payloadBits.length) {
    if (sampleIndex >= sampleCount) break;
    const chunk = [];
    for (let i = 0; i < bitDepth; i++) {
      chunk.push(bitCursor < payloadBits.length ? payloadBits[bitCursor] : 0);
      bitCursor++;
    }
    const s = readSample(sampleIndex);
    const newS = writeLSBs(s & 0xffff, chunk);
    writeSample(sampleIndex, (newS << 16) >> 16);
    sampleIndex++;
  }

  return new Blob([outBuffer], { type: "audio/wav" });
}

export async function extractFromAudio(file) {
  const buffer = await file.arrayBuffer();
  const { dataOffset, dataLength } = parseWav(buffer);
  const sampleCount = dataLength / 2;
  const dv = new DataView(buffer);
  const readSample = (i) => dv.getInt16(dataOffset + i * 2, true) & 0xffff;

  let sampleIndex = 0;
  const headerBits = [];
  for (let i = 0; i < MINI_HEADER_BITS; i++) {
    if (sampleIndex >= sampleCount) throw new Error("Audio file is too short to contain a StegaVault mini-header.");
    headerBits.push(readLSBs(readSample(sampleIndex), 1)[0]);
    sampleIndex++;
  }

  let bitDepth = 0;
  for (let i = 0; i < 8; i++) bitDepth = (bitDepth << 1) | headerBits[i];
  let payloadLength = 0;
  for (let i = 8; i < 40; i++) payloadLength = (payloadLength << 1) | headerBits[i];

  if (bitDepth < 1 || bitDepth > MAX_BIT_DEPTH) {
    throw new Error("No StegaVault payload detected in this audio file (invalid header).");
  }
  if (payloadLength <= 0 || payloadLength > 200 * 1024 * 1024) {
    throw new Error("No StegaVault payload detected in this audio file (implausible length).");
  }

  const totalBitsNeeded = payloadLength * 8;
  const bits = new Uint8Array(totalBitsNeeded);
  let bitCursor = 0;
  while (bitCursor < totalBitsNeeded) {
    if (sampleIndex >= sampleCount) {
      throw new Error("Audio file ended before the full payload could be read (truncated or wrong bit depth).");
    }
    const chunk = readLSBs(readSample(sampleIndex), bitDepth);
    sampleIndex++;
    for (let i = 0; i < chunk.length && bitCursor < totalBitsNeeded; i++) {
      bits[bitCursor++] = chunk[i];
    }
  }

  return bitsToBytes(bits);
}

export const AUDIO_STEGO_CONSTANTS = { MINI_HEADER_BITS, MAX_BIT_DEPTH };
