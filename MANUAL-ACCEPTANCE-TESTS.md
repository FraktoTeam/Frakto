# Frakto - Tests de Aceptación Manual

## Documento de Pruebas del Happy Path

**Versión**: 1.2  
**Fecha**: 17 de Noviembre, 2025  
**Empresa**: Frakto

---

## Índice

1. [Dashboard / Home](#1-dashboard--home)
2. [Gestión de Carteras](#2-gestión-de-carteras)
3. [Gestión de Movimientos (Ingresos y Gastos)](#3-gestión-de-movimientos-ingresos-y-gastos)
4. [Gestión de Gastos Fijos](#4-gestión-de-gastos-fijos)
5. [Buzón de Notificaciones](#5-buzón-de-notificaciones)
6. [Generación de Reportes PDF](#6-generación-de-reportes-pdf)
7. [Calendario Financiero](#7-calendario-financiero)

---

## 1. Dashboard / Home

### Caso 01: Visualización del Dashboard Principal

**Objetivo**: Verificar que el usuario puede visualizar correctamente el resumen general de su situación financiera.

**Precondiciones**:

- La aplicación está cargada
- Existen carteras con datos

**Pasos a seguir**:

1. Acceder a la aplicación Frakto
2. Verificar que se muestra la vista "Home" por defecto (opción "Home" en el menú lateral debe estar resaltada en verde)

**Resultados esperados**:

✅ Se visualiza el título "Resumen General" con el subtítulo "Vista general de tu dinero y carteras"

✅ Se muestra la card "Balance Total" con:

- Icono de dólar en la esquina superior derecha
- Valor total del balance en negrita

✅ Se visualiza la sección "Mis Carteras" con un carrusel de carteras que muestra:

- Múltiples carteras en formato card
- Cada cartera muestra: nombre y balance

✅ Se muestra la card "Últimos 10 Movimientos" con:

- Lista de hasta 10 transacciones
- Cada transacción muestra: nombre de cartera, descripción, categoría, fecha e importe
- Importes en negrita con colores: verde para ingresos (+), rojo para gastos (-)

**Criterios de aceptación**:

- Todos los valores numéricos se muestran correctamente formateados
- Los colores siguen la paleta de la marca (verde para positivo, rojo para negativo)
- La tipografía tiene el peso correcto (Importes en negrita)

---

### Caso 02: Navegación del Carrusel de Carteras

**Objetivo**: Verificar que el usuario puede navegar por las carteras usando el carrusel.

**Precondiciones**:

- Estar en la vista "Home"
- Existen más de 3 carteras creadas

**Pasos a seguir**:

1. Observar las carteras visibles inicialmente
2. Con el ratón sobre las carteras existentes deslizar con el ratón hacia la izquierda
3. Observar las nuevas carteras que se muestran
4. Con el ratón sobre las carteras existentes deslizar con el ratón hacia la derecha
5. Verificar que vuelven a mostrarse las carteras iniciales

**Resultados esperados**:

✅ Se muestran las siguientes carteras en la secuencia

✅ La transición es fluida y sin saltos

**Criterios de aceptación**:

- La navegación es intuitiva y funcional
- No hay errores visuales durante la transición

---

## 2. Gestión de Carteras

### Caso 03: Crear una Nueva Cartera

**Objetivo**: Verificar que el usuario puede crear una nueva cartera con balance inicial.

**Precondiciones**:

- Estar en la aplicación Frakto

**Pasos a seguir**:

1. Hacer clic en el menú lateral en la opción "Cartera" (icono de maletín)
2. Verificar que se muestra la vista de gestión de carteras
3. Hacer clic en el botón "+ Añadir Cartera" (botón negro ubicado en la esquina superior derecha)
4. En el modal que se abre, completar los campos:
   - **Nombre de la Cartera**: "Cartera de Prueba"
   - **Balance Inicial**: "5000.00"
5. Hacer clic en el botón "Crear Cartera"

**Resultados esperados**:

✅ Se abre un modal con el título "Nueva Cartera"

✅ El modal contiene dos campos de entrada:

- Campo "Nombre de la Cartera" (texto)
- Campo "Balance Inicial" (número)

✅ Al hacer clic en "Crear Cartera":

- El modal se cierra automáticamente
- La nueva cartera aparece en la lista de carteras
- La cartera muestra el nombre "Cartera de Prueba"
- El balance se muestra como "$5,000.00" (correctamente formateado)
- El cambio mensual se muestra como "$0.00"
- Tendencia se muestra como "up" (flecha verde)
- Transacciones muestra "0"
- Última actualización muestra "Ahora"

**Criterios de aceptación**:

- La cartera se crea correctamente con los datos ingresados
- El balance se formatea con separadores de miles y 2 decimales
- Los campos del formulario se resetean después de crear la cartera

---

### Caso 04: Ver Detalle de una Cartera

**Objetivo**: Verificar que el usuario puede acceder a la vista detallada de una cartera específica.

**Precondiciones**:

- Estar en la vista "Cartera"
- Existen carteras creadas

**Pasos a seguir**:

1. En la lista de carteras, localizar una cartera específica (ej: "Cartera Personal")
2. Hacer clic en el botón "Ver" (icono de ojo) de esa cartera

**Resultados esperados**:

✅ Se abre la vista detallada de la cartera seleccionada

✅ Se muestra un botón de "volver atrás" (flecha izquierda) en la parte superior

✅ El título muestra el nombre de la cartera

✅ Se muestran dos botones en la parte superior derecha:

- "Añadir Ingreso" (botón negro con icono de dólar)
- "Añadir Gasto" (botón blanco con icono de carrito)

✅ Se visualizan 3 cards con información resumida:

- **Balance Total**: Muestra el balance actual
- **Transacciones**: Número de transacciones del mes
- **Última Actualización**: Tiempo relativo de la última actualización

✅ Se muestra la card "Transacciones Recientes" con:

- Lista scrollable de transacciones
- Cada transacción muestra: descripción, categoría, fecha y Importe
- Importes en negrita con colores (verde para ingresos, rojo para gastos)
- Botones de editar (lápiz) y eliminar (papelera) que aparecen al pasar el ratón por encima de la transacción
- Mensaje "No hay transacciones registradas" si la cartera está vacía

**Criterios de aceptación**:

- La información mostrada corresponde a la cartera seleccionada
- Los datos se actualizan correctamente
- La navegación es fluida

---

### Caso 05: Editar el Nombre de una Cartera

**Objetivo**: Verificar que el usuario puede modificar el nombre de una cartera existente.

**Precondiciones**:

- Estar en la vista "Cartera"
- Existen carteras creadas

**Pasos a seguir**:

1. En la lista de carteras, localizar una cartera específica
2. Hacer clic en el botón de editar (icono de lápiz) de esa cartera
3. En el modal que se abre, modificar el campo "Nuevo nombre":
   - Cambiar el nombre (ej: de "Cartera Personal" a "Mi Cartera Principal")
4. Hacer clic en el botón "Guardar Cambios"

**Resultados esperados**:

✅ Se abre un modal con el título "Editar Cartera"

✅ El modal contiene el campo "Nuevo nombre" pre-rellenado con el nombre actual

✅ Se puede modificar el texto libremente

✅ Al hacer clic en "Guardar Cambios":

- El modal se cierra automáticamente
- El nombre de la cartera se actualiza en la lista
- Si estamos en la vista detallada de esa cartera, el título también se actualiza

**Criterios de aceptación**:

- El nombre se actualiza correctamente en todos los lugares donde aparece
- El cambio persiste al navegar entre vistas
- No se permite guardar con el campo vacío

---

### Caso 6: Eliminar una Cartera

**Objetivo**: Verificar que el usuario puede eliminar una cartera completa con todas sus transacciones.

**Precondiciones**:

- Estar en la vista "Cartera"
- Existen carteras creadas

**Pasos a seguir**:

1. En la lista de carteras, localizar una cartera que desee eliminar
2. Hacer clic en el botón de eliminar (icono de papelera roja) de esa cartera
3. En el diálogo de confirmación que aparece, leer el mensaje de advertencia
4. Verificar que muestra el nombre de la cartera a eliminar
5. Hacer clic en el botón "Eliminar Cartera" (botón rojo)

**Resultados esperados**:

✅ Al hacer clic en el icono de papelera, aparece un diálogo de alerta/confirmación

✅ El diálogo muestra:

- Título: "Confirmar Eliminación"
- Descripción que incluye:
  - Nombre de la cartera
  - Advertencia de que se eliminarán todas las transacciones asociadas
  - Indicación de que la acción es permanente
- Dos botones: "Cancelar" y "Sí, eliminar" (rojo)

✅ Al hacer clic en "Sí, eliminar":

- El diálogo se cierra
- La cartera desaparece de la lista
- Todas las transacciones asociadas a esa cartera se eliminan también
- Si estábamos viendo el detalle de esa cartera, volvemos a la vista de lista de carteras

✅ Al hacer clic en "Cancelar":

- El diálogo se cierra
- No se elimina la cartera
- No hay cambios

**Criterios de aceptación**:

- La confirmación previa protege contra eliminaciones accidentales
- La cartera y todas sus transacciones se eliminan permanentemente
- Si la cartera eliminada estaba en vista detallada, se redirige correctamente
- El mensaje de advertencia es claro sobre las consecuencias

---

### Caso 7: Volver a la Lista de Carteras

**Objetivo**: Verificar que el usuario puede regresar desde la vista detallada a la lista de carteras.

**Precondiciones**:

- Estar en la vista detallada de una cartera

**Pasos a seguir**:

1. En la vista detallada de una cartera, localizar el botón de volver atrás (flecha izquierda) en la parte superior izquierda
2. Hacer clic en ese botón

**Resultados esperados**:

✅ Al hacer clic en el botón de volver atrás:

- Se sale de la vista detallada
- Se muestra nuevamente la lista de todas las carteras
- Los datos de las carteras están actualizados (reflejan los cambios realizados)

**Criterios de aceptación**:

- La navegación es inmediata y fluida
- No se pierden los cambios realizados
- La lista de carteras muestra la información actualizada

---

## 3. Gestión de Movimientos (Ingresos y Gastos)

### Caso 8: Visualizar Lista de Movimientos de una Cartera

**Objetivo**: Verificar que el usuario puede ver los movimientos (ingresos y gastos) registrados en una cartera específica.

**Precondiciones**:

- Estar en la vista detallada de una cartera
- La cartera tiene movimientos registrados

**Pasos a seguir**:

1. Acceder a la vista detallada de una cartera (ver Caso 04)
2. Localizar la card "Transacciones Recientes" en la parte inferior
3. Observar la lista de movimientos mostrados
4. Si hay más de 10 movimientos, hacer scroll dentro del área de transacciones

**Resultados esperados**:

✅ Se muestra la card "Transacciones Recientes" con título claramente visible

✅ **Si la cartera tiene movimientos**:

- Se muestra un área scrollable
- Cada movimiento se presenta en una fila con:
  - **Descripción**: En negrita, en la primera línea
  - **Categoría y fecha**: En texto gris más pequeño, en la segunda línea (ej: "Comida · 12 nov 2025")
  - **Importe**: Alineado a la derecha, en negrita
    - Verde con signo "+" para ingresos
    - Rojo con signo "-" para gastos
- Separador visual (línea) entre cada movimiento
- Al hacer hover sobre un movimiento, aparecen botones de acción:
  - Botón de editar (icono de lápiz)
  - Botón de eliminar (icono de papelera roja)

✅ **Si la cartera NO tiene movimientos**:

- Se muestra el mensaje: "No hay transacciones registradas"
- El mensaje está centrado y en color gris

✅ **Orden de los movimientos**:

- Los movimientos más recientes aparecen primero (orden descendente por fecha)

✅ **Scroll vertical**:

- Si hay más de ~8 movimientos, el área es scrollable
- El scroll funciona correctamente
- Los botones de editar/eliminar permanecen visibles al hacer scroll y hover

**Criterios de aceptación**:

- Los movimientos se muestran de forma clara y organizada
- Los colores ayudan a identificar rápidamente ingresos vs gastos
- Las fechas están formateadas correctamente
- Los Importes están formateados con separadores de miles y 2 decimales
- El área scrollable funciona sin problemas
- Los botones de acción solo aparecen al hacer hover (no están siempre visibles)

---

### Caso 9: Registrar un Ingreso en una Cartera

**Objetivo**: Verificar que el usuario puede añadir un ingreso a una cartera existente.

**Precondiciones**:

- Estar en la vista detallada de una cartera
- Tener el balance inicial de la cartera anotado

**Pasos a seguir**:

1. Hacer clic en el botón "Añadir Ingreso" (botón negro con icono de dólar)
2. En el modal que se abre, completar los campos:
   - **Importe**: "1500.00"
   - **Fecha**: Seleccionar la fecha actual
   - **Descripción (opcional)**: "Freelance - Proyecto Web"
3. Hacer clic en el botón "Registrar Ingreso"

**Resultados esperados**:

✅ Se abre un modal con el título "Registrar Ingreso"

✅ El modal contiene tres campos:

- Campo "Importe" (tipo número, placeholder "0.00")
- Campo "Fecha" (selector de fecha tipo date)
- Campo "Descripción" (área de texto opcional, placeholder informativo)

✅ **Validaciones en tiempo real**:

- El campo "Importe" solo acepta números
- El campo "Fecha" abre un selector de calendario al hacer clic
- El campo "Descripción" es opcional (puede dejarse vacío)

✅ Al hacer clic en "Registrar Ingreso":

- El modal se cierra automáticamente
- El balance de la cartera se incrementa en $1,500.00
- El balance se actualiza visualmente en la card "Balance Total"
- Aparece una nueva transacción AL INICIO de la lista "Todas las Transacciones"
- La nueva transacción muestra:
  - Descripción: "Freelance - Proyecto Web"
  - Categoría: "Ingreso"
  - Fecha seleccionada formateada (ej: "12 nov 2025")
  - Importe: "+$1,500.00" en color verde y negrita
- El contador de transacciones se incrementa en 1
- La "Última Actualización" cambia a la fecha en el momento que se registra

✅ Los campos del formulario se resetean después del registro (están vacíos si se vuelve a abrir el modal)

✅ **Si no se ingresa descripción**:

- El sistema usa "Ingreso" como descripción por defecto

**Criterios de aceptación**:

- El ingreso se registra correctamente con todos los datos
- El balance se actualiza automáticamente y de forma visible
- La transacción aparece en la posición correcta (primera en la lista)
- La fecha se formatea según el formato español
- Los importes se muestran con formato correcto (+$X,XXX.XX)
- El flujo completo es intuitivo y sin errores

---

### Caso 10: Registrar un Gasto en una Cartera

**Objetivo**: Verificar que el usuario puede añadir un gasto categorizado a una cartera existente.

**Precondiciones**:

- Estar en la vista detallada de una cartera
- Tener el balance inicial de la cartera anotado

**Pasos a seguir**:

1. Hacer clic en el botón "Añadir Gasto" (botón blanco con icono de carrito de compras)
2. En el modal que se abre, completar los campos:
   - **Importe**: "250.50"
   - **Categoría**: Seleccionar "Comida" del desplegable
   - **Fecha**: Seleccionar la fecha actual
   - **Descripción (opcional)**: "Supermercado semanal"
3. Hacer clic en el botón "Registrar Gasto"

**Resultados esperados**:

✅ Se abre un modal con el título "Registrar Gasto"

✅ El modal contiene cuatro campos:

- Campo "Importe" (tipo número, placeholder "0.00")
- Campo "Categoría" (selector desplegable)
- Campo "Fecha" (selector de fecha tipo date)
- Campo "Descripción" (área de texto opcional)

✅ **Desplegable de Categoría** muestra exactamente estas opciones:

- Ocio
- Hogar
- Transporte
- Comida
- Factura

✅ **Validaciones**:

- El campo "Importe" solo acepta números positivos
- El campo "Categoría" es OBLIGATORIO (no se puede registrar sin seleccionar)
- El campo "Fecha" es obligatorio
- El campo "Descripción" es opcional

✅ Al hacer clic en "Registrar Gasto" (con todos los campos obligatorios completos):

- El modal se cierra automáticamente
- El balance de la cartera se reduce en $250.50
- El balance actualizado se muestra en la card "Balance Total"
- Aparece una nueva transacción AL INICIO de la lista "Todas las Transacciones"
- La nueva transacción muestra:
  - Descripción: "Supermercado semanal"
  - Categoría: "Comida"
  - Fecha seleccionada formateada (ej: "12 nov 2025")
  - Importe: "-$250.50" en color rojo y negrita
- El contador de transacciones se incrementa en 1
- La "Última Actualización" cambia a la fecha en el momento que se registra

✅ Los campos del formulario se resetean después del registro

✅ **Si no se ingresa descripción**:

- El sistema usa "Gasto" como descripción por defecto

✅ **Si se intenta registrar sin seleccionar categoría**:

- El sistema previene el registro
- Se muestra un mensaje de error o el campo se marca como requerido

**Criterios de aceptación**:

- El gasto se registra correctamente con la categoría seleccionada
- El balance se actualiza automáticamente (se resta el importe)
- La transacción aparece con todos los datos correctos
- La categoría es claramente obligatoria
- Si no se ingresa descripción, se usa "Gasto" por defecto
- El flujo completo es intuitivo y las validaciones son claras

---

### Caso 11: Editar un Movimiento Existente (Ingreso)

**Objetivo**: Verificar que el usuario puede modificar los datos de un ingreso previamente registrado.

**Precondiciones**:

- Estar en la vista detallada de una cartera
- Existen ingresos registrados en la cartera
- Anotar el balance actual de la cartera antes de editar

**Pasos a seguir**:

1. En la lista "Transacciones Recientes", localizar un ingreso (Importe en verde con +)
2. Pasar el cursor sobre esa transacción para que aparezcan los botones de acción
3. Hacer clic en el botón de editar (icono de lápiz)
4. En el modal que se abre, verificar que los campos están pre-rellenados con los datos actuales
5. Modificar los siguientes campos:
   - **Importe**: Cambiar de "1500.00" a "1800.00" (incremento de $300)
   - **Fecha**: Cambiar a otro día si se desea
   - **Descripción**: Modificar el texto (ej: "Freelance - Proyecto Web Actualizado")
6. Observar el contador de caracteres en la descripción
7. Hacer clic en el botón "Guardar Cambios"

**Resultados esperados**:

✅ Al hacer hover sobre el ingreso, aparecen los botones de editar y eliminar a la derecha

✅ Se abre un modal con el título "Editar Ingreso"

✅ **Campos pre-rellenados**:

- El campo "Importe" muestra el valor actual sin signo ni símbolo de moneda (ej: "1500.00")
- El campo "Fecha" muestra la fecha actual del ingreso
- El campo "Descripción" muestra la descripción actual
- NO hay campo de categoría (los ingresos no tienen categoría seleccionable)

✅ **Validaciones al editar**:

- El importe debe ser un número mayor que 0
- Si se intenta ingresar 0 o un número negativo, se muestra alerta: "El importe debe ser un número mayor que 0"
- La descripción tiene un máximo de 256 caracteres
- Se muestra contador de caracteres: "X/256 caracteres"
- Si se superan 256 caracteres, se muestra alerta: "La descripción no puede tener más de 256 caracteres"

✅ Al hacer clic en "Guardar Cambios" (con datos válidos):

- El modal se cierra automáticamente
- La transacción se actualiza en la lista con los nuevos datos:
  - Descripción: "Freelance - Proyecto Web Actualizado"
  - Fecha modificada (si se cambió)
  - Importe: "+$1,800.00" (nuevo valor)
- **El balance de la cartera se recalcula automáticamente**:
  - Balance anterior + $300 (diferencia del cambio: $1800 - $1500)
  - El nuevo balance se muestra en la card "Balance Total"

✅ **Recálculo correcto del balance**:

- Si el importe aumenta ($1500 → $1800), el balance aumenta en $300
- Si el importe disminuye ($1500 → $1200), el balance disminuye en $300

**Criterios de aceptación**:

- Los datos se pre-rellenan correctamente en el formulario
- Las validaciones funcionan y previenen errores
- El balance se recalcula automáticamente considerando la diferencia
- Los cambios se reflejan inmediatamente en la lista
- El contador de caracteres ayuda al usuario a no exceder el límite
- Los ingresos no tienen campo de categoría en el formulario de edición

---

### Caso 12: Editar un Movimiento Existente (Gasto)

**Objetivo**: Verificar que el usuario puede modificar los datos de un gasto previamente registrado, incluyendo su categoría.

**Precondiciones**:

- Estar en la vista detallada de una cartera
- Existen gastos registrados en la cartera
- Anotar el balance actual de la cartera antes de editar

**Pasos a seguir**:

1. En la lista "Transacciones Recientes", localizar un gasto (Importe en rojo con -)
2. Pasar el cursor sobre esa transacción para que aparezcan los botones de acción
3. Hacer clic en el botón de editar (icono de lápiz)
4. En el modal que se abre, verificar que los campos están pre-rellenados
5. Modificar los siguientes campos:
   - **Importe**: Cambiar de "250.50" a "300.00" (incremento de $49.50)
   - **Categoría**: Cambiar de "Comida" a "Hogar"
   - **Fecha**: Cambiar la fecha si se desea
   - **Descripción**: Modificar el texto (ej: "Compra de productos de limpieza")
6. Hacer clic en el botón "Guardar Cambios"

**Resultados esperados**:

✅ Al hacer hover sobre el gasto, aparecen los botones de editar y eliminar

✅ Se abre un modal con el título "Editar Gasto"

✅ **Campos pre-rellenados**:

- El campo "Importe" muestra el valor actual sin signo ni símbolo (ej: "250.50")
- El campo "Categoría" muestra la categoría actual seleccionada (ej: "Comida")
- El campo "Fecha" muestra la fecha actual del gasto
- El campo "Descripción" muestra la descripción actual

✅ **Validaciones específicas para gastos**:

- El importe debe ser mayor que 0
- La categoría es OBLIGATORIA (no se puede dejar sin seleccionar)
- Si se intenta guardar sin categoría, se muestra alerta: "Debes seleccionar una categoría para el gasto"
- La descripción máximo 256 caracteres con contador visible
- Si se intenta ingresar importe 0 o negativo, se muestra alerta correspondiente

✅ **Desplegable de Categoría** muestra las mismas opciones que al crear:

- Ocio
- Hogar
- Transporte
- Comida
- Factura

✅ Al hacer clic en "Guardar Cambios" (con datos válidos):

- El modal se cierra automáticamente
- La transacción se actualiza en la lista con los nuevos datos:
  - Descripción: "Compra de productos de limpieza"
  - Categoría: "Hogar" (categoría actualizada)
  - Fecha modificada (si se cambió)
  - Importe: "-$300.00" (nuevo valor)
- **El balance de la cartera se recalcula automáticamente**:
  - Como el gasto aumentó de $250.50 a $300.00 (diferencia de $49.50)
  - El balance se reduce en $49.50 adicionales
  - El nuevo balance se muestra en la card "Balance Total"

✅ **Recálculo correcto del balance para gastos**:

- Si el gasto aumenta ($250 → $300), el balance disminuye en $50
- Si el gasto disminuye ($250 → $200), el balance aumenta en $50

**Criterios de aceptación**:

- Los datos se pre-rellenan correctamente incluyendo la categoría
- La categoría es modificable y obligatoria
- Las validaciones funcionan correctamente
- El balance se recalcula automáticamente considerando la diferencia
- Los cambios en la categoría se reflejan correctamente
- El flujo completo es claro e intuitivo

---

### Caso 13: Eliminar un Movimiento (Ingreso)

**Objetivo**: Verificar que el usuario puede eliminar un ingreso con confirmación previa y actualización automática del balance.

**Precondiciones**:

- Estar en la vista detallada de una cartera
- Existen ingresos registrados en la cartera
- Anotar el balance actual de la cartera y el importe del ingreso a eliminar

**Pasos a seguir**:

1. En la lista "Transacciones Recientes", localizar un ingreso específico (ej: un ingreso de $1,500.00)
2. Pasar el cursor sobre esa transacción
3. Hacer clic en el botón de eliminar (icono de papelera roja)
4. En el diálogo de confirmación que aparece, leer el mensaje completo
5. Verificar que muestra los detalles del ingreso a eliminar
6. Hacer clic en el botón "Eliminar Movimiento" (botón rojo)

**Resultados esperados**:

✅ Al hacer clic en el icono de papelera, aparece un **Alert Dialog** (diálogo de alerta)

✅ **El diálogo muestra**:

- **Título**: "¿Deseas eliminar este movimiento?"
- **Descripción** detallada que incluye:
  - Tipo de movimiento: "el ingreso"
  - Descripción de la transacción entre comillas
  - Importe exacto del ingreso (ej: "$1,500.00")
  - Mensaje informando que "El balance de la cartera se actualizará automáticamente"
- **Dos botones**:
  - "Cancelar" (botón secondary/outline)
  - "Eliminar Movimiento" (botón rojo/destructivo)

✅ **Al hacer clic en "Eliminar Movimiento"**:

- El diálogo se cierra inmediatamente
- La transacción desaparece completamente de la lista "Todas las Transacciones"
- **El balance de la cartera se actualiza automáticamente**:
  - Como era un ingreso de $1,500.00, el balance se reduce en $1,500.00
  - El nuevo balance se muestra en la card "Balance Total"
- El contador de transacciones se reduce en 1

✅ **Al hacer clic en "Cancelar"**:

- El diálogo se cierra
- NO se elimina la transacción
- NO hay cambios en el balance ni en la lista
- Todo permanece igual

**Criterios de aceptación**:

- El diálogo de confirmación es claro e informativo
- Se muestran todos los detalles del movimiento a eliminar
- El balance se recalcula correctamente (se resta el ingreso eliminado)
- La eliminación es definitiva y no reversible
- El botón "Cancelar" permite abandonar la acción sin consecuencias
- La transacción eliminada no reaparece

---

### Caso 14: Eliminar un Movimiento (Gasto)

**Objetivo**: Verificar que el usuario puede eliminar un gasto con confirmación previa y actualización automática del balance.

**Precondiciones**:

- Estar en la vista detallada de una cartera
- Existen gastos registrados en la cartera
- Anotar el balance actual de la cartera y el importe del gasto a eliminar

**Pasos a seguir**:

1. En la lista "Transacciones Recientes", localizar un gasto específico (ej: un gasto de $250.50)
2. Pasar el cursor sobre esa transacción
3. Hacer clic en el botón de eliminar (icono de papelera roja)
4. En el diálogo de confirmación que aparece, leer el mensaje completo
5. Verificar que muestra los detalles del gasto a eliminar
6. Hacer clic en el botón "Eliminar Movimiento" (botón rojo)

**Resultados esperados**:

✅ Al hacer clic en el icono de papelera, aparece un **Alert Dialog**

✅ **El diálogo muestra**:

- **Título**: "¿Deseas eliminar este movimiento?"
- **Descripción** detallada que incluye:
  - Tipo de movimiento: "el gasto"
  - Descripción de la transacción entre comillas
  - Importe exacto del gasto (ej: "$250.50")
  - Mensaje informando que "El balance de la cartera se actualizará automáticamente"
- **Dos botones**:
  - "Cancelar"
  - "Eliminar Movimiento" (rojo)

✅ **Al hacer clic en "Eliminar Movimiento"**:

- El diálogo se cierra inmediatamente
- La transacción desaparece de la lista "Todas las Transacciones"
- **El balance de la cartera se actualiza automáticamente**:
  - Como era un gasto de $250.50, el balance se INCREMENTA en $250.50
  - Esto es correcto porque al eliminar un gasto, ese dinero "vuelve" a la cartera
  - El nuevo balance se muestra en la card "Balance Total"
- El contador de transacciones se reduce en 1

✅ **Al hacer clic en "Cancelar"**:

- El diálogo se cierra
- NO se elimina la transacción
- NO hay cambios

**Criterios de aceptación**:

- El diálogo de confirmación es claro y muestra "el gasto" en lugar de "el ingreso"
- El balance se recalcula correctamente (se suma el gasto eliminado al balance)
- La lógica del recálculo es correcta: eliminar un gasto aumenta el balance
- La eliminación protege contra acciones accidentales con confirmación
- El flujo completo es consistente con la eliminación de ingresos

---

## 4. Gestión de Gastos Fijos

### Caso 15: Crear un Gasto Fijo

**Objetivo**: Verificar que el usuario puede crear un gasto fijo recurrente asociado a una cartera.

**Precondiciones**:

- Estar en la aplicación Frakto
- Existen carteras creadas

**Pasos a seguir**:

1. Hacer clic en el menú lateral en la opción "Gastos Fijos" (icono de repetición)
2. Verificar que se muestra la vista de gastos fijos
3. Hacer clic en el botón "+ Añadir Gasto Fijo" (botón negro en la esquina superior derecha)
4. En el modal que se abre, completar los campos:
   - **Cartera**: Seleccionar "Cartera Personal" del desplegable
   - **Importe**: "850.00"
   - **Categoría**: Seleccionar "Hogar" del desplegable
   - **Frecuencia (días)**: "30"
   - **Fecha de inicio**: Seleccionar la fecha de hoy
   - **Descripción**: "Alquiler mensual del apartamento"
5. Hacer clic en el botón "Crear Gasto Fijo"

**Resultados esperados**:

✅ Se abre un modal con el título "Nuevo Gasto Fijo"

✅ El modal contiene seis campos:

- "Cartera" (selector desplegable con las carteras disponibles)
- "Importe" (tipo número)
- "Categoría" (selector con opciones: Ocio, Hogar, Transporte, Comida, Factura)
- "Frecuencia (días)" (tipo número)
- "Fecha de inicio" (selector de fecha)
- "Descripción" (campo de texto)

✅ **Validaciones**:

- Si no se selecciona cartera: "Debes seleccionar una cartera"
- Si el importe es 0 o negativo: "El importe debe ser mayor que 0"
- Si no se selecciona categoría: "Debes seleccionar una categoría"
- Si la frecuencia no es entre 1 y 365: "La frecuencia debe estar entre 1 y 365 días"
- Si no se selecciona fecha: "Debes seleccionar una fecha de inicio"
- Si la descripción supera 200 caracteres: "La descripción no puede tener más de 200 caracteres"

✅ Al hacer clic en "Crear Gasto Fijo" (con datos válidos):

- El modal se cierra automáticamente
- El nuevo gasto fijo aparece en la lista
- La tarjeta del gasto muestra:
  - Descripción: "Alquiler mensual del apartamento"
  - Importe: "$850.00"
  - Badge de categoría "Hogar"
  - Nombre de la cartera: "Cartera Personal"
  - Frecuencia: "cada 30 días"
  - Fecha de inicio formateada
  - Badge verde con estado "Activo"
  - Fecha de última generación (si aplica)

✅ Los campos del formulario se resetean después de crear

**Criterios de aceptación**:

- El gasto fijo se crea correctamente con todos los datos
- Las validaciones previenen errores de entrada
- El estado inicial es siempre "Activo"
- El gasto aparece en la lista ordenado por fecha

---

### Caso 16: Pausar/Reanudar un Gasto Fijo

**Objetivo**: Verificar que el usuario puede pausar y reanudar la generación automática de un gasto fijo.

**Precondiciones**:

- Estar en la vista "Gastos Fijos"
- Existen gastos fijos creados

**Pasos a seguir**:

**Parte A - Pausar un Gasto Activo:**

1. Localizar un gasto fijo con estado "Activo" (badge verde)
2. Hacer clic en el botón de pausa (icono de pausa) ubicado en la tarjeta del gasto
3. Observar los cambios en la tarjeta

**Parte B - Reanudar un Gasto Pausado:**

4. Localizar el mismo gasto (ahora con estado "Pausado")
5. Hacer clic en el botón de play (icono de reproducción)
6. Observar los cambios en la tarjeta

**Resultados esperados - Parte A (Pausar)**:

✅ Al hacer clic en el botón de pausa:

- El badge de estado cambia de verde "Activo" a gris "Pausado"
- El icono cambia de pausa a play
- El gasto permanece en la lista
- Los datos del gasto no cambian (importe, categoría, etc.)

**Resultados esperados - Parte B (Reanudar)**:

✅ Al hacer clic en el botón de play:

- El badge de estado cambia de gris "Pausado" a verde "Activo"
- El icono cambia de play a pausa
- El gasto permanece en la lista
- Los datos del gasto no cambian

**Criterios de aceptación**:

- El cambio de estado es inmediato y visible
- Un gasto pausado no genera transacciones automáticas
- Un gasto reactivado vuelve a generar transacciones según su frecuencia
- El estado persiste al cambiar de vista y volver

---

### Caso 17: Editar un Gasto Fijo

**Objetivo**: Verificar que el usuario puede modificar los datos de un gasto fijo existente.

**Precondiciones**:

- Estar en la vista "Gastos Fijos"
- Existen gastos fijos creados

**Pasos a seguir**:

1. Localizar un gasto fijo en la lista
2. Hacer clic en el botón de editar (icono de lápiz) de ese gasto
3. En el modal que se abre, modificar los siguientes campos:
   - **Cartera**: Cambiar a otra cartera (ej: "Cartera Gastos")
   - **Importe**: Cambiar el valor (ej: de "45.99" a "49.99")
   - **Categoría**: Cambiar la categoría si se desea
   - **Frecuencia (días)**: Modificar la frecuencia (ej: de "30" a "7")
   - **Fecha de inicio**: Cambiar la fecha si se desea
   - **Descripción**: Modificar la descripción
4. Hacer clic en el botón "Guardar Cambios"

**Resultados esperados**:

✅ Se abre un modal con el título "Editar Gasto Fijo"

✅ El modal muestra todos los campos pre-rellenados con los datos actuales del gasto

✅ Se pueden modificar todos los campos manteniendo las mismas validaciones que al crear:

- Cartera obligatoria
- Importe mayor que 0
- Categoría obligatoria
- Frecuencia entre 1 y 365 días
- Fecha de inicio obligatoria
- Descripción máximo 200 caracteres

✅ Al hacer clic en "Guardar Cambios" (con datos válidos):

- El modal se cierra automáticamente
- La tarjeta del gasto se actualiza con los nuevos datos
- Todos los campos reflejan los cambios realizados
- Si se cambió la cartera, se muestra el nombre de la nueva cartera

✅ **Validaciones**: Las mismas que al crear un gasto fijo

**Criterios de aceptación**:

- Todos los cambios se reflejan correctamente
- Las validaciones funcionan igual que al crear
- El estado (activo/pausado) se mantiene después de editar
- Los cambios persisten al cambiar de vista y volver

---

### Caso 18: Eliminar un Gasto Fijo

**Objetivo**: Verificar que el usuario puede eliminar un gasto fijo con confirmación previa.

**Precondiciones**:

- Estar en la vista "Gastos Fijos"
- Existen gastos fijos creados

**Pasos a seguir**:

1. Localizar un gasto fijo en la lista
2. Hacer clic en el botón de eliminar (icono de papelera roja) de ese gasto
3. En el diálogo de confirmación que aparece, leer el mensaje de advertencia
4. Verificar que muestra los detalles del gasto a eliminar
5. Hacer clic en el botón "Eliminar Gasto Fijo" (botón rojo)

**Resultados esperados**:

✅ Al hacer clic en el icono de papelera, aparece un diálogo de alerta/confirmación

✅ El diálogo muestra:

- Título: "¿Deseas eliminar este gasto fijo?"
- Descripción detallada que incluye:
  - Descripción del gasto
  - Importe del gasto
  - Advertencia de que no se generarán más transacciones automáticas
  - Indicación de que la acción es permanente
- Dos botones: "Cancelar" y "Eliminar" (rojo)

✅ Al hacer clic en "Eliminar":

- El diálogo se cierra
- La tarjeta del gasto desaparece de la lista
- No se generarán más transacciones automáticas para este gasto

✅ Al hacer clic en "Cancelar":

- El diálogo se cierra
- No se elimina el gasto fijo
- No hay cambios

**Criterios de aceptación**:

- La confirmación previa protege contra eliminaciones accidentales
- El gasto se elimina permanentemente
- El mensaje es claro sobre las consecuencias
- Las transacciones ya generadas por este gasto NO se eliminan

---

## 5. Buzón de Notificaciones

### Caso 19: Visualizar Alertas en el Buzón

**Objetivo**: Verificar que el usuario puede ver todas las alertas financieras generadas por el sistema.

**Precondiciones**:

- Estar en la aplicación Frakto
- El sistema ha generado alertas

**Pasos a seguir**:

1. Hacer clic en el menú lateral en la opción "Buzón" (icono de sobre)
2. Verificar que se muestra la vista del buzón de notificaciones

**Resultados esperados**:

✅ Se visualiza el título "Buzón de Notificaciones" con el subtítulo "Historial de notificaciones y alertas del sistema"

✅ **Sección "Alertas"**:

- Muestra las alertas con estado "Riesgo" o "Resuelta"
- Cada alerta se muestra en una tarjeta con:
  - Nombre de la cartera afectada
  - Mensaje completo de la alerta
  - Saldo actual vs umbral de riesgo
  - Saldo necesario para cubrir gastos fijos
  - Fecha de generación
- Fondo rojo claro para alertas de riesgo
- Fondo verde claro para alertas resueltas

**Criterios de aceptación**:

- Las alertas se muestran ordenadas por fecha (más recientes primero)
- Los colores diferencian claramente alertas activas de resueltas

---

### Caso 20: Cerrar Banner de Alerta Flotante

**Objetivo**: Verificar que el usuario puede cerrar el banner de alerta flotante.

**Precondiciones**:

- El banner de alerta flotante está visible en la pantalla

**Pasos a seguir**:

1. Localizar el banner flotante en la parte superior de la pantalla
2. Hacer clic en el botón X del banner

**Resultados esperados**:

✅ Al hacer clic en el botón X:

- El banner desaparece de la pantalla
- El banner no vuelve a aparecer hasta que se genere una nueva alerta

**Criterios de aceptación**:

- El banner se cierra inmediatamente
- El cierre del banner no afecta al estado de las alertas en el buzón
- La alerta sigue siendo accesible en el buzón

---

### Caso 21: Visualizar Nueva Alerta Generada Automáticamente

**Objetivo**: Verificar que el usuario recibe notificación visual cuando el sistema genera una nueva alerta.

**Precondiciones**:

- Estar en la vista "Buzón"
- Esperar aproximadamente 5 segundos (tiempo simulado para generar nueva alerta)

**Pasos a seguir**:

1. Permanecer en la vista "Buzón"
2. Esperar aproximadamente 5 segundos
3. Observar la aparición de una nueva alerta

**Resultados esperados**:

✅ Después de aproximadamente 5 segundos:

- Aparece el banner flotante en la parte superior con la nueva alerta
- La nueva alerta aparece en la lista de "Alertas Activas"
- El contador de alertas activas se incrementa
- La nueva alerta muestra todos los datos: cartera, mensaje, fecha, etc.

**Criterios de aceptación**:

- La nueva alerta se muestra automáticamente sin necesidad de recargar
- El banner aparece de forma llamativa pero no intrusiva
- La alerta se añade correctamente a la lista

---

## 6. Generación de Reportes PDF

### Caso 22: Generar Reporte PDF Mensual de Todas las Carteras

**Objetivo**: Verificar que el usuario puede generar y descargar un reporte PDF completo del mes pasado.

**Precondiciones**:

- Estar en la aplicación Frakto
- Existen carteras con transacciones del mes pasado

**Pasos a seguir**:

1. Hacer clic en el menú lateral en la opción "Reportes" (icono de documento)
2. Verificar que se muestra la vista de reportes
3. En el campo "Seleccionar Cartera", verificar que está seleccionado "Todas las carteras" por defecto
4. Hacer clic en el botón "Descargar PDF" (botón verde con icono de descarga)
5. Esperar a que se genere el PDF
6. Verificar la descarga del archivo

**Resultados esperados**:

✅ Se visualiza el título "Reportes Mensuales" con el subtítulo "Genera un reporte detallado en formato PDF del mes anterior"

✅ **Formulario de configuración**:

- Selector "Seleccionar Cartera" con opciones:
  - "Todas las carteras" (opción por defecto)
  - Lista de carteras individuales

✅ **Al hacer clic en "Descargar PDF"**:

- El botón cambia a estado "Generando PDF..."
- Se genera un archivo PDF
- El PDF se descarga automáticamente con el nombre: "Reporte-Frakto-[Mes]-[Año].pdf"
- El botón vuelve a su estado normal

**Criterios de aceptación**:

- El PDF se genera correctamente sin errores
- Todos los datos numéricos están correctamente formateados con separadores de miles y 2 decimales
- Las tablas son legibles y bien formateadas
- El archivo se descarga con nombre descriptivo
- Los colores verde/rojo se aplican correctamente en el resultado neto

---

### Caso 23: Generar Reporte PDF de una Cartera Específica

**Objetivo**: Verificar que el usuario puede generar un reporte PDF filtrado por una cartera individual.

**Precondiciones**:

- Estar en la vista "Reportes"
- Existen múltiples carteras con transacciones del mes pasado

**Pasos a seguir**:

1. En el campo "Seleccionar Cartera", hacer clic en el desplegable
2. Seleccionar una cartera específica (ej: "Cartera Personal")
3. Hacer clic en el botón "Descargar PDF"
4. Verificar la descarga y contenido del archivo PDF generado

**Resultados esperados**:

✅ Al descargar el PDF:

- El PDF se genera con el nombre: "reporte_[usuario]_frakto_[nombrecartera]_[Mes]-[Año].pdf"
- En el encabezado, el campo "Cartera" muestra el nombre de la cartera seleccionada
- Todas las tablas contienen solo datos de la cartera seleccionada
- El resumen numérico corresponde exclusivamente a esa cartera

**Criterios de aceptación**:

- El filtro por cartera funciona correctamente
- No se incluyen datos de otras carteras
- El PDF refleja claramente qué cartera fue reportada

---

## 7. Calendario Financiero

### Caso 24: Visualizar Calendario del Mes Actual

**Objetivo**: Verificar que el usuario puede ver un calendario mensual con indicadores visuales de movimientos financieros.

**Precondiciones**:

- Estar en la aplicación Frakto
- Existen transacciones registradas en el mes actual

**Pasos a seguir**:

1. Hacer clic en el menú lateral en la opción "Calendario" (icono de calendario)
2. Verificar que se muestra la vista del calendario
3. Observar el calendario mensual completo

**Resultados esperados**:

✅ Se visualiza el título "Calendario Financiero" con el subtítulo "Visualiza tus ingresos y gastos por día"

✅ **Encabezado del calendario**:

- Botón de flecha izquierda (navegación a mes anterior)
- Nombre del mes y año actual (ej: "Noviembre 2025")
- Botón de flecha derecha (navegación a mes siguiente)

✅ **Días de la semana**: Fila con Lun, Mar, Mié, Jue, Vie, Sáb, Dom

✅ **Días del mes**:

- Cada día se muestra en una celda
- El día actual tiene un borde especial (ej: borde verde o fondo destacado)
- Días con movimientos muestran indicadores circulares en la parte inferior:
  - **Círculo verde**: Hay ingresos ese día
  - **Círculo rojo**: Hay gastos ese día
  - **Círculo azul**: Hay gastos fijos programados ese día
  - Pueden aparecer múltiples círculos si hay varios tipos de movimientos
- Días sin movimientos no muestran círculos
- Los días son clickeables

✅ **Leyenda**:

- Muestra el significado de cada color de círculo

**Criterios de aceptación**:

- El calendario muestra el mes actual por defecto
- Los indicadores de color son claros y distintivos
- El día actual es fácilmente identificable
- El diseño del calendario es limpio y profesional
- Los días con múltiples tipos de movimientos muestran todos los indicadores correspondientes

---

### Caso 25: Navegar entre Meses en el Calendario

**Objetivo**: Verificar que el usuario puede navegar hacia atrás en el calendario para ver meses anteriores.

**Precondiciones**:

- Estar en la vista "Calendario"
- El calendario muestra el mes actual

**Pasos a seguir**:

1. Observar el mes y año mostrado en el encabezado
2. Hacer clic en el botón de flecha izquierda (mes anterior)
3. Observar el cambio en el calendario
4. Intentar hacer clic en el botón de flecha derecha
5. Hacer clic varias veces en la flecha izquierda para retroceder varios meses
6. Hacer clic en la flecha derecha para avanzar (sin superar el mes actual)

**Resultados esperados**:

✅ Al hacer clic en flecha izquierda:

- El calendario cambia al mes anterior
- El encabezado se actualiza mostrando el mes y año anterior
- Los días se redibujan según el mes seleccionado
- Los indicadores de círculos reflejan los movimientos de ese mes

✅ **Botón de flecha derecha**:

- Si estamos en el mes actual: el botón está **deshabilitado** o no avanza más
- Si estamos en un mes pasado: el botón avanza hasta el mes actual pero no más

✅ Al navegar múltiples meses atrás:

- La navegación es fluida
- Cada mes muestra sus propios movimientos
- El formato del calendario se mantiene consistente

✅ No se puede navegar a meses futuros más allá del mes actual

**Criterios de aceptación**:

- La navegación hacia el pasado es ilimitada
- La navegación hacia el futuro se detiene en el mes actual
- El cambio de mes actualiza correctamente todos los indicadores
- La transición es suave sin errores visuales

---

### Caso 26: Ver Detalle de Movimientos de un Día Específico (Vista Global)

**Objetivo**: Verificar que el usuario puede hacer clic en un día y ver todos los movimientos de ese día en un modal.

**Precondiciones**:

- Estar en la vista "Calendario"
- El mes mostrado tiene días con movimientos (círculos de colores)

**Pasos a seguir**:

1. Localizar un día que tenga al menos un círculo de color (indicando movimientos)
2. Hacer clic en ese día
3. Observar el modal que se abre

**Resultados esperados**:

✅ Se abre un modal/diálogo con el detalle del día seleccionado

✅ **Encabezado del modal**:

- Título: "Movimientos del [día] de [mes]" (ej: "Movimientos del 15 de Noviembre")
- Botón X para cerrar el modal

✅ **Resumen numérico** (cards o sección destacada):

- Total de ingresos del día (en verde)
- Total de gastos del día (en rojo)
- Balance Neto

✅ **Filtro por cartera**:

- Desplegable/selector con opciones:
  - "Todas las carteras" (opción por defecto)
  - Lista de carteras que tienen movimientos ese día
- Al cambiar el filtro, se actualiza la lista de movimientos

✅ **Lista de movimientos del día**:

- Área scrollable si hay muchos movimientos
- Cada movimiento muestra:
  - Descripción
  - Nombre de la cartera
  - Categoría
  - Importe (con color: verde para ingresos, rojo para gastos, azul para gastos fijos)
  - Badge o indicador del tipo (Ingreso/Gasto/Gasto Fijo)
- Separación visual entre movimientos

✅ Si el día no tiene movimientos:

- Se muestra mensaje: "No hay movimientos registrados en esta fecha"

**Criterios de aceptación**:

- El modal muestra información completa y precisa del día
- Los Importes están correctamente formateados
- Los colores ayudan a identificar rápidamente el tipo de movimiento
- El resumen numérico es correcto
- La lista es scrollable si hay muchos movimientos

---

### Caso 27: Filtrar Movimientos por Cartera en el Modal del Día

**Objetivo**: Verificar que el usuario puede filtrar los movimientos mostrados por una cartera específica.

**Precondiciones**:

- El modal de detalle de un día está abierto
- El día tiene movimientos de múltiples carteras

**Pasos a seguir**:

1. Observar el filtro "Seleccionar Cartera" con "Todas las carteras" seleccionado
2. Observar todos los movimientos listados
3. Hacer clic en el desplegable "Seleccionar Cartera"
4. Seleccionar una cartera específica (ej: "Cartera Personal")
5. Observar cómo cambia la lista de movimientos
6. Cambiar a otra cartera
7. Volver a seleccionar "Todas las carteras"

**Resultados esperados**:

✅ **Con "Todas las carteras" seleccionado**:

- Se muestran todos los movimientos del día de todas las carteras
- El resumen numérico incluye todos los movimientos

✅ **Al seleccionar una cartera específica**:

- La lista se filtra mostrando solo movimientos de esa cartera
- El resumen numérico se actualiza mostrando solo totales de esa cartera
- Los movimientos de otras carteras se ocultan

✅ **Al cambiar entre carteras**:

- La actualización es inmediata
- No se cierra el modal
- El filtro persiste mientras el modal esté abierto

✅ **Al volver a "Todas las carteras"**:

- Se muestran nuevamente todos los movimientos
- El resumen vuelve a incluir todas las carteras

**Criterios de aceptación**:

- El filtro funciona correctamente sin errores
- La actualización es instantánea
- Los totales se recalculan correctamente según el filtro
- Solo aparecen en el desplegable las carteras que tienen movimientos ese día

---

### Caso 28: Cerrar Modal de Detalle del Día

**Objetivo**: Verificar que el usuario puede cerrar el modal de detalle y volver al calendario.

**Precondiciones**:

- El modal de detalle de un día está abierto

**Pasos a seguir**:

1. Hacer clic en el botón X (cerrar) del modal
2. Alternativamente, hacer clic fuera del modal (en el fondo oscuro)
3. Verificar que se cierra el modal

**Resultados esperados**:

✅ Al hacer clic en el botón X:

- El modal se cierra inmediatamente
- Se vuelve a mostrar el calendario completo
- El filtro de cartera se resetea a "Todas las carteras" para la próxima vez

✅ Al hacer clic en el fondo oscuro (overlay):

- El modal también se cierra
- Mismo comportamiento que al usar el botón X

**Criterios de aceptación**:

- El cierre del modal es inmediato y fluido
- Se puede abrir el modal de otro día sin problemas
- El filtro no persiste entre aperturas del modal

---

## Notas Finales

### Reporte de Errores

Si algún test falla, documentar:

1. **Test ID**: (ej: Caso 03)
2. **Paso donde falla**: Número del paso
3. **Resultado obtenido**: Qué sucedió en realidad
4. **Resultado esperado**: Qué debería haber sucedido
5. **Captura de pantalla**: Si es posible
6. **Navegador y versión**: Información del entorno

### Versiones y Actualizaciones

Este documento debe actualizarse cuando:

- Se añadan nuevas funcionalidades
- Se modifiquen funcionalidades existentes
- Se detecten casos de uso no cubiertos
- Se reciba feedback de usuarios

---

**Fin del Documento de Tests de Aceptación Manual**

**Última revisión**: 17 de Noviembre, 2025  
**Revisión 1.2**  
**Responsable**: Equipo de QA - Frakto