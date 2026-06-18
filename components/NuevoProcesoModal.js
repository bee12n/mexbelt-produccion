import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const PROCESOS = ['Corte', 'Vulcanizado', 'Empalme', 'Perforado', 'Grapado', 'Inspección QC', 'Empaque', 'Otro'];
const MATERIALES = ['Lona', 'PVC', 'Poliéster', 'Nylon', 'Caucho / Hule', 'Acero', 'Otro'];

export default function NuevoProcesoModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    operador: '', proceso: '', procesoOtro: '', nombre: '',
    ancho: '', largo: '', material: '', materialOtro: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const ancho = parseFloat(form.ancho);
    const largo = parseFloat(form.largo);
    if (isNaN(ancho) || isNaN(largo)) {
      setError('Ancho y largo deben ser números válidos.');
      return;
    }
    const proceso = form.proceso === 'Otro' ? (form.procesoOtro.trim() || 'Otro') : form.proceso;
    const material = form.material === 'Otro' ? (form.materialOtro.trim() || 'Otro') : form.material;

    setSaving(true);
    const ahora = new Date().toISOString();
    const { error: err } = await supabase.from('procesos').insert({
      proceso,
      material,
      producto_nombre: form.nombre.trim(),
      ancho_in: ancho,
      largo_m: largo,
      operador: form.operador.trim(),
      estado: 'corriendo',
      segmentos: [{ inicio: ahora, fin: null }],
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
        <p className="modal-sub">Registra el proceso que vas a iniciar. El cronómetro arranca al guardar.</p>
        {error && <p className="form-error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Operador</label>
            <input required value={form.operador} onChange={(e) => update('operador', e.target.value)} placeholder="Tu nombre" />
          </div>
          <div className="field">
            <label>Proceso</label>
            <select required value={form.proceso} onChange={(e) => update('proceso', e.target.value)}>
              <option value="">Selecciona...</option>
              {PROCESOS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          {form.proceso === 'Otro' && (
            <div className="field">
              <label>Especifica el proceso</label>
              <input value={form.procesoOtro} onChange={(e) => update('procesoOtro', e.target.value)} placeholder="Nombre del proceso" />
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
