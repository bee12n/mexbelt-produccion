import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Header({ subtitle }) {
  const [clock, setClock] = useState('');

  useEffect(() => {
    function tick() {
      setClock(
        new Date().toLocaleString('es-MX', {
          weekday: 'short', day: '2-digit', month: 'short',
          hour: '2-digit', minute: '2-digit', second: '2-digit',
        })
      );
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <div className="stripe-bar" />
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">MB</div>
          <div className="brand-text">
            <h1>Mexbelt — Control de Producción</h1>
            <p>{subtitle || 'Tiempos de proceso en planta'}</p>
          </div>
        </div>
        <div className="topbar-right">
          <span className="clock-chip mono">{clock}</span>
          <Link href="/admin" className="btn btn-outline btn-sm">Admin</Link>
        </div>
      </header>
    </>
  );
}
