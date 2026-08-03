# Spec: Trabajo Práctico — Fichero de Empleados y Obras

## Meta

- **Estado:** DRAFT
- **Versión del spec:** 1.0.0
- **Fecha de creación:** 2026-08-03
- **Última actualización:** 2026-08-03
- **Constitución:** v1.0.0

## 1. Contexto

Se necesita una aplicación web full-stack, desplegable en Vercel, que funcione
como fichero digital de empleados y obras. Hoy el control se realiza en papel
o de forma manual; el objetivo es digitalizar el registro de ingreso y egreso
de empleados a cada obra, llevar el control de horarios y generar, al final de
cada semana, un reporte que permita al jefe ver cuántas horas dedicó cada
empleado a cada obra.

## 2. Requerimientos (P1)

Cada requerimiento es claro, explícito y rastreable. Se referencian desde
`tasks.md` y desde los commits.

### 2.1 Requerimientos funcionales

| ID | Descripción del requerimiento | Prioridad |
|----|-------------------------------|-----------|
| REQ-001 | Registrar empleados: crear, listar, editar y desactivar un empleado (nombre, apellido, rol, activo/inactivo). | Alta |
| REQ-002 | Registrar obras: crear, listar, editar y desactivar una obra (nombre, descripción, estado). | Alta |
| REQ-003 | Permitir a un empleado registrar su **ingreso (check-in)** a una obra con fecha y hora. | Alta |
| REQ-004 | Permitir a un empleado registrar su **egreso (check-out)** de la obra en la que está trabajando. | Alta |
| REQ-005 | El egreso solo se acepta si el empleado tiene un ingreso activo (sin egreso) en alguna obra; al egresar se cierra ese período de trabajo. | Alta |
| REQ-006 | Impedir un nuevo ingreso mientras el empleado tenga un período activo sin cerrar (control de doble fichada). | Alta |
| REQ-007 | Calcular automáticamente la duración de cada período (ingreso → egreso) en horas. | Alta |
| REQ-008 | Generar un **reporte semanal** (de lunes a domingo) que muestre, por obra y por empleado, las horas totales trabajadas esa semana. | Alta |
| REQ-009 | Acceso por roles: el empleado registra sus fichadas; el jefe consulta los reportes semanales y administra empleados y obras. | Alta |
| REQ-010 | Autenticación de usuarios (email + contraseña) para acceso a la aplicación. | Alta |
| REQ-011 | Persistir todos los datos (empleados, obras, fichadas, usuarios) de forma duradera. | Alta |
| REQ-012 | Corregir/eliminar un período de trabajo erróneo (solo por el jefe, dejando registro de la corrección). | Media |

### 2.2 Requerimientos no funcionales

| ID | Descripción | Prioridad |
|----|-------------|-----------|
| REQ-NF-001 | La aplicación debe poder desplegarse en **Vercel** como full-stack (frontend + API serverless + base de datos). | Alta |
| REQ-NF-002 | Todas las entradas de usuario se validan en frontend y backend (fechas, horas, campos obligatorios, formatos). | Alta |
| REQ-NF-003 | Los horarios se almacenan y procesan con zona horaria consistente (UTC en base de datos, local en presentación). | Alta |
| REQ-NF-004 | Seguridad básica: contraseñas con hash, sesiones/JWT, permisos por rol. | Alta |
| REQ-NF-005 | El proyecto debe pasar typecheck y lint; las validaciones son parte de la Definition of Done (P2). | Alta |
| REQ-NF-006 | Estructura modular: separación clara entre frontend, API y lógica de dominio (P3). | Media |
| REQ-NF-007 | Trazabilidad: cada commit referencia el REQ que satisface (P4). | Media |

## 3. Criterios de aceptación

Criterios verificables que definen la "Definition of Done" de este feature
(cumplir P2):

- [ ] Un empleado puede registrarse ingreso/egreso y el sistema calcula las
      horas del período.
- [ ] El sistema rechaza un segundo ingreso con período activo y rechaza un
      egreso sin ingreso activo.
- [ ] El jefe genera el reporte semanal y ve horas por empleado y por obra,
      agrupadas por semana (lunes a domingo).
- [ ] Un usuario sin rol de jefe no accede a la administración ni a los
      reportes.
- [ ] La aplicación se despliega en Vercel y funciona con la base de datos en
      producción.
- [ ] Todas las validaciones de datos funcionan en frontend y backend.
- [ ] Typecheck y lint pasan sin errores (P2).

## 4. Límites y fuera de alcance

- **Dentro de alcance:** fichado de ingreso/egreso, control de horarios,
  reporte semanal por empleado/obra, administración de empleados y obras,
  autenticación y roles, despliegue en Vercel.
- **Fuera de alcance:** nómina o cálculo de sueldos, facturación, notificaciones
  por email, aplicación móvil, geolocalización del fichado, integración con
  sistemas de RR.HH.

## 5. Estructura modular esperada (P3)

Describir los módulos/componentes a crear o modificar y sus responsabilidades:

| Módulo | Responsabilidad | Acoplamiento |
|--------|-----------------|--------------|
| `frontend/` (componentes UI) | Pantallas de login, fichadas, empleados, obras y reportes. | Depende solo de la API. |
| `api/` (rutas serverless) | Endpoints REST de autenticación, empleados, obras, fichadas y reportes. | Orquesta servicios de dominio y base de datos. |
| `domain/horarios` | Lógica de cálculo de horas y reglas de ingreso/egreso (REQ-003 a REQ-007). | Sin dependencias externas. |
| `domain/reportes` | Agrupación semanal (lunes a domingo) por obra y empleado (REQ-008). | Usa `domain/horarios`. |
| `services/auth` | Autenticación, hash de contraseñas y autorización por rol (REQ-009, REQ-010). | Sin dependencias externas. |
| `db/` | Esquema, migraciones y acceso a datos (empleados, obras, fichadas, usuarios). | Interfaz de datos para servicios. |

## 6. Validaciones y pruebas (P2)

- [ ] Pruebas automáticas de la lógica de horarios (períodos, doble fichada,
      cálculo de horas).
- [ ] Pruebas de la generación del reporte semanal (agrupación y totales).
- [ ] Pruebas de autenticación y permisos por rol.
- [ ] Pruebas de los endpoints de la API.
- [ ] Typecheck aprobado.
- [ ] Lint aprobado.
- [ ] Sin regresiones en funcionalidad especificada (P5).

## 7. Riesgos y supuestos

- **Supuestos:**
  - El despliegue usará Next.js (full-stack en Vercel) u otro stack que
    soporte rutas serverless y una base de datos compatible (p. ej. Postgres).
  - La semana laboral se define de lunes 00:00 a domingo 23:59 (hora local).
  - El jefe es un usuario con rol administrador creado en el sistema.
- **Riesgos:**
  - Manejo incorrecto de zonas horarias al sumar horas semanales.
  - Reglas de doble fichada con concurrencia (dos peticiones simultáneas).
  - Costos/limitaciones de la base de datos en entorno serverless.

## 8. Historial

| Versión | Fecha | Cambio |
|---------|-------|--------|
| 1.0.0   | 2026-08-03 | Creación inicial |
