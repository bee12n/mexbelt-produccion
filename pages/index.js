import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import Header from '../components/Header';
import ProcesoCard from '../components/ProcesoCard';
import NuevoProcesoModal from '../components/NuevoProcesoModal';

export default function Home() {
  const [registros, setRegistros] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [, forceTick] = useState(0);

  const cargar = useCallback(async () => {
    const { data, error } = await supabase
      .from('procesos')
      .select('*')
      .neq('estado', 'finalizado')
      .order('creado_en', { ascending: false });
    if (!error) setRegistros(data || []);
  }, []);

  useEffect(() => {
    cargar();

    const channel = supabase
      .channel('procesos-operador')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'procesos' }, () => cargar())
      .subscribe();

    const tick = setInterval(() => forceTick((t) => t + 1), 1000);
    const poll = setInterval(cargar, 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(tick);
      clearInterval(poll);
    };
  }, [cargar]);

  function cerrarSegmentoAbierto(segmentos, now) {
    const out = [...segmentos];
    const last = out[out.length - 1];
    if (last && !last.fin) last.fin = now;
    return out;
  }

  async function guardarSubtareas(r, subtareas, extra = {}) {
    const todasCompletas = subtareas.every((s) => s.estado === 'completado');
    const algunaCorriendo = subtareas.some((s) => s.estado === 'corriendo');
    const payload = {
      subtareas,
      estado: todasCompletas ? 'finalizado' : algunaCorriendo ? 'corriendo' : 'pausado',
      ...(todasCompletas ? { finalizado_en: new Date().toISOString() } : {}),
      ...extra,
    };
    const { error } = await supabase.from('procesos').update(payload).eq('id', r.id);
    if (error) {
      alert('No se pudo actualizar el proceso. Revisa tu conexión e intenta de nuevo.\n' + error.message);
      return;
    }
    cargar();
  }

  // Iniciar (o reanudar) una subtarea: pausa automáticamente cualquier otra que esté corriendo,
  // porque solo una subtarea puede estar activa a la vez dentro del mismo proceso.
  function iniciarSubtarea(r, idx) {
    const now = new Date().toISOString();
    const subtareas = r.subtareas.map((s, i) => {
      if (i === idx) return { ...s, estado: 'corriendo', segmentos: [...s.segmentos, { inicio: now, fin: null }] };
      if (s.estado === 'corriendo') return { ...s, estado: 'pausado', segmentos: cerrarSegmentoAbierto(s.segmentos, now) };
      return s;
    });
    guardarSubtareas(r, subtareas);
  }

  function pausarSubtarea(r, idx) {
    const now = new Date().toISOString();
    const subtareas = r.subtareas.map((s, i) => (i === idx ? { ...s, estado: 'pausado', segmentos: cerrarSegmentoAbierto(s.segmentos, now) } : s));
    guardarSubtareas(r, subtareas);
  }

  function completarSubtarea(r, idx) {
    const now = new Date().toISOString();
    const subtareas = r.subtareas.map((s, i) => (i === idx ? { ...s, estado: 'completado', segmentos: cerrarSegmentoAbierto(s.segmentos, now) } : s));
    guardarSubtareas(r, subtareas);
  }

  function finalizar(r) {
    const faltan = r.subtareas.filter((s) => s.estado !== 'completado').length;
    const msg = faltan
      ? `Aún quedan ${faltan} subtarea(s) sin completar. ¿Finalizar el proceso de todos modos?`
      : '¿Finalizar este proceso? Ya no podrás reanudarlo.';
    if (!confirm(msg)) return;
    const now = new Date().toISOString();
    const subtareas = r.subtareas.map((s) => (s.estado === 'corriendo' ? { ...s, estado: 'pausado', segmentos: cerrarSegmentoAbierto(s.segmentos, now) } : s));
    guardarSubtareas(r, subtareas, { estado: 'finalizado', finalizado_en: now });
  }

  return (
    <div className="app">
      <Header />
      <div className="section-head">
        <h2>Procesos en curso</h2>
        <button className="btn btn-orange" onClick={() => setModalOpen(true)}>+ Nuevo proceso</button>
      </div>
      <div className="grid-cards">
        {registros.length === 0 && (
          <div className="empty-state">Sin procesos activos.<br />Inicia uno para comenzar a medir tiempos.</div>
        )}
        {registros.map((r) => (
          <ProcesoCard
            key={r.id}
            r={r}
            onIniciarSub={(idx) => iniciarSubtarea(r, idx)}
            onPausarSub={(idx) => pausarSubtarea(r, idx)}
            onCompletarSub={(idx) => completarSubtarea(r, idx)}
            onFinalizar={() => finalizar(r)}
          />
        ))}
      </div>
      {modalOpen && <NuevoProcesoModal onClose={() => setModalOpen(false)} onCreated={cargar} />}
    </div>
  );
}

