'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { ExternalLink, LogOut } from 'lucide-react';
import { signOut } from '@/app/login/actions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils/cn';

type Props = {
  variant: 'header' | 'sidebar';
  displayName: string;
  email: string;
  role: string;
  initials: string;
};

export function AdminUserMenu({ variant, displayName, email, role, initials }: Props) {
  const [isPending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === 'header' ? (
          <button
            type="button"
            aria-label="Open account menu"
            className={cn(
              'inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground text-xs font-semibold border border-border',
              'transition-colors hover:bg-muted/70 hover:border-ring',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
          >
            {initials || 'A'}
          </button>
        ) : (
          <button
            type="button"
            aria-label="Open account menu"
            className={cn(
              'w-full flex items-center gap-2.5 rounded-lg border border-border bg-card p-2 text-left',
              'transition-colors hover:bg-muted/40',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-foreground text-xs font-semibold shrink-0">
              {initials || 'A'}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-medium text-foreground truncate">
                {displayName}
              </span>
              <span className="block text-[11px] text-muted-foreground truncate">
                {email}
              </span>
            </span>
            <LogOut className="size-4 text-muted-foreground shrink-0" aria-hidden="true" />
          </button>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={variant === 'header' ? 'end' : 'start'}
        side={variant === 'header' ? 'bottom' : 'top'}
        sideOffset={8}
        className="w-64"
      >
        <div className="px-2.5 py-2.5 flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground text-xs font-semibold shrink-0">
            {initials || 'A'}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{email}</p>
          </div>
        </div>
        <div className="px-2.5 pb-2">
          <span className="inline-flex items-center rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {role}
          </span>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/" className="cursor-pointer">
            <ExternalLink className="size-4" />
            <span className="flex-1">Public site</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          destructive
          disabled={isPending}
          onSelect={(e) => {
            e.preventDefault();
            startTransition(() => {
              void signOut();
            });
          }}
        >
          <LogOut className="size-4" />
          <span className="flex-1">{isPending ? 'Signing out…' : 'Sign out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
