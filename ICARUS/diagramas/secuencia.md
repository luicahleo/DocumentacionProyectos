# Diagramas de Secuencia — ICARUS

**Última actualización:** 2026-06-29 — validado contra código fuente

> Reflejan el comportamiento real: la **Web autentica con Identity local** (no llama a la API),
> la **móvil usa la API con JWT**, y el **reconocimiento facial pasa por ARGOS**.

## 1. Login en ICARUS.Web (Identity local, sin API)

```mermaid
sequenceDiagram
    actor Usuario
    participant Web as ICARUS.Web (MVC)
    participant Id as ASP.NET Identity
    participant DB as SQL Server

    Usuario->>Web: POST /Identity/Account/Login
    Web->>Id: SignInManager.PasswordSignInAsync
    Id->>DB: AspNetUsers / roles
    DB-->>Id: usuario + claims
    Id-->>Web: cookie de sesión
    Web-->>Usuario: redirección al dashboard
```

## 2. Login móvil (JWT contra la API)

```mermaid
sequenceDiagram
    actor Trabajador
    participant App as ICARUS_MOBILE
    participant API as ICARUS.API
    participant H as LoginHandler
    participant DB as SQL Server

    Trabajador->>App: credenciales
    App->>API: POST api/mobile/auth/login
    API->>H: IMediator.Send(LoginCommand)
    H->>DB: valida Trabajador
    DB-->>H: ok
    H-->>API: OperationResult { accessToken, refreshToken }
    API-->>App: 200 OK (JWT en SecureStorage)
```

## 3. Registro de producción (CQRS)

```mermaid
sequenceDiagram
    actor Galponero
    participant App as IMGA
    participant API as RegistroProduccionMobileController
    participant V as ValidationBehavior
    participant H as CreateRegistroProduccionDiarioCommandHandler
    participant DB as SQL Server

    App->>API: POST api/mobile/registro-produccion (JWT)
    API->>V: IMediator.Send(command)
    V->>H: válido → Handle
    H->>DB: crea RegistroProduccionDiario (+ mortalidad)
    DB-->>H: commit (audit trail)
    H-->>API: OperationResult<Dto>
    API-->>App: 200 OK
```

## 4. Control de acceso facial (IMCA → ARGOS → API)

```mermaid
sequenceDiagram
    actor Persona
    participant IMCA as IMCA (kiosco)
    participant ARGOS as ARGOS (Python)
    participant API as IMCAController
    participant DB as SQL Server

    Persona->>IMCA: rostro
    IMCA->>ARGOS: imagen
    ARGOS->>ARGOS: ArcFace → embedding (512)
    ARGOS-->>IMCA: embedding / identidad
    IMCA->>API: POST api/imca/registros/crear (JWT)
    API->>DB: compara DatosBiometricos, registra RegistroAcceso
    DB-->>API: resultado
    API-->>IMCA: ResultadoAcceso
```
