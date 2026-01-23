# Guía: Leer Logs de Dispositivo Físico Android

## Requisitos Previos

- Dispositivo Android conectado por USB
- Depuración USB habilitada en el dispositivo
- ADB instalado (viene con Android SDK)

## Ruta de ADB en este Sistema

```
C:\Program Files (x86)\Android\android-sdk\platform-tools\adb.exe
```

---

## Comandos Principales

### 1. Ver dispositivos conectados
```powershell
& "C:\Program Files (x86)\Android\android-sdk\platform-tools\adb.exe" devices
```

Ejemplo de salida:
```
List of devices attached
8l9tcy45eajbinob        device    <- Dispositivo físico
emulator-5554           device    <- Emulador
```

---

### 2. Ver logs en tiempo real
```powershell
& "C:\Program Files (x86)\Android\android-sdk\platform-tools\adb.exe" -s [DEVICE_ID] logcat -s "DOTNET" "MonoDroid" "AndroidRuntime"
```

> **Nota:** Reemplaza `[DEVICE_ID]` con el ID de tu dispositivo (ej: `8l9tcy45eajbinob`)

Para salir: presiona `Ctrl+C`

---

### 3. Ver últimos logs (sin tiempo real)
```powershell
& "C:\Program Files (x86)\Android\android-sdk\platform-tools\adb.exe" -s [DEVICE_ID] logcat -d | Select-String -Pattern "com.icarus|DOTNET|Exception|Error" | Select-Object -Last 50
```

---

### 4. Ver solo errores y crashes
```powershell
& "C:\Program Files (x86)\Android\android-sdk\platform-tools\adb.exe" -s [DEVICE_ID] logcat -d "*:E" | Select-String -Pattern "icarus" | Select-Object -Last 30
```

---

### 5. Limpiar logs (empezar fresco)
```powershell
& "C:\Program Files (x86)\Android\android-sdk\platform-tools\adb.exe" -s [DEVICE_ID] logcat -c
```

---

### 6. Guardar logs a archivo
```powershell
& "C:\Program Files (x86)\Android\android-sdk\platform-tools\adb.exe" -s [DEVICE_ID] logcat -d > C:\Users\desarrollo\Downloads\logs_imca.txt
```

---

## Tip: Agregar ADB al PATH

Para no escribir la ruta completa cada vez, ejecuta esto al inicio de la sesión:
```powershell
$env:PATH += ";C:\Program Files (x86)\Android\android-sdk\platform-tools"
```

Después puedes usar simplemente:
```powershell
adb devices
adb logcat
```

---

## Filtros Útiles para IMCA

| Filtro | Descripción |
|--------|-------------|
| `com.icarus.mobile` | Package name de IMCA |
| `DOTNET` | Logs del runtime .NET |
| `MonoDroid` | Logs de Xamarin/MAUI Android |
| `AndroidRuntime` | Crashes y excepciones nativas |
| `*:E` | Solo errores |

---

## Problema Conocido: Crash al Desplegar con USB

Si la app crashea al desplegar Release con USB conectado pero funciona sin USB:

**Causa:** Visual Studio intenta attachar el debugger incluso en Release.

**Solución:** Usar `Ctrl+F5` (Start Without Debugging) en lugar de `F5`.

---

## Ejemplo de Sesión Completa

```powershell
# 1. Ver dispositivos
& "C:\Program Files (x86)\Android\android-sdk\platform-tools\adb.exe" devices

# 2. Limpiar logs anteriores
& "C:\Program Files (x86)\Android\android-sdk\platform-tools\adb.exe" -s 8l9tcy45eajbinob logcat -c

# 3. Iniciar monitoreo en tiempo real
& "C:\Program Files (x86)\Android\android-sdk\platform-tools\adb.exe" -s 8l9tcy45eajbinob logcat -s "DOTNET" "MonoDroid"

# 4. (En otra terminal) o después de Ctrl+C, ver logs guardados
& "C:\Program Files (x86)\Android\android-sdk\platform-tools\adb.exe" -s 8l9tcy45eajbinob logcat -d | Select-String "Exception|Error|FATAL"
```

---

*Última actualización: 2026-01-11*
