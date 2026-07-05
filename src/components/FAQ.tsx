const faqs = [
  { q: "¿Hacen delivery?", a: "Sí, dentro de Limache. [PENDIENTE: confirmar zonas y costo real]" },
  { q: "¿Reciben reservas?", a: "Sí, por WhatsApp o teléfono, sobre todo fin de semana." },
  { q: "¿Hacen catering para eventos?", a: "Sí — cumpleaños, empresas, colegios y matrimonios. Cotización según cantidad de personas." },
  { q: "¿Tienen opciones para grupos grandes?", a: "Sí, cajas familiares y menús para eventos." },
];

export default function FAQ() {
  return (
    <section className="bg-charcoal/[0.03] py-20">
      <div className="max-w-3xl mx-auto px-5">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-leaf mb-3">Preguntas frecuentes</p>
        <h2 className="font-display text-2xl md:text-3xl font-semibold mb-8">
          Antes de que preguntes
        </h2>
        <div className="space-y-5">
          {faqs.map((f) => (
            <div key={f.q} className="border-b border-charcoal/10 pb-5">
              <p className="font-semibold mb-1">{f.q}</p>
              <p className="text-sm text-charcoal/70">{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
