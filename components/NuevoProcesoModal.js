import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const TIPOS_PROCESO = [
      'Corte',
      'Vulcanizado',
      'Empalme',
      'Preparacion',
      'Otro',
    ];

const MATERIALES = [
      'PVC',
      'PU',
      'Hule',
      'Neopreno',
      'Poliuretano',
      'Otro',
    ];

const SUBTAREAS_POR_TIPO = {
      Corte: ['Medir y marcar', 'Cortar banda', 'Verificar medidas'],
      Vulcanizado: ['Preparar prensa', 'Colocar banda', 'Vulcanizar', 'Enfriar'],
      Empalme: ['Lijar extremos', 'Aplicar cemento', 'Unir', 'Prensar'],
      Preparacion: ['Limpiar superficie', 'Cortar material', 'Armar'],
      Otro: ['Tarea 1'],
};

export default function NuevoProcesoModal({ onClose, onCreated }) {
      const [operador, setOperador] = useState('');
      const [tipoProceso, setTipoProceso] = useState('');
      const [productoNombre, setProductoNombre] = useState('');
      const [anchoMm, setAnchoMm] = useState('');
      const [largoMm, setLargoMm] = useState('');
      const [material, setMaterial] = useState('PVC');
      const [tiempoEstimadoMin, setTiempoEstimadoMin] = useState('');
      const [guardando, setGuardando] = useState(false);
      const [error, setError] = useState('');

  async function handleSubmit(e) {
          e.preventDefault();
          setError('');

        if (!operador || !tipoProceso || !productoNombre) {
                  setError('Por favor completa todos los campos obligatorios.');
                  return;
        }

        const subtareasBase = SUBTAREAS_POR_TIPO[tipoProceso] || ['Tarea 1'];
          const subtareas = subtareasBase.map((nombre) => ({
                    proc: nombre,
                    estado: 'pendiente',
                    segmentos: [],
          }));

        setGuardando(true);
          const { error: dbError } = await supabase
            .from('procesos')
            .insert([
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
          <div className="modal-overlay">
            <div className="modal-box">
              <h2 className="modal-title">Nuevo proceso</h2>
            <p className="modal-subtitle">
                Registra el proceso que vas a iniciar. El cronometro de la primera
              subtarea arranca al guardar.
                  </p>

        <form onSubmit={handleSubmit} className="modal-form">
                            <label className="form-label">OPERADOR</label>
              <input
                className="form-input"
                placeholder="Tu nombre"
                value={operador}
                onChange={(e) => setOperador(e.target.value)}
              />

                              <label className="form-label">TIPO DE PROCESO</label>
              <select
                className="form-select"
                value={tipoProceso}
                onChange={(e) => setTipoProceso(e.target.value)}
              >
                                <option value="">Selecciona...</option>
    {TIPOS_PROCESO.map((t) => (
                      <option key={t} value={t}>{t}</option>
                                   ))}
    </select>

          <label className="form-label">PRODUCTO (NOMBRE)</label>
              <input
                className="form-input"
                placeholder="Ej. Banda transportadora lisa"
                value={productoNombre}
                onChange={(e) => setProductoNombre(e.target.value)}
              />

                              <div className="form-row">
                                <div className="form-col">
                                  <label className="form-label">ANCHO (MM)</label>
                  <input
                    className="form-input"
                    type="number"
                    placeholder="0"
                    value={anchoMm}
                    onChange={(e) => setAnchoMm(e.target.value)}
                  />
                        </div>
                <div className="form-col">
                                      <label className="form-label">LARGO (MM)</label>
                  <input
                    className="form-input"
                    type="number"
                    placeholder="0"
                    value={largoMm}
                    onChange={(e) => setLargoMm(e.target.value)}
                  />
                        </div>
                        </div>

          <label className="form-label">MATERIAL</label>
              <select
                className="form-select"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
              >
                {MATERIALES.map((m) => (
                                  <option key={m} value={m}>{m}</option>
                                            ))}
</select>

          <label className="form-label">TIEMPO TOTAL ESTIMADO (MIN)</label>
          <input
            className="form-input"
            type="number"
            placeholder="Ej. 90"
            value={tiempoEstimadoMin}
            onChange={(e) => setTiempoEstimadoMin(e.target.value)}
          />

            {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
                            <button type="button" className="btn-cancelar" onClick={onClose}>
                              Cancelar
                </button>
            <button type="submit" className="btn-iniciar" disabled={guardando}>
            {guardando ? 'Guardando...' : 'Iniciar proceso'}
</button>
    </div>
    </form>
    </div>
    </div>
  );
}
