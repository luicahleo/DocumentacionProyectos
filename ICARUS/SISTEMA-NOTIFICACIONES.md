# 📋 SISTEMA DE NOTIFICACIONES - ICARUS

> **Documento de Referencia Técnica**  
> **Fecha:** Octubre 2025  
> **Versión:** 1.0  
> **Módulo:** Gestión Avícola - Notificaciones

---

## 📑 Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Entidades y Modelos](#entidades-y-modelos)
4. [DTOs (Data Transfer Objects)](#dtos-data-transfer-objects)
5. [Flujo Operacional](#flujo-operacional)
6. [Endpoints API (Diseño)](#endpoints-api-diseño)
7. [Seguridad y Validaciones](#seguridad-y-validaciones)
8. [Presentación (Vista Web)](#presentación-vista-web)
9. [Referencias Rápidas](#referencias-rápidas)

---

## 🎯 Resumen Ejecutivo

El **Sistema de Notificaciones** de ICARUS es un módulo completo de gestión de tareas diarias para operaciones avícolas que incluye tres tipos de notificaciones:

| Tipo | Descripción | Estado |
|------|-------------|--------|
| **Vacunación** | Tareas programadas pendientes y atrasadas | Tareas puntuales con estado |
| **Iluminación** | Cronogramas activos con horarios de oscuridad | Cronogramas activos continuos |
| **Alimentación** | Períodos activos de alimentación por tipo | Cronogramas activos continuos |

### 🔑 Características Clave

- ✅ **Filtrado por Cliente**: Solo muestra notificaciones del cliente autenticado
- ✅ **Tareas Atrasadas**: Incluye tareas de vacunación pendientes de días anteriores
- ✅ **Expansión por Galpón**: Cada cronograma genera una tarea por galpón afectado
- ✅ **Completar Tareas**: Marcar tareas de vacunación como completadas vía AJAX
- ✅ **Estados Visuales**: Badges y colores diferenciados por tipo y estado

---

## 📐 Arquitectura del Sistema

### Estructura de Capas

```
┌─────────────────────────────────────────────────────────┐
│ PRESENTATION LAYER (ICARUS.Web)                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ NotificacionesController                            │ │
│ │ - Area: GestionAvicola                              │ │
│ │ - Index() → GET notificaciones del día              │ │
│ │ - MarcarTareaCompletada() → POST AJAX               │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Index.cshtml                                        │ │
│ │ - Vista Razor con 3 tablas (DataTables)            │ │
│ │ - JavaScript con SweetAlert2                        │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          ↓ MediatR
┌─────────────────────────────────────────────────────────┐
│ APPLICATION LAYER (ICARUS.Application)                  │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Queries                                             │ │
│ │ - GetTareasDelDiaQuery                              │ │
│ │ - GetTareasDelDiaQueryHandler                       │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Commands                                            │ │
│ │ - MarcarTareaCompletadaCommand                      │ │
│ │ - MarcarTareaCompletadaCommandHandler               │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ DTOs                                                │ │
│ │ - NotificacionResponseDto                           │ │
│ │ - TareaDelDiaDto (Vacunación)                       │ │
│ │ - TareaIluminacionDto                               │ │
│ │ - TareaAlimentacionDto                              │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          ↓ Repositorios
┌─────────────────────────────────────────────────────────┐
│ DOMAIN LAYER (ICARUS.Domain)                            │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Entities                                            │ │
│ │ - CronogramaVacunacion (+ métodos de negocio)       │ │
│ │ - CronogramaIluminacion                             │ │
│ │ - CronogramaAlimentacion                            │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Enums                                               │ │
│ │ - EstadoTarea (Pendiente=0, Completada=1)           │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          ↓ EF Core
┌─────────────────────────────────────────────────────────┐
│ INFRASTRUCTURE LAYER (ICARUS.Infrastructure)            │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Repositories                                        │ │
│ │ - ICronogramaVacunacionRepository                   │ │
│ │ - ICronogramaIluminacionRepository                  │ │
│ │ - ICronogramaAlimentacionRepository                 │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          ↓
                    SQL Server
```

### 🔗 Navegación de Relaciones

```
CronogramaVacunacion/Iluminacion/Alimentacion
    ↓
ProgramaVacunacion
    ↓
Galpones (ICollection<Galpon>)
    ↓
GestorAvicola
    ↓
ClienteId
```

**Importante**: Todas las consultas filtran por `ClienteId` navegando esta cadena de relaciones para garantizar seguridad.

---

## 🗃️ Entidades y Modelos

### 1️⃣ CronogramaVacunacion (Domain)

**Ubicación**: `ICARUS.Domain/Entities/GestionAvicola/CronogramaVacunacion.cs`

```csharp
public class CronogramaVacunacion : BaseEntity
{
    // Propiedades
    public int ProgramaVacunacionId { get; set; }
    public DateTime? Fecha { get; set; }
    public int? EdadDia { get; set; }
    public string? Vacuna { get; set; }
    public string? ModoAplicacion { get; set; }
    public string? Observaciones { get; set; }
    public DateTime? FechaCompletada { get; set; }      // NULL = Pendiente
    public string? CompletadaPor { get; set; }
    public EstadoTarea EstadoTarea { get; set; }        // Pendiente=0, Completada=1
    
    // Navegación
    public virtual ProgramaVacunacion? ProgramaVacunacion { get; set; }
    
    // Métodos de Negocio
    public void MarcarComoCompletada(string? completadaPor)
    public void MarcarComoPendiente()
    public bool EstaCompletada()
    public bool EstaPendiente()
    public bool DebeNotificarse(DateTime fechaConsulta)
}
```

#### 📊 Lógica de Notificación (Vacunación)

Una tarea se notifica cuando:
```csharp
EstadoTarea == Pendiente 
AND Fecha.Date <= fechaConsulta.Date
```

- ✅ Incluye tareas **del día actual**
- ✅ Incluye tareas **atrasadas** (fechas pasadas sin completar)
- ❌ **NO** incluye tareas futuras
- ❌ **NO** incluye tareas completadas

#### 🔄 Estados de Tarea

| Estado | Valor | Condición | Acción |
|--------|-------|-----------|--------|
| **Pendiente** | 0 | `FechaCompletada == null` | Se muestra en notificaciones |
| **Completada** | 1 | `FechaCompletada != null` | No se muestra en notificaciones |

#### 🎯 Método: `MarcarComoCompletada()`

```csharp
public void MarcarComoCompletada(string? completadaPor = null)
{
    if (EstaCompletada()) return; // Ya completada
    
    if (string.IsNullOrWhiteSpace(Vacuna))
        throw new InvalidOperationException("No se puede completar sin vacuna");
    
    FechaCompletada = DateTime.UtcNow;
    CompletadaPor = completadaPor;
    EstadoTarea = EstadoTarea.Completada;
    FechaModificacion = DateTime.UtcNow;
}
```

---

### 2️⃣ CronogramaIluminacion (Domain)

**Ubicación**: `ICARUS.Domain/Entities/GestionAvicola/CronogramaIluminacion.cs`

```csharp
public class CronogramaIluminacion : BaseEntity
{
    // Propiedades
    public int ProgramaVacunacionId { get; set; }
    public DateTime? Desde { get; set; }                // Fecha inicio período
    public DateTime? Hasta { get; set; }                // Fecha fin período
    public TimeSpan? HoraOscuridadDesde { get; set; }  // Ej: 22:00
    public TimeSpan? HoraOscuridadHasta { get; set; }  // Ej: 06:00
    public string? Observaciones { get; set; }
    
    // Navegación
    public virtual ProgramaVacunacion? ProgramaVacunacion { get; set; }
    
    // Métodos de Negocio
    public bool EstaActivoEnFecha(DateTime fecha)
    public TimeSpan? CalcularDuracionOscuridad()
    public bool ValidarRangoFechas()
}
```

#### 📊 Lógica de Notificación (Iluminación)

Un cronograma se notifica cuando:
```csharp
EstaActivo == true 
AND fecha >= Desde.Date 
AND fecha <= Hasta.Date
```

**Diferencia clave**: Son **cronogramas activos continuos**, no tareas puntuales.

#### 💡 Cálculo de Duración de Oscuridad

```csharp
public TimeSpan? CalcularDuracionOscuridad()
{
    if (!HoraOscuridadDesde.HasValue || !HoraOscuridadHasta.HasValue)
        return null;
    
    TimeSpan inicio = HoraOscuridadDesde.Value;
    TimeSpan fin = HoraOscuridadHasta.Value;
    
    // Si cruza medianoche (ej: 22:00 a 06:00)
    if (fin < inicio)
        return (TimeSpan.FromDays(1) - inicio) + fin;
    
    // Horario normal
    return fin - inicio;
}
```

---

### 3️⃣ CronogramaAlimentacion (Domain)

**Ubicación**: `ICARUS.Domain/Entities/GestionAvicola/CronogramaAlimentacion.cs`

```csharp
public class CronogramaAlimentacion : BaseEntity
{
    // Propiedades
    public int ProgramaVacunacionId { get; set; }
    public string? TipoAlimento { get; set; }      // Ej: "SJ PRE", "SJ 1"
    public DateTime? FechaInicio { get; set; }
    public DateTime? FechaCambio { get; set; }     // Fin del período
    public string? Observaciones { get; set; }
    
    // Navegación
    public virtual ProgramaVacunacion? ProgramaVacunacion { get; set; }
    
    // Métodos de Negocio
    public bool EstaActivoEnFecha(DateTime fecha)
    public int? CalcularDuracionDias()
}
```

#### 📊 Lógica de Notificación (Alimentación)

Un cronograma se notifica cuando:
```csharp
EstaActivo == true 
AND fecha >= FechaInicio.Date 
AND fecha <= FechaCambio.Date
```

Similar a iluminación, son **cronogramas activos continuos**.

#### 📅 Cálculo de Duración

```csharp
public int? CalcularDuracionDias()
{
    if (!FechaInicio.HasValue || !FechaCambio.HasValue)
        return null;
    
    TimeSpan diferencia = FechaCambio.Value.Date - FechaInicio.Value.Date;
    return (int)diferencia.TotalDays + 1; // +1 incluye ambos días
}
```

---

## 📦 DTOs (Data Transfer Objects)

### NotificacionResponseDto

**Ubicación**: `ICARUS.Application/Features/GestionAvicola/Notificaciones/DTOs/NotificacionResponseDto.cs`

```csharp
public class NotificacionResponseDto
{
    public List<TareaDelDiaDto> TareasDelDia { get; set; } = new();
    public List<TareaIluminacionDto> TareasIluminacion { get; set; } = new();
    public List<TareaAlimentacionDto> TareasAlimentacion { get; set; } = new();
    public int TotalTareas => TareasDelDia.Count + TareasIluminacion.Count + TareasAlimentacion.Count;
    public DateTime FechaConsulta { get; set; }
    public int ClienteId { get; set; }
    public bool TieneAccesoModulo { get; set; }
    public string Mensaje { get; set; } = string.Empty;
}
```

**Uso**: Respuesta principal del endpoint de notificaciones del día.

---

### TareaDelDiaDto (Vacunación)

**Ubicación**: `ICARUS.Application/Features/GestionAvicola/Notificaciones/DTOs/TareaDelDiaDto.cs`

```csharp
public class TareaDelDiaDto
{
    public int Id { get; set; }                       // CronogramaVacunacionId
    public int ProgramaVacunacionId { get; set; }
    public DateTime Fecha { get; set; }
    public int EdadDia { get; set; }
    public string Vacuna { get; set; } = string.Empty;
    public string ModoAplicacion { get; set; } = string.Empty;
    public string Observaciones { get; set; } = string.Empty;
    public int ClienteId { get; set; }
    public string NombreGranja { get; set; } = string.Empty;
    public string NombreGalpon { get; set; } = string.Empty;  // Expandido por galpón
}
```

**Importante**: Un `CronogramaVacunacion` puede generar **múltiples** `TareaDelDiaDto` (uno por cada galpón del programa).

---

### TareaIluminacionDto

**Ubicación**: `ICARUS.Application/DTOs/GestionAvicola/Notificaciones/TareaIluminacionDto.cs`

```csharp
public class TareaIluminacionDto
{
    public int Id { get; set; }
    public int ClienteId { get; set; }
    public string NombreGranja { get; set; } = string.Empty;
    public string NombreGalpon { get; set; } = string.Empty;
    public TimeSpan? HoraOscuridadDesde { get; set; }
    public TimeSpan? HoraOscuridadHasta { get; set; }
    public DateTime? FechaDesde { get; set; }
    public DateTime? FechaHasta { get; set; }
    public string? Observaciones { get; set; }
}
```

---

### TareaAlimentacionDto

**Ubicación**: `ICARUS.Application/DTOs/GestionAvicola/Notificaciones/TareaAlimentacionDto.cs`

```csharp
public class TareaAlimentacionDto
{
    public int Id { get; set; }
    public int ClienteId { get; set; }
    public string NombreGranja { get; set; } = string.Empty;
    public string NombreGalpon { get; set; } = string.Empty;
    public string TipoAlimento { get; set; } = string.Empty;
    public DateTime? FechaInicio { get; set; }
    public DateTime? FechaCambio { get; set; }
    public string? Observaciones { get; set; }
    public int? DuracionDias { get; set; }
}
```

---

## 🔄 Flujo Operacional

### 1️⃣ Consulta de Notificaciones del Día

```
┌─────────────────────────────────────────────────────────┐
│ 1. Usuario accede a /GestionAvicola/Notificaciones      │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 2. NotificacionesController.Index()                     │
│    - Obtiene usuario autenticado (IdentityUser)         │
│    - Obtiene ClienteId del usuario                      │
│    - Crea GetTareasDelDiaQuery(clienteId, DateTime.Today)│
└─────────────────────────────────────────────────────────┘
                         ↓ MediatR
┌─────────────────────────────────────────────────────────┐
│ 3. GetTareasDelDiaQueryHandler.Handle()                 │
│    ┌───────────────────────────────────────────────┐   │
│    │ A. ObtenerCronogramasDelDiaAsync()            │   │
│    │    - Repositorio: GetTareasPendientesHastaFecha│   │
│    │    - Filtra por ClienteId (navegación)        │   │
│    └───────────────────────────────────────────────┘   │
│    ┌───────────────────────────────────────────────┐   │
│    │ B. ObtenerIluminacionDelDiaAsync()            │   │
│    │    - Repositorio: GetByFechaAsync()           │   │
│    │    - Filtra por ClienteId                     │   │
│    └───────────────────────────────────────────────┘   │
│    ┌───────────────────────────────────────────────┐   │
│    │ C. ObtenerAlimentacionDelDiaAsync()           │   │
│    │    - Repositorio: GetByFechaAsync()           │   │
│    │    - Filtra por ClienteId                     │   │
│    └───────────────────────────────────────────────┘   │
│    ┌───────────────────────────────────────────────┐   │
│    │ D. CrearRespuestaNotificacion()               │   │
│    │    - Expande tareas por galpón (Vacunación)   │   │
│    │    - Mapea entidades → DTOs (AutoMapper)      │   │
│    └───────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Vista Index.cshtml renderiza 3 tablas               │
│    - Tabla Vacunación (azul) con DataTable             │
│    - Tabla Iluminación (naranja) con DataTable         │
│    - Tabla Alimentación (verde) con DataTable          │
└─────────────────────────────────────────────────────────┘
```

#### 📝 Código del Controller

```csharp
[HttpGet]
public async Task<IActionResult> Index()
{
    _logger.Info("NotificacionesController.Index - Iniciando consulta");
    
    IdentityUser? currentUser = await _userManager.GetUserAsync(User);
    if (currentUser == null)
    {
        TempData["Error"] = "Usuario no autenticado";
        return RedirectToAction("DashboardAvicola", "GestorAvicola");
    }
    
    int clienteId = await ObtenerClienteIdDelUsuarioAsync(currentUser);
    if (clienteId <= 0)
    {
        TempData["Error"] = "No se pudo identificar el cliente";
        return RedirectToAction("DashboardAvicola", "GestorAvicola");
    }
    
    GetTareasDelDiaQuery query = new GetTareasDelDiaQuery(clienteId)
    {
        FechaConsulta = DateTime.Today,
        IncluirTareasSinVacuna = true,
        IncluirDetallesPrograma = false
    };
    
    Result<NotificacionResponseDto> resultado = await _mediator.Send(query);
    
    if (resultado.IsSuccess && resultado.Data != null)
    {
        if (resultado.Data.TotalTareas > 0)
            TempData["Success"] = $"Tienes {resultado.Data.TotalTareas} tareas para hoy";
        else
            TempData["Info"] = "No tienes tareas para el día de hoy";
        
        return View(resultado.Data);
    }
    
    TempData["Error"] = resultado.ErrorMessage ?? "Error al obtener notificaciones";
    return RedirectToAction("DashboardAvicola", "GestorAvicola");
}
```

---

### 2️⃣ Marcar Tarea como Completada (AJAX)

```
┌─────────────────────────────────────────────────────────┐
│ 1. Usuario hace clic en "Completar" (botón verde)       │
│    - JavaScript: confirmarCompletarTarea(cronogramaId)  │
│    - SweetAlert: Confirmación del usuario               │
└─────────────────────────────────────────────────────────┘
                         ↓ AJAX POST
┌─────────────────────────────────────────────────────────┐
│ 2. NotificacionesController.MarcarTareaCompletada(id)  │
│    [HttpPost] [ValidateAntiForgeryToken]                │
│    - Validación: cronogramaId > 0                       │
│    - Validación: usuario autenticado                    │
│    - Crea MarcarTareaCompletadaCommand(id, userName)    │
└─────────────────────────────────────────────────────────┘
                         ↓ MediatR
┌─────────────────────────────────────────────────────────┐
│ 3. MarcarTareaCompletadaCommandHandler.Handle()        │
│    ┌───────────────────────────────────────────────┐   │
│    │ A. Obtiene CronogramaVacunacion por ID        │   │
│    │    - Validación: existe                       │   │
│    │    - Validación: está activo                  │   │
│    │    - Validación: NO está completada           │   │
│    └───────────────────────────────────────────────┘   │
│    ┌───────────────────────────────────────────────┐   │
│    │ B. cronograma.MarcarComoCompletada(userName)  │   │
│    │    - FechaCompletada = DateTime.UtcNow        │   │
│    │    - EstadoTarea = Completada                 │   │
│    │    - CompletadaPor = userName                 │   │
│    └───────────────────────────────────────────────┘   │
│    ┌───────────────────────────────────────────────┐   │
│    │ C. UpdateAsync() + SaveChangesAsync()         │   │
│    └───────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                         ↓ JSON Response
┌─────────────────────────────────────────────────────────┐
│ 4. JavaScript recibe respuesta                          │
│    { success: true, message: "..." }                    │
│    - SweetAlert: Éxito                                  │
│    - location.reload(): Recarga la página               │
└─────────────────────────────────────────────────────────┘
```

#### 📝 Código del Controller

```csharp
[HttpPost]
[ValidateAntiForgeryToken]
public async Task<IActionResult> MarcarTareaCompletada(int cronogramaId)
{
    _logger.Info($"NotificacionesController.MarcarTareaCompletada - ID: {cronogramaId}");
    
    if (cronogramaId <= 0)
    {
        return Json(new { success = false, message = $"ID inválido: {cronogramaId}" });
    }
    
    IdentityUser user = await _userManager.GetUserAsync(User);
    if (user == null)
    {
        return Json(new { success = false, message = "Usuario no autenticado" });
    }
    
    MarcarTareaCompletadaCommand command = new MarcarTareaCompletadaCommand(
        cronogramaId, 
        user.UserName ?? user.Email ?? "Usuario"
    );
    
    Result<bool> resultado = await _mediator.Send(command);
    
    if (!resultado.IsSuccess)
    {
        return Json(new { 
            success = false, 
            message = resultado.ErrorMessage ?? "Error al completar tarea" 
        });
    }
    
    _logger.Info($"NotificacionesController.MarcarTareaCompletada - Completada ID: {cronogramaId}");
    return Json(new { 
        success = true, 
        message = "Tarea marcada como completada exitosamente" 
    });
}
```

#### 📝 Código JavaScript (Vista)

```javascript
function confirmarCompletarTarea(cronogramaId) {
    if (!cronogramaId || cronogramaId <= 0) {
        Swal.fire({
            icon: 'error',
            title: 'Error de validación',
            text: 'ID de cronograma inválido'
        });
        return;
    }

    Swal.fire({
        title: '¿Confirmar completar tarea?',
        text: 'Esta acción no se puede deshacer.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, completar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            completarTarea(cronogramaId);
        }
    });
}

function completarTarea(cronogramaId) {
    Swal.fire({
        title: 'Procesando...',
        text: 'Marcando tarea como completada',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });

    var token = $('input[name="__RequestVerificationToken"]').val();
    
    $.post('/GestionAvicola/Notificaciones/MarcarTareaCompletada', {
        cronogramaId: cronogramaId,
        __RequestVerificationToken: token
    })
    .done(function(response) {
        if (response && response.success) {
            Swal.fire({
                icon: 'success',
                title: 'Tarea completada',
                text: response.message,
                timer: 2000
            }).then(() => {
                location.reload();
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: response.message
            });
        }
    })
    .fail(function(xhr) {
        Swal.fire({
            icon: 'error',
            title: 'Error del servidor',
            text: xhr.responseJSON?.message || 'Error de comunicación'
        });
    });
}
```

---

## 🌐 Endpoints API (Diseño)

### Especificaciones Generales

- **Base URL**: `/api/notificaciones`
- **Autenticación**: JWT Bearer Token (obligatorio)
- **Formato Response**: JSON con wrapper estándar
- **Filtrado**: Automático por `ClienteId` del usuario autenticado

#### Response Wrapper

```csharp
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }
}
```

---

### 📍 1. GET /api/notificaciones/dia

**Descripción**: Obtiene todas las notificaciones del día para el usuario autenticado.

**Headers**:
```
Authorization: Bearer {jwt_token}
```

**Query Parameters**:
- `fecha` (opcional): `DateTime`, default = hoy

**Response 200 OK**:
```json
{
  "success": true,
  "message": "Notificaciones obtenidas exitosamente",
  "data": {
    "tareasDelDia": [
      {
        "id": 123,
        "programaVacunacionId": 45,
        "fecha": "2025-10-28T08:00:00Z",
        "edadDia": 14,
        "vacuna": "Newcastle B1",
        "modoAplicacion": "Ocular, 1 gota por ave",
        "observaciones": "Aplicar en ayunas",
        "nombreGranja": "Granja San José",
        "nombreGalpon": "Galpón A1"
      }
    ],
    "tareasIluminacion": [
      {
        "id": 67,
        "nombreGranja": "Granja San José",
        "nombreGalpon": "Galpón B2",
        "horaOscuridadDesde": "22:00:00",
        "horaOscuridadHasta": "06:00:00",
        "fechaDesde": "2025-10-20",
        "fechaHasta": "2025-11-15"
      }
    ],
    "tareasAlimentacion": [
      {
        "id": 89,
        "nombreGranja": "Granja San José",
        "nombreGalpon": "Galpón C1",
        "tipoAlimento": "SJ PRE",
        "fechaInicio": "2025-10-25",
        "fechaCambio": "2025-11-10",
        "duracionDias": 16
      }
    ],
    "totalTareas": 3,
    "fechaConsulta": "2025-10-28",
    "mensaje": "Se encontraron 3 tareas programadas para hoy"
  }
}
```

---

### 📍 2. GET /api/notificaciones/vacunacion/{id}

**Descripción**: Obtiene detalles completos de una tarea de vacunación.

**Headers**:
```
Authorization: Bearer {jwt_token}
```

**Path Parameters**:
- `id` (required): `int` - ID del cronograma de vacunación

**Response 200 OK**:
```json
{
  "success": true,
  "message": "Tarea obtenida exitosamente",
  "data": {
    "id": 123,
    "programaVacunacionId": 45,
    "fecha": "2025-10-28T08:00:00Z",
    "edadDia": 14,
    "vacuna": "Newcastle B1",
    "modoAplicacion": "Ocular, 1 gota por ave",
    "observaciones": "Aplicar en ayunas",
    "nombreGranja": "Granja San José",
    "nombreGalpon": "Galpón A1",
    "fechaCompletada": null,
    "completadaPor": null,
    "estadoTarea": "pendiente"
  }
}
```

**Response 404 Not Found**:
```json
{
  "success": false,
  "message": "Tarea no encontrada o no pertenece al cliente",
  "data": null
}
```

---

### 📍 3. POST /api/notificaciones/vacunacion/{id}/completar

**Descripción**: Marca una tarea de vacunación como completada.

**Headers**:
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Path Parameters**:
- `id` (required): `int` - ID del cronograma

**Request Body** (opcional):
```json
{
  "observaciones": "Aplicación realizada sin novedades"
}
```

**Response 200 OK**:
```json
{
  "success": true,
  "message": "Tarea marcada como completada exitosamente",
  "data": {
    "id": 123,
    "fechaCompletada": "2025-10-28T10:30:45Z",
    "completadaPor": "usuario@example.com"
  }
}
```

**Response 400 Bad Request**:
```json
{
  "success": false,
  "message": "La tarea del cronograma 123 ya está completada",
  "data": null
}
```

---

### 📍 4. POST /api/notificaciones/vacunacion/{id}/revertir

**Descripción**: Revierte una tarea completada a estado pendiente.

**Headers**:
```
Authorization: Bearer {jwt_token}
```

**Path Parameters**:
- `id` (required): `int` - ID del cronograma

**Response 200 OK**:
```json
{
  "success": true,
  "message": "Tarea revertida a estado pendiente exitosamente",
  "data": null
}
```

---

### 📍 5. GET /api/notificaciones/vacunacion/pendientes

**Descripción**: Lista todas las tareas de vacunación pendientes (incluye atrasadas).

**Headers**:
```
Authorization: Bearer {jwt_token}
```

**Query Parameters**:
- `fechaHasta` (opcional): `DateTime`, default = hoy
- `soloAtrasadas` (opcional): `bool`, default = false
- `granjaId` (opcional): `int`, filtra por granja
- `galponId` (opcional): `int`, filtra por galpón

**Response 200 OK**:
```json
{
  "success": true,
  "message": "Tareas pendientes obtenidas exitosamente",
  "data": [
    {
      "id": 123,
      "fecha": "2025-10-28T08:00:00Z",
      "vacuna": "Newcastle B1",
      "nombreGranja": "Granja San José",
      "nombreGalpon": "Galpón A1",
      "diasRetraso": 0,
      "estado": "pendiente"
    },
    {
      "id": 120,
      "fecha": "2025-10-25T08:00:00Z",
      "vacuna": "Gumboro",
      "nombreGranja": "Granja San José",
      "nombreGalpon": "Galpón B2",
      "diasRetraso": 3,
      "estado": "atrasada"
    }
  ],
  "total": 2
}
```

---

### 📍 6. GET /api/notificaciones/resumen

**Descripción**: Obtiene un resumen estadístico de todas las notificaciones.

**Headers**:
```
Authorization: Bearer {jwt_token}
```

**Query Parameters**:
- `fecha` (opcional): `DateTime`, default = hoy

**Response 200 OK**:
```json
{
  "success": true,
  "message": "Resumen obtenido exitosamente",
  "data": {
    "fecha": "2025-10-28",
    "totales": {
      "vacunacion": {
        "pendientes": 5,
        "atrasadas": 2,
        "completadasHoy": 3
      },
      "iluminacion": {
        "cronogramasActivos": 4
      },
      "alimentacion": {
        "cronogramasActivos": 3
      }
    },
    "totalTareas": 12,
    "alertas": [
      "Tienes 2 tareas de vacunación atrasadas"
    ]
  }
}
```

---

## 🔒 Seguridad y Validaciones

### Autenticación y Autorización

#### Web (MVC)
```csharp
[Authorize]  // Atributo obligatorio
[Area("GestionAvicola")]
public class NotificacionesController : Controller
```

#### API (JWT)
```csharp
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
[ApiController]
[Route("api/notificaciones")]
public class NotificacionesApiController : ControllerBase
```

### Filtrado por Cliente

**Regla de Oro**: Solo datos del `ClienteId` del usuario autenticado.

```csharp
// Obtener ClienteId del usuario JWT
var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
var clienteId = await ObtenerClienteIdPorUserId(userId);

// Filtrar cronogramas por cliente (navegación compleja)
var cronogramas = await _repository.GetTareasPendientesHastaFechaAsync(fecha);
var filtrados = cronogramas
    .Where(c => c.ProgramaVacunacion?.Galpones
        ?.Any(g => g.GestorAvicola?.ClienteId == clienteId) == true)
    .ToList();
```

### Validaciones Defensivas

✅ **SIEMPRE validar**:
- IDs > 0
- Usuario autenticado
- Pertenencia al cliente
- Estado de entidad
- Referencias nulas

❌ **NUNCA usar Try-Catch**: Usar validaciones preventivas

```csharp
// ✅ CORRECTO
if (cronogramaId <= 0)
{
    _logger.Error($"ID inválido: {cronogramaId}");
    return Result.Failure("ID inválido");
}

// ❌ INCORRECTO
try {
    var cronograma = await _repository.GetByIdAsync(cronogramaId);
}
catch (Exception ex) {
    return Result.Failure(ex.Message);
}
```

### Logging con log4net

**Formato obligatorio**: `NombreClase.NombreMetodo - Mensaje`

```csharp
_logger.Info("NotificacionesController.Index - Iniciando consulta");
_logger.Warn($"NotificacionesController.Index - ID inválido: {id}");
_logger.Error("NotificacionesController.Index - Error crítico", exception);
```

---

## 🎨 Presentación (Vista Web)

### Ubicación

- **Vista**: `ICARUS.Web/Areas/GestionAvicola/Views/Notificaciones/Index.cshtml`
- **Controller**: `ICARUS.Web/Areas/GestionAvicola/Controllers/NotificacionesController.cs`

### Características Visuales

#### 🎨 Tablas con Colores Temáticos

| Tipo | Color Principal | Clase CSS |
|------|----------------|-----------|
| **Vacunación** | Azul (#3498db) | `.vacunacion-table` |
| **Iluminación** | Naranja (#f39c12) | `.iluminacion-table` |
| **Alimentación** | Verde (#27ae60) | `.alimentacion-table` |

#### 🏷️ Badges de Estado (Vacunación)

```html
<!-- Hoy -->
<span class="badge bg-icarus-warning">
    <i class="fas fa-clock me-1"></i> Hoy
</span>

<!-- Atrasada -->
<span class="badge bg-icarus-danger">
    <i class="fas fa-exclamation-triangle me-1"></i> Atrasada
</span>

<!-- Programada -->
<span class="badge bg-icarus-success">
    <i class="fas fa-check-circle me-1"></i> Programada
</span>
```

#### 📊 DataTables

Todas las tablas usan DataTables con:
- ✅ Paginación (10 registros por página)
- ✅ Búsqueda global
- ✅ Ordenamiento por columnas
- ✅ Internacionalización en español

```javascript
ICARUS.DataTables.init('#vacunacionTable', {
    pageLength: 10,
    order: [[2, 'asc']], // Ordenar por fecha
    columnDefs: [
        { targets: [6], orderable: false } // Acciones no ordenables
    ]
});
```

#### 🔘 Botones de Acción

```html
<div class="btn-group" role="group">
    <button type="button" class="btn btn-sm btn-icarus-outline" 
            onclick="handleVacunacionAction('details', '@tarea.Id')">
        <i class="fas fa-eye"></i>
    </button>
    <button type="button" class="btn btn-sm btn-icarus-success" 
            onclick="handleVacunacionAction('complete', '@tarea.Id')">
        <i class="fas fa-check"></i>
    </button>
    <button type="button" class="btn btn-sm btn-icarus-warning" 
            onclick="handleVacunacionAction('reschedule', '@tarea.Id')">
        <i class="fas fa-calendar-plus"></i>
    </button>
</div>
```

#### 📭 Estado Vacío

```html
<div class="text-center py-5">
    <i class="fas fa-bell-slash fa-3x text-icarus-muted mb-3"></i>
    <h5 class="text-icarus-muted">
        ¡Excelente! No tienes tareas programadas para hoy
    </h5>
    <p class="text-icarus-muted">
        Puedes revisar las próximas tareas o gestionar cronogramas.
    </p>
    <a asp-action="DashboardAvicola" class="btn btn-icarus">
        <i class="fas fa-tachometer-alt me-1"></i> Ir al Dashboard
    </a>
</div>
```

---

## 📚 Referencias Rápidas

### 🗂️ Archivos Clave

| Tipo | Ubicación |
|------|-----------|
| **Controller Web** | `ICARUS.Web/Areas/GestionAvicola/Controllers/NotificacionesController.cs` |
| **Vista Razor** | `ICARUS.Web/Areas/GestionAvicola/Views/Notificaciones/Index.cshtml` |
| **Query** | `ICARUS.Application/Features/GestionAvicola/Notificaciones/Queries/GetTareasDelDiaQuery.cs` |
| **Query Handler** | `ICARUS.Application/Features/GestionAvicola/Notificaciones/Handlers/GetTareasDelDiaQueryHandler.cs` |
| **Command** | `ICARUS.Application/Commands/GestionAvicola/CronogramaVacunacion/MarcarTareaCompletadaCommand.cs` |
| **Command Handler** | `ICARUS.Application/Handlers/GestionAvicola/CronogramaVacunacion/MarcarTareaCompletadaCommandHandler.cs` |
| **DTOs** | `ICARUS.Application/Features/GestionAvicola/Notificaciones/DTOs/` |
| **Entidad Vacunación** | `ICARUS.Domain/Entities/GestionAvicola/CronogramaVacunacion.cs` |
| **Entidad Iluminación** | `ICARUS.Domain/Entities/GestionAvicola/CronogramaIluminacion.cs` |
| **Entidad Alimentación** | `ICARUS.Domain/Entities/GestionAvicola/CronogramaAlimentacion.cs` |
| **Enum Estado** | `ICARUS.Domain/Enums/EstadoTarea.cs` |

### 📋 Métodos Importantes

#### CronogramaVacunacion
```csharp
void MarcarComoCompletada(string? completadaPor)
void MarcarComoPendiente()
bool EstaCompletada()
bool EstaPendiente()
bool DebeNotificarse(DateTime fechaConsulta)
```

#### CronogramaIluminacion
```csharp
bool EstaActivoEnFecha(DateTime fecha)
TimeSpan? CalcularDuracionOscuridad()
```

#### CronogramaAlimentacion
```csharp
bool EstaActivoEnFecha(DateTime fecha)
int? CalcularDuracionDias()
```

### 🔍 Repositorios

```csharp
// Vacunación
Task<IEnumerable<CronogramaVacunacion>> GetTareasPendientesHastaFechaAsync(DateTime fecha);

// Iluminación
Task<List<CronogramaIluminacion>> GetByFechaAsync(DateTime fecha);

// Alimentación
Task<List<CronogramaAlimentacion>> GetByFechaAsync(DateTime fecha);
```

### 🎯 Estados y Constantes

```csharp
public enum EstadoTarea
{
    Pendiente = 0,
    Completada = 1
}
```

### 🌐 URLs Web

| Acción | Método | URL |
|--------|--------|-----|
| Ver Notificaciones | GET | `/GestionAvicola/Notificaciones/Index` |
| Completar Tarea | POST | `/GestionAvicola/Notificaciones/MarcarTareaCompletada` |

### 🔌 URLs API (Propuestas)

| Acción | Método | URL |
|--------|--------|-----|
| Notificaciones del Día | GET | `/api/notificaciones/dia` |
| Detalle Vacunación | GET | `/api/notificaciones/vacunacion/{id}` |
| Completar Vacunación | POST | `/api/notificaciones/vacunacion/{id}/completar` |
| Revertir Vacunación | POST | `/api/notificaciones/vacunacion/{id}/revertir` |
| Pendientes | GET | `/api/notificaciones/vacunacion/pendientes` |
| Resumen | GET | `/api/notificaciones/resumen` |

---

## 📝 Notas Finales

### ✅ Buenas Prácticas Implementadas

- ✔️ **Clean Architecture**: Separación de capas claramente definida
- ✔️ **CQRS con MediatR**: Queries y Commands separados
- ✔️ **Programación Defensiva**: Validaciones previas sin Try-Catch
- ✔️ **Logging Extensivo**: log4net en cada operación crítica
- ✔️ **AutoMapper**: Mapeo automático Entidad ↔ DTO
- ✔️ **Seguridad por Cliente**: Filtrado automático por navegación
- ✔️ **Null Safety**: Tipos nullable habilitados, validaciones constantes
- ✔️ **Principio de Responsabilidad Única**: Cada handler una sola tarea

### 🚀 Próximos Pasos (Implementación API)

1. Crear `NotificacionesApiController` en `ICARUS.API/Controllers/`
2. Implementar endpoints RESTful según diseño
3. Configurar autenticación JWT
4. Crear DTOs específicos para API (si necesarios)
5. Implementar tests unitarios
6. Documentar con Swagger/OpenAPI
7. Configurar rate limiting y throttling

### 📞 Soporte

Para dudas sobre el sistema de notificaciones, consultar:
- Este documento de referencia
- Código fuente en los archivos listados en "Referencias Rápidas"
- Logs de aplicación en carpeta `Logs/`

---

**Documento generado**: Octubre 2025  
**Versión**: 1.0  
**Mantenedor**: Equipo de Desarrollo ICARUS
