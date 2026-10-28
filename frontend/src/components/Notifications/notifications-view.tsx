import { Heart, MessageCircle, UserPlus, Video, AtSign, Radio, Mail, CheckCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { notifications as initial, users, type Notification } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const iconFor: Record<Notification['type'], typeof Heart> = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  mention: AtSign,
  meeting: Video,
  recording: Radio,
  message: Mail,
};

const colorFor: Record<Notification['type'], string> = {
  like: 'bg-rose-500/15 text-rose-500',
  comment: 'bg-primary/15 text-primary',
  follow: 'bg-success/15 text-success',
  mention: 'bg-chart-4/15 text-chart-4',
  meeting: 'bg-primary/15 text-primary',
  recording: 'bg-warning/15 text-warning',
  message: 'bg-chart-2/15 text-chart-2',
};

export function NotificationsView() {
  const [items, setItems] = useState<Notification[]>(initial);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const visible = filter === 'unread' ? items.filter((n) => !n.read) : items;
  const unreadCount = items.filter((n) => !n.read).length;

  const markAll = () => setItems((is) => is.map((n) => ({ ...n, read: true })));
  const markOne = (id: string) =>
    setItems((is) => is.map((n) => (n.id === id ? { ...n, read: true } : n)));

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 py-5">
      <div className="flex items-center justify-between">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread')}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              {unreadCount > 0 && (
                <span className="ml-1.5 rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="ghost" size="sm" onClick={markAll} className="gap-1.5 text-muted-foreground">
          <CheckCheck className="h-4 w-4" />
          Mark all read
        </Button>
      </div>

      <div className="space-y-2">
        {visible.length === 0 ? (
          <div className="grid place-items-center rounded-2xl border border-dashed border-border py-16 text-center">
            <Mail className="h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">You're all caught up</p>
            <p className="text-xs text-muted-foreground">No new notifications.</p>
          </div>
        ) : (
          visible.map((n) => {
            const actor = users[n.actorId];
            const Icon = iconFor[n.type];
            return (
              <button
                key={n.id}
                onClick={() => markOne(n.id)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all',
                  n.read ? 'border-border bg-card/40' : 'border-primary/30 bg-primary/5 hover:bg-primary/10',
                )}
              >
                <div className="relative shrink-0">
                  <Avatar className="h-11 w-11">
                    <AvatarImage src={actor.avatar} alt={actor.name} />
                    <AvatarFallback>{actor.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <span className={cn('absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full ring-2 ring-card', colorFor[n.type])}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug">
                    <span className="font-semibold">{actor.name}</span>{' '}
                    <span className="text-muted-foreground">{n.text}</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{n.createdAt}</p>
                </div>
                {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

