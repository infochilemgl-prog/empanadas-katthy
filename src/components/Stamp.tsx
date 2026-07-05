type StampProps = {
  text?: string;
  className?: string;
};

export default function Stamp({ text = "COMIDA REAL · GENTE REAL", className = "" }: StampProps) {
  return (
    <div
      className={`relative w-24 h-24 shrink-0 rounded-full border-2 border-dashed border-charcoal/70 flex items-center justify-center -rotate-12 ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
        <defs>
          <path id="stampCircle" d="M 50 50 m -34 0 a 34 34 0 1 1 68 0 a 34 34 0 1 1 -68 0" />
        </defs>
        <text fill="#141210" fontSize="7.4" letterSpacing="1.5" fontFamily="Inter, sans-serif" fontWeight="600">
          <textPath href="#stampCircle" startOffset="2%">
            {text} · LIMACHE ·
          </textPath>
        </text>
      </svg>
      <span className="font-display font-semibold text-[10px] leading-tight text-center">
        Desde
        <br />
        siempre
      </span>
    </div>
  );
}
