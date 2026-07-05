type SectionWaveProps = {
  fill: string;
  flip?: boolean;
};

export default function SectionWave({ fill, flip = false }: SectionWaveProps) {
  return (
    <div
      aria-hidden="true"
      className={`absolute bottom-0 left-0 right-0 leading-none pointer-events-none ${
        flip ? "rotate-180" : ""
      }`}
      style={{ transform: flip ? "rotate(180deg)" : undefined }}
    >
      <svg
        viewBox="0 0 1440 100"
        preserveAspectRatio="none"
        className="w-full h-[46px] md:h-[80px]"
      >
        <path
          d="M0,40 C240,100 480,0 720,36 C960,72 1200,10 1440,46 L1440,100 L0,100 Z"
          fill={fill}
        />
      </svg>
    </div>
  );
}
