import SectionWave from "./SectionWave";

const doubts = [
  { icon: "🍲", q: "¿Será rico?", a: "Recetas tradicionales, sin atajos, hechas todos los días.", chip: "leaf" },
  { icon: "🍽️", q: "¿Alcanzará para todos?", a: "Porciones abundantes — pensadas para compartir en familia.", chip: "cream" },
  { icon: "📷", q: "¿Las fotos serán antiguas?", a: "Lo que ves es lo que se sirve hoy. Nada de stock ni edición.", chip: "leaf" },
  { icon: "🤝", q: "¿Atenderán bien?", a: "El mismo equipo cercano de siempre — no es una cadena.", chip: "cream" },
] as const;

export default function Trust() {
  return (
    <section className="relative bg-charcoal text-cream pt-16 pb-24 md:pb-28">
      <div className="max-w-6xl mx-auto px-5">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-leaf mb-3">
          Antes de decidir dónde comer
        </p>
        <h2 className="font-display text-2xl md:text-4xl font-semibold mb-10 max-w-xl">
          Sabemos qué te preguntas antes de elegir un restaurante que{" "}
          <span className="italic text-leaf">no conoces</span>.
        </h2>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-9">
          {doubts.map((d) => (
            <div key={d.q} className="flex gap-4 items-start">
              <span
                className={`flex items-center justify-center w-11 h-11 rounded-full text-lg shrink-0 ${
                  d.chip === "leaf" ? "bg-leaf" : "bg-cream"
                }`}
                aria-hidden="true"
              >
                {d.icon}
              </span>
              <div>
                <p className="text-cream/50 text-sm mb-1">{d.q}</p>
                <p className="text-cream font-medium">{d.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <SectionWave fill="#FBF8F0" />
    </section>
  );
}
