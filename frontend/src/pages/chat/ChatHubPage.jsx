/* Hub global de Chat — accesible desde la barra izquierda.
   Lista todos mis eventos; al elegir uno se abre su chat (ChatTab). */

import { useEffect, useState } from 'react';
import { eventosApi } from '../../api/eventos.js';
import { useToast } from '../../context/ToastContext.jsx';
import GLoader from '../../components/ui/GLoader.jsx';
import ChatTab from '../events/tabs/ChatTab.jsx';

export default function ChatHubPage() {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel]         = useState(null);
  const [q, setQ]             = useState('');
  const { error: toastErr }   = useToast();

  useEffect(() => {
    eventosApi.list({ limit: 100, page: 1 })
      .then(d => {
        const evs = d.eventos || [];
        setEventos(evs);
        if (evs.length) setSel(evs[0]);
      })
      .catch(e => toastErr(e.message))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  if (loading) return <GLoader message="Cargando tus chats..." />;

  const filtrados = q
    ? eventos.filter(e => (e.titulo || '').toLowerCase().includes(q.toLowerCase()))
    : eventos;

  return (
    <div className="max-w-[1500px] mx-auto h-[calc(100vh-7rem)] flex gap-4">

      {/* Lista de eventos */}
      <aside className="w-[260px] flex-shrink-0 flex flex-col rounded-3xl border border-border-2
                        bg-surface/70 overflow-hidden">
        <div className="px-4 py-4 border-b border-border">
          <h1 className="text-lg font-display font-bold text-text-1">Mensajes</h1>
          <p className="text-xs text-text-3 mt-0.5">Chat de equipo de tus eventos</p>
          <input
            value={q} onChange={e => setQ(e.target.value)}
            placeholder="Buscar evento…"
            className="mt-3 w-full rounded-xl bg-surface border border-border px-3 py-2 text-sm
                       text-text-1 placeholder:text-text-3 focus:outline-none focus:border-primary/60"
          />
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtrados.length === 0 ? (
            <p className="px-3 py-6 text-sm text-text-3 text-center">No hay eventos.</p>
          ) : filtrados.map(ev => (
            <button
              key={ev.id}
              onClick={() => setSel(ev)}
              className={`w-full text-left rounded-xl px-3 py-2.5 transition border
                ${sel?.id === ev.id
                  ? 'bg-surface-2 border-primary/40'
                  : 'border-transparent hover:bg-surface-2'}`}
            >
              <p className="text-sm font-medium text-text-1 truncate">{ev.titulo}</p>
              <p className="text-[11px] text-text-3 mt-0.5 capitalize">{ev.estado}</p>
            </button>
          ))}
        </div>
      </aside>

      {/* Chat del evento seleccionado */}
      <div className="flex-1 min-w-0 rounded-3xl border border-border-2 bg-surface/70 overflow-hidden">
        {sel ? (
          <div className="h-full overflow-y-auto p-4 sm:p-5">
            <div className="mb-4">
              <h2 className="text-xl font-display font-bold text-text-1">{sel.titulo}</h2>
              <p className="text-xs text-text-3">Chat del equipo</p>
            </div>
            <ChatTab key={sel.id} evento={sel} />
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center text-text-3 gap-3 p-6">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.4" className="text-text-3/60">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-sm max-w-[240px]">Crea un evento para empezar a chatear con tu equipo.</p>
          </div>
        )}
      </div>
    </div>
  );
}
