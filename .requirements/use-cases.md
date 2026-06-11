# Casos de Uso

Documento alineado con los [requerimientos funcionales](requerimiento_funcional.md) y el [contexto operacional](../docs/contexto_operacional.md) del sistema de gestión documental para la IPS Salud Integral.

## Actores

| Actor | Descripción |
| --- | --- |
| **Administrador** | Gestiona usuarios, roles y el acceso al sistema. |
| **Usuario administrativo** | Carga, organiza, consulta y descarga documentación de su ámbito autorizado. |

En los casos siguientes, “Usuario” equivale a **Usuario administrativo** salvo que se indique **Administrador**.

---

## CU1 — Iniciar sesión

| Campo | Contenido |
| --- | --- |
| **Actor principal** | Usuario, Administrador |
| **Objetivo** | Autenticarse y acceder al sistema con credenciales válidas. |
| **Precondiciones** | El actor posee cuenta activa y credenciales correctas. |

**Flujo principal**

1. El actor abre la aplicación web.
2. El sistema muestra el formulario de inicio de sesión.
3. El actor ingresa correo (o identificador) y contraseña.
4. El sistema valida las credenciales mediante el servicio de autenticación.
5. El sistema establece la sesión y redirige al panel principal según el rol.

**Flujos alternativos**

- **4a. Credenciales inválidas:** el sistema muestra un mensaje de error genérico y no revela si el usuario existe.
- **4b. Cuenta deshabilitada:** el sistema informa que el acceso no está permitido y no inicia sesión.

**Postcondiciones:** Sesión iniciada; el actor puede usar las funciones permitidas por su rol.

---

## CU2 — Subir documento

| Campo | Contenido |
| --- | --- |
| **Actor principal** | Usuario |
| **Objetivo** | Registrar un archivo digital en el repositorio con sus metadatos mínimos. |
| **Precondiciones** | Sesión iniciada; el actor tiene permiso de carga en el sistema. |

**Flujo principal**

1. El actor selecciona la opción de subir documento.
2. El sistema muestra el formulario de carga (archivo, nombre o título, categoría opcional, etiquetas opcionales).
3. El actor adjunta el archivo y completa los campos requeridos.
4. El sistema valida tipo y tamaño del archivo.
5. El sistema almacena el archivo en almacenamiento en la nube y persiste metadatos en la base de datos.
6. El sistema confirma la carga exitosa y muestra el documento en el listado o detalle.

**Flujos alternativos**

- **4a. Archivo no permitido o demasiado grande:** el sistema rechaza la operación y muestra el motivo.
- **3a. Fallo de red o almacenamiento:** el sistema informa error y permite reintentar sin duplicar registro si la operación es idempotente o con control explícito.

**Postcondiciones:** Nuevo documento disponible para consulta, descarga o gestión según políticas de acceso.

---

## CU3 — Buscar documento

| Campo | Contenido |
| --- | --- |
| **Actor principal** | Usuario, Administrador (consulta) |
| **Objetivo** | Localizar documentos mediante criterios de búsqueda y filtros. |
| **Precondiciones** | Sesión iniciada; permisos de lectura sobre el ámbito de documentos. |

**Flujo principal**

1. El actor accede al buscador o listado de documentos.
2. El actor ingresa texto (por ejemplo, nombre o título) y/o selecciona filtros (por ejemplo, categoría y etiquetas, si el producto las expone en búsqueda).
3. El sistema ejecuta la consulta respetando control de acceso por rol.
4. El sistema muestra la lista de resultados con información resumida (nombre, categoría, fecha, etc.).

**Flujos alternativos**

- **3a. Sin resultados:** el sistema muestra un estado vacío con sugerencia de ajustar filtros o términos.
- **3b. Consulta lenta:** el sistema puede mostrar indicador de carga (requisito de rendimiento en [requisitos no funcionales](non-functional.md)).

**Postcondiciones:** El actor identifica los documentos relevantes para abrir, descargar o auditar.

---

## CU4 — Gestionar usuarios

| Campo | Contenido |
| --- | --- |
| **Actor principal** | Usuario con permiso `users.manage` |
| **Objetivo** | Crear y eliminar usuarios; asignar un rol del catálogo dinámico. |
| **Precondiciones** | Sesión iniciada con `users.manage`. |

**Flujo principal (alta)**

1. El operador accede a `/admin/users`.
2. Completa **nombre completo**, correo, contraseña inicial y **rol** (selector desde tabla `roles`).
3. El sistema valida datos y crea cuenta en Supabase Auth + perfil (`full_name`) + `user_roles.role_id`.
4. El nuevo usuario puede iniciar sesión con los permisos del rol asignado.

**Flujo principal (alta de usuario)**

Ver pasos 1–4 en la tabla superior (nombre completo, rol desde tabla `roles`).

**Extensiones**

- **Eliminar usuario:** confirmación AlertDialog; documentos del usuario se conservan (`uploaded_by` SET NULL).

**Extensiones**

- **Eliminar o desactivar:** flujo similar con confirmación; el usuario afectado pierde acceso según la política elegida (borrado lógico vs. revocación de credenciales).

**Flujos alternativos**

- **3a. Datos inválidos o duplicados:** el sistema muestra errores de validación sin aplicar cambios parciales inconsistentes.

**Postcondiciones:** El directorio de usuarios refleja el estado deseado; los roles condicionan futuros accesos (CU1, CU2, etc.).

---

## CU5 — Descargar documento

| Campo | Contenido |
| --- | --- |
| **Actor principal** | Usuario, Administrador |
| **Objetivo** | Obtener una copia local del archivo almacenado. |
| **Precondiciones** | Sesión iniciada; el documento existe y el actor tiene permiso de descarga. |

**Flujo principal**

1. El actor localiza el documento (por ejemplo, tras CU3 o desde un detalle).
2. El actor solicita descargar.
3. El sistema verifica permisos y genera o entrega la URL segura de descarga.
4. El navegador del actor recibe el archivo.

**Flujos alternativos**

- **3a. Sin permiso:** el sistema responde con error de autorización y no expone el recurso.
- **3b. Recurso inexistente o eliminado:** el sistema informa que el documento no está disponible.

**Postcondiciones:** El actor dispone del archivo en su equipo, sin alterar el original en el repositorio salvo reglas de auditoría definidas por el producto.

---

## CU6 — Cerrar sesión

| Campo | Contenido |
| --- | --- |
| **Actor principal** | Usuario, Administrador |
| **Objetivo** | Finalizar la sesión de forma segura. |
| **Precondiciones** | Sesión iniciada. |

**Flujo principal**

1. El actor selecciona “Cerrar sesión”.
2. El sistema invalida la sesión en el cliente y en el proveedor de autenticación según corresponda.
3. El sistema redirige a la pantalla de inicio de sesión.

**Postcondiciones:** No queda sesión activa en el dispositivo para ese usuario; se requiere CU1 para volver a operar.

---

## CU7 — Visualizar documento

| Campo | Contenido |
| --- | --- |
| **Actor principal** | Usuario, Administrador |
| **Objetivo** | Consultar el contenido del documento en el navegador cuando el formato lo permita. |
| **Precondiciones** | Sesión iniciada; permiso de lectura/visualización sobre el documento. |

**Flujo principal**

1. El actor abre el detalle del documento.
2. El actor elige “Ver” o el sistema ofrece vista previa.
3. El sistema sirve el recurso o una representación visual segura (por ejemplo, URL firmada o visor).

**Flujos alternativos**

- **2a. Formato no soportado en línea:** el sistema sugiere descarga (CU5) si está permitido.

**Postcondiciones:** El actor revisa el documento sin necesidad de descargarlo, según políticas de la institución.

---

## CU8 — Eliminar documento

| Campo | Contenido |
| --- | --- |
| **Actor principal** | Usuario (si la política lo permite), Administrador |
| **Objetivo** | Retirar un documento del repositorio o marcarlo como eliminado según política de retención. |
| **Precondiciones** | Sesión iniciada; permiso de eliminación sobre el documento. |

**Flujo principal**

1. El actor solicita eliminar el documento desde el detalle o listado.
2. El sistema solicita confirmación.
3. Tras confirmar, el sistema aplica borrado físico o lógico y actualiza índices y búsquedas.

**Postcondiciones:** El documento deja de estar disponible para operaciones normales según el tipo de eliminación definido en el producto.

---

## CU9 — Clasificar documento (categoría y etiquetas)

| Campo | Contenido |
| --- | --- |
| **Actor principal** | Usuario |
| **Objetivo** | Asignar o modificar categoría y etiquetas para organizar y facilitar la búsqueda. |
| **Precondiciones** | Sesión iniciada; el documento existe y el actor puede editar metadatos. |

**Flujo principal**

1. El actor abre la edición de metadatos del documento (o los define en CU2).
2. El actor selecciona categoría y/o añade etiquetas.
3. El sistema valida valores permitidos y guarda los cambios.

**Postcondiciones:** Los documentos quedan clasificados; CU3 puede filtrar por categoría y, si aplica, por etiquetas.

---

## CU10 — Confirmar acción destructiva

| Campo | Contenido |
| --- | --- |
| **Actores** | Usuario administrativo, Administrador |
| **Objetivo** | Evitar eliminaciones accidentales mediante un diálogo modal centrado. |
| **Disparadores** | Eliminar documento, usuario, categoría o etiqueta. |

**Flujo principal**

1. El actor solicita una acción destructiva desde el menú ⋯ o un botón dedicado.
2. El sistema muestra un AlertDialog con título, descripción y opciones Cancelar / Confirmar.
3. Tras confirmar, el sistema ejecuta la operación y retroalimenta con toast y actualización de la vista.

**Detalle de criterios:** ver [ux-confirmaciones.md](ux-confirmaciones.md).

---

## CU11 — Menú de acciones en tablas

| Campo | Contenido |
| --- | --- |
| **Actores** | Usuario, Administrador |
| **Objetivo** | Acceder a acciones de fila (ver, editar, eliminar) desde un menú compacto. |

**Flujo principal**

1. El actor pulsa el icono ⋯ en la columna Acciones de una fila.
2. El sistema despliega las acciones permitidas para ese recurso y rol.
3. El actor selecciona una acción; el sistema la ejecuta o abre el flujo correspondiente (navegación, edición o confirmación destructiva).

**Detalle de criterios:** ver [ux-confirmaciones.md](ux-confirmaciones.md).

---

## CU12 — Gestionar roles y permisos

| Campo | Contenido |
| --- | --- |
| **Actor principal** | Usuario con permiso `roles.manage` |
| **Objetivo** | Crear, editar o eliminar roles y asignar permisos del catálogo. |
| **Precondiciones** | Sesión iniciada con `roles.manage`. |

**Flujo principal (crear)**

1. El operador accede a `/admin/roles` y pulsa **Nuevo rol** → `/admin/roles/new`.
2. Completa nombre, descripción y selecciona permisos en la matriz por módulo.
3. El sistema crea el rol (`slug` generado) y persiste `role_permissions`.

**Flujo principal (editar)**

1. Desde el listado, el operador abre un rol → `/admin/roles/[id]`.
2. En la vista dedicada (datos del rol + matriz), modifica descripción y permisos.
3. El sistema actualiza el rol y reemplaza las asignaciones de permisos.

**Extensiones**

- Roles `is_system: true` no se eliminan ni renombran; solo permisos y descripción.
- No se elimina un rol con usuarios asignados.

**Detalle técnico:** [rbac.md](rbac.md).

---

## Trazabilidad breve con requerimientos funcionales

| Caso de uso | Requerimientos funcionales cubiertos |
| --- | --- |
| CU1, CU6 | Inicio y cierre de sesión |
| CU4 | Registro/gestión de usuarios, asignación de rol dinámico |
| CU12 | Gestión de roles y permisos (RF1.4) |
| CU2, CU5, CU7, CU8 | Subida, almacenamiento, visualización, descarga, eliminación |
| CU9 | Categorizar, etiquetas |
| CU3 | RF4: búsqueda por nombre o texto, filtro por categoría y por etiquetas |
| CU10, CU11 | RNF3: usabilidad, confirmaciones y menús de acción |
| Todos (con CU4) | Control de acceso por roles |
