import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Slot — substituição mínima de @radix-ui/react-slot.
 * Permite que um componente (ex: Button) renderize um filho (ex: Link)
 * em vez da sua própria tag, herdando a classe/variantes.
 */
export interface SlotProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

const Slot = React.forwardRef<HTMLElement, SlotProps>(
  ({ children, ...props }, ref) => {
    const child = React.Children.only(children);

    if (!React.isValidElement(child)) {
      return null;
    }

    return React.cloneElement(child, {
      ...props,
      ...child.props,
      ref,
      className: cn(props.className, child.props.className),
    });
  }
);
Slot.displayName = 'Slot';

export { Slot };
