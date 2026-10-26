const mysql = require('mysql2/promise');

let pool = null;
let mysqlOk = false;

// Datos en memoria (fallback para que la app funcione sin MySQL,
// p. ej. en clase sin haber instalado el servidor todavía).
// Se sincroniza con los mismos 3 estudiantes de la pizarra.
const memoryStore = {
  nextId: 4,
  rows: [
    { id: 1, nombre: 'Juan Perez', edad: 20, carrera: 'Ing. de Software', correo: 'juan@lasalle.edu.mx', semestre: 4 },
    { id: 2, nombre: 'Maria Gomez', edad: 19, carrera: 'Admon. de Empresas', correo: 'maria@lasalle.edu.mx', semestre: 2 },
    { id: 3, nombre: 'Carlos Ramirez', edad: 22, carrera: 'Ing. Civil', correo: 'carlos@lasalle.edu.mx', semestre: 6 },
  ],
};

async function initDb() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'admin',
    database: process.env.DB_NAME || 'matricula_db',
    waitForConnections: true,
    connectionLimit: 10,
  };
  try {
    pool = mysql.createPool(config);
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    mysqlOk = true;
    console.log(`[db] Conectado a MySQL ${config.host}:${config.port}/${config.database}`);
  } catch (err) {
    mysqlOk = false;
    console.warn('[db] No se pudo conectar a MySQL, usando almacenamiento en memoria.');
    console.warn('[db] Motivo:', err.code || err.message);
    console.warn('[db] Revisa server/.env y que MySQL Server este corriendo en el puerto 3306.');
  }
}

function isMysql() {
  return mysqlOk && pool;
}

function validateEstudiante({ nombre, edad, carrera, correo, semestre }) {
  const errors = [];
  if (!nombre || String(nombre).trim().length < 2) errors.push('nombre es requerido (min. 2 caracteres)');
  if (edad === undefined || edad === null || isNaN(Number(edad))) errors.push('edad es requerida (numero)');
  else if (Number(edad) < 1 || Number(edad) > 120) errors.push('edad debe estar entre 1 y 120');
  if (!carrera || String(carrera).trim().length < 2) errors.push('carrera es requerida');
  if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(correo))) errors.push('correo no es valido');
  if (semestre === undefined || semestre === null || semestre === '') errors.push('semestre es requerido');
  else if (isNaN(Number(semestre)) || Number(semestre) < 1 || Number(semestre) > 12)
    errors.push('semestre debe estar entre 1 y 12');
  return errors;
}

module.exports = { pool: () => pool, initDb, isMysql, memoryStore, validateEstudiante };
