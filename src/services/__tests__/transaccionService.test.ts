// src/services/__tests__/transaccionService.test.ts (pruebas de unidad)

jest.mock("../../utils/client", () => ({
  createClient: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockReturnThis(),
    rpc: jest.fn(),
  },
}));
import * as servicio from "../transaccionService";
import serviceDefault from "../transaccionService";
const { createClient } = require("../../utils/client");

describe("transaccionService", () => {
  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  beforeEach(() => {
    jest.clearAllMocks();
    createClient.from.mockReturnThis();
    createClient.select.mockReturnThis();
    createClient.eq.mockReturnThis();
    createClient.order.mockReturnThis();
    createClient.update.mockReturnThis();
    createClient.delete.mockReturnThis();
    createClient.single.mockReturnThis();
    createClient.maybeSingle.mockReturnThis();
  });

  // ---------- createGasto ----------
  it("debe rechazar gasto con importe inválido", async () => {
    const result = await servicio.createGasto({
      cartera_nombre: "test",
      id_usuario: 1,
      categoria_nombre: "ocio",
      importe: 0,
      fecha: "2025-10-20",
    });
    expect(result.error).toMatch(/mayor que 0/);
  });

  it("debe rechazar gasto con fecha inválida", async () => {
    const result = await servicio.createGasto({
      cartera_nombre: "test",
      id_usuario: 1,
      categoria_nombre: "ocio",
      importe: 100,
      fecha: "20-10-2025",
    });
    expect(result.error).toMatch(/formato válido/);
  });

  it("debe rechazar gasto con categoría inválida", async () => {
    const result = await servicio.createGasto({
      cartera_nombre: "test",
      id_usuario: 1,
      categoria_nombre: "viajes",
      importe: 100,
      fecha: "2025-10-20",
    });
    expect(result.error).toMatch(/no es válida/);
  });

  it("debe crear gasto correctamente", async () => {
    createClient.single.mockResolvedValueOnce({
      data: { id: 1, importe: 100 },
      error: null,
    });

    const result = await servicio.createGasto({
      cartera_nombre: "test",
      id_usuario: 1,
      categoria_nombre: "ocio",
      importe: 100,
      fecha: "2025-10-20",
    });

    expect(result.error).toBeNull();
    expect(result.data).toEqual({ id: 1, importe: 100 });
  });

  // ---------- createIngreso ----------
  it("debe crear ingreso correctamente", async () => {
    createClient.maybeSingle.mockResolvedValueOnce({
      data: { id: 1, importe: 200 },
      error: null,
      status: 201,
    });

    const result = await servicio.createIngreso({
      cartera_nombre: "personal",
      id_usuario: 1,
      importe: 200,
      fecha: "2025-10-20",
    });

    expect(result.error).toBeNull();
    expect(result.data).toEqual({ id: 1, importe: 200 });
  });

  // ---------- calcularSaldoCartera ----------
  it("calcula el saldo de una cartera correctamente", async () => {
    // Mock saldo inicial
    createClient.single.mockResolvedValueOnce({
      data: { saldo: 1000 },
      error: null,
    });

  jest.spyOn(serviceDefault, "getIngresos").mockResolvedValue([
    {
      cartera_nombre: "personal",
      id_usuario: 1,
      importe: 500,
      fecha: "2025-10-01",
    },
    {
      cartera_nombre: "personal",
      id_usuario: 1,
      importe: 250,
      fecha: "2025-10-05",
    },
  ] as any);

  jest.spyOn(serviceDefault, "getGastos").mockResolvedValue([
    {
      cartera_nombre: "personal",
      id_usuario: 1,
      categoria_nombre: "comida",
      importe: 100,
      fecha: "2025-10-06",
    },
    {
      cartera_nombre: "personal",
      id_usuario: 1,
      categoria_nombre: "hogar",
      importe: 150,
      fecha: "2025-10-07",
    },
  ] as any);

    const result = await servicio.calcularSaldoCartera("personal", 1);
    expect(result).toBe(1500); // 1000 + 750 - 250
  });

  // ---------- actualizarSaldoCartera ----------
  it("actualiza saldo correctamente para ingreso", async () => {
    createClient.single.mockResolvedValueOnce({
      data: { saldo: 500 },
      error: null,
    });

    // Simula la cadena de update(...).eq(...).eq(...) devolviendo finalmente { error: null }
    createClient.update.mockImplementationOnce(() => ({
      eq: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }));

    const result = await servicio.actualizarSaldoCartera("personal", 1, 100, "ingreso");
    expect(result.success).toBe(true);
  });

  it("devuelve error si cartera no existe", async () => {
    createClient.single.mockResolvedValueOnce({
      data: null,
      error: { message: "no encontrada" },
    });

    const result = await servicio.actualizarSaldoCartera("noexiste", 1, 100, "ingreso");
    expect(result.success).toBe(false);
  });

  // ---------- RPC ----------
  it("obtiene últimos movimientos usuario correctamente", async () => {
    createClient.rpc.mockResolvedValueOnce({ data: [{ id: 1 }], error: null });
    const result = await servicio.getUltimosMovimientosUsuario(1);
    expect(result.data).toHaveLength(1);
  });

  it("maneja error en getUltimosMovimientosUsuario", async () => {
    createClient.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: "Fallo RPC" },
    });
    const result = await servicio.getUltimosMovimientosUsuario(1);
    expect(result.error).toBe("Fallo RPC");
  });

  it("maneja error inesperado en getUltimosMovimientosCartera", async () => {
    createClient.rpc.mockRejectedValueOnce(new Error("Crash"));
    const result = await servicio.getUltimosMovimientosCartera(1, "personal");
    expect(result.error).toBe("Crash");
  });

    // ---------- getIngresos / getGastos ----------
  it("getIngresos lanza error si Supabase devuelve error", async () => {
    jest.restoreAllMocks();
    createClient.order.mockResolvedValueOnce({ data: null, error: { message: "DB fail" } });
    await expect(servicio.getIngresos("cartera1", 1)).rejects.toThrow("DB fail");
  });

  it("getGastos devuelve [] si data es null", async () => {
    jest.restoreAllMocks();
    createClient.order.mockResolvedValueOnce({ data: null, error: null });
    const result = await servicio.getGastos("cartera1", 1);
    expect(result).toEqual([]);
  });

  // ---------- createGasto ----------
  it("createGasto devuelve error si Supabase falla", async () => {
    createClient.single.mockResolvedValueOnce({ data: null, error: { message: "insert fail" } });
    const result = await servicio.createGasto({
      cartera_nombre: "test",
      id_usuario: 1,
      categoria_nombre: "ocio",
      importe: 10,
      fecha: "2025-10-21",
    });
    expect(result.error).toBe("insert fail");
  });

  // ---------- calcularSaldoCartera ----------
  it("calcularSaldoCartera devuelve 0 si Supabase devuelve error", async () => {
    createClient.single.mockResolvedValueOnce({ data: null, error: { message: "fetch fail" } });
    const result = await servicio.calcularSaldoCartera("personal", 1);
    expect(result).toBe(0);
  });

  // ---------- actualizarSaldoCartera ----------
  it("actualizarSaldoCartera devuelve error si update falla", async () => {
    // Simula lectura del saldo correcta
    createClient.single.mockResolvedValueOnce({
        data: { saldo: 500 },
        error: null,
    });

    // Simula cadena encadenada de update que termina devolviendo { error: { message: "update failed" } }
    createClient.update.mockImplementationOnce(() => ({
        eq: () => ({
        eq: () => Promise.resolve({ error: { message: "update failed" } }),
        }),
    }));

    const result = await servicio.actualizarSaldoCartera("personal", 1, 100, "ingreso");
    expect(result.success).toBe(false);
    expect(result.error).toBe("update failed");
  });

  // ---------- getUltimosMovimientosUsuario ----------
  it("getUltimosMovimientosUsuario devuelve error si RPC falla", async () => {
    createClient.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: "rpc fail" },
    });
    const result = await servicio.getUltimosMovimientosUsuario(1);
    expect(result.error).toBe("rpc fail");
  });

  // ---------- getUltimosMovimientosCartera ----------
  it("getUltimosMovimientosCartera devuelve error inesperado si lanza excepción", async () => {
    createClient.rpc.mockRejectedValueOnce(new Error("boom"));
    const result = await servicio.getUltimosMovimientosCartera(1, "personal");
    expect(result.error).toBe("boom");
  });

});

describe("transaccionService extra tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createClient.from.mockReturnThis();
    createClient.select.mockReturnThis();
    createClient.eq.mockReturnThis();
    createClient.order.mockReturnThis();
    createClient.update.mockReturnThis();
    createClient.delete.mockReturnThis();
    createClient.single.mockReturnThis();
    createClient.maybeSingle.mockReturnThis();
    createClient.rpc.mockReturnThis();
  });

  it("deleteIngreso: devuelve éxito cuando la secuencia tiene éxito", async () => {
    createClient.single.mockResolvedValueOnce({ data: { importe: 123 }, error: null });
    createClient.delete.mockImplementationOnce(() => ({
      eq: () => ({
        eq: () => ({ error: null }),
      }),
    }));
    jest.spyOn(serviceDefault, "actualizarSaldoCartera").mockResolvedValue({ success: true, error: null } as any);

    const res = await servicio.deleteIngreso(1, "MiCartera", 11);
    expect(res.success).toBe(true);
    expect(serviceDefault.actualizarSaldoCartera).toHaveBeenCalledWith("MiCartera", 1, 123, "gasto");
  });

  it("deleteIngreso: maneja cuando no se encuentra el ingreso", async () => {
    createClient.single.mockResolvedValueOnce({ data: null, error: { message: "not found" } });
    const res = await servicio.deleteIngreso(1, "C", 99);
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/not found|Ingreso no encontrado/);
  });

  it("deleteGasto: devuelve éxito y ajusta el saldo", async () => {
    createClient.single.mockResolvedValueOnce({ data: { importe: 50 }, error: null });
    createClient.delete.mockImplementationOnce(() => ({
      eq: () => ({
        eq: () => ({ error: null }),
      }),
    }));
    jest.spyOn(serviceDefault, "actualizarSaldoCartera").mockResolvedValue({ success: true, error: null } as any);

    const res = await servicio.deleteGasto(1, "CarteraX", 22);
    expect(res.success).toBe(true);
    expect(serviceDefault.actualizarSaldoCartera).toHaveBeenCalledWith("CarteraX", 1, 50, "ingreso");
  });

  it("editIngreso: actualiza y ajusta el saldo por la diferencia", async () => {
    // obtener el importe actual
    createClient.single.mockResolvedValueOnce({ data: { importe: 80 }, error: null });
    // actualizar el ingreso
    createClient.update.mockImplementationOnce(() => ({
      eq: () => ({
        eq: () => ({ error: null }),
      }),
    }));
    // espiar la función actualizar
    jest.spyOn(serviceDefault, "actualizarSaldoCartera").mockResolvedValue({ success: true, error: null } as any);

    const res = await servicio.editIngreso(12, 1, "CarteraY", 100, "desc", "2025-10-20");
    expect(res.success).toBe(true);
    // diferencia = 20 -> debe llamar a actualizarSaldoCartera con tipo 'ingreso'
    expect(serviceDefault.actualizarSaldoCartera).toHaveBeenCalledWith("CarteraY", 1, Math.abs(20), "ingreso");
  });

  it("editGasto: actualiza y ajusta saldo cuando el gasto aumenta", async () => {
    createClient.single.mockResolvedValueOnce({ data: { importe: 60 }, error: null });
    createClient.update.mockImplementationOnce(() => ({
      eq: () => ({
        eq: () => ({ error: null }),
      }),
    }));
    jest.spyOn(serviceDefault, "actualizarSaldoCartera").mockResolvedValue({ success: true, error: null } as any);

    const res = await servicio.editGasto(21, 1, "C", 80, "d", "2025-10-20", "Comida");
    expect(res.success).toBe(true);
    // diferencia 20 -> como el gasto aumentó, el tipo debe ser 'gasto'
    expect(serviceDefault.actualizarSaldoCartera).toHaveBeenCalledWith("C", 1, Math.abs(20), "gasto");
  });

  it("deleteTransaccionesCartera: maneja error de BD al eliminar ingresos", async () => {
    // simular que la primera eliminación (ingresos) falle mediante llamadas encadenadas a eq
    createClient.delete.mockImplementationOnce(() => ({
      eq: () => ({
        eq: () => ({ error: { message: "ing fail" } }),
      }),
    }));
    const res = await servicio.deleteTransaccionesCartera(1, "X");
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/ing fail/);
  });

  it("getNumeroTransacciones: devuelve el conteo total correctamente", async () => {
    // primera llamada (conteo de ingresos) - devolver objeto con método eq
    createClient.select.mockImplementationOnce(() => ({ eq: () => ({ eq: () => ({ count: 2, error: null }) }) }));
    // segunda llamada (conteo de gastos)
    createClient.select.mockImplementationOnce(() => ({ eq: () => ({ eq: () => ({ count: 3, error: null }) }) }));

    const r = await servicio.getNumeroTransacciones(1, "C");
    expect(r.total).toBe(5);
    expect(r.error).toBeNull();
  });

  it("getNumeroTransacciones: gestiona excepciones y devuelve 0", async () => {
    createClient.select.mockImplementationOnce(() => { throw new Error("boom"); });
    const r = await servicio.getNumeroTransacciones(1, "C");
    expect(r.total).toBe(0);
    expect(r.error).toBeDefined();
  });
});
