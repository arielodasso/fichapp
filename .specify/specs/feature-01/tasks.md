# Tasks: Fichero de Empleados y Obras

## Meta

- **Spec de referencia:** `specs/feature-01/spec.md`
- **Plan de referencia:** `specs/feature-01/plan.md`
- **Versión de tasks:** 1.0.0
- **Fecha:** 2026-08-03
- **Constitución:** v1.0.0

## Convención de estados

- `pending` — no iniciada
- `in_progress` — en curso
- `completed` — cumplió Definition of Done (validaciones P2 aprobadas)
- `blocked` — bloqueada (registrar motivo)

## Tareas (ordenadas por dependencias)

### Fase 1: Preparación

- [x] TASK-001 · `completed` · **Setup del proyecto Next.js + TypeScript + Tailwind** (P3)
  - Inicializar Next.js (App Router), TypeScript y Tailwind CSS.
  - Configurar scripts de validación: `lint`, `typecheck`, `test`.
  - Requerimiento: REQ-NF-001, REQ-NF-005
  - Dependencias: ninguna

- [x] TASK-002 · `completed` · **Esquema de base de datos y capa de datos** (P3)
  - Crear `lib/db/schema.sql` y migraciones idempotentes (users, empleados,
    obras, periodos).
  - Crear `lib/db/client.ts` y repos: `users.ts`, `empleados.ts`, `obras.ts`,
    `fichadas.ts`.
  - Índice único para evitar doble fichada (REQ-006).
  - Requerimiento: REQ-011
  - Dependencias: TASK-001

### Fase 2: Autenticación y roles

- [x] TASK-003 · `completed` · **Servicio de autenticación** (P3)
  - Implementar `lib/services/auth.ts`: hash de contraseñas, sesión por cookie
    JWT (`httpOnly`, `SameSite`), guard de roles.
  - Requerimiento: REQ-009, REQ-010, REQ-NF-004
  - Dependencias: TASK-002

- [x] TASK-004 · `completed` · **Endpoints y UI de autenticación**
  - Crear `app/api/auth/register`, `login`, `logout` y pantalla de login.
  - Requerimiento: REQ-010
  - Dependencias: TASK-003

### Fase 3: Dominio y fichadas

- [x] TASK-005 · `completed` · **Módulo de horarios** (P3)
  - Implementar `lib/domain/horarios.ts`: validación de período activo,
    rechazo de doble fichada, cálculo de horas del período (UTC).
  - Requerimiento: REQ-003…REQ-007, REQ-NF-003
  - Dependencias: TASK-002

- [x] TASK-006 · `completed` · **Endpoints y UI de fichadas**
  - Crear `app/api/fichadas/route.ts` (check-in/check-out) y la pantalla de
    fichadas.
  - Usar `lib/domain/horarios` para validar ingreso/egreso.
  - Requerimiento: REQ-003…REQ-006
  - Dependencias: TASK-004, TASK-005

### Fase 4: Administración de empleados y obras

- [x] TASK-007 · `completed` · **CRUD de empleados**
  - Crear `app/api/empleados/route.ts`, `app/api/empleados/[id]/route.ts` y UI.
  - Requerimiento: REQ-001
  - Dependencias: TASK-004

- [x] TASK-008 · `completed` · **CRUD de obras**
  - Crear `app/api/obras/route.ts`, `app/api/obras/[id]/route.ts` y UI.
  - Requerimiento: REQ-002
  - Dependencias: TASK-004

### Fase 5: Reportes y correcciones

- [x] TASK-009 · `completed` · **Módulo de reportes** (P3)
  - Implementar `lib/domain/reportes.ts`: agrupación semanal (lunes a domingo)
    por obra y empleado, sumando horas.
  - Requerimiento: REQ-008
  - Dependencias: TASK-005

- [x] TASK-010 · `completed` · **API y UI del reporte semanal**
  - Crear `app/api/reportes/semana/route.ts` y la pantalla del reporte
    (acceso solo para el jefe, REQ-009).
  - Requerimiento: REQ-008, REQ-009
  - Dependencias: TASK-009, TASK-007, TASK-008

- [x] TASK-011 · `completed` · **Corrección de períodos**
  - Endpoint y UI para que el jefe corrija/elimine un período erróneo, con
    registro de la corrección.
  - Requerimiento: REQ-012
  - Dependencias: TASK-010

### Fase 6: Validación y cierre

- [x] TASK-012 · `completed` · **Pruebas y validaciones** (P2)
  - Unit tests de `horarios` y `reportes`; integration tests de la API;
    smoke tests de login, fichada y reporte.
  - Ejecutar `lint`, `typecheck`, `test` sin errores.
  - Requerimiento: todos los REQ (Definition of Done)
  - Dependencias: TASK-003…TASK-011

- [ ] TASK-013 · `pending` · **Despliegue en Vercel**
  - Configurar proyecto de Vercel, base de datos en producción y migraciones.
  - Verificar criterios de aceptación del spec §3 en la app desplegada.
  - Requerimiento: REQ-NF-001
  - Dependencias: TASK-012

- [x] TASK-014 · `completed` · **Verificación de consistencia** (P4)
  - Revisión spec/plan/tasks alineados; sin trabajo no registrado.
  - Auditoría (5 ejes) completada: validación de entrada en boundaries
    (REQ-NF-002), bootstrap de jefe en registro (REQ-009), deduplicación de
    helpers de formato, sin props muertos, `lang="es"`, ignores de ESLint.
  - La aceptación post-deploy (spec §3) queda cubierta por TASK-013.
  - Dependencias: TASK-013

### Fase 7: Invitaciones y novedades (REQ-013, REQ-014)

- [x] TASK-015 · `completed` · **Dominio y capa de datos de invitaciones**
  - `lib/domain/invitaciones.ts`: `normalizarCodigo`, `generarCodigoInvitacion`
    (alfabeto sin O/0/I/1), `expiracionInvitacion` (30 días).
  - `lib/db/invitaciones.ts`: `createInvitacion`,
    `findInvitacionPendientePorEmpleado`, `findInvitacionVigentePorCodigo`,
    `listInvitaciones`, `deleteInvitacion`,
    `registrarEmpleadoInvitado` (transacción con `FOR UPDATE`).
  - `lib/db/users.ts`: `countAdmins()`.
  - Tabla `invitaciones` en `lib/db/schema.sql` y migración aplicada en Neon.
  - Requerimiento: REQ-013
  - Dependencias: TASK-002, TASK-003

- [x] TASK-016 · `completed` · **Registro por invitación y cierre del registro público**
  - `app/api/auth/register` reescrito: crea Jefe solo si `countAdmins() === 0`,
    si no responde 403.
  - `app/api/auth/registro-invitado`: valida el código y vincula el empleado
    dentro de una transacción.
  - Páginas `app/(auth)/registro/*` (validación del enlace) y login con alerta
    de registro cerrado.
  - Requerimiento: REQ-009, REQ-010, REQ-013
  - Dependencias: TASK-015

- [x] TASK-017 · `completed` · **API y UI de invitaciones (jefe)**
  - `app/api/invitaciones/route.ts` (GET con estado/link, POST con reutilización
    de pendientes) y `app/api/invitaciones/[id]/route.ts` (DELETE).
  - Botón "Invitar" y banner con enlace copiable en la pantalla de empleados;
    badge "Invitación pendiente" por fila.
  - Requerimiento: REQ-013
  - Dependencias: TASK-015, TASK-016

- [x] TASK-018 · `completed` · **Novedades por obra (REQ-014)**
  - `lib/db/novedades.ts` y tabla `novedades_obra` (con migración aplicada).
  - `app/api/obras/[id]/novedades` (GET/POST, máx. 500 caracteres) y
    `.../[novedadId]` (DELETE: autor o jefe).
  - Detalle de obra con form de novedad y lista (autor, fecha, eliminar).
  - `Obras` visible para empleados (solo activas) y acceso rápido en el
    dashboard.
  - Requerimiento: REQ-002, REQ-014
  - Dependencias: TASK-008

- [x] TASK-019 · `completed` · **Pruebas de invitaciones y novedades** (P2)
  - Tests de `app/api/auth/register` (bootstrap + 403 con jefe existente),
    `app/api/auth/registro-invitado`, `app/api/invitaciones`,
    `app/api/obras/[id]/novedades` y su DELETE, y `lib/domain/invitaciones`.
  - `lint`, `typecheck`, `test` (97 tests) y `build` aprobados.
  - Requerimiento: REQ-013, REQ-014, REQ-NF-005
  - Dependencias: TASK-015…TASK-018

- [ ] TASK-020 · `pending` · **Deploy y smoke test de invitaciones y novedades**
  - Commit + push, deploy en Vercel y verificación en producción del registro
    por invitación y las novedades por obra.
  - Requerimiento: REQ-NF-001, REQ-013, REQ-014
  - Dependencias: TASK-019

## Notas

- Ninguna tarea se marca `completed` sin pasar las validaciones (P2).
- Todo trabajo debe trazar a un requerimiento del spec (P1, P4).
- TASK-003, TASK-005 y TASK-009 son módulos de dominio puro (P3): no deben
  depender de Next.js ni de la base de datos.

## Historial

| Versión | Fecha | Cambio |
|---------|-------|--------|
| 1.0.0   | 2026-08-03 | Creación inicial |
| 1.1.0   | 2026-08-03 | Auditoría P2/P4: cierre de escalada de rol en registro (primer usuario = Jefe), validación de UUIDs en rutas, deduplicación de formato, `lang="es"`, ignores ESLint para `.opencode`. TASK-014 completada. |
| 1.2.0   | 2026-08-03 | Rediseño integral de UI (Soft UI Evolution): design tokens claro/oscuro en `globals.css`, tipografía Plus Jakarta Sans, primitivos en `components/ui.tsx`, iconos SVG en `components/icons.tsx`, nueva navegación con estados activos, login split-screen, dashboard con resumen semanal y accesos rápidos, y pantallas fichadas/empleados/obras/reportes/períodos rediseñadas. Validado con lint, typecheck, 72 tests y build. |
| 1.3.0   | 2026-08-03 | REQ-013 y REQ-014: registro público solo-Jefe con invitaciones por empleado (enlace único, 30 días) y novedades por obra (máx. 500 caracteres). Rebranch a FichApp en metadata, login, registro y navegación. TASK-015…TASK-019 completadas; validado con lint, typecheck, 97 tests y build. TASK-020 (deploy) pendiente. |
