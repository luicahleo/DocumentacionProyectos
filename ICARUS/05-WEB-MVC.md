# 05 — ICARUS.Web (MVC + Razor + Identity)

**Última actualización:** 2026-06-29 — validado contra código fuente
**Proyecto:** `ICARUS.Web` · ASP.NET Core MVC 10 · `net10.0`

Aplicación web de administración y gestión. UI **Razor + Bootstrap 5 + jQuery + Font Awesome**,
autenticación **ASP.NET Identity (cookies)**.

> **Arquitectura de datos — importante:** la Web **NO** es API-first. Ejecuta **CQRS (MediatR)
> directamente** sobre el mismo `ApplicationDbContext` (registrado con `AddDbContext` en su propio
> `Program.cs`). De 13 controllers, 12 inyectan `IMediator`, 5 usan `ApplicationDbContext`/UserManager,
> y solo 1 usa `HttpClient`. No depende de `ICARUS.API` para sus operaciones.

---

## 1. Areas (3 con controllers)

```
Areas/
├── GestionAvicola/Controllers/   (9 controllers)
├── ControlAcceso/Controllers/    (1 controller)
└── Identity/                     (scaffolding de ASP.NET Identity: login, register, manage)
```

> La carpeta `Areas/Admin/` existe en la estructura pero **no contiene controllers**.

### GestionAvicola (9 controllers)
`GalponesController`, `GestorAvicolaController`, `NotificacionesController`,
`ProgramasVacunacionController`, `ProgramaVacunacionController` (singular y plural coexisten),
`CronogramaVacunacionController`, `CronogramaIluminacionController`, `CronogramaAlimentacionController`,
`ContabilidadController` (despachos/pedidos/precios/balance).

### ControlAcceso (1 controller)
`ControlAccesoController`.

---

## 2. Controllers base (`Controllers/`, 8)

| Controller | Función |
|------------|---------|
| `HomeController` | dashboard / páginas públicas (usa `ILoggingService`, `IContactoService`) |
| `ClientesController` | CRUD de clientes |
| `ClienteModulosController` | asignación de módulos a clientes |
| `MisModulosController` | módulos del usuario autenticado |
| `ModulosController` | catálogo de módulos |
| `TrabajadoresController` | CRUD de trabajadores |
| `ControlAccesoController` | acceso (nivel base, además del de Area) |
| `MobileController` | utilidades relacionadas con la app móvil |

---

## 3. Identity y arranque (`Program.cs`)

```csharp
builder.Services.AddDbContext<ApplicationDbContext>(o => o.UseSqlServer(connectionString));
builder.Services.AddControllersWithViews();
builder.Services.AddAutoMapper(...);
builder.Services.AddDefaultIdentity<IdentityUser>(options => { ... })
        .AddRoles<IdentityRole>()
        .AddEntityFrameworkStores<ApplicationDbContext>();
builder.Services.AddAuthentication().AddJwtBearer(options => { ... }); // escenarios mixtos
// ...
app.UseAuthentication();
app.MapRazorPages();
app.MapControllerRoute("areas", "{area:exists}/{controller}/{action}/{id?}");
```

- **Identity:** `IdentityUser` por defecto (no hay `ApplicationUser` custom) + `IdentityRole`.
  Roles definidos en `ICARUS.Domain/Constants/AuthRoles.cs` / `SystemRoles.cs`.
- **Sesión:** cookie de autenticación de Identity.
- También registra `JwtBearer` para endpoints que requieran token.

---

## 4. Vistas y assets

- Vistas **Razor** (`.cshtml`) organizadas por controller/area en `Views/` y `Areas/*/Views/`.
- **Bootstrap 5**, **jQuery** y **Font Awesome** en `wwwroot/lib`.
- ViewModels específicos de Web para formularios.
- `ClosedXML` para exportación a Excel.
- `log4net.config` copiado al output (logging).

---

## 5. Patrón de un controller MVC (referencia)

```csharp
public class GalponesController : Controller
{
    private readonly IMediator _mediator;
    private readonly UserManager<IdentityUser> _userManager;
    private readonly IGestionAvicolaMappingService _mappingService;
    // Acciones llaman a _mediator.Send(command/query) y devuelven Views
}
```

---

## 6. Mapa de código

| Concepto | Ruta |
|----------|------|
| Arranque, Identity, DbContext, MediatR | `ICARUS.Web/Program.cs` |
| Controllers base | `ICARUS.Web/Controllers/*.cs` |
| Areas | `ICARUS.Web/Areas/<Area>/Controllers/*.cs` |
| Vistas | `ICARUS.Web/Views/`, `ICARUS.Web/Areas/<Area>/Views/` |
| Identity scaffolding | `ICARUS.Web/Areas/Identity/` |
| Assets front | `ICARUS.Web/wwwroot/lib/` |
| Configuración | `ICARUS.Web/appsettings.json` |

Siguiente: **07-FLUJOS-NEGOCIO.md**.
