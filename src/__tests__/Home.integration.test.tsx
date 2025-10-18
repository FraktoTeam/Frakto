/**
 * @file Home.integration.test.tsx
 * Test de integración ligera para el componente Home
 */

import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { Home } from "@/app/components/Home";
import * as carterasService from "@/services/carterasService";

jest.mock("@/services/carterasService", () => ({
  getCarteras: jest.fn(),
}));

describe("🏠 Home Component (integración ligera)", () => {
  const mockUserId = 1;
  const mockOnSelectPortfolio = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
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
});
