# StegaVault — Image & Audio Steganography Suite

StegaVault is a secure, offline-first web application for hiding encrypted text or files
inside PNG images and 16-bit PCM WAV audio, built with Create React App. All media
processing, encryption, and storage happen locally in your browser. Firebase is used
**only** for account authentication.

> **Your media and secrets stay on this device. Firebase is used only for account authentication.**

## Features

- **Image steganography** — LSB embedding/extraction for PNG/BMP cover images (1–4 bit depth)
- **Audio steganography** — LSB embedding/extraction for 16-bit PCM WAV cover audio
- **Real AES-256-GCM encryption** with PBKDF2 (210,000 iterations, SHA-256) key derivation via the Web Crypto API
- **Capacity calculation** before you embed, so you know a payload will fit
- **Integrity verification** — CRC32 payload checksum independent of AES-GCM's own auth tag
- **Local encrypted vault** and **project/history tracking** in IndexedDB (Dexie)
- **Encrypted backup export/import** of your entire local database
- **Firebase Authentication** (email/password, password reset; Google sign-in optional and isolated)
- **Offline-first** — every feature except first sign-in/password reset works without a network connection
- Premium neo-neumorphic, responsive, accessible UI

## Architecture

```
src/
├── app/                  App shell, routes, Auth/Theme providers
├── components/           Shared layout, forms, cards, dialogs, loaders
├── context/               NotificationContext (toasts)
├── database/              Dexie (IndexedDB) db + repositories
├── features/               auth, dashboard, image/audio steganography,
│                            encryption, decryption, projects, history,
│                            vault, settings, help
├── services/               firebase.js, cryptoService.js, imageStegoService.js,
│                            audioStegoService.js, fileService.js,
│                            exportService.js, storageService.js
├── utils/                   payloadFormat.js (binary envelope), bitUtils.js
└── styles/                  globals.css, theme.css, animations.css
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Firebase Authentication setup

StegaVault uses Firebase **only** for authentication — no Firestore, no Firebase Storage.

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Go to **Build → Authentication → Get started**
3. Enable the **Email/Password** provider
4. (Optional) Enable the **Google** provider if you want Google sign-in
5. Go to **Project settings → General**, scroll to "Your apps", add a Web app, and copy the config values
6. Do **not** create a Firestore database or a Storage bucket — StegaVault never uses them

### 3. Environment variables

Copy the example file and fill in your Firebase config:

```bash
cp .env.example .env.local
```

```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

### 4. Run locally

```bash
npm start
```

Opens at `http://localhost:3000`.

### 5. Production build

```bash
npm run build
```

Outputs a static bundle to `build/`, deployable to any static host.

## Supported media

| Type  | Formats accepted (cover) | Export format |
|-------|---------------------------|----------------|
| Image | PNG, BMP                  | PNG (lossless) |
| Audio | Uncompressed 16-bit PCM WAV | WAV (lossless) |

Lossy formats (JPEG, MP3, etc.) are intentionally **not** supported as cover media, since
recompression would destroy the hidden LSB data.

## Security model

- Encryption: **AES-256-GCM**, keys derived via **PBKDF2-HMAC-SHA256** (210,000 iterations) from your password, using the browser's native Web Crypto API
- Random salts and IVs are generated with `crypto.getRandomValues` (a CSPRNG) — never `Math.random()`
- Passwords and derived keys never leave memory and are never persisted
- A CRC32 checksum on the payload envelope catches corruption independent of AES-GCM's own authentication tag
- No image, audio, plaintext, or key material is ever sent over the network

## Local storage model

Everything except your Firebase auth session lives in an IndexedDB database named `StegaVaultDB`
(via Dexie), with tables for `projects`, `operations` (history), `settings`, `drafts`, and
`vaultItems`. Use **Storage → Export backup** to download an (optionally password-encrypted)
copy of this database, and **Storage → Import backup** to restore it, including on another device.

## Troubleshooting

- **"Payload too large for this image/audio"** — increase the bit depth, or use a larger cover file.
- **"No valid StegaVault payload found"** — the file wasn't produced by StegaVault, or has been
  recompressed/edited since embedding.
- **"Decryption failed. Incorrect password or corrupted/tampered data."** — double-check the
  password; there's no recovery if it's forgotten, by design.
- **Firebase sign-in doesn't work** — confirm `.env.local` is filled in and the Email/Password
  provider is enabled in the Firebase console, then restart `npm start`.

## Testing

```bash
npm test
```

Runs the Create React App / Jest test runner, including round-trip tests for the crypto and
payload-format utilities.
