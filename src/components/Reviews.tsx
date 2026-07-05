import Stamp from "./Stamp";

const stars = [1, 2, 3, 4, 5];

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
            Reseñas reales de Google, <span className="italic text-leaf">sin editar</span>
          </h2>
        </div>
      </div>

      <div className="grid md:grid-cols-[2fr_1fr] gap-6 items-stretch">
        <div className="rounded-3xl border border-charcoal/10 bg-white/50 p-7 md:p-8">
          <span className="font-display text-6xl text-leaf leading-none" aria-hidden="true">
            "
          </span>
          <p className="font-display text-lg md:text-xl italic text-charcoal/80 leading-snug -mt-3 mb-6">
            [PENDIENTE: reseña real de Google Maps — se copia tal cual, con nombre y fecha]
          </p>
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-full bg-charcoal/10 flex items-center justify-center text-[10px] text-charcoal/40 shrink-0">
              [PENDIENTE]
            </span>
            <div>
              <p className="text-sm font-semibold">[PENDIENTE: nombre]</p>
              <div className="flex gap-0.5 text-leaf text-sm" aria-hidden="true">
                {stars.map((s) => (
                  <span key={s}>★</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-leaf p-7 flex flex-col justify-center gap-4">
          <p className="text-sm text-charcoal/70 leading-relaxed">
            Nunca se inventa una reseña. Si todavía no hay suficientes reales,
            esta tarjeta se reemplaza por el widget en vivo de Google.
          </p>
          <a
            href="#"
            className="inline-block text-sm font-bold text-charcoal underline underline-offset-2"
          >
            Ver todas en Google Maps →
          </a>
        </div>
      </div>
    </section>
  );
}
