import Stamp from "./Stamp";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full bg-leaf/25 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute top-1/2 -left-32 w-[320px] h-[320px] rounded-full bg-charcoal/10 blur-3xl"
      />

      <div className="relative max-w-6xl mx-auto px-5 pt-14 pb-20 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-leaf mb-4">
            Restaurante familiar · Limache
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-semibold leading-[1.08] mb-5">
            Comida casera,
            <br />
            <span className="text-leaf">como en casa.</span>
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

          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-charcoal/60">
            <li>✓ Años funcionando en Limache</li>
            <li>✓ Clientes que vuelven</li>
            <li>✓ Fotos reales, sin editar</li>
          </ul>
        </div>

        <div className="relative">
          <div className="aspect-[4/3] rounded-[2rem] bg-charcoal/5 border-2 border-leaf/40 shadow-xl flex items-center justify-center text-charcoal/40 text-sm">
            {/* Reemplazar por foto real del local/comida — nunca stock */}
            [ Foto real: mesa servida en el local ]
          </div>
          <Stamp className="absolute -bottom-6 -left-6 bg-cream" />
        </div>
      </div>
    </section>
  );
}
