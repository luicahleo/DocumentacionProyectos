# Diagrama de Clases — ICARUS Domain

**Última actualización:** 2026-06-29 — validado contra código fuente

Atributos y nombres tomados de `ICARUS.Domain/Entities/`. Toda entidad hereda de `BaseEntity`
(`Id`, `FechaCreacion`, `FechaModificacion?`, `CreadoPor?`, `ModificadoPor?`, `EstaActivo`).

## Core / compartido

```mermaid
classDiagram
    class BaseEntity {
        +int Id
        +DateTime FechaCreacion
        +DateTime? FechaModificacion
        +string? CreadoPor
        +string? ModificadoPor
        +bool EstaActivo
    }
    class Cliente {
        +string RazonSocial
        +string? NombreComercial
        +string? NIT
        +string Email
        +string? Telefono
        +string? Direccion
        +EstadoCliente EstadoCliente
        +string? UserId
    }
    class Trabajador {
        +string Nombre
        +string ApellidoPaterno
        +string? ApellidoMaterno
        +string Email
        +string? NumeroDocumento
        +string? FotoUrl
        +DateTime FechaIngreso
        +EstadoTrabajador Estado
        +string? IdentityUserId
        +bool IsActiveForLogin
        +int? ClienteId
    }
    class Modulo {
        +string Nombre
        +string Descripcion
        +ModuloTipo Tipo
        +string Version
        +decimal Precio
        +bool RequiereConfiguracion
    }
    class ClienteModulo { +int ClienteId; +int ModuloId }
    class TrabajadorModulo { +int TrabajadorId; +int ModuloId }

    BaseEntity <|-- Cliente
    BaseEntity <|-- Trabajador
    BaseEntity <|-- Modulo
    Cliente "1" --> "*" Trabajador
    Cliente "1" --> "*" ClienteModulo
    Modulo "1" --> "*" ClienteModulo
    Trabajador "1" --> "*" TrabajadorModulo
    Modulo "1" --> "*" TrabajadorModulo
```

## Gestión Avícola — producción y cronogramas

```mermaid
classDiagram
    class GestorAvicola {
        +int ClienteId
        +string NombreGranja
        +int ContadorHuevos
        +int TotalGallinas
        +int BajasGallinas
        +DateTime FechaUltimaActualizacion
    }
    class Galpon {
        +int GestorAvicolaId
        +string Numero
        +int CapacidadMaxima
        +int GallinasActuales
        +DateTime FechaNacimiento
        +string? Descripcion
        +int? ProgramaVacunacionId
    }
    class RegistroProduccionDiario {
        +DateTime Fecha
        +int ClienteId
        +int GalponId
        +int NumeroRegistro
        +TimeSpan HoraRegistro
        +int CantidadMaples
        +int UnidadesIncompletas
        +int GallinasMuertas
        +decimal PorcentajeMortalidad
        +decimal EficienciaProduccion
    }
    class RegistroMortalidad {
        +int GalponId
        +DateTime Fecha
        +int CantidadMuertas
        +string? CausaProbable
        +string? AccionesTomadas
    }
    class ProgramaVacunacion {
        +string Nombre
        +DateTime FechaEmision
        +int CantidadAves
        +EstadoProgramaVacunacion Estado
    }
    class CronogramaVacunacion {
        +int ProgramaVacunacionId
        +DateTime? Fecha
        +int? EdadDia
        +string? Vacuna
        +string? ModoAplicacion
        +EstadoTarea EstadoTarea
    }
    class GalponTareaVacunacion {
        +int GalponId
        +int CronogramaVacunacionId
        +string? Vacuna
        +int? EdadDia
        +DateTime? FechaProgramada
        +EstadoTarea EstadoTarea
        +DateTime? FechaCompletada
    }

    BaseEntity <|-- GestorAvicola
    BaseEntity <|-- Galpon
    BaseEntity <|-- RegistroProduccionDiario
    BaseEntity <|-- RegistroMortalidad
    BaseEntity <|-- ProgramaVacunacion
    BaseEntity <|-- CronogramaVacunacion
    BaseEntity <|-- GalponTareaVacunacion

    GestorAvicola "1" --> "*" Galpon
    Galpon "1" --> "*" RegistroProduccionDiario
    Galpon "1" --> "*" RegistroMortalidad
    ProgramaVacunacion "1" --> "*" CronogramaVacunacion
    ProgramaVacunacion "1" --> "*" Galpon
    CronogramaVacunacion "1" --> "*" GalponTareaVacunacion
```

## Gestión Avícola — Comercial / Contabilidad

```mermaid
classDiagram
    class DespachoHuevo {
        +int GestorAvicolaId
        +int ClienteId
        +DateTime FechaDespacho
        +int TotalAmarres
        +int TotalHuevos
        +decimal TotalBs
        +EstadoDespacho Estado
        +string? ReciboFotoUrl
    }
    class DetalleDespachoHuevo {
        +int DespachoHuevoId
        +TamanoHuevo Tamano
        +int CantidadAmarres
        +int CantidadHuevos
        +decimal PrecioUnitario
        +decimal Subtotal
    }
    class PedidoAlimento {
        +int GestorAvicolaId
        +int ClienteId
        +DateTime FechaPedido
        +int NumeroSemana
        +int Anio
        +decimal TotalBs
        +int TotalBolsas
        +int TotalKg
        +EstadoPedido Estado
        +TipoPedidoAlimento TipoPedido
    }
    class DetallePedidoAlimento {
        +int PedidoAlimentoId
        +CategoriaAlimento Categoria
        +int CantidadBolsas
        +int CantidadRecibida
        +decimal PrecioBolsa
        +decimal Subtotal
    }
    class PublicacionPrecioHuevo {
        +DateTime FechaPublicacion
        +DateTime FechaVigencia
        +DateTime? FechaFinVigencia
        +decimal Servicio
    }
    class PrecioHuevo {
        +TamanoHuevo Tamano
        +decimal PrecioUnitario
        +decimal Servicio
        +decimal PrecioProductor
        +DateTime FechaEfectiva
        +int? PublicacionPrecioHuevoId
    }
    class BalanceCuenta {
        +int GestorAvicolaId
        +int Semana
        +int Anio
        +decimal IngresoHuevos
        +decimal EgresoAlimento
        +decimal Saldo
        +decimal SaldoAcumulado
        +bool Verificado
        +bool TieneDiscrepancia
    }

    BaseEntity <|-- DespachoHuevo
    BaseEntity <|-- DetalleDespachoHuevo
    BaseEntity <|-- PedidoAlimento
    BaseEntity <|-- DetallePedidoAlimento
    BaseEntity <|-- PrecioHuevo
    BaseEntity <|-- BalanceCuenta
    BaseEntity <|-- PublicacionPrecioHuevo

    DespachoHuevo "1" --> "*" DetalleDespachoHuevo
    PedidoAlimento "1" --> "*" DetallePedidoAlimento
    PublicacionPrecioHuevo "1" --> "*" PrecioHuevo
```

## Control de Acceso

```mermaid
classDiagram
    class TrabajadorAcceso {
        +int ClienteId
        +int TrabajadorId
        +string CodigoTrabajador
        +int NivelAcceso
        +bool AccesoFueraHorario
        +string? ZonasPermitidas
        +string TarjetaRFID
        +string PIN
        +bool RequiereBiometria
        +bool Activo
    }
    class DatosBiometricos {
        +int TrabajadorId
        +TipoBiometrico TipoBiometrico
        +string TemplateBiometrico
        +string? EmbeddingMobileFaceNet
        +string AlgoritmoTemplate
        +int CalidadDato
        +DateTime FechaRegistro
        +bool EstaBloqueado
    }
    class RegistroAcceso {
        +int TrabajadorId
        +int? ZonaAccesoId
        +int? DispositivoId
        +int ClienteId
        +DateTime FechaHoraAcceso
        +TipoAcceso TipoAcceso
        +MetodoAutenticacion MetodoAutenticacion
        +ResultadoAcceso Resultado
        +string? MotivoResultado
        +bool RequiereRevision
    }
    class ZonaAcceso {
        +int ClienteId
        +string Nombre
        +string? Descripcion
        +int NivelSeguridad
        +int CapacidadMaxima
        +bool RequiereBiometria
    }
    class Dispositivo {
        +int ClienteId
        +string Nombre
        +string IdentificadorUnico
        +string Modelo
        +string SistemaOperativo
        +string VersionApp
        +bool EnModoKiosco
        +bool TieneSensorHuella
        +bool TieneCamara
        +DateTime? UltimoHeartbeat
    }
    class AlertaSeguridad { +TipoAlerta Tipo; +NivelSeveridad Severidad; +EstadoAlerta Estado }

    class Trabajador { +int Id }

    BaseEntity <|-- TrabajadorAcceso
    BaseEntity <|-- DatosBiometricos
    BaseEntity <|-- RegistroAcceso
    BaseEntity <|-- ZonaAcceso
    BaseEntity <|-- Dispositivo
    BaseEntity <|-- AlertaSeguridad

    Trabajador "1" --> "*" TrabajadorAcceso
    Trabajador "1" --> "*" DatosBiometricos
    Trabajador "1" --> "*" RegistroAcceso
    ZonaAcceso "1" --> "*" RegistroAcceso
    Dispositivo "1" --> "*" RegistroAcceso
    RegistroAcceso "1" --> "*" AlertaSeguridad
```

> Nota de modelado: `DatosBiometricos` y `RegistroAcceso` referencian `TrabajadorId` (FK a `Trabajador`),
> **no** a `TrabajadorAcceso`. `TrabajadorAcceso` es la configuración de acceso del trabajador (RFID, PIN,
> nivel, zonas) y se relaciona con `Cliente` y `Trabajador`.
