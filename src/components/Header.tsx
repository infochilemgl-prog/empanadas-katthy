export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-cream/95 backdrop-blur border-b border-charcoal/10">
      <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between">
        <a href="#" className="font-display text-xl font-semibold tracking-tight">
          Empanadas <span className="text-leaf">Katty</span>
        </a>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <a href="#menu" className="hover:text-leaf transition-colors">Menú</a>
          <a href="#eventos" className="hover:text-leaf transition-colors">Eventos y catering</a>
          <a href="#resenas" className="hover:text-leaf transition-colors">Reseñas</a>
          <a href="#ubicacion" className="hover:text-leaf transition-colors">Ubicación</a>
        </nav>
        <a
          href="https://wa.me/56900000000"
          className="inline-flex items-center gap-2 rounded-full bg-charcoal text-cream px-4 py-2 text-sm font-semibold hover:bg-leaf hover:text-charcoal transition-colors"
        >
          WhatsApp
        </a>
      </div>
    </header>
  );
}
