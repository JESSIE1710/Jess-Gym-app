//src/components/Rutina.jsx
import { useState, useEffect } from "react"; 
export default function Rutina({
  diasSemana, diaActual, setDiaActual, rutinas, moverEjercicio,
  notasPorEjercicio, setEjercicioActivo, setPesoActual, setTextoNotaActual,
  ejercicioSeleccionadoCatalogo, setEjercicioSeleccionadoCatalogo,
  catalogo, agregarAlDia, diaParaCopiar, setDiaParaCopiar, copiarRutina, estilos,
  eliminarDeRutina,vaciarDia
  
}) {
    const [segundos, setSegundos] = useState(0);
    // ⏱️ El motor del cronómetro
useEffect(() => {
  let intervalo = null;

  if (segundos > 0) {
    // Si hay tiempo, cada 1000ms (1 seg) restamos 1
    intervalo = setInterval(() => {
      setSegundos((s) => s - 1);
    }, 1000);
  } else if (segundos === 0 && intervalo) {
    // Si llega a 0, detenemos el motor y vibramos
    clearInterval(intervalo);
    if (navigator.vibrate) navigator.vibrate(500); 
  }

  // Limpieza para que no se amontonen los relojes
  return () => clearInterval(intervalo);
}, [segundos]);

  return (
    <>
      <div style={estilos.contenedorTabs}>
        {diasSemana.map(dia => (
          <button key={dia} onClick={() => setDiaActual(dia)} style={{ ...estilos.botonTab, ...(diaActual === dia ? estilos.botonActivo : {}) }}>{dia}</button>
        ))}
      </div>

      <div style={estilos.scrollTabla}>
        <table style={estilos.tabla}>
<thead style={{backgroundColor:'#020617'}}>
            <tr>
              <th style={{...estilos.celdaEncabezado, textAlign: 'center'}}>ORDEN</th>
              <th style={{...estilos.celdaEncabezado, textAlign: 'center'}}>EJERCICIO</th>
              <th style={{...estilos.celdaEncabezado, textAlign: 'center'}}>MÁQUINA</th>
              <th style={{...estilos.celdaEncabezado, textAlign: 'center'}}>LIBRE</th>
              <th style={{...estilos.celdaEncabezado, textAlign: 'center'}}>ACCIÓN</th>
            </tr>
          </thead>
          <tbody>
            {(rutinas[diaActual] || []).map((ej, idx) => (
              <tr key={ej.id || idx}>
                <td style={estilos.celdaCuerpo}>
                  <button style={{color:'#60a5fa', background:'none', border:'none', fontSize:'35px', cursor:'pointer'}} onClick={() => moverEjercicio(idx, 'arriba')}>⬆️</button><br/>
                  <button style={{color:'#60a5fa', background:'none', border:'none', fontSize:'35px', cursor:'pointer'}} onClick={() => moverEjercicio(idx, 'abajo')}>⬇️</button>
                </td>
                <td style={{...estilos.celdaCuerpo, fontWeight:'bold', fontSize:'20px'}}>{ej.nombre} {(notasPorEjercicio || {})[ej.nombre] && '💡'}</td>
                
                
            {/* Columna MÁQUINA */}
            <td style={estilos.celdaCuerpo}>
            {ej.imgM ? (
                <img 
                src={ej.imgM} 
                alt="ejercicio"
                style={{width:'150px', height:'150px', borderRadius:'10px', objectFit:'cover'}} />
            ) : (
                <div style={estilos.cajaImagenVacia}>Sin foto</div>
            )}
            </td>

            {/* Columna LIBRE */}
            <td style={estilos.celdaCuerpo}>
            {ej.imgL ? (
                <img 
                src={ej.imgL} 
                alt="ejercicio"
                style={{width:'150px', height:'150px', borderRadius:'10px', objectFit:'cover'}}/>
                ) : (
                <div style={estilos.cajaImagenVacia}>Opcional</div>)}
            </td>


            <td style={estilos.celdaCuerpo}>
            {/* Usamos un div flex para poner los botones uno al lado del otro */}
            <div style={{display: 'flex', gap: '5px', alignItems: 'center'}}>
                
                {/* Botón ENTRENAR (el tuyo de siempre) */}
                <button style={{
                padding:'10px 15px', 
                backgroundColor:'#3b82f6', 
                color:'white', 
                border:'none', 
                borderRadius:'8px', 
                fontWeight:'bold', 
                cursor:'pointer',
                flex: 1 // Para que ocupe el espacio disponible
                }} onClick={() => { 
                setEjercicioActivo(ej); setPesoActual(0); setTextoNotaActual((notasPorEjercicio || {})[ej?.nombre] || ''); 
                }}>ENTRENAR</button>

                {/*  NUEVO BOTÓN DE BORRAR EJERCICIO DE LA RUTINA DEL DÍA  */}
                <button 
                onClick={() => eliminarDeRutina(diaActual, ej.id)} 
                style={{
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer', 
                    fontSize: '25px', 
                    padding: '5px',
                    opacity: 0.7 // Un poco transparente para que no distraiga
                }} 
                title="Quitar de la rutina de hoy"
                >
                🗑️
                </button>
            </div>
            </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={estilos.zonaAñadir}>
         {/* Bloque de Añadir */}
         <div style={{flex:1, display:'flex', gap:'10px', minWidth:'250px'}}>
           <select style={{...estilos.inputRegistrar, marginBottom:0, flex:1}} value={ejercicioSeleccionadoCatalogo} onChange={e => setEjercicioSeleccionadoCatalogo(e.target.value)}>
              <option value="">Añadir ejercicio a {diaActual}...</option>
              {(catalogo || []).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
           </select>
           <button style={estilos.botonAñadirGrande} onClick={agregarAlDia}>+ Añadir</button>
         </div>
         
         {/* Bloque de Copiar */}
         <div style={{flex:1, display:'flex', gap:'10px', minWidth:'250px'}}>
           <select style={{...estilos.inputRegistrar, marginBottom:0, flex:1}} value={diaParaCopiar} onChange={e => setDiaParaCopiar(e.target.value)}>
              <option value="">Copiar rutina de...</option>
              {diasSemana.filter(d => d !== diaActual && (rutinas[d] || []).length > 0).map(d => <option key={d} value={d}>{d}</option>)}
           </select>
           <button style={{...estilos.botonAñadirGrande, backgroundColor:'#0f172a', color:'#94a3b8', border:'1px solid #334155'}} onClick={copiarRutina}>📋 Copiar</button>
         </div>

         {/*  NUEVO BOTÓN PARA VACIAR EL DÍA  */}
         <div style={{display:'flex', minWidth:'100%', justifyContent:'center', marginTop: '10px'}}>
            <button 
              style={{padding:'10px 20px', backgroundColor:'#ef4444', color:'white', border:'none', borderRadius:'10px', fontWeight:'bold', cursor:'pointer', display:'flex', alignItems:'center', gap:'8px'}} 
              onClick={vaciarDia}
            >
              🗑️ VACIAR RUTINA DEL {diaActual.toUpperCase()}
            </button>
         </div>
      </div>
  
{/*para la burbuja*/}
  {segundos > 0 && (
  <div style={{
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '70px',
    height: '70px',
    backgroundColor: '#3b82f6',
    borderRadius: '50%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 'bold',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    zIndex: 1000,
    border: '3px solid #60a5fa'
  }}>
    <span style={{ fontSize: '20px' }}>{segundos}</span>
    <span style={{ fontSize: '10px' }}>SEG</span>
  </div>
)}
  
  
  
  
  
  
  
    </>
  );
}