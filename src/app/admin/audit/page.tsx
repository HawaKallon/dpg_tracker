import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/server';
import type { AuditLog } from '@/types/database';

function formatDate(s: string) {
  return new Date(s).toLocaleString();
}

const variantFor = (action: string) => {
  if (action === 'insert') return 'success' as const;
  if (action === 'delete') return 'warning' as const;
  return 'default' as const;
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
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          History
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-accent mt-1">Audit log</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Every insert, update, and delete across activities and lookups.
        </p>
      </div>
      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error.message}
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Recent changes ({rows.length})</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
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
                  <TD className="whitespace-nowrap text-muted-foreground text-xs">
                    {formatDate(r.created_at)}
                  </TD>
                  <TD className="text-xs">{r.actor_email ?? '—'}</TD>
                  <TD className="text-xs font-mono text-muted-foreground">{r.table_name}</TD>
                  <TD>
                    <Badge variant={variantFor(r.action)}>{r.action}</Badge>
                  </TD>
                  <TD>
                    <details className="cursor-pointer">
                      <summary className="text-xs text-muted-foreground">view diff</summary>
                      <pre className="mt-2 max-w-2xl whitespace-pre-wrap break-all bg-muted/50 p-2 rounded text-[11px]">
                        {JSON.stringify(r.diff, null, 2)}
                      </pre>
                    </details>
                  </TD>
                </TR>
              ))}
              {rows.length === 0 && (
                <TR>
                  <TD colSpan={5} className="text-center text-muted-foreground py-8">
                    No audit entries yet.
                  </TD>
                </TR>
              )}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
