# IMCA - Requisitos y Alcance del Proyecto

**Versión:** 1.0  
**Fecha:** Diciembre 26, 2025  
**Proyecto:** ICARUS Módulo Control de Acceso

---

## 🎯 OBJETIVO

Desarrollar aplicación .NET MAUI para dispositivos móviles Android fijos que permita:
- **Registro biométrico** de trabajadores (huella + foto)
- **Control de acceso** mediante huella digital (entrada/salida)
- **Validación en tiempo real** contra ICARUS.API
- **Modo kiosco** para uso exclusivo

---

## 👥 USUARIOS

1. **Admin TRAJANO**: Asigna módulo Control de Acceso a clientes desde ICARUS.Web
2. **Cliente/Supervisor**: Configura IMCA, registra huellas/fotos de trabajadores
3. **Trabajadores**: Registran entrada/salida usando huella digital

---

## 📋 REQUISITOS FUNCIONALES

### RF01: Autenticación
- Cliente/Supervisor inicia sesión con credenciales de ICARUS.Web
- Autenticación JWT contra ICARUS.API
- Token almacenado en SecureStorage
- Auto-registro del dispositivo (IMEI) en primera conexión

### RF02: Modo Configuración
- **RF02.1**: Ver lista de trabajadores con AccesoMobil activo
- **RF02.2**: Registrar huella digital del trabajador (3 capturas)
- **RF02.3**: Capturar foto del trabajador con cámara frontal
- **RF02.4**: Enviar template biométrico + foto a API
- **RF02.5**: Descargar fotos de trabajadores desde servidor
- **RF02.6**: Activar Modo Kiosco
- **RF02.7**: Indicadores visuales: ✅ Tiene huella | 📷 Tiene foto

### RF03: Modo Kiosco
- **RF03.1**: Pantalla principal: Botón "Iniciar Registro"
- **RF03.2**: Captura de huella digital
- **RF03.3**: Identificación del trabajador vía API
- **RF03.4**: Validaciones: Activo, Vigente (FechaInicio/Fin)
- **RF03.5**: Determinación automática Entrada/Salida (toggle por cantidad de registros)
- **RF03.6**: Mostrar confirmación con foto + tipo de acceso
- **RF03.7**: Cuenta regresiva 3s (cancelable)
- **RF03.8**: Registro en base de datos
- **RF03.9**: Feedback visual: "✓ ENTRADA/SALIDA REGISTRADA"
- **RF03.10**: Permitir múltiples entradas/salidas en el día

### RF04: Validaciones
- **RF04.1**: TrabajadorAcceso.EstaActivo = true
- **RF04.2**: TrabajadorAcceso.FechaInicio <= HOY
- **RF04.3**: TrabajadorAcceso.FechaFin == null OR FechaFin >= HOY
- **RF04.4**: Huella registrada en BD
- **RF04.5**: Template biométrico coincide

### RF05: Manejo de Errores
- **RF05.1**: Huella no registrada → "❌ Huella no registrada. Contacte supervisor"
- **RF05.2**: Trabajador inactivo → "❌ Acceso no autorizado"
- **RF05.3**: Sin conexión → "❌ Error de conexión. Intente nuevamente"
- **RF05.4**: Error captura huella → "❌ Error al leer huella. Intente nuevamente"

---

## 🔧 REQUISITOS NO FUNCIONALES

### RNF01: Rendimiento
- Identificación de huella: < 2 segundos
- Carga de foto local: < 1 segundo
- Registro de acceso: < 3 segundos

### RNF02: Seguridad
- Tokens JWT encriptados en SecureStorage
- Templates biométricos solo en servidor
- Fotos en carpeta privada del app
- HTTPS obligatorio en producción
- Modo kiosco con botón oculto + password

### RNF03: Usabilidad
- Interfaz simple e intuitiva
- Feedback visual claro (iconos, colores)
- Tamaño de botones: mínimo 48x48dp (touch target)
- Tipografía legible: mínimo 16sp

### RNF04: Compatibilidad
- Android 8.0+ (API 26+)
- .NET MAUI (.NET 8)
- Sensor de huella digital integrado
- Cámara frontal

### RNF05: Disponibilidad
- Requiere conexión internet permanente
- Sin modo offline en MVP
- App funciona 24/7

---

## 🎯 ALCANCE MVP (Fase 1)

### ✅ INCLUIDO

**Backend (ICARUS.API):**
- ✅ Entidad `Dispositivo` en Domain
- ✅ Repositorio `DispositivoRepository`
- ✅ Controller `IMCAController`
- ✅ Endpoints: Auth, Dispositivos, Biometría, Fotos, Registros
- ✅ Validaciones básicas
- ✅ Migración EF Core

**Frontend (IMCA):**
- ✅ Login Cliente/Supervisor
- ✅ Modo Configuración completo
- ✅ Modo Kiosco completo
- ✅ Captura de huella (sensor nativo)
- ✅ Captura de foto (cámara)
- ✅ Almacenamiento local (SQLite + fotos)
- ✅ Pantalla completa (sin navegación Android)
- ✅ Botón oculto para salir de kiosco

**Funcionalidades:**
- ✅ Identificación por huella digital
- ✅ Registro Entrada/Salida automático (toggle)
- ✅ Múltiples registros por día
- ✅ Validaciones: activo, vigencia
- ✅ Mostrar foto en confirmación
- ✅ Manejo de errores básico

---

## 🚫 FUERA DE ALCANCE (Fase 2+)

### ❌ NO INCLUIDO EN MVP

**Backend:**
- ❌ Gestión de dispositivos desde ICARUS.Web
- ❌ Dashboard de dispositivos en tiempo real
- ❌ Notificaciones push a web
- ❌ Webhooks para eventos
- ❌ Reportes desde web por dispositivo

**Frontend:**
- ❌ Reconocimiento facial con ML/AI
- ❌ Algoritmo de similitud facial
- ❌ Tarjetas RFID
- ❌ Modo offline completo con sincronización
- ❌ Kiosco real Android (Device Owner)
- ❌ Dashboard para supervisor en dispositivo
- ❌ Integración con cerraduras/torniquetes
- ❌ Múltiples idiomas
- ❌ Modo oscuro

**Validaciones:**
- ❌ Nivel de acceso por zona
- ❌ Horarios permitidos
- ❌ Validación de zona específica
- ❌ Límite de registros por día

---

## 🔒 LIMITACIONES

### Limitaciones Técnicas
1. **Conexión requerida**: App no funciona sin internet
2. **Android Only**: No compatible con iOS en MVP
3. **Sensor requerido**: Dispositivo debe tener sensor de huella
4. **Pantalla completa básica**: No es kiosco real, usuario podría salir con esfuerzo
5. **Sin caché inteligente**: Fotos se descargan todas, no por demanda

### Limitaciones de Negocio
1. **Cliente provee dispositivo**: TRAJANO solo licencia software
2. **Sin soporte 24/7**: Soporte en horario laboral
3. **Sin SLA garantizado**: Sin garantía de uptime en MVP
4. **1 dispositivo por instalación**: No multi-dispositivo en fase 1

### Limitaciones de Seguridad
1. **Sin encriptación E2E**: Template viaja por HTTPS pero no E2E
2. **Sin backup automático**: Cliente debe respaldar fotos manualmente
3. **Sin auditoría detallada**: No se registra quién configuró qué

---

## 📊 CASOS DE USO PRINCIPALES

### CU01: Configurar Dispositivo por Primera Vez
**Actor:** Cliente/Supervisor  
**Flujo:**
1. Instala APK en Android
2. Abre IMCA → Login
3. Ingresa email + password
4. API valida → Registra dispositivo (IMEI)
5. Muestra Modo Configuración

### CU02: Registrar Huella y Foto de Trabajador
**Actor:** Cliente/Supervisor  
**Precondición:** Trabajador existe en ICARUS.Web con AccesoMobil=true  
**Flujo:**
1. Accede a "Trabajadores"
2. Selecciona trabajador sin huella
3. Captura huella (3x)
4. Captura foto
5. Envía a API
6. Descarga foto localmente
7. Marca como completo

### CU03: Trabajador Registra Entrada
**Actor:** Trabajador  
**Precondición:** Huella registrada, sin registros hoy  
**Flujo:**
1. Presiona "Iniciar Registro"
2. Coloca dedo en sensor
3. Sistema identifica trabajador
4. Valida permisos
5. Determina tipo: ENTRADA
6. Muestra confirmación 3s
7. Registra en BD
8. Muestra "✓ ENTRADA REGISTRADA"

### CU04: Trabajador Registra Salida
**Actor:** Trabajador  
**Precondición:** Ya registró entrada hoy  
**Flujo:**
1-4. (Igual que CU03)
5. Determina tipo: SALIDA (toggle)
6-8. (Igual que CU03)

### CU05: Salir de Modo Kiosco
**Actor:** Cliente/Supervisor  
**Flujo:**
1. Mantiene presionado esquina 5s
2. Ingresa password
3. Vuelve a Modo Configuración

---

## 🏗️ ARQUITECTURA FÍSICA

```
┌─────────────────────────────────────┐
│   Dispositivo Android Fijo          │
│   - Smartphone/Tablet               │
│   - Sensor huella integrado         │
│   - Cámara frontal                  │
│   - WiFi/4G permanente              │
│   - Montado en pared/soporte        │
└────────────┬────────────────────────┘
             │ HTTPS + JWT
             ↓
┌─────────────────────────────────────┐
│   ICARUS.API (.NET 8)               │
│   - Servidor Cloud/OnPremise        │
│   - SQL Server                      │
└─────────────────────────────────────┘
```

---

## 📦 ENTREGABLES

1. **Backend:**
   - Entidad Dispositivo + migración
   - Controller IMCAController
   - 10+ endpoints documentados
   - Unit tests básicos

2. **Frontend:**
   - APK IMCA v1.0.0
   - Documentación de instalación
   - Manual de usuario (Cliente/Supervisor)
   - Manual de usuario (Trabajador)

3. **Documentación:**
   - Requisitos y alcance (este doc)
   - Plan de implementación
   - Guía de estilo de código
   - API documentation (Swagger)

---

## ⏱️ ESTIMACIÓN

**Total: 13-17 días laborales**

- Fase 1 (Backend): 3-4 días
- Fase 2 (IMCA Base): 2 días
- Fase 3 (Configuración): 3-4 días
- Fase 4 (Kiosco): 3-4 días
- Fase 5 (Testing): 2 días

---

## ✅ CRITERIOS DE ACEPTACIÓN

- [ ] Cliente puede hacer login en IMCA
- [ ] Cliente ve trabajadores con AccesoMobil activo
- [ ] Cliente registra huella de trabajador
- [ ] Cliente captura foto de trabajador
- [ ] Fotos se descargan localmente
- [ ] Cliente activa Modo Kiosco
- [ ] Trabajador registra entrada con huella
- [ ] Sistema identifica trabajador
- [ ] Sistema valida activo y vigencia
- [ ] Sistema determina Entrada/Salida automático
- [ ] Muestra confirmación con foto
- [ ] Registro se guarda con DispositivoId
- [ ] Permite múltiples registros en día
- [ ] Error si huella no existe
- [ ] Error si trabajador inactivo
- [ ] Cliente sale de kiosco con botón oculto

---

**Documento preparado para inicio de implementación**
