# Requisitos UX — Confirmaciones y menús de acción

Complementa [casos de uso](use-cases.md) (CU10, CU11) y [RNF3 Usabilidad](non-functional.md). Define el comportamiento observable de diálogos destructivos y menús ⋯ en tablas.

---

## CU10 — Confirmar acción destructiva

| Campo | Contenido |
| --- | --- |
| **Actores** | Usuario administrativo, Administrador |
| **Objetivo** | Evitar eliminaciones accidentales con un diálogo claro y accesible |
| **Disparadores** | Eliminar documento, eliminar usuario, eliminar categoría, eliminar etiqueta |

**Flujo principal**

1. El actor abre el menú de acciones (⋯) o pulsa una acción destructiva.
2. El sistema muestra un **AlertDialog centrado** con título, descripción contextual y dos acciones: **Cancelar** (secundaria) y **Confirmar** (destructiva).
3. Al confirmar, el sistema ejecuta la acción, muestra toast de éxito o error y actualiza la vista.

**Criterios de aceptación**

| ID | Criterio |
| --- | --- |
| AC1 | El diálogo bloquea el fondo y captura foco (accesibilidad WCAG). |
| AC2 | `Escape` y **Cancelar** cierran sin efectos. |
| AC3 | El botón confirmar muestra estado pendiente y queda deshabilitado durante la petición. |
| AC4 | Mensajes en español con nombre del recurso (título, email, categoría o etiqueta). |
| AC5 | Al eliminar usuario, la descripción advierte que los documentos permanecen en el sistema. |

**Implementación**

- Componente compartido: `ConfirmDestructiveDialog` en `src/shared/components/`.
- No usar confirmación inline en tablas ni `Sheet` lateral para borrados.

---

## CU11 — Menú de acciones en tablas

| Campo | Contenido |
| --- | --- |
| **Actores** | Usuario, Administrador |
| **Objetivo** | Acceder a acciones de fila desde un menú compacto y consistente |

**Acciones por tabla**

| Tabla | Menú ⋯ |
| --- | --- |
| Documentos | Ver · Eliminar |
| Usuarios | Eliminar (no en fila propia) |
| Categorías | Editar · Eliminar |
| Etiquetas | Editar · Eliminar |

**Criterios de aceptación**

| ID | Criterio |
| --- | --- |
| AC1 | Icono `MoreHorizontal` con `aria-label="Abrir menú de acciones"`. |
| AC2 | Cada ítem ejecuta su acción (navegación, sheet de edición o AlertDialog). |
| AC3 | Ítems destructivos con estilo `text-destructive`. |

**Implementación**

- Componente compartido: `TableRowActionsMenu` en `src/shared/components/`.
- `Sheet` reservado solo para formularios de edición o creación.
