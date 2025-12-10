import * as React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mocks de UI e iconos (usar React.createElement para evitar problemas con diferentes instancias de React)
jest.mock('../AchievementsCarousel', () => ({
  AchievementsCarousel: (props: any) => React.createElement('div', { 'data-testid': 'achievements-mock' }),
}));

jest.mock('../ui/card', () => ({
  Card: ({ children, className }: any) => React.createElement('div', { 'data-testid': 'card', className }, children),
  CardHeader: ({ children }: any) => React.createElement('div', null, children),
  CardContent: ({ children }: any) => React.createElement('div', null, children),
  CardTitle: ({ children }: any) => React.createElement('div', null, children),
}));

jest.mock('../ui/button', () => ({
  Button: ({ children, ...props }: any) => React.createElement('button', props, children),
}));

jest.mock('../ui/dialog', () => ({
  Dialog: ({ children }: any) => React.createElement('div', null, children),
  DialogContent: ({ children }: any) => React.createElement('div', null, children),
  DialogHeader: ({ children }: any) => React.createElement('div', null, children),
  DialogTitle: ({ children }: any) => React.createElement('div', null, children),
  DialogTrigger: ({ children }: any) => React.createElement('span', null, children),
}));

jest.mock('../ui/input', () => ({
  Input: (props: any) => React.createElement('input', props),
}));

jest.mock('../ui/label', () => ({
  Label: ({ children, htmlFor }: any) => React.createElement('label', { htmlFor }, children),
}));

jest.mock('../ui/select', () => ({
  Select: ({ children }: any) => React.createElement('div', null, children),
  SelectTrigger: ({ children }: any) => React.createElement('div', null, children),
  SelectValue: ({ children }: any) => React.createElement('div', null, children),
  SelectContent: ({ children }: any) => React.createElement('div', null, children),
  SelectItem: ({ children }: any) => React.createElement('div', null, children),
}));

jest.mock('../ui/alert-dialog', () => ({
  AlertDialog: ({ children }: any) => React.createElement('div', null, children),
  AlertDialogAction: ({ children, ...props }: any) => React.createElement('button', props, children),
  AlertDialogCancel: ({ children, ...props }: any) => React.createElement('button', props, children),
  AlertDialogContent: ({ children }: any) => React.createElement('div', null, children),
  AlertDialogDescription: ({ children }: any) => React.createElement('div', null, children),
  AlertDialogFooter: ({ children }: any) => React.createElement('div', null, children),
  AlertDialogHeader: ({ children }: any) => React.createElement('div', null, children),
  AlertDialogTitle: ({ children }: any) => React.createElement('div', null, children),
}));

jest.mock('lucide-react', () => ({
  Plus: () => React.createElement('span', null, 'Plus'),
  Target: () => React.createElement('span', null, 'Target'),
  Trash2: () => React.createElement('span', null, 'Trash2'),
  Wallet: () => React.createElement('span', null, 'Wallet'),
  Calendar: () => React.createElement('span', null, 'Calendar'),
  TrendingUp: () => React.createElement('span', null, 'TrendingUp'),
  CheckCircle2: () => React.createElement('span', null, 'CheckCircle2'),
  XCircle: () => React.createElement('span', null, 'XCircle'),
  Clock: () => React.createElement('span', null, 'Clock'),
  Sparkles: () => React.createElement('span', null, 'Sparkles'),
}));

let mockCarteras: any[] = [];
let mockGoals: any[] = [];
let mockDeleteResult: any = { error: null };

jest.mock('@/utils/client', () => ({
  createClient: {
    from: (table: string) => {
      return {
        select: (_sel: string) => ({
          eq: (_k: string, _v: any) => {
            const data = table === 'cartera' ? mockCarteras : mockGoals;
            const p: any = Promise.resolve({ data, error: null });
            p.order = async () => ({ data, error: null });
            return p;
          },
        }),
        insert: (_arr: any[]) => ({
          select: (_sel: string) => ({
            maybeSingle: async () => ({ data: _arr[0], error: null }),
          }),
        }),
        delete: () => {
          let lastKey: any = null;
          let lastValue: any = null;
          return {
            eq: (k: string, v: any) => {
              lastKey = k;
              lastValue = v;
              return {
                eq: (_k2: string, _v2: any) => {
                  if (table === 'meta_ahorro' && lastKey === 'id_meta') {
                    mockGoals = mockGoals.filter(
                      (g: any) => (g.id_meta ?? g.id) !== lastValue,
                    );
                  }
                  return Promise.resolve(mockDeleteResult);
                },
              };
            },
          };
        },
        update: (updates: any) => ({
          eq: (k: string, v: any) => ({
            eq: (_k2: string, _v2: any) => {
              // Actualizar el goal en mockGoals si coincide
              if (table === 'meta_ahorro' && k === 'id_meta') {
                mockGoals = mockGoals.map((g: any) =>
                  (g.id_meta ?? g.id) === v ? { ...g, ...updates } : g
                );
              }
              return Promise.resolve({ data: updates, error: null });
            },
          }),
        }),
      };
    },
  },
}));

import { Goals } from '../Goals';

describe('Goals - Integration (simplified)', () => {
  beforeEach(() => {
    mockCarteras = [{ nombre: 'main', saldo: 1000 }];
    mockGoals = [
      {
        id_meta: 1,
        nombre: 'Meta1',
        cantidad_objetivo: 500,
        fecha_limite: '2099-12-31',
        cartera_nombre: 'main',
        cantidad_acumulada: 0,
        saldo_inicial: 0,
      },
    ];
    mockDeleteResult = { error: null };
    sessionStorage.clear();
  });

  it('muestra cabecera, totales y tarjeta de meta con valores calculados', async () => {
    render(
      <Goals
        userId={1}
        selectedAchievementId={null}
        onSelectAchievement={() => {}}
        onActiveGoalsChange={() => {}}
      />,
    );

    expect(await screen.findByText('Metas de Ahorro')).toBeInTheDocument();

    // Total Ahorrado debe contener el balance de carteras (1000)
    expect(await screen.findByText('Total Ahorrado')).toBeInTheDocument();
    const totalCard = (await screen.findByText('Total Ahorrado')).closest('[data-testid="card"]');
    expect(totalCard).toBeTruthy();
    const totalText = within(totalCard as HTMLElement).getByText(/1000/);
    expect(totalText).toBeInTheDocument();

    // La meta debe mostrarse
    expect(await screen.findByText('Meta1')).toBeInTheDocument();
  });

  it('muestra mensaje cuando no hay metas', async () => {
    mockGoals = []; // sin metas
    render(<Goals userId={1} selectedAchievementId={null} onSelectAchievement={() => {}} />);

    expect(await screen.findByText('Metas de Ahorro')).toBeInTheDocument();
    expect(await screen.findByText(/Sin metas de ahorro/)).toBeInTheDocument();
  });

  it('muestra faltante cuando la meta es activa (no alcanzada)', async () => {
    mockCarteras = [{ nombre: 'main', saldo: 1000 }];
    mockGoals = [
      {
        id_meta: 2,
        nombre: 'MetaActiva',
        cantidad_objetivo: 2000,
        fecha_limite: '2099-12-31',
        cartera_nombre: 'main',
        cantidad_acumulada: 0,
        saldo_inicial: 0,
      },
    ];

    render(<Goals userId={1} selectedAchievementId={null} onSelectAchievement={() => {}} />);

    expect(await screen.findByText('MetaActiva')).toBeInTheDocument();
    const card = (await screen.findByText('MetaActiva')).closest('[data-testid="card"]') as HTMLElement;
    expect(card).toBeTruthy();

    // Debe mostrar el párrafo 'Faltan ...' y dentro el importe faltante
    const faltanParagraph = within(card).getByText((c) => c.includes('Faltan'));
    expect(faltanParagraph).toBeInTheDocument();
    expect(within(faltanParagraph).getByText(/1000|1\.000/)).toBeInTheDocument();
  });

  it('borra una meta y actualiza la lista', async () => {
    mockCarteras = [{ nombre: 'main', saldo: 1000 }];
    mockGoals = [
      {
        id_meta: 3,
        nombre: 'MetaBorrar',
        cantidad_objetivo: 2000,
        fecha_limite: '2099-12-31',
        cartera_nombre: 'main',
        cantidad_acumulada: 0,
        saldo_inicial: 0,
      },
    ];
    mockDeleteResult = { error: null };

    render(<Goals userId={1} selectedAchievementId={null} onSelectAchievement={() => {}} />);

    expect(await screen.findByText('MetaBorrar')).toBeInTheDocument();
    const card = (await screen.findByText('MetaBorrar')).closest('[data-testid="card"]') as HTMLElement;
    expect(card).toBeTruthy();

    const deleteBtn = within(card).getByRole('button');
    expect(deleteBtn).toBeInTheDocument();

    await userEvent.click(deleteBtn);
    const confirm = await screen.findByText(/Eliminar Meta/);
    await userEvent.click(confirm);

    expect(await screen.findByText(/Sin metas de ahorro/)).toBeInTheDocument();
  });
});
