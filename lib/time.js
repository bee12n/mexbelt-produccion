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

// Tiempo real total de un proceso = suma del tiempo real de cada una de sus subtareas.
// Funciona aunque una subtarea esté corriendo (sigue sumando hasta "ahora").
// Si el registro es de antes de este cambio (no tiene subtareas, solo el "segmentos" viejo
// a nivel proceso), cae de vuelta a ese cálculo para no perder el historial.
export function procesoElapsedSeconds(r) {
  if (r.subtareas && r.subtareas.length) {
    return r.subtareas.reduce((acc, s) => acc + elapsedSeconds(s), 0);
  }
  return elapsedSeconds(r);
}

// Convierte minutos estimados (enteros) a la misma máscara HH:MM:SS que usan los timers reales.
export function formatMinutos(totalMinutos) {
  return formatDuration(Math.round(totalMinutos * 60));
}

export function formatFecha(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('es-MX', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}
