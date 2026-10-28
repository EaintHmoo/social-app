import { useState } from 'react';
import { Search, TrendingUp, Hash, UserPlus, Check, Video } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { users, posts } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

export function SearchView() {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'people' | 'posts' | 'topics'>('people');
  const [followed, setFollowed] = useState<Set<string>>(new Set());

  const people = Object.values(users).filter(
    (u) => u.id !== 'me' && (u.name.toLowerCase().includes(query.toLowerCase()) || u.username.includes(query.toLowerCase())),
  );
  const matchingPosts = posts.filter((p) => p.text.toLowerCase().includes(query.toLowerCase()));
  const topics = ['webrtc', 'postgres', 'designsystems', 'livekit', 'remotework', 'photography'].filter((t) =>
    t.includes(query.toLowerCase()),
  );

  const toggleFollow = (id: string) =>
    setFollowed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 py-5">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people, posts, topics…"
          className="h-12 rounded-2xl pl-12 text-base shadow-soft"
        />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="w-full">
          <TabsTrigger value="people">People</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="topics">Topics</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'people' && (
        <div className="space-y-2">
          {people.length === 0 ? (
            <Empty text="No people match your search" />
          ) : (
            people.map((u) => {
              const isFollowing = followed.has(u.id);
              return (
                <div key={u.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card/60 p-3 shadow-soft">
                  <Avatar className="h-11 w-11">
                    <AvatarImage src={u.avatar} alt={u.name} />
                    <AvatarFallback>{u.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{u.name}</p>
                    <p className="truncate text-xs text-muted-foreground">@{u.username} · {u.role}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={isFollowing ? 'secondary' : 'default'}
                    onClick={() => toggleFollow(u.id)}
                    className={cn('h-8 gap-1 rounded-full px-3 text-xs')}
                  >
                    {isFollowing ? <><Check className="h-3.5 w-3.5" /> Following</> : <><UserPlus className="h-3.5 w-3.5" /> Follow</>}
                  </Button>
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === 'posts' && (
        <div className="space-y-2">
          {matchingPosts.length === 0 ? (
            <Empty text="No posts match your search" />
          ) : (
            matchingPosts.map((p) => {
              const author = users[p.authorId];
              return (
                <div key={p.id} className="rounded-2xl border border-border bg-card/60 p-4 shadow-soft">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={author.avatar} alt={author.name} />
                      <AvatarFallback>{author.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{author.name}</span>
                    <span className="text-xs text-muted-foreground">· {p.createdAt}</span>
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm text-foreground/90">{p.text}</p>
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === 'topics' && (
        <div className="space-y-2">
          {topics.length === 0 ? (
            <Empty text="No topics match your search" />
          ) : (
            topics.map((t) => (
              <button
                key={t}
                className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card/60 p-4 text-left shadow-soft transition-colors hover:bg-accent/50"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                  <Hash className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold">#{t}</p>
                  <p className="text-xs text-muted-foreground">Trending in your network</p>
                </div>
                <TrendingUp className="h-4 w-4 text-success" />
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-border py-14 text-center">
      <Video className="h-7 w-7 text-muted-foreground" />
      <p className="mt-2 text-sm font-medium">{text}</p>
    </div>
  );
}
