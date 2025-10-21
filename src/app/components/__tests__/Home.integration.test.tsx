/**
 * @file Home.integration.test.tsx
 * Test de integración ligera para el componente Home
 */

import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { Home } from "@/app/components/Home";
import * as carterasService from "@/services/carterasService";
import * as transaccionService from "@/services/transaccionService";

jest.mock("@/services/carterasService", () => ({
  getCarteras: jest.fn(),
}));

jest.mock("@/services/transaccionService", () => ({
  getUltimosMovimientosUsuario: jest.fn(),
}));

describe("🏠 Home Component (integración ligera)", () => {
  const mockUserId = 1;
  const mockOnSelectPortfolio = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // evitar que el mock por defecto devuelva undefined y cause destructuring error
    (transaccionService.getUltimosMovimientosUsuario as jest.Mock).mockResolvedValue({ data: [], error: null });
  });

  it("✅ renderiza correctamente el resumen general y las carteras", async () => {
    (carterasService.getCarteras as jest.Mock).mockResolvedValue([
      { nombre: "Ahorros", saldo: 10000, id_usuario: mockUserId },
      { nombre: "Personal", saldo: 2500, id_usuario: mockUserId },
    ]);

    render(<Home userId={mockUserId} onSelectPortfolio={mockOnSelectPortfolio} />);

    expect(await screen.findByText("Resumen General")).toBeInTheDocument();

    expect(await screen.findByText("Ahorros")).toBeInTheDocument();
    expect(await screen.findByText("Personal")).toBeInTheDocument();
  });

  it("💰 muestra el balance total calculado correctamente", async () => {
    (carterasService.getCarteras as jest.Mock).mockResolvedValue([
      { nombre: "Cuenta1", saldo: 1000, id_usuario: mockUserId },
      { nombre: "Cuenta2", saldo: 2000, id_usuario: mockUserId },
      { nombre: "Cuenta3", saldo: 3000, id_usuario: mockUserId },
    ]);

    render(<Home userId={mockUserId} onSelectPortfolio={mockOnSelectPortfolio} />);

    await waitFor(() => {
    expect(screen.getByText((content) => content.includes("6000,00"))).toBeInTheDocument();
    });
  });

  it("👁️ ejecuta onSelectPortfolio al hacer clic en 'Ver Cartera'", async () => {
    (carterasService.getCarteras as jest.Mock).mockResolvedValue([
      { nombre: "Mi Cartera", saldo: 1234.56, id_usuario: mockUserId },
    ]);

    render(<Home userId={mockUserId} onSelectPortfolio={mockOnSelectPortfolio} />);

    expect(await screen.findByText("Mi Cartera")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Ver Cartera"));

    await waitFor(() => {
      expect(mockOnSelectPortfolio).toHaveBeenCalledWith(1);
    });
  });

  it("🚫 muestra estado vacío cuando no hay carteras", async () => {
    (carterasService.getCarteras as jest.Mock).mockResolvedValue([]);

    render(<Home userId={mockUserId} onSelectPortfolio={mockOnSelectPortfolio} />);

    // Debe mostrar el mensaje de que no hay carteras
    expect(await screen.findByText(/No hay carteras registradas aún\./)).toBeInTheDocument();
  });

  it("❗ no rompe si getCarteras lanza excepción", async () => {
    (carterasService.getCarteras as jest.Mock).mockImplementationOnce(() => { throw new Error('fail fetch'); });

    render(<Home userId={mockUserId} onSelectPortfolio={mockOnSelectPortfolio} />);

    // aunque falle la carga, el componente debería renderizar el resumen y el mensaje vacío
    expect(await screen.findByText('Resumen General')).toBeInTheDocument();
    expect(await screen.findByText(/No hay carteras registradas aún\./)).toBeInTheDocument();
  });

  it("📄 muestra movimientos cuando getUltimosMovimientosUsuario devuelve datos", async () => {
    (carterasService.getCarteras as jest.Mock).mockResolvedValue([
      { nombre: "MovWallet", saldo: 100, id_usuario: mockUserId },
    ]);

    (transaccionService.getUltimosMovimientosUsuario as jest.Mock).mockResolvedValueOnce({
      data: [
        { id: 9, descripcion: 'Pago recibido', importe: 150.5, fecha: '2025-10-01', cartera_nombre: 'MovWallet' },
        { id: 10, descripcion: 'Compra', importe: -25, fecha: '2025-09-28', categoria_nombre: 'comida' },
      ],
      error: null,
    });

    render(<Home userId={mockUserId} onSelectPortfolio={mockOnSelectPortfolio} />);

    // Esperamos a que aparezcan los importes formateados
    expect(await screen.findByText((t) => t.includes('+150,50'))).toBeInTheDocument();
    expect(await screen.findByText((t) => t.includes('-25,00'))).toBeInTheDocument();
    // y la descripción (usar findByText con matcher flexible)
    expect(await screen.findByText(/Pago recibido/)).toBeInTheDocument();
    expect(await screen.findByText(/Compra/)).toBeInTheDocument();
  });
});
