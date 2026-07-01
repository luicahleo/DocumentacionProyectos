# 📊 SISTEMA DE REGISTRO DE PRODUCCIÓN DIARIA - API MOBILE

> **Última actualización:** 2026-06-29 — revisado contra código fuente. Backend **.NET 10 / EF Core 10**.
> Controller real: `ICARUS.API/Controllers/Mobile/RegistroProduccionMobileController.cs`
> (ruta base `api/mobile/registro-produccion`). Endpoints: `GET /galpones`, `POST /`, `GET /{id}`,
> `GET /historial`, `PUT /{id}`, `DELETE /{id}`. Lógica en `ICARUS.Application/Features/GestionAvicola/`.

> **Documento de Referencia Técnica**  
> **Fecha:** Octubre 2025  
> **Versión:** 1.0  
> **Controller:** `RegistroProduccionMobileController.cs`

---

## 📑 Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Endpoints API](#endpoints-api)
4. [Modelos y DTOs](#modelos-y-dtos)
5. [Seguridad y Autenticación](#seguridad-y-autenticación)
6. [Flujos de Operación](#flujos-de-operación)
7. [Validaciones y Reglas de Negocio](#validaciones-y-reglas-de-negocio)
8. [Queries y Commands CQRS](#queries-y-commands-cqrs)
9. [Ejemplos de Requests](#ejemplos-de-requests)
10. [Referencias Rápidas](#referencias-rápidas)

---

## 🎯 Resumen Ejecutivo

El **Sistema de Registro de Producción Diaria Mobile** permite a los trabajadores autenticados registrar, consultar, editar y eliminar datos de producción de huevos desde la aplicación móvil ICARUS_MOBILE.

### 🔑 Características Principales

| Característica | Descripción |
|----------------|-------------|
| **Autenticación** | JWT Token con rol "Trabajador" |
| **Multi-tenant** | Filtrado automático por `ClienteId` del trabajador |
| **CQRS** | Commands para escritura, Queries para lectura |
| **Auditoría** | Tracking de `CreadoPor`, `ModificadoPor` |
| **Seguridad** | Trabajador solo edita/elimina sus propios registros |
| **Paginación** | Historial con skip/take (máximo 100 por consulta) |

### ⚡ Flujo Principal

```
Trabajador se autentica → Recibe JWT con ClienteId + TrabajadorId
                                ↓
Obtiene galpones disponibles de su cliente
                                ↓
Crea registro de producción con datos del día
                                ↓
Consulta historial de registros (todos del cliente)
                                ↓
Edita/Elimina solo sus propios registros
```

---

## 📐 Arquitectura del Sistema

### Diagrama de Capas

```
┌─────────────────────────────────────────────────────────┐
│ ICARUS_MOBILE (.NET MAUI)                               │
│ - ViewModel de producción                               │
│ - Servicios HTTP                                        │
│ - Formularios de registro                               │
└─────────────────────────────────────────────────────────┘
                         ↓ HTTP/JSON + JWT
┌─────────────────────────────────────────────────────────┐
│ ICARUS.API - RegistroProduccionMobileController         │
│ Route: /api/mobile/registro-produccion                  │
│ [Authorize(Roles = "Trabajador")]                       │
│                                                         │
│ Endpoints:                                              │
│ - GET  /galpones              → Lista de galpones       │
│ - POST /                      → Crear registro          │
│ - GET  /{id}                  → Obtener por ID          │
│ - PUT  /{id}                  → Actualizar registro     │
│ - DELETE /{id}                → Eliminar registro       │
│ - GET  /historial             → Historial paginado      │
└─────────────────────────────────────────────────────────┘
                         ↓ MediatR (CQRS)
┌─────────────────────────────────────────────────────────┐
│ ICARUS.Application - Commands & Queries                 │
│                                                         │
│ Commands:                                               │
│ - CreateRegistroProduccionDiarioCommand                 │
│ - UpdateRegistroProduccionDiarioCommand                 │
│ - DeleteRegistroProduccionDiarioCommand                 │
│                                                         │
│ Queries:                                                │
│ - GetGalponesQuery (por ClienteId)                      │
│ - GetRegistroProduccionByIdQuery                        │
│ - GetRegistrosProduccionQuery (historial)               │
└─────────────────────────────────────────────────────────┘
                         ↓ Entity Framework
┌─────────────────────────────────────────────────────────┐
│ ICARUS.Infrastructure - SQL Server                      │
│ - RegistroProduccionDiario                              │
│ - Galpon                                                │
│ - GestorAvicola                                         │
│ - RegistroMortalidad                                    │
└─────────────────────────────────────────────────────────┘
```

---

## 🌐 Endpoints API

### Base URL
```
/api/mobile/registro-produccion
```

### 1️⃣ GET /galpones - Obtener Galpones Disponibles

**Descripción**: Obtiene lista de galpones del cliente al que pertenece el trabajador autenticado.

**Autorización**: `[Authorize(Roles = "Trabajador")]`

**Request**:
```http
GET /api/mobile/registro-produccion/galpones
Authorization: Bearer {JWT_TOKEN}
```

**Response 200 OK**:
```json
[
  {
    "id": 1,
    "numeroGalpon": "G-001",
    "nombreGalpon": "Galpón Principal",
    "capacidadMaxima": 5000,
    "gallinasActuales": 4800,
    "tipoGalpon": "Postura",
    "estadoGalpon": "Activo",
    "estaActivo": true
  },
  {
    "id": 2,
    "numeroGalpon": "G-002",
    "nombreGalpon": "Galpón Secundario",
    "capacidadMaxima": 3000,
    "gallinasActuales": 2900,
    "tipoGalpon": "Postura",
    "estadoGalpon": "Activo",
    "estaActivo": true
  }
]
```

**Validaciones**:
- ClienteId extraído automáticamente del JWT
- Solo retorna galpones activos (`EstaActivo = true`)
- Si no hay galpones, retorna lista vacía `[]`

---

### 2️⃣ POST / - Crear Registro de Producción

**Descripción**: Crea un nuevo registro de producción diaria para un galpón.

**Autorización**: `[Authorize(Roles = "Trabajador")]`

**Request**:
```http
POST /api/mobile/registro-produccion
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "fecha": "2025-10-28T08:30:00",
  "galponId": 1,
  "horaRegistro": "08:30:00",
  "cantidadMaples": 150,
  "unidadesIncompletas": 25,
  "gallinasMuertas": 2,
  "observaciones": "Producción normal del día",
  "causaProbableMortalidad": "Natural",
  "accionesTomadasMortalidad": "Registro y retiro de cuerpos"
}
```

**Response 201 Created**:
```json
{
  "id": 456,
  "clienteId": 3,
  "fecha": "2025-10-28T08:30:00",
  "galponId": 1,
  "numeroRegistro": 1,
  "horaRegistro": "08:30:00",
  "numeroGalpon": "G-001",
  "cantidadMaples": 150,
  "unidadesIncompletas": 25,
  "gallinasMuertas": 2,
  "porcentajeMortalidad": 0.04,
  "observaciones": "Producción normal del día",
  "fechaRegistro": "2025-10-28T08:30:00",
  "estaActivo": true,
  "maplesHuevos": 150,
  "fechaCreacion": "2025-10-28T08:35:00",
  "creadoPor": "Trabajador_5",
  "totalHuevosProducidos": 4525,
  "produccionPorGallina": 0.94,
  "eficienciaProduccion": 94.27,
  "tieneMortalidad": true,
  "requiereAtencionMortalidad": false,
  "requiereAtencionProduccion": false,
  "nivelSeveridadMortalidad": "Baja",
  "nombreGranja": "Granja El Milagro"
}
```

**Validaciones**:
- `CreadoPor` se establece automáticamente como `"Trabajador_{TrabajadorId}"`
- `NumeroRegistro` se calcula automáticamente (secuencial por galpón/día)
- Si no se especifica `HoraRegistro`, se usa la hora actual
- Total de huevos = `(CantidadMaples * 30) + UnidadesIncompletas`

---

### 3️⃣ GET /{id} - Obtener Registro por ID

**Descripción**: Obtiene un registro específico por ID. Solo permite acceso a registros creados por el trabajador autenticado.

**Autorización**: `[Authorize(Roles = "Trabajador")]`

**Request**:
```http
GET /api/mobile/registro-produccion/456
Authorization: Bearer {JWT_TOKEN}
```

**Response 200 OK**:
```json
{
  "id": 456,
  "clienteId": 3,
  "fecha": "2025-10-28T08:30:00",
  "galponId": 1,
  "numeroGalpon": "G-001",
  "cantidadMaples": 150,
  "unidadesIncompletas": 25,
  "gallinasMuertas": 2,
  "observaciones": "Producción normal del día",
  "creadoPor": "Trabajador_5",
  "totalHuevosProducidos": 4525,
  "eficienciaProduccion": 94.27
}
```

**Response 403 Forbidden** (si no es el creador):
```json
{
  "message": "No tiene permisos para acceder a este registro"
}
```

**Validaciones de Seguridad**:
- Verifica que `CreadoPor == "Trabajador_{TrabajadorIdDelToken}"`
- Si no coincide, retorna `403 Forbid`

---

### 4️⃣ GET /historial - Obtener Historial de Registros

**Descripción**: Obtiene historial completo de registros de producción del cliente. Muestra **todos** los registros del cliente, no solo los del trabajador autenticado.

**Autorización**: `[Authorize(Roles = "Trabajador")]`

**Request**:
```http
GET /api/mobile/registro-produccion/historial?fechaInicio=2025-10-01&fechaFin=2025-10-31&galponId=1&skip=0&take=20
Authorization: Bearer {JWT_TOKEN}
```

**Query Parameters**:
| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| `fechaInicio` | DateTime | No | null | Fecha inicio del rango |
| `fechaFin` | DateTime | No | null | Fecha fin del rango |
| `galponId` | int | No | null | Filtrar por galpón específico |
| `skip` | int | No | 0 | Registros a omitir (paginación) |
| `take` | int | No | 50 | Registros a tomar (máx 100) |

**Response 200 OK**:
```json
{
  "registros": [
    {
      "id": 458,
      "fecha": "2025-10-28T14:00:00",
      "galponId": 1,
      "numeroGalpon": "G-001",
      "cantidadMaples": 148,
      "unidadesIncompletas": 18,
      "gallinasMuertas": 0,
      "creadoPor": "Trabajador_7",
      "totalHuevosProducidos": 4458,
      "eficienciaProduccion": 92.87
    },
    {
      "id": 456,
      "fecha": "2025-10-28T08:30:00",
      "galponId": 1,
      "numeroGalpon": "G-001",
      "cantidadMaples": 150,
      "unidadesIncompletas": 25,
      "gallinasMuertas": 2,
      "creadoPor": "Trabajador_5",
      "totalHuevosProducidos": 4525,
      "eficienciaProduccion": 94.27
    }
  ],
  "eficienciasPorGalpon": [
    {
      "galponId": 1,
      "nombreGalpon": "Galpón Principal",
      "gallinasActuales": 4800,
      "totalHuevosDia": 8983,
      "numeroRegistrosDia": 2,
      "eficienciaProduccion": 93.57,
      "fechaConsulta": "2025-10-28T00:00:00",
      "esEficienciaOptima": true,
      "requiereAtencion": false,
      "eficienciaFormateada": "93.57%"
    }
  ],
  "totalRegistros": 2,
  "totalPaginas": 1,
  "fechaConsulta": "2025-10-28T15:30:00"
}
```

**Características Especiales**:
- ✅ Muestra **todos** los registros del cliente (no solo del trabajador)
- ✅ Permite ver trabajo de otros trabajadores para transparencia
- ✅ Incluye eficiencias consolidadas por galpón
- ✅ Paginación con límite máximo de 100 registros

---

### 5️⃣ PUT /{id} - Actualizar Registro

**Descripción**: Actualiza un registro existente. Solo permite editar registros creados por el trabajador autenticado.

**Autorización**: `[Authorize(Roles = "Trabajador")]`

**Request**:
```http
PUT /api/mobile/registro-produccion/456
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "id": 456,
  "galponId": 1,
  "cantidadMaples": 152,
  "unidadesIncompletas": 20,
  "gallinasMuertas": 2,
  "observaciones": "Producción normal - corrección de datos"
}
```

**Response 200 OK**:
```json
{
  "id": 456,
  "clienteId": 3,
  "fecha": "2025-10-28T08:30:00",
  "galponId": 1,
  "numeroGalpon": "G-001",
  "cantidadMaples": 152,
  "unidadesIncompletas": 20,
  "gallinasMuertas": 2,
  "observaciones": "Producción normal - corrección de datos",
  "creadoPor": "Trabajador_5",
  "modificadoPor": "Trabajador_5",
  "totalHuevosProducidos": 4580,
  "eficienciaProduccion": 95.42
}
```

**Validaciones de Seguridad**:
1. Verifica que el registro existe
2. Verifica que `CreadoPor == "Trabajador_{TrabajadorIdDelToken}"`
3. Si no coincide, retorna `403 Forbid`
4. Establece `ModificadoPor = "Trabajador_{TrabajadorId}"`

---

### 6️⃣ DELETE /{id} - Eliminar Registro

**Descripción**: Elimina un registro de producción (soft delete). Solo permite eliminar registros creados por el trabajador autenticado.

**Autorización**: `[Authorize(Roles = "Trabajador")]`

**Request**:
```http
DELETE /api/mobile/registro-produccion/456
Authorization: Bearer {JWT_TOKEN}
```

**Response 204 No Content** (éxito)

**Response 403 Forbidden** (si no es el creador):
```json
{
  "message": "No tiene permisos para eliminar este registro"
}
```

**Validaciones de Seguridad**:
- Verifica que el registro existe
- Verifica que `CreadoPor == "Trabajador_{TrabajadorIdDelToken}"`
- Establece `EliminadoPor = "Trabajador_{TrabajadorId}"`
- **Soft delete**: `EstaActivo = false`

---

## 📦 Modelos y DTOs

### RegistroProduccionDiarioDto

```csharp
public class RegistroProduccionDiarioDto
{
    // Identificación
    public int Id { get; set; }
    public int ClienteId { get; set; }
    public DateTime Fecha { get; set; }
    public int GalponId { get; set; }
    public int NumeroRegistro { get; set; }
    public TimeSpan HoraRegistro { get; set; }
    public string NumeroGalpon { get; set; }

    // Producción
    public int CantidadMaples { get; set; }           // 1 maple = 30 huevos
    public int UnidadesIncompletas { get; set; }      // Huevos sueltos
    public int MaplesHuevos => CantidadMaples;        // Alias
    public int TotalHuevosProducidos => (CantidadMaples * 30) + UnidadesIncompletas;

    // Mortalidad
    public int GallinasMuertas { get; set; }
    public decimal PorcentajeMortalidad { get; set; }
    public bool TieneMortalidad => GallinasMuertas > 0;
    public bool RequiereAtencionMortalidad => PorcentajeMortalidad > 2m;
    public string NivelSeveridadMortalidad { get; set; }

    // Eficiencia
    public decimal ProduccionPorGallina { get; set; }
    public decimal EficienciaProduccion { get; set; }
    public bool RequiereAtencionProduccion => EficienciaProduccion < 60m;

    // Observaciones
    public string? Observaciones { get; set; }

    // Auditoría
    public DateTime FechaRegistro { get; set; }
    public DateTime FechaCreacion { get; set; }
    public string? CreadoPor { get; set; }
    public bool EstaActivo { get; set; }

    // Información adicional
    public string? NombreGranja { get; set; }
}
```

### GalponDto

```csharp
public class GalponDto
{
    public int Id { get; set; }
    public string NumeroGalpon { get; set; }
    public string NombreGalpon { get; set; }
    public int CapacidadMaxima { get; set; }
    public int GallinasActuales { get; set; }
    public string TipoGalpon { get; set; }
    public string EstadoGalpon { get; set; }
    public bool EstaActivo { get; set; }
}
```

### EficienciaPorGalponDto

```csharp
public class EficienciaPorGalponDto
{
    public int GalponId { get; set; }
    public string NombreGalpon { get; set; }
    public int GallinasActuales { get; set; }
    public int TotalHuevosDia { get; set; }
    public int NumeroRegistrosDia { get; set; }
    public decimal EficienciaProduccion { get; set; }
    public DateTime FechaConsulta { get; set; }
    
    // Propiedades calculadas
    public bool EsEficienciaOptima => EficienciaProduccion >= 80m;
    public bool RequiereAtencion => EficienciaProduccion < 60m;
    public string EficienciaFormateada => $"{EficienciaProduccion:F2}%";
    public string ClaseIndicador => EficienciaProduccion switch
    {
        >= 80m => "bg-success",
        >= 60m => "bg-warning",
        _ => "bg-danger"
    };
}
```

---

## 🔒 Seguridad y Autenticación

### Extracción de Claims del JWT

El controller tiene dos métodos privados para extraer información del token:

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
// Al obtener galpones
int? clienteId = GetClienteIdFromToken();
if (clienteId == null || clienteId <= 0)
{
    return Forbid("No se pudo determinar el cliente del trabajador");
}

GetGalponesQuery query = new GetGalponesQuery { ClienteId = clienteId.Value };
```

#### 2. Auditoría Automática
```csharp
// Al crear registro
int? trabajadorId = GetTrabajadorIdFromToken();
request.CreadoPor = $"Trabajador_{trabajadorId}";

// Al actualizar registro
request.ModificadoPor = $"Trabajador_{trabajadorId}";

// Al eliminar registro
deleteCommand.EliminadoPor = $"Trabajador_{trabajadorId}";
```

#### 3. Verificación de Propiedad (Editar/Eliminar)
```csharp
// Verificar que el trabajador es el creador
string expectedCreatedBy = $"Trabajador_{trabajadorId}";
if (existingResult.Data.CreadoPor != expectedCreatedBy)
{
    return Forbid("No tiene permisos para editar este registro");
}
```

---

## 🔄 Flujos de Operación

### Flujo Completo: Crear Registro

```
┌─────────────────────────────────────────────────────────┐
│ 1. Trabajador autenticado envía request POST            │
│    - JWT Token en header Authorization                  │
│    - Body con datos de producción                       │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 2. Controller: CrearRegistroProduccion()                │
│    A. Valida request != null                            │
│    B. Extrae ClienteId del token                        │
│    C. Extrae TrabajadorId del token                     │
│    D. Valida ambos IDs > 0                              │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Establece auditoría                                  │
│    request.CreadoPor = "Trabajador_{TrabajadorId}"      │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Envía comando a MediatR                              │
│    CreateRegistroProduccionDiarioCommand                │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 5. Handler procesa comando                              │
│    A. Valida GalponId existe                            │
│    B. Calcula NumeroRegistro (secuencial)               │
│    C. Calcula TotalHuevos = (Maples*30) + Unidades      │
│    D. Calcula Eficiencia y Porcentaje Mortalidad        │
│    E. Crea entidad en base de datos                     │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 6. Controller retorna respuesta                         │
│    - 201 Created con Location header                    │
│    - Body con RegistroProduccionDiarioDto completo      │
└─────────────────────────────────────────────────────────┘
```

### Flujo: Consultar Historial

```
┌─────────────────────────────────────────────────────────┐
│ 1. Trabajador solicita historial con filtros            │
│    GET /historial?fechaInicio=...&galponId=...          │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 2. Controller extrae ClienteId del token                │
│    - Valida skip >= 0                                   │
│    - Valida take <= 100 (máximo)                        │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Crea GetRegistrosProduccionQuery                     │
│    - ClienteId (del token)                              │
│    - FechaInicio, FechaFin (opcional)                   │
│    - GalponId (opcional)                                │
│    - Skip, Take (paginación)                            │
│    - SoloActivos = true                                 │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Handler ejecuta query                                │
│    A. Filtra por ClienteId                              │
│    B. Aplica filtros de fecha y galpón                  │
│    C. Calcula eficiencias por galpón                    │
│    D. Aplica paginación                                 │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 5. Controller retorna GetRegistrosProduccionResponse    │
│    - Lista de registros (TODOS del cliente)             │
│    - Eficiencias consolidadas por galpón                │
│    - Metadata de paginación                             │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Validaciones y Reglas de Negocio

### Validaciones al Crear/Editar

1. **GalponId**
   - Debe existir en la base de datos
   - Debe pertenecer al cliente del trabajador
   - Debe estar activo (`EstaActivo = true`)

2. **CantidadMaples**
   - Debe ser >= 0
   - Máximo razonable: 500 maples (15,000 huevos)

3. **UnidadesIncompletas**
   - Debe ser >= 0 y < 30 (menos de un maple completo)

4. **GallinasMuertas**
   - Debe ser >= 0
   - No puede exceder el número de gallinas actuales del galpón

5. **Fecha**
   - No puede ser futura
   - Validación: `Fecha <= DateTime.Today`

6. **HoraRegistro**
   - Si no se especifica, se establece automáticamente

### Cálculos Automáticos

```csharp
// Total de huevos
TotalHuevos = (CantidadMaples * 30) + UnidadesIncompletas

// Porcentaje de mortalidad
PorcentajeMortalidad = (GallinasMuertas / GallinasActuales) * 100

// Eficiencia de producción
EficienciaProduccion = (TotalHuevos / GallinasActuales) * 100

// Producción por gallina
ProduccionPorGallina = TotalHuevos / GallinasActuales
```

### Niveles de Alerta

| Métrica | Óptimo | Advertencia | Crítico |
|---------|--------|-------------|---------|
| **Eficiencia** | ≥ 80% | 60-79% | < 60% |
| **Mortalidad** | < 0.5% | 0.5-2% | > 2% |

---

## 📋 Queries y Commands CQRS

### Commands (Escritura)

#### CreateRegistroProduccionDiarioCommand
```csharp
public class CreateRegistroProduccionDiarioCommand : IRequest<OperationResult<RegistroProduccionDiarioDto>>
{
    public DateTime Fecha { get; set; }
    public int GalponId { get; set; }
    public int NumeroRegistro { get; set; }
    public TimeSpan HoraRegistro { get; set; }
    public int CantidadMaples { get; set; }
    public int UnidadesIncompletas { get; set; }
    public int GallinasMuertas { get; set; }
    public string? Observaciones { get; set; }
    public string? CausaProbableMortalidad { get; set; }
    public string? AccionesTomadasMortalidad { get; set; }
    public string? CreadoPor { get; set; }
}
```

#### UpdateRegistroProduccionDiarioCommand
```csharp
public class UpdateRegistroProduccionDiarioCommand : IRequest<OperationResult<RegistroProduccionDiarioDto>>
{
    public int Id { get; set; }
    public int GalponId { get; set; }
    public int CantidadMaples { get; set; }
    public int UnidadesIncompletas { get; set; }
    public int GallinasMuertas { get; set; }
    public string? Observaciones { get; set; }
    public string? ModificadoPor { get; set; }
}
```

#### DeleteRegistroProduccionDiarioCommand
```csharp
public class DeleteRegistroProduccionDiarioCommand : IRequest<OperationResult>
{
    public int Id { get; set; }
    public string? EliminadoPor { get; set; }
}
```

### Queries (Lectura)

#### GetGalponesQuery
```csharp
public class GetGalponesQuery : IRequest<OperationResult<IEnumerable<GalponDto>>>
{
    public int ClienteId { get; set; }
    public int? GestorAvicolaId { get; set; }
    public bool SoloActivos { get; set; } = true;
    public bool IncluirEstadisticas { get; set; } = false;
}
```

#### GetRegistroProduccionByIdQuery
```csharp
public class GetRegistroProduccionByIdQuery : IRequest<OperationResult<RegistroProduccionDiarioDto>>
{
    public int Id { get; set; }
}
```

#### GetRegistrosProduccionQuery
```csharp
public class GetRegistrosProduccionQuery : IRequest<OperationResult<GetRegistrosProduccionResponse>>
{
    public int? ClienteId { get; set; }
    public int? GestorAvicolaId { get; set; }
    public int? GalponId { get; set; }
    public DateTime? FechaInicio { get; set; }
    public DateTime? FechaFin { get; set; }
    public int? Take { get; set; }
    public int? Skip { get; set; }
    public bool SoloActivos { get; set; } = true;
    public bool OrdenDescendente { get; set; } = true;
}
```

---

## 💡 Ejemplos de Requests

### Ejemplo 1: Flujo Completo - Crear Registro

**1. Login (obtener token)**
```http
POST /api/mobile/auth/login
Content-Type: application/json

{
  "email": "trabajador@granja.com",
  "password": "password123",
  "rememberMe": true
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

**2. Obtener galpones disponibles**
```http
GET /api/mobile/registro-produccion/galpones
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Response:
[
  {
    "id": 1,
    "numeroGalpon": "G-001",
    "nombreGalpon": "Galpón Principal",
    "gallinasActuales": 4800
  }
]
```

**3. Crear registro de producción**
```http
POST /api/mobile/registro-produccion
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "fecha": "2025-10-28T08:30:00",
  "galponId": 1,
  "horaRegistro": "08:30:00",
  "cantidadMaples": 150,
  "unidadesIncompletas": 25,
  "gallinasMuertas": 2,
  "observaciones": "Producción normal"
}

Response: 201 Created
Location: /api/mobile/registro-produccion/456
{
  "id": 456,
  "creadoPor": "Trabajador_5",
  "totalHuevosProducidos": 4525,
  "eficienciaProduccion": 94.27
}
```

### Ejemplo 2: Consultar Historial con Filtros

```http
GET /api/mobile/registro-produccion/historial?fechaInicio=2025-10-01&fechaFin=2025-10-31&galponId=1&skip=0&take=20
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Response:
{
  "registros": [...],
  "eficienciasPorGalpon": [...],
  "totalRegistros": 15,
  "totalPaginas": 1
}
```

### Ejemplo 3: Editar Registro

```http
PUT /api/mobile/registro-produccion/456
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "id": 456,
  "galponId": 1,
  "cantidadMaples": 152,
  "unidadesIncompletas": 20,
  "gallinasMuertas": 2,
  "observaciones": "Corrección de datos"
}

Response: 200 OK
{
  "id": 456,
  "modificadoPor": "Trabajador_5",
  "totalHuevosProducidos": 4580
}
```

---

## 📚 Referencias Rápidas

### 🗂️ Archivos del Sistema

| Tipo | Ubicación |
|------|-----------|
| **Controller** | `ICARUS.API/Controllers/Mobile/RegistroProduccionMobileController.cs` |
| **Commands** | `ICARUS.Application/Features/GestionAvicola/Commands/RegistroProduccion/` |
| **Queries** | `ICARUS.Application/Features/GestionAvicola/Queries/RegistroProduccion/` |
| **DTOs** | `ICARUS.Application/Features/GestionAvicola/DTOs/` |
| **Entidad** | `ICARUS.Domain/Entities/GestionAvicola/RegistroProduccionDiario.cs` |

### 🔐 Claims del JWT Token

```
TrabajadorId  → ID del trabajador autenticado
ClienteId     → ID del cliente al que pertenece el trabajador
Role          → "Trabajador" (requerido)
```

### 📊 Tabla de Endpoints

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/galpones` | Lista galpones del cliente | ✅ |
| POST | `/` | Crear registro | ✅ |
| GET | `/{id}` | Obtener por ID | ✅ |
| PUT | `/{id}` | Actualizar registro | ✅ |
| DELETE | `/{id}` | Eliminar registro | ✅ |
| GET | `/historial` | Historial paginado | ✅ |

### 🎯 Reglas de Negocio Clave

1. **Multi-tenant**: Todo se filtra automáticamente por `ClienteId` del trabajador
2. **Auditoría**: `CreadoPor`, `ModificadoPor`, `EliminadoPor` se establecen automáticamente
3. **Seguridad**: Solo puedes editar/eliminar tus propios registros
4. **Visibilidad**: Puedes ver registros de todos los trabajadores del cliente (historial)
5. **Soft Delete**: `EstaActivo = false`, no se eliminan físicamente
6. **Cálculo de huevos**: Total = (Maples × 30) + Unidades Incompletas

### ⚠️ Códigos de Estado HTTP

| Código | Significado | Uso |
|--------|-------------|-----|
| 200 | OK | Éxito en GET, PUT |
| 201 | Created | Registro creado exitosamente |
| 204 | No Content | Eliminación exitosa |
| 400 | Bad Request | Datos inválidos o faltantes |
| 401 | Unauthorized | Token inválido o expirado |
| 403 | Forbidden | Sin permisos (ClienteId/TrabajadorId) |
| 404 | Not Found | Registro no existe |
| 500 | Internal Server Error | Error del servidor |

---

## 📝 Notas Finales

### ✅ Características Implementadas

- ✔️ **CQRS**: Commands para escritura, Queries para lectura
- ✔️ **Multi-tenant**: Filtrado automático por ClienteId
- ✔️ **Seguridad**: Validación de propiedad de registros
- ✔️ **Auditoría**: Tracking completo de creación/modificación
- ✔️ **Paginación**: Historial con skip/take (máx 100)
- ✔️ **Validaciones Defensivas**: Sin try-catch, validaciones previas
- ✔️ **Logging**: log4net con formato `Clase.Metodo - Mensaje`
- ✔️ **Soft Delete**: `EstaActivo = false`

### 🔑 Diferencias Clave vs Web

| Aspecto | Web | Mobile API |
|---------|-----|------------|
| **Autenticación** | Cookie/Session | JWT Token |
| **Usuario** | Cliente directo | Trabajador del Cliente |
| **Navegación** | MVC Views | JSON responses |
| **Filtrado** | Por ClienteId del usuario | Por ClienteId del trabajador |
| **Edición** | Todos los registros | Solo propios registros |
| **Endpoint** | `/GestionAvicola/RegistroProduccion/` | `/api/mobile/registro-produccion/` |

### 🚀 Patrones Aplicados

1. **Repository Pattern**: Acceso a datos mediante repositorios
2. **CQRS**: Separación de lectura y escritura
3. **Mediator Pattern**: MediatR para commands/queries
4. **AutoMapper**: Mapeo Entity ↔ DTO
5. **Multi-tenancy**: Filtrado automático por tenant (ClienteId)
6. **Audit Trail**: Tracking de `CreadoPor`, `ModificadoPor`

---

**Documento generado**: Octubre 2025  
**Versión**: 1.0  
**Controller**: `RegistroProduccionMobileController`  
**Mantenedor**: Equipo de Desarrollo ICARUS
