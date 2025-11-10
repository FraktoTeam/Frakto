import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

// Mock createClient to return a single cartera
jest.mock("@/utils/client", () => {
  const from = jest.fn().mockReturnValue({
    select: () => ({
      eq: () => ({
        order: async () => ({ data: [{ nombre: "Personal", saldo: 100 }], error: null }),
      }),
    }),
  });
  return { createClient: { from } };
});

// Mock transaccionService to return ingresos/gastos dentro del mes pasado
jest.mock("@/services/transaccionService", () => ({
  getIngresos: jest.fn(),
  getGastos: jest.fn(),
}));

// Stub global alert to avoid jsdom not-implemented error during test
(global as any).alert = jest.fn();
// Provide top-level mocks for jsPDF and autotable so dynamic imports inside
// `generatePDF` use them without re-requiring modules (avoids duplicate React)
const saveMock = jest.fn();
class TopLevelMockJsPDF {
  lastAutoTable: any;
  constructor() { this.lastAutoTable = { finalY: 40 }; }
  setFontSize() {}
  setFont() {}
  text() {}
  addPage() {}
  getNumberOfPages() { return 1; }
  setPage() {}
  setLineWidth(_w: number) {}
  line(_x1: number, _y1: number, _x2: number, _y2: number) {}
  save(filename: string) { saveMock(filename); }
}

const topAutoTableMock = jest.fn((doc: any, opts: any) => { (doc as any).lastAutoTable = { finalY: 40, ...opts }; });

jest.mock('jspdf', () => ({ __esModule: true, default: TopLevelMockJsPDF }));
jest.mock('jspdf-autotable', () => ({ __esModule: true, default: topAutoTableMock }));

import { Reports } from "../Reports";

describe("Reports - integración ligera", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("muestra el mes disponible, carga carteras y habilita el botón de generar", async () => {
    // calculamos una fecha en el mes pasado para que coincida con el filtro
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const sampleDate = fmt(lastMonth);

  const trans = require("@/services/transaccionService");
    trans.getIngresos.mockResolvedValueOnce([
      { cartera_nombre: "Personal", id_usuario: 1, importe: 120, descripcion: "Pago", fecha: sampleDate },
    ]);
    trans.getGastos.mockResolvedValueOnce([
      { cartera_nombre: "Personal", id_usuario: 1, categoria_nombre: "comida", importe: 20, descripcion: "Cena", fecha: sampleDate },
    ]);

    render(<Reports userId={1} />);

    // Header y descripción deben estar presentes
    expect(await screen.findByText(/Reportes Mensuales/i)).toBeInTheDocument();

    // El botón 'Generar PDF' se habilita cuando hay carteras y no está generando
    await waitFor(() => {
      const btn = screen.getByRole("button", { name: /Generar PDF/i });
      expect(btn).toBeEnabled();
    });
  });

  it("genera el PDF usando jsPDF y autotable (mock) y llama a save", async () => {
    // The top-level mocks provide jspdf/autotable; use the imported Reports
    const ReportsWithPdf = Reports;

    // mock transacciones para que haya datos en el reporte
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const sampleDate = fmt(lastMonth);

    const trans = require('@/services/transaccionService');
    trans.getIngresos.mockResolvedValueOnce([
      { cartera_nombre: "Personal", id_usuario: 1, importe: 120, descripcion: "Pago", fecha: sampleDate },
    ]);
    trans.getGastos.mockResolvedValueOnce([
      { cartera_nombre: "Personal", id_usuario: 1, categoria_nombre: "comida", importe: 20, descripcion: "Cena", fecha: sampleDate },
    ]);


    // Renderizamos usando los helpers importados arriba
    render(<ReportsWithPdf userId={1} />);

    // esperar que el botón esté habilitado
    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /Generar PDF/i });
      expect(btn).toBeEnabled();
    });

    const btn = screen.getByRole('button', { name: /Generar PDF/i });
    fireEvent.click(btn);

  // Esperar a que el mock de save (top-level) sea llamado
  await waitFor(() => expect(saveMock).toHaveBeenCalled());
  });
});
