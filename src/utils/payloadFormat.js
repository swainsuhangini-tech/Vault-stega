// src/utils/payloadFormat.js
//
// Shared binary payload envelope used by both image and audio steganography.
// This is what actually gets embedded bit-by-bit into the LSBs of the cover
// media, so it must be compact and self-describing.
//
// Layout (all integers little-endian):
//   [4]  magic            "SVP1"
//   [1]  flags            bit0: isEncrypted, bit1: isFile (else: plain text)
//   [4]  filenameLength    (0 if not a file)
//   [N]  filename (utf-8)
//   [4]  mimeLength        (0 if not a file)
//   [N]  mime (utf-8)
//   [4]  dataLength
//   [N]  data bytes (either raw utf-8 text bytes, raw file bytes, or an
//        encryptBytes() container, depending on flags)
//   [4]  crc32 of everything above (integrity check independent of AES-GCM's
//        own authentication tag, so we can distinguish "wrong password" from
//        "corrupted / not a StegaVault payload" cases in the UI layer)

const MAGIC = "SVP1";

function crc32(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i];
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint32LE(view, offset, value) {
  view.setUint32(offset, value, true);
}

function concatAll(chunks) {
  const total = chunks.reduce((s, c) => s + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

export function buildPayload({ isEncrypted, isFile, filename = "", mime = "", data }) {
  const enc = new TextEncoder();
  const magicBytes = enc.encode(MAGIC);
  const flags = new Uint8Array([(isEncrypted ? 1 : 0) | (isFile ? 2 : 0)]);
  const filenameBytes = enc.encode(filename || "");
  const mimeBytes = enc.encode(mime || "");

  const lenBuf = (n) => {
    const b = new Uint8Array(4);
    writeUint32LE(new DataView(b.buffer), 0, n);
    return b;
  };

  const body = concatAll([
    magicBytes,
    flags,
    lenBuf(filenameBytes.length),
    filenameBytes,
    lenBuf(mimeBytes.length),
    mimeBytes,
    lenBuf(data.length),
    data,
  ]);

  const checksum = crc32(body);
  const checksumBytes = lenBuf(checksum);

  return concatAll([body, checksumBytes]);
}

export function parsePayload(bytes) {
  const dec = new TextDecoder();
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 0;

  const magic = dec.decode(bytes.slice(0, 4));
  if (magic !== MAGIC) {
    throw new Error(
      "No valid StegaVault payload found in this file (magic header mismatch). " +
        "The file may not contain hidden data, or the capacity/format doesn't match."
    );
  }
  offset += 4;

  const flags = bytes[offset];
  offset += 1;
  const isEncrypted = Boolean(flags & 1);
  const isFile = Boolean(flags & 2);

  const filenameLength = dv.getUint32(offset, true);
  offset += 4;
  const filename = dec.decode(bytes.slice(offset, offset + filenameLength));
  offset += filenameLength;

  const mimeLength = dv.getUint32(offset, true);
  offset += 4;
  const mime = dec.decode(bytes.slice(offset, offset + mimeLength));
  offset += mimeLength;

  const dataLength = dv.getUint32(offset, true);
  offset += 4;
  const data = bytes.slice(offset, offset + dataLength);
  offset += dataLength;

  const storedChecksum = dv.getUint32(offset, true);
  offset += 4;

  const bodyForChecksum = bytes.slice(0, offset - 4);
  const actualChecksum = crc32(bodyForChecksum);
  if (actualChecksum !== storedChecksum) {
    throw new Error("Payload integrity check failed (checksum mismatch). Data may be corrupted.");
  }

  return { isEncrypted, isFile, filename, mime, data, totalLength: offset };
}

/** Total byte length the payload will occupy, before embedding. Useful for capacity checks. */
export function estimatePayloadLength({ filename = "", mime = "", dataLength }) {
  const enc = new TextEncoder();
  return (
    4 + // magic
    1 + // flags
    4 +
    enc.encode(filename).length +
    4 +
    enc.encode(mime).length +
    4 +
    dataLength +
    4 // checksum
  );
}

export { MAGIC as PAYLOAD_MAGIC };
