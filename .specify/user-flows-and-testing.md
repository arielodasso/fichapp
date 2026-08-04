# User Flows & Testing Guidelines — FichApp

## Meta

- **Proyecto:** FichApp — Fichero de Empleados y Obras
- **Versión del documento:** 1.0.0
- **Fecha de creación:** 2026-08-04
- **Última actualización:** 2026-08-04
- **Constitución:** v1.0.0
- **Spec asociado:** `.specify/specs/feature-01/spec.md`
- **Entorno de producción:** `https://fichapp-one.vercel.app`

## 1. Alcance

Este documento centraliza los **recorridos principales** de la aplicación y las
**directrices de prueba (smoke tests)** para validar que el backend, las
migraciones en Neon (Postgres) y la interfaz responden correctamente en
producción.

Los recorridos cubren las pantallas `/login`, `/registro`, el panel de
**Jefe** (ADMIN), el panel de **Empleado**, la asignación de obras, las
invitaciones y los reportes.

Cada flujo referencia los requerimientos del spec (`REQ-00X`) para mantener la
trazabilidad exigida por la constitución (P1, P4).

## 2. Modelo de roles y navegación

| Rol | Rutas principales | Responsabilidad |
|-----|-------------------|-----------------|
| Jefe (ADMIN) | `/dashboard`, `/empleados`, `/obras`, `/obras/[id]`, `/fichadas`, `/reportes`, `/periodos` | Administrar obras, empleados e invitaciones; supervisar fichadas en vivo; generar reportes semanales. |
| Empleado | `/dashboard`, `/fichadas`, `/obras/[id]` | Ver solo sus obras asignadas y registrar ingreso/egreso (REQ-009, REQ-015). |

- La raíz `/` redirige a `/dashboard` si hay sesión, o a `/login` si no.
- El menú de navegación se filtra por rol: el empleado **no ve** Empleados,
  Reportes ni Periodos (REQ-009).

## 3. Flujo de Jefes

### 3.1 Registro libre de cuenta de jefe

1. Ir a `/login` y alternar a **"Registrarse"**.
2. Completar **Nombre, Email y Contraseña** (mín. 8 caracteres).
3. Enviar el formulario. La cuenta se crea con rol **ADMIN** sin intervención
   de nadie (REQ-013).
4. Verificar que el sistema redirige a `/dashboard` con sesión iniciada.

> Regla: el registro público está **abierto**; cualquier usuario puede crear una
> cuenta de jefe en cualquier momento (REQ-013).

### 3.2 Creación y persistencia de obras

1. En `/obras` (sección **Obras**), crear una obra con nombre y descripción.
2. Verificar que la obra aparece en la lista y **persiste** tras recargar la
   página (se persiste en Neon; REQ-002, REQ-011).
3. Editar el nombre/descripción y activar/desactivar la obra (`Activa`).
4. Entrar a la obra (`/obras/[id]`) y verificar el detalle, el estado y la
   gestión de novedades (REQ-014).

### 3.3 Alta de empleado con enlace de invitación único

1. En `/empleados`, crear un empleado con **nombre, apellido y rol**, y asignar
   las obras que podrá fichear (REQ-015).
2. Al guardar sin usuario vinculado, el sistema **genera y muestra
   automáticamente** el enlace de invitación único del empleado (REQ-013).
   Formato: `https://fichapp-one.vercel.app/registro?invitacion=<código>`.
3. Copiar el enlace (botón copiar) y compartirlo con el empleado.
4. El enlace es de **uso único** y **vence a los 30 días**; el sistema muestra
   la fecha de expiración junto al empleado en la lista.

### 3.4 Reenvío de invitación

1. Si el empleado aún no se registró, el Jefe puede **regenerar el enlace** de
   invitación desde la lista de empleados (REQ-013).
2. El enlace anterior queda invalidado; el nuevo vuelve a tener vigencia de
   30 días.

## 4. Flujo de Empleados

### 4.1 Registro mediante enlace de invitación

1. Abrir el enlace recibido: `/registro?invitacion=<código>`.
2. Verificar que el sistema **precarga el nombre del perfil** vinculado
   ("Perfil vinculado") para que el invitado solo complete **email y
   contraseña** (el nombre no se pide; se deriva del perfil).
3. Completar email y contraseña y crear la cuenta.
4. Verificar la redirección a `/dashboard` con rol **Empleado**.
5. Reintentar con el mismo enlace: debe fallar (uso único). Un enlace vencido
   o inexistente muestra "Enlace de invitación no disponible" (REQ-013).

### 4.2 Visualización exclusiva de obras asignadas

1. En `/fichadas`, el selector de obra **solo muestra las obras asignadas** al
   empleado (REQ-015).
2. La API rechaza fichar en una obra **no asignada** con el mensaje "La obra no
   está asignada a tu perfil".
3. El empleado no ve las rutas de administración ni de reportes (REQ-009).

### 4.3 Fichado de ingreso y egreso

1. **Ingreso:** seleccionar una obra asignada y registrar **Ingreso**.
   - El sistema rechaza un segundo ingreso mientras exista un período abierto
     (control de doble fichada; REQ-006).
2. **Egreso:** pulsar **"Registrar egreso"**.
   - El sistema rechaza un egreso sin ingreso activo (REQ-005).
   - Al egresar, se calcula automáticamente la duración del período en horas
     (REQ-007).
3. Verificar el **historial** de períodos con fecha de ingreso, fecha de
   egreso y horas calculadas.
4. Verificar el estado "En curso" (Badge ámbar) mientras el período esté
   abierto, y que la obra queda bloqueada para nuevo ingreso.

## 5. Flujo de Reportes y Supervisión (Jefe)

### 5.1 Navegación por semanas

1. En `/reportes`, el encabezado muestra el rango **de lunes a domingo** de la
   semana actual (REQ-008).
2. Usar los botones **Anterior / Siguiente** para navegar entre semanas
   (URL: `/reportes?fecha=YYYY-MM-DD`).
3. Verificar que los totales cambian según la semana seleccionada y que la
   semana laboral se calcula como lunes 00:00 → domingo 23:59 (hora local).

### 5.2 Cálculo de empleados activos y horas totales

1. Las tarjetas de resumen muestran:
   - **Horas totales** de la semana.
   - **Obras con actividad**.
   - **Empleados activos** (empleados con perfil activo registrado, no solo los
     que tuvieron horas en la semana).
2. La tabla agrupa por **obra → empleado → horas**, con total por obra y
   **Total general** al pie.
3. Verificar que el total general = suma de horas de todos los empleados de
   todas las obras.

### 5.3 Supervisión en vivo (Fichadas de Jefe)

1. En `/fichadas`, el panel ADMIN muestra las tarjetas:
   - **En obra ahora** (períodos abiertos).
   - **Fichadas hoy** (ingresos/egresos del día).
   - **Horas hoy**.
   - **Empleados activos**.
2. La tabla **"Fichadas del día"** lista los períodos con vínculo al detalle de
   períodos (`/periodos`) para corregir/eliminar un período erróneo (REQ-012).

## 6. Casos de prueba / Smoke Tests (producción)

Entorno objetivo: `https://fichapp-one.vercel.app`.

### 6.0 Validaciones previas (local, Definition of Done / P2)

Ejecutar en el repo antes de considerar un deploy válido:

| Comando | Resultado esperado |
|---------|--------------------|
| `npm run typecheck` | Sin errores de TypeScript |
| `npm run lint` | Sin errores de ESLint |
| `npm test` | 15 archivos / 107 tests en verde |
| `npm run build` | Build de Next.js exitoso |

### 6.1 Backend y autenticación

| # | Caso | Pasos | Resultado esperado |
|---|------|-------|--------------------|
| 1 | Login correcto | `POST /api/auth/login` con email+password válidos | 200 + cookie de sesión |
| 2 | Login inválido | Email o contraseña incorrecta | 401 con mensaje claro |
| 3 | Registro jefe | `POST /api/auth/register` con nombre/email/password | 201, cuenta ADMIN creada |
| 4 | Registro invitado | `POST /api/auth/registro-invitado` con `codigo` vigente | 201, usuario Empleado vinculado al perfil |
| 5 | Registro invitado duplicado | Mismo `codigo` usado dos veces | Error (uso único, REQ-013) |
| 6 | Registro invitado vencido | `codigo` expirado (>30 días) o inexistente | Error "enlace no disponible" |
| 7 | Sesión y logout | `POST /api/auth/logout` | 200 y acceso a `/dashboard` redirige a `/login` |

### 6.2 Migraciones y persistencia en Neon

| # | Caso | Pasos | Resultado esperado |
|---|------|-------|--------------------|
| 8 | Persistencia de obra | Crear obra → recargar `/obras` | La obra sigue presente (REQ-002, REQ-011) |
| 9 | Persistencia de empleado + asignación | Crear empleado con obras asignadas → recargar `/empleados` | Empleado y sus obras asignadas persisten (REQ-015) |
| 10 | Persistencia de invitación | Crear empleado → refrescar | Enlace de invitación vigente y expiración visibles (REQ-013) |
| 11 | Persistencia de fichadas | Ingreso → egreso → recargar `/fichadas` | Período con horas calculadas presente en historial (REQ-007) |
| 12 | Persistencia de novedad | Publicar novedad en `/obras/[id]` → recargar | Novedad con autor y fecha presente (REQ-014) |

### 6.3 Interfaz (UI) — Empleado

| # | Caso | Pasos | Resultado esperado |
|---|------|-------|--------------------|
| 13 | Doble fichada | Empleado con período abierto intenta nuevo ingreso | Rechazado con mensaje (REQ-006) |
| 14 | Egreso sin ingreso | Empleado sin período activo intenta egreso | Rechazado (REQ-005) |
| 15 | Obra no asignada | Fichar en obra no asignada (vía API) | Error "La obra no está asignada a tu perfil" (REQ-015) |
| 16 | Obras visibles | Abrir selector de obra en `/fichadas` | Solo aparecen las obras asignadas |
| 17 | Acceso por rol | Empleado intenta abrir `/empleados` o `/reportes` | Redirigido/bloqueado (REQ-009) |

### 6.4 Interfaz (UI) — Jefe

| # | Caso | Pasos | Resultado esperado |
|---|------|-------|--------------------|
| 18 | Navegación de semanas | `/reportes` → Anterior/Siguiente | Cambia el rango lunes-domingo y los totales (REQ-008) |
| 19 | Empleados activos | Semana con empleados activos sin horas | El contador refleja el perfil activo |
| 20 | Supervisión en vivo | `/fichadas` con empleados en obra | "En obra ahora" y "Fichadas hoy" consistentes |
| 21 | Corrección de período | `/periodos` → corregir/eliminar un período | Cambio aplicado y registrado (REQ-012) |
| 22 | Edición de obra | `/obras/[id]` → activar/desactivar y editar | Persiste tras recarga |

### 6.5 Checklist de producción

- [ ] Las 22 casos anteriores pasan en `https://fichapp-one.vercel.app`.
- [ ] El favicon y el isologo se renderizan en el header, login y registro.
- [ ] El ícono de pantalla de inicio (PWA: `icon-192.png`, `icon-512.png`,
      `apple-touch-icon.png`) se ve correcto al "Agregar a pantalla de inicio".
- [ ] Modo claro y oscuro funcionan y mantienen contraste (REQ-NF-004).
- [ ] No hay datos de prueba residuales que ensucien el reporte semanal del
      Jefe real (limpiar empleados/obras de prueba tras el smoke).

## 7. Notas de implementación

- **Código de invitación:** se normaliza al leer `?invitacion=` en
  `/registro` (`normalizarCodigo`) y se valida contra `findInvitacionVigentePorCodigo`.
- **Nombre precargado:** en el registro invitado el nombre se deriva del perfil
  (`nombre = name || nombrePerfil`); el formulario solo pide email y contraseña.
- **Asignación de obras:** relación muchos a muchos persistida; el backend
  (`POST /api/fichadas`) valida que la obra pertenezca al empleado.
- **Reporte semanal:** agrupación lunes-domingo en hora local; `empleadosActivos`
  proviene del servicio de reportes (no de empleados con horas).
- **Zona horaria:** almacenamiento en UTC, presentación local (REQ-NF-003).

## 8. Historial

| Versión | Fecha | Cambio |
|---------|-------|--------|
| 1.0.0   | 2026-08-04 | Creación inicial: flujos de Jefe, Empleado y Reportes/Supervisión + smoke tests de producción |
