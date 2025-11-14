/**
 * Prueba de integración para el componente Calendar
 */
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";

// Mocks de servicios externos usados por Calendar
jest.mock("@/utils/client", () => ({
  // createClient se utiliza como un cliente ya instanciado en Calendar
  createClient: {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: [
            { nombre: "Personal", saldo: "2500" },
            { nombre: "Ahorros", saldo: "1000" },
          ], error: null }),
        }),
      }),
    }),
  },
}));

jest.mock("@/services/gastoFijoService", () => ({
  getGastosFijos: jest.fn().mockResolvedValue([
    // un gasto fijo recurrente que debería aparecer en el mes actual
    {
      id_gasto: 1,
      cartera_nombre: "Personal",
      id_usuario: 1,
      categoria_nombre: "Suscripción",
      importe: 20,
      fecha_inicio: new Date().toISOString().slice(0,10), // today
      frecuencia: 30,
      activo: true,
      descripcion: "Netflix",
    },
  ]),
}));

jest.mock("@/services/transaccionService", () => ({
  getIngresos: jest.fn().mockImplementation((cartera: string) => {
    // Devuelve un ingreso único para la cartera "Personal" en la fecha de hoy
    const today = new Date().toISOString().slice(0,10);
    if (cartera === "Personal") {
      return Promise.resolve([
        { cartera_nombre: "Personal", id_usuario: 1, importe: 100, descripcion: "Sueldo", fecha: today }
      ]);
    }
    return Promise.resolve([]);
  }),
  getGastos: jest.fn().mockResolvedValue([]),
}));

import { Calendar } from "@/app/components/Calendar";

describe("📅 Calendar (integration)", () => {
  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
    // Radix Select invoca scrollIntoView en las opciones; jsdom no lo implementa.
    // Proporcionamos una función vacía para evitar TypeError: candidate?.scrollIntoView is not a function
    if (typeof Element.prototype.scrollIntoView !== 'function') {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      Element.prototype.scrollIntoView = function () {}; 
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders calendar UI and legend", async () => {
    render(<Calendar userId={1} />);

    // Título y leyenda
    expect(await screen.findByText(/Calendario Financiero/)).toBeInTheDocument();
    expect(screen.getByText(/Ingresos/)).toBeInTheDocument();
    expect(screen.getByText(/Gastos/)).toBeInTheDocument();
    expect(screen.getByText(/Gasto fijo programado/)).toBeInTheDocument();
  });

  it("shows indicators for days with transactions and fixed expenses and opens modal with combined list", async () => {
    render(<Calendar userId={1} />);

    // Esperar a que se rendericen los botones del calendario
    const buttons = await screen.findAllByRole("button");
    // buscar un botón de día que contenga la fecha de hoy (el texto es numérico)
    const today = new Date().getDate();

    // Encontrar el botón cuyo texto es el día de hoy
    const dayButton = buttons.find(b => (b.textContent || "").includes(String(today)));
    expect(dayButton).toBeTruthy();

    // Hacer clic para abrir el modal
    fireEvent.click(dayButton!);

  // El diálogo debería abrirse y mostrar el encabezado 'Movimientos' (puede haber múltiples coincidencias: título + sección)
  const movs = await screen.findAllByText(/Movimientos/);
  expect(movs.length).toBeGreaterThan(0);

    // Como hemos mockeado un ingreso y un gasto fijo para 'Personal', deberían aparecer en la lista combinada
    // El Select debería listar ambas carteras (Personal, Ahorros)
    await waitFor(() => {
      const personalNodes = screen.queryAllByText(/Personal/);
      expect(personalNodes.length).toBeGreaterThan(0);
    });

    // abrir el select de carteras para que se rendericen las opciones (Radix las renderiza al abrir)
    const trigger = screen.getByText(/Todas las carteras/);
    fireEvent.click(trigger);
    // now the option should be present
    await waitFor(() => {
      const ahorrosNodes = screen.queryAllByText(/Ahorros/);
      expect(ahorrosNodes.length).toBeGreaterThan(0);
    });

  // El resumen del modal debería mostrar los totales (ingreso 100)
  expect(screen.getByText(/Total Ingresos/)).toBeInTheDocument();
  // The numeric total may be rendered in multiple places (title + summary). Accept any occurrence.
  const totalMatches = screen.queryAllByText(/\+€100\.00/);
  expect(totalMatches.length).toBeGreaterThan(0);

    // La lista combinada debe contener la descripción 'Sueldo' del ingreso mockeado
    expect(screen.getByText(/Sueldo/)).toBeInTheDocument();
    // La descripción del gasto fijo también debe estar presente
    expect(screen.getByText(/Netflix/)).toBeInTheDocument();
  });

  it("filters movements by selected portfolio", async () => {
    render(<Calendar userId={1} />);

    // Abrir el modal del día de hoy
    const buttons = await screen.findAllByRole("button");
    const today = new Date().getDate();
    const dayButton = buttons.find(b => (b.textContent || "").includes(String(today)));
    fireEvent.click(dayButton!);

    // esperar a que esté el trigger del select y abrirlo
    await waitFor(() => expect(screen.getByLabelText(/Filtrar por cartera/)).toBeInTheDocument());

    // Abrir el select y elegir 'Ahorros' que no tiene transacciones
    fireEvent.click(screen.getByText(/Todas las carteras/));
    // Click item (portal timing: find by text in document)
    fireEvent.click(await screen.findByText("Ahorros"));

    // Como 'Ahorros' no tiene movimientos, debería mostrarse el mensaje de estado vacío
    await waitFor(() => {
      const el = screen.queryByText(/Esta cartera no tiene movimientos registrados en esta fecha/i);
      if (el) {
        expect(el).toBeInTheDocument();
        return;
      }

      // alternativa: el texto puede estar dividido en nodos; comprobar el texto completo del documento
      const txt = (document.body.textContent || "").replace(/\s+/g, " ");
      expect(txt).toMatch(/Esta cartera no tiene movimientos registrados en esta fecha/i);
    });
  });

  it("gestiona carteras vacías sin fallos", async () => {
    // Anular temporalmente el mock del cliente para devolver carteras vacías
    jest.doMock("@/utils/client", () => ({
      createClient: {
        from: () => ({
          select: () => ({
            eq: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
          }),
        }),
      },
    }), { virtual: true });

    // Volver a importar Calendar para que use el mock temporal
    const { Calendar: CalendarReloaded } = require("@/app/components/Calendar");
    render(<CalendarReloaded userId={1} />);

    // Abrir cualquier día y esperar el mensaje 'No hay movimientos' dentro del modal al abrirse
    const buttons = await screen.findAllByRole("button");
    const dayBtn = buttons.find(b => (b.textContent || "").trim().length > 0);
    fireEvent.click(dayBtn!);

    await waitFor(() => expect(screen.getByText(/No hay movimientos registrados en esta fecha/)).toBeInTheDocument());
  });

});
