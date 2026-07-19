import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageCircle, User, Bot } from 'lucide-react';
import api from '../lib/api.js';

function formatearFechaHora(fecha) {
  if (!fecha) return '';
  return new Date(fecha.replace(' ', 'T')).toLocaleString('es-UY', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TabMensajes() {
  const [numeroSeleccionado, setNumeroSeleccionado] = useState(null);

  const { data: conversaciones = [], isLoading } = useQuery({
    queryKey: ['mensajes'],
    queryFn: () => api.get('/mensajes'),
    refetchInterval: 10_000,
  });

  const { data: historial = [] } = useQuery({
    queryKey: ['mensajes', numeroSeleccionado],
    queryFn: () => api.get(`/mensajes/${encodeURIComponent(numeroSeleccionado)}`),
    enabled: Boolean(numeroSeleccionado),
    refetchInterval: numeroSeleccionado ? 5_000 : false,
  });

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="rounded-2xl bg-white p-3 shadow-soft md:col-span-1">
        <h3 className="mb-3 px-2 text-sm font-bold text-carbon/70">Conversaciones</h3>
        {isLoading && <p className="px-2 text-sm text-carbon/50">Cargando...</p>}
        {!isLoading && conversaciones.length === 0 && (
          <p className="px-2 text-sm text-carbon/50">Todavía no llegaron mensajes por WhatsApp.</p>
        )}
        <ul className="space-y-1">
          {conversaciones.map((c) => (
            <li key={c.numero_telefono}>
              <button
                onClick={() => setNumeroSeleccionado(c.numero_telefono)}
                className={`w-full rounded-xl px-3 py-2 text-left transition-smooth ${
                  numeroSeleccionado === c.numero_telefono ? 'bg-terracota/10' : 'hover:bg-crema'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-carbon">{c.numero_telefono}</span>
                  <span className="text-xs text-carbon/40">{formatearFechaHora(c.ultimo_mensaje_en)}</span>
                </div>
                <p className="truncate text-xs text-carbon/60">{c.ultimo_mensaje}</p>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-soft md:col-span-2">
        {!numeroSeleccionado && (
          <div className="flex h-64 flex-col items-center justify-center text-carbon/40">
            <MessageCircle size={32} />
            <p className="mt-2 text-sm">Elegí una conversación para ver el historial.</p>
          </div>
        )}
        {numeroSeleccionado && (
          <div>
            <h3 className="mb-4 text-sm font-bold text-carbon/70">{numeroSeleccionado}</h3>
            <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
              {historial.map((m) => (
                <div key={m.id} className={`flex ${m.remitente === 'agente' ? 'justify-start' : 'justify-end'}`}>
                  <div
                    className={`flex max-w-[80%] items-start gap-2 rounded-2xl px-4 py-2 text-sm ${
                      m.remitente === 'agente'
                        ? 'rounded-tl-sm bg-crema text-carbon'
                        : 'rounded-tr-sm bg-terracota text-white'
                    }`}
                  >
                    {m.remitente === 'agente' ? <Bot size={14} className="mt-0.5 shrink-0" /> : <User size={14} className="mt-0.5 shrink-0" />}
                    <div>
                      <p>{m.contenido_mensaje}</p>
                      <span className="mt-1 block text-[10px] opacity-60">{formatearFechaHora(m.recibido_en)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
