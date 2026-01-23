# 📋 ICARUS - Documentación del Sistema v2.0

> **Documento Actualizado**  
> **Fecha:** Enero 2026  
> **Versión:** 2.0  
> **Estado:** Actualizado según análisis del código fuente y aplicación web en funcionamiento

---

## 📑 Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Componentes del Sistema](#componentes-del-sistema)
4. [Módulos Funcionales](#módulos-funcionales)
5. [Roles y Permisos](#roles-y-permisos)
6. [Estado de Implementación](#estado-de-implementación)
7. [Changelog desde v1.0](#changelog-desde-v10)

---

## 🎯 Resumen Ejecutivo

**ICARUS** es una plataforma empresarial modular para gestión agroindustrial, construida con **Clean Architecture** en **.NET 8**. El sistema soporta múltiples clientes (multi-tenant) con módulos asignables según sus necesidades.

### Componentes Principales

| Componente | Tecnología | Estado |
|------------|------------|--------|
| **ICARUS.API** | ASP.NET Core 8 Web API + JWT | ✅ Operativo |
| **ICARUS.Web** | ASP.NET Core MVC + Razor | ✅ Operativo |
| **ICARUS_APP** | .NET MAUI 8.0 | ✅ Operativo |
| **ICARUS_MOBILE_OFFLINE** | .NET MAUI + SQLite | 🔶 En desarrollo |
| **ARGOS** | Python + Flask + DeepFace | ✅ Operativo |
| **IMCA Controller** | API para Kioscos biométricos | ✅ Operativo |

### Módulos Funcionales Disponibles

| Módulo | Precio | Estado |
|--------|--------|--------|
| **Gestor Avícola** | 299,99 € | ✅ Completamente implementado |
| **Control de Acceso** | 399,99 € | 🔶 Parcialmente implementado |
| **Facturación** | - | 🔴 No implementado |
| **IoT** | - | 🔴 No implementado |

---

## 🏗️ Arquitectura del Sistema

### Diagrama de Capas (Clean Architecture)

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
├─────────────────────────┬─────────────────────────┬─────────┤
│      ICARUS.Web         │     ICARUS.API          │  MAUI   │
│   (MVC + Razor Views)   │   (REST + JWT + Swagger)│  Apps   │
│   Puerto: 5188/7113     │   Puerto: 5090/7090     │         │
└─────────────────────────┴─────────────────────────┴─────────┘
                              ↓ MediatR (CQRS)
┌─────────────────────────────────────────────────────────────┐
│                  ICARUS.Application                          │
│   • 96 Commands (escritura)                                  │
│   • 74 Queries (lectura)                                     │
│   • 170+ Handlers                                            │
│   • FluentValidation + AutoMapper                            │
└─────────────────────────────────────────────────────────────┘
                              ↓ Repository Pattern
┌─────────────────────────────────────────────────────────────┐
│                  ICARUS.Infrastructure                       │
│   • Entity Framework Core 8                                  │
│   • 30 Repositories específicos                              │
│   • ApplicationDbContext                                     │
│   • Fluent API Configurations                                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    ICARUS.Domain                             │
│   • 31+ Entidades (BaseEntity)                               │
│   • Interfaces de repositorios                               │
│   • Enums de estados                                         │
│   • Sin dependencias externas                                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    SQL Server                                │
│              LUISCAHUANA\SQLEXPRESS - ICARUSDB              │
└─────────────────────────────────────────────────────────────┘
```

### Microservicios Externos

```
┌─────────────────────────────────────────────────────────────┐
│                    ARGOS (Python)                            │
│   • Flask + DeepFace + ArcFace                              │
│   • Puerto: 5000                                             │
│   • Reconocimiento facial 99.8% precisión                   │
│   • Embeddings de 512 floats                                │
│   └── /api/extract-embedding                                │
│   └── /api/verify                                           │
│   └── /api/identify                                         │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│            IMCA Controller (ICARUS.API)                      │
│   • Sistema de Ingreso Móvil Control de Acceso              │
│   • Gestión de dispositivos kiosco                          │
│   • Biometría facial + huella dactilar                      │
│   • Registro de accesos (entrada/salida)                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Componentes del Sistema

### 1. ICARUS.Domain - Entidades

#### Entidades Core
- `Cliente` - Empresa/organización (multi-tenant)
- `Trabajador` - Empleados del sistema
- `Modulo` - Catálogo de módulos del sistema
- `ClienteModulo` - Asignación de módulos a clientes
- `TrabajadorModulo` - Permisos de trabajadores
- `RefreshToken` - Tokens de autenticación

#### Entidades Gestión Avícola (14)
- `GestorAvicola` - Granjas
- `Galpon` - Galpones/naves
- `ProgramaVacunacion` - Programas maestros
- `CronogramaVacunacion` - Tareas de vacunación
- `CronogramaIluminacion` - Control de luz
- `CronogramaAlimentacion` - Control de alimentación
- `RegistroProduccionDiario` - Producción de huevos
- `RegistroMortalidad` - Control de bajas
- `GalponTareaVacunacion/Iluminacion/Alimentacion`
- `EstadisticasMortalidadGalpon`
- `TipoReporte`, `GestorCiclo`

#### Entidades Control de Acceso (9)
- `TrabajadorAcceso` - Trabajadores con acceso
- `DatosBiometricos` - Huellas y embeddings faciales
- `ZonaAcceso` - Áreas de acceso
- `PoliticaAcceso` - Reglas de acceso
- `PoliticaZona` - Relación política-zona
- `RegistroAcceso` - Entradas/salidas
- `Dispositivo` - Kioscos IMCA
- `NotificacionAcceso` - Alertas
- `AlertaSeguridad` - Incidentes

### 2. ICARUS.API - Controllers

#### Controllers Mobile (5)
| Controller | Funcionalidad |
|------------|---------------|
| `MobileAuthController` | Autenticación JWT para apps móviles |
| `IMCAController` | Sistema IMCA completo (38+ endpoints) |
| `MobileNotificacionesController` | Tareas del día y notificaciones |
| `RegistroProduccionMobileController` | CRUD de producción desde móvil |
| `TrabajadorMobileController` | Gestión de trabajadores mobile |

#### IMCA Controller - Endpoints Principales
```
POST /api/imca/login               - Autenticación supervisor
POST /api/imca/dispositivo         - Registrar dispositivo kiosco
PUT  /api/imca/dispositivo/{id}/heartbeat - Actualizar estado
GET  /api/imca/trabajadores/{clienteId} - Lista trabajadores
POST /api/imca/huella              - Registrar huella dactilar
POST /api/imca/identificar-huella  - Identificar por huella
POST /api/imca/foto                - Subir foto trabajador
GET  /api/imca/fotos/{clienteId}   - Descargar fotos (ZIP)
POST /api/imca/validar-acceso      - Validar acceso IMCA
POST /api/imca/registro-acceso     - Crear registro entrada/salida
POST /api/imca/embedding           - Guardar embedding ArcFace
POST /api/imca/embedding-mobilefacenet - Guardar embedding MobileFaceNet
GET  /api/imca/embeddings/{clienteId} - Obtener embeddings para caché
```

### 3. ARGOS - Microservicio de Reconocimiento Facial

```yaml
Tecnología: Python 3.9 + Flask + DeepFace
Modelo: ArcFace
Precisión: 99.8% (LFW benchmark)
Embedding: 512 floats
Threshold: 0.68 distancia coseno
Puerto: 5000

Endpoints:
  GET  /health                  - Health check
  POST /api/extract-embedding   - Extraer embedding de imagen
  POST /api/verify              - Verificar 1:1
  POST /api/identify            - Identificar 1:N
  POST /api/compare-embeddings  - Comparar embeddings
```

---

## 🧩 Módulos Funcionales

### 1. Gestión Avícola (✅ Completo)

#### Dashboard Avícola
Interfaz estilo Excel con widgets en tiempo real:
- **Galpones Activos**: Número de naves operativas
- **Total Gallinas**: Población actual
- **Huevos Producidos**: Producción del día seleccionado
- **Eficiencia Promedio**: % producción/población

#### Funcionalidades

| Función | Descripción |
|---------|-------------|
| **Gestión de Granjas** | CRUD de gestores avícolas (granjas) |
| **Gestión de Galpones** | Naves con capacidad, población, edad de aves |
| **Registro Diario** | Producción de huevos (maples + unidades), mortalidad |
| **Notificaciones del Día** | Tareas pendientes de vacunación, iluminación, alimentación |
| **Programas de Vacunación** | Programas maestros que generan 46 tareas automáticas |

#### Flujo de Registro de Producción
```
Usuario selecciona Galpón y Fecha
    ↓
Ingresa: Maples de huevos (x30) + Unidades sueltas
    ↓
Ingresa: Gallinas muertas (mortalidad)
    ↓
Sistema calcula automáticamente:
  • Total Huevos = (Maples × 30) + Unidades
  • Eficiencia = (Total Huevos / Gallinas) × 100
  • Tasa Mortalidad = (Muertas / Gallinas) × 100
```

#### Sistema de Notificaciones
Tres tipos de tareas automáticas:
1. **Vacunación**: Vacunas programadas por edad del ave
2. **Iluminación**: Control de fotoperiodo (horas luz/oscuridad)
3. **Alimentación**: Tipos de alimento por etapa

### 2. Control de Acceso (🔶 Parcial)

> ⚠️ **Estado**: El módulo web tiene errores de implementación. La API IMCA funciona correctamente para dispositivos kiosco.

#### Funcionalidades Implementadas (API)
- Registro de dispositivos kiosco
- Autenticación de supervisores
- Gestión de trabajadores con acceso
- Registro de huellas dactilares
- Registro de embeddings faciales (ArcFace + MobileFaceNet)
- Identificación biométrica 1:N
- Registro de entradas/salidas
- Validación de acceso automática

#### Arquitectura Biométrica
```
                     ┌─────────────┐
                     │  Kiosco     │
                     │  Android    │
                     └──────┬──────┘
                            │
            ┌───────────────┼───────────────┐
            ↓               ↓               ↓
     ┌──────────┐    ┌──────────┐    ┌──────────┐
     │ Huella   │    │  Cámara  │    │  ONNX    │
     │ Digital  │    │   Foto   │    │ Runtime  │
     └────┬─────┘    └────┬─────┘    └────┬─────┘
          │               │               │
          ↓               ↓               ↓
    ┌───────────────────────────────────────────┐
    │              ICARUS_APP (MAUI)            │
    │                                           │
    │  • FingerprintService (SDK Suprema)       │
    │  • OnnxFaceNetProcessor (MobileFaceNet)   │
    │  • ArgosService (llamadas a ARGOS)        │
    └─────────────────────┬─────────────────────┘
                          │
            ┌─────────────┼─────────────┐
            ↓             ↓             ↓
     ┌──────────┐  ┌──────────┐  ┌──────────┐
     │ IMCA API │  │  ARGOS   │  │ SQLite   │
     │ (.NET)   │  │ (Python) │  │ (Cache)  │
     └──────────┘  └──────────┘  └──────────┘
```

---

## 👥 Roles y Permisos

### Roles del Sistema

| Rol | Descripción | Acceso |
|-----|-------------|--------|
| **Admin** | Administrador del sistema | Gestión de clientes, módulos, asignaciones |
| **Cliente** | Usuario de empresa cliente | Módulos asignados, sus propios datos |
| **Trabajador** | Empleado operativo | Operaciones de su módulo asignado |

### Diferencias de Navegación

#### Admin
```
Inicio | Clientes | Trabajadores | Módulos | Asignaciones | Gestión Avícola ▼ | Control de Acceso ▼ | Facturación ▼ | IoT ▼
```

#### Cliente
```
Mis Módulos | Mis Trabajadores | Gestión Avícola ▼ | Control de Acceso ▼
```

### Permisos por Módulo

| Función | Admin | Cliente | Trabajador |
|---------|-------|---------|------------|
| Crear clientes | ✅ | ❌ | ❌ |
| Asignar módulos | ✅ | ❌ | ❌ |
| Gestionar granjas | ❌ | ✅ | ❌ |
| Gestionar galpones | ❌ | ✅ | ❌ |
| Registrar producción | ❌ | ✅ | ✅ |
| Ver notificaciones | ✅ | ✅ | ✅ |
| Completar tareas | ❌ | ✅ | ✅ |

---

## 📊 Estado de Implementación

### Resumen por Componente

| Componente | Estado | Notas |
|------------|--------|-------|
| **Backend Core** | ✅ 100% | Clean Architecture funcionando |
| **ICARUS.Web** | ✅ 90% | Control de Acceso con errores |
| **ICARUS.API** | ✅ 95% | IMCA operativo, endpoints móviles completos |
| **ICARUS_APP** | ✅ 85% | Autenticación, módulos funcionando |
| **ARGOS** | ✅ 100% | Reconocimiento facial operativo |
| **OFFLINE** | 🔶 30% | Estrategia documentada, SQLite parcialmente implementado |

### Funcionalidades Pendientes

1. **Control de Acceso Web**: Corregir excepciones en vistas MVC
2. **Módulo Facturación**: No implementado
3. **Módulo IoT**: No implementado
4. **Testing**: 0% cobertura actual
5. **OFFLINE Mode**: Sincronización manual pendiente

---

## 📝 Changelog desde v1.0

### Cambios Enero 2026

#### Nuevos Componentes
- ✅ **ARGOS**: Microservicio Python para reconocimiento facial
- ✅ **IMCA Controller**: 38+ endpoints para kioscos biométricos
- ✅ **Estrategia OFFLINE**: Documentación y arquitectura SQLite-first

#### Nuevas Entidades
- `Dispositivo` - Para kioscos IMCA
- `GalponTareaVacunacion/Iluminacion/Alimentacion` - Tareas expandidas

#### Actualizaciones de Módulos
- **Gestor Avícola**: Dashboard estilo Excel, cálculos en tiempo real
- **Control de Acceso**: API IMCA completa, web con errores

#### Correcciones de Documentación
- Actualizado número de entidades: 31+ (antes 30)
- Actualizado número de controllers API Mobile: 5 (antes 15)
- Documentación de ARGOS y biometría facial
- Estado real de módulos (Facturación/IoT no implementados)

---

## 📞 Referencias

### Ubicaciones de Código
```
Backend:    C:\Users\desarrollo\source\repos\NETCORE\ICARUS
MAUI App:   C:\Users\desarrollo\source\repos\NETMAUI\ICARUS_APP
OFFLINE:    C:\Users\desarrollo\source\repos\ICARUS_MOBILE_OFFLINE
ARGOS:      C:\Users\desarrollo\source\repos\NETCORE\ICARUS\MICROSERVICIOS\ARGOS
```

### Logs del Sistema
```
ICARUS.Web: ICARUS.Web\Logs\log4net.log
ICARUS.API: ICARUS.API\Logs\log4net.log
ARGOS:      MICROSERVICIOS\ARGOS\logs\argos.log
```

### Documentación Anterior
- `Documentacion\README.md` - Índice principal v1.0
- `Documentacion\00-RESUMEN-EJECUTIVO-ARQUITECTURA.md`
- `Documentacion\01-DOMAIN-ENTIDADES.md`
- `Documentacion\02-APPLICATION-CQRS.md`
- `Documentacion_ICARUS\SISTEMA-NOTIFICACIONES.md`
- `ICARUS_MOBILE_OFFLINE\ESTRATEGIA-OFFLINE-FIRST.md`

---

**Documento generado:** Enero 2026  
**Versión:** 2.0  
**Próxima revisión:** Cuando se complete Control de Acceso Web
