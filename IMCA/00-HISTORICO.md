# IMCA — Histórico del Proyecto

**Última actualización:** 2026-06-29 — validado contra código fuente

Este documento conserva el contexto histórico de IMCA. La documentación técnica vigente
(alineada con el código real) está en `README.md`, `01-ARQUITECTURA.md`, `02-MODELO-DATOS.md`,
`03-RECONOCIMIENTO-FACIAL.md`, `04-MODO-KIOSCO-Y-OFFLINE.md` y `05-AUTENTICACION.md`.

> Reemplaza y consolida los antiguos `01-REQUISITOS-Y-ALCANCE.md`, `02-PLAN-IMPLEMENTACION.md`
> y `RESUMEN-IMPLEMENTACION.md`, que describían fases ya superadas y supuestos desactualizados.

---

## 1. Objetivo original (diciembre 2025)

App .NET MAUI para dispositivos Android fijos en modo kiosco, para control de acceso de
trabajadores, integrada con el ecosistema ICARUS (ICARUS.API, ICARUS.Web) de TRAJANO Software.

Roles del sistema:

1. **Admin TRAJANO**: asigna el módulo de Control de Acceso a clientes desde ICARUS.Web.
2. **Cliente / Supervisor**: inicia sesión en IMCA, registra rostros/huellas de trabajadores
   y activa el modo kiosco.
3. **Trabajadores**: fichan Entrada/Salida en el dispositivo.

---

## 2. Cambios de rumbo respecto al plan inicial

La documentación de planificación original quedó desfasada frente a la implementación real.
Diferencias clave (la implementación actual es la fuente de verdad):

| Tema | Plan original | Implementación real |
|---|---|---|
| Plataforma .NET | .NET 8 | **.NET 10** |
| Pilar de identificación | Huella dactilar | **Reconocimiento facial** (huella quedó SIMULADA, no productiva) |
| Identificación en kiosco | Implícitamente automática | **Selección manual + verificación facial 1:1** |
| Reconocimiento facial | No detallado | **Dual: ONNX local (MobileFaceNet 128-dim) + ARGOS (ArcFace 512-dim)** |
| Estado del proyecto | "Preparación" / fases sin marcar | **Implementado y validado en pruebas reales** |

---

## 3. Hitos de implementación (resumen)

- **Autenticación de supervisor**: se corrigió el login para autenticar
  **supervisores/clientes** (ASP.NET Identity, JWT con claims `ClienteId`/`RazonSocial`/`Role`)
  vía `POST imca/auth/login`, en lugar del login de trabajadores inicial. Detalle vigente en
  `05-AUTENTICACION.md`.
- **TrabajadoresPage**: lista con búsqueda y sincronización desde la API.
- **FaceID dual ONNX + ARGOS**: con umbrales 75 % / 40 % y escalado forzado a ARGOS al
  3.er intento. Validado en pruebas reales (ver `Diagramas Mermaid/Contexto-Kiosco-FaceID.md`).
- **Sincronización offline-first**: batch con backoff exponencial `2^n × 60s` (máx. 5 intentos).
- **Ajustes UI del kiosco** (2026-01-01): ver `CHANGELOG-2026-01-01.md`.

---

## 4. Pendientes / deuda técnica conocida

- **Huella dactilar SIMULADA** (`BiometriaService`): falta implementación biométrica real.
- **Timer de sincronización a 5 s** (valor de prueba): cambiar a 5 min (300000 ms) antes de release.
- **`TokenRefreshService` sin cablear**: existe (`EnsureValidTokenAsync`) pero no está registrado
  en DI ni se invoca. El refresco real de token en kiosco lo cubre `KioscoViewModel.RestaurarTokenAsync()`.
- **Comentarios obsoletos en el código**:
  - Enum `VerificacionZona`: comentarios "60 %" vs. lógica real "75 % / 40 %".
  - `FaceEmbedding`: comentario "128 floats / 512 bytes" vs. real ArcFace 512-dim / 4096 bytes.
  - `OnnxFaceNetProcessor`: comentarios ArcFace 512-dim vs. cache que espera MobileFaceNet 128-dim
    (confirmar qué modelo emite realmente `facenet.onnx`).
- **Tests**: `IMCA.Tests` no referencia `IMCA.csproj` (conflictos MAUI); solo valida lógica pura
  reimplementada.
