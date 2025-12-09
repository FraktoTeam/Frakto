"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PiggyBank,
  Activity,
  BarChart3,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { getIngresos, getGastos } from "../../services/transaccionService";
import { createClient } from "@/utils/client";

// ================== Tipos ==================

type Period = "monthly" | "quarterly" | "annual";
type Trend = "up" | "down";

interface PortfolioItem {
  id: string; // nombre de la cartera como id
  name: string;
  trend?: Trend;
  saldo?: number;
}

interface TxRow {
  portfolioId: string;
  type: "income" | "expense";
  description: string;
  category: string;
  date: string; // yyyy-mm-dd
  amount: number; // SIEMPRE positivo
}

interface CategoryData {
  name: string;
  value: number;
  percentage: number;
}

interface MonthlyData {
  month: string;
  ingresos: number;
  gastos: number;
  balance: number;
}

interface TopTransaction {
  description: string;
  amount: number;
  category: string;
  date: string;
}

type AnalyticsProps = {
  userId: number;
};

// ================== Helpers ==================

const monthNamesLong = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function getDateRange(period: Period) {
  const today = new Date();
  const endDate = today;
  const startDate = new Date(today);

  switch (period) {
    case "monthly":
      startDate.setMonth(today.getMonth());
      startDate.setDate(1);
      // Ajuste para el 1er del mes: si es 1 de diciembre, queremos todo el mes de diciembre.
      // Si la hora es irrelevante, nos aseguramos de que empiece a las 00:00:00 del día 1.
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "quarterly":
      startDate.setMonth(today.getMonth() - 2);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "annual":
      startDate.setMonth(today.getMonth() - 11);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
  }

  return { startDate, endDate };
}

// ================== Componente ==================

export function Analytics({ userId }: AnalyticsProps) {
  const [period, setPeriod] = useState<Period>("monthly");
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>("all");
  const [portfolios, setPortfolios] = useState<PortfolioItem[]>([]);
  const [rows, setRows] = useState<TxRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ---------- Cargar carteras ----------
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const supa = createClient;
        const { data, error } = await supa
          .from("cartera")
          .select("nombre, saldo")
          .eq("id_usuario", userId)
          .order("nombre", { ascending: true });

        if (error) throw error;
        if (!mounted) return;

        const list: PortfolioItem[] = (data ?? []).map((r: any) => ({
          id: r.nombre,
          name: r.nombre,
          saldo: r.saldo,
        }));
        setPortfolios(list);
      } catch (e: any) {
        if (mounted) setLoadError(e.message ?? "Error cargando carteras");
      }
    })();

    return () => {
      mounted = false;
    };
  }, [userId]);

  // ---------- Cargar ingresos y gastos de las carteras seleccionadas ----------
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setLoadError(null);

      try {
        // carteras a consultar
        const portfoliosToFetch =
          selectedPortfolio === "all"
            ? portfolios.map((p) => p.name)
            : portfolios
                .filter((p) => p.id === selectedPortfolio)
                .map((p) => p.name);

        if (portfoliosToFetch.length === 0) {
          if (mounted) setRows([]);
          setLoading(false);
          return;
        }

        // Traer todos los ingresos y gastos de cada cartera
        const allResults = await Promise.all(
          portfoliosToFetch.map(async (cartera) => {
            const [ing, gas] = await Promise.all([
              getIngresos(cartera, userId),
              getGastos(cartera, userId),
            ]);
            return { cartera, ingresos: ing, gastos: gas };
          })
        );

        // Unificar en TxRow (sin filtrar por fecha aún)
        const merged: TxRow[] = [];
        for (const pack of allResults) {
          for (const i of pack.ingresos) {
            merged.push({
              portfolioId: pack.cartera,
              type: "income",
              description: i.descripcion ?? "Ingreso",
              category: "Ingreso",
              date: i.fecha,
              amount: Number(i.importe) || 0,
            });
          }
          for (const g of pack.gastos) {
            merged.push({
              portfolioId: pack.cartera,
              type: "expense",
              description: g.descripcion ?? "Gasto",
              category: g.categoria_nombre ?? "gasto",
              date: g.fecha,
              amount: Number(g.importe) || 0, // gasto positivo en BD
            });
          }
        }

        // Ordenar por fecha ascendente
        merged.sort((a, b) => (a.date < b.date ? -1 : 1));

        if (mounted) setRows(merged);
      } catch (e: any) {
        if (mounted) setLoadError(e.message ?? "Error cargando datos");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [userId, selectedPortfolio, portfolios]);

  // ---------- Filtrar transacciones según el periodo ----------
  const filteredTransactions = useMemo(() => {
    if (rows.length === 0) return [];

    const { startDate, endDate } = getDateRange(period);

    return rows.filter((t) => {
      // Usar new Date(t.date) para la fecha de la transacción
      const d = new Date(t.date);
      // Ajustar la fecha de la transacción para que sea comparable con el rango.
      // Si t.date es '2025-12-01', new Date(t.date) puede ser '2025-12-01T00:00:00.000Z'
      // Dependiendo de la zona horaria. Si el rango de fechas está ajustado con
      // .setHours(0, 0, 0, 0) y .setHours(23, 59, 59, 999), es mejor asegurarse que 'd'
      // es un objeto Date válido que solo usa la parte de la fecha para la comparación.
      // Una forma segura es convertir 't.date' a un objeto Date del día 00:00 en zona local:
      const [year, month, day] = t.date.split("-").map(Number);
      const transactionDate = new Date(year, month - 1, day);


      return transactionDate >= startDate && transactionDate <= endDate;
    });
  }, [rows, period]);

  // ---------- KPIs ----------
  const kpis = useMemo(() => {
    const totalIncome = filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;

    return {
      totalIncome,
      totalExpense,
      balance,
      savingsRate,
    };
  }, [filteredTransactions]);

  // ---------- Datos mensuales para gráficos ----------
  const monthlyData: MonthlyData[] = useMemo(() => {
    const monthsMap: { [key: string]: { ingresos: number; gastos: number } } = {};

    filteredTransactions.forEach((t) => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!monthsMap[monthKey]) {
        monthsMap[monthKey] = { ingresos: 0, gastos: 0 };
      }

      if (t.type === "income") {
        monthsMap[monthKey].ingresos += t.amount;
      } else {
        monthsMap[monthKey].gastos += t.amount;
      }
    });

    const monthNamesShort = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];

    return Object.keys(monthsMap)
      .sort()
      .map((key) => {
        const [_, month] = key.split("-");
        const monthIndex = parseInt(month) - 1;
        const ingresos = monthsMap[key].ingresos;
        const gastos = monthsMap[key].gastos;

        return {
          month: monthNamesShort[monthIndex],
          ingresos: Math.round(ingresos),
          gastos: Math.round(gastos),
          balance: Math.round(ingresos - gastos),
        };
      });
  }, [filteredTransactions]);

  // ---------- Distribución por categoría ----------
  const categoryData: CategoryData[] = useMemo(() => {
    const categoryMap: { [key: string]: number } = {};
    let totalExpenses = 0;

    filteredTransactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const key = t.category || "gasto";
        categoryMap[key] = (categoryMap[key] || 0) + t.amount;
        totalExpenses += t.amount;
      });

    if (totalExpenses === 0) return [];

    return Object.keys(categoryMap).map((category) => ({
      name: category,
      value: Math.round(categoryMap[category]),
      percentage: Math.round((categoryMap[category] / totalExpenses) * 100),
    }));
  }, [filteredTransactions]);

  // ---------- Top 5 gastos ----------
  const topExpenses: TopTransaction[] = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === "expense")
      .map((t) => ({
        description: t.description,
        amount: t.amount,
        category: t.category,
        date: t.date,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [filteredTransactions]);

  // ---------- Top 5 ingresos ----------
  const topIncomes: TopTransaction[] = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === "income")
      .map((t) => ({
        description: t.description,
        amount: t.amount,
        category: t.category,
        date: t.date,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [filteredTransactions]);

  const COLORS = ["#16a34a", "#22c55e", "#4ade80", "#86efac", "#bbf7d0", "#dcfce7"];

  const hasEnoughData = filteredTransactions.length > 0;
  
  // Condición para mostrar el mensaje de "Sin datos"
  const shouldShowNoDataMessage = !loading && !hasEnoughData;

  // ========== UI PRINCIPAL con los selectores siempre visibles ==========
  return (
    <div className="space-y-6">
      {/* Header con selector de periodo y cartera - ESTA PARTE ES VISIBLE SIEMPRE */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div className="flex flex-col md:flex-row gap-3">
          {/* Selector cartera */}
          <Select
            value={selectedPortfolio}
            onValueChange={(value) => setSelectedPortfolio(value)}
            disabled={loading}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Cartera" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las carteras</SelectItem>
              {portfolios.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Selector periodo */}
          <Select
            value={period}
            onValueChange={(value) => setPeriod(value as Period)}
            disabled={loading}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Periodo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Mensual</SelectItem>
              <SelectItem value="quarterly">Trimestral</SelectItem>
              <SelectItem value="annual">Anual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Estado de carga/errores */}
      {loading && (
        <div className="text-sm text-gray-500">Cargando datos financieros…</div>
      )}
      {loadError && (
        <div className="text-sm text-red-600">Error: {loadError}</div>
      )}

      {/* Mensaje de NO DATOS - Se muestra si no hay datos filtrados */}
      {shouldShowNoDataMessage && (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <BarChart3 className="h-16 w-16 mx-auto text-gray-400" />
            <div>
              <h3 className="text-gray-700 mb-2">
                Sin datos disponibles en el periodo seleccionado
              </h3>
              {loadError ? (
                <p className="text-red-500 text-sm">Error: {loadError}</p>
              ) : (
                <>
                  <p className="text-gray-500">
                    Aún no hay suficientes movimientos para generar estadísticas en este rango.
                  </p>
                  <p className="text-gray-500">
                    Cambia el periodo o la cartera seleccionada para ver el análisis.
                  </p>
                </>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Contenido de análisis solo si hay datos */}
      {!loading && hasEnoughData && (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Total Ingresos</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-green-600">
                  €
                  {kpis.totalIncome.toLocaleString("es-ES", {
                    minimumFractionDigits: 2,
                  })}
                </div>
                <p className="text-xs text-gray-500">Periodo seleccionado</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Total Gastos</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-red-600">
                  €
                  {kpis.totalExpense.toLocaleString("es-ES", {
                    minimumFractionDigits: 2,
                  })}
                </div>
                <p className="text-xs text-gray-500">Periodo seleccionado</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Balance</CardTitle>
                <DollarSign className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div
                  className={`font-bold ${
                    kpis.balance >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  €
                  {kpis.balance.toLocaleString("es-ES", {
                    minimumFractionDigits: 2,
                  })}
                </div>
                <p className="text-xs text-gray-500">Ingresos - Gastos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Tasa de Ahorro</CardTitle>
                <PiggyBank className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-green-600">
                  {kpis.savingsRate.toFixed(1)}%
                </div>
                <p className="text-xs text-gray-500">Del total de ingresos</p>
              </CardContent>
            </Card>
          </div>

          {/* Evolución temporal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-600" />
                Evolución Temporal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="ingresos"
                    stroke="#16a34a"
                    strokeWidth={2}
                    name="Ingresos"
                  />
                  <Line
                    type="monotone"
                    dataKey="gastos"
                    stroke="#dc2626"
                    strokeWidth={2}
                    name="Gastos"
                  />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Balance"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráficos de distribución y comparativa */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Distribución por categoría */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Gastos por Categoría</CardTitle>
              </CardHeader>
              <CardContent>
                {categoryData.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No hay gastos en el periodo seleccionado.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData as any}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, payload }) => `${name} (${payload.percentage}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Comparativa Ingresos vs Gastos */}
            <Card>
              <CardHeader>
                <CardTitle>Comparativa Ingresos vs Gastos</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="ingresos" fill="#16a34a" name="Ingresos" />
                    <Bar dataKey="gastos" fill="#dc2626" name="Gastos" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top 5 Gastos e Ingresos */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Top 5 Gastos */}
            <Card>
              <CardHeader>
                <CardTitle>Top 5 Gastos Más Altos</CardTitle>
              </CardHeader>
              <CardContent>
                {topExpenses.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No hay gastos registrados en este periodo.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {topExpenses.map((expense, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="text-sm">{expense.description}</p>
                          <p className="text-xs text-gray-500">
                            {expense.category} •{" "}
                            {new Date(expense.date).toLocaleDateString("es-ES")}
                          </p>
                        </div>
                        <div className="font-bold text-red-600">
                          €
                          {expense.amount.toLocaleString("es-ES", {
                            minimumFractionDigits: 2,
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top 5 Ingresos */}
            <Card>
              <CardHeader>
                <CardTitle>Top 5 Ingresos Más Altos</CardTitle>
              </CardHeader>
              <CardContent>
                {topIncomes.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No hay ingresos registrados en este periodo.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {topIncomes.map((income, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="text-sm">{income.description}</p>
                          <p className="text-xs text-gray-500">
                            {income.category} •{" "}
                            {new Date(income.date).toLocaleDateString("es-ES")}
                          </p>
                        </div>
                        <div className="font-bold text-green-600">
                          +€
                          {income.amount.toLocaleString("es-ES", {
                            minimumFractionDigits: 2,
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}