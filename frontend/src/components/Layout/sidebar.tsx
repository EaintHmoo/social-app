import { NavLink } from 'react-router-dom';
import { Plus, MonitorSmartphone, ShieldCheck, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/Layout/logo';
import { navItems, type UnreadCounts } from '@/components/Layout/nav';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth';

interface SidebarProps {
  unread: UnreadCounts;
  onNewMeeting: () => void;
  onSignOut: () => void;
  signingOut: boolean;
  /** Called after any link is clicked — the mobile drawer uses it to close itself. */
  onNavigate?: () => void;
  className?: string;
}

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
    isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
  );

export function Sidebar({ unread, onNewMeeting, onSignOut, signingOut, onNavigate, className }: SidebarProps) {
  const { user } = useAuth();
  const name = user?.name ?? '';

  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card/40 px-3 py-5 backdrop-blur md:flex lg:w-72',
        className,
      )}
    >
      <div className="px-2">
        <Logo />
      </div>

      <nav className="mt-7 flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const badge = item.badge ? unread[item.badge] : 0;
          const Icon = item.icon;
          return (
            // NavLink passes { isActive } to className/children, so the highlight follows the URL
            // — no `view` state to keep in sync.
            <NavLink key={item.path} to={item.path} onClick={onNavigate} className={linkClass}>
              {({ isActive }) => (
                <>
                  <span className="relative">
                    <Icon className="h-5 w-5" strokeWidth={isActive ? 2.4 : 2} />
                    {badge > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground ring-2 ring-card">
                        {badge}
                      </span>
                    )}
                  </span>
                  <span>{item.label}</span>
                  {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
                </>
              )}
            </NavLink>
          );
        })}

        <Button onClick={onNewMeeting} className="mt-4 gap-2 rounded-xl shadow-glow" size="lg">
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          New Meeting
        </Button>
      </nav>

      <div className="mt-2 space-y-1 border-t border-border pt-3">
        <NavLink to="/devices" onClick={onNavigate} className={linkClass}>
          <MonitorSmartphone className="h-5 w-5" />
          Devices
        </NavLink>
        <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
          <ShieldCheck className="h-5 w-5" />
          Admin
        </button>
      </div>

      <div className="mt-3 flex items-center gap-3 rounded-xl border border-border bg-background/60 p-2.5">
        <NavLink to="/profile" onClick={onNavigate} className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </NavLink>
        <button
          onClick={onSignOut}
          disabled={signingOut}
          aria-busy={signingOut}
          aria-label="Sign out"
          title="Sign out"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
