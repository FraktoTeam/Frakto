# Frakto - Guías del Proyecto

## Descripción General

Frakto es una aplicación financiera completa para gestión de finanzas personales. Permite crear múltiples carteras, registrar ingresos y gastos con categorías predefinidas, gestionar gastos fijos recurrentes, recibir notificaciones de alertas, generar reportes PDF mensuales, y visualizar toda la actividad financiera en un calendario interactivo. Construida con React y Tailwind CSS v4, se enfoca en una experiencia de usuario intuitiva, validaciones robustas y un diseño visual profesional.

## Paleta de Colores

### Colores Principales

- **Verde (Primary)**: Utilizado como color de marca y acentos principales
  - Verde primario: `green-600`
  - Verde claro: `green-50`
  - Emerald: `emerald-600` para variaciones
  - Teal: `teal-600` para elementos complementarios

### Colores de Apoyo

- **Grises**: Para textos secundarios, bordes y fondos
  - Fondo principal: `bg-gray-50`
  - Texto secundario: `text-gray-500`
  - Bordes: `border-gray-200`

### Colores de Estado

- **Verde**: Para rendimientos positivos y tendencias al alza
- **Rojo**: Para rendimientos negativos y tendencias a la baja
  - Rojo positivo: `text-red-600`

## Tipografía

### Pesos de Fuente

La aplicación utiliza un sistema de pesos de fuente personalizado definido en `styles/globals.css`:

- **Font Weight Medium (600)**: Para títulos, labels, botones y elementos destacados
- **Font Weight Normal (450)**: Para textos regulares y párrafos

### Jerarquía de Texto

- **h1**: Títulos principales (text-2xl, font-weight: 600)
- **h2**: Títulos de sección (text-xl, font-weight: 600)
- **h3**: Subtítulos (text-lg, font-weight: 600)
- **p**: Texto regular (text-base, font-weight: 450)

### Énfasis Visual

Para elementos que requieren mayor presencia visual:

- Valores monetarios: `font-bold`
- Títulos importantes: `font-semibold`
- Labels de formularios: `font-medium` (por defecto)

## Componentes Principales

### App.tsx

Componente raíz que gestiona:

- Navegación entre vistas (Home, Cartera, Gastos Fijos, Buzón, Reportes, Calendario)
- Menú lateral desplegable con hover
- Estado global de la aplicación
- Badge de contador de notificaciones en el icono del Buzón

**Características del menú lateral:**

- Ancho por defecto: 20 (solo iconos)
- Ancho expandido: 64 (con hover)
- Transición suave de 300ms
- Sticky user info en la parte inferior
- Indicador visual de vista activa (fondo verde claro)

### Home.tsx

Dashboard principal que muestra:

- **Balance Total**: Card destacada con valor total, cambio porcentual vs mes anterior
- **Carrusel de Carteras**:
  - Navegación con flechas laterales
  - Responsive: 1 card en móvil, 2 en tablet, 3 en desktop
  - Cada cartera muestra: nombre, balance, cambio mensual y tendencia
  - Click para ver detalles de cada cartera
- **Últimos 10 Movimientos**:
  - Lista scrollable de transacciones recientes
  - Muestra: cartera origen, descripción, categoría, fecha y monto
  - Montos en negrita con colores (verde para ingresos, rojo para gastos)
  - Click para navegar a la cartera específica

### Portfolio.tsx

Gestión completa de carteras y movimientos:

**Vista de Lista:**

- Grid responsive de carteras (1/2/3 columnas)
- Cada cartera muestra: nombre, balance, número de transacciones, última actualización
- Botón "Nueva Cartera" para crear
- Click en cartera para ver detalles

**Vista Detallada de Cartera:**

- **Información de la Cartera**:
  - Card con balance total, número de transacciones, última actualización
  - Indicador de tendencia (verde/rojo)
  - Cambio porcentual vs mes anterior
  - Botón "Volver atrás"
- **Acciones de Movimientos**:
  - Botón "Añadir Ingreso" (verde)
  - Botón "Añadir Gasto" (outline)
- **Lista de Transacciones**:
  - Card scrollable (max-height 400px)
  - Cada transacción muestra: descripción, categoría (solo gastos), fecha, monto
  - Botones de editar y eliminar (aparecen con hover)
  - Montos formateados: +$X,XXX.XX (verde) para ingresos, -$X,XXX.XX (rojo) para gastos
  - Orden: más recientes primero

**Formularios de Movimientos:**

- **Registrar Ingreso**:
  - Campos: Importe, Fecha, Descripción (opcional)
  - Validaciones: importe > 0, fecha obligatoria
  - Descripción por defecto: "Ingreso"
- **Registrar Gasto**:
  - Campos: Importe, Categoría (obligatorio), Fecha, Descripción (opcional)
  - Categorías: Ocio, Hogar, Transporte, Comida, Factura
  - Validaciones: categoría obligatoria, importe > 0
  - Descripción por defecto: "Gasto"
- **Editar Movimiento**:
  - Pre-rellena datos actuales
  - Validación de descripción: máx 256 caracteres con contador
  - Recálculo automático del balance al guardar
- **Eliminar Movimiento**:
  - Dialog de confirmación con detalles del movimiento
  - Actualización automática del balance
  - Botón destructivo (rojo)

### FixedExpenses.tsx

Gestión de gastos fijos recurrentes:

- **Lista de Gastos Fijos**:
  - Card para cada gasto con: nombre, monto, frecuencia, cartera, próximo pago
  - Badge de estado (Pendiente/Pagado)
  - Indicador visual: borde naranja si está próximo a vencer (≤3 días)
  - Botones de acción: Marcar como Pagado, Editar, Eliminar
- **Crear Gasto Fijo**:
  - Campos: Nombre, Monto, Frecuencia (Mensual/Semanal/Anual), Fecha Inicio, Cartera
  - Validaciones: todos los campos obligatorios, monto > 0
  - Categorías disponibles: Ocio, Hogar, Transporte, Comida, Factura
- **Funcionalidades**:
  - Marcar como pagado: registra el gasto en la cartera, actualiza balance, genera próxima fecha
  - Editar: modifica datos del gasto fijo
  - Eliminar: confirmación antes de eliminar
  - Generación automática de alertas si un gasto está próximo a vencer

### Inbox.tsx

Buzón de notificaciones y alertas:

- **Banner de Alerta Flotante** (fijo en top):
  - Aparece cuando hay alertas pendientes
  - Fondo amarillo claro con icono de alerta
  - Muestra cantidad de alertas
  - Botón para cerrar (X)
- **Lista de Alertas**:
  - Card para cada alerta con: icono, descripción, fecha
  - Badge de estado: "Pendiente" (amarillo) / "Resuelta" (verde)
  - Botones de acción: Marcar como Resuelta, Eliminar (solo resueltas)
- **Generación Automática de Alertas**:
  - Se crean automáticamente cuando un gasto fijo está próximo a vencer (≤3 días)
  - Texto: "Gasto fijo '[nombre]' vence el [fecha]"
- **Contador en Menú**:
  - Badge rojo en el icono del Buzón con número de alertas pendientes

### Reports.tsx

Generación de reportes PDF mensuales:

- **Selector de Mes y Año**:
  - Desplegables para seleccionar mes y año
  - Por defecto: mes anterior al actual
- **Selector de Cartera**:
  - Opción "Todas las Carteras" o cartera específica
- **Botón Generar Reporte**:
  - Descarga PDF con nombre: `Reporte_[Mes]_[Año]_[Cartera].pdf`
- **Contenido del PDF**:
  - **Encabezado**: Título, logo, período del reporte
  - **Resumen Ejecutivo**: Balance inicial, total ingresos, total gastos, balance final
  - **Tabla de Ingresos**: Fecha, descripción, monto
  - **Tabla de Gastos**: Fecha, descripción, categoría, monto
  - **Distribución por Categoría**: Tabla con totales por categoría
  - **Pie de Página**: Fecha de generación
- **Filtrado**:
  - Solo incluye movimientos del mes/año seleccionado
  - Filtro adicional por cartera si se selecciona una específica

### Calendar.tsx

Calendario financiero interactivo:

- **Vista de Calendario Mensual**:
  - Selector de mes/año con botones de navegación
  - Grid de días del mes actual
  - Indicadores visuales en días con movimientos:
    - Badge verde: días con ingresos
    - Badge rojo: días con gastos
    - Ambos badges si hay ingresos y gastos
- **Modal de Detalle de Día**:
  - Se abre al hacer click en un día con movimientos
  - Muestra fecha completa en el título
  - Filtro por cartera (desplegable)
  - Lista de movimientos del día:
    - Descripción, categoría (si es gasto), cartera, monto
    - Colores: verde para ingresos, rojo para gastos
  - Totales del día: Total Ingresos, Total Gastos, Balance Neto
- **Navegación**:
  - Botones "Anterior" y "Siguiente" para cambiar de mes
  - Título centrado con mes y año actual
  - Días de semana: Dom, Lun, Mar, Mié, Jue, Vie, Sáb

## Guía de Codificación

Esta sección define los estándares de código para mantener consistencia en todo el proyecto Frakto.

### 1. Nomenclatura (Naming Conventions)

#### Componentes React

- **PascalCase** para nombres de componentes
- Usar nombres descriptivos que reflejen la funcionalidad
- Un componente por archivo

```tsx
// ✅ Correcto
export function Portfolio() { ... }
export function Home() { ... }
export function PortfolioCard() { ... }

// ❌ Incorrecto
export function portfolio() { ... }
export function home_component() { ... }
```

#### Variables y Funciones

- **camelCase** para variables, funciones y estados
- Nombres descriptivos en inglés para lógica/estado
- Contenido de datos puede estar en español (UI facing)

```tsx
// ✅ Correcto - Estado y funciones
const [activeView, setActiveView] = useState("home");
const [selectedPortfolio, setSelectedPortfolio] = useState(null);
const [isDialogOpen, setIsDialogOpen] = useState(false);

function handleAddPortfolio() { ... }
function renderView() { ... }

// ✅ Correcto - Datos de contenido en español
const menuItems = [
  { id: "home", label: "Home", icon: HomeIcon },
  { id: "portfolio", label: "Cartera", icon: Briefcase },
];

const metrics = [
  { title: "Balance Total", value: "$124,850.50" },
  { title: "Ahorro del Mes", value: "$8,430.50" },
];

// ❌ Incorrecto
const ActiveView = "home";  // No usar PascalCase para variables
const handle_add_portfolio = () => { ... };  // No usar snake_case
```

#### Interfaces y Tipos TypeScript

- **PascalCase** para interfaces y tipos
- Nombres descriptivos sin prefijo "I"
- Definir siempre antes del componente que las usa

```tsx
// ✅ Correcto
interface PortfolioItem {
  id: number;
  name: string;
  balance: string;
  monthlyChange: string;
  trend: "up" | "down";
  transactions: number;
}

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ComponentType;
}

// ❌ Incorrecto
interface IPortfolio { ... }  // No usar prefijo "I"
interface portfolio_item { ... }  // No usar snake_case
type portfolioitem { ... }  // Debe ser PascalCase
```

#### Constantes

- **camelCase** para constantes locales
- **UPPER_SNAKE_CASE** solo para constantes globales verdaderas (configuración)

```tsx
// ✅ Correcto - Constantes locales
const menuItems = [...];
const defaultPortfolios = [...];

// ✅ Correcto - Constantes globales (si existieran)
const API_BASE_URL = "https://api.Frakto.com";
const MAX_PORTFOLIOS = 50;
```

### 2. Estructura de Archivos y Componentes

#### Organización de Imports

Siempre seguir este orden:

```tsx
// 1. React y hooks de React
import { useState, useEffect } from "react";

// 2. Componentes de UI (ShadCN)
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Dialog, DialogContent } from "./ui/dialog";

// 3. Componentes personalizados (si aplica)
import { CustomComponent } from "./components/CustomComponent";

// 4. Iconos de lucide-react
import {
  Home,
  Briefcase,
  Plus,
  TrendingUp,
} from "lucide-react";

// 5. Tipos e interfaces (si están en archivos separados)
import type { PortfolioItem } from "./types";
```

#### Estructura Interna del Componente

Mantener este orden consistente:

```tsx
import { useState } from "react";
import { Card } from "./ui/card";
import { Plus } from "lucide-react";

// 1. Interfaces y tipos
interface PortfolioItem {
  id: number;
  name: string;
}

// 2. Datos mock (si son constantes globales del componente)
const MOCK_DATA = [...];

// 3. Componente principal
export function Portfolio() {
  // 4. Estados (useState, useReducer)
  const [portfolios, setPortfolios] = useState<PortfolioItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 5. Datos locales (si son variables calculadas o específicas del render)
  const wallets = [...];

  // 6. Effects (useEffect)
  useEffect(() => {
    // Lógica de efecto
  }, []);

  // 7. Funciones auxiliares y event handlers
  const handleAddPortfolio = () => {
    // Lógica
  };

  const handleDelete = (id: number) => {
    // Lógica
  };

  // 8. Renderizado condicional o funciones de render
  const renderPortfolioCard = (item: PortfolioItem) => {
    return <Card>...</Card>;
  };

  // 9. Return con JSX
  return (
    <div className="space-y-6">
      {/* Contenido */}
    </div>
  );
}
```

### 3. TypeScript

#### Tipado Estricto

- Siempre tipar estados complejos
- Usar interfaces para objetos con estructura definida
- Evitar `any` a toda costa

```tsx
// ✅ Correcto
const [portfolios, setPortfolios] = useState<PortfolioItem[]>([]);
const [count, setCount] = useState<number>(0);
const [isOpen, setIsOpen] = useState<boolean>(false);

// ✅ Correcto - Función con tipos
const handleUpdate = (id: number, value: string): void => {
  // Lógica
};

// ❌ Incorrecto
const [data, setData] = useState<any>([]);  // Evitar any
const handleClick = (e) => { ... };  // Falta tipado del evento
```

#### Union Types para Estados

- Usar union types para valores limitados

```tsx
// ✅ Correcto
type ViewType = "home" | "portfolio" | "analytics" | "settings";
const [activeView, setActiveView] = useState<ViewType>("home");

interface PortfolioItem {
  trend: "up" | "down"; // Solo valores permitidos
  status: "active" | "inactive" | "pending";
}

// ❌ Incorrecto
const [activeView, setActiveView] = useState<string>("home"); // Demasiado amplio
```

#### Props de Componentes

- Siempre tipar props de componentes

```tsx
// ✅ Correcto
interface MetricCardProps {
  title: string;
  value: string;
  change?: string; // Opcional
  trend: "up" | "down";
}

export function MetricCard({
  title,
  value,
  change,
  trend,
}: MetricCardProps) {
  return <div>...</div>;
}

// ❌ Incorrecto
export function MetricCard({ title, value, change, trend }) {
  // Sin tipos
  return <div>...</div>;
}
```

### 4. Tailwind CSS

#### Regla Fundamental: No Sobreescribir Typography

**IMPORTANTE**: No usar clases de Tailwind para `font-size`, `font-weight` o `line-height` salvo necesidad específica.

```tsx
// ✅ Correcto - Usa estilos por defecto de globals.css
<h1>Título Principal</h1>
<h2>Subtítulo</h2>
<p>Texto normal</p>
<label>Etiqueta</label>

// ✅ Correcto - Solo cuando es necesario más énfasis
<p className="font-bold">$124,850.50</p>
<h2 className="font-semibold">Título Importante</h2>

// ❌ Incorrecto - No redefinir tamaños/pesos
<h1 className="text-3xl font-bold">Título</h1>  // Ya está definido en globals.css
<p className="text-base font-normal">Texto</p>  // Ya está definido en globals.css
```

#### Orden de Clases

Mantener un orden lógico consistente:

```tsx
// Layout → Spacing → Sizing → Colors → Typography → Effects
className="
  flex items-center justify-between     // Layout
  gap-4 p-6 space-y-2                   // Spacing
  w-full h-screen                        // Sizing
  bg-white border border-gray-200       // Colors
  font-bold                              // Typography (solo si es necesario)
  rounded-lg shadow-lg                   // Effects
  transition-all duration-300            // Transitions
  hover:bg-gray-100                      // States
"
```

#### Clases Condicionales

- Usar template literals para clases dinámicas
- Mantener la legibilidad

```tsx
// ✅ Correcto - Formato legible
<button
  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
    activeView === item.id
      ? "bg-green-50 text-green-600"
      : "text-gray-700 hover:bg-gray-100"
  }`}
>

// ✅ Correcto - Alternativa con variables
const buttonClasses = activeView === item.id
  ? "bg-green-50 text-green-600"
  : "text-gray-700 hover:bg-gray-100";

<button className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${buttonClasses}`}>

// ❌ Incorrecto - Difícil de leer
<button className={"w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors " + (activeView === item.id ? "bg-green-50 text-green-600" : "text-gray-700 hover:bg-gray-100")}>
```

#### Espaciado Consistente

Usar valores consistentes de spacing:

```tsx
// ✅ Correcto - Valores estándar
(gap - 2, gap - 3, gap - 4); // 0.5rem, 0.75rem, 1rem
(p - 4, p - 6); // 1rem, 1.5rem
(space - y - 4, space - y - 6); // Espaciado vertical
(mt - 4, mb - 6); // Márgenes

// Usar principalmente: 2, 3, 4, 6, 8, 12
```

### 5. Componentes React

#### Componentes Funcionales

- Siempre usar componentes funcionales con hooks
- Usar `export function` en lugar de `export default`

```tsx
// ✅ Correcto
export function Portfolio() {
  return <div>...</div>;
}

// ❌ Incorrecto
const Portfolio = () => {
  return <div>...</div>;
};
export default Portfolio;
```

#### Destructuring de Props

- Destructurar props en la firma de la función

```tsx
// ✅ Correcto
interface CardProps {
  title: string;
  value: string;
}

export function MetricCard({ title, value }: CardProps) {
  return (
    <div>
      {title}: {value}
    </div>
  );
}

// ❌ Incorrecto
export function MetricCard(props: CardProps) {
  return (
    <div>
      {props.title}: {props.value}
    </div>
  );
}
```

#### Keys en Listas

- Siempre usar `key` única y estable
- Preferir IDs sobre índices

```tsx
// ✅ Correcto
{
  portfolios.map((portfolio) => (
    <Card key={portfolio.id}>{portfolio.name}</Card>
  ));
}

// ⚠️ Aceptable solo si no hay ID disponible
{
  items.map((item, index) => (
    <div key={`item-${index}`}>{item.name}</div>
  ));
}

// ❌ Incorrecto
{
  items.map((item, index) => (
    <div key={index}>
      {" "}
      // índice solo no es suficientemente único
      {item.name}
    </div>
  ));
}
```

### 6. Event Handlers

#### Nomenclatura

- Prefijo `handle` para funciones event handler
- Nombres descriptivos

```tsx
// ✅ Correcto
const handleAddPortfolio = () => { ... };
const handleDelete = (id: number) => { ... };
const handleFormSubmit = (e: React.FormEvent) => { ... };
const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { ... };

// ❌ Incorrecto
const add = () => { ... };  // No descriptivo
const onClick = () => { ... };  // Confuso con el evento
const submitForm = (e) => { ... };  // Falta tipado
```

#### Inline vs Funciones

- Funciones simples pueden ser inline
- Lógica compleja debe estar en funciones separadas

```tsx
// ✅ Correcto - Simple inline
<button onClick={() => setIsOpen(true)}>Abrir</button>

// ✅ Correcto - Lógica compleja en función
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  // Validación
  // Transformación de datos
  // Llamada a API
  setIsSubmitting(true);
};

<form onSubmit={handleSubmit}>

// ❌ Incorrecto - Lógica compleja inline
<form onSubmit={(e) => {
  e.preventDefault();
  const data = new FormData(e.target);
  // 20 líneas más...
}}>
```

### 7. Estado y Datos

#### Inicialización de Estado

- Inicializar estados con valores apropiados
- No dejar undefined sin motivo

```tsx
// ✅ Correcto
const [portfolios, setPortfolios] = useState<PortfolioItem[]>(
  [],
);
const [selectedId, setSelectedId] = useState<number | null>(
  null,
);
const [isLoading, setIsLoading] = useState(false);
const [searchTerm, setSearchTerm] = useState("");

// ❌ Incorrecto
const [portfolios, setPortfolios] = useState(); // undefined
const [count, setCount] = useState(); // debería ser 0
```

#### Mock Data

- Definir mock data fuera del componente cuando sea posible
- Usar estructura consistente

```tsx
// ✅ Correcto - Fuera del componente
const MOCK_PORTFOLIOS: PortfolioItem[] = [
  {
    id: 1,
    name: "Cartera Personal",
    balance: "$45,200.00",
    monthlyChange: "+$2,450.00",
    trend: "up",
    transactions: 24,
  },
  // ...
];

export function Portfolio() {
  const [portfolios, setPortfolios] = useState(MOCK_PORTFOLIOS);
  // ...
}

// ⚠️ Aceptable - Dentro si es pequeño y específico
export function Home() {
  const metrics = [
    { title: "Balance Total", value: "$124,850.50" },
    { title: "Ahorro del Mes", value: "$8,430.50" },
  ];
  // ...
}
```

### 8. Comentarios y Documentación

#### Cuándo Comentar

- Comentar lógica compleja o no obvia
- No comentar código obvio
- Usar comentarios para secciones

```tsx
// ✅ Correcto - Comentarios útiles
export function Portfolio() {
  const [portfolios, setPortfolios] = useState<PortfolioItem[]>(
    [],
  );

  // Calcular el rendimiento total combinando todas las carteras
  const totalPerformance = portfolios.reduce(
    (acc, portfolio) => {
      return acc + parseFloat(portfolio.performance);
    },
    0,
  );

  return (
    <div>
      {/* Metrics Grid */}
      <div className="grid gap-4">...</div>

      {/* Portfolio List */}
      <div className="space-y-4">...</div>
    </div>
  );
}

// ❌ Incorrecto - Comentarios obvios
// Definir estado para portfolios
const [portfolios, setPortfolios] = useState([]);

// Retornar el componente
return <div>...</div>;
```

### 9. Importación de Componentes ShadCN

#### Paths Correctos

- Siempre importar desde `./ui/` para componentes ShadCN
- No crear versiones propias de componentes ShadCN existentes

```tsx
// ✅ Correcto
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "./ui/dialog";

// ❌ Incorrecto
import { Button } from "./components/ui/button"; // Path incorrecto desde componentes
import { Button } from "@/components/ui/button"; // No usar alias @
```

### 10. Formato y Estilo

#### Indentación

- 2 espacios para indentación
- Consistente en todo el proyecto

#### Comillas

- Usar comillas dobles `"` para strings en JSX
- Usar comillas dobles para strings en TypeScript

```tsx
// ✅ Correcto
<div className="flex items-center">
const message = "Hola mundo";

// ❌ Incorrecto
<div className='flex items-center'>
const message = 'Hola mundo';
```

#### Punto y coma

- Usar punto y coma al final de las declaraciones

```tsx
// ✅ Correcto
const value = 10;
import { Button } from "./ui/button";

// ❌ Incorrecto
const value = 10;
import { Button } from "./ui/button";
```

### 11. Patrones a Evitar

#### Anti-Patrones Comunes

```tsx
// ❌ EVITAR: Mutar estado directamente
portfolios.push(newItem);
setPortfolios(portfolios);

// ✅ CORRECTO: Crear nuevo array
setPortfolios([...portfolios, newItem]);

// ❌ EVITAR: Demasiados estados relacionados
const [firstName, setFirstName] = useState("");
const [lastName, setLastName] = useState("");
const [email, setEmail] = useState("");
const [phone, setPhone] = useState("");

// ✅ CORRECTO: Agrupar en objeto
interface UserForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}
const [formData, setFormData] = useState<UserForm>({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
});

// ❌ EVITAR: Inline styles para cosas que deberían ser clases
<div style={{ display: "flex", gap: "1rem", padding: "1.5rem" }}>

// ✅ CORRECTO: Usar Tailwind
<div className="flex gap-4 p-6">

// ❌ EVITAR: Lógica compleja en JSX
return (
  <div>
    {portfolios.filter(p => p.active).map(p => {
      const performance = calculatePerformance(p);
      const trend = performance > 0 ? "up" : "down";
      return <Card key={p.id}>{/* ... */}</Card>;
    })}
  </div>
);

// ✅ CORRECTO: Extraer lógica
const activePortfolios = portfolios
  .filter(p => p.active)
  .map(p => ({
    ...p,
    performance: calculatePerformance(p),
    trend: calculatePerformance(p) > 0 ? "up" : "down",
  }));

return (
  <div>
    {activePortfolios.map(portfolio => (
      <Card key={portfolio.id}>{/* ... */}</Card>
    ))}
  </div>
);
```

### 12. Checklist de Revisión de Código

Antes de considerar completada una funcionalidad, verificar:

- [ ] ¿Todas las variables y funciones tienen nombres descriptivos?
- [ ] ¿Se usan interfaces TypeScript para estructuras de datos?
- [ ] ¿Los imports están ordenados correctamente?
- [ ] ¿Se evitan las clases de Tailwind para font-size/weight/line-height innecesarias?
- [ ] ¿Las clases de Tailwind están en orden lógico?
- [ ] ¿Se usan componentes ShadCN cuando están disponibles?
- [ ] ¿Se sobrescriben los estilos por defecto de componentes ShadCN según las guías?
- [ ] ¿Los event handlers tienen el prefijo `handle`?
- [ ] ¿Todas las listas tienen keys únicas?
- [ ] ¿El código está libre de `any` y valores sin tipar?
- [ ] ¿Los comentarios son útiles y no obvios?
- [ ] ¿Se siguen los colores de la marca (verde en lugar de azul)?

## Responsive Design

### Breakpoints

- `md:` - 768px (tablets)
- `lg:` - 1024px (desktops)

### Grids Responsivos

```tsx
// Ejemplo de grid que se adapta
className = "grid gap-4 md:grid-cols-2 lg:grid-cols-4";
```

## Interactividad

### Transiciones

- Usar `transition-all duration-300` para animaciones suaves
- Hover states en botones y cards
- Estados activos con colores de marca (verde)

### Estados Visuales

```tsx
// Ejemplo de botón activo
className={`... ${
  activeView === item.id
    ? "bg-green-50 text-green-600"
    : "text-gray-700 hover:bg-gray-100"
}`}
```

## Librerías Adicionales

La aplicación utiliza las siguientes librerías externas:

- **jsPDF**: Generación de documentos PDF
  - `import { jsPDF } from "jspdf"`
  - `import "jspdf-autotable"` para tablas automáticas
  - Uso principal: Generación de reportes mensuales

**Ejemplo de uso básico:**

```tsx
import { jsPDF } from "jspdf";
import "jspdf-autotable";

const doc = new jsPDF();
doc.text("Título del Documento", 14, 20);
doc.autoTable({
  head: [["Columna 1", "Columna 2"]],
  body: [["Dato 1", "Dato 2"]],
  startY: 30,
});
doc.save("documento.pdf");
```

## Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Preview
npm run preview
```

## Contacto y Soporte

Para preguntas sobre el proyecto o sugerencias de mejora, contactar al equipo de desarrollo de Frakto.

---

**Última actualización**: 13 de Noviembre, 2025  
**Versión**: 2.0.0
**Mantenedor**: Equipo Frakto

## v2.0.0 - 13 de Noviembre, 2025