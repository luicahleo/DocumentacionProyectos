# 🔔 SISTEMA DE NOTIFICACIONES - API MOBILE

> **Documento de Referencia Técnica**  
> **Fecha:** Octubre 2025  
> **Versión:** 1.0  
> **Controller:** `NotificacionesMobileController.cs`

---

## 📑 Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Endpoints API](#endpoints-api)
4. [Modelos y DTOs](#modelos-y-dtos)
5. [Seguridad y Autenticación](#seguridad-y-autenticación)
6. [Flujos de Operación](#flujos-de-operación)
7. [Tipos de Tareas](#tipos-de-tareas)
8. [Queries y Commands CQRS](#queries-y-commands-cqrs)
9. [Ejemplos de Requests](#ejemplos-de-requests)
10. [Referencias Rápidas](#referencias-rápidas)

---

## 🎯 Resumen Ejecutivo

El **Sistema de Notificaciones Mobile** permite a los trabajadores autenticados consultar las tareas programadas del día y marcarlas como completadas desde la aplicación móvil ICARUS_MOBILE.

### 🔑 Características Principales

| Característica | Descripción |
|----------------|-------------|
| **Autenticación** | JWT Token con rol "Trabajador" |
| **Multi-tenant** | Filtrado automático por `ClienteId` del trabajador |
| **3 Tipos de Tareas** | Vacunación, Iluminación, Alimentación |
| **Tiempo Real** | Tareas del día actual automáticamente |
| **Auditoría** | Registro de quién completó cada tarea |
| **Sincronización** | Usa mismas Queries/Commands que sistema web |

### ⚡ Flujo Principal

```
Trabajador se autentica → Recibe JWT con ClienteId
                                ↓
Consulta tareas del día (GET /dia)
                                ↓
Ve lista de tareas: Vacunación, Iluminación, Alimentación
                                ↓
Completa tarea (POST /{id}/completar)
                                ↓
Sistema registra: Trabajador_X completó a las HH:MM
```

---

## 📐 Arquitectura del Sistema

### Diagrama de Capas

```
┌─────────────────────────────────────────────────────────┐
│ ICARUS_MOBILE (.NET MAUI)                               │
│ - ViewModel de notificaciones                           │
│ - Servicios HTTP                                        │
│ - UI de lista de tareas                                 │
└─────────────────────────────────────────────────────────┘
                         ↓ HTTP/JSON + JWT
┌─────────────────────────────────────────────────────────┐
│ ICARUS.API - NotificacionesMobileController             │
│ Route: /api/mobile/notificaciones                       │
│ [Authorize(Roles = "Trabajador")]                       │
│                                                         │
│ Endpoints:                                              │
│ - GET  /dia                   → Tareas del día          │
│ - POST /{id}/completar        → Marcar completada       │
│ - GET  /pendientes            → Tareas pendientes       │
└─────────────────────────────────────────────────────────┘
                         ↓ MediatR (CQRS)
┌─────────────────────────────────────────────────────────┐
│ ICARUS.Application - Queries & Commands                 │
│                                                         │
│ Query:                                                  │
│ - GetTareasDelDiaQuery (por ClienteId)                  │
│                                                         │
│ Command:                                                │
│ - MarcarTareaCompletadaCommand                          │
└─────────────────────────────────────────────────────────┘
                         ↓ Entity Framework
┌─────────────────────────────────────────────────────────┐
│ ICARUS.Infrastructure - SQL Server                      │
│ - CronogramaVacunacion                                  │
│ - CronogramaIluminacion                                 │
│ - CronogramaAlimentacion                                │
│ - ProgramaVacunacion                                    │
└─────────────────────────────────────────────────────────┘
```

### 🔄 Reutilización con Sistema Web

El sistema mobile **reutiliza** las mismas Queries y Commands que el sistema web:

| Componente | Ubicación | Uso |
|------------|-----------|-----|
| `GetTareasDelDiaQuery` | Application/Features/GestionAvicola/Notificaciones/Queries | ✅ Compartido |
| `MarcarTareaCompletadaCommand` | Application/Commands/GestionAvicola/CronogramaVacunacion | ✅ Compartido |
| `NotificacionResponseDto` | Application/Features/GestionAvicola/Notificaciones/DTOs | ✅ Compartido |

**Beneficio**: Garantiza consistencia entre web y mobile, misma lógica de negocio.

---

## 🌐 Endpoints API

### Base URL
```
/api/mobile/notificaciones
```

### 1️⃣ GET /dia - Obtener Tareas del Día

**Descripción**: Obtiene todas las tareas programadas para el día actual del cliente al que pertenece el trabajador autenticado.

**Autorización**: `[Authorize(Roles = "Trabajador")]`

**Request**:
```http
GET /api/mobile/notificaciones/dia
Authorization: Bearer {JWT_TOKEN}
```

**Response 200 OK**:
```json
{
  "tareasDelDia": [
    {
      "id": 15,
      "nombreTarea": "Vacunación Newcastle",
      "descripcion": "Aplicar vacuna Newcastle a gallinas de galpón 1",
      "fechaProgramada": "2025-10-28T09:00:00",
      "nombreVacuna": "Newcastle B1",
      "edadAplicacion": 45,
      "tipoAplicacion": "Ocular",
      "numeroGalpon": "G-001",
      "nombreGalpon": "Galpón Principal",
      "estaCompletada": false,
      "fechaCompletada": null,
      "completadaPor": null,
      "observaciones": "Aplicar en horario de la mañana",
      "requiereAtencionUrgente": false,
      "diasDesdeVencimiento": 0
    }
  ],
  "tareasIluminacion": [
    {
      "id": 8,
      "cronogramaId": 3,
      "horaInicio": "06:00:00",
      "horaFin": "20:00:00",
      "duracionHoras": 14,
      "intensidadLux": 25,
      "numeroGalpon": "G-001",
      "nombreGalpon": "Galpón Principal",
      "estaCompletada": false,
      "fechaCompletada": null,
      "completadaPor": null,
      "observaciones": "Mantener intensidad constante",
      "estadoActual": "Pendiente"
    }
  ],
  "tareasAlimentacion": [
    {
      "id": 12,
      "cronogramaId": 5,
      "horaAlimentacion": "08:00:00",
      "cantidadKg": 450,
      "tipoAlimento": "Balanceado Postura",
      "numeroGalpon": "G-001",
      "nombreGalpon": "Galpón Principal",
      "estaCompletada": false,
      "fechaCompletada": null,
      "completadaPor": null,
      "observaciones": "Distribuir uniformemente",
      "estadoActual": "Pendiente"
    }
  ],
  "totalTareas": 3,
  "fechaConsulta": "2025-10-28T00:00:00",
  "clienteId": 3,
  "tieneAccesoModulo": true,
  "mensaje": ""
}
```

**Características**:
- ✅ Agrupa tareas por tipo (Vacunación, Iluminación, Alimentación)
- ✅ Solo tareas del día actual (`DateTime.Today`)
- ✅ Incluye detalles completos de cada tarea
- ✅ Filtra automáticamente por `ClienteId` del trabajador
- ✅ Si no hay tareas, retorna listas vacías (no error)

---

### 2️⃣ GET /pendientes - Obtener Tareas Pendientes

**Descripción**: Obtiene todas las tareas no completadas del cliente, ordenadas por fecha/hora de vencimiento.

**Autorización**: `[Authorize(Roles = "Trabajador")]`

**Request**:
```http
GET /api/mobile/notificaciones/pendientes
Authorization: Bearer {JWT_TOKEN}
```

**Response 200 OK**:
```json
{
  "tareasDelDia": [
    {
      "id": 13,
      "nombreTarea": "Vacunación Bronquitis",
      "fechaProgramada": "2025-10-27T14:00:00",
      "estaCompletada": false,
      "requiereAtencionUrgente": true,
      "diasDesdeVencimiento": 1
    },
    {
      "id": 15,
      "nombreTarea": "Vacunación Newcastle",
      "fechaProgramada": "2025-10-28T09:00:00",
      "estaCompletada": false,
      "requiereAtencionUrgente": false,
      "diasDesdeVencimiento": 0
    }
  ],
  "tareasIluminacion": [
    {
      "id": 8,
      "horaInicio": "06:00:00",
      "horaFin": "20:00:00",
      "estaCompletada": false
    }
  ],
  "tareasAlimentacion": [
    {
      "id": 12,
      "horaAlimentacion": "08:00:00",
      "cantidadKg": 450,
      "estaCompletada": false
    }
  ],
  "totalTareas": 4,
  "fechaConsulta": "2025-10-28T00:00:00",
  "clienteId": 3,
  "tieneAccesoModulo": true,
  "mensaje": "Tareas pendientes encontradas"
}
```

**Diferencias con GET /dia**:
- ✅ Solo tareas **no completadas** (`EstaCompletada = false`)
- ✅ Incluye tareas vencidas (fechas anteriores a hoy)
- ✅ Ordenadas por urgencia (vencidas primero)
- ✅ Marca tareas urgentes con `RequiereAtencionUrgente`

---

### 3️⃣ POST /{id}/completar - Marcar Tarea Completada

**Descripción**: Marca una tarea de vacunación como completada. Registra automáticamente el trabajador que la completó y la fecha/hora.

**Autorización**: `[Authorize(Roles = "Trabajador")]`

**Request**:
```http
POST /api/mobile/notificaciones/15/completar
Authorization: Bearer {JWT_TOKEN}
```

**Response 200 OK**:
```json
{
  "success": true,
  "message": "Tarea completada exitosamente",
  "tareaId": 15,
  "completadaPor": "Trabajador_5",
  "fechaCompletada": "2025-10-28T09:15:00"
}
```

**Response 404 Not Found** (tarea no existe):
```json
{
  "success": false,
  "message": "Tarea de vacunación no encontrada"
}
```

**Response 400 Bad Request** (tarea ya completada):
```json
{
  "success": false,
  "message": "La tarea ya fue completada anteriormente"
}
```

**Validaciones Automáticas**:
1. ✅ Verifica que el ID sea válido (> 0)
2. ✅ Extrae `TrabajadorId` del JWT automáticamente
3. ✅ Establece `CompletadaPor = "Trabajador_{TrabajadorId}"`
4. ✅ Establece `FechaCompletada = DateTime.Now`
5. ✅ Valida que la tarea pertenece al cliente del trabajador

---

## 📦 Modelos y DTOs

### NotificacionResponseDto

```csharp
public class NotificacionResponseDto
{
    // Tareas agrupadas por tipo
    public List<TareaDelDiaDto> TareasDelDia { get; set; } = new();
    public List<TareaIluminacionDto> TareasIluminacion { get; set; } = new();
    public List<TareaAlimentacionDto> TareasAlimentacion { get; set; } = new();
    
    // Metadata
    public int TotalTareas => TareasDelDia.Count + TareasIluminacion.Count + TareasAlimentacion.Count;
    public DateTime FechaConsulta { get; set; }
    public int ClienteId { get; set; }
    public bool TieneAccesoModulo { get; set; }
    public string Mensaje { get; set; } = string.Empty;
}
```

### TareaDelDiaDto (Vacunación)

```csharp
public class TareaDelDiaDto
{
    // Identificación
    public int Id { get; set; }
    public string NombreTarea { get; set; }
    public string Descripcion { get; set; }
    
    // Programación
    public DateTime FechaProgramada { get; set; }
    
    // Detalles de vacunación
    public string NombreVacuna { get; set; }
    public int EdadAplicacion { get; set; }
    public string TipoAplicacion { get; set; }  // Ocular, Agua, Subcutánea
    
    // Ubicación
    public string NumeroGalpon { get; set; }
    public string NombreGalpon { get; set; }
    
    // Estado
    public bool EstaCompletada { get; set; }
    public DateTime? FechaCompletada { get; set; }
    public string? CompletadaPor { get; set; }
    
    // Observaciones
    public string? Observaciones { get; set; }
    
    // Alertas
    public bool RequiereAtencionUrgente { get; set; }
    public int DiasDesdeVencimiento { get; set; }
}
```

### TareaIluminacionDto

```csharp
public class TareaIluminacionDto
{
    // Identificación
    public int Id { get; set; }
    public int CronogramaId { get; set; }
    
    // Horario
    public TimeSpan HoraInicio { get; set; }
    public TimeSpan HoraFin { get; set; }
    public decimal DuracionHoras { get; set; }
    
    // Intensidad
    public int IntensidadLux { get; set; }
    
    // Ubicación
    public string NumeroGalpon { get; set; }
    public string NombreGalpon { get; set; }
    
    // Estado
    public bool EstaCompletada { get; set; }
    public DateTime? FechaCompletada { get; set; }
    public string? CompletadaPor { get; set; }
    
    // Observaciones
    public string? Observaciones { get; set; }
    public string EstadoActual { get; set; }  // Pendiente, En Progreso, Completada
}
```

### TareaAlimentacionDto

```csharp
public class TareaAlimentacionDto
{
    // Identificación
    public int Id { get; set; }
    public int CronogramaId { get; set; }
    
    // Horario
    public TimeSpan HoraAlimentacion { get; set; }
    
    // Cantidad
    public decimal CantidadKg { get; set; }
    public string TipoAlimento { get; set; }
    
    // Ubicación
    public string NumeroGalpon { get; set; }
    public string NombreGalpon { get; set; }
    
    // Estado
    public bool EstaCompletada { get; set; }
    public DateTime? FechaCompletada { get; set; }
    public string? CompletadaPor { get; set; }
    
    // Observaciones
    public string? Observaciones { get; set; }
    public string EstadoActual { get; set; }
}
```

---

## 🔒 Seguridad y Autenticación

### Extracción de Claims del JWT

```csharp
private int? GetClienteIdFromToken()
{
    if (User == null) return null;
    
    string? clienteIdClaim = User.FindFirst("ClienteId")?.Value;
    
    if (string.IsNullOrWhiteSpace(clienteIdClaim)) return null;
    
    if (!int.TryParse(clienteIdClaim, out int clienteId)) return null;
    
    if (clienteId <= 0) return null;
    
    return clienteId;
}

private int? GetTrabajadorIdFromToken()
{
    if (User == null) return null;
    
    string? trabajadorIdClaim = User.FindFirst("TrabajadorId")?.Value;
    
    if (string.IsNullOrWhiteSpace(trabajadorIdClaim)) return null;
    
    if (!int.TryParse(trabajadorIdClaim, out int trabajadorId)) return null;
    
    if (trabajadorId <= 0) return null;
    
    return trabajadorId;
}
```

### Validaciones de Seguridad

#### 1. Filtrado Multi-Tenant Automático
```csharp
// Al consultar tareas del día
int? clienteId = GetClienteIdFromToken();
if (clienteId == null || clienteId <= 0)
{
    return Forbid("No se pudo determinar el cliente del trabajador");
}

GetTareasDelDiaQuery query = new GetTareasDelDiaQuery(clienteId.Value);
```

#### 2. Auditoría Automática al Completar
```csharp
// Al completar tarea
int? trabajadorId = GetTrabajadorIdFromToken();

MarcarTareaCompletadaCommand command = new()
{
    CronogramaVacunacionId = id,
    CompletadaPor = $"Trabajador_{trabajadorId}",
    FechaCompletada = DateTime.Now
};
```

#### 3. Sin Try-Catch - Validaciones Previas
```csharp
// Validación defensiva en cada paso
if (id <= 0)
{
    return BadRequest("ID de tarea inválido");
}

if (clienteId == null || clienteId <= 0)
{
    return Forbid("No se pudo determinar el cliente");
}

if (_mediator == null)
{
    return StatusCode(500, "Error interno del servidor");
}
```

---

## 🔄 Flujos de Operación

### Flujo Completo: Consultar y Completar Tarea

```
┌─────────────────────────────────────────────────────────┐
│ 1. Trabajador abre app y navega a Notificaciones        │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 2. App solicita tareas del día                          │
│    GET /api/mobile/notificaciones/dia                   │
│    Authorization: Bearer {JWT}                          │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Controller extrae ClienteId del JWT                  │
│    ClienteId = 3                                        │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Crea GetTareasDelDiaQuery                            │
│    - ClienteId: 3                                       │
│    - FechaConsulta: DateTime.Today                      │
│    - IncluirTareasSinVacuna: true                       │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 5. Handler ejecuta query                                │
│    A. Obtiene cronogramas de vacunación del día         │
│    B. Obtiene cronogramas de iluminación activos        │
│    C. Obtiene cronogramas de alimentación del día       │
│    D. Filtra solo los del ClienteId = 3                 │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 6. Retorna NotificacionResponseDto                      │
│    - 1 tarea de vacunación (Newcastle)                  │
│    - 1 tarea de iluminación (06:00-20:00)               │
│    - 1 tarea de alimentación (08:00, 450kg)             │
│    Total: 3 tareas                                      │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 7. App muestra lista de tareas con badges por tipo      │
│    [🔔 Vacunación] Newcastle - 09:00                    │
│    [💡 Iluminación] G-001 - 06:00-20:00                 │
│    [🍽️ Alimentación] G-001 - 08:00 (450kg)              │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 8. Trabajador completa vacunación Newcastle             │
│    Tap en botón "Marcar como Completada"                │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 9. App envía request                                    │
│    POST /api/mobile/notificaciones/15/completar         │
│    Authorization: Bearer {JWT}                          │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 10. Controller extrae TrabajadorId del JWT              │
│     TrabajadorId = 5                                    │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 11. Crea MarcarTareaCompletadaCommand                   │
│     - CronogramaVacunacionId: 15                        │
│     - CompletadaPor: "Trabajador_5"                     │
│     - FechaCompletada: DateTime.Now                     │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 12. Handler ejecuta comando                             │
│     A. Busca cronograma ID 15                           │
│     B. Valida no esté completado                        │
│     C. Actualiza EstaCompletada = true                  │
│     D. Guarda CompletadaPor y FechaCompletada           │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 13. Retorna respuesta exitosa                           │
│     {                                                   │
│       "success": true,                                  │
│       "message": "Tarea completada exitosamente",       │
│       "tareaId": 15,                                    │
│       "completadaPor": "Trabajador_5",                  │
│       "fechaCompletada": "2025-10-28T09:15:00"          │
│     }                                                   │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 14. App actualiza UI                                    │
│     - Marca tarea con ✅                                │
│     - Muestra mensaje de confirmación                   │
│     - Actualiza contador de pendientes                  │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Tipos de Tareas

### 1️⃣ Tareas de Vacunación

**Origen**: `CronogramaVacunacion` + `ProgramaVacunacion`

**Características**:
- Fecha y hora específica de aplicación
- Tipo de vacuna (Newcastle, Bronquitis, Gumboro, etc.)
- Método de aplicación (Ocular, Agua, Subcutánea)
- Edad de las aves al momento de aplicación
- Galpón específico donde aplicar

**Estado**:
- ✅ `EstaCompletada = true` → Tarea finalizada
- ❌ `EstaCompletada = false` → Tarea pendiente
- ⚠️ `RequiereAtencionUrgente = true` → Fecha vencida

**Ejemplo**:
```json
{
  "id": 15,
  "nombreTarea": "Vacunación Newcastle",
  "nombreVacuna": "Newcastle B1",
  "tipoAplicacion": "Ocular",
  "fechaProgramada": "2025-10-28T09:00:00",
  "edadAplicacion": 45,
  "numeroGalpon": "G-001",
  "estaCompletada": false
}
```

### 2️⃣ Tareas de Iluminación

**Origen**: `CronogramaIluminacion`

**Características**:
- Horario de inicio y fin de iluminación
- Duración en horas
- Intensidad en Lux
- Galpón específico
- Recurrente (diario)

**Estado**:
- Activas para el día actual
- Se marcan como completadas al finalizar el día
- No tienen hora exacta, son rangos

**Ejemplo**:
```json
{
  "id": 8,
  "horaInicio": "06:00:00",
  "horaFin": "20:00:00",
  "duracionHoras": 14,
  "intensidadLux": 25,
  "numeroGalpon": "G-001",
  "estadoActual": "En Progreso"
}
```

### 3️⃣ Tareas de Alimentación

**Origen**: `CronogramaAlimentacion`

**Características**:
- Hora específica de alimentación
- Cantidad en kilogramos
- Tipo de alimento (Balanceado Postura, Iniciador, etc.)
- Galpón específico
- Puede haber múltiples por día

**Estado**:
- Programadas por hora del día
- Se completan al suministrar el alimento
- Críticas para producción

**Ejemplo**:
```json
{
  "id": 12,
  "horaAlimentacion": "08:00:00",
  "cantidadKg": 450,
  "tipoAlimento": "Balanceado Postura",
  "numeroGalpon": "G-001",
  "estadoActual": "Pendiente"
}
```

---

## 📋 Queries y Commands CQRS

### Query: GetTareasDelDiaQuery

```csharp
public class GetTareasDelDiaQuery : IRequest<Result<NotificacionResponseDto>>
{
    public int ClienteId { get; set; }
    public DateTime FechaConsulta { get; set; } = DateTime.Today;
    public bool IncluirTareasSinVacuna { get; set; } = true;
    public bool IncluirDetallesPrograma { get; set; } = false;
}
```

**Handler**: `GetTareasDelDiaQueryHandler`

**Proceso**:
1. Valida `ClienteId > 0`
2. Obtiene cronogramas de vacunación para `FechaConsulta`
3. Obtiene cronogramas de iluminación activos
4. Obtiene cronogramas de alimentación del día
5. Filtra todos por `ClienteId`
6. Mapea a DTOs correspondientes
7. Retorna `NotificacionResponseDto`

**Ubicación**: `ICARUS.Application/Features/GestionAvicola/Notificaciones/Queries/`

---

### Command: MarcarTareaCompletadaCommand

```csharp
public class MarcarTareaCompletadaCommand : IRequest<Result<bool>>
{
    public int CronogramaVacunacionId { get; set; }
    public string CompletadaPor { get; set; } = string.Empty;
    public DateTime FechaCompletada { get; set; } = DateTime.Now;
}
```

**Handler**: `MarcarTareaCompletadaCommandHandler`

**Proceso**:
1. Valida `CronogramaVacunacionId > 0`
2. Valida `CompletadaPor` no vacío
3. Busca cronograma en base de datos
4. Valida que no esté completado previamente
5. Actualiza:
   - `EstaCompletada = true`
   - `FechaCompletada = DateTime.Now`
   - `CompletadaPor = "Trabajador_{Id}"`
6. Guarda cambios
7. Retorna `Result<bool>` con éxito

**Ubicación**: `ICARUS.Application/Commands/GestionAvicola/CronogramaVacunacion/`

---

## 💡 Ejemplos de Requests

### Ejemplo 1: Flujo Completo - Día de Trabajo

**1. Login del trabajador**
```http
POST /api/mobile/auth/login
Content-Type: application/json

{
  "email": "trabajador@granja.com",
  "password": "password123"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "trabajadorInfo": {
    "id": 5,
    "clienteId": 3
  }
}
```

**2. Consultar tareas del día**
```http
GET /api/mobile/notificaciones/dia
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Response: 200 OK
{
  "tareasDelDia": [
    {
      "id": 15,
      "nombreTarea": "Vacunación Newcastle",
      "fechaProgramada": "2025-10-28T09:00:00",
      "estaCompletada": false
    }
  ],
  "tareasIluminacion": [...],
  "tareasAlimentacion": [...],
  "totalTareas": 3
}
```

**3. Completar tarea de vacunación**
```http
POST /api/mobile/notificaciones/15/completar
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Response: 200 OK
{
  "success": true,
  "message": "Tarea completada exitosamente",
  "tareaId": 15,
  "completadaPor": "Trabajador_5",
  "fechaCompletada": "2025-10-28T09:15:00"
}
```

**4. Verificar tareas pendientes**
```http
GET /api/mobile/notificaciones/pendientes
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Response: 200 OK
{
  "tareasDelDia": [],  // Newcastle ya completada
  "tareasIluminacion": [
    {
      "id": 8,
      "estaCompletada": false
    }
  ],
  "tareasAlimentacion": [
    {
      "id": 12,
      "estaCompletada": false
    }
  ],
  "totalTareas": 2
}
```

### Ejemplo 2: Sin Tareas para el Día

```http
GET /api/mobile/notificaciones/dia
Authorization: Bearer {JWT}

Response: 200 OK
{
  "tareasDelDia": [],
  "tareasIluminacion": [],
  "tareasAlimentacion": [],
  "totalTareas": 0,
  "fechaConsulta": "2025-10-28T00:00:00",
  "clienteId": 3,
  "tieneAccesoModulo": true,
  "mensaje": "No hay tareas programadas para hoy"
}
```

### Ejemplo 3: Error - Tarea No Encontrada

```http
POST /api/mobile/notificaciones/999/completar
Authorization: Bearer {JWT}

Response: 404 Not Found
{
  "success": false,
  "message": "Tarea de vacunación no encontrada"
}
```

---

## 📚 Referencias Rápidas

### 🗂️ Archivos del Sistema

| Tipo | Ubicación |
|------|-----------|
| **Controller** | `ICARUS.API/Controllers/Mobile/NotificacionesMobileController.cs` |
| **Query** | `ICARUS.Application/Features/GestionAvicola/Notificaciones/Queries/GetTareasDelDiaQuery.cs` |
| **Command** | `ICARUS.Application/Commands/GestionAvicola/CronogramaVacunacion/MarcarTareaCompletadaCommand.cs` |
| **DTOs** | `ICARUS.Application/Features/GestionAvicola/Notificaciones/DTOs/` |
| **Handlers** | `ICARUS.Application/Features/GestionAvicola/Notificaciones/Handlers/` |

### 🔐 Claims del JWT Token

```
TrabajadorId  → ID del trabajador autenticado
ClienteId     → ID del cliente al que pertenece el trabajador
Role          → "Trabajador" (requerido)
```

### 📊 Tabla de Endpoints

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/dia` | Tareas del día actual | ✅ |
| GET | `/pendientes` | Tareas no completadas | ✅ |
| POST | `/{id}/completar` | Completar tarea | ✅ |

### 🎯 Tipos de Estado de Tareas

| Estado | Valor | Descripción |
|--------|-------|-------------|
| Pendiente | `EstaCompletada = false` | Tarea programada no realizada |
| Completada | `EstaCompletada = true` | Tarea realizada con registro |
| Vencida | `DiasDesdeVencimiento > 0` | Tarea no completada a tiempo |
| Urgente | `RequiereAtencionUrgente = true` | Requiere acción inmediata |

### ⚠️ Códigos de Estado HTTP

| Código | Significado | Uso |
|--------|-------------|-----|
| 200 | OK | Consulta exitosa o tarea completada |
| 400 | Bad Request | ID inválido o datos incorrectos |
| 401 | Unauthorized | Token inválido o expirado |
| 403 | Forbidden | Sin permisos (ClienteId/TrabajadorId) |
| 404 | Not Found | Tarea no existe |
| 500 | Internal Server Error | Error del servidor |

---

## 📝 Notas Finales

### ✅ Características Implementadas

- ✔️ **3 Tipos de Tareas**: Vacunación, Iluminación, Alimentación
- ✔️ **Multi-tenant**: Filtrado automático por ClienteId
- ✔️ **Reutilización**: Mismas Queries/Commands que sistema web
- ✔️ **Auditoría**: Tracking de quién y cuándo completó
- ✔️ **Validaciones Defensivas**: Sin try-catch, validaciones previas
- ✔️ **Logging**: log4net con formato `Clase.Metodo - Mensaje`
- ✔️ **CQRS**: Separación lectura/escritura con MediatR

### 🔑 Diferencias Clave vs Web

| Aspecto | Web | Mobile API |
|---------|-----|------------|
| **Autenticación** | Cookie/Session | JWT Token |
| **Usuario** | Cliente directo | Trabajador del Cliente |
| **Vista** | Razor Views con DataTables | JSON responses |
| **Filtrado** | Por ClienteId del usuario | Por ClienteId del trabajador |
| **Completar** | Modal con formulario | POST endpoint directo |
| **Endpoint** | `/GestionAvicola/Notificaciones/` | `/api/mobile/notificaciones/` |

### 🚀 Consistencia con Sistema Web

El sistema mobile **garantiza consistencia** reutilizando:

1. **GetTareasDelDiaQuery**: Misma lógica que web
2. **MarcarTareaCompletadaCommand**: Mismo proceso de completado
3. **NotificacionResponseDto**: Misma estructura de datos
4. **Validaciones**: Mismas reglas de negocio

**Beneficio**: Los trabajadores móviles y usuarios web ven la misma información, evita inconsistencias.

### 📱 Integración con ICARUS_MOBILE

**Próximos pasos para implementación mobile**:

1. Crear `NotificacionesService.cs` en ICARUS_MOBILE
2. Crear `NotificacionesViewModel.cs` con MVVM
3. Crear `NotificacionesPage.xaml` con lista de tareas
4. Implementar pull-to-refresh para actualizar
5. Agregar badges por tipo de tarea (colores)
6. Implementar notificaciones push (opcional)

---

**Documento generado**: Octubre 2025  
**Versión**: 1.0  
**Controller**: `NotificacionesMobileController`  
**Mantenedor**: Equipo de Desarrollo ICARUS
