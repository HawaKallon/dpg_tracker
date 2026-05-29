import { History } from 'lucide-react';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/server';
import type { AuditLog } from '@/types/database';
import { ListToolbar } from '../_components/list-toolbar';
import { EmptyState } from '../_components/empty-state';

function formatDate(s: string) {
  return new Date(s).toLocaleString();
}

const variantFor = (action: string) => {
  if (action === 'insert') return 'success' as const;
  if (action === 'delete') return 'destructive' as const;
  if (action === 'update') return 'default' as const;
  return 'muted' as const;
};

export default async function AuditPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  const rows = (data ?? []) as AuditLog[];

  return (
    <div className="space-y-6">
      <ListToolbar
        title="Audit log"
        count={rows.length}
        description="Every insert, update, and delete across activities and lookups."
      />

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error.message}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState
            icon={History}
            title="No audit entries yet"
            description="Changes to activities and lookups will appear here."
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>When</TH>
                <TH>Actor</TH>
                <TH>Table</TH>
                <TH>Action</TH>
                <TH>Row</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((r) => (
                <TR key={r.id}>
                  <TD className="whitespace-nowrap text-muted-foreground text-xs tabular-nums">
                    {formatDate(r.created_at)}
                  </TD>
                  <TD className="text-xs text-foreground">{r.actor_email ?? '—'}</TD>
                  <TD className="text-xs font-mono text-muted-foreground">{r.table_name}</TD>
                  <TD>
                    <Badge variant={variantFor(r.action)}>{r.action}</Badge>
                  </TD>
                  <TD>
                    <details className="cursor-pointer group">
                      <summary className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 list-none">
                        <span className="select-none">view diff</span>
                      </summary>
                      <pre className="mt-2 max-w-2xl whitespace-pre-wrap break-all bg-muted/50 border border-border p-2 rounded-md text-[11px] text-foreground">
                        {JSON.stringify(r.diff, null, 2)}
                      </pre>
                    </details>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </div>
    </div>
  );
}
