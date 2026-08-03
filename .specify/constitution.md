<!--
Sync Impact Report
- Version: v0.0.0 → v1.0.0 (ratificación inicial)
- Principles modificados: N/A (creación inicial)
- Secciones añadidas: Preámbulo, Principios P1–P5, Gobernanza, Roles y Proceso
- Secciones eliminadas: N/A
- Plantillas pendientes de crear/sincronizar: spec-template.md, plan-template.md, tasks-template.md
- TODOs diferidos: [PROJECT_NAME] (definir el nombre del proyecto)
-->

# Constitución del Proyecto

## Meta

- **Proyecto:** [PROJECT_NAME]
- **Versión de la Constitución:** 1.0.0
- **Fecha de ratificación:** 2026-08-03
- **Última enmienda:** 2026-08-03

## Preámbulo

Este proyecto se desarrolla bajo **Desarrollo Guiado por Especificaciones
(Specification-Driven Development, SDD)**. Todo trabajo de ingeniería parte de
una especificación clara y verificable, y todo cambio de código debe poder
trazarse hasta un requerimiento concreto. El código es un artefacto derivado de
la especificación, no al revés.

## Principios

### P1 — Requerimiento antes que código (Spec-First)

- **MUST** Todo cambio de código debe estar respaldado por un requerimiento
  claro, explícito y rastreable definido en una especificación (`spec.md`).
- **MUST** No se acepta código "ad hoc", experimental o sin requerimiento
  asociado en ramas de integración ni en producción.
- **MUST** Si durante la implementación se detecta un requerimiento ausente o
  ambiguo, el equipo debe aclararlo/registrarlo en la especificación antes de
  continuar escribiendo código.

*Justificación:* un requerimiento explícito convierte el código en algo
verificable, elimina el trabajo no intencional y permite auditar por qué
existe cada línea.

### P2 — Validaciones estrictas (Definition of Done)

- **MUST** Ningún cambio se considera completado hasta que pase **todas** las
  validaciones definidas para el proyecto: pruebas automáticas, typecheck y
  lint.
- **MUST** Cada cambio que añada o modifique comportamiento debe incluir o
  actualizar sus pruebas.
- **MUST** Un cambio con validaciones en fallo se devuelve a estado "en
  progreso"; no se cierra ni se integra.
- **SHOULD** Las validaciones se ejecutan de forma automatizada y repetible en
  CI antes de la integración.

*Justificación:* las validaciones estrictas son la única garantía objetiva de
que el código cumple el requerimiento y no introduce regresiones.

### P3 — Estructura modular

- **MUST** El código se organiza en módulos pequeños con responsabilidad única.
- **MUST** Se favorece el bajo acoplamiento y la alta cohesión: cada módulo
  depende de contratos/abstracciones claras, no de detalles internos de otros.
- **MUST** Los módulos son reutilizables e intercambiables sin efectos
  colaterales no previstos.
- **SHOULD** La estructura de archivos refleja los límites lógicos del dominio
  (carpetas/capas coherentes con la especificación).

*Justificación:* un diseño modular hace el sistema más legible, testeable y
menos costoso de evolucionar.

### P4 — Trazabilidad spec → tarea → código

- **MUST** Cada tarea (`tasks.md`) se deriva de una especificación y cada
  cambio de código cita el requerimiento o tarea que lo respalda.
- **MUST** La especificación se mantiene como fuente de verdad; si el código y
  el spec divergen, es el spec el que se corrige y versiona.
- **SHOULD** Los commits describen el requerimiento que satisfacen y el
  identificador del spec/tarea asociado.

*Justificación:* la trazabilidad convierte el historial en una línea de
evidencia auditable de decisiones.

### P5 — No regresión y mejora continua

- **MUST** Todo cambio preserva el comportamiento ya especificado; está
  prohibido romper funcionalidad existente sin un requerimiento explícito que
  lo justifique.
- **SHOULD** Al corregir defectos se añade una prueba de regresión que
  reproduzca el fallo.
- **SHOULD** Se revisa periódicamente el cumplimiento de los principios y se
  proponen mejoras de proceso.

*Justificación:* la estabilidad y la mejora del proceso son parte del producto.

## Gobernanza

### Procedimiento de enmienda

1. Se propone el cambio redactando la cláusula nueva/modificada.
2. Se evalúa el impacto semántico (ver política de versionado).
3. Se aplica la enmienda actualizando `LAST_AMENDED_DATE`.
4. Si el cambio afecta plantillas o comandos, se propagan las actualizaciones
   y se registran en el Sync Impact Report.

### Política de versionado (SemVer)

- **MAJOR:** elimina o redefine principios — gobernanza incompatible con
  versiones anteriores.
- **MINOR:** añade un principio o sección nuevo, o expande materialmente una
  guía.
- **PATCH:** aclaraciones, correcciones de redacción y refinamientos no
  semánticos.

### Revisión de cumplimiento

- Al cerrar cada feature se ejecuta una verificación de consistencia entre
  spec, plan y tasks (análisis no destructivo).
- Todo trabajo pendiente del spec se registra explícitamente; no se asume
  implícitamente.

## Roles y Proceso (resumen del flujo SDD)

1. **Especificar:** redactar/actualizar la especificación del feature.
2. **Planear:** diseñar el plan de implementación y sus artefactos.
3. **Tareas:** generar `tasks.md` ordenado por dependencias.
4. **Implementar:** ejecutar las tareas cumpliendo P1–P5.
5. **Verificar:** validaciones estrictas (P2) y análisis de consistencia.
