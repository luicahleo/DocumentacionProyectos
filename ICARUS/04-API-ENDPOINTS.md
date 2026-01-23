# 04 - ICARUS.API - Endpoints y Autenticación JWT

## Tabla de Contenidos
1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura de la API](#arquitectura-de-la-api)
3. [Configuración JWT](#configuración-jwt)
4. [Controllers y Endpoints](#controllers-y-endpoints)
5. [Políticas de Autorización](#políticas-de-autorización)
6. [Swagger/OpenAPI](#swagger-openapi)
7. [Middleware Pipeline](#middleware-pipeline)
8. [Filtros Globales](#filtros-globales)
9. [CORS Configuration](#cors-configuration)
10. [Logging y Monitoreo](#logging-y-monitoreo)

---

## Resumen Ejecutivo

**ICARUS.API** es el proyecto ASP.NET Core Web API que expone endpoints RESTful para consumo de aplicaciones móviles (ICARUS_MOBILE) y clientes externos. Implementa autenticación JWT, documentación Swagger y sigue Clean Architecture.

### Estadísticas

| Métrica | Valor |
|---------|-------|
| **Controllers** | 5 controllers |
| **Endpoints Totales** | ~25 endpoints |
| **Controllers Mobile** | 4 (Auth, Producción, Trabajador, Notificaciones) |
| **Controllers Common** | 1 (Módulos) |
| **Controllers Web** | 0 (carpeta vacía, endpoints futuros) |
| **Authentication** | JWT Bearer Token |
| **Authorization Policies** | 6 políticas |
| **Swagger Enabled** | ✅ Sí (Development) |
| **CORS Enabled** | ✅ Sí (Mobile Apps) |
| **Port HTTP** | 5090 |
| **Port HTTPS** | 7090 (Development only) |

### Tecnologías

- **.NET 8**: Runtime
- **ASP.NET Core Web API**: Framework
- **JWT Bearer Authentication**: Autenticación
- **Swashbuckle**: Swagger/OpenAPI
- **log4net**: Logging centralizado
- **MediatR**: CQRS commands/queries
- **AutoMapper**: Mapeo DTOs

---

## Arquitectura de la API

### Estructura de Carpetas

```
ICARUS.API/
├── Controllers/
│   ├── Common/                    # Endpoints compartidos
│   │   └── ModulosController.cs   # Catálogo de módulos
│   ├── Mobile/                    # Endpoints para app móvil
│   │   ├── MobileAuthController.cs              # Login trabajadores
│   │   ├── RegistroProduccionMobileController.cs # Registros producción
│   │   ├── TrabajadorMobileController.cs        # Info trabajador
│   │   └── MobileNotificacionesController.cs    # Tareas del día
│   └── Web/                       # (Carpeta vacía - endpoints futuros)
├── Authorization/
│   └── AuthorizationPolicies.cs   # Políticas de autorización
├── Filters/
│   └── ValidationExceptionFilter.cs # Filtro FluentValidation
├── Middleware/                    # (Carpeta vacía - middleware en Program.cs)
├── Configuration/
├── Program.cs                     # Configuración del host
├── appsettings.json              # Configuración general
├── appsettings.Development.json  # Configuración desarrollo
└── log4net.config                # Configuración logging
```

### Organización de Controllers

Los controllers están organizados por **audiencia**:

1. **Common/**: Endpoints compartidos por todos los clientes (Web + Mobile)
2. **Mobile/**: Endpoints específicos para ICARUS_MOBILE (autenticación JWT)
3. **Web/**: (Futuro) Endpoints específicos para clientes web

---

## Configuración JWT

### appsettings.json

```json
{
  "JWT": {
    "SecretKey": "ICARUS-JWT-SECRET-KEY-2024-SUPER-SECURE-KEY-MINIMUM-32-CHARACTERS",
    "Issuer": "ICARUS.API",
    "Audience": "ICARUS.Clients",
    "ExpirationMinutes": 1440
  }
}
```

### Configuración en Program.cs

```csharp
// Validación defensiva de configuración crítica
string jwtSecretKey = builder.Configuration["JWT:SecretKey"] ?? 
    "ICARUS-JWT-SECRET-KEY-2024-SUPER-SECURE-KEY-MINIMUM-32-CHARACTERS";
string jwtIssuer = builder.Configuration["JWT:Issuer"] ?? "ICARUS.API";
string jwtAudience = builder.Configuration["JWT:Audience"] ?? "ICARUS.Clients";

// Validaciones previas (programación defensiva)
if (string.IsNullOrWhiteSpace(jwtSecretKey) || jwtSecretKey.Length < 32)
{
    throw new InvalidOperationException("JWT SecretKey debe tener al menos 32 caracteres para seguridad");
}

if (string.IsNullOrWhiteSpace(jwtIssuer))
{
    throw new InvalidOperationException("JWT Issuer es requerido para validación de tokens");
}

if (string.IsNullOrWhiteSpace(jwtAudience))
{
    throw new InvalidOperationException("JWT Audience es requerido para validación de tokens");
}

// Configuración de autenticación JWT
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    byte[] keyBytes = Encoding.UTF8.GetBytes(jwtSecretKey);
    SymmetricSecurityKey securityKey = new SymmetricSecurityKey(keyBytes);

    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = securityKey,
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.FromMinutes(5) // Tolerancia de 5 minutos
    };

    // Eventos para debugging
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var logger = context.HttpContext.RequestServices
                .GetRequiredService<ILogger<Program>>();
            logger.LogDebug("🔍 JWT OnMessageReceived - Path: {Path}", 
                context.Request.Path);
            return Task.CompletedTask;
        },
        OnAuthenticationFailed = context =>
        {
            var logger = context.HttpContext.RequestServices
                .GetRequiredService<ILogger<Program>>();
            logger.LogError("❌ JWT Authentication failed - Error: {Error}", 
                context.Exception?.Message ?? "Unknown error");
            return Task.CompletedTask;
        },
        OnTokenValidated = context =>
        {
            var logger = context.HttpContext.RequestServices
                .GetRequiredService<ILogger<Program>>();
            logger.LogInformation("✅ JWT Token validated - User: {User}", 
                context.Principal?.Identity?.Name ?? "Unknown");
            return Task.CompletedTask;
        },
        OnChallenge = context =>
        {
            var logger = context.HttpContext.RequestServices
                .GetRequiredService<ILogger<Program>>();
            logger.LogWarning("⚠️ JWT Challenge triggered - Error: {Error}", 
                context.Error ?? "Unknown challenge");
            return Task.CompletedTask;
        }
    };
});
```

### Estructura del Token JWT

Cuando un trabajador hace login exitoso, se genera un JWT con los siguientes claims:

```csharp
// Claims incluidos en el token
{
    "TrabajadorId": "123",           // ID del trabajador
    "ClienteId": "456",              // ID del cliente al que pertenece
    "Email": "trabajador@example.com", // Email del trabajador
    "Role": "Trabajador",            // Rol del usuario
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name": "trabajador@example.com",
    "exp": 1735689600,               // Expiración del token (Unix timestamp)
    "iss": "ICARUS.API",            // Issuer
    "aud": "ICARUS.Clients"         // Audience
}
```

### Flujo de Autenticación

```
┌─────────────┐        POST /api/mobile/auth/login      ┌──────────────┐
│             │────────────────────────────────────────>│              │
│  ICARUS     │  { email, password }                    │  ICARUS.API  │
│  MOBILE     │                                          │              │
│             │<────────────────────────────────────────│              │
└─────────────┘  { token, trabajadorInfo, clienteInfo } └──────────────┘
                                                                ⬇
                                                         1. Validar credenciales
                                                         2. Verificar trabajador activo
                                                         3. Obtener ClienteId
                                                         4. Generar JWT con claims
                                                         5. Retornar token + info
```

### Uso del Token en Requests

```http
GET /api/mobile/registro-produccion/galpones HTTP/1.1
Host: localhost:5090
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

---

## Controllers y Endpoints

### 1. MobileAuthController

**Propósito**: Autenticación de trabajadores móviles

**Ruta Base**: `/api/mobile/auth`

**Autenticación**: No requerida para `/login` y `/health`, requerida para `/validate`

#### Endpoints

##### POST `/api/mobile/auth/login`

Permite el login de un trabajador en la aplicación móvil.

**Request Body**:
```json
{
  "email": "trabajador@example.com",
  "password": "Password123"
}
```

**Response 200 OK**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiration": "2024-12-31T23:59:59Z",
  "trabajadorInfo": {
    "id": 123,
    "nombre": "Juan",
    "apellido": "Pérez",
    "email": "trabajador@example.com",
    "telefono": "987654321",
    "direccion": "Calle 123",
    "dni": "12345678",
    "estaActivo": true,
    "clienteId": 456
  },
  "clienteInfo": {
    "id": 456,
    "nombre": "Granja Avícola XYZ",
    "razonSocial": "Granja XYZ S.A.C.",
    "ruc": "20123456789"
  }
}
```

**Response 400 Bad Request**:
```json
{
  "message": "Los datos de login son requeridos y deben ser válidos"
}
```

**Response 401 Unauthorized**:
```json
{
  "message": "Credenciales inválidas o trabajador inactivo"
}
```

**Validaciones**:
- Email no puede ser null o vacío
- Password no puede ser null o vacío
- Trabajador debe estar activo (`EstaActivo = true`)
- Credenciales deben ser válidas

**Código Relevante**:
```csharp
[HttpPost("login")]
[AllowAnonymous]
[ProducesResponseType(typeof(TrabajadorLoginResponseDto), StatusCodes.Status200OK)]
[ProducesResponseType(StatusCodes.Status400BadRequest)]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
public async Task<IActionResult> Login([FromBody] LoginTrabajadorDto loginDto)
{
    _logger.Info($"MobileAuthController.Login - Intento de login móvil para email: {loginDto?.Email}");

    // Validaciones defensivas previas
    if (!IsValidLoginRequest(loginDto))
    {
        _logger.Warn($"MobileAuthController.Login - Datos de login inválidos");
        return BadRequest("Los datos de login son requeridos y deben ser válidos");
    }

    // Crear comando de login
    LoginTrabajadorCommand command = new LoginTrabajadorCommand
    {
        Email = loginDto.Email,
        Password = loginDto.Password
    };

    // Ejecutar comando
    var result = await _mediator.Send(command);

    // Validar resultado
    if (!IsValidLoginResult(result))
    {
        _logger.Warn($"MobileAuthController.Login - Login fallido para email: {loginDto.Email}");
        return Unauthorized(new { message = "Credenciales inválidas o trabajador inactivo" });
    }

    _logger.Info($"MobileAuthController.Login - Login exitoso para trabajador ID: {result.Data?.TrabajadorInfo?.Id}");
    return Ok(result.Data);
}
```

##### GET `/api/mobile/auth/validate`

Valida si el token JWT del trabajador sigue siendo válido.

**Headers**:
```http
Authorization: Bearer <token>
```

**Response 200 OK**:
```json
{
  "valid": true,
  "message": "Token válido",
  "trabajadorId": 123,
  "clienteId": 456
}
```

**Response 401 Unauthorized**:
```json
{
  "valid": false,
  "message": "Token inválido o expirado"
}
```

**Código Relevante**:
```csharp
[HttpGet("validate")]
[Authorize(Roles = "Trabajador")]
[ProducesResponseType(typeof(TokenValidationResponse), StatusCodes.Status200OK)]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
public IActionResult ValidateToken()
{
    _logger.Info("MobileAuthController.ValidateToken - Validando token JWT");

    if (User == null || User.Identity == null || !User.Identity.IsAuthenticated)
    {
        _logger.Warn("MobileAuthController.ValidateToken - Usuario no autenticado");
        return Unauthorized(new TokenValidationResponse
        {
            Valid = false,
            Message = "Token inválido o expirado"
        });
    }

    string? trabajadorId = User.FindFirst("TrabajadorId")?.Value;
    string? clienteId = User.FindFirst("ClienteId")?.Value;

    return Ok(new TokenValidationResponse
    {
        Valid = true,
        Message = "Token válido",
        TrabajadorId = trabajadorId != null && int.TryParse(trabajadorId, out int tid) ? tid : null,
        ClienteId = clienteId != null && int.TryParse(clienteId, out int cid) ? cid : null
    });
}
```

##### GET `/api/mobile/auth/health`

Verifica el estado de salud de la API móvil.

**Response 200 OK**:
```json
{
  "status": "healthy",
  "timestamp": "2024-12-31T12:00:00Z",
  "service": "ICARUS_MOBIL Authentication API"
}
```

---

### 2. RegistroProduccionMobileController

**Propósito**: Gestión de registros de producción diaria por trabajadores móviles

**Ruta Base**: `/api/mobile/registro-produccion`

**Autenticación**: Requerida - Rol `Trabajador`

**Autorización**: `[Authorize(Roles = "Trabajador")]`

#### Endpoints

##### GET `/api/mobile/registro-produccion/galpones`

Obtiene todos los galpones disponibles del cliente al que pertenece el trabajador autenticado.

**Headers**:
```http
Authorization: Bearer <token>
```

**Response 200 OK**:
```json
[
  {
    "id": 1,
    "nombre": "Galpón A",
    "capacidad": 10000,
    "edadAves": 120,
    "estadoAves": "Postura",
    "granjaId": 1,
    "granjaNombre": "Granja Principal",
    "clienteId": 456,
    "estaActivo": true
  },
  {
    "id": 2,
    "nombre": "Galpón B",
    "capacidad": 8000,
    "edadAves": 90,
    "estadoAves": "Postura",
    "granjaId": 1,
    "granjaNombre": "Granja Principal",
    "clienteId": 456,
    "estaActivo": true
  }
]
```

**Response 200 OK (sin galpones)**:
```json
[]
```

**Response 403 Forbidden**:
```json
{
  "message": "No se pudo determinar el cliente del trabajador"
}
```

**Validaciones**:
- Token JWT válido
- ClienteId presente en claims del token
- Solo retorna galpones activos del cliente

**Código Relevante**:
```csharp
[HttpGet("galpones")]
[ProducesResponseType(typeof(IEnumerable<GalponDto>), StatusCodes.Status200OK)]
public async Task<IActionResult> GetGalponesDisponibles()
{
    _logger.Info("RegistroProduccionMobileController.GetGalponesDisponibles - Iniciando");

    // Obtener ClienteId desde el token JWT
    int? clienteId = GetClienteIdFromToken();
    if (clienteId == null || clienteId <= 0)
    {
        _logger.Warn("ClienteId no encontrado en token JWT");
        return StatusCode(StatusCodes.Status403Forbidden, 
            "No se pudo determinar el cliente del trabajador");
    }

    // Crear query
    GetGalponesQuery query = new GetGalponesQuery { ClienteId = clienteId.Value };
    OperationResult<IEnumerable<GalponDto>> result = await _mediator.Send(query);

    if (result.IsSuccess)
    {
        IEnumerable<GalponDto>? galpones = result.Data;
        if (galpones != null && galpones.Any())
        {
            _logger.Info($"{galpones.Count()} galpones encontrados para cliente {clienteId}");
            return Ok(galpones);
        }
        else
        {
            _logger.Info($"No hay galpones activos para cliente {clienteId}");
            return Ok(new List<GalponDto>()); // Lista vacía
        }
    }
    else
    {
        _logger.Warn($"Error al obtener galpones: {result.ErrorMessage}");
        return StatusCode(500, "Error al obtener galpones disponibles");
    }
}
```

##### POST `/api/mobile/registro-produccion`

Crea un nuevo registro de producción diaria para el trabajador autenticado.

**Headers**:
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "galponId": 1,
  "fechaProduccion": "2024-12-31T00:00:00Z",
  "cantidadMaples": 100,
  "unidadesIncompletas": 15,
  "totalHuevos": 3015,
  "mortalidad": 2,
  "alimento": 250.5,
  "observaciones": "Producción normal",
  "creadoPor": "trabajador@example.com"
}
```

**Response 201 Created**:
```json
{
  "id": 789,
  "galponId": 1,
  "galponNombre": "Galpón A",
  "fechaProduccion": "2024-12-31T00:00:00Z",
  "cantidadMaples": 100,
  "unidadesIncompletas": 15,
  "totalHuevos": 3015,
  "mortalidad": 2,
  "alimento": 250.5,
  "observaciones": "Producción normal",
  "creadoPor": "trabajador@example.com",
  "fechaCreacion": "2024-12-31T10:30:00Z"
}
```

**Response 400 Bad Request**:
```json
{
  "message": "Datos de registro requeridos"
}
```

**Response 403 Forbidden**:
```json
{
  "message": "No se pudo determinar el cliente del trabajador"
}
```

**Validaciones**:
- Request no puede ser null
- CreadoPor debe estar especificado
- ClienteId debe estar presente en token JWT
- GalponId debe existir y pertenecer al cliente
- TotalHuevos debe coincidir con `(CantidadMaples * 30) + UnidadesIncompletas`

**Código Relevante**:
```csharp
[HttpPost]
[ProducesResponseType(typeof(RegistroProduccionDiarioDto), StatusCodes.Status201Created)]
[ProducesResponseType(StatusCodes.Status400BadRequest)]
public async Task<IActionResult> CrearRegistroProduccion(
    [FromBody] CreateRegistroProduccionDiarioCommand request)
{
    _logger.Info("CrearRegistroProduccion - Iniciando creación");

    // Validaciones defensivas
    if (request == null)
    {
        _logger.Warn("Request nulo recibido");
        return BadRequest("Datos de registro requeridos");
    }

    if (string.IsNullOrWhiteSpace(request.CreadoPor))
    {
        _logger.Warn("CreadoPor no especificado");
        return BadRequest("Usuario que crea el registro es requerido");
    }

    // Obtener ClienteId desde token JWT para validación de seguridad
    int? clienteId = GetClienteIdFromToken();
    if (clienteId == null || clienteId <= 0)
    {
        _logger.Warn("ClienteId no encontrado en token JWT");
        return StatusCode(StatusCodes.Status403Forbidden, 
            "No se pudo determinar el cliente del trabajador");
    }

    _logger.Info($"Creando registro para cliente {clienteId}, CreadoPor: {request.CreadoPor}");

    OperationResult<RegistroProduccionDiarioDto> result = await _mediator.Send(request);

    if (result.IsSuccess && result.Data != null)
    {
        _logger.Info($"Registro creado exitosamente con ID: {result.Data.Id}");
        return CreatedAtAction(nameof(GetRegistroProduccionById), 
            new { id = result.Data.Id }, result.Data);
    }
    else
    {
        _logger.Warn($"Error al crear registro: {result.ErrorMessage}");
        return BadRequest(result.ErrorMessage);
    }
}
```

##### GET `/api/mobile/registro-produccion/{id}`

Obtiene un registro de producción específico por ID.

**Headers**:
```http
Authorization: Bearer <token>
```

**Response 200 OK**:
```json
{
  "id": 789,
  "galponId": 1,
  "galponNombre": "Galpón A",
  "fechaProduccion": "2024-12-31T00:00:00Z",
  "cantidadMaples": 100,
  "unidadesIncompletas": 15,
  "totalHuevos": 3015,
  "mortalidad": 2,
  "alimento": 250.5,
  "observaciones": "Producción normal",
  "creadoPor": "trabajador@example.com",
  "fechaCreacion": "2024-12-31T10:30:00Z"
}
```

**Response 400 Bad Request**:
```json
{
  "message": "ID de registro inválido"
}
```

**Response 403 Forbidden**:
```json
{
  "message": "No tiene permisos para acceder a este registro"
}
```

**Response 404 Not Found**:
```json
{
  "message": "Registro no encontrado"
}
```

**Validaciones**:
- ID debe ser > 0
- Token JWT válido
- TrabajadorId presente en token
- Registro debe haber sido creado por el trabajador autenticado (validación `CreadoPor == Email`)

**Código Relevante**:
```csharp
[HttpGet("{id:int}")]
[ProducesResponseType(typeof(RegistroProduccionDiarioDto), StatusCodes.Status200OK)]
public async Task<IActionResult> GetRegistroProduccionById(int id)
{
    _logger.Info($"GetRegistroProduccionById - Obteniendo registro {id}");

    // Validar ID
    if (id <= 0)
    {
        _logger.Warn($"ID inválido: {id}");
        return BadRequest("ID de registro inválido");
    }

    // Obtener información del trabajador desde token JWT
    int? trabajadorId = GetTrabajadorIdFromToken();
    if (trabajadorId == null || trabajadorId <= 0)
    {
        _logger.Warn("TrabajadorId no encontrado en token JWT");
        return StatusCode(StatusCodes.Status403Forbidden, 
            "No se pudo determinar la identidad del trabajador");
    }

    // Crear query
    GetRegistroProduccionByIdQuery query = new GetRegistroProduccionByIdQuery { Id = id };
    OperationResult<RegistroProduccionDiarioDto> result = await _mediator.Send(query);

    if (result.IsSuccess && result.Data != null)
    {
        // Validación de seguridad: verificar que el registro fue creado por este trabajador
        string? emailTrabajador = this.GetEmailFromToken();
        if (string.IsNullOrWhiteSpace(emailTrabajador))
        {
            _logger.Warn("No se pudo obtener email del trabajador");
            return StatusCode(StatusCodes.Status403Forbidden, 
                "No se pudo validar la identidad del trabajador");
        }

        if (result.Data.CreadoPor != emailTrabajador)
        {
            _logger.Warn($"Trabajador {emailTrabajador} intentó acceder a registro de {result.Data.CreadoPor}");
            return StatusCode(StatusCodes.Status403Forbidden, 
                "No tiene permisos para acceder a este registro");
        }

        _logger.Info($"Registro {id} obtenido exitosamente");
        return Ok(result.Data);
    }
    else
    {
        _logger.Warn($"Error: {result.ErrorMessage}");
        return NotFound(result.ErrorMessage);
    }
}
```

##### GET `/api/mobile/registro-produccion/historial`

Obtiene el historial completo de registros de producción del cliente.

**Headers**:
```http
Authorization: Bearer <token>
```

**Query Parameters**:
- `fechaInicio` (DateTime, opcional): Fecha de inicio del rango
- `fechaFin` (DateTime, opcional): Fecha de fin del rango
- `galponId` (int, opcional): ID del galpón específico
- `skip` (int, opcional, default=0): Registros a omitir para paginación
- `take` (int, opcional, default=50): Registros a tomar para paginación

**Response 200 OK**:
```json
{
  "registros": [
    {
      "id": 789,
      "galponId": 1,
      "galponNombre": "Galpón A",
      "fechaProduccion": "2024-12-31T00:00:00Z",
      "cantidadMaples": 100,
      "totalHuevos": 3015,
      "mortalidad": 2,
      "creadoPor": "trabajador@example.com"
    }
  ],
  "totalRegistros": 150,
  "paginaActual": 1,
  "totalPaginas": 3
}
```

**Validaciones**:
- Token JWT válido
- ClienteId presente en token
- TrabajadorId presente en token
- Retorna TODOS los registros del cliente (no solo del trabajador)

---

### 3. TrabajadorMobileController

**Propósito**: Endpoints específicos para información del trabajador móvil

**Ruta Base**: `/api/mobile/trabajador`

**Autenticación**: Requerida - JWT Bearer

#### Endpoints

##### GET `/api/mobile/trabajador/modulos`

Obtiene los módulos activos del cliente al que pertenece el trabajador autenticado.

**Headers**:
```http
Authorization: Bearer <token>
```

**Response 200 OK**:
```json
[
  {
    "id": 1,
    "clienteId": 456,
    "moduloId": 10,
    "moduloNombre": "Gestión Avícola",
    "fechaAdquisicion": "2024-01-01T00:00:00Z",
    "estaActivo": true
  },
  {
    "id": 2,
    "clienteId": 456,
    "moduloId": 20,
    "moduloNombre": "Control de Acceso",
    "fechaAdquisicion": "2024-01-01T00:00:00Z",
    "estaActivo": true
  }
]
```

**Response 403 Forbidden**:
```json
{
  "message": "No se pudo determinar el cliente del trabajador"
}
```

**Validaciones**:
- Token JWT válido
- ClienteId presente en claims del token
- Solo retorna módulos activos del cliente

**Código Relevante**:
```csharp
[HttpGet("modulos")]
[ProducesResponseType(typeof(IEnumerable<ClienteModuloDto>), StatusCodes.Status200OK)]
public async Task<IActionResult> GetModulosDisponibles()
{
    _logger.Info("GetModulosDisponibles - Iniciando obtención de módulos");

    // Obtener ClienteId desde token JWT
    int? clienteId = GetClienteIdFromToken();
    if (clienteId == null || clienteId <= 0)
    {
        _logger.Warn("ClienteId no encontrado en token JWT");
        return StatusCode(StatusCodes.Status403Forbidden, 
            "No se pudo determinar el cliente del trabajador");
    }

    // Crear query (solo activos por defecto)
    GetClienteModulosQuery query = new GetClienteModulosQuery(clienteId.Value);

    Result<IEnumerable<ClienteModuloDto>> result = await _mediator.Send(query);

    if (result.IsSuccess)
    {
        IEnumerable<ClienteModuloDto>? modulos = result.Data;
        if (modulos != null && modulos.Any())
        {
            _logger.Info($"{modulos.Count()} módulos encontrados para cliente {clienteId}");
            return Ok(modulos);
        }
        else
        {
            _logger.Info($"No hay módulos activos para cliente {clienteId}");
            return Ok(new List<ClienteModuloDto>());
        }
    }
    else
    {
        _logger.Warn($"Error al obtener módulos: {result.ErrorMessage}");
        return StatusCode(500, "Error al obtener módulos disponibles");
    }
}
```

---

### 4. MobileNotificacionesController

**Propósito**: Gestión de notificaciones y tareas del día (vacunación, iluminación, alimentación)

**Ruta Base**: `/api/mobile/notificaciones`

**Autenticación**: Requerida - JWT Bearer

#### Endpoints

##### GET `/api/mobile/notificaciones/dia`

Obtiene las tareas programadas del día actual para el trabajador autenticado.

**Headers**:
```http
Authorization: Bearer <token>
```

**Response 200 OK**:
```json
{
  "fecha": "2024-12-31T00:00:00Z",
  "totalTareas": 5,
  "tareasPendientes": 3,
  "tareasCompletadas": 2,
  "tareasVacunacion": [
    {
      "id": 1,
      "programaVacunacionId": 100,
      "vacunaNombre": "Newcastle",
      "galponNombre": "Galpón A",
      "edadAplicacion": 120,
      "fechaProgramada": "2024-12-31T08:00:00Z",
      "dosis": "0.5ml",
      "viaAplicacion": "Intramuscular",
      "observaciones": "Aplicar en la mañana",
      "estado": "Pendiente"
    }
  ],
  "tareasIluminacion": [
    {
      "id": 2,
      "programaIluminacionId": 200,
      "galponNombre": "Galpón B",
      "horaInicio": "06:00:00",
      "horaFin": "18:00:00",
      "intensidadLuz": 60,
      "estado": "Completada"
    }
  ],
  "tareasAlimentacion": [
    {
      "id": 3,
      "programaAlimentacionId": 300,
      "galponNombre": "Galpón A",
      "tipoAlimento": "Ponedoras Fase 2",
      "cantidadKg": 250.5,
      "frecuencia": "2 veces al día",
      "horarios": "07:00, 15:00",
      "estado": "Pendiente"
    }
  ]
}
```

**Response 400 Bad Request**:
```json
{
  "message": "No se pudo identificar al cliente del trabajador autenticado"
}
```

**Response 404 Not Found**:
```json
{
  "message": "No se encontraron tareas para el día de hoy"
}
```

**Validaciones**:
- Token JWT válido
- ClienteId presente en token
- FechaConsulta = DateTime.Today
- Retorna todas las tareas del día (pendientes + completadas)

**Código Relevante**:
```csharp
[HttpGet("dia")]
[ProducesResponseType(typeof(NotificacionResponseDto), StatusCodes.Status200OK)]
public async Task<IActionResult> GetTareasDelDia()
{
    _logger.Info("GetTareasDelDia - Iniciando consulta de tareas");

    // Obtener ClienteId desde token JWT
    int clienteId = this.ObtenerClienteIdDesdeToken();

    if (clienteId <= 0)
    {
        _logger.Warn("No se pudo obtener ClienteId del token");
        return this.BadRequest(new { message = "No se pudo identificar al cliente" });
    }

    // Crear query con fecha actual
    GetTareasDelDiaQuery query = new GetTareasDelDiaQuery(clienteId)
    {
        FechaConsulta = DateTime.Today,
        IncluirTareasSinVacuna = true,
        IncluirDetallesPrograma = false
    };

    _logger.Debug($"Ejecutando query para ClienteId: {clienteId}, Fecha: {query.FechaConsulta:yyyy-MM-dd}");

    // Ejecutar query
    Result<NotificacionResponseDto> result = await this._mediator.Send(query);

    // Validar resultado
    if (result == null)
    {
        _logger.Error("Resultado nulo del mediator");
        return this.StatusCode(500, new { message = "Error interno" });
    }

    if (result.IsSuccess && result.Data != null)
    {
        _logger.Info($"Tareas obtenidas: {result.Data.TotalTareas}");
        return this.Ok(result.Data);
    }
    else
    {
        _logger.Warn($"Error al obtener tareas: {result.ErrorMessage}");
        return this.NotFound(new { message = result.ErrorMessage ?? "No se encontraron tareas" });
    }
}
```

---

### 5. ModulosController (Common)

**Propósito**: Gestión del catálogo de módulos del sistema

**Ruta Base**: `/api/modulos`

**Autenticación**: Requerida - JWT Bearer

#### Endpoints

##### GET `/api/modulos`

Obtiene la lista completa de módulos disponibles en el sistema desde la base de datos.

**Headers**:
```http
Authorization: Bearer <token>
```

**Response 200 OK**:
```json
[
  {
    "id": 10,
    "nombre": "Gestión Avícola",
    "descripcion": "Módulo para gestión de producción avícola",
    "codigo": "MOD-AVICOLA",
    "icono": "fa-egg",
    "orden": 1,
    "estaActivo": true
  },
  {
    "id": 20,
    "nombre": "Control de Acceso",
    "descripcion": "Módulo para control de acceso biométrico",
    "codigo": "MOD-ACCESO",
    "icono": "fa-fingerprint",
    "orden": 2,
    "estaActivo": true
  }
]
```

**Response 401 Unauthorized**:
```json
{
  "message": "Usuario no autenticado"
}
```

**Validaciones**:
- Usuario autenticado
- Solo retorna módulos activos (`SoloActivos = true`)

**Código Relevante**:
```csharp
[HttpGet]
[ProducesResponseType(typeof(IEnumerable<ModuloDto>), StatusCodes.Status200OK)]
public async Task<ActionResult<IEnumerable<ModuloDto>>> GetAllModulos()
{
    _logger.Info("GetAllModulos - Iniciando consulta de módulos");

    // Validación de usuario autenticado
    if (User?.Identity?.IsAuthenticated != true)
    {
        _logger.Warn("Acceso no autorizado");
        return Unauthorized("Usuario no autenticado");
    }

    // Consulta usando MediatR CQRS
    GetModulosQuery consulta = new GetModulosQuery 
    { 
        SoloActivos = true, 
        IncluirClientes = false, 
        IncluirEstadisticas = false 
    };
    
    _logger.Info("Ejecutando consulta GetModulosQuery");
    Result<IEnumerable<ModuloDto>> resultado = await _mediator.Send(consulta);

    // Validación del resultado
    if (resultado == null)
    {
        _logger.Error("Resultado de consulta es nulo");
        return StatusCode(StatusCodes.Status500InternalServerError, "Error interno");
    }

    if (!resultado.IsSuccess)
    {
        _logger.Error($"Error en consulta: {resultado.ErrorMessage}");
        return StatusCode(StatusCodes.Status500InternalServerError, resultado.ErrorMessage);
    }

    // Retornar módulos (o lista vacía si no hay)
    List<ModuloDto> modulos = resultado.Data?.ToList() ?? new List<ModuloDto>();
    
    _logger.Info($"GetAllModulos - {modulos.Count} módulos encontrados");
    return Ok(modulos);
}
```

---

## Políticas de Autorización

### AuthorizationPolicies.cs

Define las políticas de autorización para el sistema ICARUS.

```csharp
public static class AuthorizationPolicies
{
    #region Constantes de Políticas

    public const string RequireAdministradorRole = "RequireAdministradorRole";
    public const string RequireClienteRole = "RequireClienteRole";
    public const string RequireTrabajadorRole = "RequireTrabajadorRole";
    public const string RequireWebAccess = "RequireWebAccess";
    public const string RequireMobileAccess = "RequireMobileAccess";
    public const string RequireAdminAccess = "RequireAdminAccess";

    #endregion

    #region Métodos de Configuración

    public static void ConfigurePolicies(IServiceCollection services)
    {
        services.AddAuthorization(options =>
        {
            // Políticas por rol específico
            options.AddPolicy(RequireAdministradorRole, policy =>
                policy.RequireRole(AuthRoles.Administrador));

            options.AddPolicy(RequireClienteRole, policy =>
                policy.RequireRole(AuthRoles.Cliente));

            options.AddPolicy(RequireTrabajadorRole, policy =>
                policy.RequireRole(AuthRoles.Trabajador));

            // Política para acceso web (Administrador o Cliente)
            options.AddPolicy(RequireWebAccess, policy =>
                policy.RequireRole(AuthRoles.Administrador, AuthRoles.Cliente));

            // Política para acceso móvil (solo Trabajador)
            options.AddPolicy(RequireMobileAccess, policy =>
                policy.RequireRole(AuthRoles.Trabajador));

            // Política para funciones administrativas (solo Administrador)
            options.AddPolicy(RequireAdminAccess, policy =>
                policy.RequireRole(AuthRoles.Administrador));
        });
    }

    #endregion
}
```

### Uso de Políticas en Controllers

```csharp
// Aplicar política en controller completo
[Authorize(Policy = AuthorizationPolicies.RequireMobileAccess)]
public class RegistroProduccionMobileController : ControllerBase { }

// Aplicar política en endpoint específico
[HttpPost]
[Authorize(Policy = AuthorizationPolicies.RequireAdminAccess)]
public async Task<IActionResult> DeleteCliente(int id) { }

// Aplicar solo rol
[Authorize(Roles = "Trabajador")]
public async Task<IActionResult> GetGalpones() { }
```

---

## Swagger/OpenAPI

### Configuración en Program.cs

```csharp
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "ICARUS Client Management API",
        Version = "v1",
        Description = "API para gestión de clientes y módulos ICARUS"
    });

    // Configuración JWT para Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. " +
                      "Enter 'Bearer' [space] and then your token in the text input below.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                },
                Scheme = "oauth2",
                Name = "Bearer",
                In = ParameterLocation.Header,
            },
            new List<string>()
        }
    });
});
```

### Habilitar Swagger en Development

```csharp
if (app.Environment.IsDevelopment())
{
    app.UseSwagger(options =>
    {
        options.RouteTemplate = "swagger/{documentName}/swagger.json";
    });
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "ICARUS API v1");
        c.RoutePrefix = string.Empty; // Swagger UI at root
        c.DocumentTitle = "ICARUS API Documentation";
    });
}
```

### Acceso a Swagger UI

En modo desarrollo:
- **URL**: http://localhost:5090/
- **Swagger JSON**: http://localhost:5090/swagger/v1/swagger.json

### Uso de JWT en Swagger

1. Hacer login en `/api/mobile/auth/login`
2. Copiar el `token` de la respuesta
3. Click en botón "Authorize" en Swagger UI
4. Ingresar: `Bearer <token>`
5. Click en "Authorize"
6. Ahora todos los endpoints protegidos funcionarán

---

## Middleware Pipeline

### Orden del Middleware

```csharp
var app = builder.Build();

// 1. Logging Middleware (custom)
app.Use(async (context, next) =>
{
    // Log request
    await next();
    // Log response
});

// 2. Swagger (solo Development)
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// 3. HTTPS Redirection (deshabilitado temporalmente)
// app.UseHttpsRedirection();

// 4. CORS
app.UseCors("AllowMobileApps");

// 5. Authentication (JWT)
app.UseAuthentication();

// 6. Authorization
app.UseAuthorization();

// 7. Controllers
app.MapControllers();
```

### Custom Logging Middleware

```csharp
app.Use(async (context, next) =>
{
    ICARUS.Domain.Interfaces.ILoggingService? loggingService = 
        app.Services?.GetService<ICARUS.Domain.Interfaces.ILoggingService>();

    // Validar que el contexto y la request existen
    if (loggingService != null && context?.Request != null)
    {
        string method = context.Request.Method ?? "UNKNOWN";
        string path = context.Request.Path.ToString() ?? "/";
        string remoteIp = context.Connection?.RemoteIpAddress?.ToString() ?? "unknown";

        loggingService.LogInfo($"📄 Request: {method} {path} from {remoteIp}");
    }

    await next();

    // Log response
    if (loggingService != null && context?.Response != null && context?.Request != null)
    {
        int statusCode = context.Response.StatusCode;
        string method = context.Request.Method ?? "UNKNOWN";
        string path = context.Request.Path.ToString() ?? "/";

        loggingService.LogInfo($"✅ Response: {statusCode} for {method} {path}");
    }
});
```

**Output de ejemplo**:
```
2024-12-31 10:30:00 INFO - 📄 Request: POST /api/mobile/auth/login from 192.168.1.100
2024-12-31 10:30:01 INFO - ✅ Response: 200 for POST /api/mobile/auth/login
```

---

## Filtros Globales

### ValidationExceptionFilter

Filtro global para capturar excepciones de validación de FluentValidation y convertirlas en respuestas 400 Bad Request estructuradas.

**Configuración en Program.cs**:
```csharp
builder.Services.AddControllers(options =>
{
    // Agregar filtro global para ValidationException
    options.Filters.Add<ICARUS.API.Filters.ValidationExceptionFilter>();
});
```

**Implementación**:
```csharp
public class ValidationExceptionFilter : IExceptionFilter
{
    private static readonly ILog _logger = LogManager.GetLogger(typeof(ValidationExceptionFilter));

    public void OnException(ExceptionContext context)
    {
        if (context.Exception is ValidationException validationException)
        {
            _logger.Warn($"ValidationExceptionFilter - Capturando ValidationException con {validationException.Errors.Count()} errores");

            // Agrupar errores por propiedad
            Dictionary<string, List<string>> errors = validationException.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(e => e.ErrorMessage).ToList()
                );

            // Log de errores
            foreach (KeyValuePair<string, List<string>> error in errors)
            {
                _logger.Info($"ValidationExceptionFilter - Campo: {error.Key}, Errores: {string.Join(", ", error.Value)}");
            }

            // Crear respuesta estructurada
            ProblemDetails problemDetails = new ProblemDetails
            {
                Title = "Error de Validación",
                Status = StatusCodes.Status400BadRequest,
                Detail = "Uno o más campos de validación fallaron. Ver la propiedad 'errors' para más detalles.",
                Instance = context.HttpContext.Request.Path
            };

            problemDetails.Extensions["errors"] = errors;

            context.Result = new BadRequestObjectResult(problemDetails);
            context.ExceptionHandled = true;

            _logger.Info("ValidationExceptionFilter - ValidationException convertida a 400 Bad Request exitosamente");
        }
    }
}
```

**Response de ejemplo**:
```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "Error de Validación",
  "status": 400,
  "detail": "Uno o más campos de validación fallaron. Ver la propiedad 'errors' para más detalles.",
  "instance": "/api/mobile/registro-produccion",
  "errors": {
    "GalponId": ["El galpón es requerido", "El galpón debe existir"],
    "FechaProduccion": ["La fecha de producción no puede ser futura"]
  }
}
```

---

## CORS Configuration

### Configuración en Program.cs

```csharp
// Configuración de CORS con validación defensiva
string[] allowedOrigins = {
    "http://localhost:5000",
    "https://localhost:5001",
    "http://localhost:5090",
    "https://localhost:5091",
    "http://10.0.2.2:5090",           // Android Emulator
    "http://10.0.2.2:5000",           // Android Emulator (alternativo)
    "http://192.168.1.102:5090"       // Dispositivos físicos en red local
};

builder.Services.AddCors(options =>
{
    if (allowedOrigins?.Length > 0)
    {
        options.AddPolicy("AllowMobileApps", policy =>
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        });
    }
});
```

### Aplicar CORS

```csharp
app.UseCors("AllowMobileApps");
```

### Propósito

- Permitir que ICARUS_MOBILE (app móvil) pueda consumir la API
- Permitir acceso desde emulador Android (`10.0.2.2`)
- Permitir acceso desde dispositivos físicos en red local
- Permitir credenciales (necesario para JWT)

---

## Logging y Monitoreo

### Configuración log4net

**log4net.config**:
```xml
<?xml version="1.0" encoding="utf-8" ?>
<log4net>
  <appender name="RollingFileAppender" type="log4net.Appender.RollingFileAppender">
    <file type="log4net.Util.PatternString" value="Logs/icarus-api.log" />
    <appendToFile value="true" />
    <rollingStyle value="Size" />
    <maxSizeRollBackups value="10" />
    <maximumFileSize value="10MB" />
    <staticLogFileName value="true" />
    <layout type="log4net.Layout.PatternLayout">
      <conversionPattern value="%date [%thread] %-5level %logger - %message%newline" />
    </layout>
  </appender>
  
  <root>
    <level value="INFO" />
    <appender-ref ref="RollingFileAppender" />
  </root>
</log4net>
```

### Inicialización en Program.cs

```csharp
static void ConfigurarLog4Net()
{
    const string LogDirectoryName = "Logs";

    string currentDirectory = Directory.GetCurrentDirectory();
    if (string.IsNullOrWhiteSpace(currentDirectory))
    {
        return; // No se puede configurar sin directorio base
    }

    string logDirectory = Path.Combine(currentDirectory, LogDirectoryName);

    // Crear directorio
    if (!Directory.Exists(logDirectory))
    {
        Directory.CreateDirectory(logDirectory);
    }

    // Configurar contexto global
    log4net.GlobalContext.Properties["LogFilePath"] = logDirectory;

    var logRepository = LogManager.GetRepository(typeof(Program).Assembly);
    if (logRepository != null)
    {
        var configFile = new FileInfo("log4net.config");
        if (configFile?.Exists == true)
        {
            XmlConfigurator.Configure(logRepository, configFile);
        }
    }

    // Confirmar inicialización
    var logger = LogManager.GetLogger(typeof(Program));
    logger?.Info("🚀 Sistema de logging inicializado correctamente");
    logger?.Info($"📁 Logs configurados en: {logDirectory}");
    logger?.Info($"🔄 Nueva sesión iniciada: {DateTime.Now:yyyy-MM-dd HH:mm:ss}");
}
```

### Limpieza de Logs al Inicio

```csharp
static async Task LimpiarArchivosLogAsync()
{
    const string LogDirectoryName = "Logs";
    const string LogFilePattern = "*.log";
    const string BackupSuffix = ".backup";

    try
    {
        string currentDirectory = Directory.GetCurrentDirectory();
        string logDirectory = Path.Combine(currentDirectory, LogDirectoryName);

        // Crear directorio si no existe
        if (!Directory.Exists(logDirectory))
        {
            Directory.CreateDirectory(logDirectory);
            Console.WriteLine($"📁 Directorio de logs creado: {logDirectory}");
            return;
        }

        // Obtener archivos de log
        string[] archivosLog = Directory.GetFiles(logDirectory, LogFilePattern);

        if (archivosLog.Length == 0)
        {
            Console.WriteLine("📝 No hay archivos de log para limpiar");
            return;
        }

        Console.WriteLine($"🧹 Iniciando limpieza de {archivosLog.Length} archivo(s) de log...");

        int archivosLimpiados = 0;
        long espacioLiberado = 0;

        foreach (string archivoLog in archivosLog)
        {
            try
            {
                FileInfo fileInfo = new FileInfo(archivoLog);
                long tamanoAnterior = fileInfo.Length;

                // Crear backup si el archivo tiene contenido significativo
                if (tamanoAnterior > 1024) // Mayor a 1KB
                {
                    string backupPath = $"{archivoLog}{BackupSuffix}";
                    if (File.Exists(backupPath))
                    {
                        File.Delete(backupPath);
                    }
                    File.Copy(archivoLog, backupPath);
                }

                // Limpiar archivo
                await File.WriteAllTextAsync(archivoLog, string.Empty);

                espacioLiberado += tamanoAnterior;
                archivosLimpiados++;

                Console.WriteLine($"✅ Limpiado: {Path.GetFileName(archivoLog)} ({FormatearTamano(tamanoAnterior)})");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error al limpiar {Path.GetFileName(archivoLog)}: {ex.Message}");
            }
        }

        // Resumen
        Console.WriteLine($"📊 Limpieza completada:");
        Console.WriteLine($"   • Archivos limpiados: {archivosLimpiados}/{archivosLog.Length}");
        Console.WriteLine($"   • Espacio liberado: {FormatearTamano(espacioLiberado)}");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"💥 Error crítico en limpieza de logs: {ex.Message}");
    }
}
```

### Uso de Logging en Controllers

```csharp
private static readonly log4net.ILog _logger = 
    log4net.LogManager.GetLogger(typeof(MobileAuthController));

_logger.Info("MobileAuthController.Login - Intento de login móvil");
_logger.Warn("MobileAuthController.Login - Datos de login inválidos");
_logger.Error("MobileAuthController.Login - Error crítico");
_logger.Debug("MobileAuthController.Login - Información de depuración");
```

**Formato de log**:
```
2024-12-31 10:30:00,123 [1] INFO  MobileAuthController - MobileAuthController.Login - Intento de login móvil para email: trabajador@example.com
2024-12-31 10:30:01,456 [1] INFO  MobileAuthController - MobileAuthController.Login - Login exitoso para trabajador ID: 123
```

### Niveles de Log

- **INFO**: Flujo normal de ejecución, operaciones exitosas
- **WARN**: Situaciones anormales pero recuperables (validaciones fallidas, datos no encontrados)
- **ERROR**: Errores críticos que requieren atención inmediata
- **DEBUG**: Información detallada para depuración (solo en Development)

---

## Kestrel Configuration

### Configuración en Program.cs

```csharp
builder.WebHost.ConfigureKestrel(options =>
{
    // Escuchar en todas las interfaces para permitir acceso desde dispositivos físicos
    options.ListenAnyIP(5090); // HTTP
    
    if (builder.Environment.IsDevelopment())
    {
        options.ListenAnyIP(7090, listenOptions =>
        {
            listenOptions.UseHttps(); // HTTPS solo en desarrollo
        });
    }
});
```

### Propósito

- **ListenAnyIP**: Permite que la API sea accesible desde cualquier interfaz de red
- **Puerto 5090**: HTTP para acceso desde emulador y dispositivos móviles
- **Puerto 7090**: HTTPS solo en desarrollo para testing local
- Necesario para que ICARUS_MOBILE pueda conectarse desde emulador Android (`10.0.2.2:5090`)

---

## Inicialización de Base de Datos

```csharp
// Inicialización de base de datos con validaciones defensivas
using (IServiceScope? scope = app.Services?.CreateScope())
{
    if (scope?.ServiceProvider != null)
    {
        ApplicationDbContext? context = scope.ServiceProvider.GetService<ApplicationDbContext>();
        ILogger<Program>? logger = scope.ServiceProvider.GetService<ILogger<Program>>();

        // Validar servicios críticos
        if (context != null && logger != null)
        {
            logger.LogInformation("📊 Ensuring database is created...");
            await context.Database.EnsureCreatedAsync();
            logger.LogInformation("✅ Database initialization completed");
        }
        else
        {
            Console.WriteLine("⚠️ Warning: Database context or logger not available");
        }
    }
}
```

---

## Resumen de Características

| Característica | Implementación |
|---------------|----------------|
| **Autenticación** | JWT Bearer Token con validación de claims |
| **Autorización** | 6 políticas basadas en roles |
| **Documentación** | Swagger/OpenAPI con soporte JWT |
| **Logging** | log4net con rotación de archivos |
| **Validaciones** | FluentValidation + filtro global |
| **CORS** | Configurado para mobile apps |
| **Middleware** | Logging personalizado de requests/responses |
| **Kestrel** | Escucha en todas las interfaces de red |
| **Database Init** | EnsureCreatedAsync al inicio |
| **Programación Defensiva** | Validaciones previas sin try-catch |
| **Clean Architecture** | Inyección de dependencias, CQRS con MediatR |

---

## Próximo Documento

Ver [05-WEB-MVC.md](05-WEB-MVC.md) para documentación de ICARUS.Web (MVC con Razor Pages).

---

**Fin del Documento 04-API-ENDPOINTS.md**
