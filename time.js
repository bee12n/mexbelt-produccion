export function elapsedSeconds(r) {
  let total = 0;
  const now = Date.now();
  (r.segmentos || []).forEach((s) => {
    const fin = s.fin ? new Date(s.fin).getTime() : now;
    total += Math.max(0, (fin - new Date(s.inicio).getTime()) / 1000);
  });
  return Math.floor(total);
}

export function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

export function formatFecha(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('es-MX', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}
