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
