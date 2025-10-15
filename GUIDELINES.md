# Frakto - Guías del Proyecto

## Descripción General

Frakto es una aplicación financiera diseñada para gestionar carteras de inversión con un dashboard profesional. La aplicación está construida con React y Tailwind CSS v4, enfocándose en una experiencia de usuario intuitiva y un diseño visual limpio.

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

**IMPORTANTE**: No utilizar clases de Tailwind para `font-size`, `font-weight` o `line-height` a menos que sea específicamente necesario, ya que tenemos configuraciones por defecto en `globals.css`.

## Estructura del Proyecto



## Componentes Principales

### App.tsx
Componente raíz que gestiona:
- Navegación entre vistas
- Menú lateral desplegable con hover
- Estado global de la aplicación

**Características del menú lateral:**
- Ancho por defecto: 20 (solo iconos)
- Ancho expandido: 64 (con hover)
- Transición suave de 300ms
- Sticky user info en la parte inferior

### Home.tsx
Dashboard principal que muestra:
- 4 métricas principales en grid responsivo
- Actividad reciente de carteras
- Distribución de inversiones por tipo
- Top carteras por rendimiento

### Portfolio.tsx
Gestión de carteras con:
- Vista de lista de todas las carteras
- Vista detallada de cartera individual
- Formulario para añadir nuevas carteras
- Información de activos dentro de cada cartera

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
  performance: string;
  trend: "up" | "down";
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
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Dialog, DialogContent } from "./ui/dialog";

// 3. Componentes personalizados (si aplica)
import { CustomComponent } from "./components/CustomComponent";

// 4. Iconos de lucide-react
import { Home, Briefcase, Plus, TrendingUp } from "lucide-react";

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

// 2. Componente principal
export function Portfolio() {
  // 3. Estados (useState, useReducer)
  const [portfolios, setPortfolios] = useState<PortfolioItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 4. Effects (useEffect)
  useEffect(() => {
    // Lógica de efecto
  }, []);

  // 5. Funciones auxiliares y event handlers
  const handleAddPortfolio = () => {
    // Lógica
  };

  const handleDelete = (id: number) => {
    // Lógica
  };

  // 6. Renderizado condicional o funciones de render
  const renderPortfolioCard = (item: PortfolioItem) => {
    return <Card>...</Card>;
  };

  // 7. Return con JSX
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
  trend: "up" | "down";  // Solo valores permitidos
  status: "active" | "inactive" | "pending";
}

// ❌ Incorrecto
const [activeView, setActiveView] = useState<string>("home");  // Demasiado amplio
```

#### Props de Componentes
- Siempre tipar props de componentes

```tsx
// ✅ Correcto
interface MetricCardProps {
  title: string;
  value: string;
  change?: string;  // Opcional
  trend: "up" | "down";
}

export function MetricCard({ title, value, change, trend }: MetricCardProps) {
  return <div>...</div>;
}

// ❌ Incorrecto
export function MetricCard({ title, value, change, trend }) {  // Sin tipos
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
gap-2, gap-3, gap-4     // 0.5rem, 0.75rem, 1rem
p-4, p-6                // 1rem, 1.5rem
space-y-4, space-y-6    // Espaciado vertical
mt-4, mb-6              // Márgenes

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
  return <div>{title}: {value}</div>;
}

// ❌ Incorrecto
export function MetricCard(props: CardProps) {
  return <div>{props.title}: {props.value}</div>;
}
```

#### Keys en Listas
- Siempre usar `key` única y estable
- Preferir IDs sobre índices

```tsx
// ✅ Correcto
{portfolios.map((portfolio) => (
  <Card key={portfolio.id}>
    {portfolio.name}
  </Card>
))}

// ⚠️ Aceptable solo si no hay ID disponible
{items.map((item, index) => (
  <div key={`item-${index}`}>
    {item.name}
  </div>
))}

// ❌ Incorrecto
{items.map((item, index) => (
  <div key={index}>  // índice solo no es suficientemente único
    {item.name}
  </div>
))}
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
const [portfolios, setPortfolios] = useState<PortfolioItem[]>([]);
const [selectedId, setSelectedId] = useState<number | null>(null);
const [isLoading, setIsLoading] = useState(false);
const [searchTerm, setSearchTerm] = useState("");

// ❌ Incorrecto
const [portfolios, setPortfolios] = useState();  // undefined
const [count, setCount] = useState();  // debería ser 0
```

#### Mock Data
- Definir mock data fuera del componente cuando sea posible
- Usar estructura consistente

```tsx
// ✅ Correcto - Fuera del componente
const MOCK_PORTFOLIOS: PortfolioItem[] = [
  {
    id: 1,
    name: "Cartera Tech",
    balance: "$45,200.00",
    performance: "+15.3%",
    trend: "up",
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
  const [portfolios, setPortfolios] = useState<PortfolioItem[]>([]);

  // Calcular el rendimiento total combinando todas las carteras
  const totalPerformance = portfolios.reduce((acc, portfolio) => {
    return acc + parseFloat(portfolio.performance);
  }, 0);

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
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Dialog, DialogContent, DialogHeader } from "./ui/dialog";

// ❌ Incorrecto
import { Button } from "./components/ui/button";  // Path incorrecto desde componentes
import { Button } from "@/components/ui/button";  // No usar alias @
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
const value = 10
import { Button } from "./ui/button"
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
- [ ] ¿Los event handlers tienen el prefijo `handle`?
- [ ] ¿Todas las listas tienen keys únicas?
- [ ] ¿El código está libre de `any` y valores sin tipar?
- [ ] ¿Los comentarios son útiles y no obvios?
- [ ] ¿Se siguen los colores de la marca (verde en lugar de azul)?

## Componentes ShadCN Utilizados

- **Button**: Botones principales y secundarios
- **Card**: Contenedores de información
- **Dialog**: Modales para formularios
- **Input**: Campos de entrada de texto
- **Label**: Etiquetas de formularios

## Iconos (Lucide React)

Iconos principales usados:
- `Home`: Página de inicio
- `Briefcase`: Carteras
- `BarChart3`: Análisis
- `Settings`: Configuración
- `TrendingUp/TrendingDown`: Tendencias
- `Plus`: Añadir elementos
- `Eye`: Ver detalles
- `ArrowLeft`: Volver atrás

## Responsive Design

### Breakpoints
- `md:` - 768px (tablets)
- `lg:` - 1024px (desktops)

### Grids Responsivos
```tsx
// Ejemplo de grid que se adapta
className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
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

## Datos y Estado

### Mock Data
Actualmente la aplicación usa datos de ejemplo (mock data):
- Carteras predefinidas
- Métricas de ejemplo
- Actividad simulada

### Gestión de Estado
- `useState` para estado local
- Paso de props para comunicación entre componentes
- Estados elevados en App.tsx cuando sea necesario

## Futuras Mejoras Sugeridas

1. **Backend Integration**
   - Conectar con Supabase para persistencia
   - Autenticación de usuarios
   - API para gestión de carteras

2. **Características Adicionales**
   - Sección de Análisis con gráficos
   - Configuración de usuario
   - Exportación de datos
   - Notificaciones en tiempo real

3. **UX Enhancements**
   - Filtros y búsqueda en carteras
   - Ordenamiento de tablas
   - Drag & drop para reordenar
   - Temas claro/oscuro

## Notas Importantes

- **No modificar** archivos en `/components/figma/` - son protegidos
- **Mantener consistencia** en nombres de colores (usar verde en lugar de azul)
- **Usar componentes ShadCN** existentes antes de crear nuevos
- **Documentar** cambios importantes en este archivo

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

**Última actualización**: Octubre 2025  
**Versión**: 1.0.0  
**Mantenedor**: Equipo Frakto
