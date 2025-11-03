"use client"; // 🔥 muy importante: evita ejecución en SSR

import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { getFirebaseApp } from "./firebaseClient";

let messagingInstance: ReturnType<typeof getMessaging> | null = null;

// ✅ Obtiene o crea una sola instancia de Messaging
function getMessagingClient() {
  if (typeof window === "undefined") {
    console.warn("🚫 FCM: ejecutándose en SSR, se omite");
    return null;
  }
  if (!messagingInstance) messagingInstance = getMessaging(getFirebaseApp());
  return messagingInstance;
}

// ✅ Pide permiso y obtiene el token FCM
export async function solicitarPermisoYToken() {
  if (typeof window === "undefined") return null;

  try {
    const permiso = await Notification.requestPermission();

    if (permiso === "granted") {
      const messaging = getMessagingClient();
      if (!messaging) return null;

      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      });

      console.log("🔔 Token FCM obtenido:", token);
      localStorage.setItem("fcm_token", token);

      return token;
    } else {
      console.warn("🔕 Permiso de notificación denegado");
      return null;
    }
  } catch (err) {
    console.error("❌ Error al obtener token FCM:", err);
    return null;
  }
}

// ✅ Escucha mensajes recibidos mientras la app está abierta
export function escucharMensajes() {
  if (typeof window === "undefined") return;

  const messaging = getMessagingClient();
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    console.log("📩 Notificación en primer plano:", payload);

    const notification = payload.notification;
    if (notification) {
      new Notification(notification.title || "Frakto", {
        body: notification.body,
      });
    }
  });
}
