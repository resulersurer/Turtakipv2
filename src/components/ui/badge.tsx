import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils';

const Badge = ({ className, ...props }: ComponentPropsWithoutRef<'span'>) => (
  <span className={cn('inline-flex rounded-full bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-slate-300', className)} {...props} />
);

export default Badge;
