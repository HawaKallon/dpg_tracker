import { cn } from '@/lib/utils/cn';

export function PullQuote({
  children,
  attribution,
  className,
}: {
  children: React.ReactNode;
  attribution?: React.ReactNode;
  className?: string;
}) {
  return (
    <figure
      className={cn(
        'border-l-2 border-accent pl-5 sm:pl-6 my-2',
        className
      )}
    >
      <blockquote className="font-serif italic text-2xl sm:text-3xl leading-snug text-ink">
        {children}
      </blockquote>
      {attribution && (
        <figcaption className="mt-3 text-eyebrow text-muted-foreground">
          {attribution}
        </figcaption>
      )}
    </figure>
  );
}
