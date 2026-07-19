import { Link } from 'react-router-dom';
import { MessageCircle, CalendarCheck, Clock, Sparkles } from 'lucide-react';
import Button from '../components/ui/Button.jsx';

const CARACTERISTICAS = [
  {
    icono: MessageCircle,
    titulo: 'Reservas por WhatsApp',
    descripcion: 'Tus clientes reservan charlando de forma natural, sin apps ni formularios.',
  },
  {
    icono: Clock,
    titulo: 'Disponible 24/7',
    descripcion: 'Valentina responde al instante, incluso fuera del horario de atención.',
  },
  {
    icono: CalendarCheck,
    titulo: 'Sincronizado con tu agenda',
    descripcion: 'Cada reserva confirmada se agenda automáticamente en tu Google Calendar.',
  },
  {
    icono: Sparkles,
    titulo: 'Con la calidez de siempre',
    descripcion: 'Conversaciones cálidas y cercanas, en el mismo tono con el que atendés vos.',
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-crema text-carbon">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2 text-xl font-extrabold text-terracota">
          <Sparkles size={22} />
          Valentina
        </div>
        <Link to="/dashboard">
          <Button variant="primary">Ir al panel</Button>
        </Link>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        <section className="grid grid-cols-1 items-center gap-10 py-16 md:grid-cols-2 md:py-24">
          <div>
            <span className="mb-4 inline-block rounded-full bg-ocre/15 px-4 py-1 text-sm font-semibold text-ocre">
              Anfitriona virtual con IA
            </span>
            <h1 className="mb-5 text-4xl font-extrabold leading-tight text-carbon md:text-5xl">
              Tus reservas, gestionadas por{' '}
              <span className="text-terracota">WhatsApp</span>, las 24 horas.
            </h1>
            <p className="mb-8 text-lg text-carbon/70">
              Valentina es tu anfitriona virtual: charla con tus clientes en español rioplatense,
              confirma disponibilidad en tiempo real y agenda cada reserva sin que vos tengas que
              mover un dedo.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/dashboard">
                <Button variant="primary" className="px-6 py-3 text-base">
                  Ver el panel de control
                </Button>
              </Link>
            </div>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-soft">
            <div className="rounded-2xl bg-oliva/5 p-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-oliva">
                <MessageCircle size={16} /> WhatsApp
              </div>
              <div className="space-y-3">
                <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-terracota px-4 py-2 text-sm text-white">
                  Hola! Quiero reservar para el viernes
                </div>
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-crema px-4 py-2 text-sm text-carbon">
                  ¡Hola! 🍽️ Con gusto te ayudo. ¿Me pasás tu nombre?
                </div>
                <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-terracota px-4 py-2 text-sm text-white">
                  Martina, somos 4
                </div>
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-crema px-4 py-2 text-sm text-carbon">
                  Genial Martina ✨ ¿A qué hora te queda cómodo el viernes?
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
          {CARACTERISTICAS.map(({ icono: Icono, titulo, descripcion }) => (
            <div key={titulo} className="rounded-2xl bg-white p-6 shadow-soft transition-smooth hover:-translate-y-1">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-terracota/10 text-terracota">
                <Icono size={22} />
              </div>
              <h3 className="mb-2 font-bold text-carbon">{titulo}</h3>
              <p className="text-sm text-carbon/60">{descripcion}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-carbon/10 py-8 text-center text-sm text-carbon/50">
        Sistema de reservas por WhatsApp con IA — hecho con cariño para restaurantes.
      </footer>
    </div>
  );
}
