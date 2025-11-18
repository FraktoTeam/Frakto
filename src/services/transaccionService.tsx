import { createClient } from "../utils/client";

/**
 * Estructura que describe un ingreso financiero.
 *
 * Usada por las funciones de lectura/creación de ingresos.
 *
 * @property cartera_nombre - Nombre de la cartera a la que pertenece el ingreso
 * @property id_usuario - Identificador del usuario propietario
 * @property importe - Importe numérico del ingreso
 * @property descripcion - Descripción opcional del ingreso
 * @property fecha - Fecha del ingreso en formato ISO (yyyy-mm-dd) o según la DB
 */
export interface Ingreso {
  cartera_nombre: string;
  id_usuario: number;
  importe: number;
  descripcion?: string;
  fecha: string; // formato yyyy-mm-dd
}

/**
 * Estructura que describe un gasto/transacción salida.
 *
 * Incluye información mínima requerida para crear/editar gastos.
 *
 * @property cartera_nombre - Nombre de la cartera
 * @property id_usuario - Identificador del usuario
 * @property categoria_nombre - Categoría del gasto (p.ej. 'comida', 'transporte')
 * @property importe - Importe numérico (positivo)
 * @property fecha - Fecha del gasto en formato ISO (yyyy-mm-dd)
 * @property descripcion - Descripción opcional
 * @property fijo - Indica si es un gasto fijo (opcional)
 */
export interface Gasto {
  cartera_nombre: string;
  id_usuario: number;
  categoria_nombre: string;
  importe: number;
  fecha: string; // formato yyyy-mm-dd
  descripcion?: string;
  fijo?: boolean;
}

/**
 * Servicio de transacciones (ingresos y gastos).
 *
 * Este objeto agrupa funciones que interactúan con la base de datos
 * a través del cliente Supabase (`createClient`).
 * Las funciones realizan validaciones básicas y devuelven estructuras
 * uniformes { success, error } o { data, error } según el caso.
 */
const service = {
  async getIngresos(cartera_nombre: string, id_usuario: number): Promise<Ingreso[]> {
    const { data, error } = await createClient
      .from("ingreso")
      .select("*")
      .eq("cartera_nombre", cartera_nombre)
      .eq("id_usuario", id_usuario)
      .order("fecha", { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  },

  /**
   * Obtiene todos los gastos de una cartera
   */
  async getGastos(cartera_nombre: string, id_usuario: number): Promise<Gasto[]> {
    const { data, error } = await createClient
      .from("gasto")
      .select("*")
      .eq("cartera_nombre", cartera_nombre)
      .eq("id_usuario", id_usuario)
      .order("fecha", { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  },

  /**
   * Crea un nuevo ingreso validando importe y fecha
   */
  async createIngreso(ingreso: Ingreso): Promise<{ data: any; error: string | null }> {
    const { data, error, status } = await createClient
      .from("ingreso")
      .insert([ingreso])
      .select()
      .maybeSingle();

    if (error && status !== 201) return { data: null, error: error.message };
    return { data, error: null };
  },

  /**
   * Crea un nuevo gasto validando importe, fecha y categoría
   */
  async createGasto(
    gasto: Gasto
  ): Promise<{ data: Gasto | null; error: string | null }> {
    if (isNaN(gasto.importe) || gasto.importe <= 0) {
      return { data: null, error: "El importe debe ser un número mayor que 0." };
    }

    const fechaValida = /^\d{4}-\d{2}-\d{2}$/.test(gasto.fecha);
    if (!fechaValida) {
      return { data: null, error: "La fecha no tiene un formato válido (yyyy-mm-dd)." };
    }

    const categoriasValidas = ["ocio", "hogar", "transporte", "comida", "factura"];
    if (!categoriasValidas.includes(gasto.categoria_nombre)) {
      return { data: null, error: "La categoría seleccionada no es válida." };
    }

    const { data, error } = await createClient
      .from("gasto")
      .insert([gasto])
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  },

  async evaluarRiesgoGastoIngreso(
      cartera_nombre: string,
      id_usuario: number
    ): Promise<void> {
      await createClient.rpc('evaluar_riesgo_gasto_ingreso', {
      c_nombre: cartera_nombre,
      c_id: id_usuario
    });
  },

  /**
   * Elimina un ingreso por su id_ingreso y actualiza el saldo de la cartera.
   */
  async deleteIngreso(
    id_usuario: number,
    cartera_nombre: string,
    id_ingreso: number
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      // 1️⃣ Obtener el importe antes de borrar
      const { data: ingreso, error: fetchError } = await createClient
        .from("ingreso")
        .select("importe")
        .eq("id_ingreso", id_ingreso)
        .eq("id_usuario", id_usuario)
        .single();

      if (fetchError || !ingreso) {
        return { success: false, error: fetchError?.message ?? "Ingreso no encontrado." };
      }

      const importe = ingreso.importe;

      // 2️⃣ Borrar el ingreso
      const { error: deleteError } = await createClient
        .from("ingreso")
        .delete()
        .eq("id_ingreso", id_ingreso)
        .eq("id_usuario", id_usuario);

      if (deleteError) return { success: false, error: deleteError.message };

      // 3️⃣ Restar del saldo (eliminar ingreso → resta dinero)
      const { error: saldoError } = await service.actualizarSaldoCartera(
        cartera_nombre,
        id_usuario,
        importe,
        "gasto"
      );

      await service.evaluarRiesgoGastoIngreso(cartera_nombre, id_usuario);

      if (saldoError) console.warn("Error actualizando saldo tras borrar ingreso:", saldoError);

      return { success: true, error: null };
    } catch (err: any) {
      console.error("Error eliminando ingreso:", err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Elimina un gasto por su id_gasto y actualiza el saldo de la cartera.
   */
  async deleteGasto(
    id_usuario: number,
    cartera_nombre: string,
    id_gasto: number
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      // 1️⃣ Obtener el importe antes de borrar
      const { data: gasto, error: fetchError } = await createClient
        .from("gasto")
        .select("importe")
        .eq("id_gasto", id_gasto)
        .eq("id_usuario", id_usuario)
        .single();

      if (fetchError || !gasto) {
        return { success: false, error: fetchError?.message ?? "Gasto no encontrado." };
      }

      const importe = gasto.importe;

      // 2️⃣ Borrar el gasto
      const { error: deleteError } = await createClient
        .from("gasto")
        .delete()
        .eq("id_gasto", id_gasto)
        .eq("id_usuario", id_usuario);

      if (deleteError) return { success: false, error: deleteError.message };

      // 3️⃣ Sumar al saldo (eliminar gasto → se recupera dinero)
      const { error: saldoError } = await service.actualizarSaldoCartera(
        cartera_nombre,
        id_usuario,
        importe,
        "ingreso"
      );

      await service.evaluarRiesgoGastoIngreso(cartera_nombre, id_usuario);

      if (saldoError) console.warn("Error actualizando saldo tras borrar gasto:", saldoError);

      return { success: true, error: null };
    } catch (err: any) {
      console.error("Error eliminando gasto:", err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Calcula el saldo actual de una cartera (saldo inicial + ingresos - gastos)
   */
  async calcularSaldoCartera(
    cartera_nombre: string,
    id_usuario: number
  ): Promise<number> {
    const { data: cartera, error: carteraError } = await createClient
      .from("cartera")
      .select("saldo")
      .eq("nombre", cartera_nombre)
      .eq("id_usuario", id_usuario)
      .single();

    if (carteraError || !cartera) {
      console.error("Error obteniendo saldo inicial:", carteraError?.message);
      return 0;
    }

    const ingresos = await service.getIngresos(cartera_nombre, id_usuario);
    const gastos = await service.getGastos(cartera_nombre, id_usuario);

    const totalIngresos = ingresos.reduce((sum, i) => sum + i.importe, 0);
    const totalGastos = gastos.reduce((sum, g) => sum + g.importe, 0);

    const saldoFinal = cartera.saldo + totalIngresos - totalGastos;

    return saldoFinal;
  },

  /**
   * Actualiza el saldo de la cartera
   */
  async actualizarSaldoCartera(
    cartera_nombre: string,
    id_usuario: number,
    importe: number,
    tipo: "ingreso" | "gasto"
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { data, error: fetchError } = await createClient
        .from("cartera")
        .select("saldo")
        .eq("nombre", cartera_nombre)
        .eq("id_usuario", id_usuario)
        .single();

      if (fetchError || !data) return { success: false, error: fetchError?.message ?? "Cartera no encontrada" };

      const nuevoSaldo = tipo === "ingreso"
        ? data.saldo + importe
        : data.saldo - importe;

      const { error: updateError } = await createClient
        .from("cartera")
        .update({ saldo: nuevoSaldo })
        .eq("nombre", cartera_nombre)
        .eq("id_usuario", id_usuario);

      if (updateError) return { success: false, error: updateError.message };
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Obtiene los 10 últimos movimientos (ingresos + gastos)
   * de un usuario desde la función RPC de Supabase
   */
  async getUltimosMovimientosUsuario(id_usuario: number) {
    try {
      const { data, error } = await createClient
        .rpc("get_ultimos_movimientos_usuario", { p_id_usuario: id_usuario });

      if (error) {
        console.error("Error obteniendo movimientos de usuario:", error);
        return { data: [], error: error.message };
      }

      return { data, error: null };
    } catch (err: any) {
      console.error("Error inesperado en getUltimosMovimientosUsuario:", err);
      return { data: [], error: err.message };
    }
  },

  /**
   * Obtiene los 10 últimos movimientos (ingresos + gastos)
   * de una cartera específica de un usuario desde la función RPC
   */
  async getUltimosMovimientosCartera(
    id_usuario: number,
    cartera_nombre: string
  ) {
    try {
      const { data, error } = await createClient
        .rpc("get_ultimos_movimientos", {
          p_id_usuario: id_usuario,
          p_cartera_nombre: cartera_nombre,
        });

      if (error) {
        console.error("Error obteniendo movimientos de cartera:", error);
        return { data: [], error: error.message };
      }

      return { data, error: null };
    } catch (err: any) {
      console.error("Error inesperado en getUltimosMovimientosCartera:", err);
      return { data: [], error: err.message };
    }
  },
  

  /**
   * Elimina todos los ingresos y gastos asociados a una cartera
   */
  async deleteTransaccionesCartera(
    id_usuario: number,
    cartera_nombre: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      // Eliminar ingresos
      const { error: ingresosError } = await createClient
        .from("ingreso")
        .delete()
        .eq("id_usuario", id_usuario)
        .eq("cartera_nombre", cartera_nombre);

      if (ingresosError) {
        console.error("Error eliminando ingresos:", ingresosError.message);
        return { success: false, error: ingresosError.message };
      }

      // Eliminar gastos
      const { error: gastosError } = await createClient
        .from("gasto")
        .delete()
        .eq("id_usuario", id_usuario)
        .eq("cartera_nombre", cartera_nombre);

      if (gastosError) {
        console.error("Error eliminando gastos:", gastosError.message);
        return { success: false, error: gastosError.message };
      }

      return { success: true, error: null };
    } catch (err: any) {
      console.error("Error inesperado al eliminar transacciones de cartera:", err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Obtiene el número total de transacciones (ingresos + gastos)
   * asociadas a una cartera concreta de un usuario.
   */
  async getNumeroTransacciones(
    id_usuario: number,
    cartera_nombre: string
  ): Promise<{ total: number; error: string | null }> {
    try {
      // Contar ingresos
      const { count: ingresosCount, error: ingresosError } = await createClient
        .from("ingreso")
        .select("*", { count: "exact", head: true })
        .eq("id_usuario", id_usuario)
        .eq("cartera_nombre", cartera_nombre);

      if (ingresosError) throw ingresosError;

      // Contar gastos
      const { count: gastosCount, error: gastosError } = await createClient
        .from("gasto")
        .select("*", { count: "exact", head: true })
        .eq("id_usuario", id_usuario)
        .eq("cartera_nombre", cartera_nombre);

      if (gastosError) throw gastosError;

      const total = (ingresosCount ?? 0) + (gastosCount ?? 0);
      return { total, error: null };
    } catch (err: any) {
      console.error("Error obteniendo número de transacciones:", err);
      return { total: 0, error: err.message };
    }
  },

    /**
   * Edita un ingreso por id_ingreso y ajusta el saldo de la cartera por la diferencia.
   */
  async editIngreso(
    id_ingreso: number,
    id_usuario: number,
    cartera_nombre: string,
    newImporte: number,
    newDescripcion?: string,
    newFecha?: string // formato yyyy-mm-dd si lo usas así en DB
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      // 1) Obtener el importe actual
      const { data: ingresoActual, error: fetchError } = await createClient
        .from("ingreso")
        .select("importe")
        .eq("id_ingreso", id_ingreso)
        .eq("id_usuario", id_usuario)
        .single();

      if (fetchError || !ingresoActual) {
        return { success: false, error: fetchError?.message ?? "Ingreso no encontrado." };
      }

      const oldImporte = ingresoActual.importe;
      const diferencia = newImporte - oldImporte;

      // 2) Construir payload solo con los campos enviados
      const updatePayload: Record<string, any> = { importe: newImporte };
      if (typeof newDescripcion !== "undefined") updatePayload.descripcion = newDescripcion;
      if (typeof newFecha !== "undefined") updatePayload.fecha = newFecha;

      // 3) Actualizar el ingreso
      const { error: updateError } = await createClient
        .from("ingreso")
        .update(updatePayload)
        .eq("id_ingreso", id_ingreso)
        .eq("id_usuario", id_usuario);

      if (updateError) return { success: false, error: updateError.message };

      // 4) Ajustar saldo por la diferencia
      if (diferencia !== 0) {
        await service.actualizarSaldoCartera(
          cartera_nombre,
          id_usuario,
          Math.abs(diferencia),
          diferencia > 0 ? "ingreso" : "gasto"
        );
      }

      await service.evaluarRiesgoGastoIngreso(cartera_nombre, id_usuario);

      return { success: true, error: null };
    } catch (err: any) {
      console.error("Error al editar ingreso:", err);
      return { success: false, error: err.message };
    }
  },

  
  /**
   * Edita un gasto por id_gasto y ajusta el saldo de la cartera por la diferencia.
   */
  async editGasto(
    id_gasto: number,
    id_usuario: number,
    cartera_nombre: string,
    newImporte: number,
    newDescripcion?: string,
    newFecha?: string,       // formato yyyy-mm-dd si lo usas así en DB
    newCategoria?: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      // 1) Obtener el importe actual
      const { data: gastoActual, error: fetchError } = await createClient
        .from("gasto")
        .select("importe")
        .eq("id_gasto", id_gasto)
        .eq("id_usuario", id_usuario)
        .single();

      if (fetchError || !gastoActual) {
        return { success: false, error: fetchError?.message ?? "Gasto no encontrado." };
      }

      const oldImporte = gastoActual.importe;
      const diferencia = newImporte - oldImporte;

      // 2) Construir payload solo con los campos enviados
      const updatePayload: Record<string, any> = { importe: newImporte };
      if (typeof newDescripcion !== "undefined") updatePayload.descripcion = newDescripcion;
      if (typeof newFecha !== "undefined") updatePayload.fecha = newFecha;
      if (typeof newCategoria !== "undefined") updatePayload.categoria_nombre = newCategoria.toLowerCase();

      // 3) Actualizar el gasto
      const { error: updateError } = await createClient
        .from("gasto")
        .update(updatePayload)
        .eq("id_gasto", id_gasto)
        .eq("id_usuario", id_usuario);

      if (updateError) return { success: false, error: updateError.message };

      // 4) Ajustar saldo por la diferencia
      if (diferencia !== 0) {
        await service.actualizarSaldoCartera(
          cartera_nombre,
          id_usuario,
          Math.abs(diferencia),
          // si el gasto sube → resta saldo (tipo "gasto"); si baja → suma (tipo "ingreso")
          diferencia > 0 ? "gasto" : "ingreso"
        );
      }

      await service.evaluarRiesgoGastoIngreso(cartera_nombre, id_usuario);

      return { success: true, error: null };
    } catch (err: any) {
      console.error("Error al editar gasto:", err);
      return { success: false, error: err.message };
    }
  },

};



// Export named wrapper functions that delegate to the service object so external API is unchanged
/**
 * Obtiene los ingresos de una cartera.
 * @param cartera_nombre - Nombre de la cartera
 * @param id_usuario - Id del usuario
 * @returns Promise<Ingreso[]> - Lista de ingresos (puede estar vacía)
 */
export const getIngresos = (cartera_nombre: string, id_usuario: number) => service.getIngresos(cartera_nombre, id_usuario);

/**
 * Obtiene los gastos de una cartera.
 * @param cartera_nombre - Nombre de la cartera
 * @param id_usuario - Id del usuario
 * @returns Promise<Gasto[]> - Lista de gastos (puede estar vacía)
 */
export const getGastos = (cartera_nombre: string, id_usuario: number) => service.getGastos(cartera_nombre, id_usuario);

/**
 * Crea un ingreso en la base de datos.
 * @param ingreso - Objeto Ingreso con los campos requeridos
 * @returns Promise<{ data: any; error: string | null }>
 */
export const createIngreso = (ingreso: Ingreso) => service.createIngreso(ingreso);

/**
 * Crea un gasto en la base de datos (valida importe, fecha y categoría).
 * @param gasto - Objeto Gasto
 * @returns Promise<{ data: Gasto | null; error: string | null }>
 */
export const createGasto = (gasto: Gasto) => service.createGasto(gasto);

/**
 * Elimina un ingreso y ajusta el saldo de la cartera.
 * @param id_usuario - Id del usuario
 * @param cartera_nombre - Nombre de la cartera
 * @param id_ingreso - Id del ingreso a eliminar
 * @returns Promise<{ success: boolean; error: string | null }>
 */
export const deleteIngreso = (id_usuario: number, cartera_nombre: string, id_ingreso: number) => service.deleteIngreso(id_usuario, cartera_nombre, id_ingreso);

/**
 * Elimina un gasto y ajusta el saldo de la cartera.
 * @param id_usuario - Id del usuario
 * @param cartera_nombre - Nombre de la cartera
 * @param id_gasto - Id del gasto a eliminar
 * @returns Promise<{ success: boolean; error: string | null }>
 */
export const deleteGasto = (id_usuario: number, cartera_nombre: string,  id_gasto: number) => service.deleteGasto(id_usuario, cartera_nombre, id_gasto);

/**
 * Calcula el saldo actual de la cartera (saldo inicial + ingresos - gastos).
 * @param cartera_nombre - Nombre de la cartera
 * @param id_usuario - Id del usuario
 * @returns Promise<number> - Saldo calculado
 */
export const calcularSaldoCartera = (cartera_nombre: string, id_usuario: number) => service.calcularSaldoCartera(cartera_nombre, id_usuario);

/**
 * Actualiza el saldo de la cartera sumando o restando el importe.
 * @param cartera_nombre - Nombre de la cartera
 * @param id_usuario - Id del usuario
 * @param importe - Importe a aplicar
 * @param tipo - "ingreso" para sumar, "gasto" para restar
 * @returns Promise<{ success: boolean; error: string | null }>
 */
export const actualizarSaldoCartera = (cartera_nombre: string, id_usuario: number, importe: number, tipo: "ingreso" | "gasto") => service.actualizarSaldoCartera(cartera_nombre, id_usuario, importe, tipo);

/**
 * Obtiene los últimos movimientos de un usuario (RPC).
 * @param id_usuario - Id del usuario
 * @returns Promise<{ data: any[]; error: string | null }>
 */
export const getUltimosMovimientosUsuario = (id_usuario: number) => service.getUltimosMovimientosUsuario(id_usuario);

/**
 * Obtiene los últimos movimientos de una cartera (RPC).
 * @param id_usuario - Id del usuario
 * @param cartera_nombre - Nombre de la cartera
 * @returns Promise<{ data: any[]; error: string | null }>
 */
export const getUltimosMovimientosCartera = (id_usuario: number, cartera_nombre: string) => service.getUltimosMovimientosCartera(id_usuario, cartera_nombre);

/**
 * Elimina todas las transacciones (ingresos y gastos) asociadas a una cartera.
 * @param id_usuario - Id del usuario
 * @param cartera_nombre - Nombre de la cartera
 * @returns Promise<{ success: boolean; error: string | null }>
 */
export const deleteTransaccionesCartera = (id_usuario: number, cartera_nombre: string) =>
  service.deleteTransaccionesCartera(id_usuario, cartera_nombre);

/**
 * Obtiene el número total de transacciones de una cartera.
 * @param id_usuario - Id del usuario
 * @param cartera_nombre - Nombre de la cartera
 * @returns Promise<{ total: number; error: string | null }>
 */
export const getNumeroTransacciones = (id_usuario: number, cartera_nombre: string) =>
  service.getNumeroTransacciones(id_usuario, cartera_nombre);

/**
 * Edita un ingreso y ajusta el saldo por la diferencia.
 * @param id_ingreso - Id del ingreso
 * @param id_usuario - Id del usuario
 * @param cartera_nombre - Nombre de la cartera
 * @param newImporte - Nuevo importe
 * @param newDescripcion - Nueva descripción opcional
 * @param newFecha - Nueva fecha opcional (yyyy-mm-dd)
 * @returns Promise<{ success: boolean; error: string | null }>
 */
export const editIngreso = (
  id_ingreso: number,
  id_usuario: number,
  cartera_nombre: string,
  newImporte: number,
  newDescripcion?: string,
  newFecha?: string
) => service.editIngreso(id_ingreso, id_usuario, cartera_nombre, newImporte, newDescripcion, newFecha);

/** Evalúa el riesgo de gasto/ingreso para una cartera y usuario.
 * @param cartera_nombre - Nombre de la cartera
 * @param id_usuario - Id del usuario
 * @returns Promise<void>
 */
export const evaluarRiesgoGastoIngreso = (
  cartera_nombre: string,
  id_usuario: number
) => service.evaluarRiesgoGastoIngreso(cartera_nombre, id_usuario);

/**
 * Edita un gasto y ajusta el saldo por la diferencia.
 * @param id_gasto - Id del gasto
 * @param id_usuario - Id del usuario
 * @param cartera_nombre - Nombre de la cartera
 * @param newImporte - Nuevo importe
 * @param newDescripcion - Nueva descripción opcional
 * @param newFecha - Nueva fecha opcional (yyyy-mm-dd)
 * @param newCategoria - Nueva categoría opcional
 * @returns Promise<{ success: boolean; error: string | null }>
 */
export const editGasto = (
  id_gasto: number,
  id_usuario: number,
  cartera_nombre: string,
  newImporte: number,
  newDescripcion?: string,
  newFecha?: string,
  newCategoria?: string
) => service.editGasto(id_gasto, id_usuario, cartera_nombre, newImporte, newDescripcion, newFecha, newCategoria);

export default service;

