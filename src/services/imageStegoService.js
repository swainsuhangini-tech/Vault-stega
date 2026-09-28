// src/services/imageStegoService.js
//
// Real LSB (least-significant-bit) steganography for PNG/BMP images using
// the Canvas API. Data is hidden in the R, G, B channels (alpha is left
// untouched to preserve transparency). A small fixed-width mini-header
// (always 1 bit/channel, for reliability) records the bit depth used and
// the exact payload length, so extraction doesn't need any side channel.

import { bytesToBits, bitsToBytes, writeLSBs, readLSBs } from "../utils/bitUtils";

const MINI_HEADER_BITS = 64; // 8 bits bitDepth + 32 bits length + 24 reserved
const MAX_BIT_DEPTH = 4;

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load image. Make sure the file is a valid PNG or BMP."));
    };
    img.src = url;
  });
}

function getImageData(img) {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return { canvas, ctx, imageData };
}

/** Number of usable R/G/B channel slots (alpha excluded) for an image of given dimensions. */
function usableChannelCount(width, height) {
  return width * height * 3;
}

/**
 * Compute how many payload bytes can be embedded at a given bit depth,
 * accounting for the fixed mini-header.
 */
export function calculateImageCapacity(width, height, bitDepth = 1) {
  const channels = usableChannelCount(width, height);
  // The mini-header always occupies MINI_HEADER_BITS channel-slots at 1 bit/slot.
  const remainingChannels = channels - MINI_HEADER_BITS;
  if (remainingChannels <= 0) return 0;
  const payloadBits = remainingChannels * bitDepth;
  return Math.max(0, Math.floor(payloadBits / 8));
}

export async function getImageInfo(file) {
  const img = await loadImageFromFile(file);
  const width = img.naturalWidth;
  const height = img.naturalHeight;
  const capacities = {};
  for (let bd = 1; bd <= MAX_BIT_DEPTH; bd++) {
    capacities[bd] = calculateImageCapacity(width, height, bd);
  }
  return { width, height, capacities, previewUrl: await fileToDataUrl(file) };
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Iterate channel slot indices (into a Uint8ClampedArray RGBA buffer),
// skipping every 4th (alpha) byte.
function* channelSlots(data) {
  for (let i = 0; i < data.length; i += 4) {
    yield i; // R
    yield i + 1; // G
    yield i + 2; // B
  }
}

/**
 * Embed a payload (Uint8Array, already built via payloadFormat.buildPayload
 * and optionally encrypted) into a cover image file. Returns a PNG Blob.
 */
export async function embedInImage(file, payloadBytes, { bitDepth = 1 } = {}) {
  if (bitDepth < 1 || bitDepth > MAX_BIT_DEPTH) {
    throw new Error(`Bit depth must be between 1 and ${MAX_BIT_DEPTH}.`);
  }
  const img = await loadImageFromFile(file);
  const { canvas, ctx, imageData } = getImageData(img);
  const { width, height } = canvas;
  const capacity = calculateImageCapacity(width, height, bitDepth);

  if (payloadBytes.length > capacity) {
    throw new Error(
      `Payload too large for this image at ${bitDepth}-bit depth. ` +
        `Capacity: ${capacity} bytes, payload: ${payloadBytes.length} bytes. ` +
        `Try a higher bit depth or a larger image.`
    );
  }

  const data = imageData.data;
  const slots = channelSlots(data);

  // 1. Write mini-header: 8 bits bitDepth, 32 bits length (LE), 24 reserved zero bits — all 1 bit/slot.
  const headerBits = [];
  for (let b = 7; b >= 0; b--) headerBits.push((bitDepth >> b) & 1);
  for (let b = 31; b >= 0; b--) headerBits.push((payloadBytes.length >> b) & 1);
  for (let i = 0; i < 24; i++) headerBits.push(0);

  for (let i = 0; i < MINI_HEADER_BITS; i++) {
    const slot = slots.next().value;
    data[slot] = writeLSBs(data[slot], [headerBits[i]]);
  }

  // 2. Write payload bits, bitDepth bits per channel slot.
  const payloadBits = bytesToBits(payloadBytes);
  let bitCursor = 0;
  while (bitCursor < payloadBits.length) {
    const slotResult = slots.next();
    if (slotResult.done) break; // shouldn't happen given the capacity check above
    const slot = slotResult.value;
    const chunk = [];
    for (let i = 0; i < bitDepth; i++) {
      chunk.push(bitCursor < payloadBits.length ? payloadBits[bitCursor] : 0);
      bitCursor++;
    }
    data[slot] = writeLSBs(data[slot], chunk);
  }

  ctx.putImageData(imageData, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error("Failed to export stego image as PNG."));
      else resolve(blob);
    }, "image/png");
  });
}

/** Extract the raw payload bytes previously embedded with embedInImage. */
export async function extractFromImage(file) {
  const img = await loadImageFromFile(file);
  const { imageData } = getImageData(img);
  const data = imageData.data;
  const slots = channelSlots(data);

  // 1. Read mini-header.
  const headerBits = [];
  for (let i = 0; i < MINI_HEADER_BITS; i++) {
    const slotResult = slots.next();
    if (slotResult.done) {
      throw new Error("Image is too small to contain a StegaVault mini-header.");
    }
    const slot = slotResult.value;
    headerBits.push(readLSBs(data[slot], 1)[0]);
  }

  let bitDepth = 0;
  for (let i = 0; i < 8; i++) bitDepth = (bitDepth << 1) | headerBits[i];
  let payloadLength = 0;
  for (let i = 8; i < 40; i++) payloadLength = (payloadLength << 1) | headerBits[i];

  if (bitDepth < 1 || bitDepth > MAX_BIT_DEPTH) {
    throw new Error("No StegaVault payload detected in this image (invalid header).");
  }
  if (payloadLength <= 0 || payloadLength > 200 * 1024 * 1024) {
    throw new Error("No StegaVault payload detected in this image (implausible length).");
  }

  // 2. Read payload bits.
  const totalBitsNeeded = payloadLength * 8;
  const bits = new Uint8Array(totalBitsNeeded);
  let bitCursor = 0;
  while (bitCursor < totalBitsNeeded) {
    const slotResult = slots.next();
    if (slotResult.done) {
      throw new Error("Image ended before the full payload could be read (truncated or wrong bit depth).");
    }
    const slot = slotResult.value;
    const chunk = readLSBs(data[slot], bitDepth);
    for (let i = 0; i < chunk.length && bitCursor < totalBitsNeeded; i++) {
      bits[bitCursor++] = chunk[i];
    }
  }

  return bitsToBytes(bits);
}

export const IMAGE_STEGO_CONSTANTS = { MINI_HEADER_BITS, MAX_BIT_DEPTH };
