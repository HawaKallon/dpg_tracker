import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

export function TableSkeleton({
  columns = 5,
  rows = 6,
  headers,
}: {
  columns?: number;
  rows?: number;
  headers?: string[];
}) {
  const cols = headers?.length ?? columns;
  return (
    <Table>
      <THead>
        <TR>
          {Array.from({ length: cols }).map((_, i) => (
            <TH key={i}>{headers?.[i] ?? ''}</TH>
          ))}
        </TR>
      </THead>
      <TBody>
        {Array.from({ length: rows }).map((_, r) => (
          <TR key={r}>
            {Array.from({ length: cols }).map((_, c) => (
              <TD key={c}>
                <div className="h-3.5 rounded bg-muted animate-pulse" />
              </TD>
            ))}
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
