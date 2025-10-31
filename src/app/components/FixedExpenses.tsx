"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { createGastoFijo, deleteGastoFijo, evaluarRiesgoGastoFijo, getGastosFijos, toggleGastoFijoActivo, updateGastoFijo } from "@/services/gastoFijoService";
import { getCarteras } from "@/services/carterasService";
import { ScrollArea } from "./ui/scroll-area";
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
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);


  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [frequency, setFrequency] = useState("");
  const [startDate, setStartDate] = useState("");
  const [description, setDescription] = useState("");
  const [userId, setUserId] = useState(1);

  const [editingExpense, setEditingExpense] = useState<FixedExpense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<FixedExpense | null>(null);

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");

  const [formErrors, setFormErrors] = useState<string[]>([]);

  useEffect(() => {
    const fetchPortfolios = async () => {
      try {
        const data = await getCarteras(userId);
        setPortfolios(data || []);
      } catch (error) {
        console.error("Error obteniendo carteras:", error);
      }
    };

    fetchPortfolios();
  }, [userId]);

  useEffect(() => {
    const fetchFixedExpenses = async () => {
      try {
        const data = await getGastosFijos(userId);
        // Adaptamos el formato del backend al frontend
        const mappedExpenses: FixedExpense[] = data.map((gasto) => ({
          id: gasto.id_gasto!,
          portfolioId: gasto.id_usuario, // o id_cartera si lo tienes
          portfolioName: gasto.cartera_nombre,
          amount: gasto.importe.toFixed(2),
          category: gasto.categoria_nombre,
          frequency: gasto.frecuencia,
          startDate: gasto.fecha_inicio,
          description: gasto.descripcion || "Gasto fijo",
          status: gasto.activo ? "activo" : "pausado",
          lastGenerated: gasto.lastGenerated // Aquí podrías mapear la fecha del último cargo si la tienes
        }));
        setFixedExpenses(mappedExpenses);
      } catch (error) {
        console.error("Error obteniendo gastos fijos:", error);
      }
    };

    fetchFixedExpenses();
  }, []);


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

  const handleCreateExpense = async () => {
    const categoryLower = category.toLowerCase();
    const errors = validateForm(selectedPortfolioId, amount, categoryLower, frequency, startDate, description);
    console.log("Creando gasto con atributos: ", {
      cartera_nombre: selectedPortfolioId,
      id_usuario: 1,
      categoria_nombre: categoryLower,
      importe: parseFloat(amount),
      fecha_inicio: startDate,
      frecuencia: parseInt(frequency),
      descripcion: description || "Gasto fijo",
    });
    if (errors.length > 0) {
      return setFormErrors(errors);
    }

    const portfolio = portfolios.find(p => p.nombre === selectedPortfolioId);
    if (!portfolio) return;
    try {
      const { data, error } = await createGastoFijo({
        cartera_nombre: portfolio.nombre,
        id_usuario: 1, 
        categoria_nombre: categoryLower,
        importe: parseFloat(amount),
        fecha_inicio: startDate,
        frecuencia: parseInt(frequency),
        activo: true,
        descripcion: description || "Gasto fijo",
      });

      if (error || !data) {
        setFormErrors([error || "Error desconocido al crear gasto fijo"]);
        return;
      }

      // 🔄 Adaptamos el formato del backend al formato del frontend
      const newExpense: FixedExpense = {
        id: data.id_gasto!, // campo de la BD
        portfolioId: data.id_usuario, // o el id_cartera si lo tienes
        portfolioName: data.cartera_nombre,
        amount: data.importe.toFixed(2),
        category: data.categoria_nombre,
        frequency: data.frecuencia,
        startDate: data.fecha_inicio,
        description: data.descripcion || "Gasto fijo",
        status: "activo",
        lastGenerated: data.lastGenerated, // Aquí podrías mapear la fecha del último cargo si la tienes
      };

      setFixedExpenses([newExpense, ...fixedExpenses]);
      setIsCreateDialogOpen(false);
      resetForm();
      
      setConfirmMessage("Gasto fijo creado correctamente");
      setIsConfirmDialogOpen(true);
    } catch (err) {
      console.error("Error al crear gasto fijo:", err);
      setFormErrors(["Hubo un error al crear el gasto fijo"]);
    }
  };

  const handleEditExpense = (expense: FixedExpense) => {
    setEditingExpense(expense);
    setSelectedPortfolioId(expense.portfolioName.toString());
    setAmount(expense.amount);
    setCategory(expense.category.toLowerCase());
    setFrequency(expense.frequency.toString());
    setStartDate(expense.startDate);
    setDescription(expense.description);
    setFormErrors([]);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingExpense) return;

    const categoryLower = category.toLowerCase();
    const errors = validateForm(selectedPortfolioId, amount, categoryLower, frequency, startDate, description);
    console.log("Creando gasto con atributos: ", {
      cartera_nombre: selectedPortfolioId,
      id_usuario: 1,
      categoria_nombre: categoryLower,
      importe: parseFloat(amount),
      fecha_inicio: startDate,
      frecuencia: parseInt(frequency),
      descripcion: description || "Gasto fijo",
    });
    if (errors.length > 0) return setFormErrors(errors);

    const portfolio = portfolios.find(p => p.nombre === selectedPortfolioId);
    if (!portfolio) return;

    try {
      const { success, error } = await updateGastoFijo(editingExpense.id, {
        cartera_nombre: portfolio.nombre,
        id_usuario: portfolio.id_usuario,
        categoria_nombre: categoryLower,
        importe: parseFloat(amount),
        fecha_inicio: startDate,
        frecuencia: parseInt(frequency),
        descripcion: description || "Gasto fijo",
      });

      await evaluarRiesgoGastoFijo(portfolio.nombre, portfolio.id_usuario);

      if (!success || error) {
        setFormErrors([error || "Error desconocido al actualizar el gasto fijo"]);
        return;
      }

      // Actualizamos el estado local
      const updatedExpense: FixedExpense = {
        ...editingExpense,
        portfolioId: portfolio.id_usuario,
        portfolioName: portfolio.nombre,
        amount: parseFloat(amount).toFixed(2),
        category: categoryLower,
        frequency: parseInt(frequency),
        startDate,
        description: description || "Gasto fijo",
      };

      setFixedExpenses(
        fixedExpenses.map((e) => (e.id === editingExpense.id ? updatedExpense : e))
      );

      // Cerramos el dialog
      setIsEditDialogOpen(false);
      setEditingExpense(null);
      resetForm();
    } catch (err) {
      console.error("Error al actualizar gasto fijo:", err);
      setFormErrors(["Hubo un error al actualizar el gasto fijo"]);
    }
  };


  const handleToggleStatus = async (expense: FixedExpense) => {
    const newStatus = expense.status === "activo" ? "pausado" : "activo";
    const newActivo = newStatus === "activo";

    try {
      await toggleGastoFijoActivo(expense.id, newActivo);

      setFixedExpenses((prev) =>
        prev.map((e) =>
          e.id === expense.id ? { ...e, status: newStatus } : e
        )
      );
    } catch (error) {
      console.error("Error actualizando estado en Supabase:", error);
    }
  };

  const handleDeleteExpense = (expense: FixedExpense) => {
    setDeletingExpense(expense);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingExpense) return;

    try {
      // Llamamos al servicio para eliminar de la base de datos
      const { success, error } = await deleteGastoFijo(deletingExpense.id);
      await evaluarRiesgoGastoFijo(deletingExpense.portfolioName, deletingExpense.portfolioId);

      if (!success) {
        console.error("Error eliminando gasto fijo:", error);
        // Opcional: mostrar error al usuario
        return;
      }

      // Eliminamos del estado local para actualizar la UI
      setFixedExpenses(fixedExpenses.filter(e => e.id !== deletingExpense.id));
      setIsDeleteDialogOpen(false);
      setDeletingExpense(null);

    } catch (err) {
      console.error("Error eliminando gasto fijo:", err);
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
              <ScrollArea className="max-h-[70vh]">
              <div className="space-y-4 pt-4 pr-4">
                {formErrors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800 font-semibold mb-1">Errores de validación:</p>
                    <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                      {formErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
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
                        <SelectItem key={p.nombre} value={p.nombre.toString()}>
                          {p.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                    {/* Hidden test helper to allow tests to set selected portfolio reliably */}
                    <input data-testid="fe-portfolio-input" style={{display: 'none'}} value={selectedPortfolioId} onChange={(e) => setSelectedPortfolioId(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Importe *</Label>
                  <Input type="number" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Categoría *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ocio">Ocio</SelectItem>
                      <SelectItem value="hogar">Hogar</SelectItem>
                      <SelectItem value="transporte">Transporte</SelectItem>
                      <SelectItem value="comida">Comida</SelectItem>
                      <SelectItem value="factura">Factura</SelectItem>
                    </SelectContent>
                  </Select>
                  <input data-testid="fe-category-input" style={{display: 'none'}} value={category} onChange={(e) => setCategory(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Frecuencia (días) *</Label>
                  <Input type="number" min="1" step="1" placeholder="Número entero mayor que 0" value={frequency} onChange={e => setFrequency(e.target.value)} />
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
              <Button data-testid="fe-create-submit" onClick={handleCreateExpense} className="w-full hidden" style={{display: 'none'}}>Crear Gasto Fijo</Button>
              </div>
              </ScrollArea>
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
                    <div className="text-xs text-gray-500">
                      {expense.lastGenerated
                        ? `Último cargo generado: ${formatDate(expense.lastGenerated)}`
                        : "Último cargo generado: --/--/----"}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="icon" data-testid={`fe-toggle-${expense.id}`} onClick={() => handleToggleStatus(expense)}>
                    {expense.status === "activo" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button
                      variant="outline"
                      size="icon"
                      data-testid={`fe-edit-${expense.id}`}
                      onClick={() => handleEditExpense(expense)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  <Button variant="outline" size="icon" data-testid={`fe-delete-${expense.id}`} onClick={() => handleDeleteExpense(expense)}>
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          setEditingExpense(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Gasto Fijo</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-4 pt-4 pr-4">
              {formErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800 font-semibold mb-1">Errores de validación:</p>
                  <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                    {formErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="edit-portfolio">Cartera *</Label>
                <Select value={selectedPortfolioId} onValueChange={setSelectedPortfolioId}>
                  <SelectTrigger id="edit-portfolio">
                    <SelectValue placeholder="Selecciona una cartera" />
                  </SelectTrigger>
                  <SelectContent>
                    {portfolios.map((portfolio) => (
                      <SelectItem key={portfolio.nombre} value={portfolio.nombre.toString()}>
                        {portfolio.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-amount">Importe *</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-category">Categoría *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="edit-category">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ocio">Ocio</SelectItem>
                    <SelectItem value="hogar">Hogar</SelectItem>
                    <SelectItem value="transporte">Transporte</SelectItem>
                    <SelectItem value="comida">Comida</SelectItem>
                    <SelectItem value="factura">Factura</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-frequency">Frecuencia (días) *</Label>
                <Input
                  id="edit-frequency"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="30"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                />
                <p className="text-xs text-gray-500">Cada cuántos días se repetirá el gasto</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-date">Fecha de inicio *</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Descripción (opcional)</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Ej: Alquiler mensual, Suscripción..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={256}
                />
                <p className="text-xs text-gray-500">{description.length}/256 caracteres</p>
              </div>

              <Button onClick={handleSaveEdit} className="w-full">
                Guardar Cambios
              </Button>
              <Button data-testid="fe-save-edit" onClick={handleSaveEdit} className="w-full hidden" style={{display: 'none'}}>Guardar Cambios</Button>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
      
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
            {/* Hidden test helper to confirm deletion without relying on Radix portal timing */}
            <button data-testid="fe-confirm-delete" onClick={handleConfirmDelete} style={{display: 'none'}} />
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
            onClick={() => setIsConfirmDialogOpen(false)}
          >
            Aceptar
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
