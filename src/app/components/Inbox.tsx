"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  getAlertasUsuario,
  subscribeAlertasUsuario,
  unsubscribeChannel,
  deleteAlerta
} from "@/services/AlertaService";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogTrigger
} from "./ui/alert-dialog";
import { Bell, X } from "lucide-react";

type Estado = "activa" | "resuelta";

type Alerta = {
  id_alerta: string;
  cartera_nombre: string;
  id_usuario: number;
  saldo_actual: number;
  saldo_necesario: number;
  umbral_riesgo: number;
  fecha_generacion: string; // ISO o date-string
  estado_alerta: Estado;
  mensaje: string;
};

function formatDate(d: string | Date) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date
    .toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })
    .replace(/\//g, "-");
}

function money(n: number) {
  return (
    n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "€"
  );
}

export default function Inbox({ userId }: { userId: number }) {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [bannerAlert, setBannerAlert] = useState<Alerta | null>(null);
  const [loading, setLoading] = useState(true);
  const chRef = useRef<any>(null);
  const [alertToDelete, setAlertToDelete] = useState<string | null>(null);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false); // Estado para el popup

  // Carga inicial sin fusionar: mantenemos rojas antiguas tal cual
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const raw = (await getAlertasUsuario(userId)) as Alerta[] | null;
        if (!mounted) return;
        setAlertas(
          (raw ?? []).sort(
            (a, b) =>
              new Date(b.fecha_generacion).getTime() - new Date(a.fecha_generacion).getTime()
          )
        );
      } catch (e) {
        console.error("Error cargando alertas:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    // Realtime: añadimos/actualizamos, pero NO convertimos las rojas
    const ch = subscribeAlertasUsuario(userId, (payload: any) => {
      setAlertas((prev) => {
        let next = [...prev];
        if (payload.eventType === "INSERT") {
          const nueva = payload.new as Alerta;
          setBannerAlert(nueva);
          setTimeout(() => setBannerAlert(null), 4000);
          next = [nueva, ...next];
        } else if (payload.eventType === "UPDATE") {
          const upd = payload.new as Alerta;
          const idx = next.findIndex((a) => a.id_alerta === upd.id_alerta);
          if (idx !== -1) next[idx] = { ...next[idx], ...upd };
          else next = [upd, ...next];
        } else if (payload.eventType === "DELETE") {
          const old = payload.old as Alerta;
          next = next.filter((a) => a.id_alerta !== old.id_alerta);
        }
        // reorden descendente por fecha
        return next.sort(
          (a, b) =>
            new Date(b.fecha_generacion).getTime() - new Date(a.fecha_generacion).getTime()
        );
      });
    });

    chRef.current = ch;
    return () => {
      unsubscribeChannel(chRef.current);
      mounted = false;
    };
  }, [userId]);

  // Orden final: activas primero, luego por fecha desc (sin fusionar)
  const sortedAlerts = useMemo(() => {
    const copy = [...alertas];
    return copy.sort((a, b) => {
      if (a.estado_alerta !== b.estado_alerta) {
        return a.estado_alerta === "activa" ? -1 : 1;
      }
      return new Date(b.fecha_generacion).getTime() - new Date(a.fecha_generacion).getTime();
    });
  }, [alertas]);

  // Para cada activa, buscar SU resuelta posterior (misma cartera, posterior en el tiempo)
  const resueltaParaActiva = useMemo(() => {
    // indexamos por cartera solo resueltas
    const byCartera = new Map<string, Alerta[]>();
    for (const a of alertas) {
      if (a.estado_alerta === "resuelta") {
        const arr = byCartera.get(a.cartera_nombre) ?? [];
        arr.push(a);
        byCartera.set(a.cartera_nombre, arr);
      }
    }
    // ordenar cada lista ascendente por fecha para buscar la primera posterior
    for (const [k, arr] of byCartera) {
      arr.sort(
        (x, y) =>
          new Date(x.fecha_generacion).getTime() - new Date(y.fecha_generacion).getTime()
      );
      byCartera.set(k, arr);
    }

    const map = new Map<string, Alerta | undefined>();
    for (const a of alertas) {
      if (a.estado_alerta !== "activa") continue;
      const candidates = byCartera.get(a.cartera_nombre) ?? [];
      const posterior = candidates.find(
        (r) => new Date(r.fecha_generacion).getTime() > new Date(a.fecha_generacion).getTime()
      );
      map.set(a.id_alerta, posterior);
    }
    return map;
  }, [alertas]);

  const handleOpenDeleteDialog = (alertId: string) => {
    setAlertToDelete(alertId);
  };

  const handleConfirmDelete = async () => {
    if (alertToDelete && userId) {
      try {
        // Llamamos a la función deleteAlerta
        await deleteAlerta(alertToDelete, userId);

        // Si no hubo error, eliminamos la alerta localmente
        setAlertas((prev) => prev.filter((alert) => alert.id_alerta !== alertToDelete));
        setAlertToDelete(null); // Cierra el diálogo de confirmación

        // Mostramos el popup de éxito
        setShowDeleteSuccess(true);

        // Cerrar el popup de éxito después de 3 segundos
        setTimeout(() => {
          setShowDeleteSuccess(false);
        }, 3000);
      } catch (error) {
        console.error("Error al eliminar la alerta:", error);
      }
    }
  };


  const handleCancelDelete = () => {
    setAlertToDelete(null);
  };

  const activeCount = useMemo(
    () => alertas.filter((a) => a.estado_alerta === "activa").length,
    [alertas]
  );
  const resolvedCount = useMemo(
    () => alertas.filter((a) => a.estado_alerta === "resuelta").length,
    [alertas]
  );

  // Banner en portal para que siempre esté arriba
  const banner =
    bannerAlert &&
    (typeof document !== "undefined"
      ? createPortal(
          <div
            className={`fixed left-0 right-0 top-0 z-[1000] p-4 shadow-lg border-b flex items-start justify-between pointer-events-auto ${
              bannerAlert.estado_alerta === "activa"
                ? "bg-red-50 border-red-200"
                : "bg-green-50 border-green-200"
            }`}
          >
            <div className="flex items-start gap-3 flex-1">
              <Bell
                className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                  bannerAlert.estado_alerta === "activa" ? "text-red-600" : "text-green-600"
                }`}
              />
              <div className="flex-1">
                <p
                  className={`font-bold ${
                    bannerAlert.estado_alerta === "activa" ? "text-red-900" : "text-green-900"
                  }`}
                >
                  {bannerAlert.cartera_nombre}
                </p>
                <p
                  className={`text-sm ${
                    bannerAlert.estado_alerta === "activa" ? "text-red-700" : "text-green-700"
                  }`}
                >
                  {bannerAlert.mensaje}
                </p>
              </div>
            </div>
            <button
              onClick={() => setBannerAlert(null)}
              className={`p-1 rounded-lg transition-colors ${
                bannerAlert.estado_alerta === "activa"
                  ? "hover:bg-red-100 text-red-600"
                  : "hover:bg-green-100 text-green-600"
              }`}
              aria-label="Cerrar banner"
            >
              <X className="h-5 w-5" />
            </button>
          </div>,
          document.body
        )
      : null);

  return (
    <div className="space-y-6">
      {banner}

      {/* Header */}
      <div className="pt-2">
        <h2>Buzón de Alertas</h2>
        <p className="text-gray-500">Historial de notificaciones y alertas del sistema</p>
      </div>
      {showDeleteSuccess && (
              <AlertDialog open={showDeleteSuccess} onOpenChange={() => setShowDeleteSuccess(false)}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Alerta Eliminada</AlertDialogTitle>
                    <AlertDialogDescription>
                      La alerta se ha eliminado correctamente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setShowDeleteSuccess(false)}>Cerrar</AlertDialogCancel>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

      {/* Lista de Alertas */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-gray-100 rounded-lg p-12 text-center">
            <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Cargando alertas…</p>
          </div>
        ) : sortedAlerts.length === 0 ? (
          <div className="bg-gray-100 rounded-lg p-12 text-center">
            <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No hay alertas registradas</p>
          </div>
        ) : (
                    sortedAlerts.map((alert) => {
            const activa = alert.estado_alerta === "activa";
            const resolucion = resueltaParaActiva.get(alert.id_alerta);

            return (
              <Card
                key={alert.id_alerta}
                className={`${
                  activa ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"
                }`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Bell
                          className={`h-4 w-4 ${activa ? "text-red-600" : "text-green-600"}`}
                        />
                        {alert.cartera_nombre}
                      </CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatDate(alert.fecha_generacion)}
                      </p>
                    </div>

                    {/* Aquí está el cambio para poner el botón de eliminar al lado de "Activa" */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs ${
                          activa ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                        }`}
                      >
                        {activa ? "Activa" : "Resuelta"}
                      </span>

                      {/* Botón de eliminar al lado de la etiqueta */}
                      <button
                        onClick={() => handleOpenDeleteDialog(alert.id_alerta)}
                        className={`p-1 rounded-lg transition-colors ${
                          alert.estado_alerta === "activa"
                            ? "hover:bg-red-100 text-red-600"
                            : "hover:bg-green-100 text-green-600"
                        }`}
                        aria-label="Eliminar alerta"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <p className={`${activa ? "text-red-900" : "text-green-900"}`}>
                    {alert.mensaje}
                  </p>
                  <div className="mt-1 grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                    <div>
                      <p className="text-xs text-gray-500">Saldo Actual</p>
                      <p className="font-bold">{money(alert.saldo_actual)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Saldo Necesario</p>
                      <p className="font-bold">{money(alert.saldo_necesario)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Umbral de Riesgo</p>
                      <p className="font-bold">{money(alert.umbral_riesgo)}</p>
                    </div>
                  </div>

                  {/* Mostrar resolución si es activa */}
                  {activa && resolucion && (
                    <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-2">
                      <span className="text-xs text-gray-500">Resuelta el</span>
                      <span className="text-xs font-semibold text-green-700">
                        {formatDate(resolucion.fecha_generacion)}
                      </span>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 px-2">
                            Ver resolución
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="!fixed !top-1/2 !left-1/2 !-translate-x-1/2 !-translate-y-1/2 !z-[1100]">
                          <AlertDialogCancel asChild>
                            <button
                              className="absolute right-3 top-3 rounded-md p-1 hover:bg-gray-100 text-gray-500"
                              aria-label="Cerrar"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </AlertDialogCancel>

                          <AlertDialogHeader>
                            <AlertDialogTitle>{resolucion.cartera_nombre}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {formatDate(resolucion.fecha_generacion)} — Alerta resuelta
                            </AlertDialogDescription>
                          </AlertDialogHeader>

                          <div className="space-y-3">
                            <p className="text-sm">{resolucion.mensaje}</p>
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <p className="text-xs text-gray-500">Saldo Actual</p>
                                <p className="font-semibold">{money(resolucion.saldo_actual)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Saldo Necesario</p>
                                <p className="font-semibold">{money(resolucion.saldo_necesario)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Umbral de Riesgo</p>
                                <p className="font-semibold">{money(resolucion.umbral_riesgo)}</p>
                              </div>
                            </div>
                          </div>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
            {/* Dialogo de confirmación de eliminación */}
      <AlertDialog open={alertToDelete !== null} onOpenChange={handleCancelDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta alerta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La alerta será eliminada permanentemente del buzón.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
