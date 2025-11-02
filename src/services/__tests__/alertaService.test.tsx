import * as alertaService from "@/services/alertaService";

// Mockear el cliente Supabase usado por alertaService
jest.mock("@/utils/client", () => {
  const fromMock = jest.fn(() => ({ select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), order: jest.fn().mockImplementation(() => Promise.resolve({ data: [{ id_alerta: 'a1' }], error: null })) } as any));
  const channelMock = jest.fn(() => ({ on: jest.fn().mockReturnThis(), subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }), } as any));
  return {
    createClient: {
      from: fromMock,
      channel: channelMock,
      removeChannel: jest.fn() as any,
    } as any,
  } as any;
});

describe("alertaService - pruebas unitarias", () => {
  afterEach(() => jest.clearAllMocks());

  it("getAlertasUsuario devuelve un array en caso de éxito", async () => {
    const res = await alertaService.getAlertasUsuario(1);
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBeGreaterThanOrEqual(0);
  });

  it("subscribeAlertasUsuario configura un canal y lo devuelve", () => {
    const cb = jest.fn();
    const channel = alertaService.subscribeAlertasUsuario(1, cb);
    expect(channel).toBeDefined();
    // subscribeAlertasUsuario debe devolver un objeto tipo canal (al menos un objeto)
    expect(channel).toEqual(expect.any(Object));
  });

  it("unsubscribeChannel es seguro de llamar con valores nulos y no falla", () => {
    // llamar con null no debe lanzar
    expect(() => alertaService.unsubscribeChannel(null)).not.toThrow();

    // crear un canal falso y asegurarse de que no lanza al intentar eliminarlo
    const fakeChannel = { id: "ch1" } as any;
    expect(() => alertaService.unsubscribeChannel(fakeChannel)).not.toThrow();
  });
});
