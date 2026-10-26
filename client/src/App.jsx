import { useEffect, useMemo, useState } from 'react';

const API = 'http://localhost:3001/estudiantes';
const VACIO = { nombre: '', edad: '', carrera: '', correo: '', semestre: '' };

// Datos de ejemplo para el modo demo (sin server, p. ej. en GitHub Pages).
const DEMO_SEED = [
  { id: 1, nombre: 'Juan Perez', edad: 20, carrera: 'Ing. de Software', correo: 'juan@lasalle.edu.mx', semestre: 4 },
  { id: 2, nombre: 'Maria Gomez', edad: 19, carrera: 'Admon. de Empresas', correo: 'maria@lasalle.edu.mx', semestre: 2 },
  { id: 3, nombre: 'Carlos Ramirez', edad: 22, carrera: 'Ing. Civil', correo: 'carlos@lasalle.edu.mx', semestre: 6 },
];

function leerDemo() {
  // Lo que hay en localStorage siempre lo escribió esta misma app (JSON válido).
  const raw = localStorage.getItem('estudiantes-demo');
  if (!raw) return DEMO_SEED;
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) && parsed.length ? parsed : DEMO_SEED;
}

function guardarDemo(rows) {
  localStorage.setItem('estudiantes-demo', JSON.stringify(rows));
}

const AVATARES = [
  'linear-gradient(135deg,#5AC8FA,#007AFF)',
  'linear-gradient(135deg,#FF9F0A,#FF375F)',
  'linear-gradient(135deg,#BF5AF2,#5E5CE6)',
  'linear-gradient(135deg,#64D2FF,#30D158)',
  'linear-gradient(135deg,#FFD60A,#FF9F0A)',
  'linear-gradient(135deg,#FF6482,#AF52DE)',
];

function iniciales(nombre) {
  return String(nombre || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

function IconoLista({ activo }) {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill={activo ? '#007AFF' : '#8E8E93'}>
      <path d="M16 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-8 1a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm8 1c-2.7 0-8 1.3-8 4v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2c0-2.7-5.3-4-8-4ZM2 17v-1a4 4 0 0 1 3-3.9A6.7 6.7 0 0 0 2 17v3a1 1 0 0 0 1 1h2v-2a5 5 0 0 1-3-2Z" />
    </svg>
  );
}

function IconoMas({ activo }) {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke={activo ? '#007AFF' : '#8E8E93'} strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

export default function App() {
  const [estudiantes, setEstudiantes] = useState([]);
  const [demo, setDemo] = useState(false);
  const [tab, setTab] = useState('estudiantes');
  const [busqueda, setBusqueda] = useState('');
  const [seleccionadoId, setSeleccionadoId] = useState(null);
  const [sheet, setSheet] = useState(null); // null | { mode: 'nuevo' | 'editar', id? }
  const [form, setForm] = useState(VACIO);
  const [confirmarId, setConfirmarId] = useState(null);
  const [banner, setBanner] = useState('');
  const [hora, setHora] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setHora(new Date()), 20000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { cargar(); }, []);

  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(''), 2600);
    return () => clearTimeout(t);
  }, [banner]);

  function cargar() {
    fetch(API)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('server no disponible'))))
      .then((data) => {
        setEstudiantes(Array.isArray(data) ? data : []);
        setDemo(false);
      })
      .catch(() => {
        setDemo(true);
        setEstudiantes(leerDemo());
      });
  }

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return estudiantes;
    return estudiantes.filter((e) =>
      [e.nombre, e.carrera, e.correo].some((v) => String(v).toLowerCase().includes(q))
    );
  }, [estudiantes, busqueda]);

  const seleccionado = estudiantes.find((e) => e.id === seleccionadoId) || null;

  function onChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function abrirNuevo() {
    setForm(VACIO);
    setSheet({ mode: 'nuevo' });
  }

  function abrirEditar(est) {
    setForm({ nombre: est.nombre, edad: est.edad, carrera: est.carrera, correo: est.correo, semestre: est.semestre });
    setSheet({ mode: 'editar', id: est.id });
  }

  function validar(d) {
    if (String(d.nombre).trim().length < 2) return 'Escribe el nombre del estudiante';
    if (!d.edad || isNaN(Number(d.edad)) || Number(d.edad) < 1 || Number(d.edad) > 120) return 'Edad inválida (1–120)';
    if (String(d.carrera).trim().length < 2) return 'Escribe la carrera';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(d.correo))) return 'Correo inválido';
    if (isNaN(Number(d.semestre)) || Number(d.semestre) < 1 || Number(d.semestre) > 12) return 'Semestre inválido (1–12)';
    return null;
  }

  function guardar(e) {
    e.preventDefault();
    const datos = {
      nombre: String(form.nombre).trim(),
      edad: Number(form.edad),
      carrera: String(form.carrera).trim(),
      correo: String(form.correo).trim(),
      semestre: Number(form.semestre),
    };
    const err = validar(datos);
    if (err) { setBanner(err); return; }

    const editandoId = sheet?.mode === 'editar' ? sheet.id : null;

    if (demo) {
      if (estudiantes.some((x) => x.id !== editandoId && x.correo.toLowerCase() === datos.correo.toLowerCase())) {
        setBanner('Ese correo ya está matriculado');
        return;
      }
      let rows;
      if (editandoId) {
        rows = estudiantes.map((x) => (x.id === editandoId ? { id: editandoId, ...datos } : x));
        setBanner('Cambios guardados');
      } else {
        const id = estudiantes.length ? Math.max(...estudiantes.map((x) => x.id)) + 1 : 1;
        rows = [...estudiantes, { id, ...datos }];
        setBanner('Estudiante matriculado');
      }
      setEstudiantes(rows);
      guardarDemo(rows);
      setSheet(null);
      setTab('estudiantes');
      return;
    }

    fetch(editandoId ? `${API}/${editandoId}` : API, {
      method: editandoId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
    })
      .then((r) => r.json().then((data) => ({ ok: r.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) { setBanner(data.error || 'Error al guardar'); return; }
        setBanner(editandoId ? 'Cambios guardados' : 'Estudiante matriculado');
        setSheet(null);
        setTab('estudiantes');
        cargar();
      })
      .catch(() => setBanner('Sin conexión con el servidor'));
  }

  function eliminar(id) {
    setConfirmarId(null);
    if (demo) {
      const rows = estudiantes.filter((x) => x.id !== id);
      setEstudiantes(rows);
      guardarDemo(rows);
      setSeleccionadoId(null);
      setBanner('Estudiante eliminado');
      return;
    }
    fetch(`${API}/${id}`, { method: 'DELETE' })
      .then((r) => r.json().then((data) => ({ ok: r.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) { setBanner(data.error || 'Error al eliminar'); return; }
        setSeleccionadoId(null);
        setBanner('Estudiante eliminado');
        cargar();
      })
      .catch(() => setBanner('Sin conexión con el servidor'));
  }

  const hh = hora.getHours();
  const mm = String(hora.getMinutes()).padStart(2, '0');
  const horaTxt = `${hh % 12 === 0 ? 12 : hh % 12}:${mm}`;

  return (
    <div className="fondo">
      <div className="iphone">
        <div className="pantalla">
          <div className="isla" />
          <div className="statusbar">
            <span className="hora">{horaTxt}</span>
            <span className="iconos">
              <svg viewBox="0 0 20 14" width="18" height="12" fill="currentColor"><rect x="0" y="9" width="3" height="5" rx="1" /><rect x="5" y="6" width="3" height="8" rx="1" /><rect x="10" y="3" width="3" height="11" rx="1" /><rect x="15" y="0" width="3" height="14" rx="1" opacity=".4" /></svg>
              <svg viewBox="0 0 24 24" width="17" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 10a12 12 0 0 1 16 0M7.5 13.5a7 7 0 0 1 9 0M11 17a1.5 1.5 0 0 1 2 0" /><circle cx="12" cy="19" r="1.3" fill="currentColor" stroke="none" /></svg>
              <svg viewBox="0 0 28 14" width="26" height="12" fill="none" stroke="currentColor"><rect x="1" y="1.5" width="22" height="11" rx="3.5" opacity=".5" /><rect x="3" y="3.5" width="15" height="7" rx="2" fill="currentColor" stroke="none" /><path d="M25.5 5v4" strokeLinecap="round" strokeWidth="1.6" opacity=".5" /></svg>
            </span>
          </div>

          {banner && <div className="banner">{banner}</div>}

          {/* ===== Tab: Estudiantes ===== */}
          {tab === 'estudiantes' && seleccionado === null && (
            <div className="vista">
              <div className="navbar">
                <button className="navlink" onClick={() => setTab('nuevo')}>Matricular</button>
                <button className="navmas" onClick={abrirNuevo} aria-label="Nuevo estudiante">＋</button>
              </div>
              <h1 className="titulogrande">Estudiantes</h1>
              <div className="buscador">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#8E8E93" strokeWidth="2.4" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.8-3.8" /></svg>
                <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar" />
              </div>

              <div className="scroll">
                <div className="seccion-titulo">Matriculados · {filtrados.length}</div>
                <div className="grupo">
                  {filtrados.map((est, i) => (
                    <button
                      key={est.id}
                      className={'celda' + (i === filtrados.length - 1 ? ' ultima' : '')}
                      onClick={() => setSeleccionadoId(est.id)}
                    >
                      <span className="avatar" style={{ background: AVATARES[est.id % AVATARES.length] }}>
                        {iniciales(est.nombre)}
                      </span>
                      <span className="celda-txt">
                        <span className="celda-nombre">{est.nombre}</span>
                        <span className="celda-sub">{est.carrera} · Sem. {est.semestre}</span>
                      </span>
                      <span className="chevron">›</span>
                    </button>
                  ))}
                  {filtrados.length === 0 && (
                    <div className="vacio">Sin resultados</div>
                  )}
                </div>
                {demo && <p className="nota">Modo demo: los cambios se guardan en este iPhone (navegador).</p>}
              </div>
            </div>
          )}

          {/* ===== Detalle ===== */}
          {tab === 'estudiantes' && seleccionado !== null && (
            <div className="vista detalle">
              <div className="navbar">
                <button className="navlink" onClick={() => setSeleccionadoId(null)}>‹ Estudiantes</button>
                <button className="navlink" onClick={() => abrirEditar(seleccionado)}>Editar</button>
              </div>
              <div className="perfil">
                <span className="avatar grande" style={{ background: AVATARES[seleccionado.id % AVATARES.length] }}>
                  {iniciales(seleccionado.nombre)}
                </span>
                <h2>{seleccionado.nombre}</h2>
                <p>{seleccionado.carrera}</p>
              </div>
              <div className="grupo">
                <div className="fila"><span>Edad</span><b>{seleccionado.edad} años</b></div>
                <div className="fila"><span>Semestre</span><b>{seleccionado.semestre}°</b></div>
                <div className="fila ultima"><span>Correo</span><b className="correo">{seleccionado.correo}</b></div>
              </div>
              <button className="btn-eliminar" onClick={() => setConfirmarId(seleccionado.id)}>
                Eliminar estudiante
              </button>
            </div>
          )}

          {/* ===== Tab: Matricular ===== */}
          {tab === 'nuevo' && (
            <div className="vista">
              <div className="navbar centro"><span className="navtitulo">Nuevo estudiante</span></div>
              <h1 className="titulogrande">Matricular</h1>
              <div className="scroll">
                <Formulario form={form} onChange={onChange} onSubmit={guardar} submitLabel="Matricular" />
                <p className="nota">React → Node.js + Express → MySQL · La Salle</p>
              </div>
            </div>
          )}

          {/* ===== Sheet: editar / nuevo rápido ===== */}
          {sheet && (
            <div className="sheet-fondo" onClick={() => setSheet(null)}>
              <div className="sheet" onClick={(e) => e.stopPropagation()}>
                <div className="grabber" />
                <div className="sheet-head">
                  <button className="navlink" onClick={() => setSheet(null)}>Cancelar</button>
                  <b>{sheet.mode === 'editar' ? 'Editar' : 'Nuevo'}</b>
                  <button className="navlink fuerte" onClick={guardar}>Guardar</button>
                </div>
                <Formulario form={form} onChange={onChange} onSubmit={guardar} submitLabel={sheet.mode === 'editar' ? 'Guardar cambios' : 'Matricular'} />
              </div>
            </div>
          )}

          {/* ===== Action sheet: eliminar ===== */}
          {confirmarId !== null && (
            <div className="sheet-fondo" onClick={() => setConfirmarId(null)}>
              <div className="actionsheet" onClick={(e) => e.stopPropagation()}>
                <div className="grupo action">
                  <div className="action-titulo">¿Eliminar a este estudiante?<br /><small>Esta acción no se puede deshacer.</small></div>
                  <button className="action-btn destructivo" onClick={() => eliminar(confirmarId)}>Eliminar</button>
                </div>
                <div className="grupo action">
                  <button className="action-btn" onClick={() => setConfirmarId(null)}>Cancelar</button>
                </div>
              </div>
            </div>
          )}

          {/* ===== Tab bar ===== */}
          {seleccionado === null && !sheet && confirmarId === null && (
            <nav className="tabbar">
              <button className={'tab' + (tab === 'estudiantes' ? ' activo' : '')} onClick={() => setTab('estudiantes')}>
                <IconoLista activo={tab === 'estudiantes'} />
                <span>Estudiantes</span>
              </button>
              <button className={'tab' + (tab === 'nuevo' ? ' activo' : '')} onClick={() => setTab('nuevo')}>
                <IconoMas activo={tab === 'nuevo'} />
                <span>Matricular</span>
              </button>
            </nav>
          )}
          <div className="homebar" />
        </div>
      </div>
      <p className="piedemo">Matrícula de Estudiantes · La Salle · demo interactiva</p>
    </div>
  );
}

function Formulario({ form, onChange, onSubmit, submitLabel }) {
  return (
    <form onSubmit={onSubmit}>
      <div className="grupo">
        <label className="campo"><span>Nombre</span><input name="nombre" value={form.nombre} onChange={onChange} required placeholder="Juan Perez" /></label>
        <div className="campo-doble">
          <label className="campo"><span>Edad</span><input name="edad" type="number" min="1" max="120" value={form.edad} onChange={onChange} required placeholder="20" /></label>
          <label className="campo"><span>Semestre</span><input name="semestre" type="number" min="1" max="12" value={form.semestre} onChange={onChange} required placeholder="4" /></label>
        </div>
        <label className="campo"><span>Carrera</span><input name="carrera" value={form.carrera} onChange={onChange} required placeholder="Ing. de Software" /></label>
        <label className="campo ultima"><span>Correo</span><input name="correo" type="email" value={form.correo} onChange={onChange} required placeholder="juan@lasalle.edu.mx" /></label>
      </div>
      <button type="submit" className="btn-ios">{submitLabel}</button>
    </form>
  );
}
