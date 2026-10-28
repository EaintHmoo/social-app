import { Video } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className, showWordmark = true }: { className?: string; showWordmark?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-glow">
        <Video className="h-5 w-5" strokeWidth={2.5} />
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-background" />
      </div>
      {showWordmark && (
        <span className="text-lg font-extrabold tracking-tight">
          Social<span className="text-primary">Meet</span>
        </span>
      )}
    </div>
  );
}
