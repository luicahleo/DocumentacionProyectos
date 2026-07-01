# IMCA — Modelo de Datos

**Última actualización:** 2026-06-29 — validado contra código fuente

Base de datos local: **SQLite** (`sqlite-net-pcl` 1.9.172), archivo `imca_local.db3` en
`FileSystem.AppDataDirectory`. Flags: `ReadWrite | Create | SharedCache`
(ver `Helpers/Constants.cs`).

Las tablas se crean en `LocalDatabase.InitializeDatabaseAsync()`. Hay **5 tablas**.

---

## 1. Entidades (`Core/Models/`)

| Clase | Tabla SQLite | Rol |
|---|---|---|
| `DispositivoModel` | `Dispositivos` | Datos del dispositivo IMCA registrado |
| `SupervisorModel` | `Supervisores` | Supervisor autenticado + token JWT |
| `TrabajadorLocalModel` | `Trabajadores` | Trabajadores descargados para uso offline |
| `ConfiguracionAppModel` | `ConfiguracionApp` | Estado del modo kiosco y config local |
| `RegistroLocalModel` | `RegistroLocal` | Fichajes de Entrada/Salida (offline-first) |
| `FaceCapture` | *(sin tabla)* | DTO interno de captura facial (en `Core/Services/Interfaces`) |

---

## 2. Diagrama de clases

```mermaid
classDiagram
    class DispositivoModel {
        +int Id PK
        +int DispositivoApiId
        +int ClienteId
        +string Nombre
        +string Ubicacion
        +string UltimaIP
        +DateTime UltimoHeartbeat
        +bool EstaActivo
        +bool EstaRegistrado
        +DateTime FechaCreacion
    }

    class SupervisorModel {
        +int Id PK
        +int SupervisorApiId
        +int ClienteId
        +string Nombre
        +string Email
        +string Token "JWT"
        +DateTime TokenExpiration
        +DateTime UltimaAutenticacion
        +bool EstaAutenticado
    }

    class TrabajadorLocalModel {
        +int Id PK
        +int TrabajadorApiId
        +int ClienteId
        +string Nombre
        +string NumeroDocumento
        +bool TieneHuella
        +bool TieneFoto
        +string FotoUrl
        +string FotoLocalPath
        +byte[] PlantillaBiometrica "huella SIMULADA"
        +byte[] FaceEmbedding "ArcFace 512-dim"
        +byte[] FaceEmbeddingMobileFN "MobileFaceNet 128-dim"
        +DateTime FechaRegistroFoto
        +DateTime FechaInicio
        +DateTime FechaFin
        +bool EstaActivo
        +DateTime UltimaSincronizacion
    }

    class ConfiguracionAppModel {
        +int Id PK
        +bool ModoKioscoActivo
        +string SupervisorEmail
        +DateTime FechaActivacionKiosco
        +string DispositivoId "IMCA-{GUID12}"
        +DateTime FechaModificacion
    }

    class RegistroLocalModel {
        +int Id PK
        +int TrabajadorId
        +int ClienteId
        +DateTime FechaHora
        +string TipoRegistro "Entrada|Salida"
        +bool Sincronizado
        +int RegistroIdBackend
        +string DispositivoId
        +DateTime FechaCreacion
        +string ErrorSincronizacion
        +int IntentosSync
        +DateTime UltimoIntentoSync
    }

    SupervisorModel "1" --> "N" TrabajadorLocalModel : ClienteId
    TrabajadorLocalModel "1" --> "N" RegistroLocalModel : TrabajadorApiId→TrabajadorId
```

> Las relaciones son **lógicas** (por `ClienteId` / `TrabajadorApiId`), no hay claves
> foráneas declaradas en SQLite. `TrabajadorLocalModel.TrabajadorApiId` se corresponde con
> `RegistroLocalModel.TrabajadorId` (ambos son el ID del trabajador en ICARUS.API).

---

## 3. Notas importantes sobre embeddings faciales

`TrabajadorLocalModel` guarda **dos** embeddings distintos (ambos `byte[]` en SQLite):

| Campo | Modelo | Dimensión | Tamaño en BD | Uso |
|---|---|---|---|---|
| `FaceEmbedding` | ArcFace (ARGOS) | 512-dim | **4096 bytes** (512 × `double` de 8 bytes) | Respaldo local del embedding de ARGOS |
| `FaceEmbeddingMobileFN` | MobileFaceNet | 128-dim | **512 bytes** (128 × `float` de 4 bytes) | Identificación local ONNX |

> ⚠️ **Comentario obsoleto en el código:** en `TrabajadorLocalModel.cs`, el comentario XML
> de `FaceEmbedding` dice "Vector de 128 floats (512 bytes)". Eso es **incorrecto** para
> `FaceEmbedding`: el tamaño real verificado en BD es **4096 bytes (ArcFace 512-dim)**.
> El de 128-dim/512 bytes es `FaceEmbeddingMobileFN`. La fuente de verdad es el esquema
> real de SQLite (ver `GUIA-CONSULTAR-BASE-DATOS-SQLITE.md`).

Convenciones de almacenamiento SQLite:

- Booleanos → `INTEGER` (0 = false, 1 = true).
- Fechas → Unix timestamp en milisegundos.
- Embeddings y plantilla biométrica → `BLOB`.

---

## 4. DTOs (`Core/Models/DTOs/`)

| DTO | Uso |
|---|---|
| `RegistroSincronizarDto` | Cuerpo de cada registro en `POST imca/registros/sincronizar-batch` (incluye `RegistroIdLocal` para tracking). |
| `RegistroSincronizarResponseDto` | Respuesta por registro del batch (éxito / `registroIdBackend` / error). |
| `SyncResult` | Resultado agregado de una sincronización: `Sincronizados`, `Fallidos`, `Total`, `TieneErrores`, `Mensaje`. |

Otros DTOs relevantes definidos *inline* en servicios:

- `EmbeddingDto` (privado en `EmbeddingsCache`): deserializa la respuesta de
  `imca/biometria/embeddings/{clienteId}`. Campos `embedding` (ArcFace 512-dim) y
  `embeddingMobile` (MobileFaceNet 128-dim). El cache usa `embeddingMobile`.
- `LoginResponse` / `TrabajadorConHuellaDto` (en `AuthenticationService`): respuesta del login.

---

## 5. Operaciones principales de `LocalDatabase`

| Grupo | Métodos destacados |
|---|---|
| Dispositivo | `GetDispositivoAsync`, `SaveDispositivoAsync`, `DeleteDispositivoAsync` |
| Supervisor | `GetSupervisorAutenticadoAsync`, `SaveSupervisorAsync`, `CerrarSesionSupervisorAsync`, **`GetSupervisorConTokenValidoAsync`** (usado por kiosco para restaurar token sin requerir `EstaAutenticado`) |
| Trabajadores | `GetTrabajadoresAsync`, `SaveTrabajadoresAsync`, `GetTrabajadorByApiIdAsync`, `GetTrabajadoresConFotoAsync`, `GetTrabajadoresConHuellaAsync`, `SearchTrabajadoresAsync`, `GetTrabajadoresByClienteIdAsync` |
| Configuración | `GetConfiguracionAsync` (crea config por defecto y genera `DispositivoId` = `IMCA-{GUID12}` si falta), `UpdateConfiguracionAsync` |
| Registros | `InsertRegistroAsync`, `GetRegistrosPendientesSincronizarAsync`, `MarcarRegistroSincronizadoAsync`, `MarcarRegistroErrorAsync`, `GetRegistrosHoyAsync`, `GetUltimoRegistroTrabajadorAsync`, `GetCantidadRegistrosPendientesAsync` |
| Mantenimiento | `ClearDatabaseAsync` (borra las 5 tablas) |

La inicialización es asíncrona y no bloqueante: cada operación pública llama internamente a
`EnsureInitializedAsync()` antes de tocar la conexión.
