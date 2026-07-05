const doubts = [
  { q: "¿Será rico?", a: "Recetas tradicionales, sin atajos, hechas todos los días.", chip: "leaf" },
  { q: "¿Alcanzará para todos?", a: "Porciones abundantes — pensadas para compartir en familia.", chip: "yolk" },
  { q: "¿Las fotos serán antiguas?", a: "Lo que ves es lo que se sirve hoy. Nada de stock ni edición.", chip: "yolk" },
  { q: "¿Atenderán bien?", a: "El mismo equipo cercano de siempre — no es una cadena.", chip: "leaf" },
] as const;

export default function Trust() {
  return (
    <section className="bg-charcoal text-cream py-16">
      <div className="max-w-6xl mx-auto px-5">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-yolk mb-3">
          Antes de decidir dónde comer
        </p>
        <h2 className="font-display text-2xl md:text-3xl font-semibold mb-10 max-w-xl">
          Sabemos qué te preguntas antes de elegir un restaurante que no conoces.
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {doubts.map((d) => (
            <div key={d.q} className="flex gap-4 items-start">
              <span
                className={`mt-1 w-3 h-3 rounded-full shrink-0 ${
                  d.chip === "leaf" ? "bg-leaf" : "bg-yolk"
                }`}
                aria-hidden="true"
              />
              <div>
                <p className="text-cream/50 text-sm mb-1">{d.q}</p>
                <p className="text-cream font-medium">{d.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
