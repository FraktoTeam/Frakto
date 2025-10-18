import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "./ui/carousel";
import { TrendingUp, TrendingDown, DollarSign, Wallet } from "lucide-react";

export function Home() {
  const totalBalance = {
    title: "Balance Total",
    value: "124,850.50€",
    change: "+12.5%",
    trend: "up" as const,
    icon: DollarSign,
  };

  const wallets = [
    {
      id: 1,
      name: "Cartera Personal",
      balance: "45,200.00€",
      change: "+5.3%",
      trend: "up" as const,
    },
    {
      id: 2,
      name: "Cartera Ahorros",
      balance: "28,500.00€",
      change: "+3.2%",
      trend: "up" as const,
    },
    {
      id: 3,
      name: "Cartera Gastos",
      balance: "12,300.00€",
      change: "-2.1%",
      trend: "down" as const,
    },
    {
      id: 4,
      name: "Cartera Emergencias",
      balance: "19,800.00€",
      change: "+1.5%",
      trend: "up" as const,
    },
    {
      id: 5,
      name: "Cartera Vacaciones",
      balance: "8,650.50€",
      change: "+4.2%",
      trend: "up" as const,
    },
    {
      id: 6,
      name: "Cartera Inversiones",
      balance: "10,400.00€",
      change: "+6.8%",
      trend: "up" as const,
    },
  ];

  const recentActivity = [
    { id: 1, name: "Cartera Personal", amount: "+2,450€", date: "Hoy", type: "gain", description: "Ingreso - Salario" },
    { id: 2, name: "Cartera Ahorros", amount: "+1,200€", date: "Hoy", type: "gain", description: "Transferencia" },
    { id: 3, name: "Cartera Gastos", amount: "-385€", date: "Ayer", type: "loss", description: "Gasto - Supermercado" },
    { id: 4, name: "Cartera Personal", amount: "-890€", date: "Ayer", type: "loss", description: "Gasto - Servicios" },
    { id: 5, name: "Cartera Personal", amount: "+500€", date: "Hace 2 días", type: "gain", description: "Ingreso - Freelance" },
    { id: 6, name: "Cartera Gastos", amount: "-120€", date: "Hace 2 días", type: "loss", description: "Gasto - Transporte" },
    { id: 7, name: "Cartera Ahorros", amount: "+800€", date: "Hace 3 días", type: "gain", description: "Transferencia" },
    { id: 8, name: "Cartera Gastos", amount: "-65.50€", date: "Hace 3 días", type: "loss", description: "Gasto - Restaurante" },
    { id: 9, name: "Cartera Personal", amount: "-200€", date: "Hace 4 días", type: "loss", description: "Gasto - Ropa" },
    { id: 10, name: "Cartera Vacaciones", amount: "+300€", date: "Hace 5 días", type: "gain", description: "Ahorro mensual" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2>Resumen General</h2>
        <p className="text-gray-500">Vista general de tu dinero y carteras</p>
      </div>

      {/* Balance Total */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm">{totalBalance.title}</CardTitle>
          <DollarSign className="h-4 w-4 text-gray-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalBalance.value}</div>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
            <TrendingUp className="h-3 w-3 text-green-600" />
            <span className="text-green-600">{totalBalance.change}</span>
            <span>vs mes anterior</span>
          </p>
        </CardContent>
      </Card>

      {/* Scroll horizontal nativo, sin carousel */}
      <div className="overflow-x-auto no-scrollbar scroll-smooth pb-2">
        <div className="carousel-scroll flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth p-1">
          {wallets.map((wallet) => (
            <div
              key={wallet.id}
              className="flex-none w-[min(280px,80%)] md:w-1/2 lg:w-1/3"
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm">{wallet.name}</CardTitle>
                  <Wallet className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{wallet.balance}</div>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    {wallet.trend === "up" ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    )}
                    <span
                      className={
                        wallet.trend === "up" ? "text-green-600" : "text-red-600"
                      }
                    >
                      {wallet.change}
                    </span>
                    <span>vs mes anterior</span>
                  </p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>


      {/* Recent Activity - Last 10 Movements */}
      <Card>
        <CardHeader>
          <CardTitle>Últimos 10 Movimientos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0">
                <div>
                  <p>{activity.name}</p>
                  <p className="text-sm text-gray-500">{activity.description} · {activity.date}</p>
                </div>
                <div className={activity.type === "gain" ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                  {activity.amount}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
