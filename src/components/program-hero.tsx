import { GraduationCap, HeartHandshake, Building2 } from 'lucide-react';
import { programContent, type ProgramPartner } from '@/content/program';

const audienceIcons = [GraduationCap, Building2, HeartHandshake];

export function ProgramHero({
  currentYear,
  controls,
}: {
  currentYear: number;
  controls?: React.ReactNode;
}) {
  return (
    <section
      aria-label="About the program"
      className="bg-gradient-to-b from-primary/10 to-transparent border-b border-border"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-wider text-primary-deep font-medium">
              {programContent.eyebrow} · {currentYear}
            </p>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-accent mt-2">
              {programContent.headline}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-3 leading-relaxed">
              {programContent.tagline}
            </p>
            <p className="text-sm text-foreground mt-4 leading-relaxed">
              {programContent.mission}
            </p>
          </div>
          {controls && <div className="flex items-center gap-3 shrink-0">{controls}</div>}
        </div>

        {programContent.whoWeServe.length > 0 && (
          <ul
            aria-label="Who the program serves"
            className="grid grid-cols-1 sm:grid-cols-3 gap-3"
          >
            {programContent.whoWeServe.map((audience, i) => {
              const Icon = audienceIcons[i % audienceIcons.length];
              return (
                <li
                  key={audience.label}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card/60 p-4"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary/15 text-primary-deep shrink-0">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-accent">{audience.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {audience.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <PartnerStrip partners={programContent.partners} funders={programContent.funders} />
      </div>
    </section>
  );
}

function PartnerStrip({
  partners,
  funders,
}: {
  partners: readonly ProgramPartner[];
  funders: readonly ProgramPartner[];
}) {
  if (partners.length === 0 && funders.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-3 pt-2 border-t border-border/60">
      {funders.length > 0 && (
        <PartnerGroup label="Supported by" items={funders} />
      )}
      {partners.length > 0 && (
        <PartnerGroup label="In partnership with" items={partners} />
      )}
    </div>
  );
}

function PartnerGroup({
  label,
  items,
}: {
  label: string;
  items: readonly ProgramPartner[];
}) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
        {label}
      </span>
      <ul className="flex flex-wrap items-center gap-4">
        {items.map((p) => (
          <li key={p.name}>
            {p.url ? (
              <a
                href={p.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-accent hover:text-primary-deep"
              >
                {p.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.logoUrl} alt={p.name} className="h-6 w-auto" />
                ) : (
                  <span className="font-medium">{p.name}</span>
                )}
              </a>
            ) : (
              <span className="inline-flex items-center gap-2 text-sm text-accent">
                {p.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.logoUrl} alt={p.name} className="h-6 w-auto" />
                ) : (
                  <span className="font-medium">{p.name}</span>
                )}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
