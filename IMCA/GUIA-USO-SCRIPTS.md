# Guía de Uso de Scripts

**Última actualización:** 2026-06-29 — validado contra código fuente

Scripts de desarrollo y diagnóstico para IMCA. Las rutas son relativas a la raíz del repo de
código (`C:\Users\lrcahuana\source\repos\dev\IMCA`).

## Scripts Disponibles

### ExtractDB.ps1
**Ubicación:** `Scripts/ExtractDB.ps1`  
**Función:** Extrae la base de datos SQLite desde un dispositivo Android físico.

**Uso:**
```powershell
.\Scripts\ExtractDB.ps1
```

**Configuración (editar en el script):**
- `$deviceId`: ID del dispositivo (obtener con `adb devices`)
- `$outputFile`: Ruta destino (default: `DbQuery\imca_final.db3`)

**Salida:**
- Archivo SQLite extraído
- Validación automática del formato

---

## Herramienta DbQuery

**Ubicación:** `DbQuery/`  
**Función:** Consulta la base de datos SQLite extraída.

**Uso:**
```powershell
cd DbQuery
dotnet run
```

**Funcionalidades:**
- Muestra esquema de tabla Trabajadores
- Verifica trabajador específico por ApiId
- Lista trabajadores con FaceEmbedding
- Muestra tamaño de embeddings

---

## Flujo de Trabajo Típico

```powershell
# 1. Extraer BD del dispositivo
.\Scripts\ExtractDB.ps1

# 2. Consultar datos
cd DbQuery
dotnet run
```

---

## Notas

- Scripts diseñados para Windows + PowerShell
- Requiere ADB instalado (viene con Visual Studio)
- La BD extraída NO modifica la del dispositivo
