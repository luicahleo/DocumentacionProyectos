# Modelo de Datos - Registro de Producción Diario

## 🗄️ Relaciones de Base de Datos

### **Jerarquía Completa**

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENTES                           │
│  Id, RazonSocial, NombreComercial, NIT                  │
│  Email, Telefono, Direccion                             │
└─────────────────────────────────────────────────────────┘
         │                                   │
         │ 1:N                               │ 1:N
         ▼                                   ▼
┌──────────────────┐            ┌────────────────────────┐
│  GESTORAVICOLA   │            │     TRABAJADORES       │
│  (GRANJAS)       │            │                        │
│  Id              │            │  Id                    │
│  ClienteId  (FK) │            │  ClienteId (FK)        │
│  NombreGranja    │            │  Nombre, Email         │
│  TotalGallinas   │            │  IdentityUserId        │
└──────────────────┘            │  IsActiveForLogin      │
         │                      └────────────────────────┘
         │ 1:N                               │
         ▼                                   │
┌──────────────────┐                        │
│     GALPONES     │                        │
│  Id              │                        │
│  GestorAvicolaId │◄───────────────────────┘
│  (FK)            │        Acceso por JWT
│  Numero          │        (ClienteId)
│  GallinasActuales│
│  CapacidadMaxima │
└──────────────────┘
         │
         │ 1:N
         ▼
┌──────────────────────────────────┐
│  REGISTROPRODUCCIONDIARIO        │
│  Id                              │
│  GalponId (FK) ──────────────────┘
│  ClienteId (FK desnormalizado)   
│  Fecha, HoraRegistro            
│  NumeroRegistro (secuencial)    
│  CantidadMaples                 
│  UnidadesIncompletas            
│  GallinasMuertas                
│  PorcentajeMortalidad           
│  EficienciaProduccion           
│  CreadoPor (email trabajador)  
│  FechaCreacion, FechaModificacion
└──────────────────────────────────┘
```

---

## 📋 Entidades y Relaciones

### **1. Cliente → GestorAvicola (Granja) → Galpones**

**Relación**: 1 Cliente tiene N Granjas (GestorAvicola), 1 Granja tiene N Galpones

```sql
-- Cliente
Clientes.Id → GestorAvicola.ClienteId (1:N)

-- Granja (GestorAvicola)
GestorAvicola.Id → Galpones.GestorAvicolaId (1:N)

-- Galpón
Galpones.Id → RegistroProduccionDiario.GalponId (1:N)
```

**Ejemplo Real:**
```
Cliente: "Avícola San José" (ClienteId = 1)
  └─ Granja: "Granja Central" (GestorAvicolaId = 1)
       ├─ Galpón 5 (1906 gallinas)
       └─ Galpón 6 (1945 gallinas)
  
Cliente: "Avícola Santa María" (ClienteId = 2)
  └─ Granja: "Granja Norte" (GestorAvicolaId = 2)
       ├─ Galpón 1 (2678 gallinas)
       ├─ Galpón 2 (2601 gallinas)
       └─ Galpón 5 (2793 gallinas)
```

### **2. Cliente → Trabajadores**

**Relación**: 1 Cliente tiene N Trabajadores

```sql
Clientes.Id → Trabajadores.ClienteId (1:N)
```

**Ejemplo Real:**
```
Cliente: "Avícola San José" (ClienteId = 1)
  ├─ Trabajador: kamata@icarus.com
  └─ Trabajador: ok3@icarus.com

Cliente: "Avícola Santa María" (ClienteId = 2)
  ├─ Trabajador: kondo@icarus.com
  └─ Trabajador: otro@icarus.com
```

### **3. Trabajador → JWT Token → Acceso a Galpones**

**Flujo de Autorización:**

```
1. Trabajador inicia sesión (email + password)
   ↓
2. API genera JWT Token con Claims:
   - WorkerId: ID del trabajador
   - ClienteId: ID del cliente del trabajador
   - Role: "Trabajador"
   ↓
3. App móvil almacena token en SecureStorage
   ↓
4. Al cargar galpones: GET /api/mobile/registro-produccion/galpones
   Header: Authorization: Bearer {token}
   ↓
5. API extrae ClienteId del token
   ↓
6. Backend consulta:
   SELECT g.* FROM Galpones g
   INNER JOIN GestorAvicola ga ON g.GestorAvicolaId = ga.Id
   WHERE ga.ClienteId = @ClienteId
     AND g.EstaActivo = 1
   ↓
7. Retorna solo galpones del cliente del trabajador
```

**Seguridad:**
- ✅ Trabajador **SOLO** ve galpones de su cliente
- ✅ Trabajador **NO** puede acceder a galpones de otros clientes
- ❌ Backend valida ClienteId en CADA request

---

## 📊 Modelo de Datos: BACKEND (.NET Core)

### **Entidad: RegistroProduccionDiario**

**Ubicación**: `ICARUS.Domain/Entities/GestionAvicola/RegistroProduccionDiario.cs`

```csharp
public class RegistroProduccionDiario : BaseEntity
{
    // Identificación
    public int Id { get; set; }                    // PK
    public DateTime Fecha { get; set; }            // Fecha del registro
    public TimeSpan HoraRegistro { get; set; }     // Hora específica
    
    // Relaciones (Foreign Keys)
    public int GalponId { get; set; }              // FK → Galpones
    public int ClienteId { get; set; }             // FK desnormalizado (performance)
    public int NumeroRegistro { get; set; }        // Secuencial por galpón/día
    
    // Datos de Producción
    public int CantidadMaples { get; set; }        // Maples (30 huevos c/u)
    public int UnidadesIncompletas { get; set; }   // 0-29 huevos sueltos
    
    // Datos de Mortalidad
    public int GallinasMuertas { get; set; }       // Número de gallinas muertas
    public decimal PorcentajeMortalidad { get; set; } // % calculado
    
    // Datos Calculados (se guardan para historial)
    public decimal EficienciaProduccion { get; set; } // (TotalHuevos/Gallinas)*100
    
    // Información Adicional
    public string? Observaciones { get; set; }
    
    // Auditoría (heredado de BaseEntity)
    public DateTime FechaCreacion { get; set; }
    public DateTime? FechaModificacion { get; set; }
    public string? CreadoPor { get; set; }         // Email del trabajador
    public string? ModificadoPor { get; set; }
    public bool EstaActivo { get; set; }           // Soft delete
    
    // Navegación
    public virtual Galpon Galpon { get; set; }
    
    // Métodos de Cálculo
    public int CalcularTotalHuevosProducidos() 
        => (CantidadMaples * 30) + UnidadesIncompletas;
    
    public decimal CalcularEficienciaProduccion(int gallinasActuales, decimal produccionEsperada = 0.8m)
    {
        // Implementación...
    }
}
```

**Restricciones en Base de Datos:**

```sql
-- Check Constraints
ALTER TABLE RegistroProduccionDiario
  ADD CONSTRAINT CK_CantidadMaples CHECK (CantidadMaples >= 0);

ALTER TABLE RegistroProduccionDiario
  ADD CONSTRAINT CK_UnidadesIncompletas 
  CHECK (UnidadesIncompletas >= 0 AND UnidadesIncompletas < 30);

ALTER TABLE RegistroProduccionDiario
  ADD CONSTRAINT CK_GallinasMuertas CHECK (GallinasMuertas >= 0);

ALTER TABLE RegistroProduccionDiario
  ADD CONSTRAINT CK_Fecha CHECK (Fecha <= GETDATE());

-- Unique Constraint (permite múltiples registros por día)
-- Se maneja con NumeroRegistro secuencial
```

---

### **DTO: RegistroProduccionDiarioDto**

**Ubicación**: `ICARUS.Application/Features/GestionAvicola/DTOs/RegistroProduccionDiarioDto.cs`

```csharp
public class RegistroProduccionDiarioDto
{
    // Identificación
    public int Id { get; set; }
    public DateTime Fecha { get; set; }
    public int GalponId { get; set; }
    public string NumeroGalpon { get; set; } = string.Empty;
    
    // Producción
    public int CantidadMaples { get; set; }
    public int UnidadesIncompletas { get; set; }
    
    // Mortalidad
    public int GallinasMuertas { get; set; }
    public decimal PorcentajeMortalidad { get; set; }
    
    // Eficiencia
    public decimal EficienciaProduccion { get; set; }
    public decimal ProduccionPorGallina { get; set; }
    
    // Observaciones
    public string? Observaciones { get; set; }
    
    // Auditoría
    public DateTime FechaCreacion { get; set; }
    public string? CreadoPor { get; set; }
    
    // Propiedades Calculadas
    public int TotalHuevosProducidos => (CantidadMaples * 30) + UnidadesIncompletas;
    public bool TieneMortalidad => GallinasMuertas > 0;
    public bool RequiereAtencionMortalidad => PorcentajeMortalidad > 2m;
    public bool RequiereAtencionProduccion => EficienciaProduccion < 60m;
}
```

---

### **Command: CreateRegistroProduccionDiarioCommand**

**Ubicación**: `ICARUS.Application/Features/GestionAvicola/Commands/RegistroProduccion/CreateRegistroProduccionDiarioCommand.cs`

```csharp
public class CreateRegistroProduccionDiarioCommand 
    : IRequest<OperationResult<RegistroProduccionDiarioDto>>
{
    public DateTime Fecha { get; set; }
    public int GalponId { get; set; }
    public int CantidadMaples { get; set; }
    public int UnidadesIncompletas { get; set; }
    public int GallinasMuertas { get; set; }
    public string? Observaciones { get; set; }
    public string? CausaProbableMortalidad { get; set; }
    public string? AccionesTomadasMortalidad { get; set; }
    public string? CreadoPor { get; set; }      // Email del trabajador
}
```

---

## 📱 Modelo de Datos: MOBILE (.NET MAUI)

### **Model: RegistroProduccionModel**

**Ubicación**: `ICARUS_MOBILE/Modules/GestionAvicola/Models/RegistroProduccionModel.cs`

**Propósito**: Representa un registro completo recibido desde el API (response)

```csharp
public class RegistroProduccionModel
{
    // Identificación
    public int Id { get; set; }
    public DateTime Fecha { get; set; }
    public TimeSpan HoraRegistro { get; set; }
    
    // Relación Galpón
    public int GalponId { get; set; }
    public GalponModel? Galpon { get; set; }
    public string? NumeroGalpon { get; set; }
    
    // Producción
    public int CantidadMaples { get; set; }
    public int UnidadesIncompletas { get; set; }
    
    // Mortalidad
    public int GallinasMuertas { get; set; }
    public decimal PorcentajeMortalidad { get; set; }
    
    // Eficiencia
    public decimal EficienciaProduccion { get; set; }
    
    // Observaciones
    public string? Observaciones { get; set; }
    public string? CausaProbableMortalidad { get; set; }
    public string? AccionesTomadasMortalidad { get; set; }
    
    // Auditoría
    public DateTime FechaCreacion { get; set; }
    public string? CreadoPor { get; set; }
    
    // Propiedades Calculadas
    public int TotalHuevos => (CantidadMaples * 30) + UnidadesIncompletas;
    public bool TieneMortalidad => GallinasMuertas > 0;
    public bool MortalidadAlta => PorcentajeMortalidad > 2m;
    
    // Display Properties
    public string FechaFormateada => Fecha.ToString("dd/MM/yyyy");
    public string TotalHuevosFormatted => $"{TotalHuevos:N0} huevos";
}
```

---

### **Request: CreateRegistroProduccionRequest**

**Ubicación**: `ICARUS_MOBILE/Modules/GestionAvicola/Models/RegistroProduccionRequest.cs`

**Propósito**: Datos enviados al API para crear un registro (request)

```csharp
public class CreateRegistroProduccionRequest
{
    // Datos Básicos
    public DateTime Fecha { get; set; } = DateTime.Today;
    public int GalponId { get; set; }
    public TimeSpan HoraRegistro { get; set; } = DateTime.Now.TimeOfDay;
    
    // Producción
    public int CantidadMaples { get; set; }
    public int UnidadesIncompletas { get; set; }
    
    // Mortalidad
    public int GallinasMuertas { get; set; }
    public string? Observaciones { get; set; }
    public string? CausaProbableMortalidad { get; set; }
    public string? AccionesTomadasMortalidad { get; set; }
    
    // Auditoría
    public string CreadoPor { get; set; } = string.Empty; // Email trabajador
    
    // Cálculo
    public int TotalHuevos => (CantidadMaples * 30) + UnidadesIncompletas;
    
    // Validación
    public bool EsValido()
    {
        return GalponId > 0 &&
               Fecha <= DateTime.Today &&
               CantidadMaples >= 0 &&
               UnidadesIncompletas >= 0 && UnidadesIncompletas < 30 &&
               GallinasMuertas >= 0 &&
               !string.IsNullOrWhiteSpace(CreadoPor);
    }
}
```

---

### **Request: UpdateRegistroProduccionRequest**

**Ubicación**: `ICARUS_MOBILE/Modules/GestionAvicola/Models/RegistroProduccionRequest.cs`

**Propósito**: Datos enviados al API para actualizar un registro existente

```csharp
public class UpdateRegistroProduccionRequest
{
    public int Id { get; set; }                    // ID del registro a actualizar
    public DateTime Fecha { get; set; }
    public int GalponId { get; set; }
    public TimeSpan HoraRegistro { get; set; }
    
    // ... mismos campos que Create
    
    public string ModificadoPor { get; set; } = string.Empty; // Email trabajador
}
```

---

### **Model: GalponModel**

**Ubicación**: `ICARUS_MOBILE/Modules/GestionAvicola/Models/GalponModel.cs`

**Propósito**: Representa un galpón en la UI (para Pickers, listas)

```csharp
public class GalponModel
{
    public int Id { get; set; }
    public string Numero { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public int NumeroGallinasActual { get; set; }
    public int CapacidadMaxima { get; set; }
    public bool EstaActivo { get; set; }
    
    // Display en Picker
    public string DisplayText => 
        $"{Numero} - {Nombre} ({NumeroGallinasActual} gallinas)";
    
    // Cálculo de ocupación
    public decimal PorcentajeOcupacion => 
        CapacidadMaxima > 0 
            ? (decimal)NumeroGallinasActual / CapacidadMaxima * 100 
            : 0;
}
```

---

## 🔄 Flujo de Datos Completo

### **1. Cargar Galpones Disponibles**

```
┌─────────────┐   GET /galpones    ┌──────────┐   Query    ┌──────────┐
│   MOBILE    │─────────────────────►   API    │────────────►  Backend │
│             │   Header: JWT       │          │            │  CQRS    │
└─────────────┘                     └──────────┘            └──────────┘
                                          │                        │
                                          │                        ▼
                                          │                   ┌──────────┐
                                          │                   │    DB    │
                                          │                   │  SELECT  │
                                          │                   │  Galpones│
                                          │                   │  WHERE   │
                                          │                   │ ClienteId│
                                          │                   └──────────┘
                                          │                        │
                                          ◄────────────────────────┘
                                          │   List<GalponDto>
                                          │
                                          ▼
┌─────────────┐   List<GalponModel> │
│   MOBILE    │◄────────────────────┘
│  Picker     │
└─────────────┘
```

**Request:**
```http
GET /api/mobile/registro-produccion/galpones
Authorization: Bearer eyJ...
```

**Response:**
```json
[
  {
    "id": 5,
    "numero": "galpon5",
    "nombre": "Galpón 5",
    "numeroGallinasActual": 1906,
    "capacidadMaxima": 2000,
    "estaActivo": true
  },
  {
    "id": 6,
    "numero": "Galpon6",
    "nombre": "Galpón 6",
    "numeroGallinasActual": 1945,
    "capacidadMaxima": 2000,
    "estaActivo": true
  }
]
```

---

### **2. Crear Registro de Producción**

```
┌─────────────┐                    ┌──────────┐
│   MOBILE    │   POST /registro   │   API    │
│  ViewModel  │─────────────────────►Controller│
└─────────────┘   Request JSON     └──────────┘
       │                                  │
       │                                  ▼
       │                         ┌─────────────────┐
       │                         │  CommandHandler │
       │                         │  Validaciones:  │
       │                         │  - Galpón válido│
       │                         │  - Cliente match│
       │                         │  - No duplicado │
       │                         └─────────────────┘
       │                                  │
       │                                  ▼
       │                            ┌──────────┐
       │                            │    DB    │
       │                            │  INSERT  │
       │                            │ Registro │
       │                            └──────────┘
       │                                  │
       │                                  │
       ◄──────────────────────────────────┘
       │      RegistroProduccionModel
       │      (con ID generado)
       ▼
┌─────────────┐
│   Toast     │
│  "Éxito"    │
└─────────────┘
```

**Request:**
```json
POST /api/mobile/registro-produccion
{
  "fecha": "2025-12-09T00:00:00",
  "galponId": 5,
  "horaRegistro": "14:30:00",
  "cantidadMaples": 450,
  "unidadesIncompletas": 15,
  "gallinasMuertas": 5,
  "observaciones": "Producción normal",
  "causaProbableMortalidad": "Enfermedad respiratoria",
  "accionesTomadasMortalidad": "Aislamiento",
  "creadoPor": "ok3@icarus.com"
}
```

**Response:**
```json
{
  "id": 123,
  "fecha": "2025-12-09T00:00:00",
  "galponId": 5,
  "numeroGalpon": "galpon5",
  "totalHuevosProducidos": 13515,
  "eficienciaProduccion": 90.1,
  "porcentajeMortalidad": 0.26,
  "fechaCreacion": "2025-12-09T14:30:00"
}
```

---

## 🔐 Seguridad y Validaciones

### **Validación en Cada Capa**

| Capa | Responsabilidad | Ejemplo |
|------|----------------|---------|
| **UI (XAML)** | Validación visual, input masks | Entry.Keyboard="Numeric", MaxLength |
| **ViewModel** | Validación pre-envío | `ValidarDatos()` retorna errores |
| **Request Model** | Validación estructura | `EsValido()` verifica rangos |
| **API Controller** | Autenticación/Autorización | `[Authorize(Roles="Trabajador")]` |
| **Command Handler** | Validación de negocio | Galpón pertenece a cliente |
| **Entity** | Validación de dominio | Métodos de cálculo, reglas |
| **Database** | Restricciones físicas | CHECK constraints, FK |

### **Validaciones Críticas**

```csharp
// ViewModel (Mobile)
public List<string> ValidarDatos()
{
    List<string> errores = new();
    
    if (GalponSeleccionado == null)
        errores.Add("Debe seleccionar un galpón");
    
    if (Fecha > DateTime.Today)
        errores.Add("La fecha no puede ser futura");
    
    if (UnidadesIncompletasInt >= 30)
        errores.Add("Unidades incompletas deben ser < 30");
    
    if (GallinasMuertasInt > 0)
    {
        if (string.IsNullOrWhiteSpace(CausaProbableMortalidad))
            errores.Add("Especifique causa de mortalidad");
    }
    
    return errores;
}
```

```csharp
// CommandHandler (Backend)
public async Task<OperationResult<RegistroProduccionDiarioDto>> Handle(
    CreateRegistroProduccionDiarioCommand request, 
    CancellationToken cancellationToken)
{
    // 1. Validar que el galpón existe
    Galpon? galpon = await _galponRepository.GetByIdAsync(request.GalponId);
    if (galpon == null)
        return OperationResult<>.Failure("Galpón no encontrado");
    
    // 2. Validar que el galpón pertenece al cliente del trabajador
    // (ClienteId viene del JWT token)
    if (galpon.GestorAvicola.ClienteId != clienteIdFromToken)
        return OperationResult<>.Failure("No tiene permisos");
    
    // 3. Validar no duplicado
    bool existeRegistro = await _repository.ExisteRegistroAsync(
        request.GalponId, request.Fecha);
    if (existeRegistro)
        return OperationResult<>.Failure("Ya existe registro");
    
    // 4. Crear entidad y calcular valores
    // 5. Guardar en BD
    // 6. Retornar DTO
}
```

---

## 📈 Cálculos y Fórmulas

### **Total de Huevos**
```
TotalHuevos = (CantidadMaples × 30) + UnidadesIncompletas

Ejemplo: 450 maples + 15 unidades = 13515 huevos
```

### **Eficiencia de Producción**
```
EficienciaProduccion = (TotalHuevos / NumeroGallinasActual) × 100

Ejemplo: (13515 / 15000) × 100 = 90.1%
```

### **Porcentaje de Mortalidad**
```
PorcentajeMortalidad = (GallinasMuertas / NumeroGallinasActual) × 100

Ejemplo: (5 / 1906) × 100 = 0.26%
```

### **Alertas**
```
MortalidadAlta = PorcentajeMortalidad > 2%
ProduccionBaja = EficienciaProduccion < 60%
```

---

## 🎯 Campos Desnormalizados

### **ClienteId en RegistroProduccionDiario**

**¿Por qué existe?**
```
Relación normal:
RegistroProduccionDiario → Galpon → GestorAvicola → Cliente
(3 JOINs para obtener ClienteId)

Con ClienteId desnormalizado:
RegistroProduccionDiario.ClienteId (acceso directo, 1 query)
```

**Ventajas:**
- ✅ Performance en consultas filtradas por cliente
- ✅ Índice directo para búsquedas
- ✅ Simplifica autorizaciones

**Desventajas:**
- ❌ Duplicación de dato (se mantiene consistencia en handler)

### **EficienciaProduccion en RegistroProduccionDiario**

**¿Por qué se guarda?**
- Las gallinas cambian constantemente (nacen, mueren, se venden)
- Si solo guardáramos huevos, al calcular eficiencia histórica sería incorrecta
- Se guarda el valor calculado AL MOMENTO del registro para historial preciso

---

## 🔍 Consultas Comunes

### **Obtener registros de un trabajador**
```sql
SELECT r.*
FROM RegistroProduccionDiario r
INNER JOIN Galpones g ON r.GalponId = g.Id
INNER JOIN GestorAvicola ga ON g.GestorAvicolaId = ga.Id
INNER JOIN Trabajadores t ON ga.ClienteId = t.ClienteId
WHERE t.Email = 'ok3@icarus.com'
  AND r.EstaActivo = 1
ORDER BY r.Fecha DESC;
```

### **Verificar registro duplicado**
```sql
SELECT COUNT(*)
FROM RegistroProduccionDiario
WHERE GalponId = @GalponId
  AND Fecha = @Fecha
  AND EstaActivo = 1;
```

### **Resumen diario por cliente**
```sql
SELECT 
    r.ClienteId,
    r.Fecha,
    COUNT(*) AS TotalRegistros,
    SUM((r.CantidadMaples * 30) + r.UnidadesIncompletas) AS TotalHuevos,
    SUM(r.GallinasMuertas) AS TotalMortalidad,
    AVG(r.EficienciaProduccion) AS PromedioEficiencia
FROM RegistroProduccionDiario r
WHERE r.Fecha = @Fecha
  AND r.EstaActivo = 1
GROUP BY r.ClienteId, r.Fecha;
```
