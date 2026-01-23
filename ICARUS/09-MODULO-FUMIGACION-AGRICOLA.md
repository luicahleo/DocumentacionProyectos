# Módulo: Control de Fumigaciones Agrícolas

## Resumen Ejecutivo

Módulo para gestionar fumigaciones y aplicaciones fitosanitarias en cultivos agrícolas (arroz, soya, maíz, etc.), integrando planificación, ejecución, trazabilidad y análisis de eficacia.

---

## Entidades del Dominio

### 1. Campo (Terreno Agrícola)

```csharp
namespace ICARUS.Domain.Entities.Agricultura
{
    /// <summary>
    /// Representa un campo o terreno de cultivo
    /// </summary>
    public class Campo : BaseEntity
    {
        public int PropietarioId { get; set; }
        
        public string Nombre { get; set; }
        
        public string CodigoInterno { get; set; }
        
        public decimal AreaHectareas { get; set; }
        
        public string Ubicacion { get; set; }
        
        public decimal? Latitud { get; set; }
        
        public decimal? Longitud { get; set; }
        
        public TipoCultivo TipoCultivoActual { get; set; }
        
        public DateTime? FechaSiembra { get; set; }
        
        public DateTime? FechaCosechaEstimada { get; set; }
        
        public EstadoCampo Estado { get; set; }
        
        public string Observaciones { get; set; }
        
        // Relaciones
        public Cliente Propietario { get; set; }
        public ICollection<RegistroFumigacion> HistorialFumigaciones { get; set; }
        public ICollection<ProgramaFitosanitario> ProgramasFitosanitarios { get; set; }
    }
    
    public enum TipoCultivo
    {
        Arroz = 0,
        Soya = 1,
        Maiz = 2,
        Trigo = 3,
        Sorgo = 4,
        Otro = 99
    }
    
    public enum EstadoCampo
    {
        Barbecho = 0,      // Sin cultivo
        Sembrado = 1,      // Con cultivo activo
        EnCosecha = 2,     // En proceso de cosecha
        Cosechado = 3,     // Cosechado, esperando nueva siembra
        EnDescanso = 4     // Descanso del suelo
    }
}
```

---

### 2. Producto Fitosanitario

```csharp
namespace ICARUS.Domain.Entities.Agricultura
{
    /// <summary>
    /// Representa un producto químico para fumigación (herbicida, insecticida, fungicida)
    /// </summary>
    public class ProductoFitosanitario : BaseEntity
    {
        public string NombreComercial { get; set; }
        
        public string NombreTecnico { get; set; }
        
        public string IngredienteActivo { get; set; }
        
        public TipoProductoFitosanitario Tipo { get; set; }
        
        public string Fabricante { get; set; }
        
        public string NumeroRegistroSanitario { get; set; }
        
        public string UnidadMedida { get; set; } // Litro, Kg, Gramos
        
        public decimal DosisMinima { get; set; }
        
        public decimal DosisMaxima { get; set; }
        
        public int PeriodoCarencia { get; set; } // Días antes de cosecha
        
        public int IntervaloReingreso { get; set; } // Horas antes de reingresar al campo
        
        public NivelToxicidad NivelToxicidad { get; set; }
        
        public string FichaTecnica { get; set; } // URL o ruta del PDF
        
        public bool RequiereRecetaAgronomica { get; set; }
        
        public string Observaciones { get; set; }
        
        // Relaciones
        public ICollection<ProductoFitosanitarioPlagaObjetivo> PlagasObjetivo { get; set; }
    }
    
    public enum TipoProductoFitosanitario
    {
        Herbicida = 0,
        Insecticida = 1,
        Fungicida = 2,
        Acaricida = 3,
        Nematicida = 4,
        Rodenticida = 5,
        Coadyuvante = 6, // Mejora eficacia de otros productos
        Bioestimulante = 7
    }
    
    public enum NivelToxicidad
    {
        Ia = 0,  // Extremadamente peligroso (rojo)
        Ib = 1,  // Altamente peligroso (rojo)
        II = 2,  // Moderadamente peligroso (amarillo)
        III = 3, // Ligeramente peligroso (azul)
        U = 4    // Improbable que presente peligro (verde)
    }
}
```

---

### 3. Plaga/Enfermedad Objetivo

```csharp
namespace ICARUS.Domain.Entities.Agricultura
{
    /// <summary>
    /// Representa una plaga, maleza o enfermedad que se combate con fumigación
    /// </summary>
    public class PlagaObjetivo : BaseEntity
    {
        public string NombreComun { get; set; }
        
        public string NombreCientifico { get; set; }
        
        public TipoPlaga Tipo { get; set; }
        
        public string Descripcion { get; set; }
        
        public string Sintomas { get; set; }
        
        public NivelRiesgo NivelRiesgo { get; set; }
        
        // Relaciones
        public ICollection<ProductoFitosanitarioPlagaObjetivo> ProductosEfectivos { get; set; }
    }
    
    public enum TipoPlaga
    {
        Maleza = 0,
        Insecto = 1,
        Hongo = 2,
        Bacteria = 3,
        Virus = 4,
        Acaro = 5,
        Nematodo = 6,
        Roedor = 7
    }
    
    public enum NivelRiesgo
    {
        Bajo = 0,
        Medio = 1,
        Alto = 2,
        Critico = 3
    }
}
```

---

### 4. Programa Fitosanitario

```csharp
namespace ICARUS.Domain.Entities.Agricultura
{
    /// <summary>
    /// Plan de fumigaciones programadas para un campo durante el ciclo de cultivo
    /// </summary>
    public class ProgramaFitosanitario : BaseEntity
    {
        public int CampoId { get; set; }
        
        public string Nombre { get; set; }
        
        public int CicloSiembra { get; set; } // Año o número de ciclo
        
        public DateTime FechaInicio { get; set; }
        
        public DateTime FechaFin { get; set; }
        
        public string ResponsableAgronomoId { get; set; }
        
        public bool Aprobado { get; set; }
        
        public DateTime? FechaAprobacion { get; set; }
        
        public string AprobadoPor { get; set; }
        
        public string Observaciones { get; set; }
        
        // Relaciones
        public Campo Campo { get; set; }
        public TrabajadorAcceso ResponsableAgronomo { get; set; }
        public ICollection<AplicacionProgramada> AplicacionesProgramadas { get; set; }
    }
}
```

---

### 5. Aplicación Programada

```csharp
namespace ICARUS.Domain.Entities.Agricultura
{
    /// <summary>
    /// Fumigación programada dentro de un programa fitosanitario
    /// </summary>
    public class AplicacionProgramada : BaseEntity
    {
        public int ProgramaFitosanitarioId { get; set; }
        
        public string Descripcion { get; set; }
        
        public DateTime FechaProgramada { get; set; }
        
        public int DiasDespuesSiembra { get; set; }
        
        public int ProductoFitosanitarioId { get; set; }
        
        public decimal DosisRecomendada { get; set; }
        
        public string UnidadDosis { get; set; } // L/ha, Kg/ha, g/L
        
        public decimal VolumenCaldo { get; set; } // Litros de agua/ha
        
        public MetodoAplicacion MetodoAplicacion { get; set; }
        
        public string EquipoRecomendado { get; set; }
        
        public int PlagaObjetivoId { get; set; }
        
        public string Justificacion { get; set; }
        
        public EstadoAplicacion Estado { get; set; }
        
        // Relaciones
        public ProgramaFitosanitario ProgramaFitosanitario { get; set; }
        public ProductoFitosanitario ProductoFitosanitario { get; set; }
        public PlagaObjetivo PlagaObjetivo { get; set; }
        public RegistroFumigacion RegistroFumigacionReal { get; set; }
    }
    
    public enum MetodoAplicacion
    {
        AspersionTerrestre = 0,    // Fumigadora terrestre
        AspersionAerea = 1,         // Avioneta/Dron
        EspolvoreoTerrestre = 2,
        EspolvoreoAereo = 3,
        Inyeccion = 4,              // Al suelo
        Goteo = 5,                  // Sistema de riego
        Manual = 6                  // Mochila
    }
    
    public enum EstadoAplicacion
    {
        Pendiente = 0,
        EnProceso = 1,
        Completada = 2,
        Cancelada = 3,
        Reprogramada = 4
    }
}
```

---

### 6. Registro de Fumigación (Ejecución Real)

```csharp
namespace ICARUS.Domain.Entities.Agricultura
{
    /// <summary>
    /// Registro de fumigación realmente ejecutada en campo
    /// Similar a RegistroProduccionDiario en avicultura
    /// </summary>
    public class RegistroFumigacion : BaseEntity
    {
        public int CampoId { get; set; }
        
        public int? AplicacionProgramadaId { get; set; }
        
        public DateTime FechaAplicacion { get; set; }
        
        public TimeSpan HoraInicio { get; set; }
        
        public TimeSpan HoraFin { get; set; }
        
        public int ProductoFitosanitarioId { get; set; }
        
        public decimal DosisAplicada { get; set; }
        
        public string UnidadDosis { get; set; }
        
        public decimal VolumenCaldoAplicado { get; set; }
        
        public decimal AreaTratadaHectareas { get; set; }
        
        public MetodoAplicacion MetodoAplicacion { get; set; }
        
        public string EquipoUtilizado { get; set; }
        
        public string OperadorId { get; set; }
        
        public string SupervisorId { get; set; }
        
        // Condiciones climáticas (críticas para fumigación)
        public decimal? TemperaturaCelsius { get; set; }
        
        public decimal? HumedadRelativa { get; set; }
        
        public decimal? VelocidadVientoKmH { get; set; }
        
        public string DireccionViento { get; set; }
        
        public bool LluviaEnUltimas24H { get; set; }
        
        public bool CondicionesOptimas { get; set; }
        
        // Trazabilidad
        public string NumeroLoteProducto { get; set; }
        
        public DateTime? FechaVencimientoProducto { get; set; }
        
        public decimal CostoAplicacion { get; set; }
        
        public string Observaciones { get; set; }
        
        public string FotosEvidencia { get; set; } // JSON array de URLs
        
        // Relaciones
        public Campo Campo { get; set; }
        public AplicacionProgramada AplicacionProgramada { get; set; }
        public ProductoFitosanitario ProductoFitosanitario { get; set; }
        public TrabajadorAcceso Operador { get; set; }
        public TrabajadorAcceso Supervisor { get; set; }
        public ICollection<EvaluacionEficacia> EvaluacionesEficacia { get; set; }
    }
}
```

---

### 7. Evaluación de Eficacia

```csharp
namespace ICARUS.Domain.Entities.Agricultura
{
    /// <summary>
    /// Evaluación post-aplicación para medir eficacia de la fumigación
    /// </summary>
    public class EvaluacionEficacia : BaseEntity
    {
        public int RegistroFumigacionId { get; set; }
        
        public DateTime FechaEvaluacion { get; set; }
        
        public int DiasPostAplicacion { get; set; }
        
        public string EvaluadorId { get; set; }
        
        public NivelControl NivelControl { get; set; }
        
        public decimal? PorcentajeControlPlagas { get; set; }
        
        public bool RequiereReaplicacion { get; set; }
        
        public bool HuboFitotoxicidad { get; set; }
        
        public string DescripcionFitotoxicidad { get; set; }
        
        public string Observaciones { get; set; }
        
        public string FotosEvaluacion { get; set; }
        
        // Relaciones
        public RegistroFumigacion RegistroFumigacion { get; set; }
        public TrabajadorAcceso Evaluador { get; set; }
    }
    
    public enum NivelControl
    {
        Nulo = 0,          // 0-25%
        Insuficiente = 1,  // 26-50%
        Aceptable = 2,     // 51-75%
        Bueno = 3,         // 76-90%
        Excelente = 4      // 91-100%
    }
}
```

---

## Diagrama de Relaciones (ER)

```
┌──────────────┐
│   Cliente    │
└──────┬───────┘
       │ 1:N
       ▼
┌──────────────────────┐
│      Campo           │
│ - AreaHectareas      │
│ - TipoCultivo        │
│ - FechaSiembra       │
└──────┬───────────────┘
       │ 1:N
       ▼
┌───────────────────────────────┐
│  ProgramaFitosanitario        │
│  - CicloSiembra               │
│  - ResponsableAgronomoId      │
└──────┬────────────────────────┘
       │ 1:N
       ▼
┌────────────────────────────────────┐
│    AplicacionProgramada            │
│    - FechaProgramada               │
│    - DosisRecomendada              │
│    - DiasDespuesSiembra            │
└──────┬──────┬──────────────────────┘
       │      │
       │ 1:1  │ N:1
       │      ▼
       │  ┌──────────────────────────┐
       │  │ ProductoFitosanitario    │
       │  │ - IngredienteActivo      │
       │  │ - NivelToxicidad         │
       │  │ - PeriodoCarencia        │
       │  └──────┬───────────────────┘
       │         │ N:N
       │         ▼
       │  ┌──────────────────────────┐
       │  │    PlagaObjetivo         │
       │  │    - NombreCientifico    │
       │  │    - NivelRiesgo         │
       │  └──────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│    RegistroFumigacion              │
│    - FechaAplicacion               │
│    - DosisAplicada                 │
│    - TemperaturaCelsius            │
│    - VelocidadVientoKmH            │
│    - CondicionesOptimas            │
└──────┬─────────────────────────────┘
       │ 1:N
       ▼
┌────────────────────────────────────┐
│    EvaluacionEficacia              │
│    - DiasPostAplicacion            │
│    - PorcentajeControlPlagas       │
│    - RequiereReaplicacion          │
└────────────────────────────────────┘
```

---

## Commands y Queries (CQRS)

### Commands

```csharp
// 1. Gestión de Campos
CreateCampoCommand
UpdateCampoCommand
DeleteCampoCommand
IniciarCicloSiembraCommand

// 2. Gestión de Productos
CreateProductoFitosanitarioCommand
UpdateProductoFitosanitarioCommand
AssignPlagaObjetivoToProductoCommand

// 3. Programa Fitosanitario
CreateProgramaFitosanitarioCommand
UpdateProgramaFitosanitarioCommand
AprobarProgramaFitosanitarioCommand
AddAplicacionProgramadaCommand
CancelAplicacionProgramadaCommand
ReprogramarAplicacionCommand

// 4. Ejecución de Fumigación
CreateRegistroFumigacionCommand
UpdateRegistroFumigacionCommand
ValidarCondicionesClimaticasCommand
CompletarFumigacionCommand

// 5. Evaluación de Eficacia
CreateEvaluacionEficaciaCommand
UpdateEvaluacionEficaciaCommand
SolicitarReaplicacionCommand
```

### Queries

```csharp
// Campos
GetCamposByClienteIdQuery
GetCampoByIdQuery
GetCamposActivosQuery

// Productos
GetProductosFitosanitariosByTipoQuery
GetProductosByPlagaObjetivoQuery
GetProductoByIdQuery

// Programas
GetProgramasFitosanitariosByCampoQuery
GetAplicacionesPendientesQuery
GetAplicacionesPorFechaQuery

// Registros
GetHistorialFumigacionesByCampoQuery
GetRegistrosFumigacionByPeriodoQuery
GetRegistrosConEvaluacionPendienteQuery

// Analytics
GetEstadisticasEficaciaByProductoQuery
GetCostosAplicacionByPeriodoQuery
GetAlertasCondicionesClimaticasQuery
```

---

## Reglas de Negocio Críticas

### 1. Validación de Condiciones Climáticas

```csharp
public class ValidarCondicionesClimaticasCommandHandler
{
    public async Task<OperationResult> Handle(ValidarCondicionesClimaticasCommand request)
    {
        List<string> alertas = new();
        
        // Temperatura óptima: 10-30°C
        if (request.TemperaturaCelsius < 10 || request.TemperaturaCelsius > 30)
        {
            alertas.Add("Temperatura fuera del rango óptimo (10-30°C)");
        }
        
        // Humedad relativa: 50-80%
        if (request.HumedadRelativa < 50 || request.HumedadRelativa > 80)
        {
            alertas.Add("Humedad relativa no recomendada");
        }
        
        // Viento máximo: 10 km/h
        if (request.VelocidadVientoKmH > 10)
        {
            alertas.Add("Viento excesivo (>10 km/h). Riesgo de deriva");
        }
        
        // No fumigar si llovió en últimas 24h
        if (request.LluviaEnUltimas24H)
        {
            alertas.Add("Lluvia reciente. Esperar suelo seco");
        }
        
        bool condicionesOptimas = alertas.Count == 0;
        
        return OperationResult.Success(new 
        { 
            CondicionesOptimas = condicionesOptimas,
            Alertas = alertas,
            Recomendacion = condicionesOptimas 
                ? "Condiciones aptas para aplicación" 
                : "Se recomienda posponer aplicación"
        });
    }
}
```

### 2. Validación de Periodo de Carencia

```csharp
public async Task<OperationResult> ValidarPeriodoCarenciaAsync(int campoId)
{
    Campo campo = await _campoRepository.GetByIdAsync(campoId);
    
    if (campo.FechaCosechaEstimada == null)
    {
        return OperationResult.Warning("No hay fecha de cosecha estimada");
    }
    
    List<RegistroFumigacion> ultimasFumigaciones = await _registroRepository
        .GetUltimasFumigacionesByCampoAsync(campoId, limite: 5);
    
    foreach (RegistroFumigacion fumigacion in ultimasFumigaciones)
    {
        ProductoFitosanitario producto = fumigacion.ProductoFitosanitario;
        
        int diasTranscurridos = (DateTime.Today - fumigacion.FechaAplicacion.Date).Days;
        int diasFaltantes = producto.PeriodoCarencia - diasTranscurridos;
        
        if (diasFaltantes > 0)
        {
            DateTime fechaMinimaCosecha = fumigacion.FechaAplicacion.AddDays(producto.PeriodoCarencia);
            
            if (campo.FechaCosechaEstimada < fechaMinimaCosecha)
            {
                return OperationResult.Failure(
                    $"No se puede cosechar antes de {fechaMinimaCosecha:dd/MM/yyyy}. " +
                    $"Producto {producto.NombreComercial} requiere {producto.PeriodoCarencia} días de carencia. " +
                    $"Faltan {diasFaltantes} días."
                );
            }
        }
    }
    
    return OperationResult.Success("Periodo de carencia cumplido");
}
```

### 3. Cálculo de Dosis por Hectárea

```csharp
public class CalcularDosisCommand : IRequest<OperationResult<DosisCalculadaDto>>
{
    public int ProductoFitosanitarioId { get; set; }
    public decimal AreaHectareas { get; set; }
    public decimal DosisDeseadaLitrosHa { get; set; }
}

public class CalcularDosisCommandHandler
{
    public async Task<OperationResult<DosisCalculadaDto>> Handle(CalcularDosisCommand request)
    {
        ProductoFitosanitario producto = await _repository.GetByIdAsync(request.ProductoFitosanitarioId);
        
        // Validar dosis dentro de rango permitido
        if (request.DosisDeseadaLitrosHa < producto.DosisMinima || 
            request.DosisDeseadaLitrosHa > producto.DosisMaxima)
        {
            return OperationResult.Failure(
                $"Dosis debe estar entre {producto.DosisMinima} y {producto.DosisMaxima} {producto.UnidadMedida}/ha"
            );
        }
        
        decimal cantidadTotalProducto = request.DosisDeseadaLitrosHa * request.AreaHectareas;
        decimal volumenCaldoTotal = 200 * request.AreaHectareas; // 200 L/ha estándar
        
        return OperationResult.Success(new DosisCalculadaDto
        {
            ProductoNombre = producto.NombreComercial,
            AreaHectareas = request.AreaHectareas,
            DosisUnitaria = request.DosisDeseadaLitrosHa,
            CantidadTotalProducto = cantidadTotalProducto,
            UnidadMedida = producto.UnidadMedida,
            VolumenCaldoTotal = volumenCaldoTotal,
            ConcentracionCaldo = (cantidadTotalProducto / volumenCaldoTotal) * 100 // Porcentaje
        });
    }
}
```

---

## Flujos de Negocio End-to-End

### Flujo 1: Crear Programa Fitosanitario

```
Web: ProgramaFitosanitarioController.Crear()
  │ 1. Seleccionar Campo
  │ 2. Definir ciclo de siembra
  │ 3. Agregar aplicaciones programadas:
  │    - Días 7: Herbicida pre-emergente
  │    - Días 20: Insecticida sistémico
  │    - Días 35: Fungicida preventivo
  │    - Días 50: Herbicida post-emergente
  │ 4. Asignar responsable agrónomo
  ▼
Controller: CreateProgramaFitosanitarioCommand
  ▼
Handler: Validar fechas, crear programa + aplicaciones
  ▼
DB: INSERT ProgramaFitosanitario + AplicacionProgramada (batch)
```

### Flujo 2: Ejecutar Fumigación desde Mobile

```
Mobile: RegistroFumigacionPage
  │ 1. Seleccionar campo
  │ 2. Seleccionar aplicación programada (si existe)
  │ 3. Ingresar datos climáticos:
  │    - Temperatura: 25°C
  │    - Humedad: 65%
  │    - Viento: 5 km/h
  │ 4. Sistema valida condiciones ✅
  │ 5. Confirmar producto y dosis
  │ 6. Tomar foto del equipo y lote
  │ 7. Guardar registro
  ▼
API: POST /api/mobile/fumigacion
  ▼
Handler: CreateRegistroFumigacionCommand
  │ Validar condiciones climáticas
  │ Validar dosis dentro de rango
  │ Verificar periodo de reingreso
  ▼
DB: INSERT RegistroFumigacion
  │ UPDATE AplicacionProgramada.Estado = Completada
  ▼
Mobile: Confirmación + Alertas de seguridad
```

---

## Integraciones Externas

### 1. APIs Climáticas

```csharp
public interface IServicioClimatico
{
    Task<CondicionesClimaticas> GetCondicionesActualesAsync(decimal latitud, decimal longitud);
    Task<PronosticoClima> GetPronostico7DiasAsync(decimal latitud, decimal longitud);
    Task<bool> ValidarCondicionesOptimas Async(CondicionesClimaticas condiciones);
}

// Implementación con OpenWeatherMap API
public class OpenWeatherMapService : IServicioClimatico
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    
    public async Task<CondicionesClimaticas> GetCondicionesActualesAsync(decimal latitud, decimal longitud)
    {
        string url = $"https://api.openweathermap.org/data/2.5/weather?lat={latitud}&lon={longitud}&appid={_apiKey}&units=metric";
        
        HttpResponseMessage response = await _httpClient.GetAsync(url);
        // Parse response...
    }
}
```

### 2. Drones de Fumigación

```csharp
public interface IDroneFumigacionService
{
    Task<bool> ValidarDisponibilidadDronAsync(DateTime fecha);
    Task<PlanVueloDto> GenerarPlanVueloAsync(Campo campo, decimal dosis);
    Task<string> EnviarOrdenFumigacionAsync(RegistroFumigacion registro);
    Task<ReporteDronDto> GetReporteVueloAsync(string ordenId);
}
```

### 3. Laboratorios de Análisis de Residuos

```csharp
public interface ILaboratorioAnalisisService
{
    Task<string> SolicitarAnalisisResiduosAsync(int campoId, DateTime fechaMuestra);
    Task<ResultadoAnalisisDto> GetResultadoAnalisisAsync(string solicitudId);
}
```

---

## KPIs y Reportes

### Dashboards Clave

1. **Dashboard Operacional**
   - Aplicaciones pendientes hoy/semana
   - Condiciones climáticas actuales
   - Alertas de periodo de carencia
   - Campos próximos a cosechar

2. **Dashboard Económico**
   - Costo por hectárea fumigada
   - Consumo de productos fitosanitarios
   - Análisis costo-beneficio por producto
   - Comparativa de eficacia vs costo

3. **Dashboard Ambiental**
   - Uso de productos alta toxicidad
   - Cumplimiento periodos de reingreso
   - Trazabilidad completa de aplicaciones
   - Análisis de deriva de productos

4. **Dashboard Agronómico**
   - Eficacia promedio por producto
   - Plagas/enfermedades más frecuentes
   - Análisis de reincidencia de plagas
   - Recomendaciones de rotación de productos

---

## Regulaciones y Compliance

### Trazabilidad Obligatoria

- **Número de lote del producto**
- **Fecha de vencimiento**
- **Operador y supervisor responsables**
- **Condiciones climáticas al momento de aplicación**
- **Evidencia fotográfica**
- **Certificado de capacitación del operador**

### Reportes Regulatorios

- **Libro de Campo Digital** (SENASA/SAG/ICA)
- **Uso de agroquímicos por periodo**
- **Análisis de residuos pre-cosecha**
- **Declaración de uso de productos restringidos**

---

## Alertas y Notificaciones

### Alertas Críticas (Push Notification)

- ⚠️ "Condiciones climáticas NO aptas para fumigación"
- 🔴 "Campo X no puede cosecharse: periodo de carencia activo"
- ⏰ "Aplicación programada vence mañana (Campo Y - Herbicida)"
- 💰 "Stock de producto Z bajo (2 aplicaciones restantes)"

### Alertas de Seguridad

- 🚨 "Producto Alta Toxicidad aplicado: respetar 48h reingreso"
- 📋 "Operador sin certificación vigente para producto IA"
- 🌡️ "Temperatura >30°C: riesgo de fitotoxicidad"

---

## Conclusión

**El Módulo de Fumigaciones Agrícolas** convierte a ICARUS en un **ERP Agroindustrial Multi-Vertical**, con capacidad de expandirse a:

- ✅ Avicultura (actual)
- ✅ Agricultura (fumigaciones - diseñado)
- 🔄 Ganadería (futuro)
- 🔄 Acuicultura (futuro)

**Ventaja Competitiva**: Mobile-first + Trazabilidad + Inteligencia Climática + Cumplimiento Regulatorio

---

**Próximo paso**: Implementar entidades en ICARUS.Domain y comenzar development sprint.
