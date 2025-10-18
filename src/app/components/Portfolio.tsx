import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Plus, Eye, TrendingUp, TrendingDown, ArrowLeft } from "lucide-react";

interface PortfolioItem {
  id: number;
  name: string;
  balance: string;
  monthlyChange: string;
  trend: "up" | "down";
  transactions: number;
  lastUpdate: string;
}

export function Portfolio() {
  const [portfolios, setPortfolios] = useState<PortfolioItem[]>([
    {
      id: 1,
      name: "Cartera Personal",
      balance: "45,200.00€",
      monthlyChange: "+2,450.00€",
      trend: "up",
      transactions: 24,
      lastUpdate: "Hace 2 horas",
    },
    {
      id: 2,
      name: "Cartera Ahorros",
      balance: "28,500.00€",
      monthlyChange: "+1,200.00€",
      trend: "up",
      transactions: 8,
      lastUpdate: "Hace 5 horas",
    },
    {
      id: 3,
      name: "Cartera Gastos",
      balance: "12,300.00€",
      monthlyChange: "-890.00€",
      trend: "down",
      transactions: 35,
      lastUpdate: "Hace 1 hora",
    },
    {
      id: 4,
      name: "Cartera Emergencias",
      balance: "19,800.00€",
      monthlyChange: "+500.00€",
      trend: "up",
      transactions: 3,
      lastUpdate: "Hace 3 horas",
    },
  ]);

  const [selectedPortfolio, setSelectedPortfolio] = useState<PortfolioItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState("");
  const [newPortfolioBalance, setNewPortfolioBalance] = useState("");

  const handleAddPortfolio = () => {
    if (newPortfolioName && newPortfolioBalance) {
      const newPortfolio: PortfolioItem = {
        id: portfolios.length + 1,
        name: newPortfolioName,
        balance: `${parseFloat(newPortfolioBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        monthlyChange: "0.00€",
        trend: "up",
        transactions: 0,
        lastUpdate: "Ahora",
      };
      setPortfolios([...portfolios, newPortfolio]);
      setNewPortfolioName("");
      setNewPortfolioBalance("");
      setIsDialogOpen(false);
    }
  };

  if (selectedPortfolio) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSelectedPortfolio(null)}
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
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la Cartera</Label>
                <Input
                  id="name"
                  placeholder="Sin caracteres especiales ni espacios"
                  value={newPortfolioName}
                  onChange={(e) => setNewPortfolioName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="balance">Balance Inicial</Label>
                <Input
                  id="balance"
                  type="number"
                  placeholder="0.00 (mayor a 0)"
                  value={newPortfolioBalance}
                  onChange={(e) => setNewPortfolioBalance(e.target.value)}
                />
              </div>
              <Button onClick={handleAddPortfolio} className="w-full">
                Crear Cartera
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {portfolios.map((portfolio) => (
          <Card key={portfolio.id} className="hover:shadow-lg transition-shadow">
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
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
