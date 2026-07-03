# Plan de Pruebas — IMGA (ICARUS Mobile Gestión Avícola)

> **Fecha**: 2026-04-27 | **Entorno**: Emulador Android x86_64 + API Local  
> **Script de análisis de logs**: `C:\Users\Usuario\source\repos\ICARUS_MOBILE\Analizar-Logs-IMGA.ps1`

---

## Cómo usar este documento

1. Ejecuta el emulador y lanza IMGA desde Visual Studio 2022 en modo Debug.
2. Mantén la API local corriendo (`dotnet run --launch-profile http` en `ICARUS.API`).
3. Después de cada caso de prueba, ejecuta el script para analizar la traza:
   ```powershell
   .\Analizar-Logs-IMGA.ps1 -CasoTest "TC01" -MinutosAtras 5
   ```
4. Marca el checkbox `- [x]` cuando el caso pase. Anota observaciones si falla.

---

## Prerequisitos

### TC00 — Verificar entorno antes de empezar

| # | Paso | Logs esperados |
|---|------|---------------|
| 1 | API local corriendo en `http://localhost:5090` | `icarus-api.log`: `🚀 Sistema de logging inicializado` |
| 2 | Emulador arrancado (emulator-5554) | — |
| 3 | `USE_PRODUCTION_IN_DEBUG = false` en `MauiProgram.cs` | — |
| 4 | `logMobile.txt` limpio (o vacio desde última sesión) | — |

- [ ] **TC00.1** — La API responde en `http://localhost:5090/api/mobile/check-version`
- [ ] **TC00.2** — Swagger accesible en `http://localhost:5090/index.html`
- [ ] **TC00.3** — El emulador puede alcanzar `http://10.0.2.2:5090/api/` (misma IP interna del host)

```powershell
# Verificar conectividad de la API desde PowerShell
Invoke-WebRequest -Uri "http://localhost:5090/api/mobile/check-version" -UseBasicParsing | Select-Object StatusCode
```

---

## TC01 — Login exitoso

**Objetivo**: El trabajador puede autenticarse con credenciales válidas y la app navega a la pantalla principal.

### Pasos
- [ ] **TC01.1** — Abrir IMGA. La pantalla de Login está visible.
- [ ] **TC01.2** — Ingresar email válido y contraseña correcta.
- [ ] **TC01.3** — Presionar "Iniciar sesión".
- [ ] **TC01.4** — La app muestra indicador de carga durante el proceso.
- [ ] **TC01.5** — La app navega a la pantalla principal / selector de módulos.
- [ ] **TC01.6** — El módulo "Gestor Avícola" aparece disponible.

### Trazas esperadas en logs

**`logMobile.txt`** (en orden):
```
[LoginViewModel] Iniciando proceso de login desde UI
[Authentication] Iniciando proceso de autenticación para: <email>
[Authentication] Enviando petición de autenticación a API: http://10.0.2.2:5090/api/mobile/auth/login
[Authentication] Respuesta exitosa de API recibida
[Authentication] Autenticación exitosa con API real
[LoginViewModel] Login exitoso para trabajador: <nombre>
[CacheSyncService] Iniciando sincronización de datos iniciales para modo offline
[CacheSyncService] Caché de galpones actualizado exitosamente
[LoginViewModel] Navegando a selector de módulos después del login exitoso
```

**`icarus-api.log`**:
```
📄 Request: POST /api/mobile/auth/login from 10.0.2.2
✅ Response: 200 for POST /api/mobile/auth/login
📄 Request: GET /api/gestion-avicola/galpon (o similar) from 10.0.2.2
✅ Response: 200 for GET /api/.../galpon
```

```powershell
.\Analizar-Logs-IMGA.ps1 -CasoTest "TC01" -MinutosAtras 5
```

---

## TC02 — Login fallido (credenciales incorrectas)

**Objetivo**: El sistema rechaza credenciales inválidas con mensaje claro y sin crash.

### Pasos
- [ ] **TC02.1** — En la pantalla de Login, ingresar email válido y contraseña INCORRECTA.
- [ ] **TC02.2** — Presionar "Iniciar sesión".
- [ ] **TC02.3** — La app muestra un mensaje de error (no crash, no pantalla en blanco).
- [ ] **TC02.4** — El formulario sigue visible y editable.
- [ ] **TC02.5** — Repetir con email vacío → debe mostrar validación de campo requerido.
- [ ] **TC02.6** — Repetir con email inválido (formato) → debe mostrar validación de formato.

### Trazas esperadas en logs

**`logMobile.txt`**:
```
[LoginViewModel] Iniciando proceso de login desde UI
[Authentication] Iniciando proceso de autenticación para: <email>
[Authentication] Fallo en autenticación. Status: 401 (o 400)
[LoginViewModel] Login falló: <mensaje de la API>
```

**`icarus-api.log`**:
```
📄 Request: POST /api/mobile/auth/login from 10.0.2.2
❌ Response: 401 for POST /api/mobile/auth/login   (o ninguna entrada si validación es en cliente)
```

```powershell
.\Analizar-Logs-IMGA.ps1 -CasoTest "TC02" -MinutosAtras 5 -SoloErrores
```

---

## TC03 — Sesión persistente (reabrir app sin logout)

**Objetivo**: Si el usuario cierra y reabre la app sin hacer logout, la sesión se mantiene activa (token en `SecureStorage`).

### Pasos
- [ ] **TC03.1** — Completar TC01 (login exitoso).
- [ ] **TC03.2** — Cerrar la app desde el emulador (botón atrás o recent apps → cerrar).
- [ ] **TC03.3** — Reabrir IMGA.
- [ ] **TC03.4** — La app NO debe mostrar la pantalla de Login.
- [ ] **TC03.5** — La app navega directamente a la pantalla principal.

### Trazas esperadas en logs

**`logMobile.txt`** (al reabrir):
```
[SessionStart] === NUEVA SESIÓN INICIADA ===
[LoginViewModel] No hay sesión activa, esperando credenciales del usuario   ← NO debe aparecer
```
> Si aparece "No hay sesión activa" → el token no se persistió correctamente.

```powershell
.\Analizar-Logs-IMGA.ps1 -CasoTest "TC03" -MinutosAtras 3
```

---

## TC04 — Logout limpia sesión local

**Objetivo**: Al hacer logout, se limpia el `SecureStorage`, la sesión SQLite local y se regresa al Login.

### Pasos
- [ ] **TC04.1** — Estando en la pantalla principal, hacer logout (icono o menú).
- [ ] **TC04.2** — La app navega a la pantalla de Login.
- [ ] **TC04.3** — Cerrar y reabrir la app → debe mostrar la pantalla de Login (sesión borrada).
- [ ] **TC04.4** — No deben quedar datos de sesión anteriores visibles.

### Trazas esperadas en logs

**`logMobile.txt`**:
```
[Authentication] Iniciando proceso de logout
[Authentication] Token antes del logout: Existe
[Authentication] Sesión SQLite limpiada en logout
[Authentication] Token después del logout: Eliminado correctamente
[Authentication] Logout completado exitosamente - Sesión completamente eliminada
```

> ⚠️ Si aparece `Token después del logout: AÚN EXISTE - ERROR` → bug crítico, el token no se eliminó.

```powershell
.\Analizar-Logs-IMGA.ps1 -CasoTest "TC04" -MinutosAtras 3
```

---

## TC05 — Caché de galpones post-login

**Objetivo**: Después del login, los galpones de la API se guardan en SQLite local y aparecen en el selector al crear un registro.

### Pasos
- [ ] **TC05.1** — Completar TC01 (login exitoso).
- [ ] **TC05.2** — Navegar a "Registros de Producción" → "Nuevo Registro".
- [ ] **TC05.3** — El selector de galpón muestra al menos un galpón disponible.
- [ ] **TC05.4** — Los galpones mostrados corresponden a la granja asignada al trabajador.

### Trazas esperadas en logs

**`logMobile.txt`**:
```
[CacheSyncService] Iniciando sincronización de datos iniciales para modo offline
[CacheSyncService] Actualizando caché de galpones
[CacheSyncService] Caché de galpones actualizado exitosamente
```

> ⚠️ Si aparece `No se pudo actualizar el caché de galpones` → la API de galpones falló. Revisar `icarus-api.log`.

```powershell
.\Analizar-Logs-IMGA.ps1 -CasoTest "TC05" -MinutosAtras 5
```

---

## TC06 — Crear registro de producción (con conexión)

**Objetivo**: Crear un registro de producción diaria exitosamente con la API disponible.

### Pasos
- [ ] **TC06.1** — Navegar a "Registros de Producción" → "Nuevo Registro".
- [ ] **TC06.2** — Seleccionar un galpón del selector.
- [ ] **TC06.3** — Ingresar cantidad de maples (ej: 10) y unidades incompletas (ej: 5).
- [ ] **TC06.4** — Total de huevos calculado correctamente: `(10 × 30) + 5 = 305`.
- [ ] **TC06.5** — Presionar "Guardar".
- [ ] **TC06.6** — La app muestra mensaje de éxito.
- [ ] **TC06.7** — El registro aparece en el historial.

### Trazas esperadas en logs

**`icarus-api.log`**:
```
📄 Request: POST /api/.../registro-produccion from 10.0.2.2
✅ Response: 200/201 for POST /api/.../registro-produccion
```

```powershell
.\Analizar-Logs-IMGA.ps1 -CasoTest "TC06" -MinutosAtras 5
```

---

## TC07 — Historial de registros

**Objetivo**: El listado de registros históricos muestra los datos correctamente.

### Pasos
- [ ] **TC07.1** — Navegar a "Historial de Registros".
- [ ] **TC07.2** — La lista carga y muestra registros.
- [ ] **TC07.3** — Los datos (fecha, galpón, maples, total) son correctos.
- [ ] **TC07.4** — El scroll funciona sin errores.

```powershell
.\Analizar-Logs-IMGA.ps1 -CasoTest "TC07" -MinutosAtras 5
```

---

## TC08 — Modo offline: crear registro sin conexión

**Objetivo**: Sin red disponible, los registros se guardan localmente en SQLite.

### Pasos
- [ ] **TC08.1** — Completar TC01 (login y caché cargado con conexión).
- [ ] **TC08.2** — En el emulador: `Settings → Network & internet → desactivar WiFi y datos móviles`.
- [ ] **TC08.3** — En IMGA, la app muestra indicador de modo offline.
- [ ] **TC08.4** — Crear un registro de producción → debe guardar localmente sin error.
- [ ] **TC08.5** — La app confirma que el registro fue guardado en modo offline.

### Trazas esperadas en logs

**`logMobile.txt`**:
```
[Connectivity] Red no disponible / modo offline
[RegistroOffline] Guardando registro localmente (modo offline)
```

> No deben aparecer llamadas a `10.0.2.2` en `icarus-api.log` mientras está offline.

```powershell
.\Analizar-Logs-IMGA.ps1 -CasoTest "TC08" -MinutosAtras 5
```

---

## TC09 — Sincronización offline → online

**Objetivo**: Al recuperar la conexión, los registros pendientes se sincronizan con la API.

### Pasos
- [ ] **TC09.1** — Con registros offline pendientes de TC08, reactivar la red.
- [ ] **TC09.2** — La app detecta la reconexión y dispara sincronización automática.
- [ ] **TC09.3** — Los registros pendientes se envían a la API.
- [ ] **TC09.4** — Los registros ya no aparecen como "pendientes" en la app.
- [ ] **TC09.5** — En la API, los registros aparecen como creados.

### Trazas esperadas en logs

**`logMobile.txt`**:
```
[Connectivity] Red disponible - reconectado
[SyncService] Iniciando sincronización de registros pendientes
[SyncService] Sincronización completada
```

**`icarus-api.log`**:
```
📄 Request: POST /api/.../registro-produccion from 10.0.2.2
✅ Response: 200/201
```

```powershell
.\Analizar-Logs-IMGA.ps1 -CasoTest "TC09" -MinutosAtras 10
```

---

## TC10 — Renovación automática de token (Token Refresh)

**Objetivo**: Cuando el access token expira (12h), el refresh token (30d) renueva el acceso sin forzar login.

### Pasos (simplificado para prueba)
- [ ] **TC10.1** — Verificar en la BD que el trabajador tiene un RefreshToken vigente (`RefreshToken` table en ICARUSDB).
- [ ] **TC10.2** — Modificar temporalmente el tiempo de expiración del access token a 1 minuto en `appsettings.Development.json`.
- [ ] **TC10.3** — Hacer login y esperar más de 1 minuto.
- [ ] **TC10.4** — Realizar alguna acción que requiera API (listar registros).
- [ ] **TC10.5** — La app renueva el token silenciosamente (sin redirigir al login).
- [ ] **TC10.6** — Restaurar el tiempo de expiración original.

### Trazas esperadas en logs

**`logMobile.txt`**:
```
[Authentication] Iniciando renovación de token
[Authentication] Token renovado exitosamente
```

**`icarus-api.log`**:
```
📄 Request: POST /api/mobile/auth/refresh-token from 10.0.2.2
✅ Response: 200 for POST /api/mobile/auth/refresh-token
```

```powershell
.\Analizar-Logs-IMGA.ps1 -CasoTest "TC10" -MinutosAtras 10
```

---

## Resumen de Estado

| Caso | Descripción | Estado |
|------|-------------|--------|
| TC00 | Prerequisitos / Entorno | ⬜ Pendiente |
| TC01 | Login exitoso | ⬜ Pendiente |
| TC02 | Login fallido | ⬜ Pendiente |
| TC03 | Sesión persistente | ⬜ Pendiente |
| TC04 | Logout limpia sesión | ⬜ Pendiente |
| TC05 | Caché de galpones | ⬜ Pendiente |
| TC06 | Crear registro (online) | ⬜ Pendiente |
| TC07 | Historial de registros | ⬜ Pendiente |
| TC08 | Modo offline | ⬜ Pendiente |
| TC09 | Sincronización offline→online | ⬜ Pendiente |
| TC10 | Token refresh | ⬜ Pendiente |

> Actualizar estado: ✅ Pasó | ❌ Falló | ⚠️ Parcial | ⬜ Pendiente
