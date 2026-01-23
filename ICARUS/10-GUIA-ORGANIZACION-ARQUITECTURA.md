# ICARUS - Guía de Organización y Arquitectura

**Versión:** 1.0  
**Fecha:** Diciembre 2025  
**Propósito:** Documento de referencia para organización de código, carpetas, logging y convenciones

---

## 📁 Estructura de Carpetas Obligatoria

### ICARUS.Domain (Núcleo del Sistema)
```
ICARUS.Domain/
├── Entities/
│   ├── BaseEntity.cs                    # ⚠️ OBLIGATORIO: Todas heredan de esta
│   ├── Cliente.cs
│   ├── Trabajador.cs
│   ├── GestionAvicola/                  # Un folder por módulo
│   │   ├── GestorAvicola.cs
│   │   ├── Galpon.cs
│   │   └── RegistroProduccionDiario.cs
│   └── ControlAcceso/
│       ├── TrabajadorAcceso.cs
│       └── RegistroAcceso.cs
├── Interfaces/
│   ├── IGenericRepository.cs
│   └── I{Entidad}Repository.cs          # Una interfaz por entidad
├── Enums/
│   └── EstadoTarea.cs
└── Constants/
    └── DomainConstants.cs
```

### ICARUS.Application (CQRS + Lógica)
```
ICARUS.Application/
├── Features/                             # ⚠️ PREFERIDO: Organización por Features
│   ├── GestionAvicola/
│   │   ├── Commands/
│   │   │   ├── Galpones/
│   │   │   │   ├── CreateGalponCommand.cs
│   │   │   │   └── CreateGalponCommandHandler.cs
│   │   │   └── RegistroProduccion/
│   │   ├── Queries/
│   │   │   ├── GetGalponesQuery.cs
│   │   │   └── GetGalponesQueryHandler.cs
│   │   └── DTOs/
│   │       ├── GalponDto.cs
│   │       └── CreateGalponDto.cs
│   └── ControlAcceso/
│       └── (misma estructura)
├── Commands/                             # ⚠️ LEGACY: Mover a Features/
├── Queries/                              # ⚠️ LEGACY: Mover a Features/
├── Handlers/                             # ⚠️ LEGACY: Mover a Features/
├── DTOs/                                 # DTOs compartidos
├── Common/
│   ├── OperationResult.cs
│   └── Mappings/
│       └── AutoMapperProfile.cs
├── Validators/
│   └── {Comando}Validator.cs
├── Services/
│   └── I{Servicio}Service.cs
└── Interfaces/
```

### ICARUS.Infrastructure (Persistencia)
```
ICARUS.Infrastructure/
├── Data/
│   ├── ApplicationDbContext.cs
│   └── SeedData/
│       ├── ModulosSeedData.cs
│       └── AuthRolesSeedData.cs
├── Repositories/
│   ├── GenericRepository.cs
│   ├── UnitOfWork.cs
│   └── GestionAvicola/
│       ├── GalponRepository.cs
│       └── RegistroProduccionDiarioRepository.cs
├── EntityConfigurations/                 # ⚠️ OBLIGATORIO: Fluent API
│   └── GestionAvicola/
│       └── GalponConfiguration.cs
├── Migrations/
└── Services/
    └── JwtTokenService.cs
```

### ICARUS.API (Endpoints REST)
```
ICARUS.API/
├── Controllers/
│   ├── Common/
│   │   └── ModulosController.cs
│   ├── Mobile/
│   │   ├── MobileAuthController.cs
│   │   └── RegistroProduccionMobileController.cs
│   └── Web/
│       └── (endpoints futuros)
├── Authorization/
│   └── AuthorizationPolicies.cs
├── Filters/
│   └── ValidationExceptionFilter.cs
├── Extensions/
│   └── ServiceCollectionExtensions.cs
├── Logs/                                 # ⚠️ Logs generados aquí
├── Program.cs
├── appsettings.json
└── log4net.config
```

### ICARUS.Web (MVC + Razor)
```
ICARUS.Web/
├── Areas/
│   ├── GestionAvicola/
│   │   ├── Controllers/
│   │   │   └── GalponesController.cs
│   │   └── Views/
│   │       └── Galpones/
│   │           ├── Index.cshtml
│   │           ├── Create.cshtml
│   │           └── Edit.cshtml
│   └── ControlAcceso/
│       └── (misma estructura)
├── Controllers/
│   ├── HomeController.cs
│   └── ClientesController.cs
├── Models/                               # ViewModels
│   ├── GalponViewModel.cs
│   └── CreateGalponViewModel.cs
├── Views/
│   ├── Shared/
│   │   ├── _Layout.cshtml
│   │   └── _ValidationScriptsPartial.cshtml
│   └── Home/
│       └── Index.cshtml
├── Services/
│   └── IContactoService.cs
├── Middleware/
│   └── RequestLoggingMiddleware.cs
├── ViewComponents/
│   └── ModuleNavigationViewComponent.cs
├── Logs/                                 # ⚠️ Logs generados aquí
├── wwwroot/
│   ├── css/
│   │   └── site.css                     # Estilos ICARUS personalizados
│   ├── js/
│   │   └── site.js
│   └── lib/
├── Program.cs
├── appsettings.json
└── log4net.config
```

---

## 🎯 Convenciones de Nomenclatura

### Archivos y Clases

| Tipo | Convención | Ejemplo |
|------|-----------|---------|
| **Entidad** | `{Nombre}.cs` | `Galpon.cs`, `RegistroProduccionDiario.cs` |
| **DTO** | `{Nombre}Dto.cs` | `GalponDto.cs`, `CreateGalponDto.cs` |
| **ViewModel** | `{Nombre}ViewModel.cs` | `GalponViewModel.cs`, `CreateGalponViewModel.cs` |
| **Command** | `{Verbo}{Entidad}Command.cs` | `CreateGalponCommand.cs`, `UpdateProduccionCommand.cs` |
| **Query** | `Get{Entidad}By{Criterio}Query.cs` | `GetGalponesQuery.cs`, `GetProduccionByGalponQuery.cs` |
| **Handler** | `{Command/Query}Handler.cs` | `CreateGalponCommandHandler.cs` |
| **Repository** | `{Entidad}Repository.cs` | `GalponRepository.cs` |
| **Interface Repository** | `I{Entidad}Repository.cs` | `IGalponRepository.cs` |
| **Service** | `{Funcionalidad}Service.cs` | `JwtTokenService.cs`, `EmailService.cs` |
| **Controller API** | `{Entidad}Controller.cs` | `GalponesController.cs` |
| **Controller MVC** | `{Entidad}Controller.cs` | `GalponesController.cs` |
| **Configuration** | `{Entidad}Configuration.cs` | `GalponConfiguration.cs` (Fluent API) |
| **Validator** | `{Command}Validator.cs` | `CreateGalponCommandValidator.cs` |

### Namespaces Estándar

```csharp
// Domain
namespace ICARUS.Domain.Entities
namespace ICARUS.Domain.Entities.GestionAvicola
namespace ICARUS.Domain.Interfaces
namespace ICARUS.Domain.Enums

// Application
namespace ICARUS.Application.Features.GestionAvicola.Commands.Galpones
namespace ICARUS.Application.Features.GestionAvicola.Queries
namespace ICARUS.Application.Features.GestionAvicola.DTOs
namespace ICARUS.Application.Common
namespace ICARUS.Application.Services
namespace ICARUS.Application.Validators

// Infrastructure
namespace ICARUS.Infrastructure.Data
namespace ICARUS.Infrastructure.Repositories
namespace ICARUS.Infrastructure.Repositories.GestionAvicola
namespace ICARUS.Infrastructure.EntityConfigurations.GestionAvicola
namespace ICARUS.Infrastructure.Services

// API
namespace ICARUS.API.Controllers.Mobile
namespace ICARUS.API.Controllers.Common
namespace ICARUS.API.Authorization
namespace ICARUS.API.Filters

// Web
namespace ICARUS.Web.Areas.GestionAvicola.Controllers
namespace ICARUS.Web.Controllers
namespace ICARUS.Web.Models
namespace ICARUS.Web.Services
namespace ICARUS.Web.Middleware
```

---

## 📝 Sistema de Logging (log4net)

### Namespace para Loggers

```csharp
// ⚠️ SIEMPRE usar log4net
using log4net;

// ⚠️ NUNCA usar ILogger de Microsoft.Extensions.Logging
// ❌ INCORRECTO: private readonly ILogger<MiClase> _logger;
```

### Declaración del Logger

```csharp
// ✅ CORRECTO: Logger estático por clase
public class GalponRepository : GenericRepository<Galpon>, IGalponRepository
{
    private static readonly ILog _logger = LogManager.GetLogger(typeof(GalponRepository));
    
    // Constructor sin logger en parámetros
    public GalponRepository(ApplicationDbContext context) : base(context)
    {
    }
}
```

### Formato de Mensajes de Log

**Formato Obligatorio:**
```
{NombreClase}.{NombreMetodo} - {Mensaje descriptivo} - {Datos contextuales}
```

**Ejemplos:**
```csharp
// ✅ CORRECTO
_logger.Info($"GalponRepository.CreateAsync - Iniciando creación de galpón: {galpon.Nombre}");
_logger.Warn($"GalponRepository.GetByIdAsync - Galpón no encontrado: ID={id}");
_logger.Error($"GalponRepository.UpdateAsync - Error al actualizar galpón ID={id}: {ex.Message}");
_logger.Debug($"GalponRepository.GetAllAsync - Ejecutando query, ClienteId={clienteId}");

// ❌ INCORRECTO (sin contexto)
_logger.Info("Creando galpón");
_logger.Error("Error");
```

### Niveles de Log

| Nivel | Uso | Ejemplo |
|-------|-----|---------|
| **DEBUG** | Debugging detallado, valores de variables | `_logger.Debug($"Variable X={x}, Y={y}")` |
| **INFO** | Operaciones normales exitosas | `_logger.Info("Operación completada")` |
| **WARN** | Advertencias, situaciones anormales recuperables | `_logger.Warn("Galpón no encontrado")` |
| **ERROR** | Errores que impiden completar operación | `_logger.Error($"Error: {ex.Message}")` |
| **FATAL** | Errores críticos que detienen la aplicación | `_logger.Fatal("No se puede conectar a DB")` |

### Ubicación de Archivos de Log

```
ICARUS.API/
└── Logs/
    └── icarus-api.log          # Logs de API

ICARUS.Web/
└── Logs/
    └── icarus.log              # Logs de Web

ICARUS_MOBILE/
└── LogsMobile/
    └── icarus-mobile.log       # Logs de Mobile
```

### Configuración log4net.config

**API y Web (idéntico):**
```xml
<?xml version="1.0" encoding="utf-8" ?>
<log4net>
  <!-- File Appender -->
  <appender name="FileAppender" type="log4net.Appender.RollingFileAppender">
    <file type="log4net.Util.PatternString" value="%property{LogFilePath}/icarus.log" />
    <appendToFile value="true" />
    <rollingStyle value="Size" />
    <maxSizeRollBackups value="10" />
    <maximumFileSize value="10MB" />
    <staticLogFileName value="true" />
    <layout type="log4net.Layout.PatternLayout">
      <conversionPattern value="%date [%thread] %-5level %logger{1} - %message%newline%exception" />
    </layout>
  </appender>

  <!-- Root Logger -->
  <root>
    <level value="DEBUG" />
    <appender-ref ref="FileAppender" />
  </root>

  <!-- Suprimir logs verbosos de Microsoft -->
  <logger name="Microsoft" additivity="false">
    <level value="WARN" />
    <appender-ref ref="FileAppender" />
  </logger>
</log4net>
```

---

## 🎨 Sistema de Estilos CSS (ICARUS Palette)

### Variables CSS Globales (site.css)

```css
:root {
  /* Colores primarios */
  --icarus-primary: #2E86AB;      /* Azul principal */
  --icarus-secondary: #A23B72;    /* Púrpura secundario */
  --icarus-accent: #F18F01;       /* Naranja acento */
  --icarus-light: #E8F4FD;        /* Azul claro */
  --icarus-dark: #1A4B66;         /* Azul oscuro */
  
  /* Colores de estado */
  --icarus-success: #28A745;      /* Verde éxito */
  --icarus-info: #17A2B8;         /* Azul información */
  --icarus-warning: #FFC107;      /* Amarillo advertencia */
  --icarus-danger: #DC3545;       /* Rojo peligro */
  --icarus-muted: #6C757D;        /* Gris neutro */
}
```

### Clases CSS Estándar

#### Botones
```html
<!-- Botones principales -->
<button class="btn btn-icarus">Guardar</button>
<button class="btn btn-icarus-outline">Cancelar</button>
<button class="btn btn-icarus-success">Crear</button>
<button class="btn btn-icarus-danger">Eliminar</button>
<button class="btn btn-icarus-warning">Advertir</button>
```

#### Cards
```html
<div class="card card-custom">
    <div class="card-header card-header-custom">
        <h3 class="card-title mb-0">
            <i class="fas fa-icon me-2"></i>
            Título
        </h3>
        <div class="card-tools">
            <a href="#" class="btn btn-icarus btn-sm">
                <i class="fas fa-plus me-1"></i>
                Acción
            </a>
        </div>
    </div>
    <div class="card-body">
        <!-- Contenido -->
    </div>
</div>
```

#### Tablas
```html
<table class="table table-striped table-hover table-custom">
    <thead class="table-header-custom">
        <tr>
            <th>Columna 1</th>
            <th>Columna 2</th>
            <th>Acciones</th>
        </tr>
    </thead>
    <tbody>
        <!-- Filas -->
    </tbody>
</table>
```

#### Badges
```html
<span class="badge bg-icarus-primary">Texto</span>
<span class="badge bg-icarus-success">Activo</span>
<span class="badge bg-icarus-danger">Inactivo</span>
<span class="badge bg-icarus-muted">Neutro</span>
```

#### Grupos de Botones de Acción
```html
<div class="btn-group" role="group">
    <a href="#" class="btn btn-sm btn-icarus-outline" title="Ver">
        <i class="fas fa-eye"></i>
    </a>
    <a href="#" class="btn btn-sm btn-icarus" title="Editar">
        <i class="fas fa-edit"></i>
    </a>
    <a href="#" class="btn btn-sm btn-icarus-danger" title="Eliminar">
        <i class="fas fa-trash"></i>
    </a>
</div>
```

---

## 🧩 Plantillas de Código Estándar

### 1. Entidad (Domain)

```csharp
using System;
using System.Collections.Generic;

namespace ICARUS.Domain.Entities.GestionAvicola
{
    /// <summary>
    /// Representa un galpón dentro de una granja avícola
    /// </summary>
    public class Galpon : BaseEntity
    {
        public int GestorAvicolaId { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public int CapacidadGallinas { get; set; }
        public int NumeroGallinas { get; set; }
        public DateTime FechaInicio { get; set; }
        
        // Navegación
        public virtual GestorAvicola GestorAvicola { get; set; } = null!;
        public virtual ICollection<RegistroProduccionDiario> RegistrosProduccion { get; set; } = new List<RegistroProduccionDiario>();
    }
}
```

### 2. Interfaz de Repositorio (Domain)

```csharp
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ICARUS.Domain.Interfaces
{
    public interface IGalponRepository : IGenericRepository<Galpon>
    {
        Task<Galpon?> GetByIdWithGestorAsync(int id);
        Task<IEnumerable<Galpon>> GetByClienteIdAsync(int clienteId);
        Task<bool> ExistsByNombreAsync(string nombre, int gestorAvicolaId);
    }
}
```

### 3. Command (Application)

```csharp
using ICARUS.Application.Common;
using ICARUS.Application.Features.GestionAvicola.DTOs;
using MediatR;
using System;

namespace ICARUS.Application.Features.GestionAvicola.Commands.Galpones
{
    public class CreateGalponCommand : IRequest<OperationResult<GalponDto>>
    {
        public int GestorAvicolaId { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public int CapacidadGallinas { get; set; }
        public int NumeroGallinas { get; set; }
        public DateTime FechaInicio { get; set; }
    }
}
```

### 4. Handler (Application)

```csharp
using AutoMapper;
using ICARUS.Application.Common;
using ICARUS.Application.Features.GestionAvicola.DTOs;
using ICARUS.Domain.Entities.GestionAvicola;
using ICARUS.Domain.Interfaces;
using log4net;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace ICARUS.Application.Features.GestionAvicola.Commands.Galpones
{
    public class CreateGalponCommandHandler : IRequestHandler<CreateGalponCommand, OperationResult<GalponDto>>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private static readonly ILog _logger = LogManager.GetLogger(typeof(CreateGalponCommandHandler));

        public CreateGalponCommandHandler(IUnitOfWork unitOfWork, IMapper mapper)
        {
            this._unitOfWork = unitOfWork;
            this._mapper = mapper;
        }

        public async Task<OperationResult<GalponDto>> Handle(CreateGalponCommand request, CancellationToken cancellationToken)
        {
            _logger.Info($"CreateGalponCommandHandler.Handle - Iniciando creación de galpón: {request.Nombre}");

            // 1. Validaciones defensivas
            if (request.GestorAvicolaId <= 0)
            {
                _logger.Warn($"CreateGalponCommandHandler.Handle - GestorAvicolaId inválido: {request.GestorAvicolaId}");
                return OperationResult<GalponDto>.Failure("ID de gestor avícola inválido");
            }

            if (string.IsNullOrWhiteSpace(request.Nombre))
            {
                _logger.Warn("CreateGalponCommandHandler.Handle - Nombre de galpón vacío");
                return OperationResult<GalponDto>.Failure("El nombre del galpón es requerido");
            }

            // 2. Verificar que existe el gestor
            GestorAvicola? gestor = await this._unitOfWork.GestorAvicola.GetByIdAsync(request.GestorAvicolaId);
            if (gestor == null)
            {
                _logger.Warn($"CreateGalponCommandHandler.Handle - Gestor avícola no encontrado: {request.GestorAvicolaId}");
                return OperationResult<GalponDto>.Failure("Gestor avícola no encontrado");
            }

            // 3. Verificar nombre duplicado
            bool existe = await this._unitOfWork.Galpones.ExistsByNombreAsync(request.Nombre, request.GestorAvicolaId);
            if (existe)
            {
                _logger.Warn($"CreateGalponCommandHandler.Handle - Galpón duplicado: {request.Nombre}");
                return OperationResult<GalponDto>.Failure("Ya existe un galpón con ese nombre");
            }

            // 4. Crear entidad
            Galpon galpon = new Galpon
            {
                GestorAvicolaId = request.GestorAvicolaId,
                Nombre = request.Nombre.Trim(),
                CapacidadGallinas = request.CapacidadGallinas,
                NumeroGallinas = request.NumeroGallinas,
                FechaInicio = request.FechaInicio,
                FechaCreacion = DateTime.Now,
                EstaActivo = true
            };

            // 5. Persistir
            await this._unitOfWork.Galpones.AddAsync(galpon);
            await this._unitOfWork.CommitAsync();

            _logger.Info($"CreateGalponCommandHandler.Handle - Galpón creado exitosamente: ID={galpon.Id}, Nombre={galpon.Nombre}");

            // 6. Mapear y retornar
            GalponDto dto = this._mapper.Map<GalponDto>(galpon);
            return OperationResult<GalponDto>.Success(dto);
        }
    }
}
```

### 5. Repository (Infrastructure)

```csharp
using ICARUS.Domain.Entities.GestionAvicola;
using ICARUS.Domain.Interfaces;
using ICARUS.Infrastructure.Data;
using log4net;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ICARUS.Infrastructure.Repositories.GestionAvicola
{
    public class GalponRepository : GenericRepository<Galpon>, IGalponRepository
    {
        private static readonly ILog _logger = LogManager.GetLogger(typeof(GalponRepository));

        public GalponRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<Galpon?> GetByIdWithGestorAsync(int id)
        {
            _logger.Info($"GalponRepository.GetByIdWithGestorAsync - Buscando galpón ID={id}");

            if (id <= 0)
            {
                _logger.Warn($"GalponRepository.GetByIdWithGestorAsync - ID inválido: {id}");
                return null;
            }

            Galpon? galpon = await this._dbSet
                .Include(g => g.GestorAvicola)
                .FirstOrDefaultAsync(g => g.Id == id);

            if (galpon == null)
            {
                _logger.Warn($"GalponRepository.GetByIdWithGestorAsync - Galpón no encontrado: ID={id}");
            }

            return galpon;
        }

        public async Task<IEnumerable<Galpon>> GetByClienteIdAsync(int clienteId)
        {
            _logger.Info($"GalponRepository.GetByClienteIdAsync - Buscando galpones para ClienteId={clienteId}");

            if (clienteId <= 0)
            {
                _logger.Warn($"GalponRepository.GetByClienteIdAsync - ClienteId inválido: {clienteId}");
                return Enumerable.Empty<Galpon>();
            }

            List<Galpon> galpones = await this._dbSet
                .Include(g => g.GestorAvicola)
                .Where(g => g.GestorAvicola.ClienteId == clienteId && g.EstaActivo)
                .ToListAsync();

            _logger.Info($"GalponRepository.GetByClienteIdAsync - Encontrados {galpones.Count} galpones");
            return galpones;
        }

        public async Task<bool> ExistsByNombreAsync(string nombre, int gestorAvicolaId)
        {
            if (string.IsNullOrWhiteSpace(nombre))
            {
                return false;
            }

            bool existe = await this._dbSet
                .AnyAsync(g => g.Nombre == nombre.Trim() && 
                              g.GestorAvicolaId == gestorAvicolaId && 
                              g.EstaActivo);

            _logger.Debug($"GalponRepository.ExistsByNombreAsync - Nombre={nombre}, Existe={existe}");
            return existe;
        }
    }
}
```

### 6. Entity Configuration (Infrastructure)

```csharp
using ICARUS.Domain.Entities.GestionAvicola;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ICARUS.Infrastructure.EntityConfigurations.GestionAvicola
{
    public class GalponConfiguration : IEntityTypeConfiguration<Galpon>
    {
        public void Configure(EntityTypeBuilder<Galpon> builder)
        {
            // Tabla
            builder.ToTable("Galpones", table =>
            {
                table.HasCheckConstraint("CK_Galpon_CapacidadGallinas", "[CapacidadGallinas] >= 0");
                table.HasCheckConstraint("CK_Galpon_NumeroGallinas", "[NumeroGallinas] >= 0");
            });

            // Clave primaria
            builder.HasKey(e => e.Id);

            // Propiedades
            builder.Property(e => e.Nombre)
                .HasMaxLength(200)
                .IsRequired()
                .HasComment("Nombre del galpón");

            builder.Property(e => e.CapacidadGallinas)
                .IsRequired()
                .HasComment("Capacidad máxima de gallinas");

            builder.Property(e => e.NumeroGallinas)
                .IsRequired()
                .HasComment("Número actual de gallinas");

            builder.Property(e => e.FechaInicio)
                .IsRequired()
                .HasComment("Fecha de inicio de operaciones");

            // Relaciones
            builder.HasOne(g => g.GestorAvicola)
                .WithMany(ga => ga.Galpones)
                .HasForeignKey(g => g.GestorAvicolaId)
                .OnDelete(DeleteBehavior.Cascade);

            // Índices
            builder.HasIndex(e => new { e.GestorAvicolaId, e.Nombre })
                .IsUnique()
                .HasDatabaseName("IX_Galpones_GestorAvicola_Nombre");

            builder.HasIndex(e => e.EstaActivo);
        }
    }
}
```

### 7. Controller API (Mobile)

```csharp
using ICARUS.Application.Common;
using ICARUS.Application.Features.GestionAvicola.Commands.Galpones;
using ICARUS.Application.Features.GestionAvicola.DTOs;
using ICARUS.Application.Features.GestionAvicola.Queries;
using log4net;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ICARUS.API.Controllers.Mobile
{
    [Authorize]
    [ApiController]
    [Route("api/mobile/[controller]")]
    public class GalponesController : ControllerBase
    {
        private readonly IMediator _mediator;
        private static readonly ILog _logger = LogManager.GetLogger(typeof(GalponesController));

        public GalponesController(IMediator mediator)
        {
            this._mediator = mediator;
        }

        /// <summary>
        /// Obtiene lista de galpones del cliente
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<OperationResult<List<GalponDto>>>> GetGalpones()
        {
            _logger.Info("GalponesController.GetGalpones - Iniciando consulta");

            // Obtener ClienteId del claim del JWT
            string? clienteIdClaim = this.User.FindFirst("ClienteId")?.Value;
            if (string.IsNullOrWhiteSpace(clienteIdClaim) || !int.TryParse(clienteIdClaim, out int clienteId))
            {
                _logger.Warn("GalponesController.GetGalpones - ClienteId no encontrado en token");
                return this.Unauthorized();
            }

            GetGalponesQuery query = new GetGalponesQuery { ClienteId = clienteId };
            OperationResult<List<GalponDto>> result = await this._mediator.Send(query);

            if (!result.IsSuccess)
            {
                _logger.Error($"GalponesController.GetGalpones - Error: {result.ErrorMessage}");
                return this.BadRequest(result);
            }

            _logger.Info($"GalponesController.GetGalpones - Retornando {result.Data?.Count ?? 0} galpones");
            return this.Ok(result);
        }

        /// <summary>
        /// Crea un nuevo galpón
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<OperationResult<GalponDto>>> CreateGalpon([FromBody] CreateGalponCommand command)
        {
            _logger.Info($"GalponesController.CreateGalpon - Creando galpón: {command?.Nombre}");

            if (command == null)
            {
                _logger.Warn("GalponesController.CreateGalpon - Command es nulo");
                return this.BadRequest("Datos inválidos");
            }

            OperationResult<GalponDto> result = await this._mediator.Send(command);

            if (!result.IsSuccess)
            {
                _logger.Error($"GalponesController.CreateGalpon - Error: {result.ErrorMessage}");
                return this.BadRequest(result);
            }

            _logger.Info($"GalponesController.CreateGalpon - Galpón creado: ID={result.Data?.Id}");
            return this.CreatedAtAction(nameof(GetGalpones), new { id = result.Data?.Id }, result);
        }
    }
}
```

### 8. Controller MVC (Web)

```csharp
using AutoMapper;
using ICARUS.Application.Common;
using ICARUS.Application.Features.GestionAvicola.Commands.Galpones;
using ICARUS.Application.Features.GestionAvicola.DTOs;
using ICARUS.Application.Features.GestionAvicola.Queries;
using ICARUS.Web.Models;
using log4net;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ICARUS.Web.Areas.GestionAvicola.Controllers
{
    [Authorize]
    [Area("GestionAvicola")]
    public class GalponesController : Controller
    {
        private readonly IMediator _mediator;
        private readonly IMapper _mapper;
        private static readonly ILog _logger = LogManager.GetLogger(typeof(GalponesController));

        public GalponesController(IMediator mediator, IMapper mapper)
        {
            this._mediator = mediator;
            this._mapper = mapper;
        }

        // GET: GestionAvicola/Galpones
        public async Task<IActionResult> Index()
        {
            _logger.Info("GalponesController.Index - Listando galpones");

            // Obtener ClienteId del usuario autenticado (desde Identity)
            int clienteId = this.GetClienteIdFromUser();

            GetGalponesQuery query = new GetGalponesQuery { ClienteId = clienteId };
            OperationResult<List<GalponDto>> result = await this._mediator.Send(query);

            if (!result.IsSuccess)
            {
                _logger.Error($"GalponesController.Index - Error: {result.ErrorMessage}");
                this.TempData["ErrorMessage"] = result.ErrorMessage;
                return this.View(new List<GalponViewModel>());
            }

            List<GalponViewModel> viewModels = this._mapper.Map<List<GalponViewModel>>(result.Data);
            return this.View(viewModels);
        }

        // GET: GestionAvicola/Galpones/Create
        public IActionResult Create()
        {
            _logger.Info("GalponesController.Create - Mostrando formulario de creación");
            return this.View();
        }

        // POST: GestionAvicola/Galpones/Create
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(CreateGalponViewModel model)
        {
            if (!this.ModelState.IsValid)
            {
                _logger.Warn("GalponesController.Create - ModelState inválido");
                return this.View(model);
            }

            _logger.Info($"GalponesController.Create - Creando galpón: {model.Nombre}");

            CreateGalponCommand command = this._mapper.Map<CreateGalponCommand>(model);
            OperationResult<GalponDto> result = await this._mediator.Send(command);

            if (!result.IsSuccess)
            {
                _logger.Error($"GalponesController.Create - Error: {result.ErrorMessage}");
                this.TempData["ErrorMessage"] = result.ErrorMessage;
                return this.View(model);
            }

            _logger.Info($"GalponesController.Create - Galpón creado: ID={result.Data?.Id}");
            this.TempData["SuccessMessage"] = "Galpón creado exitosamente";
            return this.RedirectToAction(nameof(Index));
        }

        private int GetClienteIdFromUser()
        {
            string? clienteIdClaim = this.User.FindFirst("ClienteId")?.Value;
            if (!string.IsNullOrWhiteSpace(clienteIdClaim) && int.TryParse(clienteIdClaim, out int clienteId))
            {
                return clienteId;
            }
            return 0;
        }
    }
}
```

### 9. Vista Razor (Index)

```html
@model List<ICARUS.Web.Models.GalponViewModel>

@{
    ViewData["Title"] = "Galpones";
}

<div class="container-fluid">
    <!-- Encabezado -->
    <div class="row mb-4">
        <div class="col-12">
            <h1 class="text-icarus-primary">
                <i class="fas fa-warehouse me-2"></i>
                Gestión de Galpones
            </h1>
            <p class="text-muted">Administra los galpones de tu granja avícola</p>
        </div>
    </div>

    <!-- Mensajes de éxito/error -->
    @if (TempData["SuccessMessage"] != null)
    {
        <div class="alert alert-icarus-success alert-dismissible fade show" role="alert">
            <i class="fas fa-check-circle me-2"></i>
            @TempData["SuccessMessage"]
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    }

    @if (TempData["ErrorMessage"] != null)
    {
        <div class="alert alert-icarus-danger alert-dismissible fade show" role="alert">
            <i class="fas fa-exclamation-triangle me-2"></i>
            @TempData["ErrorMessage"]
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    }

    <!-- Card principal -->
    <div class="card card-custom">
        <div class="card-header card-header-custom">
            <h3 class="card-title mb-0">
                <i class="fas fa-list me-2"></i>
                Lista de Galpones
            </h3>
            <div class="card-tools">
                <a asp-action="Create" class="btn btn-icarus btn-sm">
                    <i class="fas fa-plus me-1"></i>
                    Nuevo Galpón
                </a>
            </div>
        </div>
        <div class="card-body">
            @if (Model?.Any() == true)
            {
                <div class="table-responsive">
                    <table id="galponesTable" class="table table-striped table-hover table-custom">
                        <thead class="table-header-custom">
                            <tr>
                                <th>Nombre</th>
                                <th>Capacidad</th>
                                <th>Gallinas Actuales</th>
                                <th>Fecha Inicio</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach (var galpon in Model)
                            {
                                <tr>
                                    <td>@galpon.Nombre</td>
                                    <td>@galpon.CapacidadGallinas.ToString("N0")</td>
                                    <td>@galpon.NumeroGallinas.ToString("N0")</td>
                                    <td>@galpon.FechaInicio.ToString("dd/MM/yyyy")</td>
                                    <td>
                                        @if (galpon.EstaActivo)
                                        {
                                            <span class="badge bg-icarus-success">Activo</span>
                                        }
                                        else
                                        {
                                            <span class="badge bg-icarus-danger">Inactivo</span>
                                        }
                                    </td>
                                    <td>
                                        <div class="btn-group" role="group">
                                            <a asp-action="Details" asp-route-id="@galpon.Id" 
                                               class="btn btn-sm btn-icarus-outline" title="Ver detalles">
                                                <i class="fas fa-eye"></i>
                                            </a>
                                            <a asp-action="Edit" asp-route-id="@galpon.Id" 
                                               class="btn btn-sm btn-icarus" title="Editar">
                                                <i class="fas fa-edit"></i>
                                            </a>
                                            <button type="button" class="btn btn-sm btn-icarus-danger" 
                                                    title="Eliminar" onclick="eliminarGalpon(@galpon.Id, '@galpon.Nombre')">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            }
                        </tbody>
                    </table>
                </div>
            }
            else
            {
                <div class="text-center py-5">
                    <i class="fas fa-warehouse fa-3x text-icarus-muted mb-3"></i>
                    <h5 class="text-icarus-muted">No hay galpones registrados</h5>
                    <p class="text-muted">Comienza agregando tu primer galpón.</p>
                    <a asp-action="Create" class="btn btn-icarus">
                        <i class="fas fa-plus me-2"></i>
                        Crear Primer Galpón
                    </a>
                </div>
            }
        </div>
    </div>
</div>

@section Scripts {
    <script>
        $(document).ready(function () {
            // Inicializar DataTable
            $('#galponesTable').DataTable({
                language: {
                    url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json'
                },
                pageLength: 10,
                order: [[0, 'asc']]
            });
        });

        function eliminarGalpon(id, nombre) {
            Swal.fire({
                title: '¿Eliminar galpón?',
                text: `¿Estás seguro de eliminar el galpón "${nombre}"?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#DC3545',
                cancelButtonColor: '#6C757D',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    $.ajax({
                        url: '@Url.Action("Delete")',
                        type: 'POST',
                        data: { id: id },
                        success: function () {
                            Swal.fire('¡Eliminado!', 'El galpón ha sido eliminado.', 'success')
                                .then(() => location.reload());
                        },
                        error: function () {
                            Swal.fire('Error', 'No se pudo eliminar el galpón.', 'error');
                        }
                    });
                }
            });
        }
    </script>
}
```

---

## 🚀 Checklist de Desarrollo de Nueva Funcionalidad

### Paso 1: Domain Layer
- [ ] Crear entidad en `ICARUS.Domain/Entities/{Modulo}/`
- [ ] Heredar de `BaseEntity`
- [ ] Definir propiedades y navegación
- [ ] Crear interfaz `I{Entidad}Repository` en `ICARUS.Domain/Interfaces/`

### Paso 2: Infrastructure Layer
- [ ] Crear configuración Fluent API en `EntityConfigurations/{Modulo}/`
- [ ] Configurar tabla, propiedades, relaciones, índices
- [ ] Crear repositorio en `Repositories/{Modulo}/`
- [ ] Implementar métodos específicos del repositorio
- [ ] Agregar DbSet en `ApplicationDbContext`
- [ ] Registrar repositorio en `UnitOfWork`
- [ ] Generar migración: `dotnet ef migrations add {Nombre}`
- [ ] Aplicar migración: `dotnet ef database update`

### Paso 3: Application Layer
- [ ] Crear DTOs en `Features/{Modulo}/DTOs/`
- [ ] Crear Commands en `Features/{Modulo}/Commands/{Entidad}/`
- [ ] Crear Handlers para Commands
- [ ] Crear Queries en `Features/{Modulo}/Queries/`
- [ ] Crear Handlers para Queries
- [ ] Configurar AutoMapper profiles
- [ ] Agregar validaciones con FluentValidation (opcional)

### Paso 4: API Layer (Mobile)
- [ ] Crear controller en `Controllers/Mobile/`
- [ ] Implementar endpoints REST (GET, POST, PUT, DELETE)
- [ ] Agregar autorización JWT con `[Authorize]`
- [ ] Agregar logging en cada endpoint
- [ ] Probar con Swagger

### Paso 5: Web Layer (MVC)
- [ ] Crear ViewModels en `Models/`
- [ ] Crear controller en `Areas/{Modulo}/Controllers/`
- [ ] Implementar acciones (Index, Create, Edit, Details, Delete)
- [ ] Crear vistas Razor en `Areas/{Modulo}/Views/{Controller}/`
- [ ] Aplicar estilos ICARUS personalizados
- [ ] Agregar JavaScript para interactividad (SweetAlert2, DataTables)
- [ ] Configurar AutoMapper para ViewModels ↔ DTOs

### Paso 6: Testing y Validación
- [ ] Probar flujo completo en Web
- [ ] Probar endpoints API con Swagger
- [ ] Probar desde aplicación móvil
- [ ] Verificar logs en `Logs/`
- [ ] Validar soft delete (EstaActivo)
- [ ] Verificar audit trail (FechaCreacion, CreadoPor)

---

## 📚 Referencias Rápidas

### Comandos EF Core Migrations

```bash
# Crear migración
dotnet ef migrations add NombreMigracion --project ICARUS.Infrastructure --startup-project ICARUS.Web

# Aplicar migración
dotnet ef database update --project ICARUS.Infrastructure --startup-project ICARUS.Web

# Revertir última migración
dotnet ef database update PreviousMigrationName --project ICARUS.Infrastructure --startup-project ICARUS.Web

# Eliminar última migración
dotnet ef migrations remove --project ICARUS.Infrastructure --startup-project ICARUS.Web

# Ver migraciones aplicadas
dotnet ef migrations list --project ICARUS.Infrastructure --startup-project ICARUS.Web
```

### Ejecutar Proyectos

```bash
# API (puerto 5090)
dotnet run --project ICARUS.API --launch-profile http

# Web (puerto 5188)
dotnet run --project ICARUS.Web --launch-profile http

# Ambos simultáneamente (usar 2 terminales)
```

### Dependencias NuGet Principales

**Todos los proyectos:**
- `log4net` (v2.0.17)

**ICARUS.Application:**
- `MediatR` (v12.x)
- `AutoMapper.Extensions.Microsoft.DependencyInjection` (v12.x)
- `FluentValidation.DependencyInjectionExtensions` (v11.x)

**ICARUS.Infrastructure:**
- `Microsoft.EntityFrameworkCore.SqlServer` (v8.x)
- `Microsoft.EntityFrameworkCore.Tools` (v8.x)
- `Microsoft.AspNetCore.Identity.EntityFrameworkCore` (v8.x)

**ICARUS.API:**
- `Microsoft.AspNetCore.Authentication.JwtBearer` (v8.x)
- `Swashbuckle.AspNetCore` (v6.x)

**ICARUS.Web:**
- `Microsoft.AspNetCore.Identity.UI` (v8.x)

---

## ✅ Resumen de Convenciones Críticas

1. **Logging:** SIEMPRE usar `log4net`, formato `{Clase}.{Metodo} - {Mensaje} - {Datos}`
2. **Soft Delete:** NUNCA borrar físicamente, usar `EstaActivo = false`
3. **Audit Trail:** Automático en `BaseEntity` (FechaCreacion, CreadoPor, etc.)
4. **Validaciones:** Programación defensiva, validar TODOS los inputs
5. **Namespaces:** Organizar por módulo y capa
6. **Estilos:** Usar variables CSS `--icarus-*` y clases `btn-icarus`
7. **Nomenclatura:** PascalCase para todo excepto campos privados (`_camelCase`)
8. **CQRS:** Separar Commands (escritura) y Queries (lectura)
9. **Repository:** Métodos específicos por entidad, evitar lógica de negocio
10. **AutoMapper:** Para mapear Entity ↔ DTO ↔ ViewModel

---

**Documento creado:** Diciembre 2025  
**Última actualización:** Diciembre 2025
