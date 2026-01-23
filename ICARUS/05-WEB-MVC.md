# 05 - ICARUS.Web - Aplicación MVC con Razor

## Resumen Ejecutivo

**ICARUS.Web** es la aplicación ASP.NET Core MVC para administración del sistema. Usa Razor Pages, ASP.NET Identity, Bootstrap UI y está organizada por Areas.

### Estadísticas

| Métrica | Valor |
|---------|-------|
| **Controllers** | 7 controllers base + 4 en Areas |
| **Areas** | 4 (Admin, GestionAvicola, ControlAcceso, Identity) |
| **ViewModels** | 8 archivos de modelos |
| **Views** | Organizadas por controller/area |
| **Authentication** | ASP.NET Identity (Cookie-based) |
| **Port** | 5188 (HTTP) |
| **UI Framework** | Bootstrap 5 + Font Awesome |
| **JavaScript** | jQuery, DataTables, SweetAlert2 |

---

## Arquitectura MVC

### Estructura de Carpetas

```
ICARUS.Web/
├── Areas/
│   ├── Admin/              # (Vacío - futuro)
│   ├── GestionAvicola/     # Módulo gestión avícola
│   │   └── Controllers/
│   │       ├── GalponesController.cs
│   │       ├── GestorAvicolaController.cs
│   │       ├── NotificacionesController.cs
│   │       └── ProgramaVacunacionController.cs
│   ├── ControlAcceso/      # Módulo control de acceso
│   │   └── Controllers/
│   │       └── ControlAccesoController.cs
│   └── Identity/           # Páginas de autenticación
├── Controllers/            # Controllers base
│   ├── HomeController.cs
│   ├── ClientesController.cs
│   ├── ClienteModulosController.cs
│   ├── MisModulosController.cs
│   ├── ModulosController.cs
│   ├── TrabajadoresController.cs
│   └── ControlAccesoController.cs
├── Models/                 # ViewModels
├── Views/                  # Razor views
├── Services/               # Servicios personalizados
├── Middleware/             # RequestLoggingMiddleware
├── ViewComponents/         # ModuleNavigationViewComponent
└── wwwroot/                # Assets estáticos
    ├── css/
    │   └── site.css        # Estilos ICARUS personalizados
    ├── js/
    └── lib/
```

---

## Program.cs - Configuración

### Servicios Configurados

```csharp
// Clean Architecture layers
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices(builder.Configuration);

// Custom services
builder.Services.AddScoped<IContactoService, ContactoServiceImpl>();
builder.Services.AddScoped<IExcelExportService, ExcelExportService>();
builder.Services.AddScoped<ReporteAvicolaService>();
builder.Services.AddScoped<ILogCleanupService, LogCleanupService>();
builder.Services.AddScoped<IGestionAvicolaMappingService, GestionAvicolaMappingService>();

// AutoMapper
builder.Services.AddAutoMapper(typeof(WebViewModelMappingProfile), 
    typeof(GestionAvicolaMappingProfile), 
    typeof(ProgramaVacunacionWebMappingProfile));

// ASP.NET Identity
builder.Services.AddDefaultIdentity<IdentityUser>(options => 
{
    options.SignIn.RequireConfirmedAccount = false;
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 6;
    options.User.RequireUniqueEmail = true;
})
.AddRoles<IdentityRole>()
.AddEntityFrameworkStores<ApplicationDbContext>();

// Authorization policies
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => 
        policy.RequireRole(AuthRoles.Administrador));
    options.AddPolicy("ClienteOnly", policy => 
        policy.RequireRole(AuthRoles.Cliente));
    options.AddPolicy("AdminOrCliente", policy => 
        policy.RequireRole(AuthRoles.Administrador, AuthRoles.Cliente));
});
```

### Middleware Pipeline

```csharp
app.UseMiddleware<RequestLoggingMiddleware>(); // Logging personalizado
app.UseStaticFiles();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

// Routes
app.MapRazorPages();
app.MapControllerRoute(name: "areas",
    pattern: "{area:exists}/{controller=Home}/{action=Index}/{id?}");
app.MapControllerRoute(name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");
```

---

## Controllers Principales

### 1. HomeController

**Propósito**: Página pública, dashboard, contacto

**Endpoints**:
- GET `/Welcome` - Página de bienvenida pública
- GET `/Contacto` - Formulario de contacto
- POST `/Contacto` - Enviar solicitud de contacto
- GET `/Index` - Dashboard (requiere autenticación)
- GET `/Privacy` - Política de privacidad

```csharp
[AllowAnonymous]
public IActionResult Welcome()
{
    _loggingService.LogInfo("Acceso a página de bienvenida");
    return View();
}

[HttpPost]
[AllowAnonymous]
[ValidateAntiForgeryToken]
public async Task<IActionResult> Contacto(ContactoViewModel model)
{
    if (!ModelState.IsValid) return View(model);
    
    bool resultado = await _contactoService.EnviarSolicitudContactoAsync(model);
    
    if (resultado)
    {
        TempData["SuccessMessage"] = "¡Solicitud recibida!";
        return RedirectToAction("ContactoExitoso");
    }
    
    TempData["ErrorMessage"] = "Error al enviar solicitud";
    return View(model);
}
```

### 2. ClientesController

**Propósito**: Gestión CRUD de clientes (solo Administrador)

**Autorización**: `[Authorize(Policy = "AdminOnly")]`

**Endpoints principales**:
- GET `/Clientes` - Listado de clientes
- GET `/Clientes/Crear` - Formulario de creación
- POST `/Clientes/Crear` - Crear cliente + usuario Identity
- GET `/Clientes/Editar/{id}` - Formulario de edición
- POST `/Clientes/Editar/{id}` - Actualizar cliente
- GET `/Clientes/Detalles/{id}` - Ver detalles
- POST `/Clientes/Eliminar/{id}` - Soft delete

**Características**:
- Usa AutoMapper para convertir DTOs ↔ ViewModels
- Crea usuario ASP.NET Identity al crear cliente
- Asigna rol "Cliente" automáticamente
- Validaciones defensivas completas
- Logging detallado con log4net

```csharp
[HttpPost]
[ValidateAntiForgeryToken]
public async Task<IActionResult> Crear(CreateClienteViewModel model)
{
    if (!ModelState.IsValid) return View(model);

    // Crear comando usando AutoMapper
    CreateClienteCommand command = _mapper.Map<CreateClienteCommand>(model);
    OperationResult<ClienteDto> result = await _mediator.Send(command);

    if (!result.IsSuccess)
    {
        TempData["Error"] = result.ErrorMessage;
        return View(model);
    }

    // Crear usuario Identity
    IdentityUser user = new IdentityUser
    {
        UserName = model.Email,
        Email = model.Email
    };

    IdentityResult userResult = await _userManager.CreateAsync(user, model.Password);

    if (userResult.Succeeded)
    {
        await _userManager.AddToRoleAsync(user, AuthRoles.Cliente);
        TempData["Success"] = "Cliente creado exitosamente";
        return RedirectToAction(nameof(Index));
    }

    TempData["Error"] = "Cliente creado pero error al crear usuario";
    return RedirectToAction(nameof(Index));
}
```

### 3. GalponesController (Area: GestionAvicola)

**Propósito**: Gestión de galpones avícolas

**Ruta**: `/GestionAvicola/Galpones`

**Autorización**: `[Authorize]` (Administrador o Cliente)

**Endpoints principales**:
- GET `/Index` - Lista de galpones
- GET `/Detalles/{id}` - Detalles del galpón
- GET `/Crear` - Formulario de creación
- POST `/Crear` - Crear galpón
- GET `/Editar/{id}` - Formulario de edición
- POST `/Editar/{id}` - Actualizar galpón
- POST `/Eliminar/{id}` - Soft delete
- GET `/RegistrosProduccion/{id}` - Registros de producción del galpón
- GET `/ExportarExcel/{id}` - Exportar a Excel

**Validaciones**:
- Clientes solo ven/editan sus propios galpones
- Administradores ven todos los galpones
- Validación de ClienteId desde token de usuario

```csharp
public async Task<IActionResult> Index(int? clienteId)
{
    IdentityUser? currentUser = await _userManager.GetUserAsync(User);
    bool isAdmin = User.IsInRole(AuthRoles.Administrador);

    int? filtroClienteId = await ObtenerClienteIdFiltro(currentUser, isAdmin, clienteId);
    
    GetGalponesQuery query = new GetGalponesQuery
    {
        GestorAvicolaId = filtroClienteId,
        SoloActivos = false
    };

    OperationResult<IEnumerable<GalponDto>> result = await _mediator.Send(query);

    if (result.IsSuccess && result.Data != null)
    {
        List<GalponSelectViewModel> viewModels = 
            _mappingService.MapToGalponSelectViewModelList(result.Data);
        
        ViewBag.ClienteId = filtroClienteId;
        ViewBag.TotalGalpones = viewModels.Count;
        ViewBag.IsAdmin = isAdmin;
        
        return View(viewModels);
    }

    return View(new List<GalponSelectViewModel>());
}
```

---

## ViewModels

### ClienteViewModel

```csharp
public class ClienteViewModel
{
    public int Id { get; set; }
    
    [Display(Name = "NIT")]
    public string? NIT { get; set; }
    
    [Display(Name = "Razón Social")]
    public string RazonSocial { get; set; } = string.Empty;
    
    [Display(Name = "Email")]
    public string Email { get; set; } = string.Empty;
    
    [Display(Name = "Teléfono")]
    public string? Telefono { get; set; }
    
    [Display(Name = "Estado del Cliente")]
    public EstadoCliente EstadoCliente { get; set; }
    
    [Display(Name = "Módulos Asignados")]
    public int ModulosAsignados { get; set; }
}

public class CreateClienteViewModel
{
    [Required(ErrorMessage = "La Razón Social es requerida")]
    [StringLength(200)]
    [Display(Name = "Razón Social")]
    public string RazonSocial { get; set; } = string.Empty;

    [Required(ErrorMessage = "El Email es requerido")]
    [EmailAddress]
    [Display(Name = "Email")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "La Contraseña es requerida")]
    [StringLength(100, MinimumLength = 6)]
    [DataType(DataType.Password)]
    [Display(Name = "Contraseña")]
    public string Password { get; set; } = string.Empty;
}
```

---

## Views y Layout

### _Layout.cshtml

**Características**:
- Navbar con logo SVG ICARUS
- Navegación dinámica por módulos (ViewComponent)
- Bootstrap 5 responsive
- Font Awesome icons
- DataTables integrado
- SweetAlert2 para alertas

```html
<header>
    <nav class="navbar navbar-expand-lg navbar-custom mb-3">
        <div class="container-fluid">
            <a class="navbar-brand" asp-controller="Home" asp-action="Welcome">
                <svg class="icarus-icon" viewBox="0 0 800 800">...</svg>
                Sistema ICARUS
            </a>
            
            <div class="collapse navbar-collapse">
                <ul class="navbar-nav me-auto">
                    <li class="nav-item">
                        <a class="nav-link" asp-controller="Home" asp-action="Welcome">
                            <i class="fas fa-home me-1"></i> Inicio
                        </a>
                    </li>
                    
                    @await Component.InvokeAsync("ModuleNavigation")
                </ul>
                <ul class="navbar-nav ms-auto">
                    <partial name="_LoginPartial" />
                </ul>
            </div>
        </div>
    </nav>
</header>
```

### Estructura de Vista Típica

```html
@model IEnumerable<ClienteViewModel>

@{
    ViewData["Title"] = "Clientes";
}

<div class="container-fluid">
    <div class="card card-custom">
        <div class="card-header card-header-custom">
            <h3 class="card-title mb-0">
                <i class="fas fa-users me-2"></i>
                Gestión de Clientes
            </h3>
            <div class="card-tools">
                <a asp-action="Crear" class="btn btn-icarus btn-sm">
                    <i class="fas fa-plus me-1"></i> Nuevo Cliente
                </a>
            </div>
        </div>
        <div class="card-body">
            <table class="table table-striped table-hover table-custom" id="tableClientes">
                <thead class="table-header-custom">
                    <tr>
                        <th>Razón Social</th>
                        <th>Email</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach (var cliente in Model)
                    {
                        <tr>
                            <td>@cliente.RazonSocial</td>
                            <td>@cliente.Email</td>
                            <td>
                                <span class="badge bg-@(cliente.EstadoCliente == EstadoCliente.Activo ? "success" : "danger")">
                                    @cliente.EstadoCliente
                                </span>
                            </td>
                            <td>
                                <div class="btn-group" role="group">
                                    <a asp-action="Detalles" asp-route-id="@cliente.Id" 
                                       class="btn btn-sm btn-icarus-outline">
                                        <i class="fas fa-eye"></i>
                                    </a>
                                    <a asp-action="Editar" asp-route-id="@cliente.Id" 
                                       class="btn btn-sm btn-icarus">
                                        <i class="fas fa-edit"></i>
                                    </a>
                                </div>
                            </td>
                        </tr>
                    }
                </tbody>
            </table>
        </div>
    </div>
</div>

@section Scripts {
    <script>
        $(document).ready(function() {
            $('#tableClientes').DataTable({
                responsive: true,
                language: { url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json' }
            });
        });
    </script>
}
```

---

## Estilos CSS Personalizados (site.css)

### Variables de Color

```css
:root {
  --icarus-primary: #2E86AB;
  --icarus-secondary: #A23B72;
  --icarus-accent: #F18F01;
  --icarus-light: #E8F4FD;
  --icarus-dark: #1A4B66;
  --icarus-success: #28A745;
  --icarus-danger: #DC3545;
}
```

### Clases de Botones

```css
.btn-icarus {
    background-color: var(--icarus-primary);
    color: white;
    border: none;
}

.btn-icarus:hover {
    background-color: var(--icarus-dark);
    color: white;
}

.btn-icarus-outline {
    border: 2px solid var(--icarus-primary);
    color: var(--icarus-primary);
}
```

### Navbar Personalizada

```css
.navbar-custom {
    background-color: var(--icarus-primary);
    border-bottom: 3px solid var(--icarus-accent);
    box-shadow: 0 2px 10px rgba(46, 134, 171, 0.3);
}

.navbar-custom .nav-link {
    color: rgba(255, 255, 255, 0.9) !important;
    font-weight: 500;
    transition: all 0.3s ease;
}

.navbar-custom .nav-link:hover {
    color: white !important;
    background-color: rgba(255, 255, 255, 0.15);
}
```

---

## Middleware y Servicios

### RequestLoggingMiddleware

Registra todas las peticiones HTTP con log4net:

```csharp
public async Task InvokeAsync(HttpContext context)
{
    string requestPath = context.Request.Path.Value ?? "Unknown";
    string method = context.Request.Method ?? "Unknown";
    string userId = context.User?.Identity?.Name ?? "Anonymous";
    DateTime requestStart = DateTime.UtcNow;

    _logger.InfoFormat("RequestLoggingMiddleware - INICIO: {0} {1} | Usuario: {2}",
        method, requestPath, userId);

    await _next(context);

    double responseTime = (DateTime.UtcNow - requestStart).TotalMilliseconds;
    int statusCode = context.Response?.StatusCode ?? 0;

    _logger.InfoFormat("RequestLoggingMiddleware - FIN: {0} {1} | Status: {2} | Tiempo: {3}ms",
        method, requestPath, statusCode, responseTime.ToString("F2"));
}
```

### ModuleNavigationViewComponent

Genera navegación dinámica según los módulos del cliente:

```csharp
public async Task<IViewComponentResult> InvokeAsync()
{
    IdentityUser? user = await _userManager.GetUserAsync(HttpContext.User);
    
    if (user == null || !User.Identity.IsAuthenticated)
        return View("Default", new List<ModuleNavigationItem>());

    // Obtener módulos del cliente
    GetClienteModulosQuery query = new GetClienteModulosQuery(clienteId);
    Result<IEnumerable<ClienteModuloDto>> result = await _mediator.Send(query);

    // Construir items de navegación
    List<ModuleNavigationItem> items = MapToNavigationItems(result.Data);
    
    return View("Default", items);
}
```

---

## Autenticación y Autorización

### ASP.NET Identity

**Roles del sistema**:
- `Administrador`: Acceso completo
- `Cliente`: Gestión de sus módulos contratados
- `Trabajador`: Sin acceso a Web (solo API móvil)

**Políticas**:
- `AdminOnly`: Solo administradores
- `ClienteOnly`: Solo clientes
- `AdminOrCliente`: Administradores o clientes

### Login Flow

1. Usuario accede a `/Identity/Account/Login`
2. Ingresa email y contraseña
3. ASP.NET Identity valida credenciales
4. Se crea cookie de autenticación
5. Redirect a dashboard según rol

---

## JavaScript y Librerías

### jQuery y DataTables

```javascript
$(document).ready(function() {
    $('#tableClientes').DataTable({
        responsive: true,
        language: {
            url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json'
        },
        pageLength: 25,
        order: [[0, 'asc']]
    });
});
```

### SweetAlert2

```javascript
function confirmarEliminar(id, nombre) {
    Swal.fire({
        title: '¿Estás seguro?',
        text: `Se eliminará ${nombre}`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            document.getElementById(`form-delete-${id}`).submit();
        }
    });
}
```

---

## Características Clave

| Característica | Implementación |
|---------------|----------------|
| **Autenticación** | ASP.NET Identity con cookies |
| **Autorización** | Políticas basadas en roles |
| **UI Framework** | Bootstrap 5 responsive |
| **Tablas** | DataTables con paginación/búsqueda |
| **Alertas** | SweetAlert2 con animaciones |
| **Logging** | log4net + RequestLoggingMiddleware |
| **Mapeo** | AutoMapper (DTO ↔ ViewModel) |
| **Validación** | Data Annotations + ModelState |
| **Areas** | Organización modular |
| **ViewComponents** | Navegación dinámica |
| **TempData** | Mensajes entre redirects |

---

## Próximo Documento

Ver [06-MOBILE-ARQUITECTURA.md](06-MOBILE-ARQUITECTURA.md) para documentación de ICARUS_MOBILE (.NET MAUI).

---

**Fin del Documento 05-WEB-MVC.md**
