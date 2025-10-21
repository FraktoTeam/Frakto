/**
 * @file Portfolio.integration.test.tsx
 * Test de integración ligera del componente Portfolio
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Portfolio } from "@/app/components/Portfolio";
import * as carterasService from "@/services/carterasService";

jest.mock("@/services/carterasService", () => ({
  getCarteras: jest.fn(),
  createCartera: jest.fn(),
  editCartera: jest.fn(),
  deleteCartera: jest.fn(),
}));

jest.mock("@/services/transaccionService", () => ({
  getIngresos: jest.fn().mockResolvedValue([]),
  getGastos: jest.fn().mockResolvedValue([]),
  createIngreso: jest.fn().mockResolvedValue({ data: null, error: null }),
  createGasto: jest.fn().mockResolvedValue({ data: null, error: null }),
  calcularSaldoCartera: jest.fn(),
  actualizarSaldoCartera: jest.fn().mockResolvedValue({ success: true, error: null }),
  getUltimosMovimientosUsuario: jest.fn().mockResolvedValue({ data: [], error: null }),
  getUltimosMovimientosCartera: jest.fn().mockResolvedValue({ data: [], error: null }),
}));

describe("💼 Portfolio Component (integración ligera)", () => {
  const mockUserId = 1;

  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).alert = jest.fn();
  });

  it("muestra alert si intenta registrar ingreso sin importe o fecha", async () => {
    (carterasService.getCarteras as jest.Mock).mockResolvedValue([
      { nombre: "Personal", saldo: 2500, id_usuario: mockUserId },
    ]);

    render(<Portfolio userId={mockUserId} />);

    // abrir cartera
    fireEvent.click(await screen.findByText("Ver Cartera"));

    // Abrir diálogo de ingreso
    fireEvent.click(await screen.findByText("Añadir Ingreso"));

  // Sin importe ni fecha -> alerta (click the action button inside the opened dialog)
  const dialogs1 = await screen.findAllByRole("dialog");
  const ingresoDialog = dialogs1[dialogs1.length - 1];
  const { getByRole: getByRoleInIngreso } = require("@testing-library/react").within(ingresoDialog);
  fireEvent.click(getByRoleInIngreso("button", { name: /Registrar Ingreso/i }));
  await waitFor(() => expect(global.alert).toHaveBeenCalledWith("El importe debe ser mayor que 0."));

  // poner importe pero sin fecha -> alerta de fecha
  fireEvent.change(screen.getByLabelText(/Importe/i), { target: { value: "100" } });
  const dialogs1b = await screen.findAllByRole("dialog");
  const ingresoDialog2 = dialogs1b[dialogs1b.length - 1];
  const { getByRole: getByRoleInIngreso2 } = require("@testing-library/react").within(ingresoDialog2);
  fireEvent.click(getByRoleInIngreso2("button", { name: /Registrar Ingreso/i }));
  await waitFor(() => expect(global.alert).toHaveBeenCalledWith("La fecha es obligatoria."));
  });

  it("registra ingreso correctamente y actualiza la cartera al aceptar", async () => {
    (carterasService.getCarteras as jest.Mock)
      .mockResolvedValueOnce([{ nombre: "Personal", saldo: 1000, id_usuario: mockUserId }])
      // respuesta de fetchWallets tras Aceptar
      .mockResolvedValueOnce([{ nombre: "Personal", saldo: 1100, id_usuario: mockUserId }]);

    const trans = require("@/services/transaccionService");
    (trans.createIngreso as jest.Mock).mockResolvedValueOnce({ data: null, error: null });
    (trans.calcularSaldoCartera as jest.Mock).mockResolvedValueOnce(1100);
    (trans.actualizarSaldoCartera as jest.Mock).mockResolvedValueOnce({ success: true, error: null });

    render(<Portfolio userId={mockUserId} />);

    // Ver cartera
    fireEvent.click(await screen.findByText("Ver Cartera"));

    // Abrir diálogo de ingreso y rellenar
    fireEvent.click(await screen.findByText("Añadir Ingreso"));
    fireEvent.change(screen.getByLabelText(/Importe/i), { target: { value: "100" } });
    fireEvent.change(screen.getByLabelText(/Fecha/i), { target: { value: "2025-10-20" } });
  const dialogs2 = await screen.findAllByRole("dialog");
  const ingresoDialog3 = dialogs2[dialogs2.length - 1];
  const { getByRole: getByRoleInIngreso3 } = require("@testing-library/react").within(ingresoDialog3);
  fireEvent.click(getByRoleInIngreso3("button", { name: /Registrar Ingreso/i }));

    // Aparece confirmación
    expect(await screen.findByText(/Ingreso registrado correctamente/)).toBeInTheDocument();

    // Al aceptar, fetchWallets es llamado y el balance se actualiza
    fireEvent.click(screen.getByText("Aceptar"));
    await waitFor(() => expect(carterasService.getCarteras).toHaveBeenCalled());
  // nuevo saldo en pantalla (puede mostrarse sin separador de miles según renderizado)
  expect(await screen.findByText(/1100,00€|1\.100,00€/)).toBeInTheDocument();
  });

  it("valida campos de gasto y muestra alert si faltan datos", async () => {
    (carterasService.getCarteras as jest.Mock).mockResolvedValue([
      { nombre: "Personal", saldo: 2500, id_usuario: mockUserId },
    ]);

    render(<Portfolio userId={mockUserId} />);
    fireEvent.click(await screen.findByText("Ver Cartera"));
    fireEvent.click(await screen.findByText("Añadir Gasto"));

  // sin importe -> alerta (click the action button inside the opened dialog)
  const dialogsG1 = await screen.findAllByRole("dialog");
  const gastoDialog = dialogsG1[dialogsG1.length - 1];
  const { getByRole: getByRoleInGasto } = require("@testing-library/react").within(gastoDialog);
  fireEvent.click(getByRoleInGasto("button", { name: /Registrar Gasto/i }));
  await waitFor(() => expect(global.alert).toHaveBeenCalledWith("El importe debe ser mayor que 0."));

    // importe pero sin categoría -> alerta
    fireEvent.change(screen.getByLabelText(/Importe/i), { target: { value: "50" } });
  const dialogsG2 = await screen.findAllByRole("dialog");
  const gastoDialog2 = dialogsG2[dialogsG2.length - 1];
  const { getByRole: getByRoleInGasto2 } = require("@testing-library/react").within(gastoDialog2);
  fireEvent.click(getByRoleInGasto2("button", { name: /Registrar Gasto/i }));
  await waitFor(() => expect(global.alert).toHaveBeenCalledWith("Debes seleccionar una categoría."));

    // categoría pero sin fecha -> alerta
    // abrir select: use click on trigger and pick option
    fireEvent.click(screen.getByText(/Selecciona una categoría/i));
    fireEvent.click(screen.getByText("Comida"));
  const dialogsG3 = await screen.findAllByRole("dialog");
  const gastoDialog3 = dialogsG3[dialogsG3.length - 1];
  const { getByRole: getByRoleInGasto3 } = require("@testing-library/react").within(gastoDialog3);
  fireEvent.click(getByRoleInGasto3("button", { name: /Registrar Gasto/i }));
  await waitFor(() => expect(global.alert).toHaveBeenCalledWith("La fecha es obligatoria."));
  });

  it("registra gasto correctamente y muestra confirmación", async () => {
    (carterasService.getCarteras as jest.Mock)
      .mockResolvedValueOnce([{ nombre: "Personal", saldo: 2000, id_usuario: mockUserId }])
      .mockResolvedValueOnce([{ nombre: "Personal", saldo: 1900, id_usuario: mockUserId }]);

    const trans = require("@/services/transaccionService");
    (trans.createGasto as jest.Mock).mockResolvedValueOnce({ data: null, error: null });
    (trans.calcularSaldoCartera as jest.Mock).mockResolvedValueOnce(1900);
    (trans.actualizarSaldoCartera as jest.Mock).mockResolvedValueOnce({ success: true, error: null });

    render(<Portfolio userId={mockUserId} />);
    fireEvent.click(await screen.findByText("Ver Cartera"));
    fireEvent.click(await screen.findByText("Añadir Gasto"));

    fireEvent.change(screen.getByLabelText(/Importe/i), { target: { value: "100" } });
    // seleccionar categoría
    fireEvent.click(screen.getByText(/Selecciona una categoría/i));
    fireEvent.click(screen.getByText("Comida"));
    fireEvent.change(screen.getByLabelText(/Fecha/i), { target: { value: "2025-10-20" } });

  const dialogsG4 = await screen.findAllByRole("dialog");
  const gastoDialog4 = dialogsG4[dialogsG4.length - 1];
  const { getByRole: getByRoleInGasto4 } = require("@testing-library/react").within(gastoDialog4);
  fireEvent.click(getByRoleInGasto4("button", { name: /Registrar Gasto/i }));
  expect(await screen.findByText(/Gasto registrado correctamente/)).toBeInTheDocument();
  });

  it("muestra estado vacío cuando no hay carteras", async () => {
    (carterasService.getCarteras as jest.Mock).mockResolvedValue([]);
    render(<Portfolio userId={mockUserId} />);
  // Be resilient to whitespace/accents differences
  expect(await screen.findByText(/No hay carteras/i)).toBeInTheDocument();
  });

  it("muestra mensaje de duplicado al crear cartera si ocurre error de duplicate key", async () => {
    (carterasService.getCarteras as jest.Mock).mockResolvedValue([]);
    (carterasService.createCartera as jest.Mock).mockRejectedValueOnce(new Error("duplicate key value violates unique constraint"));

    render(<Portfolio userId={mockUserId} />);
    fireEvent.click(await screen.findByText("Añadir Cartera"));
    fireEvent.change(screen.getByLabelText(/Nombre de la Cartera/i), { target: { value: "Duplicada" } });
    fireEvent.change(screen.getByLabelText(/Balance Inicial/i), { target: { value: "100" } });
    fireEvent.click(screen.getByText("Crear Cartera"));

    expect(await screen.findByText(/Ya existe una cartera con ese nombre para este usuario/)).toBeInTheDocument();
  });

  it("valida nombre inválido al editar cartera", async () => {
    (carterasService.getCarteras as jest.Mock).mockResolvedValue([
      { nombre: "Vieja", saldo: 2500, id_usuario: mockUserId },
    ]);

    render(<Portfolio userId={mockUserId} />);
    expect(await screen.findByText("Vieja")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Editar"));
    const input = screen.getByLabelText(/Nuevo nombre/i);
    fireEvent.change(input, { target: { value: "Nombre inválido!" } });
    fireEvent.click(screen.getByText("Guardar Cambios"));
    expect(await screen.findByText(/El nombre solo puede contener letras y números/)).toBeInTheDocument();
  });

  it("muestra error al eliminar si deleteCartera devuelve error", async () => {
    (carterasService.getCarteras as jest.Mock).mockResolvedValue([
      { nombre: "Eliminarme", saldo: 1200, id_usuario: mockUserId },
    ]);

    (carterasService.deleteCartera as jest.Mock).mockResolvedValue({ success: false, error: "server" });

    render(<Portfolio userId={mockUserId} />);
    expect(await screen.findByText("Eliminarme")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Eliminar"));
    expect(await screen.findByText(/¿Estás seguro de que deseas eliminar/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText("Sí, eliminar"));
    expect(await screen.findByText(/Error al eliminar la cartera. Intenta nuevamente./)).toBeInTheDocument();
  });

  it("✅ renderiza correctamente las carteras del usuario", async () => {
    (carterasService.getCarteras as jest.Mock).mockResolvedValue([
      { nombre: "Personal", saldo: 2500, id_usuario: mockUserId },
      { nombre: "Ahorros", saldo: 10000, id_usuario: mockUserId },
    ]);

    render(<Portfolio userId={mockUserId} />);

    expect(await screen.findByText("Personal")).toBeInTheDocument();
    expect(await screen.findByText("Ahorros")).toBeInTheDocument();
  });

  it("🧩 abre el diálogo para añadir cartera y valida errores de nombre", async () => {
    (carterasService.getCarteras as jest.Mock).mockResolvedValue([]);
    (carterasService.createCartera as jest.Mock).mockResolvedValue({ data: null, error: null });

    render(<Portfolio userId={mockUserId} />);

    fireEvent.click(await screen.findByText("Añadir Cartera"));

    fireEvent.change(screen.getByLabelText(/Nombre de la Cartera/i), { target: { value: "Cartera inválida!" } });
    fireEvent.change(screen.getByLabelText(/Balance Inicial/i), { target: { value: "100" } });
    fireEvent.click(screen.getByText("Crear Cartera"));

    expect(await screen.findByText(/El nombre solo puede contener letras y números/i)).toBeInTheDocument();
  });

  it("🟢 crea una cartera correctamente y la muestra en pantalla", async () => {
    (carterasService.getCarteras as jest.Mock).mockResolvedValue([
      { nombre: "Principal", saldo: 5000, id_usuario: mockUserId },
    ]);

    (carterasService.createCartera as jest.Mock).mockResolvedValue({
      data: { nombre: "Nueva", saldo: 1000, id_usuario: mockUserId },
      error: null,
    });

    render(<Portfolio userId={mockUserId} />);

    expect(await screen.findByText("Principal")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Añadir Cartera"));

    fireEvent.change(screen.getByLabelText(/Nombre de la Cartera/i), { target: { value: "Nueva" } });
    fireEvent.change(screen.getByLabelText(/Balance Inicial/i), { target: { value: "1000" } });

    fireEvent.click(screen.getByText("Crear Cartera"));

    await waitFor(() => {
      expect(carterasService.createCartera).toHaveBeenCalledWith("Nueva", 1000, mockUserId);
    });
  });

    it("✏️ permite editar el nombre de una cartera correctamente", async () => {
        const mockUserId = 1;

        (carterasService.getCarteras as jest.Mock).mockResolvedValue([
            { nombre: "Vieja", saldo: 2500, id_usuario: mockUserId },
        ]);

        (carterasService.editCartera as jest.Mock).mockResolvedValue({
            data: { nombre: "Nueva", saldo: 2500, id_usuario: mockUserId },
            error: null,
        });

        render(<Portfolio userId={mockUserId} />);

        expect(await screen.findByText("Vieja")).toBeInTheDocument();

        fireEvent.click(screen.getByText("Editar"));

        const input = screen.getByLabelText(/Nuevo nombre/i);
        fireEvent.change(input, { target: { value: "Nueva" } });

        fireEvent.click(screen.getByText("Guardar Cambios"));

        await waitFor(() => {
            expect(carterasService.editCartera).toHaveBeenCalledWith(1, "Vieja", "Nueva");
        });

        await waitFor(() => {
            expect(screen.getByText("Nueva")).toBeInTheDocument();
        });
    });

    it("🗑️ elimina una cartera correctamente tras confirmar", async () => {
        const mockUserId = 1;

        (carterasService.getCarteras as jest.Mock).mockResolvedValue([
            { nombre: "Eliminarme", saldo: 1200, id_usuario: mockUserId },
        ]);

        (carterasService.deleteCartera as jest.Mock).mockResolvedValue({
            success: true,
            error: null,
        });

        render(<Portfolio userId={mockUserId} />);

        expect(await screen.findByText("Eliminarme")).toBeInTheDocument();

        fireEvent.click(screen.getByText("Eliminar"));

        expect(await screen.findByText(/¿Estás seguro de que deseas eliminar/i)).toBeInTheDocument();

        fireEvent.click(screen.getByText("Sí, eliminar"));

        await waitFor(() => {
            expect(carterasService.deleteCartera).toHaveBeenCalledWith(mockUserId, "Eliminarme");
        });

        await waitFor(() => {
            expect(screen.queryByText("Eliminarme")).not.toBeInTheDocument();
        });
    });

    it("🚫 cierra el diálogo y no elimina la cartera al pulsar 'Cancelar'", async () => {
        const mockUserId = 1;

        (carterasService.getCarteras as jest.Mock).mockResolvedValue([
            { nombre: "CancelarTest", saldo: 3000, id_usuario: mockUserId },
        ]);

        render(<Portfolio userId={mockUserId} />);

        expect(await screen.findByText("CancelarTest")).toBeInTheDocument();

        fireEvent.click(screen.getByText("Eliminar"));

        expect(await screen.findByText(/¿Estás seguro de que deseas eliminar/i)).toBeInTheDocument();

        fireEvent.click(screen.getByText("Cancelar"));

        await waitFor(() => {
            expect(screen.queryByText(/¿Estás seguro de que deseas eliminar/i)).not.toBeInTheDocument();
        });

        expect(carterasService.deleteCartera).not.toHaveBeenCalled();

        expect(screen.getByText("CancelarTest")).toBeInTheDocument();
    });

});
