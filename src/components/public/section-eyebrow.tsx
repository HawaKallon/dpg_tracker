import { cn } from '@/lib/utils/cn';

export function SectionEyebrow({
  children,
  className,
  tone = 'muted',
}: {
  children: React.ReactNode;
  className?: string;
  tone?: 'muted' | 'accent' | 'ink';
}) {
  const toneClass =
    tone === 'accent'
      ? 'text-accent'
      : tone === 'ink'
        ? 'text-ink'
        : 'text-muted-foreground';
  return (
    <span className={cn('text-eyebrow inline-flex items-center gap-2', toneClass, className)}>
      {children}
    </span>
  );
}
