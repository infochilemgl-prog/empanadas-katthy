import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as Tabs from '@radix-ui/react-tabs';
import { MessageSquare, CalendarRange, Settings, Plug, ArrowLeft, Sparkles } from 'lucide-react';
import TabMensajes from '../components/TabMensajes.jsx';
import TabReservas from '../components/TabReservas.jsx';
import TabConfiguracion from '../components/TabConfiguracion.jsx';
import TabIntegraciones from '../components/TabIntegraciones.jsx';

const TABS = [
  { valor: 'mensajes', etiqueta: 'Mensajes', icono: MessageSquare },
  { valor: 'reservas', etiqueta: 'Reservas', icono: CalendarRange },
  { valor: 'configuracion', etiqueta: 'Configuración', icono: Settings },
  { valor: 'integraciones', etiqueta: 'Integraciones', icono: Plug },
];

export default function Dashboard() {
  const [tabActiva, setTabActiva] = useState('mensajes');

  return (
    <div className="min-h-screen bg-crema">
      <header className="border-b border-carbon/10 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="rounded-lg p-2 text-carbon/60 transition-smooth hover:bg-crema hover:text-carbon">
              <ArrowLeft size={18} />
            </Link>
            <div className="flex items-center gap-2 text-lg font-extrabold text-terracota">
              <Sparkles size={20} />
              Panel de Valentina
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <Tabs.Root value={tabActiva} onValueChange={setTabActiva}>
          <Tabs.List className="mb-6 flex flex-wrap gap-2 rounded-2xl bg-white p-2 shadow-soft">
            {TABS.map(({ valor, etiqueta, icono: Icono }) => (
              <Tabs.Trigger
                key={valor}
                value={valor}
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-carbon/60 transition-smooth data-[state=active]:bg-terracota data-[state=active]:text-white hover:text-carbon"
              >
                <Icono size={16} />
                {etiqueta}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          <Tabs.Content value="mensajes">
            <TabMensajes />
          </Tabs.Content>
          <Tabs.Content value="reservas">
            <TabReservas />
          </Tabs.Content>
          <Tabs.Content value="configuracion">
            <TabConfiguracion />
          </Tabs.Content>
          <Tabs.Content value="integraciones">
            <TabIntegraciones />
          </Tabs.Content>
        </Tabs.Root>
      </main>
    </div>
  );
}
