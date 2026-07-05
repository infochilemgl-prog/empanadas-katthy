import SectionWave from "./SectionWave";

const items = [
  { name: "Empanada de pino", desc: "La receta de siempre, relleno abundante.", price: "[PENDIENTE]", tag: "Favorita", accent: "leaf", featured: false },
  { name: "Menú del día", desc: "Cambia cada día, comida casera de olla.", price: "[PENDIENTE]", tag: "Recomendado", accent: "mustard", featured: true },
  { name: "Caja familiar", desc: "Para compartir en casa o en una junta.", price: "[PENDIENTE]", tag: "Para compartir", accent: "terracotta", featured: false },
] as const;

const tagStyles: Record<(typeof items)[number]["accent"], string> = {
  leaf: "bg-leaf/30 text-charcoal",
  mustard: "bg-mustard text-charcoal",
  terracotta: "bg-terracotta text-cream",
};

export default function Menu() {
  return (
    <section id="menu" className="relative pt-20 pb-28 md:pb-32">
      <div className="max-w-6xl mx-auto px-5">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-leaf mb-3">Favoritas de la casa</p>
        <h2 className="font-display text-2xl md:text-3xl font-semibold mb-14 max-w-xl">
          Lo que la gente de Limache pide siempre
        </h2>
        <div className="grid sm:grid-cols-3 gap-x-6 gap-y-10 items-start">
          {items.map((item) => (
            <div
              key={item.name}
              className={`relative rounded-3xl border border-charcoal/10 bg-white/60 pt-16 pb-6 px-5 text-center ${
                item.featured ? "sm:-translate-y-6 shadow-xl" : "shadow-sm"
              }`}
            >
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full bg-charcoal/5 border-4 border-cream shadow-md flex items-center justify-center text-[10px] text-charcoal/40 text-center px-2">
                [ Foto real ]
              </div>
              <span
                className={`inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide mb-3 ${tagStyles[item.accent]}`}
              >
                {item.tag}
              </span>
              <h3 className="font-display text-lg font-semibold mb-1">{item.name}</h3>
              <p className="text-sm text-charcoal/70 mb-4">{item.desc}</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-sm font-semibold text-charcoal/50">{item.price}</span>
                <span
                  aria-hidden="true"
                  className="w-8 h-8 rounded-full bg-leaf text-charcoal flex items-center justify-center text-lg font-bold leading-none"
                >
                  +
                </span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-charcoal/50 mt-10">
          Precios pendientes de confirmar con el local — no se publica sin dato real.
        </p>
      </div>
      <SectionWave fill="#C1502E" />
    </section>
  );
}
