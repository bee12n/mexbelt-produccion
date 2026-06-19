import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { procesoElapsedSeconds, elapsedSeconds, formatDuration, formatFecha, formatMinutos } from '../lib/time';

const badgeClass = { corriendo: 'badge-corriendo', pausado: 'badge-pausado', finalizado: 'badge-finalizado' };
const badgeText = { corriendo: 'En curso', pausado: 'Pausado', finalizado: 'Finalizado' };

export default function Admin() {
  const router = useRouter();
  const [session, setSession] = useState(undefined);
  const [registros, setRegistros] = useState([]);
  const [filtros, setFiltros] = useState({
    buscar: '', proceso: 'Todos', material: 'Todos', estado: 'Todos',
    operador: '', desde: '', hasta: '',
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === null) router.replace('/login');
  }, [session, router]);

  const cargar = useCallback(async () => {
    const { data, error } = await supabase.from('procesos').select('*').order('creado_en', { ascending: false });
    if (!error) setRegistros(data || []);
  }, []);

  useEffect(() => {
    if (!session) return;
    cargar();
    const channel = supabase
      .channel('procesos-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'procesos' }, () => cargar())
      .subscribe();
    const poll = setInterval(cargar, 10000);
    const tick = setInterval(() => setRegistros((r) => [...r]), 1000);
    return () => { supabase.removeChannel(channel); clearInterval(poll); clearInterval(tick); };
  }, [session, cargar]);

  if (session === undefined) return <div className="app" style={{ paddingTop: 60 }}>Cargando...</div>;
  if (!session) return null;

  async function eliminar(id) {
    if (!confirm('¿Eliminar este registro permanentemente?')) return;
    await supabase.from('procesos').delete().eq('id', id);
    cargar();
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  const procesosUnicos = Array.from(new Set(registros.map((r) => r.proceso))).sort();
  const materialesUnicos = Array.from(new Set(registros.map((r) => r.material))).sort();

  const filtrados = registros.filter((r) => {
    if (filtros.buscar && !r.producto_nombre.toLowerCase().includes(filtros.buscar.toLowerCase())) return false;
    if (filtros.proceso !== 'Todos' && r.proceso !== filtros.proceso) return false;
    if (filtros.material !== 'Todos' && r.material !== filtros.material) return false;
    if (filtros.estado !== 'Todos' && r.estado !== filtros.estado) return false;
    if (filtros.operador && !r.operador.toLowerCase().includes(filtros.operador.toLowerCase())) return false;
    if (filtros.desde && new Date(r.creado_en) < new Date(filtros.desde + 'T00:00:00')) return false;
    if (filtros.hasta && new Date(r.creado_en) > new Date(filtros.hasta + 'T23:59:59')) return false;
    return true;
  });

  const hoyStr = new Date().toDateString();
  const hoy = registros.filter((r) => new Date(r.creado_en).toDateString() === hoyStr);
  const enCurso = registros.filter((r) => r.estado === 'corriendo').length;
  const tiempoTotalFiltro = filtrados.reduce((a, r) => a + procesoElapsedSeconds(r), 0);
  const finalizadosFiltro = filtrados.filter((r) => r.estado === 'finalizado');
  const promedio = finalizadosFiltro.length
    ? Math.floor(finalizadosFiltro.reduce((a, r) => a + procesoElapsedSeconds(r), 0) / finalizadosFiltro.length)
    : 0;

  function exportCSV() {
    const headers = [
      'Inicio', 'Operador', 'Numero_Pedido', 'Proceso', 'Producto', 'Cantidad_Piezas', 'Ancho_mm', 'Largo_mm', 'Material', 'Estado',
      'Tiempo_Estimado', 'Tiempo_Real', 'Subtareas_completadas', 'Subtareas_total', 'Desglose_subtareas',
    ];
    const rows = filtrados.map((r) => {
      const subtareas = r.subtareas || [];
      const completadas = subtareas.filter((s) => s.estado === 'completado').length;
      const desglose = subtareas
        .map((s) => `${s.proc}:${s.estado} (${formatDuration(elapsedSeconds(s))})`)
        .join(' | ');
      return [
        new Date(r.creado_en).toLocaleString('es-MX'), r.operador, r.numero_pedido || '', r.proceso, r.producto_nombre,
        r.cantidad_piezas || 0, r.ancho_in, r.largo_m, r.material, r.estado,
        formatMinutos(r.tiempo_estimado_min || 0), formatDuration(procesoElapsedSeconds(r)),
        completadas, subtareas.length, desglose,
      ];
    });
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `produccion_mexbelt_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="app">
      <div className="stripe-bar" />
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">MB</div>
          <div className="brand-text">
            <h1>Mexbelt — Control de Producción</h1>
            <p>Panel de administración</p>
          </div>
        </div>
      </header>

      <div className="admin-bar">
        <div className="who">Sesión admin: <b>{session.user.email}</b></div>
        <div className="actions">
          <button className="btn btn-outline btn-sm" onClick={() => router.push('/')}>Ver pantalla de operador</button>
          <button className="btn btn-outline btn-sm" onClick={cerrarSesion}>Cerrar sesión</button>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card"><div className="label">Procesos hoy</div><div className="value mono">{hoy.length}</div></div>
        <div className="stat-card"><div className="label">En curso ahora</div><div className="value mono">{enCurso}</div></div>
        <div className="stat-card"><div className="label">Tiempo total (filtro)</div><div className="value mono">{formatDuration(tiempoTotalFiltro)}</div></div>
        <div className="stat-card"><div className="label">Promedio finalizado</div><div className="value mono">{formatDuration(promedio)}</div></div>
      </div>

      <div className="filters-bar">
        <div className="ffield grow">
          <label>Buscar producto</label>
          <input value={filtros.buscar} onChange={(e) => setFiltros((f) => ({ ...f, buscar: e.target.value }))} />
        </div>
        <div className="ffield">
          <label>Proceso</label>
          <select value={filtros.proceso} onChange={(e) => setFiltros((f) => ({ ...f, proceso: e.target.value }))}>
            <option>Todos</option>
            {procesosUnicos.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div className="ffield">
          <label>Material</label>
          <select value={filtros.material} onChange={(e) => setFiltros((f) => ({ ...f, material: e.target.value }))}>
            <option>Todos</option>
            {materialesUnicos.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div className="ffield">
          <label>Estado</label>
          <select value={filtros.estado} onChange={(e) => setFiltros((f) => ({ ...f, estado: e.target.value }))}>
            <option>Todos</option>
            <option value="corriendo">En curso</option>
            <option value="pausado">Pausado</option>
            <option value="finalizado">Finalizado</option>
          </select>
        </div>
        <div className="ffield">
          <label>Operador</label>
          <input value={filtros.operador} onChange={(e) => setFiltros((f) => ({ ...f, operador: e.target.value }))} />
        </div>
        <div className="ffield">
          <label>Desde</label>
          <input type="date" value={filtros.desde} onChange={(e) => setFiltros((f) => ({ ...f, desde: e.target.value }))} />
        </div>
        <div className="ffield">
          <label>Hasta</label>
          <input type="date" value={filtros.hasta} onChange={(e) => setFiltros((f) => ({ ...f, hasta: e.target.value }))} />
        </div>
        <div className="ffield">
          <label>&nbsp;</label>
          <button className="btn btn-navy btn-sm" onClick={exportCSV}>Exportar CSV</button>
        </div>
      </div>

      <div className="table-wrap">
        {filtrados.length === 0 ? (
          <div className="table-empty">No hay registros con estos filtros.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Inicio</th><th>Operador</th><th>Proceso</th><th>Producto</th>
                <th>Material</th><th>Estado</th><th>Avance</th><th>Duración</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((r) => (
                <tr key={r.id}>
                  <td>{formatFecha(r.creado_en)}</td>
                  <td>{r.operador}</td>
                  <td>{r.proceso}</td>
                  <td>{r.producto_nombre} <span style={{ color: 'var(--text-soft)' }}>({r.ancho_in} x {r.largo_m} mm)</span></td>
                  <td>{r.material}</td>
                  <td><span className={`badge ${badgeClass[r.estado]}`}>{badgeText[r.estado]}</span></td>
                  <td className="mono">{(r.subtareas || []).filter((s) => s.estado === 'completado').length}/{(r.subtareas || []).length}</td>
                  <td className="mono">{formatDuration(procesoElapsedSeconds(r))}</td>
                  <td><button className="link-del" onClick={() => eliminar(r.id)}>Eliminar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
