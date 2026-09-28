import { bytesToBits, bitsToBytes, writeLSBs, readLSBs } from "./bitUtils";

test("bytesToBits/bitsToBytes round-trip", () => {
  const bytes = new Uint8Array([0, 1, 127, 128, 255, 42]);
  const bits = bytesToBits(bytes);
  const back = bitsToBytes(bits);
  expect(Array.from(back)).toEqual(Array.from(bytes));
});

test("writeLSBs/readLSBs round-trip at various bit depths", () => {
  for (const bitDepth of [1, 2, 3, 4]) {
    const sample = 0b11001010;
    const bits = Array.from({ length: bitDepth }, (_, i) => i % 2);
    const written = writeLSBs(sample, bits);
    const readBack = readLSBs(written, bitDepth);
    expect(readBack).toEqual(bits);
  }
});
