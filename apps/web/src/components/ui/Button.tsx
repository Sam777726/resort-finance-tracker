import { forwardRef, type ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'md' | 'sm';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-accent text-accentink hover:opacity-90',
  secondary: 'bg-surface2 text-ink border border-border hover:border-accent',
  danger: 'bg-danger text-white hover:opacity-90',
  ghost: 'bg-transparent text-ink border border-border hover:bg-surface2',
};
const SIZE_CLASSES: Record<Size, string> = {
  md: 'px-4 py-2.5 text-sm',
  sm: 'px-2.5 py-1.5 text-xs',
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', size = 'md', className, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={clsx(
        'rounded-lg font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
      {...props}
    />
  );
});
