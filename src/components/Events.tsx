export default function Events() {
  return (
    <section id="eventos" className="bg-leaf py-20">
      <div className="max-w-6xl mx-auto px-5 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-charcoal/70 mb-3">
            Eventos y empresas
          </p>
          <h2 className="font-display text-2xl md:text-3xl font-semibold mb-4 text-charcoal">
            Cumpleaños, matrimonios, colegios, <span className="text-cream">empresas</span>
          </h2>
          <p className="text-charcoal/80 mb-6 max-w-md">
            No hagas malabares el día del evento. Nosotros llevamos la comida,
            tú te encargas de la celebración.
          </p>
          <ul className="text-sm text-charcoal/80 mb-6 space-y-1.5">
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
        <div className="aspect-[4/3] rounded-[2rem] bg-cream shadow-xl flex items-center justify-center text-charcoal/40 text-sm">
          [ Foto real: catering de un evento anterior ]
        </div>
      </div>
    </section>
  );
}
