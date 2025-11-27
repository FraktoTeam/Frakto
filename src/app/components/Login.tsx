import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/utils/client";


interface LoginProps {
  onLogin?: (email: string, password: string) => void; // opcional
  onSwitchToRegister: () => void;
}

export function Login({ onLogin, onSwitchToRegister }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError("");

    const newErrors = { email: "", password: "" };

    // Validar email
    if (!email) {
      newErrors.email = "El correo electrónico es obligatorio";
    } else if (!validateEmail(email)) {
      newErrors.email = "Por favor, ingresa un correo electrónico válido";
    }

    // Validar password
    if (!password) {
      newErrors.password = "La contraseña es obligatoria";
    }

    setErrors(newErrors);

    // Si hay errores de validación, no seguimos
    if (newErrors.email || newErrors.password) return;

    try {
      setLoading(true);

      // 1️⃣ Buscar usuario por correo y contraseña
      const { data: user, error } = await createClient
        .from("usuario")
        .select("id_usuario, nombre_usuario, correo")
        .eq("correo", email)
        .eq("contrasena", password)
        .maybeSingle();

      if (error) {
        console.error(error);
        setGlobalError("No se ha podido iniciar sesión. Inténtalo de nuevo.");
        return;
      }

      if (!user) {
        setGlobalError("Correo o contraseña incorrectos.");
        return;
      }

      // 2️⃣ Guardar usuario (ejemplo simple)
      localStorage.setItem("usuario", JSON.stringify(user));

      // 3️⃣ Avisar al componente padre si aún usa esa prop
      if (onLogin) {
        onLogin(email, password);
      }

      // Aquí podrías redirigir al dashboard:
      // router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      setGlobalError("Ha ocurrido un error inesperado. Inténtalo más tarde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-100 rounded-full opacity-30 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-100 rounded-full opacity-30 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-50 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-block bg-gradient-to-br from-green-600 to-emerald-600 text-white rounded-2xl p-4 mb-4 shadow-lg">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Frakto</h1>
          <p className="text-gray-600">Gestión Financiera Inteligente</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 text-center pb-6">
            <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
            <CardDescription>
              Ingresa tus credenciales para acceder a tu cuenta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Mensaje global */}
              {globalError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                  {globalError}
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={errors.password ? "border-red-500" : ""}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
                {loading ? "Entrando..." : "Iniciar Sesión"}
              </Button>

              {/* Demo credentials info (puedes quitarlo si ya no lo usas) */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                <p className="text-blue-800 mb-1 font-medium">Puedes crear tu propia cuenta 👇</p>
                <p className="text-blue-700 text-xs">
                  O usa las credenciales de prueba que ya tengas configuradas.
                </p>
              </div>

              {/* Register Link */}
              <div className="text-center text-sm">
                <span className="text-gray-500">¿No tienes una cuenta? </span>
                <button
                  type="button"
                  onClick={onSwitchToRegister}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  Regístrate aquí
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
