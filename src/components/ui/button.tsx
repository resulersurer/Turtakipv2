import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils';

const Button = ({ className, ...props }: ComponentPropsWithoutRef<'button'>) => {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/60 disabled:cursor-not-allowed disabled:opacity-60',
        className
      )}
      {...props}
    />
  );
};

export default Button;
