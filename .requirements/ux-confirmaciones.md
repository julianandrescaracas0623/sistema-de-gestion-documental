# Requisitos UX — Confirmaciones y menús de acción

Complementa [casos de uso](use-cases.md) (CU10, CU11) y [RNF3 Usabilidad](non-functional.md). Define el comportamiento observable de diálogos destructivos y de los iconos de acción en tablas.

---

## CU10 — Confirmar acción destructiva

| Campo | Contenido |
| --- | --- |
| **Actores** | Usuario administrativo, Administrador |
| **Objetivo** | Evitar eliminaciones accidentales con un diálogo claro y accesible |
| **Disparadores** | Eliminar documento, eliminar usuario, eliminar categoría, eliminar etiqueta |

**Flujo principal**

1. El actor pulsa el icono de acción de la fila (✏️ editar, 🗑️ eliminar) o una acción destructiva.
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

## CU11 — Iconos de acción en tablas

| Campo | Contenido |
| --- | --- |
| **Actores** | Usuario, Administrador |
| **Objetivo** | Acceder a las acciones de fila con iconos directos y consistentes |

**Acciones por tabla** (👁 solo donde hay ficha de detalle)

| Tabla | Iconos |
| --- | --- |
| Documentos | 👁 Ver · 🗑️ Eliminar |
| Usuarios | ✏️ Editar · 🗑️ Eliminar (texto "Tu cuenta" en la fila propia) |
| Categorías | ✏️ Editar · 🗑️ Eliminar |
| Etiquetas | ✏️ Editar · 🗑️ Eliminar |
| Roles | 👁 Configurar · 🗑️ Eliminar (solo si no es del sistema y sin usuarios) |
| Papelera | ♻️ Restaurar · 🗑️ Eliminar permanentemente |

**Criterios de aceptación**

| ID | Criterio |
| --- | --- |
| AC1 | Cada acción es un botón-icono `ghost` con `aria-label` descriptivo (no hay texto visible). |
| AC2 | Cada botón ejecuta su acción (navegación por `<Link>`, modal de edición o AlertDialog). |
| AC3 | Botones destructivos con estilo `text-destructive`. |
| AC4 | El icono de editar/eliminar se oculta si el usuario no tiene el permiso `<módulo>.update` / `.delete`. |
| AC5 | Al cerrarse el modal/diálogo, el foco vuelve al botón que lo abrió. |

**Implementación**

- Componente compartido: `RowActions` en `src/shared/components/` (recibe `items: RowActionItem[]`).
- Los modales de edición usan `Dialog` centrado (`src/shared/components/ui/dialog.tsx`), no `Sheet` lateral.
- La página server calcula `canUpdate` / `canDelete` (`hasModulePermission`) y los pasa a la fila.
