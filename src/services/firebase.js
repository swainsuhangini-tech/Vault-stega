// src/services/firebase.js
//
// Firebase is used ONLY for authentication. No Firestore, no Firebase
// Storage, no Realtime Database, no Cloud Functions. All application data
// (projects, history, settings, vault items) lives in IndexedDB on-device.

import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId
);

let app = null;
let auth = null;

if (isFirebaseConfigured) {
  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  auth = getAuth(app);
  // Persist the session across browser restarts so steganography features
  // keep working offline without requiring the user to re-authenticate.
  setPersistence(auth, browserLocalPersistence).catch(() => {});
} else {
  // eslint-disable-next-line no-console
  console.warn(
    "[StegaVault] Firebase is not configured. Copy .env.example to .env.local and fill in your Firebase " +
      "Authentication credentials. Authentication features will be disabled until then."
  );
}

function ensureAuth() {
  if (!auth) {
    throw new Error(
      "Firebase is not configured. Add your Firebase Authentication credentials to .env.local to enable sign-in."
    );
  }
  return auth;
}

export function subscribeToAuthChanges(callback) {
  if (!auth) {
    // No Firebase configured — report "no user" once so the app can still render.
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export async function registerWithEmail(email, password, displayName) {
  const a = ensureAuth();
  const credential = await createUserWithEmailAndPassword(a, email, password);
  if (displayName) {
    await updateProfile(credential.user, { displayName });
  }
  return credential.user;
}

export async function loginWithEmail(email, password) {
  const a = ensureAuth();
  const credential = await signInWithEmailAndPassword(a, email, password);
  return credential.user;
}

export async function logout() {
  const a = ensureAuth();
  await firebaseSignOut(a);
}

export async function resetPassword(email) {
  const a = ensureAuth();
  await sendPasswordResetEmail(a, email);
}

// Optional, isolated Google sign-in. Never called unless the user explicitly
// clicks the (clearly labeled) Google sign-in button.
export async function loginWithGoogle() {
  const a = ensureAuth();
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(a, provider);
  return credential.user;
}

export { auth };
