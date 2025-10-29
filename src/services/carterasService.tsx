import { createClient } from "../utils/client";

/**
 * @file carterasService.ts
 * @module services/carterasService
 * @description
 * Servicio encargado de gestionar las operaciones CRUD sobre las carteras de un usuario.
 * 
 * Este módulo actúa como capa de acceso a datos entre el frontend (Next.js) y Supabase.
 * Todas las funciones usan el cliente de Supabase (`createClient`) para realizar consultas
 * a la tabla `cartera`.
 * 
 * Métodos principales:
 * - `getCarteras`: Obtiene todas las carteras de un usuario.
 * - `getCartera`: Devuelve una cartera específica.
 * - `createCartera`: Crea una nueva cartera con validación de duplicados.
 * - `updateCartera`: Actualiza el saldo de una cartera existente.
 * - `editCartera`: Cambia el nombre de una cartera.
 * - `deleteCartera`: Elimina una cartera de la base de datos.
 */

/**
 * Representa la estructura de una cartera.
 */
export interface Cartera {
  /** Nombre de la cartera (clave principal junto con el id de usuario). */
  nombre: string;
  /** Saldo actual de la cartera. */
  saldo: number;
  /** Identificador del usuario propietario. */
  id_usuario: number;
}

/**
 * Obtiene todas las carteras existentes o, si se indica, las de un usuario específico.
 * 
 * @async
 * @function getCarteras
 * @param {number} [id_usuario] - ID opcional del usuario propietario. Si no se proporciona, devuelve todas las carteras.
 * @returns {Promise<Cartera[]>} Lista de carteras obtenidas.
 * @throws {Error} Si ocurre un error durante la consulta a Supabase.
 * 
 * @example
 * const carteras = await getCarteras(1);
 * console.log(carteras.length); // → número de carteras del usuario
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
 * Obtiene una cartera específica por nombre y usuario.
 * 
 * @async
 * @function getCartera
 * @param {string} nombre - Nombre de la cartera a buscar.
 * @param {number} id_usuario - ID del usuario propietario.
 * @returns {Promise<Cartera | null>} Objeto con la cartera encontrada o `null` si no existe.
 * @throws {Error} Si ocurre un error distinto al código `PGRST116` (sin registros).
 * 
 * @example
 * const cartera = await getCartera("Ahorros", 1);
 * if (cartera) console.log(cartera.saldo);
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
 * Crea una nueva cartera tras verificar que no exista otra con el mismo nombre
 * para el mismo usuario.
 * 
 * @async
 * @function createCartera
 * @param {string} nombre - Nombre de la nueva cartera.
 * @param {number} saldo - Saldo inicial.
 * @param {number} id_usuario - ID del usuario propietario.
 * @returns {Promise<{ data: Cartera | null; error: string | null }>}
 * Un objeto con la cartera creada o el mensaje de error.
 * 
 * @example
 * const { data, error } = await createCartera("Inversiones", 500, 1);
 * if (error) console.error(error);
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
 * Actualiza el saldo de una cartera existente en la base de datos.
 * 
 * @async
 * @function updateCartera
 * @param {string} nombre - Nombre de la cartera a modificar.
 * @param {number} id_usuario - ID del usuario propietario.
 * @param {number} nuevoSaldo - Nuevo saldo a establecer.
 * @returns {Promise<void>}
 * @throws {Error} Si ocurre un error durante la actualización.
 * 
 * @example
 * await updateCartera("Ahorros", 1, 300);
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
 * Cambia el nombre de una cartera de un usuario, validando que no exista otro registro
 * con el mismo nombre.
 * 
 * @async
 * @function editCartera
 * @param {number} id_usuario - ID del usuario propietario.
 * @param {string} oldName - Nombre actual de la cartera.
 * @param {string} newName - Nuevo nombre que se desea asignar.
 * @returns {Promise<{ data: Cartera | null; error: string | null }>}
 * Objeto con la cartera modificada o un mensaje de error si el nuevo nombre está duplicado.
 * 
 * @example
 * const { data, error } = await editCartera(1, "Viajes", "Vacaciones");
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

/**
 * Elimina una cartera de la base de datos.
 * 
 * @async
 * @function deleteCartera
 * @param {number} id_usuario - ID del usuario propietario.
 * @param {string} nombre - Nombre de la cartera a eliminar.
 * @returns {Promise<{ success: boolean; error: string | null }>}
 * Objeto con el resultado de la operación (`success` = true si se eliminó correctamente).
 * 
 * @example
 * const { success } = await deleteCartera(1, "Ahorros");
 * if (success) console.log("Cartera eliminada");
 */
export async function deleteCartera(
  id_usuario: number,
  nombre: string
): Promise<{ success: boolean; error: string | null }> {
  const { error } = await createClient
    .from("cartera")
    .delete()
    .eq("id_usuario", id_usuario)
    .eq("nombre", nombre);

  if (error) return { success: false, error: error.message };
  return { success: true, error: null };
}
