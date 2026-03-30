import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';

// --- CONFIGURACIÓN DE COLORES ---
const COLOR_ACTUAL = '#3b82f6'; 
const COLOR_ANTERIOR = 'rgba(148, 163, 184, 0.3)'; 

// 👇 ESTILOS PARA LA TABLA DE BORRADO 💎
const estiloTabla = {
    width: '100%',
    fontSize: '14px',
    textAlign: 'center',
    backgroundColor: '#0f172a',
    borderCollapse: 'separate',
    borderSpacing: '0 8px',
    marginTop: '20px',
    borderRadius: '12px',
    padding: '10px'
};

const estiloFila = { backgroundColor: '#1e293b', borderRadius: '8px', overflow: 'hidden' };
const estiloCol = { padding: '12px', color: '#e2e8f0' };
const estiloBotonBorrar = { background: 'none', border: 'none', color: '#ef4444', fontSize: '18px', cursor: 'pointer', padding: '0 5px' };

const formatearFechaGrafico = (fechaIso) => {
    if(!fechaIso) return '';
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const d = new Date(fechaIso);
    if(isNaN(d.getTime())) return fechaIso;
    return `${d.getDate()} ${meses[d.getMonth()]}`;
};

const obtenerRangoMes = (offset = 0) => {
  const d = new Date();
  const dateStr = d.toISOString().split('T')[0];
  const parts = dateStr.split('-');
  let year = parseInt(parts[0]);
  let month = parseInt(parts[1]); 
  month += offset;
  while (month <= 0) { month += 12; year -= 1; }
  while (month > 12) { month -= 12; year += 1; }
  const start = new Date(year, month - 1, 1).toISOString();
  const end = new Date(year, month, 1).toISOString();
  return { start, end };
};

export default function Progreso({
  historialPeso, metaPeso, inputPesoActual, setInputPesoActual, usuario, setHistorialPeso,
  ejercicioFuerzaSel, setEjercicioFuerzaSel, ejerciciosConFuerza, datosFuerza,
  datosDonut, datosConsistencia, estilos, formatoFechaSegura, COLORES_DONUT, seriesGuardadas,
  eliminarRegistroPeso, pesoCorporalData,
  inputMetaPeso, setInputMetaPeso, inputFechaPeso, setInputFechaPeso, registrarPeso, actualizarMeta
}) {
  const { start: mesActualStart, end: mesActualEnd } = obtenerRangoMes(0);
  const { start: mesAnteriorStart, end: mesAnteriorEnd } = obtenerRangoMes(-1);

  const { top5Fuerza, top5CardioVel } = useMemo(() => {
    if (!seriesGuardadas || seriesGuardadas.length === 0) return { top5Fuerza: [], top5CardioVel: [] };
    const agruparFuerza = {};
    const agruparCardio = {};
    seriesGuardadas.forEach(s => {
      const esCardio = s.modalidad === 'Cardio';
      if (esCardio) {
        if (!agruparCardio[s.ejercicio]) agruparCardio[s.ejercicio] = { maxVel: -1, maxTiempo: -1, historial: [] };
        agruparCardio[s.ejercicio].historial.push(s);
        if (s.peso > agruparCardio[s.ejercicio].maxVel) agruparCardio[s.ejercicio].maxVel = s.peso;
        const tiempoInt = parseInt(s.reps);
        if (!isNaN(tiempoInt) && tiempoInt > agruparCardio[s.ejercicio].maxTiempo) agruparCardio[s.ejercicio].maxTiempo = tiempoInt;
      } else {
        if (!agruparFuerza[s.ejercicio]) agruparFuerza[s.ejercicio] = { maxPeso: -1, historial: [] };
        agruparFuerza[s.ejercicio].historial.push(s);
        if (s.peso > agruparFuerza[s.ejercicio].maxPeso) agruparFuerza[s.ejercicio].maxPeso = s.peso;
      }
    });
    const obtenerTop5 = (agrupado, metric, actualStart, actualEnd, antStart, antEnd, esTiempo=false) => {
      const topList = Object.keys(agrupado).map(e => ({ name: e, val: agrupado[e][metric] }));
      topList.sort((a,b) => b.val - a.val);
      const top5Names = topList.slice(0, 5).map(e => e.name);
      return top5Names.map(name => {
        const historial = agrupado[name].historial;
        let maxActual = -1;
        let maxAnterior = -1;
        historial.forEach(s => {
          const val = esTiempo ? parseInt(s.reps) : s.peso;
          if (val === -1 || isNaN(val)) return;
          if (s.fechaAlta >= actualStart && s.fechaAlta < actualEnd) { if (val > maxActual) maxActual = val; }
          if (s.fechaAlta >= antStart && s.fechaAlta < antEnd) { if (val > maxAnterior) maxAnterior = val; }
        });
        if (maxActual === -1) maxActual = 0;
        if (maxAnterior === -1) maxAnterior = 0;
        return { name, actual: maxActual, anterior: maxAnterior, title: metric };
      });
    };
    return {
      top5Fuerza: obtenerTop5(agruparFuerza, 'Max Peso (kg)', mesActualStart, mesActualEnd, mesAnteriorStart, mesAnteriorEnd),
      top5CardioVel: obtenerTop5(agruparCardio, 'Max Velocidad', mesActualStart, mesActualEnd, mesAnteriorStart, mesAnteriorEnd),
    };
  }, [seriesGuardadas]);

  const historialPesoParaTabla = useMemo(() => {
    return (pesoCorporalData || [])
        .filter(s => s.esObjetivo === false)
        .sort((a,b) => new Date(b.fecha) - new Date(a.fecha))
        .slice(0, 5);
  }, [pesoCorporalData]);

  return (
    <div style={{width:'100%', maxWidth:'1000px'}}>
      
      {/* 🛡️ PANEL DE CONTROL DE PESO (ARRIBA DEL TODO) 🛡️ */}
      <div style={{...estilos.panelGrafico, marginBottom: '30px', border: '1px solid #3b82f6'}}>
        <h3 style={{color: '#60a5fa', margin: '0 0 20px 0', textAlign: 'center'}}>⚖️ Panel de Control de Peso</h3>
        <div style={{display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center'}}>
          
          {/* Bloque A: Registrar Peso con fecha */}
          <div style={{flex: 1, minWidth: '280px'}}>
            <label style={{fontSize: '12px', color: '#94a3b8', fontWeight: 'bold'}}>REGISTRAR PESO (FECHA):</label>
            <div style={{display: 'flex', gap: '8px', marginTop: '10px'}}>
              <input type="date" style={{...estilos.inputRegistrar, marginBottom: 0, flex: 1.5, fontSize: '12px'}} value={inputFechaPeso} onChange={e => setInputFechaPeso(e.target.value)} />
              <input type="number" placeholder="kg" style={{...estilos.inputRegistrar, marginBottom: 0, flex: 1}} value={inputPesoActual} onChange={e => setInputPesoActual(e.target.value)} />
              <button onClick={registrarPeso} style={{...estilos.botonActivo, padding: '0 15px', border: 'none', borderRadius: '10px', fontWeight: 'bold'}}>OK</button>
            </div>
          </div>

          {/* Bloque B: Meta de Peso */}
          <div style={{flex: 1, minWidth: '280px'}}>
            <label style={{fontSize: '12px', color: '#94a3b8', fontWeight: 'bold'}}>META ACTUAL: {metaPeso ? `${metaPeso} kg` : '---'}</label>
            <div style={{display: 'flex', gap: '8px', marginTop: '10px'}}>
              <input type="number" placeholder="Nueva meta (kg)" style={{...estilos.inputRegistrar, marginBottom: 0, flex: 1}} value={inputMetaPeso} onChange={e => setInputMetaPeso(e.target.value)} />
              <button onClick={actualizarMeta} style={{...estilos.botonActivo, padding: '0 15px', border: 'none', borderRadius: '10px', fontWeight: 'bold', backgroundColor: '#10b981'}}>FIJAR</button>
            </div>
          </div>
        </div>
      </div>

      {/* 1. SECCIÓN: TUS GRÁFICOS HISTÓRICOS */}
      <div style={estilos.gridGraficos}>
        <div style={estilos.panelGrafico}>
          <h3 style={{margin: '0 0 15px 0', color: '#e2e8f0', textAlign:'center'}}>Peso Corporal (kg)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={historialPeso} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <XAxis dataKey="fecha" tick={{fill:'#64748b', fontSize:'10px'}} tickLine={false} axisLine={false} tickFormatter={formatearFechaGrafico} />
              <YAxis domain={['dataMin - 5', 'dataMax + 5']} tick={{fill:'#64748b'}} axisLine={false} tickLine={false} />
              <Tooltip labelFormatter={formatearFechaGrafico} contentStyle={{backgroundColor:'#1e293b', border:'none', borderRadius:'10px'}} />
              <Area type="monotone" dataKey="peso" stroke="#3b82f6" fill="rgba(59, 130, 246, 0.1)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={estilos.panelGrafico}>
          <h3 style={{margin: '0 0 10px 0', color: '#e2e8f0', textAlign:'center'}}>Récord de Fuerza</h3>
          <select style={{...estilos.inputRegistrar, marginBottom: '15px', padding: '8px', fontSize: '14px', width: '100%'}} value={ejercicioFuerzaSel} onChange={e => setEjercicioFuerzaSel(e.target.value)}>
            <option value="">Selecciona un ejercicio...</option>
            {ejerciciosConFuerza && ejerciciosConFuerza.map(ej => <option key={ej} value={ej}>{ej}</option>)}
          </select>
          <ResponsiveContainer width="100%" height={170}>
            <AreaChart data={datosFuerza} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <XAxis dataKey="fecha" tick={{fill:'#64748b', fontSize:'10px'}} tickLine={false} axisLine={false} tickFormatter={formatearFechaGrafico} />
              <YAxis domain={['dataMin - 10', 'dataMax + 10']} tick={{fill:'#64748b'}} axisLine={false} tickLine={false} />
              <Tooltip labelFormatter={formatearFechaGrafico} contentStyle={{backgroundColor:'#1e293b', border:'none', borderRadius:'10px'}} />
              <Area type="monotone" dataKey="p" stroke="#10b981" fill="rgba(16, 185, 129, 0.1)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={estilos.panelGrafico}>
          <h3 style={{margin: '0 0 15px 0', color: '#e2e8f0', textAlign:'center'}}>Músculos Trabajados</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={datosDonut} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                {datosDonut.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORES_DONUT[index % COLORES_DONUT.length]} />)}
              </Pie>
              <Tooltip contentStyle={{backgroundColor:'#1e293b', border:'none', borderRadius:'10px'}} />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{fontSize:'12px', color:'#94a3b8'}}/>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={estilos.panelGrafico}>
          <h3 style={{margin: '0 0 15px 0', color: '#e2e8f0', textAlign:'center'}}>Series (Últimos 7 días)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={datosConsistencia} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <XAxis dataKey="f" tick={{fill:'#64748b', fontSize:'10px'}} tickLine={false} axisLine={false} tickFormatter={formatearFechaGrafico} />
              <YAxis tick={{fill:'#64748b'}} axisLine={false} tickLine={false} />
              <Tooltip labelFormatter={formatearFechaGrafico} contentStyle={{backgroundColor:'#1e293b', border:'none', borderRadius:'10px'}} cursor={{fill: 'rgba(255,255,255,0.05)'}}/>
              <Bar dataKey="s" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* GESTIÓN DE PESO (BORRADO) */}
      <div style={{marginTop: '40px', textAlign: 'center'}}>
          <h3 style={{color: '#60a5fa', marginBottom: '15px'}}>Últimos Registros de Peso</h3>
          {historialPesoParaTabla.length > 0 ? (
              <table style={estiloTabla}>
                  <thead>
                      <tr>
                          <th style={{...estiloCol, color: '#94a3b8', fontSize: '12px'}}>FECHA</th>
                          <th style={{...estiloCol, color: '#94a3b8', fontSize: '12px'}}>PESO (kg)</th>
                          <th style={estiloCol}></th>
                      </tr>
                  </thead>
                  <tbody>
                      {historialPesoParaTabla.map(p => (
                          <tr key={p.id} style={estiloFila}>
                              <td style={{...estiloCol, fontWeight: 'bold'}}>{formatearFechaGrafico(p.fecha)}</td>
                              <td style={{...estiloCol, color: COLOR_ACTUAL, fontSize: '16px', fontWeight: 'bold'}}>{p.peso}</td>
                              <td style={estiloCol}>
                                  <button onClick={() => eliminarRegistroPeso(p.id)} style={estiloBotonBorrar}>🗑️ borrar</button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          ) : (
              <div style={{color:'#64748b', textAlign:'center', padding:'20px', backgroundColor:'#0f172a', borderRadius:'12px', marginTop: '10px'}}>¡Registra tu peso para verlo aquí! ⚖️</div>
          )}
      </div>

      {/* TOP 5 */}
      <h2 style={{color:'#60a5fa', textAlign:'center', marginTop:'40px', marginBottom:'20px'}}>Tus Máximos del Mes</h2>
      <div style={estilos.gridGraficos}>
        <div style={estilos.panelGrafico}>
          <h3 style={{margin: '0 0 15px 0', color: '#e2e8f0', textAlign:'center'}}>🏆 Top 5: Peso Máximo</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={top5Fuerza} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
              <XAxis dataKey="name" tick={{fill:'#94a3b8', fontSize:'10px'}} angle={-45} textAnchor="end" />
              <YAxis tick={{fill:'#94a3b8'}} />
              <Tooltip contentStyle={{backgroundColor:'#1e293b', border:'none', borderRadius:'10px'}} />
              <Legend iconType="circle" wrapperStyle={{fontSize:'12px', color:'#94a3b8'}} />
              <Bar dataKey="actual" name="Mes Actual" fill={COLOR_ACTUAL} radius={[5, 5, 0, 0]} />
              <Bar dataKey="anterior" name="Anterior" fill={COLOR_ANTERIOR} radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={estilos.panelGrafico}>
          <h3 style={{margin: '0 0 15px 0', color: '#e2e8f0', textAlign:'center'}}>🏆 Top 5: Cardio</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={top5CardioVel} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
              <XAxis dataKey="name" tick={{fill:'#94a3b8', fontSize:'10px'}} angle={-45} textAnchor="end" />
              <YAxis tick={{fill:'#94a3b8'}} />
              <Tooltip contentStyle={{backgroundColor:'#1e293b', border:'none', borderRadius:'10px'}} />
              <Legend iconType="circle" wrapperStyle={{fontSize:'12px', color:'#94a3b8'}} />
              <Bar dataKey="actual" name="Actual" fill="#8b5cf6" radius={[5, 5, 0, 0]} /> 
              <Bar dataKey="anterior" name="Anterior" fill={COLOR_ANTERIOR} radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}