# Requerimientos Funcionales

Sistema de **gestión documental web** para la IPS Salud Integral. Estos requisitos describen el comportamiento observable del producto desde la perspectiva del usuario y del administrador.

**Documentación de apoyo:** [Contexto operacional](../docs/contexto_operacional.md) · [Problema](../docs/problema.md) · [Casos de uso](use-cases.md) · [Autenticación](auth.md)

---

## RF1 — Gestión de usuarios

| ID | Requisito | Notas |
| --- | --- | --- |
| RF1.1 | **Registro y mantenimiento de usuarios** | Alta, edición y baja o desactivación **solo por administrador**; sin autoregistro público (ver [auth.md](auth.md)). |
| RF1.2 | **Inicio de sesión** | Credenciales válidas establecen sesión. Detalle en [auth.md](auth.md). |
| RF1.3 | **Cierre de sesión** | La sesión queda invalidada de forma segura. |
| RF1.4 | **Asignación de roles** | Solo el administrador asigna o modifica roles; al menos administrador y usuario administrativo, condicionando acciones permitidas. |

---

## RF2 — Gestión de documentos

| ID | Requisito | Notas |
| --- | --- | --- |
| RF2.1 | **Subida de archivos** | Adjuntar archivos con metadatos mínimos acordados (por ejemplo, título o nombre). |
| RF2.2 | **Almacenamiento en la nube** | Persistencia confiable del binario y referencia en base de datos (p. ej. Supabase Storage). |
| RF2.3 | **Visualización de documentos** | Consulta en navegador cuando el formato lo permita; en caso contrario, mensaje claro y alternativa si existe. |
| RF2.4 | **Descarga de archivos** | Obtener copia local respetando permisos. |
| RF2.5 | **Eliminación de documentos** | Eliminación o baja conforme a reglas de negocio y auditoría definidas por el producto. |

---

## RF3 — Clasificación

| ID | Requisito | Notas |
| --- | --- | --- |
| RF3.1 | **Categorizar documentos** | Asignación de categoría para organización y filtros. |
| RF3.2 | **Asignar etiquetas** | Etiquetas opcionales para refinamiento y búsqueda. |

---

## RF4 — Búsqueda

| ID | Requisito | Notas |
| --- | --- | --- |
| RF4.1 | **Buscar por nombre o texto** | Coincidencia sobre campos acordados (título, nombre de archivo, etc.). |
| RF4.2 | **Filtrar por categoría** | Restringir resultados por categoría. |
| RF4.3 | **Filtrar por etiquetas** | Coherente con RF3.2 cuando las etiquetas estén modeladas en el producto. |

---

## RF5 — Seguridad funcional

| ID | Requisito | Notas |
| --- | --- | --- |
| RF5.1 | **Control de acceso por roles** | Cada operación sensible (carga, descarga, eliminación, gestión de usuarios) debe respetar el rol del actor. |

Los mecanismos técnicos (proveedor de identidad, sesión, RLS) se complementan en [non-functional.md](non-functional.md) y [auth.md](auth.md).

---

## Trazabilidad resumida (requisito → casos de uso)

| Área | Casos de uso principales |
| --- | --- |
| RF1 | CU1, CU4, CU6 |
| RF2 | CU2, CU5, CU7, CU8 |
| RF3, RF4 | CU2, CU3, CU9 |
| RF5 | Todos (aplicación transversal) |
