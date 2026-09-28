// src/services/fileService.js — local file helpers (download, read as bytes, etc.)
// No network calls; everything here stays in the browser.

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function fileToBytes(file) {
  const buffer = await file.arrayBuffer();
  return new Uint8Array(buffer);
}

export function bytesToBlob(bytes, mime = "application/octet-stream") {
  return new Blob([bytes], { type: mime });
}

export function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

export function inferMimeFromName(name) {
  const ext = name.split(".").pop().toLowerCase();
  const map = {
    txt: "text/plain",
    pdf: "application/pdf",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    zip: "application/zip",
    json: "application/json",
    wav: "audio/wav",
    mp3: "audio/mpeg",
  };
  return map[ext] || "application/octet-stream";
}
