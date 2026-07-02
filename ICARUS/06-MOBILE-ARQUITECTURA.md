# 06 - Clientes móviles (IMGA / IMCA)

> **Última actualización:** 2026-06-29 — validado contra código fuente.

El ecosistema ICARUS tiene **dos aplicaciones móviles**, cada una en su propio repositorio y con
**documentación canónica propia**. Para evitar duplicación y desincronización, este documento **no**
reproduce su arquitectura: actúa como índice. Consulta siempre la documentación de cada app como fuente de verdad.

| App | Descripción | Stack real | Código | Documentación |
|-----|-------------|-----------|--------|---------------|
| **IMGA** | *Icarus Mobile Gestión Avícola* — registro de producción, despachos, pedidos de alimento, tareas (offline-first) | **.NET 10 MAUI** (`net10.0-android`, solo Android), CommunityToolkit.Mvvm, SQLite | `../../ICARUS_MOBILE/IMGA` | [`../IMGA/README.md`](../IMGA/README.md) |
| **IMCA** | *Icarus Mobile Control App* — control de acceso por reconocimiento facial en modo kiosco | **.NET 10 MAUI** (`net10.0-android` en la práctica), CommunityToolkit.Mvvm, SQLite, ONNX Runtime | `../../IMCA` | [`../IMCA/README.md`](../IMCA/README.md) |

> ⚠️ La versión real de ambas apps es **.NET 10** (verificado en sus `.csproj`). Cualquier referencia a
> ".NET 8" en documentación anterior es incorrecta.

## Relación con el backend ICARUS

Ambas apps son **clientes de `ICARUS.API`** vía JWT Bearer. El backend NO contiene código móvil; la
relación se materializa en:

- **Controllers móviles de la API** (`ICARUS.API/Controllers/Mobile/`): ver [`04-API-ENDPOINTS.md`](04-API-ENDPOINTS.md).
  - IMGA consume las rutas `api/mobile/*` (auth, registro-producción, contabilidad/despachos, contabilidad/pedidos, notificaciones, check-version).
  - IMCA consume las rutas `api/imca/*` (auth, trabajadores, biometría, fotos, registros/sincronizar-batch).
- **Reconocimiento facial**: IMCA delega en el microservicio **ARGOS** — ver [`11-ARGOS-RECONOCIMIENTO-FACIAL.md`](11-ARGOS-RECONOCIMIENTO-FACIAL.md).
- **Verificación de contratos**: `ICARUS.IntegrationTests` enlaza (vía `<Compile Link>`) los modelos del
  proyecto móvil IMGA para validar que los DTOs JSON del backend y de la app coinciden.

## Mapa de código (backend ↔ móvil)

| Concepto | Backend (ICARUS) | App móvil |
|----------|------------------|-----------|
| Autenticación móvil IMGA | `ICARUS.API/Controllers/Mobile/MobileAuthController.cs` | `ICARUS_MOBILE/IMGA/Core/Services/AuthenticationService.cs` |
| Autenticación / kiosco IMCA | `ICARUS.API/Controllers/Mobile/IMCAController.cs` | `IMCA/IMCA/Core/Services/AuthenticationService.cs` |
| Registro de producción | `ICARUS.API/Controllers/Mobile/RegistroProduccionMobileController.cs` | `ICARUS_MOBILE/IMGA/Modules/GestionAvicola/...` |
| Notificaciones de tareas | `ICARUS.API/Controllers/Mobile/MobileNotificacionesController.cs` | `ICARUS_MOBILE/IMGA/Modules/GestionAvicola/...` |
| Reconocimiento facial | repo independiente `dev/ARGOS` + `IMCAController` | `IMCA/IMCA/Core/Services/{ArgosService,FaceRecognitionService}.cs` |

Para arquitectura interna, modelos, sincronización offline, pruebas y diagramas de cada app, ir a sus
respectivas carpetas de documentación ([IMGA](../IMGA/README.md) · [IMCA](../IMCA/README.md)).
