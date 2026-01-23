# ICARUS MOBILE - Documentación de Arquitectura

## 📱 Información General

**Nombre**: ICARUS Mobile  
**Plataforma**: .NET MAUI (Android)  
**Framework**: .NET 8.0  
**Arquitectura**: MVVM (Model-View-ViewModel) con Clean Architecture  
**ID Aplicación**: `com.icarus.mobile`  
**Versión**: 1.0.0

---

## 🏗️ Arquitectura de la Aplicación

### Patrón Arquitectónico Principal

ICARUS Mobile implementa **MVVM (Model-View-ViewModel)** combinado con principios de **Clean Architecture**:

```
┌─────────────────────────────────────────────────────┐
│                      VIEWS                          │
│            (XAML + Code-behind mínimo)              │
└────────────────────┬────────────────────────────────┘
                     │ Data Binding
┌────────────────────▼────────────────────────────────┐
│                  VIEW MODELS                        │
│        (CommunityToolkit.Mvvm - MVVM Toolkit)       │
│    ObservableObject, RelayCommand, Properties       │
└────────────────────┬────────────────────────────────┘
                     │ Dependency Injection
┌────────────────────▼────────────────────────────────┐
│                   SERVICES                          │
│    (Interfaces + Implementaciones concretas)        │
│  - Authentication, Logging, API Communication       │
└────────────────────┬────────────────────────────────┘
                     │ DTOs
┌────────────────────▼────────────────────────────────┐
│                    MODELS                           │
│     (DTOs, Request/Response, Domain Models)         │
└─────────────────────────────────────────────────────┘
```

### Estructura de Carpetas

```
ICARUS_MOBILE/
│
├── Core/                              # Funcionalidades comunes
│   ├── Models/                        # DTOs y modelos compartidos
│   │   ├── LoginRequest.cs
│   │   ├── LoginResponse.cs
│   │   ├── ApiResponse.cs
│   │   ├── ModuleModel.cs
│   │   └── NotificacionResponse.cs
│   │
│   ├── Services/                      # Servicios de infraestructura
│   │   ├── Interfaces/
│   │   │   ├── IAuthenticationService.cs
│   │   │   ├── IEmulatorLoggingService.cs
│   │   │   ├── IModuleMenuService.cs
│   │   │   └── INotificacionesService.cs
│   │   │
│   │   ├── AuthenticationService.cs   # Autenticación JWT
│   │   ├── EmulatorLoggingService.cs  # Sistema de logs
│   │   ├── ModuleMenuService.cs       # Gestión de módulos
│   │   └── NotificacionesService.cs   # Tareas del día
│   │
│   ├── ViewModels/                    # ViewModels compartidos
│   │   ├── AppShellViewModel.cs
│   │   ├── LoginViewModel.cs
│   │   └── NotificacionesViewModel.cs
│   │
│   └── Views/                         # Views compartidas
│       ├── LoginPage.xaml
│       ├── HomePage.xaml
│       └── NotificacionesPage.xaml
│
├── Modules/                           # Módulos funcionales
│   │
│   ├── GestionAvicola/                # Módulo de gestión avícola
│   │   ├── Models/
│   │   │   ├── GalponModel.cs
│   │   │   ├── GrupoGalponModel.cs
│   │   │   ├── RegistroProduccionModel.cs
│   │   │   └── RegistroProduccionRequest.cs
│   │   │
│   │   ├── Services/
│   │   │   ├── IRegistroProduccionService.cs
│   │   │   └── RegistroProduccionService.cs
│   │   │
│   │   ├── ViewModels/
│   │   │   ├── WelcomeViewModel.cs
│   │   │   ├── CrearRegistroProduccionViewModel.cs
│   │   │   ├── EditarRegistroProduccionViewModel.cs
│   │   │   └── HistorialRegistrosViewModel.cs
│   │   │
│   │   └── Views/
│   │       ├── WelcomePage.xaml
│   │       ├── CrearRegistroProduccionPage.xaml
│   │       ├── EditarRegistroProduccionPage.xaml
│   │       └── HistorialRegistrosPage.xaml
│   │
│   └── ControlAcceso/                 # Módulo de control de acceso
│       ├── ViewModels/
│       │   ├── WelcomeControlAccesoViewModel.cs
│       │   ├── RegistrarAccesoViewModel.cs
│       │   └── HistorialAccesosViewModel.cs
│       │
│       └── Views/
│           ├── WelcomeControlAccesoView.xaml
│           ├── RegistrarAccesoPage.xaml
│           └── HistorialAccesosPage.xaml
│
├── Converters/                        # Value Converters para XAML
│   ├── BoolToColorConverter.cs
│   ├── BoolToExpandIconConverter.cs
│   ├── EfficiencyToColorConverter.cs
│   └── ... (otros converters)
│
├── LogsMobile/                        # Archivos de logs
│   └── logMobile.txt
│
├── Platforms/                         # Código específico de plataforma
│   ├── Android/
│   ├── iOS/
│   └── Windows/
│
├── Resources/                         # Recursos de la aplicación
│   ├── AppIcon/
│   ├── Fonts/
│   ├── Images/
│   └── Splash/
│
├── App.xaml                          # Aplicación principal
├── AppShell.xaml                     # Shell de navegación
└── MauiProgram.cs                    # Configuración de servicios (DI)
```

---

## 🔐 Sistema de Autenticación

### Flujo de Autenticación

1. **Login**: Usuario ingresa email y contraseña
2. **Validación**: Credenciales enviadas a API ICARUS
3. **Token JWT**: API retorna AccessToken y RefreshToken
4. **Almacenamiento**: Tokens guardados en `SecureStorage`
5. **Módulos**: API retorna módulos asignados al trabajador
6. **Navegación**: Shell configura tabs según módulos disponibles

### AuthenticationService

**Ubicación**: `Core/Services/AuthenticationService.cs`

**Responsabilidades**:
- Autenticación de trabajadores contra API
- Gestión de tokens JWT (Access y Refresh)
- Almacenamiento seguro de credenciales
- Renovación automática de tokens expirados
- Manejo de información del trabajador actual

**Métodos Principales**:
```csharp
Task<LoginResponse> LoginAsync(LoginRequest request)
Task<bool> LogoutAsync()
Task<string?> GetAccessTokenAsync()
Task<bool> RefreshTokenAsync()
Task<bool> IsAuthenticatedAsync()
Task<WorkerInfo?> GetCurrentWorkerInfoAsync()
```

**Almacenamiento Seguro**:
```csharp
SecureStorage:
- "icarus_access_token"      // Token JWT
- "icarus_refresh_token"     // Token de renovación
- "icarus_worker_info"       // Información del trabajador
- "icarus_assigned_modules"  // Módulos asignados
```

---

## 📝 Sistema de Logging

### EmulatorLoggingService

**Ubicación**: `Core/Services/EmulatorLoggingService.cs`

**Características**:
- **Canal asíncrono**: Usa `System.Threading.Channels` para logging sin bloqueo
- **Persistencia**: Logs almacenados en archivo `logMobile.txt`
- **Categorización**: Logs organizados por categoría
- **Niveles**: Info, Debug, Error, Warning
- **Thread-safe**: Procesamiento en background sin bloquear UI
- **Capacidad**: Buffer de 1000 logs con política DropOldest

**Arquitectura del Sistema de Logs**:
```
┌─────────────────────────────────────────────────────┐
│              THREAD PRINCIPAL (UI)                  │
│                                                     │
│  await _loggingService.LogInfoAsync("mensaje")     │
└────────────────────┬────────────────────────────────┘
                     │ (No bloquea)
                     ▼
┌─────────────────────────────────────────────────────┐
│           BOUNDED CHANNEL (1000 logs)               │
│              Queue: LogEntry[]                      │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│           BACKGROUND WORKER TASK                    │
│       ProcessLogQueueAsync(CancellationToken)       │
│                                                     │
│  - Lee del canal continuamente                     │
│  - Formatea log con timestamp                      │
│  - Escribe a archivo asíncrono                     │
│  - Serializa JSON si hay additionalData            │
└─────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│          ARCHIVO: logMobile.txt                     │
│                                                     │
│  [2024-12-08 10:15:23] [INFO] [Category]           │
│  Mensaje del log                                   │
│  Data: { "key": "value" }                          │
└─────────────────────────────────────────────────────┘
```

**Métodos de Logging**:
```csharp
// Información general
await _loggingService.LogInfoAsync("mensaje", "Category", additionalData);

// Depuración técnica
await _loggingService.LogDebugAsync("mensaje", "Debug", additionalData);

// Errores con excepción
await _loggingService.LogErrorAsync("mensaje", "Error", exception, additionalData);

// Advertencias
await _loggingService.LogWarnAsync("mensaje", "Warning", additionalData);
```

**Ubicación de Logs**:
- **Android**: `FileSystem.AppDataDirectory/LogsMobile/logMobile.txt`
- **Windows**: `{ProjectDirectory}/LogsMobile/logMobile.txt`

**Funciones Adicionales**:
```csharp
// Obtener logs almacenados
Task<IEnumerable<string>> GetStoredLogsAsync(string? category = null, int maxEntries = 100)

// Limpiar logs de sesión actual
Task ClearCurrentSessionLogsAsync()

// Obtener ruta del archivo
string GetLogFilePath()
```

**CRÍTICO**: Según instrucciones, **SIEMPRE** usar `IEmulatorLoggingService` en toda la aplicación MAUI para máxima cobertura de depuración.

---

## 🌐 Comunicación con API

### Configuración de HttpClient

**MauiProgram.cs** configura el cliente HTTP con patrón nombrado:

```csharp
// HttpClient nombrado "IcarusAPI"
builder.Services.AddHttpClient("IcarusAPI", client =>
{
    client.BaseAddress = new Uri(GetApiBaseUrl());
    client.Timeout = TimeSpan.FromSeconds(30);
    client.DefaultRequestHeaders.Add("User-Agent", "ICARUS-Mobile/1.0");
});

// Inyección transitoria
builder.Services.AddTransient<HttpClient>(provider =>
{
    IHttpClientFactory factory = provider.GetRequiredService<IHttpClientFactory>();
    return factory.CreateClient("IcarusAPI");
});
```

### URLs de API según Entorno

```csharp
// DEBUG (Desarrollo local)
if (isEmulator)
{
    // Emulador Android apunta a localhost del PC
    return "http://10.0.2.2:5090/api/";
}
else
{
    // Dispositivo físico usa IP local del PC en WiFi
    return "http://192.168.1.102:5090/api/";
}

// RELEASE (Producción)
return "https://api.facturas.trajano.online/api/";
```

### Estructura de Respuestas API

**ApiResponse<T>** - Respuesta estándar:
```csharp
public class ApiResponse<T>
{
    public bool IsSuccess { get; set; }
    public T? Data { get; set; }
    public string? ErrorMessage { get; set; }
    public int StatusCode { get; set; }
    public string? ErrorDetails { get; set; }
    
    // Métodos estáticos
    static ApiResponse<T> Success(T data, int statusCode = 200)
    static ApiResponse<T> Error(string errorMessage, int statusCode = 500, string? errorDetails = null)
}
```

**LoginResponse** - Respuesta de autenticación:
```csharp
public class LoginResponse
{
    public string AccessToken { get; set; }          // Token JWT
    public string TokenType { get; set; }            // "Bearer"
    public int ExpiresIn { get; set; }               // Segundos
    public string? RefreshToken { get; set; }        // Token renovación
    public WorkerInfo Worker { get; set; }           // Info trabajador
    public List<ModuleModel> AssignedModules { get; set; }  // Módulos
    public bool IsSuccess { get; set; }
    public string Message { get; set; }
}
```

---

## 🎯 Módulos Funcionales

### Sistema de Módulos Dinámico

**ModuleMenuService** gestiona la configuración del menú según permisos:

```csharp
// Módulos disponibles por ID
1: Control de Acceso
2: Gestión Avícola
3: Facturación (futuro)
```

**Flujo de Módulos**:
1. Login exitoso retorna `AssignedModules`
2. `ModuleMenuService.UpdateAssignedModules(modules)`
3. `AppShell` muestra tabs según módulos disponibles
4. Usuario selecciona módulo en `HomePage`
5. Shell navega a TabBar correspondiente

### Módulo: Gestión Avícola

**Objetivo**: Registro de producción diaria de huevos y mortalidad de gallinas.

**Modelos**:

```csharp
// GalponModel - Representa un galpón
public class GalponModel
{
    public int Id { get; set; }
    public string Nombre { get; set; }
    public int NumeroGalpon { get; set; }
    public int CantidadActual { get; set; }
    public string Estado { get; set; }
    public int? GrupoGalponId { get; set; }
    public GrupoGalponModel? GrupoGalpon { get; set; }
}

// RegistroProduccionModel - Registro diario
public class RegistroProduccionModel
{
    public int Id { get; set; }
    public DateTime Fecha { get; set; }
    public TimeSpan HoraRegistro { get; set; }
    public int GalponId { get; set; }
    public GalponModel? Galpon { get; set; }
    public int CantidadMaples { get; set; }        // 1 maple = 30 huevos
    public int UnidadesIncompletas { get; set; }
    public int GallinasMuertas { get; set; }
    public decimal PorcentajeMortalidad { get; set; }
    public decimal EficienciaProduccion { get; set; }
    public string? Observaciones { get; set; }
    public string? CausaProbableMortalidad { get; set; }
    public string? AccionesTomadasMortalidad { get; set; }
    
    // Propiedad calculada
    public int TotalHuevos => (CantidadMaples * 30) + UnidadesIncompletas;
}
```

**Servicios**:

```csharp
// IRegistroProduccionService
Task<ApiResponse<List<GalponModel>>> GetGalponesDisponiblesAsync()
Task<ApiResponse<RegistroProduccionModel>> CreateRegistroAsync(RegistroProduccionRequest request)
Task<ApiResponse<RegistroProduccionModel>> UpdateRegistroAsync(int id, RegistroProduccionRequest request)
Task<ApiResponse<bool>> DeleteRegistroAsync(int id)
Task<ApiResponse<HistorialResponse>> GetHistorialRegistrosAsync(int pageNumber, int pageSize, int? galponId, DateTime? fechaInicio, DateTime? fechaFin)
```

**ViewModels**:
- `WelcomeViewModel`: Pantalla inicial del módulo
- `CrearRegistroProduccionViewModel`: Crear nuevo registro
- `EditarRegistroProduccionViewModel`: Editar registro existente
- `HistorialRegistrosViewModel`: Ver historial con paginación

**Flujo de Registro de Producción**:
```
1. Usuario accede a "Crear Registro"
2. ViewModel carga lista de galpones disponibles
3. Usuario selecciona galpón y fecha
4. Ingresa datos: Maples, Unidades, Gallinas Muertas
5. ViewModel calcula: Total Huevos, Mortalidad %, Eficiencia %
6. Usuario agrega observaciones opcionales
7. Submit → API crea registro → Navegación a historial
```

### Módulo: Control de Acceso

**Objetivo**: Registro de entrada/salida de trabajadores.

**ViewModels**:
- `WelcomeControlAccesoViewModel`: Pantalla inicial
- `RegistrarAccesoViewModel`: Registrar acceso biométrico/manual
- `HistorialAccesosViewModel`: Ver historial de accesos

---

## 🧩 Inyección de Dependencias

### Configuración en MauiProgram.cs

**Servicios de Infraestructura**:
```csharp
// Singleton - Una instancia para toda la app
builder.Services.AddSingleton<IEmulatorLoggingService, EmulatorLoggingService>();
builder.Services.AddSingleton<IModuleMenuService, ModuleMenuService>();
builder.Services.AddSingleton<INotificacionesService, NotificacionesService>();
builder.Services.AddSingleton<AppShell>();
builder.Services.AddSingleton<App>();

// Scoped - Una instancia por scope/request
builder.Services.AddScoped<IAuthenticationService, AuthenticationService>();
builder.Services.AddScoped<IRegistroProduccionService, RegistroProduccionService>();

// Transient - Nueva instancia cada vez
builder.Services.AddTransient<LoginViewModel>();
builder.Services.AddTransient<WelcomeViewModel>();
builder.Services.AddTransient<CrearRegistroProduccionViewModel>();
// ... (todos los ViewModels y Views)
```

**Resolución en ViewModels**:
```csharp
public partial class LoginViewModel : ObservableObject
{
    private readonly IAuthenticationService _authenticationService;
    private readonly IEmulatorLoggingService _loggingService;

    public LoginViewModel(
        IAuthenticationService authenticationService,
        IEmulatorLoggingService loggingService)
    {
        _authenticationService = authenticationService ?? throw new ArgumentNullException(nameof(authenticationService));
        _loggingService = loggingService ?? throw new ArgumentNullException(nameof(loggingService));
    }
}
```

---

## 🎨 Sistema de Navegación (Shell)

### AppShell Estructura

**AppShell.xaml** define navegación con tabs dinámicos:

```xml
<Shell FlyoutBehavior="Disabled" TabBarIsVisible="False">
    
    <!-- LOGIN INICIAL -->
    <ShellContent Title="Login" 
                  ContentTemplate="{DataTemplate coreViews:LoginPage}" 
                  Shell.TabBarIsVisible="False" />

    <!-- MÓDULO: GESTIÓN AVÍCOLA -->
    <TabBar x:Name="GestionAvicolaTabBar" 
            Route="GestionAvicolaTabBar"
            IsVisible="False">
        <ShellContent Title="Bienvenida" Icon="house" Route="welcome" />
        <ShellContent Title="Tareas" Icon="list_alt" Route="notificaciones" />
        <ShellContent Title="Crear" Icon="plus" Route="crear" />
        <ShellContent Title="Historial" Icon="history" Route="historial" />
    </TabBar>

    <!-- MÓDULO: CONTROL DE ACCESO -->
    <TabBar x:Name="ControlAccesoTabBar" 
            Route="ControlAccesoTabBar"
            IsVisible="False">
        <ShellContent Title="Bienvenida" Icon="house" />
        <ShellContent Title="Registrar" Icon="login" />
        <ShellContent Title="Historial" Icon="history" />
    </TabBar>

    <!-- SELECTOR DE MÓDULOS -->
    <ShellContent x:Name="ModuleSelectorContent"
                  Route="home"
                  ContentTemplate="{DataTemplate coreViews:HomePage}"
                  IsVisible="False" />
</Shell>
```

### Flujo de Navegación

```
┌──────────────────────────────────────────────────────┐
│                   LoginPage                          │
│   Usuario ingresa email y contraseña                │
└────────────────────┬─────────────────────────────────┘
                     │ Login exitoso
                     ▼
┌──────────────────────────────────────────────────────┐
│                  HomePage                            │
│   Selector de módulos disponibles                   │
│   (Basado en AssignedModules)                       │
└──────┬──────────────────────────┬────────────────────┘
       │                          │
       │ Selecciona               │ Selecciona
       │ "Gestión Avícola"        │ "Control Acceso"
       ▼                          ▼
┌──────────────────┐      ┌──────────────────┐
│ TabBar Gestión   │      │ TabBar Control   │
│ - Welcome        │      │ - Welcome        │
│ - Tareas         │      │ - Registrar      │
│ - Crear          │      │ - Historial      │
│ - Historial      │      │                  │
└──────────────────┘      └──────────────────┘
```

**Navegación Programática**:
```csharp
// Navegar a módulo específico
await Shell.Current.GoToAsync("//GestionAvicolaTabBar");

// Navegar con parámetros
await Shell.Current.GoToAsync($"EditarRegistroProduccionPage?registroId={id}");

// Navegar a raíz
await Shell.Current.GoToAsync("//LoginShellContent");
```

---

## 🔄 Value Converters

**Ubicación**: `Converters/`

Los converters transforman datos para visualización en XAML:

```csharp
// BoolToColorConverter - Convierte bool a color
true → Color Verde (#4CAF50)
false → Color Rojo (#F44336)

// EfficiencyToColorConverter - Color según eficiencia
>= 80% → Verde (#4CAF50)
60-80% → Naranja (#FF9800)
< 60% → Rojo (#F44336)

// BoolToExpandIconConverter - Iconos de expansión
true → "expand_less"
false → "expand_more"

// NumberToBoolConverter - Validación numérica
> 0 → true
<= 0 → false

// StringToColorConverter - Estado a color
"Activo" → Verde
"Inactivo" → Gris
"Pendiente" → Naranja
```

**Uso en XAML**:
```xml
<ContentPage.Resources>
    <converters:BoolToColorConverter x:Key="BoolToColor"/>
    <converters:EfficiencyToColorConverter x:Key="EfficiencyToColor"/>
</ContentPage.Resources>

<Label Text="{Binding EficienciaProduccion}" 
       TextColor="{Binding EficienciaProduccion, Converter={StaticResource EfficiencyToColor}}" />
```

---

## 📦 Dependencias NuGet

**Paquetes Principales**:

```xml
<!-- MAUI Community Toolkit -->
<PackageReference Include="CommunityToolkit.Maui" Version="X.X.X" />
<PackageReference Include="CommunityToolkit.Mvvm" Version="X.X.X" />

<!-- Serialización JSON -->
<PackageReference Include="Newtonsoft.Json" Version="13.X.X" />

<!-- Autenticación JWT -->
<PackageReference Include="System.IdentityModel.Tokens.Jwt" Version="X.X.X" />

<!-- HTTP Client Factory -->
<PackageReference Include="Microsoft.Extensions.Http" Version="X.X.X" />

<!-- Material Icons (Android) -->
<!-- Recursos en Resources/Images/ -->
```

---

## 🔧 Configuración de Compilación

### Propiedades del Proyecto

```xml
<!-- Solo Android -->
<TargetFrameworks>net8.0-android</TargetFrameworks>
<TargetFrameworkVersion>v15.0</TargetFrameworkVersion>

<!-- Versión -->
<ApplicationDisplayVersion>1.0.0</ApplicationDisplayVersion>
<ApplicationVersion>1</ApplicationVersion>

<!-- API mínima: Android 5.0 (Lollipop) -->
<SupportedOSPlatformVersion>21.0</SupportedOSPlatformVersion>
```

### Configuración DEBUG

```xml
<!-- Depuración completa -->
<AndroidEnableProfiledAot>false</AndroidEnableProfiledAot>
<EmbedAssembliesIntoApk>true</EmbedAssembliesIntoApk>
<AndroidLinkMode>None</AndroidLinkMode>
<AndroidUseSharedRuntime>false</AndroidUseSharedRuntime>
<AndroidFastDeploymentType>None</AndroidFastDeploymentType>
<AndroidEnableDebugging>true</AndroidEnableDebugging>
```

### Configuración RELEASE

```xml
<!-- Standalone APK sin optimizaciones agresivas -->
<AndroidPackageFormat>apk</AndroidPackageFormat>
<AndroidLinkMode>None</AndroidLinkMode>
<AndroidEnableProfiledAot>false</AndroidEnableProfiledAot>
<EmbedAssembliesIntoApk>true</EmbedAssembliesIntoApk>
<PublishTrimmed>false</PublishTrimmed>
```

---

## 📐 Principios de Diseño

### SOLID Principles

**S - Single Responsibility**: Cada servicio tiene una responsabilidad única
- `AuthenticationService`: Solo autenticación
- `EmulatorLoggingService`: Solo logging
- `RegistroProduccionService`: Solo operaciones de producción

**O - Open/Closed**: Extensible mediante interfaces
- `IAuthenticationService` permite múltiples implementaciones
- Nuevos módulos se agregan sin modificar código existente

**L - Liskov Substitution**: Interfaces bien definidas
- Cualquier implementación de `IEmulatorLoggingService` es intercambiable

**I - Interface Segregation**: Interfaces específicas
- No hay interfaces "god" con muchos métodos innecesarios

**D - Dependency Inversion**: Inversión de control
- ViewModels dependen de abstracciones (interfaces)
- Inyección de dependencias en MauiProgram.cs

### DRY (Don't Repeat Yourself)

- Servicios compartidos en `Core/Services/`
- Modelos base y DTOs reutilizables
- Converters centralizados

### KISS (Keep It Simple, Stupid)

- Estructura clara y predecible
- Nombres descriptivos sin abreviaciones
- Lógica de negocio en servicios, no en ViewModels

---

## 🛡️ Manejo de Errores

### Principio: Programación Defensiva

**NUNCA usar Try-Catch** para lógica de negocio, operaciones de DB local o cálculos.

**SOLO Try-Catch para**:
- Operaciones HTTP/API (red, servidor caído, timeout)
- Deserialización JSON de fuentes externas
- Operaciones I/O de archivos

**Validaciones Previas**:
```csharp
// ❌ INCORRECTO
try
{
    int result = CalculateEfficiency(data);
}
catch (Exception ex)
{
    // Manejo genérico
}

// ✅ CORRECTO
if (data == null)
{
    await _loggingService.LogErrorAsync("Data es nulo", "Calculation");
    return ApiResponse<int>.Error("Datos inválidos");
}

if (data.CantidadActual <= 0)
{
    await _loggingService.LogErrorAsync($"Cantidad inválida: {data.CantidadActual}", "Calculation");
    return ApiResponse<int>.Error("Cantidad debe ser mayor a 0");
}

// Después de validar, ejecutar lógica
int result = CalculateEfficiency(data);
```

### Validación con Null-Conditional Operator

```csharp
// Validación defensiva con ?
string? nombre = trabajador?.NombreCompleto?.Trim();

// PERO si ya validaste, no usar ? redundantemente
if (trabajador != null)
{
    string nombre = trabajador.NombreCompleto; // No usar trabajador?.NombreCompleto
}
```

---

## 📊 Modelo de Datos

### DTOs vs Domain Models

**DTOs (Data Transfer Objects)**: Para comunicación con API
```csharp
// LoginRequest.cs
public class LoginRequest
{
    public string Email { get; set; }
    public string Password { get; set; }
}
```

**Domain Models**: Lógica de negocio y cálculos
```csharp
// RegistroProduccionModel.cs
public class RegistroProduccionModel
{
    // Propiedades con cálculos
    public int TotalHuevos => (CantidadMaples * 30) + UnidadesIncompletas;
    
    public string EficienciaTexto
    {
        get
        {
            if (EficienciaProduccion >= 80)
                return "Excelente";
            else if (EficienciaProduccion >= 60)
                return "Buena";
            else
                return "Baja";
        }
    }
}
```

---

## 🎯 Convenciones de Código

### Nombrado

```csharp
// Interfaces: I{Nombre}
public interface IAuthenticationService { }

// Campos privados: _camelCase
private readonly ILogger _logger;

// Propiedades: PascalCase
public string FullName { get; set; }

// Métodos async: TerminarEnAsync
public async Task<bool> LoginAsync() { }

// ViewModels: {Nombre}ViewModel
public class LoginViewModel { }

// DTOs: {Nombre}Dto o {Nombre}Request/Response
public class LoginRequest { }
```

### Uso de var

```csharp
// ❌ NUNCA para tipos built-in
var count = 5;
var name = "John";

// ✅ CORRECTO
int count = 5;
string name = "John";

// ✅ SOLO cuando tipo es aparente
var customer = new Customer();
var result = await _service.GetDataAsync();
```

### This Qualifier

```csharp
// ✅ SIEMPRE usar this. para calificar
public class LoginViewModel
{
    private readonly IAuthenticationService _authService;
    
    public async Task LoginAsync()
    {
        await this._authService.LoginAsync();
        this.IsLoading = true;
    }
}
```

### Logging Obligatorio

```csharp
// SIEMPRE indicar clase y método en logs
await _loggingService.LogInfoAsync(
    "LoginViewModel.LoginAsync - Iniciando autenticación", 
    "Authentication"
);

await _loggingService.LogErrorAsync(
    "LoginViewModel.LoginAsync - Error de autenticación",
    "Authentication",
    exception
);
```

---

## 🚀 Flujo de Ejecución Completo

### Inicio de la Aplicación

```
1. PROGRAM START
   └─> MauiProgram.CreateMauiApp()
       ├─> ConfigureLogging()
       ├─> RegisterInfrastructureServices()
       │   ├─> AddSingleton<IEmulatorLoggingService>
       │   ├─> AddHttpClient("IcarusAPI")
       │   ├─> AddScoped<IAuthenticationService>
       │   └─> AddScoped<IRegistroProduccionService>
       ├─> RegisterViewsAndViewModels()
       │   ├─> AddTransient<LoginViewModel>
       │   ├─> AddTransient<LoginPage>
       │   └─> ... (todos los ViewModels/Views)
       └─> builder.Build()

2. APP INITIALIZATION
   └─> App.xaml.cs Constructor
       ├─> InitializeComponent()
       └─> MainPage = AppShell (desde DI)

3. APPSHELL LOAD
   └─> AppShell.xaml
       ├─> LoginShellContent (visible)
       └─> TabBars (ocultos inicialmente)

4. LOGIN PAGE DISPLAYED
   └─> LoginPage cargado
       └─> LoginViewModel inyectado
```

### Flujo de Login

```
1. Usuario ingresa credenciales
   └─> LoginViewModel.Email, Password (two-way binding)

2. Click en "Iniciar Sesión"
   └─> LoginViewModel.LoginCommand ejecutado
       ├─> Validaciones:
       │   ├─> Email no vacío?
       │   ├─> Password no vacío?
       │   └─> [Format válido]
       │
       ├─> IsLoading = true
       │
       ├─> await _authService.LoginAsync(request)
       │   └─> AuthenticationService.LoginAsync()
       │       ├─> Serialize LoginRequest a JSON
       │       ├─> POST http://api/mobile/auth/login
       │       ├─> Deserialize LoginResponse
       │       ├─> await SecureStorage.SetAsync("icarus_access_token", token)
       │       ├─> await SecureStorage.SetAsync("icarus_worker_info", workerJson)
       │       └─> _moduleMenuService.UpdateAssignedModules(modules)
       │
       ├─> loginResponse.IsSuccess?
       │   ├─> SÍ:
       │   │   ├─> AppShellViewModel.ConfigureForModule(modules)
       │   │   ├─> AppShell muestra HomePage
       │   │   └─> await Shell.Current.GoToAsync("//home")
       │   │
       │   └─> NO:
       │       ├─> ErrorMessage = loginResponse.Message
       │       └─> HasError = true
       │
       └─> IsLoading = false
```

### Flujo de Navegación Post-Login

```
1. HomePage mostrado
   └─> Muestra módulos disponibles (AssignedModules)
       ├─> Card "Gestión Avícola" (si tiene permiso)
       └─> Card "Control de Acceso" (si tiene permiso)

2. Usuario selecciona "Gestión Avícola"
   └─> NavigateToModuleCommand("GestionAvicolaTabBar")
       ├─> AppShellViewModel.NavigateToModule(moduleId: 2)
       │   ├─> ModuleMenuService.GetModuleNavigation(2)
       │   └─> return "GestionAvicolaTabBar"
       │
       ├─> AppShell.ShowModule("GestionAvicolaTabBar")
       │   ├─> GestionAvicolaTabBar.IsVisible = true
       │   ├─> ControlAccesoTabBar.IsVisible = false
       │   └─> LoginShellContent oculto
       │
       └─> await Shell.Current.GoToAsync("//GestionAvicolaTabBar")

3. TabBar de Gestión Avícola visible
   └─> Tabs disponibles:
       ├─> Welcome (inicial)
       ├─> Tareas
       ├─> Crear
       └─> Historial
```

### Flujo de Creación de Registro

```
1. Tab "Crear" seleccionado
   └─> CrearRegistroProduccionPage cargado
       └─> CrearRegistroProduccionViewModel inicializado

2. ViewModel.OnAppearing()
   └─> await LoadGalponesAsync()
       ├─> await _registroService.GetGalponesDisponiblesAsync()
       │   ├─> Autenticación válida?
       │   ├─> GET http://api/mobile/registro-produccion/galpones
       │   ├─> Authorization: Bearer {token}
       │   └─> Deserialize List<GalponModel>
       │
       └─> Galpones.Clear() + AddRange(response.Data)

3. Usuario ingresa datos
   ├─> SelectedGalpon (Picker)
   ├─> SelectedFecha (DatePicker)
   ├─> CantidadMaples (Entry)
   ├─> UnidadesIncompletas (Entry)
   └─> GallinasMuertas (Entry)

4. ViewModel calcula automáticamente (PropertyChanged)
   ├─> TotalHuevos = (CantidadMaples * 30) + UnidadesIncompletas
   ├─> PorcentajeMortalidad = (GallinasMuertas / CantidadActual) * 100
   └─> EficienciaProduccion = (TotalHuevos / CantidadActual) * 100

5. Click "Guardar"
   └─> CrearRegistroCommand ejecutado
       ├─> Validaciones:
       │   ├─> SelectedGalpon != null?
       │   ├─> CantidadMaples >= 0?
       │   └─> [Validaciones adicionales]
       │
       ├─> RegistroProduccionRequest request = new()
       │   {
       │       GalponId = SelectedGalpon.Id,
       │       Fecha = SelectedFecha,
       │       CantidadMaples = CantidadMaples,
       │       // ... otros campos
       │   }
       │
       ├─> await _registroService.CreateRegistroAsync(request)
       │   └─> RegistroProduccionService.CreateRegistroAsync()
       │       ├─> Serialize request a JSON
       │       ├─> POST http://api/mobile/registro-produccion
       │       ├─> Authorization: Bearer {token}
       │       └─> Deserialize ApiResponse<RegistroProduccionModel>
       │
       ├─> response.IsSuccess?
       │   ├─> SÍ:
       │   │   ├─> await DisplayAlert("Éxito", "Registro creado")
       │   │   └─> await Shell.Current.GoToAsync("//historial")
       │   │
       │   └─> NO:
       │       └─> await DisplayAlert("Error", response.ErrorMessage)
       │
       └─> IsSubmitting = false
```

---

## 🔍 Depuración y Diagnóstico

### Logs en Consola de Visual Studio

```csharp
System.Diagnostics.Debug.WriteLine("Mensaje de depuración");
```

### Logs en Archivo Persistente

```csharp
await _loggingService.LogInfoAsync("LoginViewModel.LoginAsync - Mensaje", "Category");
```

**Ubicación del archivo**: `LogsMobile/logMobile.txt`

### Estructura de Log

```
[2024-12-08 10:15:23 UTC] [INFO] [Authentication]
LoginViewModel.LoginAsync - Iniciando proceso de autenticación

[2024-12-08 10:15:24 UTC] [DEBUG] [RegistroProduccion]
RegistroProduccionService.GetGalponesDisponiblesAsync - Galpones obtenidos: 5
Data: {"count":5,"galponIds":[1,2,3,4,5]}

[2024-12-08 10:15:30 UTC] [ERROR] [Authentication]
LoginViewModel.LoginAsync - Error de autenticación
Exception: System.Net.Http.HttpRequestException: Connection refused
   at ICARUS_MOBILE.Core.Services.AuthenticationService.LoginAsync()
```

### Verificar Logs durante Ejecución

```csharp
// En cualquier ViewModel o Service
string logPath = _loggingService.GetLogFilePath();
System.Diagnostics.Debug.WriteLine($"Logs en: {logPath}");

// Leer logs
IEnumerable<string> logs = await _loggingService.GetStoredLogsAsync("Authentication", 50);
foreach (string log in logs)
{
    System.Diagnostics.Debug.WriteLine(log);
}
```

---

## 📚 Referencias y Recursos

### Documentación Oficial

- **.NET MAUI**: https://learn.microsoft.com/dotnet/maui/
- **MVVM Toolkit**: https://learn.microsoft.com/dotnet/communitytoolkit/mvvm/
- **MAUI Community Toolkit**: https://learn.microsoft.com/dotnet/communitytoolkit/maui/

### Patrones y Arquitectura

- **Clean Architecture**: Robert C. Martin
- **SOLID Principles**: Principios de diseño orientado a objetos
- **MVVM Pattern**: Model-View-ViewModel para separación de responsabilidades

### API Backend

- **ICARUS API**: Proyecto .NET 8 Web API
- **Documentación**: Ver `c:\Users\desarrollo\source\repos\NETCORE\ICARUS\.github\copilot-instructions.md`
- **Endpoints Base**: `/api/mobile/`

---

## 🔄 Ciclo de Vida de la Aplicación

### Eventos del Ciclo de Vida

```csharp
// App.xaml.cs
protected override void OnStart()
{
    // App iniciada
}

protected override void OnSleep()
{
    // App en background
}

protected override void OnResume()
{
    // App retorna de background
}
```

### Ciclo de Vida de Páginas

```csharp
// ContentPage
protected override void OnAppearing()
{
    // Página visible - cargar datos
    base.OnAppearing();
    await ViewModel.LoadDataAsync();
}

protected override void OnDisappearing()
{
    // Página oculta - liberar recursos
    base.OnDisappearing();
    ViewModel.Cleanup();
}
```

---

## 🔐 Seguridad

### Almacenamiento Seguro de Tokens

- **SecureStorage**: Tokens JWT almacenados de forma segura
- **Android**: Usa KeyStore system para encriptación
- **Rotación de Tokens**: RefreshToken para renovar AccessToken expirado

### Validación de Certificados SSL

```csharp
// RELEASE: Usa HTTPS con certificado Let's Encrypt válido
"https://api.facturas.trajano.online/api/"

// DEBUG: HTTP sin certificado (solo desarrollo local)
"http://10.0.2.2:5090/api/"
```

### Manejo de Datos Sensibles

- **Nunca** almacenar contraseñas en texto plano
- **Nunca** loggear tokens completos
- **Siempre** usar HTTPS en producción

---

## 📈 Métricas y Monitoreo

### Logs Categorizados

```csharp
// Categorías estándar
"Authentication"    // Login, logout, tokens
"Navigation"        // Cambios de pantalla
"API"               // Llamadas HTTP
"RegistroProduccion" // Operaciones de producción
"Error"             // Errores generales
"Warning"           // Advertencias
"Debug"             // Depuración técnica
```

### Información de Dispositivo

```csharp
// Detectar dispositivo
DeviceInfo.Current.Model         // "sdk_gphone_x86" o nombre real
DeviceInfo.Current.Manufacturer  // "Google", "Samsung", etc.
DeviceInfo.Current.Platform      // DevicePlatform.Android
DeviceInfo.Current.VersionString // "13.0" (Android 13)
```

---

## 🛠️ Herramientas de Desarrollo

### Visual Studio 2022

- **Android Emulator**: SDK configurado en `Directory.Build.props`
- **Hot Reload**: Soportado para XAML y C#
- **Debugger**: Breakpoints en ViewModels y Services

### SDK y Herramientas

```xml
<!-- Directory.Build.props -->
<AndroidSdkDirectory>C:\Users\desarrollo\AppData\Local\Android\Sdk</AndroidSdkDirectory>
<MSBuildSDKsPath>C:\Program Files\dotnet\sdk\8.0.414\Sdks</MSBuildSDKsPath>
```

---

## ✅ Checklist de Desarrollo

### Al Crear Nuevo Módulo

- [ ] Crear carpeta en `Modules/{NombreModulo}/`
- [ ] Definir Models (DTOs y Domain Models)
- [ ] Crear interfaz de servicio en `Services/I{Nombre}Service.cs`
- [ ] Implementar servicio con logging y validaciones
- [ ] Crear ViewModels con MVVM Toolkit
- [ ] Diseñar Views en XAML con DataBinding
- [ ] Registrar servicios en `MauiProgram.cs`
- [ ] Agregar TabBar en `AppShell.xaml`
- [ ] Configurar navegación en `ModuleMenuService`
- [ ] Agregar módulo en base de datos backend
- [ ] Probar flujo completo: Login → Navegación → CRUD

### Al Modificar Código Existente

- [ ] Mantener principios SOLID
- [ ] Usar `this.` para calificadores
- [ ] Nunca usar `var` para tipos built-in
- [ ] Agregar logs con `IEmulatorLoggingService`
- [ ] Validaciones defensivas sin Try-Catch
- [ ] Documentar métodos complejos con summaries
- [ ] Probar en emulador y dispositivo físico

---

## 🔄 Flujos Funcionales Principales

### Flujo 1: Autenticación y Login

```
1. Usuario ingresa email y contraseña en LoginPage
2. LoginViewModel.LoginCommand ejecuta
3. AuthenticationService.LoginAsync() llama API
   - POST /api/auth/login
4. API valida credenciales y retorna JWT + WorkerInfo
5. AuthenticationService guarda en SecureStorage:
   - auth_token (JWT)
   - worker_id, worker_name, worker_email, worker_role
6. Navegación automática a HomePage
7. AppShell carga módulos según permisos del trabajador
```

### Flujo 2: Crear Registro de Producción

```
1. Usuario navega a "Registrar Producción"
2. CrearRegistroProduccionViewModel.CargarGalponesAsync()
   - GET /api/mobile/galpones → Lista de galpones activos
3. Usuario selecciona galpón y completa formulario:
   - Cantidad de maples (30 huevos cada uno)
   - Huevos sueltos
   - Gallinas muertas
4. Usuario presiona "Guardar"
5. ViewModel.GuardarRegistroAsync() ejecuta:
   a. Obtiene email del trabajador desde IAuthenticationService
   b. Crea CreateRegistroProduccionRequest con CreadoPor
   c. RegistroProduccionService.CrearAsync() llama API
      - POST /api/mobile/registro-produccion/crear
   d. API valida y guarda en base de datos
   e. Retorna HTTP 201 Created con datos del registro
6. UI muestra mensaje de éxito
7. Navega a historial de registros
```

**Campos críticos**:
- `CreadoPor`: Email del trabajador autenticado (obligatorio)
- `FechaRegistro`: Fecha actual
- `TotalHuevos`: (CantidadMaples * 30) + UnidadesIncompletas

### Flujo 3: Completar Tarea con Auto-Refresh

Este es el flujo más importante para entender la UX de completado de tareas:

```
1. Usuario navega a "Notificaciones" o "Tareas del Día"
2. NotificacionesViewModel.CargarTareasAsync() ejecuta:
   - Si MostrarSoloPendientes == true:
     GET /api/mobile/notificaciones/pendientes
   - Si MostrarSoloPendientes == false:
     GET /api/mobile/notificaciones/dia
   - API retorna NotificacionResponse con 3 listas:
     * TareasVacunacion
     * TareasIluminacion  
     * TareasAlimentacion
3. ObservableCollection se actualiza en MainThread
4. UI muestra tarjetas de tareas agrupadas por tipo

--- COMPLETAR TAREA ---

5. Usuario toca botón "Completar" en una tarea (ej: vacunación)
6. ViewModel muestra confirmación con datos de la tarea
7. Usuario confirma "Sí"
8. CompletarTareaVacunacionAsync() ejecuta:
   a. IsLoading = true (muestra spinner)
   b. Obtiene email del trabajador desde IAuthenticationService
   c. Crea CompletarTareaRequestDto con:
      - GalponTareaVacunacionId
      - GalponId
      - CronogramaVacunacionId
      - CompletadaPor (email del trabajador)
      - Observaciones
   d. NotificacionesService.CompletarTareaVacunacionAsync() llama API
      - POST /api/mobile/notificaciones/vacunacion/completar
   e. API valida, marca tarea como completada, retorna HTTP 200 OK
   
--- AUTO-REFRESH (CRÍTICO PARA UX) ---

   f. IsLoading = false (permite que CargarTareasAsync se ejecute)
   g. MostrarSoloPendientes = true (activa filtro de pendientes)
   h. CargarTareasAsync() se ejecuta automáticamente:
      - Verifica guard clause: if (IsLoading) return; ✅ pasa porque IsLoading=false
      - IsLoading = true (nuevo ciclo de carga)
      - GET /api/mobile/notificaciones/pendientes
      - ObservableCollection se actualiza en MainThread
      - UI se refresca automáticamente mostrando solo pendientes
      - IsLoading = false
   i. UI muestra alerta "Tarea completada exitosamente"

9. Usuario ve la vista actualizada SIN tarea completada
10. Usuario continúa completando otras tareas pendientes
```

**Orden crítico en CompletarTarea**:
```csharp
if (resultado)
{
    // 1. PRIMERO: Desactivar IsLoading
    this.IsLoading = false;  // ✅ Permite que CargarTareasAsync se ejecute
    
    // 2. SEGUNDO: Activar filtro y recargar
    this.MostrarSoloPendientes = true;
    await this.CargarTareasAsync();  // ✅ Ahora SÍ se ejecuta porque IsLoading=false
    
    // 3. TERCERO: Mostrar alert
    await Application.Current.MainPage.DisplayAlert(...);
}
```

**¿Por qué este orden?**
- `CargarTareasAsync()` tiene guard clause: `if (this.IsLoading) return;`
- Si `IsLoading = false` está DESPUÉS de `CargarTareasAsync()`, el método retorna inmediatamente sin hacer nada
- Resultado: UI NO se actualiza, usuario debe refrescar manualmente

### Flujo 4: Editar Registro de Producción

```
1. Usuario navega a "Historial de Registros"
2. HistorialRegistrosViewModel.CargarHistorialAsync()
   - GET /api/mobile/registro-produccion/historial?galponId={id}
3. Usuario toca "Editar" en un registro
4. Navega a EditarRegistroProduccionPage con registro
5. Usuario modifica datos (ej: cantidad de maples)
6. Usuario presiona "Guardar Cambios"
7. EditarRegistroProduccionViewModel.GuardarCambiosAsync():
   a. Obtiene email del trabajador desde IAuthenticationService
   b. Crea UpdateRegistroProduccionRequest con CreadoPor
   c. RegistroProduccionService.ActualizarAsync() llama API
      - PUT /api/mobile/registro-produccion/actualizar
   d. API valida y actualiza registro
   e. Campo ModificadoPor se actualiza en base de datos
8. UI muestra mensaje de éxito
9. Regresa a historial con datos actualizados
```

### Flujo 5: Navegación con Módulos Dinámicos

```
1. Usuario autenticado en HomePage
2. AppShellViewModel.CargarModulosAsync() ejecuta:
   - ModuleMenuService.GetModulesForWorkerAsync()
   - GET /api/mobile/modules → Lista de módulos con permisos
3. Cada módulo se renderiza como tarjeta en HomePage
4. Usuario toca módulo "Gestión Avícola"
5. Navegación a WelcomePage del módulo
6. WelcomePage muestra opciones del módulo:
   - Registrar Producción
   - Ver Historial
   - Consultar Galpones
7. Usuario selecciona opción
8. Navega a la vista específica del módulo
```

---

## 🎓 Guías de Aprendizaje

### Para Nuevos Desarrolladores

1. **Entender MVVM**: Leer código de `LoginViewModel` y `LoginPage`
2. **Inyección de Dependencias**: Revisar `MauiProgram.cs`
3. **Navegación Shell**: Analizar `AppShell.xaml` y flujos
4. **Servicios HTTP**: Estudiar `AuthenticationService` y `RegistroProduccionService`
5. **Logging**: Usar `IEmulatorLoggingService` en todo el código
6. **Validaciones**: Ver ejemplos en ViewModels (programación defensiva)
7. **Auto-Refresh**: Estudiar `NotificacionesViewModel.CompletarTarea*` para entender orden correcto

### Flujo de Trabajo Recomendado

```
1. Analizar requisito funcional
2. Diseñar modelos (DTOs + Domain)
3. Crear interfaz de servicio
4. Implementar servicio con logging
5. Diseñar ViewModel con commands
6. Crear View en XAML con binding
7. Registrar en DI (MauiProgram)
8. Probar en emulador
9. Depurar con logs
10. Probar en dispositivo físico
```

---

## 📞 Contacto y Soporte

**Proyecto**: ICARUS - Sistema Empresarial Modular  
**Repositorio**: [GitHub - luicahleo/ICARUS](https://github.com/luicahleo/ICARUS)  
**Backend**: .NET 8 Web API con Clean Architecture  
**Mobile**: .NET MAUI para Android

---

## 📝 Notas Finales

Esta documentación cubre la arquitectura completa de ICARUS Mobile. Para detalles específicos de implementación, revisar:

- **MauiProgram.cs**: Configuración de servicios
- **AppShell.xaml**: Estructura de navegación
- **Core/Services/**: Implementaciones de servicios
- **Modules/**: Módulos funcionales específicos
- **Converters/**: Value Converters para XAML

**Fecha de última actualización**: Diciembre 8, 2025
