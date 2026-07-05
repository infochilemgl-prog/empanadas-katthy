import Stamp from "./Stamp";

export default function Hero() {
  return (
    <section className="relative max-w-6xl mx-auto px-5 pt-14 pb-20 grid md:grid-cols-2 gap-10 items-center">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-leaf mb-4">
          Restaurante familiar · Limache
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-semibold leading-[1.08] mb-5">
          Aquí no prometemos que es rico.
          <br />
          Lo llevamos años demostrando.
        </h1>
        <p className="text-base md:text-lg text-charcoal/75 leading-relaxed mb-8 max-w-md">
          Comida casera abundante, atención cercana y el mismo sabor de siempre —
          para almorzar en familia, celebrar un evento o pedir a domicilio.
        </p>

        <div className="flex flex-wrap gap-3 mb-8">
          <a
            href="#reservar"
            className="rounded-full bg-charcoal text-cream px-6 py-3 text-sm font-semibold hover:bg-leaf hover:text-charcoal transition-colors"
          >
            Reservar mesa
          </a>
          <a
            href="https://wa.me/56900000000"
            className="rounded-full border-2 border-charcoal px-6 py-3 text-sm font-semibold hover:bg-yolk hover:border-yolk transition-colors"
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
        <div className="aspect-[4/3] rounded-2xl bg-charcoal/5 border border-charcoal/10 flex items-center justify-center text-charcoal/40 text-sm">
          {/* Reemplazar por foto real del local/comida — nunca stock */}
          [ Foto real: mesa servida en el local ]
        </div>
        <Stamp className="absolute -bottom-6 -left-6 bg-cream" />
      </div>
    </section>
  );
}
