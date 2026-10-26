-- =============================================
-- Base de datos: matricula_db
-- Tabla: estudiantes
-- MySQL Server (puerto 3306)
-- Administrar con MySQL Workbench
-- Usuario: root / Contraseña: admin
-- =============================================

CREATE DATABASE IF NOT EXISTS matricula_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE matricula_db;

CREATE TABLE IF NOT EXISTS estudiantes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  edad INT NOT NULL CHECK (edad BETWEEN 1 AND 120),
  carrera VARCHAR(100) NOT NULL,
  correo VARCHAR(150) NOT NULL UNIQUE,
  semestre INT NOT NULL DEFAULT 1 CHECK (semestre BETWEEN 1 AND 12)
) ENGINE=InnoDB;

-- Si ya habías creado la tabla con la columna creado_en, elimínala con:
-- ALTER TABLE estudiantes DROP COLUMN creado_en;

-- Datos de ejemplo (los de la pizarra)
INSERT INTO estudiantes (nombre, edad, carrera, correo, semestre) VALUES
  ('Juan Perez', 20, 'Ing. de Software', 'juan@lasalle.edu.mx', 4),
  ('Maria Gomez', 19, 'Admon. de Empresas', 'maria@lasalle.edu.mx', 2),
  ('Carlos Ramirez', 22, 'Ing. Civil', 'carlos@lasalle.edu.mx', 6)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);
