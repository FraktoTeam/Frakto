'use client';

import { JSX, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Label } from "./ui/label";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getGastosFijos } from "@/services/gastoFijoService";

import { createClient } from "@/utils/client";
import { getIngresos, getGastos } from "../../services/transaccionService";

// Tipos
type Trend = "up" | "down";

interface PortfolioItem {
  id: string;
  name: string;
  saldo?: number;
  trend?: Trend;
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
  portfolioId: string;
  type: "income" | "expense";
  description: string;
  category: string;
  date: string; // yyyy-mm-dd
  amount: number; // positivo
}

interface FixedExpenseSvc {
  id_gasto?: number;
  cartera_nombre: string;
  id_usuario: number;
  categoria_nombre: string;
  importe: number;
  fecha_inicio: string; // yyyy-mm-dd
  frecuencia: number;   // días
  activo: boolean;
  descripcion?: string;
  lastGenerated?: string | null;
}

interface FixedOccurrence {
  date: string;        // yyyy-mm-dd
  portfolioId: string; // cartera_nombre
  description: string; // "Gasto fijo: ..."
  category: string;
  amount: number;
}

interface CalendarProps {
  userId: number;
}



export function Calendar({ userId }: CalendarProps) {
  const now = new Date();

  // --- HOOKS: siempre dentro del componente ---
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedPortfolioFilter, setSelectedPortfolioFilter] = useState<string>("all");
  const [portfolios, setPortfolios] = useState<PortfolioItem[]>([]);
  const [rows, setRows] = useState<TxRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ⬇️ ESTOS DOS ESTABAN FUERA (causaban el error):
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpenseSvc[]>([]);
  const [fixedByDay, setFixedByDay] = useState<Map<number, FixedOccurrence[]>>(new Map());
  const [isMobile, setIsMobile] = useState(false);
  
    useEffect(() => {
      const mq = window.matchMedia("(max-width: 480px)");
  
      const handleChange = () => setIsMobile(mq.matches);
      handleChange();
  
      mq.addEventListener("change", handleChange);
      return () => mq.removeEventListener("change", handleChange);
    }, []);
    
  // helpers fechas
  const monthNames = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
  ];
  const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  const fmtYYYYMMDD = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const rangeOfMonth = (year: number, month: number) => {
    const first = new Date(year, month, 1);
    const last  = new Date(year, month + 1, 0);
    return { firstStr: fmtYYYYMMDD(first), lastStr: fmtYYYYMMDD(last) };
  };

  const getFirstDayOfMonth = (year: number, month: number): number => {
    const firstDay = new Date(year, month, 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1; // Lunes=0 ... Domingo=6
  };

  const getDaysInMonth = (year: number, month: number): number =>
    new Date(year, month + 1, 0).getDate();

  const isToday = (day: number): boolean => {
    const today = new Date();
    return (
      day === today.getDate() &&
      selectedMonth === today.getMonth() &&
      selectedYear === today.getFullYear()
    );
  };

  const handlePreviousMonth = () => {
    const prev = new Date(selectedYear, selectedMonth - 1, 1);
    setSelectedYear(prev.getFullYear());
    setSelectedMonth(prev.getMonth());
  };

  const handleNextMonth = () => {
    const candidate = new Date(selectedYear, selectedMonth + 1, 1);
    if (
      candidate.getFullYear() < now.getFullYear() ||
      (candidate.getFullYear() === now.getFullYear() && candidate.getMonth() <= now.getMonth())
    ) {
      setSelectedYear(candidate.getFullYear());
      setSelectedMonth(candidate.getMonth());
    }
  };

  const handleDayClick = (day: number) => {
    const date = new Date(selectedYear, selectedMonth, day);
    setSelectedDay(date);
    setSelectedPortfolioFilter("all");
    setIsModalOpen(true);
  };

  // 1) Cargar carteras reales
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadError(null);
      try {
        const supa = createClient; // si tu helper es función, usa createClient()
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
          saldo: Number(r.saldo ?? 0),
        }));
        setPortfolios(list);
      } catch (e: any) {
        if (mounted) setLoadError(e.message ?? "Error cargando carteras");
      }
    })();
    return () => { mounted = false; };
  }, [userId]);

  // 2) Cargar gastos fijos del usuario
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getGastosFijos(userId);
        if (!mounted) return;
        const activos: FixedExpenseSvc[] = (data ?? []).filter((g: any) => !!g.activo);
        setFixedExpenses(activos);
      } catch (e) {
        console.error("Error cargando gastos fijos:", e);
      }
    })();
    return () => { mounted = false; };
  }, [userId]);

  // 3) Expandir gastos fijos a ocurrencias del mes seleccionado
  useEffect(() => {
    const map = new Map<number, FixedOccurrence[]>();

    if (!fixedExpenses || fixedExpenses.length === 0) {
      setFixedByDay(map);
      return;
    }

    const startOfMonth = new Date(selectedYear, selectedMonth, 1);
    const endOfMonth   = new Date(selectedYear, selectedMonth + 1, 0);
    const withinMonth = (d: Date) => d >= startOfMonth && d <= endOfMonth;

    for (const fx of fixedExpenses) {
      if (!fx.activo) continue;

      const start = new Date(fx.fecha_inicio);
      if (start > endOfMonth) continue;

      const msPerDay = 24 * 60 * 60 * 1000;
      const freqDays = Math.max(1, Number(fx.frecuencia || 0));
      const freqMs = freqDays * msPerDay;

      let firstOcc = new Date(start);
      if (firstOcc < startOfMonth) {
        const diff = startOfMonth.getTime() - firstOcc.getTime();
        const steps = Math.floor(diff / freqMs);
        firstOcc = new Date(firstOcc.getTime() + steps * freqMs);
        if (firstOcc < startOfMonth) firstOcc = new Date(firstOcc.getTime() + freqMs);
      }

      for (let d = new Date(firstOcc); withinMonth(d); d = new Date(d.getTime() + freqMs)) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const ymd = `${yyyy}-${mm}-${dd}`;
        const dayNum = d.getDate();

        const occ: FixedOccurrence = {
          date: ymd,
          portfolioId: fx.cartera_nombre,
          description: `Gasto fijo: ${fx.descripcion || "Gasto fijo"}`,
          category: fx.categoria_nombre || "gasto",
          amount: Number(fx.importe) || 0,
        };

        const list = map.get(dayNum) ?? [];
        list.push(occ);
        map.set(dayNum, list);
      }
    }

    setFixedByDay(map);
  }, [fixedExpenses, selectedMonth, selectedYear]);

  // 4) Cargar ingresos/gastos del mes seleccionado
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (portfolios.length === 0) {
        setRows([]);
        return;
      }
      setLoading(true);
      setLoadError(null);
      try {
        const { firstStr, lastStr } = rangeOfMonth(selectedYear, selectedMonth);
        const portfoliosToFetch = portfolios.map(p => p.name);

        const allResults = await Promise.all(
          portfoliosToFetch.map(async (cartera) => {
            const [ing, gas] = await Promise.all([
              getIngresos(cartera, userId),
              getGastos(cartera, userId),
            ]);
            return { cartera, ingresos: ing as Ingreso[], gastos: gas as Gasto[] };
          })
        );

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
                amount: Number(g.importe) || 0,
              });
            }
          }
        }

        merged.sort((a, b) => (a.date < b.date ? -1 : 1));
        if (mounted) setRows(merged);
      } catch (e: any) {
        if (mounted) setLoadError(e.message ?? "Error cargando movimientos");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [userId, portfolios, selectedMonth, selectedYear]);

  // Derivadas
  const rowsByDay = useMemo(() => {
    const map = new Map<number, TxRow[]>();
    for (const r of rows) {
      const d = new Date(r.date);
      if (d.getFullYear() !== selectedYear || d.getMonth() !== selectedMonth) continue;
      const key = d.getDate();
      const list = map.get(key) ?? [];
      list.push(r);
      map.set(key, list);
    }
    return map;
  }, [rows, selectedMonth, selectedYear]);

  const getTransactionsForDay = (day: number): TxRow[] => rowsByDay.get(day) ?? [];

  const getDayIndicators = (day: number) => {
    const tx = getTransactionsForDay(day);
    const hasIncome = tx.some(t => t.type === "income");
    const hasExpense = tx.some(t => t.type === "expense");
    const hasFixed = (fixedByDay.get(day)?.length ?? 0) > 0;
    return { hasIncome, hasExpense, hasFixed };
  };

  // ⬇️ PRIMERO: fijos del día y lista combinada
  const fixedOfSelectedDay = useMemo(() => {
    if (!selectedDay) return [];
    const day = selectedDay.getDate();
    const occ = fixedByDay.get(day) ?? [];
    if (selectedPortfolioFilter === "all") return occ;
    return occ.filter(o => o.portfolioId === selectedPortfolioFilter);
  }, [selectedDay, selectedPortfolioFilter, fixedByDay]);

  const filteredTransactions = useMemo(() => {
    if (!selectedDay) return [];
    const day = selectedDay.getDate();
    const tx = getTransactionsForDay(day);
    if (selectedPortfolioFilter === "all") return tx;
    return tx.filter(t => t.portfolioId === selectedPortfolioFilter);
  }, [selectedDay, selectedPortfolioFilter, rowsByDay]);

  const combinedList = useMemo(() => {
    const mappedFixed: TxRow[] = fixedOfSelectedDay.map(o => ({
      portfolioId: o.portfolioId,
      type: "expense",
      description: o.description,
      category: o.category,
      date: o.date,
      amount: o.amount,
    }));
    const all = [...filteredTransactions, ...mappedFixed];
    all.sort((a, b) => (a.date < b.date ? -1 : 1));
    return all;
  }, [filteredTransactions, fixedOfSelectedDay]);

  // ⬇️ DESPUÉS: resumen usando la combinada (antes lo usabas antes de declararla)
  const modalSummary = useMemo(() => {
    const inc = combinedList.filter(t => t.type === "income").reduce((s, x) => s + x.amount, 0);
    const exp = combinedList.filter(t => t.type === "expense").reduce((s, x) => s + x.amount, 0);
    return { totalIncome: inc, totalExpense: exp, balance: inc - exp };
  }, [combinedList]);

  // Render calendario
  const renderCalendar = () => {
    const firstDay = getFirstDayOfMonth(selectedYear, selectedMonth);
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    const cells: JSX.Element[] = [];

    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="aspect-square p-2" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const { hasIncome, hasExpense, hasFixed } = getDayIndicators(day);
      const isCurrentDay = isToday(day);
      const hasAny = hasIncome || hasExpense || hasFixed;

      cells.push(
        <button
          key={day}
          onClick={() => handleDayClick(day)}
          className={`
            ${isMobile ? "aspect-10 p-1" : "aspect-square p-2"} 
            p-1 sm:p-2 
            rounded-lg 
            transition-all 
            hover:bg-gray-100 
            ${isCurrentDay ? "border-2 border-green-600 bg-green-50" : "border border-gray-200"}
          `}
        >
          <div className="flex flex-col items-center justify-between h-full">
            <span
              className={`
                text-xs sm:text-sm
                ${isCurrentDay ? "font-bold text-green-600" : ""}
              `}
            >
              {day}
            </span>

            {hasAny && (
              <div className="flex gap-0.5 sm:gap-1 mt-0.5 sm:mt-1">
                {hasIncome && (
                  <div className={` ${isMobile ? "w-1 h-1 sm:w-1.5 sm:h-1.5" : "w-1.5 h-1.5 sm:w-2 sm:h-2"}  rounded-full bg-green-600`} title="Ingresos" />
                )}
                {hasExpense && (
                  <div className={` ${isMobile ? "w-1 h-1 sm:w-1.5 sm:h-1.5" : "w-1.5 h-1.5 sm:w-2 sm:h-2"}  rounded-full bg-red-600`} title="Gastos" />
                )}
                {hasFixed && (
                  <div className={` ${isMobile ? "w-1 h-1 sm:w-1.5 sm:h-1.5" : "w-1.5 h-1.5 sm:w-2 sm:h-2"}  rounded-full bg-blue-600`} title="Gasto fijo" />
                )}
              </div>
            )}
          </div>
        </button>

      );
    }

    return cells;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2>Calendario Financiero</h2>
        <p className="text-gray-500">Visualiza tus ingresos y gastos por día</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <CardTitle >{monthNames[selectedMonth]} {selectedYear}</CardTitle>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNextMonth}
              disabled={selectedYear === now.getFullYear() && selectedMonth === now.getMonth()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {loading && <div className="text-sm text-gray-500 mb-3">Cargando movimientos del mes…</div>}
          {loadError && <div className="text-sm text-red-600 mb-3">Error: {loadError}</div>}

          <div className="grid grid-cols-7 gap-2 mb-2">
            {dayNames.map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-gray-500 p-2">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {renderCalendar()}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-2"><strong>Leyenda:</strong></p>
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-600" />
                <span className="text-gray-600">Ingresos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-600" />
                <span className="text-gray-600">Gastos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-600" />
                <span className="text-gray-600">Gasto fijo programado</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Movimientos del {selectedDay?.getDate()} de {selectedDay && monthNames[selectedDay.getMonth()]}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="portfolio-filter" className="mb-2">Filtrar por cartera</Label>
              <Select value={selectedPortfolioFilter} onValueChange={setSelectedPortfolioFilter}>
                <SelectTrigger id="portfolio-filter">
                  <SelectValue placeholder="Todas las carteras" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las carteras</SelectItem>
                  {portfolios.map((p) => (
                    <SelectItem key={p.id} value={p.name}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Card className="bg-gray-50 ">
              <CardContent className="pt-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-500">Total Ingresos</p>
                    <p className="text-lg font-bold text-green-600">+€{modalSummary.totalIncome.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Gastos</p>
                    <p className="text-lg font-bold text-red-600">-€{modalSummary.totalExpense.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Balance Neto</p>
                    <p className={`text-lg font-bold ${modalSummary.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {modalSummary.balance >= 0 ? "+" : ""}€{modalSummary.balance.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div>
              <h4 className="mb-3">Movimientos</h4>
              {combinedList.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {selectedPortfolioFilter === "all"
                    ? "No hay movimientos registrados en esta fecha."
                    : "Esta cartera no tiene movimientos registrados en esta fecha."}
                </div>
              ) : (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3 px-2">
                    {combinedList.map((t, idx) => (
                      <Card key={`${t.date}-${t.portfolioId}-${t.description}-${idx}`} className="w-full max-w-[calc(100%-1rem)] mx-auto">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className={`px-2 py-1 rounded text-xs ${
                                    t.type === "income" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {t.type === "income" ? "Ingreso" : "Gasto"}
                                </span>
                                <span className="text-xs text-gray-500">{t.portfolioId}</span>
                                {t.description?.startsWith("Gasto fijo") && (
                                  <span className="px-2 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700">Fijo</span>
                                )}
                              </div>
                              <p className="font-medium">{t.description}</p>
                              <p className="text-xs text-gray-500">Categoría: {t.category}</p>
                            </div>
                            <div className="text-right">
                              <p className={`font-bold ${t.type === "income" ? "text-green-600" : "text-red-600"}`}>
                                {t.type === "income" ? "+" : "-"}€{t.amount.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
