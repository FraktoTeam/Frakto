"use client";

import { useEffect, useState } from "react";
import { getCarteras } from "@/services/carterasService";
import { getUltimosMovimientosUsuario } from "@/services/transaccionService";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "./ui/carousel";
import { Eye, TrendingUp, TrendingDown, DollarSign, Wallet } from "lucide-react";
import { WalletMinimal, Home as HomeIcon, BarChart2, Settings, CreditCard } from "lucide-react";
import { getFirebaseApp } from "../../utils/firebaseClient";
import { solicitarPermisoYToken, escucharMensajes } from "@/utils/firebaseMessaging";


interface HomeProps {
  onSelectPortfolio: (portfolioId: number) => void;
  userId: number
}

export function Home({ onSelectPortfolio }: HomeProps) {

  const [wallets, setWallets] = useState<{ nombre: string; saldo: number; id_usuario: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [movements, setMovements] = useState<any[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(true);
  const [userId, setUserId] = useState(1)
  useEffect(() => {
    try {
      const app = getFirebaseApp();
      console.log("✅ Firebase inicializado:", app.name);
    } catch (e) {
      console.error("⛔ No se pudo inicializar Firebase:", e);
    }
  }, []);

  useEffect(() => {
  solicitarPermisoYToken();
  escucharMensajes();
}, []);


  useEffect(() => {
    async function fetchWallets() {
      try {
        const data = await getCarteras(userId);
        setWallets(data);
      } catch (error) {
        console.error("Error al obtener carteras:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchWallets();
  }, [userId]);

  useEffect(() => {
    async function fetchMovements() {
      try {
        const { data, error } = await getUltimosMovimientosUsuario(userId);

        if (error) {
          console.error("Error obteniendo movimientos:", error);
          setMovements([]);
        } else {
          console.log("Movimientos obtenidos:", data);
          setMovements(data || []);
        }
      } catch (err) {
        console.error("Error inesperado al cargar movimientos:", err);
      } finally {
        setLoadingMovements(false);
      }
    }

    fetchMovements();
  }, [userId]);

  const totalBalanceValue = wallets.reduce((acc, w) => acc + Number(w.saldo), 0);
  const totalBalance = {
  title: "Balance Total",
  value: `${totalBalanceValue.toLocaleString("es-ES", { minimumFractionDigits: 2 })}€`,
  change: "+0.0%",
  trend: "up" as const,
  };

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
    {wallets.length === 0 ? (
      <p className="text-gray-500 px-4">No hay carteras registradas aún.</p>
    ) : (
      wallets.map((wallet, index) => (
        <div key={`${wallet.nombre}-${wallet.id_usuario}`} className="flex-none w-[min(280px,80%)] md:w-1/2 lg:w-1/3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">{wallet.nombre}</CardTitle>
              <Wallet className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Balance</p>
                <p className="text-2xl font-bold">
                  {Number(wallet.saldo).toLocaleString("es-ES", { minimumFractionDigits: 2 })}€
                </p>
              </div>

              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-green-600">+0.0%</span>
                <span>vs mes anterior</span>
              </p>

              <Button
                variant="outline"
                className="w-full gap-2 mt-2"
                onClick={() => onSelectPortfolio(index + 1)}
              >
                <Eye className="h-4 w-4" />
                Ver Cartera
              </Button>
            </CardContent>
          </Card>
        </div>
      ))
    )}
  </div>
</div>
      {/* Últimos 10 Movimientos */}
      <Card>
        <CardHeader>
          <CardTitle>Últimos 10 Movimientos</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {loadingMovements ? (
              <p className="text-gray-500 text-center py-4">
                Cargando movimientos...
              </p>
            ) : movements.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No hay movimientos registrados todavía.
              </p>
            ) : (
              movements.slice(0, 10).map((movimiento, index) => {
                const tipo =
                  movimiento.importe > 0 ? "ingreso" : "gasto";
                const importeAbsoluto = Math.abs(movimiento.importe);
                const fecha = new Date(movimiento.fecha);
                const fechaFormateada = fecha.toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                });

                return (
                  <div
                    key={`${movimiento.id ?? movimiento.cartera_nombre}-${index}`}
                    className="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0"
                  >
                    {/* Información principal */}
                    <div className="flex-1">
                      <p className="font-semibold">
                        {movimiento.descripcion || "Movimiento"}
                        {movimiento.cartera_nombre && (
                          <>
                            {" · "}
                            <span className="text-green-600">{movimiento.cartera_nombre}</span>
                          </>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">
                        {tipo === "ingreso" ? "Ingreso" : "Gasto"}
                        {tipo === "ingreso" ? "" : movimiento.categoria_nombre ? ` · ${movimiento.categoria_nombre.charAt(0).toUpperCase() + movimiento.categoria_nombre.slice(1)}` : ""}
                        {fechaFormateada ? ` · ${fechaFormateada}` : ""}
                      </p>
                    </div>

                    {/* Importe */}
                    <div className="text-right">
                      <p
                        className={`font-semibold ${
                          tipo === "ingreso"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {tipo === "ingreso" ? "+" : "-"}
                        {importeAbsoluto.toLocaleString("es-ES", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}€
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
