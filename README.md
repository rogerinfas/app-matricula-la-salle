# App de Matrícula de Estudiantes (La Salle)

**🌐 Verla funcionando:** https://rogerinfas.github.io/app-matricula-la-salle/ (interfaz estilo iOS, modo demo: los datos se guardan en tu navegador)

> La demo en internet es solo el client. La versión completa con Node.js + MySQL se corre localmente (paso 4).

Página web completa desde la interfaz hasta la base de datos, según la arquitectura de clase:

`Usuario → Client React (puerto 3000) → Server Node.js + Express (puerto 3001) → MySQL (puerto 3306)`

![Stack](https://img.shields.io/badge/Client-React_18-blue) ![Server](https://img.shields.io/badge/Server-Node.js_%2B_Express-green) ![DB](https://img.shields.io/badge/DB-MySQL_8-orange)

## 1. Qué incluye

- **Client** — React + Vite. Interfaz de usuario estilo iOS, buscador, detalle de estudiantes, matricular, editar y eliminar. Se ejecuta en el navegador en `http://localhost:3000`.
- **Server** — Node.js + Express. API REST, lógica de la aplicación, conexión a MySQL, recibe y devuelve JSON. Corre en `http://localhost:3001`.
- **Base de Datos** — MySQL Server. Almacena los datos en la tabla `estudiantes`. Se administra con MySQL Workbench. Usuario `root` / contraseña `admin`, puerto `3306`.

## 2. Endpoints de la API

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/estudiantes` | Listar todos |
| GET | `/estudiantes/:id` | Obtener uno |
| POST | `/estudiantes` | Crear nuevo |
| PUT | `/estudiantes/:id` | Editar |
| DELETE | `/estudiantes/:id` | Eliminar |
| GET | `/salud` | Estado del servidor |

Ejemplo:
```bash
curl http://localhost:3001/estudiantes
```

## 3. Requisitos

- Node.js LTS (para ejecutar el servidor y gestionar dependencias con npm)
- MySQL Server (sistema de gestión de base de datos)
- MySQL Workbench (herramienta gráfica para ejecutar el script `database/schema.sql` y ver la base)
- Visual Studio Code (editor donde se crean todos los archivos)

## 4. Puesta en marcha (5 min)

### 4.1 Base de datos
1. Abre MySQL Workbench y conéctate con usuario `root` / contraseña `admin`.
2. Abre y ejecuta `database/schema.sql`. Eso crea `matricula_db`, la tabla `estudiantes` y 3 alumnos de ejemplo.

O con Docker:
```bash
docker compose up -d db
# luego ejecuta database/schema.sql en MySQL Workbench contra localhost:3306
```

### 4.2 Server (puerto 3001)
```bash
cd server
npm install
npm run dev
# → http://localhost:3001/salud
```

> El server necesita MySQL corriendo (usuario `root` / contraseña `admin`, base `matricula_db`). Sin MySQL no arranca. Todo está hardcodeado en `server/src/db.js`.

### 4.3 Client (puerto 3000)
En otra terminal:
```bash
cd client
npm install
npm run dev
# → http://localhost:3000
```

## 5. Tabla `estudiantes`

| id | nombre | edad | carrera | correo | semestre |
|---|---|---|---|---|---|
| 1 | Juan Perez | 20 | Ing. de Software | juan@lasalle.edu.mx | 4 |
| 2 | Maria Gomez | 19 | Admon. de Empresas | maria@lasalle.edu.mx | 2 |
| 3 | Carlos Ramirez | 22 | Ing. Civil | carlos@lasalle.edu.mx | 6 |

## 6. Flujo completo

1. El usuario usa la app (Client React).
2. React envía peticiones HTTP (JSON) al server.
3. Node.js procesa la petición.
4. Ejecuta consultas SQL contra MySQL.
5. MySQL devuelve datos (Resultados).
6. Node devuelve JSON al navegador.

## 7. Estructura

```
app-matricula-la-salle/
├── server/             # Node.js + Express (puerto 3001)
│   ├── src/index.js    # Endpoints GET/POST/PUT/DELETE
│   ├── src/db.js       # Conexión MySQL + fallback en memoria
│   └── .env.example
├── client/             # React + Vite estilo iOS (puerto 3000)
│   └── src/App.jsx     # Lista + detalle + sheets + matricular/editar/eliminar
├── database/schema.sql # CREATE DATABASE + TABLE + seed
└── docker-compose.yml  # MySQL 8 para desarrollo (opcional)
```
