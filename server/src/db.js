const mysql = require('mysql2/promise');

// Configuración fija (proyecto de prueba)
const pool = mysql.createPool({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'admin',
  database: 'matricula_db',
  waitForConnections: true,
  connectionLimit: 10,
});

async function initDb() {
  // Si MySQL no está corriendo, el server no arranca (sin fallback).
  const conn = await pool.getConnection();
  await conn.ping();
  conn.release();
  console.log('[db] Conectado a MySQL localhost:3306/matricula_db');
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

module.exports = { pool, initDb, validateEstudiante };
