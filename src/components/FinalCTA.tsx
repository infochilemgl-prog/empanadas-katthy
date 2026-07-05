export default function FinalCTA() {
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <section className="bg-charcoal text-cream py-16">
      <div className="max-w-3xl mx-auto px-5 text-center">
        <h2 className="font-display text-2xl md:text-3xl font-semibold mb-4">
          Vamos, se ve rico.
        </h2>
        <p className="text-cream/70 mb-8">
          Reserva, pide por WhatsApp o cuéntale a alguien que también tenga hambre.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <a
            href="https://wa.me/56900000000"
            className="rounded-full bg-leaf text-charcoal px-6 py-3 text-sm font-semibold hover:bg-yolk transition-colors"
          >
            Pedir por WhatsApp
          </a>
          <a
            href="#reservar"
            className="rounded-full border-2 border-cream px-6 py-3 text-sm font-semibold hover:bg-cream hover:text-charcoal transition-colors"
          >
            Reservar mesa
          </a>
          <a
            href={`https://wa.me/?text=${encodeURIComponent("Mira este restaurante en Limache: " + shareUrl)}`}
            className="rounded-full border-2 border-cream/30 px-6 py-3 text-sm font-semibold text-cream/70 hover:border-cream hover:text-cream transition-colors"
          >
            Compartir
          </a>
        </div>
      </div>
    </section>
  );
}
