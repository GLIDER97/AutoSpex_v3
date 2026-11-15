import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ChevronDown, Menu, Moon, Sun, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { TOOL_CATEGORIES } from '../data/tools';
import { SignMarker, Wordmark } from './brand';

interface NavbarProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const FEEDBACK_URL = 'https://forms.gle/XtuvETokH5R83r1q7';

const focusRing =
  'outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-md px-3 py-2 text-[0.9375rem] font-semibold transition-colors',
    focusRing,
    isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
  );

/**
 * On phones the header slides away while scrolling down (more room for the
 * page) and comes back as soon as you scroll up. Desktop keeps it pinned.
 */
function useHideOnScroll(locked: boolean) {
  const [hidden, setHidden] = useState(false);
  const last = useRef(0);
  useEffect(() => {
    const narrow = window.matchMedia('(max-width: 1023px)');
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - last.current;
      if (!narrow.matches || locked || y < 80) setHidden(false);
      else if (delta > 6) setHidden(true);
      else if (delta < -6) setHidden(false);
      last.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [locked]);
  return hidden;
}

const Navbar: React.FC<NavbarProps> = ({ isDarkMode, toggleTheme }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const hidden = useHideOnScroll(menuOpen);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b border-border bg-background transition-transform duration-200 focus-within:translate-y-0',
        hidden && '-translate-y-full',
      )}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-1 px-4 sm:h-16 sm:gap-2 sm:px-6 lg:px-8">
        <Link to="/" aria-label="MyAutoSpex home" className={cn('mr-4 flex min-h-11 items-center rounded-md', focusRing)}>
          <Wordmark />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger
              className={cn(
                'group inline-flex items-center gap-1 rounded-md px-3 py-2 text-[0.9375rem] font-semibold text-muted-foreground transition-colors hover:text-foreground data-[state=open]:text-foreground',
                focusRing,
              )}
            >
              Tools
              <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" sideOffset={10} className="grid w-[40rem] grid-cols-2 gap-x-6 rounded-xl p-5">
              {/* Two columns, packed like the homepage directory. */}
              {[
                ['warnings', 'services'],
                ['money', 'fun'],
              ].map((column) => (
                <div key={column.join()} className="space-y-5">
                  {column.map((id) => {
                    const category = TOOL_CATEGORIES.find((c) => c.id === id)!;
                    return (
                      <div key={category.id} role="group" aria-labelledby={`nav-${category.id}`}>
                        <div
                          id={`nav-${category.id}`}
                          className="mb-1.5 flex items-center gap-2 px-2 text-sm font-bold text-foreground"
                        >
                          <SignMarker category={category.id} className="size-4" />
                          {category.name}
                        </div>
                        {category.tools.map((tool) => (
                          <DropdownMenuItem key={tool.path} asChild className="rounded-md px-2 py-1.5 text-[0.9375rem]">
                            <Link to={tool.path}>{tool.name}</Link>
                          </DropdownMenuItem>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <NavLink to="/blog" className={navLinkClass}>
            Articles
          </NavLink>
          <NavLink to="/about" className={navLinkClass}>
            About
          </NavLink>
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <a
            href={FEEDBACK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'hidden items-center gap-1.5 rounded-md px-3 py-2 text-[0.9375rem] font-semibold text-muted-foreground transition-colors hover:text-foreground xl:inline-flex',
              focusRing,
            )}
          >
            <MessageSquare className="size-4" aria-hidden="true" />
            Send feedback
          </a>
          <Button
            variant="ghost"
            size="icon-lg"
            onClick={toggleTheme}
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            className="size-11 text-muted-foreground hover:text-foreground lg:size-10"
          >
            {isDarkMode ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </Button>
          <Button
            asChild
            className="hidden h-10 rounded-lg bg-sign-green px-4 text-[0.9375rem] font-bold text-white hover:bg-sign-green-strong sm:inline-flex"
          >
            <Link to="/fault-code-decoder">Decode a code</Link>
          </Button>

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon-lg" className="size-11 lg:hidden" aria-label="Open menu">
                <Menu className="size-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[88%] gap-0 overflow-y-auto p-0 sm:max-w-sm">
              <SheetHeader className="border-b border-border px-5 py-4">
                <SheetTitle asChild>
                  <span>
                    <Wordmark />
                  </span>
                </SheetTitle>
              </SheetHeader>
              <nav aria-label="Mobile" className="flex flex-col gap-6 px-3 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                <Link
                  to="/fault-code-decoder"
                  onClick={() => setMenuOpen(false)}
                  className={cn('mx-2 flex h-12 items-center justify-center rounded-lg bg-sign-green text-base font-bold text-white active:bg-sign-green-strong', focusRing)}
                >
                  Decode a check engine code
                </Link>
                {TOOL_CATEGORIES.map((category) => (
                  <div key={category.id}>
                    <div className="mb-1 flex items-center gap-2 px-2 text-sm font-bold text-foreground">
                      <SignMarker category={category.id} className="size-4" />
                      {category.name}
                    </div>
                    <ul>
                      {category.tools.map((tool) => (
                        <li key={tool.path}>
                          <Link
                            to={tool.path}
                            onClick={() => setMenuOpen(false)}
                            className={cn(
                              'flex min-h-11 items-center rounded-md px-2 py-2 text-base text-foreground hover:bg-muted active:bg-muted',
                              focusRing,
                            )}
                          >
                            {tool.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                <ul className="border-t border-border pt-4">
                  {[
                    { to: '/blog', label: 'Articles' },
                    { to: '/about', label: 'About' },
                    { to: '/contact', label: 'Contact' },
                  ].map((item) => (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        onClick={() => setMenuOpen(false)}
                        className={cn('flex min-h-11 items-center rounded-md px-2 py-2 text-base font-semibold hover:bg-muted active:bg-muted', focusRing)}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <a
                      href={FEEDBACK_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn('flex min-h-11 items-center rounded-md px-2 py-2 text-base font-semibold hover:bg-muted active:bg-muted', focusRing)}
                    >
                      Send feedback
                    </a>
                  </li>
                </ul>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
