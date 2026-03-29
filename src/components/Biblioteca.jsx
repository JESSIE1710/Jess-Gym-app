import { useState } from 'react';

export default function Biblioteca({
  mostrarCreador, setMostrarCreador, nuevoEj, setNuevoEj, 
  guardarEnCatalogo, catalogo, estilos, eliminarDelCatalogo, prepararEdicion
}) {
  // Estados para guardar los archivos reales antes de subir
  const [fileM, setFileM] = useState(null);
  const [fileL, setFileL] = useState(null);
  const [subiendo, setSubiendo] = useState(false);

  // --- FUNCIÓN PARA SUBIR A CLOUDINARY ---
  const subirACloudinary = async (archivo) => {
    if (!archivo) return null;
    const formData = new FormData();
    formData.append('file', archivo);
    formData.append('upload_preset', 'jessgym_fotos'); 
    formData.append('cloud_name', 'dk9kgtcad'); 

    try {
      const resp = await fetch('https://api.cloudinary.com/v1_1/dk9kgtcad/image/upload', {
        method: 'POST',
        body: formData
      });
      
      const data = await resp.json();
      console.log("Respuesta de Cloudinary:", data); 
      return data.secure_url; 
    } catch (e) {
      console.error("Error subiendo:", e);
      return null;
    }
  };

  // --- FUNCIÓN AL PULSAR GUARDAR ---
  const manejarGuardadoLocal = async () => {
    setSubiendo(true);
    
    // 1. Subimos las fotos y esperamos los links reales
    const urlM = await subirACloudinary(fileM);
    const urlL = await subirACloudinary(fileL);

    // 2. Actualizamos el objeto del ejercicio con los links de internet
    guardarEnCatalogo({
      ...nuevoEj,
      imgM: urlM || nuevoEj.imgM,
      imgL: urlL || nuevoEj.imgL
    });

    setSubiendo(false);
    setFileM(null);
    setFileL(null);
  };

  // --- 🎨 NUEVA FUNCIÓN: COLORES POR CATEGORÍA ---
  const obtenerEstiloCategoria = (categoria) => {
    const colorSchemes = {
      // Tren Inferior (tonos rosados)
      'Piernas': { bg: 'rgba(236, 72, 153, 0.15)', text: '#f9a8d4' },
      'Tren Inferior': { bg: 'rgba(236, 72, 153, 0.15)', text: '#f9a8d4' },
      'Cuádriceps': { bg: 'rgba(236, 72, 153, 0.15)', text: '#f9a8d4' },
      'Femoral / Isquios': { bg: 'rgba(236, 72, 153, 0.15)', text: '#f9a8d4' },
      'Gemelos': { bg: 'rgba(236, 72, 153, 0.15)', text: '#f9a8d4' },
      'Glúteos': { bg: 'rgba(236, 72, 153, 0.15)', text: '#f9a8d4' },

      // Tren Superior Empuje (tonos naranjas/amarillos)
      'Pecho': { bg: 'rgba(245, 158, 11, 0.15)', text: '#fcd34d' },
      'Tren Superior': { bg: 'rgba(245, 158, 11, 0.15)', text: '#fcd34d' },
      'Tríceps': { bg: 'rgba(245, 158, 11, 0.15)', text: '#fcd34d' },

      // Tren Superior Tracción (tonos verdes)
      'Espalda': { bg: 'rgba(16, 185, 129, 0.15)', text: '#6ee7b7' },
      'Bíceps': { bg: 'rgba(16, 185, 129, 0.15)', text: '#6ee7b7' },
      'Antebrazos': { bg: 'rgba(16, 185, 129, 0.15)', text: '#6ee7b7' },

      // Hombros (tonos morados)
      'Hombros': { bg: 'rgba(139, 92, 246, 0.15)', text: '#c4b5fd' },

      // Zona Media (tonos cian)
      'Abdomen / Core': { bg: 'rgba(6, 182, 212, 0.15)', text: '#67e8f9' },

      // Generales/Otros (tonos azules)
      'Full Body': { bg: 'rgba(59, 130, 246, 0.15)', text: '#93c5fd' },
      'Cardio': { bg: 'rgba(59, 130, 246, 0.15)', text: '#93c5fd' },
      'Movilidad': { bg: 'rgba(59, 130, 246, 0.15)', text: '#93c5fd' },
      'Calentamiento': { bg: 'rgba(59, 130, 246, 0.15)', text: '#93c5fd' },
      'Otros': { bg: '#1e293b', text: '#94a3b8' }
    };

    const scheme = colorSchemes[categoria] || colorSchemes['Otros'];
    return {
      color: scheme.text,
      backgroundColor: scheme.bg,
      padding: '4px 8px',
      borderRadius: '10px',
      fontSize: '15px', // 👈 Mantuve tu tamaño de 15px
      display: 'inline-block'
    };
  };

  return (
    <div style={{width:'100%', maxWidth:'850px'}}>
      <button onClick={() => setMostrarCreador(!mostrarCreador)} style={{...estilos.botonAñadirGrande, width:'100%', marginBottom:'20px'}}>
        {mostrarCreador ? "✖ CANCELAR" : "➕ CREAR NUEVO EJERCICIO"}
      </button>

      {mostrarCreador && (
        <div style={{...estilos.panelGrafico, marginBottom:'20px'}}>
          <h3 style={{color:'#e2e8f0', marginTop:0}}>Añadir al catálogo</h3>
          
<input 
            placeholder="Nombre del ejercicio" 
            style={estilos.inputRegistrar} 
            value={nuevoEj.nombre} 
            onChange={e => setNuevoEj({...nuevoEj, nombre: e.target.value})} 
          />

          {/* 👇 NUEVO: DESPLEGABLE DE TIPO DE ENTRENAMIENTO 👇 */}
          <select 
            style={{...estilos.inputRegistrar, border: '1px solid #60a5fa'}} // Borde azul para resaltarlo un poco
            value={nuevoEj.tipoMedicion || 'Fuerza'} 
            onChange={e => setNuevoEj({...nuevoEj, tipoMedicion: e.target.value})}
          >
            <option value="Fuerza">🏋️‍♀️ Fuerza (Pesas, Máquinas, Poleas)</option>
            <option value="Cardio">🏃‍♀️ Cardio (Cinta de correr, Escaleras, Bicicleta)</option>
            <option value="Peso Corporal">🧘‍♀️ Peso Corporal / Isométrico (Planchas, Crunches)</option>
          </select>
          {/* 👆 FIN DEL NUEVO DESPLEGABLE 👆 */}


          {/* ➕ NUEVO DESPLEGABLE DE CATEGORÍAS */}
          <select style={estilos.inputRegistrar} value={nuevoEj.categoria} onChange={e => setNuevoEj({...nuevoEj, categoria: e.target.value})}>
            <option value="">Seleccionar categoría...</option>
            <optgroup label="Generales">
              <option value="Otros">Otros</option>
              <option value="Full Body">Full Body</option>
              <option value="Cardio">Cardio</option>
              <option value="Movilidad">Movilidad / Estiramientos</option>
              <option value="Calentamiento">Calentamiento</option>
            </optgroup>
            <optgroup label="Tren Inferior">
              <option value="Piernas">Piernas General</option>
              <option value="Tren Inferior">Tren Inferior General</option>
              <option value="Cuádriceps">Cuádriceps</option>
              <option value="Femoral / Isquios">Femoral / Isquios</option>
              <option value="Gemelos">Gemelos</option>
              <option value="Glúteos">Glúteos</option>
            </optgroup>
            <optgroup label="Tren Superior - Empuje">
              <option value="Pecho">Pecho</option>
              <option value="Hombros">Hombros</option>
              <option value="Tríceps">Tríceps</option>
              <option value="Tren Superior">Tren Superior General</option>
            </optgroup>
            <optgroup label="Tren Superior - Tracción">
              <option value="Espalda">Espalda</option>
              <option value="Bíceps">Bíceps</option>
              <option value="Antebrazos">Antebrazos</option>
            </optgroup>
            <optgroup label="Zona Media">
              <option value="Abdomen / Core">Abdomen / Core</option>
            </optgroup>
          </select>

          <div style={{display:'flex', gap:'15px', marginBottom:'20px', backgroundColor:'#0f172a', padding:'15px', borderRadius:'10px'}}>
            <label style={{flex:1, fontSize:'12px', color:'#94a3b8', fontWeight:'bold'}}>
              📸 Foto Máquina:<br/>
              <input type="file" style={{marginTop:'10px'}} onChange={e => setFileM(e.target.files[0])}/>
              {fileM && <span style={{color:'#10b981'}}>✔ Lista</span>}
            </label>
            
            <label style={{flex:1, fontSize:'12px', color:'#94a3b8', fontWeight:'bold'}}>
              📸 Foto Libre (Opcional):<br/>
              <input type="file" style={{marginTop:'10px'}} onChange={e => setFileL(e.target.files[0])}/>
              {fileL && <span style={{color:'#10b981'}}>✔ Lista</span>}
            </label>
          </div>

          <button 
            disabled={subiendo}
            style={{...estilos.botonActivo, width:'100%', padding:'15px', opacity: subiendo ? 0.5 : 1}} 
            onClick={manejarGuardadoLocal}
          >
            {subiendo ? "⏳ SUBIENDO FOTOS..." : "💾 GUARDAR EN BIBLIOTECA"}
          </button>
        </div>
      )}

      <h3 style={{color:'#60a5fa'}}>Tus Ejercicios Guardados ({catalogo.length})</h3>

     {/* TABLA DE EJERCICIOS EXISTENTES */}
      <div style={estilos.scrollTabla}>
        <table style={estilos.tabla}>
          <thead style={{backgroundColor:'#020617'}}>
            <tr>
              <th style={{...estilos.celdaEncabezado, width: '5%', textAlign: 'center'}}>#</th>
              <th style={{...estilos.celdaEncabezado, width: '40%', textAlign: 'center'}}>EJERCICIO</th>
              <th style={{...estilos.celdaEncabezado, width: '15%', textAlign: 'center'}}>CATEGORÍA</th>
              <th style={{...estilos.celdaEncabezado, width: '15%', textAlign: 'center'}}>MÁQUINA</th>
              <th style={{...estilos.celdaEncabezado, width: '15%', textAlign: 'center'}}>LIBRE</th>
              <th style={{...estilos.celdaEncabezado, width: '10%', textAlign: 'center'}}>ACCIÓN</th>
            </tr>
          </thead>
          <tbody>
           {/* --- CORTA Y PEGA ESTE BLOQUE CORREGIDO DENTRO DE <tbody> EN BIBLIOTECA.JSX --- */}

            {catalogo.map((ej, index) => (
              <tr key={ej.id}>
                
                <td style={{...estilos.celdaCuerpo, textAlign: 'center', color: '#64748b', fontWeight: 'bold'}}>
                  {index + 1}
                </td>

                <td style={{...estilos.celdaCuerpo, fontWeight:'bold', fontSize:'20px'}}>
                  {ej.nombre}
                </td>
                
                <td style={estilos.celdaCuerpo}>
                  <span style={obtenerEstiloCategoria(ej.categoria)}>
                    {ej.categoria}
                  </span>
                </td>
                
                <td style={estilos.celdaCuerpo}>
                  {/* 👇 CORRECCIÓN AQUÍ: Leemos 'imgMaquina' 👇 */}
                  {ej.imgMaquina ? (
                    <img src={ej.imgMaquina} 
                    alt="Máquina" 
                    style={{width:'80px', height:'80px', borderRadius:'8px', objectFit:'cover', border: '1px solid #334155'}} />
                  ) : (
                    <div style={{...estilos.cajaImagenVacia, width:'60px', height:'60px', fontSize:'10px'}}>Añade img</div>
                  )}
                </td>

                <td style={estilos.celdaCuerpo}>
                  {/* 👇 CORRECCIÓN AQUÍ: Leemos 'imgLibre' 👇 */}
                  {ej.imgLibre ? (
                    <img src={ej.imgLibre} 
                    alt="Libre" 
                    style={{width:'80px', height:'80px', borderRadius:'8px', objectFit:'cover', border: '1px solid #334155'}} />
                  ) : (
                    <div style={{...estilos.cajaImagenVacia, width:'60px', height:'60px', fontSize:'9px'}}>Opcional</div>
                  )}
                </td>

                <td style={estilos.celdaCuerpo}>
                  <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
                    <button 
                      onClick={() => prepararEdicion(ej)} 
                      style={{background:'none', border:'none', cursor:'pointer', fontSize:'25px', opacity: 0.8}} 
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => eliminarDelCatalogo(ej.id)} 
                      style={{background:'none', border:'none', cursor:'pointer', fontSize:'25px', opacity: 0.8}} 
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
{/* --- FIN DEL CORTA Y PEGA --- */}
          </tbody>
        </table>
      </div>
    </div>
  );
}