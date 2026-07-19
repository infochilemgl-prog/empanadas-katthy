import { useMemo, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Users, Clock } from 'lucide-react';

const ESTADO_ESTILOS = {
  confirmada: 'bg-oliva/15 text-oliva',
  cancelada: 'bg-red-100 text-red-600',
  completada: 'bg-carbon/10 text-carbon/60',
};

export default function CalendarioReservas({ reservas }) {
  const [diaSeleccionado, setDiaSeleccionado] = useState(new Date());

  const fechasConReserva = useMemo(() => {
    return reservas
      .filter((r) => r.estado !== 'cancelada')
      .map((r) => parseISO(r.fecha_reserva.replace(' ', 'T')));
  }, [reservas]);

  const reservasDelDia = useMemo(() => {
    return reservas
      .filter((r) => isSameDay(parseISO(r.fecha_reserva.replace(' ', 'T')), diaSeleccionado))
      .sort((a, b) => a.fecha_reserva.localeCompare(b.fecha_reserva));
  }, [reservas, diaSeleccionado]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="rounded-2xl bg-white p-4 shadow-soft lg:col-span-2">
        <DayPicker
          mode="single"
          locale={es}
          selected={diaSeleccionado}
          onSelect={(dia) => dia && setDiaSeleccionado(dia)}
          modifiers={{ conReserva: fechasConReserva }}
          modifiersClassNames={{
            conReserva: 'font-bold text-terracota underline decoration-2 decoration-ocre',
            selected: '!bg-terracota !text-white',
          }}
        />
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-soft">
        <h3 className="mb-1 text-sm font-bold text-carbon/70">
          {format(diaSeleccionado, "EEEE d 'de' MMMM", { locale: es })}
        </h3>
        <p className="mb-4 text-xs text-carbon/40">{reservasDelDia.length} reserva(s)</p>
        <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
          {reservasDelDia.length === 0 && (
            <p className="text-sm text-carbon/40">No hay reservas este día.</p>
          )}
          {reservasDelDia.map((r) => (
            <div key={r.id} className="rounded-xl border border-carbon/10 p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="font-semibold text-carbon">{r.nombre_cliente}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${ESTADO_ESTILOS[r.estado] || ''}`}>
                  {r.estado}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-carbon/60">
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {r.fecha_reserva.split(/[T ]/)[1]?.slice(0, 5)}
                </span>
                <span className="flex items-center gap-1">
                  <Users size={12} />
                  {r.cantidad_personas}
                </span>
              </div>
              {r.especificaciones && <p className="mt-1 text-xs text-carbon/50">{r.especificaciones}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
