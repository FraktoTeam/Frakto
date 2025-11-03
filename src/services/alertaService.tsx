import { createClient } from "@/utils/client"; // cliente Supabase compartido

/**
 * Representación de una alerta registrada en la base de datos.
 * Usada tanto por la API como por los componentes que la consumen.
 */
export interface Alerta {
  /** Identificador único de la alerta */
  id_alerta: string;
  /** Nombre de la cartera asociada */
  cartera_nombre: string;
  /** Id del usuario propietario */
  id_usuario: number;
  /** Saldo actual de la cartera */
  saldo_actual: number;
  /** Saldo necesario calculado/esperado */
  saldo_necesario: number;
  /** Umbral de riesgo configurado */
  umbral_riesgo: number;
  /** Fecha ISO de generación */
  fecha_generacion: string;
  /** Estado: activa | resuelta */
  estado_alerta: "activa" | "resuelta";
  /** Mensaje legible para mostrar al usuario */
  mensaje: string;
}

/**
 * Obtiene las alertas de un usuario ordenadas por fecha de generación (descendente).
 *
 * Este método realiza una consulta simple a la tabla `alerta` y devuelve
 * un array (vacío si no hay resultados o si ocurre un error).
 *
 * @param id_usuario - Identificador del usuario cuyas alertas se solicitan
 * @returns Promise<Alerta[]> - Array de alertas (posiblemente vacío)
 * @example
 * const alertas = await getAlertasUsuario(1);
 */
export async function getAlertasUsuario(id_usuario: number): Promise<Alerta[]> {
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
  return (data as Alerta[]) ?? [];
}

/**
 * Crea una suscripción realtime para las alertas de un usuario.
 *
 * Devuelve el objeto `channel` que provee la API de realtime del cliente
 * Supabase para permitir cancelar la suscripción posteriormente.
 *
 * El callback recibirá el payload de Supabase con la forma usual
 * ({ eventType: 'INSERT' | 'UPDATE' | 'DELETE', new, old, ... }).
 *
 * @param id_usuario - Id del usuario a escuchar
 * @param callback - Función a ejecutar cuando llegue un evento realtime
 * @returns any - Canal/objeto de suscripción retornado por Supabase
 *
 * @example
 * const channel = subscribeAlertasUsuario(1, (payload) => {
 *   // manejar payload.new / payload.eventType
 * });
 */
export function subscribeAlertasUsuario(id_usuario: number, callback: (payload: any) => void): any {
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

/**
 * Cancela una suscripción realtime dada.
 *
 * Intenta usar `createClient.removeChannel(channel)` si está disponible
 * (forma preferida). Si falla, intenta llamar `channel.unsubscribe()`
 * como fallback. Si se pasa un valor falsy no hace nada.
 *
 * @param channel - Canal devuelto por `subscribeAlertasUsuario`
 */
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
