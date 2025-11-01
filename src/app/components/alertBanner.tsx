// src/components/AlertBanner.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { getAlertasUsuario, subscribeAlertasUsuario, unsubscribeChannel } from "../../services/AlertaService";
import toast from "react-hot-toast";

type Alerta = {
  id_alerta: string;
  cartera_nombre: string;
  id_usuario: number;
  saldo_actual: number;
  saldo_necesario: number;
  umbral_riesgo: number;
  fecha_generacion: string;
  estado_alerta: "activa" | "resuelta";
  mensaje: string;
};

export default function AlertBanner({ userId }: { userId: number | null }) {
  const [alerta, setAlerta] = useState<Alerta | null>(null);
  const channelRef = useRef<any>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!userId) return;

    let mounted = true;
    console.log("🟢 AlertBanner montado para userId:", userId);

    // Cargar alertas iniciales
    (async () => {
      const all = await getAlertasUsuario(userId);
      if (!mounted) return;
      if (all?.length) {
        const latest = all[0] as Alerta;
        setAlerta(latest);
      } else {
        setAlerta(null);
      }
    })();

    // Suscribirse a realtime
    const channel = subscribeAlertasUsuario(userId, (payload) => {
      console.log("📡 Evento recibido de Supabase:", payload);
      if (payload?.eventType === "INSERT" || payload?.eventType === "UPDATE") {
        console.log("⚠️ Nueva alerta detectada:", payload.new);
        const newAlert = payload.new as Alerta;
        setAlerta(newAlert);

        try {
          toast(newAlert.mensaje, {
            icon: newAlert.estado_alerta === "activa" ? "⚠️" : "✅",
            duration: 5000,
          });
        } catch {}

        if (timerRef.current) window.clearTimeout(timerRef.current);
        // 👇 si no quieres que desaparezca sola, comenta esta línea
        // timerRef.current = window.setTimeout(() => setAlerta(null), 5000);
      }

      if (payload?.eventType === "DELETE") {
        setAlerta(null);
      }
    });

    channelRef.current = channel;

    return () => {
      mounted = false;
      if (timerRef.current) window.clearTimeout(timerRef.current);
      unsubscribeChannel(channelRef.current);
    };
  }, [userId]);

  if (!alerta) return null;

  const isActiva = alerta.estado_alerta === "activa";

  // 👇 función para cerrar manualmente
  const handleClose = () => {
    console.log("❌ Alerta cerrada manualmente");
    setAlerta(null);
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-3xl w-full px-4">
      <div
        role="alert"
        className={`relative p-3 rounded-lg shadow-lg flex items-start gap-3 ${
          isActiva ? "bg-red-600 text-white" : "bg-green-600 text-white"
        }`}
      >
        <div className="text-xl">{isActiva ? "⚠️" : "✅"}</div>

        <div className="flex-1 pr-6">
          <div className="font-semibold">
            {alerta.cartera_nombre} — {isActiva ? "Riesgo" : "Resuelto"}
          </div>
          <div className="text-sm">{alerta.mensaje}</div>
          <div className="text-xs opacity-80 mt-1">
            Saldo actual: {Number(alerta.saldo_actual).toFixed(2)} — Umbral:{" "}
            {Number(alerta.umbral_riesgo).toFixed(2)}
          </div>
        </div>

        {/* 👇 Botón de cierre */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-3 text-white/80 hover:text-white text-lg font-bold"
          aria-label="Cerrar alerta"
        >
          ×
        </button>
      </div>
    </div>
  );
}
