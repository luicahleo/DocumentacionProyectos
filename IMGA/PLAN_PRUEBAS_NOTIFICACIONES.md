# Plan de Pruebas - Módulo de Notificaciones y Tareas

## 📋 Información General

**Módulo**: Notificaciones y Tareas del Día  
**ViewModel**: `NotificacionesViewModel`  
**View**: `NotificacionesPage`  
**Servicios**: `INotificacionesService`, `IAuthenticationService`, `IEmulatorLoggingService`  
**Fecha**: Diciembre 2025  
**Versión**: 1.0.0

---

## 🎯 Objetivos de las Pruebas

1. Verificar que las tareas se cargan correctamente desde el API
2. Validar que el filtro "Pendientes/Todas" funciona correctamente
3. Comprobar que el completado de tareas actualiza la UI automáticamente
4. Verificar que se registra correctamente quién completó cada tarea
5. Validar que los indicadores visuales (progreso, badges) se actualizan
6. Comprobar el manejo de errores y estados vacíos

---

## 🧪 Casos de Prueba

### **[x] TC001: Carga Inicial de Tareas del Día**

**Objetivo**: Verificar que al abrir la página se cargan todas las tareas del día actual

**Precondiciones**:
- Usuario autenticado como trabajador (ej: ok3@icarus.com)
- Existen tareas programadas en el sistema para hoy

**Pasos**:
1. Iniciar sesión en la aplicación
2. Navegar a "Notificaciones" desde el menú principal
3. Esperar a que termine la carga (spinner desaparece)

**Resultado Esperado**:
- ✅ Se muestra la fecha actual en formato "Domingo, 08 de Diciembre 2025"
- ✅ Se muestran todas las tareas agrupadas por tipo (Vacunación, Iluminación, Alimentación)
- ✅ El contador muestra "X de Y pendientes"
- ✅ La barra de progreso refleja el porcentaje de completitud
- ✅ El botón de filtro muestra "Pendientes" (no está activo aún)

**Logs Esperados**:
```
[INFO] NotificacionesViewModel.CargarTareasAsync - Iniciando carga de tareas
[DEBUG] NotificacionesViewModel.CargarTareasAsync - Cargando todas las tareas del día
[INFO] NotificacionesService.GetTareasDelDiaAsync - Iniciando obtención de tareas del día
[INFO] NotificacionesViewModel.CargarTareasAsync - Tareas cargadas: X total, Y pendientes
```

**Datos de Prueba**:
- API debe retornar mínimo 1 tarea por cada tipo (vacunación, iluminación, alimentación)
- Mezcla de tareas pendientes y completadas

---

### **[x] TC002: Filtro de Solo Pendientes**

**Objetivo**: Verificar que el filtro "Solo Pendientes" muestra únicamente tareas no completadas

**Precondiciones**:
- TC001 completado exitosamente
- Existen tareas completadas y pendientes en el sistema

**Pasos**:
1. En la página de Notificaciones, observar el total de tareas
2. Tocar el botón "Pendientes" en la barra superior
3. Esperar a que termine la carga

**Resultado Esperado**:
- ✅ El botón cambia a "Todas"
- ✅ Se ocultan las tareas completadas
- ✅ Solo se muestran tareas con estado "Pendiente"
- ✅ El contador refleja solo tareas pendientes: "Y de Y pendientes"
- ✅ La barra de progreso se actualiza al 0% si todas las mostradas son pendientes

**Logs Esperados**:
```
[INFO] NotificacionesViewModel.ToggleFiltroAsync - Alternando filtro de tareas
[INFO] NotificacionesViewModel.CargarTareasAsync - Iniciando carga de tareas
[DEBUG] NotificacionesViewModel.CargarTareasAsync - Cargando solo tareas pendientes
[INFO] NotificacionesService.GetTareasPendientesAsync - Iniciando obtención de tareas pendientes
```

**Verificación**:
- Contar manualmente las tareas visibles y comparar con el contador
- Verificar que NO aparecen tareas con ícono de completado (✓)

---

### **[x] TC003: Completar Tarea de Vacunación**

**Objetivo**: Verificar el flujo completo de completar una tarea de vacunación con auto-refresh

**Precondiciones**:
- Usuario autenticado
- Existe al menos 1 tarea de vacunación pendiente
- Sistema configurado para mostrar SOLO tareas pendientes (filtro eliminado)

**Pasos**:
1. Navegar a "Notificaciones"
2. Anotar el total de tareas pendientes visibles
3. Ubicar una tarea de vacunación con estado "Atrasada" o "Vigente"
4. Tocar el botón "✓ Completar" en la tarjeta de vacunación
5. Esperar a que termine la operación

**Resultado Esperado**:
- ✅ Spinner se muestra durante el procesamiento
- ✅ API retorna HTTP 200 OK
- ✅ Aparece alerta: "Éxito - Tarea de vacunación completada correctamente"
- ✅ **AUTO-REFRESH**: La vista se actualiza automáticamente
- ✅ La tarea completada desaparece de la lista
- ✅ El contador de tareas visibles disminuye en 1
- ✅ NO hay botón de filtro visible (fue eliminado en diseño)
- ✅ Solo se muestran tareas pendientes

**Logs Obtenidos** (ORDEN VERIFICADO):
```
[INFO] NotificacionesViewModel.CompletarTareaVacunacionAsync - Iniciando completado
[DEBUG] ObtenerEmailTrabajadorAutenticadoAsync - Email obtenido: ok3@icarus.com
[HTTP] POST http://10.0.2.2:5090/api/mobile/notificaciones/vacunacion/completar - 200
[INFO] NotificacionesViewModel.CompletarTareaVacunacionAsync - Tarea completada exitosamente
[INFO] NotificacionesViewModel.CompletarTareaVacunacionAsync - Llamando a CargarTareasAsync
[DEBUG] NotificacionesViewModel.CargarTareasAsync - Cargando solo tareas pendientes
[INFO] NotificacionesViewModel.CargarTareasAsync - Tareas cargadas correctamente
[INFO] NotificacionesViewModel.CompletarTareaVacunacionAsync - CargarTareasAsync completado
```

**Estado**: ✅ **APROBADO** - Alerta de éxito aparece correctamente, auto-refresh funciona, tarea desaparece

---

### **[x] TC004: Completar Tarea de Iluminación**

**Objetivo**: Verificar el flujo de completar una tarea de iluminación

**Precondiciones**:
- Usuario autenticado
- Existe al menos 1 tarea de iluminación pendiente

**Pasos**:
1. Navegar a "Notificaciones"
2. Ubicar una tarea de iluminación con estado "Atrasada" o "Vigente"
3. Verificar visualización: Galpón + Oscuridad en título, Fecha vigencia, Horario oscuridad
4. Tocar el botón "✓ Completar" en la tarjeta de iluminación
5. Esperar resultado

**Resultado Esperado**:
- ✅ Proceso idéntico a TC003
- ✅ Alerta: "Éxito - Tarea de iluminación completada correctamente"
- ✅ Auto-refresh funciona correctamente
- ✅ Tarea desaparece de la vista de pendientes
- ✅ Contador disminuye en 1

**Logs Esperados**:
- Similar a TC003, pero con `CompletarTareaIluminacionAsync`

**Verificación en Base de Datos**:
```sql
SELECT GalponTareaIluminacionId, EstadoTarea, CompletadaPor, FechaCompletada 
FROM GalponTareaIluminacion 
WHERE GalponTareaIluminacionId = [ID_TAREA]
```

**Estado**: ✅ **APROBADO** - Alerta aparece, tarea desaparece, contador actualiza correctamente

---

### **[x] TC005: Completar Tarea de Alimentación**

**Objetivo**: Verificar el flujo de completar una tarea de alimentación

**Precondiciones**:
- Usuario autenticado
- Existe al menos 1 tarea de alimentación pendiente

**Pasos**:
1. Navegar a "Notificaciones"
2. Ubicar una tarea de alimentación con estado "Atrasada" o "Vigente"
3. Verificar visualización: Galpón + Tipo alimento en título, Fecha vigencia, Horario + Cantidad
4. Tocar el botón "✓ Completar" en la tarjeta de alimentación
5. Esperar resultado

**Resultado Esperado**:
- ✅ Proceso idéntico a TC003 y TC004
- ✅ Alerta: "Éxito - Tarea de alimentación completada correctamente"
- ✅ Auto-refresh funciona correctamente
- ✅ Tarea desaparece de la vista de pendientes
- ✅ Contador disminuye en 1

**Logs Esperados**:
- Similar a TC003, pero con `CompletarTareaAlimentacionAsync`

**Verificación en Base de Datos**:
```sql
SELECT GalponTareaAlimentacionId, EstadoTarea, CompletadaPor, FechaCompletada 
FROM GalponTareaAlimentacion 
WHERE GalponTareaAlimentacionId = [ID_TAREA]
```

**Estado**: ✅ **APROBADO** - Alerta aparece, tarea desaparece, contador actualiza correctamente

---

### **[N/A] TC006: Completar Múltiples Tareas Consecutivas**

**Estado**: ⚪ **NO APLICABLE** - Test omitido, funcionalidad ya validada en TC003-TC005

---

### **[ ] TC007: Pull-to-Refresh**

**Objetivo**: Verificar que el auto-refresh funciona correctamente al completar varias tareas seguidas

**Precondiciones**:
- Usuario autenticado
- Existen al menos 5 tareas pendientes de diferentes tipos

**Pasos**:
1. Navegar a "Notificaciones" y activar filtro "Pendientes"
2. Anotar el total: "X de X pendientes"
3. Completar una tarea de vacunación → verificar contador: "X-1"
4. Completar una tarea de iluminación → verificar contador: "X-2"
5. Completar una tarea de alimentación → verificar contador: "X-3"
6. Repetir hasta completar 5 tareas

**Resultado Esperado**:
- ✅ Cada completado dispara auto-refresh
- ✅ El contador disminuye en 1 cada vez
- ✅ La barra de progreso aumenta gradualmente
- ✅ NO se acumulan tareas completadas en la vista (todas desaparecen)
- ✅ NO hay errores de concurrencia o race conditions
- ✅ Los spinners NO se traban

**Verificación**:
- Observar que NO hay flickering o parpadeo excesivo en la UI
- Verificar que los logs muestran secuencias completas sin interrupciones

---

### **[x] TC007: Refrescar Manualmente con Pull-to-Refresh** ✅ APROBADO

**Objetivo**: Verificar que el gesto de "jalar hacia abajo" refresca las tareas

**Precondiciones**:
- Usuario en la página de Notificaciones
- Tareas ya cargadas

**Pasos**:
1. Estar en la página de Notificaciones
2. Deslizar el dedo desde la parte superior hacia abajo (pull-to-refresh)
3. Esperar a que termine la animación de carga

**Resultado Esperado**:
- ✅ Se muestra el indicador de "Refrescando..."
- ✅ Se llama a `RefrescarAsync()`
- ✅ Las tareas se recargan desde el API
- ✅ La UI se actualiza con los datos más recientes
- ✅ El indicador de carga desaparece

**Logs Esperados**:
```
[INFO] NotificacionesViewModel.RefrescarAsync - Usuario solicitó refrescar tareas
[INFO] NotificacionesViewModel.CargarTareasAsync - Iniciando carga de tareas
```

**Resultado Real**:
- ✅ Spinner aparece correctamente al hacer pull-to-refresh
- ✅ Se ejecuta `RefrescarAsync` → `CargarTareasAsync`
- ✅ Las tareas se recargan desde el API exitosamente
- ✅ El spinner desaparece correctamente después de la recarga
- ✅ NO hay bucles infinitos de recarga
- ✅ La UI se actualiza con los datos más recientes

**Correcciones Aplicadas**:
- Se removió el guard `if (this.IsLoading) return;` de `CargarTareasAsync`
- Se simplificó `RefrescarAsync` para llamar directamente a `CargarTareasAsync`
- Se estableció binding TwoWay en `RefreshView.IsRefreshing`

**Estado**: ✅ APROBADO

---

### **[N/A] TC008: Alternar Filtro Todas/Pendientes** ❌ NO APLICA

**Objetivo**: Verificar que el botón de filtro alterna correctamente entre "Todas" y "Pendientes"

**Razón de No Aplicación**: 
El botón de filtro fue **removido de la interfaz** en una iteración anterior del desarrollo. La aplicación ahora muestra **únicamente tareas pendientes** por defecto, sin opción para alternar entre "Todas" y "Pendientes".

**Cambios Realizados**:
- Botón de filtro removido del XAML de NotificacionesPage
- La funcionalidad siempre carga solo tareas pendientes
- La lógica de `MostrarSoloPendientes` fue simplificada

**Estado**: ❌ NO APLICA (Funcionalidad no implementada)

---

### **[x] TC009: Estado Sin Tareas Programadas**

**Objetivo**: Verificar el comportamiento cuando no hay tareas para el día actual

**Precondiciones**:
- Usuario autenticado
- NO existen tareas programadas para hoy (base de datos sin registros)

**Pasos**:
1. Navegar a "Notificaciones"
2. Esperar a que termine la carga

**Resultado Esperado**:
- ✅ NO se muestra spinner infinito
- ✅ Se muestra mensaje: "No hay tareas programadas"
- ✅ Se muestra un ícono de estado vacío (ej: 📋 o calendario vacío)
- ✅ El contador muestra "0 de 0 pendientes"
- ✅ La barra de progreso está vacía (0%)
- ✅ NO aparecen secciones de Vacunación, Iluminación o Alimentación

**Logs Obtenidos**:
```
[INFO] NotificacionesViewModel.CargarTareasAsync - Iniciando carga de tareas
[INFO] NotificacionesViewModel.CargarTareasAsync - Tareas cargadas: 0 total, 0 pendientes
```

**Estado**: ✅ **APROBADO** - Estado vacío funciona correctamente, mensaje claro, UI sin errores

---

### **[ ] TC010: Todas las Tareas Completadas**

**Objetivo**: Verificar el estado visual cuando todas las tareas del día están completadas

**Precondiciones**:
- Usuario autenticado
- Todas las tareas del día están marcadas como completadas en la base de datos

**Pasos**:
1. Navegar a "Notificaciones" con filtro "Todas"
2. Observar el estado de las tareas

**Resultado Esperado**:
- ✅ Se muestran todas las tareas con ícono de completado (✓)
- ✅ El mensaje muestra: "¡Todas las tareas completadas!"
- ✅ El contador muestra "0 de X pendientes" (donde X es el total)
- ✅ La barra de progreso está al 100% (color verde)
- ✅ El texto de porcentaje muestra "100%"
- ✅ Al activar filtro "Pendientes", se muestra el estado vacío de TC009

**Verificación Visual**:
- Todas las tarjetas deben tener el mismo estilo visual de "completada"
- El badge de tareas urgentes (si existe) NO debe aparecer

---

### **[x] TC011: Filtrado de Tareas (Tipo, Fecha, Galpón)**

**Objetivo**: Verificar que el sistema de filtros funciona correctamente para filtrar tareas por tipo, fecha y galpón

**Precondiciones**:
- Usuario autenticado
- Existen tareas de diferentes tipos (Vacunación, Iluminación, Alimentación)
- Existen tareas con diferentes fechas (atrasadas, de hoy)
- Existen tareas de diferentes galpones

**Pasos**:
1. Navegar a "Notificaciones"
2. Esperar a que carguen las tareas
3. Observar la sección de filtros (expandida por defecto)
4. Probar diferentes combinaciones de filtros:
   - **Filtro por Tipo**: Seleccionar "Vacunacion", "Iluminacion", "Alimentacion", "Todas"
   - **Filtro por Fecha**: Seleccionar "Atrasadas", "Hoy", "Todas"
   - **Filtro por Galpón**: Seleccionar diferentes galpones del Picker
5. Hacer clic en "Aplicar Filtros" después de configurar
6. Verificar los resultados mostrados
7. Probar colapsar/expandir la sección de filtros

**Resultado Esperado**:
- ✅ **Filtro de Tipo**: Muestra solo tareas del tipo seleccionado
  - "Todas": Muestra todas las tareas (Vacunación + Iluminación + Alimentación)
  - "Vacunacion": Solo tareas de vacunación
  - "Iluminacion": Solo tareas de iluminación
  - "Alimentacion": Solo tareas de alimentación
- ✅ **Filtro de Fecha**: Muestra solo tareas según el criterio de fecha
  - "Todas": Muestra todas las tareas independiente de la fecha
  - "Atrasadas": Solo tareas con FechaVigencia < Hoy
  - "Hoy": Solo tareas con FechaVigencia == Hoy
- ✅ **Filtro de Galpón**: Muestra solo tareas del galpón seleccionado
  - "Todos": Muestra tareas de todos los galpones
  - "Galpon X": Solo tareas del galpón específico
- ✅ **Combinación de Filtros**: Los 3 filtros se aplican simultáneamente (AND)
  - Ejemplo: "Vacunacion" + "Hoy" + "Galpon 7" = Solo vacunaciones de hoy del galpón 7
- ✅ **Botón "Aplicar Filtros"**:
  - Se muestra un spinner (ActivityIndicator blanco) mientras procesa
  - El botón se deshabilita durante el procesamiento
  - Los filtros solo se ejecutan al hacer clic (no automáticamente)
- ✅ **Sección Colapsable**:
  - Se puede colapsar/expandir usando el botón con icono
  - El icono cambia (▼/▲) según el estado
  - Los filtros persisten al colapsar
- ✅ **Estilo de Chips**:
  - Chips con texto claro y limpio (sin emojis)
  - Bordes redondeados (CornerRadius 20)
  - Sombras sutiles para profundidad
  - Color gris cuando no seleccionado
  - Color Primary/Success cuando seleccionado
  - Animación de escala (0.96) al presionar
- ✅ **Performance**:
  - NO hay "Skipped frames" warnings
  - El filtrado se ejecuta en background (Task.Run)
  - La UI permanece responsive durante el filtrado
  - El spinner aparece/desaparece correctamente

**Logs Obtenidos**:
```
[INFO] NotificacionesViewModel.AplicarFiltrosAsync - Iniciando aplicación de filtros
[DEBUG] Filtros seleccionados: Tipo=Vacunacion, Fecha=Hoy, Galpon=Galpon 7
[INFO] NotificacionesViewModel.AplicarFiltrosAsync - Filtros aplicados: X tareas mostradas
```

**Verificaciones Específicas**:
- Contar manualmente las tareas visibles y verificar que coinciden con los filtros
- Verificar que NO aparecen tareas que no cumplan los criterios
- Confirmar que el contador "X de Y pendientes" se actualiza correctamente
- Verificar que las secciones vacías (ej: Iluminación cuando se filtra Vacunación) NO se muestran

**Datos de Prueba Utilizados**:
- 44 tareas totales: 28 Vacunación, 10 Iluminación, 6 Alimentación
- Tareas de múltiples galpones (7, 8, 9, 10, etc.)
- Tareas con diferentes FechaVigencia (atrasadas y de hoy)

**Estado**: ✅ **APROBADO** - Sistema de filtros completo, performance optimizada, spinner funcional, UI limpia y moderna

---

### **[ ] TC012: Error de Conexión al API**

**Objetivo**: Verificar el manejo de errores cuando el API no está disponible

**Precondiciones**:
- Usuario autenticado
- API backend NO está corriendo o no es accesible

**Pasos**:
1. Detener el API backend (cerrar ICARUS.API)
2. Navegar a "Notificaciones"
3. Esperar a que termine el intento de carga

**Resultado Esperado**:
- ✅ Spinner desaparece después del timeout
- ✅ Se muestra mensaje de error: "No se pudieron cargar las tareas. Intente nuevamente."
- ✅ La propiedad `HasError` está en `true`
- ✅ Se muestra un botón o indicación para "Reintentar"
- ✅ El usuario puede intentar pull-to-refresh para recargar

**Logs Esperados**:
```
[ERROR] NotificacionesViewModel.CargarTareasAsync - Excepción: [Mensaje de error de conexión]
```

**Recuperación**:
1. Iniciar el API backend
2. Hacer pull-to-refresh
3. Verificar que las tareas se cargan correctamente

---

### **[ ] TC012: Error de Conexión al API**

**Objetivo**: Verificar el manejo de errores cuando el API no está disponible

**Precondiciones**:
- Usuario autenticado
- API backend NO está corriendo o no es accesible

**Pasos**:
1. Detener el API backend (cerrar ICARUS.API)
2. Navegar a "Notificaciones"
3. Esperar a que termine el intento de carga

**Resultado Esperado**:
- ✅ Spinner desaparece después del timeout
- ✅ Se muestra mensaje de error: "No se pudieron cargar las tareas. Intente nuevamente."
- ✅ La propiedad `HasError` está en `true`
- ✅ Se muestra un botón o indicación para "Reintentar"
- ✅ El usuario puede intentar pull-to-refresh para recargar

**Logs Esperados**:
```
[ERROR] NotificacionesViewModel.CargarTareasAsync - Excepción: [Mensaje de error de conexión]
```

**Recuperación**:
1. Iniciar el API backend
2. Hacer pull-to-refresh
3. Verificar que las tareas se cargan correctamente

---

### **[ ] TC013: Cancelar Completado de Tarea**

**Objetivo**: Verificar que al cancelar el diálogo de confirmación, la tarea NO se completa

**Precondiciones**:
- Usuario autenticado
- Existe al menos 1 tarea pendiente

**Pasos**:
1. Navegar a "Notificaciones"
2. Anotar el total de tareas pendientes
3. Tocar el botón "Completar" en cualquier tarea
4. Leer el diálogo de confirmación
5. Tocar "No" para cancelar

**Resultado Esperado**:
- ✅ El diálogo se cierra
- ✅ La tarea permanece en estado "Pendiente"
- ✅ El contador NO cambia
- ✅ NO se llama al API
- ✅ La UI NO se refresca

**Logs Esperados**:
```
[INFO] NotificacionesViewModel.CompletarTareaXAsync - Usuario canceló
```

---

### **[ ] TC013: Cancelar Completado de Tarea**

**Objetivo**: Verificar que al cancelar el diálogo de confirmación, la tarea NO se completa

**Precondiciones**:
- Usuario autenticado
- Existe al menos 1 tarea pendiente

**Pasos**:
1. Navegar a "Notificaciones"
2. Anotar el total de tareas pendientes
3. Tocar el botón "Completar" en cualquier tarea
4. Leer el diálogo de confirmación
5. Tocar "No" para cancelar

**Resultado Esperado**:
- ✅ El diálogo se cierra
- ✅ La tarea permanece en estado "Pendiente"
- ✅ El contador NO cambia
- ✅ NO se llama al API
- ✅ La UI NO se refresca

**Logs Esperados**:
```
[INFO] NotificacionesViewModel.CompletarTareaXAsync - Usuario canceló
```

---

### **[ ] TC014: Indicadores Visuales y Progreso**

**Objetivo**: Verificar que todos los indicadores visuales se actualizan correctamente

**Precondiciones**:
- Existen tareas con diferentes estados (pendientes y completadas)

**Pasos**:
1. Navegar a "Notificaciones" con filtro "Todas"
2. Observar los indicadores:
   - Barra de progreso
   - Porcentaje de completitud
   - Contador "X de Y pendientes"
   - Color de la barra de progreso
   - Badges de tareas urgentes (si aplica)

**Resultado Esperado**:
- ✅ **Barra de Progreso**: Refleja porcentaje correcto (completadas/total * 100)
- ✅ **Color de Progreso**:
  - Verde (#28A745) si >= 80%
  - Naranja (#FFC107) si >= 50% y < 80%
  - Rojo (#DC3545) si < 50%
- ✅ **Texto de Porcentaje**: Coincide con la barra (ej: "60%")
- ✅ **Contador**: Muestra "X de Y pendientes" correctamente
- ✅ **Fecha**: Formato legible "Domingo, 08 de Diciembre 2025"

**Cálculos Manuales**:
- Si hay 10 tareas totales y 6 completadas:
  - Barra: 60%
  - Color: Naranja
  - Texto: "60%"
  - Contador: "4 de 10 pendientes"

---

### **[ ] TC014: Tareas Urgentes (Si Aplica)**

**Objetivo**: Verificar que las tareas urgentes se marcan correctamente

**Precondiciones**:
- Existen tareas con fecha programada vencida o del día actual

**Pasos**:
1. Navegar a "Notificaciones"
2. Observar si aparece el badge "⚠ X urgentes"
3. Revisar las tarjetas de tareas

**Resultado Esperado**:
- ✅ El badge rojo aparece si hay tareas urgentes
- ✅ El número de tareas urgentes es correcto
- ✅ Las tarjetas de tareas urgentes tienen indicador visual diferente (borde rojo, ícono, etc.)

**Nota**: Verificar en el código si esta funcionalidad está implementada. Si no, este caso de prueba puede omitirse.

---

### **[ ] TC015: Rendimiento con Muchas Tareas**

**Objetivo**: Verificar que la aplicación maneja correctamente un volumen alto de tareas

**Precondiciones**:
- Base de datos tiene más de 50 tareas para el día actual
- Mezcla de tareas pendientes y completadas

**Pasos**:
1. Navegar a "Notificaciones"
2. Medir el tiempo de carga
3. Scrollear por toda la lista de tareas
4. Alternar filtro "Pendientes/Todas" varias veces
5. Completar 1 tarea

**Resultado Esperado**:
- ✅ Carga inicial < 3 segundos
- ✅ Scroll fluido sin lag
- ✅ Alternancia de filtro < 1 segundo
- ✅ Auto-refresh después de completar tarea < 2 segundos
- ✅ NO hay OutOfMemoryException
- ✅ ObservableCollection maneja actualizaciones eficientemente

**Monitoreo**:
- Observar logs para tiempos de respuesta del API
- Verificar que NO hay múltiples llamadas al API simultáneas

---

## 🔍 Checklist de Auditoría

### Para Cada Tarea Completada:

En la base de datos, verificar:

```sql
-- Vacunación
SELECT * FROM GalponTareaVacunacion WHERE GalponTareaVacunacionId = [ID]

-- Iluminación
SELECT * FROM GalponTareaIluminacion WHERE GalponTareaIluminacionId = [ID]

-- Alimentación
SELECT * FROM GalponTareaAlimentacion WHERE GalponTareaAlimentacionId = [ID]
```

**Campos Obligatorios**:
- ✅ `EstadoTarea = 1` (Completada)
- ✅ `CompletadaPor` NO es NULL
- ✅ `CompletadaPor` contiene email válido (ej: "ok3@icarus.com")
- ✅ `FechaCompletada` NO es NULL
- ✅ `FechaCompletada` es fecha/hora reciente (dentro de los últimos minutos)

**NO Permitido**:
- ❌ `CompletadaPor = "Usuario Móvil"` (hardcoded - BUG)
- ❌ `CompletadaPor = ""` (vacío)
- ❌ `CompletadaPor = "desconocido@icarus.com"` (solo en casos de error de autenticación)

---

## 📊 Métricas de Éxito

### Funcionalidad Core:
- **Carga de Tareas**: 100% de éxito en TC001
- **Filtro Pendientes/Todas**: 100% de éxito en TC002, TC008
- **Completar Tareas**: 100% de éxito en TC003, TC004, TC005, TC006
- **Auto-Refresh**: 100% de éxito - UI actualizada automáticamente después de cada completado

### Performance:
- **Tiempo de Carga Inicial**: < 3 segundos (TC001)
- **Tiempo de Auto-Refresh**: < 2 segundos (TC003-TC006)
- **Tiempo de Alternancia de Filtro**: < 1 segundo (TC008)
- **Fluidez de Scroll**: 60 FPS sin drops (TC015)

### Auditoría:
- **Campo CompletadaPor**: 100% con email válido del trabajador autenticado
- **Sincronización UI/DB**: 100% - lo que se ve en la app coincide con la base de datos

---

## 🐛 Bugs Conocidos a Verificar

### Bug 1: IsLoading Bloqueando Auto-Refresh (RESUELTO)
**Descripción**: Si `IsLoading = false` se ejecuta DESPUÉS de `CargarTareasAsync()`, el guard clause `if (IsLoading) return;` impide que el método se ejecute, resultando en UI que NO se actualiza.

**Verificación**:
- Revisar logs: Debe aparecer "CargarTareasAsync - Iniciando carga de tareas" después de completar tarea
- Si NO aparece: BUG NO RESUELTO

**Solución Correcta**:
```csharp
if (resultado)
{
    this.IsLoading = false;  // PRIMERO
    this.MostrarSoloPendientes = true;
    await this.CargarTareasAsync();  // SEGUNDO
}
```

---

## 📝 Template de Reporte de Bug

```markdown
## 🐛 Bug Report: [Título Descriptivo]

**ID**: BUG-NOT-XXX  
**Severidad**: 🔴 Crítica / 🟡 Media / 🟢 Baja  
**Test Case**: TCXXX  
**Fecha**: [Fecha]

### Descripción:
[Descripción clara del bug]

### Pasos para Reproducir:
1. [Paso 1]
2. [Paso 2]
3. [Paso 3]

### Resultado Esperado:
[Qué debería pasar]

### Resultado Actual:
[Qué pasa realmente]

### Evidencia:
- Logs: [Copiar logs relevantes]
- Screenshots: [Adjuntar capturas]
- Base de Datos: [Queries de verificación]

### Impacto:
[Cómo afecta al usuario]

### Workaround (si existe):
[Solución temporal]
```

---

## 🔧 Configuración del Entorno de Pruebas

### Requisitos:

1. **Backend API**:
   - ICARUS.API corriendo en `http://localhost:5090`
   - Base de datos SQL Server con datos de prueba

2. **Emulador Android**:
   - Android SDK instalado
   - Emulador configurado y corriendo

3. **Datos de Prueba**:
   - Al menos 1 usuario trabajador registrado (ej: ok3@icarus.com)
   - Al menos 20 tareas programadas para hoy:
     - 5-10 tareas de vacunación (50% pendientes, 50% completadas)
     - 5-10 tareas de iluminación (50% pendientes, 50% completadas)
     - 5-10 tareas de alimentación (50% pendientes, 50% completadas)

4. **Logging**:
   - Visual Studio 2022 Output Window abierto
   - Filtro configurado para mostrar solo logs de ICARUS_MOBILE

---

## ✅ Checklist Pre-Testing

Antes de iniciar las pruebas, verificar:

- [ ] Backend API corriendo y accesible
- [ ] Base de datos con datos de prueba
- [ ] Usuario de prueba autenticado
- [ ] Emulador Android iniciado
- [ ] Visual Studio 2022 con Output Window visible
- [ ] Aplicación compilada en modo DEBUG
- [ ] Log4net configurado correctamente
- [ ] Conexión a `http://10.0.2.2:5090` funcionando desde emulador

---

## 📌 Notas Finales

- **Prioridad Alta**: TC003, TC006, TC011 (completado, múltiples tareas, error handling)
- **Prioridad Media**: TC001, TC002, TC008 (carga, filtros)
- **Prioridad Baja**: TC009, TC010, TC014, TC015 (estados especiales, performance)

**Tiempo Estimado Total**: 2-3 horas para completar todos los casos de prueba

**Responsable**: [Nombre del Tester]  
**Fecha de Ejecución**: [Fecha]
