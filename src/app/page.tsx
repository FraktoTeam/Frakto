"use client";

import { useState, useEffect } from "react";
import { Home } from "./components/Home";
import { Portfolio } from "./components/Portfolio";
import { FixedExpenses } from "./components/FixedExpenses";
import AlertBanner from "./components/AlertBanner";
import {
  Home as HomeIcon,
  Briefcase,
  BarChart3,
  Settings,
  Repeat,
  Mail,
  FileText,
  CalendarIcon,
  LogOut,
  Target,
} from "lucide-react";
import Inbox from "./components/Inbox";
import { Reports } from "./components/Reports";
import { Calendar } from "./components/Calendar";
import { Login } from "./components/Login";
import { Register } from "./components/Register";
import { Analytics } from "./components/Analytics";
import { Goals } from "./components/Goals"; 

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "./components/ui/alert-dialog";

export default function App() {
  const [activeView, setActiveView] = useState("home");
  const [previousView, setPreviousView] = useState("home");
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<number | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

  // Estado para login/register
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [isLogged, setIsLogged] = useState(false);
  const [loggedUser, setLoggedUser] = useState<{ nombre_usuario: string; correo: string } | null>(null);
  const [activeGoalsCount, setActiveGoalsCount] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("usuario");
    if (saved) {
      const u = JSON.parse(saved);
      setLoggedUser(u);
      setUserId(u.id_usuario);
      setIsLogged(true);
    }
  }, []);

  // Si NO está logueado → mostrar LOGIN o REGISTER sin sidebar
  if (!isLogged) {
    return authMode === "login" ? (
      <Login
        onLogin={() => {
          const userObj = JSON.parse(localStorage.getItem("usuario") || "{}");
          setLoggedUser(userObj);
          setIsLogged(true);
          setUserId(userObj.id_usuario);
        }}
        onSwitchToRegister={() => setAuthMode("register")}
      />
    ) : (
      <Register
        onRegister={() => {
          const newUserObj = JSON.parse(localStorage.getItem("usuario") || "{}");
          setLoggedUser(newUserObj);
          setIsLogged(true);
          setUserId(newUserObj.id_usuario);
        }}
        onSwitchToLogin={() => setAuthMode("login")}
      />
    );
  }

  // Función para seleccionar cartera
  const handleSelectPortfolio = (portfolioId: number): void => {
    setSelectedPortfolioId(portfolioId);
    setPreviousView(activeView);
    setActiveView("portfolio");
  };

  const handleLogout = () => {
    // Limpia el usuario guardado
    localStorage.removeItem("usuario");

    // Limpia estado de usuario
    setLoggedUser(null);
    setUserId(null);
    setIsLogged(false);
    setAuthMode("login");
    setActiveView("home");
  };

  // Menú lateral
  const menuItems = [
    { id: "home", label: "Home", icon: HomeIcon },
    { id: "portfolio", label: "Cartera", icon: Briefcase },
    { id: "fixexpenses", label: "Gastos Fijos", icon: Repeat },
    { id: "analytics", label: "Análisis", icon: BarChart3 },
    { id: "reports", label: "Reportes", icon: FileText },
    { id: "calendar", label: "Calendario", icon: CalendarIcon },
    { id: "goals", label: "Metas", icon: Target },   
    { id: "settings", label: "Configuración", icon: Settings },
  ];

  // Render de vistas
  const renderView = () => {
    switch (activeView) {
      case "home":
        return <Home onSelectPortfolio={handleSelectPortfolio} userId={userId!} />;
     
      case "reports":
        return <Reports userId={userId!} />;
      case "portfolio":
        return (
          <Portfolio
            userId={userId!}
            selectedId={selectedPortfolioId}
            previousView={previousView}
            onNavigateBack={setActiveView}
          />
        );
      case "fixexpenses":
        return <FixedExpenses userId={userId!} />;
          case "analytics":
        return (
          <div className="space-y-6">
            <div>
              <h2>Análisis</h2>
              <p className="text-gray-500">Análisis detallado de tus ingresos y gastos</p>
            </div>
            {/* Analytics de la primera cartera del usuario */}
            {userId && (
              <Analytics
                userId={userId}
              />
            )}
          </div>
        );

      case "calendar":
        return <Calendar userId={userId!} />;
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
        case "goals":
        return (
          <Goals
            userId={userId!}
            onActiveGoalsChange={setActiveGoalsCount}  // ⬅ aquí conectamos el contador
          />
        );
      case "inbox":
        return <Inbox userId={userId!} />;
      default:
        return <Home onSelectPortfolio={handleSelectPortfolio} userId={userId!} />;
    }
  };

  // Si está logueado → mostrar app completa
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-20 hover:w-64 bg-white border-r border-gray-200 transition-all duration-300 overflow-hidden flex flex-col group">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 min-h-[88px] flex flex-col justify-center items-center group-hover:items-start transition-all duration-300">
          <div className="relative flex items-center justify-center h-10 w-10 group-hover:h-12 group-hover:w-auto transition-all duration-300">
            <img
              src="/logoPequeno.png"
              alt="Frakto"
              className="block group-hover:hidden h-full w-full object-contain"
            />
            <img
              src="/logo.png"
              alt="Frakto"
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
                    <Icon
                      className={`h-5 w-5 flex-shrink-0 ${
                        active ? "text-green-700" : "text-gray-700"
                      }`}
                    />
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                      {item.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Buzón */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <button
            onClick={() => setActiveView("inbox")}
            className={[
              "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors",
              activeView === "inbox"
                ? "bg-green-50 text-green-700 shadow-[inset_0_0_0_1px_rgba(16,185,129,.15)]"
                : "text-gray-700 hover:bg-gray-100",
            ].join(" ")}
          >
            <Mail
              className={`h-5 w-5 flex-shrink-0 ${
                activeView === "inbox" ? "text-green-700" : "text-gray-700"
              }`}
            />
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              Buzón
            </span>
          </button>
        </div>

        {/* Info usuario + Cerrar sesión */}
        <div className="p-4 border-t border-gray-200 bg-white space-y-2">
          {/* Tarjeta usuario */}
          <div className="bg-green-50 rounded-lg p-4 flex items-center justify-center group-hover:justify-start transition-all duration-300">
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
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col ml-0 group-hover:ml-3 whitespace-nowrap overflow-hidden">
              <p className="text-sm font-medium">
                {loggedUser ? loggedUser.nombre_usuario : "Usuario"}
              </p>
              <p className="text-xs text-gray-500">
                {loggedUser ? loggedUser.correo : "correo@frakto.com"}
              </p>
            </div>
          </div>

          {/* Botón cerrar sesión con confirmación */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors">
                <LogOut className="h-5 w-5 flex-shrink-0" />
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                  Cerrar sesión
                </span>
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Cerrar sesión?</AlertDialogTitle>
                <AlertDialogDescription>
                  Estás a punto de cerrar sesión. Tendrás que volver a iniciar sesión para acceder a tus datos
                  financieros.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  onClick={handleLogout}
                >
                  Cerrar sesión
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <AlertBanner userId={userId!} />
        <div className="p-6">{renderView()}</div>
      </main>
    </div>
  );
}
