const mysql = require('mysql2');

// Configuración fija (proyecto de prueba)
const db = mysql.createPool({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'admin',
  database: 'matricula_db',
});

module.exports = db;
