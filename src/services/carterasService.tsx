import { createClient } from "../utils/client";

/**
 * Estructura de una cartera
 */
export interface Cartera {
  nombre: string;
  saldo: number;
  id_usuario: number;
}

/**
 * Obtener todas las carteras (opcionalmente de un usuario)
 */
export async function getCarteras(id_usuario?: number): Promise<Cartera[]> {
  let query = createClient.from("cartera").select("*");

  if (id_usuario !== undefined) {
    query = query.eq("id_usuario", id_usuario);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Obtener una cartera específica
 */
export async function getCartera(nombre: string, id_usuario: number): Promise<Cartera | null> {
  const { data, error } = await createClient
    .from("cartera")
    .select("*")
    .eq("nombre", nombre)
    .eq("id_usuario", id_usuario)
    .single();

  if (error && error.code !== "PGRST116") throw new Error(error.message);
  return data ?? null;
}

/**
 * Crear una nueva cartera con validación previa
 */
export async function createCartera(
  nombre: string,
  saldo: number,
  id_usuario: number
): Promise<{ data: Cartera | null; error: string | null }> {
  const { data: existing, error: fetchError } = await createClient
    .from("cartera")
    .select("nombre")
    .eq("nombre", nombre)
    .eq("id_usuario", id_usuario)
    .maybeSingle();

  if (fetchError) {
    return { data: null, error: fetchError.message };
  }

  if (existing) {
    return { data: null, error: "Ya existe una cartera con ese nombre para este usuario." };
  }

  const { data, error } = await createClient
    .from("cartera")
    .insert([{ nombre, saldo, id_usuario }])
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Actualizar el saldo de una cartera existente
 */
export async function updateCartera(nombre: string, id_usuario: number, nuevoSaldo: number): Promise<void> {
  const { error } = await createClient
    .from("cartera")
    .update({ saldo: nuevoSaldo })
    .eq("nombre", nombre)
    .eq("id_usuario", id_usuario);

  if (error) throw new Error(error.message);
}

/**
 * Eliminar una cartera
 */
export async function deleteCartera(nombre: string, id_usuario: number): Promise<void> {
  const { error } = await createClient
    .from("cartera")
    .delete()
    .eq("nombre", nombre)
    .eq("id_usuario", id_usuario);

  if (error) throw new Error(error.message);
}

/**
 * Actualiza el nombre de una cartera
 */
export async function editCartera(
  id_usuario: number,
  oldName: string,
  newName: string
): Promise<{ data: Cartera | null; error: string | null }> {
  const { data: existing, error: fetchError } = await createClient
    .from("cartera")
    .select("nombre")
    .eq("nombre", newName)
    .eq("id_usuario", id_usuario)
    .maybeSingle();

  if (fetchError) return { data: null, error: fetchError.message };
  if (existing) return { data: null, error: "Ya existe una cartera con ese nombre para este usuario." };

  const { data, error } = await createClient
    .from("cartera")
    .update({ nombre: newName })
    .eq("nombre", oldName)
    .eq("id_usuario", id_usuario)
    .select()
    .single();

  if (error) return { data: null, error: error.message };

  return { data, error: null };
}