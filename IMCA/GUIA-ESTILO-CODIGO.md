# IMCA - Guía de Estilo de Código

**Última actualización:** 2026-06-29 — validado contra código fuente
**Versión:** 1.0 · **Basado en:** Instrucciones MAUI OPTIMUS

> Las convenciones de este documento (MVVM estricto, `this.` explícito, tipos explícitos en
> lugar de `var` para tipos built-in, comentarios XML) **coinciden con el código real**.

---

## 📋 REGLAS FUNDAMENTALES

### Arquitectura
- **MVVM obligatorio**: Separación estricta View-ViewModel-Model
- **SOLID principles**: Aplicar todos los principios
- **KISS**: Mantener simplicidad
- **DRY**: Evitar duplicación

---

## 🎯 REGLAS DE ESTILO

### 1. Uso de `var`
```csharp
// ❌ INCORRECTO - Nunca para tipos built-in
var count = 10;
var name = "Juan";
var isActive = true;

// ✅ CORRECTO - Solo cuando tipo es evidente
int count = 10;
string name = "Juan";
bool isActive = true;
var trabajador = new TrabajadorInfo(); // Tipo aparente
var httpClient = new HttpClient(); // Tipo aparente
```

### 2. Calificación de Miembros (this.)
```csharp
// ❌ INCORRECTO
public class LoginViewModel
{
    private string _email;
    public string Email => _email;
    
    public void SetEmail(string email)
    {
        _email = email; // Falta this.
    }
}

// ✅ CORRECTO
public class LoginViewModel
{
    private string _email;
    public string Email => this._email;
    
    public void SetEmail(string email)
    {
        this._email = email;
        this.OnPropertyChanged(nameof(this.Email));
    }
}
```

### 3. Cuerpos de Expresión
```csharp
// ❌ INCORRECTO - No usar en métodos y constructores
public int CalculateTotal() => this.Items.Sum(x => x.Price);
public LoginViewModel(IAuthService authService) => this._authService = authService;

// ✅ CORRECTO
public int CalculateTotal()
{
    return this.Items.Sum(x => x.Price);
}

public LoginViewModel(IAuthService authService)
{
    this._authService = authService;
}

// ✅ CORRECTO - Usar en propiedades
public string FullName => $"{this.FirstName} {this.LastName}";
```

### 4. Nomenclatura
```csharp
// Campos privados: _camelCase
private readonly IAuthService _authService;
private string _email;

// Propiedades: PascalCase
public string Email { get; set; }
public int ClienteId { get; set; }

// Métodos: PascalCase
public async Task LoadDataAsync() { }
public void ValidateInput() { }

// Parámetros y variables: camelCase
public void ProcessData(string inputData)
{
    int itemCount = 0;
    string processedData = string.Empty;
}

// Constantes: PascalCase
private const string ApiBaseUrl = "https://api.icarus.com";
private const int MaxRetryAttempts = 3;

// Interfaces: I + PascalCase
public interface IAuthService { }
public interface IBiometriaService { }
```

### 5. Llaves y Formato
```csharp
// ❌ INCORRECTO - No usar llaves en misma línea
if (condition) {
    DoSomething();
}

// ❌ INCORRECTO - No omitir llaves
if (condition)
    DoSomething();

// ✅ CORRECTO - Llaves en nueva línea siempre
if (condition)
{
    this.DoSomething();
}

// ✅ CORRECTO - Incluso para una línea
if (result.IsSuccess)
{
    return true;
}
```

---

## 🛡️ VALIDACIONES Y MANEJO DE ERRORES

### 1. Programación Defensiva
```csharp
/// <summary>
/// Identifica trabajador por template de huella
/// Valida datos antes de procesar
/// </summary>
public async Task<OperationResult<TrabajadorInfo>> IdentificarHuellaAsync(string template)
{
    // Validación obligatoria
    if (string.IsNullOrWhiteSpace(template))
    {
        this._logger.LogError("IdentificarHuellaAsync - Template es nulo o vacío");
        return OperationResult<TrabajadorInfo>.Failure("Template requerido");
    }
    
    // Validación de longitud
    if (template.Length < 100)
    {
        return OperationResult<TrabajadorInfo>.Failure("Template inválido");
    }
    
    // Después de validar, acceso directo (no usar '?')
    string normalizedTemplate = template.Trim();
    
    return OperationResult<TrabajadorInfo>.Success(trabajador);
}
```

### 2. Try-Catch SOLO para Operaciones Externas
```csharp
// ✅ CORRECTO - Try-Catch para HTTP/API
public async Task<TrabajadorInfo> GetTrabajadorAsync(int id)
{
    try
    {
        HttpResponseMessage response = await this._httpClient.GetAsync($"/api/imca/trabajadores/{id}");
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<TrabajadorInfo>();
    }
    catch (HttpRequestException ex)
    {
        await this._loggingService.LogErrorAsync($"GetTrabajadorAsync - Error de red: {ex.Message}");
        return null;
    }
}

// ❌ INCORRECTO - No usar Try-Catch para lógica de negocio
public int CalculateTotal(List<Item> items)
{
    try
    {
        return items.Sum(x => x.Price); // Si falla, debe explotar
    }
    catch (Exception ex)
    {
        return 0; // ❌ Oculta bugs
    }
}

// ✅ CORRECTO - Validación defensiva
public int CalculateTotal(List<Item> items)
{
    if (items == null || items.Count == 0)
    {
        return 0;
    }
    
    return items.Sum(x => x.Price);
}
```

### 3. Validaciones No Redundantes
```csharp
// ❌ INCORRECTO - Validación redundante
public void ProcessTrabajador(TrabajadorInfo trabajador)
{
    if (trabajador == null)
    {
        return;
    }
    
    // Ya validamos null, no usar '?'
    string name = trabajador?.Nombre; // ❌ Redundante
}

// ✅ CORRECTO
public void ProcessTrabajador(TrabajadorInfo trabajador)
{
    if (trabajador == null)
    {
        return;
    }
    
    // Acceso directo después de validar
    string name = trabajador.Nombre;
    int edad = trabajador.Edad;
}
```

---

## 📝 LOGGING OBLIGATORIO

### Estructura de Logs
```csharp
public class LoginViewModel : BaseViewModel
{
    private readonly IAuthService _authService;
    private readonly ILogger<LoginViewModel> _logger;
    
    public LoginViewModel(
        IAuthService authService,
        ILogger<LoginViewModel> logger)
    {
        this._authService = authService;
        this._logger = logger;
    }
    
    [RelayCommand]
    private async Task LoginAsync()
    {
        this._logger.LogInformation(
            "LoginViewModel.LoginAsync - Iniciando login para: {Email}",
            this.Email
        );
        
        try
        {
            LoginResponse result = await this._authService.LoginAsync(this.Email, this.Password);
            
            this._logger.LogInformation(
                "LoginViewModel.LoginAsync - Login exitoso para cliente: {ClienteId}",
                result.ClienteId
            );
        }
        catch (HttpRequestException ex)
        {
            this._logger.LogError(
                ex,
                "LoginViewModel.LoginAsync - Error HTTP: {Message}",
                ex.Message
            );
        }
    }
}
```

**Formato de logs**: `NombreClase.NombreMetodo - Mensaje descriptivo`

---

## 🔄 USO DE LINQ

### ✅ Usar LINQ para:
```csharp
// Filtrado y proyección en memoria
List<TrabajadorInfo> trabajadoresActivos = this._trabajadores
    .Where(t => t.EstaActivo)
    .OrderBy(t => t.Nombre)
    .ToList();

// Transformaciones
var resumen = this._registros
    .Select(r => new
    {
        r.TrabajadorNombre,
        r.TipoAcceso,
        Fecha = r.FechaHora.ToString("dd/MM/yyyy HH:mm")
    })
    .ToList();
```

### ❌ NO usar LINQ para:
```csharp
// ❌ INCORRECTO - No actualizar ObservableCollection con LINQ
this.Trabajadores = new ObservableCollection<TrabajadorInfo>(
    trabajadores.Where(t => t.TieneHuella) // ❌ Pierde notificaciones
);

// ✅ CORRECTO - Manual para ObservableCollection
this.Trabajadores.Clear();
foreach (TrabajadorInfo trabajador in trabajadores.Where(t => t.TieneHuella))
{
    this.Trabajadores.Add(trabajador);
}
```

---

## 📱 ESPECÍFICO PARA .NET MAUI

### 1. MVVM con CommunityToolkit.Mvvm
```csharp
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

public partial class KioscoViewModel : ObservableObject
{
    [ObservableProperty]
    private string _mensaje = "Coloque su dedo en el sensor";
    
    [ObservableProperty]
    private bool _isScanning;
    
    private readonly IBiometriaService _biometriaService;
    private readonly IRegistroService _registroService;
    private readonly ILogger<KioscoViewModel> _logger;
    
    public KioscoViewModel(
        IBiometriaService biometriaService,
        IRegistroService registroService,
        ILogger<KioscoViewModel> logger)
    {
        this._biometriaService = biometriaService;
        this._registroService = registroService;
        this._logger = logger;
    }
    
    [RelayCommand]
    private async Task IniciarRegistroAsync()
    {
        if (this.IsScanning)
        {
            return;
        }
        
        this.IsScanning = true;
        this.Mensaje = "Escaneando huella...";
        
        try
        {
            string template = await this._biometriaService.CapturarHuellaAsync();
            
            if (string.IsNullOrEmpty(template))
            {
                this.Mensaje = "Error al leer huella";
                return;
            }
            
            // Continuar con identificación...
        }
        catch (Exception ex)
        {
            this._logger.LogError(ex, "IniciarRegistroAsync - Error: {Message}", ex.Message);
            this.Mensaje = "Error al procesar huella";
        }
        finally
        {
            this.IsScanning = false;
        }
    }
}
```

### 2. Async/Await Obligatorio
```csharp
// ✅ CORRECTO - Async todo el camino
public async Task LoadTrabajadoresAsync()
{
    List<TrabajadorInfo> trabajadores = await this._service.GetTrabajadoresAsync();
    this._logger.LogInformation("Trabajadores cargados: {Count}", trabajadores.Count);
}

// ❌ INCORRECTO - No bloquear con .Result o .Wait()
public void LoadTrabajadores()
{
    var trabajadores = this._service.GetTrabajadoresAsync().Result; // ❌ Deadlock
}
```

---

## 📚 DOCUMENTACIÓN (XML Comments)

```csharp
/// <summary>
/// Identifica trabajador mediante template de huella digital
/// Valida que el trabajador esté activo y tenga permisos vigentes
/// </summary>
/// <param name="template">Template biométrico en Base64</param>
/// <returns>Información del trabajador identificado o null si no se encuentra</returns>
/// <exception cref="ArgumentNullException">Si template es nulo</exception>
public async Task<TrabajadorInfo> IdentificarPorHuellaAsync(string template)
{
    // Implementación
}
```

**Importante**:
- Summaries en español explicando el **por qué**
- Nombres de código en inglés
- Evitar comentarios obvios

---

## ⚡ PERFORMANCE

### 1. ObservableCollection Updates
```csharp
// ✅ CORRECTO - Actualización eficiente
public async Task RefreshTrabajadoresAsync()
{
    List<TrabajadorInfo> trabajadores = await this._service.GetTrabajadoresAsync();
    
    this.Trabajadores.Clear(); // Una sola notificación
    
    foreach (TrabajadorInfo trabajador in trabajadores)
    {
        this.Trabajadores.Add(trabajador);
    }
}
```

### 2. Caché en Memoria
```csharp
private Dictionary<int, byte[]> _fotosCache = new Dictionary<int, byte[]>();

public async Task<byte[]> GetFotoAsync(int trabajadorId)
{
    if (this._fotosCache.ContainsKey(trabajadorId))
    {
        return this._fotosCache[trabajadorId];
    }
    
    byte[] foto = await this._fotoService.GetFotoLocalAsync(trabajadorId);
    this._fotosCache[trabajadorId] = foto;
    
    return foto;
}
```

---

## 🚫 PROHIBIDO

❌ Usar `var` para tipos primitivos  
❌ Usar `null` sin validación  
❌ Try-Catch para lógica de negocio  
❌ Reflection  
❌ Code-behind en MAUI (solo XAML + ViewModel)  
❌ Acceso directo a BD desde ViewModel (usar Services)  
❌ Validaciones redundantes después de check de null  
❌ Caracteres especiales mal codificados (`�`)  

---

## ✅ OBLIGATORIO

✅ MVVM estricto en MAUI  
✅ `this.` para todos los miembros  
✅ Llaves siempre en nueva línea  
✅ Logging en todos los ViewModels/Services  
✅ Validación defensiva de parámetros  
✅ Async/Await para operaciones I/O  
✅ XML Comments en métodos públicos  
✅ PascalCase para métodos/propiedades  
✅ _camelCase para campos privados  
✅ SOLID + DRY + KISS  

---

## 📂 ESTRUCTURA DE ARCHIVOS

### Servicios
```
Core/Services/
├── Interfaces/
│   ├── IAuthService.cs
│   ├── IBiometriaService.cs
│   └── IRegistroService.cs
└── Implementation/
    ├── AuthService.cs
    ├── BiometriaService.cs
    └── RegistroService.cs
```

### ViewModels y Views
```
Features/Login/
├── LoginPage.xaml
├── LoginPage.xaml.cs
└── LoginViewModel.cs

Features/Kiosco/
├── KioscoPage.xaml
├── KioscoPage.xaml.cs
└── KioscoViewModel.cs
```

---

## 🎨 CONVENCIONES XAML

### Naming
```xml
<!-- Nombres descriptivos con prefijo de tipo -->
<Button x:Name="BtnIniciarRegistro" />
<Label x:Name="LblMensaje" />
<Entry x:Name="TxtEmail" />
<Image x:Name="ImgTrabajador" />
```

### Binding
```xml
<!-- Usar Binding explícito -->
<Label Text="{Binding Mensaje}" />
<Button Command="{Binding LoginCommand}" />
<Entry Text="{Binding Email, Mode=TwoWay}" />
```

### Estilos
```xml
<!-- Usar estilos compartidos -->
<Button Text="Login" StyleClass="PrimaryButton" />
<Label Text="Error" StyleClass="ErrorLabel" />
```

---

**¡Seguir estas reglas garantiza código consistente y mantenible!**
