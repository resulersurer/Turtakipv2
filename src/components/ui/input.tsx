import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils';

const Input = ({ className, ...props }: ComponentPropsWithoutRef<'input'>) => (
  <input
    className={cn(
      'w-full rounded-2xl border border-white/10 bg-[#0c1733]/90 px-4 py-3 text-sm text-slate-100 transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20',
      className
    )}
    {...props}
  />
);

export default Input;
