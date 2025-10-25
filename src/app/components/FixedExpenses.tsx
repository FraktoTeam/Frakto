"use client";

import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { Plus, Edit, Trash2, Repeat, Calendar, Wallet, Play, Pause } from "lucide-react";

interface FixedExpense {
  id: number;
  portfolioId: number;
  portfolioName: string;
  amount: string;
  category: string;
  frequency: number;
  startDate: string;
  description: string;
  status: "activo" | "pausado";
  lastGenerated?: string;
}

export function FixedExpenses() {
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([
    {
      id: 1,
      portfolioId: 1,
      portfolioName: "Cartera Personal",
      amount: "1200.00",
      category: "Hogar",
      frequency: 30,
      startDate: "2025-10-01",
      description: "Alquiler mensual",
      status: "activo",
      lastGenerated: "2025-10-01",
    },
    {
      id: 2,
      portfolioId: 1,
      portfolioName: "Cartera Personal",
      amount: "45.99",
      category: "Factura",
      frequency: 30,
      startDate: "2025-10-05",
      description: "Suscripción Netflix",
      status: "activo",
      lastGenerated: "2025-10-05",
    },
  ]);

  const [portfolios] = useState([
    { id: 1, name: "Cartera Personal" },
    { id: 2, name: "Cartera Ahorros" },
    { id: 3, name: "Cartera Gastos" },
    { id: 4, name: "Cartera Emergencias" },
  ]);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [selectedPortfolioId, setSelectedPortfolioId] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [frequency, setFrequency] = useState("");
  const [startDate, setStartDate] = useState("");
  const [description, setDescription] = useState("");

  const [editingExpense, setEditingExpense] = useState<FixedExpense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<FixedExpense | null>(null);

  const [formErrors, setFormErrors] = useState<string[]>([]);

  const validateForm = (portfolioId: string, amt: string, cat: string, freq: string, date: string, desc: string) => {
    const errors: string[] = [];

    if (!portfolioId) errors.push("Debes seleccionar una cartera");

    const amountValue = parseFloat(amt);
    if (!amt || isNaN(amountValue) || amountValue <= 0) {
      errors.push("El importe debe ser un número mayor que 0");
    } else if (!/^\d+(\.\d{1,2})?$/.test(amt)) {
      errors.push("El importe debe tener máximo 2 decimales");
    }

    if (!cat) errors.push("Debes seleccionar una categoría");

    const freqValue = parseInt(freq);
    if (!freq || isNaN(freqValue) || freqValue < 1 || !Number.isInteger(freqValue)) {
      errors.push("La frecuencia debe ser un número entero mayor o igual a 1");
    }

    if (!date) {
      errors.push("Debes seleccionar una fecha de inicio");
    } else {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) errors.push("La fecha de inicio debe ser igual o posterior a hoy");
    }

    if (desc.length > 256) errors.push("La descripción no puede tener más de 256 caracteres");

    return errors;
  };

  const resetForm = () => {
    setSelectedPortfolioId("");
    setAmount("");
    setCategory("");
    setFrequency("");
    setStartDate("");
    setDescription("");
    setFormErrors([]);
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      "Ocio": "bg-purple-100 text-purple-700",
      "Hogar": "bg-blue-100 text-blue-700",
      "Transporte": "bg-yellow-100 text-yellow-700",
      "Comida": "bg-orange-100 text-orange-700",
      "Factura": "bg-red-100 text-red-700",
    };
    return colors[category] || "bg-gray-100 text-gray-700";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const handleCreateExpense = () => {
    const errors = validateForm(selectedPortfolioId, amount, category, frequency, startDate, description);
    if (errors.length > 0) return setFormErrors(errors);

    const portfolio = portfolios.find(p => p.id === parseInt(selectedPortfolioId));
    if (!portfolio) return;

    const newExpense: FixedExpense = {
      id: Date.now(),
      portfolioId: parseInt(selectedPortfolioId),
      portfolioName: portfolio.name,
      amount: parseFloat(amount).toFixed(2),
      category,
      frequency: parseInt(frequency),
      startDate,
      description: description || "Gasto fijo",
      status: "activo",
    };

    setFixedExpenses([newExpense, ...fixedExpenses]);
    setIsCreateDialogOpen(false);
    resetForm();
  };

  const handleToggleStatus = (expense: FixedExpense) => {
    const newStatus = expense.status === "activo" ? "pausado" : "activo";
    setFixedExpenses(fixedExpenses.map(e => e.id === expense.id ? { ...e, status: newStatus } : e));
  };

  const handleDeleteExpense = (expense: FixedExpense) => {
    setDeletingExpense(expense);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deletingExpense) {
      setFixedExpenses(fixedExpenses.filter(e => e.id !== deletingExpense.id));
      setIsDeleteDialogOpen(false);
      setDeletingExpense(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Gastos Fijos</h2>
          <p className="text-gray-500">Gestiona tus gastos recurrentes automáticos</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Añadir Gasto Fijo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nuevo Gasto Fijo</DialogTitle>
            </DialogHeader>
            <div className="max-h-[70vh] overflow-y-auto space-y-4 pt-4 pr-4">
              {formErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800 font-semibold mb-1">Errores de validación:</p>
                  <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                    {formErrors.map((error, index) => <li key={index}>{error}</li>)}
                  </ul>
                </div>
              )}
              {/* Inputs básicos */}
              <div className="space-y-2">
                <Label>Cartera *</Label>
                <Select value={selectedPortfolioId} onValueChange={setSelectedPortfolioId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una cartera" />
                  </SelectTrigger>
                  <SelectContent>
                    {portfolios.map(p => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Importe *</Label>
                <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Categoría *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
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
              </div>
              <div className="space-y-2">
                <Label>Frecuencia (días) *</Label>
                <Input type="number" min="1" step="1" value={frequency} onChange={e => setFrequency(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Fecha de inicio *</Label>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Descripción (opcional)</Label>
                <Textarea
                  placeholder="Ej: Alquiler mensual..."
                  maxLength={256}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>
              <Button onClick={handleCreateExpense} className="w-full">Crear Gasto Fijo</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Listado */}
      {fixedExpenses.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Repeat className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No tienes gastos fijos configurados</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {fixedExpenses.map((expense) => (
            <Card key={expense.id} className={expense.status === "pausado" ? "opacity-60" : ""}>
              <CardContent className="p-6 flex justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Repeat className={`h-5 w-5 ${expense.status === "activo" ? "text-green-600" : "text-gray-400"}`} />
                    <h3>{expense.description}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(expense.category)}`}>
                      {expense.category}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${expense.status === "activo" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {expense.status === "activo" ? "Activo" : "Pausado"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Cartera</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Wallet className="h-3 w-3 text-gray-400" />
                        <p>{expense.portfolioName}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-500">Importe</p>
                      <p className="text-red-600 font-bold mt-1">-${expense.amount}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Frecuencia</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <p>Cada {expense.frequency} días</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-500">Inicio</p>
                      <p className="mt-1">{formatDate(expense.startDate)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="icon" onClick={() => handleToggleStatus(expense)}>
                    {expense.status === "activo" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => handleDeleteExpense(expense)}>
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Deseas eliminar este gasto fijo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el gasto fijo "{deletingExpense?.description}" de ${deletingExpense?.amount}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
