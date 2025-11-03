import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

// Mockear toast
const mockToast = jest.fn();
jest.mock("react-hot-toast", () => ({ __esModule: true, default: (msg: any, opts?: any) => mockToast(msg, opts) }));

// Mockear alertaService
const getAlertasUsuario = jest.fn();
const subscribeAlertasUsuario = jest.fn();
const unsubscribeChannel = jest.fn();

jest.mock("@/services/alertaService", () => ({
  getAlertasUsuario: (...args: any[]) => getAlertasUsuario(...args),
  subscribeAlertasUsuario: (...args: any[]) => subscribeAlertasUsuario(...args),
  unsubscribeChannel: (...args: any[]) => unsubscribeChannel(...args),
}));

import AlertBanner from "@/app/components/AlertBanner";

describe("AlertBanner - prueba de integración", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("muestra la alerta inicial y reacciona a un INSERT realtime con toast y nuevo banner", async () => {
    const initial = {
      id_alerta: "a1",
      cartera_nombre: "MiCartera",
      id_usuario: 1,
      saldo_actual: 10,
      saldo_necesario: 0,
      umbral_riesgo: 5,
      fecha_generacion: new Date().toISOString(),
      estado_alerta: "activa",
      mensaje: "Saldo bajo",
    };

    getAlertasUsuario.mockResolvedValue([initial]);

    // preparar subscribe para capturar el callback y devolver un canal falso
    const fakeChannel = { unsubscribe: jest.fn() };
    subscribeAlertasUsuario.mockImplementation((userId: number, cb: any) => {
      // no llamar al callback todavía; los tests lo llamarán explícitamente
      return fakeChannel;
    });

    const { unmount } = render(<AlertBanner userId={1} />);

    // la alerta inicial debería ser visible
    expect(await screen.findByRole("alert")).toBeDefined();
    expect(screen.getByText(/Saldo bajo/)).toBeInTheDocument();

    // simular INSERT realtime
    const insert = {
      eventType: "INSERT",
      new: {
        id_alerta: "a2",
        cartera_nombre: "MiCartera",
        id_usuario: 1,
        saldo_actual: 2,
        saldo_necesario: 0,
        umbral_riesgo: 5,
        fecha_generacion: new Date().toISOString(),
        estado_alerta: "activa",
        mensaje: "Saldo críticamente bajo",
      },
    };

    // encontrar el callback capturado y ejecutarlo
    const capturedCb = (subscribeAlertasUsuario as jest.Mock).mock.calls[0][1];
    expect(typeof capturedCb).toBe("function");
    capturedCb(insert);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith("Saldo críticamente bajo", expect.any(Object));
      expect(screen.getByText(/Saldo críticamente bajo/)).toBeInTheDocument();
    });

    // cerrar el banner manualmente
    const closeBtn = screen.getByRole("button", { name: /Cerrar alerta/i });
    fireEvent.click(closeBtn);
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());

    // desmontar y asegurar que unsubscribe fue llamado con el canal
    unmount();
    expect(unsubscribeChannel).toHaveBeenCalledWith(fakeChannel);
  });
});
