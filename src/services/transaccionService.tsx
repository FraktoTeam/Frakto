import { createClient } from "../utils/client";

/**
 * Estructura de un ingreso
 */
export interface Ingreso {
  cartera_nombre: string;
  id_usuario: number;
  importe: number;
  descripcion?: string;
  fecha: string; // formato dd-mm-aaaa
}

/**
 * Estructura de un gasto
 */
export interface Gasto {
  cartera_nombre: string;
  id_usuario: number;
  categoria_nombre: string;
  importe: number;
  fecha: string; // formato dd-mm-aaaa
  descripcion?: string;
  fijo?: boolean;
}

/**
 * Obtiene todos los ingresos de una cartera
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

  /**
   * Elimina un ingreso por id y cartera
   */
  async deleteIngreso(
    id_usuario: number,
    cartera_nombre: string,
    fecha: string,
    importe: number
  ): Promise<{ success: boolean; error: string | null }> {
    const { error } = await createClient
      .from("ingreso")
      .delete()
      .eq("id_usuario", id_usuario)
      .eq("cartera_nombre", cartera_nombre)
      .eq("fecha", fecha)
      .eq("importe", importe);

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  },

  /**
   * Elimina un gasto por id y cartera
   */
  async deleteGasto(
    id_usuario: number,
    cartera_nombre: string,
    fecha: string,
    importe: number
  ): Promise<{ success: boolean; error: string | null }> {
    const { error } = await createClient
      .from("gasto")
      .delete()
      .eq("id_usuario", id_usuario)
      .eq("cartera_nombre", cartera_nombre)
      .eq("fecha", fecha)
      .eq("importe", importe);

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
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
        .rpc("get_ultimos_movimientos_cartera", {
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

};

// Export named wrapper functions that delegate to the service object so external API is unchanged
export const getIngresos = (cartera_nombre: string, id_usuario: number) => service.getIngresos(cartera_nombre, id_usuario);
export const getGastos = (cartera_nombre: string, id_usuario: number) => service.getGastos(cartera_nombre, id_usuario);
export const createIngreso = (ingreso: Ingreso) => service.createIngreso(ingreso);
export const createGasto = (gasto: Gasto) => service.createGasto(gasto);
export const deleteIngreso = (id_usuario: number, cartera_nombre: string, fecha: string, importe: number) => service.deleteIngreso(id_usuario, cartera_nombre, fecha, importe);
export const deleteGasto = (id_usuario: number, cartera_nombre: string, fecha: string, importe: number) => service.deleteGasto(id_usuario, cartera_nombre, fecha, importe);
export const calcularSaldoCartera = (cartera_nombre: string, id_usuario: number) => service.calcularSaldoCartera(cartera_nombre, id_usuario);
export const actualizarSaldoCartera = (cartera_nombre: string, id_usuario: number, importe: number, tipo: "ingreso" | "gasto") => service.actualizarSaldoCartera(cartera_nombre, id_usuario, importe, tipo);
export const getUltimosMovimientosUsuario = (id_usuario: number) => service.getUltimosMovimientosUsuario(id_usuario);
export const getUltimosMovimientosCartera = (id_usuario: number, cartera_nombre: string) => service.getUltimosMovimientosCartera(id_usuario, cartera_nombre);
export const deleteTransaccionesCartera = (id_usuario: number, cartera_nombre: string) =>
  service.deleteTransaccionesCartera(id_usuario, cartera_nombre);
export const getNumeroTransacciones = (id_usuario: number, cartera_nombre: string) =>
  service.getNumeroTransacciones(id_usuario, cartera_nombre);

export default service;

