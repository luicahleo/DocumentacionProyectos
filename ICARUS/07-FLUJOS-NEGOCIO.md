# 07 - Flujos de Negocio End-to-End

## Resumen Ejecutivo

Este documento describe los casos de uso completos del sistema ICARUS, mostrando cómo fluyen los datos desde la interfaz de usuario (Mobile/Web) hasta la base de datos, atravesando todas las capas de Clean Architecture.

---

## Flujo 1: Login de Trabajador Móvil

### Descripción
Trabajador autentica desde ICARUS_MOBILE para acceder a sus módulos asignados.

### Actores
- **Trabajador**: Usuario con rol "Trabajador"
- **Sistema**: ICARUS_MOBILE + ICARUS.API

### Precondiciones
- Trabajador tiene credenciales válidas (Email + Password)
- Trabajador está activo en el sistema
- Trabajador está asignado a un cliente
- Cliente tiene módulos contratados

### Flujo Principal

```
┌─────────────────┐
│ ICARUS_MOBILE   │
│ LoginPage       │
└────────┬────────┘
         │ 1. Usuario ingresa email y password
         │ 2. Click en "Iniciar Sesión"
         ▼
┌─────────────────────────┐
│ LoginViewModel          │
│ LoginCommand            │
└────────┬────────────────┘
         │ 3. Validar inputs (not null/empty)
         │ 4. Crear LoginRequest
         ▼
┌─────────────────────────┐
│ AuthenticationService   │
│ LoginAsync()            │
└────────┬────────────────┘
         │ 5. POST /api/mobile/auth/login
         │    Header: Content-Type: application/json
         │    Body: { "email": "...", "password": "..." }
         ▼
┌─────────────────────────────────┐
│ ICARUS.API                      │
│ MobileAuthController.Login()    │
└────────┬────────────────────────┘
         │ 6. Validar request no null
         │ 7. Crear LoginTrabajadorCommand
         ▼
┌─────────────────────────────────┐
│ MediatR                         │
│ Send(LoginTrabajadorCommand)    │
└────────┬────────────────────────┘
         │ 8. Buscar handler
         ▼
┌──────────────────────────────────────────┐
│ LoginTrabajadorCommandHandler            │
└────────┬─────────────────────────────────┘
         │ 9. Obtener ITrabajadorAccesoRepository
         │ 10. GetByEmailAsync(email)
         ▼
┌──────────────────────────────────────────┐
│ TrabajadorAccesoRepository               │
│ GetByEmailAsync()                        │
└────────┬─────────────────────────────────┘
         │ 11. EF Core Query:
         │     context.TrabajadorAcceso
         │       .Include(t => t.Cliente)
         │       .FirstOrDefaultAsync(t => t.Email == email)
         ▼
┌──────────────────────────────────────────┐
│ SQL Server Database                      │
│ SELECT * FROM TrabajadorAcceso WHERE...  │
└────────┬─────────────────────────────────┘
         │ 12. Return TrabajadorAcceso entity
         ▼
┌──────────────────────────────────────────┐
│ LoginTrabajadorCommandHandler            │
└────────┬─────────────────────────────────┘
         │ 13. Validar trabajador != null
         │ 14. Validar trabajador.EstaActivo == true
         │ 15. Verificar password (hash BCrypt)
         │ 16. Generar JWT token con claims:
         │     - TrabajadorId
         │     - ClienteId
         │     - Email
         │     - Role: "Trabajador"
         │ 17. Consultar módulos del cliente
         ▼
┌──────────────────────────────────────────┐
│ IClienteModuloRepository                 │
│ GetByClienteIdAsync()                    │
└────────┬─────────────────────────────────┘
         │ 18. Return List<ClienteModulo>
         ▼
┌──────────────────────────────────────────┐
│ LoginTrabajadorCommandHandler            │
└────────┬─────────────────────────────────┘
         │ 19. Crear LoginResponse:
         │     - AccessToken (JWT)
         │     - RefreshToken
         │     - TrabajadorInfo
         │     - ClienteInfo
         │     - AssignedModules
         │ 20. Return OperationResult<LoginResponse>
         ▼
┌──────────────────────────────────────────┐
│ MobileAuthController                     │
└────────┬─────────────────────────────────┘
         │ 21. Return 200 OK + LoginResponse
         ▼
┌──────────────────────────────────────────┐
│ AuthenticationService                    │
└────────┬─────────────────────────────────┘
         │ 22. Guardar en SecureStorage:
         │     - "icarus_access_token" = AccessToken
         │     - "icarus_refresh_token" = RefreshToken
         │     - "icarus_worker_info" = JSON(TrabajadorInfo)
         │     - "icarus_assigned_modules" = JSON(Modules)
         │ 23. Actualizar ModuleMenuService
         │ 24. Return LoginResponse
         ▼
┌──────────────────────────────────────────┐
│ LoginViewModel                           │
└────────┬─────────────────────────────────┘
         │ 25. Validar response.IsSuccess
         │ 26. Navegar a HomePage
         ▼
┌──────────────────────────────────────────┐
│ HomePage (AppShell)                      │
│ - Mostrar módulos asignados              │
│ - Mostrar notificaciones                 │
└──────────────────────────────────────────┘
```

### Poscondiciones
- Trabajador autenticado con JWT válido
- Tokens almacenados en SecureStorage
- Módulos cargados en menú de navegación
- Usuario en HomePage con acceso a funcionalidades

### Validaciones
- Email y password requeridos
- Trabajador debe existir en BD
- Trabajador debe estar activo (`EstaActivo = true`)
- Contraseña debe coincidir (BCrypt hash)
- Cliente debe tener módulos contratados

---

## Flujo 2: Crear Registro de Producción Diaria

### Descripción
Trabajador registra producción de huevos de un galpón desde app móvil.

### Actores
- **Trabajador**: Usuario autenticado con módulo GestionAvicola
- **Sistema**: ICARUS_MOBILE + ICARUS.API + ICARUS.Infrastructure

### Precondiciones
- Trabajador autenticado
- Módulo "Gestión Avícola" asignado al cliente
- Cliente tiene galpones activos

### Flujo Principal

```
┌─────────────────────────────────────────┐
│ ICARUS_MOBILE                           │
│ CrearRegistroProduccionPage             │
└────────┬────────────────────────────────┘
         │ 1. OnAppearing() se ejecuta
         ▼
┌─────────────────────────────────────────┐
│ CrearRegistroProduccionViewModel        │
│ LoadGalponesAsync()                     │
└────────┬────────────────────────────────┘
         │ 2. GET /api/mobile/registro-produccion/galpones
         │    Header: Authorization: Bearer {token}
         ▼
┌─────────────────────────────────────────┐
│ RegistroProduccionMobileController      │
│ GetGalponesDisponibles()                │
└────────┬────────────────────────────────┘
         │ 3. Extraer ClienteId del JWT token
         │ 4. Crear GetGalponesQuery
         ▼
┌─────────────────────────────────────────┐
│ GetGalponesQueryHandler                 │
└────────┬────────────────────────────────┘
         │ 5. _galponRepository.GetByClienteIdAsync()
         ▼
┌─────────────────────────────────────────┐
│ SQL Query                               │
│ SELECT * FROM Galpon                    │
│ WHERE GestorAvicolaId = @clienteId      │
│   AND EstaActivo = 1                    │
└────────┬────────────────────────────────┘
         │ 6. Return List<Galpon>
         ▼
┌─────────────────────────────────────────┐
│ CrearRegistroProduccionViewModel        │
└────────┬────────────────────────────────┘
         │ 7. Poblar ObservableCollection<GalponModel>
         │
         │ === USUARIO INGRESA DATOS ===
         │ 8. Selecciona galpón
         │ 9. Selecciona fecha (no puede ser futura)
         │ 10. Ingresa cantidadMaples: 100
         │ 11. Ingresa unidadesIncompletas: 15
         │ 12. TotalHuevos calculado: (100*30) + 15 = 3015
         │ 13. Ingresa mortalidad: 2
         │ 14. Ingresa alimento: 250.5
         │ 15. Ingresa observaciones: "Producción normal"
         │ 16. Click "Guardar"
         ▼
┌─────────────────────────────────────────┐
│ CrearRegistroProduccionViewModel        │
│ GuardarRegistroCommand                  │
└────────┬────────────────────────────────┘
         │ 17. Validaciones:
         │     - GalponSeleccionado != null
         │     - FechaProduccion <= DateTime.Today
         │     - CantidadMaples >= 0
         │     - TotalHuevos == (Maples*30) + Incompletas
         │ 18. Crear RegistroProduccionRequest
         │ 19. POST /api/mobile/registro-produccion
         ▼
┌─────────────────────────────────────────┐
│ RegistroProduccionMobileController      │
│ CrearRegistroProduccion()               │
└────────┬────────────────────────────────┘
         │ 20. Validar request != null
         │ 21. Validar CreadoPor presente
         │ 22. Validar ClienteId del token
         │ 23. Crear CreateRegistroProduccionDiarioCommand
         ▼
┌─────────────────────────────────────────┐
│ MediatR.Send()                          │
└────────┬────────────────────────────────┘
         │ 24. Buscar handler
         ▼
┌──────────────────────────────────────────────────┐
│ CreateRegistroProduccionDiarioCommandHandler    │
└────────┬─────────────────────────────────────────┘
         │ 25. Validaciones de negocio:
         │     - Galpón existe y está activo
         │     - Fecha no es futura
         │     - No existe registro para ese galpón/fecha
         │     - TotalHuevos = (CantidadMaples * 30) + UnidadesIncompletas
         │     - Mortalidad >= 0
         │     - Alimento >= 0
         │
         │ 26. Crear entidad RegistroProduccionDiario:
         │     - GalponId = request.GalponId
         │     - FechaProduccion = request.FechaProduccion
         │     - CantidadMaples = 100
         │     - UnidadesIncompletas = 15
         │     - TotalHuevos = 3015
         │     - Mortalidad = 2
         │     - Alimento = 250.5
         │     - Observaciones = "Producción normal"
         │     - CreadoPor = "trabajador@example.com"
         │     - FechaCreacion = DateTime.UtcNow
         │     - EstaActivo = true
         │
         │ 27. _registroRepository.AddAsync(entity)
         ▼
┌──────────────────────────────────────────────────┐
│ GenericRepository<RegistroProduccionDiario>     │
│ AddAsync()                                       │
└────────┬─────────────────────────────────────────┘
         │ 28. _context.Set<RegistroProduccionDiario>().AddAsync()
         ▼
┌──────────────────────────────────────────────────┐
│ UnitOfWork.SaveChangesAsync()                   │
└────────┬─────────────────────────────────────────┘
         │ 29. _context.SaveChangesAsync()
         ▼
┌──────────────────────────────────────────────────┐
│ SQL Server                                       │
│ INSERT INTO RegistroProduccionDiario            │
│   (GalponId, FechaProduccion, CantidadMaples,   │
│    UnidadesIncompletas, TotalHuevos, ...)       │
│ VALUES (1, '2024-12-31', 100, 15, 3015, ...)    │
└────────┬─────────────────────────────────────────┘
         │ 30. Return ID del nuevo registro
         ▼
┌──────────────────────────────────────────────────┐
│ CreateRegistroProduccionDiarioCommandHandler    │
└────────┬─────────────────────────────────────────┘
         │ 31. Mapear entity a DTO
         │ 32. Return OperationResult<RegistroProduccionDiarioDto>
         ▼
┌──────────────────────────────────────────────────┐
│ RegistroProduccionMobileController              │
└────────┬─────────────────────────────────────────┘
         │ 33. Return 201 Created + DTO
         ▼
┌──────────────────────────────────────────────────┐
│ CrearRegistroProduccionViewModel                │
└────────┬─────────────────────────────────────────┘
         │ 34. Mostrar alerta "Registro creado"
         │ 35. Navegar atrás a lista
         ▼
┌──────────────────────────────────────────────────┐
│ HistorialRegistrosPage                          │
│ - Mostrar nuevo registro en la lista            │
└──────────────────────────────────────────────────┘
```

### Poscondiciones
- Registro creado en base de datos
- Registro visible en historial
- Usuario notificado del éxito
- Logs generados en API y Mobile

### Validaciones Críticas
1. **Fecha**: No puede ser futura
2. **Galpón**: Debe existir, estar activo y pertenecer al cliente
3. **Duplicados**: No puede haber dos registros para el mismo galpón en la misma fecha
4. **Cálculo huevos**: `TotalHuevos = (CantidadMaples * 30) + UnidadesIncompletas`
5. **Cantidades**: Todas >= 0
6. **Maple**: 1 maple = 30 huevos (estándar de la industria)

---

## Flujo 3: Crear Programa de Vacunación (Web)

### Descripción
Administrador o Cliente crea programa de vacunación desde ICARUS.Web.

### Actores
- **Administrador/Cliente**: Usuario autenticado en Web
- **Sistema**: ICARUS.Web + ICARUS.API + ICARUS.Infrastructure

### Precondiciones
- Usuario autenticado (Administrador o Cliente)
- Cliente tiene módulo "Gestión Avícola"
- Existen galpones registrados

### Flujo Principal

```
┌─────────────────────────────────────────┐
│ ICARUS.Web                              │
│ /GestionAvicola/ProgramaVacunacion/Crear│
└────────┬────────────────────────────────┘
         │ 1. GET - Cargar formulario
         ▼
┌─────────────────────────────────────────┐
│ ProgramaVacunacionController.Crear()    │
└────────┬────────────────────────────────┘
         │ 2. Obtener ClienteId del usuario
         │ 3. Cargar lista de galpones
         │ 4. Cargar lista de vacunas
         │ 5. Return View con ViewModel
         │
         │ === USUARIO COMPLETA FORMULARIO ===
         │ 6. Nombre: "Programa Newcastle 2024"
         │ 7. Fecha emisión: 2024-12-31
         │ 8. Observaciones: "Ciclo anual"
         │ 9. Agregar cronogramas:
         │    - Vacuna: Newcastle
         │    - Edad aplicación: 7 días
         │    - Dosis: 0.5ml
         │    - Vía: Ocular
         │ 10. Click "Guardar"
         ▼
┌─────────────────────────────────────────┐
│ ProgramaVacunacionController.Crear()    │
│ [HttpPost]                              │
└────────┬────────────────────────────────┘
         │ 11. Validar ModelState
         │ 12. Validar fecha emisión (no futura)
         │ 13. Validar al menos 1 cronograma
         │ 14. Crear CreateProgramaVacunacionCommand
         ▼
┌─────────────────────────────────────────┐
│ MediatR.Send()                          │
└────────┬────────────────────────────────┘
         │ 15. Buscar handler
         ▼
┌──────────────────────────────────────────────────┐
│ CreateProgramaVacunacionCommandHandler          │
└────────┬─────────────────────────────────────────┘
         │ 16. Iniciar transacción (UnitOfWork)
         │ 17. Crear ProgramaVacunacion:
         │     - Nombre = "Programa Newcastle 2024"
         │     - GestorAvicolaId = clienteId
         │     - FechaEmision = 2024-12-31
         │     - Observaciones = "Ciclo anual"
         │     - EstaActivo = true
         │     - CreadoPor = user.Email
         │
         │ 18. _programaRepository.AddAsync(programa)
         │ 19. SaveChangesAsync() - Obtener ProgramaId
         ▼
┌──────────────────────────────────────────────────┐
│ SQL INSERT INTO ProgramaVacunacion              │
└────────┬─────────────────────────────────────────┘
         │ 20. Return ProgramaId = 100
         ▼
┌──────────────────────────────────────────────────┐
│ CreateProgramaVacunacionCommandHandler          │
└────────┬─────────────────────────────────────────┘
         │ 21. Foreach cronograma en request:
         │     - Crear CronogramaVacunacion:
         │       * ProgramaVacunacionId = 100
         │       * VacunaId = request.VacunaId
         │       * EdadAplicacion = 7
         │       * Dosis = "0.5ml"
         │       * ViaAplicacion = "Ocular"
         │       * Estado = TareaEstado.Pendiente
         │     - _cronogramaRepository.AddAsync()
         │
         │ 22. SaveChangesAsync()
         ▼
┌──────────────────────────────────────────────────┐
│ SQL INSERT INTO CronogramaVacunacion (batch)    │
└────────┬─────────────────────────────────────────┘
         │ 23. Commit transacción
         ▼
┌──────────────────────────────────────────────────┐
│ ProgramaVacunacionController                    │
└────────┬─────────────────────────────────────────┘
         │ 24. TempData["Success"] = "Programa creado"
         │ 25. RedirectToAction("Index")
         ▼
┌──────────────────────────────────────────────────┐
│ /GestionAvicola/ProgramaVacunacion/Index        │
│ - Mostrar programa en lista                     │
│ - Mostrar cronogramas asociados                 │
└──────────────────────────────────────────────────┘
```

### Poscondiciones
- Programa de vacunación creado en BD
- Cronogramas asociados creados
- Notificaciones programadas para trabajadores
- Visible en lista de programas

### Reglas de Negocio
1. **Fecha emisión**: No puede ser futura
2. **Cronogramas**: Mínimo 1 cronograma requerido
3. **Edad aplicación**: Debe ser coherente con edad de aves del galpón
4. **Vacunas**: Deben existir y estar activas
5. **Duplicados**: Un galpón no puede tener programas solapados
6. **Estado inicial**: Todos los cronogramas en estado "Pendiente"

---

## Flujo 4: Consultar Tareas del Día (Notificaciones)

### Descripción
Trabajador consulta tareas programadas para el día actual desde app móvil.

### Actores
- **Trabajador**: Usuario autenticado con módulo GestionAvicola
- **Sistema**: ICARUS_MOBILE + ICARUS.API

### Precondiciones
- Trabajador autenticado
- Cliente tiene programas de vacunación/iluminación/alimentación activos
- Existen tareas programadas para hoy

### Flujo Principal

```
┌─────────────────────────────────────────┐
│ ICARUS_MOBILE                           │
│ NotificacionesPage                      │
└────────┬────────────────────────────────┘
         │ 1. OnAppearing()
         ▼
┌─────────────────────────────────────────┐
│ NotificacionesViewModel                 │
│ LoadTareasDelDiaAsync()                 │
└────────┬────────────────────────────────┘
         │ 2. GET /api/mobile/notificaciones/dia
         │    Header: Authorization: Bearer {token}
         ▼
┌─────────────────────────────────────────┐
│ MobileNotificacionesController          │
│ GetTareasDelDia()                       │
└────────┬────────────────────────────────┘
         │ 3. Extraer ClienteId del JWT
         │ 4. Crear GetTareasDelDiaQuery:
         │    - ClienteId = 456
         │    - FechaConsulta = DateTime.Today
         │    - IncluirTareasSinVacuna = true
         ▼
┌─────────────────────────────────────────┐
│ GetTareasDelDiaQueryHandler             │
└────────┬────────────────────────────────┘
         │ 5. Consultar CronogramaVacunacion:
         │    - WHERE ProgramaVacunacion.GestorAvicolaId = 456
         │    - AND FechaProgramada = TODAY
         │    - AND Estado = Pendiente
         │
         │ 6. Consultar ProgramaIluminacion:
         │    - WHERE Activo = true
         │    - Calcular si corresponde hoy
         │
         │ 7. Consultar ProgramaAlimentacion:
         │    - WHERE Activo = true
         │    - Verificar horarios del día
         ▼
┌─────────────────────────────────────────┐
│ SQL Queries (3 consultas paralelas)    │
└────────┬────────────────────────────────┘
         │ 8. Return datos
         ▼
┌─────────────────────────────────────────┐
│ GetTareasDelDiaQueryHandler             │
└────────┬────────────────────────────────┘
         │ 9. Mapear a NotificacionResponseDto:
         │    - TareasVacunacion: [
         │        { Vacuna: "Newcastle",
         │          Galpon: "Galpón A",
         │          EdadAplicacion: 7,
         │          Dosis: "0.5ml",
         │          Estado: "Pendiente" }
         │      ]
         │    - TareasIluminacion: [...]
         │    - TareasAlimentacion: [...]
         │    - TotalTareas: 5
         │    - TareasPendientes: 3
         │
         │ 10. Return Result<NotificacionResponseDto>
         ▼
┌─────────────────────────────────────────┐
│ MobileNotificacionesController          │
└────────┬────────────────────────────────┘
         │ 11. Return 200 OK + NotificacionResponseDto
         ▼
┌─────────────────────────────────────────┐
│ NotificacionesViewModel                 │
└────────┬────────────────────────────────┘
         │ 12. Poblar ObservableCollections:
         │     - TareasVacunacion
         │     - TareasIluminacion
         │     - TareasAlimentacion
         │ 13. Actualizar contadores:
         │     - TotalTareas = 5
         │     - TareasPendientes = 3
         │     - TareasCompletadas = 2
         ▼
┌─────────────────────────────────────────┐
│ NotificacionesPage (XAML)               │
│ - CollectionView de tareas vacunación  │
│ - CollectionView de tareas iluminación │
│ - CollectionView de tareas alimentación│
│ - Badges con contadores                │
└─────────────────────────────────────────┘
```

### Poscondiciones
- Trabajador ve todas las tareas del día
- Tareas organizadas por tipo (vacunación, iluminación, alimentación)
- Estado de cada tarea visible (pendiente/completada)
- Contadores actualizados

### Lógica de Cálculo de Tareas

**Vacunación**:
```sql
SELECT c.*, v.Nombre as VacunaNombre, g.Nombre as GalponNombre
FROM CronogramaVacunacion c
JOIN ProgramaVacunacion p ON c.ProgramaVacunacionId = p.Id
JOIN Vacuna v ON c.VacunaId = v.Id
JOIN Galpon g ON p.GalponId = g.Id
WHERE p.GestorAvicolaId = @clienteId
  AND c.FechaProgramada = @today
  AND c.Estado = 0 -- Pendiente
  AND p.EstaActivo = 1
```

**Iluminación**:
```sql
SELECT pi.*, g.Nombre as GalponNombre
FROM ProgramaIluminacion pi
JOIN Galpon g ON pi.GalponId = g.Id
WHERE g.GestorAvicolaId = @clienteId
  AND pi.EstaActivo = 1
  AND GETDATE() BETWEEN pi.HoraInicio AND pi.HoraFin
```

---

## Flujo 5: Editar Registro de Producción

### Descripción
Trabajador edita un registro de producción existente desde app móvil.

### Validaciones Especiales
1. **Permiso**: Solo puede editar quien creó el registro (`CreadoPor == Email`)
2. **Tiempo**: Solo se pueden editar registros de las últimas 24 horas
3. **Estado**: No se pueden editar registros "Aprobados" o "Cerrados"

### Flujo Simplificado

```
Mobile: EditarRegistroProduccionPage
  │ GET /api/mobile/registro-produccion/{id}
  ▼
API: RegistroProduccionMobileController.GetRegistroProduccionById()
  │ Validar: CreadoPor == Email del token
  ▼
Handler: GetRegistroProduccionByIdQueryHandler
  │ Repository: GetByIdAsync()
  ▼
DB: SELECT * FROM RegistroProduccionDiario WHERE Id = @id
  │
  ▼
Mobile: Mostrar datos en formulario
  │ Usuario modifica valores
  │ Click "Guardar Cambios"
  ▼
Mobile: PUT /api/mobile/registro-produccion/{id}
  │ Body: { cantidadMaples: 105, ... }
  ▼
API: UpdateRegistroProduccionDiarioCommand
  │ Validar permisos
  │ Validar cálculos
  ▼
Handler: UpdateRegistroProduccionDiarioCommandHandler
  │ Repository: UpdateAsync()
  ▼
DB: UPDATE RegistroProduccionDiario
    SET CantidadMaples = 105,
        TotalHuevos = 3165,
        FechaModificacion = GETDATE(),
        ModificadoPor = 'trabajador@example.com'
    WHERE Id = @id
```

---

## Flujo 6: Exportar Reporte de Producción (Web)

### Descripción
Cliente exporta reporte de producción mensual a Excel desde ICARUS.Web.

### Flujo Simplificado

```
Web: /GestionAvicola/Reportes/Produccion
  │ Seleccionar: Mes = Diciembre 2024, Galpón = Todos
  │ Click "Exportar a Excel"
  ▼
Controller: ReportesController.ExportarProduccionExcel()
  │ Crear GetRegistrosProduccionByPeriodoQuery
  ▼
Handler: GetRegistrosProduccionByPeriodoQueryHandler
  │ Repository: GetByPeriodoAsync(fechaInicio, fechaFin)
  ▼
DB: SELECT rp.*, g.Nombre as GalponNombre
    FROM RegistroProduccionDiario rp
    JOIN Galpon g ON rp.GalponId = g.Id
    WHERE rp.FechaProduccion BETWEEN @inicio AND @fin
      AND g.GestorAvicolaId = @clienteId
    ORDER BY rp.FechaProduccion DESC
  │
  ▼
Service: ExcelExportService.ExportProduccionAsync()
  │ Crear workbook con EPPlus
  │ Agregar headers
  │ Agregar datos fila por fila
  │ Aplicar formato
  │ Agregar totales
  │ Return MemoryStream
  ▼
Controller: Return File(stream, contentType, fileName)
  │
  ▼
Browser: Descargar "Produccion_Diciembre_2024.xlsx"
```

---

## Métricas de Performance

### Tiempos Esperados

| Operación | Tiempo Objetivo | Tiempo Máximo |
|-----------|-----------------|---------------|
| Login | < 1s | 2s |
| Cargar galpones | < 500ms | 1s |
| Crear registro | < 1s | 2s |
| Consultar tareas del día | < 800ms | 1.5s |
| Exportar a Excel | < 3s | 5s |
| Carga inicial de notificaciones | < 1s | 2s |

### Puntos de Optimización

1. **Caché**:
   - Lista de galpones (TTL: 5 minutos)
   - Módulos asignados (hasta logout)
   - Información del trabajador (hasta logout)

2. **Paginación**:
   - Historial de registros: 50 items/página
   - Notificaciones: cargar solo del día actual
   - Listados web: 25 items/página

3. **Índices Críticos**:
   - `RegistroProduccionDiario (GalponId, FechaProduccion)`
   - `CronogramaVacunacion (ProgramaVacunacionId, FechaProgramada, Estado)`
   - `TrabajadorAcceso (Email, EstaActivo)`

---

## Manejo de Errores End-to-End

### Escenario: Token JWT Expirado

```
Mobile: Intento de crear registro
  │ POST /api/mobile/registro-produccion
  │ Header: Authorization: Bearer {expired_token}
  ▼
API: JWT Middleware
  │ Validar token
  │ Token expirado!
  ▼
API: Return 401 Unauthorized
  │
  ▼
Mobile: HttpClient captura 401
  │ AuthenticationService detecta sesión expirada
  │ Limpiar SecureStorage
  │ Navegar a LoginPage
  ▼
Mobile: Mostrar mensaje "Sesión expirada, por favor inicie sesión nuevamente"
```

### Escenario: Error de Validación de Negocio

```
Mobile: Crear registro con fecha futura
  │ POST con FechaProduccion = 2025-01-01
  ▼
API: CreateRegistroProduccionDiarioCommandHandler
  │ Validar: FechaProduccion <= DateTime.Today
  │ FALLA!
  ▼
Handler: Return OperationResult.Failure("La fecha no puede ser futura")
  │
  ▼
API: Return 400 Bad Request + mensaje
  │
  ▼
Mobile: Mostrar Alert("Error", "La fecha no puede ser futura")
```

---

## Resumen de Integraciones

### Mobile ↔ API

| Módulo | Endpoints Consumidos | Frecuencia |
|--------|---------------------|------------|
| Autenticación | `/mobile/auth/login`, `/mobile/auth/validate` | Por sesión |
| Registro Producción | `/mobile/registro-produccion/*` | Múltiple/día |
| Notificaciones | `/mobile/notificaciones/dia` | 1x al día |
| Trabajador Info | `/mobile/trabajador/modulos` | Por sesión |

### Web ↔ Application

| Área | Commands | Queries | Frecuencia |
|------|----------|---------|------------|
| Clientes | Create, Update, Delete | GetAll, GetById | Baja |
| Galpones | Create, Update | GetByCliente | Media |
| Producción | Create, Update | GetByPeriodo | Alta |
| Programas Vacunación | Create, Update | GetActivos | Media |

---

## Próximo Documento

Ver [08-CONSOLIDACION-FINAL.md](08-CONSOLIDACION-FINAL.md) para índice maestro y recomendaciones de refactorización.

---

**Fin del Documento 07-FLUJOS-NEGOCIO.md**
