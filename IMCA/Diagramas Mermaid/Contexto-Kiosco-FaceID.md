# 📱 IMCA Kiosco - Contexto Técnico FaceID

> **Última actualización**: 2026-01-15  
> **Estado**: ✅ Validado en pruebas reales

---

## 🏗️ Arquitectura del Sistema

```mermaid
flowchart TB
    subgraph Mobile["📱 IMCA Mobile (MAUI)"]
        UI[KioscoPage.xaml]
        VM[KioscoViewModel]
        ONNX[MobileFaceNet<br/>128-dim embeddings]
        Cache[EmbeddingsCache]
        SQLite[(SQLite Local)]
    end
    
    subgraph Backend["🖥️ ICARUS Backend"]
        API[ICARUS.API<br/>:5090]
        ARGOS[ARGOS Server<br/>:5000 - ArcFace]
        DB[(SQL Server)]
    end
    
    UI --> VM
    VM --> ONNX
    VM --> Cache
    VM --> SQLite
    VM <--> API
    VM <--> ARGOS
    API --> DB
    ARGOS --> API
    
    style ONNX fill:#90EE90
    style ARGOS fill:#FFD700
    style Cache fill:#87CEEB
```

---

## 🔐 Flujo de Verificación Facial

```mermaid
stateDiagram-v2
    [*] --> SeleccionTrabajador: Click "Iniciar"
    
    SeleccionTrabajador --> CapturaFoto: Selecciona + Continuar
    
    CapturaFoto --> ONNX_Local: Extraer embedding
    
    ONNX_Local --> Verificado: ≥75% similitud
    ONNX_Local --> ZonaGris: 40-75% similitud
    ONNX_Local --> Rechazado: <40% similitud
    
    ZonaGris --> ARGOS_Check: Fallback a ArcFace
    
    ARGOS_Check --> Verificado: ID correcto confirmado
    ARGOS_Check --> ImpostorDetectado: Match con OTRO ID
    ARGOS_Check --> Rechazado: No identificado
    
    Verificado --> RegistroCreado: ✅ Entrada/Salida
    Rechazado --> IncrementarIntentos
    ImpostorDetectado --> IncrementarIntentos
    
    IncrementarIntentos --> ForzarARGOS: 3er intento
    IncrementarIntentos --> SeleccionTrabajador: Intentos 1-2
    
    ForzarARGOS --> Verificado: ARGOS confirma
    ForzarARGOS --> Rechazado: ARGOS rechaza
    
    RegistroCreado --> [*]
```

---

## ⚙️ Configuración Validada

### Umbrales de Verificación

| Zona | Rango | Motor | Acción |
|------|-------|-------|--------|
| **Verificado** | ≥75% | ONNX Local | ✅ Registro directo |
| **Zona Gris** | 40-75% | ONNX → ARGOS | ⚠️ Fallback a ArcFace |
| **Rechazado** | <40% | ONNX Local | ❌ Rechazo directo |

### Resultados de Pruebas Reales (2026-01-15)

| Escenario | ONNX | ARGOS | Resultado |
|-----------|------|-------|-----------|
| Victor (real) | 88-92% | - | ✅ Verificado directo |
| Victor (ángulo difícil) | 49-71% | 65% | ✅ Verificado vía ARGOS |
| Impostor similar | 60-71% | 22% (match ID=7) | ❌ Rechazado |

---

## 📊 Modelo de Datos

```mermaid
erDiagram
    TrabajadorLocal {
        int Id PK
        int TrabajadorApiId
        string Nombre
        string Documento
        byte[] FotoThumbnail
        byte[] EmbeddingMobileFN
    }
    
    RegistroLocal {
        int Id PK
        int TrabajadorLocalId FK
        DateTime FechaHora
        string Tipo "Entrada|Salida"
        bool Sincronizado
        int IntentosSincronizacion
        DateTime ProximoIntento
        int RegistroIdBackend
    }
    
    EmbeddingsCache {
        int TrabajadorApiId PK
        float[] Embedding "128 floats"
    }
    
    TrabajadorLocal ||--o{ RegistroLocal : tiene
    TrabajadorLocal ||--o| EmbeddingsCache : cached
```

---

## 🔄 Sincronización

```mermaid
flowchart LR
    subgraph Local["📱 SQLite"]
        Pendiente[Registro Pendiente]
    end
    
    subgraph Sync["⏱️ Timer 5s/5min"]
        Check{Delay<br/>cumplido?}
    end
    
    subgraph API["🖥️ Backend"]
        Endpoint[/sincronizar-batch/]
    end
    
    Pendiente --> Check
    Check -->|Sí| Endpoint
    Check -->|No| Wait[Esperar<br/>2^n × 60s]
    
    Endpoint -->|OK| Sincronizado[✅ Sincronizado]
    Endpoint -->|Duplicado| Retry[🔄 Retry +1]
    Endpoint -->|Error| Retry
    
    Wait --> Pendiente
    Retry --> Pendiente
```

### Backoff Exponencial
- Intento 1: 2 min delay
- Intento 2: 4 min delay  
- Intento 3: 8 min delay
- Máximo: 5 intentos

---

## 📁 Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `Features/Kiosco/KioscoViewModel.cs` | Lógica principal, contador intentos |
| `Features/Kiosco/KioscoPage.xaml` | UI del kiosco |
| `Core/Services/EmbeddingsCache.cs` | Cache + umbrales verificación |
| `Core/Services/ArgosService.cs` | Cliente ARGOS (ArcFace) |
| `Core/Services/SyncService.cs` | Sincronización con backoff |
| `IMCA.Tests/` | 26 tests unitarios |

---

## 🎯 Decisiones de Diseño

1. **Por qué 40% para zona gris**: Permite que casos borderline pasen a ARGOS (más preciso) sin rechazar automáticamente.

2. **Por qué 3 intentos antes de forzar ARGOS**: Balance entre UX (evitar bloquear usuario legítimo) y seguridad.

3. **Por qué backoff exponencial**: Evita saturar API en caso de errores, permite recuperación gradual.

4. **ONNX vs ARGOS**:
   - ONNX (MobileFaceNet): Rápido (~400ms), 128-dim, suficiente para matches claros
   - ARGOS (ArcFace): Lento (~3s), 512-dim, más preciso para casos difíciles

---

## 🐛 Problemas Conocidos

| Issue | Estado | Workaround |
|-------|--------|------------|
| Registros duplicados en sync | ✅ Manejado | API rechaza, cliente hace retry |
| ARGOS timeout ocasional | ✅ Manejado | Incrementa contador, retry |
| Skipped frames en Android | ⚠️ Cosmético | No afecta funcionalidad |
