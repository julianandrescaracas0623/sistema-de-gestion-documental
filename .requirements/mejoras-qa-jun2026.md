# Feature: Mejoras QA Junio 2026

**Origen:** sesión de pruebas con Joan Serna (11-jun-2026).  
**Alcance:** correcciones de bugs, UX de documentos, RBAC granular y recuperación de contraseña.

---

## Épica 1 — Interfaz en español

### User Story
Como usuario del sistema, quiero que todos los textos visibles estén en español para evitar confusión.

### Acceptance Criteria

#### AC1.1: Página de error global
**Given** ocurre un error no controlado en la aplicación  
**When** se muestra la página de error  
**Then** el título es "Algo salió mal" y el botón dice "Reintentar"

#### AC1.2: Contadores en admin
**Given** un listado administrativo con contador  
**When** se renderiza el badge de totales  
**Then** muestra "{n} en total" (no "{n} total")

### Test Cases
- [ ] TC1.1: `error.test.tsx` verifica textos en español
- [ ] TC1.2: Inspección manual en `/admin/users`, `/admin/tags`, `/admin/roles`, `/documents`

---

## Épica 2 — Búsqueda de documentos sin recarga completa

### User Story
Como usuario, quiero que al buscar documentos solo se actualice la tabla de resultados para no perder el contexto visual de los filtros.

### Acceptance Criteria

#### AC2.1: Actualización parcial
**Given** estoy en `/documents` con filtros aplicados  
**When** pulso "Buscar"  
**Then** el panel de filtros permanece visible sin parpadeo y la tabla muestra un estado de carga hasta recibir resultados

#### AC2.2: Preservación de filtros en URL
**Given** filtros activos  
**When** se ejecuta la búsqueda  
**Then** los parámetros `q`, `category`, `tag`, `dateFrom`, `dateTo` se reflejan en la URL

### Test Cases
- [ ] TC2.1: Componente `DocumentsFilters` navega con `router.push`
- [ ] TC2.2: `Suspense` con skeleton en tabla al cambiar params

---

## Épica 3 — Calendario y validación de fechas

### User Story
Como usuario, quiero filtrar documentos por rango de fechas sin poder elegir fechas futuras ni rangos inválidos (desde > hasta).

### Acceptance Criteria

#### AC3.1: Fechas futuras bloqueadas
**Given** el campo "Hasta"  
**When** abro el selector de fecha  
**Then** no puedo seleccionar fechas posteriores a hoy

#### AC3.2: Rango coherente
**Given** "Desde" = 2026-06-02  
**When** selecciono "Hasta"  
**Then** fechas anteriores al 2026-06-02 están deshabilitadas

#### AC3.3: Validación servidor
**Given** URL con `dateFrom` > `dateTo`  
**When** se consulta el listado  
**Then** el servidor normaliza el rango o devuelve resultados coherentes

### Test Cases
- [ ] TC3.1: Unit test `toLocalDateString` y bounds en `DateRangeInputs`
- [ ] TC3.2: Unit test `listDocuments` con rango invertido

---

## Épica 4 — Filtro "6 meses" documentado

### User Story
Como usuario, quiero entender qué documentos veo al aplicar el filtro rápido "6 meses".

### Acceptance Criteria

#### AC4.1: Comportamiento del filtro
**Given** hoy es 16-jun-2026 y pulso "6 meses"  
**When** se aplica el filtro  
**Then** `dateFrom` = 16-dic-2025, `dateTo` = 16-jun-2026 y se listan documentos no eliminados con `created_at` en ese rango (zona local)

#### AC4.2: Indicador visual
**Given** un preset rápido activo  
**When** se renderizan los filtros  
**Then** aparece un chip/badge explicando el rango aplicado

### Test Cases
- [ ] TC4.1: Unit test `QuickDateFilters` preset 6m
- [ ] TC4.2: Chip visible con fechas formateadas es-CO

---

## Épica 5 — Paginación y selección masiva

### User Story
Como usuario, quiero paginar resultados y seleccionar varios documentos para eliminarlos o descargarlos sin ir uno por uno.

### Acceptance Criteria

#### AC5.1: Paginación mejorada
**Given** más de 10 documentos  
**When** navego el listado  
**Then** veo "Mostrando X–Y de Z", selector de tamaño (10/25/50) y controles Anterior/Siguiente

#### AC5.2: Selección masiva
**Given** documentos visibles en la página actual  
**When** selecciono filas y confirmo eliminación  
**Then** solo los seleccionados se eliminan (soft-delete) tras confirmación

#### AC5.3: Exportación selectiva
**Given** N documentos seleccionados  
**When** pulso "Descargar seleccionados"  
**Then** el ZIP contiene solo esos archivos

### Test Cases
- [ ] TC5.1: Bulk delete action con permisos RLS
- [ ] TC5.2: Component test selección/deselección

---

## Épica 6 — Subida de archivos robusta

### User Story
Como usuario, quiero subir documentos sin perder título y descripción si el archivo falla, y no poder seleccionar tipos no soportados (CSV).

### Acceptance Criteria

#### AC6.1: Atributo accept
**Given** el input de archivo  
**When** abro el selector del sistema  
**Then** solo muestra extensiones permitidas (PDF, imágenes, Office, txt — no CSV)

#### AC6.2: Preservación en error
**Given** completé título y descripción  
**When** subo un archivo no permitido  
**Then** título, descripción, categoría y etiquetas se mantienen; solo se limpia el archivo

#### AC6.3: Descripción persistida
**Given** subo un documento válido con descripción  
**When** la subida es exitosa  
**Then** la descripción se guarda en la base de datos

### Test Cases
- [ ] TC6.1: `isFileTypeAllowed` rechaza `text/csv`
- [ ] TC6.2: Upload action persiste `description`

---

## Épica 7 — RBAC atómico CRUD

### User Story
Como administrador, quiero asignar permisos granulares (leer/crear/actualizar/eliminar) por módulo, igual que en documentos.

### Acceptance Criteria

#### AC7.1: Catálogo expandido
**Given** el catálogo de permisos  
**When** consulto la matriz de roles  
**Then** existen `categories.*`, `tags.*`, `users.*`, `roles.*` (read/create/update/delete)

#### AC7.2: Rol solo lectura
**Given** un rol con solo `categories.read`  
**When** accede a `/admin/categories`  
**Then** ve el listado pero no botones Crear/Editar/Eliminar

#### AC7.3: Migración de roles existentes
**Given** un rol con `categories.manage`  
**When** se aplica la migración  
**Then** recibe los cuatro permisos de categorías

### Test Cases
- [ ] TC7.1: `permissions.test.ts` con nuevas claves
- [ ] TC7.2: Guards en páginas admin

---

## Épica 8 — Editar etiqueta: label visible

### User Story
Como administrador, quiero ver el label "Nombre" al editar una etiqueta.

### Acceptance Criteria

#### AC8.1: Contraste en Sheet
**Given** abro editar etiqueta  
**When** se muestra el panel lateral  
**Then** el label "Nombre" es legible (contraste adecuado sobre el fondo)

### Test Cases
- [ ] TC8.1: Snapshot/visual en `tag-row-actions` con clases corregidas

---

## Épica 9 — Contador de uso de etiquetas correcto

### User Story
Como administrador, quiero que el contador de documentos por etiqueta refleje solo documentos activos (no eliminados).

### Acceptance Criteria

#### AC9.1: Excluir soft-deleted
**Given** un documento eliminado que tenía la etiqueta "log"  
**When** consulto `/admin/tags`  
**Then** "log" no cuenta ese documento en "Documentos"

### Test Cases
- [ ] TC9.1: Query de conteo filtra `documents.deleted_at IS NULL`

---

## Épica 10 — Acciones de etiqueta tras cerrar edición

### User Story
Como administrador, quiero poder editar otra etiqueta después de cerrar el panel de edición.

### Acceptance Criteria

#### AC10.1: Menú funcional tras cerrar Sheet
**Given** abrí y cerré editar etiqueta  
**When** pulso el menú ⋯ de otra fila  
**Then** las acciones responden normalmente

### Test Cases
- [ ] TC10.1: Apertura de Sheet con `setTimeout(0)` tras DropdownMenu

---

## Épica 11 — Recuperación de contraseña

### User Story
Como usuario, quiero recuperar mi contraseña si la olvidé, o saber cómo solicitar ayuda al administrador.

### Acceptance Criteria

#### AC11.1: Enlace en login
**Given** la página de login  
**When** la visualizo  
**Then** veo "¿Olvidaste tu contraseña?" y texto de contacto con administrador

#### AC11.2: Flujo email
**Given** ingreso mi correo en `/forgot-password`  
**When** envío el formulario  
**Then** Supabase envía enlace de restablecimiento (si el correo existe)

#### AC11.3: Nueva contraseña
**Given** abro el enlace de recuperación  
**When** ingreso nueva contraseña válida  
**Then** puedo iniciar sesión con la nueva contraseña

### Test Cases
- [ ] TC11.1: Action `request-password-reset`
- [ ] TC11.2: E2E forgot-password (opcional con mock)

---

## Épica 12 — Consistencia categorías (mismos bugs que etiquetas)

### User Story
Como administrador, las categorías deben tener la misma corrección de Sheet/menú que etiquetas.

### Acceptance Criteria

#### AC12.1: Sheet categorías
**Given** edito una categoría desde el menú ⋯  
**When** cierro el panel  
**Then** puedo abrir acciones en otras filas sin bloqueo

### Test Cases
- [ ] TC12.1: `category-row-actions` usa `setTimeout(0)`

---

## Fases de implementación

| Fase | Épicas | Prioridad |
|------|--------|-----------|
| 1 | 1, 8, 9, 10, 12 | P0 |
| 2 | 2, 3, 4, 6 | P1 |
| 3 | 5 | P2 |
| 4 | 7 | P3 |
| 5 | 11 | P2 |

---

## Out of Scope

- Soporte de archivos CSV como tipo de documento
- Framework i18n completo (next-intl)
- Calendario shadcn con locale forzado (opcional futura)
- Crear nuevas claves de permiso desde UI admin
- Seleccionar y eliminar todos los resultados filtrados cross-página en una sola acción
- Edición de nombre de usuarios existentes
