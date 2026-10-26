const express = require('express');
const cors = require('cors');
const { pool, initDb, validateEstudiante } = require('./db');

const app = express();
const PORT = 3001;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// Salud
app.get('/salud', (req, res) => {
  res.json({ ok: true, servicio: 'matricula-server-la-salle', puerto: PORT });
});

// GET /estudiantes (listar todos)
app.get('/estudiantes', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, nombre, edad, carrera, correo, semestre FROM estudiantes ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al listar estudiantes' });
  }
});

// GET /estudiantes/:id (uno solo, útil para editar)
app.get('/estudiantes/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    const [rows] = await pool.query(
      'SELECT id, nombre, edad, carrera, correo, semestre FROM estudiantes WHERE id = ?',
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Estudiante no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener estudiante' });
  }
});

// POST /estudiantes (crear nuevo)
app.post('/estudiantes', async (req, res) => {
  const { nombre, edad, carrera, correo, semestre } = req.body || {};
  const errors = validateEstudiante({ nombre, edad, carrera, correo, semestre });
  if (errors.length) return res.status(400).json({ error: errors.join('; ') });

  const data = {
    nombre: String(nombre).trim(),
    edad: Number(edad),
    carrera: String(carrera).trim(),
    correo: String(correo).trim(),
    semestre: Number(semestre),
  };

  try {
    try {
      const [result] = await pool.query(
        'INSERT INTO estudiantes (nombre, edad, carrera, correo, semestre) VALUES (?, ?, ?, ?, ?)',
        [data.nombre, data.edad, data.carrera, data.correo, data.semestre]
      );
      const [rows] = await pool.query(
        'SELECT id, nombre, edad, carrera, correo, semestre FROM estudiantes WHERE id = ?',
        [result.insertId]
      );
      res.status(201).json(rows[0]);
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ese correo ya esta matriculado' });
      throw err;
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear estudiante' });
  }
});

// PUT /estudiantes/:id (editar)
app.put('/estudiantes/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { nombre, edad, carrera, correo, semestre } = req.body || {};
  const errors = validateEstudiante({ nombre, edad, carrera, correo, semestre });
  if (errors.length) return res.status(400).json({ error: errors.join('; ') });

  const data = {
    nombre: String(nombre).trim(),
    edad: Number(edad),
    carrera: String(carrera).trim(),
    correo: String(correo).trim(),
    semestre: Number(semestre),
  };

  try {
    try {
      const [result] = await pool.query(
        'UPDATE estudiantes SET nombre = ?, edad = ?, carrera = ?, correo = ?, semestre = ? WHERE id = ?',
        [data.nombre, data.edad, data.carrera, data.correo, data.semestre, id]
      );
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Estudiante no encontrado' });
      const [rows] = await pool.query(
        'SELECT id, nombre, edad, carrera, correo, semestre FROM estudiantes WHERE id = ?',
        [id]
      );
      res.json(rows[0]);
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ese correo ya esta matriculado' });
      throw err;
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar estudiante' });
  }
});

// DELETE /estudiantes/:id (eliminar)
app.delete('/estudiantes/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    const [result] = await pool.query('DELETE FROM estudiantes WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Estudiante no encontrado' });
    res.json({ ok: true, id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar estudiante' });
  }
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[api] Server La Salle escuchando en http://localhost:${PORT}`);
      console.log('[api] Endpoints: GET POST /estudiantes | GET PUT DELETE /estudiantes/:id');
    });
  })
  .catch((err) => {
    console.error('[db] No se pudo conectar a MySQL. Arranca MySQL Server primero.');
    console.error('[db] Motivo:', err.code || err.message);
    process.exit(1);
  });

module.exports = app;
