import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, XCircle } from 'lucide-react';
import api from '../lib/api.js';

const ESTADOS = ['todas', 'confirmada', 'cancelada', 'completada'];

const ESTADO_ESTILOS = {
  confirmada: 'bg-oliva/15 text-oliva',
  cancelada: 'bg-red-100 text-red-600',
  completada: 'bg-carbon/10 text-carbon/60',
};

export default function ListaReservas({ reservas }) {
  const [filtro, setFiltro] = useState('todas');
  const queryClient = useQueryClient();

  const mutacionEstado = useMutation({
    mutationFn: ({ id, estado }) => api.put(`/reservas/${id}/estado`, { estado }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservas'] });
      toast.success('Reserva actualizada.');
    },
    onError: (err) => toast.error(err.message || 'No se pudo actualizar la reserva.'),
  });

  const reservasFiltradas =
    filtro === 'todas' ? reservas : reservas.filter((r) => r.estado === filtro);

  return (
    <div className="rounded-2xl bg-white p-4 shadow-soft">
      <div className="mb-4 flex flex-wrap gap-2">
        {ESTADOS.map((estado) => (
          <button
            key={estado}
            onClick={() => setFiltro(estado)}
            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition-smooth ${
              filtro === estado ? 'bg-terracota text-white' : 'bg-crema text-carbon/60 hover:text-carbon'
            }`}
          >
            {estado}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-carbon/10 text-xs uppercase text-carbon/40">
              <th className="py-2 pr-3">ID</th>
              <th className="py-2 pr-3">Cliente</th>
              <th className="py-2 pr-3">Personas</th>
              <th className="py-2 pr-3">Fecha / Hora</th>
              <th className="py-2 pr-3">Estado</th>
              <th className="py-2 pr-3">Especificaciones</th>
              <th className="py-2 pr-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {reservasFiltradas.map((r) => (
              <tr key={r.id} className="border-b border-carbon/5 align-top">
                <td className="py-3 pr-3 text-carbon/50">#{r.id}</td>
                <td className="py-3 pr-3 font-semibold text-carbon">
                  {r.nombre_cliente}
                  <div className="text-xs font-normal text-carbon/40">{r.numero_telefono}</div>
                </td>
                <td className="py-3 pr-3">{r.cantidad_personas}</td>
                <td className="py-3 pr-3">
                  {new Date(r.fecha_reserva.replace(' ', 'T')).toLocaleString('es-UY', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="py-3 pr-3">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${ESTADO_ESTILOS[r.estado] || ''}`}>
                    {r.estado}
                  </span>
                </td>
                <td className="max-w-[200px] py-3 pr-3 text-xs text-carbon/60">{r.especificaciones || '—'}</td>
                <td className="py-3 pr-3">
                  <div className="flex gap-2">
                    {r.estado === 'confirmada' && (
                      <>
                        <button
                          title="Marcar como completada"
                          onClick={() => mutacionEstado.mutate({ id: r.id, estado: 'completada' })}
                          className="rounded-lg p-1.5 text-oliva transition-smooth hover:bg-oliva/10"
                        >
                          <CheckCircle2 size={18} />
                        </button>
                        <button
                          title="Cancelar reserva"
                          onClick={() => mutacionEstado.mutate({ id: r.id, estado: 'cancelada' })}
                          className="rounded-lg p-1.5 text-red-500 transition-smooth hover:bg-red-50"
                        >
                          <XCircle size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {reservasFiltradas.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-carbon/40">
                  No hay reservas para mostrar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
