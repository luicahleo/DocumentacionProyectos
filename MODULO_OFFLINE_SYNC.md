# Módulo Offline Sync — IMGA (ICARUS Mobile Gestión Avícola)

## Descripción General

Este módulo implementa una arquitectura **offline-first** para el registro de producción avícola en la aplicación móvil IMGA. Permite que los trabajadores de campo operen **sin conexión a internet**, con sincronización automática y transparente cuando se recupera la conectividad.

---

## Tecnologías

| Componente | Tecnología |
|-----------|-----------|
| Base de datos local | SQLite via `sqlite-net-pcl` |
| Framework UI | .NET MAUI + CommunityToolkit.Mvvm |
| Conectividad | `Microsoft.Maui.Networking.Connectivity` |
| HTTP | `HttpClient` + `IHttpClientFactory` |
| Autenticación | JWT (Access Token 12h + Refresh Token 30d) |
| Inyección de Dependencias | `Microsoft.Extensions.DependencyInjection` |

---

## Estructura de Carpetas

```
IMGA/
├── Core/
│   ├── Data/
│   │   ├── Interfaces/
│   │   │   ├── ILocalDatabaseService.cs
│   │   │   ├── IRegistroLocalRepository.cs
│   │   │   ├── IGalponLocalRepository.cs
│   │   │   ├── ISesionLocalRepository.cs
│   │   │   └── INotificacionSyncRepository.cs
│   │   ├── Models/
│   │   │   ├── EstadoSync.cs
│   │   │   ├── TipoNotificacionSync.cs
│   │   │   ├── RegistroProduccionLocal.cs
│   │   │   ├── GalponLocal.cs
│   │   │   ├── SesionTrabajadorLocal.cs
│   │   │   └── NotificacionSyncLocal.cs
│   │   ├── LocalDatabaseService.cs
│   │   ├── RegistroLocalRepository.cs
│   │   ├── GalponLocalRepository.cs
│   │   ├── SesionLocalRepository.cs
│   │   └── NotificacionSyncRepository.cs
│   └── Services/
│       ├── Interfaces/
│       │   ├── ICacheSyncService.cs
│       │   ├── IRegistroOfflineService.cs
│       │   ├── IConnectivityService.cs
│       │   └── ISyncService.cs
│       ├── CacheSyncService.cs
│       ├── RegistroOfflineService.cs
│       ├── ConnectivityService.cs
│       ├── SyncService.cs
│       └── Models/
│           └── ResultadoSync.cs
├── Converters/
│   ├── EstadoSyncToColorConverter.cs
│   ├── EstadoSyncToIconConverter.cs
│   ├── TipoNotificacionToColorConverter.cs
│   └── CommonConverters.cs
└── Modules/GestionAvicola/
    ├── ViewModels/
    │   └── SyncNotificacionesViewModel.cs
    └── Views/
        ├── SyncNotificacionesPage.xaml
        └── SyncNotificacionesPage.xaml.cs
```

---

## Ciclo de Vida de un Registro

### Estados (EstadoSync)

| Estado | Valor | Descripción |
|--------|-------|-------------|
| `Pendiente` | 0 | Creado offline, esperando sincronización |
| `Sincronizando` | 1 | Sincronización en progreso |
| `Sincronizado` | 2 | Confirmado por el servidor |
| `Error` | 3 | Falló después de 3 reintentos |
| `PendienteEdicion` | 4 | Ya sincronizado, editado localmente |

### Flujo

```
[Crear] → Pendiente → [Internet] → Sincronizando → Sincronizado ✓
                                                  → Error ✗ (reintento)
                                                  
[Editar sincronizado] → PendienteEdicion → [Internet] → Sincronizado ✓
```

---

## Configuración de DI

Todos los servicios se registran en `MauiProgram.RegisterOfflineServices()`:

```csharp
// Singleton: una instancia durante toda la vida de la app
builder.Services.AddSingleton<ILocalDatabaseService, LocalDatabaseService>();
builder.Services.AddSingleton<IConnectivityService, ConnectivityService>();
builder.Services.AddTransient<ISyncService, SyncService>();

// Transient: nueva instancia por inyección
builder.Services.AddTransient<IRegistroLocalRepository, RegistroLocalRepository>();
builder.Services.AddTransient<IGalponLocalRepository, GalponLocalRepository>();
builder.Services.AddTransient<ISesionLocalRepository, SesionLocalRepository>();
builder.Services.AddTransient<INotificacionSyncRepository, NotificacionSyncRepository>();
builder.Services.AddTransient<ICacheSyncService, CacheSyncService>();
builder.Services.AddTransient<IRegistroOfflineService, RegistroOfflineService>();
```

---

## Caché de Datos al Login

Al iniciar sesión exitosamente, **`LoginViewModel.LoginAsync()`** invoca `CacheSyncService.SincronizarDatosInicialesAsync()`:

1. **Sesión del trabajador**: Se guarda `SesionTrabajadorLocal` con TrabajadorId, Email, Nombre, ClienteId y GranjaId extraídos del JWT.
2. **Galpones**: Se descargan via API y se reemplazan atómicamente en SQLite (transacción).

> **Nota de arquitectura**: `ICacheSyncService` **no** se inyecta directamente en `LoginViewModel`. Se resuelve de forma diferida vía `IServiceProvider.GetRequiredService<ICacheSyncService>()` para evitar una dependencia circular en el contenedor de DI:
> ```
> LoginViewModel → IAuthenticationService (AuthenticationService)
>                                    ↕  ciclo si ICacheSyncService fuera inyectado
> ICacheSyncService (CacheSyncService) → IRegistroProduccionService → IAuthenticationService
> ```
> El `ICacheSyncService` se resuelve únicamente en el momento post-login, cuando ya se necesita.

Al hacer **logout**, `AuthenticationService.LogoutAsync()` llama a `ISesionLocalRepository.LimpiarSesionAsync()` para limpiar la sesión SQLite local.

---

## Sincronización Automática

### Trigger
`ConnectivityService` monitorea los eventos de `Connectivity.Current.ConnectivityChanged`. Al detectar internet:

```
ConectividadCambio(true) → SyncService.SincronizarPendientesAsync()
```

### Lógica de SyncService
1. Obtiene todos los registros con estado `Pendiente` o `PendienteEdicion`
2. Para cada registro:
   - **Pendiente** → `POST /mobile/registroproduccion`
   - **PendienteEdicion** → `PUT /mobile/registroproduccion/{idServidor}`
3. Si el JWT ha expirado, intenta refresh automático
4. Máximo **3 reintentos** antes de marcar como `Error`
5. Emite eventos de progreso (`ProgresoSync`) para actualizar la UI

### Reintentos
```
Intento 1 → Fallo → NumeroIntentos = 1
Intento 2 → Fallo → NumeroIntentos = 2  
Intento 3 → Fallo → Estado = Error, ErrorSync = "mensaje"
```

---

## Seguridad

| Dato | Almacenamiento |
|------|---------------|
| Access Token (JWT) | `SecureStorage` (existente) |
| Refresh Token | `SecureStorage` (existente) |
| Sesión trabajador (nombre, email, ids) | SQLite local |
| Galpones (caché) | SQLite local |
| Registros de producción | SQLite local |

La base de datos SQLite se almacena en el directorio privado de la app (`FileSystem.AppDataDirectory`), inaccesible a otras apps en Android.

---

## Paquetes NuGet Requeridos

```xml
<PackageReference Include="sqlite-net-pcl" Version="1.9.172" />
<PackageReference Include="SQLitePCLRaw.bundle_green" Version="2.1.11" />
```

---

## Notas de Implementación

1. **N registros por galpón/día**: El servidor permite múltiples registros por galpón y fecha (uno por visita). No hay límite de 1 registro por galpón/día.
2. **Thread Safety**: `LocalDatabaseService` usa `SemaphoreSlim(1,1)` para inicialización thread-safe.
3. **Transacciones atómicas**: Las operaciones de caché (reemplazar galpones, guardar sesión) usan `RunInTransactionAsync` para evitar estados intermedios.
4. **No bloquea al usuario**: La sincronización se ejecuta en background sin interrumpir la operación del trabajador.
