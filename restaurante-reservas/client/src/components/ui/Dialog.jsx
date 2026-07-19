import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

export function Dialog({ open, onOpenChange, title, children, footer }) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 bg-carbon/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in" />
        <RadixDialog.Content className="fixed left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-soft focus:outline-none">
          <div className="mb-4 flex items-center justify-between">
            <RadixDialog.Title className="text-lg font-bold text-carbon">{title}</RadixDialog.Title>
            <RadixDialog.Close className="rounded-full p-1 text-carbon/50 transition-smooth hover:bg-crema hover:text-carbon">
              <X size={18} />
            </RadixDialog.Close>
          </div>
          <div>{children}</div>
          {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

export default Dialog;
