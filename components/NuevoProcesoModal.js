import { useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import procesosPlanta from '../lib/procesosPlanta';
import { formatMinutos } from '../lib/time';

const OTRO = 'Otro / personalizado';
const TIPOS_PROCESO = [...Object.keys(procesosPlanta), OTRO];
const MATERIALES = ['Lona', 'PVC', 'Poliéster', 'Nylon', 'Caucho / Hule', 'Acero', 'Otro'];

export default function NuevoProcesoModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    operador: '', proceso: '', procesoOtro: '', tiempoOtro: '',
    nombre: '', ancho: '', largo: '', material: '', materialOtro: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  // Subtareas que se van a crear según el tipo de proceso elegido (solo vista previa).
  const subtareasPreview = useMemo(() => {
    if (!form.proceso) return [];
    if (form.proceso === OTRO) {
      return [{ proc: form.procesoOtro.trim() || 'PROCESO', tiempoEstimado: parseInt(form.tiempoOtro, 10) || 0 }];
    }
    return procesosPlanta[form.proceso] || [];
  }, [form.proceso, form.procesoOtro, form.tiempoOtro]);

  const tiempoEstimadoTotalMin = subtareasPreview.reduce((acc, s) => acc + s.tiempoEstimado, 0);

  async function handleSubmit(e) {
    e.preventDefault();
    const ancho = parseFloat(form.ancho);
    const largo = parseFloat(form.largo);
    if (isNaN(ancho) || isNaN(largo)) {
      setError('Ancho y largo deben ser números válidos.');
      return;
    }
    if (!form.proceso) {
      setError('Selecciona un tipo de proceso.');
      return;
    }
    if (form.proceso === OTRO && !form.procesoOtro.trim()) {
      setError('Especifica el nombre del proceso personalizado.');
      return;
    }
    if (subtareasPreview.length === 0) {
      setError('Este tipo de proceso no tiene subtareas configuradas.');
      return;
    }

    const proceso = form.proceso === OTRO ? form.procesoOtro.trim() : form.proceso;
    const material = form.material === 'Otro' ? (form.materialOtro.trim() || 'Otro') : form.material;

    const ahora = new Date().toISOString();
    // La primera subtarea arranca su cronómetro de inmediato; el resto queda pendiente.
    const subtareas = subtareasPreview.map((s, i) => ({
      proc: s.proc,
      tiempoEstimado: s.tiempoEstimado,
      estado: i === 0 ? 'corriendo' : 'pendiente',
      segmentos: i === 0 ? [{ inicio: ahora, fin: null }] : [],
    }));

    setSaving(true);
    const { error: err } = await supabase.from('procesos').insert({
      proceso,
      material,
      producto_nombre: form.nombre.trim(),
      ancho_in: ancho,
      largo_m: largo,
      operador: form.operador.trim(),
      estado: 'corriendo',
      subtareas,
    });
    setSaving(false);

    if (err) {
      setError('No se pudo guardar: ' + err.message);
      return;
    }
    onCreated();
    onClose();
  }

  return (
    <div className="overlay">
      <div className="modal">
        <h3>Nuevo proceso</h3>
        <p className="modal-sub">Registra el proceso que vas a iniciar. El cronómetro de la primera subtarea arranca al guardar.</p>
        {error && <p className="form-error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Operador</label>
            <input required value={form.operador} onChange={(e) => update('operador', e.target.value)} placeholder="Tu nombre" />
          </div>
          <div className="field">
            <label>Tipo de proceso</label>
            <select required value={form.proceso} onChange={(e) => update('proceso', e.target.value)}>
              <option value="">Selecciona...</option>
              {TIPOS_PROCESO.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>

          {form.proceso === OTRO && (
            <div className="field-row">
              <div className="field">
                <label>Nombre del proceso</label>
                <input value={form.procesoOtro} onChange={(e) => update('procesoOtro', e.target.value)} placeholder="Ej. Reparación especial" />
              </div>
              <div className="field">
                <label>Tiempo estimado (min)</label>
                <input type="number" min="0" value={form.tiempoOtro} onChange={(e) => update('tiempoOtro', e.target.value)} placeholder="0" />
              </div>
            </div>
          )}

          {form.proceso && (
            <div className="subtask-preview">
              <div className="subtask-preview-head">
                <span>Subtareas de este proceso</span>
                <span className="subtask-preview-total mono">Total est. {formatMinutos(tiempoEstimadoTotalMin)}</span>
              </div>
              <ul className="subtask-preview-list">
                {subtareasPreview.map((s, i) => (
                  <li key={i}>
                    <span>{i + 1}. {s.proc}</span>
                    <span className="mono">{s.tiempoEstimado} min</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="field">
            <label>Producto (nombre)</label>
            <input required value={form.nombre} onChange={(e) => update('nombre', e.target.value)} placeholder="Ej. Banda transportadora lisa" />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Ancho (in)</label>
              <input required type="number" step="0.01" min="0" value={form.ancho} onChange={(e) => update('ancho', e.target.value)} placeholder="0.00" />
            </div>
            <div className="field">
              <label>Largo (m)</label>
              <input required type="number" step="0.01" min="0" value={form.largo} onChange={(e) => update('largo', e.target.value)} placeholder="0.00" />
            </div>
          </div>
          <div className="field">
            <label>Material</label>
            <select required value={form.material} onChange={(e) => update('material', e.target.value)}>
              <option value="">Selecciona...</option>
              {MATERIALES.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          {form.material === 'Otro' && (
            <div className="field">
              <label>Especifica el material</label>
              <input value={form.materialOtro} onChange={(e) => update('materialOtro', e.target.value)} placeholder="Nombre del material" />
            </div>
          )}
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-orange" disabled={saving}>{saving ? 'Guardando...' : 'Iniciar proceso'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
