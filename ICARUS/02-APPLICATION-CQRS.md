# ICARUS - Documentación Application Layer (CQRS)

**Capa:** ICARUS.Application  
**Responsabilidad:** Lógica de aplicación, casos de uso, orquestación (CQRS + MediatR)

---

## 📋 Estructura de la Capa Application

```
ICARUS.Application/
├── Common/
│   ├── OperationResult.cs              # Wrapper para respuestas
│   └── Mappings/                       # Perfiles AutoMapper
│
├── Features/                           # Features organizadas por módulo
│   ├── GestionAvicola/
│   │   ├── Commands/
│   │   │   ├── Galpones/
│   │   │   │   ├── CreateGalponCommand.cs
│   │   │   │   ├── CreateGalponCommandHandler.cs
│   │   │   │   ├── UpdateGalponCommand.cs
│   │   │   │   └── ...
│   │   │   ├── RegistroProduccion/
│   │   │   │   ├── CreateRegistroProduccionDiarioCommand.cs
│   │   │   │   ├── CreateRegistroProduccionDiarioCommandHandler.cs
│   │   │   │   └── ...
│   │   │   └── ProgramaVacunacion/
│   │   │
│   │   ├── Queries/
│   │   │   ├── GetGalponesQuery.cs
│   │   │   ├── GetRegistrosProduccionQuery.cs
│   │   │   └── ...
│   │   │
│   │   └── DTOs/
│   │       ├── GalponDto.cs
│   │       ├── RegistroProduccionDiarioDto.cs
│   │       └── ...
│   │
│   ├── ControlAcceso/
│   │   ├── Commands/
│   │   ├── Queries/
│   │   └── DTOs/
│   │
│   └── TrabajadorMobileAuth/
│       ├── Commands/
│       └── Queries/
│
├── Commands/                           # Commands globales (legacy)
├── Queries/                            # Queries globales (legacy)
├── Handlers/                           # Handlers globales (legacy)
├── DTOs/                               # DTOs compartidos
├── Validators/                         # FluentValidation
├── Services/                           # Servicios de aplicación
├── Interfaces/                         # Interfaces de servicios
└── Behaviors/                          # MediatR behaviors (middleware)
```

---

## 🎯 Patrón CQRS con MediatR

### Concepto

**CQRS:** Command Query Responsibility Segregation  
- **Commands:** Modifican estado (Create, Update, Delete)
- **Queries:** Solo lectura (Get, List)

**MediatR:** Biblioteca que implementa patrón Mediator para desacoplar requests/handlers

---

## 📝 Commands (Escritura)

### Anatomía de un Command

```csharp
// 1. Command (Request)
public class CreateRegistroProduccionDiarioCommand : IRequest<OperationResult<RegistroProduccionDiarioDto>>
{
    public DateTime Fecha { get; set; }
    public int GalponId { get; set; }
    public int CantidadMaples { get; set; }
    public int UnidadesIncompletas { get; set; }
    public int GallinasMuertas { get; set; }
    public string? Observaciones { get; set; }
}

// 2. Handler (Procesador)
public class CreateRegistroProduccionDiarioCommandHandler 
    : IRequestHandler<CreateRegistroProduccionDiarioCommand, OperationResult<RegistroProduccionDiarioDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private static readonly ILog _logger = LogManager.GetLogger(typeof(CreateRegistroProduccionDiarioCommandHandler));

    public async Task<OperationResult<RegistroProduccionDiarioDto>> Handle(
        CreateRegistroProduccionDiarioCommand request, 
        CancellationToken cancellationToken)
    {
        _logger.Info($"Iniciando creación de registro de producción - GalponId: {request.GalponId}");
        
        // 1. Validación de negocio
        if (request.Fecha.Date > DateTime.Today)
        {
            return OperationResult<RegistroProduccionDiarioDto>.Failure(
                "No se pueden crear registros con fecha futura");
        }
        
        // 2. Obtener entidad relacionada
        Galpon? galpon = await _unitOfWork.Galpones.GetByIdWithGestorAsync(request.GalponId);
        if (galpon == null)
        {
            return OperationResult<RegistroProduccionDiarioDto>.Failure("Galpón no encontrado");
        }
        
        // 3. Crear entidad
        var registro = new RegistroProduccionDiario
        {
            Fecha = request.Fecha,
            GalponId = request.GalponId,
            ClienteId = galpon.GestorAvicola.ClienteId,
            CantidadMaples = request.CantidadMaples,
            UnidadesIncompletas = request.UnidadesIncompletas,
            GallinasMuertas = request.GallinasMuertas,
            FechaCreacion = DateTime.Now,
            EstaActivo = true
        };
        
        // 4. Persistir
        await _unitOfWork.RegistroProduccionDiario.AddAsync(registro);
        await _unitOfWork.CommitAsync();
        
        // 5. Mapear y retornar
        var dto = _mapper.Map<RegistroProduccionDiarioDto>(registro);
        return OperationResult<RegistroProduccionDiarioDto>.Success(dto);
    }
}
```

### Uso desde Controller

```csharp
[HttpPost]
public async Task<IActionResult> Create([FromBody] CreateRegistroProduccionDiarioCommand command)
{
    var result = await _mediator.Send(command);  // MediatR enruta al handler
    
    if (!result.IsSuccess)
        return BadRequest(result.ErrorMessage);
    
    return Ok(result.Data);
}
```

---

## 🔍 Queries (Lectura)

### Anatomía de una Query

```csharp
// 1. Query (Request)
public class GetRegistrosProduccionByGalponQuery : IRequest<OperationResult<List<RegistroProduccionDiarioDto>>>
{
    public int GalponId { get; set; }
    public DateTime? FechaInicio { get; set; }
    public DateTime? FechaFin { get; set; }
}

// 2. Handler
public class GetRegistrosProduccionByGalponQueryHandler 
    : IRequestHandler<GetRegistrosProduccionByGalponQuery, OperationResult<List<RegistroProduccionDiarioDto>>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    
    public async Task<OperationResult<List<RegistroProduccionDiarioDto>>> Handle(
        GetRegistrosProduccionByGalponQuery request, 
        CancellationToken cancellationToken)
    {
        // 1. Query con filtros
        var registros = await _unitOfWork.RegistroProduccionDiario
            .GetByGalponAsync(
                request.GalponId, 
                request.FechaInicio, 
                request.FechaFin);
        
        // 2. Mapear a DTOs
        var dtos = _mapper.Map<List<RegistroProduccionDiarioDto>>(registros);
        
        return OperationResult<List<RegistroProduccionDiarioDto>>.Success(dtos);
    }
}
```

---

## 📦 DTOs (Data Transfer Objects)

### Propósito

- Desacoplar entidades de dominio de la API
- Controlar qué datos se exponen
- Evitar sobre-fetching (lazy loading issues)

### Ejemplo: RegistroProduccionDiarioDto

```csharp
public class RegistroProduccionDiarioDto
{
    public int Id { get; set; }
    public DateTime Fecha { get; set; }
    public int GalponId { get; set; }
    public string NumeroGalpon { get; set; } = string.Empty;
    public int CantidadMaples { get; set; }
    public int UnidadesIncompletas { get; set; }
    public int GallinasMuertas { get; set; }
    public string? Observaciones { get; set; }
    
    // Propiedades calculadas
    public int TotalHuevos => (CantidadMaples * 30) + UnidadesIncompletas;
    public decimal PorcentajeProduccion { get; set; }
    
    // Datos relacionados desnormalizados
    public string NombreGranja { get; set; } = string.Empty;
    public int GallinasActuales { get; set; }
}
```

### AutoMapper Profile

```csharp
public class GestionAvicolaMappingProfile : Profile
{
    public GestionAvicolaMappingProfile()
    {
        CreateMap<RegistroProduccionDiario, RegistroProduccionDiarioDto>()
            .ForMember(dest => dest.NumeroGalpon, 
                opt => opt.MapFrom(src => src.Galpon.Numero))
            .ForMember(dest => dest.NombreGranja, 
                opt => opt.MapFrom(src => src.Galpon.GestorAvicola.Nombre))
            .ForMember(dest => dest.GallinasActuales, 
                opt => opt.MapFrom(src => src.Galpon.GallinasActuales));
    }
}
```

---

## ✅ OperationResult Pattern

### Propósito

Wrapper consistente para todas las respuestas (éxito o error)

```csharp
public class OperationResult<T>
{
    public bool IsSuccess { get; set; }
    public bool IsFailure => !IsSuccess;
    public T? Data { get; set; }
    public string ErrorMessage { get; set; } = string.Empty;
    public List<string> Errors { get; set; } = new();
    
    public static OperationResult<T> Success(T? data)
    {
        return new OperationResult<T>
        {
            IsSuccess = true,
            Data = data
        };
    }
    
    public static OperationResult<T> Failure(string errorMessage)
    {
        return new OperationResult<T>
        {
            IsSuccess = false,
            ErrorMessage = errorMessage
        };
    }
    
    public static OperationResult<T> Failure(List<string> errors)
    {
        return new OperationResult<T>
        {
            IsSuccess = false,
            Errors = errors,
            ErrorMessage = string.Join(", ", errors)
        };
    }
}
```

### Ventajas

✅ No lanza excepciones para errores de negocio  
✅ Fácil de testear  
✅ API consistente  
✅ Soporta múltiples errores

---

## 📚 Commands Principales por Módulo

### Gestión Avícola

#### Galpones
```
CreateGalponCommand            → Crear galpón
UpdateGalponCommand            → Actualizar datos
AsignarProgramaGalponCommand   → Asignar programa vacunación
DesasignarProgramaGalponCommand → Remover programa
```

#### Registro de Producción
```
CreateRegistroProduccionDiarioCommand  → Crear registro diario
UpdateRegistroProduccionDiarioCommand  → Actualizar registro
DeleteRegistroProduccionDiarioCommand  → Eliminar registro (soft delete)
```

#### Programas de Vacunación
```
CreateProgramaVacunacionCommand        → Crear programa completo
UpdateProgramaVacunacionCommand        → Actualizar programa
DeleteProgramaVacunacionCommand        → Eliminar programa
CreateCronogramaVacunacionCommand      → Agregar vacuna al cronograma
UpdateCronogramaVacunacionCommand      → Modificar vacuna
```

#### Tareas de Galpón
```
CompletarTareaVacunacionCommand       → Marcar tarea como completada
CompletarTareaIluminacionCommand
CompletarTareaAlimentacionCommand
```

### Control de Acceso

#### Trabajadores
```
CreateTrabajadorAccesoCommand         → Configurar acceso
UpdateTrabajadorAccesoCommand         → Actualizar permisos
DeleteTrabajadorAccesoCommand         → Revocar acceso
```

#### Registro de Accesos
```
RegistrarAccesoCommand                → Registrar entrada/salida
ValidarAccesoCommand                  → Verificar permisos
```

#### Biométricos
```
RegistrarDatosBiometricosCommand      → Guardar huella
ActualizarDatosBiometricosCommand     → Actualizar huella
```

---

## 📖 Queries Principales por Módulo

### Gestión Avícola

#### Galpones
```
GetGalponesQuery                      → Listar todos
GetGalponByIdQuery                    → Obtener por ID
GetGalponesByGranjaQuery              → Filtrar por granja
```

#### Registros de Producción
```
GetRegistrosProduccionByGalponQuery   → Por galpón y fechas
GetRegistrosProduccionByFechaQuery    → Por rango fechas
GetEstadisticasProduccionQuery        → Estadísticas agregadas
```

#### Programas de Vacunación
```
GetAllProgramasVacunacionQuery        → Listar todos
GetProgramaVacunacionByIdQuery        → Por ID
GetProgramaVacunacionByFechaQuery     → Por fecha emisión
GetCronogramasVacunacionByProgramaQuery → Cronograma completo
```

#### Notificaciones/Tareas
```
GetTareasPendientesQuery              → Tareas del día
GetTareasVencidas Query                → Tareas atrasadas
GetNotificacionesPorTrabajadorQuery   → Por usuario móvil
```

### Control de Acceso

```
GetTrabajadoresAccesoQuery            → Listar con acceso
GetRegistrosAccesoByTrabajadorQuery   → Historial por trabajador
GetRegistrosAccesoByFechaQuery        → Por rango fechas
ValidarAccesoTrabajadorQuery          → Verificar permisos
GetZonasAccesoByClienteQuery          → Listar zonas
```

---

## 🔄 Flujo Completo (Ejemplo Real)

### Crear Registro de Producción desde Móvil

```
1. MÓVIL - ViewModel
   ↓
   var command = new CreateRegistroProduccionDiarioCommand
   {
       GalponId = 5,
       Fecha = DateTime.Today,
       CantidadMaples = 100,
       UnidadesIncompletas = 15,
       GallinasMuertas = 2
   };
   
2. MÓVIL → API
   ↓
   POST /api/mobile/gestionavicola/produccion
   Body: command (JSON)
   
3. API - Controller
   ↓
   var result = await _mediator.Send(command);
   
4. MediatR Routing
   ↓
   CreateRegistroProduccionDiarioCommandHandler.Handle()
   
5. HANDLER - Validaciones
   ↓
   - Fecha no futura ✓
   - Galpón existe ✓
   - UnidadesIncompletas < 30 ✓
   
6. HANDLER - Obtener Galpón
   ↓
   var galpon = await _unitOfWork.Galpones.GetByIdWithGestorAsync(5);
   ClienteId = galpon.GestorAvicola.ClienteId;
   
7. HANDLER - Crear Entidad
   ↓
   var registro = new RegistroProduccionDiario
   {
       Fecha = command.Fecha,
       GalponId = command.GalponId,
       ClienteId = clienteId,
       ...
   };
   
8. HANDLER - Persistir
   ↓
   await _unitOfWork.RegistroProduccionDiario.AddAsync(registro);
   await _unitOfWork.CommitAsync();
   
9. HANDLER - Actualizar Inventario (si hay mortalidad)
   ↓
   if (command.GallinasMuertas > 0)
   {
       galpon.GallinasActuales -= command.GallinasMuertas;
       await _unitOfWork.CommitAsync();
   }
   
10. HANDLER - Crear Registro de Mortalidad
    ↓
    if (command.GallinasMuertas > 0)
    {
        var mortalidad = new RegistroMortalidad {...};
        await _unitOfWork.RegistroMortalidad.AddAsync(mortalidad);
        await _unitOfWork.CommitAsync();
    }
    
11. HANDLER - Mapear DTO
    ↓
    var dto = _mapper.Map<RegistroProduccionDiarioDto>(registro);
    
12. HANDLER - Retornar
    ↓
    return OperationResult<RegistroProduccionDiarioDto>.Success(dto);
    
13. API → MÓVIL
    ↓
    200 OK
    {
        "isSuccess": true,
        "data": {
            "id": 123,
            "fecha": "2025-12-15",
            "totalHuevos": 3015,
            ...
        }
    }
    
14. MÓVIL - ViewModel
    ↓
    ObservableCollection.Add(dto);
    await Shell.GoToAsync("..");  // Volver a lista
```

---

## 🛡️ Validaciones

### FluentValidation (Ejemplo)

```csharp
public class CreateGalponCommandValidator : AbstractValidator<CreateGalponCommand>
{
    public CreateGalponCommandValidator()
    {
        RuleFor(x => x.Numero)
            .NotEmpty().WithMessage("El número del galpón es requerido")
            .MaximumLength(50).WithMessage("Máximo 50 caracteres");
        
        RuleFor(x => x.CapacidadMaxima)
            .GreaterThan(0).WithMessage("La capacidad debe ser mayor a 0")
            .LessThanOrEqualTo(100000).WithMessage("Capacidad máxima: 100,000");
        
        RuleFor(x => x.GallinasActuales)
            .GreaterThanOrEqualTo(0).WithMessage("No puede ser negativo")
            .LessThanOrEqualTo(x => x.CapacidadMaxima)
                .WithMessage("No puede exceder la capacidad máxima");
        
        RuleFor(x => x.FechaNacimiento)
            .LessThanOrEqualTo(DateTime.Today)
                .WithMessage("La fecha de nacimiento no puede ser futura");
    }
}
```

**Configuración en Program.cs:**
```csharp
services.AddValidatorsFromAssembly(typeof(CreateGalponCommandValidator).Assembly);
services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
```

---

## 📊 Estadísticas de Application Layer

### ICARUS.Application
- **Commands:** ~96
- **Queries:** ~74
- **DTOs:** ~50+
- **Handlers:** ~170
- **Validators:** ~15
- **Líneas de código:** ~25,000+

---

## 🔍 Próximo: Infrastructure Layer

Ver **03-INFRASTRUCTURE.md** para EF Core, Repositorios, Migraciones y DbContext.
