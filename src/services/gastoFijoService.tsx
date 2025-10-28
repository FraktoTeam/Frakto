import { createClient } from "../utils/client";

export interface GastoFijo {
  id_gasto?: number;
  cartera_nombre: string;
  id_usuario: number;
  categoria_nombre: string;
  importe: number;
  fecha_inicio: string; // formato YYYY-MM-DD
  frecuencia: number;
  activo: boolean;
  descripcion?: string;
  lastGenerated?: string; // fecha del último cargo generado
}

/**
 * Obtener todos los gastos fijos de un usuario
 */
export async function getGastosFijos(id_usuario: number): Promise<GastoFijo[]> {
  const { data, error } = await createClient
    .from("gasto_fijo")
    .select("*")
    .eq("id_usuario", id_usuario)
    .order("fecha_inicio", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Crear un nuevo gasto fijo
 */
export async function createGastoFijo(gasto: GastoFijo): Promise<{ data: GastoFijo | null; error: string | null }> {
   console.log("Vamos a crear un gasto fijo con:", gasto);
  const { data, error } = await createClient
    .from("gasto_fijo")
    .insert([gasto])
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

/**
 * Actualizar un gasto fijo existente
 */
export async function updateGastoFijo(id_gasto: number, fields: Partial<GastoFijo>): Promise<{ success: boolean; error: string | null }> {
  const { error } = await createClient
    .from("gasto_fijo")
    .update(fields)
    .eq("id_gasto", id_gasto);

  if (error) return { success: false, error: error.message };
  return { success: true, error: null };
}

/**
 * Eliminar un gasto fijo
 */
export async function deleteGastoFijo(id_gasto: number): Promise<{ success: boolean; error: string | null }> {
  const { error } = await createClient
    .from("gasto_fijo")
    .delete()
    .eq("id_gasto", id_gasto);

  if (error) return { success: false, error: error.message };
  return { success: true, error: null };
}

/**
 * Activar o desactivar un gasto fijo
 */
export async function toggleGastoFijoActivo(id_gasto: number, activo: boolean) {
  const { data, error } = await createClient
    .from("gasto_fijo")
    .update({ activo })
    .eq("id_gasto", id_gasto)
    .select()
    .single();

  if (error) {
    console.error("Error actualizando estado de gasto fijo:", error.message);
    throw error;
  }

  return data;
}