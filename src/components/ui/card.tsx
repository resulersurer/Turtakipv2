import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils';

const Card = ({ className, ...props }: ComponentPropsWithoutRef<'div'>) => (
  <div className={cn('rounded-[28px] border border-white/10 bg-[#07132d]/90 p-6 shadow-panel', className)} {...props} />
);

export default Card;
