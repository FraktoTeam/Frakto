import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import {
  Plus,
  Target,
  Trash2,
  Wallet,
  Calendar,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { createClient } from "@/utils/client";

interface Goal {
  id: number;                  // id_meta
  name: string;                // nombre
  targetAmount: number;        // cantidad_objetivo
  currentAmount: number;       // calculado según saldo real
  deadline: string;            // fecha_limite (yyyy-mm-dd)
  portfolioId: string | null;  // cartera_nombre o null
  portfolioName: string;
  status: "active" | "completed" | "expired";
}

interface Portfolio {
  id: string;   // nombre de la cartera
  name: string;
  balance: number;
}

interface GoalsProps {
  userId: number;
  onActiveGoalsChange?: (count: number) => void;
}

export function Goals({ userId, onActiveGoalsChange }: GoalsProps) {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loadingPortfolios, setLoadingPortfolios] = useState(true);
  const [portfoliosError, setPortfoliosError] = useState<string | null>(null);

  const [goals, setGoals] = useState<Goal[]>([]);
  const [loadingGoals, setLoadingGoals] = useState(true);
  const [goalsError, setGoalsError] = useState<string | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingGoal, setDeletingGoal] = useState<Goal | null>(null);

  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalAmount, setNewGoalAmount] = useState("");
  const [newGoalDeadline, setNewGoalDeadline] = useState("");
  const [newGoalPortfolio, setNewGoalPortfolio] = useState<string>("");

  const [errors, setErrors] = useState({
    name: "",
    amount: "",
    deadline: "",
    portfolio: "",
  });

  // Cargar carteras reales
  useEffect(() => {
    const fetchPortfolios = async () => {
      if (!userId) return;
      try {
        setLoadingPortfolios(true);
        setPortfoliosError(null);

        const { data, error } = await createClient
          .from("cartera")
          .select("nombre, saldo")
          .eq("id_usuario", userId);

        if (error) {
          console.error("Error cargando carteras:", error.message);
          setPortfoliosError("No se pudieron cargar tus carteras.");
          setPortfolios([]);
          return;
        }

        const mapped: Portfolio[] = (data ?? []).map((row: any) => ({
          id: row.nombre,
          name: row.nombre,
          balance: row.saldo ?? 0,
        }));

        setPortfolios(mapped);
      } catch (e: any) {
        console.error("Error inesperado cargando carteras:", e);
        setPortfoliosError("Error inesperado cargando tus carteras.");
      } finally {
        setLoadingPortfolios(false);
      }
    };

    fetchPortfolios();
  }, [userId]);

  // Cargar metas desde meta_ahorro
  useEffect(() => {
    const fetchGoals = async () => {
      if (!userId) return;
      try {
        setLoadingGoals(true);
        setGoalsError(null);

        const { data, error } = await createClient
          .from("meta_ahorro")
          .select("id_meta, nombre, cantidad_objetivo, fecha_limite, cartera_nombre")
          .eq("id_usuario", userId)
          .order("fecha_limite", { ascending: true });

        if (error) {
          console.error("Error cargando metas:", error.message);
          setGoalsError("No se pudieron cargar tus metas de ahorro.");
          setGoals([]);
          return;
        }

        const mapped: Goal[] = (data ?? []).map((m: any) => ({
          id: m.id_meta,
          name: m.nombre,
          targetAmount: Number(m.cantidad_objetivo),
          currentAmount: 0, // se recalcula más abajo
          deadline: m.fecha_limite,
          portfolioId: m.cartera_nombre,
          portfolioName: m.cartera_nombre ?? "Todas las carteras",
          status: "active",
        }));

        setGoals(mapped);
      } catch (e: any) {
        console.error("Error inesperado cargando metas:", e);
        setGoalsError("Error inesperado cargando tus metas de ahorro.");
      } finally {
        setLoadingGoals(false);
      }
    };

    fetchGoals();
  }, [userId]);

  // Total carteras (dinero real)
  const getTotalBalance = () =>
    portfolios.reduce((sum, p) => sum + p.balance, 0);

  // Saldo según cartera asociada a la meta
  const getCurrentAmount = (portfolioId: string | null) => {
    if (portfolioId === null) return getTotalBalance();
    const portfolio = portfolios.find((p) => p.id === portfolioId);
    return portfolio ? portfolio.balance : 0;
  };

  // Estado de la meta según dinero real + fecha
  const calculateStatus = (goal: Goal): "active" | "completed" | "expired" => {
    const today = new Date();
    const deadline = new Date(goal.deadline);
    const currentAmount = getCurrentAmount(goal.portfolioId);

    if (currentAmount >= goal.targetAmount) return "completed";
    if (deadline < today) return "expired";
    return "active";
  };

  // Metas actualizadas con currentAmount/status
  const updatedGoals: Goal[] = goals.map((goal) => ({
    ...goal,
    currentAmount: getCurrentAmount(goal.portfolioId),
    status: calculateStatus(goal),
  }));

  // Contar metas activas
  const activeGoalsCount = updatedGoals.filter(
    (g) => g.status === "active"
  ).length;

  // Avisar al App para el badge del sidebar
  useEffect(() => {
    if (onActiveGoalsChange) onActiveGoalsChange(activeGoalsCount);
  }, [activeGoalsCount, onActiveGoalsChange]);

  // Validación
  const validateForm = () => {
    const newErrors = { name: "", amount: "", deadline: "", portfolio: "" };
    let isValid = true;

    if (!newGoalName.trim()) {
      newErrors.name = "El nombre es obligatorio";
      isValid = false;
    }

    if (!newGoalAmount || parseFloat(newGoalAmount) <= 0) {
      newErrors.amount = "La cantidad debe ser mayor a 0";
      isValid = false;
    }

    if (!newGoalDeadline) {
      newErrors.deadline = "La fecha límite es obligatoria";
      isValid = false;
    } else {
      const selectedDate = new Date(newGoalDeadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate <= today) {
        newErrors.deadline = "La fecha debe ser futura";
        isValid = false;
      }
    }

    if (!newGoalPortfolio) {
      newErrors.portfolio = "Debes seleccionar una cartera";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Crear meta → Supabase + estado
  const handleCreateGoal = async () => {
    if (!validateForm()) return;

    const portfolioId = newGoalPortfolio === "all" ? null : newGoalPortfolio;
    const portfolioName =
      portfolioId === null
        ? "Todas las carteras"
        : portfolios.find((p) => p.id === portfolioId)?.name || "";

    try {
      const { data, error } = await createClient
        .from("meta_ahorro")
        .insert([
          {
            id_usuario: userId,
            nombre: newGoalName,
            cantidad_objetivo: parseFloat(newGoalAmount),
            fecha_limite: newGoalDeadline,
            cartera_nombre: portfolioId,
          },
        ])
        .select("id_meta, nombre, cantidad_objetivo, fecha_limite, cartera_nombre")
        .maybeSingle();

      if (error || !data) {
        console.error("Error creando meta:", error?.message);
        // Aquí podrías mostrar un toast si tienes sistema de alertas
        return;
      }

      const created: Goal = {
        id: data.id_meta,
        name: data.nombre,
        targetAmount: Number(data.cantidad_objetivo),
        currentAmount: getCurrentAmount(portfolioId),
        deadline: data.fecha_limite,
        portfolioId: data.cartera_nombre,
        portfolioName,
        status: "active",
      };

      setGoals((prev) => [...prev, created]);

      setNewGoalName("");
      setNewGoalAmount("");
      setNewGoalDeadline("");
      setNewGoalPortfolio("");
      setErrors({ name: "", amount: "", deadline: "", portfolio: "" });
      setIsDialogOpen(false);
    } catch (e: any) {
      console.error("Error inesperado creando meta:", e);
    }
  };

  // Eliminar meta → Supabase + estado
  const handleDeleteConfirm = async () => {
    if (!deletingGoal) return;

    try {
      const { error } = await createClient
        .from("meta_ahorro")
        .delete()
        .eq("id_meta", deletingGoal.id)
        .eq("id_usuario", userId);

      if (error) {
        console.error("Error eliminando meta:", error.message);
        // Aquí también podrías mostrar toast
      } else {
        setGoals((prev) => prev.filter((g) => g.id !== deletingGoal.id));
      }
    } catch (e: any) {
      console.error("Error inesperado eliminando meta:", e);
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingGoal(null);
    }
  };

  const handleDeleteClick = (goal: Goal) => {
    setDeletingGoal(goal);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setDeletingGoal(null);
  };

  const getStatusBadge = (status: "active" | "completed" | "expired") => {
    switch (status) {
      case "completed":
        return (
          <div className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm">
            <CheckCircle2 className="h-4 w-4" />
            Completada
          </div>
        );
      case "expired":
        return (
          <div className="flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1 rounded-full text-sm">
            <XCircle className="h-4 w-4" />
            No alcanzada
          </div>
        );
      case "active":
        return (
          <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-sm">
            <Clock className="h-4 w-4" />
            Activa
          </div>
        );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getDaysRemaining = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Vencida";
    if (diffDays === 0) return "Hoy";
    if (diffDays === 1) return "Mañana";
    return `${diffDays} días`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2>Metas de Ahorro</h2>
          <p className="text-gray-500">Gestiona tus objetivos financieros</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-green-600 hover:bg-green-700"
              disabled={loadingPortfolios || portfolios.length === 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Meta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Meta de Ahorro</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {portfoliosError && (
                <p className="text-sm text-red-600">{portfoliosError}</p>
              )}

              {goalsError && (
                <p className="text-sm text-red-600">{goalsError}</p>
              )}

              {portfolios.length === 0 &&
                !loadingPortfolios &&
                !portfoliosError && (
                  <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
                    No tienes carteras creadas todavía. Crea al menos una cartera
                    para poder asociarla a tus metas.
                  </p>
                )}

              {/* Nombre */}
              <div className="space-y-2">
                <Label htmlFor="goal-name">Nombre del Objetivo *</Label>
                <Input
                  id="goal-name"
                  placeholder="ej. Viaje a Japón, Fondo de emergencia"
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Cantidad */}
              <div className="space-y-2">
                <Label htmlFor="goal-amount">Cantidad Objetivo *</Label>
                <Input
                  id="goal-amount"
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  value={newGoalAmount}
                  onChange={(e) => setNewGoalAmount(e.target.value)}
                />
                {errors.amount && (
                  <p className="text-sm text-red-600">{errors.amount}</p>
                )}
              </div>

              {/* Fecha Límite */}
              <div className="space-y-2">
                <Label htmlFor="goal-deadline">Fecha Límite *</Label>
                <Input
                  id="goal-deadline"
                  type="date"
                  value={newGoalDeadline}
                  onChange={(e) => setNewGoalDeadline(e.target.value)}
                />
                {errors.deadline && (
                  <p className="text-sm text-red-600">{errors.deadline}</p>
                )}
              </div>

              {/* Cartera Asociada */}
              <div className="space-y-2">
                <Label htmlFor="goal-portfolio">Cartera Asociada *</Label>
                <Select
                  value={newGoalPortfolio}
                  onValueChange={setNewGoalPortfolio}
                >
                  <SelectTrigger id="goal-portfolio">
                    <SelectValue
                      placeholder={
                        loadingPortfolios
                          ? "Cargando carteras..."
                          : "Selecciona una cartera"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las carteras</SelectItem>
                    {portfolios.map((portfolio) => (
                      <SelectItem key={portfolio.id} value={portfolio.id}>
                        {portfolio.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.portfolio && (
                  <p className="text-sm text-red-600">{errors.portfolio}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreateGoal}
                className="bg-green-600 hover:bg-green-700"
                disabled={loadingPortfolios || portfolios.length === 0}
              >
                Crear Meta
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Resumen */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Metas Activas</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-blue-600">{activeGoalsCount}</div>
            <p className="text-xs text-gray-500">En progreso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Metas Completadas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-green-600">
              {updatedGoals.filter((g) => g.status === "completed").length}
            </div>
            <p className="text-xs text-gray-500">Objetivos alcanzados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Ahorrado</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-green-600">
              €
              {getTotalBalance().toLocaleString("es-ES", {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-gray-500">
              Saldo total en tus carteras
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Metas */}
      {updatedGoals.length === 0 ? (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <Target className="h-16 w-16 mx-auto text-gray-400" />
            <div>
              <h3 className="text-gray-700 mb-2">Sin metas de ahorro</h3>
              <p className="text-gray-500">
                Crea tu primera meta de ahorro para comenzar a alcanzar tus
                objetivos financieros usando el dinero que ya tienes en tus
                carteras.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {updatedGoals.map((goal) => {
            const progress =
              goal.targetAmount === 0
                ? 0
                : (goal.currentAmount / goal.targetAmount) * 100;
            const cappedProgress = Math.min(progress, 100);

            return (
              <Card
                key={goal.id}
                className={`${
                  goal.status === "completed"
                    ? "border-green-200 bg-green-50/30"
                    : goal.status === "expired"
                    ? "border-red-200 bg-red-50/30"
                    : "border-blue-200 bg-blue-50/30"
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Target
                          className={`h-5 w-5 ${
                            goal.status === "completed"
                              ? "text-green-600"
                              : goal.status === "expired"
                              ? "text-red-600"
                              : "text-blue-600"
                          }`}
                        />
                        <CardTitle>{goal.name}</CardTitle>
                      </div>
                      {getStatusBadge(goal.status)}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(goal)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progreso */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500">Progreso</span>
                      <span className="font-bold">
                        {cappedProgress.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all duration-300"
                        style={{ width: `${cappedProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Cantidades */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        Acumulado (dinero real)
                      </p>
                      <p className="font-bold text-green-600">
                        €
                        {goal.currentAmount.toLocaleString("es-ES", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Objetivo</p>
                      <p className="font-bold">
                        €
                        {goal.targetAmount.toLocaleString("es-ES", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Info adicional */}
                  <div className="pt-3 border-t border-gray-200 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Wallet className="h-4 w-4" />
                      {goal.portfolioName}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      {formatDate(goal.deadline)} (
                      {getDaysRemaining(goal.deadline)})
                    </div>
                  </div>

                  {/* Faltante */}
                  {goal.status === "active" &&
                    goal.currentAmount < goal.targetAmount && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-sm text-amber-800">
                          Faltan{" "}
                          <span className="font-bold">
                            €
                            {(
                              goal.targetAmount - goal.currentAmount
                            ).toLocaleString("es-ES", {
                              minimumFractionDigits: 2,
                            })}
                          </span>{" "}
                          para alcanzar tu meta
                        </p>
                      </div>
                    )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar meta de ahorro?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Seguro que deseas eliminar esta meta? Esta acción no se puede
              deshacer.
            </AlertDialogDescription>
            {deletingGoal && (
              <div className="bg-gray-50 rounded-lg p-3 mt-2">
                <p className="text-sm">
                  <span className="font-bold">{deletingGoal.name}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Objetivo: €
                  {deletingGoal.targetAmount.toLocaleString("es-ES", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar Meta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
