import { forwardRef } from 'react';

export const Input = forwardRef(function Input({ className = '', ...props }, ref) {
  return (
    <input
      ref={ref}
      className={`w-full rounded-lg border border-carbon/15 bg-white px-3 py-2 text-sm text-carbon placeholder:text-carbon/40 outline-none transition-smooth focus:border-terracota focus:ring-2 focus:ring-terracota/20 ${className}`}
      {...props}
    />
  );
});

export const Textarea = forwardRef(function Textarea({ className = '', ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={`w-full rounded-lg border border-carbon/15 bg-white px-3 py-2 text-sm text-carbon placeholder:text-carbon/40 outline-none transition-smooth focus:border-terracota focus:ring-2 focus:ring-terracota/20 ${className}`}
      {...props}
    />
  );
});

export const Label = ({ children, className = '', ...props }) => (
  <label className={`mb-1 block text-sm font-medium text-carbon/80 ${className}`} {...props}>
    {children}
  </label>
);

export default Input;
