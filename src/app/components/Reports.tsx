'use client';

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { FileText, Download } from "lucide-react";
import { getIngresos, getGastos } from "../../services/transaccionService";

import { createClient } from "@/utils/client"; // para leer carteras si no tienes service de carteras

type Trend = "up" | "down";

interface PortfolioItem {
  id: string;          // usaremos el nombre como id (clave natural)
  name: string;        // nombre cartera
  trend?: Trend;
  saldo?: number;      // saldo actual
  ingresos?: Ingreso[]; // ingresos asociados
  gastos?: Gasto[];     // gastos asociados
}

interface Ingreso {
  cartera_nombre: string;
  id_usuario: number;
  importe: number;
  descripcion?: string;
  fecha: string; // yyyy-mm-dd
}

interface Gasto {
  cartera_nombre: string;
  id_usuario: number;
  categoria_nombre: string;
  importe: number; // positivo en BD
  fecha: string;   // yyyy-mm-dd
  descripcion?: string;
}

interface TxRow {
  // fila unificada para el reporte
  portfolioId: string;
  type: "income" | "expense";
  description: string;
  category: string;
  date: string; // yyyy-mm-dd
  amount: number; // positivo
}

interface ReportData {
  initialBalance: number;
  totalIncome: number;
  totalExpense: number;
  finalBalance: number;
  netResult: number;
  incomeTransactions: TxRow[];
  expensesByCategory: { category: string; count: number; total: number }[];
  weeklyData: { week: string; income: number; expense: number }[];
}

function startEndOfLastMonth() {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const last  = new Date(now.getFullYear(), now.getMonth(), 0);
  // strings yyyy-mm-dd
  const fmt = (d: Date) => d.toISOString().slice(0,10);
  return { first, last, firstStr: fmt(first), lastStr: fmt(last) };
}

const monthNames = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
];

function toCurrency(n: number) {
  return `${n < 0 ? "-" : ""}${Math.abs(n).toFixed(2)} €`;
}

type ReportsProps = { userId: number };

export function Reports({ userId }: ReportsProps) {
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>("all");
  const [availableMonth, setAvailableMonth] = useState<string>("");
  const [availableYear, setAvailableYear] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [portfolioData, setPortfolioData] = useState<
    { cartera: string; saldo: number; ingresos: Ingreso[]; gastos: Gasto[] }[]
  >([]);
  const [portfolios, setPortfolios] = useState<PortfolioItem[]>([]);
  const [rows, setRows] = useState<TxRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Calcular mes pasado (para mostrar y filtrar)
  useEffect(() => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    setAvailableMonth(monthNames[lastMonth.getMonth()]);
    setAvailableYear(lastMonth.getFullYear().toString());
  }, []);

  // Cargar carteras del usuario (si no tienes un service específico)
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
    return () => { mounted = false; };
  }, [userId]);

  // Cargar ingresos y gastos del mes pasado (todas o una cartera)
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const { firstStr, lastStr } = startEndOfLastMonth();

        // carteras a consultar
        const portfoliosToFetch =
          selectedPortfolio === "all"
            ? portfolios.map(p => p.name)
            : portfolios.filter(p => p.id === selectedPortfolio).map(p => p.name);

        // si aún no hay carteras, no intentes
        if (portfoliosToFetch.length === 0) {
          setRows([]);
          if (mounted) setPortfolioData([]);
          setLoading(false);
          return;
        }

        // Traer ingresos y gastos por cada cartera (concurrente)
        const allResults = await Promise.all(
          portfoliosToFetch.map(async (cartera) => {
            const [ing, gas] = await Promise.all([
              getIngresos(cartera, userId),
              getGastos(cartera, userId),
            ]);
            return { cartera, ingresos: ing as Ingreso[], gastos: gas as Gasto[] };
          })
        );

        // Guarda los pack completos para usarlos después
        if (mounted) {
          // enlaza saldo desde `portfolios`
          const packed = allResults.map(p => {
            const port = portfolios.find(x => x.name === p.cartera);
            return {
              cartera: p.cartera,
              saldo: port ? Number((port as any).saldo ?? 0) : 0,
              ingresos: p.ingresos,
              gastos: p.gastos,
            };
          });
          setPortfolioData(packed);
        }

        // Unificamos a filas TxRow y filtramos por fecha del mes pasado
        const inMonth = (d: string) => d >= firstStr && d <= lastStr;

        const merged: TxRow[] = [];
        for (const pack of allResults) {
          for (const i of pack.ingresos) {
            if (inMonth(i.fecha)) {
              merged.push({
                portfolioId: pack.cartera,
                type: "income",
                description: i.descripcion ?? "Ingreso",
                category: "Ingreso",
                date: i.fecha,
                amount: Number(i.importe) || 0,
              });
            }
          }
          for (const g of pack.gastos) {
            if (inMonth(g.fecha)) {
              merged.push({
                portfolioId: pack.cartera,
                type: "expense",
                description: g.descripcion ?? "Gasto",
                category: g.categoria_nombre ?? "gasto",
                date: g.fecha,
                amount: Number(g.importe) || 0, // en tu BD el gasto es positivo
              });
            }
          }
        }

        // Ordenamos por fecha asc/desc (elige)
        merged.sort((a, b) => (a.date < b.date ? -1 : 1));

        if (mounted) setRows(merged);
      } catch (e: any) {
        if (mounted) setLoadError(e.message ?? "Error cargando datos");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    // Evita actualizaciones de estado si el componente se desmonta
    return () => {
      mounted = false;
    };
  }, [userId, selectedPortfolio, portfolios]);

  // Construye los agregados para el reporte a partir de rows
  const reportData: ReportData = useMemo(() => {
    const incomeTransactions = rows.filter(r => r.type === "income");
    const expenseTransactions = rows.filter(r => r.type === "expense");

    const totalIncome  = incomeTransactions.reduce((s, r) => s + r.amount, 0);
    const totalExpense = expenseTransactions.reduce((s, r) => s + r.amount, 0);

    // Tomamos el saldo actual de cada cartera y revertimos los movimientos del mes
    const { firstStr } = startEndOfLastMonth(); // fecha inicio mes (ej. "2025-10-01")
    const nowStr = new Date().toISOString().slice(0, 10); // fecha actual (ISO corto)

    let totalInitialBalance = 0;

    const portfoliosToUse =
    selectedPortfolio === "all"
      ? portfolios
      : portfolios.filter(p => p.id === selectedPortfolio || p.name === selectedPortfolio);

    for (const cartera of portfoliosToUse) {
      const ingresos = rows.filter(r => r.portfolioId === cartera.name && r.type === "income");
      const gastos = rows.filter(r => r.portfolioId === cartera.name && r.type === "expense");

      const ingDesdeInicio = ingresos.reduce((s, i) => s + i.amount, 0);
      const gasDesdeInicio = gastos.reduce((s, g) => s + g.amount, 0);

      const currentBalance = cartera.saldo ?? 0;

      const initial = currentBalance - ingDesdeInicio + gasDesdeInicio;
      console.log(
        `Cartera ${cartera.name}: saldo actual ${currentBalance}, ingresos ${ingDesdeInicio}, gastos ${gasDesdeInicio} => inicial ${initial}`
      );
      totalInitialBalance += initial;
    }

    // Agrupar gastos por categoría
    const expensesByCategory: ReportData["expensesByCategory"] = [];
    for (const r of expenseTransactions) {
      const k = r.category?.toLowerCase() || "gasto";
      const ex = expensesByCategory.find(e => e.category === k);
      if (ex) { ex.count++; ex.total += r.amount; }
      else    { expensesByCategory.push({ category: k, count: 1, total: r.amount }); }
    }

    // Datos semanales (aprox. 4 semanas)
    const weeklyData = [
      { week: "Semana 1", income: totalIncome * 0.30, expense: totalExpense * 0.25 },
      { week: "Semana 2", income: totalIncome * 0.20, expense: totalExpense * 0.35 },
      { week: "Semana 3", income: totalIncome * 0.25, expense: totalExpense * 0.20 },
      { week: "Semana 4", income: totalIncome * 0.25, expense: totalExpense * 0.20 },
    ];

    // Balance inicial simulado (si quieres, cámbialo a un select de 'cartera.saldo')
    const initialBalance = totalInitialBalance;
    const finalBalance = initialBalance + totalIncome - totalExpense;
    const netResult = totalIncome - totalExpense;
    console.log(`Reporte: inicial ${initialBalance}, ingresos ${totalIncome}, gastos ${totalExpense}, final ${finalBalance}`);

    return {
      initialBalance,
      totalIncome,
      totalExpense,
      finalBalance,
      netResult,
      incomeTransactions,
      expensesByCategory,
      weeklyData,
    };
  }, [rows]);

// PDF (import dinámico, Next.js friendly)
  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const [{ default: jsPDF }, autoTableMod] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);
      const autoTable = (autoTableMod as any).default ?? (autoTableMod as any);

      const doc = new jsPDF();

      const portfolioName =
        selectedPortfolio === "all" ? "Todas" : selectedPortfolio;
      const userName = "Usuario Frakto";
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const reportPeriod = `${lastMonth.getFullYear()}-${String(
        lastMonth.getMonth() + 1
      ).padStart(2, "0")}`;

      // ---------- PORTADA ----------
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("Reporte Financiero Mensual", 105, 60, { align: "center" });

      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");
      doc.text(`Usuario: ${userName}`, 105, 80, { align: "center" });
      doc.text(`Cartera(s): ${portfolioName}`, 105, 90, { align: "center" });
      doc.text(`Periodo: ${availableMonth} ${availableYear}`, 105, 100, {
        align: "center",
      });

      // ---------- RESUMEN EJECUTIVO ----------
      doc.addPage();
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Resumen Ejecutivo", 20, 20);

      const summaryData = [
        ["Balance Inicial", toCurrency(reportData.initialBalance)],
        ["Total Ingresos", toCurrency(reportData.totalIncome)],
        ["Total Gastos", toCurrency(reportData.totalExpense)],
        ["Balance Final", toCurrency(reportData.finalBalance)],
        [
          "Resultado Neto",
          `${reportData.netResult >= 0 ? "+" : ""}${toCurrency(
            reportData.netResult
          )}`,
        ],
      ];

      autoTable(doc, {
        startY: 30,
        head: [["Concepto", "Importe"]],
        body: summaryData,
        theme: "grid",
        headStyles: {
          fillColor: [34, 197, 94],
          textColor: 255,
          fontStyle: "bold",
        },
        styles: { fontSize: 11, font: "helvetica" },
      });

      // ---------- INDICADORES CLAVE (KPIs) ----------
      const daysInMonth = new Date(
        lastMonth.getFullYear(),
        lastMonth.getMonth() + 1,
        0
      ).getDate();
      const savingsRate = reportData.totalIncome
        ? ((reportData.totalIncome - reportData.totalExpense) /
            reportData.totalIncome) *
          100
        : 0;
      const dailyExpense = reportData.totalExpense / daysInMonth;
      const dailyIncome = reportData.totalIncome / daysInMonth;
      const lastY = (doc as any).lastAutoTable?.finalY || 40;

      autoTable(doc, {
        startY: lastY + 10,
        head: [["Indicador", "Valor"]],
        body: [
          ["Tasa de Ahorro", `${savingsRate.toFixed(1)} %`],
          ["Gasto Diario Promedio", `${dailyExpense.toFixed(2)} €`],
          ["Ingreso Diario Promedio", `${dailyIncome.toFixed(2)} €`],
        ],
        theme: "striped",
        headStyles: {
          fillColor: [75, 85, 99],
          textColor: 255,
          fontStyle: "bold",
        },
      });

      // ---------- GASTOS POR CATEGORÍA + PORCENTAJE ----------
      doc.addPage();
      doc.setFontSize(18);
      doc.text("Gastos por Categoría", 20, 20);

      const totalExpenseAmount = reportData.expensesByCategory.reduce(
        (s, e) => s + e.total,
        0
      );

      const expenseTableData = reportData.expensesByCategory.map((e) => {
        const percent = totalExpenseAmount
          ? (e.total / totalExpenseAmount) * 100
          : 0;
        return [e.category, e.count, `${e.total.toFixed(2)} €`, `${percent.toFixed(1)} %`];
      });

      autoTable(doc, {
        startY: 30,
        head: [["Categoría", "Movimientos", "Total (€)", "% del Gasto"]],
        body: expenseTableData,
        theme: "grid",
        headStyles: {
          fillColor: [34, 197, 94],
          textColor: 255,
          fontStyle: "bold",
        },
        styles: { fontSize: 10 },
      });
      doc.addPage();
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Detalle de Ingresos", 20, 20);

      const incomeTableData = reportData.incomeTransactions.map(t => [
        t.date,
        t.portfolioId,
        t.description,
        `${t.amount.toFixed(2)} €`,
      ]);

      autoTable(doc, {
        startY: 30,
        head: [["Fecha", "Cartera", "Descripción", "Importe (€)"]],
        body: incomeTableData,
        theme: "striped",
        headStyles: { fillColor: [34, 197, 94], textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 10, font: "helvetica" },
      });

      // COMPARACIÓN SEMANAL (tabla)
      doc.addPage();
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Comparación Ingresos vs Gastos por Semana", 20, 20);

      const weeklyTableData = reportData.weeklyData.map(w => [
        w.week,
        `${w.income.toFixed(2)} €`,
        `${w.expense.toFixed(2)} €`,
        `${(w.income - w.expense).toFixed(2)} €`,
      ]);

      autoTable(doc, {
        startY: 30,
        head: [["Semana", "Ingresos (€)", "Gastos (€)", "Diferencia (€)"]],
        body: weeklyTableData,
        theme: "grid",
        headStyles: { fillColor: [34, 197, 94], textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 10, font: "helvetica" },
      });

      // ---------- RECOMENDACIONES AUTOMÁTICAS ----------
      doc.addPage();
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Observaciones y Recomendaciones", 20, 20);
      doc.setLineWidth(0.5);
      doc.line(20, 23, 190, 23);

      // ✅ Declaramos la variable
      const insights: string[] = [];

      if (savingsRate < 10) {
        insights.push(
          "⚠️ Tu tasa de ahorro es baja. Considera reducir gastos variables."
        );
      }
      if (reportData.totalExpense > reportData.totalIncome) {
        insights.push("🚨 Gastas más de lo que ingresas este mes.");
      }
      if (reportData.expensesByCategory.some((e) => e.total > reportData.totalIncome * 0.2)) {
        insights.push(
          "💡 Una o más categorías superan el 20% de tus ingresos. Revisa su impacto."
        );
      }
      if (insights.length === 0) {
        insights.push("✅ Tu balance es saludable. Buen trabajo este mes.");
      }

      // Ahora ya podemos usar 'insights' en autoTable
      autoTable(doc, {
        startY: 30,
        head: [["Tipo", "Recomendación"]],
        body: insights.map((i) => [
          i.startsWith("✅") ? "Bueno" : i.startsWith("⚠️") ? "Advertencia" : "Alerta",
          i.replace(/^.\s/, ""),
        ]),
        theme: "striped",
        styles: { fontSize: 11, cellPadding: 4, font: "helvetica" },
        headStyles: { fillColor: [34, 197, 94], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [245, 250, 255] },
      });



      // ---------- PIE DE PÁGINA ----------
      const totalPages = (doc as any).getNumberOfPages();
      const pageCount = typeof totalPages === "function" ? totalPages() : totalPages;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.text(
          `Página ${i} de ${pageCount} · ${availableMonth} ${availableYear}`,
          105,
          290,
          { align: "center" }
        );
      }

      // ---------- GUARDAR ----------
      const fileName = `reporte_usuario_frakto_${portfolioName.toLowerCase()}_${reportPeriod}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("Error generando PDF:", error);
      alert("Error al generar el PDF. Revisa la consola para más detalle.");
    } finally {
      setIsGenerating(false);
    }
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2>Reportes Mensuales</h2>
        <p className="text-gray-500">
          Genera un reporte detallado en formato PDF del mes anterior (datos reales de Supabase)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-green-600" />
            Generación de Reporte PDF
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Mes disponible */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">
              <span className="font-bold">Disponible:</span> {availableMonth} {availableYear}
            </p>
            <p className="text-sm text-green-700 mt-2">
              Los reportes se generan para el mes inmediatamente anterior.
            </p>
          </div>

          {/* Selector de cartera */}
          <div className="space-y-2">
            <Label>Seleccionar Cartera</Label>
            <Select value={selectedPortfolio} onValueChange={setSelectedPortfolio}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una cartera" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las Carteras</SelectItem>
                {portfolios.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">
              “Todas” genera un reporte consolidado de todas tus carteras.
            </p>
          </div>

          {/* Estado de carga/errores */}
          {loading && (
            <div className="text-sm text-gray-500">Cargando datos del mes pasado…</div>
          )}
          {loadError && (
            <div className="text-sm text-red-600">Error: {loadError}</div>
          )}

          {/* Botón */}
          <div className="pt-2">
            <Button
              onClick={generatePDF}
              disabled={isGenerating || loading || portfolios.length === 0}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {isGenerating ? (
                <span className="animate-pulse">Generando PDF…</span>
              ) : (
                <>
                  <Download className="h-5 w-5 mr-2" />
                  Generar PDF
                </>
              )}
            </Button>
          </div>

          {/* Nota */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <span className="font-bold">Nota:</span> Se descargará un PDF con datos reales
              ({availableMonth} {availableYear}). Formato:
              <code className="bg-gray-200 px-1 rounded">reporte_usuario_frakto_[cartera]_[YYYY-MM].pdf</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
