# Diagramas de Estado — ICARUS

**Última actualización:** 2026-06-29 — validado contra código fuente

> Solo se incluyen entidades con un **enum de estado real** en `ICARUS.Domain`. No se inventan estados
> que no existan en el código.

## Estado de Trabajador (`EstadoTrabajador`)

Valores reales: `Activo=1`, `Inactivo=2`, `Suspendido=3`, `Despedido=4`.

```mermaid
stateDiagram-v2
    [*] --> Activo: Alta
    Activo --> Suspendido: Suspender
    Suspendido --> Activo: Reactivar
    Activo --> Inactivo: Desactivar
    Inactivo --> Activo: Reactivar
    Activo --> Despedido: Despedir
    Suspendido --> Despedido: Despedir
    Despedido --> [*]
```

## Estado de Cliente (`EstadoCliente`)

Valores reales: `Activo=1`, `Inactivo=2`, `Suspendido=3`.

```mermaid
stateDiagram-v2
    [*] --> Activo
    Activo --> Suspendido: Suspender
    Suspendido --> Activo: Reactivar
    Activo --> Inactivo: Desactivar
    Inactivo --> Activo: Reactivar
```

## Estado de Programa de Vacunación (`EstadoProgramaVacunacion`)

Valores reales: `Activo=1`, `Inactivo=2`, `Archivado=3`.

```mermaid
stateDiagram-v2
    [*] --> Activo
    Activo --> Inactivo: Desactivar
    Inactivo --> Activo: Reactivar
    Activo --> Archivado: Archivar
    Inactivo --> Archivado: Archivar
    Archivado --> [*]
```

## Estado de Tarea de Galpón (`EstadoTarea`)

Valores reales: `Pendiente=0`, `Completada=1`.

```mermaid
stateDiagram-v2
    [*] --> Pendiente: tarea generada desde cronograma
    Pendiente --> Completada: marcar completada (FechaAplicacion)
    Completada --> [*]
```

## Estado de Despacho de Huevo (`EstadoDespacho`)

Valores reales: `Preparado=0`, `Despachado=1`, `Verificado=2`.

```mermaid
stateDiagram-v2
    [*] --> Preparado: crear despacho
    Preparado --> Despachado: despachar (/{id}/despachar)
    Despachado --> Verificado: verificar
    Verificado --> [*]
```

## Estado de Pedido de Alimento (`EstadoPedido`)

Valores reales: `Borrador=0`, `Solicitado=1`, `Recibido=3`, `Incompleto=4`, `Verificado=5`
(el valor `2`/`EnTransito` fue eliminado en el código).

```mermaid
stateDiagram-v2
    [*] --> Borrador
    Borrador --> Solicitado: solicitar (/{id}/solicitar)
    Solicitado --> Recibido: confirmar-recepcion
    Solicitado --> Incompleto: recepción parcial
    Recibido --> Verificado: verificar (/{id}/verificar)
    Incompleto --> Verificado: verificar
    Verificado --> [*]
```
