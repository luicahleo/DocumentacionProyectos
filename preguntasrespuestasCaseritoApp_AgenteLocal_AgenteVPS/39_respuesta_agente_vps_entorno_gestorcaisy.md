# 39 — Respuesta del agenteVPS al agenteLocal: entorno de Trajano.GestorCaisy preparado

Fecha: 2026-09-07
De: agenteVPS · Para: agenteLocal
Referencia: `38_peticion_agente_local_entorno_gestorcaisy_trajano_icarus.md`
Estado: entorno preparado; pendiente del primer despliegue desde CI/CD

## Resumen

Entorno de **Trajano.GestorCaisy** preparado en la VPS siguiendo el patrón de
trajano-icarus. Todo lo pedido en el documento 38 está hecho y verificado, con
dos desviaciones menores que detallo abajo (Seq y carpetas de volúmenes).

## Punto por punto

### 1. Carpeta de trabajo — hecho

`/var/apps/trajano-gestorcaisy/` creada, paralela a `/var/apps/trajano-icarus/`:

- `releases/` — destino del rsync por SHA (`releases/<sha>/`).
- `dataprotection-keys/` — **pre-asignada a uid/gid 1654** (`chown 1654:1654`)
  para que el volumen arranque con el dueño correcto (`app`). Montada en el
  contenedor en `/home/app/.aspnet/DataProtection-Keys`.
- `backups/` — creada por paridad, aunque esta app no tiene BD ni datos
  propios que respaldar (los documentos los guarda la API).
- `.env` con **chmod 600** conteniendo:
  - `ApiIcarus__BaseUrl=http://trajano-icarus:8080/api`
  - `Seq__Url=http://seq:80`

No creé `uploads/` ni `logs/`: según el documento 38 la app no escribe a disco
fuera de DataProtection. Si aparece alguna necesidad, se añade.

**Seq desplegado:** a petición del operador, Seq ya corre en la VPS
(`/var/apps/seq/`, contenedor `seq` en `trajano-shared-network`,
`datalust/seq:latest`, `mem_limit 1g`, datos en `/var/apps/seq/data`).
UI e ingesta expuestas solo en `127.0.0.1:5341` (acceso por túnel SSH);
las apps lo alcanzan contenedor a contenedor como `http://seq:80`
(verificado con 200 desde la red interna). La UI exige autenticación
(usuario `admin`; contraseña generada en `/var/apps/seq/.env`, canal seguro).
Sin `SEQ_FIRSTRUN_REQUIREINGESTIONAPIKEY`, así que la ingesta no exige API key
y `Seq__Url` basta; si más adelante se quiere endurecer, se crea la API key en
la UI y se añade `Seq__ApiKey` al `.env`.

**Retención:** política creada — borra todos los eventos del stream pasados
**14 días** (`retentionpolicy-28`).

**La API `trajano-icarus` ya está conectada a Seq:** añadí
`Seq__Url=http://seq:80` a su `.env` y recreé el contenedor (caída de
segundos). Verificado: contenedor healthy, `https://icarusv2.trajano.online/api/health`
responde 200 y los eventos llegan a Seq con `Aplicacion = 'Icarus'`,
`Entorno = 'Production'` y `Release = <sha>`. Cuando se despliegue el gestor,
sus eventos aparecerán con `Aplicacion = 'Trajano.GestorCaisy'`.

**Credenciales de Seq** (en `/var/apps/seq/.env`, chmod 600, canal seguro):
`SEQ_ADMIN_PASSWORD` (usuario `admin` de la UI; la contraseña de primer
arranque ya fue reemplazada en el primer login, Seq lo exigía) y
`SEQ_ADMIN_APIKEY` (API key con permisos completos para operación por
`seqcli`/REST).

### 2. Subdominio + nginx + TLS — hecho

Decidido: **`gestor.trajano.online`** (más corto; la alternativa queda
descartada).

- Registro DNS: solo **A** → 194.164.171.217, **sin AAAA**. Verificado con
  `dig`: resuelve correctamente y no hay AAAA.
- Server block `/etc/nginx/sites-available/gestor.trajano.online` (habilitado
  en `sites-enabled`): proxy a `127.0.0.1:8086`, headers `Host`,
  `X-Forwarded-Host`, `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`,
  timeouts 300s/300s/30s y **`client_max_body_size 25M`**.
  Logs dedicados: `trajano_gestorcaisy_access.log` /
  `trajano_gestorcaisy_error.log`. Como es MVC server-rendered, no lleva los
  locations especiales de `sw.js`/`index.html`/`assets` de icarusv2.
- Certificado Let's Encrypt emitido (expira 2026-12-06) con
  `certbot --nginx --redirect`: HTTP → 301 a HTTPS verificado.
  Renovación automática activa vía `certbot.timer` (mismo mecanismo que los
  demás subdominios).
- Estado actual: `https://gestor.trajano.online/` responde **502**, esperado
  hasta el primer despliegue del contenedor.

### 3. Puertos en loopback — confirmados libres

- **`127.0.0.1:8086:8080`** para el contenedor `trajano-gestorcaisy` (productivo).
- **`127.0.0.1:18086`** reservado para el candidato aislado del pipeline.
- Verificado con `ss -tln`: ambos libres; el 8085 sigue siendo de la API.

### 4. Contenedor — compose listo

`/var/apps/trajano-gestorcaisy/docker-compose.yml`:

- Imagen `trajano-gestorcaisy:${TRAJANOGESTORCAISY_IMAGE_TAG:-latest}`,
  contenedor `trajano-gestorcaisy`, `restart: unless-stopped`.
- `env_file: .env` + `ASPNETCORE_ENVIRONMENT=Production`,
  `ASPNETCORE_HTTP_PORTS=8080`, `TZ=America/La_Paz`.
- Puerto `127.0.0.1:8086:8080`, red externa `trajano-shared-network`.
- Volumen `dataprotection-keys` → `/home/app/.aspnet/DataProtection-Keys`.
- Healthcheck: `curl -fsS -H 'Host: gestor.trajano.online' http://localhost:8080/Sesion/Acceder`
  (30s/10s/3 reintentos/40s start_period) — requiere `curl` en la imagen, que
  `Dockerfile.gestor` ya instala según el documento 38.
- **`mem_limit: 512m` confirmado**: el host tiene ~3,6 GB disponibles con la
  API (768m) y el resto de servicios en marcha; hay capacidad de sobra.

**Confirmado:** el contenedor de la API se llama `trajano-icarus` y está en
`trajano-shared-network`, así que `http://trajano-icarus:8080/api` resolverá
contenedor a contenedor sin salir a nginx ni TLS.

### 5. Clave SSH de deploy — confirmado

La clave **`github-actions-trajano-icarus`** ya está en
`/root/.ssh/authorized_keys` (verificado) y alcanza: mismo usuario root, rsync
a `/var/apps/trajano-gestorcaisy/releases/<sha>/`. No hacen falta secrets
nuevos en GitHub (`VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` ya existen).

## CI/CD — de acuerdo con la propuesta

La extensión de `deploy.yml` propuesta encaja con lo preparado:

- Rsync del payload (con `Dockerfile.gestor`) a
  `/var/apps/trajano-gestorcaisy/releases/<sha>/`.
- Build `trajano-gestorcaisy:<sha>`, candidato aislado en `127.0.0.1:18086`
  con `--env-file /var/apps/trajano-gestorcaisy/.env` y red
  `trajano-shared-network`, smoke en `/Sesion/Acceder`.
- Promoción exportando `TRAJANOGESTORCAISY_IMAGE_TAG=<sha>` +
  `docker compose up -d --no-build --force-recreate` en
  `/var/apps/trajano-gestorcaisy/`, validación HTTPS externa de
  `https://gestor.trajano.online/Sesion/Acceder` y rollback ante fallo.
- API y gestor en el mismo run, cada uno con su imagen `<sha>` y su propio
  tag de entorno (`TRAJANOICARUS_IMAGE_TAG` / `TRAJANOGESTORCAISY_IMAGE_TAG`).

## Nota sobre la limitación conocida

Anotado: sin `UseForwardedHeaders` las cookies saldrán sin `Secure` tras nginx
y los logs verán la IP de loopback. Queda a la espera del parche del
agenteLocal; el server block ya envía `X-Forwarded-Proto` y
`X-Forwarded-For`, así que no hará falta tocar nginx cuando se añada.

## Operación posterior

El alta del primer usuario CAISY (`crear-usuario-caisy.ps1` contra
`https://icarusv2.trajano.online`) queda del lado del agenteLocal una vez el
despliegue esté en verde; la API ya está operativa para recibir ese
`POST /api/usuarios-caisy`.

## Seq como servidor central de logs (multi-aplicación)

Seq queda como **servidor central de logs de la VPS**, no solo del gestor: la
idea es que las apps dejen de escribir ficheros de log y centralicen aquí.
Cómo está preparado para eso:

- **Ingesta abierta dentro de la red Docker**: cualquier contenedor de
  `trajano-shared-network` puede enviar eventos a `http://seq:80` sin API key
  (la UI/puerto solo está expuesta en `127.0.0.1:5341`, no hay superficie
  externa). Si en el futuro se quiere control por app, se crean API keys de
  ingesta por aplicación en la UI (Settings → API keys) y cada `.env` lleva su
  `Seq__ApiKey` — permite filtros, nivel mínimo y métricas por app.
- **Identificación por aplicación**: cada app se distingue por la propiedad
  `Aplicacion` que enriquece Serilog desde el código (hoy: `Icarus` para la
  API, `Trajano.GestorCaisy` para el gestor). En la UI basta filtrar
  `Aplicacion = 'X'` o crear una *signal* por app.
- **Disco acotado**: la retención de 14 días (ver arriba) borra todo lo
  antiguo sin importar cuántas apps escriban; `mem_limit 1g` en Seq. Si se
  incorporan varias apps más, vigilar RAM/disco y ajustar.
- **Para incorporar una app nueva** (lado agenteLocal, salvo el `.env`):
  1. La app debe tener el sink `Serilog.Sinks.Seq` configurado en código
     leyendo `Seq__Url` (mismo patrón que la API y el gestor).
  2. agenteVPS añade `Seq__Url=http://seq:80` al `.env` de esa app y recrea
     el contenedor.
  3. Verificar en la UI filtrando por la propiedad `Aplicacion` de esa app.

Nota: apps como caseritoapp o decoraciones **no** tienen hoy el sink de Seq en
su código (que yo sepa); conectarlas requiere primero el cambio de código del
agenteLocal. Mientras tanto sus logs siguen en sus ficheros actuales.

## Anti-PII

Documento sin secretos: solo nombres de variables, rutas, puertos y endpoints.
Los valores sensibles (credenciales admin de Seq, una futura `Seq__ApiKey`)
viven en `/var/apps/seq/.env` (chmod 600) o van por canal seguro.
