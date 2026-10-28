import { useState } from 'react';
import { Video, CalendarClock, Link2, Copy, Check, Globe, Lock, DoorOpen, Mic, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function NewMeetingDialog({ open, onClose }: Props) {
  const [title, setTitle] = useState('');
  const [when, setWhen] = useState<'now' | 'later'>('now');
  const [waitingRoom, setWaitingRoom] = useState(true);
  const [muteOnEntry, setMuteOnEntry] = useState(false);
  const [allowGuests, setAllowGuests] = useState(true);
  const [copied, setCopied] = useState(false);

  // Lazy initial state: generated once per mount. Calling Math.random() directly in render made
  // the link change on every keystroke. (Real slugs will come from the API — see F9.)
  const [slug] = useState(() => 'sm-' + Math.random().toString(36).slice(2, 8));
  const link = `socialmeet.app/m/${slug}`;

  const copyLink = () => {
    navigator.clipboard?.writeText(link).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg overflow-hidden sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Video className="h-5 w-5 text-primary" />
            Create a meeting
          </DialogTitle>
          <DialogDescription>Start instantly or schedule for later. You can edit any of this before it starts.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Meeting title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Weekly design sync"
            />
          </div>

          {/* When */}
          <div className="grid grid-cols-2 gap-2">
            <OptionCard
              active={when === 'now'}
              onClick={() => setWhen('now')}
              icon={Video}
              title="Instant"
              desc="Starts right away"
            />
            <OptionCard
              active={when === 'later'}
              onClick={() => setWhen('later')}
              icon={CalendarClock}
              title="Scheduled"
              desc="Pick a time"
            />
          </div>

          {when === 'later' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="time">Time</Label>
                <Input id="time" type="time" />
              </div>
            </div>
          )}

          {/* Settings */}
          <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-3">
            <SettingRow
              icon={DoorOpen}
              label="Waiting room"
              desc="Hold guests until the host admits them"
              checked={waitingRoom}
              onChange={setWaitingRoom}
            />
            <SettingRow
              icon={Mic}
              label="Mute on entry"
              desc="Mute everyone when they join"
              checked={muteOnEntry}
              onChange={setMuteOnEntry}
            />
            <SettingRow
              icon={Globe}
              label="Allow guests"
              desc="Anyone with the link can join"
              checked={allowGuests}
              onChange={setAllowGuests}
            />
          </div>

          {/* Shareable link */}
          <div className="space-y-1.5">
            <Label>Meeting link</Label>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
              <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate text-sm text-muted-foreground">{link}</span>
              <button
                onClick={copyLink}
                className={cn(
                  'flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors',
                  copied ? 'text-success' : 'text-primary hover:bg-primary/10',
                )}
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button onClick={onClose} className="gap-2 rounded-xl shadow-glow">
            <Video className="h-4 w-4" />
            {when === 'now' ? 'Start now' : 'Schedule meeting'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OptionCard({
  active,
  onClick,
  icon: Icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Video;
  title: string;
  desc: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all',
        active ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:bg-accent/50',
      )}
    >
      <Icon className={cn('h-5 w-5', active ? 'text-primary' : 'text-muted-foreground')} />
      <span className="text-sm font-semibold">{title}</span>
      <span className="text-xs text-muted-foreground">{desc}</span>
    </button>
  );
}

function SettingRow({
  icon: Icon,
  label,
  desc,
  checked,
  onChange,
}: {
  icon: typeof Lock;
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 py-1">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export { Users };
