import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/estudiantes';
const VACIO = { nombre: '', edad: '', carrera: '', correo: '', semestre: '' };

// Datos de ejemplo para el modo demo (cuando no hay backend, p. ej. en GitHub Pages).
// Se guardan en localStorage para que crear/editar/eliminar funcionen en la demo.
const DEMO_SEED = [
  { id: 1, nombre: 'Juan Perez', edad: 20, carrera: 'Ing. de Software', correo: 'juan@lasalle.edu.mx', semestre: 4 },
  { id: 2, nombre: 'Maria Gomez', edad: 19, carrera: 'Admon. de Empresas', correo: 'maria@lasalle.edu.mx', semestre: 2 },
  { id: 3, nombre: 'Carlos Ramirez', edad: 22, carrera: 'Ing. Civil', correo: 'carlos@lasalle.edu.mx', semestre: 6 },
];

function leerDemo() {
  try {
    const raw = localStorage.getItem('estudiantes-demo');
    if (raw) return JSON.parse(raw);
  } catch { /* semilla por defecto */ }
  return DEMO_SEED;
}

function guardarDemo(rows) {
  try { localStorage.setItem('estudiantes-demo', JSON.stringify(rows)); } catch { /* solo memoria */ }
}

export default function App() {
  const [estudiantes, setEstudiantes] = useState([]);
  const [form, setForm] = useState(VACIO);
  const [editandoId, setEditandoId] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);
  const [demo, setDemo] = useState(false);

  async function cargar() {
    setCargando(true);
    try {
      const r = await fetch(API);
      if (!r.ok) throw new Error('backend no disponible');
      const data = await r.json();
      setEstudiantes(Array.isArray(data) ? data : []);
      setDemo(false);
    } catch {
      // Sin backend (demo publicada en internet): usar datos locales.
      setDemo(true);
      setEstudiantes(leerDemo());
      setMensaje('');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  function onChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function empezarEdicion(est) {
    setEditandoId(est.id);
    setForm({
      nombre: est.nombre,
      edad: est.edad,
      carrera: est.carrera,
      correo: est.correo,
      semestre: est.semestre,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelar() {
    setEditandoId(null);
    setForm(VACIO);
  }

  async function guardar(e) {
    e.preventDefault();
    setMensaje('');
    const datos = { ...form, edad: Number(form.edad), semestre: Number(form.semestre) };
    if (demo) {
      // Modo demo: todo en el navegador (localStorage).
      if (editandoId) {
        const rows = estudiantes.map((x) => (x.id === editandoId ? { id: editandoId, ...datos } : x));
        setEstudiantes(rows); guardarDemo(rows);
        setMensaje(`Estudiante #${editandoId} actualizado (demo)`);
      } else {
        const id = estudiantes.length ? Math.max(...estudiantes.map((x) => x.id)) + 1 : 1;
        const rows = [...estudiantes, { id, ...datos }];
        setEstudiantes(rows); guardarDemo(rows);
        setMensaje(`Matriculado con id #${id} (demo)`);
      }
      cancelar();
      return;
    }
    const metodo = editandoId ? 'PUT' : 'POST';
    const url = editandoId ? `${API}/${editandoId}` : API;
    try {
      const r = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });
      const data = await r.json();
      if (!r.ok) {
        setMensaje(data.error || 'Error al guardar');
        return;
      }
      setMensaje(editandoId ? `Estudiante #${editandoId} actualizado` : `Matriculado con id #${data.id}`);
      cancelar();
      cargar();
    } catch {
      setMensaje('Error de red: no se pudo guardar');
    }
  }

  async function eliminar(id) {
    if (!confirm(`¿Eliminar al estudiante #${id}?`)) return;
    if (demo) {
      const rows = estudiantes.filter((x) => x.id !== id);
      setEstudiantes(rows); guardarDemo(rows);
      setMensaje(`Estudiante #${id} eliminado (demo)`);
      if (editandoId === id) cancelar();
      return;
    }
    try {
      const r = await fetch(`${API}/${id}`, { method: 'DELETE' });
      const data = await r.json();
      if (!r.ok) {
        setMensaje(data.error || 'Error al eliminar');
        return;
      }
      setMensaje(`Estudiante #${id} eliminado`);
      if (editandoId === id) cancelar();
      cargar();
    } catch {
      setMensaje('Error de red: no se pudo eliminar');
    }
  }

  return (
    <div className="pagina">
      <header className="encabezado">
        <div className="marca">
          <span className="birrete">🎓</span>
          <div>
            <h1>Matrícula de Estudiantes - La Salle</h1>
            <p>React (puerto 3000) → Node.js + Express (puerto 3001) → MySQL (puerto 3306)</p>
          </div>
        </div>
        <span className="pildora">Universidad La Salle</span>
      </header>

      {demo && <div className="mensaje">🌐 Modo demo en internet (sin backend): los cambios se guardan en tu navegador. Para la versión completa con MySQL, corre el proyecto localmente.</div>}
      {mensaje && <div className="mensaje">{mensaje}</div>}

      <main className="rejilla">
        <section className="tarjeta">
          <h2>{editandoId ? `Editar estudiante #${editandoId}` : 'Nuevo Estudiante'}</h2>
          <form onSubmit={guardar} className="formulario">
            <label>Nombre<input name="nombre" value={form.nombre} onChange={onChange} required placeholder="Juan Perez" /></label>
            <div className="fila">
              <label>Edad<input name="edad" type="number" min="1" max="120" value={form.edad} onChange={onChange} required placeholder="20" /></label>
              <label>Semestre<input name="semestre" type="number" min="1" max="12" value={form.semestre} onChange={onChange} required placeholder="4" /></label>
            </div>
            <label>Carrera<input name="carrera" value={form.carrera} onChange={onChange} required placeholder="Ing. de Software" /></label>
            <label>Correo<input name="correo" type="email" value={form.correo} onChange={onChange} required placeholder="juan@lasalle.edu.mx" /></label>
            <div className="acciones-form">
              <button type="submit" className="btn primario">{editandoId ? 'Guardar cambios' : 'Matricular'}</button>
              {editandoId && <button type="button" className="btn" onClick={cancelar}>Cancelar</button>}
            </div>
          </form>
          <p className="ayuda">Puerto: 3000 · Se abre en el navegador en http://localhost:3000</p>
        </section>

        <section className="tarjeta">
          <div className="tabla-cabeza">
            <h2>Estudiantes ({estudiantes.length})</h2>
            <button className="btn pequeno" onClick={cargar} disabled={cargando}>
              {cargando ? 'Cargando…' : 'Recargar'}
            </button>
          </div>
          <div className="tabla-contenedor">
            <table>
              <thead>
                <tr><th>ID</th><th>Nombre</th><th>Edad</th><th>Carrera</th><th>Correo</th><th>Sem.</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {estudiantes.map((est) => (
                  <tr key={est.id}>
                    <td>{est.id}</td>
                    <td>{est.nombre}</td>
                    <td>{est.edad}</td>
                    <td>{est.carrera}</td>
                    <td className="correo">{est.correo}</td>
                    <td>{est.semestre}</td>
                    <td className="acciones">
                      <button className="btn pequeno" onClick={() => empezarEdicion(est)} title="Editar">✏️</button>
                      <button className="btn pequeno peligro" onClick={() => eliminar(est.id)} title="Eliminar">🗑️</button>
                    </td>
                  </tr>
                ))}
                {!estudiantes.length && !cargando && (
                  <tr><td colSpan="7" className="vacio">Sin estudiantes. ¡Matricula el primero!</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <footer className="pie">
        <span>Endpoints: GET /api/estudiantes · POST /api/estudiantes · PUT /api/estudiantes/:id · DELETE /api/estudiantes/:id</span>
      </footer>
    </div>
  );
}
