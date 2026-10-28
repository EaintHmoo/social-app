import { useState } from 'react';
import { Composer } from '@/components/Feed/composer';
import { StoriesRail } from '@/components/Feed/stories-rail';
import { PostCard } from '@/components/Feed/post-card';
import { posts as initialPosts, type Post } from '@/lib/mock-data';
import { Sparkles, Loader2 } from 'lucide-react';

export function FeedView() {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [loading, setLoading] = useState(false);

  const handleNewPost = (text: string) => {
    const newPost: Post = {
      id: `p-${Date.now()}`,
      authorId: 'me',
      text,
      images: [],
      visibility: 'PUBLIC',
      createdAt: 'now',
      reactions: { like: 0, love: 0, laugh: 0, sad: 0 },
      reactionByMe: null,
      commentCount: 0,
      comments: [],
      shareCount: 0,
    };
    setPosts((p) => [newPost, ...p]);
  };

  const loadMore = () => {
    setLoading(true);
    // Simulated cursor pagination; real app fetches the next page.
    setTimeout(() => setLoading(false), 900);
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 py-5">
      <StoriesRail />
      <Composer onPost={handleNewPost} />
      <div className="space-y-4">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>

      <button
        onClick={loadMore}
        disabled={loading}
        className="mx-auto flex items-center gap-2 rounded-full border border-border bg-card/60 px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {loading ? 'Loading more…' : 'Load more posts'}
      </button>
    </div>
  );
}
