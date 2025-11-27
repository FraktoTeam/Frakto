import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { createClient } from "@/utils/client";
 // 👈 igual que en tu servicio

interface RegisterProps {
  onRegister?: (email: string, password: string) => void; // sigue siendo opcional
  onSwitchToLogin: () => void;
}

export function Register({ onRegister, onSwitchToLogin }: RegisterProps) {
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState(""); // nombre_usuario
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "", confirmPassword: "", nombre: "" });
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const passwordRequirements = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSymbol: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const allPasswordRequirementsMet = Object.values(passwordRequirements).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError("");
    setSuccessMessage("");

    const newErrors = { email: "", password: "", confirmPassword: "", nombre: "" };

    // Validar nombre de usuario
    if (!nombre.trim()) {
      newErrors.nombre = "El nombre de usuario es obligatorio";
    } else if (nombre.trim().length < 3) {
      newErrors.nombre = "El nombre de usuario debe tener al menos 3 caracteres";
    }

    // Validar email
    if (!email) {
      newErrors.email = "El correo electrónico es obligatorio";
    } else if (!validateEmail(email)) {
      newErrors.email = "Por favor, ingresa un correo electrónico válido";
    }

    // Validar password
    if (!password) {
      newErrors.password = "La contraseña es obligatoria";
    } else if (!passwordRequirements.minLength) {
      newErrors.password = "La contraseña debe tener al menos 8 caracteres";
    } else if (!passwordRequirements.hasUpperCase) {
      newErrors.password = "La contraseña debe incluir al menos una mayúscula";
    } else if (!passwordRequirements.hasLowerCase) {
      newErrors.password = "La contraseña debe incluir al menos una minúscula";
    } else if (!passwordRequirements.hasNumber) {
      newErrors.password = "La contraseña debe incluir al menos un número";
    } else if (!passwordRequirements.hasSymbol) {
      newErrors.password = "La contraseña debe incluir al menos un símbolo especial";
    }

    // Validar confirmación de contraseña
    if (!confirmPassword) {
      newErrors.confirmPassword = "Debes confirmar tu contraseña";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    setErrors(newErrors);

    // Si hay errores de validación, no seguimos
    if (Object.values(newErrors).some((v) => v !== "")) return;

    try {
      setLoading(true);

      // 1️⃣ Comprobar si ya existe un usuario con ese correo
      const { data: existingUser, error: existingError } = await createClient
        .from("usuario")
        .select("id_usuario")
        .eq("correo", email)
        .maybeSingle();

      if (existingError) {
        console.error(existingError);
      }

      if (existingUser) {
        setGlobalError("Ya existe una cuenta con este correo electrónico.");
        return;
      }

      // 2️⃣ Crear usuario en la tabla usuario
      const { data: newUser, error: insertError } = await createClient
        .from("usuario")
        .insert([
          {
            correo: email,
            contrasena: password, // ⚠️ En producción sería mejor hash en el backend
            nombre_usuario: nombre.trim(),
          },
        ])
        .select("id_usuario, nombre_usuario, correo")
        .single();

      if (insertError) {
        console.error(insertError);
        setGlobalError("No se ha podido crear la cuenta. Inténtalo de nuevo.");
        return;
      }

      // 3️⃣ Guardar usuario (ejemplo: localStorage; cámbialo a tu gusto)
      if (newUser) {
        localStorage.setItem("usuario", JSON.stringify(newUser));
      }

      // 4️⃣ Avisar al padre si sigue usando la prop antigua
      if (onRegister) {
        onRegister(email, password);
      }

      setSuccessMessage("Cuenta creada correctamente. ¡Bienvenido/a! 🎉");
      // Opcional: pasar directamente al login
      // onSwitchToLogin();
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
            <CardTitle className="text-2xl">Crear Cuenta</CardTitle>
            <CardDescription>
              Regístrate para empezar a gestionar tus finanzas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Mensajes globales */}
              {globalError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                  {globalError}
                </div>
              )}
              {successMessage && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700">
                  {successMessage}
                </div>
              )}

              {/* Nombre de usuario */}
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre de usuario</Label>
                <Input
                  id="nombre"
                  type="text"
                  placeholder="Tu nombre o alias"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className={errors.nombre ? "border-red-500" : ""}
                />
                {errors.nombre && (
                  <p className="text-sm text-red-600">{errors.nombre}</p>
                )}
              </div>

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

                {/* Password Requirements */}
                {password && (
                  <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">La contraseña debe contener:</p>
                    <div className="space-y-1">
                      <RequirementItem
                        met={passwordRequirements.minLength}
                        text="Mínimo 8 caracteres"
                      />
                      <RequirementItem
                        met={passwordRequirements.hasUpperCase}
                        text="Al menos 1 mayúscula (A-Z)"
                      />
                      <RequirementItem
                        met={passwordRequirements.hasLowerCase}
                        text="Al menos 1 minúscula (a-z)"
                      />
                      <RequirementItem
                        met={passwordRequirements.hasNumber}
                        text="Al menos 1 número (0-9)"
                      />
                      <RequirementItem
                        met={passwordRequirements.hasSymbol}
                        text="Al menos 1 símbolo (!@#$%...)"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={errors.confirmPassword ? "border-red-500" : ""}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={loading || (!allPasswordRequirementsMet && password !== "")}
              >
                {loading ? "Creando cuenta..." : "Crear Cuenta"}
              </Button>

              {/* Login Link */}
              <div className="text-center text-sm">
                <span className="text-gray-500">¿Ya tienes una cuenta? </span>
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  Inicia sesión
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      {met ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <X className="h-4 w-4 text-gray-400" />
      )}
      <span className={`text-xs ${met ? "text-green-600" : "text-gray-600"}`}>
        {text}
      </span>
    </div>
  );
}
