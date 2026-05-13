import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils';

const Label = ({ className, ...props }: ComponentPropsWithoutRef<'label'>) => (
  <label className={cn('block text-sm font-medium text-slate-200', className)} {...props} />
);

export default Label;
