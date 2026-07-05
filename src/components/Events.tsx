import SectionWave from "./SectionWave";

export default function Events() {
  return (
    <section id="eventos" className="relative bg-terracotta pt-20 pb-28 md:pb-32 overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute -bottom-24 -left-24 w-[300px] h-[300px] rounded-full bg-mustard/25 blur-3xl"
      />
      <div className="relative max-w-6xl mx-auto px-5 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-cream/70 mb-3">
            Eventos y empresas
          </p>
          <h2 className="font-display text-2xl md:text-3xl font-semibold mb-4 text-cream">
            Cumpleaños, matrimonios, colegios, <span className="italic text-charcoal">empresas</span>
          </h2>
          <p className="text-cream/85 mb-6 max-w-md">
            No hagas malabares el día del evento. Nosotros llevamos la comida,
            tú te encargas de la celebración.
          </p>
          <ul className="text-sm text-cream/85 mb-6 space-y-1.5">
            <li>✓ Cotización según número de personas</li>
            <li>✓ Coordinación de horario de entrega</li>
            <li>✓ Ideal para colegios, clubes y municipalidades</li>
          </ul>
          <a
            href="https://wa.me/56900000000?text=Hola,%20quiero%20cotizar%20catering"
            className="inline-block rounded-full bg-charcoal text-cream px-6 py-3 text-sm font-bold hover:bg-cream hover:text-charcoal transition-colors"
          >
            Solicitar catering
          </a>
        </div>
        <div className="relative mx-auto w-[240px] h-[240px] sm:w-[300px] sm:h-[300px]">
          <div
            aria-hidden="true"
            className="absolute -inset-3 rounded-full border-2 border-dashed border-mustard/60"
          />
          <div className="absolute inset-0 rounded-full bg-cream shadow-2xl flex items-center justify-center text-charcoal/40 text-xs text-center px-6">
            [ Foto real: catering de un evento anterior ]
          </div>
        </div>
      </div>
      <SectionWave fill="#FBF8F0" />
    </section>
  );
}
