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

describe("💼 Portfolio Component (integración ligera)", () => {
  const mockUserId = 1;

  beforeEach(() => {
    jest.clearAllMocks();
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
});
