'use client';

import { useState, useEffect } from "react";
import { Home } from "./components/Home";
import { Portfolio } from "./components/Portfolio";
import { FixedExpenses } from "./components/FixedExpenses";
import AlertBanner from "./components/AlertBanner";
import { Home as HomeIcon, Briefcase, BarChart3, Settings, Repeat, Mail, FileText, CalendarIcon } from "lucide-react";
import Inbox from "./components/Inbox"; // o la ruta donde lo guardaste
import { Reports } from "./components/Reports";
import { Calendar } from "./components/Calendar";


export default function App() {
  const [activeView, setActiveView] = useState("home");
  const [previousView, setPreviousView] = useState<string>("home");
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<number | null>(null);

  const handleSelectPortfolio = (portfolioId: number): void => {
    setSelectedPortfolioId(portfolioId);
    setPreviousView(activeView);
    setActiveView("portfolio");
  };

  // Etiquetas como en la captura (nota: mantenemos id "portfolio")
  const menuItems = [
    { id: "home",       label: "Home",         icon: HomeIcon },
    { id: "portfolio",  label: "Cartera",      icon: Briefcase },
    { id: "fixexpenses",label: "Gastos Fijos", icon: Repeat },
    { id: "analytics",  label: "Análisis",     icon: BarChart3 },
    { id: "reports",       label: "Reportes",     icon: FileText },
    { id: "calendar", label: "Calendario", icon: CalendarIcon },
    { id: "settings",   label: "Configuración",icon: Settings },
  ];

  const renderView = () => {
    switch (activeView) {
      case "home":
        return <Home onSelectPortfolio={handleSelectPortfolio} userId={1} />;
      case "reports":
       return <Reports userId={1} />;

      case "portfolio":
        return (
          <Portfolio
            userId={1}
            selectedId={selectedPortfolioId}
            previousView={previousView}
            onNavigateBack={setActiveView}
          />
        );
      case "fixexpenses":
        return <FixedExpenses />;
      case "analytics":
        return (
          <div className="space-y-6">
            <div>
              <h2>Análisis</h2>
              <p className="text-gray-500">Análisis detallado de tus ingresos y gastos</p>
            </div>
            <div className="bg-gray-100 rounded-lg p-12 text-center">
              <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Próximamente disponible</p>
            </div>
          </div>
        );
        case "calendar":
           return <Calendar />;

      case "settings":
        return (
          <div className="space-y-6">
            <div>
              <h2>Configuración</h2>
              <p className="text-gray-500">Ajustes de tu cuenta</p>
            </div>
            <div className="bg-gray-100 rounded-lg p-12 text-center">
              <Settings className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Próximamente disponible</p>
            </div>
          </div>
        );
        case "inbox":
            return <Inbox userId={1} />;

      default:
        return <Home onSelectPortfolio={handleSelectPortfolio} userId={1} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-20 hover:w-64 bg-white border-r border-gray-200 transition-all duration-300 overflow-hidden flex flex-col group">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 min-h-[88px] flex flex-col justify-center items-center group-hover:items-start transition-all duration-300">
          <div className="relative flex items-center justify-center h-10 w-10 group-hover:h-12 group-hover:w-auto transition-all duration-300">
            {/* Logo compacto */}
            <img
              src="/logoPequeno.png"
              alt="Frakto"
              className="block group-hover:hidden h-full w-full object-contain"
            />
            {/* Logo completo */}
            <img
              src="/logo.png"
              alt="Frakto€"
              className="hidden group-hover:block h-24 w-auto object-contain"
            />
          </div>
          <p className="text-sm font-medium text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap mt-0">
            Gestión Financiera
          </p>
        </div>

        {/* Navegación */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = activeView === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveView(item.id)}
                    className={[
                      "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors",
                      active
                        ? "bg-green-50 text-green-700 shadow-[inset_0_0_0_1px_rgba(16,185,129,.15)]"
                        : "text-gray-700 hover:bg-gray-100",
                    ].join(" ")}
                  >
                    <Icon className={`h-5 w-5 flex-shrink-0 ${active ? "text-green-700" : "text-gray-700"}`} />
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                      {item.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Buzón (abajo, separado) */}
        <div className="p-4 border-t border-gray-200 sticky bottom-6 bg-white">
          <button
            onClick={() => setActiveView("inbox")}
            className={[
              "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors",
              activeView === "inbox"
                ? "bg-green-50 text-green-700 shadow-[inset_0_0_0_1px_rgba(16,185,129,.15)]"
                : "text-gray-700 hover:bg-gray-100",
            ].join(" ")}
            title="Buzón"
          >
            <Mail className={`h-5 w-5 flex-shrink-0 ${activeView === "inbox" ? "text-green-700" : "text-gray-700"}`} />
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              Buzón
            </span>
          </button>
        </div>
        {/* Información de usuario (debajo del buzón) */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="bg-green-50 rounded-lg p-4 flex items-center justify-center group-hover:justify-start transition-all duration-300">
            {/* Icono visible cuando la barra está colapsada */}
            <div className="opacity-100 group-hover:opacity-0 transition-opacity duration-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5.121 17.804A9 9 0 1118.88 17.8M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>

            {/* Texto visible cuando la barra está expandida */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col ml-0 group-hover:ml-3 whitespace-nowrap overflow-hidden">
              <p className="text-sm font-medium">Usuario</p>
              <p className="text-xs text-gray-500">admin@frakto.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* 🟩 Banner de alertas */}
        <AlertBanner userId={1} />
        {/* Contenido */}
        <div className="p-6">{renderView()}</div>
      </main>
    </div>
  );
}
