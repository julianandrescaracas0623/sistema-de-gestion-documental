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
| **Actor principal** | Administrador |
| **Objetivo** | Crear, editar, desactivar o eliminar usuarios y asignar roles. |
| **Precondiciones** | Sesión iniciada con rol de administrador. |

**Flujo principal (crear o editar)**

1. El administrador accede al módulo de gestión de usuarios.
2. El administrador completa o modifica datos del usuario (identificador, nombre, rol, estado).
3. El sistema valida unicidad y reglas de negocio.
4. El sistema persiste los cambios y aplica la política de acceso asociada al rol.

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

## Trazabilidad breve con requerimientos funcionales

| Caso de uso | Requerimientos funcionales cubiertos |
| --- | --- |
| CU1, CU6 | Inicio y cierre de sesión |
| CU4 | Registro/gestión de usuarios, asignación de roles |
| CU2, CU5, CU7, CU8 | Subida, almacenamiento, visualización, descarga, eliminación |
| CU9 | Categorizar, etiquetas |
| CU3 | RF4: búsqueda por nombre o texto, filtro por categoría y por etiquetas |
| Todos (con CU4) | Control de acceso por roles |
