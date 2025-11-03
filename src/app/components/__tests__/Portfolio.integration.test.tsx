/**
 * @file Portfolio.integration.test.tsx
 * Test de integración ligera del componente Portfolio
 */

import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";

jest.mock("@/services/carterasService", () => ({
  getCarteras: jest.fn().mockResolvedValue([
    { id: 1, nombre: "Personal", saldo: 2500, id_usuario: 1 },
    { id: 2, nombre: "Ahorros", saldo: 1000, id_usuario: 1 },
  ]),
  createCartera: jest.fn().mockImplementation((nombre: string) => {
    if (nombre.toLowerCase().includes("duplicada")) {
      // Simula error solo si el test crea una "duplicada"
      return Promise.reject(new Error("duplicate key value violates unique constraint"));
    }
    return Promise.resolve({ data: { id: Math.random(), nombre }, error: null });
  }),
  editCartera: jest.fn().mockResolvedValue({ success: true }),
  deleteCartera: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock("@/services/transaccionService", () => ({
  getIngresos: jest.fn().mockResolvedValue([]),
  getGastos: jest.fn().mockResolvedValue([]),
  createIngreso: jest.fn().mockResolvedValue({ data: null, error: null }),
  createGasto: jest.fn().mockResolvedValue({ data: null, error: null }),
  evaluarRiesgoGastoIngreso: jest.fn().mockResolvedValue(null),
  calcularSaldoCartera: jest.fn(),
  actualizarSaldoCartera: jest.fn().mockResolvedValue({ success: true, error: null }),
  getUltimosMovimientosUsuario: jest.fn().mockResolvedValue({ data: [], error: null }),
  getUltimosMovimientosCartera: jest.fn().mockResolvedValue({ data: [], error: null }),
  getNumeroTransacciones: jest.fn().mockResolvedValue({ total: 0, error: null }),
  deleteTransaccionesCartera: jest.fn().mockResolvedValue({ success: true, error: null }),
  editIngreso: jest.fn().mockResolvedValue({ success: true, error: null }),
  editGasto: jest.fn().mockResolvedValue({ success: true, error: null }),
  deleteIngreso: jest.fn().mockResolvedValue({ success: true, error: null }),
  deleteGasto: jest.fn().mockResolvedValue({ success: true, error: null }),
}));

import { Portfolio } from "@/app/components/Portfolio";
import * as carterasService from "@/services/carterasService";

describe("💼 Portfolio Component (integración ligera)", () => {
  const mockUserId = 1;

  beforeAll(() => {
    // Evitar que console.error ensucie la salida de tests cuando simulamos errores intencionados
    jest.spyOn(console, "error").mockImplementation(() => {});
    // Radix/DOM libs sometimes warn about missing aria attributes during tests — silence to reduce noise
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

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
    fireEvent.click(await screen.findByTitle("Ver cartera"));

    // Abrir diálogo de ingreso
    fireEvent.click(await screen.findByText("Añadir Ingreso"));

    // Sin importe ni fecha -> alerta (click the action button inside the opened dialog)
    const dialogs1 = await screen.findAllByRole("dialog");
    const ingresoDialog = dialogs1[dialogs1.length - 1];
    const { getByRole: getByRoleInIngreso } = require("@testing-library/react").within(ingresoDialog);
    fireEvent.click(getByRoleInIngreso("button", { name: /Registrar Ingreso/i }));
    // the component sets incomeErrors and does not call global.alert; check for inline message
    await waitFor(() => expect(screen.getByText(/Debe ser un número/i)).toBeInTheDocument());

    // poner importe pero sin fecha -> alerta de fecha
    fireEvent.change(screen.getByLabelText(/Importe/i), { target: { value: "100" } });
    const dialogs1b = await screen.findAllByRole("dialog");
    const ingresoDialog2 = dialogs1b[dialogs1b.length - 1];
    const { getByRole: getByRoleInIngreso2 } = require("@testing-library/react").within(ingresoDialog2);
    fireEvent.click(getByRoleInIngreso2("button", { name: /Registrar Ingreso/i }));
    await waitFor(() => expect(screen.getByText(/La fecha es obligatoria/i)).toBeInTheDocument());
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
    fireEvent.click(await screen.findByTitle("Ver cartera"));

    // Abrir diálogo de ingreso y rellenar
    fireEvent.click(await screen.findByText("Añadir Ingreso"));
    fireEvent.change(screen.getByLabelText(/Importe/i), { target: { value: "100" } });
    fireEvent.change(screen.getByLabelText(/Fecha/i), { target: { value: "2025-10-20" } });
    const dialogs2 = await screen.findAllByRole("dialog");
    const ingresoDialog3 = dialogs2[dialogs2.length - 1];
    const { getByRole: getByRoleInIngreso3 } = require("@testing-library/react").within(ingresoDialog3);
    fireEvent.click(getByRoleInIngreso3("button", { name: /Registrar Ingreso/i }));

    // Aparece confirmación (fallback: try testid first, then document text if portal timing hides testid)
    await waitFor(() => {
      const el = screen.queryByTestId("portfolio-confirm-message");
      if (el) {
        expect(el).toHaveTextContent(/Ingreso registrado correctamente/);
        return;
      }

      // fallback: search whole document text
      const txt = (document.body.textContent || "").replace(/\s+/g, " ");
      expect(txt).toMatch(/Ingreso registrado correctamente/);
    });

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
    fireEvent.click(await screen.findByTitle("Ver cartera"));
    fireEvent.click(await screen.findByText("Añadir Gasto"));

    // sin importe -> alerta (click the action button inside the opened dialog)
    const dialogsG1 = await screen.findAllByRole("dialog");
    const gastoDialog = dialogsG1[dialogsG1.length - 1];
    const { getByRole: getByRoleInGasto } = require("@testing-library/react").within(gastoDialog);
    fireEvent.click(getByRoleInGasto("button", { name: /Registrar Gasto/i }));
    await waitFor(() => expect(screen.getByText(/Debe ser un número/i)).toBeInTheDocument());

    // importe pero sin categoría -> alerta
    fireEvent.change(screen.getByLabelText(/Importe/i), { target: { value: "50" } });
    const dialogsG2 = await screen.findAllByRole("dialog");
    const gastoDialog2 = dialogsG2[dialogsG2.length - 1];
    const { getByRole: getByRoleInGasto2 } = require("@testing-library/react").within(gastoDialog2);
    fireEvent.click(getByRoleInGasto2("button", { name: /Registrar Gasto/i }));
    await waitFor(() => expect(screen.getByText(/Debes seleccionar una categoría/i)).toBeInTheDocument());

    // categoría pero sin fecha -> alerta
    // abrir select: use click on trigger and pick option
    fireEvent.click(screen.getByText(/Selecciona una categoría/i));
    fireEvent.click(screen.getByText("Comida"));
    const dialogsG3 = await screen.findAllByRole("dialog");
    const gastoDialog3 = dialogsG3[dialogsG3.length - 1];
    const { getByRole: getByRoleInGasto3 } = require("@testing-library/react").within(gastoDialog3);
    fireEvent.click(getByRoleInGasto3("button", { name: /Registrar Gasto/i }));
    await waitFor(() => expect(screen.getByText(/La fecha es obligatoria/i)).toBeInTheDocument());
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
    fireEvent.click(await screen.findByTitle("Ver cartera"));
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
    await waitFor(() => {
      const el = screen.queryByTestId("portfolio-confirm-message");
      if (el) {
        expect(el).toHaveTextContent(/Gasto registrado correctamente/);
        return;
      }

      const txt = (document.body.textContent || "").replace(/\s+/g, " ");
      expect(txt).toMatch(/Gasto registrado correctamente/);
    });
  });

  it("muestra estado vacío cuando no hay carteras", async () => {
    (carterasService.getCarteras as jest.Mock).mockResolvedValue([]);
    render(<Portfolio userId={mockUserId} />);
    // Be resilient to whitespace/accents/unicode differences by checking the whole document text
    await waitFor(() => {
      const txt = (document.body.textContent || "").replace(/\s+/g, " ").normalize("NFKC");
      expect(txt).toMatch(/no hay carteras/i);
    });
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
    fireEvent.click(screen.getByTitle("Editar cartera"));
    const input = screen.getByLabelText(/Nuevo nombre/i);
    fireEvent.change(input, { target: { value: "Nombre inválido!" } });
    fireEvent.click(screen.getByText("Guardar Cambios"));
    expect(await screen.findByText(/El nombre solo puede contener letras y números/)).toBeInTheDocument();
  });

  it("muestra error al eliminar si deleteCartera devuelve error", async () => {
    (carterasService.getCarteras as jest.Mock).mockResolvedValue([
      { nombre: "Eliminarme", saldo: 1200, id_usuario: mockUserId },
    ]);

    // Simulate server error path by rejecting so the component's catch branch runs
    (carterasService.deleteCartera as jest.Mock).mockRejectedValueOnce(new Error("server"));

    render(<Portfolio userId={mockUserId} />);
    expect(await screen.findByText("Eliminarme")).toBeInTheDocument();
    fireEvent.click(screen.getByTitle("Eliminar cartera"));
    // espera a que el diálogo se monte en el portal
    const dialog =
      (await screen.findByRole("dialog").catch(() => null)) ||
      (await screen.findByRole("alertdialog").catch(() => null));
    expect(dialog).not.toBeNull();

    // ahora busca el título dentro del diálogo
    expect(
      within(dialog!).getByText("Confirmar eliminación")
    ).toBeInTheDocument();
    // click the confirm button inside the dialog
    fireEvent.click(within(dialog!).getByText("Sí, eliminar"));
    // component sets a generic error message in the catch branch
    expect(await screen.findByText(/Ocurrió un error al eliminar la cartera/i)).toBeInTheDocument();
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

    fireEvent.click(screen.getByTitle("Editar cartera"));

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

    fireEvent.click(screen.getByTitle("Eliminar cartera"));

    // espera a que el diálogo se monte en el portal
    const dialog =
      (await screen.findByRole("dialog").catch(() => null)) ||
      (await screen.findByRole("alertdialog").catch(() => null));
    expect(dialog).not.toBeNull();

    // ahora busca el título dentro del diálogo
    expect(
      within(dialog!).getByText("Confirmar eliminación")
    ).toBeInTheDocument();

    fireEvent.click(within(dialog!).getByText("Sí, eliminar"));

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

    fireEvent.click(screen.getByTitle("Eliminar cartera"));

    // espera a que el diálogo se monte en el portal
    const dialog =
      (await screen.findByRole("dialog").catch(() => null)) ||
      (await screen.findByRole("alertdialog").catch(() => null));
    expect(dialog).not.toBeNull();


    // ahora busca el título dentro del diálogo
    expect(
      within(dialog!).getByText("Confirmar eliminación")
    ).toBeInTheDocument();

    fireEvent.click(within(dialog!).getByText("Cancelar"));

    await waitFor(() => {
        expect(screen.queryByText(/¿Estás seguro de que deseas eliminar/i)).not.toBeInTheDocument();
    });

    expect(carterasService.deleteCartera).not.toHaveBeenCalled();

    expect(screen.getByText("CancelarTest")).toBeInTheDocument();
  });

  it("✏️ edita una transacción y refresca movimientos correctamente", async () => {
    (carterasService.getCarteras as jest.Mock).mockResolvedValueOnce([
      { nombre: "Personal", saldo: 2000, id_usuario: mockUserId },
    ]);

    const trans = require("@/services/transaccionService");
    // preparar movimientos iniciales
    (trans.getUltimosMovimientosCartera as jest.Mock).mockResolvedValueOnce({
      data: [
        { id_movimiento: 5, descripcion: 'Pago', importe: 50, fecha: '2025-10-01', tipo: 'ingreso' }
      ],
      error: null,
    });

    // mock editIngreso para que devuelva success
    (trans.editIngreso as jest.Mock).mockResolvedValueOnce({ success: true, error: null });

    // despues de editar, fetchWallets devuelve saldo actualizado y getUltimosMovimientosCartera devuelve movimientos actualizados
    (carterasService.getCarteras as jest.Mock).mockResolvedValueOnce([{ nombre: 'Personal', saldo: 2050, id_usuario: mockUserId }]);
    (trans.getUltimosMovimientosCartera as jest.Mock).mockResolvedValueOnce({ data: [{ id_movimiento: 5, descripcion: 'Pago editado', importe: 100, fecha: '2025-10-02', tipo: 'ingreso' }], error: null });

    render(<Portfolio userId={mockUserId} />);

  // abrir cartera y esperar movimiento
  fireEvent.click(await screen.findByTitle('Ver cartera'));
  // esperar a que la sección de movimientos exista
  await screen.findByText('Transacciones Recientes');
  const pagoEl = await screen.findByText(/Pago/);
  expect(pagoEl).toBeInTheDocument();

  // localizar el contenedor del movimiento y pulsar el botón de editar dentro de él
  const transactionContainer = pagoEl.closest('.group') || pagoEl.closest('div');
  const { getByTitle: getByTitleInTransaction } = within(transactionContainer as HTMLElement);
  fireEvent.click(getByTitleInTransaction('Editar movimiento'));

  // esperar al diálogo de edición y operar dentro de él
  const dialogs = await screen.findAllByRole('dialog');
  const editDialog = dialogs[dialogs.length - 1];
  const editWithin = within(editDialog);

    // Cambiar importe y fecha dentro del diálogo de edición
    fireEvent.change(editWithin.getByLabelText(/Importe/i), { target: { value: '100' } });
    fireEvent.change(editWithin.getByLabelText(/Fecha/i), { target: { value: '2025-10-02' } });

  // Guardar cambios (botón dentro del diálogo)
  fireEvent.click(editWithin.getByText('Guardar Cambios'));

    // Asegurarse que la llamada a editIngreso se realizó con los parámetros esperados
    await waitFor(() => expect(trans.editIngreso).toHaveBeenCalledWith(
      5,
      mockUserId,
      'Personal',
      100,
      expect.any(String),
      '2025-10-02'
    ));

    // Comprobar que se solicitó la recarga de movimientos tras la edición
    await waitFor(() => expect(trans.getUltimosMovimientosCartera).toHaveBeenCalled());
  });

});
