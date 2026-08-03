# Tasks: [FEATURE_NAME]

## Meta

- **Spec de referencia:** `specs/[FEATURE_NAME].md`
- **Plan de referencia:** `plan-[FEATURE_NAME].md` (o equivalente)
- **Versión de tasks:** 1.0.0
- **Fecha:** YYYY-MM-DD
- **Constitución:** v1.0.0

## Convención de estados

- `pending` — no iniciada
- `in_progress` — en curso
- `completed` — cumplió Definition of Done (validaciones P2 aprobadas)
- `blocked` — bloqueada (registrar motivo)

## Tareas (ordenadas por dependencias)

### Fase 1: Preparación

- [ ] TASK-001 · `pending` · **Preparación de validaciones** (P2)
  - Configurar comandos de tests/typecheck/lint.
  - Requerimiento: REQ-NF-001
  - Dependencias: ninguna

### Fase 2: Implementación

- [ ] TASK-002 · `pending` · **Implementar [módulo A]** (P3)
  - Crear módulo con responsabilidad única.
  - Requerimiento: REQ-001
  - Dependencias: TASK-001

- [ ] TASK-003 · `pending` · **Implementar [módulo B]**
  - Requerimiento: REQ-002
  - Dependencias: TASK-002

### Fase 3: Validación y cierre

- [ ] TASK-004 · `pending` · **Pruebas y validaciones** (P2)
  - Escribir/actualizar pruebas, ejecutar typecheck y lint.
  - Requerimiento: REQ-001, REQ-002
  - Dependencias: TASK-002, TASK-003

- [ ] TASK-005 · `pending` · **Verificación de consistencia** (P4)
  - Revisión spec/plan/tasks alineados; sin trabajo no registrado.
  - Dependencias: TASK-004

## Notas

- Ninguna tarea se marca `completed` sin pasar las validaciones (P2).
- Todo trabajo debe trazar a un requerimiento del spec (P1, P4).

## Historial

| Versión | Fecha | Cambio |
|---------|-------|--------|
| 1.0.0   | YYYY-MM-DD | Creación inicial |
