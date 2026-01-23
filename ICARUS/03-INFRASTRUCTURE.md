# ICARUS - Documentación Infrastructure Layer

**Capa:** ICARUS.Infrastructure  
**Responsabilidad:** Implementación de persistencia, EF Core, repositorios, servicios externos

---

## 📋 Estructura de la Capa Infrastructure

```
ICARUS.Infrastructure/
├── Data/
│   ├── ApplicationDbContext.cs         # DbContext principal
│   ├── SeedData/                       # Datos iniciales
│   │   ├── AuthRolesSeedData.cs
│   │   ├── AdminUserSeedData.cs
│   │   ├── ModulosSeedData.cs
│   │   └── TipoReporteSeedData.cs
│   └── DesignTimeDbContextFactory.cs
│
├── Repositories/
│   ├── GenericRepository.cs            # Repositorio base
│   ├── UnitOfWork.cs                   # Patrón Unit of Work
│   ├── ClienteRepository.cs
│   ├── TrabajadorRepository.cs
│   │
│   ├── GestionAvicola/
│   │   ├── GestorAvicolaRepository.cs
│   │   ├── GalponRepository.cs
│   │   ├── RegistroProduccionDiarioRepository.cs
│   │   ├── ProgramaVacunacionRepository.cs
│   │   └── ...
│   │
│   └── ControlAcceso/
│       ├── TrabajadorAccesoRepository.cs
│       ├── RegistroAccesoRepository.cs
│       └── ...
│
├── EntityConfigurations/                # Fluent API
│   ├── TipoReporteConfiguration.cs
│   └── GestionAvicola/
│       ├── CronogramaVacunacionConfiguration.cs
│       ├── GalponTareaVacunacionConfiguration.cs
│       └── ...
│
├── Migrations/                          # Migraciones EF Core
├── Services/                            # Servicios de infraestructura
│   ├── JwtTokenService.cs
│   └── EmailService.cs
│
├── Authorization/                       # JWT, políticas
└── DependencyInjection/                 # Registro de servicios
    └── ServiceCollectionExtensions.cs
```

---

## 🗄️ ApplicationDbContext

### Propósito
Contexto principal de Entity Framework Core que gestiona todas las entidades y configuraciones.

```csharp
public class ApplicationDbContext : IdentityDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }
    
    // DbSets - Core
    public DbSet<Cliente> Clientes { get; set; }
    public DbSet<Modulo> Modulos { get; set; }
    public DbSet<Trabajador> Trabajadores { get; set; }
    public DbSet<ClienteModulo> ClienteModulos { get; set; }
    public DbSet<TrabajadorModulo> TrabajadorModulos { get; set; }
    
    // DbSets - Gestión Avícola
    public DbSet<GestorAvicola> GestorAvicola { get; set; }
    public DbSet<Galpon> Galpones { get; set; }
    public DbSet<RegistroProduccionDiario> RegistroProduccionDiario { get; set; }
    public DbSet<RegistroMortalidad> RegistroMortalidad { get; set; }
    public DbSet<ProgramaVacunacion> ProgramasVacunacion { get; set; }
    public DbSet<CronogramaVacunacion> CronogramaVacunacion { get; set; }
    public DbSet<GalponTareaVacunacion> GalponTareasVacunacion { get; set; }
    
    // DbSets - Control de Acceso
    public DbSet<TrabajadorAcceso> TrabajadorAccesos { get; set; }
    public DbSet<RegistroAcceso> RegistroAccesos { get; set; }
    public DbSet<DatosBiometricos> DatosBiometricos { get; set; }
    public DbSet<ZonaAcceso> ZonasAcceso { get; set; }
    
    // DbSets - Autenticación
    public DbSet<RefreshToken> RefreshTokens { get; set; }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // Aplicar todas las configuraciones Fluent API
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
        
        // Configuraciones manuales (Many-to-Many)
        ConfigurarClienteModulo(modelBuilder);
        ConfigurarTrabajadorModulo(modelBuilder);
        
        // Seed data
        AuthRolesSeedData.SeedRoles(modelBuilder);
        AdminUserSeedData.SeedAdminUser(modelBuilder);
        ModulosSeedData.SeedModulos(modelBuilder);
        TipoReporteSeedData.SeedTiposReporte(modelBuilder);
    }
    
    // Override SaveChangesAsync para audit trail automático
    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.FechaCreacion = DateTime.UtcNow;
                    entry.Entity.FechaModificacion = DateTime.UtcNow;
                    break;
                case EntityState.Modified:
                    entry.Entity.FechaModificacion = DateTime.UtcNow;
                    break;
            }
        }
        
        return await base.SaveChangesAsync(cancellationToken);
    }
}
```

### Características Clave

✅ **Audit Trail Automático:** `FechaCreacion` y `FechaModificacion` se establecen automáticamente  
✅ **Configuración Centralizada:** Todas las Fluent API configs se aplican desde assembly  
✅ **Seed Data:** Datos iniciales para roles, admin, módulos  
✅ **Identity Integration:** Hereda de `IdentityDbContext` para ASP.NET Identity

---

## 🏗️ Patrón Repository

### GenericRepository<T>

Repositorio base con operaciones CRUD genéricas.

```csharp
public class GenericRepository<T> : IGenericRepository<T> where T : class
{
    protected readonly ApplicationDbContext _context;
    protected readonly DbSet<T> _dbSet;
    private static readonly ILog _logger = LogManager.GetLogger(typeof(GenericRepository<>));
    
    public GenericRepository(ApplicationDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }
    
    // CRUD básico
    public virtual async Task<T?> GetByIdAsync(int id)
    {
        if (id <= 0)
        {
            _logger.Warn($"ID inválido: {id}");
            return null;
        }
        
        return await _dbSet.FindAsync(id);
    }
    
    public virtual async Task<IEnumerable<T>> GetAllAsync()
    {
        return await _dbSet.ToListAsync();
    }
    
    public virtual async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> expression)
    {
        return await _dbSet.Where(expression).ToListAsync();
    }
    
    public virtual async Task AddAsync(T entity)
    {
        await _dbSet.AddAsync(entity);
    }
    
    public virtual void Update(T entity)
    {
        _dbSet.Update(entity);
    }
    
    public virtual void Remove(T entity)
    {
        _dbSet.Remove(entity);
    }
    
    public virtual async Task<bool> ExistsAsync(int id)
    {
        return await _dbSet.FindAsync(id) != null;
    }
}
```

### Repositorio Específico (Ejemplo: GalponRepository)

```csharp
public class GalponRepository : GenericRepository<Galpon>, IGalponRepository
{
    public GalponRepository(ApplicationDbContext context) : base(context)
    {
    }
    
    // Métodos específicos del dominio
    public async Task<Galpon?> GetByIdWithGestorAsync(int id)
    {
        return await _dbSet
            .Include(g => g.GestorAvicola)
                .ThenInclude(ga => ga.Cliente)
            .Include(g => g.ProgramaVacunacion)
            .FirstOrDefaultAsync(g => g.Id == id && g.EstaActivo);
    }
    
    public async Task<IEnumerable<Galpon>> GetByGranjaAsync(int granjaId)
    {
        return await _dbSet
            .Where(g => g.GestorAvicolaId == granjaId && g.EstaActivo)
            .OrderBy(g => g.Numero)
            .ToListAsync();
    }
    
    public async Task<Galpon?> GetByNumeroAsync(int granjaId, string numero)
    {
        return await _dbSet
            .FirstOrDefaultAsync(g => 
                g.GestorAvicolaId == granjaId && 
                g.Numero == numero && 
                g.EstaActivo);
    }
    
    public async Task<int> GetTotalGallinasAsync(int granjaId)
    {
        return await _dbSet
            .Where(g => g.GestorAvicolaId == granjaId && g.EstaActivo)
            .SumAsync(g => g.GallinasActuales);
    }
}
```

**Ventajas del Repository Pattern:**
- ✅ Abstrae EF Core de la lógica de aplicación
- ✅ Fácil de testear (mock interfaces)
- ✅ Queries complejas encapsuladas
- ✅ Logging centralizado

---

## 🔄 Patrón Unit of Work

### Propósito
Coordina múltiples repositorios y gestiona transacciones.

```csharp
public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;
    private IDbContextTransaction? _transaction;
    
    public UnitOfWork(ApplicationDbContext context, ILoggerFactory loggerFactory)
    {
        _context = context;
        
        // Inicializar todos los repositorios
        Clientes = new ClienteRepository(_context);
        Trabajadores = new TrabajadorRepository(_context);
        Galpones = new GalponRepository(_context);
        RegistroProduccionDiario = new RegistroProduccionDiarioRepository(_context);
        ProgramaVacunacion = new ProgramaVacunacionRepository(_context);
        // ... más repositorios
    }
    
    // Propiedades de repositorios
    public IClienteRepository Clientes { get; private set; }
    public ITrabajadorRepository Trabajadores { get; private set; }
    public IGalponRepository Galpones { get; private set; }
    public IRegistroProduccionDiarioRepository RegistroProduccionDiario { get; private set; }
    public IProgramaVacunacionRepository ProgramaVacunacion { get; private set; }
    // ... más repositorios
    
    // Métodos de transacción
    public async Task<int> SaveChangesAsync()
    {
        return await _context.SaveChangesAsync();
    }
    
    public async Task BeginTransactionAsync()
    {
        _transaction = await _context.Database.BeginTransactionAsync();
    }
    
    public async Task CommitTransactionAsync()
    {
        if (_transaction == null)
            throw new InvalidOperationException("No hay transacción activa");
        
        await _transaction.CommitAsync();
        await _transaction.DisposeAsync();
        _transaction = null;
    }
    
    public async Task RollbackTransactionAsync()
    {
        if (_transaction == null)
            throw new InvalidOperationException("No hay transacción activa");
        
        await _transaction.RollbackAsync();
        await _transaction.DisposeAsync();
        _transaction = null;
    }
    
    public void Dispose()
    {
        _transaction?.Dispose();
        _context.Dispose();
    }
}
```

### Uso en Handlers

```csharp
public class CreateRegistroProduccionHandler
{
    private readonly IUnitOfWork _unitOfWork;
    
    public async Task<OperationResult> Handle(CreateRegistroCommand command)
    {
        try
        {
            // Iniciar transacción si múltiples operaciones
            await _unitOfWork.BeginTransactionAsync();
            
            // 1. Crear registro
            var registro = new RegistroProduccionDiario {...};
            await _unitOfWork.RegistroProduccionDiario.AddAsync(registro);
            await _unitOfWork.SaveChangesAsync();
            
            // 2. Actualizar inventario si hay mortalidad
            if (command.GallinasMuertas > 0)
            {
                var galpon = await _unitOfWork.Galpones.GetByIdAsync(command.GalponId);
                galpon.GallinasActuales -= command.GallinasMuertas;
                await _unitOfWork.SaveChangesAsync();
            }
            
            // 3. Crear registro de mortalidad
            if (command.GallinasMuertas > 0)
            {
                var mortalidad = new RegistroMortalidad {...};
                await _unitOfWork.RegistroMortalidad.AddAsync(mortalidad);
                await _unitOfWork.SaveChangesAsync();
            }
            
            // Commit transacción
            await _unitOfWork.CommitTransactionAsync();
            
            return OperationResult.Success();
        }
        catch (Exception ex)
        {
            await _unitOfWork.RollbackTransactionAsync();
            return OperationResult.Failure(ex.Message);
        }
    }
}
```

---

## ⚙️ Fluent API (Entity Configurations)

### Propósito
Configurar mapeo entidad-tabla, relaciones, restricciones sin atributos en el Domain.

### Ejemplo: CronogramaVacunacionConfiguration

```csharp
public class CronogramaVacunacionConfiguration : IEntityTypeConfiguration<CronogramaVacunacion>
{
    public void Configure(EntityTypeBuilder<CronogramaVacunacion> builder)
    {
        // Tabla y restricciones CHECK
        builder.ToTable("CronogramaVacunacion", table =>
        {
            // Edad debe ser >= 0
            table.HasCheckConstraint("CK_CronogramaVacunacion_EdadDia_Valido", 
                "[EdadDia] IS NULL OR [EdadDia] >= 0");
            
            // Fecha no puede ser muy antigua
            table.HasCheckConstraint("CK_CronogramaVacunacion_Fecha_Valida", 
                "[Fecha] IS NULL OR [Fecha] >= '1900-01-01'");
            
            // Vacuna no puede estar vacía
            table.HasCheckConstraint("CK_CronogramaVacunacion_Vacuna_NoVacia", 
                "[Vacuna] IS NULL OR LEN(LTRIM(RTRIM([Vacuna]))) > 0");
            
            // Estado solo 0 (Pendiente) o 1 (Completada)
            table.HasCheckConstraint("CK_CronogramaVacunacion_EstadoTarea_Valido", 
                "[EstadoTarea] IN (0, 1)");
            
            // Coherencia: FechaCompletada solo si EstadoTarea = 1
            table.HasCheckConstraint("CK_CronogramaVacunacion_FechaCompletada_Coherente", 
                "([FechaCompletada] IS NULL AND [EstadoTarea] = 0) OR " +
                "([FechaCompletada] IS NOT NULL AND [EstadoTarea] = 1)");
        });
        
        // Clave primaria
        builder.HasKey(c => c.Id);
        
        // Propiedades requeridas
        builder.Property(c => c.Vacuna)
            .IsRequired()
            .HasMaxLength(200)
            .HasComment("Nombre de la vacuna a aplicar");
        
        builder.Property(c => c.ModoAplicacion)
            .IsRequired()
            .HasMaxLength(100)
            .HasComment("Vía de aplicación (Ocular, Agua, Inyectable)");
        
        builder.Property(c => c.Cepa)
            .HasMaxLength(100)
            .HasComment("Cepa de la vacuna (ej: B1, H120)");
        
        // Propiedades opcionales
        builder.Property(c => c.Observaciones)
            .HasMaxLength(500);
        
        // Relaciones
        builder.HasOne(c => c.ProgramaVacunacion)
            .WithMany(p => p.Cronogramas)
            .HasForeignKey(c => c.ProgramaVacunacionId)
            .OnDelete(DeleteBehavior.Cascade);  // Eliminar cronogramas si se elimina programa
        
        // Índices para performance
        builder.HasIndex(c => c.ProgramaVacunacionId)
            .HasDatabaseName("IX_CronogramaVacunacion_Programa");
        
        builder.HasIndex(c => new { c.ProgramaVacunacionId, c.EdadDia })
            .HasDatabaseName("IX_CronogramaVacunacion_Programa_EdadDia");
    }
}
```

### Ventajas de Fluent API

✅ **Separación de concerns:** Domain limpio sin atributos  
✅ **Restricciones complejas:** CHECK constraints con SQL  
✅ **Índices optimizados:** Performance queries  
✅ **Comentarios en BD:** Documentación en schema  
✅ **Configuración centralizada:** Todo en un lugar

---

## 🌱 Seed Data

### Propósito
Insertar datos iniciales necesarios para el funcionamiento del sistema.

### Módulos (ModulosSeedData)

```csharp
public static class ModulosSeedData
{
    public static void SeedModulos(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Modulo>().HasData(
            new Modulo
            {
                Id = 1,
                Nombre = "GestionAvicola",
                Descripcion = "Gestión de granjas avícolas",
                Icono = "fas fa-egg",
                Orden = 1,
                FechaCreacion = DateTime.Now,
                EstaActivo = true
            },
            new Modulo
            {
                Id = 2,
                Nombre = "ControlAcceso",
                Descripcion = "Control de acceso biométrico",
                Icono = "fas fa-fingerprint",
                Orden = 2,
                FechaCreacion = DateTime.Now,
                EstaActivo = true
            }
        );
    }
}
```

### Usuario Admin (AdminUserSeedData)

```csharp
public static class AdminUserSeedData
{
    public static void SeedAdminUser(ModelBuilder modelBuilder)
    {
        var hasher = new PasswordHasher<IdentityUser>();
        
        var adminUser = new IdentityUser
        {
            Id = "admin-seed-user-id",
            UserName = "admin@icarus.com",
            NormalizedUserName = "ADMIN@ICARUS.COM",
            Email = "admin@icarus.com",
            NormalizedEmail = "ADMIN@ICARUS.COM",
            EmailConfirmed = true,
            SecurityStamp = Guid.NewGuid().ToString()
        };
        
        adminUser.PasswordHash = hasher.HashPassword(adminUser, "Admin@123");
        
        modelBuilder.Entity<IdentityUser>().HasData(adminUser);
        
        // Asignar rol Admin
        modelBuilder.Entity<IdentityUserRole<string>>().HasData(
            new IdentityUserRole<string>
            {
                UserId = adminUser.Id,
                RoleId = "admin-role-id"
            }
        );
    }
}
```

---

## 🔄 Migraciones (EF Core)

### Comandos Principales

```bash
# Crear nueva migración
dotnet ef migrations add NombreMigracion --project ICARUS.Infrastructure --startup-project ICARUS.Web

# Aplicar migraciones a base de datos
dotnet ef database update --project ICARUS.Infrastructure --startup-project ICARUS.Web

# Revertir última migración
dotnet ef migrations remove --project ICARUS.Infrastructure --startup-project ICARUS.Web

# Generar script SQL
dotnet ef migrations script --project ICARUS.Infrastructure --startup-project ICARUS.Web --output migration.sql

# Ver migraciones pendientes
dotnet ef migrations list --project ICARUS.Infrastructure --startup-project ICARUS.Web
```

### Estructura de una Migración

```csharp
public partial class AddProgramaVacunacion : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "ProgramasVacunacion",
            columns: table => new
            {
                Id = table.Column<int>(nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                ClienteId = table.Column<int>(nullable: false),
                FechaEmision = table.Column<DateTime>(nullable: false),
                Observaciones = table.Column<string>(maxLength: 500, nullable: true),
                FechaCreacion = table.Column<DateTime>(nullable: false),
                EstaActivo = table.Column<bool>(nullable: false, defaultValue: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_ProgramasVacunacion", x => x.Id);
                table.ForeignKey(
                    name: "FK_ProgramasVacunacion_Clientes_ClienteId",
                    column: x => x.ClienteId,
                    principalTable: "Clientes",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });
        
        migrationBuilder.CreateIndex(
            name: "IX_ProgramasVacunacion_ClienteId",
            table: "ProgramasVacunacion",
            column: "ClienteId");
    }
    
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "ProgramasVacunacion");
    }
}
```

### Buenas Prácticas

✅ **Migraciones pequeñas:** Una funcionalidad por migración  
✅ **Nombres descriptivos:** `AddProgramaVacunacion` no `Update1`  
✅ **Reversibles:** Siempre implementar `Down()`  
✅ **Probar en Dev:** Antes de aplicar en Producción  
✅ **Scripts SQL:** Generar para auditoría

---

## 🔌 Dependency Injection

### ServiceCollectionExtensions

```csharp
public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructureServices(
        this IServiceCollection services, 
        IConfiguration configuration)
    {
        // DbContext
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlServer(
                configuration.GetConnectionString("DefaultConnection"),
                b => b.MigrationsAssembly("ICARUS.Infrastructure")));
        
        // Repositorios
        services.AddScoped<IClienteRepository, ClienteRepository>();
        services.AddScoped<ITrabajadorRepository, TrabajadorRepository>();
        services.AddScoped<IGalponRepository, GalponRepository>();
        services.AddScoped<IRegistroProduccionDiarioRepository, RegistroProduccionDiarioRepository>();
        // ... más repositorios
        
        // Unit of Work
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        
        // Servicios de infraestructura
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IEmailService, EmailService>();
        
        return services;
    }
}
```

### Uso en Program.cs

```csharp
// ICARUS.API/Program.cs
builder.Services.AddInfrastructureServices(builder.Configuration);

// ICARUS.Web/Program.cs
builder.Services.AddInfrastructureServices(builder.Configuration);
```

---

## 📊 Estadísticas de Infrastructure

### ICARUS.Infrastructure
- **Repositorios:** ~30
- **Entity Configurations:** ~25
- **Migraciones:** ~40+
- **Servicios:** ~10
- **Líneas de código:** ~15,000+

---

## 🔍 Próximo: API Layer

Ver **04-API-ENDPOINTS.md** para documentación completa de endpoints REST, JWT, Swagger y Controllers.
