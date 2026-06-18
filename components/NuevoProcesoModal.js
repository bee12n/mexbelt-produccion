import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import procesosPlanta, { tiempoEstimadoTotalMin } from '../lib/procesosPlanta';

const TIPOS_PROCESO = Object.keys(procesosPlanta);

const MATERIALES = ['PVC', 'PU', 'Hule', 'Neopreno', 'Poliuretano', 'Otro'];

export default function NuevoProcesoModal({ onClose, onCreated }) {
  const [operador, setOperador] = useState('');
  const [tipoProceso, setTipoProceso] = useState('');
  const [productoNombre, setProductoNombre] = useState('');
  const [anchoMm, setAnchoMm] = useState('');
  const [largoMm, setLargoMm] = useState('');
  const [material, setMaterial] = useState('PVC');
  const [tiempoEstimadoMin, setTiempoEstimadoMin] = useState('');
  const [tiempoEditadoManual, setTiempoEditadoManual] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  function handleTipoChange(valor) {
    setTipoProceso(valor);
    if (!tiempoEditadoManual) {
      setTiempoEstimadoMin(valor ? String(tiempoEstimadoTotalMin(valor)) : '');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!operador || !tipoProceso || !productoNombre) {
      setError('Por favor completa todos los campos obligatorios.');
      return;
    }

    const subtareasBase = procesosPlanta[tipoProceso] || [];
    const subtareas = subtareasBase.map((s) => ({
      proc: s.proc,
      tiempoEstimado: s.tiempoEstimado,
      estado: 'pendiente',
      segmentos: [],
    }));

    setGuardando(true);
    const { error: dbError } = await supabase.from('procesos').insert([
      {
        proceso: tipoProceso,
        material,
        producto_nombre: productoNombre,
        ancho_in: parseFloat(anchoMm) || 0,
        largo_m: parseFloat(largoMm) || 0,
        operador,
        estado: 'corriendo',
        segmentos: [],
        subtareas,
        tiempo_estimado_min: parseFloat(tiempoEstimadoMin) || 0,
      },
    ]);

    setGuardando(false);

    if (dbError) {
      setError(dbError.message);
      return;
    }

    if (onCreated) onCreated();
    onClose();
  }

  return (
    <div className="overlay">
      <div className="modal">
        <h3>Nuevo proceso</h3>
        <p className="modal-sub">
          Registra el proceso que vas a iniciar. El cronometro de la primera
          subtarea arranca al guardar.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>OPERADOR</label>
            <input
              placeholder="Tu nombre"
              value={operador}
              onChange={(e) => setOperador(e.target.value)}
            />
          </div>

          <div className="field">
            <label>TIPO DE PROCESO</label>
            <select
              value={tipoProceso}
              onChange={(e) => handleTipoChange(e.target.value)}
            >
              <option value="">Selecciona...</option>
              {TIPOS_PROCESO.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>PRODUCTO (NOMBRE)</label>
            <input
              placeholder="Ej. Banda transportadora lisa"
              value={productoNombre}
              onChange={(e) => setProductoNombre(e.target.value)}
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label>ANCHO (MM)</label>
              <input
                type="number"
                placeholder="0"
                value={anchoMm}
                onChange={(e) => setAnchoMm(e.target.value)}
              />
            </div>
            <div className="field">
              <label>LARGO (MM)</label>
              <input
                type="number"
                placeholder="0"
                value={largoMm}
                onChange={(e) => setLargoMm(e.target.value)}
              />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>MATERIAL</label>
              <select
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
              >
                {MATERIALES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>TIEMPO TOTAL ESTIMADO (MIN)</label>
              <input
                type="number"
                placeholder="Ej. 90"
                value={tiempoEstimadoMin}
                onChange={(e) => {
                  setTiempoEditadoManual(true);
                  setTiempoEstimadoMin(e.target.value);
                }}
              />
            </div>
          </div>

          {tipoProceso && (
            <div className="subtask-preview">
              <div className="subtask-preview-head">
                <span>Checklist ({procesosPlanta[tipoProceso].length} subtareas)</span>
                <span className="subtask-preview-total mono">
                  ~{tiempoEstimadoTotalMin(tipoProceso)} min
                </span>
              </div>
              <ul className="subtask-preview-list">
                {procesosPlanta[tipoProceso].map((s) => (
                  <li key={s.proc}>
                    <span>{s.proc}</span>
                    <span className="mono">{s.tiempoEstimado} min</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-orange" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Iniciar proceso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
