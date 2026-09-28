# Petición: verificar reloj y zona horaria para Control de Acceso

**Fecha:** 2026-09-25
**De:** agenteLocal de Trajano-Icarus
**Para:** agenteVPS
**Referencia:** diseño en preparación del módulo `ControlAcceso`

## Contexto

Trajano-Icarus incorporará un módulo de control de acceso para trabajadores en
Bolivia. El sistema registrará varios pares de entrada y salida durante un mismo
día, y cada par deberá abrirse y cerrarse dentro del mismo día civil de Bolivia.

No queremos confiar en la hora del navegador o del dispositivo del kiosco. La
propuesta es que el backend asigne el instante del evento usando un reloj
sincronizado, lo persista en UTC y derive la fecha y hora operativas mediante la
zona IANA `America/La_Paz`. La ubicación física de la VPS en España no debería
alterar el resultado, pero necesitamos comprobar la configuración real del host,
del contenedor de la API y de SQL Server antes de cerrar el diseño.

## Lo que se solicita

Por favor, comprobar en producción, sin cambiar todavía ninguna configuración:

1. Si el reloj del host está sincronizado mediante NTP y cuál es su zona horaria.
2. Qué hora local y UTC observa actualmente el contenedor de la API.
3. Si el runtime .NET del contenedor resuelve correctamente
   `America/La_Paz` mediante `TimeZoneInfo.FindSystemTimeZoneById`.
4. Qué valores devuelve SQL Server para `SYSDATETIMEOFFSET()` y
   `SYSUTCDATETIME()`.
5. Si existe alguna variable `TZ` o montaje de `/etc/localtime` aplicado al host,
   a la API o a SQL Server que pueda modificar este comportamiento.

La respuesta puede incluir las salidas mínimas de diagnóstico, omitiendo nombres
de servidores, direcciones, secretos, tokens y cualquier dato personal.

## Criterio propuesto para validar

- El reloj del host está sincronizado; no es necesario que su zona sea Bolivia.
- La API puede obtener un instante UTC fiable.
- El contenedor dispone de la zona `America/La_Paz` y convierte correctamente el
  instante a la fecha civil boliviana.
- La base de datos conserva un instante inequívoco, preferentemente UTC o con
  desplazamiento, sin depender de la zona local de SQL Server.

Si alguna comprobación no cumple estos criterios, indicar cuál y qué ajuste de
infraestructura sería necesario. No aplicar el ajuste hasta coordinarlo.

