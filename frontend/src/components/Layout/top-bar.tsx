import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Moon, Sun, Bell, MessageCircle, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/Layout/logo';
import { navItems, type UnreadCounts } from '@/components/Layout/nav';
import { cn } from '@/lib/utils';

interface TopBarProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  unread: UnreadCounts;
  onOpenMenu: () => void;
}

/** Pages that live outside the main nav but still need a heading. */
const extraTitles: Record<string, { title: string; subtitle: string }> = {
  '/devices': { title: 'Devices', subtitle: 'Where you are signed in' },
};

export function TopBar({ theme, onToggleTheme, unread, onOpenMenu }: TopBarProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  // The heading is derived from the URL — the router is the single source of "which page am I on".
  const meta = navItems.find((item) => pathname.startsWith(item.path)) ?? extraTitles[pathname];

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 md:px-6">
        <button
          onClick={onOpenMenu}
          className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-accent md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="md:hidden">
          <Logo showWordmark={false} />
        </div>

        <div className="hidden min-w-0 md:block">
          <h1 className="truncate text-base font-semibold leading-tight">{meta?.title}</h1>
          <p className="truncate text-xs text-muted-foreground">{meta?.subtitle}</p>
        </div>

        <div className="relative ml-auto hidden max-w-xs flex-1 sm:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search people, posts, meetings"
            className="h-9 rounded-full border-border bg-muted/60 pl-9 pr-4 text-sm"
            onFocus={() => navigate('/search')}
          />
        </div>

        <div className="ml-auto flex items-center gap-1 sm:ml-2">
          <button
            onClick={onToggleTheme}
            className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {/* asChild makes the Button render its child <Link> instead of a <button>, so this is a
              real link (middle-click, right-click "open in new tab") with button styling. */}
          <Button asChild variant="ghost" size="icon" className="relative rounded-full md:hidden">
            <Link to="/messages" aria-label="Messages">
              <MessageCircle className="h-5 w-5" />
              {unread.messages > 0 && <Badge>{unread.messages}</Badge>}
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="relative rounded-full md:hidden">
            <Link to="/notifications" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              {unread.notifications > 0 && <Badge>{unread.notifications}</Badge>}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className={cn('absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground ring-2 ring-background')}>
      {children}
    </span>
  );
}
