import SectionWave from "./SectionWave";

export default function Location() {
  return (
    <section id="ubicacion" className="relative pt-20 pb-28 md:pb-32">
      <div className="max-w-6xl mx-auto px-5 grid md:grid-cols-2 gap-10">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-leaf mb-3">Ubicación y horarios</p>
          <h2 className="font-display text-2xl md:text-3xl font-semibold mb-5">
            Fácil de llegar, fácil de reconocer
          </h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-charcoal/50">Dirección</dt>
              <dd className="font-medium">[PENDIENTE: dirección real, Limache]</dd>
            </div>
            <div>
              <dt className="text-charcoal/50">Horario</dt>
              <dd className="font-medium">[PENDIENTE: horario real]</dd>
            </div>
            <div>
              <dt className="text-charcoal/50">Teléfono</dt>
              <dd className="font-medium">[PENDIENTE]</dd>
            </div>
          </dl>
          <a href="#" className="inline-block mt-6 text-sm font-semibold underline hover:text-leaf">
            Ver en Google Maps →
          </a>
        </div>
        <div id="reservar" className="rounded-2xl border border-charcoal/10 p-6 bg-white/40">
          <h3 className="font-display text-lg font-semibold mb-3">Reservar mesa</h3>
          <p className="text-sm text-charcoal/60 mb-4">
            La forma más rápida es por WhatsApp — te confirmamos al momento.
          </p>
          <a
            href="https://wa.me/56900000000?text=Hola,%20quiero%20reservar%20una%20mesa"
            className="inline-block w-full text-center rounded-full bg-charcoal text-cream px-6 py-3 text-sm font-semibold hover:bg-leaf hover:text-charcoal transition-colors"
          >
            Reservar por WhatsApp
          </a>
        </div>
      </div>
      <SectionWave fill="#141210" />
    </section>
  );
}
