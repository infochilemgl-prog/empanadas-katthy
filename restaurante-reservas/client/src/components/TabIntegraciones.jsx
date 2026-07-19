import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CalendarCheck2, Unplug } from 'lucide-react';
import api from '../lib/api.js';
import Button from './ui/Button.jsx';

export default function TabIntegraciones() {
  const queryClient = useQueryClient();
  const [conectando, setConectando] = useState(false);
  const intervaloRef = useRef(null);

  const { data: estado, isLoading } = useQuery({
    queryKey: ['google-status'],
    queryFn: () => api.get('/google/status'),
  });

  useEffect(() => {
    return () => {
      if (intervaloRef.current) clearInterval(intervaloRef.current);
    };
  }, []);

  const mutacionConectar = useMutation({
    mutationFn: () => api.get('/google/auth'),
    onSuccess: ({ url }) => {
      if (!url) {
        toast.error('No se pudo obtener la URL de autenticación.');
        return;
      }
      window.open(url, '_blank', 'width=500,height=700');
      setConectando(true);
      intervaloRef.current = setInterval(async () => {
        try {
          const nuevoEstado = await api.get('/google/status');
          if (nuevoEstado.conectado) {
            clearInterval(intervaloRef.current);
            setConectando(false);
            queryClient.invalidateQueries({ queryKey: ['google-status'] });
            toast.success('Google Calendar conectado.');
          }
        } catch (err) {
          // seguimos esperando, no es un error fatal
        }
      }, 2000);
    },
    onError: (err) => toast.error(err.message || 'No se pudo iniciar la conexión con Google.'),
  });

  const mutacionDesconectar = useMutation({
    mutationFn: () => api.post('/google/disconnect', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-status'] });
      toast.success('Cuenta de Google desconectada.');
    },
    onError: (err) => toast.error(err.message || 'No se pudo desconectar la cuenta.'),
  });

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="rounded-2xl bg-white p-6 shadow-soft">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-oliva/10 text-oliva">
            <CalendarCheck2 size={22} />
          </div>
          <div>
            <h3 className="font-bold text-carbon">Google Calendar</h3>
            <p className="text-xs text-carbon/50">Sincronizá cada reserva confirmada con tu agenda.</p>
          </div>
        </div>

        {isLoading && <p className="text-sm text-carbon/50">Cargando estado...</p>}

        {!isLoading && estado && !estado.conectado && (
          <Button onClick={() => mutacionConectar.mutate()} disabled={mutacionConectar.isPending || conectando}>
            {conectando ? 'Esperando conexión...' : 'Conectar Google Calendar'}
          </Button>
        )}

        {!isLoading && estado && estado.conectado && (
          <div>
            <div className="mb-4 rounded-xl bg-oliva/5 p-3 text-sm">
              <p className="font-semibold text-oliva">Conectado ✅</p>
              <p className="text-carbon/60">{estado.email_cuenta}</p>
              {estado.conectado_en && (
                <p className="text-xs text-carbon/40">Desde {new Date(estado.conectado_en.replace(' ', 'T')).toLocaleDateString('es-UY')}</p>
              )}
            </div>
            <Button variant="peligro" onClick={() => mutacionDesconectar.mutate()} disabled={mutacionDesconectar.isPending}>
              <Unplug size={14} /> Desconectar
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-soft">
        <h3 className="mb-2 font-bold text-carbon">WhatsApp (Twilio)</h3>
        <p className="text-sm text-carbon/60">
          Configurá la URL del webhook en Twilio desde la pestaña <strong>Configuración</strong>. Ahí vas a
          encontrar la URL exacta que hay que pegar en el sandbox o número de WhatsApp de Twilio.
        </p>
      </div>
    </div>
  );
}
