// src/utils/firebaseClient.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";

let cachedApp: FirebaseApp | null = null;

export function getFirebaseApp(): FirebaseApp {
  // solo en cliente
  if (typeof window === "undefined") {
    // si por SSR ya hay una app, devuelvela; si no, lanza (no usamos firebase en SSR)
    if (getApps().length) return getApp();
    throw new Error("Firebase no disponible en SSR");
  }

  if (cachedApp) return cachedApp;

  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };

  cachedApp = getApps().length ? getApp() : initializeApp(config);
  if (process.env.NODE_ENV !== "production") {
    // ayuda a depurar que realmente se ejecuta este archivo
    // y que las envs existen
    // eslint-disable-next-line no-console
    console.log("🔥 Firebase init:", config.projectId);
  }
  return cachedApp;
}
