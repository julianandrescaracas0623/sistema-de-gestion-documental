# Contexto Operacional

Este documento sitúa el sistema en la **IPS Salud Integral** y conecta la operación diaria con la solución técnica. Complementa el [planteamiento del problema](problema.md) (motivación y consecuencias) con el despliegue operativo y los actores.

## 1. Descripción del entorno

El sistema será implementado en la IPS Salud Integral, ubicada en Cartago, Valle del Cauca. La institución presta servicios de salud y maneja procesos administrativos que requieren el uso constante de documentación física, especialmente en áreas como facturación, recursos humanos y soporte de servicios.

Actualmente, los documentos son gestionados de forma manual mediante carpetas físicas, archivadores y cajas, lo que genera dificultades en su organización, almacenamiento y consulta.

## 2. Situación actual

El flujo operativo actual es el siguiente:

1. Generación del documento (orden médica, soporte, etc.)
2. Revisión manual
3. Clasificación física
4. Almacenamiento en carpetas
5. Ubicación en archivo
6. Búsqueda manual cuando se requiere

Este proceso depende completamente del conocimiento del personal y no cuenta con herramientas tecnológicas de apoyo.

## 3. Problemas operacionales

- Alta dependencia del manejo manual
- Dificultad para encontrar documentos rápidamente
- Riesgo de pérdida o deterioro
- Uso excesivo de espacio físico
- Falta de control sobre acceso a la información
- Retrasos en procesos administrativos

## 4. Propuesta operativa

Se propone implementar un sistema web de gestión documental que permita:

- Digitalizar documentos
- Almacenarlos en la nube
- Organizarlos por categorías
- Consultarlos mediante búsqueda
- Controlar el acceso mediante roles

Los requisitos de producto derivados de esta propuesta están en [.requirements/requerimiento_funcional.md](../.requirements/requerimiento_funcional.md) y [.requirements/non-functional.md](../.requirements/non-functional.md).

## 5. Flujo con el sistema propuesto

1. Usuario inicia sesión
2. Carga documento digital
3. Clasifica por categoría (y etiquetas, si aplica)
4. Sistema almacena en Supabase (base de datos y almacenamiento de archivos)
5. Usuario consulta mediante buscador
6. Descarga o visualiza documento

El comportamiento de acceso (inicio y cierre de sesión, rutas protegidas) se detalla en [.requirements/auth.md](../.requirements/auth.md).

## 6. Actores del sistema

- **Administrador**
  - Gestiona usuarios
  - Controla acceso
  - Supervisa el sistema

- **Usuario administrativo**
  - Sube documentos
  - Consulta información
  - Organiza archivos

Estos actores se reflejan en los [casos de uso](../.requirements/use-cases.md) como participantes de los flujos funcionales.

## 7. Entorno tecnológico

- Frontend: Next.js + React
- Backend: Supabase (Auth + DB + Storage)
- Base de datos: PostgreSQL (Supabase)
- Almacenamiento: Supabase Storage
- Despliegue: Vercel (opcional)

## 8. Resultado esperado

Un sistema web que optimice la gestión documental, reduzca el uso de papel y mejore la eficiencia administrativa.

## 9. Mapa de documentación

| Necesidad | Documento |
| --- | --- |
| Problema e investigación | [problema.md](problema.md) |
| Lista funcional priorizable | [requerimiento_funcional.md](../.requirements/requerimiento_funcional.md) |
| Calidades y restricciones técnicas | [non-functional.md](../.requirements/non-functional.md) |
| Autenticación y sesión | [auth.md](../.requirements/auth.md) |
| Flujos detallados | [use-cases.md](../.requirements/use-cases.md) |
