"use client";

import { useState, useEffect } from "react";
import { getCarteras, createCartera, editCartera, deleteCartera } from "@/services/carterasService";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Plus, Eye, TrendingUp, TrendingDown, ArrowLeft, Trash2, Pencil } from "lucide-react";
import { createIngreso, createGasto, calcularSaldoCartera, actualizarSaldoCartera, 
  getUltimosMovimientosUsuario, getUltimosMovimientosCartera, deleteTransaccionesCartera, getNumeroTransacciones, editGasto, editIngreso, deleteGasto, deleteIngreso } from "@/services/transaccionService";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { DollarSign, ShoppingCart, Edit } from "lucide-react";

interface PortfolioItem {
  id: number;
  name: string;
  balance: string;
  monthlyChange: string;
  trend: "up" | "down";
  transactions: number;
  lastUpdate: string;
}

interface PortfolioProps {
  userId: number;   
  selectedId?: number | null;
  previousView?: string;
  onNavigateBack?: (view: string) => void;
}

export function Portfolio({ selectedId, previousView = "home", onNavigateBack }: PortfolioProps) {
  const [portfolios, setPortfolios] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(1)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState<PortfolioItem | null>(null);
  const [newName, setNewName] = useState("");
  const [editError, setEditError] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingPortfolio, setDeletingPortfolio] = useState<PortfolioItem | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const [isIncomeDialogOpen, setIsIncomeDialogOpen] = useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);

  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeDate, setIncomeDate] = useState("");
  const [incomeDescription, setIncomeDescription] = useState("");

  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  const [ingresoCreado, setIngresoCreado] = useState(false);
  const [gastoCreado, setGastoCreado] = useState(false);
  
  const [isEditTransactionDialogOpen, setIsEditTransactionDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [editTransactionAmount, setEditTransactionAmount] = useState("");
  const [editTransactionDate, setEditTransactionDate] = useState("");
  const [editTransactionDescription, setEditTransactionDescription] = useState("");
  const [editTransactionCategory, setEditTransactionCategory] = useState("");

  const [isDeleteTransactionDialogOpen, setIsDeleteTransactionDialogOpen] = useState(false);
  const [deletingTransaction, setDeletingTransaction] = useState<any>(null);

  const [incomeErrors, setIncomeErrors] = useState({ amount: "", date: "" });
  const [expenseErrors, setExpenseErrors] = useState({ amount: "", category: "", date: "" });
  const [editTransactionErrors, setEditTransactionErrors] = useState({
    amount: "",
    date: "",
    category: "",
  });

  async function fetchWallets() {
    try {
      setLoading(true);
      const data = await getCarteras(userId);

      const formatted: PortfolioItem[] = await Promise.all(
        data.map(async (c) => {
          const { total } = await getNumeroTransacciones(c.id_usuario, c.nombre);
          return {
            id: c.id_usuario,
            name: c.nombre,
            balance: `${c.saldo.toLocaleString("es-ES", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}€`,
            monthlyChange: "0.00€",
            trend: "up" as const,
            transactions: total ?? 0,
            lastUpdate: "Ahora",
          };
        })
      );

      setPortfolios(formatted);
      return formatted;
    } catch (err) {
      console.error("Error al obtener carteras:", err);
      return [];
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchWallets();
  }, [userId]);


  const [selectedPortfolio, setSelectedPortfolio] = useState<PortfolioItem | null>(
  selectedId ? portfolios.find((p) => p.id === selectedId) || null : null
  );

  useEffect(() => {
    if (!selectedId) {
      setSelectedPortfolio(null);
    }
  }, [selectedId]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState("");
  const [newPortfolioBalance, setNewPortfolioBalance] = useState("");
  const [errors, setErrors] = useState({ name: "", balance: "" });

  const handleEditPortfolio = async () => {
    const nameRegex = /^[A-Za-z0-9_-]+$/;
    setEditError("");

    if (!editingPortfolio) return;

    if (!nameRegex.test(newName)) {
      setEditError("El nombre solo puede contener letras y números (sin espacios).");
      return;
    }

    try {
      const { data, error } = await editCartera(userId, editingPortfolio.name, newName);

      if (error) {
        setEditError(error);
        return;
      }

      setPortfolios((prev) =>
        prev.map((p) =>
          p.name === editingPortfolio.name ? { ...p, name: data!.nombre } : p
        )
      );

      setIsEditDialogOpen(false);
      setEditingPortfolio(null);
      setNewName("");
    } catch (err) {
      console.error("Error actualizando cartera:", err);
      setEditError("Error inesperado al actualizar la cartera.");
    }
  };

  const handleDeletePortfolio = async () => {
    if (!deletingPortfolio) return;

    try {
      setDeleteError("");

      const { success: transSuccess, error: transError } = await deleteTransaccionesCartera(
        deletingPortfolio.id,
        deletingPortfolio.name
      );

      if (!transSuccess) {
        console.error("Error al eliminar transacciones:", transError);
        setDeleteError("No se pudieron eliminar las transacciones asociadas.");
        return;
      }

      await deleteCartera(deletingPortfolio.id, deletingPortfolio.name);

      setPortfolios((prev: PortfolioItem[]) =>
        prev.filter((c: PortfolioItem) => c.name !== deletingPortfolio.name)
      );

      setIsDeleteDialogOpen(false);
      setDeletingPortfolio(null);
    } catch (err: any) {
      console.error("Error al eliminar cartera:", err);
      setDeleteError("Ocurrió un error al eliminar la cartera.");
    }
  };

  const handleAddPortfolio = async () => {
    const nameRegex = /^[A-Za-z0-9_-]+$/; 
    const balanceRegex = /^\d+(\.\d{1,2})?$/; 

    let valid = true;
    const newErrors = { name: "", balance: "" };

    if (!nameRegex.test(newPortfolioName)) {
      newErrors.name = "El nombre solo puede contener letras y números (sin espacios).";
      valid = false;
    }

    const balanceValue = parseFloat(parseFloat(newPortfolioBalance).toFixed(2));
    if (!balanceRegex.test(newPortfolioBalance) || balanceValue < 0) {
      newErrors.balance = "Debe ser un número mayor o igual que 0 con hasta 2 decimales.";
      valid = false;
    }

    setErrors(newErrors);
    if (!valid) return;

    try {
      const { data: nueva, error } = await createCartera(newPortfolioName, balanceValue, userId);

      if (error) {
        setErrors({ name: error, balance: "" });
        return;
      }

      if (!nueva) return

      const newPortfolio: PortfolioItem = {
        id: portfolios.length + 1,
        name: nueva.nombre,
        balance: `${nueva.saldo.toLocaleString("es-ES", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}€`,
        monthlyChange: "0.00€",
        trend: "up",
        transactions: 0,
        lastUpdate: "Ahora",
      };

      setPortfolios((prev) => [...prev, newPortfolio]);
      setNewPortfolioName("");
      setNewPortfolioBalance("");
      setErrors({ name: "", balance: "" });
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error("Error creando cartera:", error);

      if (error.message.includes("duplicate key")) {
        setErrors({
          name: "Ya existe una cartera con ese nombre para este usuario.",
          balance: "",
        });
      } else if (error.message.includes("Ya existe")) {
        setErrors({
          name: "Ya existe una cartera con ese nombre.",
          balance: "",
        });
      } else {
        alert("Ocurrió un error inesperado al crear la cartera.");
      }
    }
  };

  const handleAddIncome = async () => {
    const newErrors = { amount: "", date: "" };
    setIncomeErrors(newErrors);

    if (!selectedPortfolio) return;

    const importe = parseFloat(parseFloat(incomeAmount).toFixed(2));

    if (isNaN(importe) || importe <= 0) {
      newErrors.amount = "Debe ser un número mayor o igual que 0 con hasta 2 decimales.";
    }

    if (!incomeDate) {
     newErrors.date = "La fecha es obligatoria.";
    }

    if (newErrors.amount || newErrors.date) {
      setIncomeErrors(newErrors);
      return;
    }

    try {

      const ingreso = {
        cartera_nombre: selectedPortfolio.name,
        id_usuario: userId,
        importe,
        fecha: incomeDate, // formato yyyy-mm-dd
        descripcion: incomeDescription || "Ingreso",
      };

      const { error } = await createIngreso(ingreso);
      if (error) {
        newErrors.amount = "Error al registrar el ingreso. Inténtalo de nuevo.";
        setIncomeErrors(newErrors);
        return;
      }

      const { total } = await getNumeroTransacciones(
        selectedPortfolio.id,
        selectedPortfolio.name
      );
      setSelectedPortfolio((prev) =>
        prev ? { ...prev, transactions: total } : prev
      );
      setIngresoCreado((prev) => !prev);

      const nuevoSaldo = await calcularSaldoCartera(selectedPortfolio.name, userId);
      await actualizarSaldoCartera(
        selectedPortfolio.name,
        userId,
        importe,
        "ingreso"
      );

      setPortfolios((prev) =>
        prev.map((p) =>
          p.name === selectedPortfolio.name
            ? {
                ...p,
                balance: `${nuevoSaldo.toLocaleString("es-ES", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}€`,
                transactions: p.transactions + 1,
                lastUpdate: "Ahora",
              }
            : p
        )
      );

      setIncomeAmount("");
      setIncomeDate("");
      setIncomeDescription("");
      setIsIncomeDialogOpen(false);
      setConfirmMessage("Ingreso registrado correctamente");
      setIsConfirmDialogOpen(true);

    } catch (err) {
      console.error("Error inesperado:", err);
      setIncomeErrors({ ...newErrors, amount: "Ocurrió un error inesperado." });
    }
  };

const handleAddExpense = async () => {
  const newErrors = { amount: "", category: "", date: "" };
  setExpenseErrors(newErrors);

  if (!selectedPortfolio) return;

  const importe = parseFloat(parseFloat(expenseAmount).toFixed(2));
  if (isNaN(importe) || importe <= 0) {
    newErrors.amount = "Debe ser un número mayor o igual que 0 con hasta 2 decimales.";
  }

  if (!expenseCategory) {
    newErrors.category = "Debes seleccionar una categoría.";
  }

  if (!expenseDate) {
    newErrors.date = "La fecha es obligatoria.";
  }

  if (newErrors.amount || newErrors.category || newErrors.date) {
    setExpenseErrors(newErrors);
    return;
  }

  try {
    if (!selectedPortfolio) return;

    const gasto = {
      cartera_nombre: selectedPortfolio.name,
      id_usuario: userId,
      categoria_nombre: expenseCategory.toLowerCase(),
      importe,
      fecha: expenseDate,
      descripcion: expenseDescription || "Gasto",
      fijo: false,
    };

    const { error } = await createGasto(gasto);
    if (error) {
      newErrors.amount = "Error al registrar el gasto. Inténtalo más tarde.";
      setExpenseErrors(newErrors);
      return;
    }

    const { total } = await getNumeroTransacciones(
      selectedPortfolio.id,
      selectedPortfolio.name
    );
    setSelectedPortfolio((prev) =>
      prev ? { ...prev, transactions: total } : prev
    );
    setGastoCreado((prev) => !prev);

    const nuevoSaldo = await calcularSaldoCartera(selectedPortfolio.name, userId);
    await actualizarSaldoCartera(
      selectedPortfolio.name,
      userId,
      importe,
      "gasto"
    );

    setPortfolios((prev) =>
      prev.map((p) =>
        p.name === selectedPortfolio.name
          ? {
              ...p,
              balance: `${nuevoSaldo.toLocaleString("es-ES", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}€`,
              transactions: p.transactions + 1,
              lastUpdate: "Ahora",
            }
          : p
      )
    );

    setExpenseAmount("");
    setExpenseCategory("");
    setExpenseDate("");
    setExpenseDescription("");
    setIsExpenseDialogOpen(false);
    setConfirmMessage("Gasto registrado correctamente");
    setIsConfirmDialogOpen(true);

  } catch (err) {
    console.error("Error inesperado:", err);
    setExpenseErrors({ ...newErrors, amount: "Ocurrió un error inesperado." });
  }
};

useEffect(() => {
  async function fetchMovements() {
    if (!selectedPortfolio) return;
    try {
      const { data, error } = await getUltimosMovimientosCartera(userId, selectedPortfolio.name);
      if (error) {
        console.error("Error obteniendo movimientos de cartera:", error);
        return;
      }
      setRecentTransactions(data || []);
    } catch (err) {
      console.error("Error inesperado al obtener movimientos:", err);
    }
  }

  fetchMovements();
}, [selectedPortfolio, userId]);

useEffect(() => {
  async function fetchTransactionsCount() {
    if (!selectedPortfolio) return;

    const { total, error } = await getNumeroTransacciones(
      selectedPortfolio.id,   // id_usuario
      selectedPortfolio.name  // nombre de la cartera
    );

    if (!error) {
      setSelectedPortfolio((prev) =>
        prev ? { ...prev, transactions: total } : prev
      );
    } else {
      console.error("Error al obtener número de transacciones:", error);
    }
  }

  fetchTransactionsCount();
}, [selectedPortfolio?.name, ingresoCreado, gastoCreado]);

const handleSaveEditTransaction = async () => {

  const newErrors = { amount: "", date: "", category: "" };
  setEditTransactionErrors(newErrors);

  if (!editingTransaction || !selectedPortfolio) return;

  const importe = parseFloat(editTransactionAmount);
  if (isNaN(importe) || importe <= 0) {
    newErrors.amount = "Debe ser un número mayor o igual que 0 con hasta 2 decimales.";
  }

  if (!editTransactionDate) {
    newErrors.date = "La fecha es obligatoria.";
  }

  if (editingTransaction.type === "expense" && !editTransactionCategory) {
    newErrors.category = "Debes seleccionar una categoría.";
  }

  if (newErrors.amount || newErrors.date || newErrors.category) {
    setEditTransactionErrors(newErrors);
    return;
  }

  const fecha = editTransactionDate;
  const descripcion = editTransactionDescription;

  try {
    if (editingTransaction.type === "income") {
      const {error} = await editIngreso(
        editingTransaction.id_movimiento,
        userId,
        selectedPortfolio.name,
        importe,
        descripcion,
        fecha
      );
      if (error) {
        newErrors.amount = "Error al actualizar el ingreso. Inténtalo más tarde.";
        setEditTransactionErrors(newErrors);
        return;
      }
    } else {
      const {error} = await editGasto(
        editingTransaction.id_movimiento,
        userId,
        selectedPortfolio.name,
        importe,
        descripcion,
        fecha,
        editTransactionCategory
      );
      if (error) {
        newErrors.amount = "Error al actualizar el gasto. Inténtalo más tarde.";
        setEditTransactionErrors(newErrors);
        return;
      }
    }

    // Refrescar cartera y movimientos
    const updatedWallets = await fetchWallets();
    const updated = updatedWallets.find((p) => p.name === selectedPortfolio.name);
    if (updated) setSelectedPortfolio(updated);

    const movimientosActualizados = await getUltimosMovimientosCartera(userId, selectedPortfolio.name);
    setRecentTransactions(movimientosActualizados.data || []);

    setIsEditTransactionDialogOpen(false);
  } catch (err) {
    console.error("Error al guardar edición:", err);
    setEditTransactionErrors({
      ...newErrors,
      amount: "Ocurrió un error inesperado al guardar los cambios.",
    });

  }
};

const handleConfirmDeleteTransaction = async () => {
  if (!deletingTransaction || !selectedPortfolio) return;

  try {
    if (deletingTransaction.type === "income") {
      await deleteIngreso(
        userId,
        selectedPortfolio.name,
        deletingTransaction.id_movimiento
      );
    } else {
      await deleteGasto(
        userId,
        selectedPortfolio.name,
        deletingTransaction.id_movimiento
      );
    }

    // Recalcular y refrescar datos
    const updatedWallets = await fetchWallets();
    const updated = updatedWallets.find((p) => p.name === selectedPortfolio.name);
    if (updated) setSelectedPortfolio(updated);
    
    const movimientosActualizados = await getUltimosMovimientosCartera(userId, selectedPortfolio.name);
    console.log("Movimientos actualizados después de eliminar:", movimientosActualizados);
    setRecentTransactions(movimientosActualizados.data || []);

    setIsDeleteTransactionDialogOpen(false);
  } catch (err) {
    console.error("Error al eliminar transacción:", err);
  }
};

if (selectedPortfolio) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (selectedId) {
                if (onNavigateBack) {
                  onNavigateBack(previousView);
                } else {
                  setSelectedPortfolio(null);
                }
              } else {
                setSelectedPortfolio(null);
              }
            }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2>{selectedPortfolio.name}</h2>
            <p className="text-gray-500">Detalles de la cartera</p>
          </div>
        </div>

        {/* NUEVO: botones de Ingreso y Gasto */}
        <div className="flex gap-2">
          <Dialog open={isIncomeDialogOpen} onOpenChange={setIsIncomeDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <DollarSign className="h-4 w-4" />
                Añadir Ingreso
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Ingreso</DialogTitle>
                <DialogDescription>
                  Completa los campos para registrar un nuevo ingreso en tu cartera.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="income-amount">Importe</Label>
                  <Input
                    id="income-amount"
                    type="number"
                    placeholder="0.00"
                    value={incomeAmount}
                    onChange={(e) => setIncomeAmount(e.target.value)}
                  />
                  {incomeErrors.amount && (
                    <p className="text-red-500 text-sm">{incomeErrors.amount}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="income-date">Fecha</Label>
                  <Input
                    id="income-date"
                    type="date"
                    value={incomeDate}
                    onChange={(e) => setIncomeDate(e.target.value)}
                  />
                  {incomeErrors.date && (
                    <p className="text-red-500 text-sm">{incomeErrors.date}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="income-description">Descripción (opcional)</Label>
                  <Textarea
                    id="income-description"
                    placeholder="Ej: Salario mensual, freelance..."
                    value={incomeDescription}
                    onChange={(e) => setIncomeDescription(e.target.value)}
                  />
                </div>
                <Button onClick={handleAddIncome} className="w-full">
                  Registrar Ingreso
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <ShoppingCart className="h-4 w-4" />
                Añadir Gasto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Gasto</DialogTitle>
                <DialogDescription>
                  Completa los campos para registrar un nuevo gasto en tu cartera.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="expense-amount">Importe</Label>
                  <Input
                    id="expense-amount"
                    type="number"
                    placeholder="0.00"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                  />
                  {expenseErrors.amount && (
                    <p className="text-red-500 text-sm">{expenseErrors.amount}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-category">Categoría</Label>
                  <Select value={expenseCategory} onValueChange={setExpenseCategory}>
                    <SelectTrigger id="expense-category">
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ocio">Ocio</SelectItem>
                      <SelectItem value="Hogar">Hogar</SelectItem>
                      <SelectItem value="Transporte">Transporte</SelectItem>
                      <SelectItem value="Comida">Comida</SelectItem>
                      <SelectItem value="Factura">Factura</SelectItem>
                    </SelectContent>
                  </Select>
                  {expenseErrors.category && (
                    <p className="text-red-500 text-sm">{expenseErrors.category}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-date">Fecha</Label>
                  <Input
                    id="expense-date"
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                  />
                  {expenseErrors.date && (
                    <p className="text-red-500 text-sm">{expenseErrors.date}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-description">Descripción (opcional)</Label>
                  <Textarea
                    id="expense-description"
                    placeholder="Ej: Supermercado, gasolina..."
                    value={expenseDescription}
                    onChange={(e) => setExpenseDescription(e.target.value)}
                  />
                </div>
                <Button onClick={handleAddExpense} className="w-full">
                  Registrar Gasto
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Balance Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedPortfolio.balance}</div>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
              {selectedPortfolio.trend === "up" ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span
                className={
                  selectedPortfolio.trend === "up" ? "text-green-600" : "text-red-600"
                }
              >
                {selectedPortfolio.monthlyChange}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Transacciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {selectedPortfolio.transactions}
            </div>
            <p className="text-xs text-gray-500 mt-1">Este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Última Actualización</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">●</div>
            <p className="text-xs text-gray-500 mt-1">
              {selectedPortfolio.lastUpdate}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transacciones Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
           {recentTransactions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No hay movimientos registrados todavía.
              </p>
            ) : (
              recentTransactions.map((transaction, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-4 border-b last:border-0 pb-3 last:pb-0 group"
                >
                  <div className="flex-1">
                    <p className="font-semibold">
                      {transaction.descripcion || "Movimiento"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {transaction.tipo === "ingreso" ? "Ingreso" : "Gasto"} 
                      {transaction.tipo === "gasto" && transaction.categoria_nombre
                        ? ` · ${transaction.categoria_nombre.charAt(0).toUpperCase() + transaction.categoria_nombre.slice(1)}`
                        : ""}
                      {" · "}
                      {new Date(transaction.fecha).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                   
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p
                        className={`font-bold ${
                          transaction.tipo === "ingreso"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.tipo === "ingreso" ? "+" : "-"}
                        {Number(Math.abs(transaction.importe)).toLocaleString("es-ES", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}€
                      </p>
                    </div>
                      {/* Botones de acción */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Editar movimiento" 
                          className="h-8 w-8"
                          onClick={() => {
                            setEditingTransaction({
                              ...transaction,
                              type: transaction.tipo === "ingreso" ? "income" : "expense",
                            });
                            setEditTransactionAmount(transaction.importe.toString());
                            setEditTransactionDate(transaction.fecha.split("T")[0]);
                            setEditTransactionDescription(transaction.descripcion || "");
                            if (transaction.tipo === "gasto") {
                              setEditTransactionCategory(transaction.categoria_nombre || "");
                            }
                            setIsEditTransactionDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                          
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Eliminar movimiento" 
                          onClick={() => {
                            setDeletingTransaction({
                              ...transaction,
                              type: transaction.tipo === "ingreso" ? "income" : "expense",
                            });
                            setIsDeleteTransactionDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                      </div>
                  </div>
              ))
            )}

          </div>
        </CardContent>
      </Card>
      {/* Edit Transaction Dialog */}
      <Dialog open={isEditTransactionDialogOpen} onOpenChange={setIsEditTransactionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Editar {editingTransaction?.type === "income" ? "Ingreso" : "Gasto"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-amount">Importe</Label>
              <Input
                id="edit-amount"
                type="number"
                placeholder="0.00"
                step="0.01"
                value={editTransactionAmount}
                onChange={(e) => {
                  setEditTransactionAmount(e.target.value);
                }}
              />
              {editTransactionErrors.amount && (
                <p className="text-red-500 text-sm">{editTransactionErrors.amount}</p>
              )}
            </div>

            {editingTransaction?.type === "expense" && (
              <div className="space-y-2">
                <Label htmlFor="edit-category">Categoría</Label>
                <Select value={editTransactionCategory} onValueChange={setEditTransactionCategory}>
                  <SelectTrigger id="edit-category">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ocio">Ocio</SelectItem>
                    <SelectItem value="Hogar">Hogar</SelectItem>
                    <SelectItem value="Transporte">Transporte</SelectItem>
                    <SelectItem value="Comida">Comida</SelectItem>
                    <SelectItem value="Factura">Factura</SelectItem>
                  </SelectContent>
                </Select>
                {editTransactionErrors.category && (
                  <p className="text-red-500 text-sm">{editTransactionErrors.category}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-date">Fecha</Label>
              <Input
                id="edit-date"
                type="date"
                value={editTransactionDate}
                onChange={(e) => setEditTransactionDate(e.target.value)}
              />
              {editTransactionErrors.date && (
                <p className="text-red-500 text-sm">{editTransactionErrors.date}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Descripción (opcional)</Label>
              <Textarea
                id="edit-description"
                placeholder="Ej: Salario mensual, Freelance..."
                value={editTransactionDescription}
                onChange={(e) => setEditTransactionDescription(e.target.value)}
                maxLength={256}
              />
              <p className="text-xs text-gray-500">
                {editTransactionDescription.length}/256 caracteres
              </p>
            </div>

            <Button onClick={handleSaveEditTransaction} className="w-full">
              Guardar Cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Transaction Alert Dialog */}
      <AlertDialog open={isDeleteTransactionDialogOpen} onOpenChange={setIsDeleteTransactionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Deseas eliminar este movimiento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente
              {deletingTransaction?.type === "income" ? "el ingreso" : "el gasto"} de &quot;
              {deletingTransaction?.descripcion}&quot; por un importe de $
              {Math.abs(
                parseFloat(
                  (deletingTransaction?.importe?.toString() || "0")
                    .replace(/[+\-$]/g, "")
                )
              ).toFixed(2)}.
              El balance de la cartera se actualizará automáticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteTransaction}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar Movimiento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Popup de confirmación */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="text-center">
          <DialogHeader>
            <DialogTitle className="text-green-600">{confirmMessage}</DialogTitle>
            <DialogDescription>
              Los datos se han guardado correctamente.
            </DialogDescription>
          </DialogHeader>
          <Button
            className="mt-4 w-full"
            onClick={async () => {
              setIsConfirmDialogOpen(false);

              const updatedWallets = await fetchWallets(); 
              const updated = updatedWallets.find(
                (p) => p.name === selectedPortfolio?.name
              );
              if (updated) setSelectedPortfolio(updated); 
            }}
          >
            Aceptar
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Mis Carteras</h2>
          <p className="text-gray-500">Gestiona tus carteras de dinero</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Añadir Cartera
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Cartera</DialogTitle>
              <DialogDescription>
                Introduce el nombre y el saldo inicial de la nueva cartera.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {/* Nombre */}
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la Cartera</Label>
                <Input
                  id="name"
                  placeholder="Sin caracteres especiales ni espacios"
                  value={newPortfolioName}
                  onChange={(e) => setNewPortfolioName(e.target.value)}
                />
                {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
              </div>

              {/* Balance */}
              <div className="space-y-2">
                <Label htmlFor="balance">Balance Inicial</Label>
                <Input
                  id="balance"
                  type="number"
                  placeholder="0.00 (mayor a 0)"
                  value={newPortfolioBalance}
                  onChange={(e) => setNewPortfolioBalance(e.target.value)}
                />
                {errors.balance && <p className="text-red-500 text-sm">{errors.balance}</p>}
              </div>

              <Button onClick={handleAddPortfolio} className="w-full">
                Crear Cartera
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Cartera</DialogTitle>
              <DialogDescription>
                Cambia el nombre de tu cartera.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="editName">Nuevo nombre</Label>
                <Input
                  id="editName"
                  placeholder="Nuevo nombre de la cartera"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
                {editError && <p className="text-red-500 text-sm">{editError}</p>}
              </div>

              <Button onClick={handleEditPortfolio} className="w-full">
                Guardar Cambios
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar eliminación</DialogTitle>
              <DialogDescription>
                Confirma la eliminación de la cartera.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <p className="text-sm text-gray-600">
                ¿Estás seguro de que deseas eliminar la cartera{" "}
                <span className="font-semibold">{deletingPortfolio?.name}</span> y todas sus transacciones asociadas? <br />
                <span className="font-bold">Esta acción no se puede deshacer.</span>
              </p>

              {deleteError && <p className="text-red-500 text-sm">{deleteError}</p>}

              <div className="flex gap-3">
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleDeletePortfolio}
                >
                  Sí, eliminar
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsDeleteDialogOpen(false);
                    setDeletingPortfolio(null);
                    setDeleteError("");
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {portfolios.length === 0 ? (
          <div className="flex items-center justify-start">
            <p className="text-lg md:text-xl font-semibold text-gray-500 text-left">
              No hay carteras registradas aún.
            </p>
          </div>
        ) : (
          portfolios.map((portfolio) => (
          <Card key={`${portfolio.name}-${userId}`} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{portfolio.name}</span>
                {portfolio.trend === "up" ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Balance</p>
                <p className="text-2xl font-bold">{portfolio.balance}</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Cambio Mensual</p>
                  <p className={`${portfolio.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                    {portfolio.monthlyChange}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Transacciones</p>
                  <p>{portfolio.transactions}</p>
                </div>
              </div>
              <div className="pt-2 border-t space-y-2">
                <p className="text-xs text-gray-500">{portfolio.lastUpdate}</p>
                <div className="flex gap-2">  
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    title="Ver cartera" 
                    onClick={() => setSelectedPortfolio(portfolio)}
                  >
                    <Eye className="h-4 w-4" />
                    Ver
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    title="Editar cartera" 
                    onClick={() => {
                      setEditingPortfolio(portfolio);
                      setNewName(portfolio.name);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    title="Eliminar cartera" 
                    size="icon"
                    className="group hover:bg-red-600 hover:text-white"
                    onClick={() => {
                      setDeletingPortfolio(portfolio);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-600 group-hover:text-white" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
        )}
      </div>
    </div>
  );
}
