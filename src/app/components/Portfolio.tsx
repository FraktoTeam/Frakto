"use client";

import { useState, useEffect } from "react";
import { getCarteras, createCartera, editCartera, deleteCartera } from "@/services/carterasService";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Plus, Eye, TrendingUp, TrendingDown, ArrowLeft, Trash2, Pencil } from "lucide-react";

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
  
  useEffect(() => {
    async function fetchWallets() {
      try {
        const data = await getCarteras(userId);
        const formatted: PortfolioItem[] = data.map((c) => ({
          id: c.id_usuario,
          name: c.nombre,
          balance: `${c.saldo.toLocaleString("es-ES", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}€`,
          monthlyChange: "0.00€",
          trend: "up", 
          transactions: 0,
          lastUpdate: "Ahora",
        }));
        setPortfolios(formatted);
      } catch (err) {
        console.error("Error al obtener carteras:", err);
      } finally {
        setLoading(false);
      }
    }
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
      const { success, error } = await deleteCartera(userId, deletingPortfolio.name);

      if (error) {
        setDeleteError("Error al eliminar la cartera. Intenta nuevamente.");
        console.error("Error eliminando cartera:", error);
        return;
      }

      if (success) {
        setPortfolios((prev) =>
          prev.filter((p) => p.name !== deletingPortfolio.name)
        );
        setIsDeleteDialogOpen(false);
        setDeletingPortfolio(null);
        setDeleteError("");
      }
    } catch (err) {
      console.error("Error inesperado al eliminar:", err);
      setDeleteError("Error inesperado al eliminar la cartera.");
    }
  };

  const handleAddPortfolio = async () => {
    const nameRegex = /^[A-Za-z0-9_-]+$/; 
    const balanceRegex = /^\d+(\.\d{1,2})?$/; 

    let valid = true;
    const newErrors = { name: "", balance: "" };

    // Validación del nombre
    if (!nameRegex.test(newPortfolioName)) {
      newErrors.name = "El nombre solo puede contener letras y números (sin espacios).";
      valid = false;
    }

    // Validación del balance
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

  if (selectedPortfolio) {
    return (
      <div className="space-y-6">
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
                <span className={selectedPortfolio.trend === "up" ? "text-green-600" : "text-red-600"}>
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
              <div className="text-2xl font-bold">{selectedPortfolio.transactions}</div>
              <p className="text-xs text-gray-500 mt-1">Este mes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Última Actualización</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl">●</div>
              <p className="text-xs text-gray-500 mt-1">{selectedPortfolio.lastUpdate}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Transacciones Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { description: "Salario Mensual", category: "Ingreso", date: "15 Oct 2025", amount: "+3,500.00€", type: "income" },
                { description: "Supermercado Carrefour", category: "Alimentación", date: "14 Oct 2025", amount: "-245.80€", type: "expense" },
                { description: "Transferencia Ahorros", category: "Transferencia", date: "13 Oct 2025", amount: "-1,000.00€", type: "expense" },
                { description: "Freelance Proyecto", category: "Ingreso", date: "12 Oct 2025", amount: "+850.00€", type: "income" },
                { description: "Pago Servicios", category: "Servicios", date: "11 Oct 2025", amount: "-180.50€", type: "expense" },
              ].map((transaction, index) => (
                <div key={index} className="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0">
                  <div className="flex-1">
                    <p className="font-semibold">{transaction.description}</p>
                    <p className="text-sm text-gray-500">{transaction.category} · {transaction.date}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${transaction.type === "income" ? "text-green-600" : "text-red-600"}`}>
                      {transaction.amount}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <p className="text-sm text-gray-600">
                ¿Estás seguro de que deseas eliminar la cartera{" "}
                <span className="font-semibold">{deletingPortfolio?.name}</span>? <br />
                Esta acción no se puede deshacer.
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
        {portfolios.map((portfolio) => (
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
              <div className="pt-2 border-t">
                <p className="text-xs text-gray-500 mb-2">{portfolio.lastUpdate}</p>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => setSelectedPortfolio(portfolio)}
                >
                  <Eye className="h-4 w-4" />
                  Ver Cartera
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-2 mt-2"
                  onClick={() => {
                    setEditingPortfolio(portfolio);
                    setNewName(portfolio.name);
                    setIsEditDialogOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  className="w-full gap-2 mt-2"
                  onClick={() => {
                    setDeletingPortfolio(portfolio);
                    setIsDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
