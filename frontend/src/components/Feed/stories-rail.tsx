import { Plus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { users } from '@/lib/mock-data';

export function StoriesRail() {
  const me = users.me;
  const others = [users.u1, users.u3, users.u5, users.u2, users.u4];
  const ring = (online?: boolean) =>
    online ? 'ring-2 ring-success' : 'ring-2 ring-border';

  return (
    <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-1">
      {/* Add story */}
      <button className="group flex w-20 shrink-0 flex-col items-center gap-1.5">
        <div className="relative h-16 w-16">
          <Avatar className="h-16 w-16 ring-2 ring-border">
            <AvatarImage src={me.avatar} alt={me.name} />
            <AvatarFallback>{me.name.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <span className="absolute -bottom-0.5 -right-0.5 grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground ring-2 ring-card">
            <Plus className="h-3.5 w-3.5" strokeWidth={3} />
          </span>
        </div>
        <span className="truncate text-xs font-medium">Your story</span>
      </button>

      {/* Others */}
      {others.map((u) => (
        <button key={u.id} className="group flex w-20 shrink-0 flex-col items-center gap-1.5">
          <div
            className={`relative h-16 w-16 rounded-full bg-gradient-to-tr from-primary via-primary to-success p-[2px] ${ring(u.online)}`}
          >
            <Avatar className="h-full w-full border-2 border-card">
              <AvatarImage src={u.avatar} alt={u.name} />
              <AvatarFallback>{u.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            {u.online && (
              <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-success ring-2 ring-card" />
            )}
          </div>
          <span className="truncate text-xs font-medium">{u.name.split(' ')[0]}</span>
        </button>
      ))}
    </div>
  );
}
