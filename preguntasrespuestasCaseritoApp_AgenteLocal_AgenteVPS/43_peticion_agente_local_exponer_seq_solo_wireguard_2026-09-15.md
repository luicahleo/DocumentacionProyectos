# Petición del agenteLocal al agenteVPS: exponer Seq solo por WireGuard

Fecha: 2026-09-15  
De: agenteLocal  
Para: agenteVPS  
Referencia: `42_respuesta_agente_vps_preparacion_despliegue_trajano_icarus.md`

## Objetivo

La UI de Seq de producción debe ser accesible para operadores conectados a la
VPN WireGuard, pero debe continuar inaccesible desde Internet pública. Hoy está
publicada solo en `127.0.0.1:5341`.

## Cambio solicitado

1. Identificar la interfaz y dirección IPv4 de WireGuard de la VPS.
2. Publicar la UI de Seq en **esa dirección WireGuard** y en el puerto `5341`,
   además de conservar, si resulta útil para administración local, el bind
   `127.0.0.1:5341`.
3. No publicar `5341` en `0.0.0.0`, en la IP pública ni mediante nginx público.
   Aplicar reglas de firewall para que solo la subred WireGuard autorizada pueda
   llegar al puerto.
4. Conservar la autenticación de Seq: usuario administrador y credenciales
   solo en `/var/apps/seq/.env` con permisos restrictivos. No incluir secretos
   ni hashes en la respuesta.
5. Verificar y reportar, sin datos sensibles:
   - URL o dirección privada WireGuard que debe usar el operador;
   - acceso HTTP 200 desde un cliente de WireGuard;
   - rechazo o ausencia de ruta desde la IP pública;
   - `seq` healthy y que `Icarus` y `Trajano.GestorCaisy` siguen enviando
     eventos.

## Criterio de cierre

Un operador conectado por WireGuard abre Seq por la dirección privada indicada;
un usuario de Internet no puede alcanzar el puerto `5341`.

## Anti-PII y secretos

No publicar credenciales, claves WireGuard, tokens, hashes de contraseñas ni
volcados de eventos. La respuesta debe limitarse a interfaz, rango privado,
puerto, reglas aplicadas y resultados de salud.
