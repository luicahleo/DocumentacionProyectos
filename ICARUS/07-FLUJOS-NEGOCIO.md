# 07 — Flujos de Negocio End-to-End

**Última actualización:** 2026-06-29 — validado contra código fuente

Casos de uso completos a través de las capas. Los diagramas reflejan el comportamiento **real** del código.

---

## Flujo 1 — Login en ICARUS.Web (Identity local, SIN API)

La Web autentica contra ASP.NET Identity usando el mismo `ApplicationDbContext`; **no** llama a `ICARUS.API`.

```mermaid
sequenceDiagram
    actor Usuario
    participant Web as ICARUS.Web (MVC)
    participant Id as ASP.NET Identity
    participant DB as SQL Server (ICARUSDB)

    Usuario->>Web: POST /Identity/Account/Login (email, password)
    Web->>Id: SignInManager.PasswordSignInAsync
    Id->>DB: consulta AspNetUsers / roles
    DB-->>Id: usuario + claims
    Id-->>Web: cookie de autenticación
    Web-->>Usuario: redirección al dashboard
```

---

## Flujo 2 — Login móvil (JWT contra la API)

```mermaid
sequenceDiagram
    actor Trabajador
    participant App as ICARUS_MOBILE (IMGA/IMCA)
    participant API as ICARUS.API
    participant H as LoginHandler (Application)
    participant DB as SQL Server

    Trabajador->>App: credenciales
    App->>API: POST api/mobile/auth/login
    API->>H: IMediator.Send(LoginCommand)
    H->>DB: valida Trabajador (PasswordHash)
    DB-->>H: ok
    H-->>API: OperationResult { accessToken, refreshToken }
    API-->>App: 200 OK (JWT)
    App->>App: guarda token en SecureStorage
```

---

## Flujo 3 — Registro de producción diaria (IMGA → API → BD)

```mermaid
sequenceDiagram
    actor Galponero
    participant App as IMGA (móvil)
    participant API as RegistroProduccionMobileController
    participant H as CreateRegistroProduccionDiarioCommandHandler
    participant V as ValidationBehavior
    participant UoW as UnitOfWork / EF Core
    participant DB as SQL Server

    Galponero->>App: maples, unidades, mortalidad
    App->>API: POST api/mobile/registro-produccion (JWT)
    API->>V: IMediator.Send(command)
    V->>V: FluentValidation (fecha no futura, unidades < 30...)
    V->>H: Handle(command)
    H->>UoW: obtiene Galpon, crea RegistroProduccionDiario
    H->>UoW: si mortalidad>0 → ajusta GallinasActuales + RegistroMortalidad
    UoW->>DB: CommitAsync (audit trail automático)
    H-->>API: OperationResult<RegistroProduccionDiarioDto>
    API-->>App: 200 OK
```

> Cálculo de huevos: `TotalHuevos = CantidadMaples * 30 + UnidadesIncompletas`.

---

## Flujo 4 — Control de acceso con reconocimiento facial (IMCA → ARGOS → API)

```mermaid
sequenceDiagram
    actor Persona
    participant IMCA as IMCA (kiosco Android)
    participant ARGOS as ARGOS (Python/Flask)
    participant API as IMCAController (ICARUS.API)
    participant DB as SQL Server

    Persona->>IMCA: rostro frente a la cámara
    IMCA->>ARGOS: imagen para extraer embedding
    ARGOS->>ARGOS: DeepFace/ArcFace → embedding (512 floats)
    ARGOS-->>IMCA: embedding / identidad
    IMCA->>API: POST api/imca/biometria/identificar-huella o /registros/crear (JWT)
    API->>DB: compara con DatosBiometricos, registra RegistroAcceso
    DB-->>API: resultado (autorizado / denegado)
    API-->>IMCA: ResultadoAcceso
    Note over IMCA,API: offline → POST api/imca/registros/sincronizar-batch
```

---

## Flujo 5 — Despacho de huevo (Comercial/Contabilidad)

```mermaid
sequenceDiagram
    actor Operador
    participant App as IMGA (móvil)
    participant API as DespachoHuevoController
    participant H as Handlers (ContabilidadAvicola)
    participant DB as SQL Server

    Operador->>API: GET api/mobile/contabilidad/despachos/precios
    API-->>Operador: lista de PrecioHuevo vigentes
    Operador->>API: POST .../despachos (detalles por tamaño)  [Estado=Preparado]
    API->>H: crea DespachoHuevo + DetalleDespachoHuevo
    Operador->>API: POST .../despachos/{id}/despachar          [Estado=Despachado]
    Operador->>API: PUT  .../despachos/{id}/foto-recibo
    API->>DB: persiste; alimenta BalanceCuenta
    API-->>Operador: OperationResult
```

El **pedido de alimento** (`api/mobile/contabilidad/pedidos`) sigue un ciclo análogo:
`Borrador → Solicitado → Recibido/Incompleto → Verificado`.

---

## Flujo 6 — Tareas/Notificaciones avícolas

A partir de un `ProgramaVacunacion` asignado a un `Galpon`, `GalponTareasInitializationService` genera
`GalponTareaVacunacion` (estado `Pendiente`). La app las consulta y las marca completadas:

```mermaid
sequenceDiagram
    participant App as IMGA
    participant API as MobileNotificacionesController
    participant DB as SQL Server
    App->>API: GET api/mobile/notificaciones/dia
    API-->>App: tareas pendientes (vacunación/iluminación/alimentación)
    App->>API: POST api/mobile/notificaciones/vacunacion/completar
    API->>DB: EstadoTarea = Completada (FechaAplicacion)
```

Ver detalle en [SISTEMA-NOTIFICACIONES.md](SISTEMA-NOTIFICACIONES.md).

---

## Mapa de código de los flujos

| Flujo | Entrada (código) |
|-------|------------------|
| Login Web | `ICARUS.Web/Areas/Identity/` |
| Login móvil | `ICARUS.API/Controllers/Mobile/MobileAuthController.cs` + `Features/TrabajadorMobileAuth/` |
| Producción | `ICARUS.API/Controllers/Mobile/RegistroProduccionMobileController.cs` + `Features/GestionAvicola/` |
| Acceso facial | `ICARUS.API/Controllers/Mobile/IMCAController.cs` + `MICROSERVICIOS/ARGOS/` |
| Despacho / Pedido | `ICARUS.API/Controllers/Mobile/{DespachoHuevo,PedidoAlimento}Controller.cs` + `Features/ContabilidadAvicola/` |
| Notificaciones | `ICARUS.API/Controllers/Mobile/MobileNotificacionesController.cs` |
