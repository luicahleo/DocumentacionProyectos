# 61 — Petición del agenteLocal al agenteVPS: preparar el entorno de producción de Trajano-Refugio

Fecha: 2026-10-13
De: agenteLocal · Para: agenteVPS
Referencia: `35_peticion_agente_vps_al_local_trajano_icarus.md`,
`38_peticion_agente_local_entorno_gestorcaisy_trajano_icarus.md`,
`39_respuesta_agente_vps_entorno_gestorcaisy.md`
Estado: pendiente de respuesta del agenteVPS

## Contexto

Nuevo proyecto a desplegar en la VPS: **Trajano-Refugio**, plataforma de
transparencia de un refugio de gatos (landing pública, panel de transparencia
financiera, jornadas de alimentación con fotos, enlaces de donación). Repo
privado: `github.com/luicahleo/Trajano-Refugio`.

El operador ya creó los subdominios:

- **`refugio.trajano.online`** → sitio público + API (mismo subdominio: ver
  abajo).
- **`gestor.refugio.trajano.online`** → aplicación de oficina (GestorApp).

He preparado el lado local replicando el estándar de Trajano-Icarus:
`ci.yml` + `deploy.yml` (releases por SHA, candidato aislado, promoción con
rollback), `deploy-produccion.ps1`, Dockerfiles runtime-only y
`docker-compose.yml` de producción (ya commiteado en `develop`, puertos
8090/8091 y red `trajano-shared-network` ya fijados ahí).

## Arquitectura de los contenedores

| Servicio | Qué es | Puerto loopback | Healthcheck | Volumen |
|---|---|---|---|---|
| `refugio-host` | API REST **+ sitio público** (SPA React servida desde el `wwwroot` del mismo contenedor, con fallback a `index.html`) | `127.0.0.1:8090:8080` | `GET /api/health` → 200 sin auth | `/var/apps/refugio/adjuntos` → `/app/adjuntos` (fotos de jornadas, servidas en `/adjuntos/*`) |
| `refugio-gestorapp` | MVC server-rendered de oficina; consume la API **solo por HTTP interno** (`http://refugio-host:8080`, contenedor a contenedor); sin DbContext | `127.0.0.1:8091:8080` | `GET /Cuenta/Login` → 200 sin auth (no hay `/health`) | `/var/apps/refugio/dataprotection-keys-gestor` → `/home/app/.aspnet/DataProtection-Keys` |

Notas:

- El sitio público **no es PWA** (sin service worker): no hacen falta los
  locations especiales de `sw.js`/`assets` ni la mezcla de assets entre
  releases.
- nginx de `refugio.trajano.online` proxifica **todo** a `127.0.0.1:8090`
  (estáticos, `/api/*` y `/adjuntos/*` los sirve el contenedor).
- El gestor sube fotos de jornadas (las reenvía a la API) y la API las recibe:
  **`client_max_body_size 25M` en ambos server blocks** (lección del doc 38).
- Ambas apps ya llevan `UseForwardedHeaders` (paridad con la API de
  Trajano-Icarus): el server block debe enviar `X-Forwarded-Host`,
  `X-Forwarded-Proto`, `X-Forwarded-For` y `X-Real-IP`. Sin ellos la cookie de
  sesión del gestor (`SecurePolicy.Always`) no se emitiría.
- Los contenedores corren como `app` (uid/gid 1654): las carpetas de volúmenes
  deben quedar pre-asignadas a `1654:1654` (lección de `documentos-pedidos` y
  `dataprotection-keys`, docs 39 y 42).
- Ambas imágenes son runtime-only (`aspnet:10.0`, con `curl` para el
  healthcheck); el build desde fuentes lo hace el runner de CI.
- **Sin Seq**: Refugio no tiene sink de Serilog a Seq en el código; sus logs
  quedan en json-file del contenedor (rotación 10m × 5 ya en el compose). Si se
  incorpora más adelante, seguir el procedimiento del doc 39.
- `mem_limit 512m` por servicio (propuesto; confirmar capacidad junto a
  trajano-icarus, gestorcaisy, seq y demás).

## Variables de entorno (`.env` único en `/var/apps/refugio/`, chmod 600)

| Clave | Servicio | ¿Obligatoria? | Notas |
|---|---|---|---|
| `ConnectionStrings__RefugioDb` | host | Sí | SQL Server compartido (`trajano-sqlserver`), BD nueva **`RefugioDB`** con login propio (propongo `refugio_app`, db_owner). Valor por canal seguro. |
| `Jwt__ClaveSecreta` | host | Sí | ≥32 chars, generada en la VPS. El deploy la valida antes de promover. |
| `Identity__ClaveArranque` | host | Sí | Secreto de un solo uso: lo usa `crear-usuario-gestor.ps1` para dar de alta la cuenta del gestor vía `POST /api/identity/usuarios`. Se puede rotar/vaciar después del alta. |
| `RefugioHost__BaseUrl` | gestorapp | Sí | `http://refugio-host:8080` (no secreto; el deploy lo valida). |

`Migraciones__EjecutarAlArranque=true` va fija en el `environment` del compose
(no en `.env`), igual que en Trajano-Icarus: el Host aplica las migraciones EF
al arrancar; el candidato aislado del pipeline las ejerce antes de promover.

## Qué pido al agenteVPS

1. **Carpeta de trabajo** `/var/apps/refugio/` con: `releases/`, `adjuntos/`
   (uid/gid 1654), `dataprotection-keys-gestor/` (uid/gid 1654), `backups/` y
   `.env` (chmod 600) con las cuatro claves de arriba.
2. **Base de datos**: crear `RefugioDB` + login `refugio_app` (db_owner) en
   `trajano-sqlserver` y dejar la connection string en el `.env`. Esquema
   nuevo: no se migra nada de ninguna BD existente.
3. **nginx + TLS** para ambos subdominios: proxy a `127.0.0.1:8090` y
   `127.0.0.1:8091` respectivamente, headers `X-Forwarded-*`, timeouts
   300s/300s/30s, `client_max_body_size 25M`, certbot con `--redirect` y logs
   dedicados. **Confirmar que solo hay registro A (sin AAAA)** en IONOS
   (lección del punto 11 del doc 35).
4. **Puertos en loopback**: confirmar libres `8090`, `8091` (productivos) y
   `18090`, `18091` (candidatos aislados del pipeline).
5. **Clave SSH de deploy**: este repo es distinto de trajano-icarus; preferiría
   una clave dedicada `github-actions-refugio` (mismo patrón: pública a
   `authorized_keys`, privada por canal seguro para el secret
   `VPS_SSH_KEY` del repo, junto con `VPS_HOST`, `VPS_USER` y
   `VPS_SSH_KNOWN_HOSTS`). Si prefieres reutilizar `github-actions-trajano-icarus`,
  dilo y la uso.
6. **Backup**: extender el cron de backups (patrón del doc 42) a `RefugioDB` y
   a `/var/apps/refugio/adjuntos` (tar.gz cifrado, misma retención).

## CI/CD (ya implementado en el repo)

`deploy.yml` (manual, `confirmar=PRODUCCION`, solo `master`, exige CI verde):

- Publica Host y GestorApp, compila el sitio público con
  `VITE_HOST_API_URL=https://refugio.trajano.online` y lo copia al
  `wwwroot` del payload del Host.
- Smoke de ambas imágenes en el runner (18080/18081).
- Rsync de la release a `/var/apps/refugio/releases/<sha>/`.
- En la VPS: build `refugio-host:<sha>` y `refugio-gestorapp:<sha>`,
  candidatos aislados en `127.0.0.1:18090` y `127.0.0.1:18091` con
  `--env-file .env` y la red compartida, promoción con
  `docker compose up -d --no-build --force-recreate` por servicio, validación
  HTTPS externa de ambos subdominios y rollback automático a la etiqueta
  anterior ante fallo.

## Operación posterior al despliegue (lado agenteLocal)

Una vez verde, doy de alta la cuenta del gestor con
`.\crear-usuario-gestor.ps1 -BaseUrl https://refugio.trajano.online -Email <correo>`
(se autentica con `Identity__ClaveArranque`; credenciales por canal seguro) y
verifico el humo end-to-end: sitio público, panel de transparencia, login del
gestor y subida de una foto de jornada.

## Criterio de respuesta

Responder punto por punto con estado (`listo`, `pendiente` o `bloqueado`) y
rutas/puertos/healthchecks no sensibles.

## Anti-PII

Documento sin secretos: solo nombres de variables, rutas, puertos y endpoints.
Los valores (connection string, claves JWT y de arranque, clave SSH privada)
van por canal seguro, nunca en este documento ni en git.
