// src/components/AlertBanner.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { getAlertasUsuario, subscribeAlertasUsuario, unsubscribeChannel } from "../../services/AlertaService";
import toast from "react-hot-toast"; // opcional, si lo instalas

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

    // Cargar alertas iniciales y mostrar la más reciente (si existe)
    (async () => {
      const all = await getAlertasUsuario(userId);
      if (!mounted) return;
      if (all?.length) {
        const latest = all[0] as Alerta;
        // Mostrar banner sólo si está activa o si quieres mostrar resueltas también
        setAlerta(latest);
      } else {
        setAlerta(null);
      }
    })();

    // Suscribirse a realtime
    const channel = subscribeAlertasUsuario(userId, (payload) => {
      // payload.eventType: "INSERT"/"UPDATE"/"DELETE"
      // payload.new: nueva fila (para INSERT/UPDATE)
      // payload.old: fila antigua (para UPDATE/DELETE)
      if (payload?.eventType === "INSERT" || payload?.eventType === "UPDATE") {
        const newAlert = payload.new as Alerta;
        setAlerta(newAlert);

        // Mostrar toast opcional
        try {
          toast(newAlert.mensaje, {
            icon: newAlert.estado_alerta === "activa" ? "⚠️" : "✅",
            duration: 5000,
          });
        } catch (e) {
          /* no-op si no está instalado */
        }

        // Auto-hide banner en 5s si solo quieres mostrar temporalmente
        if (timerRef.current) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => setAlerta(null), 5000);
      }

      if (payload?.eventType === "DELETE") {
        // Si eliminaron la alerta, limpiamos
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

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-3xl w-full px-4`}>
      <div
        role="alert"
        className={`p-3 rounded-lg shadow-lg flex items-start gap-3 ${isActiva ? "bg-red-600 text-white" : "bg-green-600 text-white"}`}
      >
        <div className="text-xl">{isActiva ? "⚠️" : "✅"}</div>
        <div className="flex-1">
          <div className="font-semibold">{alerta.cartera_nombre} — {isActiva ? "Riesgo" : "Resuelto"}</div>
          <div className="text-sm">{alerta.mensaje}</div>
          <div className="text-xs opacity-80 mt-1">Saldo actual: {Number(alerta.saldo_actual).toFixed(2)} — Umbral: {Number(alerta.umbral_riesgo).toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}
