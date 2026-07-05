import SectionWave from "./SectionWave";

const services = [
  { icon: "🥡", label: "Retiro en local", accent: "leaf" },
  { icon: "🛵", label: "Delivery en Limache", accent: "terracotta" },
  { icon: "📅", label: "Reservas", accent: "mustard" },
  { icon: "🎉", label: "Catering para eventos", accent: "leaf" },
] as const;

const accentBg: Record<(typeof services)[number]["accent"], string> = {
  leaf: "bg-leaf/25",
  terracotta: "bg-terracotta/20",
  mustard: "bg-mustard/30",
};

export default function Services() {
  return (
    <section className="relative bg-cream pb-16 md:pb-24">
      <div className="max-w-6xl mx-auto px-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {services.map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center text-center gap-2 rounded-2xl border border-charcoal/10 bg-white/60 py-6 px-3 shadow-sm"
            >
              <span
                className={`w-11 h-11 rounded-full flex items-center justify-center text-xl ${accentBg[s.accent]}`}
                aria-hidden="true"
              >
                {s.icon}
              </span>
              <span className="text-xs font-semibold text-charcoal/80">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
      <SectionWave fill="#141210" />
    </section>
  );
}
