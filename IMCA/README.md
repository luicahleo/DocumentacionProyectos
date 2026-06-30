# IMCA — Icarus Mobile Control App

**Última actualización:** 2026-06-29 — validado contra código fuente

Aplicación móvil de **control de acceso por reconocimiento facial** para puntos fijos
(modo Kiosco), parte del ecosistema **ICARUS** de TRAJANO Software.

Un supervisor inicia sesión, configura el dispositivo y lo deja operando en **Modo Kiosco**:
los trabajadores fichan su Entrada/Salida identificándose por **rostro**. El sistema funciona
**offline-first** (registra en SQLite local) y sincroniza con el backend cuando hay conexión.

> El código fuente vive en `C:\Users\lrcahuana\source\repos\dev\IMCA`.
> Esta carpeta es **solo documentación**.

---

## Índice de documentación

| Documento | Contenido |
|---|---|
| [`01-ARQUITECTURA.md`](01-ARQUITECTURA.md) | Patrón MVVM feature-based, DI, navegación Shell, los 13 servicios |
| [`02-MODELO-DATOS.md`](02-MODELO-DATOS.md) | 6 entidades, 3 DTOs y las 5 tablas SQLite |
| [`03-RECONOCIMIENTO-FACIAL.md`](03-RECONOCIMIENTO-FACIAL.md) | FaceID dual ONNX local + ARGOS, embeddings, umbrales |
| [`04-MODO-KIOSCO-Y-OFFLINE.md`](04-MODO-KIOSCO-Y-OFFLINE.md) | Fichaje, activación/desactivación, sincronización |
| [`05-AUTENTICACION.md`](05-AUTENTICACION.md) | Login de supervisor, JWT, SecureStorage, refresh de token |
| [`GUIA-ESTILO-CODIGO.md`](GUIA-ESTILO-CODIGO.md) | Convenciones de código C#/MVVM |
| [`GUIA-CONSULTAR-BASE-DATOS-SQLITE.md`](GUIA-CONSULTAR-BASE-DATOS-SQLITE.md) | Extraer y consultar `imca_local.db3` del dispositivo |
| [`GUIA-USO-SCRIPTS.md`](GUIA-USO-SCRIPTS.md) | Scripts de diagnóstico (`ExtractDB.ps1`, `DbQuery`) |
| [`guia_logs_dispositivo_fisico.md`](guia_logs_dispositivo_fisico.md) | Leer logs con `adb logcat` |
| [`00-HISTORICO.md`](00-HISTORICO.md) | Notas históricas del proyecto |
| [`CHANGELOG-2026-01-01.md`](CHANGELOG-2026-01-01.md) | Changelog histórico |
| `Diagramas Mermaid/` | Diagramas de contexto y secuencia |

---

## Stack técnico real

- **Framework:** .NET MAUI sobre **.NET 10**.
  - Target frameworks: `net10.0-android`, `net10.0-ios`, `net10.0-maccatalyst`,
    `net10.0-windows10.0.19041.0` (este último solo al compilar en Windows).
  - **En la práctica es una app Android**: el reconocimiento facial local ONNX y la
    biometría solo están implementados para Android. En otras plataformas, los servicios
    de rostro local devuelven `null`.
- **ApplicationId:** `com.icarus.mobile` — **Display version:** `1.0.0`.
- **Patrón:** MVVM feature-based con inyección de dependencias (ver `01-ARQUITECTURA.md`).

### Paquetes NuGet clave

| Paquete | Versión |
|---|---|
| Microsoft.Maui.Controls | `$(MauiVersion)` (del SDK) |
| CommunityToolkit.Mvvm | 8.3.2 |
| CommunityToolkit.Maui | 9.1.1 |
| sqlite-net-pcl | 1.9.172 |
| SQLitePCLRaw.bundle_green | 2.1.10 |
| SkiaSharp.Views.Maui.Controls | 3.119.0 |
| Microsoft.Extensions.Logging.Debug | 10.0.0 |
| Xamarin.AndroidX.Biometric | 1.1.0.30 *(solo Android)* |
| Microsoft.ML.OnnxRuntime | 1.17.0 *(solo Android)* |

- **Base de datos local:** SQLite (`sqlite-net-pcl`), archivo `imca_local.db3` en
  `FileSystem.AppDataDirectory`. 5 tablas (ver `02-MODELO-DATOS.md`).
- **Modelo ONNX:** `Platforms/Android/Assets/facenet.onnx` (empaquetado como `AndroidAsset`).

---

## Plataformas soportadas

| Plataforma | Versión mínima | Estado real |
|---|---|---|
| Android | API 26 (8.0) | **Soportada y funcional** (FaceID ONNX + biometría) |
| iOS | 15.0 | Compila; sin reconocimiento facial local |
| MacCatalyst | 15.0 | Compila; sin reconocimiento facial local |
| Windows | 10.0.17763.0 | Compila; sin reconocimiento facial local |

---

## Estructura del repositorio de código

```
IMCA/                         (raíz del repo de código)
├── IMCA.slnx                 Solución (referencia IMCA + IMCA.Tests)
├── IMCA/                     App MAUI principal
│   ├── Core/
│   │   ├── Database/         LocalDatabase.cs (SQLite, 5 tablas)
│   │   ├── Models/           6 entidades + DTOs/
│   │   └── Services/         13 servicios + Interfaces/
│   ├── Features/             Login, Home, Configuracion, Kiosco, Trabajadores
│   ├── Converters/           4 IValueConverter
│   ├── Helpers/Constants.cs  URLs, claves SecureStorage, umbrales
│   ├── Platforms/Android/    MainActivity + Services/OnnxFaceNetProcessor.cs
│   └── Resources/
├── IMCA.Tests/               Tests xUnit (lógica pura, sin referencia a MAUI)
├── DbQuery/                  Herramienta de diagnóstico SQLite (net8.0, fuera de la solución)
│   └── EmbCompare/           Utilidad de comparación de embeddings (net10.0)
└── Scripts/                  ExtractDB.ps1, QueryIMCA.cs
```

---

## Cómo compilar y desplegar (Android)

Requisitos: **.NET 10 SDK**, workload MAUI (`dotnet workload install maui`),
Android SDK (API 26+), Visual Studio 2022 17.x o superior.

```powershell
# Restaurar y compilar Debug para Android
dotnet build IMCA/IMCA.csproj -f net10.0-android

# Desplegar en dispositivo conectado por USB (recomendado: Start Without Debugging)
# Ver guia_logs_dispositivo_fisico.md para el problema de crash con USB en Release.
```

### Build de Release (AAB firmado)

La configuración `Release` del `IMCA.csproj` ya está preparada para Google Play:

- `AndroidPackageFormat = aab`
- Firma con keystore `icarus-mobile.keystore`, alias `icarus-key`.

```powershell
dotnet publish IMCA/IMCA.csproj -f net10.0-android -c Release
```

> La URL del backend cambia automáticamente entre Debug y Release
> (ver tabla de entornos en `05-AUTENTICACION.md` y `03-RECONOCIMIENTO-FACIAL.md`).

---

## Funcionalidades implementadas

- ✅ Login de supervisor contra ICARUS.API (token JWT de larga duración para kiosco).
- ✅ Registro de rostro de trabajadores (ARGOS/ArcFace + embedding MobileFaceNet local).
- ✅ **Modo Kiosco**: fichaje por selección manual + verificación facial 1:1.
- ✅ Reconocimiento facial **dual**: ONNX local (rápido) con fallback a ARGOS (preciso).
- ✅ Operación **offline-first** con sincronización batch y reintentos exponenciales.
- ⚠️ Registro de **huella dactilar**: existe la UI y el servicio, pero el template es
  **SIMULADO** (no productivo). Ver nota en `03-RECONOCIMIENTO-FACIAL.md`.

---

**TRAJANO Software** — Proyecto ICARUS, módulo de Control de Acceso (IMCA).
Software propietario, uso exclusivo para clientes con licencia activa de ICARUS.
