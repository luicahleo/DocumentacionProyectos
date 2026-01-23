# Guía de Ejecución de Pruebas - Registro de Producción

**Fecha de Ejecución**: 09 de Diciembre 2025  
**Tester**: [Tu nombre]  
**Ambiente**: Emulador Android / Dispositivo Físico  
**API**: http://localhost:5090 (Visual Studio 2022)

---

## 📋 Pre-requisitos

### ✅ Verificaciones Iniciales

- [ ] **ICARUS.API está corriendo** en Visual Studio 2022 (puerto 5090)
- [ ] **Base de datos** tiene datos de prueba configurados
- [ ] **Emulador Android** está iniciado O dispositivo físico conectado
- [ ] **ICARUS_MOBILE** compilado sin errores

### 📊 Datos de Prueba Necesarios

```sql
-- Verificar en SQL Server Management Studio:

-- 1. Cliente de prueba
SELECT * FROM Cliente WHERE Nombre LIKE '%Test%' OR Id = 1;

-- 2. Galpones del cliente
SELECT g.Id, g.Numero, g.NumeroGallinasActual, ga.ClienteId
FROM Galpon g
INNER JOIN GestorAvicola ga ON g.GestorAvicolaId = ga.Id
WHERE ga.ClienteId = 1 AND g.EstaActivo = 1;

-- 3. Trabajador de prueba
SELECT Id, Email, Nombre, ClienteId, IsActiveForLogin
FROM Trabajador
WHERE Email = 'ok3@icarus.com';

-- 4. Verificar si ya existen registros hoy
SELECT * FROM RegistroProduccionDiario
WHERE Fecha = CAST(GETDATE() AS DATE)
ORDER BY FechaCreacion DESC;
```

**Resultado Esperado**:
- ✅ Al menos 1 cliente activo
- ✅ Al menos 2-3 galpones con gallinas > 0
- ✅ Trabajador "ok3@icarus.com" activo y vinculado al cliente
- ✅ Registros de hoy (si existen) para validar duplicados

---

## 🚀 Inicio de Sesión

### Credenciales de Prueba
```
Email: ok3@icarus.com
Password: [Password del trabajador en BD]
```

### Pasos:
1. Abrir ICARUS_MOBILE en emulador
2. Ingresar email y contraseña
3. Hacer clic en "Iniciar Sesión"
4. **Verificar**: Navegación exitosa a HomePage

**Logs Esperados** (Ver en: `LogsMobile/logMobile.txt`):
```
[INFO] LoginViewModel.LoginAsync - Iniciando login
[INFO] AuthenticationService.LoginAsync - Login exitoso
[INFO] Navegación a HomePage completada
```

---

## 🧪 TEST CASES - ALTA PRIORIDAD

---

## ✅ TC001: Carga Inicial de Galpones Disponibles

### Objetivo
Verificar que al abrir la página se cargan los galpones del cliente del trabajador

### Precondiciones
- Usuario autenticado como ok3@icarus.com
- API corriendo
- Cliente tiene al menos 1 galpón activo

### Pasos de Ejecución

1. **Navegar al módulo**
   - [ ] Desde HomePage, tocar "Gestión Avícola"
   - [ ] Tocar "Crear Registro de Producción"

2. **Observar carga inicial**
   - [ ] Aparece spinner de carga
   - [ ] Spinner desaparece después de 1-3 segundos

3. **Verificar formulario**
   - [ ] Fecha por defecto: HOY (09/12/2025)
   - [ ] Picker "Galpón" tiene opciones disponibles
   - [ ] Todos los campos numéricos están vacíos
   - [ ] NO hay mensajes de error

4. **Verificar opciones del Picker**
   - [ ] Tocar Picker "Galpón"
   - [ ] Se muestran galpones con formato: "Galpón X (Y gallinas)"
   - [ ] Al menos 1 opción disponible

### Resultado Esperado

✅ **APROBADO** si:
- Carga exitosa sin errores
- Picker muestra al menos 1 galpón
- Formato correcto: "Número - Nombre (X gallinas)"
- Fecha = hoy

❌ **FALLA** si:
- Error de conexión
- Picker vacío (sin galpones)
- Mensaje de error visible
- App crashea

### Logs a Verificar

Abrir archivo: `ICARUS_MOBILE/LogsMobile/logMobile.txt`

```
[INFO] CrearRegistroProduccionViewModel.CargarGalponesAsync - Iniciando carga
[INFO] RegistroProduccionService.GetGalponesDisponiblesAsync - Iniciando obtención
[INFO] Galpones obtenidos exitosamente: X
[INFO] CrearRegistroProduccionViewModel.CargarGalponesAsync - Galpones cargados: X
```

### Captura de Pantalla
- [ ] Tomar screenshot de formulario con Picker lleno

### Estado: [ ] APROBADO  [ ] FALLA  [ ] NO EJECUTADO

**Observaciones**:
```
[Anotar cualquier comportamiento inesperado]
```

---

## ✅ TC002: Cálculos Automáticos en Tiempo Real

### Objetivo
Verificar que los cálculos se actualizan automáticamente al cambiar valores

### Precondiciones
- TC001 completado exitosamente
- Galpón seleccionado: Uno con ~15000 gallinas (ajustar según disponible)

### Pasos de Ejecución

1. **Seleccionar galpón**
   - [ ] Abrir Picker "Galpón"
   - [ ] Seleccionar un galpón (ej: Galpón 7 - 15000 gallinas)
   - [ ] Picker cierra mostrando selección

2. **Ingresar Maples**
   - [ ] Tocar campo "Cantidad de Maples"
   - [ ] Ingresar: `450`
   - [ ] Observar campo "Total Huevos"

   **Verificar**: Total Huevos = **13,500** (450 × 30)

3. **Ingresar Unidades Incompletas**
   - [ ] Tocar campo "Unidades Incompletas"
   - [ ] Ingresar: `15`
   - [ ] Observar actualización de "Total Huevos"

   **Verificar**: Total Huevos = **13,515** (450 × 30 + 15)

4. **Verificar Eficiencia**
   - [ ] Observar campo/label "Eficiencia de Producción"

   **Calcular**: 13,515 / 15,000 × 100 = **90.1%**
   
   **Verificar**: Eficiencia ≈ **90.1%**

5. **Ingresar Mortalidad**
   - [ ] Tocar campo "Gallinas Muertas"
   - [ ] Ingresar: `5`
   - [ ] Observar campo "Porcentaje de Mortalidad"

   **Calcular**: 5 / 15,000 × 100 = **0.03%**
   
   **Verificar**: Mortalidad = **0.03%**
   **Verificar**: NO hay alerta roja (< 2%)

6. **Probar Mortalidad Alta**
   - [ ] Cambiar "Gallinas Muertas" a: `350`
   - [ ] Observar indicador visual

   **Calcular**: 350 / 15,000 × 100 = **2.33%**
   
   **Verificar**: Mortalidad = **2.33%**
   **Verificar**: Aparece alerta roja o badge "¡Mortalidad Alta!"

### Resultado Esperado

✅ **APROBADO** si:
- Total Huevos calcula correctamente (Maples × 30 + Unidades)
- Eficiencia calcula correctamente (Huevos / Gallinas × 100)
- Mortalidad calcula correctamente (Muertas / Gallinas × 100)
- Alerta de mortalidad aparece cuando > 2%
- Cálculos se actualizan SIN hacer clic en botón

❌ **FALLA** si:
- Cálculos incorrectos
- No se actualizan automáticamente
- Alerta no aparece con mortalidad > 2%

### Tabla de Verificación

| Campo | Valor Ingresado | Valor Calculado Esperado | Valor Mostrado | ✓/✗ |
|-------|-----------------|--------------------------|----------------|-----|
| Maples | 450 | - | 450 | |
| Unidades | 15 | - | 15 | |
| Total Huevos | - | 13,515 | | |
| Eficiencia | - | 90.1% | | |
| Muertas | 5 | - | 5 | |
| Mortalidad | - | 0.03% | | |
| Alerta Roja | - | NO | | |
| Muertas | 350 | - | 350 | |
| Mortalidad | - | 2.33% | | |
| Alerta Roja | - | SÍ | | |

### Estado: [ ] APROBADO  [ ] FALLA  [ ] NO EJECUTADO

**Observaciones**:
```
[Anotar valores exactos mostrados y cualquier discrepancia]
```

---

## ✅ TC003: Validación de Campos Requeridos

### Objetivo
Verificar que el formulario valida campos obligatorios antes de guardar

### Precondiciones
- Usuario en CrearRegistroProduccionPage
- Formulario vacío o parcialmente lleno

### Pasos de Ejecución

#### Escenario 1: Sin Galpón Seleccionado

1. **Dejar formulario vacío**
   - [ ] Asegurar que NO hay galpón seleccionado
   - [ ] Hacer clic en botón "Guardar" o "Crear Registro"

2. **Verificar alerta**
   - [ ] Aparece mensaje de error
   - [ ] Texto contiene: "Debe seleccionar un galpón" o similar

   **Verificar**: ❌ Error mostrado correctamente

#### Escenario 2: Sin Cantidad de Maples

1. **Llenar parcialmente**
   - [ ] Seleccionar un galpón
   - [ ] Dejar "Cantidad de Maples" vacío o en 0
   - [ ] Hacer clic en "Guardar"

2. **Verificar comportamiento**
   - [ ] ¿Se permite guardar con 0 maples?
   - [ ] ¿Aparece validación?

   **Nota**: Según validación, Maples = 0 es válido (día sin producción)

#### Escenario 3: Unidades Incompletas Fuera de Rango

1. **Ingresar valor inválido**
   - [ ] Seleccionar galpón
   - [ ] Ingresar Maples: `100`
   - [ ] Ingresar Unidades: `30` (inválido, debe ser < 30)
   - [ ] Hacer clic en "Guardar"

2. **Verificar alerta**
   - [ ] Aparece error
   - [ ] Texto: "Las unidades incompletas deben estar entre 0 y 29"

   **Verificar**: ❌ Validación funciona

3. **Probar valor válido**
   - [ ] Cambiar Unidades a: `29`
   - [ ] Hacer clic en "Guardar" (con otros campos completos)

   **Verificar**: ✅ NO hay error de unidades

#### Escenario 4: Fecha Futura

1. **Cambiar fecha**
   - [ ] Tocar campo de fecha
   - [ ] Seleccionar fecha FUTURA (ej: 10/12/2025)
   - [ ] Llenar todos los demás campos correctamente
   - [ ] Hacer clic en "Guardar"

2. **Verificar alerta**
   - [ ] Aparece error
   - [ ] Texto: "La fecha no puede ser futura"

   **Verificar**: ❌ Validación funciona

3. **Corregir fecha**
   - [ ] Cambiar fecha a HOY (09/12/2025)
   - [ ] Hacer clic en "Guardar" (ahora debe proceder)

#### Escenario 5: Mortalidad Sin Detalles

1. **Ingresar mortalidad**
   - [ ] Llenar formulario básico correctamente
   - [ ] Ingresar Gallinas Muertas: `5`
   - [ ] Dejar vacío "Causa Probable Mortalidad"
   - [ ] Dejar vacío "Acciones Tomadas"
   - [ ] Hacer clic en "Guardar"

2. **Verificar alertas**
   - [ ] Aparecen 2 errores:
     - "Debe especificar la causa probable de mortalidad"
     - "Debe especificar las acciones tomadas ante la mortalidad"

   **Verificar**: ❌ Validación condicional funciona

3. **Completar detalles**
   - [ ] Causa: "Enfermedad respiratoria"
   - [ ] Acciones: "Aislamiento y medicación"
   - [ ] Hacer clic en "Guardar" (ahora debe proceder)

### Resultado Esperado

✅ **APROBADO** si:
- Validación de galpón requerido funciona
- Validación de unidades 0-29 funciona
- Validación de fecha no futura funciona
- Validación condicional de mortalidad funciona
- Mensajes de error son claros y específicos
- NO se envía request al API si hay errores

❌ **FALLA** si:
- Permite guardar con datos inválidos
- No muestra mensajes de error
- Mensajes de error genéricos o confusos
- Envía request al API con datos incorrectos

### Checklist de Validaciones

| Validación | Funciona Correctamente | ✓/✗ |
|------------|------------------------|-----|
| Galpón requerido | | |
| Maples >= 0 | | |
| Unidades 0-29 | | |
| Fecha no futura | | |
| Muertas >= 0 | | |
| Si Muertas > 0: Causa requerida | | |
| Si Muertas > 0: Acciones requeridas | | |

### Estado: [ ] APROBADO  [ ] FALLA  [ ] NO EJECUTADO

**Observaciones**:
```
[Anotar mensajes de error exactos y comportamiento]
```

---

## ✅ TC008: Guardar Registro Exitosamente (Happy Path)

### Objetivo
Verificar el flujo completo de guardado de un registro válido

### Precondiciones
- Usuario autenticado: ok3@icarus.com
- Galpón disponible (ej: Galpón 7 con 15000 gallinas)
- NO existe registro previo para HOY en ese galpón
- API backend corriendo

### Pasos de Ejecución

#### Preparación

1. **Verificar que NO hay registro hoy**
   ```sql
   -- Ejecutar en SQL Server:
   SELECT * FROM RegistroProduccionDiario
   WHERE GalponId = 7 AND Fecha = CAST(GETDATE() AS DATE);
   
   -- Resultado esperado: 0 filas (sin registro)
   ```

2. **Navegar a formulario**
   - [ ] HomePage → Gestión Avícola → Crear Registro

#### Llenado del Formulario

3. **Completar todos los campos**
   - [ ] **Fecha**: 09/12/2025 (hoy, default)
   - [ ] **Galpón**: Seleccionar "Galpón 7 (15000 gallinas)"
   - [ ] **Maples**: `450`
   - [ ] **Unidades**: `15`
   - [ ] **Gallinas Muertas**: `5`
   - [ ] **Observaciones**: "Producción normal del día"
   - [ ] **Causa Mortalidad**: "Enfermedad respiratoria"
   - [ ] **Acciones**: "Aislamiento y medicación"

4. **Verificar cálculos automáticos**
   - [ ] Total Huevos: **13,515**
   - [ ] Eficiencia: **90.1%**
   - [ ] Mortalidad: **0.03%**
   - [ ] NO hay alerta roja

#### Guardar

5. **Hacer clic en botón "Guardar" o "Crear Registro"**
   
   **Observar comportamiento**:
   - [ ] Botón se deshabilita durante guardado
   - [ ] Aparece spinner o indicador de carga
   - [ ] Spinner dura 1-3 segundos

6. **Verificar notificación de éxito**
   - [ ] Aparece Toast VERDE o Snackbar
   - [ ] Texto: "✓ Registro creado exitosamente" o similar
   - [ ] Notificación se muestra por 2-3 segundos

7. **Verificar limpieza del formulario**
   - [ ] Fecha se resetea a HOY
   - [ ] Galpón se deselecciona (vuelve a "Seleccionar galpón...")
   - [ ] Todos los campos numéricos se vacían
   - [ ] Campos de texto se limpian
   - [ ] Cálculos vuelven a 0

#### Verificación en Base de Datos

8. **Consultar registro creado**
   ```sql
   -- Ejecutar en SQL Server:
   SELECT TOP 1 
       Id,
       Fecha,
       GalponId,
       CantidadMaples,
       UnidadesIncompletas,
       GallinasMuertas,
       PorcentajeMortalidad,
       Observaciones,
       CausaProbableMortalidad,
       AccionesTomadasMortalidad,
       CreadoPor,
       FechaCreacion
   FROM RegistroProduccionDiario
   WHERE GalponId = 7 AND Fecha = CAST(GETDATE() AS DATE)
   ORDER BY FechaCreacion DESC;
   ```

   **Verificar valores en BD**:
   - [ ] Fecha = 09/12/2025
   - [ ] GalponId = 7
   - [ ] CantidadMaples = 450
   - [ ] UnidadesIncompletas = 15
   - [ ] GallinasMuertas = 5
   - [ ] PorcentajeMortalidad = 0.03 (decimal)
   - [ ] Observaciones = "Producción normal del día"
   - [ ] CausaProbableMortalidad = "Enfermedad respiratoria"
   - [ ] AccionesTomadasMortalidad = "Aislamiento y medicación"
   - [ ] CreadoPor = "ok3@icarus.com"
   - [ ] FechaCreacion = Timestamp actual

#### Verificación de Logs

9. **Revisar archivo de logs**
   
   Abrir: `ICARUS_MOBILE/LogsMobile/logMobile.txt`
   
   **Buscar secuencia**:
   ```
   [INFO] CrearRegistroProduccionViewModel.GuardarRegistroAsync - Iniciando guardado
   [INFO] Email trabajador obtenido: ok3@icarus.com
   [INFO] Fecha sin hora a enviar: 2025-12-09 00:00:00
   [INFO] RegistroProduccionService.CrearRegistroProduccionAsync - Iniciando creación
   [INFO] Fecha a enviar: 2025-12-09
   [INFO] JSON serializado: {...}
   [INFO] Registro creado exitosamente: ID 123
   [INFO] Registro guardado exitosamente: ID 123
   ```

10. **Revisar logs de API** (Visual Studio Output)
    
    **Buscar en consola de VS**:
    ```
    [INFO] RegistroProduccionMobileController.CrearRegistro - Request recibido
    [INFO] CreadoPor: ok3@icarus.com
    [INFO] Registro creado exitosamente
    ```

### Resultado Esperado

✅ **APROBADO** si:
- Guardado exitoso sin errores
- Toast verde aparece
- Formulario se limpia automáticamente
- Registro existe en BD con valores correctos
- Campo `CreadoPor` = "ok3@icarus.com"
- Logs completos sin errores

❌ **FALLA** si:
- Error HTTP 400/401/500
- No aparece notificación de éxito
- Formulario no se limpia
- Registro no existe en BD
- Campo `CreadoPor` es null o incorrecto
- Logs muestran errores

### Checklist de Verificación

| Verificación | OK | ✓/✗ |
|--------------|----|----|
| Request enviado al API | | |
| HTTP Status Code = 201 Created | | |
| Toast verde mostrado | | |
| Formulario limpio después de guardar | | |
| Registro existe en BD | | |
| Valores en BD son correctos | | |
| CreadoPor = ok3@icarus.com | | |
| Logs sin errores | | |
| Performance < 3 segundos | | |

### Captura de Pantalla
- [ ] Screenshot de notificación de éxito
- [ ] Screenshot de formulario limpio
- [ ] Screenshot de registro en BD (SQL Server)

### Estado: [ ] APROBADO  [ ] FALLA  [ ] NO EJECUTADO

**ID del Registro Creado**: ____________

**Tiempo de Guardado**: _______ segundos

**Observaciones**:
```
[Anotar cualquier comportamiento relevante]
```

---

## 📊 Resumen de Ejecución

### Resultados

| Test Case | Estado | Tiempo | Observaciones |
|-----------|--------|--------|---------------|
| TC001: Carga Inicial | | | |
| TC002: Cálculos Automáticos | | | |
| TC003: Validaciones | | | |
| TC008: Guardar Exitoso | | | |

**Total Aprobados**: ____ / 4  
**Total Fallas**: ____ / 4  
**Tasa de Éxito**: _____%

### Defectos Encontrados

| ID | Severidad | Descripción | Test Case | Estado |
|----|-----------|-------------|-----------|--------|
| | | | | |

**Plantilla de Defecto**:
```
ID: BUG-001
Severidad: Alta/Media/Baja
Test Case: TC00X
Descripción: [Descripción detallada]
Pasos para Reproducir:
  1. 
  2.
  3.
Resultado Esperado: 
Resultado Actual:
Estado: Abierto/En Progreso/Resuelto
```

### Conclusiones

**Estado General**: [ ] APROBADO  [ ] FALLA  [ ] PARCIAL

**Comentarios**:
```
[Resumen de la ejecución, problemas encontrados, recomendaciones]
```

---

## 📝 Próximos Pasos

Si todos los test cases de Alta Prioridad pasan:
- [ ] Ejecutar test cases de Media Prioridad (TC004-TC007, TC009)
- [ ] Ejecutar test cases de Baja Prioridad (TC011-TC020)
- [ ] Pruebas de regresión
- [ ] Pruebas de performance

Si hay fallas críticas:
- [ ] Documentar defectos en detalle
- [ ] Crear issues en GitHub
- [ ] Notificar al equipo de desarrollo
- [ ] Esperar correcciones antes de continuar

---

**Ejecutado por**: ___________________  
**Fecha**: 09/12/2025  
**Hora inicio**: _______  
**Hora fin**: _______  
**Duración total**: _______ minutos

**Firma**: ___________________
