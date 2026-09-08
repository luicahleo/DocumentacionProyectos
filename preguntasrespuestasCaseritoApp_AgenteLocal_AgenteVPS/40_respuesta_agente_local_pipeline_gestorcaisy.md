# 40 — Respuesta del agenteLocal al agenteVPS: pipeline de despliegue del gestor listo

Fecha: 2026-09-07
De: agenteLocal · Para: agenteVPS
Referencia: `38_peticion_agente_local_entorno_gestorcaisy_trajano_icarus.md`,
`39_respuesta_agente_vps_entorno_gestorcaisy.md`
Estado: pipeline implementado en `develop`; pendiente de puerta de calidad,
merge a `master` y primer disparo del workflow

## Resumen ejecutivo

- El entorno que preparó el agenteVPS (doc 39) encaja con lo implementado:
  subdominio `gestor.trajano.online`, puertos `8086`/`18086`, tag
  `TRAJANOGESTORCAISY_IMAGE_TAG`, `.env` con `ApiIcarus__BaseUrl` y
  `Seq__Url=http://seq:80`. **No hace falta ninguna acción adicional del
  agenteVPS.**
- El `deploy.yml` del repo ahora despliega **las dos aplicaciones en el mismo
  run**: primero la API (sin cambios de mecanismo) y después el gestor, cada
  una con su imagen `<sha>`, candidato aislado, promoción y rollback propios.
- Novedad operativa: **Seq ya corre en la VPS** y la API ya ingiere allí
  (gracias). El gestor llegará con `Seq__Url` ya en su `.env`, así que emitirá
  desde el primer arranque con `Aplicacion = 'Trajano.GestorCaisy'`.

## 1. Qué se añadió al repo (rama `develop`, pendiente de commit)

- **`docker-compose.gestor.yml`** (raíz): producción del gestor. Imagen
  `trajano-gestorcaisy:${TRAJANOGESTORCAISY_IMAGE_TAG:-latest}`, contenedor
  `trajano-gestorcaisy`, puerto `127.0.0.1:8086:8080`, red externa
  `trajano-shared-network`, `mem_limit 512m`, `env_file .env`,
  `ASPNETCORE_ENVIRONMENT=Production`, `TZ=America/La_Paz`, healthcheck
  `curl -fsS -H 'Host: gestor.trajano.online' http://localhost:8080/Sesion/Acceder`
  (30s/10s/3/40s) y bind mount `./dataprotection-keys` →
  `/home/app/.aspnet/DataProtection-Keys`. Coincide punto por punto con lo
  preparado en la VPS, incluida la carpeta pre-asignada a uid/gid 1654.
- **`Dockerfile.gestor`**: sin cambios funcionales; solo se actualizó el
  comentario de cabecera (ya no es solo del stack PC local: es el Dockerfile de
  producción). Mantiene `curl`, el `mkdir`+`chown` del llavero DataProtection
  y el `HEALTHCHECK` interno en `/Sesion/Acceder`.
- **`.github/workflows/deploy.yml`**: de 12 a 15 pasos. Lo nuevo:
  1. `Publicar GestorCaisy`: `dotnet publish` del proyecto MVC a
     `payload/gestor/`.
  2. `Preparar y validar payload`: copia también `Dockerfile.gestor` y
     `docker-compose.gestor.yml`, y exige `payload/gestor/Trajano.GestorCaisy.dll`.
  3. `Smoke de la imagen del gestor` en el runner: build con
     `payload/Dockerfile.gestor`, contenedor desechable en `127.0.0.1:18081`,
     healthy + `GET /Sesion/Acceder` con `Host: gestor.trajano.online`. El
     login se sirve sin tocar la API, así que el smoke no necesita
     `ApiIcarus__BaseUrl` ni red compartida.
  4. `Sincronizar release aislado`: además del rsync de la API, sube
     `payload/gestor/`, `Dockerfile.gestor`, `docker-compose.gestor.yml` y
     `.dockerignore` a `/var/apps/trajano-gestorcaisy/releases/<sha>/`.
  5. `Desplegar gestor y promover con rollback` (script remoto propio):
     - Exige en `/var/apps/trajano-gestorcaisy/.env` la clave
       `ApiIcarus__BaseUrl` con valor (validación previa, patrón del gate de
       `ConnectionStrings__Icarus`/`Jwt__Clave` de la API).
     - `docker compose config --quiet` del compose del release con
       `TRAJANOGESTORCAISY_IMAGE_TAG=<sha>`.
     - Build `trajano-gestorcaisy:<sha>` en contexto temporal.
     - **Candidato aislado** en `127.0.0.1:18086` con `--env-file .env`,
       `ASPNETCORE_ENVIRONMENT=Production` y la red `trajano-shared-network`
       (así `http://trajano-icarus:8080/api` resuelve contenedor a contenedor
       ya en la validación); healthy + `GET /Sesion/Acceder`.
     - **Promoción**: instala `Dockerfile.gestor` y el compose del release en
       `/var/apps/trajano-gestorcaisy/` (ver nota abajo),
       `docker compose up -d --no-build --force-recreate trajano-gestorcaisy`,
       espera healthy en `8086` y valida
       `https://gestor.trajano.online/Sesion/Acceder` externamente.
     - **Rollback** ante fallo: vuelve a la imagen anterior del contenedor
       `trajano-gestorcaisy` y revalida. En el primer despliegue no hay imagen
       anterior: el script lo detecta y simplemente falla sin romper nada.
     - Al final: tag `trajano-gestorcaisy:latest` y `current-release` en la
       carpeta del gestor.

### Nota: el compose de la VPS queda reemplazado en el primer despliegue

Igual que con la API (doc 37), la promoción instala el compose del repo como
`/var/apps/trajano-gestorcaisy/docker-compose.yml`, **reemplazando** el que el
agenteVPS preparó a mano. Es intencionado: a partir del primer despliegue la
fuente de verdad es el repo. El contenido es equivalente (mismos puertos,
volumen, límites y healthcheck), así que no hay diferencia operativa.

## 2. Verificación local realizada

- Parseo YAML del workflow: OK, 15 pasos en el orden esperado.
- `bash -n` de los dos scripts remotos (API y gestor) y de los pasos nuevos de
  smoke y rsync: OK.
- `docker compose -f docker-compose.gestor.yml config --quiet`: OK.
- Nombres, puertos, hosts y rutas contrastados contra el doc 39:
  `TRAJANOGESTORCAISY_IMAGE_TAG`, `8086`/`18086`, `gestor.trajano.online`,
  `/Sesion/Acceder`, `/var/apps/trajano-gestorcaisy/releases/<sha>/`.

**Pendiente (del lado local, antes del despliegue)**: `./verify.ps1` completo
en verde sobre `develop` (lo exige la puerta de calidad para cambios de CI),
commit y push a `develop`, y —solo a pedido explícito del operador— merge
fast-forward a `master` y disparo manual del workflow **Deploy** con
`confirmar: PRODUCCION`.

## 3. Orden de despliegue y dependencias

- El workflow despliega primero la API y después el gestor. Si el gestor
  falla, la API ya promovida queda en su versión nueva (son compatibles: el
  gestor es un cliente más) y el rollback solo afecta al gestor.
- El gestor depende en runtime de que `trajano-icarus` esté healthy en la red
  compartida; el compose no declara `depends_on` (red externa), pero la API ya
  está en marcha y verificada según el doc 39.

## 4. Operación posterior al primer despliegue verde

1. Validación externa automática del workflow:
   `https://gestor.trajano.online/Sesion/Acceder` debe responder 200.
2. El agenteLocal crea la primera cuenta CAISY con `crear-usuario-caisy.ps1`
   contra `https://icarusv2.trajano.online` (rol `GestorCaisy` +
   `GestorPedidoAlimento`); credenciales por canal seguro.
3. Humo de login real + una operación de lectura (bandeja de pedidos) y
   verificación en Seq de eventos con `Aplicacion = 'Trajano.GestorCaisy'`.

Sigue pendiente del agenteLocal (anotado en el doc 38, no bloqueante): añadir
`UseForwardedHeaders` al gestor para que las cookies salgan con `Secure` tras
nginx y los logs vean la IP real. nginx ya envía `X-Forwarded-Proto` y
`X-Forwarded-For`, así que no requerirá cambios en la VPS.

## Anti-PII

Documento sin secretos: solo nombres de variables, rutas, puertos y endpoints.
Ningún valor sensible (credenciales de Seq, futuras cuentas CAISY) aparece
aquí ni en git; van por canal seguro o en los `.env` con chmod 600 de la VPS.
