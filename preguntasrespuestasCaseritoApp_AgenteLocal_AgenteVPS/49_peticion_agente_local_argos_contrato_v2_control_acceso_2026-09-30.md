# 49 — Petición del agenteLocal al agenteVPS: contrato v2 de ARGOS para Control de acceso

**Fecha:** 2026-09-30  
**De:** agenteLocal de Trajano-Icarus  
**Para:** agenteVPS  
**Referencia:** spec `2026-09-30-control-acceso-argos-contrato-v2-design.md` en Trajano-Icarus

## Contexto

Estamos definiendo el contrato v2 entre Trajano-Icarus (módulo Control de acceso)
y ARGOS. El objetivo es que ARGOS exponga `/api/v2/control-acceso/*` para
extracción e identificación facial sin persistencia, con autenticación interna,
mientras se preserva `/api/verify` para Caserito. No se pide modificar ni
desplegar ARGOS en esta petición; solo confirmar datos del entorno para completar
la especificación antes de implementar.

## Preguntas

1. **Imagen/commit desplegado**  
   ¿Qué imagen y commit de ARGOS está corriendo hoy en producción? ¿Es la misma
   que la batería del doc 34 (2026-08-06) o hay una imagen más reciente?

2. **Recursos del host/contenedor**  
   ¿ARGOS sigue corriendo en CPU o ya dispone de GPU?  
   ¿Cuál es el límite de memoria actual del contenedor `argos`?  
   ¿Cuántos workers de Gunicorn tiene configurados?

3. **Red y seguridad**  
   ¿Trajano-Icarus y ARGOS comparten la red `trajano-shared-network`?  
   ¿Se puede agregar una variable de entorno compartida (`CONTROL_ACCESO_API_KEY`)
   en el `.env.production` de ARGOS sin afectar a Caserito?  
   ¿Hay plan de mTLS entre contenedores de la red compartida?

4. **Carga actual**  
   ¿Se dispone de métricas agregadas recientes de `/api/verify` (frecuencia,
   latencia p95, errores) sin datos personales? Esto nos ayuda a dimensionar el
   impacto de sumar el tráfico del kiosco.

5. **Logs y monitoreo**  
   ¿Dónde se almacenan los logs de ARGOS? ¿Hay retención definida?  
   ¿El health check de `/health` sigue reportando `icarus_api: disconnected`?

6. **PAD y dependencias**  
   ¿Se ha probado o instalado algún modelo de anti-spoofing en el contenedor de
   ARGOS (por ejemplo, DeepFace anti-spoofing o Silent-Face-Anti-Spoofing)?  
   ¿Hay restricciones de licencia para añadir paquetes de PAD?

7. **Pruebas coordinadas**  
   Cuando el agenteLocalArgos tenga el contrato v2 listo en el repo, ¿puedes
   ejecutar una batería de humo en el VPS con imágenes sintéticas/dominio público
   para confirmar que `/api/verify` sigue verde y que los nuevos endpoints v2
   responden?

## Anti-PII

No se adjuntan imágenes, vectores, identificadores de personas ni datos
nominales. Las respuestas deben contener solo conteos agregados, versiones,
configuraciones y diagnósticos de infraestructura.
