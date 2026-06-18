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

  async function togglePlayPause(r) {
    const now = new Date().toISOString();
    const segmentos = [...r.segmentos];
    let error;
    if (r.estado === 'corriendo') {
      const last = segmentos[segmentos.length - 1];
      if (last && !last.fin) last.fin = now;
      ({ error } = await supabase.from('procesos').update({ estado: 'pausado', segmentos }).eq('id', r.id));
    } else {
      segmentos.push({ inicio: now, fin: null });
      ({ error } = await supabase.from('procesos').update({ estado: 'corriendo', segmentos }).eq('id', r.id));
    }
    if (error) {
      alert('No se pudo actualizar el proceso. Revisa tu conexión e intenta de nuevo.\n' + error.message);
      return;
    }
    cargar();
  }

  async function finalizar(r) {
    if (!confirm('¿Finalizar este proceso? Ya no podrás reanudarlo.')) return;
    const now = new Date().toISOString();
    const segmentos = [...r.segmentos];
    const last = segmentos[segmentos.length - 1];
    if (last && !last.fin) last.fin = now;
    const { error } = await supabase
      .from('procesos')
      .update({ estado: 'finalizado', segmentos, finalizado_en: now })
      .eq('id', r.id);
    if (error) {
      alert('No se pudo finalizar el proceso. Revisa tu conexión e intenta de nuevo.\n' + error.message);
      return;
    }
    cargar();
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
          <ProcesoCard key={r.id} r={r} onToggle={() => togglePlayPause(r)} onFinalizar={() => finalizar(r)} />
        ))}
      </div>
      {modalOpen && <NuevoProcesoModal onClose={() => setModalOpen(false)} onCreated={cargar} />}
    </div>
  );
}
