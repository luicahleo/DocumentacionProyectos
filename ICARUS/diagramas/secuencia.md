# Diagramas de Secuencia - ICARUS

## Flujo de Autenticación

```mermaid
sequenceDiagram
    actor Usuario
    participant Web as ICARUS.Web
    participant API as ICARUS.API
    participant DB as SQL Server
    participant Identity as ASP.NET Identity
    
    Usuario->>Web: Login (email, password)
    Web->>Identity: ValidateCredentials()
    Identity->>DB: Query User
    DB-->>Identity: User data
    Identity-->>Web: Claims + Token
    Web-->>Usuario: Redirect to Dashboard
```

## Flujo de Control de Acceso (Reconocimiento Facial)

```mermaid
sequenceDiagram
    actor Trabajador
    participant Mobile as IMCA App
    participant API as ICARUS.API
    participant Argos as ARGOS
    participant DB as SQL Server
    
    Trabajador->>Mobile: Captura foto
    Mobile->>API: POST /api/acceso/verificar
    API->>Argos: POST /verify-face
    Argos->>Argos: Extract embedding
    Argos->>API: Return embedding
    API->>DB: Query DatosBiometricos
    DB-->>API: Stored embeddings
    API->>API: Compare similarity
    
    alt Confianza >= 0.7
        API->>DB: INSERT RegistroAcceso (Autorizado)
        API-->>Mobile: ✅ Acceso Permitido
        Mobile-->>Trabajador: Puerta abierta
    else Confianza < 0.7
        API->>DB: INSERT RegistroAcceso (Denegado)
        API-->>Mobile: ❌ Acceso Denegado
        Mobile-->>Trabajador: Acceso rechazado
    end
```

## Flujo de Registro de Producción Avícola

```mermaid
sequenceDiagram
    actor Operario
    participant Mobile as IMGA App
    participant API as ICARUS.API
    participant DB as SQL Server
    
    Operario->>Mobile: Nuevo registro producción
    Mobile->>Mobile: Validar datos
    Mobile->>API: POST /api/gestionavicola/produccion
    API->>API: Validate business rules
    API->>DB: INSERT RegistroProduccionDiario
    DB-->>API: Success
    API->>API: Calcular estadísticas
    API-->>Mobile: Registro guardado + resumen
    Mobile-->>Operario: Confirmación
```

## Flujo de Asignación de Módulos

```mermaid
sequenceDiagram
    actor Admin
    participant Web as ICARUS.Web
    participant API as ICARUS.API
    participant DB as SQL Server
    
    Admin->>Web: Asignar módulo a cliente
    Web->>API: POST /api/clientemodulos
    API->>DB: Check existing assignment
    
    alt Ya asignado
        API-->>Web: Error: Ya existe
        Web-->>Admin: Mensaje error
    else No asignado
        API->>DB: INSERT ClienteModulo
        DB-->>API: Success
        API-->>Web: Módulo asignado
        Web-->>Admin: Confirmación
    end
```
