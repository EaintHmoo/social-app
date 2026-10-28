import { useState } from 'react';
import {
  MapPin,
  Link as LinkIcon,
  Calendar,
  Settings,
  Grid2x2,
  Video,
  Bookmark,
  Heart,
  MessageCircle,
  Share2,
  Users,
  Check,
  Pencil,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { users, posts } from '@/lib/mock-data';

const cover =
  'https://images.pexels.com/photos/19273401/pexels-photo-19273401.jpeg?auto=compress&cs=tinysrgb&h=400&w=1200';

export function ProfileView() {
  const me = users.me;
  const myPosts = posts.filter((p) => p.authorId === 'me');
  const [tab, setTab] = useState<'posts' | 'media' | 'meetings' | 'saved'>('posts');

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 py-5">
      {/* Cover */}
      <div className="relative overflow-hidden rounded-2xl border border-border">
        <img src={cover} alt="" className="h-40 w-full object-cover sm:h-52" />
        <button className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-lg bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/60">
          <Pencil className="h-4 w-4" />
        </button>
      </div>

      {/* Identity row */}
      <div className="relative -mt-12 px-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <Avatar className="h-24 w-24 border-4 border-background shadow-card">
              <AvatarImage src={me.avatar} alt={me.name} />
              <AvatarFallback>{me.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="pb-1">
              <div className="flex items-center gap-1.5">
                <h2 className="text-xl font-bold">{me.name}</h2>
                {me.verified && (
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">@{me.username} · {me.role}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" className="gap-2 rounded-xl">
              <Settings className="h-4 w-4" />
              Edit profile
            </Button>
            <Button className="gap-2 rounded-xl shadow-glow">
              <Video className="h-4 w-4" />
              Start meeting
            </Button>
          </div>
        </div>

        <p className="mt-4 max-w-xl text-sm leading-relaxed text-foreground/90">{me.bio}</p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Lisbon, Portugal</span>
          <span className="flex items-center gap-1"><LinkIcon className="h-3.5 w-3.5" /> alexrivera.design</span>
          <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Joined Mar 2023</span>
        </div>

        <div className="mt-3 flex gap-5 text-sm">
          <Stat label="Following" value={me.following} />
          <Stat label="Followers" value={me.followers} />
          <Stat label="Posts" value={myPosts.length} />
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="px-4 sm:px-6">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="posts" className="gap-1.5"><Grid2x2 className="h-4 w-4" /> Posts</TabsTrigger>
          <TabsTrigger value="media" className="gap-1.5"><Heart className="h-4 w-4" /> Media</TabsTrigger>
          <TabsTrigger value="meetings" className="gap-1.5"><Video className="h-4 w-4" /> Meetings</TabsTrigger>
          <TabsTrigger value="saved" className="gap-1.5"><Bookmark className="h-4 w-4" /> Saved</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="px-4 sm:px-6">
        {tab === 'posts' && (
          <div className="space-y-4">
            {myPosts.length === 0 ? (
              <EmptyHint icon={Grid2x2} text="You haven't posted yet" />
            ) : (
              myPosts.map((p) => (
                <MiniPost key={p.id} text={p.text} images={p.images} createdAt={p.createdAt} />
              ))
            )}
          </div>
        )}
        {tab === 'media' && (
          <div className="grid grid-cols-3 gap-1.5">
            {posts.filter((p) => p.images.length > 0).flatMap((p) => p.images).map((src, i) => (
              <img key={i} src={src} alt="" className="aspect-square w-full rounded-lg object-cover" />
            ))}
          </div>
        )}
        {tab === 'meetings' && <EmptyHint icon={Video} text="Your hosted meetings will show up here" />}
        {tab === 'saved' && <EmptyHint icon={Bookmark} text="Saved posts will appear here" />}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <button className="group text-left">
      <span className="font-bold tabular-nums">{value.toLocaleString()}</span>{' '}
      <span className="text-muted-foreground group-hover:text-foreground">{label}</span>
    </button>
  );
}

function MiniPost({ text, images, createdAt }: { text: string; images: string[]; createdAt: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-4 shadow-soft">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{createdAt}</span><span>·</span><span>Public</span>
      </div>
      <p className="mt-2 line-clamp-3 text-sm">{text}</p>
      {images.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-1.5">
          {images.slice(0, 2).map((src, i) => (
            <img key={i} src={src} alt="" className="h-32 w-full rounded-lg object-cover" />
          ))}
        </div>
      )}
      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> 0</span>
        <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> 0</span>
        <span className="flex items-center gap-1"><Share2 className="h-3.5 w-3.5" /> 0</span>
      </div>
    </div>
  );
}

function EmptyHint({ icon: Icon, text }: { icon: typeof Users; text: string }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-border py-14 text-center">
      <Icon className="h-7 w-7 text-muted-foreground" />
      <p className="mt-2 text-sm font-medium">{text}</p>
    </div>
  );
}

