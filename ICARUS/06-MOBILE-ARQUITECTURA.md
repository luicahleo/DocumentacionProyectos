# 06 - ICARUS_MOBILE - Aplicación .NET MAUI

## Resumen Ejecutivo

**ICARUS_MOBILE** es la aplicación móvil multiplataforma construida con .NET MAUI para Android/iOS. Permite a trabajadores registrar producción avícola, control de acceso y recibir notificaciones de tareas.

### Estadísticas

| Métrica | Valor |
|---------|-------|
| **Framework** | .NET MAUI (.NET 8.0) |
| **Patrón** | MVVM con CommunityToolkit.Mvvm |
| **Plataformas** | Android (primaria), iOS (futuro) |
| **Arquitectura** | Clean Architecture modular |
| **ViewModels** | 10+ ViewModels |
| **Services** | 6 servicios principales |
| **Módulos** | 2 (GestionAvicola, ControlAcceso) |
| **Autenticación** | JWT (ICARUS.API) |
| **Storage** | SecureStorage para tokens |
| **Logging** | EmulatorLoggingService |

---

## Arquitectura MVVM

### Diagrama de Capas

```
┌─────────────────────────────────────────────────────┐
│                  VIEWS (XAML)                       │
│      Pages, Controls, Data Binding                  │
└────────────────────┬────────────────────────────────┘
                     │ Data Binding
┌────────────────────▼────────────────────────────────┐
│              VIEW MODELS                            │
│    CommunityToolkit.Mvvm (ObservableObject)         │
│    Properties, Commands, State Management           │
└────────────────────┬────────────────────────────────┘
                     │ Dependency Injection
┌────────────────────▼────────────────────────────────┐
│                 SERVICES                            │
│  Authentication, API, Logging, Notifications        │
└────────────────────┬────────────────────────────────┘
                     │ DTOs/Models
┌────────────────────▼────────────────────────────────┐
│         MODELS (DTOs, Requests, Responses)          │
└─────────────────────────────────────────────────────┘
```

---

## Estructura de Carpetas

```
ICARUS_MOBILE/
├── Core/                          # Funcionalidades comunes
│   ├── Models/                    # DTOs compartidos
│   │   ├── LoginRequest.cs
│   │   ├── LoginResponse.cs
│   │   ├── ApiResponse.cs
│   │   ├── ModuleModel.cs
│   │   └── NotificacionResponse.cs
│   │
│   ├── Services/                  # Servicios de infraestructura
│   │   ├── Interfaces/
│   │   │   ├── IAuthenticationService.cs
│   │   │   ├── IEmulatorLoggingService.cs
│   │   │   ├── IModuleMenuService.cs
│   │   │   └── INotificacionesService.cs
│   │   │
│   │   ├── AuthenticationService.cs        # Login, JWT
│   │   ├── EmulatorLoggingService.cs       # Logging a archivo
│   │   ├── ModuleMenuService.cs            # Gestión menú módulos
│   │   └── NotificacionesService.cs        # Tareas del día
│   │
│   ├── ViewModels/                # ViewModels compartidos
│   │   ├── AppShellViewModel.cs
│   │   ├── LoginViewModel.cs
│   │   └── NotificacionesViewModel.cs
│   │
│   └── Views/                     # Views compartidas
│       ├── LoginPage.xaml
│       ├── HomePage.xaml
│       └── NotificacionesPage.xaml
│
├── Modules/                       # Módulos funcionales
│   ├── GestionAvicola/            # Registro producción avícola
│   │   ├── Models/
│   │   │   ├── GalponModel.cs
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
│   └── ControlAcceso/             # Control de acceso biométrico
│       ├── ViewModels/
│       │   ├── WelcomeControlAccesoViewModel.cs
│       │   ├── RegistrarAccesoViewModel.cs
│       │   └── HistorialAccesosViewModel.cs
│       │
│       └── Views/
│           ├── WelcomeControlAccesoPage.xaml
│           ├── RegistrarAccesoPage.xaml
│           └── HistorialAccesosPage.xaml
│
├── Converters/                    # Value Converters XAML
│   ├── BoolToColorConverter.cs
│   ├── BoolToExpandIconConverter.cs
│   ├── EfficiencyToColorConverter.cs
│   └── IsNotNullConverter.cs
│
├── LogsMobile/                    # Logs de la aplicación
│   └── logMobile.txt
│
├── Platforms/                     # Código específico plataforma
│   ├── Android/
│   │   ├── MainActivity.cs
│   │   └── AndroidManifest.xml
│   ├── iOS/
│   └── Windows/
│
├── Resources/                     # Assets estáticos
│   ├── AppIcon/
│   ├── Fonts/
│   ├── Images/
│   └── Splash/
│
├── App.xaml                      # Aplicación MAUI
├── AppShell.xaml                 # Shell de navegación
└── MauiProgram.cs                # Configuración DI
```

---

## MauiProgram.cs - Dependency Injection

### Configuración de Servicios

```csharp
public static MauiApp CreateMauiApp()
{
    // Configurar cultura española
    CultureInfo culturaEspañola = new CultureInfo("es-ES");
    CultureInfo.DefaultThreadCurrentCulture = culturaEspañola;
    CultureInfo.DefaultThreadCurrentUICulture = culturaEspañola;

    MauiAppBuilder builder = MauiApp.CreateBuilder();
    
    builder
        .UseMauiApp<App>()
        .UseMauiCommunityToolkit()
        .ConfigureFonts(fonts =>
        {
            fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
            fonts.AddFont("OpenSans-Semibold.ttf", "OpenSansSemibold");
        });

    // Configurar logging
    ConfigureLogging(builder);

    // Registrar servicios de infraestructura
    RegisterInfrastructureServices(builder);

    // Registrar ViewModels y Views
    RegisterViewsAndViewModels(builder);

    return builder.Build();
}
```

### Registro de Servicios

```csharp
private static void RegisterInfrastructureServices(MauiAppBuilder builder)
{
    // HttpClient para comunicación con API
    builder.Services.AddSingleton<HttpClient>(sp =>
    {
        HttpClient httpClient = new HttpClient();
        
#if DEBUG
        // Emulador Android usa 10.0.2.2 para localhost
        httpClient.BaseAddress = new Uri("http://10.0.2.2:5090/api/");
#else
        httpClient.BaseAddress = new Uri("https://api.icarus.com/api/");
#endif
        
        httpClient.Timeout = TimeSpan.FromSeconds(30);
        return httpClient;
    });

    // Servicios Singleton
    builder.Services.AddSingleton<IEmulatorLoggingService, EmulatorLoggingService>();
    builder.Services.AddSingleton<IAuthenticationService, AuthenticationService>();
    builder.Services.AddSingleton<IModuleMenuService, ModuleMenuService>();
    builder.Services.AddSingleton<INotificacionesService, NotificacionesService>();
    
    // Servicios Scoped (por módulo)
    builder.Services.AddScoped<IRegistroProduccionService, RegistroProduccionService>();
}

private static void RegisterViewsAndViewModels(MauiAppBuilder builder)
{
    // Core
    builder.Services.AddSingleton<LoginPage>();
    builder.Services.AddSingleton<LoginViewModel>();
    builder.Services.AddSingleton<HomePage>();
    builder.Services.AddSingleton<AppShellViewModel>();
    
    // Gestión Avícola
    builder.Services.AddTransient<CrearRegistroProduccionPage>();
    builder.Services.AddTransient<CrearRegistroProduccionViewModel>();
    builder.Services.AddTransient<HistorialRegistrosPage>();
    builder.Services.AddTransient<HistorialRegistrosViewModel>();
    
    // Control Acceso
    builder.Services.AddTransient<RegistrarAccesoPage>();
    builder.Services.AddTransient<RegistrarAccesoViewModel>();
}
```

---

## Autenticación JWT

### AuthenticationService

**Propósito**: Gestiona login, tokens JWT y SecureStorage

**Características**:
- Login contra `/api/mobile/auth/login`
- Almacenamiento seguro de tokens (SecureStorage)
- Extracción de claims del JWT
- Refresh token (futuro)
- Sincronización de módulos asignados

**Código Principal**:

```csharp
public async Task<LoginResponse> LoginAsync(LoginRequest loginRequest)
{
    // Validaciones defensivas
    if (string.IsNullOrWhiteSpace(loginRequest?.Email) || 
        string.IsNullOrWhiteSpace(loginRequest?.Password))
    {
        return CreateErrorResponse("Email y contraseña son requeridos");
    }

    await _loggingService.LogInfoAsync($"Login para: {loginRequest.Email}", "Auth");

    // Enviar credenciales a API
    string jsonContent = JsonConvert.SerializeObject(loginRequest);
    StringContent content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

    HttpResponseMessage response = await _httpClient.PostAsync("mobile/auth/login", content);

    if (response.IsSuccessStatusCode)
    {
        string responseContent = await response.Content.ReadAsStringAsync();
        LoginResponse? apiResponse = JsonConvert.DeserializeObject<LoginResponse>(responseContent);

        if (apiResponse != null && !string.IsNullOrWhiteSpace(apiResponse.AccessToken))
        {
            // Almacenar tokens en SecureStorage
            await SecureStorage.SetAsync("icarus_access_token", apiResponse.AccessToken);
            await SecureStorage.SetAsync("icarus_refresh_token", apiResponse.RefreshToken);
            
            // Guardar información del trabajador
            string workerJson = JsonConvert.SerializeObject(apiResponse.TrabajadorInfo);
            await SecureStorage.SetAsync("icarus_worker_info", workerJson);

            // Actualizar módulos asignados
            await SyncModulesFromTokenAsync(apiResponse.AccessToken);

            return apiResponse;
        }
    }

    return CreateErrorResponse("Credenciales inválidas");
}

public async Task<bool> IsAuthenticatedAsync()
{
    string? token = await SecureStorage.GetAsync("icarus_access_token");
    
    if (string.IsNullOrWhiteSpace(token))
        return false;

    // Validar que el token no esté expirado
    JwtSecurityTokenHandler tokenHandler = new JwtSecurityTokenHandler();
    JwtSecurityToken? jwtToken = tokenHandler.ReadToken(token) as JwtSecurityToken;

    if (jwtToken?.ValidTo < DateTime.UtcNow)
    {
        await LogoutAsync();
        return false;
    }

    return true;
}

public async Task LogoutAsync()
{
    // Limpiar SecureStorage
    SecureStorage.Remove("icarus_access_token");
    SecureStorage.Remove("icarus_refresh_token");
    SecureStorage.Remove("icarus_worker_info");
    SecureStorage.Remove("icarus_assigned_modules");

    await _loggingService.LogInfoAsync("Usuario ha cerrado sesión", "Auth");
}
```

### Flujo de Autenticación

```
┌────────────┐
│ LoginPage  │
└──────┬─────┘
       │ 1. User ingresa credentials
       ▼
┌────────────────────┐
│ LoginViewModel     │
│ LoginCommand       │
└──────┬─────────────┘
       │ 2. Validar inputs
       ▼
┌──────────────────────────┐
│ AuthenticationService    │
│ LoginAsync()             │
└──────┬───────────────────┘
       │ 3. POST /api/mobile/auth/login
       ▼
┌──────────────────────────┐
│ ICARUS.API               │
│ MobileAuthController     │
└──────┬───────────────────┘
       │ 4. Validar credenciales
       │ 5. Generar JWT
       ▼
┌──────────────────────────┐
│ LoginResponse            │
│ - AccessToken (JWT)      │
│ - RefreshToken           │
│ - TrabajadorInfo         │
│ - ClienteInfo            │
│ - AssignedModules        │
└──────┬───────────────────┘
       │ 6. Almacenar en SecureStorage
       ▼
┌──────────────────────────┐
│ AppShell                 │
│ Navegación a HomePage    │
└──────────────────────────┘
```

---

## ViewModels con CommunityToolkit.Mvvm

### LoginViewModel

**Características**:
- Hereda de `ObservableObject`
- Properties con `[ObservableProperty]`
- Commands con `[RelayCommand]`
- Validación de inputs
- Manejo de estados (IsLoading, HasError)

```csharp
public partial class LoginViewModel : ObservableObject
{
    private readonly IAuthenticationService _authenticationService;
    private readonly IEmulatorLoggingService _loggingService;

    [ObservableProperty]
    private string email = string.Empty;

    [ObservableProperty]
    private string password = string.Empty;

    [ObservableProperty]
    private bool rememberMe = false;

    [ObservableProperty]
    private bool isLoading = false;

    [ObservableProperty]
    private string errorMessage = string.Empty;

    [ObservableProperty]
    private bool hasError = false;

    [ObservableProperty]
    private bool isPasswordVisible = false;

    // Computed property
    public bool IsNotLoading => !IsLoading;

    public string EnvironmentName =>
#if DEBUG
        "DEVELOPMENT";
#else
        "PRODUCTION";
#endif

    [RelayCommand]
    private async Task LoginAsync()
    {
        // Resetear estado
        HasError = false;
        ErrorMessage = string.Empty;

        // Validar inputs
        if (string.IsNullOrWhiteSpace(Email) || string.IsNullOrWhiteSpace(Password))
        {
            ErrorMessage = "Por favor ingrese email y contraseña";
            HasError = true;
            return;
        }

        IsLoading = true;

        try
        {
            LoginRequest request = new LoginRequest
            {
                Email = Email.Trim(),
                Password = Password
            };

            LoginResponse response = await _authenticationService.LoginAsync(request);

            if (response.IsSuccess)
            {
                await _loggingService.LogInfoAsync("Login exitoso", "LoginViewModel");
                
                // Navegar a HomePage
                await Shell.Current.GoToAsync("//HomePage");
            }
            else
            {
                ErrorMessage = response.ErrorMessage ?? "Error al iniciar sesión";
                HasError = true;
            }
        }
        catch (Exception ex)
        {
            ErrorMessage = "Error de conexión. Verifique su red.";
            HasError = true;
            await _loggingService.LogErrorAsync($"Error en login: {ex.Message}", "LoginViewModel");
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private void TogglePasswordVisibility()
    {
        IsPasswordVisible = !IsPasswordVisible;
    }
}
```

### CrearRegistroProduccionViewModel

**Responsabilidades**:
- Cargar lista de galpones disponibles
- Validar datos de entrada (fechas, cantidades)
- Calcular total de huevos automáticamente
- Enviar registro a API
- Navegación de retorno

```csharp
public partial class CrearRegistroProduccionViewModel : ObservableObject
{
    private readonly IRegistroProduccionService _registroService;
    private readonly IEmulatorLoggingService _loggingService;

    [ObservableProperty]
    private ObservableCollection<GalponModel> galpones = new();

    [ObservableProperty]
    private GalponModel? galponSeleccionado;

    [ObservableProperty]
    private DateTime fechaProduccion = DateTime.Today;

    [ObservableProperty]
    private int cantidadMaples;

    [ObservableProperty]
    private int unidadesIncompletas;

    [ObservableProperty]
    private int totalHuevos;

    [ObservableProperty]
    private int mortalidad;

    [ObservableProperty]
    private decimal alimento;

    [ObservableProperty]
    private string observaciones = string.Empty;

    [ObservableProperty]
    private bool isLoading;

    [ObservableProperty]
    private bool isSaving;

    // Computed property
    public int TotalHuevosCalculado => (CantidadMaples * 30) + UnidadesIncompletas;

    public async Task LoadGalponesAsync()
    {
        IsLoading = true;
        
        try
        {
            List<GalponModel> galponesData = await _registroService.GetGalponesAsync();
            
            Galpones.Clear();
            foreach (GalponModel galpon in galponesData)
            {
                Galpones.Add(galpon);
            }
        }
        catch (Exception ex)
        {
            await _loggingService.LogErrorAsync($"Error cargando galpones: {ex.Message}", "CrearRegistro");
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task GuardarRegistroAsync()
    {
        // Validaciones
        if (GalponSeleccionado == null)
        {
            await Shell.Current.DisplayAlert("Error", "Seleccione un galpón", "OK");
            return;
        }

        if (FechaProduccion > DateTime.Today)
        {
            await Shell.Current.DisplayAlert("Error", "La fecha no puede ser futura", "OK");
            return;
        }

        // Calcular total de huevos
        TotalHuevos = TotalHuevosCalculado;

        IsSaving = true;

        try
        {
            RegistroProduccionRequest request = new RegistroProduccionRequest
            {
                GalponId = GalponSeleccionado.Id,
                FechaProduccion = FechaProduccion,
                CantidadMaples = CantidadMaples,
                UnidadesIncompletas = UnidadesIncompletas,
                TotalHuevos = TotalHuevos,
                Mortalidad = Mortalidad,
                Alimento = Alimento,
                Observaciones = Observaciones
            };

            bool success = await _registroService.CrearRegistroAsync(request);

            if (success)
            {
                await Shell.Current.DisplayAlert("Éxito", "Registro creado correctamente", "OK");
                await Shell.Current.GoToAsync("..");
            }
            else
            {
                await Shell.Current.DisplayAlert("Error", "No se pudo crear el registro", "OK");
            }
        }
        catch (Exception ex)
        {
            await _loggingService.LogErrorAsync($"Error guardando: {ex.Message}", "CrearRegistro");
            await Shell.Current.DisplayAlert("Error", "Error de conexión", "OK");
        }
        finally
        {
            IsSaving = false;
        }
    }
}
```

---

## Logging - EmulatorLoggingService

**Propósito**: Logging asíncrono a archivo para debugging

**Archivo**: `LogsMobile/logMobile.txt`

**Características**:
- Logging asíncrono con SemaphoreSlim
- Categorías de logs (Authentication, RegistroProduccion, etc.)
- Limpieza de logs al inicio de sesión
- Formato estructurado con timestamps

```csharp
public class EmulatorLoggingService : IEmulatorLoggingService
{
    private readonly string _logFilePath;
    private readonly SemaphoreSlim _semaphore = new SemaphoreSlim(1, 1);

    public EmulatorLoggingService()
    {
        string logDirectory = Path.Combine(FileSystem.AppDataDirectory, "LogsMobile");
        
        if (!Directory.Exists(logDirectory))
        {
            Directory.CreateDirectory(logDirectory);
        }

        _logFilePath = Path.Combine(logDirectory, "logMobile.txt");
    }

    public async Task LogInfoAsync(string message, string category = "General")
    {
        await WriteLogAsync("INFO", message, category);
    }

    public async Task LogErrorAsync(string message, string category = "General")
    {
        await WriteLogAsync("ERROR", message, category);
    }

    public async Task LogWarnAsync(string message, string category = "General")
    {
        await WriteLogAsync("WARN", message, category);
    }

    public async Task LogDebugAsync(string message, string category = "General")
    {
        await WriteLogAsync("DEBUG", message, category);
    }

    private async Task WriteLogAsync(string level, string message, string category)
    {
        await _semaphore.WaitAsync();
        
        try
        {
            string logEntry = $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] [{level}] [{category}] {message}\n";
            await File.AppendAllTextAsync(_logFilePath, logEntry);
        }
        finally
        {
            _semaphore.Release();
        }
    }

    public async Task ClearCurrentSessionLogsAsync()
    {
        await _semaphore.WaitAsync();
        
        try
        {
            if (File.Exists(_logFilePath))
            {
                File.Delete(_logFilePath);
            }

            string header = $"========== NUEVA SESIÓN - {DateTime.Now:yyyy-MM-dd HH:mm:ss} ==========\n";
            await File.WriteAllTextAsync(_logFilePath, header);
        }
        finally
        {
            _semaphore.Release();
        }
    }

    public string GetLogFilePath() => _logFilePath;
}
```

**Uso en ViewModels**:

```csharp
await _loggingService.LogInfoAsync("Iniciando carga de galpones", "RegistroProduccion");
await _loggingService.LogErrorAsync($"Error: {ex.Message}", "RegistroProduccion");
await _loggingService.LogWarnAsync("Token expirado", "Authentication");
```

---

## Views XAML

### Estructura Típica de una Page

```xml
<?xml version="1.0" encoding="utf-8" ?>
<ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
             xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
             xmlns:viewmodels="clr-namespace:ICARUS_MOBILE.Modules.GestionAvicola.ViewModels"
             x:Class="ICARUS_MOBILE.Modules.GestionAvicola.Views.CrearRegistroProduccionPage"
             x:DataType="viewmodels:CrearRegistroProduccionViewModel"
             Title="Nuevo Registro de Producción">

    <ScrollView>
        <VerticalStackLayout Padding="20" Spacing="15">
            
            <!-- Selector de Galpón -->
            <Frame BorderColor="{StaticResource Primary}" CornerRadius="10">
                <VerticalStackLayout>
                    <Label Text="Galpón" FontSize="16" FontAttributes="Bold"/>
                    <Picker ItemsSource="{Binding Galpones}"
                            ItemDisplayBinding="{Binding Nombre}"
                            SelectedItem="{Binding GalponSeleccionado}"
                            Title="Seleccione un galpón"/>
                </VerticalStackLayout>
            </Frame>

            <!-- Fecha de Producción -->
            <Frame BorderColor="{StaticResource Primary}" CornerRadius="10">
                <VerticalStackLayout>
                    <Label Text="Fecha de Producción" FontSize="16" FontAttributes="Bold"/>
                    <DatePicker Date="{Binding FechaProduccion}"
                                MaximumDate="{Binding Source={x:Static sys:DateTime.Today}}"/>
                </VerticalStackLayout>
            </Frame>

            <!-- Cantidad de Maples -->
            <Frame BorderColor="{StaticResource Primary}" CornerRadius="10">
                <VerticalStackLayout>
                    <Label Text="Cantidad de Maples (30 huevos c/u)" FontSize="16" FontAttributes="Bold"/>
                    <Entry Text="{Binding CantidadMaples}" 
                           Keyboard="Numeric"
                           Placeholder="Ingrese cantidad de maples"/>
                </VerticalStackLayout>
            </Frame>

            <!-- Total de Huevos (Calculado) -->
            <Frame BackgroundColor="{StaticResource Secondary}" CornerRadius="10">
                <HorizontalStackLayout Spacing="10">
                    <Label Text="Total de Huevos:" FontSize="18" FontAttributes="Bold" TextColor="White"/>
                    <Label Text="{Binding TotalHuevosCalculado}" 
                           FontSize="24" 
                           FontAttributes="Bold" 
                           TextColor="White"/>
                </HorizontalStackLayout>
            </Frame>

            <!-- Botones -->
            <Grid ColumnDefinitions="*,*" ColumnSpacing="10">
                <Button Text="Cancelar"
                        Command="{Binding CancelarCommand}"
                        BackgroundColor="{StaticResource Gray300}"
                        Grid.Column="0"/>
                
                <Button Text="Guardar"
                        Command="{Binding GuardarRegistroCommand}"
                        IsEnabled="{Binding IsNotSaving}"
                        Grid.Column="1"/>
            </Grid>

            <!-- Loading Indicator -->
            <ActivityIndicator IsRunning="{Binding IsSaving}" 
                               IsVisible="{Binding IsSaving}"
                               Color="{StaticResource Primary}"/>

        </VerticalStackLayout>
    </ScrollView>
</ContentPage>
```

### Data Binding

**Bindings desde XAML a ViewModel**:
- `Text="{Binding PropertyName}"` - Two-way binding
- `Command="{Binding CommandName}"` - Command binding
- `IsEnabled="{Binding IsNotLoading}"` - Computed property
- `ItemsSource="{Binding CollectionName}"` - Collection binding

---

## Navegación Shell

### AppShell.xaml

```xml
<Shell xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
       xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
       xmlns:views="clr-namespace:ICARUS_MOBILE.Core.Views"
       x:Class="ICARUS_MOBILE.AppShell">

    <!-- Login Page (sin FlyoutItem) -->
    <ShellContent Route="LoginPage"
                  ContentTemplate="{DataTemplate views:LoginPage}"/>

    <!-- Main Navigation -->
    <FlyoutItem Title="Inicio" Icon="home.png">
        <ShellContent Route="HomePage"
                      ContentTemplate="{DataTemplate views:HomePage}"/>
    </FlyoutItem>

    <!-- Módulos dinámicos cargados programáticamente -->
    <!-- Se agregan desde AppShellViewModel según módulos asignados -->

    <FlyoutItem Title="Cerrar Sesión" Icon="logout.png">
        <ShellContent Route="Logout"/>
    </FlyoutItem>

</Shell>
```

### Navegación Programática

```csharp
// Navegar a página
await Shell.Current.GoToAsync("//HomePage");

// Navegar con parámetros
await Shell.Current.GoToAsync($"EditarRegistroPage?id={registroId}");

// Volver atrás
await Shell.Current.GoToAsync("..");

// Registrar rutas
Routing.RegisterRoute("EditarRegistroPage", typeof(EditarRegistroProduccionPage));
```

---

## Módulos Funcionales

### 1. Gestión Avícola

**Funcionalidades**:
- Ver galpones disponibles
- Crear registro de producción diaria
- Editar registro existente
- Ver historial de registros
- Exportar datos (futuro)

**ViewModels**:
- `WelcomeViewModel` - Dashboard del módulo
- `CrearRegistroProduccionViewModel` - Nuevo registro
- `EditarRegistroProduccionViewModel` - Editar registro
- `HistorialRegistrosViewModel` - Lista paginada

**API Endpoints Consumidos**:
- GET `/api/mobile/registro-produccion/galpones`
- POST `/api/mobile/registro-produccion`
- GET `/api/mobile/registro-produccion/{id}`
- GET `/api/mobile/registro-produccion/historial`

### 2. Control de Acceso

**Funcionalidades**:
- Registrar acceso de trabajador
- Captura biométrica (futuro)
- Ver historial de accesos
- Reportes de asistencia

**ViewModels**:
- `WelcomeControlAccesoViewModel` - Dashboard
- `RegistrarAccesoViewModel` - Registrar entrada/salida
- `HistorialAccesosViewModel` - Historial

---

## Value Converters

### BoolToColorConverter

```csharp
public class BoolToColorConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        if (value is bool isTrue)
        {
            return isTrue ? Colors.Green : Colors.Red;
        }
        return Colors.Gray;
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}
```

**Uso en XAML**:

```xml
<Label TextColor="{Binding IsActive, Converter={StaticResource BoolToColorConverter}}"/>
```

---

## Características Clave

| Característica | Implementación |
|---------------|----------------|
| **Patrón MVVM** | CommunityToolkit.Mvvm |
| **Navegación** | Shell Navigation |
| **DI** | Microsoft.Extensions.DependencyInjection |
| **HTTP** | HttpClient con BaseAddress configurable |
| **Storage** | SecureStorage para tokens sensibles |
| **Logging** | EmulatorLoggingService a archivo |
| **Autenticación** | JWT Bearer Token |
| **Validación** | Data Annotations + ViewModel logic |
| **UI** | XAML con Material Design |
| **Plataforma** | Android (primaria), iOS (futuro) |

---

## Próximo Documento

Ver [07-FLUJOS-NEGOCIO.md](07-FLUJOS-NEGOCIO.md) para casos de uso end-to-end completos.

---

**Fin del Documento 06-MOBILE-ARQUITECTURA.md**
