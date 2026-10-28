import { useEffect, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, Settings, ArrowRight, ShieldCheck, DoorOpen } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { users, type Meeting } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

interface Props {
  meeting: Meeting | null;
  onClose: () => void;
  onJoin: () => void;
}

export function PreJoinDialog({ meeting, onClose, onJoin }: Props) {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [name] = useState(users.me.name);

  // Reset device toggles each time a new meeting is opened
  useEffect(() => {
    if (meeting) {
      setMicOn(true);
      setCamOn(true);
    }
  }, [meeting?.id]);

  return (
    <Dialog open={!!meeting} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md overflow-hidden p-0 sm:rounded-2xl">
        <DialogHeader className="px-5 pt-5">
          <DialogTitle className="text-base">Join meeting</DialogTitle>
          <DialogDescription className="truncate">{meeting?.title}</DialogDescription>
        </DialogHeader>

        {/* Preview */}
        <div className="relative mx-5 aspect-video overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 to-slate-900">
          {camOn ? (
            <div className="absolute inset-0 grid place-items-center">
              <Avatar className="h-20 w-20 ring-4 ring-white/20">
                <AvatarImage src={users.me.avatar} alt={name} />
                <AvatarFallback>{name.slice(0, 2)}</AvatarFallback>
              </Avatar>
            </div>
          ) : (
            <div className="absolute inset-0 grid place-items-center">
              <Avatar className="h-16 w-16 opacity-60 grayscale">
                <AvatarImage src={users.me.avatar} alt={name} />
                <AvatarFallback>{name.slice(0, 2)}</AvatarFallback>
              </Avatar>
            </div>
          )}
          <div className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
            {name}
          </div>
          {!micOn && (
            <div className="absolute bottom-2 right-2 grid h-7 w-7 place-items-center rounded-full bg-destructive text-destructive-foreground">
              <MicOff className="h-3.5 w-3.5" />
            </div>
          )}
        </div>

        {/* Device controls */}
        <div className="flex items-center justify-center gap-3 px-5 py-3">
          <DeviceToggle active={micOn} onClick={() => setMicOn((v) => !v)} onIcon={Mic} offIcon={MicOff} label="Microphone" />
          <DeviceToggle active={camOn} onClick={() => setCamOn((v) => !v)} onIcon={Video} offIcon={VideoOff} label="Camera" />
          <button className="grid h-11 w-11 place-items-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
            <Settings className="h-5 w-5" />
          </button>
        </div>

        {/* Meeting info */}
        <div className="mx-5 space-y-2 rounded-xl border border-border bg-muted/40 p-3 text-sm">
          <Row icon={ShieldCheck} text={meeting?.waitingRoom ? 'Waiting room enabled — host will admit you' : 'You can enter directly'} />
          <Row icon={DoorOpen} text={meeting?.status === 'live' ? 'Meeting is already live' : `Starts ${meeting?.startsInLabel}`} />
        </div>

        <div className="flex items-center gap-2 px-5 pb-5 pt-2">
          <Button variant="ghost" onClick={onClose} className="rounded-xl">
            Cancel
          </Button>
          <Button onClick={onJoin} className="ml-auto gap-2 rounded-xl shadow-glow">
            Ask to join
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DeviceToggle({
  active,
  onClick,
  onIcon: OnIcon,
  offIcon: OffIcon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  onIcon: typeof Mic;
  offIcon: typeof MicOff;
  label: string;
}) {
  const Icon = active ? OnIcon : OffIcon;
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        'grid h-11 w-11 place-items-center rounded-full transition-colors',
        active ? 'bg-muted text-foreground hover:bg-accent' : 'bg-destructive text-destructive-foreground',
      )}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}

function Row({ icon: Icon, text }: { icon: typeof ShieldCheck; text?: string }) {
  if (!text) return null;
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon className="h-4 w-4 shrink-0 text-primary" />
      <span>{text}</span>
    </div>
  );
}
