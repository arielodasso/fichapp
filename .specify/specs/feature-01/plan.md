# Plan: Fichero de Empleados y Obras

## Meta

- **Spec de referencia:** `specs/feature-01/spec.md` (REQ-001…REQ-015)
- **Versión del plan:** 1.0.0
- **Fecha:** 2026-08-03
- **Constitución:** v1.0.0

## 1. Objetivo

Implementar la aplicación full-stack del fichero de empleados y obras con
**Next.js (App Router), TypeScript y Tailwind CSS**, desplegable en Vercel.
Cubre todos los requerimientos del spec: administración de empleados y obras
(REQ-001, REQ-002), fichado de ingreso/egreso (REQ-003…REQ-006), cálculo de
horas (REQ-007), reporte semanal (REQ-008), autenticación por roles (REQ-009,
REQ-010), persistencia (REQ-011), corrección de períodos (REQ-012), registro
abierto de jefes con invitaciones por empleado (REQ-013), novedades por obra
(REQ-014) y asignación de obras por empleado (REQ-015).

## 2. Diseño propuesto

- **Arquitectura:** Next.js App Router full-stack. `Route Handlers`
  (`app/api/**/route.ts`) actúan como API serverless; la UI usa componentes
  React (Client Components donde haya estado) y la lógica pura vive en módulos
  `lib/domain` (sin dependencias de Next ni de la base de datos).
- **Base de datos:** PostgreSQL (p. ej. Vercel Postgres / Neon). Capa de datos
  aislada en `lib/db` (pool + consultas), sin SQL disperso en la API.
- **Autenticación:** credenciales (email + contraseña) con hash (`bcrypt`),
  sesión por cookie JWT (opción preferida) — **alternativa descartada:** JWT
  en `localStorage` (vulnerable a XSS).
- **Roles:** campo `role` en la tabla `users` (`ADMIN` / `EMPLOYEE`); guard de
  autorización en las rutas de administración y reportes. El registro público
  está **abierto**: cualquier usuario crea su cuenta `ADMIN` (jefe) en cualquier
  momento. Los empleados ingresan mediante **invitaciones** generadas por el
  jefe (código único de 6 caracteres, validez 30 días, reutilizable mientras
  esté pendiente); el canje crea la cuenta `EMPLOYEE` y vincula el perfil en una
  transacción con `FOR UPDATE` (REQ-013). Al crear un empleado sin usuario, el
  sistema genera el enlace de invitación automáticamente (REQ-015).
- **Obras por empleado:** relación muchos a muchos en la tabla `empleado_obras`.
  La capa de datos carga `obraIds` en cada empleado (`fetchObraIds` +
  `asignarObrasEmpleado` con reemplazo transaccional) y expone
  `listObrasDeEmpleado`; la UI del jefe muestra un selector de obras por
  empleado (REQ-015).
- **Zona horaria:** se almacena en UTC; el cálculo semanal y la presentación se
  convierten a la zona local (REQ-NF-003).
- **Diseño:** Tailwind CSS para la UI (formularios, tablas, dashboard del
  reporte).

**Flujo principal (fichada):**

```
Empleado (UI) → POST /api/fichadas {tipo: ingreso|egreso}
  → domain/horarios (valida período activo / doble fichada)
  → db (INSERT/UPDATE período) → respuesta
```

**Flujo del reporte:**

```
Jefe (UI) → GET /api/reportes/semana?fecha=...
  → domain/reportes (agrupa lunes a domingo)
  → domain/horarios (suma horas)
  → respuesta { porObra: { obra: { empleado: horas } } }
```

## 3. Estructura modular (P3)

| Módulo/Archivo | Acción | Responsabilidad |
|----------------|--------|-----------------|
| `package.json`, `tsconfig.json`, `next.config.ts`, `postcss/tailwind` | Crear | Setup del proyecto Next.js + TypeScript + Tailwind. |
| `app/layout.tsx`, `app/page.tsx`, `app/globals.css` | Crear | Layout base y raíz. |
| `app/(auth)/login/page.tsx` | Crear | Pantalla de login (REQ-010). |
| `app/(app)/dashboard/page.tsx` | Crear | Home según rol (REQ-009). |
| `app/(app)/fichadas/page.tsx` + `FichadaForm.tsx` | Crear | UI de ingreso/egreso (REQ-003…REQ-006). |
| `components/ui.tsx`, `components/icons.tsx` | Crear | Primitivos de UI (Button, Card, Badge, Alert, EmptyState…) e iconos SVG del rediseño (v1.2.0). |
| `app/(app)/layout.tsx` + `nav-links.tsx`, `app/(auth)/login/page.tsx` | Crear | Shell con navegación por rol y login split-screen (v1.2.0). |
| `app/(app)/empleados/page.tsx` + componentes | Crear | UI de administración de empleados (REQ-001). |
| `app/(app)/obras/page.tsx` + componentes | Crear | UI de administración de obras (REQ-002). |
| `app/(app)/reportes/page.tsx` | Crear | UI del reporte semanal (REQ-008). |
| `app/api/auth/register/route.ts`, `app/api/auth/login/route.ts`, `app/api/auth/logout/route.ts` | Crear | Autenticación (REQ-010). |
| `app/api/empleados/route.ts` + `app/api/empleados/[id]/route.ts` | Crear | CRUD empleados (REQ-001). |
| `app/api/obras/route.ts` + `app/api/obras/[id]/route.ts` | Crear | CRUD obras (REQ-002). |
| `app/api/fichadas/route.ts` | Crear | Ingreso/egreso (REQ-003…REQ-006). |
| `app/api/reportes/semana/route.ts` | Crear | Reporte semanal (REQ-008). |
| `lib/domain/horarios.ts` | Crear | Reglas de ingreso/egreso y cálculo de horas (REQ-003…REQ-007). |
| `lib/domain/reportes.ts` | Crear | Agrupación semanal por obra y empleado (REQ-008). |
| `lib/services/auth.ts` | Crear | Hash, sesión y guard de roles (REQ-009, REQ-010). |
| `lib/db/schema.sql` + `lib/db/migrate.ts` | Crear | Esquema y migraciones (REQ-011). |
| `lib/db/client.ts` + repos (`empleados.ts`, `obras.ts`, `fichadas.ts`, `users.ts`) | Crear | Acceso a datos (REQ-001…REQ-012). |
| `lib/domain/invitaciones.ts` + `lib/db/invitaciones.ts` | Crear | Códigos de invitación y transacción de canje con `FOR UPDATE` (REQ-013). |
| `lib/services/invitaciones.ts` | Crear | `generarInvitacionEmpleado`: genera o reutiliza el enlace pendiente y devuelve el link absoluto (REQ-013, REQ-015). |
| `lib/db/empleados.ts` (`obraIds`, `asignarObrasEmpleado`) + `lib/db/obras.ts` (`listObrasDeEmpleado`) + `lib/db/schema.sql` (`empleado_obras`) | Modificar | Asignación de obras por empleado, muchos a muchos (REQ-015). |
| `app/(app)/empleados/page.tsx` + `empleados-screen.tsx` | Modificar | Cargar obras; selector de obras por empleado, badges por fila y banner de enlace al crear (REQ-015). |
| `app/api/auth/registro-invitado/route.ts`, `app/api/invitaciones/route.ts` + `[id]/route.ts`, `app/(auth)/registro/*` | Crear | Registro por invitación y gestión de enlaces por el jefe (REQ-013). |
| `lib/db/novedades.ts` + `app/api/obras/[id]/novedades/route.ts` + `[novedadId]/route.ts` | Crear | Novedades por obra (máx. 500 caracteres; DELETE autor o jefe) (REQ-014). |
| `app/(app)/obras/[id]/page.tsx` + `obra-screen.tsx` | Crear | Detalle de obra con novedades y edición (REQ-002, REQ-014). |
| Tests (`tests/`, `lib/domain/*.test.ts`) | Crear | Validación por módulo (P2). |

## 4. Plan de implementación

Pasos ordenados, cada uno vinculado a su requerimiento:

1. Inicializar Next.js (App Router) + TypeScript + Tailwind, configurar lint y
   scripts de validación. → REQ-NF-001, REQ-NF-005
2. Crear esquema de base de datos y capa `lib/db` (users, empleados, obras,
   periodos). → REQ-011
3. Implementar `lib/services/auth` (hash, sesión JWT, guard de roles). →
   REQ-009, REQ-010
4. Implementar CRUD de empleados (API + UI). → REQ-001
5. Implementar CRUD de obras (API + UI). → REQ-002
6. Implementar `lib/domain/horarios` (ingreso/egreso, doble fichada, cálculo de
   horas). → REQ-003…REQ-007
7. Implementar API y UI de fichadas (check-in/check-out). → REQ-003…REQ-006
8. Implementar `lib/domain/reportes` + API + UI del reporte semanal. →
   REQ-008
9. Implementar corrección de períodos por el jefe. → REQ-012
10. Mantener el registro por invitación y abrir el registro público de jefes
    (eliminar bootstrap 403). → REQ-013
11. Agregar novedades por obra (tabla, API GET/POST/DELETE y detalle de obra).
    → REQ-014
12. Asignar obras a cada empleado: tabla `empleado_obras`, `obraIds` en la capa
    de datos y rutas, selector y badges en la UI, enlace de invitación
    automático al crear el empleado y migración en Neon. → REQ-015
13. Validación integral: pruebas, typecheck, lint, verificación de persistencia
    contra Neon y despliegue en Vercel. → REQ-NF-001, REQ-NF-005, P2

## 5. Estrategia de validación (P2)

- **`lib/domain/horarios`:** unit tests (período activo, doble fichada, egreso
  sin ingreso, cálculo de horas).
- **`lib/domain/reportes`:** unit tests (agrupación lunes–domingo, totales por
  obra/empleado, cruce de semanas).
- **`lib/services/auth`:** unit tests (hash, sesión, permisos por rol).
- **API:** integration tests de los route handlers (auth, empleados, obras,
  fichadas, reportes).
- **UI:** smoke tests de los flujos principales (login, fichada, reporte).
- **Comandos:** `npm run lint`, `npm run typecheck`, `npm run test`.
- **Verificación de aceptación:** recorrer los criterios del spec §3 contra la
  app desplegada en Vercel.

## 6. Riesgos y mitigación

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Zonas horarias incorrectas al sumar horas semanales | Reportes erróneos | Todo en UTC; conversión a local en una única capa; tests con fechas límite. |
| Concurrencia en doble fichada (dos peticiones a la vez) | Períodos duplicados | Check atómico con constraint de índice único + transacción. |
| Costos/límites de la BD en serverless | Fallos en producción | Pool de conexiones, migraciones idempotentes, plan de Postgres de Vercel. |
| JWT en `localStorage` (XSS) | Robo de sesión | Cookie `httpOnly` + `SameSite`. |
| Migración de esquema en producción | Pérdida de datos | Migraciones versionadas e idempotentes, backup previo. |

## 7. Constitución Check

- [x] Todo cambio de código respaldado por un requerimiento del spec (P1).
- [x] Definition of Done cubierta por validaciones estrictas (P2).
- [x] Estructura modular respetada (P3) — dominio desacoplado de Next y de la BD.
- [x] Trazabilidad spec → tarea → código garantizada (P4).
- [x] Sin regresiones de comportamiento ya especificado (P5).

## 8. Historial

| Versión | Fecha | Cambio |
|---------|-------|--------|
| 1.0.0   | 2026-08-03 | Creación inicial |
| 1.3.0   | 2026-08-03 | REQ-013 (registro solo-Jefe + invitaciones por empleado) y REQ-014 (novedades por obra): se actualizan Roles, se agregan módulos e invariantes de canje en transacción. |
| 1.4.0   | 2026-08-03 | REQ-013 modificado (registro de jefes abierto, sin bootstrap) y REQ-015 (asignación de obras por empleado): se agrega `empleado_obras`, `obraIds`, `listObrasDeEmpleado`, `generarInvitacionEmpleado` y el enlace automático al crear el empleado. |
