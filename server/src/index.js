require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDb, isMysql, pool, memoryStore, validateEstudiante } = require('./db');

const app = express();
const PORT = Number(process.env.PORT || 3001);

app.use(cors({ origin: (process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000').split(',') }));
app.use(express.json());

// Salud
app.get('/api/salud', (req, res) => {
  res.json({ ok: true, servicio: 'matricula-server-la-salle', mysql: isMysql(), puerto: PORT });
});

// GET /api/estudiantes (listar todos)
app.get('/api/estudiantes', async (req, res) => {
  try {
    if (isMysql()) {
      const [rows] = await pool().query('SELECT id, nombre, edad, carrera, correo, semestre FROM estudiantes ORDER BY id ASC');
      return res.json(rows);
    }
    return res.json(memoryStore.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al listar estudiantes' });
  }
});

// GET /api/estudiantes/:id (uno solo, útil para editar)
app.get('/api/estudiantes/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    if (isMysql()) {
      const [rows] = await pool().query(
        'SELECT id, nombre, edad, carrera, correo, semestre FROM estudiantes WHERE id = ?',
        [id]
      );
      if (!rows.length) return res.status(404).json({ error: 'Estudiante no encontrado' });
      return res.json(rows[0]);
    }
    const row = memoryStore.rows.find((e) => e.id === id);
    if (!row) return res.status(404).json({ error: 'Estudiante no encontrado' });
    return res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener estudiante' });
  }
});

// POST /api/estudiantes (crear nuevo)
app.post('/api/estudiantes', async (req, res) => {
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
    if (isMysql()) {
      try {
        const [result] = await pool().query(
          'INSERT INTO estudiantes (nombre, edad, carrera, correo, semestre) VALUES (?, ?, ?, ?, ?)',
          [data.nombre, data.edad, data.carrera, data.correo, data.semestre]
        );
        const [rows] = await pool().query(
          'SELECT id, nombre, edad, carrera, correo, semestre FROM estudiantes WHERE id = ?',
          [result.insertId]
        );
        return res.status(201).json(rows[0]);
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ese correo ya esta matriculado' });
        throw err;
      }
    }
    if (memoryStore.rows.some((e) => e.correo.toLowerCase() === data.correo.toLowerCase())) {
      return res.status(409).json({ error: 'Ese correo ya esta matriculado' });
    }
    const nuevo = { id: memoryStore.nextId++, ...data };
    memoryStore.rows.push(nuevo);
    return res.status(201).json(nuevo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear estudiante' });
  }
});

// PUT /api/estudiantes/:id (editar)
app.put('/api/estudiantes/:id', async (req, res) => {
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
    if (isMysql()) {
      try {
        const [result] = await pool().query(
          'UPDATE estudiantes SET nombre = ?, edad = ?, carrera = ?, correo = ?, semestre = ? WHERE id = ?',
          [data.nombre, data.edad, data.carrera, data.correo, data.semestre, id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Estudiante no encontrado' });
        const [rows] = await pool().query(
          'SELECT id, nombre, edad, carrera, correo, semestre FROM estudiantes WHERE id = ?',
          [id]
        );
        return res.json(rows[0]);
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ese correo ya esta matriculado' });
        throw err;
      }
    }
    const idx = memoryStore.rows.findIndex((e) => e.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Estudiante no encontrado' });
    if (memoryStore.rows.some((e) => e.id !== id && e.correo.toLowerCase() === data.correo.toLowerCase())) {
      return res.status(409).json({ error: 'Ese correo ya esta matriculado' });
    }
    memoryStore.rows[idx] = { id, ...data };
    return res.json(memoryStore.rows[idx]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar estudiante' });
  }
});

// DELETE /api/estudiantes/:id (eliminar)
app.delete('/api/estudiantes/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    if (isMysql()) {
      const [result] = await pool().query('DELETE FROM estudiantes WHERE id = ?', [id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Estudiante no encontrado' });
      return res.json({ ok: true, id });
    }
    const idx = memoryStore.rows.findIndex((e) => e.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Estudiante no encontrado' });
    memoryStore.rows.splice(idx, 1);
    return res.json({ ok: true, id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar estudiante' });
  }
});

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`[api] Server La Salle escuchando en http://localhost:${PORT}`);
    console.log('[api] Endpoints: GET POST /api/estudiantes | GET PUT DELETE /api/estudiantes/:id');
  });
});

module.exports = app;
