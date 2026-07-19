import { forwardRef } from 'react';

const VARIANTES = {
  primary: 'bg-terracota text-white hover:bg-terracota/90 shadow-soft',
  secondary: 'bg-white text-carbon border border-carbon/10 hover:bg-crema',
  oliva: 'bg-oliva text-white hover:bg-oliva/90 shadow-soft',
  peligro: 'bg-red-600 text-white hover:bg-red-700',
  fantasma: 'bg-transparent text-carbon hover:bg-carbon/5',
};

const Button = forwardRef(function Button(
  { variant = 'primary', className = '', children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-smooth disabled:opacity-50 disabled:cursor-not-allowed ${
        VARIANTES[variant] || VARIANTES.primary
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});

export default Button;
