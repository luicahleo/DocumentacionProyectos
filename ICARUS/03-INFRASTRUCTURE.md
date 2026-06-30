# 03 — ICARUS.Infrastructure (EF Core, Repositorios, Migración)

**Última actualización:** 2026-06-29 — validado contra código fuente
**Capa:** `ICARUS.Infrastructure` · **Persistencia:** EF Core **10.0.0** sobre **SQL Server**

Implementa las interfaces declaradas en `ICARUS.Domain`. Contiene el `ApplicationDbContext`,
30 archivos de repositorio, UnitOfWork, **una sola migración consolidada** y servicios de infraestructura.

---

## 1. ApplicationDbContext

`ICARUS.Infrastructure/Data/ApplicationDbContext.cs`:

- Hereda de `IdentityDbContext` (integra las tablas de ASP.NET Identity).
- Declara **40 propiedades `DbSet<>`**, que mapean **37 entidades distintas** (3 entidades de cronograma tienen un DbSet duplicado con nombre alterno — ver §1.1).
- Sobrescribe `SaveChangesAsync` para el **audit trail** (`FechaCreacion` al crear, `FechaModificacion` al modificar).
- Aplica configuraciones Fluent API en `OnModelCreating` y siembra datos iniciales (roles, usuario admin, módulos, tipos de reporte).

DbSets (nombres reales de la propiedad → entidad):

| Grupo | DbSets |
|-------|--------|
| Core | `Clientes`, `Modulos`, `ClienteModulos`, `Trabajadores`, `TrabajadorModulos`, `RefreshTokens`, `MobileAppVersions` |
| Avícola producción | `GestorAvicola`, `Galpones`, `RegistroProduccionDiario`, `RegistroMortalidad`, `TiposReporte` |
| Cronogramas/tareas | `ProgramasVacunacion`, `CronogramaVacunacion`, `CronogramaIluminacion`, `CronogramaAlimentacion`, `GalponTareasVacunacion`, `GalponTareasIluminacion`, `GalponTareasAlimentacion` |
| Contabilidad/Comercial | `DespachosHuevo`, `DetallesDespachosHuevo`, `PedidosAlimento`, `DetallesPedidosAlimento`, `PreciosHuevo`, `PreciosAlimento`, `BalancesCuenta`, `PublicacionesPreciosHuevo`, `PublicacionesPreciosAlimento` |
| Control de Acceso | `TrabajadorAccesos`, `RegistroAccesos`, `DatosBiometricos`, `ZonasAcceso`, `NotificacionesAcceso`, `AlertasSeguridad`, `PoliticasAcceso`, `PoliticasZona`, `Dispositivos` |

### 1.1. DbSets duplicados (deuda técnica)

El archivo declara **3 pares** de DbSets con nombre alterno que apuntan a la misma entidad (por eso hay
40 propiedades para 37 entidades):

| Entidad | DbSet singular | DbSet plural (duplicado) |
|---------|----------------|--------------------------|
| `CronogramaVacunacion` | `CronogramaVacunacion` | `CronogramasVacunacion` |
| `CronogramaIluminacion` | `CronogramaIluminacion` | `CronogramasIluminacion` |
| `CronogramaAlimentacion` | `CronogramaAlimentacion` | `CronogramasAlimentacion` |

Es un punto a limpiar.

---

## 2. Repositorios (30 archivos) y UnitOfWork

`ICARUS.Infrastructure/Repositories/`:

- `GenericRepository<T>` — base CRUD (implementa `IGenericRepository<T>`).
- `UnitOfWork` — expone los repositorios y `CommitAsync()` (implementa `IUnitOfWork`).
- Repositorios específicos por entidad/módulo (Galpon, RegistroProduccionDiario, ProgramaVacunacion,
  TrabajadorAcceso, ZonaAcceso, Dispositivo, Despacho, Pedido, Precios, BalanceCuenta, etc.), agrupados por
  subcarpetas `GestionAvicola/`, `ControlAcceso/`, `ContabilidadAvicola/`.

> Residuo a ignorar/limpiar: `TrabajadorAccesoRepository_fixed.cs`.

Patrón:

```csharp
// Interfaz en Domain
public interface IGalponRepository : IGenericRepository<Galpon> { /* queries específicas */ }
// Implementación en Infrastructure
public class GalponRepository : GenericRepository<Galpon>, IGalponRepository { ... }
```

---

## 3. Migraciones

`ICARUS.Infrastructure/Migrations/` contiene **una sola migración consolidada**:

- `20260106114308_InitialCreate.cs` (+ `20260106114308_InitialCreate.Designer.cs` + `ApplicationDbContextModelSnapshot.cs`).

Todo el esquema (incluyendo Identity, avícola, contabilidad y control de acceso) está en esa migración.
No hay un historial de migraciones incrementales.

Comandos EF Core (proyecto de arranque = `ICARUS.Web`):

```bash
# Aplicar el esquema
dotnet ef database update --project ICARUS.Infrastructure --startup-project ICARUS.Web

# Crear una nueva migración (al evolucionar el modelo)
dotnet ef migrations add <Nombre> --project ICARUS.Infrastructure --startup-project ICARUS.Web

# Generar script SQL
dotnet ef migrations script --project ICARUS.Infrastructure --startup-project ICARUS.Web -o migration.sql
```

---

## 4. Servicios de infraestructura

`ICARUS.Infrastructure/Services/` (y subcarpetas):

| Servicio | Función |
|----------|---------|
| `Services/Auth/JwtTokenService.cs` | genera/valida JWT (`IJwtTokenService`) |
| `Services/JwtTokenService.cs` | segunda implementación de JWT en la misma capa (duplicado — ver aviso) |
| `Services/LoggingService.cs` | implementación de `ILoggingService` (log4net) |
| `Services/LogCleanupService.cs` | limpieza de logs (`ILogCleanupService`) |
| `Services/DatabaseInitializationService.cs` | inicialización de la BD al arrancar |
| `Services/AvicolaSeedService.cs` | siembra de datos avícolas |
| `Services/GestionAvicola/GalponTareasInitializationService.cs` | genera tareas de galpón a partir de cronogramas (`IGalponTareasInitializationService`) |

> **Aviso (deuda técnica):** hay **tres** archivos `JwtTokenService.cs` en la solución:
> `ICARUS.Application/Services/Auth/JwtTokenService.cs`,
> `ICARUS.Infrastructure/Services/Auth/JwtTokenService.cs` y
> `ICARUS.Infrastructure/Services/JwtTokenService.cs`. Confirmar cuál se registra en DI
> (`InfrastructureServiceRegistration`) antes de modificar.

---

## 5. Registro de dependencias (DI)

`ICARUS.Infrastructure/DependencyInjection/InfrastructureServiceRegistration.cs` registra el DbContext,
los repositorios, el UnitOfWork y los servicios de infraestructura. Se invoca desde `Program.cs` de API y Web.

```csharp
services.AddDbContext<ApplicationDbContext>(opt =>
    opt.UseSqlServer(connectionString,
        b => b.MigrationsAssembly("ICARUS.Infrastructure")));
```

---

## 6. Connection strings (ejemplo)

```text
# API (appsettings.json) — SQL Server local con autenticación de Windows
Server=LUISCAHUANA\SQLEXPRESS;Database=ICARUSDB;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true

# Web (appsettings.json) — SQL Server en contenedor (docker-compose.dev.yml)
Server=localhost,1433;Database=ICARUSDB;User Id=sa;Password=Icarus@Dev2024!;TrustServerCertificate=True;MultipleActiveResultSets=true
```

---

## 7. Mapa de código

| Concepto | Ruta |
|----------|------|
| DbContext | `ICARUS.Infrastructure/Data/ApplicationDbContext.cs` |
| Repositorios | `ICARUS.Infrastructure/Repositories/**/*.cs` |
| UnitOfWork | `ICARUS.Infrastructure/Repositories/UnitOfWork.cs` |
| Migración | `ICARUS.Infrastructure/Migrations/20260106114308_InitialCreate.cs` |
| Servicios infra | `ICARUS.Infrastructure/Services/**/*.cs` |
| Registro DI | `ICARUS.Infrastructure/DependencyInjection/InfrastructureServiceRegistration.cs` |

Siguiente: **04-API-ENDPOINTS.md**.
