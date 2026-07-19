import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Copy } from 'lucide-react';
import api from '../lib/api.js';
import { Input, Textarea, Label } from './ui/Input.jsx';
import Button from './ui/Button.jsx';

const DIAS = [
  { valor: 1, etiqueta: 'Lun' },
  { valor: 2, etiqueta: 'Mar' },
  { valor: 3, etiqueta: 'Mié' },
  { valor: 4, etiqueta: 'Jue' },
  { valor: 5, etiqueta: 'Vie' },
  { valor: 6, etiqueta: 'Sáb' },
  { valor: 0, etiqueta: 'Dom' },
];

export default function TabConfiguracion() {
  const queryClient = useQueryClient();
  const { data: config, isLoading } = useQuery({
    queryKey: ['configuracion'],
    queryFn: () => api.get('/configuracion'),
  });

  const [form, setForm] = useState(null);

  useEffect(() => {
    if (config) {
      setForm({ ...config, dias_cerrado: JSON.parse(config.dias_cerrado || '[]') });
    }
  }, [config]);

  const mutacion = useMutation({
    mutationFn: (datos) => api.put('/configuracion', datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracion'] });
      toast.success('Configuración guardada.');
    },
    onError: (err) => toast.error(err.message || 'No se pudo guardar la configuración.'),
  });

  if (isLoading || !form) {
    return <p className="text-sm text-carbon/50">Cargando configuración...</p>;
  }

  const actualizarCampo = (campo, valor) => setForm((prev) => ({ ...prev, [campo]: valor }));

  const alternarDiaCerrado = (dia) => {
    setForm((prev) => {
      const yaEsta = prev.dias_cerrado.includes(dia);
      const nuevos = yaEsta ? prev.dias_cerrado.filter((d) => d !== dia) : [...prev.dias_cerrado, dia];
      return { ...prev, dias_cerrado: nuevos };
    });
  };

  const guardar = (e) => {
    e.preventDefault();
    mutacion.mutate(form);
  };

  const webhookUrl = `${form.webhook_url || window.location.origin}/api/webhook/whatsapp`;

  const copiarWebhook = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      toast.success('URL copiada al portapapeles.');
    } catch (err) {
      toast.error('No se pudo copiar la URL.');
    }
  };

  return (
    <form onSubmit={guardar} className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-soft">
        <h2 className="mb-4 text-lg font-bold text-carbon">Datos del restaurante</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Nombre del restaurante</Label>
            <Input value={form.nombre_restaurante || ''} onChange={(e) => actualizarCampo('nombre_restaurante', e.target.value)} />
          </div>
          <div>
            <Label>Teléfono</Label>
            <Input value={form.telefono || ''} onChange={(e) => actualizarCampo('telefono', e.target.value)} />
          </div>
          <div>
            <Label>Dirección</Label>
            <Input value={form.direccion || ''} onChange={(e) => actualizarCampo('direccion', e.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={form.email || ''} onChange={(e) => actualizarCampo('email', e.target.value)} />
          </div>
          <div>
            <Label>Tipo de cocina</Label>
            <Input value={form.tipo_cocina || ''} onChange={(e) => actualizarCampo('tipo_cocina', e.target.value)} />
          </div>
          <div>
            <Label>Horarios (texto libre)</Label>
            <Input value={form.horarios || ''} onChange={(e) => actualizarCampo('horarios', e.target.value)} />
          </div>
        </div>
        <div className="mt-4">
          <Label>Sobre el restaurante</Label>
          <Textarea rows={3} value={form.sobre_restaurante || ''} onChange={(e) => actualizarCampo('sobre_restaurante', e.target.value)} />
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-soft">
        <h2 className="mb-4 text-lg font-bold text-carbon">Capacidad y reservas</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label>Capacidad total</Label>
            <Input
              type="number"
              min={1}
              value={form.capacidad_total}
              onChange={(e) => actualizarCampo('capacidad_total', Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Duración de la reserva (min)</Label>
            <Input
              type="number"
              min={15}
              step={15}
              value={form.duracion_reserva_min}
              onChange={(e) => actualizarCampo('duracion_reserva_min', Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Intervalo entre horarios (min)</Label>
            <Input
              type="number"
              min={5}
              step={5}
              value={form.intervalo_slots_min}
              onChange={(e) => actualizarCampo('intervalo_slots_min', Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-soft">
        <h2 className="mb-4 text-lg font-bold text-carbon">Horarios de servicio</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Apertura almuerzo</Label>
            <Input type="time" value={form.hora_apertura_almuerzo || ''} onChange={(e) => actualizarCampo('hora_apertura_almuerzo', e.target.value)} />
          </div>
          <div>
            <Label>Cierre almuerzo</Label>
            <Input type="time" value={form.hora_cierre_almuerzo || ''} onChange={(e) => actualizarCampo('hora_cierre_almuerzo', e.target.value)} />
          </div>
          <div>
            <Label>Apertura cena</Label>
            <Input type="time" value={form.hora_apertura_cena || ''} onChange={(e) => actualizarCampo('hora_apertura_cena', e.target.value)} />
          </div>
          <div>
            <Label>Cierre cena</Label>
            <Input type="time" value={form.hora_cierre_cena || ''} onChange={(e) => actualizarCampo('hora_cierre_cena', e.target.value)} />
          </div>
        </div>

        <div className="mt-4">
          <Label>Días cerrado</Label>
          <div className="flex flex-wrap gap-2">
            {DIAS.map((d) => (
              <button
                type="button"
                key={d.valor}
                onClick={() => alternarDiaCerrado(d.valor)}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-smooth ${
                  form.dias_cerrado.includes(d.valor) ? 'bg-terracota text-white' : 'bg-crema text-carbon/60 hover:text-carbon'
                }`}
              >
                {d.etiqueta}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-2xl bg-white p-6 shadow-soft">
        <div className="max-w-lg">
          <h3 className="mb-1 text-sm font-bold text-carbon/70">URL del webhook de WhatsApp</h3>
          <p className="break-all rounded-lg bg-crema px-3 py-2 text-xs text-carbon/70">{webhookUrl}</p>
        </div>
        <Button type="button" variant="secondary" onClick={copiarWebhook}>
          <Copy size={14} /> Copiar
        </Button>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={mutacion.isPending}>
          {mutacion.isPending ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </form>
  );
}
