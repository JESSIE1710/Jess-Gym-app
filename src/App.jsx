import { useState, useEffect } from 'react';
import { db, auth, googleProvider } from './firebase'; 
import { collection, addDoc, getDocs, query, where, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInWithPopup } from 'firebase/auth';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

// --- CONFIGURACIÓN ---
const rutinasIniciales = { Lunes: [], Martes: [], Miércoles: [], Jueves: [], Viernes: [], Sábado: [], Domingo: [] };
const catalogoInicial = [
  { id: 'c1', nombre: 'Sentadillas', categoria: 'Piernas', imgMaquina: null, imgLibre: null }, 
  { id: 'c2', nombre: 'Jalón al pecho', categoria: 'Espalda', imgMaquina: null, imgLibre: null },
  { id: 'c3', nombre: 'Hip Thrust', categoria: 'Glúteos', imgMaquina: null, imgLibre: null }
];
const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const estilos = {
  contenedorPrincipal: { backgroundColor: '#0f172a', color: '#e2e8f0', minHeight: '100vh', padding: '15px', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: '100px', boxSizing: 'border-box' },
  tituloApp: { color: '#60a5fa', fontSize: '28px', fontWeight: 'bold', margin: '15px 0', textAlign: 'center', textShadow: '0 0 10px rgba(96, 165, 250, 0.3)' },
  menuPrincipal: { display: 'flex', gap: '8px', marginBottom: '25px', backgroundColor: '#1e293b', padding: '8px', borderRadius: '15px', border: '1px solid #334155', width: '100%', maxWidth: '500px' },
  botonMenu: { flex: 1, padding: '12px 5px', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' },
  botonActivo: { backgroundColor: '#3b82f6', color: 'white', boxShadow: '0 4px 10px rgba(59, 130, 246, 0.4)' },
  contenedorTabs: { display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', justifyContent: 'center', width: '100%' },
  botonTab: { padding: '10px 15px', cursor: 'pointer', backgroundColor: '#1e293b', color: '#cbd5e1', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px' },
  scrollTabla: { width: '100%', maxWidth: '850px', overflowX: 'auto', borderRadius: '12px', backgroundColor: '#1e293b', border: '1px solid #334155', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)' },
  tabla: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
  celdaEncabezado: { padding: '15px 10px', textAlign: 'left', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', borderBottom: '2px solid #334155' },
  celdaCuerpo: { padding: '12px 10px', borderBottom: '1px solid #334155', verticalAlign: 'middle' },
  imagenEjercicio: { width: '65px', height: '65px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #334155' },
  cajaImagenVacia: { width: '65px', height: '65px', backgroundColor: '#0f172a', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '10px', color: '#475569', border: '1px dashed #334155' },
  panelEntrenamiento: { marginTop: '20px', width: '100%', maxWidth: '550px', backgroundColor: '#1e293b', borderRadius: '20px', border: '1px solid #3b82f6', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' },
  tituloLog: { backgroundColor: '#3b82f6', color: 'white', margin: 0, padding: '18px', fontSize: '18px', textAlign: 'center', fontWeight: 'bold' },
  gridDiscos: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '12px' },
  botonDiscoMini: { padding: '15px 0', backgroundColor: '#334155', color: 'white', border: '1px solid #475569', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' },
  botonResetMini: { padding: '15px 0', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' },
  inputRegistrar: { padding: '15px', borderRadius: '10px', backgroundColor: '#0f172a', color: 'white', border: '1px solid #334155', width: '100%', boxSizing: 'border-box', marginBottom: '10px', fontSize: '14px' },
  zonaAñadir: { marginTop: '25px', display: 'flex', gap: '10px', width: '100%', maxWidth: '500px', backgroundColor: '#1e293b', padding: '20px', borderRadius: '15px', border: '1px solid #334155', flexWrap: 'wrap' },
  botonAñadirGrande: { padding: '15px 25px', backgroundColor: '#1e3a8a', color: '#bfdbfe', border: '1px solid #3b82f6', borderRadius: '10px', fontWeight: 'bold', fontSize: '18px', cursor: 'pointer' },
  gridGraficos: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', width: '100%', maxWidth: '1000px', marginTop: '20px' },
  panelGrafico: { backgroundColor: '#1e293b', padding: '20px', borderRadius: '15px', border: '1px solid #334155' },
  tarjetaBiblioteca: { backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', padding: '15px', display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }
};

const COLORES_DONUT = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

const formatoFechaSegura = (fechaString) => {
  if (!fechaString) return 'Sin fecha';
  const d = new Date(fechaString);
  return isNaN(d.getTime()) ? 'Sin fecha' : d.toLocaleDateString('es-ES', { day:'2-digit', month:'short' });
};

function App() {
  const [usuario, setUsuario] = useState(null);
  const [vistaPrincipal, setVistaPrincipal] = useState('rutina'); // rutina | biblioteca | progreso
  const [rutinas, setRutinas] = useState(rutinasIniciales);
  const [catalogo, setCatalogo] = useState(catalogoInicial);
  const [cargandoPerfil, setCargandoPerfil] = useState(true);
  const [historialPeso, setHistorialPeso] = useState([]);
  const [metaPeso, setMetaPeso] = useState(null);
  const [diaActual, setDiaActual] = useState('Lunes');
  const [seriesGuardadas, setSeriesGuardadas] = useState([]);
  const [notasPorEjercicio, setNotasPorEjercicio] = useState({});
  const [ejercicioActivo, setEjercicioActivo] = useState(null);
  
  // Estados de formularios
  const [mostrarCreador, setMostrarCreador] = useState(false);
  const [nuevoEj, setNuevoEj] = useState({ nombre: '', categoria: 'Piernas', imgM: null, imgL: null });
  const [pesoActual, setPesoActual] = useState(0);
  const [repsActuales, setRepsActuales] = useState('10');
  const [descansoActual, setDescansoActual] = useState('60');
  const [modalidadActual, setModalidadActual] = useState('Máquina');
  const [textoNotaActual, setTextoNotaActual] = useState('');
  const [ejercicioSeleccionadoCatalogo, setEjercicioSeleccionadoCatalogo] = useState('');
  const [diaParaCopiar, setDiaParaCopiar] = useState('');
  const [ejercicioFuerzaSel, setEjercicioFuerzaSel] = useState('');
  const [inputPesoActual, setInputPesoActual] = useState('');

  const opcionesDescanso = []; for (let i = 20; i <= 240; i += 20) opcionesDescanso.push({ valor: i, texto: i < 60 ? `${i}s` : `${Math.floor(i/60)}m ${i%60||''}s` });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUsuario(user);
      else { setUsuario(null); setCargandoPerfil(false); }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!usuario) return;
    const cargarTodo = async () => {
      try {
        setCargandoPerfil(true);
        const pSnap = await getDoc(doc(db, "perfiles", usuario.uid));
        if (pSnap.exists()) {
          const d = pSnap.data();
          if (d.rutinas) setRutinas(d.rutinas);
          if (d.catalogo) setCatalogo(d.catalogo);
          if (d.notas) setNotasPorEjercicio(d.notas);
        }
        const qS = query(collection(db, "series"), where("userId", "==", usuario.uid));
        const sSnap = await getDocs(qS);
        const sData = []; sSnap.forEach(d => sData.push({ id: d.id, ...d.data() }));
        setSeriesGuardadas(sData);
        
        const qP = query(collection(db, "pesoCorporal"), where("userId", "==", usuario.uid));
        const pSnapPeso = await getDocs(qP);
        const pData = []; pSnapPeso.forEach(d => pData.push({ id: d.id, ...d.data() }));
        setHistorialPeso(pData.filter(p => !p.esObjetivo).sort((a,b) => new Date(a.fecha) - new Date(b.fecha)));
        const obj = pData.find(p => p.esObjetivo); if (obj) setMetaPeso(obj.peso);
      } catch (e) { console.error(e); } finally { setCargandoPerfil(false); }
    };
    cargarTodo();
  }, [usuario]);

  const syncPerfil = async (r, c, n) => {
    try { await setDoc(doc(db, "perfiles", usuario.uid), { rutinas: r, catalogo: c, notas: n || notasPorEjercicio }, { merge: true }); } catch (e) {}
  };

  const agregarAlDia = () => {
    if (!ejercicioSeleccionadoCatalogo) return;
    const ej = catalogo.find(c => c.id === ejercicioSeleccionadoCatalogo);
    const nr = { ...rutinas, [diaActual]: [...(rutinas[diaActual] || []), { ...ej, id: Date.now().toString() }] };
    setRutinas(nr); syncPerfil(nr, catalogo); setEjercicioSeleccionadoCatalogo('');
  };

  const copiarRutina = () => {
    if (!diaParaCopiar || !rutinas[diaParaCopiar]) return;
    const copia = rutinas[diaParaCopiar].map(e => ({ ...e, id: Date.now().toString() + Math.random() }));
    const nr = { ...rutinas, [diaActual]: [...(rutinas[diaActual] || []), ...copia] };
    setRutinas(nr); syncPerfil(nr, catalogo); setDiaParaCopiar(''); alert(`¡Copiado del ${diaParaCopiar} al ${diaActual}!`);
  };

  const moverEjercicio = (idx, dir) => {
    const arr = [...(rutinas[diaActual] || [])];
    if (dir === 'arriba' && idx > 0) [arr[idx-1], arr[idx]] = [arr[idx], arr[idx-1]];
    else if (dir === 'abajo' && idx < arr.length - 1) [arr[idx+1], arr[idx]] = [arr[idx], arr[idx+1]];
    const nr = { ...rutinas, [diaActual]: arr }; setRutinas(nr); syncPerfil(nr, catalogo);
  };

  const guardarEnCatalogo = () => {
    if (!nuevoEj.nombre) return;
    const nc = [...(catalogo || []), { id: Date.now().toString(), ...nuevoEj }];
    setCatalogo(nc); syncPerfil(rutinas, nc);
    setNuevoEj({ nombre: '', categoria: 'Piernas', imgM: null, imgL: null }); setMostrarCreador(false);
  };

  const guardarSerie = async () => {
    if (!ejercicioActivo) return;
    const n = { ejercicio: ejercicioActivo.nombre, peso: pesoActual, reps: repsActuales, descanso: descansoActual, modalidad: modalidadActual, fechaAlta: new Date().toISOString(), userId: usuario.uid };
    try {
      const docRef = await addDoc(collection(db, "series"), n);
      setSeriesGuardadas([...seriesGuardadas, { id: docRef.id, ...n }]);
    } catch(e) {}
  };

  const eliminarSerie = async (id) => {
    try { await deleteDoc(doc(db, "series", id)); setSeriesGuardadas(prev => prev.filter(s => s.id !== id)); } catch(e) {}
  };

  const finalizarEjercicio = () => {
    if (!ejercicioActivo) return;
    const nuevasNotas = { ...(notasPorEjercicio || {}), [ejercicioActivo.nombre]: textoNotaActual };
    setNotasPorEjercicio(nuevasNotas); syncPerfil(rutinas, catalogo, nuevasNotas);
    setEjercicioActivo(null);
  };

  const seriesHoy = (seriesGuardadas || []).filter(s => {
    if (s.ejercicio !== ejercicioActivo?.nombre) return false;
    if (!s.fechaAlta) return false;
    const d = new Date(s.fechaAlta);
    return !isNaN(d.getTime()) && d.toDateString() === new Date().toDateString();
  });

  const ejerciciosConFuerza = [...new Set((seriesGuardadas || []).map(s => s.ejercicio).filter(Boolean))];
  useEffect(() => { if (ejerciciosConFuerza.length > 0 && !ejercicioFuerzaSel) setEjercicioFuerzaSel(ejerciciosConFuerza[0]); }, [seriesGuardadas]);

  const datosFuerza = (seriesGuardadas || []).filter(s => s.ejercicio === ejercicioFuerzaSel).reduce((acc, s) => {
    const f = formatoFechaSegura(s.fechaAlta);
    const ex = acc.find(i => i.fecha === f);
    if (ex) { if (s.peso > ex.p) ex.p = s.peso; } else acc.push({ fecha: f, p: s.peso }); return acc;
  }, []);

  const datosDonut = (seriesGuardadas || []).reduce((acc, s) => {
    const cat = (catalogo || []).find(c => c.nombre === s.ejercicio)?.categoria || 'Otros';
    const ex = acc.find(i => i.name === cat); if (ex) ex.value += 1; else acc.push({ name: cat, value: 1 }); return acc;
  }, []);

  const datosConsistencia = (seriesGuardadas || []).reduce((acc, s) => {
    const f = formatoFechaSegura(s.fechaAlta);
    const ex = acc.find(i => i.f === f); if (ex) ex.s += 1; else acc.push({ f, s: 1 }); return acc;
  }, []).slice(-7);


  if (!usuario) return (
    <div style={{...estilos.contenedorPrincipal, justifyContent: 'center'}}>
      <div style={{backgroundColor:'#1e293b', padding:'40px 30px', borderRadius:'20px', textAlign:'center', width:'90%', maxWidth:'400px', border:'1px solid #334155'}}>
        <h1 style={estilos.tituloApp}>Jess-Gym ⚡</h1>
        <button onClick={() => signInWithPopup(auth, googleProvider)} style={estilos.botonMenu}>
          Entrar con Google
        </button>
      </div>
    </div>
  );

  return (
    <div style={estilos.contenedorPrincipal}>
      <h1 style={estilos.tituloApp}>Rutina Jess-Gym ⚡</h1>

      {/* PESTAÑAS PRINCIPALES (RECUPERADA LA BIBLIOTECA) */}
      <div style={estilos.menuPrincipal}>
        <button style={{...estilos.botonMenu, backgroundColor: vistaPrincipal === 'rutina' ? '#3b82f6' : 'transparent', color: vistaPrincipal === 'rutina' ? 'white' : '#94a3b8'}} onClick={() => setVistaPrincipal('rutina')}>🏋️‍♀️ RUTINA</button>
        <button style={{...estilos.botonMenu, backgroundColor: vistaPrincipal === 'biblioteca' ? '#3b82f6' : 'transparent', color: vistaPrincipal === 'biblioteca' ? 'white' : '#94a3b8'}} onClick={() => setVistaPrincipal('biblioteca')}>📚 BIBLIOTECA</button>
        <button style={{...estilos.botonMenu, backgroundColor: vistaPrincipal === 'progreso' ? '#3b82f6' : 'transparent', color: vistaPrincipal === 'progreso' ? 'white' : '#94a3b8'}} onClick={() => setVistaPrincipal('progreso')}>📈 PROGRESO</button>
      </div>

      {/* VISTA 1: RUTINA (Tu semana) */}
      {vistaPrincipal === 'rutina' && (
        <>
          <div style={estilos.contenedorTabs}>
            {diasSemana.map(dia => (
              <button key={dia} onClick={() => setDiaActual(dia)} style={{ ...estilos.botonTab, ...(diaActual === dia ? estilos.botonActivo : {}) }}>{dia}</button>
            ))}
          </div>

          <div style={estilos.scrollTabla}>
            <table style={estilos.tabla}>
              <thead style={{backgroundColor:'#020617'}}>
                <tr><th style={estilos.celdaEncabezado}>ORDEN</th><th style={estilos.celdaEncabezado}>EJERCICIO</th><th style={estilos.celdaEncabezado}>MÁQUINA</th><th style={estilos.celdaEncabezado}>LIBRE</th><th style={estilos.celdaEncabezado}>ACCIÓN</th></tr>
              </thead>
              <tbody>
                {(rutinas[diaActual] || []).map((ej, idx) => (
                  <tr key={ej.id || idx}>
                    <td style={estilos.celdaCuerpo}>
                      <button style={{color:'#60a5fa', background:'none', border:'none', fontSize:'18px', cursor:'pointer'}} onClick={() => moverEjercicio(idx, 'arriba')}>▲</button><br/>
                      <button style={{color:'#60a5fa', background:'none', border:'none', fontSize:'18px', cursor:'pointer'}} onClick={() => moverEjercicio(idx, 'abajo')}>▼</button>
                    </td>
                    <td style={{...estilos.celdaCuerpo, fontWeight:'bold', fontSize:'15px'}}>{ej.nombre} {(notasPorEjercicio || {})[ej.nombre] && '💡'}</td>
                    <td style={estilos.celdaCuerpo}>{ej.imgMaquina ? <img src={ej.imgMaquina} style={estilos.imagenEjercicio}/> : <div style={estilos.cajaImagenVacia}>Sin foto</div>}</td>
                    <td style={estilos.celdaCuerpo}>{ej.imgLibre ? <img src={ej.imgLibre} style={estilos.imagenEjercicio}/> : <div style={estilos.cajaImagenVacia}>Opcional</div>}</td>
                    <td style={estilos.celdaCuerpo}>
                      <button style={{padding:'10px 15px', backgroundColor:'#3b82f6', color:'white', border:'none', borderRadius:'8px', fontWeight:'bold', cursor:'pointer'}} onClick={() => { 
                        setEjercicioActivo(ej); setPesoActual(0); setTextoNotaActual((notasPorEjercicio || {})[ej?.nombre] || ''); 
                      }}>ENTRENAR</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* BOTONES GIGANTES DE AÑADIR */}
          <div style={estilos.zonaAñadir}>
             <div style={{flex:1, display:'flex', gap:'10px', minWidth:'250px'}}>
               <select style={{...estilos.inputRegistrar, marginBottom:0, flex:1}} value={ejercicioSeleccionadoCatalogo} onChange={e => setEjercicioSeleccionadoCatalogo(e.target.value)}>
                  <option value="">Añadir ejercicio a {diaActual}...</option>
                  {(catalogo || []).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
               </select>
               <button style={estilos.botonAñadirGrande} onClick={agregarAlDia}>+ Añadir</button>
             </div>
             <div style={{flex:1, display:'flex', gap:'10px', minWidth:'250px'}}>
               <select style={{...estilos.inputRegistrar, marginBottom:0, flex:1}} value={diaParaCopiar} onChange={e => setDiaParaCopiar(e.target.value)}>
                  <option value="">Copiar rutina de...</option>
                  {diasSemana.filter(d => d !== diaActual && (rutinas[d] || []).length > 0).map(d => <option key={d} value={d}>{d}</option>)}
               </select>
               <button style={{...estilos.botonAñadirGrande, backgroundColor:'#0f172a', color:'#94a3b8', border:'1px solid #334155'}} onClick={copiarRutina}>📋 Copiar</button>
             </div>
          </div>
        </>
      )}

      {/* VISTA 2: BIBLIOTECA (El Catálogo) */}
      {vistaPrincipal === 'biblioteca' && (
        <div style={{width:'100%', maxWidth:'850px'}}>
          <button onClick={() => setMostrarCreador(!mostrarCreador)} style={{...estilos.botonAñadirGrande, width:'100%', marginBottom:'20px'}}>
            {mostrarCreador ? "✖ CANCELAR" : "➕ CREAR NUEVO EJERCICIO"}
          </button>

          {mostrarCreador && (
            <div style={{...estilos.panelGrafico, marginBottom:'20px'}}>
              <h3 style={{color:'#e2e8f0', marginTop:0}}>Añadir al catálogo</h3>
              <input placeholder="Nombre del ejercicio (ej. Sentadilla Búlgara)" style={estilos.inputRegistrar} value={nuevoEj.nombre} onChange={e => setNuevoEj({...nuevoEj, nombre: e.target.value})} />
              <select style={estilos.inputRegistrar} value={nuevoEj.categoria} onChange={e => setNuevoEj({...nuevoEj, categoria: e.target.value})}>
                <option>Piernas</option><option>Glúteos</option><option>Espalda</option><option>Pecho</option><option>Hombros</option><option>Core</option>
              </select>
              <div style={{display:'flex', gap:'15px', marginBottom:'20px', backgroundColor:'#0f172a', padding:'15px', borderRadius:'10px'}}>
                <label style={{flex:1, fontSize:'12px', color:'#94a3b8', fontWeight:'bold'}}>📸 Foto Máquina / Referencia:<br/><input type="file" style={{marginTop:'10px'}} onChange={e => { const f = e.target.files[0]; if(f) setNuevoEj({...nuevoEj, imgM: URL.createObjectURL(f)}) }}/></label>
                <label style={{flex:1, fontSize:'12px', color:'#94a3b8', fontWeight:'bold'}}>📸 Foto Libre (Opcional):<br/><input type="file" style={{marginTop:'10px'}} onChange={e => { const f = e.target.files[0]; if(f) setNuevoEj({...nuevoEj, imgL: URL.createObjectURL(f)}) }}/></label>
              </div>
              <button style={{...estilos.botonActivo, width:'100%', padding:'15px', border:'none', borderRadius:'10px', fontWeight:'bold', fontSize:'16px'}} onClick={guardarEnCatalogo}>💾 GUARDAR EN BIBLIOTECA</button>
            </div>
          )}

          <h3 style={{color:'#60a5fa'}}>Tus Ejercicios Guardados ({catalogo.length})</h3>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(250px, 1fr))', gap:'15px'}}>
            {catalogo.map(ej => (
              <div key={ej.id} style={estilos.tarjetaBiblioteca}>
                {ej.imgMaquina ? <img src={ej.imgMaquina} style={{width:'50px', height:'50px', borderRadius:'8px', objectFit:'cover'}}/> : <div style={{width:'50px', height:'50px', backgroundColor:'#1e293b', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px'}}>🏋️</div>}
                <div>
                  <h4 style={{margin:0, color:'#e2e8f0', fontSize:'15px'}}>{ej.nombre}</h4>
                  <span style={{color:'#94a3b8', fontSize:'12px', backgroundColor:'#1e293b', padding:'3px 8px', borderRadius:'10px', marginTop:'5px', display:'inline-block'}}>{ej.categoria}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PANEL DE ENTRENAMIENTO EN VIVO */}
      {ejercicioActivo && (
        <div style={estilos.panelEntrenamiento}>
          <h3 style={{backgroundColor:'#3b82f6', margin:0, padding:'20px', textAlign:'center', color:'white', fontWeight:'bold', fontSize:'20px'}}>REGISTRANDO: {ejercicioActivo?.nombre}</h3>
          <div style={{display:'flex', backgroundColor:'#0f172a'}}>
            <button onClick={() => setModalidadActual('Máquina')} style={{flex:1, padding:'15px', border:'none', backgroundColor: modalidadActual==='Máquina'?'#3b82f6':'transparent', color:'white', fontWeight:'bold', fontSize:'16px'}}>⚙️ Máquina</button>
            <button onClick={() => setModalidadActual('Libre')} style={{flex:1, padding:'15px', border:'none', backgroundColor: modalidadActual==='Libre'?'#3b82f6':'transparent', color:'white', fontWeight:'bold', fontSize:'16px'}}>🏋️‍♀️ Libre</button>
          </div>
          <div style={{padding: '25px'}}>
            {(notasPorEjercicio || {})[ejercicioActivo?.nombre] && <div style={{backgroundColor:'rgba(234,179,8,0.1)', padding:'15px', borderRadius:'10px', color:'#fde047', fontSize:'14px', marginBottom:'20px', borderLeft:'4px solid #eab308'}}>💡 <strong>Nota de la última vez:</strong> {(notasPorEjercicio || {})[ejercicioActivo.nombre]}</div>}
            
            <div style={{display:'flex', gap:'20px', flexWrap:'wrap'}}>
                <div style={{flex:1.2, textAlign:'center', minWidth:'180px'}}>
                    <div style={{fontSize:'42px', fontWeight:'bold', color:'#60a5fa', marginBottom:'10px'}}>{pesoActual} <span style={{fontSize:'18px', color:'#94a3b8'}}>kg</span></div>
                    <div style={estilos.gridDiscos}>
                        {[1.25, 2.5, 5, 10, 20].map(p => <button key={p} style={estilos.botonDiscoMini} onClick={() => setPesoActual(parseFloat((pesoActual + p).toFixed(2)))}>+{p}</button>)}
                        <button style={estilos.botonResetMini} onClick={() => setPesoActual(0)}>BORRAR</button>
                    </div>
                </div>
                <div style={{flex:1, minWidth:'180px'}}>
                    <label style={{fontSize:'12px', color:'#94a3b8', fontWeight:'bold'}}>REPETICIONES:</label>
                    <select style={{...estilos.inputRegistrar, fontSize:'16px', padding:'15px'}} value={repsActuales} onChange={e => setRepsActuales(e.target.value)}>
                        {[...Array(20).keys()].map(i => <option key={i+1}>{i+1}</option>)}<option>Fallo</option>
                    </select>
                    <label style={{fontSize:'12px', color:'#94a3b8', fontWeight:'bold'}}>DESCANSO:</label>
                    <select style={{...estilos.inputRegistrar, fontSize:'16px', padding:'15px'}} value={descansoActual} onChange={e => setDescansoActual(e.target.value)}>
                        {opcionesDescanso.map(o => <option key={o.valor} value={o.valor}>{o.texto}</option>)}
                    </select>
                    <button style={{...estilos.botonActivo, width:'100%', padding:'18px', border:'none', borderRadius:'12px', fontWeight:'bold', fontSize:'18px', marginTop:'10px'}} onClick={guardarSerie}>AÑADIR SERIE</button>
                </div>
            </div>

            {seriesHoy.length > 0 && (
                <div style={{marginTop:'25px', backgroundColor:'#0f172a', borderRadius:'12px', padding:'15px'}}>
                    <h4 style={{margin:'0 0 10px 0', color:'#e2e8f0', textAlign:'center'}}>Series de Hoy</h4>
                    <table style={{width:'100%', fontSize:'14px', textAlign:'center'}}>
                        <thead style={{color:'#475569', borderBottom:'1px solid #1e293b'}}><tr><th style={{paddingBottom:'8px'}}>#</th><th>PESO</th><th>REPS</th><th></th></tr></thead>
                        <tbody>{seriesHoy.map((s, i) => (<tr key={s.id || i} style={{borderBottom:'1px solid #1e293b'}}><td style={{color:'#10b981', padding:'12px 0', fontWeight:'bold'}}>Serie {i+1}</td><td style={{fontWeight:'bold'}}>{s.peso} kg</td><td>{s.reps}</td><td><button onClick={() => eliminarSerie(s.id)} style={{background:'none', border:'none', color:'#ef4444', fontSize:'20px', cursor:'pointer'}}>✖</button></td></tr>))}</tbody>
                    </table>
                </div>
            )}
            
            <label style={{fontSize:'12px', color:'#94a3b8', fontWeight:'bold', display:'block', marginTop:'25px'}}>NOTA PARA EL FUTURO:</label>
            <textarea style={{...estilos.inputRegistrar, minHeight:'80px', fontSize:'14px'}} value={textoNotaActual} onChange={e => setTextoNotaActual(e.target.value)} placeholder="Ej: Me costó la última serie, no subir peso aún..." />
            
            <button style={{width:'100%', padding:'18px', backgroundColor:'#10b981', color:'white', border:'none', borderRadius:'12px', fontWeight:'bold', fontSize:'16px', marginTop:'10px', cursor:'pointer'}} onClick={finalizarEjercicio}>✅ GUARDAR TODO Y CERRAR</button>
          </div>
        </div>
      )}

      {/* VISTA 3: PROGRESO */}
      {vistaPrincipal === 'progreso' && (
        <div style={estilos.gridGraficos}>
           <div style={{...estilos.panelGrafico, gridColumn:'1/-1'}}>
              <h4 style={{margin:0, color:'#60a5fa', fontSize:'16px'}}>PESO CORPORAL (Meta: {metaPeso}kg)</h4>
              <div style={{width:'100%', height:220, marginTop:'15px'}}>
                <ResponsiveContainer><LineChart data={historialPeso.map(p => ({ f: formatoFechaSegura(p.fecha), p: p.peso }))}><XAxis dataKey="f" stroke="#475569" fontSize={12}/><YAxis stroke="#475569" fontSize={12} domain={['dataMin-2','dataMax+2']}/><Tooltip contentStyle={{backgroundColor:'#0f172a', borderRadius:'8px' }}/><Line type="monotone" dataKey="p" stroke="#3b82f6" strokeWidth={4} dot={{r:5, fill:'#3b82f6'}}/></LineChart></ResponsiveContainer>
              </div>
              <div style={{display:'flex', gap:'10px', marginTop:'20px', backgroundColor:'#0f172a', padding:'15px', borderRadius:'12px'}}>
                <input type="number" placeholder="Registrar nuevo peso" style={{...estilos.inputRegistrar, marginBottom:0, flex:1}} onChange={e => setInputPesoActual(e.target.value)} value={inputPesoActual} />
                <button onClick={async () => {
                   if(!inputPesoActual) return;
                   const n = { userId: usuario.uid, peso: parseFloat(inputPesoActual), fecha: new Date().toISOString(), esObjetivo: false };
                   await addDoc(collection(db, "pesoCorporal"), n); setHistorialPeso([...historialPeso, n]); setInputPesoActual('');
                }} style={{...estilos.botonActivo, padding:'0 25px', border:'none', borderRadius:'8px', fontWeight:'bold'}}>GUARDAR</button>
              </div>
           </div>
           
           <div style={estilos.panelGrafico}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
                <h4 style={{margin:0, color:'#f59e0b', fontSize:'14px'}}>RÉCORD FUERZA</h4>
                <select style={{...estilos.inputRegistrar, fontSize:'12px', padding:'5px', width:'auto', marginBottom:0}} value={ejercicioFuerzaSel} onChange={e => setEjercicioFuerzaSel(e.target.value)}>
                   {ejerciciosConFuerza.length === 0 ? <option>Añade series</option> : ejerciciosConFuerza.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div style={{width:'100%', height:180}}>
                <ResponsiveContainer><LineChart data={datosFuerza}><XAxis dataKey="fecha" stroke="#475569" fontSize={12}/><Tooltip contentStyle={{backgroundColor:'#0f172a' }}/><Line type="stepAfter" dataKey="p" stroke="#f59e0b" strokeWidth={3} dot={{r:4}}/></LineChart></ResponsiveContainer>
              </div>
           </div>

           <div style={estilos.panelGrafico}>
              <h4 style={{margin:'0 0 15px 0', color:'#8b5cf6', fontSize:'14px'}}>MÚSCULOS TRABAJADOS</h4>
              <div style={{width:'100%', height:180}}>
                <ResponsiveContainer><PieChart><Pie data={datosDonut} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={5}>{datosDonut.map((e,i)=><Cell key={i} fill={COLORES_DONUT[i%COLORES_DONUT.length]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer>
              </div>
           </div>

           <div style={estilos.panelGrafico}>
              <h4 style={{margin:'0 0 15px 0', color:'#10b981', fontSize:'14px'}}>CONSTANCIA (SERIES/DÍA)</h4>
              <div style={{width:'100%', height:180}}>
                <ResponsiveContainer><BarChart data={datosConsistencia}><XAxis dataKey="f" stroke="#475569" fontSize={12}/><Tooltip contentStyle={{backgroundColor:'#0f172a' }}/><Bar dataKey="s" fill="#10b981" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

export default App;