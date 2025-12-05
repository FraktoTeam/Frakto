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
import { Badge } from "./components/ui/badge";
import { User } from "lucide-react";
import { Button } from "./components/ui/button";
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
import { Award, Trophy, Star, Medal, Crown, Sparkles } from "lucide-react";
import { PREDEFINED_ACHIEVEMENTS } from "./components/AchievementsCarousel";
import { LandingPage } from "./components/LandingPage";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./components/ui/popover";

export default function App() {
  const [activeView, setActiveView] = useState("home");
  const [previousView, setPreviousView] = useState("home");
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<number | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [showAuthScreen, setShowAuthScreen] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [requireAuthMessage, setRequireAuthMessage] = useState(false);
  // metas activas → para el circulito azul
  const [activeGoals, setActiveGoals] = useState(0);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  // Estado para login/register
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [isLogged, setIsLogged] = useState(false);
  const [loggedUser, setLoggedUser] = useState<{ nombre_usuario: string; correo: string } | null>(null);
  const [selectedAchievementId, setSelectedAchievementId] = useState<string | null>(null);


  useEffect(() => {
    const saved = sessionStorage.getItem("usuario");
    if (saved) {
      const u = JSON.parse(saved);
      setLoggedUser(u);
      setUserId(u.id_usuario);
      setIsLogged(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedAchievement = localStorage.getItem("selectedAchievement");
      if (savedAchievement) {
        setSelectedAchievementId(savedAchievement);
      }
    }
  }, []);


  // Si NO está logueado → mostrar LOGIN o REGISTER sin sidebar
  if (!isLogged) {
    // Mostrar Landing Page primero
    if (!showAuthScreen) {
      return (
        <LandingPage 
          onLogin={() => {
            window.history.replaceState(null, "", "/");
            setAuthMode("login");
            setShowAuthScreen(true);
            
            setTimeout(() => {
              window.history.pushState(null, "", window.location.href);
            }, 0);
          }}
          onRegister={() => {
            window.history.replaceState(null, "", "/");
            setAuthMode("register");
            setShowAuthScreen(true);
            
            setTimeout(() => {
              window.history.pushState(null, "", window.location.href);
            }, 0);
          }}
        />
      );
    }

    return authMode === "login" ? (
      <Login
        onLogin={() => {
          const userObj = JSON.parse(sessionStorage.getItem("usuario") || "{}");
          setLoggedUser(userObj);
          setIsLogged(true);
          setUserId(userObj.id_usuario);
        }}
        onSwitchToRegister={() => setAuthMode("register")}
        onBackToLanding={() => {
          setShowAuthScreen(false);
          setLoginError("");
          setRequireAuthMessage(false);
        }}
      />
    ) : (
      <Register
        onRegister={() => {
          const newUserObj = JSON.parse(sessionStorage.getItem("usuario") || "{}");
          setLoggedUser(newUserObj);
          setIsLogged(true);
          setUserId(newUserObj.id_usuario);
        }}
        onSwitchToLogin={() => setAuthMode("login")}
        onBackToLanding={() => {
          setShowAuthScreen(false);
          setRegisterError("");
        }}
      />
    );
  }

  // Función para seleccionar cartera
  const handleSelectPortfolio = (portfolioId: number): void => {
    setSelectedPortfolioId(portfolioId);
    setPreviousView(activeView);
    setActiveView("portfolio");
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
  };

   const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

   const handleLogoutConfirm = () => {
      sessionStorage.removeItem("usuario");
    // Invalidar token de autenticación
      setLoggedUser(null);
      setUserId(null);
      setIsLogged(false);
      setShowAuthScreen(false);
      setAuthMode("login");
      setActiveView("home");
      setShowLogoutConfirm(false);
  };

  const getAchievementIcon = (iconType: string | null) => {
    const className = "h-4 w-4 text-green-600";

    switch (iconType) {
      case "award": return <Award className={className} />;
      case "trophy": return <Trophy className={className} />;
      case "star": return <Star className={className} />;
      case "medal": return <Medal className={className} />;
      case "crown": return <Crown className={className} />;
      case "sparkles": return <Sparkles className={className} />;
      default:
        return null;
    }
  };

  const handleSelectAchievement = (achievementId: string | null) => {
    setSelectedAchievementId(achievementId);

    if (achievementId) {
      localStorage.setItem("selectedAchievement", achievementId);
    } else {
      localStorage.removeItem("selectedAchievement");
    }
  };


  const menuItems = [
    { id: "home", label: "Home", icon: HomeIcon },
    { id: "portfolio", label: "Cartera", icon: Briefcase },
    { id: "fixexpenses", label: "Gastos Fijos", icon: Repeat },
    { id: "analytics", label: "Análisis", icon: BarChart3 },
    { id: "reports", label: "Reportes", icon: FileText },
    { id: "calendar", label: "Calendario", icon: CalendarIcon },
    { id: "settings", label: "Configuración", icon: Settings },
  ];

  // Render de vistas
  const renderView = () => {
    if (!userId) return null;

    switch (activeView) {
      case "home":
        return <Home onSelectPortfolio={handleSelectPortfolio} userId={userId} />;

      case "reports":
        return <Reports userId={userId} />;

      case "portfolio":
        return (
          <Portfolio
            userId={userId}
            selectedId={selectedPortfolioId}
            previousView={previousView}
            onNavigateBack={setActiveView}
          />
        );

      case "fixexpenses":
        return <FixedExpenses userId={userId} />;

      case "analytics":
        return (
          <div className="space-y-6">
            <div>
              <h2>Análisis</h2>
              <p className="text-gray-500">Análisis detallado de tus ingresos y gastos</p>
            </div>
            <Analytics userId={userId} />
          </div>
        );

     case "goals":
  return (
    <Goals
      userId={userId}
      selectedAchievementId={selectedAchievementId}      // 👈 nuevo
      onSelectAchievement={handleSelectAchievement}     // 👈 nuevo
      onActiveGoalsChange={setActiveGoals}               // ya lo tenías
    />
  );


      case "calendar":
        return <Calendar userId={userId} />;

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
        return <Inbox userId={userId} />;

      default:
        return <Home onSelectPortfolio={handleSelectPortfolio} userId={userId} />;
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
              className="hidden group-hover:block h-11 w-35 object-contain mb-2"
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
              const isGoals = item.id === "goals";

              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveView(item.id)}
                    className={[
                      "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors relative",
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

                    {/* Circulito azul con número de metas activas */}
                    {isGoals && activeGoals > 0 && (
                      <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="flex items-center justify-center rounded-full bg-blue-500 text-white text-[10px] h-5 min-w-[20px] px-1">
                          {activeGoals}
                        </div>
                      </div>
                    )}
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

        {/* User Info - Popup */}
        <div className="p-4 border-t border-gray-200">
          <Popover>
            <PopoverTrigger asChild>
              <button className="relative w-full bg-green-50 rounded-lg p-4 flex items-center justify-center gap-3 hover:bg-green-100 transition-colors">
                {/* Icono usuario */}
                <div className="relative flex items-center">
                  <User className="h-6 w-6 text-green-700 flex-shrink-0" />
                </div>

                {/* Email solo cuando el sidebar está expandido */}
                <span
                  className="
                    hidden group-hover:inline
                    opacity-0 group-hover:opacity-100
                    transition-all duration-300
                    whitespace-nowrap text-sm
                  "
                >
                  {loggedUser?.correo}
                </span>

                {/* Badge de metas en la esquina superior derecha */}
                <Badge
                  className="
                    absolute
                    -top-1
                    -right-1
                    min-w-[18px]
                    h-[18px]
                    flex items-center justify-center
                    rounded-full
                    bg-green-600
                    text-[10px]
                    px-1.5
                  "
                >
                  {activeGoals}
                </Badge>
                {/* Badge del logro seleccionado - esquina superior izquierda */}
                {selectedAchievementId && (
                  <div className="absolute -top-1 -left-1 bg-green-600 rounded-full h-5 w-5 flex items-center justify-center">
                    <div className="bg-white rounded-full p-[2px]">
                      {getAchievementIcon(
                        PREDEFINED_ACHIEVEMENTS.find(a => a.id === selectedAchievementId)?.icon || null
                      )}
                    </div>
                  </div>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent 
              side="right" 
              align="end" 
              className="w-64 p-4 space-y-3"
              sideOffset={8}
            >
              {/* User Email */}
              <div className="border-b border-gray-200 pb-3">
                <p className="text-xs text-gray-500">Conectado como</p>
                <p className="text-sm truncate">{loggedUser?.correo}</p>
              </div>

              {/* Goals Button with Badge */}
              <button
                onClick={() => {
                  setActiveView("goals");
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative ${
                  activeView === "goals"
                    ? "bg-green-50 text-green-600"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Target className="h-5 w-5 flex-shrink-0" />
                <span className="whitespace-nowrap">Mis Metas</span>
                {/* Badge contador de metas activas */}
                <Badge className="ml-auto bg-green-600 hover:bg-green-600 min-w-[20px] h-5 flex items-center justify-center px-1.5">
                  {activeGoals}
                </Badge>
              </button>
              
              {/* Logout Button */}
              <Button
                onClick={handleLogoutClick}
                variant="outline"
                className="w-full flex items-center justify-center gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="h-4 w-4" />
                <span className="whitespace-nowrap">Cerrar Sesión</span>
              </Button>
            </PopoverContent>
          </Popover>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Content */}
        <div className="p-6">{renderView()}</div>
      </main>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrar sesión?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de cerrar sesión. Tendrás que volver a iniciar sesión para acceder a tus datos financieros.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleLogoutCancel}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogoutConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Cerrar Sesión
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
