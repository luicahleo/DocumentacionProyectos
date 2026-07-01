# 04 — ICARUS.API (Endpoints REST, JWT, Swagger, CORS)

**Última actualización:** 2026-06-29 — validado contra código fuente
**Proyecto:** `ICARUS.API` · ASP.NET Core 10 · `net10.0`

API REST consumida por las apps móviles (**IMGA**, **IMCA**) y los kioscos biométricos.
Autenticación **JWT Bearer**, documentación **Swagger/Swashbuckle 8.0.0**, **CORS** para apps móviles.

> `ICARUS.Web` **no** consume esta API (usa CQRS directo sobre la BD). La carpeta `Controllers/Web/`
> está vacía (reservada para uso futuro).

---

## 1. Controllers (10)

| Controller | Ruta base | Propósito |
|------------|-----------|-----------|
| `HealthController` | `api/Health` | health check |
| `ModulosController` | `api/Modulos` | catálogo de módulos / módulos por trabajador |
| `MobileAuthController` | `api/mobile/auth` | login JWT de trabajadores móviles |
| `MobileAppVersionController` | `api/mobile` | control de versión mínima de la app |
| `TrabajadorMobileController` | `api/mobile/trabajador` | módulos asignados al trabajador |
| `RegistroProduccionMobileController` | `api/mobile/registro-produccion` | producción avícola (IMGA) |
| `MobileNotificacionesController` | `api/mobile/notificaciones` | tareas/notificaciones del día (IMGA) |
| `DespachoHuevoController` | `api/mobile/contabilidad/despachos` | despachos de huevo + balance |
| `PedidoAlimentoController` | `api/mobile/contabilidad/pedidos` | pedidos de alimento |
| `IMCAController` | `api/imca` | control de acceso biométrico / kioscos |

Carpetas: `Controllers/Common/` (Health, Modulos), `Controllers/Mobile/` (los 8 restantes).

---

## 2. Endpoints por controller

### HealthController — `api/Health`
- `GET api/Health`

### ModulosController — `api/Modulos`
- `GET api/Modulos`
- `GET api/Modulos/{id}`
- `GET api/Modulos/trabajador/{trabajadorId}`

### MobileAuthController — `api/mobile/auth`
- `POST api/mobile/auth/login`
- `GET  api/mobile/auth/validate`
- `GET  api/mobile/auth/health`

### MobileAppVersionController — `api/mobile`
- `GET api/mobile/check-version`

### TrabajadorMobileController — `api/mobile/trabajador`
- `GET api/mobile/trabajador/modulos`

### RegistroProduccionMobileController — `api/mobile/registro-produccion`
- `GET    api/mobile/registro-produccion/galpones`
- `POST   api/mobile/registro-produccion`
- `GET    api/mobile/registro-produccion/{id}`
- `GET    api/mobile/registro-produccion/historial`
- `PUT    api/mobile/registro-produccion/{id}`
- `DELETE api/mobile/registro-produccion/{id}`

### MobileNotificacionesController — `api/mobile/notificaciones`
- `GET  api/mobile/notificaciones/dia`
- `GET  api/mobile/notificaciones/pendientes`
- `POST api/mobile/notificaciones/vacunacion/completar`
- `POST api/mobile/notificaciones/iluminacion/activar`
- `POST api/mobile/notificaciones/iluminacion/completar`
- `POST api/mobile/notificaciones/alimentacion/completar`
- `POST api/mobile/notificaciones/alimentacion/registrar`

### DespachoHuevoController — `api/mobile/contabilidad/despachos`
- `GET    .../precios`
- `GET    .../` · `GET .../{id}`
- `POST   .../` · `PUT .../{id}`
- `POST   .../{id}/despachar`
- `PUT    .../{id}/foto-recibo`
- `DELETE .../{id}`
- `GET    .../balance`

### PedidoAlimentoController — `api/mobile/contabilidad/pedidos`
- `GET    .../precios`
- `GET    .../` · `GET .../{id}`
- `POST   .../`
- `POST   .../{id}/solicitar`
- `POST   .../{id}/confirmar-recepcion`
- `POST   .../{id}/verificar`
- `PUT    .../{id}` · `DELETE .../{id}`

### IMCAController — `api/imca` (control de acceso / biometría)
- `GET  /ping`
- `POST /auth/login`
- `POST /dispositivos/registrar` · `PUT /dispositivos/{id}/heartbeat`
- `GET  /trabajadores/{clienteId}`
- `POST /biometria/registrar-huella` · `POST /biometria/identificar-huella`
- `POST /biometria/embedding` · `POST /biometria/embedding-mobilefn`
- `GET  /biometria/embeddings/{clienteId}` · `GET /biometria/trabajador-acceso`
- `POST /fotos/subir` · `GET /fotos/descargar/{clienteId}`
- `GET  /validaciones/{trabajadorId}`
- `GET  /registros/ultimo-hoy/{trabajadorId}`
- `POST /registros/crear` · `POST /registros/sincronizar-batch`

> Los controllers delegan en `IMediator.Send(...)`; las respuestas envuelven `OperationResult<T>`.

---

## 3. Autenticación JWT

`ICARUS.API/Program.cs` configura `AddAuthentication().AddJwtBearer(...)`. Parámetros desde
`appsettings.json` sección `JwtSettings`:

```json
"JwtSettings": {
  "SecretKey": "ICARUS-JWT-SECRET-KEY-... (>= 32 chars)",
  "Issuer": "ICARUS.API",
  "Audience": "ICARUS_MOBIL",
  "ExpireHours": "12",
  "RefreshTokenExpireDays": "30"
}
```

- Validación de issuer, audience, vida y firma; `ClockSkew` reducido (~5 min).
- Refresh tokens persistidos (entidad `RefreshToken`, repo `IRefreshTokenRepository`).
- La clave debe tener ≥ 32 caracteres (se valida al arrancar).

---

## 4. Swagger / OpenAPI

`Swashbuckle.AspNetCore 8.0.0`. Esquema de seguridad **Bearer** habilitado para probar endpoints
autenticados. La UI se sirve en Development (en este proyecto, en la raíz `/`).

---

## 5. CORS

Política `AllowMobileApps`: orígenes de localhost, `10.0.2.2` (emulador Android) e IPs de LAN para
dispositivos físicos. Necesaria porque las apps móviles y kioscos llaman desde fuera del host.

---

## 6. Mapa de código

| Concepto | Ruta |
|----------|------|
| Arranque, JWT, Swagger, CORS, MediatR | `ICARUS.API/Program.cs` |
| Controllers comunes | `ICARUS.API/Controllers/Common/` |
| Controllers móviles | `ICARUS.API/Controllers/Mobile/` |
| Filtro de validación | `ICARUS.API/Filters/ValidationExceptionFilter.cs` |
| Configuración | `ICARUS.API/appsettings.json` |

Siguiente: **05-WEB-MVC.md**.
