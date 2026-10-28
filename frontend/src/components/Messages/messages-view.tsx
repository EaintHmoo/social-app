import { useState } from 'react';
import { Send, Phone, Video, Search, MoreHorizontal, CheckCheck, Check, Paperclip, Smile, ArrowLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { conversations as initialConvs, users, type Conversation, type ChatMessage } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

export function MessagesView() {
  const [conversations, setConversations] = useState<Conversation[]>(initialConvs);
  const [activeId, setActiveId] = useState<string>(initialConvs[0].id);
  const [draft, setDraft] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  const active = conversations.find((c) => c.id === activeId)!;

  const sendMessage = () => {
    if (!draft.trim()) return;
    const msg: ChatMessage = {
      id: `m-${Date.now()}`,
      authorId: 'me',
      text: draft.trim(),
      createdAt: 'now',
      mine: true,
      status: 'sent',
    };
    setConversations((cs) =>
      cs.map((c) =>
        c.id === activeId
          ? { ...c, messages: [...c.messages, msg], lastMessage: msg.text, lastSender: 'You', unread: 0 }
          : c,
      ),
    );
    setDraft('');
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-9rem)] w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-card/60 shadow-soft md:h-[calc(100vh-8rem)]">
      {/* Conversation list */}
      <div className={cn('w-full shrink-0 border-r border-border md:w-72', mobileOpen && 'hidden md:block')}>
        <div className="border-b border-border p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search conversations" className="h-9 rounded-full pl-9" />
          </div>
        </div>
        <ul className="h-full overflow-y-auto scrollbar-thin">
          {conversations.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => {
                  setActiveId(c.id);
                  setMobileOpen(true);
                  setConversations((cs) => cs.map((x) => (x.id === c.id ? { ...x, unread: 0 } : x)));
                }}
                className={cn(
                  'flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-accent/50',
                  activeId === c.id && 'bg-accent',
                )}
              >
                <div className="relative">
                  <Avatar className="h-11 w-11">
                    <AvatarImage src={c.avatar} alt={c.name} />
                    <AvatarFallback>{c.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  {c.online && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success ring-2 ring-card" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold">{c.name}</p>
                    <span className="shrink-0 text-[10px] text-muted-foreground">2m</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs text-muted-foreground">
                      {c.lastSender && !c.isGroup ? '' : `${c.lastSender}: `}{c.lastMessage}
                    </p>
                    {c.unread > 0 && (
                      <span className="grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                        {c.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Thread */}
      <div className={cn('flex flex-1 flex-col', !mobileOpen && 'hidden md:flex')}>
        <div className="flex items-center gap-3 border-b border-border p-3">
          <button onClick={() => setMobileOpen(false)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-accent md:hidden">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <Avatar className="h-9 w-9">
            <AvatarImage src={active.avatar} alt={active.name} />
            <AvatarFallback>{active.name.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{active.name}</p>
            <p className="text-xs text-muted-foreground">
              {active.online ? 'Active now' : 'Offline'} {active.isGroup && '· Group'}
            </p>
          </div>
          <button className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground">
            <Phone className="h-4 w-4" />
          </button>
          <button className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-primary">
            <Video className="h-4 w-4" />
          </button>
          <button className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto scrollbar-thin p-4">
          <div className="mx-auto w-fit rounded-full bg-muted px-3 py-1 text-[10px] text-muted-foreground">Today</div>
          {active.messages.map((m) => (
            <MessageBubble key={m.id} message={m} name={active.name} avatar={active.avatar} isGroup={active.isGroup} />
          ))}
        </div>

        <div className="flex items-center gap-2 border-t border-border p-3">
          <button className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground">
            <Paperclip className="h-4 w-4" />
          </button>
          <button className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground">
            <Smile className="h-4 w-4" />
          </button>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message…"
            className="flex-1 rounded-full bg-muted/60 px-4 py-2 text-sm outline-none placeholder:text-muted-foreground"
          />
          <Button onClick={sendMessage} disabled={!draft.trim()} size="icon" className="rounded-full">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  name,
  avatar,
  isGroup,
}: {
  message: ChatMessage;
  name: string;
  avatar: string;
  isGroup: boolean;
}) {
  const author = users[message.authorId];
  return (
    <div className={cn('flex gap-2.5', message.mine && 'flex-row-reverse')}>
      {!message.mine && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={author?.avatar ?? avatar} alt={author?.name ?? name} />
          <AvatarFallback>{(author?.name ?? name).slice(0, 2)}</AvatarFallback>
        </Avatar>
      )}
      <div className={cn('max-w-[75%]', message.mine && 'items-end')}>
        {isGroup && !message.mine && (
          <p className="mb-0.5 px-1 text-xs font-medium text-muted-foreground">{author?.name ?? name}</p>
        )}
        <div
          className={cn(
            'rounded-2xl px-3.5 py-2 text-sm',
            message.mine
              ? 'rounded-tr-sm bg-primary text-primary-foreground'
              : 'rounded-tl-sm bg-muted text-foreground',
          )}
        >
          {message.text}
        </div>
        <div className={cn('mt-0.5 flex items-center gap-1 px-1 text-[10px] text-muted-foreground', message.mine && 'justify-end')}>
          {message.createdAt}
          {message.mine && (
            message.status === 'read' ? <CheckCheck className="h-3 w-3 text-primary" /> : <Check className="h-3 w-3" />
          )}
        </div>
      </div>
    </div>
  );
}
