// usar el `jest` global provisto por el entorno de pruebas

// Objeto mock compartido para el cliente de utils (mockear ambas rutas por seguridad)
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

// Importar el servicio después de registrar los mocks para evitar la creación del cliente real en tiempo de importación
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
    // Asegurar que createClient.from sea un mock de jest y proporcionar una cadena por defecto segura
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

    // ruta de error
    insertChain.single.mockResolvedValueOnce({ data: null, error: { message: 'insert fail' } });
    const err = await createGastoFijo(gasto as any);
    expect(err.error).toMatch(/insert fail/);
  });

  it('updateGastoFijo devuelve success true o false según error', async () => {
    // Mock the full chain: update().eq().select().single()
    const updateChain: any = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnValue(Promise.resolve({ data: { id_gasto: 1, cartera_nombre: 'Personal', id_usuario: 1 }, error: null })),
    };
    (createClient.from as jest.Mock).mockReturnValue(updateChain);

    const ok = await updateGastoFijo(1, { importe: 99 });
    expect(updateChain.update).toHaveBeenCalledWith({ importe: 99 });
    expect(updateChain.eq).toHaveBeenCalledWith('id_gasto', 1);
    expect(ok.success).toBe(true);

    // ruta de error: single resuelve con un error
    updateChain.single.mockResolvedValueOnce({ data: null, error: { message: 'update fail' } });
    const nok = await updateGastoFijo(1, { importe: 10 });
    expect(nok.success).toBe(false);
    expect(nok.error).toMatch(/update fail/);
  });

  it('deleteGastoFijo devuelve éxito según respuesta', async () => {
    // Primera llamada: select para obtener el registro anterior
    const selectChain: any = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnValue(Promise.resolve({ data: { cartera_nombre: 'Personal', id_usuario: 1 }, error: null })),
    };

    // Segunda llamada: cadena de delete que resuelve en eq()
    const deleteChain: any = {
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockImplementation(() => Promise.resolve({ data: null, error: null })),
    };

    (createClient.from as jest.Mock)
      .mockReturnValueOnce(selectChain)
      .mockReturnValueOnce(deleteChain);

    const ok = await deleteGastoFijo(5);
    expect(selectChain.select).toHaveBeenCalled();
    expect(deleteChain.delete).toHaveBeenCalled();
    expect(ok.success).toBe(true);

    // simular error al eliminar en la segunda llamada
    (createClient.from as jest.Mock)
      .mockReturnValueOnce(selectChain)
      .mockReturnValueOnce({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockImplementation(() => Promise.resolve({ data: null, error: { message: 'del fail' } })),
      } as any);

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

    // ruta de error -> single devuelve error
    updateChain.single.mockResolvedValueOnce({ data: null, error: { message: 'boom' } });
    await expect(toggleGastoFijoActivo(3, false)).rejects.toBeDefined();
  });
});
