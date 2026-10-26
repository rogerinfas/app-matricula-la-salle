const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// Salud
app.get('/salud', (req, res) => {
  res.json({ ok: true });
});

// Listar todos
app.get('/estudiantes', (req, res) => {
  db.query('SELECT * FROM estudiantes ORDER BY id ASC', (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error al listar' });
    res.json(rows);
  });
});

// Obtener uno
app.get('/estudiantes/:id', (req, res) => {
  db.query('SELECT * FROM estudiantes WHERE id = ?', [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error al obtener' });
    if (!rows.length) return res.status(404).json({ error: 'No encontrado' });
    res.json(rows[0]);
  });
});

// Crear nuevo
app.post('/estudiantes', (req, res) => {
  const { nombre, edad, carrera, correo, semestre } = req.body;
  db.query(
    'INSERT INTO estudiantes (nombre, edad, carrera, correo, semestre) VALUES (?, ?, ?, ?, ?)',
    [nombre, edad, carrera, correo, semestre],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Error al crear' });
      res.status(201).json({ ok: true, id: result.insertId });
    }
  );
});

// Editar
app.put('/estudiantes/:id', (req, res) => {
  const { nombre, edad, carrera, correo, semestre } = req.body;
  db.query(
    'UPDATE estudiantes SET nombre = ?, edad = ?, carrera = ?, correo = ?, semestre = ? WHERE id = ?',
    [nombre, edad, carrera, correo, semestre, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: 'Error al editar' });
      res.json({ ok: true });
    }
  );
});

// Eliminar
app.delete('/estudiantes/:id', (req, res) => {
  db.query('DELETE FROM estudiantes WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Error al eliminar' });
    res.json({ ok: true });
  });
});

app.listen(3001, () => console.log('Server en http://localhost:3001'));

module.exports = app;
