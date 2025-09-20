import { ImSpinner2 } from 'react-icons/im';
import { cn } from '@/lib/utils';

interface SpinnerProps {
  className?: string;
}

export function Spinner({ className }: SpinnerProps) {
  return <ImSpinner2 className={cn('animate-spin', className)} />;
}
