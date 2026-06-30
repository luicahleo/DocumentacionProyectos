# Guía para Consultar Base de Datos SQLite de IMCA

**Última actualización:** 2026-06-29 — validado contra código fuente

Esta guía explica cómo extraer la base de datos SQLite de IMCA desde un dispositivo Android y consultarla.

> La app IMCA usa **.NET 10**. La herramienta de consulta `DbQuery` es un proyecto de
> consola aparte sobre **.NET 8** (`net8.0`), fuera de la solución `IMCA.slnx`.

## Requisitos

- Dispositivo Android conectado por USB con depuración habilitada
- Android SDK con ADB instalado (viene con Visual Studio)
- .NET 8+ SDK instalado (para ejecutar la herramienta `DbQuery`)

## Paso 1: Extraer Base de Datos del Dispositivo

### Verificar conexión
```powershell
# Usar ruta completa de ADB (viene con Android SDK)
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" devices
```

**Ejemplo de salida:**
```
List of devices attached
8l9tcy45eajbinob        device
```

### Información importante
- **Nombre del paquete:** `com.icarus.mobile`
- **Ruta de la BD en el dispositivo:** `/data/data/com.icarus.mobile/files/imca_local.db3`

### Extraer la base de datos (método que funciona)
```powershell
# 1. Copiar BD a ubicación temporal (evita corrupción por redirección)
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" shell "run-as com.icarus.mobile cat files/imca_local.db3 > /data/local/tmp/imca_temp.db3"

# 2. Descargar al PC
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" pull /data/local/tmp/imca_temp.db3 DbQuery\imca_final.db3
```

### Comando único (copiar y pegar)
```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" shell "run-as com.icarus.mobile cat files/imca_local.db3 > /data/local/tmp/imca_temp.db3" ; & "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" pull /data/local/tmp/imca_temp.db3 DbQuery\imca_final.db3
```

**Salida esperada:**
```
/data/local/tmp/imca_temp.db3: 1 file pulled, 0 skipped. 4.7 MB/s (57344 bytes in 0.012s)
```

## Paso 2: Consultar la Base de Datos

### Usando DbQuery (recomendado)
```powershell
cd IMCA\DbQuery
dotnet run
```

**Salida de ejemplo:**
```
=== ESQUEMA DE TABLA Trabajadores ===

CREATE TABLE "Trabajadores" (
  "Id" integer primary key autoincrement,
  "TrabajadorApiId" integer,
  "ClienteId" integer,
  "Nombre" varchar(200),
  "TieneFoto" integer,
  "FaceEmbedding" blob,
  "FaceEmbeddingMobileFN" blob,
  ...
)

=== TODOS LOS TRABAJADORES CON FOTO ===

  ID: 1    | ApiId: 1    | Ok2 Ok2 Ok2  | Embedding: 4096 bytes
  ID: 2    | ApiId: 2    | Ok3 Ok3 Ok3  | Embedding: 4096 bytes
  ID: 3    | ApiId: 6    | Ok4 Ok4 Ok4  | Embedding: 4096 bytes

  Total: 3 trabajadores
```

## Comandos útiles de diagnóstico

### Buscar archivos de BD en el dispositivo
```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" shell "run-as com.icarus.mobile find /data/data/com.icarus.mobile -name '*.db*' 2>/dev/null"
```

### Ver estructura de archivos de la app
```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" shell "run-as com.icarus.mobile ls -la files/"
```

## Tablas de la base de datos (5)

| Tabla | Contenido |
|-------|-----------|
| `Dispositivos` | Dispositivo IMCA registrado |
| `Supervisores` | Supervisor autenticado + token JWT |
| `Trabajadores` | Trabajadores (embeddings faciales, huella simulada, fotos) |
| `ConfiguracionApp` | Estado del modo kiosco y config local |
| `RegistroLocal` | Fichajes de Entrada/Salida (offline-first) |

Esquema completo de cada tabla: ver `02-MODELO-DATOS.md`.

## Consultas SQL Útiles

```sql
-- Trabajadores con embedding ArcFace
SELECT Id, TrabajadorApiId, Nombre, length(FaceEmbedding) as EmbeddingSize
FROM Trabajadores WHERE FaceEmbedding IS NOT NULL;

-- Trabajadores con embedding MobileFaceNet
SELECT Id, TrabajadorApiId, Nombre, length(FaceEmbeddingMobileFN) as MobileFNSize
FROM Trabajadores WHERE FaceEmbeddingMobileFN IS NOT NULL;

-- Trabajadores con foto
SELECT Id, TrabajadorApiId, Nombre, TieneFoto FROM Trabajadores WHERE TieneFoto = 1;

-- Registros locales pendientes
SELECT * FROM RegistroLocal ORDER BY FechaCreacion DESC LIMIT 10;
```

## Estructura del Proyecto

```
IMCA/
├── DbQuery/                    ← Herramienta de consulta SQLite
│   ├── DbQuery.csproj
│   ├── Program.cs
│   └── imca_final.db3          ← BD extraída del dispositivo
├── Scripts/
│   └── ExtractDB.ps1           ← Script para extraer BD (obsoleto)
└── Documentacion/
    └── GUIA-CONSULTAR-BASE-DATOS-SQLITE.md
```

## Troubleshooting

| Error | Causa | Solución |
|-------|-------|----------|
| "file is not a database" | Archivo corrupto por redirección | Usar método con `/data/local/tmp` |
| "no such column" | Esquema cambió | Ejecutar PRAGMA table_info() |
| "adb: device not found" | Dispositivo desconectado | Reconectar USB |
| "Permission denied" | No tiene permisos run-as | Verificar que app sea debuggeable |
| "adb no se reconoce" | ADB no está en PATH | Usar ruta completa `$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe` |

## Notas

- La extracción es **solo lectura** (no modifica la BD del dispositivo)
- Fechas están en **Unix timestamp** (milisegundos)
- Booleanos son **INTEGER** (0=false, 1=true)
- **FaceEmbedding:** ArcFace 512-dim → 4096 bytes (512 floats × 8 bytes/double)
- **FaceEmbeddingMobileFN:** MobileFaceNet 128-dim → 512 bytes (128 floats × 4 bytes/float)
