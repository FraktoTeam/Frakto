import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Analytics } from '@/app/components/Analytics';

jest.mock('lucide-react', () => ({
  __esModule: true,
  TrendingUp: (p: any) => <svg data-testid="icon-trending-up" {...p} />,
  TrendingDown: (p: any) => <svg data-testid="icon-trending-down" {...p} />,
  DollarSign: (p: any) => <svg data-testid="icon-dollar" {...p} />,
  PiggyBank: (p: any) => <svg data-testid="icon-piggy" {...p} />,
  Activity: (p: any) => <svg data-testid="icon-activity" {...p} />,
  BarChart3: (p: any) => <svg data-testid="icon-barchart" {...p} />,
}));

jest.mock('recharts', () => ({
  __esModule: true,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="linechart">{children}</div>,
  Line: () => <div data-testid="line" />,
  BarChart: ({ children }: any) => <div data-testid="barchart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  PieChart: ({ children }: any) => <div data-testid="piechart">{children}</div>,
  Pie: ({ children }: any) => <div data-testid="pie">{children}</div>,
  Cell: () => <div data-testid="cell" />,
  XAxis: () => <div data-testid="xaxis" />,
  YAxis: () => <div data-testid="yaxis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

jest.mock('@/app/components/ui/select', () => ({
  __esModule: true,
  Select: ({ children }: any) => <div>{children}</div>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ children }: any) => <span>{children}</span>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <div data-value={value}>{children}</div>,
}));

jest.mock('@/app/components/ui/card', () => ({
  __esModule: true,
  Card: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@/utils/client', () => ({
  createClient: {
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: table === 'cartera' ? [{ nombre: 'Main', saldo: 100 }] : [], error: null }),
        }),
      }),
    }),
  },
}));

jest.mock('@/services/transaccionService', () => ({
  getIngresos: jest.fn(),
  getGastos: jest.fn(),
}));

import { getIngresos, getGastos } from '@/services/transaccionService';

describe('Analytics - Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('muestra mensaje de "Sin datos" cuando no hay transacciones', async () => {
    (getIngresos as jest.Mock).mockResolvedValue([]);
    (getGastos as jest.Mock).mockResolvedValue([]);

    render(<Analytics userId={1} />);

    expect(await screen.findByText(/Sin datos disponibles en el periodo seleccionado/)).toBeInTheDocument();
  });

  it('muestra KPIs y Top lists cuando hay datos', async () => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    (getIngresos as jest.Mock).mockResolvedValue([
      { descripcion: 'Salary', fecha: dateStr, importe: 1500 },
      { descripcion: 'Bonus', fecha: dateStr, importe: 500 },
    ]);

    (getGastos as jest.Mock).mockResolvedValue([
      { descripcion: 'Rent', fecha: dateStr, categoria_nombre: 'hogar', importe: 800 },
      { descripcion: 'Groceries', fecha: dateStr, categoria_nombre: 'comida', importe: 200 },
    ]);

    render(<Analytics userId={1} />);

    // KPIs: Total Ingresos = 2000.00, Total Gastos = 1000.00, Balance = 1000.00
    expect(await screen.findByText(/Total Ingresos/)).toBeInTheDocument();
    expect(await screen.findByText(/Total Gastos/)).toBeInTheDocument();

    // Valores formateados: localizar cada KPI por su título y verificar el importe dentro de su contenedor
    const gastosTitle = await screen.findByText('Total Gastos');
    // El título está dentro del header; el importe suele estar en el siguiente hermano
    const gastosHeaderDiv = gastosTitle.closest('div');
    const gastosAmountContainer = (gastosHeaderDiv && gastosHeaderDiv.parentElement?.nextElementSibling) as HTMLElement | null;
    expect(gastosAmountContainer).toBeTruthy();
    const gastosMatches = within(gastosAmountContainer as HTMLElement).queryAllByText((_, node) => {
      const txt = node?.textContent || '';
      return txt.replace(/\s+/g, '').includes('€1000,00');
    });
    expect(gastosMatches.length).toBeGreaterThan(0);

    const ingresosTitle = await screen.findByText('Total Ingresos');
    const ingresosHeaderDiv = ingresosTitle.closest('div');
    const ingresosAmountContainer = (ingresosHeaderDiv && ingresosHeaderDiv.parentElement?.nextElementSibling) as HTMLElement | null;
    expect(ingresosAmountContainer).toBeTruthy();
    const ingresosMatches = within(ingresosAmountContainer as HTMLElement).queryAllByText((_, node) => {
      const txt = node?.textContent || '';
      return txt.replace(/\s+/g, '').includes('€2000,00');
    });
    expect(ingresosMatches.length).toBeGreaterThan(0);

    const balanceTitle = await screen.findByText('Balance');
    const balanceHeaderDiv = balanceTitle.closest('div');
    const balanceAmountContainer = (balanceHeaderDiv && balanceHeaderDiv.parentElement?.nextElementSibling) as HTMLElement | null;
    expect(balanceAmountContainer).toBeTruthy();
    const balanceMatches = within(balanceAmountContainer as HTMLElement).queryAllByText((_, node) => {
      const txt = node?.textContent || '';
      return txt.replace(/\s+/g, '').includes('€1000,00');
    });
    expect(balanceMatches.length).toBeGreaterThan(0);

    expect(await screen.findByText('Rent')).toBeInTheDocument();
    expect(await screen.findByText('Salary')).toBeInTheDocument();
  });
});
