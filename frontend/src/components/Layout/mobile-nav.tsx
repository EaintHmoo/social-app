import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { navItems, type UnreadCounts } from '@/components/Layout/nav';

// The bottom bar only has room for five slots; Explore is reachable from the top bar's search box.
const items = navItems.filter((item) => item.path !== '/search');

export function MobileNav({ unread }: { unread: UnreadCounts }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5">
        {items.map(({ path, shortLabel, icon: Icon, badge: badgeKey }) => {
          const badge = badgeKey ? unread[badgeKey] : 0;
          return (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                cn(
                  'relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative">
                    <Icon className="h-5 w-5" strokeWidth={isActive ? 2.4 : 2} />
                    {badge > 0 && (
                      <span className="absolute -right-1.5 -top-1 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground ring-2 ring-background">
                        {badge}
                      </span>
                    )}
                  </span>
                  {shortLabel}
                  {isActive && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" />}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
