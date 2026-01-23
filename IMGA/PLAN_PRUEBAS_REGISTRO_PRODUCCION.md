# Plan de Pruebas - Módulo de Registro de Producción Diario

## 📋 Información General

**Módulo**: Registro de Producción Diario  
**ViewModel**: `CrearRegistroProduccionViewModel`, `EditarRegistroProduccionViewModel`  
**View**: `CrearRegistroProduccionPage`, `EditarRegistroProduccionPage`  
**Servicios**: `IRegistroProduccionService`, `IAuthenticationService`, `IEmulatorLoggingService`  
**Fecha**: Diciembre 2025  
**Versión**: 1.0.0

---

## 🎯 Objetivos de las Pruebas

1. Verificar que los galpones se cargan correctamente según el cliente del trabajador
2. Validar que los cálculos automáticos funcionan en tiempo real
3. Comprobar que las validaciones previenen datos incorrectos
4. Verificar que el registro se guarda correctamente en el backend
5. Validar que solo el trabajador puede ver/editar sus propios registros
6. Comprobar el manejo de errores y estados sin conexión

---

## 🧪 Casos de Prueba

### **Prioridad de Ejecución**:
1. **ALTA**: TC001 (Smoke Test), TC002 ✅ (BUG-001 Resuelto), TC003 (Validaciones), TC008 (Happy Path), TC023, TC024
2. **MEDIA**: TC004-TC007 (Validaciones Visuales), TC009-TC013 (Error Handling)
3. **BAJA**: TC014-TC020 (Edge Cases, Edición, Eliminación)

---

### **[ ] TC001: Carga Inicial de Galpones Disponibles**

**Objetivo**: Verificar que al abrir la página se cargan los galpones del cliente del trabajador

**Precondiciones**:
- Usuario autenticado como trabajador (ej: ok3@icarus.com)
- El trabajador pertenece a un cliente que tiene galpones activos
- API backend está corriendo

**Pasos**:
1. Iniciar sesión en la aplicación
2. Navegar a "Gestión Avícola" desde el menú principal
3. Seleccionar "Crear Registro de Producción"
4. Esperar a que termine la carga (spinner desaparece)

**Resultado Esperado**:
- ✅ Se muestra el formulario de registro
- ✅ El Picker "Galpón" se llena con los galpones disponibles
- ✅ Cada opción muestra: "Galpón X (Y gallinas)"
- ✅ La fecha por defecto es HOY
- ✅ Todos los campos numéricos están vacíos
- ✅ NO hay mensajes de error

**Logs Esperados**:
```
[INFO] CrearRegistroProduccionViewModel.CargarGalponesAsync - Iniciando carga de galpones disponibles
[INFO] RegistroProduccionService.GetGalponesDisponiblesAsync - Galpones obtenidos exitosamente: X
[INFO] CrearRegistroProduccionViewModel.CargarGalponesAsync - Galpones cargados en Picker
```

**Datos de Prueba**:
- API debe retornar mínimo 1 galpón activo
- Ejemplo: Galpón 7 (15000 gallinas), Galpón 8 (12000 gallinas)

---

### **[✅ PASSED] TC002: Validación de Capacidad de Producción (BUG-001)**

**Objetivo**: Verificar que el sistema bloquea registros con cantidad de huevos que supera el número de gallinas disponibles

**Precondiciones**:
- API ejecutándose (localhost:5090)
- Galpón 5 disponible con ~1891 gallinas

**Pasos**:
1. Abrir ICARUS_MOBILE desde Visual Studio 2022
2. Navegar a Gestión Avícola → Crear Registro de Producción
3. Llenar formulario: Fecha=12/12/2025, Galpón 5, Maples=450, Unidades=15, GallinasMuertas=0
4. Observar cálculos: Total=13,515 huevos, Eficiencia~715%
5. Hacer clic en "Guardar"
6. Observar respuesta

**Resultado Obtenido** (✅ PASSED - 2025-12-12 18:55:01):
- ✅ API ejecutó `ValidarCapacidadProduccionAsync` correctamente
- ✅ Detectó que 13,515 huevos > 1891 gallinas
- ✅ Retornó 400 Bad Request con mensaje claro
- ✅ Mobile app mostró alerta: "El total de huevos no puede superar el número de gallinas del galpón"
- ✅ ValidationBehavior + ValidationExceptionFilter funcionando correctamente
- ✅ BUG-001 completamente resuelto

**Logs API (18:55:02.250)**:
```
ValidationExceptionFilter - Campo: CantidadMaples, Errores: El total de huevos no puede superar el número de gallinas del galpón
ValidationException convertida a 400 Bad Request exitosamente
```

**Validación Implementada**:
```csharp
// CreateRegistroProduccionDiarioCommandValidator.cs - Lines 109-117
RuleFor(x => x.Data.CantidadMaples)
    .MustAsync(async (command, cantidadMaples, cancellationToken) =>
    {
        return await this.ValidarCapacidadProduccionAsync(command, cancellationToken);
    })
    .WithMessage("El total de huevos no puede superar el número de gallinas del galpón")
    .WithErrorCode("EXCEDE_CAPACIDAD_GALPON");
```

**Fórmulas a Verificar**:
```
TotalHuevos = (CantidadMaples × 30) + UnidadesIncompletas
EficienciaProduccion = (TotalHuevos / NumeroGallinasActual) × 100
PorcentajeMortalidad = (GallinasMuertas / NumeroGallinasActual) × 100
MortalidadAlta = PorcentajeMortalidad > 2%
```

---

### **[✅] TC003: Validación de Campos Requeridos y Registro Vacío**

**Objetivo**: Verificar que el formulario valida campos obligatorios y que al menos un campo tenga valor > 0

**Precondiciones**:
- Usuario en la página de Crear Registro

**Pasos Ejecutados**:
1. Seleccionar Galpón 5
2. Dejar todos los campos en 0 (Maples, Unidades, Gallinas Muertas)
3. Observar estado del botón "Guardar"

**Resultado Obtenido**:
- ✅ **Paso 3**: Botón "Guardar" deshabilitado/gris correctamente
- ✅ Validación frontend funciona: No permite guardar con todos los campos en 0
- ✅ UX mejorada: Usuario no puede intentar operación inválida

**Validaciones Frontend (Implementadas)**:
```csharp
public bool DatosCompletos =>
    GalponSeleccionado != null &&
    CantidadMaplesInt >= 0 &&
    UnidadesIncompletasInt >= 0 && UnidadesIncompletasInt < 30 &&
    GallinasMuertasInt >= 0 &&
    Fecha <= DateTime.Today &&
    (CantidadMaplesInt > 0 || UnidadesIncompletasInt > 0 || GallinasMuertasInt > 0);
```

**Validaciones Backend (Implementadas)**:
```csharp
RuleFor(x => x)
    .Must(ValidarProduccionOMortalidad)
    .WithMessage("Debe registrar al menos producción de huevos o mortalidad de gallinas")
    .WithErrorCode("REGISTRO_VACIO")
```

**Defensa en Profundidad**:
- **Frontend**: Botón deshabilitado previene intentos inválidos (mejor UX)
- **Backend**: Validación con FluentValidation previene manipulación del cliente (seguridad)

**Estado**: ✅ PASSED  
**Fecha Ejecución**: 2025-12-13 10:35:00  
**Ejecutado Por**: ok3@icarus.com  
**Notas**: Validación funcionando correctamente en ambas capas. Backend listo para retornar 400 con "REGISTRO_VACIO" si se burla frontend.

---

### **[ ] TC004: Validación de Rango de Unidades Incompletas**

**Objetivo**: Verificar que solo se aceptan valores entre 0-29 para unidades incompletas

**Precondiciones**:
- Usuario en la página de Crear Registro
- Galpón seleccionado

**Pasos**:
1. Ingresar "30" en Unidades Incompletas
2. Hacer clic en "Guardar"
3. Observar mensaje de error
4. Cambiar a "29"
5. Hacer clic en "Guardar" (con otros campos válidos)
6. Observar que NO hay error de validación

**Resultado Esperado**:
- ✅ **Paso 2**: Error "Las unidades incompletas deben estar entre 0 y 29"
- ✅ **Paso 5**: Validación pasa (29 es válido)
- ✅ El formulario explica visualmente: "(máximo 29 unidades)"

**Valores Límite a Probar**:
- `-1`: Inválido (negativo)
- `0`: Válido (sin unidades)
- `29`: Válido (máximo permitido)
- `30`: Inválido (debe completar otro maple)
- `100`: Inválido (fuera de rango)

---

### **[ ] TC005: Validación de Fecha No Futura**

**Objetivo**: Verificar que no se permiten fechas futuras en el registro

**Precondiciones**:
- Usuario en la página de Crear Registro
- Fecha actual: 09/12/2025

**Pasos**:
1. Cambiar la fecha del DatePicker a "10/12/2025" (mañana)
2. Llenar todos los campos correctamente
3. Hacer clic en "Guardar"
4. Observar mensaje de error
5. Cambiar fecha a "09/12/2025" (hoy)
6. Hacer clic en "Guardar"

**Resultado Esperado**:
- ✅ **Paso 3**: Error "La fecha no puede ser futura"
- ✅ **Paso 6**: Validación pasa
- ✅ Backend también rechaza fechas futuras (validación doble)

**Logs Esperados**:
```
[WARN] CrearRegistroProduccionViewModel.ValidarDatos - Fecha futura detectada
[ERROR] API retorna HTTP 400: "La fecha no puede ser futura"
```

---

### **[ ] TC006: Campos Obligatorios de Mortalidad**

**Objetivo**: Verificar que si hay mortalidad, se requieren causa y acciones

**Precondiciones**:
- Usuario en la página de Crear Registro
- Galpón seleccionado
- Campos básicos llenos

**Pasos**:
1. Ingresar "5" en Gallinas Muertas
2. Dejar vacíos "Causa Probable" y "Acciones Tomadas"
3. Hacer clic en "Guardar"
4. Observar mensajes de error
5. Llenar "Causa Probable": "Enfermedad respiratoria"
6. Hacer clic en "Guardar"
7. Observar otro error
8. Llenar "Acciones Tomadas": "Aislamiento y medicación"
9. Hacer clic en "Guardar"

**Resultado Esperado**:
- ✅ **Paso 3**: Errores:
  - "Debe especificar la causa probable de mortalidad"
  - "Debe especificar las acciones tomadas ante la mortalidad"
- ✅ **Paso 6**: Error solo de "Acciones Tomadas" (causa ya está llena)
- ✅ **Paso 9**: Validación pasa, se envía al API
- ✅ Los campos de mortalidad solo son visibles/requeridos cuando GallinasMuertas > 0

**Validación Condicional**:
```csharp
if (GallinasMuertas > 0)
{
    Requerido: CausaProbableMortalidad
    Requerido: AccionesTomadasMortalidad
}
```

---

### **[ ] TC007: Alerta Visual de Mortalidad Alta**

**Objetivo**: Verificar que se muestra alerta cuando la mortalidad supera el 2%

**Precondiciones**:
- Usuario en la página de Crear Registro
- Galpón 7 seleccionado (15000 gallinas)

**Pasos**:
1. Ingresar "250" en Gallinas Muertas
2. Observar el cálculo: 250/15000 = 1.67% (NO alerta)
3. Cambiar a "350" en Gallinas Muertas
4. Observar el cálculo: 350/15000 = 2.33% (ALERTA)
5. Verificar indicador visual

**Resultado Esperado**:
- ✅ **Paso 2**: Porcentaje = 1.67%, color normal (no hay alerta)
- ✅ **Paso 4**: Porcentaje = 2.33%, color rojo (alerta)
- ✅ **Indicador visual**: Frame rojo o badge "¡Mortalidad Alta!"
- ✅ MortalidadAlta = true cuando > 2%

**Umbrales a Validar**:
- `1.5%`: Normal (verde)
- `2.0%`: Límite (amarillo/naranja)
- `2.5%`: Alta (rojo)
- `5.0%`: Crítica (rojo intenso)

---

### **[ ] TC008: Guardar Registro Exitosamente**

**Objetivo**: Verificar el flujo completo de guardado de un registro válido

**Precondiciones**:
- Usuario autenticado: ok3@icarus.com
- Galpón 7 disponible (15000 gallinas)
- NO existe registro previo para hoy en Galpón 7

**Pasos**:
1. Navegar a "Crear Registro de Producción"
2. Llenar formulario:
   - Fecha: 09/12/2025 (hoy)
   - Galpón: Galpón 7
   - Maples: 450
   - Unidades: 15
   - Gallinas Muertas: 5
   - Observaciones: "Producción normal"
   - Causa Mortalidad: "Enfermedad respiratoria"
   - Acciones: "Aislamiento y medicación"
3. Hacer clic en "Guardar"
4. Esperar respuesta del API
5. Observar mensaje de éxito

**Resultado Esperado**:
- ✅ Spinner aparece durante el guardado
- ✅ API retorna HTTP 201 Created
- ✅ Toast verde: "✓ Registro creado exitosamente"
- ✅ Formulario se limpia automáticamente
- ✅ Fecha se resetea a HOY
- ✅ Todos los campos numéricos vuelven a vacío
- ✅ El registro se guarda en la base de datos

**Logs Esperados**:
```
[INFO] CrearRegistroProduccionViewModel.GuardarRegistroAsync - Iniciando guardado
[INFO] ObtenerEmailTrabajadorAutenticadoAsync - Email obtenido: ok3@icarus.com
[HTTP] POST http://10.0.2.2:5090/api/mobile/registro-produccion - 201
[INFO] CrearRegistroProduccionViewModel.GuardarRegistroAsync - Registro creado exitosamente
```

**Verificación en BD**:
```sql
SELECT * FROM RegistroProduccionDiario 
WHERE GalponId = 7 AND Fecha = '2025-12-09'
-- Debe retornar 1 registro con:
-- CantidadMaples = 450
-- UnidadesIncompletas = 15
-- GallinasMuertas = 5
-- CreadoPor = 'ok3@icarus.com'
```

---

### **[ ] TC009: Registro Duplicado para Mismo Galpón y Fecha**

**Objetivo**: Verificar que no se permite crear dos registros para el mismo galpón en la misma fecha

**Precondiciones**:
- YA existe un registro para Galpón 7 con fecha 09/12/2025
- Usuario autenticado

**Pasos**:
1. Navegar a "Crear Registro de Producción"
2. Seleccionar Galpón 7
3. Fecha: 09/12/2025 (misma fecha del registro existente)
4. Llenar todos los campos correctamente
5. Hacer clic en "Guardar"
6. Esperar respuesta del API

**Resultado Esperado**:
- ✅ API retorna HTTP 400 Bad Request
- ✅ Mensaje de error: "Ya existe un registro para este galpón en la fecha especificada"
- ✅ Snackbar rojo muestra el error
- ✅ El formulario NO se limpia (usuario puede corregir la fecha)
- ✅ NO se crea registro duplicado en BD

**Logs Esperados**:
```
[HTTP] POST http://10.0.2.2:5090/api/mobile/registro-produccion - 400
[ERROR] CrearRegistroProduccionViewModel.GuardarRegistroAsync - Error: Ya existe un registro
```

**Solución Sugerida al Usuario**:
- Cambiar la fecha a otro día
- O editar el registro existente en lugar de crear uno nuevo

---

### **[ ] TC010: Validación de Galpón Pertenece al Cliente**

**Objetivo**: Verificar que solo se pueden crear registros para galpones del cliente del trabajador

**Precondiciones**:
- Usuario autenticado pertenece al Cliente A
- Existe Galpón X que pertenece al Cliente B (otro cliente)

**Pasos**:
1. Intentar hacer una request manual al API con GalponId de otro cliente
   ```bash
   POST /api/mobile/registro-produccion
   { "galponId": X, "fecha": "2025-12-09", ... }
   ```
2. Observar respuesta del API

**Resultado Esperado**:
- ✅ API retorna HTTP 403 Forbidden
- ✅ Mensaje: "No tiene permisos para registrar en este galpón"
- ✅ El Picker en la UI solo muestra galpones del cliente del trabajador (prevención en frontend)
- ✅ Backend valida igualmente (validación doble por seguridad)

**Nota**: Este test requiere acceso directo al API (Postman, curl) porque el UI solo carga galpones permitidos.

---

### **[ ] TC011: Botón "Limpiar Formulario"**

**Objetivo**: Verificar que el botón de limpiar restaura el formulario a valores por defecto

**Precondiciones**:
- Usuario en la página de Crear Registro
- Formulario parcialmente lleno

**Pasos**:
1. Llenar varios campos:
   - Galpón: Galpón 7
   - Maples: 450
   - Unidades: 15
   - Gallinas Muertas: 5
   - Observaciones: "Test"
2. Hacer clic en el botón "Limpiar" (icono refresh en toolbar)
3. Observar el estado del formulario

**Resultado Esperado**:
- ✅ Fecha se resetea a HOY
- ✅ Galpón se deselecciona (vuelve a "Seleccionar galpón...")
- ✅ Todos los campos de texto se vacían
- ✅ Cálculos automáticos vuelven a 0
- ✅ Mensajes de error/éxito desaparecen
- ✅ NO se llama al API (solo limpieza local)

**Comando Ejecutado**:
```csharp
LimpiarFormularioCommand → LimpiarFormulario()
```

---

### **[ ] TC012: Navegación "Volver" sin Guardar**

**Objetivo**: Verificar que se puede cancelar la creación y volver sin guardar

**Precondiciones**:
- Usuario en la página de Crear Registro
- Formulario parcialmente lleno

**Pasos**:
1. Llenar algunos campos del formulario
2. Hacer clic en "← Atrás"
3. Observar navegación
4. Volver a entrar a "Crear Registro"
5. Verificar que el formulario está limpio

**Resultado Esperado**:
- ✅ Navega de regreso a la página anterior (Welcome de Gestión Avícola)
- ✅ NO se guarda ningún dato
- ✅ NO aparece diálogo de confirmación "¿Desea guardar antes de salir?"
- ✅ Al volver a entrar, el formulario está vacío (no persiste datos)

**Logs Esperados**:
```
[INFO] CrearRegistroProduccionViewModel.Volver - Usuario canceló creación de registro
[INFO] Navegación de vuelta completada exitosamente
```

---

### **[ ] TC013: Error de Conexión al API**

**Objetivo**: Verificar el manejo de errores cuando el API no está disponible

**Precondiciones**:
- Usuario autenticado
- API backend NO está corriendo (detener ICARUS.API)

**Pasos**:
1. Navegar a "Crear Registro de Producción"
2. Esperar intento de carga de galpones
3. Observar mensaje de error
4. Llenar formulario de todas formas
5. Intentar guardar

**Resultado Esperado**:
- ✅ **Al cargar galpones**: 
  - Spinner desaparece después del timeout
  - Snackbar rojo: "Error al obtener galpones. Verifique su conexión."
  - Picker de galpones queda vacío
- ✅ **Al intentar guardar**:
  - Spinner aparece
  - Después del timeout: "No se pudo conectar al servidor"
  - El registro NO se guarda (sin modo offline implementado)
- ✅ Usuario puede reintentar después

**Logs Esperados**:
```
[ERROR] RegistroProduccionService.GetGalponesDisponiblesAsync - Error de conexión
[ERROR] CrearRegistroProduccionViewModel.GuardarRegistroAsync - Excepción al guardar
```

**Recuperación**:
1. Iniciar el API backend
2. Volver a "Crear Registro"
3. Verificar que ahora carga correctamente

---

### **[ ] TC014: Validación de Token Expirado**

**Objetivo**: Verificar el comportamiento cuando el token JWT expira

**Precondiciones**:
- Usuario autenticado
- Token JWT con tiempo de expiración corto (para testing)

**Pasos**:
1. Iniciar sesión
2. Esperar a que el token expire (o simular expiración)
3. Intentar cargar galpones o guardar un registro
4. Observar respuesta

**Resultado Esperado**:
- ✅ API retorna HTTP 401 Unauthorized
- ✅ Snackbar: "Sesión expirada. Por favor inicie sesión nuevamente"
- ✅ La app navega automáticamente a la pantalla de login
- ✅ El usuario puede iniciar sesión nuevamente

**Logs Esperados**:
```
[WARN] RegistroProduccionService - Token expirado o inválido
[INFO] Navegando a login por sesión expirada
```

---

### **[ ] TC015: Campos con Valores Extremos**

**Objetivo**: Verificar el comportamiento con valores numéricos muy grandes

**Precondiciones**:
- Usuario en la página de Crear Registro
- Galpón seleccionado

**Pasos**:
1. Ingresar "9999" en Maples
2. Ingresar "29" en Unidades
3. Observar cálculo de Total Huevos
4. Ingresar "1000" en Gallinas Muertas
5. Observar cálculo de Mortalidad

**Resultado Esperado**:
- ✅ Total Huevos = 299,999 (9999 × 30 + 29)
- ✅ Los cálculos se realizan correctamente sin overflow
- ✅ Porcentaje de Mortalidad = 6.67% (si galpón tiene 15000 gallinas)
- ✅ Alerta de mortalidad crítica (muy alta)
- ✅ Backend puede rechazar si valores son inverosímiles

**Valores Extremos a Probar**:
- `Maples = 0`: Válido (sin producción ese día)
- `Maples = 10000`: Valores altos pero matemáticamente correctos
- `GallinasMuertas = 15000`: Todas las gallinas (mortalidad 100%)

---

### **[ ] TC016: Observaciones con Texto Largo**

**Objetivo**: Verificar el manejo de campos de texto con contenido extenso

**Precondiciones**:
- Usuario en la página de Crear Registro

**Pasos**:
1. Llenar todos los campos requeridos
2. En "Observaciones", ingresar un texto de 500+ caracteres
3. Hacer clic en "Guardar"
4. Observar si se guarda correctamente

**Resultado Esperado**:
- ✅ El campo acepta texto largo
- ✅ Se guarda correctamente en la BD (columna nvarchar(max))
- ✅ Al consultar el registro, el texto se muestra completo
- ✅ NO hay truncamiento de datos

**Texto de Prueba**:
```
"Hoy fue un día de producción irregular. Se observó que las gallinas del sector norte
mostraron comportamiento anormal durante la mañana. Se realizó inspección veterinaria
y se determinó que se debe a cambios de temperatura..."
[... 500 caracteres totales ...]
```

---

### **[ ] TC017: Múltiples Registros en Diferentes Galpones**

**Objetivo**: Verificar que se pueden crear múltiples registros el mismo día en diferentes galpones

**Precondiciones**:
- Usuario autenticado
- Cliente tiene 3 galpones: Galpón 7, 8, 9
- Fecha: 09/12/2025

**Pasos**:
1. Crear registro para Galpón 7 (fecha 09/12/2025)
2. Verificar que se guarda exitosamente
3. Crear registro para Galpón 8 (misma fecha)
4. Verificar que se guarda exitosamente
5. Crear registro para Galpón 9 (misma fecha)
6. Verificar que se guarda exitosamente

**Resultado Esperado**:
- ✅ Los 3 registros se crean sin conflicto
- ✅ Cada registro es independiente
- ✅ La restricción UNIQUE (GalponId, Fecha) permite múltiples galpones en la misma fecha
- ✅ La restricción solo previene duplicados del MISMO galpón

**Verificación en BD**:
```sql
SELECT GalponId, Fecha, CantidadMaples 
FROM RegistroProduccionDiario 
WHERE Fecha = '2025-12-09'
-- Debe retornar 3 registros (uno por galpón)
```

---

### **[ ] TC018: Edición de Registro Existente**

**Objetivo**: Verificar que se puede editar un registro previamente creado

**Precondiciones**:
- Existe un registro creado por ok3@icarus.com
- ID del registro: 123
- Galpón 7, Fecha: 09/12/2025, Maples: 450

**Pasos**:
1. Navegar a "Historial de Registros" (si existe)
2. Seleccionar el registro ID 123
3. Hacer clic en "Editar"
4. Modificar Maples de 450 a 500
5. Hacer clic en "Guardar"
6. Verificar actualización

**Resultado Esperado**:
- ✅ La página de edición se carga con datos existentes
- ✅ Todos los campos muestran los valores originales
- ✅ Al modificar, los cálculos se actualizan
- ✅ PUT /api/mobile/registro-produccion retorna 200 OK
- ✅ Toast: "Registro actualizado exitosamente"
- ✅ En BD, el registro muestra FechaModificacion actualizada

**Restricción de Seguridad**:
- Solo el creador del registro (ok3@icarus.com) puede editarlo
- Otros trabajadores reciben HTTP 403 Forbidden

---

### **[ ] TC019: Eliminación de Registro**

**Objetivo**: Verificar que se puede eliminar un registro reciente (< 30 días)

**Precondiciones**:
- Existe un registro creado HOY por ok3@icarus.com
- ID del registro: 124

**Pasos**:
1. Navegar al registro en el historial
2. Hacer clic en "Eliminar" (si existe botón)
3. Confirmar eliminación en diálogo
4. Verificar que desaparece de la lista

**Resultado Esperado**:
- ✅ Diálogo de confirmación: "¿Está seguro de eliminar este registro?"
- ✅ DELETE /api/mobile/registro-produccion/124 retorna 200 OK
- ✅ Toast: "Registro eliminado exitosamente"
- ✅ El registro NO aparece más en el historial
- ✅ En BD, EstaActivo = false (soft delete)

**Restricciones**:
- NO se pueden eliminar registros > 30 días (API retorna 400)
- Solo el creador puede eliminar

---

### **[ ] TC020: Consulta de Historial de Registros**

**Objetivo**: Verificar que se puede consultar el historial de registros creados

**Precondiciones**:
- El trabajador ok3@icarus.com ha creado 5 registros en diferentes fechas

**Pasos**:
1. Navegar a "Historial de Registros"
2. Esperar carga de datos
3. Observar lista de registros
4. Aplicar filtro por fecha
5. Aplicar filtro por galpón

**Resultado Esperado**:
- ✅ Se muestran SOLO los registros del trabajador autenticado
- ✅ Cada registro muestra: Fecha, Galpón, Total Huevos, Mortalidad
- ✅ Los filtros funcionan correctamente
- ✅ Paginación si hay > 20 registros
- ✅ Se puede hacer pull-to-refresh para actualizar

**Endpoint**:
```
GET /api/mobile/registro-produccion/historial
  ?fechaInicio=2025-12-01
  &fechaFin=2025-12-09
  &galponId=7
  &pageNumber=1
  &pageSize=20
```

---

## 📊 Matriz de Cobertura de Pruebas

| Funcionalidad | TC001 | TC002 | TC003 | TC004 | TC005 | TC006 | TC007 | TC008 | TC009 | TC010 | TC011 | TC012 | TC013 | TC014 | TC015 | TC016 | TC017 | TC018 | TC019 | TC020 |
|---------------|-------|-------|-------|-------|-------|-------|-------|-------|-------|-------|-------|-------|-------|-------|-------|-------|-------|-------|-------|-------|
| Carga de datos | ✓ | | | | | | | | | | | | ✓ | ✓ | | | | ✓ | | ✓ |
| Cálculos | | ✓ | | | | | ✓ | ✓ | | | | | | | ✓ | | | ✓ | | |
| Validaciones | | | ✓ | ✓ | ✓ | ✓ | | | ✓ | ✓ | | | | | | | | | | |
| Guardado | | | | | | | | ✓ | ✓ | | | | | | | ✓ | ✓ | | | |
| Edición | | | | | | | | | | | | | | | | | | ✓ | | |
| Eliminación | | | | | | | | | | | | | | | | | | | ✓ | |
| Navegación | | | | | | | | | | | ✓ | ✓ | | | | | | | | |
| Manejo errores | | | | | | | | | | | | | ✓ | ✓ | | | | | | |
| Seguridad | | | | | | | | | | ✓ | | | | ✓ | | | | | | |
| Historial | | | | | | | | | | | | | | | | | | | | ✓ |

---

### **[✅] TC021: Validación de Mortalidad Retroactiva - BLOQUEO**

**Objetivo**: Verificar que el sistema bloquea registros retroactivos con mortalidad cuando ya existen registros posteriores

**Categoría**: Validación Crítica - Integridad de Datos Temporal

**Precondiciones**:
- Usuario autenticado: ok3@icarus.com
- Galpón 5 disponible (1906 gallinas iniciales)
- **YA EXISTE** un registro para Galpón 5 con fecha 12/12/2025 (HOY)
- La fecha actual del sistema es 12/12/2025

**Pasos**:
1. Navegar a "Crear Registro de Producción"
2. Llenar formulario:
   - **Fecha: 11/12/2025** (AYER - fecha retroactiva)
   - Galpón: Galpón 5 (galpon5)
   - Maples: 3
   - Unidades: 0
   - **Gallinas Muertas: 4** (CON MORTALIDAD)
   - Observaciones: "Test retroactivo"
3. Hacer clic en "Guardar"
4. Esperar respuesta del API

**Resultado Esperado**:
- ✅ API retorna **HTTP 400 Bad Request** (NO 201 Created)
- ✅ **ValidationExceptionFilter captura la excepción** en el servidor
- ✅ Mensaje de error claro en app móvil:
  ```
  No se permite registrar mortalidad en fechas pasadas cuando existen 
  registros posteriores. La mortalidad debe registrarse el mismo día 
  para mantener la integridad de los datos históricos.
  ```
- ✅ **NO aparece** el prefijo "FluentValidation.ValidationException"
- ✅ Alert/Snackbar rojo muestra el error
- ✅ El formulario NO se limpia (usuario puede corregir)
- ✅ **NO se crea registro en BD** (validación bloquea antes del handler)

**Logs Esperados API**:
```
[INFO] CreateRegistroProduccionDiarioCommandValidator - Constructor - Validator inicializado
[INFO] ValidarRegistroRetroactivoConMortalidadAsync - Iniciando validación - Fecha: 2025-12-11, GalponId: 5, GallinasMuertas: 4
[INFO] ValidarRegistroRetroactivoConMortalidadAsync - Registro retroactivo con mortalidad detectado
[INFO] ValidarRegistroRetroactivoConMortalidadAsync - Galpón galpon5 encontrado, buscando registros posteriores
[INFO] ValidarRegistroRetroactivoConMortalidadAsync - Registros posteriores encontrados: 1
[WARN] ValidarRegistroRetroactivoConMortalidadAsync - BLOQUEANDO registro retroactivo con mortalidad
[WARN] ValidationExceptionFilter - Capturando ValidationException con 1 errores
[INFO] ValidationExceptionFilter - Campo: GallinasMuertas, Errores: No se permite registrar...
[INFO] ValidationExceptionFilter - ValidationException convertida a 400 Bad Request exitosamente
```

**Logs Esperados App Móvil**:
```
[INFO] CrearRegistroProduccionViewModel.GuardarRegistroAsync - Iniciando guardado
[HTTP] POST http://10.0.2.2:5090/api/mobile/registro-produccion - 400
[ERROR] RegistroProduccion - Error al crear registro: BadRequest
[ERROR] CrearRegistroProduccionViewModel - Error en respuesta del servicio: No se permite registrar mortalidad...
```

**Arquitectura de Validación**:
1. **ValidationBehavior** (MediatR Pipeline) → Intercepta command antes del handler
2. **CreateRegistroProduccionDiarioCommandValidator** → Ejecuta `ValidarRegistroRetroactivoConMortalidadAsync()`
3. **ValidationExceptionFilter** → Captura ValidationException y retorna 400 con estructura limpia
4. **ExtractErrorMessage** (Mobile) → Parsea JSON y extrae mensaje limpio sin prefijos técnicos

**Verificación en BD**:
```sql
SELECT * FROM RegistroProduccionDiario 
WHERE GalponId = 5 AND Fecha = '2025-12-11'
-- Debe retornar 0 registros (validación bloqueó la creación)

SELECT * FROM RegistroProduccionDiario 
WHERE GalponId = 5 AND Fecha = '2025-12-12'
-- Debe retornar el registro posterior que causó el bloqueo
```

---

### **[✅] TC022: Registro Retroactivo SIN Mortalidad - PERMITIDO**

**Objetivo**: Verificar que registros retroactivos SIN mortalidad se permiten correctamente

**Precondiciones**:
- Usuario autenticado: ok3@icarus.com
- Galpón 5 disponible (1906 gallinas)
- YA EXISTE un registro para Galpón 5 con fecha 12/12/2025 (HOY)

**Pasos**:
1. Navegar a "Crear Registro de Producción"
2. Llenar formulario:
   - **Fecha: 11/12/2025** (AYER - fecha retroactiva)
   - Galpón: Galpón 5 (galpon5)
   - Maples: 9
   - Unidades: 9
   - **Gallinas Muertas: 0** (SIN MORTALIDAD)
   - Observaciones: "Recuperación de datos faltantes"
3. Hacer clic en "Guardar"

**Resultado Esperado**:
- ✅ API retorna **HTTP 201 Created** (registro exitoso)
- ✅ Toast verde: "✓ Registro creado exitosamente"
- ✅ Registro se guarda correctamente en BD con ID asignado
- ✅ Validación **NO bloquea** porque `GallinasMuertas = 0`
- ✅ El inventario del galpón **NO se modifica** (sin mortalidad)

**Logs Esperados API**:
```
[INFO] ValidarRegistroRetroactivoConMortalidadAsync - Iniciando validación - GallinasMuertas: 0
[INFO] ValidarRegistroRetroactivoConMortalidadAsync - Sin mortalidad, permitiendo registro
[INFO] CreateRegistroProduccionDiarioCommandHandler - Registro creado exitosamente - ID: 105
```

**Verificación en BD**:
```sql
SELECT * FROM RegistroProduccionDiario 
WHERE GalponId = 5 AND Fecha = '2025-12-11' AND GallinasMuertas = 0
-- Debe retornar 1 registro (permitido porque no hay mortalidad)
```

---

### **[✅ PASSED] TC023: Validación de Fecha Futura - Doble Protección**

**Objetivo**: Verificar que fechas futuras son bloqueadas con validación frontend y backend

**Precondiciones**:
- Usuario autenticado
- Fecha actual: 13/12/2025

**Pasos**:
1. Seleccionar fecha: **14/12/2025** (MAÑANA - fecha futura)
2. Seleccionar Galpón 5
3. Llenar: Maples: 10, Gallinas Muertas: 5
4. Observar estado del botón "Guardar"

**Resultado Obtenido** (✅ PASSED - 2025-12-13):
- ✅ **Frontend**: Botón "Guardar" se deshabilita automáticamente (aparece gris)
- ✅ **UX**: Feedback visual claro - usuario sabe que no puede guardar
- ✅ **No se envía** solicitud HTTP al API (prevención proactiva)
- ✅ **Backend**: Validación de respaldo con ErrorCode "REGISTRO_FECHA_FUTURA"

**Validaciones Implementadas**:

**Frontend (MAUI) - `CrearRegistroProduccionViewModel.cs`:**
```csharp
public bool DatosCompletos =>
    GalponSeleccionado != null &&
    CantidadMaplesInt >= 0 &&
    UnidadesIncompletasInt >= 0 && UnidadesIncompletasInt < 30 &&
    GallinasMuertasInt >= 0 &&
    Fecha <= DateTime.Today;  // ← Validación frontend
```

**Backend (API) - `CreateRegistroProduccionDiarioCommandValidator.cs`:**
```csharp
RuleFor(x => x.Fecha)
    .LessThanOrEqualTo(DateTime.Today)
    .WithMessage("No se pueden crear registros con fecha futura")
    .WithErrorCode("REGISTRO_FECHA_FUTURA")
```

**Arquitectura de Seguridad**: Defensa en profundidad - validación en cliente previene llamadas innecesarias, validación en servidor protege contra manipulación de cliente

---

### **[✅ PASSED] TC024: Mortalidad HOY - Actualización de Inventario Correcta**

**Objetivo**: Verificar que mortalidad registrada el mismo día se permite y actualiza correctamente el inventario del galpón

**Precondiciones**:
- Fecha actual: 13/12/2025
- API ejecutándose (localhost:5090)
- Galpón 5 con inventario dinámico

**Pasos**:
1. Abrir ICARUS_MOBILE desde Visual Studio 2022
2. Navegar a Gestión Avícola → Crear Registro de Producción
3. Fecha: **13/12/2025** (HOY - por defecto)
4. Seleccionar Galpón 5
5. Llenar: Maples: 10, Unidades: 0, Gallinas Muertas: 3
6. Hacer clic en "Guardar"

**Resultado Obtenido** (✅ PASSED - 2025-12-13 10:24:32):
- ✅ **Validación**: "Fecha es hoy o futura (2025-12-13 >= 2025-12-13), permitiendo registro"
- ✅ **HTTP 201 Created** - Registro ID: 108 creado exitosamente
- ✅ **Inventario actualizado**: Gallinas antes: 1882, después: 1879 (correctamente decrementado)
- ✅ **3 registros guardados** en base de datos:
  - RegistroProduccionDiario (ID: 108)
  - Galpón (inventario actualizado)
  - RegistroMortalidad (para análisis detallado)
- ✅ **Mobile app**: Alerta verde de éxito mostrada
- ✅ **Eficiencia calculada**: 15.94% (300 huevos / 1882 gallinas)

**Logs API Confirmados (10:24:32.387)**:
```
Actualizando inventario del galpón - Gallinas muertas: 3
Inventario actualizado - Gallinas antes: 1882, después: 1879
Registro de mortalidad creado con AutoMapper - CantidadMuertas: 3
Cambios guardados exitosamente. Filas afectadas: 3
```

**Funcionalidad Verificada**:
- ✅ Mortalidad HOY siempre permitida (sin restricción de registros posteriores)
- ✅ Actualización automática del inventario del galpón
- ✅ Creación de registro específico de mortalidad para análisis
- ✅ Validación defensiva previene números negativos de gallinas
- ✅ Transacción atómica (3 operaciones en una sola transacción)

---

## 🎯 Prioridad de Ejecución

### **Alta Prioridad** (Ejecutar primero)
- TC001: Carga inicial ← **CRÍTICO**
- TC002: Cálculos automáticos ← **CORE FEATURE**
- TC008: Guardar registro exitosamente ← **HAPPY PATH**
- TC003: Validación de campos ← **CALIDAD DE DATOS**
- **TC021: Validación mortalidad retroactiva** ← **INTEGRIDAD TEMPORAL** 🆕
- **TC022: Registro retroactivo sin mortalidad** ← **CASO PERMITIDO** 🆕

### **Media Prioridad**
- TC004: Rango de unidades
- TC005: Fecha no futura
- TC006: Campos de mortalidad
- TC007: Alerta visual
- TC009: Registro duplicado
- TC013: Error de conexión

### **Baja Prioridad**
- TC011: Limpiar formulario
- TC012: Navegación volver
- TC015: Valores extremos
- TC016: Texto largo
- TC017: Múltiples registros
- TC018: Edición
- TC019: Eliminación
- TC020: Historial

### **Casos Especiales** (Requieren setup adicional)
- TC010: Validación de permisos (requiere múltiples clientes)
- TC014: Token expirado (requiere configuración de tiempos)

---

## 📝 Datos de Prueba Requeridos

### **Base de Datos**

```sql
-- Cliente de prueba
INSERT INTO Cliente (Nombre, RUC) VALUES ('Cliente Test', '20123456789');

-- Galpones
INSERT INTO Galpon (ClienteId, NumeroGalpon, NumeroGallinasActual, EstaActivo)
VALUES 
  (1, '7', 15000, 1),
  (1, '8', 12000, 1),
  (1, '9', 10000, 1);

-- Trabajador
INSERT INTO Trabajador (Email, ClienteId, EstaActivo)
VALUES ('ok3@icarus.com', 1, 1);
```

### **Escenarios de Datos**

1. **Galpón sin registros**: Para TC008, TC017
2. **Galpón con registro hoy**: Para TC009 (duplicado)
3. **Galpón con registro hace 5 días**: Para TC018 (edición)
4. **Galpón con registro hace 40 días**: Para TC019 (eliminación con restricción)

---

## 🚀 Estrategia de Ejecución

### **Fase 1: Smoke Tests** (15 min)
- TC001, TC002, TC008 → Funcionalidad básica

### **Fase 2: Validaciones** (30 min)
- TC003, TC004, TC005, TC006, TC007 → Calidad de datos

### **Fase 3: Casos de Error** (20 min)
- TC009, TC013, TC014 → Robustez

### **Fase 4: Features Completos** (30 min)
- TC018, TC020 → Edición e historial

### **Fase 5: Edge Cases** (20 min)
- TC015, TC016, TC017 → Casos límite

**Tiempo Total Estimado**: 2 horas

---

## ✅ Criterios de Aceptación

Para considerar el módulo **APROBADO**, debe cumplir:

1. ✅ Todos los test cases de **Alta Prioridad** pasan sin errores
2. ✅ Al menos **80%** de test cases de **Media Prioridad** pasan
3. ✅ **Cero errores críticos** (pérdida de datos, crashes)
4. ✅ Validaciones previenen **100%** de datos incorrectos
5. ✅ Logs completos en **todos** los flujos principales
6. ✅ Performance aceptable (< 2 segundos para guardar)

---

## 🐛 Registro de Defectos

| ID | Severidad | TC | Descripción | Estado | Fecha Resolución |
|----|-----------|----|-----------|----|------------------|
| BUG-001 | **Alta** | TC002 | Sistema permitía registrar 709% de eficiencia (13515 huevos de 1906 gallinas) sin validación | ✅ **Resuelto** | 2025-12-12 |
| BUG-002 | **Crítica** | TC021 | FluentValidation no se ejecutaba en pipeline de MediatR, permitiendo registros retroactivos con mortalidad | ✅ **Resuelto** | 2025-12-12 |

---

### **BUG-001: Validación de Capacidad Máxima de Producción**

**Severidad**: Alta  
**Test Case**: TC002  
**Fecha Detección**: 2025-12-09  
**Fecha Resolución**: 2025-12-12  

**Descripción**: 
El sistema permitía registrar un total de huevos que excedía físicamente el número de gallinas disponibles en el galpón. Caso específico: 13515 huevos de 1906 gallinas = 709% de eficiencia, lo cual es imposible (1 gallina = máximo 1 huevo/día).

**Pasos para Reproducir**:
1. Seleccionar Galpón 5 (1906 gallinas)
2. Ingresar Maples: 450, Unidades: 15
3. Total calculado: 13515 huevos
4. Hacer clic en Guardar
5. API retorna 201 Created (INCORRECTO)

**Resultado Esperado**: 
- API debe retornar 400 Bad Request
- Mensaje: "El total de huevos no puede superar el número de gallinas del galpón"

**Resultado Actual**: 
- API guardaba el registro sin validación
- Se permitían eficiencias físicamente imposibles

**Causa Raíz**:
Faltaba validación asíncrona `ValidarCapacidadProduccionAsync` en el validator de CreateRegistroProduccionDiarioCommand.

**Solución Implementada**:
- ✅ Agregada regla de validación asíncrona en `CreateRegistroProduccionDiarioCommandValidator`
- ✅ Query a base de datos para obtener número actual de gallinas del galpón
- ✅ Validación: `totalHuevos <= galpon.NumeroGallinasActual`
- ✅ ErrorCode: "REGISTRO_EXCEDE_CAPACIDAD"

**Archivos Modificados**:
- `ICARUS.Application/Features/GestionAvicola/Validators/CreateRegistroProduccionDiarioCommandValidator.cs`

**Estado**: ✅ **Resuelto y Verificado**

---

### **BUG-002: ValidationException No Interceptada en Pipeline**

**Severidad**: **Crítica** (Permitía datos inconsistentes en producción)  
**Test Case**: TC021  
**Fecha Detección**: 2025-12-12  
**Fecha Resolución**: 2025-12-12  

**Descripción**: 
A pesar de tener validadores de FluentValidation correctamente implementados, estos NO se estaban ejecutando. MediatR enviaba los commands directamente al handler sin pasar por el ValidationBehavior, permitiendo que datos inválidos llegaran a la base de datos.

**Caso Específico**: Sistema permitía registrar mortalidad en fechas pasadas cuando ya existían registros posteriores, rompiendo la integridad temporal de los datos históricos.

**Pasos para Reproducir**:
1. Crear registro para Galpón 5 con fecha 12/12/2025 (hoy)
2. Intentar crear registro para Galpón 5 con fecha 11/12/2025 (ayer) con GallinasMuertas: 2
3. API retorna **500 Internal Server Error** (INCORRECTO)
4. ValidationException se lanza pero no se captura correctamente

**Resultado Esperado**: 
- API debe retornar 400 Bad Request
- Mensaje limpio sin "FluentValidation.ValidationException"
- Validación debe ejecutarse ANTES del handler

**Resultado Actual**: 
- Validators nunca se ejecutaban
- Commands llegaban directamente al handler
- Errores retornaban 500 con stack trace completo

**Causa Raíz**:
1. **ValidationBehavior no existía**: No había IPipelineBehavior<,> para ejecutar validators en el pipeline de MediatR
2. **Filter no existía**: No había manejo global de ValidationException
3. **ExtractErrorMessage incompleto**: No parseaba correctamente la estructura de errores de FluentValidation

**Solución Implementada**:

**Backend (ICARUS.API)**:
- ✅ Creado `ValidationBehavior<TRequest, TResponse>` implementando `IPipelineBehavior<,>`
- ✅ Registrado en DI: `services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>))`
- ✅ Creado `ValidationExceptionFilter` implementando `IExceptionFilter`
- ✅ Registrado globalmente en `AddControllers(options => options.Filters.Add<ValidationExceptionFilter>())`
- ✅ Agregado logging detallado en `CreateRegistroProduccionDiarioCommandValidator`
- ✅ Comentada validación de `CausaProbableMortalidad` (campos ocultos en UI móvil)

**Frontend (ICARUS_MOBILE)**:
- ✅ Mejorado `ExtractErrorMessage()` para parsear estructura `{ "errors": { "Field": ["message"] } }`
- ✅ Agregada detección de "FluentValidation.ValidationException" en `title` para extraer `detail`
- ✅ Manejo de arrays de errores con JArray

**Archivos Creados**:
- `ICARUS.Application/Behaviors/ValidationBehavior.cs`
- `ICARUS.API/Filters/ValidationExceptionFilter.cs`

**Archivos Modificados**:
- `ICARUS.Application/DependencyInjection/ApplicationServiceRegistration.cs`
- `ICARUS.API/Program.cs`
- `ICARUS.Application/Features/GestionAvicola/Validators/CreateRegistroProduccionDiarioCommandValidator.cs`
- `ICARUS_MOBILE/Modules/GestionAvicola/Services/RegistroProduccionService.cs`

**Logs de Verificación (API)**:
```
[INFO] CreateRegistroProduccionDiarioCommandValidator - Constructor - Validator inicializado
[WARN] ValidarRegistroRetroactivoConMortalidadAsync - BLOQUEANDO registro retroactivo con mortalidad
[WARN] ValidationExceptionFilter - Capturando ValidationException con 1 errores
[INFO] ValidationExceptionFilter - ValidationException convertida a 400 Bad Request exitosamente
```

**Logs de Verificación (Mobile)**:
```
[HTTP] POST - 400 Bad Request
[ERROR] Error al crear registro: BadRequest - {"errors":{"GallinasMuertas":["No se permite..."]}}
[ERROR] Error en respuesta del servicio: No se permite registrar mortalidad en fechas pasadas...
```

**Tests de Regresión**:
- ✅ TC021: Registro retroactivo con mortalidad → 400 Bad Request (BLOQUEADO)
- ✅ TC022: Registro retroactivo sin mortalidad → 201 Created (PERMITIDO)
- ✅ Mensaje de error limpio sin prefijos técnicos
- ✅ Validator se ejecuta antes del handler

**Estado**: ✅ **Resuelto, Probado y Verificado**

---

**Plantilla para Nuevos Defectos**:
```
ID: BUG-XXX
Severidad: Crítica/Alta/Media/Baja
Test Case: TCXXX
Descripción: [Descripción breve del problema]
Pasos para Reproducir: [Lista numerada]
Resultado Esperado: [Comportamiento correcto]
Resultado Actual: [Comportamiento observado]
Causa Raíz: [Análisis técnico]
Solución: [Cambios implementados]
Estado: Abierto/En Progreso/Resuelto
```
