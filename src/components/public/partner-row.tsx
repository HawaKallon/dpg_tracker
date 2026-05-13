import type { ProgramPartner } from '@/content/program';

export function PartnerRow({
  funders,
  partners,
}: {
  funders: readonly ProgramPartner[];
  partners: readonly ProgramPartner[];
}) {
  if (funders.length === 0 && partners.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-10 gap-y-4 pt-4 border-t border-border/60">
      {funders.length > 0 && <PartnerGroup label="Supported by" items={funders} />}
      {partners.length > 0 && <PartnerGroup label="In partnership with" items={partners} />}
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
    <div className="flex flex-col gap-2">
      <span className="text-eyebrow text-muted-foreground">{label}</span>
      <ul className="flex flex-wrap items-center gap-x-6 gap-y-3">
        {items.map((p) => (
          <li key={p.name}>
            {p.url ? (
              <a
                href={p.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-accent"
              >
                {p.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.logoUrl} alt={p.name} className="h-7 w-auto" />
                ) : (
                  <span>{p.name}</span>
                )}
              </a>
            ) : (
              <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                {p.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.logoUrl} alt={p.name} className="h-7 w-auto" />
                ) : (
                  <span>{p.name}</span>
                )}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
