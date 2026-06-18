import { elapsedSeconds, formatDuration } from '../lib/time';

export default function ProcesoCard({ r, onToggle, onFinalizar }) {
  const isRunning = r.estado === 'corriendo';
  const dur = formatDuration(elapsedSeconds(r));

  return (
    <div className={`card-proc estado-${r.estado}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span className="card-status">
          <span className={`dot ${r.estado}`}></span>
          {isRunning ? 'En curso' : 'Pausado'}
        </span>
        <span className="card-proceso-tag">{r.proceso}</span>
      </div>
      <div className="timer mono">{dur}</div>
      <div className="meta-strong">{r.producto_nombre}</div>
      <div className="meta-soft">{r.ancho_in}&quot; x {r.largo_m} m · {r.material}</div>
      <div className="meta-soft">Operador: {r.operador}</div>
      <div className="card-actions">
        <button className={`btn btn-sm ${isRunning ? 'btn-gray' : 'btn-orange'}`} onClick={onToggle}>
          {isRunning ? '⏸ Pausar' : '▶ Reanudar'}
        </button>
        <button className="btn btn-navy btn-sm" onClick={onFinalizar}>✓ Finalizar</button>
      </div>
    </div>
  );
}
