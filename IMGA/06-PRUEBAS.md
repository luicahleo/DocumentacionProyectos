# 06 — Pruebas

**Última actualización:** 2026-06-29 — validado contra código fuente

La solución incluye un proyecto de pruebas unitarias real: **`IMGA.UnitTests`**. Esta
sección documenta esa suite automatizada y consolida los planes de prueba manuales.

---

## Suite automatizada: `IMGA.UnitTests`

### Configuración del proyecto

- **Target:** `net10.0` **puro** (sin `-android`), por lo que **corre sin emulador**.
- **Stack:** `xunit` 2.9.3, `xunit.runner.visualstudio` 3.1.4, `Moq` 4.20.72,
  `FluentAssertions` 8.8.0, `Microsoft.NET.Test.Sdk` 17.14.1, `coverlet.collector` 6.0.4.
  Además `sqlite-net-pcl` 1.9.172 + `SQLitePCLRaw.bundle_green` 2.1.10 (para los atributos
  de los modelos enlazados), `System.IdentityModel.Tokens.Jwt`, `Newtonsoft.Json`.
- **Técnica clave:** como `IMGA` es `net10.0-android`, no se puede usar `ProjectReference`
  desde un test `net10.0`. En su lugar el `.csproj` **enlaza los archivos fuente
  testeables** con `<Compile Include="..\IMGA\..." ><Link>...</Link></Compile>`. Solo se
  enlazan clases que NO dependen de APIs de MAUI (modelos SQLite, interfaces,
  `RegistroOfflineService`, `SyncService`, `AuthenticationService`, sus modelos). El único
  punto MAUI de `SyncService`/`AuthenticationService` (SecureStorage) está abstraído tras
  `ISecureStorageService`, que se mockea.

### Cobertura por archivo (58 métodos `[Fact]`/`[Theory]`)

| Archivo | Tests | Qué cubre |
|---------|------:|-----------|
| `Services/AuthenticationServiceTests.cs` | 13 | Login (éxito/credenciales inválidas/error API), guardado de tokens y módulos en SecureStorage, logout, refresh token, expiración JWT, autenticación |
| `Services/SyncServiceTests.cs` | 9 | Sincronización de pendientes: POST nuevos / PUT editados, reintentos (máx 3) → estado Error, sin internet pospone, `SemaphoreSlim` anti-concurrencia, generación de notificaciones, refresh de token |
| `Services/RegistroOfflineServiceTests.cs` | 15 | CRUD offline en SQLite: crear/editar registros, estados de sync, validaciones, consultas de pendientes |
| `Models/RegistroProduccionLocalTests.cs` | 12 | Lógica del modelo SQLite: `TotalHuevos`, `PuedeEditarse`, `EsPendiente`, `EstaSincronizado`, conversiones `Estado`/`HoraRegistro` |
| `ViewModels/RegistroProduccionOfflineFlowTests.cs` | 9 | Flujo extremo a extremo crear-offline → sincronizar a nivel de orquestación |
| `TestHelpers/FlyoutModuleItemStub.cs` | — | Stub de apoyo para pruebas |

> Estilo: un assert por prueba, mocks con Moq, aserciones con FluentAssertions.

### Cómo ejecutarla

```bash
dotnet test IMGA.UnitTests/IMGA.UnitTests.csproj

# Con cobertura (coverlet)
dotnet test IMGA.UnitTests/IMGA.UnitTests.csproj --collect:"XPlat Code Coverage"
```

### Mapa de código — pruebas

| Concepto | Ruta real |
|----------|-----------|
| Proyecto de tests | `ICARUS_MOBILE/IMGA.UnitTests/IMGA.UnitTests.csproj` |
| Tests de servicios | `IMGA.UnitTests/Services/*.cs` |
| Tests de modelos | `IMGA.UnitTests/Models/*.cs` |
| Tests de flujo (VM) | `IMGA.UnitTests/ViewModels/*.cs` |
| Helpers | `IMGA.UnitTests/TestHelpers/*.cs` |

---

## Pruebas manuales (planes complementarios)

Los siguientes planes de prueba manual aplican a los submódulos de Gestión Avícola y
complementan la suite automatizada. Requieren la API ICARUS corriendo (local en
`http://localhost:5090` o producción) y un emulador/dispositivo Android.

### Pre-requisitos
- ICARUS.API en ejecución (puerto 5090 en desarrollo) con datos de prueba.
- Trabajador de prueba válido (ej. `ok3@icarus.com`) con galpones asociados a su cliente.
- IMGA compilada (Debug apunta a la API local; ver [05-AUTENTICACION-API.md](05-AUTENTICACION-API.md)).

### Plan A — Registro de Producción
ViewModels: `CrearRegistroProduccionViewModel`, `EditarRegistroProduccionViewModel`.
Verificar:
1. Carga de galpones según el cliente del trabajador (`GET .../galpones`).
2. Cálculos en tiempo real (Total huevos, eficiencia, % mortalidad).
3. Validaciones: galpón requerido, `UnidadesIncompletas < 30`, fecha no futura,
   causa/acciones de mortalidad si `GallinasMuertas > 0`, `CreadoPor` presente.
4. Creación correcta (`POST mobile/registro-produccion`) y edición (`PUT .../{id}`).
5. Comportamiento offline: crear sin internet persiste en SQLite y sincroniza luego.

### Plan B — Historial de Registros
ViewModel: `HistorialRegistrosViewModel`; converter `IsEditableDateConverter`.
Verificar:
1. Solo se muestran/editan registros de HOY (`PuedeEditarse`).
2. Agrupación por galpón y totales.
3. Pull-to-refresh y paginación (`historial?skip&take...`).
4. Restricción: solo se editan/eliminan registros propios.

### Plan C — Notificaciones / Tareas del día
ViewModel: `NotificacionesViewModel`.
Verificar:
1. Carga de tareas (`GET .../dia` y `.../pendientes`).
2. Filtro Pendientes/Todas.
3. Completar tarea (vacunación/iluminación/alimentación) y **auto-refresh** de la lista
   (orden: desactivar `IsLoading` → activar filtro → recargar → mostrar alerta).
4. Registro de quién completó cada tarea (email del trabajador).
5. Manejo de errores y estados vacíos.

> Estos planes consolidan en un único documento los antiguos planes de prueba manuales
> (registro de producción, historial, notificaciones y guía de ejecución), que fueron
> retirados de la carpeta.
