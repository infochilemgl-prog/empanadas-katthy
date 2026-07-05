import Stamp from "./Stamp";

export default function Reviews() {
  return (
    <section id="resenas" className="max-w-6xl mx-auto px-5 py-20">
      <div className="flex items-center gap-5 mb-10">
        <Stamp text="RESEÑAS REALES · SIN FILTRO" className="hidden md:flex bg-cream" />
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-leaf mb-2">
            Lo que dice la gente que vuelve
          </p>
          <h2 className="font-display text-2xl md:text-3xl font-semibold">
            Reseñas reales de Google, sin editar
          </h2>
        </div>
      </div>

      <div className="rounded-2xl border border-charcoal/10 p-6 bg-white/40 mb-6">
        <p className="text-sm text-charcoal/60 mb-2">
          [PENDIENTE: insertar 3-4 reseñas reales de Google Maps con nombre y fecha]
        </p>
        <p className="text-xs text-charcoal/40">
          Nunca se inventa una reseña — si todavía no hay suficientes, esta sección
          se reemplaza por el widget en vivo de reseñas de Google.
        </p>
      </div>

      <a
        href="#"
        className="text-sm font-semibold underline hover:text-leaf"
      >
        Ver todas las reseñas en Google Maps →
      </a>
    </section>
  );
}
