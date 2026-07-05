import Stamp from "./Stamp";

const badges = [
  { icon: "📍", label: "Años en Limache" },
  { icon: "🔁", label: "Clientes que vuelven" },
  { icon: "📷", label: "Fotos reales, sin editar" },
] as const;

export default function Hero() {
  return (
    <section className="relative overflow-hidden pb-10 md:pb-14">
      <div
        aria-hidden="true"
        className="absolute -top-32 -right-40 w-[520px] h-[520px] rounded-full bg-leaf/25 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute top-1/3 -left-40 w-[360px] h-[360px] rounded-full bg-charcoal/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-0 right-1/4 w-[220px] h-[220px] rounded-full bg-terracotta/15 blur-2xl"
      />

      <div className="relative max-w-6xl mx-auto px-5 pt-14 grid md:grid-cols-2 gap-14 items-center">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-leaf mb-4">
            Restaurante familiar · Limache
          </p>
          <h1 className="font-display text-4xl md:text-6xl font-semibold leading-[1.05] mb-5">
            Comida casera,
            <br />
            <span className="text-leaf italic">como en casa.</span>
          </h1>
          <p className="text-base md:text-lg text-charcoal/75 leading-relaxed mb-8 max-w-md">
            Comida casera abundante, atención cercana y el mismo sabor de siempre —
            para almorzar en familia, celebrar un evento o pedir a domicilio.
          </p>

          <div className="flex flex-wrap gap-3 mb-8">
            <a
              href="#reservar"
              className="rounded-full bg-leaf text-charcoal px-6 py-3 text-sm font-bold hover:bg-charcoal hover:text-cream transition-colors"
            >
              Reservar mesa
            </a>
            <a
              href="https://wa.me/56900000000"
              className="rounded-full border-2 border-charcoal px-6 py-3 text-sm font-semibold hover:bg-charcoal hover:text-cream transition-colors"
            >
              Pedir por WhatsApp
            </a>
          </div>

          <div className="flex flex-wrap gap-2">
            {badges.map((b) => (
              <span
                key={b.label}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/70 border border-charcoal/10 px-3 py-1.5 text-xs font-semibold text-charcoal/70"
              >
                <span aria-hidden="true">{b.icon}</span>
                {b.label}
              </span>
            ))}
          </div>
        </div>

        <div className="relative flex justify-center md:justify-end">
          <div className="relative w-[280px] h-[280px] sm:w-[340px] sm:h-[340px] md:w-[400px] md:h-[400px]">
            <div
              aria-hidden="true"
              className="absolute -inset-3 rounded-full border-2 border-dashed border-leaf/50"
            />
            <div className="absolute inset-0 rounded-full bg-charcoal/5 shadow-2xl flex items-center justify-center text-charcoal/40 text-sm text-center px-6 overflow-hidden">
              {/* Reemplazar por foto real del local/comida, recortada en círculo — nunca stock */}
              [ Foto real: plato servido, recortado en círculo ]
            </div>
            <span
              aria-hidden="true"
              className="absolute top-3 -right-2 w-9 h-9 rounded-full bg-leaf flex items-center justify-center text-charcoal text-base shadow-lg"
            >
              🌿
            </span>
            <Stamp className="absolute -bottom-4 -left-4 bg-cream shadow-lg" />
          </div>
        </div>
      </div>
    </section>
  );
}
