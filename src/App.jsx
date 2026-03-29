import { useState, useEffect } from 'react';
import { db, auth, googleProvider } from './firebase'; 
import { collection, addDoc, getDocs, query, where, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'; // 👈 Añadido signOut
import Progreso from './components/Progreso';
import Biblioteca from './components/Biblioteca';
import Rutina from './components/Rutina';
import RegistrarEntrenamiento from './components/RegistrarEntrenamiento';

// --- CONFIGURACIÓN: EL STARTER PACK DE JESS-GYM ---
const rutinasIniciales = { Lunes: [], Martes: [], Miércoles: [], Jueves: [], Viernes: [], Sábado: [], Domingo: [] };

const catalogoInicial = [
  // 🦵 PIERNAS Y GLÚTEOS (Fuerza) - Fíjate que les he puesto un / al principio de la ruta
  { id: 'c1', nombre: 'Sentadillas', categoria: 'Piernas', tipoMedicion: 'Fuerza', imgMaquina: '/ejercicios/sentadilla-maquina.gif', imgLibre: '/ejercicios/sentadilla-libre.gif'},
  { id: 'c2', nombre: 'Prensa de Piernas', categoria: 'Piernas', tipoMedicion: 'Fuerza', imgMaquina: '/ejercicios/prensa-piernas-maquina.gif', imgLibre: null },
  { id: 'c3', nombre: 'Hip Thrust', categoria: 'Glúteos', tipoMedicion: 'Fuerza', imgMaquina: '/ejercicios/hip-trust-maquina.gif', imgLibre: '/ejercicios/hip-trust-libre.gif' },
  { id: 'c4', nombre: 'Peso Muerto Rumano', categoria: 'Glúteos', tipoMedicion: 'Fuerza', imgMaquina: '/ejercicios/peso-muerto-maquina.gif', imgLibre: '/ejercicios/peso-muerto-libre.gif' },
  
  // 🔙 TREN SUPERIOR (Fuerza)
  { id: 'c5', nombre: 'Jalón al pecho', categoria: 'Espalda', tipoMedicion: 'Fuerza', imgMaquina: '/ejercicios/jalon-pecho-maquina.webp', imgLibre: '/ejercicios/jalon-pecho-libre.gif' },
  { id: 'c6', nombre: 'Press de Banca', categoria: 'Pecho', tipoMedicion: 'Fuerza', imgMaquina: '/ejercicios/pressbanca-maquina.gif', imgLibre: '/ejercicios/press-banca-libre.gif' },
  { id: 'c7', nombre: 'Curl de Bíceps', categoria: 'Brazos', tipoMedicion: 'Fuerza', imgMaquina: '/ejercicios/curl-biceps-maquina.gif', imgLibre: '/ejercicios/curl-biceps-libre.gif' },
  
  // 🏃‍♀️ CARDIO (Camaleón Cardio)
  { id: 'c8', nombre: 'Cinta de correr', categoria: 'Cardio', tipoMedicion: 'Cardio', imgMaquina: '/ejercicios/cinta-correr-maquina.gif', imgLibre: null },
  { id: 'c9', nombre: 'Bicicleta Estática', categoria: 'Cardio', tipoMedicion: 'Cardio', imgMaquina: '/ejercicios/bicicleta-estatica-maquina.gif', imgLibre: null },
  
  // 🧘‍♀️ CORE / ABDOMEN (Camaleón Peso Corporal)
  { id: 'c10', nombre: 'Plancha (Plank)', categoria: 'Core', tipoMedicion: 'Peso Corporal', imgMaquina: null, imgLibre: '/ejercicios/plancha-libre.gif'},
  { id: 'c11', nombre: 'Crunches (Abdomen)', categoria: 'Core', tipoMedicion: 'Peso Corporal', imgMaquina: null, imgLibre: '/ejercicios/crunches-libre.gif' }
];
const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const estilos = {
  contenedorPrincipal: { backgroundColor: '#0f172a', color: '#e2e8f0', minHeight: '100vh', padding: '15px', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: '100px', boxSizing: 'border-box' },
  tituloApp: { color: '#60a5fa', fontSize: '35px', fontWeight: 'bold', margin: '15px 0', textAlign: 'center', textShadow: '0 0 10px rgba(96, 165, 250, 0.3)' },
  mensajeAppTitulo: { color: '#60a5fa', fontSize: '20px', fontWeight: 'bold', margin: '15px 0', textAlign: 'center', textShadow: '0 0 10px rgba(96, 165, 250, 0.3)' },
  menuPrincipal: { display: 'flex', gap: '8px', marginBottom: '25px', backgroundColor: '#1e293b', padding: '8px', borderRadius: '15px', border: '1px solid #334155', width: '100%', maxWidth: '500px' },
  botonMenu: { flex: 1, padding: '12px 5px', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' },
  botonActivo: { backgroundColor: '#3b82f6', color: 'white', boxShadow: '0 4px 10px rgba(59, 130, 246, 0.4)' },
  contenedorTabs: { display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', justifyContent: 'center', width: '100%' },
  botonTab: { padding: '10px 15px', cursor: 'pointer', backgroundColor: '#1e293b', color: '#cbd5e1', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px' },
  scrollTabla: { width: '100%', maxWidth: '850px', overflowX: 'auto', borderRadius: '12px', backgroundColor: '#1e293b', border: '1px solid #334155', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)' },
  tabla: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
  celdaEncabezado: { padding: '15px 10px', textAlign: 'center', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', borderBottom: '2px solid #334155' },
  celdaCuerpo: { padding: '12px 10px', textAlign: 'center', borderBottom: '1px solid #334155', verticalAlign: 'middle' },
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
  const [vistaPrincipal, setVistaPrincipal] = useState('rutina');
  const [rutinas, setRutinas] = useState(rutinasIniciales);
  const [catalogo, setCatalogo] = useState(catalogoInicial);
  const [cargandoPerfil, setCargandoPerfil] = useState(true);
  const [historialPeso, setHistorialPeso] = useState([]);
  const [metaPeso, setMetaPeso] = useState(null);
  const [diaActual, setDiaActual] = useState('Lunes');
  const [seriesGuardadas, setSeriesGuardadas] = useState([]);
  const [notasPorEjercicio, setNotasPorEjercicio] = useState({});
  const [ejercicioActivo, setEjercicioActivo] = useState(null);
  const [segundos, setSegundos] = useState(0);

  // 💎 NUEVOS ESTADOS PARA EL APODO 💎
  const [apodo, setApodo] = useState('');
  const [editandoApodo, setEditandoApodo] = useState(false);
  const [inputApodo, setInputApodo] = useState('');

  // ⏱️ Motor del cronómetro
  useEffect(() => {
    let timer;
    if (segundos > 0) {
      timer = setInterval(() => {
        setSegundos(prev => prev - 1);
      }, 1000);
    } else if (segundos === 0 && timer) {
      clearInterval(timer);
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }
    return () => clearInterval(timer);
  }, [segundos]);
  
  // Estados de formularios
  const [mostrarCreador, setMostrarCreador] = useState(false);
  const [nuevoEj, setNuevoEj] = useState({ nombre: '', categoria: 'Piernas', imgM: null, imgL: null, tipoMedicion: 'Fuerza' });
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
          if (d.apodo) setApodo(d.apodo); // 👈 Cargamos el apodo
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

  // 💎 FUNCIONES DE PERFIL Y SESIÓN 💎
  const guardarApodo = async () => {
    if (!inputApodo.trim()) return;
    setApodo(inputApodo);
    setEditandoApodo(false);
    try {
      await setDoc(doc(db, "perfiles", usuario.uid), { apodo: inputApodo }, { merge: true });
    } catch (error) { console.error("Error al guardar apodo:", error); }
  };

  const cerrarSesion = () => {
    if (window.confirm("¿Seguro que quieres cerrar sesión?")) {
      signOut(auth);
    }
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
    let nuevaRutinaDelDia = [];
    if ((rutinas[diaActual] || []).length > 0) {
      const reemplazar = window.confirm(`El ${diaActual} ya tiene ejercicios. ¿Quieres BORRARLOS y poner la rutina del ${diaParaCopiar}? \n\n▶ Aceptar = Reemplazar\n▶ Cancelar = Sumar a los que ya hay`);
      if (reemplazar) {
        nuevaRutinaDelDia = copia;
      } else {
        nuevaRutinaDelDia = [...(rutinas[diaActual] || []), ...copia];
      }
    } else {
      nuevaRutinaDelDia = copia; 
    }
    const nr = { ...rutinas, [diaActual]: nuevaRutinaDelDia };
    setRutinas(nr); 
    syncPerfil(nr, catalogo); 
    setDiaParaCopiar(''); 
  };

  const vaciarDia = () => {
    if (!window.confirm(`¿Seguro que quieres borrar TODOS los ejercicios del ${diaActual}?`)) return;
    const nr = { ...rutinas, [diaActual]: [] };
    setRutinas(nr);
    syncPerfil(nr, catalogo);
  };

  const moverEjercicio = (idx, dir) => {
    const arr = [...(rutinas[diaActual] || [])];
    if (dir === 'arriba' && idx > 0) [arr[idx-1], arr[idx]] = [arr[idx], arr[idx-1]];
    else if (dir === 'abajo' && idx < arr.length - 1) [arr[idx+1], arr[idx]] = [arr[idx], arr[idx+1]];
    const nr = { ...rutinas, [diaActual]: arr }; setRutinas(nr); syncPerfil(nr, catalogo);
  };

  const guardarEnCatalogo = (ejercicioFinal) => {
    if (!ejercicioFinal || !ejercicioFinal.nombre) return;
    let nuevoCatalogo;
    if (ejercicioFinal.id) {
      nuevoCatalogo = catalogo.map(ejViejo => ejViejo.id === ejercicioFinal.id ? ejercicioFinal : ejViejo);
    } else {
      nuevoCatalogo = [...(catalogo || []), { ...ejercicioFinal, id: Date.now().toString() }];
    }
    setCatalogo(nuevoCatalogo); 
    syncPerfil(rutinas, nuevoCatalogo);
    setNuevoEj({ nombre: '', categoria: 'Piernas', imgM: null, imgL: null, tipoMedicion: 'Fuerza' }); 
    setMostrarCreador(false);
  };

  const guardarSerie = async (datosPersonalizados = null) => {
    if (!ejercicioActivo) return;
    const esEventoRatón = datosPersonalizados && datosPersonalizados.nativeEvent;
    const datosFinales = (datosPersonalizados && !esEventoRatón) ? datosPersonalizados : {
      peso: pesoActual,
      reps: repsActuales,
      descanso: descansoActual,
      modalidad: modalidadActual,
      fechaPersonalizada: new Date().toISOString().split('T')[0]
    };
    const fechaParaGuardar = datosFinales.fechaPersonalizada 
      ? `${datosFinales.fechaPersonalizada}T12:00:00.000Z` 
      : new Date().toISOString();

    const n = { 
      ejercicio: ejercicioActivo.nombre, 
      peso: datosFinales.peso,
      reps: datosFinales.reps,
      descanso: datosFinales.descanso,
      modalidad: datosFinales.modalidad,
      inclinacion: datosFinales.inclinacion || null,
      fechaAlta: fechaParaGuardar, 
      userId: usuario.uid 
    };

    try {
      const docRef = await addDoc(collection(db, "series"), n);
      setSeriesGuardadas([...seriesGuardadas, { id: docRef.id, ...n }]);
      if (datosFinales.descanso > 0) {
        setSegundos(parseInt(datosFinales.descanso)); 
      }
    } catch(e) {
      console.error("Error al guardar:", e);
    }
  };

  const eliminarSerie = async (idSerie) => {
    if (!window.confirm("¿Seguro que quieres borrar este registro?")) return;
    try {
      await deleteDoc(doc(db, "series", idSerie));
      setSeriesGuardadas(seriesGuardadas.filter(s => s.id !== idSerie));
    } catch (error) {
      console.error("Error al borrar la serie:", error);
    }
  };

  const eliminarDelCatalogo = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar este ejercicio de tu biblioteca?")) return;
    const nuevoCatalogo = catalogo.filter(ej => ej.id !== id);
    setCatalogo(nuevoCatalogo);
    await syncPerfil(rutinas, nuevoCatalogo, notasPorEjercicio);
  };

  const eliminarDeRutina = async (dia, idEjercicioAGuitar) => {
    if (!window.confirm("¿Seguro que quieres quitar este ejercicio de la rutina de hoy?")) return;
    const nuevosEjerciciosDia = (rutinas[dia] || []).filter(ej => ej.id !== idEjercicioAGuitar);
    const nuevasRutinas = { ...rutinas, [dia]: nuevosEjerciciosDia };
    setRutinas(nuevasRutinas);
    await syncPerfil(nuevasRutinas, catalogo, notasPorEjercicio);
  };

  const prepararEdicion = (ejercicio) => {
    setNuevoEj(ejercicio); 
    setMostrarCreador(true); 
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

  const datosFuerzaTemp = (seriesGuardadas || [])
    .filter(s => s.ejercicio === ejercicioFuerzaSel)
    .reduce((acc, s) => {
      const dayIso = new Date(s.fechaAlta).toISOString().split('T')[0];
      const ex = acc.find(i => i.day === dayIso);
      if (ex) { if (s.peso > ex.p) ex.p = s.peso; } 
      else acc.push({ day: dayIso, p: s.peso }); return acc;
    }, []);

  const datosFuerza = datosFuerzaTemp
    .sort((a,b) => new Date(a.day) - new Date(b.day))
    .map(i => ({ 
      fecha: i.day, 
      p: i.p 
    }));

  const datosConsistencia = [...(seriesGuardadas || [])]
    .sort((a, b) => new Date(a.fechaAlta) - new Date(b.fechaAlta))
    .reduce((acc, s) => {
      const f = formatoFechaSegura(s.fechaAlta);
      const ex = acc.find(i => i.f === f); 
      if (ex) ex.s += 1; 
      else acc.push({ f, s: 1 }); 
      return acc;
    }, [])
    .slice(-7);

  const datosPesoGrafico = (historialPeso || []) 
    .filter(s => s.esObjetivo === false) 
    .reduce((acc, s) => {
        const fechaCruda = s.fecha || s.fechaAlta || new Date().toISOString();
        const dayIso = new Date(fechaCruda).toISOString().split('T')[0];
        const ex = acc.find(i => i.day === dayIso);
        if (ex) { if (s.peso > ex.p) ex.p = s.peso; } 
        else acc.push({ day: dayIso, p: s.peso }); return acc;
    }, [])
    .sort((a,b) => new Date(a.day) - new Date(b.day))
    .map(i => ({ 
        fecha: i.day, 
        peso: i.p 
    }));

  const eliminarRegistroPeso = async (idRegistro) => {
    if (!window.confirm("¿Seguro que quieres borrar este registro de peso?")) return;
    try {
      await deleteDoc(doc(db, "pesoCorporal", idRegistro));
      setHistorialPeso(historialPeso.filter(p => p.id !== idRegistro));
    } catch (error) {
      console.error("Error al borrar peso:", error);
    }
  };

  const datosDonut = (seriesGuardadas || []).reduce((acc, s) => {
    const cat = (catalogo || []).find(c => c.nombre === s.ejercicio)?.categoria || 'Otros';
    const ex = acc.find(i => i.name === cat); if (ex) ex.value += 1; else acc.push({ name: cat, value: 1 }); return acc;
  }, []);

  // 💎 PANTALLA DE INICIO (LOG IN) CON EL LOGO 💎
  if (!usuario) return (
    <div style={{...estilos.contenedorPrincipal, justifyContent: 'center'}}>
              

      <div style={{backgroundColor:'#1e293b', padding:'40px 30px', borderRadius:'20px', textAlign:'center', width:'90%', maxWidth:'400px', border:'1px solid #334155'}}>
        {/* LA IMAGEN: Para que funcione, tienes que tener un archivo llamado "logo.png" (en minúsculas) 
            dentro de la carpeta "public" de tu proyecto */}
            <h1 style={estilos.tituloApp}> ⚡Jess-Gym-App ⚡</h1>
        <img 
            src="logo.png" 
            alt="Si ves esto, es que te falta subir el archivo logo.png a la carpeta public" 
            style={{width: '220px', height: '220px', borderRadius: '30px', marginBottom: '30px', objectFit: 'cover'}} 
        />
        <h6 style={estilos.mensajeAppTitulo}>¿List@ para entrenar?</h6> 
        <button onClick={() => signInWithPopup(auth, googleProvider)} style={{...estilos.botonActivo, width: '100%', padding: '15px', borderRadius: '12px', fontSize: '20px', fontWeight: 'bold', marginTop: '10px'}}>
          Entrar con Google
        </button>
      </div>
    </div>
  );

  return (
    <div style={estilos.contenedorPrincipal}>

      {/* 💎 BARRA SUPERIOR DE PERFIL (FOTO, NOMBRE Y CERRAR SESIÓN) 💎 */}
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '1000px', marginBottom: '15px', backgroundColor: '#1e293b', padding: '12px 20px', borderRadius: '15px', border: '1px solid #334155', boxSizing: 'border-box'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
          <img src={usuario.photoURL || 'https://via.placeholder.com/45'} alt="Perfil" style={{width: '45px', height: '45px', borderRadius: '50%', border: '2px solid #3b82f6'}} />
          
          {editandoApodo ? (
            <div style={{display: 'flex', gap: '8px'}}>
              <input 
                value={inputApodo} 
                onChange={e => setInputApodo(e.target.value)} 
                style={{...estilos.inputRegistrar, marginBottom: 0, padding: '8px 12px', width: '140px', fontSize: '14px'}} 
                autoFocus 
                placeholder="Tu apodo..." 
              />
              <button onClick={guardarApodo} style={{background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', padding: '0 15px', fontWeight: 'bold', cursor: 'pointer'}}>✓</button>
            </div>
          ) : (
            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
              <span style={{fontWeight: 'bold', color: 'white', fontSize: '18px'}}>{apodo || usuario.displayName?.split(' ')[0] || 'Atleta'}</span>
              <button 
                onClick={() => {setInputApodo(apodo || usuario.displayName?.split(' ')[0] || ''); setEditandoApodo(true);}} 
                style={{background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '16px'}} 
                title="Editar nombre"
              >✏️</button>
            </div>
          )}
        </div>
        
        <button onClick={cerrarSesion} style={{background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', padding: '10px 15px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px'}}>
          Salir
        </button>
      </div>

      <h1 style={estilos.tituloApp}>Jess-Gym</h1>


      <div style={estilos.menuPrincipal}>
        <button style={{...estilos.botonMenu, backgroundColor: vistaPrincipal === 'rutina' ? '#3b82f6' : 'transparent', color: vistaPrincipal === 'rutina' ? 'white' : '#94a3b8'}} onClick={() => setVistaPrincipal('rutina')}>🏋️‍♀️ RUTINA</button>
        <button style={{...estilos.botonMenu, backgroundColor: vistaPrincipal === 'biblioteca' ? '#3b82f6' : 'transparent', color: vistaPrincipal === 'biblioteca' ? 'white' : '#94a3b8'}} onClick={() => setVistaPrincipal('biblioteca')}>📚 BIBLIOTECA</button>
        <button style={{...estilos.botonMenu, backgroundColor: vistaPrincipal === 'progreso' ? '#3b82f6' : 'transparent', color: vistaPrincipal === 'progreso' ? 'white' : '#94a3b8'}} onClick={() => setVistaPrincipal('progreso')}>📈 PROGRESO</button>
      </div>

      {vistaPrincipal === 'rutina' && (
        <Rutina
          diasSemana={diasSemana}
          diaActual={diaActual}
          setDiaActual={setDiaActual}
          rutinas={rutinas}
          moverEjercicio={moverEjercicio}
          notasPorEjercicio={notasPorEjercicio}
          setEjercicioActivo={setEjercicioActivo}
          setPesoActual={setPesoActual}
          setTextoNotaActual={setTextoNotaActual}
          ejercicioSeleccionadoCatalogo={ejercicioSeleccionadoCatalogo}
          setEjercicioSeleccionadoCatalogo={setEjercicioSeleccionadoCatalogo}
          catalogo={catalogo}
          agregarAlDia={agregarAlDia}
          diaParaCopiar={diaParaCopiar}
          setDiaParaCopiar={setDiaParaCopiar}
          copiarRutina={copiarRutina}
          estilos={estilos}
          eliminarDeRutina={eliminarDeRutina}
          vaciarDia={vaciarDia}
        />
      )}

      {vistaPrincipal === 'biblioteca' && (
        <Biblioteca
          mostrarCreador={mostrarCreador}
          setMostrarCreador={setMostrarCreador}
          nuevoEj={nuevoEj}
          setNuevoEj={setNuevoEj}
          guardarEnCatalogo={guardarEnCatalogo}
          catalogo={catalogo}
          estilos={estilos}
          eliminarDelCatalogo={eliminarDelCatalogo}
          prepararEdicion={prepararEdicion}
        />   
      )}

      {ejercicioActivo && (
        <RegistrarEntrenamiento 
          ejercicio={ejercicioActivo}
          peso={pesoActual}
          setPeso={setPesoActual}
          onGuardar={guardarSerie}
          onCerrar={finalizarEjercicio}
          estilos={estilos}
          modalidadActual={modalidadActual}
          setModalidadActual={setModalidadActual}
          repsActuales={repsActuales}
          setRepsActuales={setRepsActuales}
          descansoActual={descansoActual}
          setDescansoActual={setDescansoActual}
          opcionesDescanso={opcionesDescanso}
          seriesHoy={seriesHoy}
          eliminarSerie={eliminarSerie}
          textoNotaActual={textoNotaActual}
          setTextoNotaActual={setTextoNotaActual}
          segundos={segundos}
          notasPorEjercicio={notasPorEjercicio}
          seriesDelEjercicio={seriesGuardadas.filter(s => s.ejercicio === ejercicioActivo?.nombre)}
        />
      )}

      {vistaPrincipal === 'progreso' && (
        <Progreso
          historialPeso={datosPesoGrafico} 
          pesoCorporalData={historialPeso} 
          metaPeso={metaPeso}
          inputPesoActual={inputPesoActual}
          setInputPesoActual={setInputPesoActual}
          usuario={usuario}
          setHistorialPeso={setHistorialPeso}
          ejercicioFuerzaSel={ejercicioFuerzaSel}
          setEjercicioFuerzaSel={setEjercicioFuerzaSel}
          ejerciciosConFuerza={ejerciciosConFuerza}
          datosFuerza={datosFuerza}
          datosDonut={datosDonut}
          datosConsistencia={datosConsistencia}
          estilos={estilos}
          formatoFechaSegura={formatoFechaSegura}
          COLORES_DONUT={COLORES_DONUT}
          seriesGuardadas={seriesGuardadas}
          eliminarRegistroPeso={eliminarRegistroPeso}
        />
      )}

      {segundos > 0 && (
        <div 
          style={{
            position: 'fixed', bottom: '100px', right: '20px', width: '65px', height: '65px',
            backgroundColor: segundos < 10 ? '#ef4444' : '#3b82f6', borderRadius: '50%', 
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
            color: 'white', boxShadow: '0 4px 15px rgba(0,0,0,0.5)', zIndex: 9999, border: '3px solid white'
          }} 
          onClick={() => setSegundos(0)} 
        >
          <span style={{ fontSize: '22px', fontWeight: 'bold' }}>{segundos}</span>
          <span style={{ fontSize: '10px' }}>DESC</span>
        </div>
      )}

    </div>
  );
}
export default App;