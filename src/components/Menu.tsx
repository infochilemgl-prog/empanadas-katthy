const items = [
  { name: "Empanada de pino", desc: "La receta de siempre, relleno abundante.", price: "[PENDIENTE]" },
  { name: "Menú del día", desc: "Cambia cada día, comida casera de olla.", price: "[PENDIENTE]" },
  { name: "Caja familiar", desc: "Para compartir en casa o en una junta.", price: "[PENDIENTE]" },
];

export default function Menu() {
  return (
    <section id="menu" className="max-w-6xl mx-auto px-5 py-20">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-leaf mb-3">Favoritas de la casa</p>
      <h2 className="font-display text-2xl md:text-3xl font-semibold mb-10 max-w-xl">
        Lo que la gente de Limache pide siempre
      </h2>
      <div className="grid md:grid-cols-3 gap-6">
        {items.map((item) => (
          <div key={item.name} className="rounded-2xl border border-charcoal/10 p-6 bg-white/40">
            <div className="aspect-square rounded-xl bg-charcoal/5 mb-4 flex items-center justify-center text-xs text-charcoal/40">
              [ Foto real ]
            </div>
            <h3 className="font-display text-lg font-semibold mb-1">{item.name}</h3>
            <p className="text-sm text-charcoal/70 mb-3">{item.desc}</p>
            <span className="inline-block rounded-full bg-yolk/30 px-3 py-1 text-sm font-semibold">
              {item.price}
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-charcoal/50 mt-4">
        Precios pendientes de confirmar con el local — no se publica sin dato real.
      </p>
    </section>
  );
}
