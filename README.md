# Gestor de Evidencias API

API REST desarrollada con Node.js y TypeScript para la gestión de casos y evidencias.

Este proyecto hace parte de una prueba técnica Full Stack cuyo objetivo es implementar una solución de punta a punta con autenticación, autorización, persistencia, CRUD de casos y gestión segura de archivos.

---

# Tecnologías

* Node.js
* TypeScript
* Express
* Prisma ORM
* PostgreSQL
* Neon
* JWT
* bcryptjs
* Zod
* Cloudflare R2
* Vitest
* Supertest

---

# Arquitectura

El backend está organizado por responsabilidades, separando la exposición de la API, la lógica de negocio, el acceso a datos, las validaciones y los servicios externos.

```text
src/
├── config/
├── controllers/
├── errors/
├── lib/
├── middlewares/
├── repositories/
├── routes/
├── schemas/
├── services/
├── types/
├── app.ts
└── server.ts
```

La estructura permite mantener separadas las responsabilidades y facilita el mantenimiento, las pruebas y la incorporación de nuevas funcionalidades.

---

# Requisitos

* Node.js 20+
* npm
* PostgreSQL
* Cuenta de Neon o una instancia PostgreSQL compatible
* Cuenta de Cloudflare R2

---

# Instalación

## Clonar el repositorio

```bash
git clone https://github.com/Edwar007/gestor-evidencias-api.git
cd gestor-evidencias-api
```

## Instalar dependencias

```bash
npm install
```

## Configurar variables de entorno

Crear un archivo `.env` tomando como referencia `.env.example`.

```env
DATABASE_URL=
JWT_SECRET=
PORT=3000
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
```

Los valores reales de las variables de entorno no deben almacenarse en el repositorio.

---

# Base de datos

El proyecto utiliza **PostgreSQL** como motor de base de datos y **Prisma ORM** como herramienta de acceso y gestión de persistencia.

Prisma se utiliza para:

* Definir el modelo de datos.
* Gestionar migraciones.
* Generar un cliente tipado.
* Ejecutar consultas a PostgreSQL.
* Mantener separada la lógica de persistencia de la lógica de negocio.

La base de datos utilizada para el proyecto se encuentra en **Neon**, permitiendo disponer de PostgreSQL administrado y facilitar la separación entre ambientes.

### Migraciones

Aplicar migraciones existentes:

```bash
npx prisma migrate deploy
```

Crear una nueva migración durante desarrollo:

```bash
npx prisma migrate dev
```

Generar el cliente de Prisma:

```bash
npx prisma generate
```

---

# Ejecución

## Desarrollo

```bash
npm run dev
```

## Compilar

```bash
npm run build
```

## Producción

```bash
npm start
```

La API utiliza el puerto proporcionado mediante la variable de entorno `PORT`.

---

# Autenticación y autorización

La autenticación se implementó utilizando **JWT (JSON Web Tokens)**.

El proceso contempla:

* Registro de usuarios.
* Hash seguro de contraseñas mediante `bcryptjs`.
* Inicio de sesión.
* Generación de tokens JWT.
* Validación del token mediante middleware.
* Consulta del usuario autenticado.
* Protección de las rutas privadas.

Las contraseñas nunca se almacenan en texto plano.

El JWT contiene el identificador del usuario autenticado y es validado antes de permitir el acceso a las operaciones protegidas.

## Autorización y ownership

Además de comprobar que el usuario esté autenticado, el backend controla que tenga autorización para operar sobre el recurso solicitado.

Cada caso está asociado a un usuario y las operaciones sobre casos y archivos verifican el propietario antes de permitir:

* Consultar.
* Modificar.
* Eliminar.
* Subir evidencias.
* Descargar evidencias.

De esta forma, un usuario autenticado no puede acceder o modificar recursos pertenecientes a otro usuario simplemente proporcionando su identificador.

Esta validación se realiza en el backend y no depende de controles realizados únicamente por el frontend.

---
# Control de versiones

El proyecto utiliza **Git** para el control de versiones y seguimiento de los cambios realizados durante el desarrollo.

Se trabajó utilizando ramas separadas por funcionalidad, tomando `desarrollo` como rama base.

El flujo utilizado fue:

```text
desarrollo
    ↓
crear rama de funcionalidad
    ↓
desarrollo de la funcionalidad
    ↓
pruebas
    ↓
commit
    ↓
push de la rama
    ↓
merge hacia desarrollo
    ↓
actualización de desarrollo
```


Esto permitió mantener aislados los cambios de cada funcionalidad y facilitar su revisión antes de integrarlos a la rama `desarrollo`.

Una vez finalizada y validada una funcionalidad, se integraba nuevamente en `desarrollo`, desde donde se continuaba con la siguiente funcionalidad.

Al finalizar el desarrollo, la rama `main` se creó a partir de la versión estable de `desarrollo` para utilizarla como rama principal del proyecto.

---

# Validación de datos

Se utiliza **Zod** para validar los datos recibidos por la API.

Las validaciones se aplican antes de ejecutar la lógica correspondiente y permiten controlar:

* Datos requeridos.
* Tipos de datos.
* Formatos.
* Estados permitidos.
* Datos relacionados con la carga de archivos.

Los errores de validación se procesan mediante el manejo centralizado de errores de la aplicación.

---

# Manejo de errores

El backend cuenta con un sistema centralizado para el manejo de errores.

Se utiliza una excepción `AppError` para representar errores controlados de la aplicación y un middleware global para convertirlos en respuestas HTTP.

También se manejan los errores generados por Zod y los errores inesperados del servidor.

Entre los estados manejados se encuentran:

| Código | Descripción                          |
| ------ | ------------------------------------ |
| 200    | Operación exitosa                    |
| 201    | Recurso creado                       |
| 204    | Eliminación exitosa                  |
| 400    | Datos inválidos                      |
| 401    | Token inválido o ausente             |
| 403    | Recurso perteneciente a otro usuario |
| 404    | Recurso no encontrado                |
| 409    | Conflicto                            |
| 500    | Error interno                        |

Esto permite mantener un comportamiento consistente entre los diferentes módulos de la API.

---

# Gestión de casos

La aplicación permite gestionar el ciclo de vida de los casos asociados a cada usuario.

Se implementó el CRUD completo:

* Crear casos.
* Listar casos.
* Consultar un caso.
* Actualizar información.
* Cambiar el estado.
* Eliminar casos.

Los estados disponibles son:

```text
OPEN
CLOSED
```

La lógica de negocio se encarga de validar la existencia del recurso y los permisos del usuario antes de ejecutar las operaciones.

---

# Gestión de evidencias

Para el almacenamiento de archivos se utiliza **Cloudflare R2**.

Los archivos no son enviados directamente a través del servidor de la API. Se utilizan **URLs prefirmadas** para realizar las operaciones directamente contra R2.

El backend se encarga de:

* Autorizar al usuario.
* Generar URLs temporales de carga.
* Generar URLs temporales de descarga.
* Validar el archivo después de la carga.
* Asociar el archivo con el caso.
* Eliminar archivos cuando corresponde.
* Evitar el acceso público directo al bucket.

El bucket de Cloudflare R2 permanece privado.

## Validación de archivos

Se establecieron las siguientes restricciones:

**Tipos permitidos**

```text
image/jpeg
image/png
application/pdf
```

**Tamaño máximo**

```text
5 MB
```

**Duración de URLs prefirmadas**

```text
Upload: 15 minutos
Download: 3 minutos
```

El backend valida la existencia, tamaño y tipo del objeto antes de asociarlo definitivamente con un caso.

---

# Flujo de almacenamiento

El flujo implementado separa el almacenamiento de archivos de la API:

```text
Frontend
    ↓
Backend
    ↓
URL prefirmada
    ↓
Cloudflare R2
    ↓
Validación
    ↓
PostgreSQL
```

El backend mantiene en la base de datos la referencia del archivo (`fileKey`), mientras que el contenido binario permanece almacenado en Cloudflare R2.

Esta estrategia evita utilizar el servidor de la API como intermediario para la transferencia de archivos y permite mantener el almacenamiento privado.

---

# Pruebas

## Entorno independiente para pruebas

Para evitar que las pruebas automatizadas modificaran directamente la base de datos principal del proyecto, se creó una **rama independiente de la base de datos en Neon** destinada exclusivamente al entorno de pruebas.

De esta forma, las pruebas automatizadas se ejecutan sobre una base de datos aislada de la utilizada por la aplicación principal.

La configuración utiliza un archivo de entorno independiente:

```text
.env.test
```

Las migraciones del entorno de pruebas se ejecutan mediante:

```bash
npx dotenv-cli -e .env.test -- prisma migrate deploy
```

El archivo `.env.test` contiene las credenciales correspondientes al entorno de pruebas y no se incluye en el repositorio.

El proyecto cuenta con pruebas automatizadas utilizando **Vitest** y **Supertest**.

Las pruebas cubren los principales componentes funcionales y de seguridad de la API.

Entre los escenarios probados se encuentran:

* Health check.
* Conexión con PostgreSQL.
* Registro de usuarios.
* Validación de datos.
* Emails duplicados.
* Inicio de sesión.
* Credenciales inválidas.
* Generación y validación de JWT.
* `/auth/me`.
* Protección de rutas.
* CRUD de casos.
* Ownership de recursos.
* Generación de URLs de carga.
* Validación de archivos.
* Archivos inexistentes.
* Permisos de acceso.
* Generación de URLs de descarga.
* Eliminación y reemplazo de archivos.

## Ejecutar pruebas

```bash
npm run test:run
```

## Modo interactivo

```bash
npm test
```

## Entorno de pruebas

Las pruebas utilizan un entorno independiente mediante:

```text
.env.test
```

Este archivo no debe subirse al repositorio.

Para aplicar las migraciones del entorno de pruebas:

```bash
npx dotenv-cli -e .env.test -- prisma migrate deploy
```

---

# Decisiones técnicas

## Node.js + TypeScript + Express

Se utilizó Node.js con TypeScript y Express para construir una API REST modular y tipada.

TypeScript permite detectar errores durante el desarrollo y mantener contratos claros entre las diferentes partes de la aplicación.

## Prisma + PostgreSQL

PostgreSQL se utiliza como base de datos relacional y Prisma como ORM.

Esta combinación permite trabajar con un modelo de datos estructurado, migraciones controladas y consultas tipadas.

## Neon

Se utilizó Neon como proveedor de PostgreSQL administrado.

Esto permite disponer de una base de datos accesible desde los ambientes de desarrollo y despliegue sin tener que administrar directamente un servidor PostgreSQL.

## JWT + bcryptjs

JWT se utiliza para manejar la autenticación mediante tokens y proteger las rutas privadas.

`bcryptjs` se utiliza para almacenar las contraseñas mediante hash, evitando conservar las credenciales originales.

## Zod

Zod se utiliza para validar la información recibida por la API antes de ejecutar la lógica de negocio.

Esto permite rechazar datos inválidos desde una capa común de validación.

## Cloudflare R2

Cloudflare R2 se utiliza como almacenamiento privado para las evidencias.

Se eligió porque:

* Es compatible con la API de S3.
* Permite generar URLs prefirmadas.
* Permite realizar cargas directamente desde el frontend.
* Mantiene los archivos fuera del servidor de la API.
* Permite mantener el bucket privado.

## Separación de responsabilidades

La estructura del backend separa rutas, controladores, servicios, repositorios, validaciones y middleware.

Esto permite mantener la lógica de negocio independiente de los detalles de HTTP y persistencia, facilitando las pruebas y el mantenimiento.

---

# Uso de Inteligencia Artificial

Durante el desarrollo se utilizó **ChatGPT** como herramienta de apoyo técnico.

## Uso realizado

ChatGPT fue utilizado principalmente para:

* Apoyar la implementación de pruebas automatizadas.
* Proponer escenarios de prueba para autenticación, autorización, casos y archivos.
* Apoyar la implementación de la integración con Cloudflare R2.
* Revisar el flujo de carga y descarga mediante URLs prefirmadas.
* Analizar errores encontrados durante el desarrollo.
* Revisar decisiones técnicas y alternativas de implementación.
* Realizar documentación final 

## Incidentes y correcciones

Durante la implementación se presentaron algunos casos en los que las propuestas generadas para determinadas pruebas no contemplaban completamente el contexto específico de la aplicación.

Esto ocurrió principalmente porque algunas pruebas dependían de la arquitectura implementada, las relaciones entre usuarios y casos, el entorno de pruebas y el comportamiento específico de Cloudflare R2.

Estos casos fueron identificados durante la ejecución de las pruebas y **corregidos manualmente**, ajustando las pruebas y la implementación al comportamiento real del proyecto.

De igual forma, durante la implementación de la gestión de archivos fue necesario proporcionar el contexto completo de la aplicación para que las propuestas relacionadas con Cloudflare R2 contemplaran correctamente el flujo de autorización, ownership, almacenamiento y validación.

La IA se utilizó como herramienta de apoyo, pero el código final fue revisado, adaptado, ejecutado y validado manualmente.

---


