import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/cardLog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { createClient } from "@/utils/client";
import bcrypt from "bcryptjs";


interface LoginProps {
  onLogin?: (email: string, password: string) => void; // opcional
  onSwitchToRegister: () => void;
  onBackToLanding: () => void;
}

export function Login({ onLogin, onSwitchToRegister, onBackToLanding }: LoginProps) {
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

    if (newErrors.email || newErrors.password) return;

    try {
      setLoading(true);

      // 1️⃣ Buscar usuario solo por correo
      const { data: user, error } = await createClient
        .from("usuario")
        .select("id_usuario, nombre_usuario, correo, contrasena")
        .eq("correo", email)
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

      // 2️⃣ Comparar password con hash
      const match = bcrypt.compareSync(password, user.contrasena);
      if (!match) {
        setGlobalError("Correo o contraseña incorrectos.");
        return;
      }

      // 3️⃣ Guardar usuario (sin el hash) en sesión
      const { contrasena, ...userSafe } = user;
      sessionStorage.setItem("usuario", JSON.stringify(userSafe));

      if (onLogin) {
        onLogin(email, password);
      }

      // Redirigir al dashboard si quieres
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

      <Card className="shadow-xl border-0 p-6">

        {/* Back Button */}
        {onBackToLanding && (
          <button
            onClick={onBackToLanding}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver al inicio</span>
          </button>
        )}

        {/* Logo + Branding */}
        <div className="text-center mb-0">
          <div className="flex justify-center">
            <img src="/logo.png" alt="Frakto Logo" className="h-11 w-35" />
          </div>
        </div>

        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-semibold">Iniciar Sesión</CardTitle>
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

            {/* Email */}
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

            {/* Password */}
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
            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Iniciar Sesión"}
            </Button>

            {/* Register Prompt */}
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
