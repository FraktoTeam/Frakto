importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

// ⚠️ Estas variables las tomará Next al generar el bundle (usa tus valores del .env.local)
firebase.initializeApp({
  apiKey: self.env?.NEXT_PUBLIC_FIREBASE_API_KEY || "%%NEXT_PUBLIC_FIREBASE_API_KEY%%",
  authDomain: self.env?.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "%%NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN%%",
  projectId: self.env?.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "%%NEXT_PUBLIC_FIREBASE_PROJECT_ID%%",
  storageBucket: self.env?.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "%%NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET%%",
  messagingSenderId: self.env?.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "%%NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID%%",
  appId: self.env?.NEXT_PUBLIC_FIREBASE_APP_ID || "%%NEXT_PUBLIC_FIREBASE_APP_ID%%"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Mensaje recibido:", payload);
  const { title, body } = payload.notification;
  self.registration.showNotification(title, { body });
});
