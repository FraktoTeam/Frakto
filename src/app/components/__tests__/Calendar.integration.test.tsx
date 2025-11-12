/**
 * Integration test for Calendar component
 */
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";

// Mock external services used by Calendar
jest.mock("@/utils/client", () => ({
  // createClient is used as an already-instantiated client in Calendar
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
    // one recurring fixed expense that should appear in the current month
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
    // Return a single income for portfolio "Personal" on today's date
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
    // Radix Select calls scrollIntoView on options; jsdom doesn't implement it.
    // Provide a no-op to avoid TypeError: candidate?.scrollIntoView is not a function
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

    // Title and legend
    expect(await screen.findByText(/Calendario Financiero/)).toBeInTheDocument();
    expect(screen.getByText(/Ingresos/)).toBeInTheDocument();
    expect(screen.getByText(/Gastos/)).toBeInTheDocument();
    expect(screen.getByText(/Gasto fijo programado/)).toBeInTheDocument();
  });

  it("shows indicators for days with transactions and fixed expenses and opens modal with combined list", async () => {
    render(<Calendar userId={1} />);

    // Wait for calendar buttons to render
    const buttons = await screen.findAllByRole("button");
    // find a day button that contains today's date (text is numeric)
    const today = new Date().getDate();

    // Find button with text of today's day
    const dayButton = buttons.find(b => (b.textContent || "").includes(String(today)));
    expect(dayButton).toBeTruthy();

    // Click it to open the modal
    fireEvent.click(dayButton!);

  // Dialog should open and show Movimientos header (there can be multiple matches: title + section)
  const movs = await screen.findAllByText(/Movimientos/);
  expect(movs.length).toBeGreaterThan(0);

    // Since we mocked one income and one fixed expense for Personal, they should appear in the combined list
    // The Select should list both portfolios (Personal, Ahorros)
    await waitFor(() => {
      const personalNodes = screen.queryAllByText(/Personal/);
      expect(personalNodes.length).toBeGreaterThan(0);
    });

    // open the portfolio select so the options are rendered (Radix renders them on open)
    const trigger = screen.getByText(/Todas las carteras/);
    fireEvent.click(trigger);
    // now the option should be present
    await waitFor(() => {
      const ahorrosNodes = screen.queryAllByText(/Ahorros/);
      expect(ahorrosNodes.length).toBeGreaterThan(0);
    });

  // The modal summary should show totals (income 100)
  expect(screen.getByText(/Total Ingresos/)).toBeInTheDocument();
  // The numeric total may be rendered in multiple places (title + summary). Accept any occurrence.
  const totalMatches = screen.queryAllByText(/\+€100\.00/);
  expect(totalMatches.length).toBeGreaterThan(0);

    // Combined list should contain the description 'Sueldo' from the mocked income
    expect(screen.getByText(/Sueldo/)).toBeInTheDocument();
    // Fixed expense description should also be present
    expect(screen.getByText(/Netflix/)).toBeInTheDocument();
  });

  it("filters movements by selected portfolio", async () => {
    render(<Calendar userId={1} />);

    // Open today's modal
    const buttons = await screen.findAllByRole("button");
    const today = new Date().getDate();
    const dayButton = buttons.find(b => (b.textContent || "").includes(String(today)));
    fireEvent.click(dayButton!);

    // wait for select trigger and open it
    await waitFor(() => expect(screen.getByLabelText(/Filtrar por cartera/)).toBeInTheDocument());

    // Open the select and pick 'Ahorros' which has no transactions
    fireEvent.click(screen.getByText(/Todas las carteras/));
    // Click item (portal timing: find by text in document)
    fireEvent.click(await screen.findByText("Ahorros"));

    // Since Ahorros has no movements, the empty state message should be present
    await waitFor(() => {
      const el = screen.queryByText(/Esta cartera no tiene movimientos registrados en esta fecha/i);
      if (el) {
        expect(el).toBeInTheDocument();
        return;
      }

      // fallback: the text may be split across nodes; check document text
      const txt = (document.body.textContent || "").replace(/\s+/g, " ");
      expect(txt).toMatch(/Esta cartera no tiene movimientos registrados en esta fecha/i);
    });
  });

  it("handles empty portfolios gracefully", async () => {
    // Temporarily override client mock to return empty portfolios
    jest.doMock("@/utils/client", () => ({
      createClient: {
        from: () => ({
          select: () => ({
            eq: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
          }),
        }),
      },
    }), { virtual: true });

    // Re-import Calendar to pick up the temporary mock
    const { Calendar: CalendarReloaded } = require("@/app/components/Calendar");
    render(<CalendarReloaded userId={1} />);

    // Open any day and expect the 'No hay movimientos' message inside the modal when opened
    const buttons = await screen.findAllByRole("button");
    const dayBtn = buttons.find(b => (b.textContent || "").trim().length > 0);
    fireEvent.click(dayBtn!);

    await waitFor(() => expect(screen.getByText(/No hay movimientos registrados en esta fecha/)).toBeInTheDocument());
  });

});
