import { procesoElapsedSeconds, formatDuration, formatMinutos } from '../lib/time';
import SubtareaItem from './SubtareaItem';

export default function ProcesoCard({ r, onIniciarSub, onPausarSub, onCompletarSub, onFinalizar }) {
  const subtareas = r.subtareas || [];
  const completadas = subtareas.filter((s) => s.estado === 'completado').length;
  const total = subtareas.length;
  const tiempoEstimadoTotalMin = r.tiempo_estimado_min || 0;
  const realSegundos = procesoElapsedSeconds(r);
  const pctAvance = total ? Math.round((completadas / total) * 100) : 0;

  return (
    <div className={`card-proc estado-${r.estado}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span className="card-status">
          <span className={`dot ${r.estado === 'corriendo' ? 'corriendo' : 'pausado'}`}></span>
          {r.estado === 'corriendo' ? 'En curso' : 'Pausado'}
        </span>
        <span className="card-proceso-tag">{r.proceso}</span>
      </div>

      <div className="timer mono">{formatDuration(realSegundos)}</div>
      <div className="timer-estimado">vs. estimado {formatMinutos(tiempoEstimadoTotalMin)}</div>

      <div className="meta-strong">{r.producto_nombre}</div>
      <div className="meta-soft">{r.ancho_in} x {r.largo_m} mm · {r.material}</div>
      <div className="meta-soft">Operador: {r.operador}</div>

      <div className="progress-bar"><div className="progress-bar-fill" style={{ width: `${pctAvance}%` }} /></div>
      <div className="progress-label">{completadas}/{total} subtareas completadas</div>

      <div className="subtask-list">
        {subtareas.map((sub, i) => (
          <SubtareaItem
            key={i}
            sub={sub}
            onIniciar={() => onIniciarSub(i)}
            onPausar={() => onPausarSub(i)}
            onCompletar={() => onCompletarSub(i)}
          />
        ))}
      </div>

      <div className="card-actions">
        <button className="btn btn-outline btn-sm" onClick={onFinalizar}>Finalizar proceso</button>
      </div>
    </div>
  );
}
