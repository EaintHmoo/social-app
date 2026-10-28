import { useState } from 'react';
import {
  CalendarClock,
  Video,
  Users,
  DoorOpen,
  Circle,
  Radio,
  Search,
  LayoutGrid,
  List,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { meetings as initialMeetings, users, type Meeting } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { PreJoinDialog } from '@/components/Meetings/pre-join-dialog';
import { MeetingRoom } from '@/components/Meetings/meeting-room';

type Filter = 'all' | 'live' | 'upcoming' | 'scheduled';

export function MeetingsView({ onOpenNew }: { onOpenNew: () => void }) {
  const [meetings] = useState<Meeting[]>(initialMeetings);
  const [filter, setFilter] = useState<Filter>('all');
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [query, setQuery] = useState('');
  const [joinTarget, setJoinTarget] = useState<Meeting | null>(null);
  const [inRoom, setInRoom] = useState<Meeting | null>(null);

  const filtered = meetings.filter((m) => {
    const matchesFilter = filter === 'all' || m.status === filter || (filter === 'upcoming' && m.status === 'upcoming');
    const matchesQuery = m.title.toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  const live = meetings.find((m) => m.status === 'live');

  if (inRoom) {
    return <MeetingRoom meeting={inRoom} onLeave={() => setInRoom(null)} />;
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 py-5">
      {/* Hero / quick actions */}
      <section className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-5 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Ready to meet?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Start an instant meeting or schedule one for later. Share the link with anyone.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={onOpenNew} className="gap-2 rounded-xl shadow-glow">
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              New meeting
            </Button>
            <Button variant="secondary" className="gap-2 rounded-xl">
              <CalendarClock className="h-4 w-4" />
              Schedule
            </Button>
          </div>
        </div>
      </section>

      {/* Live now */}
      {live && (
        <section className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-center gap-2 text-destructive">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-destructive" />
            </span>
            <span className="text-sm font-semibold uppercase tracking-wide">Live now</span>
          </div>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="truncate text-base font-semibold">{live.title}</p>
              <p className="text-sm text-muted-foreground">{live.scheduledAt} · {live.participants} participants</p>
            </div>
            <Button onClick={() => setJoinTarget(live)} className="gap-2 rounded-xl">
              <Video className="h-4 w-4" />
              Join meeting
            </Button>
          </div>
        </section>
      )}

      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="live">Live</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search meetings"
              className="h-9 rounded-full pl-9 sm:w-56"
            />
          </div>
          <div className="hidden rounded-lg border border-border p-0.5 sm:flex">
            <button
              onClick={() => setLayout('grid')}
              className={cn('grid h-8 w-8 place-items-center rounded-md', layout === 'grid' ? 'bg-accent text-foreground' : 'text-muted-foreground')}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setLayout('list')}
              className={cn('grid h-8 w-8 place-items-center rounded-md', layout === 'list' ? 'bg-accent text-foreground' : 'text-muted-foreground')}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-border py-16 text-center">
          <Video className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">No meetings here yet</p>
          <p className="text-xs text-muted-foreground">Create one to get started.</p>
        </div>
      ) : layout === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => (
            <MeetingCard key={m.id} meeting={m} onJoin={() => setJoinTarget(m)} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((m) => (
            <MeetingRow key={m.id} meeting={m} onJoin={() => setJoinTarget(m)} />
          ))}
        </div>
      )}

      <PreJoinDialog
        meeting={joinTarget}
        onClose={() => setJoinTarget(null)}
        onJoin={() => {
          if (joinTarget) setInRoom(joinTarget);
          setJoinTarget(null);
        }}
      />
    </div>
  );
}

function StatusBadge({ meeting }: { meeting: Meeting }) {
  if (meeting.status === 'live') {
    return (
      <Badge variant="destructive" className="gap-1 rounded-full">
        <Circle className="h-2 w-2 fill-current" />
        Live
      </Badge>
    );
  }
  if (meeting.status === 'upcoming') {
    return <Badge className="gap-1 rounded-full bg-warning/15 text-warning">{meeting.startsInLabel}</Badge>;
  }
  return <Badge variant="secondary" className="rounded-full">{meeting.startsInLabel}</Badge>;
}

function MeetingCard({ meeting, onJoin }: { meeting: Meeting; onJoin: () => void }) {
  const host = users[meeting.hostId];
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card/70 p-4 shadow-soft backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {meeting.tags.map((t) => (
            <span key={t} className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground">
              {t}
            </span>
          ))}
        </div>
        <StatusBadge meeting={meeting} />
      </div>

      <h3 className="mt-3 line-clamp-2 text-base font-semibold leading-snug">{meeting.title}</h3>

      <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
        <Avatar className="h-6 w-6">
          <AvatarImage src={host.avatar} alt={host.name} />
          <AvatarFallback>{host.name.slice(0, 2)}</AvatarFallback>
        </Avatar>
        <span className="truncate">{host.name}</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <Meta icon={CalendarClock} text={meeting.scheduledAt} />
        <Meta icon={Users} text={`${meeting.participants}/${meeting.capacity}`} />
        {meeting.waitingRoom && <Meta icon={DoorOpen} text="Waiting room" />}
        {meeting.recording && <Meta icon={Radio} text="Recording" />}
        {meeting.waitingRoom && meeting.recording ? null : <Meta icon={ShieldCheck} text={`${meeting.invitees} invited`} />}
      </div>

      <Button
        onClick={onJoin}
        variant={meeting.status === 'live' ? 'default' : 'secondary'}
        className="mt-4 w-full gap-2 rounded-xl"
      >
        <Video className="h-4 w-4" />
        {meeting.status === 'live' ? 'Join now' : 'Pre-join'}
      </Button>
    </div>
  );
}

function MeetingRow({ meeting, onJoin }: { meeting: Meeting; onJoin: () => void }) {
  const host = users[meeting.hostId];
  return (
    <button
      onClick={onJoin}
      className="flex w-full items-center gap-3 rounded-xl border border-border bg-card/60 p-3 text-left transition-colors hover:bg-accent/50"
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src={host.avatar} alt={host.name} />
        <AvatarFallback>{host.name.slice(0, 2)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{meeting.title}</p>
        <p className="truncate text-xs text-muted-foreground">{host.name} · {meeting.scheduledAt}</p>
      </div>
      <StatusBadge meeting={meeting} />
      <Video className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}

function Meta({ icon: Icon, text }: { icon: typeof Users; text: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{text}</span>
    </span>
  );
}

