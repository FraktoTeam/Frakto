import {
  getCarteras,
  getCartera,
  createCartera,
  updateCartera,
  editCartera,
  deleteCartera,
} from "@/services/carterasService";
import { createClient } from "@/utils/client";

jest.mock("@/utils/client", () => ({
  createClient: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      single: jest.fn(),
      maybeSingle: jest.fn(),
    })),
  },
}));

describe("🧪 carterasService", () => {
  afterEach(() => jest.clearAllMocks());

  // ========== GET CARTERAS ==========
  it("getCarteras obtiene carteras de un usuario", async () => {
    (createClient.from as jest.Mock).mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: [{ nombre: "Ahorros", saldo: 100, id_usuario: 1 }], error: null }),
      }),
    });

    const result = await getCarteras(1);
    expect(result).toEqual([{ nombre: "Ahorros", saldo: 100, id_usuario: 1 }]);
  });

  // ========== GET CARTERA ==========
  it("getCartera devuelve una cartera existente", async () => {
    (createClient.from as jest.Mock).mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { nombre: "Personal", saldo: 200, id_usuario: 1 },
              error: null,
            }),
          }),
        }),
      }),
    });

    const result = await getCartera("Personal", 1);
    expect(result).toEqual({ nombre: "Personal", saldo: 200, id_usuario: 1 });
  });

  it("getCartera devuelve null si no existe", async () => {
    (createClient.from as jest.Mock).mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
          }),
        }),
      }),
    });

    const result = await getCartera("Inexistente", 1);
    expect(result).toBeNull();
  });

  // ========== CREATE CARTERA ==========
  it("createCartera crea correctamente una nueva cartera", async () => {
    (createClient.from as jest.Mock).mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    });

    (createClient.from as jest.Mock).mockReturnValueOnce({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { nombre: "Nueva", saldo: 150, id_usuario: 1 },
            error: null,
          }),
        }),
      }),
    });

    const { data, error } = await createCartera("Nueva", 150, 1);
    expect(error).toBeNull();
    expect(data).toEqual({ nombre: "Nueva", saldo: 150, id_usuario: 1 });
  });

  it("createCartera devuelve error si ya existe", async () => {
    (createClient.from as jest.Mock).mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: { nombre: "Repetida" }, error: null }),
          }),
        }),
      }),
    });

    const { data, error } = await createCartera("Repetida", 100, 1);
    expect(data).toBeNull();
    expect(error).toContain("Ya existe");
  });

  // ========== UPDATE CARTERA ==========
  it("updateCartera actualiza el saldo correctamente", async () => {
    (createClient.from as jest.Mock).mockReturnValueOnce({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      }),
    });

    await expect(updateCartera("Ahorros", 1, 250)).resolves.toBeUndefined();
  });

  // ========== EDIT CARTERA ==========
  it("editCartera cambia el nombre de una cartera", async () => {
    (createClient.from as jest.Mock).mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    });

    (createClient.from as jest.Mock).mockReturnValueOnce({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { nombre: "NuevoNombre", saldo: 100, id_usuario: 1 },
                error: null,
              }),
            }),
          }),
        }),
      }),
    });

    const { data, error } = await editCartera(1, "AntiguoNombre", "NuevoNombre");
    expect(error).toBeNull();
    expect(data).toEqual({ nombre: "NuevoNombre", saldo: 100, id_usuario: 1 });
  });

  // ========== DELETE CARTERA ==========
  it("deleteCartera elimina correctamente una cartera", async () => {
    (createClient.from as jest.Mock).mockReturnValueOnce({
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      }),
    });

    const { success, error } = await deleteCartera(1, "Ahorros");
    expect(success).toBe(true);
    expect(error).toBeNull();
  });
});
