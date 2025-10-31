// src/lib/alertService.ts
import { createClient } from "@/utils/client"; // ajusta la ruta si es diferente

const supabase = createClient;

/**
 * Obtener alertas de un usuario (ordenadas por fecha descendente)
 */
export async function getAlertasUsuario(id_usuario: number) {
  const { data, error } = await supabase
    .from("alerta")
    .select("*")
    .eq("id_usuario", id_usuario)
    .order("fecha_generacion", { ascending: false });

  if (error) {
    console.error("getAlertasUsuario error:", error.message);
    return [];
  }
  return data ?? [];
}

/**
 * Suscribirse a cambios realtime en la tabla alerta para un usuario dado.
 * callback recibe el payload (payload.eventType, payload.new, payload.old)
 */
export function subscribeAlertasUsuario(
  id_usuario: number,
  callback: (payload: any) => void
) {
  const channel = supabase
    .channel(`alertas_user_${id_usuario}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "alerta",
        filter: `id_usuario=eq.${id_usuario}`,
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return channel;
}

/**
 * Cancelar suscripción
 */
export function unsubscribeChannel(channel: any) {
  if (!channel) return;
  try {
    // Supabase v2: removeChannel
    supabase.removeChannel(channel);
  } catch (e) {
    // Fallback: channel.unsubscribe()
    try { channel.unsubscribe(); } catch (e2) {}
  }
}
