import { 
  Briefcase, 
  TrendingUp, 
  PieChart, 
  Shield, 
  Clock, 
  Target,
  CheckCircle,
  BarChart3,
  Calendar,
  Bell
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { FaSquareXTwitter, FaInstagram, FaTiktok } from "react-icons/fa6";


interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
}

export function LandingPage({ onLogin, onRegister }: LandingPageProps) {
  const features = [
    {
      icon: Briefcase,
      title: "Múltiples Carteras",
      description: "Organiza tu dinero en diferentes carteras según tus necesidades y objetivos financieros."
    },
    {
      icon: BarChart3,
      title: "Análisis Detallado",
      description: "Visualiza tus finanzas con gráficos interactivos y obtén insights valiosos de tus hábitos."
    },
    {
      icon: Target,
      title: "Metas de Ahorro",
      description: "Define objetivos financieros y monitorea tu progreso hacia ellos en tiempo real."
    },
    {
      icon: Calendar,
      title: "Calendario Financiero",
      description: "Visualiza todos tus movimientos en un calendario interactivo mensual."
    },
    {
      icon: Bell,
      title: "Notificaciones Inteligentes",
      description: "Recibe alertas sobre gastos fijos próximos a vencer y eventos importantes."
    },
    {
      icon: PieChart,
      title: "Reportes PDF",
      description: "Genera reportes mensuales detallados con toda tu actividad financiera."
    }
  ];

  const benefits = [
    "Control total de tus finanzas personales",
    "Interfaz intuitiva y fácil de usar",
    "Seguimiento de gastos e ingresos",
    "Categorización automática de transacciones",
    "Totalmente gratuito y seguro",
    "Acceso desde cualquier dispositivo"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-gray-50">
      {/* Header/Navigation */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Frakto Logo" className="h-11 w-35" />
            </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={onLogin}
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              Iniciar Sesión
            </Button>
            <Button 
              onClick={onRegister}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Registrarse
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 md:py-28">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          
          <h1 className="text-4xl md:text-6xl text-gray-900">
            Toma el control de tus{" "}
            <span className="text-green-600">finanzas personales</span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Frakto te ayuda a gestionar tu dinero de forma simple e inteligente. 
            Crea carteras, registra movimientos, establece metas y visualiza tus progresos.
          </p>

          <div className="flex items-center justify-center gap-4 pt-6">
            <Button 
              onClick={onRegister}
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg"
            >
              Comenzar Gratis
            </Button>
            <Button 
              onClick={onLogin}
              size="lg"
              variant="outline"
              className="border-gray-300 px-8 py-6 text-lg"
            >
              Ya tengo cuenta
            </Button>
          </div>

          <div className="pt-8 flex items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Sin costo</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Sin tarjeta</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>100% seguro</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 bg-white">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl text-gray-900">
            Todo lo que necesitas en un solo lugar
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Herramientas poderosas y fáciles de usar para gestionar tus finanzas personales
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="border border-gray-200 hover:border-green-600 transition-all hover:shadow-lg group"
              >
                <CardContent className="p-6 space-y-3">
                  <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center group-hover:bg-green-600 transition-colors">
                    <Icon className="h-6 w-6 text-green-600 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-xl text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl p-12 md:p-16 text-white">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl">
                ¿Por qué elegir Frakto?
              </h2>
              <p className="text-lg text-green-50">
                Una solución completa y profesional para gestionar tus finanzas personales 
                con todas las herramientas que necesitas.
              </p>
              <Button 
                onClick={onRegister}
                size="lg"
                className="bg-white text-green-600 hover:bg-green-50 px-8 py-6 text-lg"
              >
                Crear mi cuenta gratis
              </Button>
            </div>

            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-4"
                >
                  <CheckCircle className="h-6 w-6 flex-shrink-0" />
                  <span className="text-lg">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div className="space-y-2">
            <div className="flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-4xl text-gray-900">100%</h3>
            <p className="text-gray-600">Gestión financiera inteligente</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-center">
              <Shield className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-4xl text-gray-900">Seguro</h3>
            <p className="text-gray-600">Tus datos protegidos</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-center">
              <Clock className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-4xl text-gray-900">24/7</h3>
            <p className="text-gray-600">Acceso en todo momento</p>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="space-y-6">
          <h2 className="text-3xl md:text-4xl text-gray-900">
            Comienza a gestionar tus finanzas hoy
          </h2>
          <p className="text-xl text-gray-600">
            Únete a Frakto y descubre una nueva forma de controlar tu dinero
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Button 
              onClick={onRegister}
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg"
            >
              Registrarse Ahora
            </Button>
          </div>
        </div>
      </section>
        {/* Footer */}
        <footer className="border-t border-gray-200 bg-gray-50 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-10 space-y-6">
          {/* Iconos redes sociales SIEMPRE CENTRADOS */}
            <div className="flex justify-center items-center gap-6 text-2xl">
              <img 
                src="/logo.png" 
                alt="Frakto Logo" 
                className="h-10 w-auto opacity-90"
              />
              <div className="w-px h-6 bg-gray-300"></div>
              <FaTiktok className="hover:text-[#00ffe0] transition cursor-pointer" />
              <FaInstagram className="hover:text-[#ff008f] transition cursor-pointer" />
              <FaSquareXTwitter className="hover:text-green-600 transition cursor-pointer" />
            </div>
          <div className="text-center">
            <p className="text-gray-600 text-sm">
              © 2025 Frakto. Gestión Financiera Personal.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
