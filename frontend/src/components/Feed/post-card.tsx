import { useState } from 'react';
import {
  Heart,
  ThumbsUp,
  Smile,
  Frown,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Globe,
  Users,
  Lock,
  Video,
  Check,
  Send,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { type Post, type ReactionType, type Comment, users } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const reactionConfig: { type: ReactionType; icon: typeof ThumbsUp; label: string; color: string; emoji: string }[] = [
  { type: 'like', icon: ThumbsUp, label: 'Like', color: 'text-primary', emoji: '👍' },
  { type: 'love', icon: Heart, label: 'Love', color: 'text-rose-500', emoji: '❤️' },
  { type: 'laugh', icon: Smile, label: 'Haha', color: 'text-amber-500', emoji: '😄' },
  { type: 'sad', icon: Frown, label: 'Sad', color: 'text-blue-500', emoji: '😢' },
];

const visibilityMeta = {
  PUBLIC: { icon: Globe, label: 'Public' },
  FOLLOWERS: { icon: Users, label: 'Followers' },
  PRIVATE: { icon: Lock, label: 'Private' },
} as const;

export function PostCard({ post }: { post: Post }) {
  const author = users[post.authorId];
  const [reactions, setReactions] = useState(post.reactions);
  const [myReaction, setMyReaction] = useState<ReactionType | null>(post.reactionByMe);
  const [showComments, setShowComments] = useState(false);
  const [saved, setSaved] = useState(false);
  const [comments, setComments] = useState<Comment[]>(post.comments);
  const [draft, setDraft] = useState('');

  const totalReactions = Object.values(reactions).reduce((a, b) => a + b, 0);
  const VisIcon = visibilityMeta[post.visibility].icon;

  const applyReaction = (type: ReactionType) => {
    setReactions((prev) => {
      const next = { ...prev };
      if (myReaction) next[myReaction] = Math.max(0, next[myReaction] - 1);
      if (myReaction === type) {
        setMyReaction(null);
        return next;
      }
      next[type] = next[type] + 1;
      setMyReaction(type);
      return next;
    });
  };

  const addComment = () => {
    if (!draft.trim()) return;
    const newComment: Comment = {
      id: `c-${Date.now()}`,
      authorId: 'me',
      text: draft.trim(),
      createdAt: 'now',
      likes: 0,
    };
    setComments((c) => [...c, newComment]);
    setDraft('');
  };

  return (
    <article className="animate-float-up rounded-2xl border border-border bg-card/70 p-4 shadow-soft backdrop-blur transition-shadow hover:shadow-card sm:p-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Avatar className="h-11 w-11 shrink-0">
          <AvatarImage src={author.avatar} alt={author.name} />
          <AvatarFallback>{author.name.slice(0, 2)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold">{author.name}</span>
            {author.verified && <VerifiedBadge />}
            <span className="text-xs text-muted-foreground">· @{author.username}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>{post.createdAt}</span>
            <span>·</span>
            <VisIcon className="h-3 w-3" />
            <span>{visibilityMeta[post.visibility].label}</span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem>Save post</DropdownMenuItem>
            <DropdownMenuItem>Copy link</DropdownMenuItem>
            <DropdownMenuItem>Mute @{author.username}</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive focus:text-destructive">Report</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Body */}
      <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-foreground/90">{post.text}</p>

      {/* Images */}
      {post.images.length > 0 && (
        <div
          className={cn(
            'mt-3 overflow-hidden rounded-xl border border-border',
            post.images.length === 1 ? 'grid grid-cols-1' : 'grid grid-cols-2 gap-1',
          )}
        >
          {post.images.map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              loading="lazy"
              className={cn(
                'w-full bg-muted object-cover transition-transform duration-500 hover:scale-[1.02]',
                post.images.length === 1 ? 'max-h-[460px]' : 'h-48 sm:h-56',
              )}
            />
          ))}
        </div>
      )}

      {/* Meeting invite */}
      {post.meetingInvite && (
        <a
          href="#meetings"
          className="mt-3 flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3 transition-colors hover:bg-primary/10"
        >
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary">
            <Video className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{post.meetingInvite.title}</p>
            <p className="text-xs text-muted-foreground">Starts {post.meetingInvite.startsIn}</p>
          </div>
          <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">Join</span>
        </a>
      )}

      {/* Counts */}
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <ReactionSummary reactions={reactions} />
          <span>{totalReactions}</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowComments((s) => !s)} className="hover:text-foreground">
            {comments.length} comments
          </button>
          <span>{post.shareCount} shares</span>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-2 flex items-center gap-1 border-t border-border pt-2 sm:gap-2">
        <ReactionPicker current={myReaction} onPick={applyReaction} />
        <ActionButton icon={MessageCircle} label="Comment" onClick={() => setShowComments((s) => !s)} />
        <ActionButton icon={Share2} label="Share" />
        <button
          onClick={() => setSaved((s) => !s)}
          className={cn(
            'ml-auto flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent',
            saved ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Bookmark className={cn('h-4 w-4', saved && 'fill-current')} />
          <span className="hidden sm:inline">{saved ? 'Saved' : 'Save'}</span>
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="mt-3 space-y-3 border-t border-border pt-3">
          {comments.map((c) => (
            <CommentRow key={c.id} comment={c} />
          ))}
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={users.me.avatar} alt={users.me.name} />
              <AvatarFallback>{users.me.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-1 items-center gap-2 rounded-full border border-input bg-muted/50 px-3 py-1.5">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addComment()}
                placeholder="Write a comment…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <button
                onClick={addComment}
                disabled={!draft.trim()}
                className="text-muted-foreground transition-colors hover:text-primary disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

function ReactionPicker({ current, onPick }: { current: ReactionType | null; onPick: (t: ReactionType) => void }) {
  const [open, setOpen] = useState(false);
  const active = reactionConfig.find((r) => r.type === current);
  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        onClick={() => (current ? onPick(current) : onPick('like'))}
        className={cn(
          'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent',
          current ? active?.color : 'text-muted-foreground hover:text-foreground',
        )}
      >
        {active ? (
          <active.icon className={cn('h-4 w-4', active?.color, current === 'love' && 'fill-current')} />
        ) : (
          <ThumbsUp className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">{current ? active?.label : 'Like'}</span>
      </button>

      {open && (
        <div className="absolute -top-12 left-0 z-20 flex gap-1 rounded-full border border-border bg-popover p-1.5 shadow-card animate-float-up">
          {reactionConfig.map((r) => (
            <button
              key={r.type}
              onClick={() => {
                onPick(r.type);
                setOpen(false);
              }}
              className="grid h-9 w-9 place-items-center rounded-full text-lg transition-transform hover:scale-125 hover:bg-accent"
              title={r.label}
            >
              {r.emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CommentRow({ comment }: { comment: Comment }) {
  const author = users[comment.authorId];
  return (
    <div className="flex gap-2.5">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={author.avatar} alt={author.name} />
        <AvatarFallback>{author.name.slice(0, 2)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl rounded-tl-sm bg-muted/60 px-3 py-2">
          <p className="text-xs font-semibold">{author.name}</p>
          <p className="text-sm text-foreground/90">{comment.text}</p>
        </div>
        <div className="mt-1 flex items-center gap-3 px-1 text-xs text-muted-foreground">
          <span>{comment.createdAt}</span>
          <button className="font-medium hover:text-foreground">Like</button>
          <button className="font-medium hover:text-foreground">Reply</button>
        </div>
      </div>
    </div>
  );
}

function ActionButton({ icon: Icon, label, onClick }: { icon: typeof MessageCircle; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function ReactionSummary({ reactions }: { reactions: Record<ReactionType, number> }) {
  const active = reactionConfig.filter((r) => reactions[r.type] > 0).slice(0, 3);
  return (
    <div className="flex -space-x-1">
      {active.map((r) => (
        <span
          key={r.type}
          className="grid h-4 w-4 place-items-center rounded-full bg-muted text-[9px] ring-2 ring-card"
        >
          {r.emoji}
        </span>
      ))}
    </div>
  );
}

function VerifiedBadge() {
  return (
    <span className="grid h-4 w-4 place-items-center rounded-full bg-primary text-primary-foreground" title="Verified">
      <Check className="h-2.5 w-2.5" strokeWidth={3} />
    </span>
  );
}
