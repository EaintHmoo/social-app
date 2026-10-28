import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Video, UserPlus, Check, type LucideIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { users, suggestedUsers, meetings } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

export function RightRail() {
  return (
    <aside className="hidden w-80 shrink-0 flex-col gap-4 py-5 xl:flex">
      <TrendingPanel />
      <UpcomingMeetings />
      <SuggestedPanel />
      <Footer />
    </aside>
  );
}

function PanelHeader({ icon: Icon, title, action }: { icon: LucideIcon; title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function TrendingPanel() {
  const trends = [
    { tag: 'webrtc', posts: '12.4K posts', delta: '+24%' },
    { tag: 'postgres', posts: '8.1K posts', delta: '+11%' },
    { tag: 'designsystems', posts: '5.6K posts', delta: '+8%' },
    { tag: 'livekit', posts: '3.2K posts', delta: '+42%' },
    { tag: 'remotework', posts: '2.9K posts', delta: '+5%' },
  ];
  return (
    <section className="rounded-2xl border border-border bg-card/60 p-4 shadow-soft backdrop-blur">
      <PanelHeader icon={TrendingUp} title="Trending topics" />
      <ul className="space-y-1">
        {trends.map((t) => (
          <li key={t.tag}>
            <button className="group flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-accent">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">#{t.tag}</p>
                <p className="text-xs text-muted-foreground">{t.posts}</p>
              </div>
              <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
                {t.delta}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function UpcomingMeetings() {
  const upcoming = meetings.filter((m) => m.status === 'scheduled' || m.status === 'upcoming').slice(0, 2);
  return (
    <section className="rounded-2xl border border-border bg-card/60 p-4 shadow-soft backdrop-blur">
      <PanelHeader
        icon={Video}
        title="Upcoming meetings"
        action={
          <Link to="/meetings" className="text-xs font-medium text-primary hover:underline">
            See all
          </Link>
        }
      />
      <ul className="space-y-2">
        {upcoming.map((m) => {
          const host = users[m.hostId];
          return (
            <li key={m.id}>
              <Link
                to="/meetings"
                className="block w-full rounded-xl border border-border bg-background/50 p-3 text-left transition-colors hover:border-primary/40 hover:bg-accent/50"
              >
                <p className="truncate text-sm font-medium">{m.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{m.scheduledAt}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={host.avatar} alt={host.name} />
                    <AvatarFallback>{host.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">{host.name}</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function SuggestedPanel() {
  const [followed, setFollowed] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setFollowed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <section className="rounded-2xl border border-border bg-card/60 p-4 shadow-soft backdrop-blur">
      <PanelHeader icon={UserPlus} title="Who to follow" />
      <ul className="space-y-3">
        {suggestedUsers.map(({ id, reason }) => {
          const u = users[id];
          const isFollowing = followed.has(id);
          return (
            <li key={id} className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={u.avatar} alt={u.name} />
                <AvatarFallback>{u.name.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{u.name}</p>
                <p className="truncate text-xs text-muted-foreground">{reason}</p>
              </div>
              <Button
                size="sm"
                variant={isFollowing ? 'secondary' : 'default'}
                onClick={() => toggle(id)}
                className={cn('h-8 gap-1 rounded-full px-3 text-xs')}
              >
                {isFollowing ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> Following
                  </>
                ) : (
                  'Follow'
                )}
              </Button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Footer() {
  return (
    <div className="px-3 text-xs text-muted-foreground">
      <p className="leading-relaxed">
        SocialMeet · A demo social + video meetings UI. Built with React, Tailwind, and shadcn/ui.
      </p>
      <div className="mt-2 flex gap-3">
        <button className="hover:text-foreground">Terms</button>
        <button className="hover:text-foreground">Privacy</button>
        <button className="hover:text-foreground">Help</button>
      </div>
    </div>
  );
}
