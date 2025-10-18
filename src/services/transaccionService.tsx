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
  categoria_nombre: "ocio" | "hogar" | "transporte" | "comida" | "factura";
  importe: number;
  fecha: string; // formato dd-mm-aaaa
  descripcion?: string;
  fijo?: boolean;
}

/**
 * Obtiene todos los ingresos de una cartera
 */
export async function getIngresos(cartera_nombre: string, id_usuario: number): Promise<Ingreso[]> {
  const { data, error } = await createClient
    .from("ingreso")
    .select("*")
    .eq("cartera_nombre", cartera_nombre)
    .eq("id_usuario", id_usuario)
    .order("fecha", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Obtiene todos los gastos de una cartera
 */
export async function getGastos(cartera_nombre: string, id_usuario: number): Promise<Gasto[]> {
  const { data, error } = await createClient
    .from("gasto")
    .select("*")
    .eq("cartera_nombre", cartera_nombre)
    .eq("id_usuario", id_usuario)
    .order("fecha", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Crea un nuevo ingreso validando importe y fecha
 */
export async function createIngreso(ingreso: Ingreso): Promise<{ data: any; error: string | null }> {
  const { data, error, status } = await createClient
    .from("ingreso")
    .insert([ingreso])
    .select()
    .maybeSingle();

  if (error && status !== 201) return { data: null, error: error.message };
  return { data, error: null };
}

/**
 * Crea un nuevo gasto validando importe, fecha y categoría
 */
export async function createGasto(
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
}

/**
 * Elimina un ingreso por id y cartera
 */
export async function deleteIngreso(
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
}

/**
 * Elimina un gasto por id y cartera
 */
export async function deleteGasto(
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
}

/**
 * Calcula el saldo actual de una cartera (ingresos - gastos)
 */
export async function calcularSaldoCartera(
  cartera_nombre: string,
  id_usuario: number
): Promise<number> {
  const ingresos = await getIngresos(cartera_nombre, id_usuario);
  const gastos = await getGastos(cartera_nombre, id_usuario);

  const totalIngresos = ingresos.reduce((sum, i) => sum + i.importe, 0);
  const totalGastos = gastos.reduce((sum, g) => sum + g.importe, 0);

  return totalIngresos - totalGastos;
}
