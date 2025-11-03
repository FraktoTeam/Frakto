import { jest } from '@jest/globals';

// Shared mock object for utils client (mock both path styles to be safe)
const mockClient = {
  createClient: {
    from: jest.fn(),
    select: jest.fn(),
    eq: jest.fn(),
    order: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    single: jest.fn(),
    maybeSingle: jest.fn(),
    rpc: jest.fn(),
  },
};

jest.mock('../../utils/client', () => ({ __esModule: true, createClient: mockClient.createClient }));
jest.mock('@/utils/client', () => ({ __esModule: true, createClient: mockClient.createClient }));

const { createClient } = require('../../utils/client');

// Require the service after the mocks are registered to avoid import-time real client creation
const {
  getGastosFijos,
  createGastoFijo,
  updateGastoFijo,
  deleteGastoFijo,
  toggleGastoFijoActivo,
} = require('../gastoFijoService');

describe('gastoFijoService - unit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Ensure createClient.from is a jest mock and provide a safe default chain
    if (!jest.isMockFunction(createClient.from)) {
      createClient.from = jest.fn();
    }

    (createClient.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnValue(Promise.resolve({ data: null, error: null })),
    maybeSingle: jest.fn().mockReturnValue(Promise.resolve({ data: null, error: null })),
      order: jest.fn().mockReturnThis(),
    });
  });

  it('getGastosFijos devuelve lista cuando no hay error', async () => {
    const fake = [{ id_gasto: 1, cartera_nombre: 'Personal', id_usuario: 1, categoria_nombre: 'Comida', importe: 50, fecha_inicio: '2025-01-01', frecuencia: 30, activo: true }];

  const chain: any = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnValue(Promise.resolve({ data: fake, error: null })),
    };

    (createClient.from as jest.Mock).mockReturnValue(chain);

    const res = await getGastosFijos(1);
    expect(chain.select).toHaveBeenCalledWith('*');
    expect(chain.eq).toHaveBeenCalledWith('id_usuario', 1);
    expect(res).toEqual(fake);
  });

  it('getGastosFijos lanza cuando hay error', async () => {
  const chain: any = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnValue(Promise.resolve({ data: null, error: { message: 'fail' } })),
    };
    (createClient.from as jest.Mock).mockReturnValue(chain);

    await expect(getGastosFijos(1)).rejects.toThrow('fail');
  });

  it('createGastoFijo devuelve data en success y mensaje en error', async () => {
    const gasto = { cartera_nombre: 'Personal', id_usuario: 1, categoria_nombre: 'Comida', importe: 20, fecha_inicio: '2025-10-01', frecuencia: 30, activo: true };

  const insertChain: any = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnValue(Promise.resolve({ data: { ...gasto, id_gasto: 2 }, error: null })),
    };
    (createClient.from as jest.Mock).mockReturnValue(insertChain);

    const ok = await createGastoFijo(gasto as any);
    expect(insertChain.insert).toHaveBeenCalled();
    expect(ok.data).toEqual(expect.objectContaining({ id_gasto: 2 }));

    // error path
    insertChain.single.mockResolvedValueOnce({ data: null, error: { message: 'insert fail' } });
    const err = await createGastoFijo(gasto as any);
    expect(err.error).toMatch(/insert fail/);
  });

  it('updateGastoFijo devuelve success true o false según error', async () => {
  const updateChain: any = {
      update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnValue(Promise.resolve({ data: null, error: null })),
    };
    (createClient.from as jest.Mock).mockReturnValue(updateChain);

    const ok = await updateGastoFijo(1, { importe: 99 });
    expect(updateChain.update).toHaveBeenCalledWith({ importe: 99 });
    expect(ok.success).toBe(true);

    // error
    updateChain.eq.mockResolvedValueOnce({ data: null, error: { message: 'update fail' } });
    const nok = await updateGastoFijo(1, { importe: 10 });
    expect(nok.success).toBe(false);
    expect(nok.error).toMatch(/update fail/);
  });

  it('deleteGastoFijo devuelve éxito según respuesta', async () => {
  const delChain: any = {
      delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnValue(Promise.resolve({ data: null, error: null })),
    };
    (createClient.from as jest.Mock).mockReturnValue(delChain);

    const ok = await deleteGastoFijo(5);
    expect(delChain.delete).toHaveBeenCalled();
    expect(ok.success).toBe(true);

    delChain.eq.mockResolvedValueOnce({ data: null, error: { message: 'del fail' } });
    const nok = await deleteGastoFijo(5);
    expect(nok.success).toBe(false);
    expect(nok.error).toMatch(/del fail/);
  });

  it('toggleGastoFijoActivo retorna data en success y lanza en error', async () => {
  const updateChain: any = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnValue(Promise.resolve({ data: { id_gasto: 3, activo: true }, error: null })),
    };
    (createClient.from as jest.Mock).mockReturnValue(updateChain);

    const data = await toggleGastoFijoActivo(3, true);
    expect(updateChain.update).toHaveBeenCalledWith({ activo: true });
    expect(data).toEqual(expect.objectContaining({ id_gasto: 3 }));

    // error path -> single returns error
    updateChain.single.mockResolvedValueOnce({ data: null, error: { message: 'boom' } });
    await expect(toggleGastoFijoActivo(3, false)).rejects.toBeDefined();
  });
});
