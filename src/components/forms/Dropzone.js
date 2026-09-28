import React, { useCallback, useState } from "react";
import { UploadCloud } from "lucide-react";

export default function Dropzone({ accept, onFile, hint }) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file) onFile(file);
    },
    [onFile]
  );

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  };

  return (
    <label
      className={`dropzone ${dragActive ? "dropzone--active" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
    >
      <UploadCloud size={28} />
      <span className="dropzone__title">Drag & drop a file, or click to browse</span>
      {hint && <span className="dropzone__hint">{hint}</span>}
      <input type="file" accept={accept} onChange={handleChange} hidden />
    </label>
  );
}
