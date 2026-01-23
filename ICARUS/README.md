# Documentación Completa - Sistema ICARUS

> **📍 Ubicación**: Este documento ahora está centralizado en `DocumentacionProyectos/ICARUS/`

## 📋 Índice de Documentación

Este repositorio contiene la documentación técnica completa del sistema ICARUS (Backend/Web) e ICARUS_MOBILE (aplicación móvil .NET MAUI).

---

## 📊 Diagramas Técnicos

| Tipo | Archivo | Contenido |
|------|---------|-----------|
| **Clases** | [diagramas/clases.md](diagramas/clases.md) | Entidades Domain, Control Acceso, Gestión Avícola |
| **Secuencia** | [diagramas/secuencia.md](diagramas/secuencia.md) | Auth, Reconocimiento Facial, Producción, Módulos |
| **Estado** | [diagramas/estado.md](diagramas/estado.md) | Cliente, Trabajador, Acceso, Galpón, Producción |

---

## 📚 Documentos Generados


| # | Documento | Descripción | Páginas |
|---|-----------|-------------|---------|
| **00** | [RESUMEN-EJECUTIVO-ARQUITECTURA.md](00-RESUMEN-EJECUTIVO-ARQUITECTURA.md) | Overview general, patrones, métricas, tecnologías, stack técnico | **15** |
| **01** | [DOMAIN-ENTIDADES.md](01-DOMAIN-ENTIDADES.md) | 30+ entidades del dominio, relaciones ER, business logic, BaseEntity | **25** |
| **02** | [APPLICATION-CQRS.md](02-APPLICATION-CQRS.md) | 96 commands, 74 queries, MediatR handlers, DTOs, validators | **30** |
| **03** | [INFRASTRUCTURE.md](03-INFRASTRUCTURE.md) | EF Core, ApplicationDbContext, repositories, migrations, configs | **20** |
| **04** | [API-ENDPOINTS.md](04-API-ENDPOINTS.md) | REST API, JWT authentication, Swagger, CORS, 5 controllers | **18** |
| **05** | [WEB-MVC.md](05-WEB-MVC.md) | ASP.NET Core MVC, Areas, Bootstrap 5, ASP.NET Identity, views | **22** |
| **06** | [MOBILE-ARQUITECTURA.md](06-MOBILE-ARQUITECTURA.md) | .NET MAUI, MVVM, CommunityToolkit, JWT auth, SecureStorage | **20** |
| **07** | [FLUJOS-NEGOCIO.md](07-FLUJOS-NEGOCIO.md) | Casos de uso end-to-end, sequence diagrams, validaciones | **25** |
| **08** | [CONSOLIDACION-REFACTORIZACION.md](08-CONSOLIDACION-REFACTORIZACION.md) | Índice maestro, diagramas arquitectura, roadmap refactoring | **18** |

**📊 Total: ~193 páginas de documentación técnica**

---

## 🎯 Resumen Ejecutivo

### Arquitectura del Sistema

**ICARUS** es un sistema empresarial modular construido con **Clean Architecture** en **.NET 8**, compuesto por:

1. **ICARUS Backend/Web** (Monolito Modular)
   - `ICARUS.Domain`: Entidades de negocio (30+ clases)
   - `ICARUS.Application`: CQRS con MediatR (96 commands + 74 queries)
   - `ICARUS.Infrastructure`: EF Core + SQL Server + Repositories
   - `ICARUS.API`: REST API con JWT para clientes móviles
   - `ICARUS.Web`: ASP.NET Core MVC con ASP.NET Identity

2. **ICARUS_MOBILE** (Aplicación Móvil)
   - .NET MAUI (Android/iOS)
   - MVVM con CommunityToolkit.Mvvm
   - Consume ICARUS.API vía JWT

### Módulos Funcionales

- **Gestión Avícola**: Galpones, producción de huevos, mortalidad, programas de vacunación/iluminación/alimentación
- **Control de Acceso**: Trabajadores, biométricos, turnos, políticas de acceso
- **Facturación**: (Módulo base, no completamente implementado)

---

## 🏗️ Diagrama de Capas

```
┌─────────────────────────────────────────────────────────┐
│              PRESENTACIÓN                               │
├───────────────────────────┬─────────────────────────────┤
│     ICARUS.Web            │    ICARUS_MOBILE            │
│  (ASP.NET Core MVC)       │    (.NET MAUI)              │
│  - Razor Views            │    - XAML Views             │
│  - Bootstrap 5            │    - MVVM Pattern           │
│  - ASP.NET Identity       │    - JWT Authentication     │
└───────────────────────────┴─────────────────────────────┘
                           ▲
                           │ HTTP/HTTPS
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    ICARUS.API                           │
│            (ASP.NET Core Web API)                       │
│  - REST Endpoints                                       │
│  - JWT Bearer Authentication                            │
│  - Swagger/OpenAPI                                      │
└─────────────────────────────────────────────────────────┘
                           ▲
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│               ICARUS.Application                        │
│                 (CQRS + MediatR)                        │
│  - Commands (96)      - Queries (74)                    │
│  - Handlers (170+)    - DTOs (100+)                     │
│  - FluentValidation   - AutoMapper                      │
└─────────────────────────────────────────────────────────┘
                           ▲
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              ICARUS.Infrastructure                      │
│          (EF Core + Repositories)                       │
│  - ApplicationDbContext                                 │
│  - GenericRepository<T>                                 │
│  - 30 Repositories específicos                          │
│  - Entity Configurations (Fluent API)                   │
└─────────────────────────────────────────────────────────┘
                           ▲
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  ICARUS.Domain                          │
│              (Core Business Logic)                      │
│  - 30+ Entities (BaseEntity)                            │
│  - Interfaces (IRepository)                             │
│  - Enums (Estados)                                      │
│  - NO external dependencies                             │
└─────────────────────────────────────────────────────────┘
                           ▲
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                SQL Server Database                      │
│           LUISCAHUANA\SQLEXPRESS (ICARUSDB)            │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Tecnologías Utilizadas

### Backend (.NET 8)
- **ASP.NET Core 8**: Web API + MVC
- **Entity Framework Core 8**: ORM con Code-First
- **MediatR**: CQRS pattern implementation
- **AutoMapper**: Object-to-object mapping
- **FluentValidation**: Input validation
- **log4net**: Logging framework
- **JWT Bearer**: API authentication
- **ASP.NET Identity**: Web authentication

### Frontend
- **Bootstrap 5**: CSS framework
- **jQuery**: JavaScript library
- **DataTables**: Interactive tables
- **SweetAlert2**: Custom alerts

### Mobile (.NET MAUI)
- **.NET MAUI**: Cross-platform framework
- **CommunityToolkit.Mvvm**: MVVM helpers
- **SecureStorage**: Token storage
- **HttpClient**: API communication

### Database
- **SQL Server 2019+**: RDBMS
- **EF Core Migrations**: Schema versioning

---

## 📊 Métricas del Proyecto

| Métrica | ICARUS Backend | ICARUS_MOBILE | Total |
|---------|----------------|---------------|-------|
| **Proyectos** | 5 | 1 | 6 |
| **Clases C#** | ~350 | ~80 | ~430 |
| **Entidades** | 30 | 15 (modelos) | 45 |
| **Commands** | 96 | - | 96 |
| **Queries** | 74 | - | 74 |
| **DTOs** | 100+ | - | 100+ |
| **Repositories** | 30 | - | 30 |
| **Controllers** | 15 (Web) + 5 (API) | - | 20 |
| **ViewModels** | 50 (Web) | 20 (Mobile) | 70 |
| **Views** | 60 (Razor) | 25 (XAML) | 85 |
| **Migrations** | 15+ | - | 15+ |
| **Líneas de código** | ~45,000 | ~12,000 | ~57,000 |

---

## 📖 Guía de Lectura

### Para Desarrolladores Nuevos

**Recomendación de lectura secuencial:**

1. **[00-RESUMEN-EJECUTIVO-ARQUITECTURA.md](00-RESUMEN-EJECUTIVO-ARQUITECTURA.md)** → Entender el big picture
2. **[01-DOMAIN-ENTIDADES.md](01-DOMAIN-ENTIDADES.md)** → Conocer el modelo de datos
3. **[07-FLUJOS-NEGOCIO.md](07-FLUJOS-NEGOCIO.md)** → Ver cómo funciona end-to-end
4. **[02-APPLICATION-CQRS.md](02-APPLICATION-CQRS.md)** → Comprender lógica de negocio
5. Profundizar en capas específicas según necesidad

### Para Arquitectos/Tech Leads

**Documentos clave:**

- **[00-RESUMEN-EJECUTIVO-ARQUITECTURA.md](00-RESUMEN-EJECUTIVO-ARQUITECTURA.md)** → Patrones y decisiones
- **[08-CONSOLIDACION-REFACTORIZACION.md](08-CONSOLIDACION-REFACTORIZACION.md)** → Análisis y roadmap
- **[03-INFRASTRUCTURE.md](03-INFRASTRUCTURE.md)** → Persistencia y configuración
- **[04-API-ENDPOINTS.md](04-API-ENDPOINTS.md)** → Contratos API

### Para Product Owners/QA

**Documentos funcionales:**

- **[07-FLUJOS-NEGOCIO.md](07-FLUJOS-NEGOCIO.md)** → Casos de uso completos
- **[05-WEB-MVC.md](05-WEB-MVC.md)** → Funcionalidad web
- **[06-MOBILE-ARQUITECTURA.md](06-MOBILE-ARQUITECTURA.md)** → Funcionalidad móvil

---

## 🔑 Conceptos Clave

### Clean Architecture

El sistema sigue **Clean Architecture** con dependencias dirigidas hacia el centro:

```
Domain (núcleo) ← Application ← Infrastructure ← Presentation
```

**Regla de oro**: Las capas internas NO conocen las externas.

### CQRS con MediatR

**Command Query Responsibility Segregation**:
- **Commands**: Modifican el estado (Create, Update, Delete)
- **Queries**: Solo leen datos (GetById, GetAll, etc.)

**Beneficios**:
- Separación clara de responsabilidades
- Validaciones específicas por operación
- Testing simplificado

### Repository Pattern + UnitOfWork

- **GenericRepository<T>**: Operaciones CRUD básicas
- **Repositorios específicos**: Queries complejas (ej: GetByClienteIdAsync)
- **UnitOfWork**: Transacciones y SaveChanges centralizado

### JWT Authentication

- **API**: JWT Bearer tokens (7 días lifetime)
- **Web**: ASP.NET Identity con cookies
- **Mobile**: JWT almacenado en SecureStorage

---

## 🛠️ Configuración del Entorno

### Requisitos Previos

- **.NET 8 SDK**: [Descargar](https://dotnet.microsoft.com/download/dotnet/8.0)
- **Visual Studio 2022** (17.8+) o VS Code
- **SQL Server 2019+** (o LocalDB)
- **Android Studio** (para desarrollo MAUI Android)

### Base de Datos

**Connection String** (appsettings.json):
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=LUISCAHUANA\\SQLEXPRESS;Database=ICARUSDB;Trusted_Connection=True;TrustServerCertificate=True"
  }
}
```

**Aplicar Migraciones**:
```bash
cd ICARUS.Infrastructure
dotnet ef database update --startup-project ../ICARUS.Web
```

### Ejecutar Proyectos

**API** (puerto 5090/7090):
```bash
cd ICARUS.API
dotnet run --launch-profile http
```

**Web** (puerto 5188/7113):
```bash
cd ICARUS.Web
dotnet run --launch-profile http
```

**Mobile** (emulador Android):
```bash
cd ICARUS_MOBILE/ICARUS_MOBILE
dotnet build -t:Run -f net8.0-android
```

---

## 📂 Estructura de Carpetas

```
DocumentacionProyectos/ICARUS/     ← DOCUMENTACIÓN CENTRALIZADA
├── README.md                      ← Este archivo
├── diagramas/                     
│   ├── clases.md                  ← Diagramas de clases Mermaid
│   ├── secuencia.md               ← Diagramas de secuencia
│   └── estado.md                  ← Diagramas de estado
├── modulos/                       ← (Pendiente: docs por módulo)
├── api/                           ← (Pendiente: docs API)
├── 00-RESUMEN-EJECUTIVO-ARQUITECTURA.md
├── 01-DOMAIN-ENTIDADES.md
├── 02-APPLICATION-CQRS.md
├── ... (documentos técnicos)
└── SISTEMA-*.md                   ← Sistemas específicos

ICARUS/ (Proyecto Principal)       ← SIN DOCUMENTACIÓN (limpio)
├── ICARUS.Domain/
├── ICARUS.Application/
├── ICARUS.Infrastructure/
├── ICARUS.API/
└── ICARUS.Web/
```

---

## 🔍 Casos de Uso Principales

### 1. Login Trabajador Móvil
[Ver flujo completo](07-FLUJOS-NEGOCIO.md#flujo-1-login-de-trabajador-móvil)

```
Mobile LoginPage → AuthenticationService → API /mobile/auth/login 
→ LoginTrabajadorCommandHandler → Repository → SQL Server
→ JWT Token generado → SecureStorage
```

### 2. Crear Registro de Producción Diaria
[Ver flujo completo](07-FLUJOS-NEGOCIO.md#flujo-2-crear-registro-de-producción-diaria)

```
Mobile CrearRegistroProduccionPage → POST /mobile/registro-produccion
→ CreateRegistroProduccionDiarioCommand → Handler → Repository
→ INSERT INTO RegistroProduccionDiario → Confirmation
```

### 3. Crear Programa de Vacunación (Web)
[Ver flujo completo](07-FLUJOS-NEGOCIO.md#flujo-3-crear-programa-de-vacunación-web)

```
Web /GestionAvicola/ProgramaVacunacion/Crear → Controller
→ CreateProgramaVacunacionCommand → Handler → Repositories
→ INSERT ProgramaVacunacion + CronogramaVacunacion (batch)
```

---

## 🐛 Debugging y Troubleshooting

### Logs

**Ubicación**:
- API: `ICARUS.API/Logs/log4net.log`
- Web: `ICARUS.Web/Logs/log4net.log`
- Mobile: `ICARUS_MOBILE/LogsMobile/emulator_log.txt`

**Formato log4net**:
```
[2024-12-31 10:30:45] INFO - ClassName.MethodName - Mensaje con contexto
```

### Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| 401 Unauthorized (API) | JWT expirado | Re-login desde mobile |
| 500 Internal Server Error | Validación fallida | Revisar logs, validar inputs |
| EF Core DbUpdateException | Constraint violado | Verificar FK, UNIQUE, CHECK |
| NullReferenceException | Falta validación defensiva | Agregar `if (obj == null)` |

---

## 🧪 Testing

**Estado Actual**: No hay tests implementados (0% cobertura)

**Recomendación**: Ver [08-CONSOLIDACION-REFACTORIZACION.md → Métricas de Calidad](08-CONSOLIDACION-REFACTORIZACION.md#métricas-de-calidad-de-código)

**Plan Sugerido**:
1. Domain entities (validaciones) → Target 80%
2. Application handlers → Target 70%
3. Repositories → Target 50%

---

## 🚧 Roadmap de Mejoras

Ver documento completo: [08-CONSOLIDACION-REFACTORIZACION.md → Roadmap](08-CONSOLIDACION-REFACTORIZACION.md#roadmap-de-implementación)

### Fase 1: Estabilización (1-2 meses)
- ✅ Documentación completa
- ⏳ Implementar unit tests (Domain + Application)
- ⏳ Consolidar DTOs/ViewModels
- ⏳ Response caching en API

### Fase 2: Optimización (3-4 meses)
- ⏳ Migrar a .NET 9
- ⏳ Distributed cache (Redis)
- ⏳ Optimizar queries N+1
- ⏳ CQRS puro con eventos

### Fase 3: Modernización (5-6 meses)
- ⏳ Separar BD lectura/escritura
- ⏳ Identity Server (autenticación unificada)
- ⏳ Considerar microservicios (si aplica)

---

## 👥 Equipo y Contribución

### Roles Sugeridos

- **Tech Lead/Arquitecto**: Decisiones arquitectónicas, code reviews
- **Backend Developers**: ICARUS.API + Application + Infrastructure
- **Frontend Developers**: ICARUS.Web (Razor + JavaScript)
- **Mobile Developers**: ICARUS_MOBILE (.NET MAUI)
- **DevOps**: CI/CD, deployment, monitoring
- **QA**: Testing manual + automatizado

### Convenciones de Código

Ver archivo raíz: [.github/copilot-instructions.md](../.github/copilot-instructions.md)

**Resumen**:
- NUNCA usar `var` para tipos built-in
- SIEMPRE usar `this.` para calificar miembros
- NUNCA usar Try-Catch sin validaciones previas
- Logging obligatorio con `NombreClase.NombreMetodo - Mensaje`
- Nombres en inglés, comentarios en español

---

## 📞 Contacto y Soporte

**Repositorios**:
- Backend/Web: `luicahleo/ICARUS`
- Mobile: `luicahleo/ICARUS_MOBILE`

**Documentación Externa**:
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [CQRS Pattern](https://docs.microsoft.com/en-us/azure/architecture/patterns/cqrs)
- [MediatR GitHub](https://github.com/jbogard/MediatR)
- [.NET MAUI Docs](https://docs.microsoft.com/en-us/dotnet/maui/)

---

## 📝 Historial de Cambios

| Versión | Fecha | Cambios |
|---------|-------|---------|
| **1.0** | Dic 2025 | Documentación inicial completa (9 documentos, 193 páginas) |

---

## ✅ Checklist de Onboarding

Para nuevos desarrolladores:

- [ ] Leer [00-RESUMEN-EJECUTIVO-ARQUITECTURA.md](00-RESUMEN-EJECUTIVO-ARQUITECTURA.md)
- [ ] Configurar entorno local (SQL Server + .NET 8 SDK)
- [ ] Clonar repositorios ICARUS + ICARUS_MOBILE
- [ ] Aplicar migraciones EF Core (`dotnet ef database update`)
- [ ] Ejecutar ICARUS.API y validar Swagger en `/swagger`
- [ ] Ejecutar ICARUS.Web y login con usuario admin
- [ ] Compilar ICARUS_MOBILE y ejecutar en emulador Android
- [ ] Leer [07-FLUJOS-NEGOCIO.md](07-FLUJOS-NEGOCIO.md) (casos de uso)
- [ ] Revisar [08-CONSOLIDACION-REFACTORIZACION.md](08-CONSOLIDACION-REFACTORIZACION.md) (mejoras)
- [ ] Hacer primer commit siguiendo convenciones

---

## 🎉 Conclusión

Este sistema ICARUS es un **ejemplo sólido de Clean Architecture en .NET 8**, con:

✅ Separación clara de responsabilidades  
✅ CQRS funcionando correctamente  
✅ Dos clientes (Web + Mobile) operativos  
✅ Documentación completa y actualizada  

**Próximo paso**: Implementar testing y optimizaciones según roadmap.

**¡Bienvenido al equipo ICARUS!** 🚀

---

**Documentación generada**: Diciembre 2025  
**Versión**: 1.0  
**Mantenedores**: Equipo de Desarrollo ICARUS  
**Licencia**: Propietaria
