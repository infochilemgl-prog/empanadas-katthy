import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, List } from 'lucide-react';
import api from '../lib/api.js';
import CalendarioReservas from './CalendarioReservas.jsx';
import ListaReservas from './ListaReservas.jsx';

export default function TabReservas() {
  const [vista, setVista] = useState('calendario');

  const { data: reservas = [], isLoading } = useQuery({
    queryKey: ['reservas'],
    queryFn: () => api.get('/reservas'),
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-carbon">Reservas</h2>
        <div className="flex gap-1 rounded-xl bg-white p-1 shadow-soft">
          <button
            onClick={() => setVista('calendario')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-smooth ${
              vista === 'calendario' ? 'bg-terracota text-white' : 'text-carbon/60 hover:text-carbon'
            }`}
          >
            <CalendarDays size={14} /> Calendario
          </button>
          <button
            onClick={() => setVista('lista')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-smooth ${
              vista === 'lista' ? 'bg-terracota text-white' : 'text-carbon/60 hover:text-carbon'
            }`}
          >
            <List size={14} /> Lista
          </button>
        </div>
      </div>

      {isLoading && <p className="text-sm text-carbon/50">Cargando reservas...</p>}
      {!isLoading && vista === 'calendario' && <CalendarioReservas reservas={reservas} />}
      {!isLoading && vista === 'lista' && <ListaReservas reservas={reservas} />}
    </div>
  );
}
