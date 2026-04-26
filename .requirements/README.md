# Requirements

Mezcla de documentación **en español** (IPS / trabajo académico) y plantillas **en inglés** para features puntuales.

## Contenido principal

| Archivo | Propósito |
| --- | --- |
| [requerimiento_funcional.md](requerimiento_funcional.md) | Comportamiento del producto (RF numerados) |
| [non-functional.md](non-functional.md) | Seguridad, rendimiento, usabilidad, etc. (RNF) |
| [use-cases.md](use-cases.md) | Casos de uso y flujos |
| [auth.md](auth.md) | Autenticación, sesión y rutas protegidas (criterios CA + checklist) |

## Docs del proyecto

- [Contexto operacional](../docs/contexto_operacional.md) — entorno, actores, stack
- [Planteamiento del problema](../docs/problema.md) — motivación e investigación

## Plantilla y features en inglés

- [template.md](template.md) — plantilla Given / When / Then
- `<feature>.md` — requisitos por feature siguiendo la plantilla

## Proceso sugerido

1. Definir o actualizar RF/RNF y casos de uso antes de implementar cambios amplios
2. Cada criterio de aceptación debe poder comprobarse (prueba manual o automatizada)
3. Validar la implementación contra los criterios antes de dar por cerrada la tarea
