import { useState } from 'react';
import { Image as ImageIcon, Video, CalendarClock, Globe, Users, Lock, Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { users } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const visibilityOptions = [
  { value: 'PUBLIC', label: 'Public', icon: Globe, desc: 'Anyone can see this post' },
  { value: 'FOLLOWERS', label: 'Followers', icon: Users, desc: 'Only your followers' },
  { value: 'PRIVATE', label: 'Private', icon: Lock, desc: 'Only you' },
] as const;

export function Composer({ onPost }: { onPost: (text: string) => void }) {
  const me = users.me;
  const [text, setText] = useState('');
  const [visibility, setVisibility] = useState<(typeof visibilityOptions)[number]>(visibilityOptions[0]);
  const VisIcon = visibility.icon;

  const submit = () => {
    if (!text.trim()) return;
    onPost(text.trim());
    setText('');
  };

  return (
    <div className="rounded-2xl border border-border bg-card/70 p-4 shadow-soft backdrop-blur">
      <div className="flex gap-3">
        <Avatar className="h-11 w-11 shrink-0">
          <AvatarImage src={me.avatar} alt={me.name} />
          <AvatarFallback>{me.name.slice(0, 2)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share something with your network…"
            rows={2}
            className="w-full resize-none bg-transparent text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground"
          />
          <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
            <div className="flex items-center gap-1">
              <IconButton label="Photo" icon={ImageIcon} />
              <IconButton label="Video" icon={Video} />
              <IconButton label="Meeting invite" icon={CalendarClock} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                    <VisIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">{visibility.label}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {visibilityOptions.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <DropdownMenuItem
                        key={opt.value}
                        onClick={() => setVisibility(opt)}
                        className="gap-2"
                      >
                        <Icon className="h-4 w-4" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{opt.label}</span>
                          <span className="text-xs text-muted-foreground">{opt.desc}</span>
                        </div>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Button onClick={submit} disabled={!text.trim()} size="sm" className="gap-1.5 rounded-full">
              <Send className="h-3.5 w-3.5" />
              Post
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function IconButton({ icon: Icon, label }: { icon: typeof ImageIcon; label: string }) {
  return (
    <button
      aria-label={label}
      className={cn(
        'grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-primary',
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
