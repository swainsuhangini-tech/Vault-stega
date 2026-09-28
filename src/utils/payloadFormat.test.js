import { buildPayload, parsePayload, estimatePayloadLength } from "./payloadFormat";

test("buildPayload/parsePayload round-trips text payloads", () => {
  const data = new TextEncoder().encode("hello stegavault");
  const payload = buildPayload({ isEncrypted: false, isFile: false, data });
  const parsed = parsePayload(payload);

  expect(parsed.isEncrypted).toBe(false);
  expect(parsed.isFile).toBe(false);
  expect(new TextDecoder().decode(parsed.data)).toBe("hello stegavault");
});

test("buildPayload/parsePayload round-trips file payloads with metadata", () => {
  const data = new Uint8Array([1, 2, 3, 4, 5, 255, 0]);
  const payload = buildPayload({
    isEncrypted: true,
    isFile: true,
    filename: "secret.bin",
    mime: "application/octet-stream",
    data,
  });
  const parsed = parsePayload(payload);

  expect(parsed.isEncrypted).toBe(true);
  expect(parsed.isFile).toBe(true);
  expect(parsed.filename).toBe("secret.bin");
  expect(parsed.mime).toBe("application/octet-stream");
  expect(Array.from(parsed.data)).toEqual(Array.from(data));
});

test("parsePayload rejects corrupted payloads (checksum mismatch)", () => {
  const data = new TextEncoder().encode("hello");
  const payload = buildPayload({ isEncrypted: false, isFile: false, data });
  const corrupted = new Uint8Array(payload);
  corrupted[10] ^= 0xff; // flip a bit inside the data region
  expect(() => parsePayload(corrupted)).toThrow();
});

test("estimatePayloadLength matches actual buildPayload length", () => {
  const data = new Uint8Array(37);
  const payload = buildPayload({ isEncrypted: false, isFile: true, filename: "a.txt", mime: "text/plain", data });
  const estimate = estimatePayloadLength({ filename: "a.txt", mime: "text/plain", dataLength: data.length });
  expect(estimate).toBe(payload.length);
});
