// --- src/components/RegistrarEntrenamiento.jsx ---
import { useState } from 'react';

export default function RegistrarEntrenamiento({
  ejercicio, peso, setPeso, onGuardar, onCerrar, estilos,
  modalidadActual, setModalidadActual, repsActuales, setRepsActuales,
  descansoActual, setDescansoActual, opcionesDescanso,
  seriesDelEjercicio, eliminarSerie, textoNotaActual, setTextoNotaActual, // 👈 Ahora recibimos TODAS las del ejercicio
  segundos, notasPorEjercicio 
}) {
  const tipo = ejercicio?.tipoMedicion || 'Fuerza';

  const hoyStr = new Date().toISOString().split('T')[0];
  const [fechaRegistro, setFechaRegistro] = useState(hoyStr);

  const [tiempoCardio, setTiempoCardio] = useState('30');
  const [velocidadCardio, setVelocidadCardio] = useState('5.0');
  const [inclinacionCardio, setInclinacionCardio] = useState('0');
  const [repsCorporal, setRepsCorporal] = useState('15');

  // 🧠 MAGIA DE FILTRADO: Mostramos en la tabla SOLO las series de la fecha que has elegido arriba
  const seriesMostradas = (seriesDelEjercicio || []).filter(s => s.fechaAlta && s.fechaAlta.startsWith(fechaRegistro));

  const manejarAñadirSerie = () => {
    if (tipo === 'Cardio') {
      onGuardar({
        peso: parseFloat(velocidadCardio) || 0, 
        reps: `${tiempoCardio} min`,
        descanso: 0, 
        inclinacion: inclinacionCardio, 
        modalidad: 'Cardio',
        fechaPersonalizada: fechaRegistro 
      });
    } else if (tipo === 'Peso Corporal') {
      onGuardar({
        peso: 0, 
        reps: repsCorporal,
        descanso: descansoActual, 
        modalidad: modalidadActual,
        fechaPersonalizada: fechaRegistro 
      });
    } else {
      onGuardar({
        peso: peso,
        reps: repsActuales,
        descanso: descansoActual,
        modalidad: modalidadActual,
        fechaPersonalizada: fechaRegistro 
      }); 
    }
  };

  return (
    <div style={estilos.panelEntrenamiento}>
      <h3 style={{backgroundColor:'#3b82f6', margin:0, padding:'20px', textAlign:'center', color:'white', fontWeight:'bold', fontSize:'20px'}}>
        REGISTRANDO: {ejercicio?.nombre}
      </h3>
      
      {tipo !== 'Cardio' && (
        <div style={{display:'flex', backgroundColor:'#0f172a'}}>
          <button onClick={() => setModalidadActual('Máquina')} style={{flex:1, padding:'15px', border:'none', backgroundColor: modalidadActual==='Máquina'?'#3b82f6':'transparent', color:'white', fontWeight:'bold', fontSize:'16px'}}>⚙️ En Máquina</button>
          <button onClick={() => setModalidadActual('Libre')} style={{flex:1, padding:'15px', border:'none', backgroundColor: modalidadActual==='Libre'?'#3b82f6':'transparent', color:'white', fontWeight:'bold', fontSize:'16px'}}>🏋️‍♀️ Libre</button>
        </div>
      )}

      <div style={{padding: '25px'}}>
        
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '20px', backgroundColor: '#1e293b', padding: '10px', borderRadius: '10px', border: '1px solid #334155'}}>
            <label style={{color: '#94a3b8', fontSize: '14px', fontWeight: 'bold'}}>📅 Fecha del entrenamiento:</label>
            <input 
                type="date" 
                value={fechaRegistro} 
                onChange={e => setFechaRegistro(e.target.value)}
                style={{backgroundColor: '#0f172a', color: 'white', border: '1px solid #3b82f6', borderRadius: '8px', padding: '5px 10px', fontSize: '14px', colorScheme: 'dark'}}
            />
        </div>
        
        {(notasPorEjercicio || {})[ejercicio?.nombre] && (
          <div style={{backgroundColor:'rgba(234,179,8,0.1)', padding:'15px', borderRadius:'10px', color:'#fde047', fontSize:'14px', marginBottom:'20px', borderLeft:'4px solid #eab308'}}>
            💡 <strong>Nota de la última vez:</strong> {(notasPorEjercicio || {})[ejercicio.nombre]}
          </div>
        )}
        
        {tipo === 'Fuerza' && (
          <div style={{display:'flex', gap:'20px', flexWrap:'wrap'}}>
            <div style={{flex:1.2, textAlign:'center', minWidth:'180px'}}>
              <div style={{fontSize:'42px', fontWeight:'bold', color:'#60a5fa', marginBottom:'10px'}}>{peso} <span style={{fontSize:'18px', color:'#94a3b8'}}>kg</span></div>
              <div style={estilos.gridDiscos}>
                {[1, 1.25, 2.5, 4, 5, 10, 20].map(p => <button key={p} style={estilos.botonDiscoMini} onClick={() => setPeso(parseFloat((peso + p).toFixed(2)))}>+{p}</button>)}
                <button style={estilos.botonResetMini} onClick={() => setPeso(0)}>BORRAR</button>
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
              <button style={{...estilos.botonActivo, width:'100%', padding:'18px', border:'none', borderRadius:'12px', fontWeight:'bold', fontSize:'18px', marginTop:'10px'}} onClick={manejarAñadirSerie}>AÑADIR SERIE</button>
            </div>
          </div>
        )}

        {tipo === 'Peso Corporal' && (
          <div style={{display:'flex', gap:'20px', flexWrap:'wrap', justifyContent:'center'}}>
            <div style={{flex:1, minWidth:'250px', backgroundColor:'#1e293b', padding:'20px', borderRadius:'15px', border:'1px solid #334155'}}>
              <label style={{fontSize:'12px', color:'#94a3b8', fontWeight:'bold'}}>OBJETIVO (Reps o Tiempo):</label>
              <input 
                style={{...estilos.inputRegistrar, fontSize:'20px', textAlign:'center', marginTop:'10px'}} 
                value={repsCorporal} 
                onChange={e => setRepsCorporal(e.target.value)} 
                placeholder="Ej: 20 reps o 60 seg" 
              />
              <label style={{fontSize:'12px', color:'#94a3b8', fontWeight:'bold', marginTop:'15px', display:'block'}}>DESCANSO:</label>
              <select style={{...estilos.inputRegistrar, fontSize:'16px', padding:'15px', marginTop:'5px'}} value={descansoActual} onChange={e => setDescansoActual(e.target.value)}>
                {opcionesDescanso.map(o => <option key={o.valor} value={o.valor}>{o.texto}</option>)}
              </select>
              <button style={{...estilos.botonActivo, width:'100%', padding:'18px', border:'none', borderRadius:'12px', fontWeight:'bold', fontSize:'18px', marginTop:'20px'}} onClick={manejarAñadirSerie}>AÑADIR SERIE</button>
            </div>
          </div>
        )}

        {tipo === 'Cardio' && (
          <div style={{display:'flex', gap:'10px', flexWrap:'wrap', backgroundColor:'#1e293b', padding:'20px', borderRadius:'15px', border:'1px solid #334155'}}>
            <div style={{flex:1, minWidth:'100px'}}>
              <label style={{fontSize:'12px', color:'#94a3b8', fontWeight:'bold'}}>TIEMPO (min):</label>
              <input type="number" style={{...estilos.inputRegistrar, fontSize:'20px', textAlign:'center', marginTop:'5px'}} value={tiempoCardio} onChange={e => setTiempoCardio(e.target.value)} />
            </div>
            <div style={{flex:1, minWidth:'100px'}}>
              <label style={{fontSize:'12px', color:'#94a3b8', fontWeight:'bold'}}>VEL / NIVEL:</label>
              <input type="number" step="0.1" style={{...estilos.inputRegistrar, fontSize:'20px', textAlign:'center', marginTop:'5px'}} value={velocidadCardio} onChange={e => setVelocidadCardio(e.target.value)} />
            </div>
            <div style={{flex:1, minWidth:'100px'}}>
              <label style={{fontSize:'12px', color:'#94a3b8', fontWeight:'bold'}}>INCLINACIÓN:</label>
              <input type="number" style={{...estilos.inputRegistrar, fontSize:'20px', textAlign:'center', marginTop:'5px'}} value={inclinacionCardio} onChange={e => setInclinacionCardio(e.target.value)} />
            </div>
            <button style={{...estilos.botonActivo, width:'100%', padding:'18px', border:'none', borderRadius:'12px', fontWeight:'bold', fontSize:'18px', marginTop:'15px'}} onClick={manejarAñadirSerie}>REGISTRAR CARDIO</button>
          </div>
        )}

        {/* 👇 AQUÍ USAMOS seriesMostradas EN VEZ DE seriesHoy 👇 */}
        {seriesMostradas.length > 0 && (
          <div style={{marginTop:'25px', backgroundColor:'#0f172a', borderRadius:'12px', padding:'15px'}}>
            <h4 style={{margin:'0 0 10px 0', color:'#e2e8f0', textAlign:'center'}}>
              {tipo === 'Cardio' ? 'Registros de la sesión' : 'Series Registradas'}
            </h4>
            <table style={{width:'100%', fontSize:'14px', textAlign:'center'}}>
              <thead style={{color:'#475569', borderBottom:'1px solid #1e293b'}}>
                <tr>
                  <th style={{paddingBottom:'8px'}}>#</th>
                  <th>{tipo === 'Cardio' ? 'VELOCIDAD' : 'PESO'}</th>
                  <th>{tipo === 'Cardio' ? 'TIEMPO' : 'REPS'}</th>
                  {tipo === 'Cardio' && <th>INCL.</th>}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {seriesMostradas.map((s, i) => (
                  <tr key={s.id || i} style={{borderBottom:'1px solid #1e293b'}}>
                    <td style={{color:'#10b981', padding:'12px 0', fontWeight:'bold'}}>{tipo === 'Cardio' ? 'Sesión' : 'Serie'} {i+1}</td>
                    <td style={{fontWeight:'bold'}}>{s.peso} {tipo === 'Cardio' ? '' : 'kg'}</td>
                    <td>{s.reps}</td>
                    {tipo === 'Cardio' && <td style={{color:'#94a3b8'}}>{s.inclinacion || 0}</td>}
                    <td><button onClick={() => eliminarSerie(s.id)} style={{background:'none', border:'none', color:'#ef4444', fontSize:'20px', cursor:'pointer'}}>✖</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <label style={{fontSize:'12px', color:'#94a3b8', fontWeight:'bold', display:'block', marginTop:'25px'}}>NOTA PARA EL FUTURO:</label>
        <textarea style={{...estilos.inputRegistrar, minHeight:'80px', fontSize:'14px'}} value={textoNotaActual} onChange={e => setTextoNotaActual(e.target.value)} placeholder="Ej: Me costó la última serie..." />
        
        <button style={{width:'100%', padding:'18px', backgroundColor:'#10b981', color:'white', border:'none', borderRadius:'12px', fontWeight:'bold', fontSize:'16px', marginTop:'10px', cursor:'pointer'}} onClick={onCerrar}>
          ✅ GUARDAR TODO Y CERRAR
        </button>
      </div>
    </div>
  );
}