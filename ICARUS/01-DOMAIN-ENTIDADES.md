# ICARUS - Documentación del Dominio (Entidades)

**Capa:** ICARUS.Domain  
**Responsabilidad:** Modelo de datos, lógica de negocio, interfaces (sin dependencias externas)

---

## 📋 Estructura de la Capa Domain

```
ICARUS.Domain/
├── Entities/
│   ├── BaseEntity.cs                    # Entidad base abstracta
│   ├── Cliente.cs                       # Empresas/organizaciones
│   ├── Trabajador.cs                    # Empleados
│   ├── Modulo.cs                        # Módulos del sistema
│   ├── ClienteModulo.cs                 # Relación Cliente-Módulo
│   ├── TrabajadorModulo.cs              # Relación Trabajador-Módulo
│   ├── RefreshToken.cs                  # Tokens JWT
│   │
│   ├── GestionAvicola/                  # Módulo Gestión Avícola
│   │   ├── GestorAvicola.cs            # Granja avícola
│   │   ├── Galpon.cs                   # Galpón con gallinas
│   │   ├── RegistroProduccionDiario.cs # Producción de huevos
│   │   ├── RegistroMortalidad.cs       # Registro de bajas
│   │   ├── ProgramaVacunacion.cs       # Programa de vacunas
│   │   ├── CronogramaVacunacion.cs     # Cronograma de vacunas
│   │   ├── CronogramaIluminacion.cs    # Cronograma de luz
│   │   ├── CronogramaAlimentacion.cs   # Cronograma de alimento
│   │   ├── GalponTareaVacunacion.cs    # Estado de tareas
│   │   ├── GalponTareaIluminacion.cs
│   │   ├── GalponTareaAlimentacion.cs
│   │   ├── TipoReporte.cs              # Tipos de reportes
│   │   └── EstadisticasMortalidadGalpon.cs
│   │
│   └── ControlAcceso/                   # Módulo Control de Acceso
│       ├── TrabajadorAcceso.cs         # Config acceso trabajador
│       ├── RegistroAcceso.cs           # Entradas/salidas
│       ├── DatosBiometricos.cs         # Huella digital
│       ├── ZonaAcceso.cs               # Áreas restringidas
│       ├── NotificacionAcceso.cs       # Alertas
│       ├── AlertaSeguridad.cs          # Alertas de seguridad
│       ├── PoliticaAcceso.cs           # Reglas de acceso
│       └── PoliticaZona.cs             # Reglas por zona
│
├── Interfaces/                          # Interfaces de repositorios
│   ├── IGenericRepository.cs
│   ├── IGalponRepository.cs
│   ├── IRegistroProduccionRepository.cs
│   └── ...
│
├── Enums/                               # Enumeraciones
│   ├── EstadoTarea.cs
│   ├── TipoNotificacion.cs
│   └── ...
│
├── Extensions/                          # Extension methods
└── Constants/                           # Constantes del dominio
```

---

## 🏛️ Entidad Base

### BaseEntity

**Propósito:** Campos comunes para todas las entidades (audit trail + soft delete)

```csharp
public abstract class BaseEntity
{
    public int Id { get; set; }
    public DateTime FechaCreacion { get; set; }
    public DateTime? FechaModificacion { get; set; }
    public string? CreadoPor { get; set; }
    public string? ModificadoPor { get; set; }
    public bool EstaActivo { get; set; } = true;  // Soft delete
}
```

**Características:**
- ✅ Todas las entidades heredan de `BaseEntity`
- ✅ `EstaActivo = false` para eliminación lógica (no física)
- ✅ Audit trail automático

---

## 🌐 Entidades Core (Compartidas)

### 1. Cliente

**Propósito:** Representa una empresa/organización que usa ICARUS

```csharp
public class Cliente : BaseEntity
{
    public string RazonSocial { get; set; }
    public string Ruc { get; set; }
    public string Direccion { get; set; }
    public string? Telefono { get; set; }
    public string? Email { get; set; }
    
    // Navegación
    public virtual ICollection<Trabajador> Trabajadores { get; set; }
    public virtual ICollection<ClienteModulo> ClienteModulos { get; set; }
    public virtual ICollection<GestorAvicola> GestorAvicola { get; set; }
}
```

**Relaciones:**
- 1 Cliente → N Trabajadores
- 1 Cliente → N Módulos (via ClienteModulo)
- 1 Cliente → N Granjas (GestorAvicola)

---

### 2. Trabajador

**Propósito:** Empleado de un cliente (acceso web o móvil)

```csharp
public class Trabajador : BaseEntity
{
    public int ClienteId { get; set; }
    public string Nombres { get; set; }
    public string Apellidos { get; set; }
    public string NumeroDocumento { get; set; }
    public string? Email { get; set; }
    public string? Telefono { get; set; }
    public string? Cargo { get; set; }
    
    // Credenciales móvil
    public string? PasswordHashMobile { get; set; }
    
    // Navegación
    public virtual Cliente Cliente { get; set; }
    public virtual ICollection<TrabajadorModulo> TrabajadorModulos { get; set; }
}
```

**Características:**
- Puede tener acceso web (Identity) y/o móvil (PasswordHashMobile)
- Permisos por módulo (TrabajadorModulo)

---

### 3. Modulo

**Propósito:** Módulo funcional del sistema

```csharp
public class Modulo : BaseEntity
{
    public string Nombre { get; set; }           // "GestionAvicola", "ControlAcceso"
    public string Descripcion { get; set; }
    public string? Icono { get; set; }           // Icono para UI
    public int Orden { get; set; }               // Orden de visualización
    
    // Navegación
    public virtual ICollection<ClienteModulo> ClienteModulos { get; set; }
    public virtual ICollection<TrabajadorModulo> TrabajadorModulos { get; set; }
}
```

**Módulos actuales:**
- GestionAvicola
- ControlAcceso

---

## 🐔 Módulo: Gestión Avícola

### 1. GestorAvicola (Granja)

**Propósito:** Representa una granja avícola completa

```csharp
public class GestorAvicola : BaseEntity
{
    public int ClienteId { get; set; }
    public string Nombre { get; set; }           // "Granja Los Pinos"
    public string Ubicacion { get; set; }
    public DateTime? FechaInicio { get; set; }
    
    // Navegación
    public virtual Cliente Cliente { get; set; }
    public virtual ICollection<Galpon> Galpones { get; set; }
}
```

**Relación:** 1 Granja → N Galpones

---

### 2. Galpon

**Propósito:** Galpón dentro de una granja (contiene gallinas)

```csharp
public class Galpon : BaseEntity
{
    public int GestorAvicolaId { get; set; }
    public string Numero { get; set; }            // "1", "A", "Norte"
    public int CapacidadMaxima { get; set; }      // Ej: 10000
    public int GallinasActuales { get; set; }     // Ej: 9500
    public DateTime FechaNacimiento { get; set; } // Edad de las gallinas
    public string? Descripcion { get; set; }
    
    // Programa de vacunación asignado (opcional)
    public int? ProgramaVacunacionId { get; set; }
    
    // Navegación
    public virtual GestorAvicola GestorAvicola { get; set; }
    public virtual ProgramaVacunacion? ProgramaVacunacion { get; set; }
    public virtual ICollection<RegistroProduccionDiario> RegistrosProduccion { get; set; }
    public virtual ICollection<RegistroMortalidad> RegistrosMortalidad { get; set; }
    
    // Propiedades calculadas
    public int EdadSemanas => (DateTime.Now - FechaNacimiento).Days / 7;
    public int TotalHuevosProducidos => RegistrosProduccion.Sum(r => r.TotalHuevos);
}
```

**Características:**
- Calcula edad en semanas automáticamente
- Puede tener programa de vacunación asignado
- Registra producción diaria

---

### 3. RegistroProduccionDiario

**Propósito:** Registro diario de producción de huevos (1 Maple = 30 huevos)

```csharp
public class RegistroProduccionDiario : BaseEntity
{
    public DateTime Fecha { get; set; }
    public int ClienteId { get; set; }            // Desnormalizado
    public int GalponId { get; set; }
    public int NumeroRegistro { get; set; }       // Secuencial por día
    public TimeSpan HoraRegistro { get; set; }
    
    // Producción
    public int CantidadMaples { get; set; }       // Ej: 100 maples
    public int UnidadesIncompletas { get; set; }  // Ej: 15 huevos sueltos (< 30)
    
    // Mortalidad
    public int GallinasMuertas { get; set; }
    
    // Observaciones
    public string? Observaciones { get; set; }
    
    // Navegación
    public virtual Galpon Galpon { get; set; }
    public virtual Cliente Cliente { get; set; }
    
    // Propiedades calculadas
    public int TotalHuevos => (CantidadMaples * 30) + UnidadesIncompletas;
    public decimal PorcentajeProduccion => 
        Galpon.GallinasActuales > 0 
            ? (decimal)TotalHuevos / Galpon.GallinasActuales * 100 
            : 0;
}
```

**Lógica de negocio:**
```csharp
// Validación
if (UnidadesIncompletas >= 30)
    throw new DomainException("Unidades incompletas debe ser menor a 30");
```

---

### 4. ProgramaVacunacion

**Propósito:** Programa maestro de vacunación para gallinas

```csharp
public class ProgramaVacunacion : BaseEntity
{
    public int ClienteId { get; set; }
    public DateTime FechaEmision { get; set; }
    public string? Observaciones { get; set; }
    
    // Navegación
    public virtual Cliente Cliente { get; set; }
    public virtual ICollection<CronogramaVacunacion> Cronogramas { get; set; }
    public virtual ICollection<Galpon> Galpones { get; set; }
}
```

---

### 5. CronogramaVacunacion

**Propósito:** Detalle de cada vacuna en el programa

```csharp
public class CronogramaVacunacion : BaseEntity
{
    public int ProgramaVacunacionId { get; set; }
    public int EdadSemanas { get; set; }           // Ej: 4 semanas
    public int EdadDias { get; set; }              // Ej: 28 días
    public string Vacuna { get; set; }             // "Newcastle", "Bronquitis"
    public string ViaAplicacion { get; set; }      // "Ocular", "Agua", "Inyectable"
    public string Cepa { get; set; }               // "B1", "H120"
    public string Laboratorio { get; set; }
    public string? Observaciones { get; set; }
    
    // Navegación
    public virtual ProgramaVacunacion ProgramaVacunacion { get; set; }
    public virtual ICollection<GalponTareaVacunacion> TareasGalpon { get; set; }
}
```

---

### 6. GalponTareaVacunacion

**Propósito:** Estado de la vacuna para cada galpón (Pendiente/Completada)

```csharp
public class GalponTareaVacunacion : BaseEntity
{
    public int CronogramaVacunacionId { get; set; }
    public int GalponId { get; set; }
    public EstadoTarea Estado { get; set; } = EstadoTarea.Pendiente;
    public DateTime? FechaAplicacion { get; set; }
    public string? Responsable { get; set; }
    public string? Observaciones { get; set; }
    
    // Navegación
    public virtual CronogramaVacunacion CronogramaVacunacion { get; set; }
    public virtual Galpon Galpon { get; set; }
}

// Enum
public enum EstadoTarea
{
    Pendiente = 0,
    Completada = 1
}
```

**Flujo:**
1. Se crea `ProgramaVacunacion` (ej: 10 vacunas)
2. Se asigna programa a `Galpon`
3. Se generan automáticamente 10 `GalponTareaVacunacion` (Pendiente)
4. Galponero marca tarea como Completada

---

## 🚪 Módulo: Control de Acceso

### 1. TrabajadorAcceso

**Propósito:** Configuración de acceso físico para un trabajador

```csharp
public class TrabajadorAcceso : BaseEntity
{
    public int ClienteId { get; set; }
    public int TrabajadorId { get; set; }
    public DateTime FechaInicio { get; set; }
    public DateTime? FechaFin { get; set; }
    public string CodigoTrabajador { get; set; }
    public int NivelAcceso { get; set; } = 1;     // 1=Básico, 2=Medio, 3=Alto
    public bool AccesoFueraHorario { get; set; }
    public string? ZonasPermitidas { get; set; }  // JSON: [1,2,5]
    public bool RequiereAutorizacion { get; set; }
    
    // Navegación
    public virtual Cliente Cliente { get; set; }
    public virtual Trabajador Trabajador { get; set; }
    public virtual DatosBiometricos? DatosBiometricos { get; set; }
    public virtual ICollection<RegistroAcceso> RegistrosAcceso { get; set; }
}
```

---

### 2. DatosBiometricos

**Propósito:** Almacena huella digital del trabajador

```csharp
public class DatosBiometricos : BaseEntity
{
    public int TrabajadorAccesoId { get; set; }
    public string? HuellaDigitalData { get; set; }  // Base64
    public DateTime FechaRegistro { get; set; }
    public string? DispositivoRegistro { get; set; }
    
    // Navegación
    public virtual TrabajadorAcceso TrabajadorAcceso { get; set; }
}
```

---

### 3. RegistroAcceso

**Propósito:** Log de cada entrada/salida física

```csharp
public class RegistroAcceso : BaseEntity
{
    public int TrabajadorAccesoId { get; set; }
    public int? ZonaAccesoId { get; set; }
    public DateTime FechaHoraAcceso { get; set; }
    public TipoAcceso TipoAcceso { get; set; }     // Entrada/Salida
    public string? Ubicacion { get; set; }
    public bool AccesoAutorizado { get; set; }
    public string? Observaciones { get; set; }
    
    // Navegación
    public virtual TrabajadorAcceso TrabajadorAcceso { get; set; }
    public virtual ZonaAcceso? ZonaAcceso { get; set; }
}

public enum TipoAcceso
{
    Entrada = 1,
    Salida = 2
}
```

---

### 4. ZonaAcceso

**Propósito:** Área física restringida

```csharp
public class ZonaAcceso : BaseEntity
{
    public int ClienteId { get; set; }
    public string Nombre { get; set; }
    public string? Descripcion { get; set; }
    public int NivelSeguridadRequerido { get; set; } = 1;
    public string? HorarioAcceso { get; set; }      // JSON
    public int CapacidadMaxima { get; set; }
    
    // Navegación
    public virtual Cliente Cliente { get; set; }
    public virtual ICollection<RegistroAcceso> RegistrosAcceso { get; set; }
    public virtual ICollection<PoliticaZona> Politicas { get; set; }
}
```

---

## 🔗 Relaciones Clave

### Many-to-Many

```csharp
// Cliente ↔ Módulo
ClienteModulo (tabla intermedia)
- ClienteId
- ModuloId
- FechaAsignacion

// Trabajador ↔ Módulo
TrabajadorModulo (tabla intermedia)
- TrabajadorId
- ModuloId
- FechaAsignacion
```

### One-to-Many Principales

```
Cliente → Trabajadores
Cliente → GestorAvicola (Granjas)
GestorAvicola → Galpones
Galpon → RegistrosProduccionDiario
ProgramaVacunacion → CronogramaVacunacion
CronogramaVacunacion → GalponTareaVacunacion
TrabajadorAcceso → RegistrosAcceso
```

---

## ✅ Convenciones del Dominio

1. **Nomenclatura:**
   - Entidades: `PascalCase` singular
   - Propiedades: `PascalCase`
   - Navegaciones: `virtual` para lazy loading

2. **Validaciones:**
   - En el Domain solo lógica invariante (siempre verdadera)
   - Validaciones complejas en Application (FluentValidation)

3. **Propiedades Calculadas:**
   ```csharp
   public int TotalHuevos => (CantidadMaples * 30) + UnidadesIncompletas;
   ```

4. **Soft Delete:**
   - Nunca `DbContext.Remove()` directo
   - Siempre `entidad.EstaActivo = false`

---

## 📊 Diagrama ER Simplificado

```
Cliente
├── Trabajadores
├── GestorAvicola (Granjas)
│   └── Galpones
│       ├── RegistrosProduccionDiario
│       ├── RegistrosMortalidad
│       └── GalponTareasVacunacion
├── ProgramasVacunacion
│   └── CronogramasVacunacion
└── TrabajadorAccesos
    ├── DatosBiometricos
    └── RegistrosAcceso
        └── ZonaAcceso
```

---

## 🔍 Próximo: Application Layer

Ver **02-APPLICATION-CQRS.md** para Commands, Queries y Handlers.
