// src/services/__tests__/transaccionService.test.ts

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

  // Instead of relying on chainable order mock, spy on internal service methods (they are properties on default export)
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
