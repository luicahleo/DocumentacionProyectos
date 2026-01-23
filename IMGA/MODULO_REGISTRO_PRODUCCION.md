# Módulo de Registro de Producción Diario - ICARUS Mobile

## 📋 Información General

**Módulo**: Registro de Producción Diario  
**Propósito**: Permitir a trabajadores registrar producción de huevos y mortalidad de gallinas por galpón  
**Plataforma**: .NET MAUI (Android/iOS)  
**Versión**: 1.0.0  
**Fecha**: Diciembre 2025

---

## 🎯 Funcionalidad Principal

El módulo permite a trabajadores móviles crear, editar y consultar registros diarios de:
- **Producción de huevos** (en maples de 30 unidades + unidades incompletas)
- **Mortalidad de gallinas** (con causa probable y acciones tomadas)
- **Cálculos automáticos**: Total huevos, eficiencia, porcentaje de mortalidad

---

## 🏗️ Arquitectura del Módulo

### Capas de la Aplicación

```
┌─────────────────────────────────────────────────────────┐
│                    VIEWS (XAML)                         │
│  CrearRegistroProduccionPage.xaml                       │
│  EditarRegistroProduccionPage.xaml                      │
└─────────────────────────────────────────────────────────┘
                          ↓ Binding
┌─────────────────────────────────────────────────────────┐
│                   VIEWMODELS                            │
│  CrearRegistroProduccionViewModel                       │
│  EditarRegistroProduccionViewModel                      │
│  • Validaciones                                         │
│  • Cálculos en tiempo real                              │
│  • Comandos (Guardar, Limpiar, Volver)                 │
└─────────────────────────────────────────────────────────┘
                          ↓ Usa
┌─────────────────────────────────────────────────────────┐
│                    SERVICES                             │
│  IRegistroProduccionService                             │
│  RegistroProduccionService                              │
│  • CrearRegistroProduccionAsync                         │
│  • ActualizarRegistroProduccionAsync                    │
│  • GetGalponesDisponiblesAsync                          │
│  • GetHistorialRegistrosAsync                           │
└─────────────────────────────────────────────────────────┘
                          ↓ HTTP
┌─────────────────────────────────────────────────────────┐
│                  API BACKEND (.NET 8)                   │
│  RegistroProduccionMobileController                     │
│  /api/mobile/registro-produccion                        │
│  • POST / (crear)                                       │
│  • PUT / (editar)                                       │
│  • GET /galpones (listar galpones)                      │
│  • GET /historial (consultar registros)                 │
└─────────────────────────────────────────────────────────┘
                          ↓ MediatR
┌─────────────────────────────────────────────────────────┐
│             APPLICATION LAYER (CQRS)                    │
│  Commands:                                              │
│    - CreateRegistroProduccionDiarioCommand              │
│    - UpdateRegistroProduccionDiarioCommand              │
│  Queries:                                               │
│    - GetGalponesQuery                                   │
│    - GetHistorialRegistrosQuery                         │
└─────────────────────────────────────────────────────────┘
                          ↓ Repository
┌─────────────────────────────────────────────────────────┐
│                  DATABASE (SQL Server)                  │
│  Tablas:                                                │
│    - RegistroProduccionDiario                           │
│    - Galpon                                             │
│    - Cliente                                            │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Estructura de Archivos

### **Mobile (MAUI)**

```
ICARUS_MOBILE/Modules/GestionAvicola/
├── Views/
│   ├── CrearRegistroProduccionPage.xaml          # Formulario crear
│   ├── CrearRegistroProduccionPage.xaml.cs
│   ├── EditarRegistroProduccionPage.xaml         # Formulario editar
│   └── EditarRegistroProduccionPage.xaml.cs
├── ViewModels/
│   ├── CrearRegistroProduccionViewModel.cs       # Lógica crear (528 líneas)
│   └── EditarRegistroProduccionViewModel.cs      # Lógica editar
├── Services/
│   ├── IRegistroProduccionService.cs             # Interfaz servicio
│   └── RegistroProduccionService.cs              # Implementación HTTP (577 líneas)
└── Models/
    ├── RegistroProduccionModel.cs                # Modelo respuesta API
    ├── RegistroProduccionRequest.cs              # Request crear/editar
    ├── GalponModel.cs                            # Modelo galpón
    ├── FiltrosHistorialRegistros.cs              # Filtros consulta
    └── HistorialRegistrosResponse.cs             # Respuesta paginada
```

### **Backend (.NET Core)**

```
ICARUS/
├── ICARUS.Domain/Entities/GestionAvicola/
│   └── RegistroProduccionDiario.cs               # Entidad dominio
├── ICARUS.Application/Features/GestionAvicola/
│   ├── Commands/RegistroProduccion/
│   │   ├── CreateRegistroProduccionDiarioCommand.cs
│   │   └── UpdateRegistroProduccionDiarioCommand.cs
│   ├── Queries/RegistroProduccion/
│   │   ├── GetHistorialRegistrosQuery.cs
│   │   └── GetGalponesQuery.cs
│   └── DTOs/
│       └── RegistroProduccionDiarioDto.cs
├── ICARUS.Infrastructure/
│   ├── Repositories/
│   │   └── RegistroProduccionDiarioRepository.cs
│   └── Configurations/
│       └── RegistroProduccionDiarioConfiguration.cs
└── ICARUS.API/Controllers/Mobile/
    └── RegistroProduccionMobileController.cs     # API endpoints (637 líneas)
```

---

## 🔄 Flujo de Creación de Registro

### **1. Inicialización**

```
Usuario → NavigateTo("CrearRegistroProduccionPage")
  ↓
ViewModel.InitializeAsync()
  ↓
CargarGalponesAsync()
  ↓ HTTP GET
API: /api/mobile/registro-produccion/galpones
  ↓ Backend
Query: GetGalponesQuery (cliente del trabajador autenticado)
  ↓ Repository
SELECT * FROM Galpon WHERE ClienteId = @ClienteId AND EstaActivo = 1
  ↓ Retorna
List<GalponDto> → GalponesDisponibles (Picker)
```

### **2. Llenado del Formulario**

**Campos del formulario:**
- **Fecha**: DateTime (default: hoy, no futuras)
- **Galpón**: Picker (carga dinámica según cliente)
- **Cantidad Maples**: int (1 maple = 30 huevos)
- **Unidades Incompletas**: int (0-29)
- **Gallinas Muertas**: int
- **Observaciones**: string (opcional)

**Si hay mortalidad (GallinasMuertas > 0):**
- **Causa Probable Mortalidad**: string (requerido)
- **Acciones Tomadas**: string (requerido)

**Cálculos Automáticos (en tiempo real):**
```csharp
TotalHuevos = (CantidadMaples * 30) + UnidadesIncompletas

EficienciaProduccion = (TotalHuevos / GalponSeleccionado.NumeroGallinasActual) * 100

PorcentajeMortalidad = (GallinasMuertas / GalponSeleccionado.NumeroGallinasActual) * 100

MortalidadAlta = PorcentajeMortalidad > 2%
```

### **3. Validación Defensiva**

**Antes de guardar:**
```csharp
ValidarDatos() → List<string> errores
  ✓ GalponSeleccionado != null
  ✓ Fecha <= DateTime.Today (no futuras)
  ✓ CantidadMaples >= 0
  ✓ UnidadesIncompletas entre 0-29
  ✓ GallinasMuertas >= 0
  ✓ Si GallinasMuertas > 0:
      - CausaProbableMortalidad NO vacía
      - AccionesTomadasMortalidad NO vacía
```

### **4. Guardado**

```
Usuario → Click "Guardar"
  ↓
GuardarRegistroAsync()
  ↓ Validación local
ValidarDatos() → OK
  ↓ Obtener trabajador
ObtenerEmailTrabajadorAutenticadoAsync() → "ok3@icarus.com"
  ↓ Construir request
CreateRegistroProduccionRequest {
  Fecha, GalponId, CantidadMaples,
  UnidadesIncompletas, GallinasMuertas,
  Observaciones, CausaProbable, Acciones,
  CreadoPor = "ok3@icarus.com"
}
  ↓ HTTP POST
API: POST /api/mobile/registro-produccion
  ↓ Backend
Command: CreateRegistroProduccionDiarioCommand
  ↓ Handler
1. Validar galpón existe y pertenece al cliente del trabajador
2. Validar no duplicado (mismo galpón + misma fecha)
3. Calcular porcentaje mortalidad
4. Crear entidad RegistroProduccionDiario
5. Guardar en BD
  ↓ Retorna
RegistroProduccionModel (con Id generado)
  ↓ UI
Mostrar Toast "Registro creado exitosamente"
Limpiar formulario
```

---

## 📊 Modelo de Datos

### **Entidad: RegistroProduccionDiario**

```csharp
public class RegistroProduccionDiario : BaseEntity
{
    public int Id { get; set; }                      // PK
    public DateTime Fecha { get; set; }              // Fecha registro
    public int GalponId { get; set; }                // FK a Galpon
    public int CantidadMaples { get; set; }          // Maples (30 huevos c/u)
    public int UnidadesIncompletas { get; set; }     // 0-29 huevos
    public int GallinasMuertas { get; set; }         // Mortalidad
    public decimal PorcentajeMortalidad { get; set; } // Calculado
    public string? Observaciones { get; set; }
    
    // Auditoría (BaseEntity)
    public DateTime FechaCreacion { get; set; }
    public string? CreadoPor { get; set; }           // Email trabajador
    public bool EstaActivo { get; set; }             // Soft delete
    
    // Navegación
    public virtual Galpon Galpon { get; set; }
}
```

**Restricciones BD:**
- CHECK: `CantidadMaples >= 0`
- CHECK: `UnidadesIncompletas >= 0 AND UnidadesIncompletas < 30`
- CHECK: `GallinasMuertas >= 0`
- CHECK: `Fecha <= GETDATE()` (no fechas futuras)
- UNIQUE: `(GalponId, Fecha)` - 1 registro por galpón por día

---

## 🔐 Seguridad y Autorización

### **Autenticación JWT**

**Token contiene:**
- `WorkerId`: ID del trabajador
- `ClientId`: ID del cliente (empresa)
- `Role`: "Trabajador"

**Validación en API:**
```csharp
[Authorize(Roles = "Trabajador")]
public class RegistroProduccionMobileController
{
    // Solo trabajadores autenticados
    // Solo acceso a galpones de su cliente
    // Solo editar/eliminar sus propios registros
}
```

### **Validaciones de Seguridad**

1. **Crear Registro**: Galpón debe pertenecer al cliente del trabajador
2. **Editar Registro**: Solo el creador puede editar
3. **Eliminar Registro**: Solo el creador puede eliminar (máximo 30 días)
4. **Consultar Historial**: Solo ve sus propios registros

---

## 🧪 Validaciones Implementadas

### **Frontend (MAUI)**

**1. Validaciones en Tiempo Real:**
```csharp
// Propiedades calculadas actualizan automáticamente
partial void OnCantidadMaplesChanged(string value)
    → ActualizarCalculos() → OnPropertyChanged(TotalHuevos)

// Binding XAML refleja cambios instantáneamente
<Label Text="{Binding TotalHuevos}" /> // Reactivo
```

**2. Validaciones Pre-Guardado:**
```csharp
public List<string> ValidarDatos()
{
    // Retorna lista de errores
    // UI muestra alertas antes de enviar
}
```

### **Backend (API)**

**1. Validaciones de Negocio:**
```csharp
// Handler: CreateRegistroProduccionDiarioCommandHandler
✓ Galpón existe y está activo
✓ Galpón pertenece al cliente del trabajador
✓ No existe registro duplicado (mismo galpón + fecha)
✓ Fecha no es futura
✓ Valores numéricos en rangos válidos
```

**2. Validaciones de Base de Datos:**
```sql
CHECK (CantidadMaples >= 0)
CHECK (UnidadesIncompletas >= 0 AND UnidadesIncompletas < 30)
CHECK (GallinasMuertas >= 0)
CHECK (Fecha <= GETDATE())
```

---

## 📡 Endpoints API

### **GET /api/mobile/registro-produccion/galpones**

**Descripción**: Obtiene galpones del cliente del trabajador autenticado

**Headers**: `Authorization: Bearer {token}`

**Response 200 OK**:
```json
[
  {
    "id": 7,
    "numeroGalpon": "7",
    "numeroGallinasActual": 15000,
    "displayText": "Galpón 7 (15000 gallinas)"
  }
]
```

---

### **POST /api/mobile/registro-produccion**

**Descripción**: Crea un nuevo registro de producción

**Headers**: `Authorization: Bearer {token}`

**Request Body**:
```json
{
  "fecha": "2025-12-09T00:00:00",
  "galponId": 7,
  "cantidadMaples": 450,
  "unidadesIncompletas": 15,
  "gallinasMuertas": 5,
  "observaciones": "Producción normal",
  "causaProbableMortalidad": "Enfermedad respiratoria",
  "accionesTomadasMortalidad": "Aislamiento y medicación",
  "creadoPor": "ok3@icarus.com"
}
```

**Response 201 Created**:
```json
{
  "id": 123,
  "fecha": "2025-12-09T00:00:00",
  "galponId": 7,
  "numeroGalpon": "7",
  "totalHuevosProducidos": 13515,
  "eficienciaProduccion": 90.1,
  "porcentajeMortalidad": 0.03,
  "gallinasMuertas": 5,
  "fechaCreacion": "2025-12-09T14:30:00"
}
```

**Response 400 Bad Request**:
```json
{
  "error": "Ya existe un registro para este galpón en la fecha especificada"
}
```

---

### **GET /api/mobile/registro-produccion/historial**

**Descripción**: Obtiene historial de registros del trabajador

**Query Parameters**:
- `fechaInicio` (opcional): DateTime
- `fechaFin` (opcional): DateTime
- `galponId` (opcional): int
- `pageNumber` (default: 1): int
- `pageSize` (default: 20): int

**Response 200 OK**:
```json
{
  "registros": [...],
  "totalRegistros": 45,
  "paginaActual": 1,
  "totalPaginas": 3
}
```

---

## 🎨 UI/UX del Formulario

### **Diseño Visual**

**Colores:**
- **Maples**: Azul Primary (#2E86AB) 🥚
- **Unidades**: Púrpura Secondary (#A23B72) 🔢
- **Mortalidad**: Rojo Danger (#DC3545) 💀

**Componentes:**
- **Cards con sombras** para cada sección
- **Campos numéricos grandes** (FontSize 28, centrados)
- **Tooltips** explicativos: "(30 huevos cada uno)"
- **Alertas visuales**: Mortalidad > 2% muestra banner rojo

### **Cálculos Visibles**

```xml
<!-- Total Huevos -->
<Label Text="{Binding TotalHuevos, StringFormat='Total: {0} huevos'}"
       FontSize="20" FontAttributes="Bold" />

<!-- Eficiencia -->
<Label Text="{Binding EficienciaProduccion, StringFormat='Eficiencia: {0:F1}%'}"
       TextColor="{Binding EficienciaProduccion, 
                   Converter={StaticResource EfficiencyToColorConverter}}" />

<!-- Mortalidad -->
<Label Text="{Binding PorcentajeMortalidad, StringFormat='Mortalidad: {0:F2}%'}"
       IsVisible="{Binding TieneMortalidad}"
       TextColor="{Binding MortalidadAlta, 
                   Converter={StaticResource BoolToColorConverter}}" />
```

---

## 🔧 Servicios y Dependencias

### **Inyección de Dependencias (MauiProgram.cs)**

```csharp
// Services
builder.Services.AddScoped<IRegistroProduccionService, RegistroProduccionService>();

// ViewModels
builder.Services.AddTransient<CrearRegistroProduccionViewModel>();
builder.Services.AddTransient<EditarRegistroProduccionViewModel>();

// Pages
builder.Services.AddTransient<CrearRegistroProduccionPage>();
builder.Services.AddTransient<EditarRegistroProduccionPage>();
```

### **HttpClient Configuration**

```csharp
builder.Services.AddHttpClient<IRegistroProduccionService, RegistroProduccionService>(client =>
{
    client.BaseAddress = new Uri("http://10.0.2.2:5090/api/");
    client.Timeout = TimeSpan.FromSeconds(30);
});
```

---

## 📝 Logging

### **Puntos de Logging**

**ViewModel:**
```csharp
await _loggingService.LogInfoAsync(
    "CrearRegistroProduccionViewModel.GuardarRegistroAsync - Iniciando guardado",
    "RegistroProduccion");
```

**Service:**
```csharp
await _loggingService.LogErrorAsync(
    $"Error al crear registro: {response.StatusCode}",
    "RegistroProduccion");
```

**API Controller:**
```csharp
_logger.Info(
    "RegistroProduccionMobileController.CrearRegistro - Registro creado exitosamente");
```

---

## 🚀 Flujo Completo Ejemplo

**Escenario**: Trabajador "ok3@icarus.com" registra producción del Galpón 7

```
1. Usuario abre app → Login exitoso (JWT token guardado)

2. Navega a: Gestión Avícola → "Crear Registro"
   → GET /api/mobile/registro-produccion/galpones
   → Retorna: [Galpón 7, Galpón 8, Galpón 9]

3. Llena formulario:
   - Fecha: 09/12/2025 (hoy)
   - Galpón: Galpón 7 (15000 gallinas)
   - Maples: 450
   - Unidades: 15
   → UI calcula: Total = 13515 huevos, Eficiencia = 90.1%

4. Registra mortalidad:
   - Gallinas muertas: 5
   → UI calcula: Mortalidad = 0.03% (OK, < 2%)
   - Causa: "Enfermedad respiratoria"
   - Acciones: "Aislamiento y medicación"

5. Click "Guardar"
   → ValidarDatos() → OK (todos los campos válidos)
   → POST /api/mobile/registro-produccion
   → Backend valida:
      ✓ Galpón 7 pertenece al cliente del trabajador
      ✓ No existe registro previo para 09/12/2025
      ✓ Calcula PorcentajeMortalidad = 0.03%
   → INSERT INTO RegistroProduccionDiario
   → HTTP 201 Created

6. UI muestra:
   → Toast verde: "✓ Registro creado exitosamente"
   → Formulario se limpia
   → Usuario puede crear otro registro
```

---

## 📚 Referencias Técnicas

**Guías de Código:**
- `/Instrucciones para escribir MAUI.instructions.md`
- `/Instrucciones para Escribir codigo.instructions.md`
- `/.github/copilot-instructions.md`

**Patrones Aplicados:**
- MVVM (Model-View-ViewModel)
- CQRS (Command Query Responsibility Segregation)
- Repository Pattern
- Dependency Injection
- Validación Defensiva (nunca Try-Catch en lógica de negocio)

**Convenciones:**
- Nunca usar `var` para tipos primitivos
- Nunca usar `null`, usar objetos vacíos
- Siempre usar `this.` para calificar campos
- Logging obligatorio con `IEmulatorLoggingService`
- Nombres en inglés (código), comentarios en español

---

## 🎯 Próximos Pasos

1. Crear **Plan de Pruebas** específico para Registro de Producción
2. Implementar **validación offline** (guardar en cache si no hay conexión)
3. Agregar **fotografías** opcionales del galpón
4. Dashboard con **gráficas de producción** histórica
5. **Notificaciones push** cuando mortalidad > 2%
