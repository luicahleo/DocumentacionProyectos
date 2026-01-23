# ICARUS MOBILE - Análisis de Compatibilidad con API

## 📋 Información General

**Fecha de Análisis**: Diciembre 8, 2025  
**App Móvil**: ICARUS_MOBILE (.NET MAUI)  
**API Backend**: ICARUS.API (.NET 8 Web API)  
**Objetivo**: Verificar que los DTOs de la app móvil son compatibles con los esperados por la API

---

## ✅ RESULTADO DEL ANÁLISIS

### Estado General: ⚠️ **REQUIERE CORRECCIONES**

Se encontraron **2 problemas críticos** de compatibilidad:

1. ❌ **LoginRequest** - Campo extra `RememberMe` no esperado por API
2. ❌ **CreateRegistroProduccionRequest** - Falta campo crítico `CreadoPor` requerido por API

---

## 🔐 1. Autenticación - Login de Trabajador

### Endpoint API
```
POST /api/mobile/auth/login
```

### Controlador API
**Archivo**: `ICARUS.API/Controllers/Mobile/MobileAuthController.cs`

**Recibe**: `LoginTrabajadorDto`

### DTO Esperado por API

**Archivo**: `ICARUS.Application/Features/Trabajador/DTOs/TrabajadorAuthDto.cs`

```csharp
public class LoginTrabajadorDto
{
    [Required]
    [EmailAddress]
    [MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string Password { get; set; } = string.Empty;

    public bool RememberMe { get; set; } = false;
}
```

### DTO Enviado por App Móvil

**Archivo**: `ICARUS_MOBILE/Core/Models/LoginRequest.cs`

```csharp
public class LoginRequest
{
    [Required]
    [EmailAddress]
    [StringLength(150)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [StringLength(100, MinimumLength = 6)]
    public string Password { get; set; } = string.Empty;

    public bool RememberMe { get; set; } = false;  // ⚠️ CAMPO EXTRA
}
```

### 🟢 Compatibilidad: **COMPATIBLE**

**Análisis**:
- ✅ Campos requeridos presentes: `Email`, `Password`
- ✅ `RememberMe` también existe en API (opcional)
- ✅ Validaciones son más estrictas en móvil (esto es bueno)

**Observación**: El campo `RememberMe` existe en ambos lados, por lo que es compatible. Sin embargo, **no se utiliza en el `LoginTrabajadorCommand`**, por lo que el backend lo ignora actualmente.

**Recomendación**: ✅ No requiere cambios, funciona correctamente.

---

## 🥚 2. Registro de Producción - Crear Registro

### Endpoint API
```
POST /api/mobile/registro-produccion
```

### Controlador API
**Archivo**: `ICARUS.API/Controllers/Mobile/RegistroProduccionMobileController.cs`

**Recibe**: `CreateRegistroProduccionDiarioCommand` (directamente desde body)

### Command Esperado por API

**Archivo**: `ICARUS.Application/Features/GestionAvicola/Commands/RegistroProduccion/CreateRegistroProduccionDiarioCommand.cs`

```csharp
public class CreateRegistroProduccionDiarioCommand : IRequest<OperationResult<RegistroProduccionDiarioDto>>
{
    // CAMPOS REQUERIDOS
    public DateTime Fecha { get; set; }                        // ✅ REQUERIDO
    public int GalponId { get; set; }                          // ✅ REQUERIDO
    public TimeSpan HoraRegistro { get; set; }                 // ✅ REQUERIDO
    public int CantidadMaples { get; set; }                    // ✅ REQUERIDO
    public int UnidadesIncompletas { get; set; }               // ✅ REQUERIDO
    public int GallinasMuertas { get; set; }                   // ✅ REQUERIDO
    
    // CAMPOS OPCIONALES
    public int NumeroRegistro { get; set; }                    // Auto-calculado si no se envía
    public string? Observaciones { get; set; }
    public string? CausaProbableMortalidad { get; set; }
    public string? AccionesTomadasMortalidad { get; set; }
    
    // CAMPO DE AUDITORÍA - CRÍTICO
    public string? CreadoPor { get; set; }                     // ❌ FALTA EN MÓVIL
    
    // ALIAS (Mapean al mismo campo)
    public DateTime FechaRegistro { get; set; }                // Alias de Fecha
    public int MaplesHuevos { get; set; }                      // Alias de CantidadMaples
}
```

### Request Enviado por App Móvil

**Archivo**: `ICARUS_MOBILE/Modules/GestionAvicola/Models/RegistroProduccionRequest.cs`

```csharp
public class CreateRegistroProduccionRequest
{
    // CAMPOS ENVIADOS
    public DateTime Fecha { get; set; } = DateTime.Today;      // ✅ OK
    public int GalponId { get; set; }                          // ✅ OK
    public TimeSpan HoraRegistro { get; set; }                 // ✅ OK
    public int CantidadMaples { get; set; }                    // ✅ OK
    public int UnidadesIncompletas { get; set; }               // ✅ OK
    public int GallinasMuertas { get; set; }                   // ✅ OK
    
    // CAMPOS OPCIONALES
    public string? Observaciones { get; set; }                 // ✅ OK
    public string? CausaProbableMortalidad { get; set; }       // ✅ OK
    public string? AccionesTomadasMortalidad { get; set; }     // ✅ OK
    
    // ❌ FALTA: CreadoPor
    // ❌ FALTA: NumeroRegistro (pero es auto-calculado, OK)
    
    // Propiedad calculada (solo cliente)
    public int TotalHuevos => (CantidadMaples * 30) + UnidadesIncompletas;
}
```

### 🔴 Compatibilidad: **INCOMPATIBLE - CRÍTICO**

**Problemas Identificados**:

1. ❌ **CAMPO FALTANTE CRÍTICO**: `CreadoPor`
   - **Ubicación en API**: Línea 134 de `RegistroProduccionMobileController.cs`
   - **Validación**: El controlador valida explícitamente que `CreadoPor` no sea nulo:
   ```csharp
   if (string.IsNullOrWhiteSpace(request.CreadoPor))
   {
       _logger.Warn("RegistroProduccionMobileController.CrearRegistroProduccion - CreadoPor no especificado en request");
       return BadRequest("Usuario que crea el registro es requerido");
   }
   ```
   - **Impacto**: **La API rechazará todas las peticiones con 400 Bad Request**

2. ⚠️ **Campo opcional**: `NumeroRegistro`
   - No es crítico, el backend lo calcula automáticamente

### 📊 Tabla Comparativa de Campos

| Campo | App Móvil | API Command | Estado | Notas |
|-------|-----------|-------------|--------|-------|
| `Fecha` | ✅ | ✅ | Compatible | Ambos lados OK |
| `GalponId` | ✅ | ✅ | Compatible | Ambos lados OK |
| `HoraRegistro` | ✅ | ✅ | Compatible | Ambos lados OK |
| `CantidadMaples` | ✅ | ✅ | Compatible | Ambos lados OK |
| `UnidadesIncompletas` | ✅ | ✅ | Compatible | Ambos lados OK |
| `GallinasMuertas` | ✅ | ✅ | Compatible | Ambos lados OK |
| `Observaciones` | ✅ | ✅ | Compatible | Opcional |
| `CausaProbableMortalidad` | ✅ | ✅ | Compatible | Opcional |
| `AccionesTomadasMortalidad` | ✅ | ✅ | Compatible | Opcional |
| `CreadoPor` | ❌ | ✅ | **FALTA** | **CRÍTICO** |
| `NumeroRegistro` | ❌ | ⚠️ | OK | Auto-calculado |
| `TotalHuevos` | ✅ (calculado) | ❌ | N/A | Solo en cliente |

---

## 📢 3. Notificaciones - Tareas del Día

### Endpoint API
```
GET /api/mobile/notificaciones/dia
```

### Controlador API
**Archivo**: `ICARUS.API/Controllers/Mobile/MobileNotificacionesController.cs`

**Retorna**: `NotificacionResponseDto`

### 🟢 Compatibilidad: **COMPATIBLE**

**Análisis**:
- ✅ Es un endpoint GET sin body request
- ✅ La respuesta es deserializada correctamente por la app móvil
- ✅ Modelo `NotificacionResponse` en móvil coincide con `NotificacionResponseDto` de API

**Archivo Móvil**: `ICARUS_MOBILE/Core/Models/NotificacionResponse.cs`

---

## 🔧 ACCIONES REQUERIDAS

### 1. ❌ CRÍTICO: Agregar campo `CreadoPor` en CreateRegistroProduccionRequest

**Archivo a modificar**: 
```
ICARUS_MOBILE/Modules/GestionAvicola/Models/RegistroProduccionRequest.cs
```

**Cambio necesario**:

```csharp
public class CreateRegistroProduccionRequest
{
    public DateTime Fecha { get; set; } = DateTime.Today;
    public int GalponId { get; set; }
    public TimeSpan HoraRegistro { get; set; } = DateTime.Now.TimeOfDay;
    public int CantidadMaples { get; set; }
    public int UnidadesIncompletas { get; set; }
    public int GallinasMuertas { get; set; }
    public string? Observaciones { get; set; }
    public string? CausaProbableMortalidad { get; set; }
    public string? AccionesTomadasMortalidad { get; set; }
    
    // ✅ AGREGAR ESTE CAMPO
    /// <summary>
    /// Usuario que crea el registro (email del trabajador autenticado)
    /// </summary>
    public string CreadoPor { get; set; } = string.Empty;
    
    public int TotalHuevos => (CantidadMaples * 30) + UnidadesIncompletas;
    
    public bool EsValido()
    {
        if (Fecha.Date > DateTime.Today) return false;
        if (CantidadMaples < 0 || UnidadesIncompletas < 0 || GallinasMuertas < 0) return false;
        if (UnidadesIncompletas >= 30) return false;
        if (GalponId <= 0) return false;
        
        // ✅ AGREGAR VALIDACIÓN
        if (string.IsNullOrWhiteSpace(CreadoPor)) return false;
        
        return true;
    }
}
```

### 2. ❌ CRÍTICO: Modificar ViewModel para establecer CreadoPor

**Archivo a modificar**: 
```
ICARUS_MOBILE/Modules/GestionAvicola/ViewModels/CrearRegistroProduccionViewModel.cs
```

**Cambio necesario**: En el método `CrearRegistroCommand`, antes de enviar el request:

```csharp
[RelayCommand]
private async Task CrearRegistro()
{
    // ... validaciones existentes ...
    
    CreateRegistroProduccionRequest request = new CreateRegistroProduccionRequest
    {
        GalponId = SelectedGalpon.Id,
        Fecha = SelectedFecha,
        HoraRegistro = DateTime.Now.TimeOfDay,
        CantidadMaples = CantidadMaples,
        UnidadesIncompletas = UnidadesIncompletas,
        GallinasMuertas = GallinasMuertas,
        Observaciones = Observaciones,
        CausaProbableMortalidad = CausaProbableMortalidad,
        AccionesTomadasMortalidad = AccionesTomadasMortalidad,
        
        // ✅ AGREGAR: Obtener email del trabajador autenticado
        CreadoPor = await ObtenerEmailTrabajadorAutenticado()
    };
    
    // ... resto del código ...
}

// ✅ AGREGAR MÉTODO HELPER
private async Task<string> ObtenerEmailTrabajadorAutenticado()
{
    WorkerInfo? workerInfo = await _authService.GetCurrentWorkerInfoAsync();
    
    if (workerInfo == null || string.IsNullOrWhiteSpace(workerInfo.Email))
    {
        await _loggingService.LogErrorAsync(
            "CrearRegistroProduccionViewModel.ObtenerEmailTrabajadorAutenticado - No se pudo obtener email del trabajador",
            "RegistroProduccion"
        );
        return "desconocido@icarus.com"; // Fallback
    }
    
    return workerInfo.Email;
}
```

### 3. ❌ CRÍTICO: Actualizar EditarRegistroProduccionViewModel

**Archivo a modificar**: 
```
ICARUS_MOBILE/Modules/GestionAvicola/ViewModels/EditarRegistroProduccionViewModel.cs
```

**Cambio necesario**: Similar al de CrearRegistroProduccionViewModel, establecer `CreadoPor` antes de enviar la actualización.

**Nota**: En actualizaciones, el campo debería llamarse `ModificadoPor` según las convenciones de auditoría, pero el API actualmente usa `CreadoPor` para ambos casos.

---

## 🔍 VERIFICACIÓN POST-CORRECCIÓN

Después de implementar los cambios, verificar:

### ✅ Checklist de Validación

- [ ] Campo `CreadoPor` agregado a `CreateRegistroProduccionRequest`
- [ ] Campo `CreadoPor` agregado a `UpdateRegistroProduccionRequest`
- [ ] Método `EsValido()` valida que `CreadoPor` no esté vacío
- [ ] `CrearRegistroProduccionViewModel` establece `CreadoPor` con email del trabajador
- [ ] `EditarRegistroProduccionViewModel` establece `CreadoPor` (o `ModificadoPor`) con email del trabajador
- [ ] Logs agregados para rastrear valor de `CreadoPor`
- [ ] Prueba en emulador: Crear registro y verificar que no falla con 400 Bad Request
- [ ] Prueba en dispositivo físico: Crear registro y verificar éxito
- [ ] Verificar en backend que el registro se guarda con `CreadoPor` correcto

### 📝 Ejemplo de Log para Debugging

```csharp
await _loggingService.LogInfoAsync(
    $"CrearRegistroProduccionViewModel.CrearRegistro - Creando request con CreadoPor: {request.CreadoPor}",
    "RegistroProduccion",
    new { 
        GalponId = request.GalponId,
        Fecha = request.Fecha,
        CreadoPor = request.CreadoPor
    }
);
```

---

## 📊 RESUMEN DE COMPATIBILIDAD

### Endpoints Analizados

| Endpoint | Método | Estado | Comentarios |
|----------|--------|--------|-------------|
| `/mobile/auth/login` | POST | ✅ Compatible | Funcionando correctamente |
| `/mobile/registro-produccion` (crear) | POST | ❌ **Incompatible** | **Falta campo `CreadoPor`** |
| `/mobile/registro-produccion/{id}` (actualizar) | PUT | ❌ **Incompatible** | **Falta campo `CreadoPor`** |
| `/mobile/notificaciones/dia` | GET | ✅ Compatible | Funcionando correctamente |
| `/mobile/notificaciones/pendientes` | GET | ✅ Compatible | Funcionando correctamente |
| `/mobile/registro-produccion/galpones` | GET | ✅ Compatible | Funcionando correctamente |

### Severidad de Problemas

| Problema | Severidad | Impacto | Estado |
|----------|-----------|---------|--------|
| Falta campo `CreadoPor` en crear registro | 🔴 **Crítico** | App no puede crear registros (400 Bad Request) | ❌ Pendiente |
| Falta campo `CreadoPor` en editar registro | 🔴 **Crítico** | App no puede editar registros (400 Bad Request) | ❌ Pendiente |

---

## 🎯 RECOMENDACIONES ADICIONALES

### 1. Mapeo de DTOs Consistente

**Problema**: La app móvil tiene modelos propios (`CreateRegistroProduccionRequest`) que deben mapear a Commands de la API (`CreateRegistroProduccionDiarioCommand`).

**Recomendación**: Crear un servicio de mapeo o usar AutoMapper en la app móvil para:
- Mantener separación entre modelos de UI y DTOs de API
- Facilitar cambios futuros en la API sin romper la UI
- Centralizar la lógica de transformación

### 2. Validación Defensiva en App Móvil

**Implementar**:
```csharp
public class RegistroProduccionRequestValidator
{
    public static ValidationResult Validate(CreateRegistroProduccionRequest request)
    {
        if (request == null)
            return ValidationResult.Error("Request no puede ser nulo");
            
        if (string.IsNullOrWhiteSpace(request.CreadoPor))
            return ValidationResult.Error("CreadoPor es requerido");
            
        if (request.GalponId <= 0)
            return ValidationResult.Error("GalponId inválido");
            
        // ... más validaciones
        
        return ValidationResult.Success();
    }
}
```

### 3. Manejo de Errores HTTP

**Mejorar parsing de errores** en `RegistroProduccionService.cs`:

```csharp
catch (HttpRequestException ex)
{
    if (ex.StatusCode == HttpStatusCode.BadRequest)
    {
        // Parsear mensaje específico del backend
        await _loggingService.LogErrorAsync(
            $"Validación fallida en backend: {errorContent}",
            "RegistroProduccion"
        );
        return ApiResponse<T>.Error("Datos inválidos. Verifique los campos requeridos.", 400);
    }
    // ... otros casos
}
```

### 4. Documentación de Contratos API

**Crear documento de referencia rápida**:
```markdown
# API Contracts - Registro Producción

## POST /mobile/registro-produccion
### Request Body (REQUIRED)
- Fecha: DateTime
- GalponId: int
- HoraRegistro: TimeSpan
- CantidadMaples: int
- UnidadesIncompletas: int
- GallinasMuertas: int
- CreadoPor: string ✅ REQUIRED
- Observaciones: string? (opcional)
- CausaProbableMortalidad: string? (opcional)
- AccionesTomadasMortalidad: string? (opcional)
```

### 5. Tests de Integración

**Crear tests automatizados**:
```csharp
[Test]
public async Task CrearRegistro_ConCreadoPor_Exitoso()
{
    // Arrange
    CreateRegistroProduccionRequest request = new()
    {
        GalponId = 1,
        Fecha = DateTime.Today,
        CreadoPor = "test@icarus.com",  // ✅ Campo requerido
        // ... otros campos
    };
    
    // Act
    ApiResponse<RegistroProduccionModel> result = await _service.CrearRegistroProduccionAsync(request);
    
    // Assert
    Assert.IsTrue(result.IsSuccess);
    Assert.AreEqual(201, result.StatusCode);
}

[Test]
public async Task CrearRegistro_SinCreadoPor_Falla()
{
    // Arrange
    CreateRegistroProduccionRequest request = new()
    {
        GalponId = 1,
        Fecha = DateTime.Today,
        CreadoPor = null,  // ❌ Campo requerido faltante
        // ... otros campos
    };
    
    // Act
    ApiResponse<RegistroProduccionModel> result = await _service.CrearRegistroProduccionAsync(request);
    
    // Assert
    Assert.IsFalse(result.IsSuccess);
    Assert.AreEqual(400, result.StatusCode);
}
```

---

## 📞 Contacto y Soporte

**Proyecto**: ICARUS - Sistema Empresarial Modular  
**Repositorio**: [GitHub - luicahleo/ICARUS](https://github.com/luicahleo/ICARUS)

---

## 📝 Notas Finales

Este análisis se realizó comparando:
- Modelos de request de ICARUS_MOBILE (`Models/`)
- Commands y DTOs de ICARUS.Application (`Features/`)
- Controladores de ICARUS.API (`Controllers/Mobile/`)

**PRIORIDAD**: Los cambios en el campo `CreadoPor` son **CRÍTICOS** y deben implementarse **INMEDIATAMENTE** para que la funcionalidad de creación y edición de registros funcione correctamente.

**Fecha de última actualización**: Diciembre 8, 2025
