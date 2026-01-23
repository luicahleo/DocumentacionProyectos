# ICARUS - Resumen Ejecutivo de Arquitectura

**Fecha:** Diciembre 2025  
**Versión:** 1.0  
**Tecnología:** .NET 8 / .NET MAUI

---

## 🎯 Visión General

**ICARUS** es una plataforma de gestión empresarial modular construida con Clean Architecture, compuesta por:
- **Backend API** (ASP.NET Core Web API con JWT)
- **Frontend Web** (ASP.NET Core MVC con Razor Pages)
- **App Móvil** (MAUI con MVVM)

---

## 📦 Estructura de Soluciones

### ICARUS (Backend/Web)
```
ICARUS/
├── ICARUS.Domain/          # Entidades, interfaces, enums (sin dependencias)
├── ICARUS.Application/     # CQRS (MediatR), DTOs, handlers, validadores
├── ICARUS.Infrastructure/  # EF Core, repositorios, DbContext, migraciones
├── ICARUS.API/            # Web API REST + JWT + Swagger
└── ICARUS.Web/            # MVC Razor + Areas + ViewModels
```

### ICARUS_MOBILE (App Móvil)
```
ICARUS_MOBILE/
├── Core/                  # Autenticación, logging, servicios compartidos
├── Modules/               # GestionAvicola, ControlAcceso (MVVM)
├── Converters/            # Value converters XAML
└── Platforms/             # Código específico Android/iOS
```

---

## 🏗️ Arquitectura Clean Architecture

### Flujo de Dependencias
```
┌─────────────────────────────────────────┐
│          ICARUS.API / ICARUS.Web        │ ← Presentation Layer
│         (Controllers + Views)           │
└───────────────────┬─────────────────────┘
                    ↓ depende de
┌───────────────────▼─────────────────────┐
│         ICARUS.Application              │ ← Application Layer
│    (Commands, Queries, Handlers, DTOs)  │
└───────────────────┬─────────────────────┘
                    ↓ depende de
┌───────────────────▼─────────────────────┐
│           ICARUS.Domain                 │ ← Domain Layer
│    (Entidades, Interfaces, Enums)       │
└───────────────────▲─────────────────────┘
                    ↑ implementa
┌───────────────────┴─────────────────────┐
│       ICARUS.Infrastructure             │ ← Infrastructure Layer
│  (EF Core, Repos, DbContext, Auth)      │
└─────────────────────────────────────────┘
```

**Regla de oro:** Las capas internas NO conocen las externas.

---

## 📊 Módulos Funcionales

### 1. Gestión Avícola
**Propósito:** Control de granjas, galpones, producción de huevos, mortalidad, vacunación

**Entidades principales:**
- `GestorAvicola` (Granja)
- `Galpon` (Galpón con gallinas)
- `RegistroProduccionDiario` (Huevos producidos por día)
- `RegistroMortalidad` (Control de bajas)
- `ProgramaVacunacion` + `CronogramaVacunacion`

### 2. Control de Acceso
**Propósito:** Gestión de acceso físico con biométricos, turnos, zonas

**Entidades principales:**
- `TrabajadorAcceso` (Empleados con acceso)
- `RegistroAcceso` (Entradas/salidas)
- `DatosBiometricos` (Huella digital)
- `ZonaAcceso` (Áreas restringidas)
- `PoliticaAcceso` (Reglas de acceso)

### 3. Core (Compartido)
**Propósito:** Funcionalidad transversal

**Entidades principales:**
- `Cliente` (Empresa/organización)
- `Trabajador` (Empleado)
- `Modulo` (Módulos del sistema)
- `ClienteModulo` / `TrabajadorModulo` (Permisos)

---

## 🔐 Autenticación

### ICARUS.API (JWT)
```
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "pass123"
}

Response:
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "guid...",
  "expiration": "2025-12-15T10:00:00Z"
}
```

### ICARUS.Web (Cookie + Identity)
- Usa ASP.NET Core Identity
- Cookies de sesión
- Roles y Claims

### ICARUS_MOBILE (JWT)
- Consume ICARUS.API
- Tokens en `SecureStorage`
- Refresh automático

---

## 💾 Base de Datos

**Motor:** SQL Server (LocalDB: `LUISCAHUANA\SQLEXPRESS`)  
**Base de Datos:** `ICARUSDB`

### Características:
- **Code-First** con Entity Framework Core
- **Fluent API** en `EntityConfigurations/`
- **Migraciones** automáticas
- **Soft Delete** (`EstaActivo` en `BaseEntity`)
- **Audit Trail** (`FechaCreacion`, `CreadoPor`, etc.)

---

## 🔄 Patrones Implementados

### CQRS con MediatR
```csharp
// Command (escritura)
public class CreateGalponCommand : IRequest<OperationResult<GalponDto>>

// Query (lectura)
public class GetGalponesQuery : IRequest<OperationResult<List<GalponDto>>>

// Handler
public class CreateGalponHandler : IRequestHandler<CreateGalponCommand, OperationResult<GalponDto>>
```

### Repository Pattern
```csharp
// Interfaz en Domain
public interface IGalponRepository : IGenericRepository<Galpon>

// Implementación en Infrastructure
public class GalponRepository : GenericRepository<Galpon>, IGalponRepository
```

### MVVM (Móvil)
```csharp
// ViewModel
public partial class CrearRegistroViewModel : ObservableObject
{
    [ObservableProperty]
    private int cantidadMaples;
    
    [RelayCommand]
    private async Task GuardarRegistro()
}

// View (XAML)
<Entry Text="{Binding CantidadMaples}" />
<Button Command="{Binding GuardarRegistroCommand}" />
```

---

## 🚀 Tecnologías Clave

| Capa/Proyecto | Tecnologías |
|--------------|-------------|
| **ICARUS.Domain** | C# 12, .NET 8 |
| **ICARUS.Application** | MediatR, FluentValidation, AutoMapper |
| **ICARUS.Infrastructure** | EF Core 8, SQL Server, Identity |
| **ICARUS.API** | ASP.NET Core 8, JWT, Swagger/OpenAPI |
| **ICARUS.Web** | ASP.NET Core MVC, Razor, Bootstrap, jQuery |
| **ICARUS_MOBILE** | .NET MAUI, CommunityToolkit.Mvvm, SecureStorage |

---

## 📱 Flujo Completo (Ejemplo: Registro de Producción)

### Móvil → API → Base de Datos

```
1. Usuario (Galponero) en app móvil:
   CrearRegistroProduccionPage.xaml
   ↓ binding
   CrearRegistroProduccionViewModel
   ↓ IRegistroProduccionService
   
2. HTTP POST → ICARUS.API:
   POST /api/mobile/gestionavicola/produccion
   ↓ [Authorize(JWT)]
   RegistroProduccionController
   ↓ IMediator.Send()
   
3. Application Layer:
   CreateRegistroProduccionCommand
   ↓ CreateRegistroProduccionCommandHandler
   ↓ Validaciones (FluentValidation)
   ↓ IRegistroProduccionRepository
   
4. Infrastructure Layer:
   RegistroProduccionRepository
   ↓ ApplicationDbContext (EF Core)
   ↓ SQL Server
   
5. Response ← API ← Móvil:
   OperationResult<RegistroProduccionDto>
   ↓ Actualiza ObservableCollection
   ↓ UI actualizada
```

---

## 📈 Métricas del Proyecto

### ICARUS (Backend/Web)
- **Proyectos:** 5
- **Entidades Domain:** ~30
- **Commands:** ~96
- **Queries:** ~74
- **Controllers API:** ~15
- **Views Razor:** ~80+
- **Líneas de código:** ~50,000+

### ICARUS_MOBILE
- **Módulos:** 2 (GestionAvicola, ControlAcceso)
- **ViewModels:** ~15
- **Views XAML:** ~20
- **Servicios:** ~10
- **Líneas de código:** ~20,000+

---

## 🔍 Próximos Documentos

1. **01-DOMAIN-ENTIDADES.md** - Detalle de todas las entidades
2. **02-APPLICATION-CQRS.md** - Commands, Queries, Handlers
3. **03-INFRASTRUCTURE-REPOSITORIOS.md** - EF Core, Migraciones
4. **04-API-ENDPOINTS.md** - Todos los endpoints documentados
5. **05-WEB-MVC.md** - Controllers, Views, ViewModels
6. **06-MOBILE-ARQUITECTURA.md** - MAUI, MVVM, Servicios
7. **07-FLUJOS-NEGOCIO.md** - Casos de uso completos

---

## 📞 Información Adicional

**Ubicación Física:**
- Backend/Web: `C:\Users\desarrollo\source\repos\NETCORE\ICARUS`
- Móvil: `C:\Users\desarrollo\source\repos\NETMAUI\ICARUS_MOBILE`

**Convenciones:**
- Ver `.github/copilot-instructions.md` para reglas de estilo
- Ver `.editorconfig` para configuraciones
- Log4net para logging en todos los proyectos
