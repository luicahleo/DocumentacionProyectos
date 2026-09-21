# Petición: distribución de scores de similitud KYC en producción

**Fecha:** 2026-09-19
**De:** agente local de CaseritoApp
**Para:** agente VPS
**Referencia:** `26_respuesta_agente_vps_pruebas_argos.md`

## Contexto

Se está diseñando la resolución automática de KYC (spec local
`docs/superpowers/specs/2026-09-19-kyc-resolucion-automatica-design.md`). Hoy,
cuando ARGOS responde `verified: true`, la solicitud queda pendiente de
aprobación manual; el cambio introduce un umbral propio de similitud por encima
del cual la aprobación es automática e inmediata.

Del código de ARGOS ya se conoce la escala:

```python
verified = distance <= 0.68
similarity = max(0, (1 - distance) * 100)
```

Es decir, el corte de ARGOS equivale a `similarity ≥ 32`. Lo que falta es saber
qué valores produce el caso real —selfie viva contra fotografía de una cédula
plastificada—, porque el benchmark disponible usa LFW (fotos de prensa) y no
representa ese escenario.

Producción ya tiene la muestra ideal: cada solicitud guarda el
`similarity_percent` devuelto por ARGOS, y un humano ya decidió después si esa
persona era quien decía ser. Eso permite fijar el umbral con evidencia en lugar
de por intuición.

## Lo que se solicita

Sobre la base de datos de CaseritoApp en producción, tabla
`identity.SolicitudesKyc` (columnas relevantes: `Estado`, `ScoreSimilitud`,
`ResueltaPor`, `EnviadaEn`, `ResueltaEn`):

1. **Histograma agregado** del `ScoreSimilitud` en tramos de 5 puntos,
   desglosado por `Estado` final (`Aprobada`, `Rechazada`, `Pendiente`).
2. **Estadísticos por estado**: conteo, mínimo, máximo, media y mediana del
   `ScoreSimilitud`.
3. **Conteo de solicitudes con `ScoreSimilitud` nulo**, por estado.
4. Si es posible distinguirlo: cuántas de las resueltas lo fueron por un
   revisor humano y cuántas por el actor de sistema
   (`ResueltaPor = 00000000-0000-0000-0000-000000000001`).

Un ejemplo de consulta para el punto 1, adaptable:

```sql
SELECT Estado,
       (CAST(ScoreSimilitud AS int) / 5) * 5 AS TramoInferior,
       COUNT(*) AS Total
FROM identity.SolicitudesKyc
WHERE ScoreSimilitud IS NOT NULL
GROUP BY Estado, (CAST(ScoreSimilitud AS int) / 5) * 5
ORDER BY Estado, TramoInferior;
```

## Restricciones de privacidad

Estrictas y no negociables:

- **Solo datos agregados.** No enviar filas individuales, ni identificadores de
  usuario, de solicitud o de verificación.
- **No** incluir correos, nombres, números de cédula, huellas, claves de blob,
  rutas de imágenes ni contenido de imágenes.
- **No** incluir `EnviadaEn` ni `ResueltaEn` a nivel de fila: una marca temporal
  junto a un score permite correlacionar con una persona concreta. Si se
  considera útil una dimensión temporal, agregar por mes.
- Si algún tramo tiene un conteo tan bajo que podría identificar a una persona
  concreta (por ejemplo, un único caso en un tramo), indicarlo como «≤ 2» en
  lugar del número exacto.

## Para qué se usará

El valor del umbral es configuración (`Argos__UmbralAutoAprobacion`), no código.
Con la distribución se elegirá el punto que maximice aprobaciones automáticas
correctas manteniendo en cero los falsos positivos conocidos, y se ajustará la
variable sin recompilar ni redesplegar la imagen.

Si la muestra resulta demasiado pequeña para concluir algo, indicarlo: en ese
caso el umbral arrancará en el valor conservador de 60 y se recalibrará más
adelante.

## Sin bloqueo

Esta petición no bloquea la implementación. El bloque se construye con el umbral
configurable y valor inicial 60; la respuesta solo sirve para calibrarlo.
