import { useState } from 'react';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  ScreenShare,
  Hand,
  Smile,
  Users,
  MessageSquare,
  MoreHorizontal,
  PhoneOff,
  Settings,
  Grid2x2,
  Circle,
  Signal,
  ShieldCheck,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { users, type Meeting } from '@/lib/mock-data';

export function MeetingRoom({ meeting, onLeave }: { meeting: Meeting; onLeave: () => void }) {
  const me = users.me;
  const others = [users.u1, users.u3, users.u5];
  const all = [me, ...others];

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [handRaised, setHandRaised] = useState(false);
  const [panel, setPanel] = useState<'people' | 'chat' | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white">
      {/* Top bar */}
      <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
          </span>
          <span className="text-sm font-semibold">{meeting.title}</span>
        </div>
        <span className="hidden items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/80 sm:flex">
          <Circle className="h-2 w-2 fill-current" /> Recording
        </span>
        <span className="hidden items-center gap-1 text-xs text-white/60 sm:flex">
          <Signal className="h-3.5 w-3.5" /> Good connection
        </span>
        <span className="hidden items-center gap-1 text-xs text-white/60 md:flex">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Encrypted
        </span>
        <span className="ml-auto rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/80">{meeting.slug}</span>
      </header>

      {/* Stage */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4">
          <div className="grid flex-1 grid-cols-2 gap-3 lg:grid-cols-2 xl:grid-cols-4">
            {all.map((u, i) => {
              const isMe = u.id === 'me';
              const speaking = i === 1;
              return (
                <div
                  key={u.id}
                  className={cn(
                    'relative grid place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 ring-2 transition-all',
                    speaking ? 'ring-emerald-400' : 'ring-transparent',
                    !camOn && isMe && 'from-slate-900 to-slate-950',
                  )}
                >
                  {camOn || !isMe ? (
                    <Avatar className="h-20 w-20 ring-4 ring-white/10 sm:h-24 sm:w-24">
                      <AvatarImage src={u.avatar} alt={u.name} />
                      <AvatarFallback>{u.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                  ) : (
                    <Avatar className="h-16 w-16 opacity-50 grayscale">
                      <AvatarImage src={u.avatar} alt={u.name} />
                      <AvatarFallback>{u.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                  )}

                  {/* Speaking indicator */}
                  {speaking && (
                    <div className="absolute inset-0 -z-0 bg-emerald-500/5" />
                  )}

                  {/* Name + mic */}
                  <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 text-xs font-medium">
                    {!micOn && isMe ? (
                      <MicOff className="h-3 w-3 text-destructive" />
                    ) : (
                      <Mic className="h-3 w-3" />
                    )}
                    <span>{isMe ? 'You' : u.name.split(' ')[0]}</span>
                    {isMe && <span className="text-white/50">(Host)</span>}
                  </div>

                  {speaking && (
                    <div className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-emerald-500/90 px-2 py-0.5 text-[10px] font-bold text-white">
                      <span className="flex gap-0.5">
                        <span className="h-2 w-0.5 animate-pulse bg-white" />
                        <span className="h-3 w-0.5 animate-pulse bg-white" />
                        <span className="h-1.5 w-0.5 animate-pulse bg-white" />
                      </span>
                      Speaking
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Reaction floats */}
          <div className="pointer-events-none flex items-center gap-2 px-1 text-sm text-white/40">
            <Smile className="h-4 w-4" /> Reactions appear here during the call
          </div>
        </div>

        {/* Side panel */}
        {panel && (
          <aside className="flex w-full max-w-sm flex-col border-l border-white/10 bg-slate-900/80 backdrop-blur md:w-80">
            <div className="flex items-center border-b border-white/10 px-3 py-2.5 text-sm font-semibold">
              {panel === 'people' ? `Participants (${all.length})` : 'In-meeting chat'}
              <button onClick={() => setPanel(null)} className="ml-auto rounded-md p-1 text-white/60 hover:bg-white/10">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
            {panel === 'people' ? (
              <ul className="flex-1 space-y-1 overflow-y-auto p-2">
                {all.map((u) => {
                  const isMe = u.id === 'me';
                  return (
                    <li key={u.id} className="flex items-center gap-2 rounded-lg p-2 hover:bg-white/5">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={u.avatar} alt={u.name} />
                        <AvatarFallback>{u.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{u.name} {isMe && '(You)'}</p>
                        <p className="truncate text-xs text-white/50">{isMe ? 'Host' : 'Participant'}</p>
                      </div>
                      <Mic className="h-4 w-4 text-white/60" />
                      <VideoIcon className="h-4 w-4 text-white/60" />
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="flex flex-1 flex-col">
                <div className="flex-1 space-y-3 overflow-y-auto p-3">
                  <ChatBubble name="Maya" text="Can everyone see my screen?" mine={false} />
                  <ChatBubble name="You" text="Yes, looks clear!" mine />
                  <ChatBubble name="Sam" text="Sharing the deck now." mine={false} />
                </div>
                <div className="flex items-center gap-2 border-t border-white/10 p-2">
                  <input
                    placeholder="Send a message…"
                    className="flex-1 rounded-full bg-white/10 px-3 py-2 text-sm outline-none placeholder:text-white/40"
                  />
                  <button className="rounded-full bg-primary px-3 py-2 text-sm font-medium">Send</button>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Controls */}
      <footer className="flex items-center justify-center gap-2 border-t border-white/10 bg-slate-950/80 px-3 py-3 backdrop-blur sm:gap-3">
        <ControlButton active={micOn} onClick={() => setMicOn((v) => !v)} onIcon={Mic} offIcon={MicOff} label={micOn ? 'Mute' : 'Unmute'} />
        <ControlButton active={camOn} onClick={() => setCamOn((v) => !v)} onIcon={VideoIcon} offIcon={VideoOff} label={camOn ? 'Stop video' : 'Start video'} />
        <ControlButton active onClick={() => {}} onIcon={ScreenShare} offIcon={ScreenShare} label="Share" />
        <ControlButton active={handRaised} onClick={() => setHandRaised((v) => !v)} onIcon={Hand} offIcon={Hand} label={handRaised ? 'Lower hand' : 'Raise hand'} />
        <ControlButton active onClick={() => setPanel((p) => (p === 'people' ? null : 'people'))} onIcon={Users} offIcon={Users} label="People" highlight={panel === 'people'} />
        <ControlButton active onClick={() => setPanel((p) => (p === 'chat' ? null : 'chat'))} onIcon={MessageSquare} offIcon={MessageSquare} label="Chat" highlight={panel === 'chat'} />
        <ControlButton active onClick={() => {}} onIcon={Grid2x2} offIcon={Grid2x2} label="Layout" />
        <ControlButton active onClick={() => {}} onIcon={Settings} offIcon={Settings} label="Settings" />
        <button
          onClick={onLeave}
          className="ml-1 flex items-center gap-2 rounded-full bg-destructive px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-destructive/90 sm:ml-3"
        >
          <PhoneOff className="h-4 w-4" />
          <span className="hidden sm:inline">Leave</span>
        </button>
      </footer>
    </div>
  );
}

function ControlButton({
  active,
  onClick,
  onIcon: OnIcon,
  offIcon: OffIcon,
  label,
  highlight,
}: {
  active: boolean;
  onClick: () => void;
  onIcon: typeof Mic;
  offIcon: typeof MicOff;
  label: string;
  highlight?: boolean;
}) {
  const Icon = active ? OnIcon : OffIcon;
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative grid h-11 w-11 place-items-center rounded-full transition-all sm:h-12 sm:w-12',
        highlight ? 'bg-primary text-white' : active ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-destructive text-white',
      )}
      title={label}
    >
      <Icon className="h-5 w-5" />
      <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded-md bg-slate-800 px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
        {label}
      </span>
    </button>
  );
}

function ChatBubble({ name, text, mine }: { name: string; text: string; mine: boolean }) {
  return (
    <div className={cn('flex flex-col', mine ? 'items-end' : 'items-start')}>
      <span className="mb-0.5 text-xs text-white/50">{name}</span>
      <p className={cn('max-w-[80%] rounded-2xl px-3 py-2 text-sm', mine ? 'bg-primary text-white' : 'bg-white/10 text-white/90')}>
        {text}
      </p>
    </div>
  );
}
