import { elapsedSeconds, formatDuration } from '../lib/time';

const ETIQUETAS = { pendiente: 'Pendiente', corriendo: 'En curso', pausado: 'Pausada', completado: 'Completada' };

export default function SubtareaItem({ sub, onIniciar, onPausar, onCompletar }) {
  const real = formatDuration(elapsedSeconds(sub));

  return (
    <div className={`subtask-row estado-${sub.estado}`}>
      <div className="subtask-row-info">
        <span className={`dot ${sub.estado === 'corriendo' ? 'corriendo' : sub.estado === 'completado' ? 'completado' : 'pausado'}`}></span>
        <div>
          <div className="subtask-row-name">{sub.proc}</div>
          <div className="subtask-row-sub">{ETIQUETAS[sub.estado]}</div>
        </div>
      </div>
      <div className="subtask-row-right">
        <span className="mono subtask-row-timer">{real}</span>
        <div className="subtask-row-actions">
          {sub.estado === 'pendiente' && (
            <button type="button" className="btn btn-orange btn-xs" onClick={onIniciar}>▶ Iniciar</button>
          )}
          {sub.estado === 'pausado' && (
            <>
              <button type="button" className="btn btn-orange btn-xs" onClick={onIniciar}>▶ Reanudar</button>
              <button type="button" className="btn btn-navy btn-xs" onClick={onCompletar}>✓</button>
            </>
          )}
          {sub.estado === 'corriendo' && (
            <>
              <button type="button" className="btn btn-gray btn-xs" onClick={onPausar}>⏸</button>
              <button type="button" className="btn btn-navy btn-xs" onClick={onCompletar}>✓</button>
            </>
          )}
          {sub.estado === 'completado' && <span className="subtask-check">✓</span>}
        </div>
      </div>
    </div>
  );
}
