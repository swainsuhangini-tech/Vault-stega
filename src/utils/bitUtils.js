// src/utils/bitUtils.js
// Low-level bit packing/unpacking helpers shared by the image and audio
// LSB steganography engines.

/** Convert bytes to an array of bits (MSB first per byte). */
export function bytesToBits(bytes) {
  const bits = new Uint8Array(bytes.length * 8);
  let idx = 0;
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    for (let b = 7; b >= 0; b--) {
      bits[idx++] = (byte >> b) & 1;
    }
  }
  return bits;
}

/** Convert an array of bits (MSB first per byte) back to bytes. Length must be a multiple of 8. */
export function bitsToBytes(bits) {
  const byteCount = Math.floor(bits.length / 8);
  const bytes = new Uint8Array(byteCount);
  for (let i = 0; i < byteCount; i++) {
    let value = 0;
    for (let b = 0; b < 8; b++) {
      value = (value << 1) | bits[i * 8 + b];
    }
    bytes[i] = value;
  }
  return bytes;
}

/** Set the least-significant `bitDepth` bits of `sample` to the given bits (array of 0/1, length === bitDepth). */
export function writeLSBs(sample, bits) {
  let value = sample;
  const mask = ~((1 << bits.length) - 1);
  value &= mask;
  let toAdd = 0;
  for (let i = 0; i < bits.length; i++) {
    toAdd |= bits[i] << (bits.length - 1 - i);
  }
  return value | toAdd;
}

/** Read the least-significant `bitDepth` bits of `sample` as an array of 0/1. */
export function readLSBs(sample, bitDepth) {
  const bits = new Array(bitDepth);
  for (let i = 0; i < bitDepth; i++) {
    bits[i] = (sample >> (bitDepth - 1 - i)) & 1;
  }
  return bits;
}
