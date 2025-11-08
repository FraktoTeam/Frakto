import { createClient } from "../utils/client";

/**
 * Representa un gasto fijo almacenado en la base de datos.
 *
 * Este tipo se usa tanto para crear como para leer gastos fijos.
 * - `fecha_inicio` se espera en formato ISO yyyy-mm-dd.
 * - `lastGenerated` es opcional y representa la última fecha en la que se generó el cargo.
 *
 * @example
 * const gasto: GastoFijo = {
 *   cartera_nombre: 'Personal',
 *   id_usuario: 1,
 *   categoria_nombre: 'comida',
 *   importe: 20.5,
 *   fecha_inicio: '2025-10-01',
 *   frecuencia: 30,
 *   activo: true,
 * };
 */
export interface GastoFijo {
  /** Identificador único (asignado por la BD) */
  id_gasto?: number;
  /** Nombre de la cartera a la que pertenece */
  cartera_nombre: string;
  /** Id del usuario propietario */
  id_usuario: number;
  /** Categoría, p.ej. 'comida', 'transporte' */
  categoria_nombre: string;
  /** Importe numérico (positivo) */
  importe: number;
  /** Fecha de inicio del gasto en formato YYYY-MM-DD */
  fecha_inicio: string;
  /** Frecuencia en días con la que se repite el gasto */
  frecuencia: number;
  /** Si el gasto está activo (se aplicará) o no */
  activo: boolean;
  /** Texto descriptivo opcional */
  descripcion?: string;
  /** Fecha del último cargo generado (opcional) */
  lastGenerated?: string;
}

/**
 * Obtiene todos los gastos fijos de un usuario.
 *
 * @param id_usuario - Identificador del usuario
 * @returns Promise<GastoFijo[]> - Array con los gastos (vacío si no hay)
 * @throws Error si la consulta a la base de datos falla
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
 * Crea un nuevo gasto fijo en la base de datos.
 *
 * Realiza una inserción y devuelve el registro creado o un error legible.
 * Este método no realiza validaciones complejas del negocio (las validaciones
 * deben realizarse a nivel del llamador si son necesarias).
 *
 * @param gasto - Objeto con los datos del gasto fijo a crear
 * @returns Promise<{ data: GastoFijo | null; error: string | null }>
 * - `data`: registro creado (si la operación fue exitosa)
 * - `error`: mensaje de error en caso de fallo
 *
 * @example
 * const res = await createGastoFijo({ cartera_nombre: 'Personal', id_usuario: 1, categoria_nombre: 'comida', importe: 20, fecha_inicio: '2025-10-01', frecuencia: 30, activo: true });
 */
export async function createGastoFijo(gasto: GastoFijo): Promise<{ data: GastoFijo | null; error: string | null }> {
  console.log("Vamos a crear un gasto fijo con:", gasto);
  const { data, error } = await createClient
    .from("gasto_fijo")
    .insert([gasto])
    .select()
    .single();

  await evaluarRiesgoGastoFijo(gasto.cartera_nombre, gasto.id_usuario);
  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

/**
 * Actualiza un gasto fijo existente con los campos proporcionados.
 *
 * Comportamiento:
 * - Realiza un `update` en la tabla `gasto_fijo` por `id_gasto` y devuelve
 *   el registro resultante (a través de la llamada a `.select().single()`).
 * - Si la operación es exitosa y el registro resultante contiene `cartera_nombre`
 *   e `id_usuario`, se invoca `evaluarRiesgoGastoFijo(cartera_nombre, id_usuario)`
 *   para recalcular métricas dependientes (efecto colateral importante).
 * - No lanza excepciones en el flujo normal: en caso de error devuelve
 *   `{ success: false, error: <mensaje> }`.
 *
 * Notas de uso:
 * - `fields` puede contener solo los campos que se desean actualizar.
 * - El llamador puede confiar en la re-evaluación del riesgo cuando el
 *   registro actualizado incluya `cartera_nombre` e `id_usuario`.
 *
 * @param id_gasto - Id del gasto a actualizar
 * @param fields - Campos parciales a actualizar (Partial<GastoFijo>)
 * @returns Promise<{ success: boolean; error: string | null }>
 */
export async function updateGastoFijo(
  id_gasto: number,
  fields: Partial<GastoFijo>
): Promise<{ success: boolean; error: string | null }> {
  const { data, error } = await createClient
    .from("gasto_fijo")
    .update(fields)
    .eq("id_gasto", id_gasto)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  // ⚙️ Si tenemos cartera y usuario, reevaluamos el riesgo
  if (data?.cartera_nombre && data?.id_usuario) {
    await evaluarRiesgoGastoFijo(data.cartera_nombre, data.id_usuario);
  }

  return { success: true, error: null };
}


/**
 * Elimina un gasto fijo por su id y reevalúa el riesgo de la cartera afectada.
 *
 * Flujo:
 * 1. Recupera (`select`) el registro existente para obtener `cartera_nombre`
 *    e `id_usuario` (necesarios para la re-evaluación posterior).
 * 2. Si la recuperación falla, devuelve `{ success: false, error }` sin
 *    intentar eliminar.
 * 3. Elimina el registro (`delete().eq('id_gasto', id_gasto)`).
 * 4. Si la eliminación es exitosa y se obtuvo previamente `cartera_nombre` e
 *    `id_usuario`, invoca `evaluarRiesgoGastoFijo(cartera_nombre, id_usuario)`.
 * 5. Devuelve `{ success: true, error: null }` en caso de éxito, o la forma
 *    `{ success: false, error: <mensaje> }` en caso de fallo.
 *
 * Consideraciones:
 * - El método captura excepciones y devuelve el error en el campo `error`.
 * - No lanza el error directamente al llamador (el llamador debe inspeccionar
 *   la propiedad `success`).
 *
 * @param id_gasto - Id del gasto a eliminar
 * @returns Promise<{ success: boolean; error: string | null }>
 */
export async function deleteGastoFijo(
  id_gasto: number
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { data: old, error: fetchError } = await createClient
      .from("gasto_fijo")
      .select("cartera_nombre, id_usuario")
      .eq("id_gasto", id_gasto)
      .single();

    if (fetchError) {
      console.error("Error obteniendo gasto fijo antes de eliminar:", fetchError.message);
      return { success: false, error: fetchError.message };
    }

    const { error: deleteError } = await createClient
      .from("gasto_fijo")
      .delete()
      .eq("id_gasto", id_gasto);

    if (deleteError) {
      console.error("Error eliminando gasto fijo:", deleteError.message);
      return { success: false, error: deleteError.message };
    }

    if (old?.cartera_nombre && old?.id_usuario) {
      await evaluarRiesgoGastoFijo(old.cartera_nombre, old.id_usuario);
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}


/** Evalúa el riesgo de gasto fijo para una cartera y usuario.
 * @param cartera_nombre - Nombre de la cartera
 * @param id_usuario - Id del usuario
 * @returns Promise<void>
 */
export async function evaluarRiesgoGastoFijo(
      cartera_nombre: string,
      id_usuario: number
    ): Promise<void> {
      await createClient.rpc('evaluar_riesgo_gasto_fijo', {
      c_nombre: cartera_nombre,
      c_id: id_usuario
    });
  }

/**
 * Activa o desactiva un gasto fijo (toggle de la propiedad `activo`).
 *
 * @param id_gasto - Id del gasto a actualizar
 * @param activo - Nuevo valor booleano para `activo`
 * @returns Promise<GastoFijo> - Regresa el registro actualizado
 * @throws Error si la operación de actualización falla
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