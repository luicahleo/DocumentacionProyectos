# IMGA — Icarus Mobile Gestión Avícola

**Última actualización:** 2026-06-29 — validado contra código fuente

Aplicación móvil **.NET MAUI (solo Android)** del ecosistema ICARUS. Permite a los
trabajadores avícolas registrar producción de huevos, mortalidad, despachos, pedidos
de alimento y completar tareas (vacunación, iluminación, alimentación) desde el campo,
**con soporte offline-first** (SQLite local + sincronización automática con el backend
ICARUS cuando hay conexión).

> Esta documentación está optimizada para ser leída por humanos y por agentes de IA.
> Cada documento incluye tablas "Mapa de código" (concepto → ruta real) y diagramas
> Mermaid. Las rutas son relativas a `ICARUS_MOBILE/IMGA/`.

---

## Índice

| Documento | Contenido |
|-----------|-----------|
| [01-ARQUITECTURA.md](01-ARQUITECTURA.md) | MVVM + offline-first, DI en `MauiProgram`, navegación Shell/Flyout, converters |
| [02-MODELO-DATOS.md](02-MODELO-DATOS.md) | Modelos `Core/Models`, modelos SQLite, enums, modelos de GestionAvicola, diagrama de clases |
| [03-MODULO-GESTION-AVICOLA.md](03-MODULO-GESTION-AVICOLA.md) | Submódulos: Producción, Despachos, Pedidos, Balance, Tareas. Módulo ControlAcceso (stub) |
| [04-SINCRONIZACION-OFFLINE.md](04-SINCRONIZACION-OFFLINE.md) | SyncService, ConnectivityService, RegistroOfflineService, CacheSyncService, AppUpdateService |
| [05-AUTENTICACION-API.md](05-AUTENTICACION-API.md) | AuthenticationService, JWT, HttpClient `IcarusAPI`, SecureStorage, endpoints |
| [06-PRUEBAS.md](06-PRUEBAS.md) | Suite `IMGA.UnitTests` (xUnit/Moq/FluentAssertions) + planes de prueba manuales |

---

## Stack técnico real

| Elemento | Valor |
|----------|-------|
| Framework | **.NET 10** — `TargetFrameworks = net10.0-android` (SOLO Android) |
| MAUI | `Microsoft.Maui.Controls` 10.0.10 (+ `.Compatibility` 10.0.10) |
| App ID | `com.icarus.imga` |
| Título / Versión | ICARUS · DisplayVersion 1.0.0 · Version 9 |
| OS mínimo | Android API 21 (Android 5.0 Lollipop) |
| MVVM | `CommunityToolkit.Mvvm` 8.4.0 |
| UI toolkit | `CommunityToolkit.Maui` 13.0.0 |
| Gráficos | `SkiaSharp.Views.Maui.Controls` 3.119.0 |
| Serialización | `Newtonsoft.Json` 13.0.3 (no usa System.Text.Json) |
| JWT | `System.IdentityModel.Tokens.Jwt` 8.1.0 |
| HTTP | `Microsoft.Extensions.Http` 10.0.0 (IHttpClientFactory) |
| Base de datos local | `sqlite-net-pcl` 1.9.172 + `SQLitePCLRaw.bundle_green` 2.1.10 |
| Configuración | `Microsoft.Extensions.Configuration.Json` 10.0.0 |
| Logging | `Microsoft.Extensions.Logging.Debug` 10.0.0 |

**Base de datos local:** `imga_local.db3` en `FileSystem.AppDataDirectory`, gestionada por
`LocalDatabaseService` (singleton). 4 tablas: `SesionTrabajador`, `GalponesCache`,
`RegistrosProduccion`, `NotificacionesSync`.

**URL de API por entorno** (`MauiProgram.GetApiBaseUrl()`):

| Entorno | URL base |
|---------|----------|
| DEBUG · emulador Android | `http://10.0.2.2:5090/api/` |
| DEBUG · dispositivo físico | `http://192.168.0.106:5090/api/` |
| RELEASE · producción (VPS) | `https://api.icarus.trajano.online/api/` |

---

## Mapa de carpetas (real)

```
ICARUS_MOBILE/
├── IMGA/                                # Proyecto MAUI (net10.0-android)
│   ├── MauiProgram.cs                   # Composición raíz: DI, HttpClient, startup
│   ├── App.xaml(.cs) / AppShell.xaml(.cs)
│   ├── Core/
│   │   ├── Data/                        # SQLite: servicio, repositorios, modelos, interfaces
│   │   ├── Models/                      # DTOs compartidos (Login, ApiResponse, Module...)
│   │   ├── Services/                    # Servicios de infraestructura + interfaces
│   │   ├── ViewModels/                  # AppShellViewModel, LoginViewModel
│   │   └── Views/                       # LoginPage, HomePage, FlyoutHeaderView
│   ├── Modules/
│   │   ├── GestionAvicola/              # Módulo real: Models, Services, ViewModels, Views
│   │   └── ControlAcceso/              # Módulo STUB (sin API, sin biometría)
│   ├── Converters/                      # 17 archivos de value converters XAML
│   ├── Helpers/                         # ImageHelper
│   ├── Resources/                       # Estilos, fuentes, imágenes, splash, raw
│   └── Platforms/                       # Android (y carpeta Windows residual)
└── IMGA.UnitTests/                      # Tests xUnit (net10.0 puro, sin emulador)
```

---

## Cómo compilar y ejecutar

Requisitos: SDK de .NET 10 con la carga de trabajo MAUI (`dotnet workload install maui-android`)
y el Android SDK (API 21+). El proyecto **solo compila para Android**.

```bash
# Compilar (Debug, contra API local)
dotnet build IMGA/IMGA.csproj -f net10.0-android

# Ejecutar en emulador o dispositivo conectado
dotnet build IMGA/IMGA.csproj -t:Run -f net10.0-android

# Empaquetado de producción (Release genera un AAB firmado)
dotnet publish IMGA/IMGA.csproj -c Release -f net10.0-android
```

- **Release** produce un **AAB** (`AndroidPackageFormat=aab`) firmado con el keystore
  `icarus-mobile.keystore` (alias `icarus-key`).
- En Debug, la app apunta a la API local; el flag `USE_PRODUCTION_IN_DEBUG` (en
  `MauiProgram.cs`) permite probar contra producción sin cambiar a Release.

### Ejecutar las pruebas

```bash
dotnet test IMGA.UnitTests/IMGA.UnitTests.csproj
```

Las pruebas corren en `net10.0` puro (sin emulador). Ver [06-PRUEBAS.md](06-PRUEBAS.md).
