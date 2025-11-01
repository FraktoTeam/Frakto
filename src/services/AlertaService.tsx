import { createClient } from "@/utils/client"; // ya es el cliente Supabase

export async function getAlertasUsuario(id_usuario: number) {
  console.log("🟢 getAlertasUsuario: iniciando consulta para usuario", id_usuario);

  const { data, error } = await createClient
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

export function subscribeAlertasUsuario(id_usuario: number, callback: (payload: any) => void) {
  console.log("🟡 Subscribiéndose a alertas realtime de usuario", id_usuario);

  const channel = createClient
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
        console.log("📡 Evento realtime recibido:", payload);
        callback(payload);
      }
    )
    .subscribe((status) => {
      console.log("📡 Estado de suscripción:", status);
    });

  return channel;
}

export function unsubscribeChannel(channel: any) {
  if (!channel) return;
  try {
    console.log("🔴 Eliminando canal realtime");
    createClient.removeChannel(channel);
  } catch (e) {
    try {
      channel.unsubscribe();
    } catch (e2) {
      console.error("Error al cancelar suscripción:", e2);
    }
  }
}
