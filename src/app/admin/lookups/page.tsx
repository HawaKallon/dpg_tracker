import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import {
  getCategories,
  getLocations,
  getSubCategories,
  getSubProjects,
} from '@/lib/supabase/queries';
import {
  createCategory,
  createLocation,
  createSubCategory,
  createSubProject,
  deleteCategory,
  deleteLocation,
  deleteSubCategory,
  deleteSubProject,
} from './actions';
import { ListToolbar } from '../_components/list-toolbar';

function LookupSection({
  title,
  description,
  count,
  form,
  children,
}: {
  title: string;
  description?: string;
  count: number;
  form: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <header className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/30">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium text-foreground">{title}</h2>
            <span className="inline-flex items-center rounded-full border border-border bg-card px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground tabular-nums">
              {count}
            </span>
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </header>
      <div className="p-5 border-b border-border bg-background">{form}</div>
      <div>{children}</div>
    </section>
  );
}

export default async function LookupsPage() {
  const [subs, cats, subCats, locs] = await Promise.all([
    getSubProjects(),
    getCategories(),
    getSubCategories(),
    getLocations(),
  ]);

  return (
    <div className="space-y-6">
      <ListToolbar
        title="Lookups"
        description="Manage sub-projects, categories, sub-categories, and locations used across activities."
      />

      <LookupSection
        title="Sub-projects"
        description="Top-level programs."
        count={subs.length}
        form={
          <form action={createSubProject} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-48">
              <Label htmlFor="sp-name">Name</Label>
              <Input id="sp-name" name="name" required />
            </div>
            <div className="w-24">
              <Label htmlFor="sp-order">Order</Label>
              <Input id="sp-order" name="display_order" type="number" defaultValue={0} />
            </div>
            <Button type="submit">Add</Button>
          </form>
        }
      >
        <Table>
          <THead>
            <TR>
              <TH>Name</TH>
              <TH>Slug</TH>
              <TH className="text-right">Order</TH>
              <TH className="w-[1%]" />
            </TR>
          </THead>
          <TBody>
            {subs.map((s) => (
              <TR key={s.id}>
                <TD className="text-foreground">{s.name}</TD>
                <TD className="font-mono text-xs text-muted-foreground">{s.slug}</TD>
                <TD className="text-right tabular-nums text-muted-foreground">
                  {s.display_order}
                </TD>
                <TD className="text-right">
                  <form action={deleteSubProject}>
                    <input type="hidden" name="id" value={s.id} />
                    <Button type="submit" variant="ghost" size="sm" aria-label="Delete">
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </form>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </LookupSection>

      <LookupSection
        title="Categories"
        description="Belong to a sub-project."
        count={cats.length}
        form={
          <form action={createCategory} className="flex flex-wrap gap-3 items-end">
            <div className="min-w-56">
              <Label htmlFor="c-sp">Sub-project</Label>
              <Select id="c-sp" name="sub_project_id" required>
                <option value="">Select…</option>
                {subs.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex-1 min-w-48">
              <Label htmlFor="c-name">Name</Label>
              <Input id="c-name" name="name" required />
            </div>
            <Button type="submit">Add</Button>
          </form>
        }
      >
        <Table>
          <THead>
            <TR>
              <TH>Name</TH>
              <TH>Sub-project</TH>
              <TH className="w-[1%]" />
            </TR>
          </THead>
          <TBody>
            {cats.map((c) => (
              <TR key={c.id}>
                <TD className="text-foreground">{c.name}</TD>
                <TD className="text-muted-foreground">
                  {subs.find((s) => s.id === c.sub_project_id)?.name ?? '—'}
                </TD>
                <TD className="text-right">
                  <form action={deleteCategory}>
                    <input type="hidden" name="id" value={c.id} />
                    <Button type="submit" variant="ghost" size="sm" aria-label="Delete">
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </form>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </LookupSection>

      <LookupSection
        title="Sub-categories"
        description="Belong to a category."
        count={subCats.length}
        form={
          <form action={createSubCategory} className="flex flex-wrap gap-3 items-end">
            <div className="min-w-56">
              <Label htmlFor="sc-cat">Category</Label>
              <Select id="sc-cat" name="category_id" required>
                <option value="">Select…</option>
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex-1 min-w-48">
              <Label htmlFor="sc-name">Name</Label>
              <Input id="sc-name" name="name" required />
            </div>
            <Button type="submit">Add</Button>
          </form>
        }
      >
        <Table>
          <THead>
            <TR>
              <TH>Name</TH>
              <TH>Category</TH>
              <TH className="w-[1%]" />
            </TR>
          </THead>
          <TBody>
            {subCats.map((sc) => (
              <TR key={sc.id}>
                <TD className="text-foreground">{sc.name}</TD>
                <TD className="text-muted-foreground">
                  {cats.find((c) => c.id === sc.category_id)?.name ?? '—'}
                </TD>
                <TD className="text-right">
                  <form action={deleteSubCategory}>
                    <input type="hidden" name="id" value={sc.id} />
                    <Button type="submit" variant="ghost" size="sm" aria-label="Delete">
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </form>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </LookupSection>

      <LookupSection
        title="Locations"
        description="Quick-add only. For full details use the Locations page."
        count={locs.length}
        form={
          <form action={createLocation} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-48">
              <Label htmlFor="l-name">Name</Label>
              <Input id="l-name" name="name" required />
            </div>
            <div className="w-40">
              <Label htmlFor="l-type">Type</Label>
              <Select id="l-type" name="type" defaultValue="university">
                <option value="university">University</option>
                <option value="hub">Hub</option>
                <option value="online">Online</option>
                <option value="other">Other</option>
              </Select>
            </div>
            <div className="w-40">
              <Label htmlFor="l-region">Region</Label>
              <Input id="l-region" name="region" placeholder="optional" />
            </div>
            <Button type="submit">Add</Button>
          </form>
        }
      >
        <Table>
          <THead>
            <TR>
              <TH>Name</TH>
              <TH>Type</TH>
              <TH>Region</TH>
              <TH className="w-[1%]" />
            </TR>
          </THead>
          <TBody>
            {locs.map((l) => (
              <TR key={l.id}>
                <TD className="text-foreground">{l.name}</TD>
                <TD className="capitalize text-muted-foreground">{l.type}</TD>
                <TD className="text-muted-foreground">{l.region ?? '—'}</TD>
                <TD className="text-right">
                  <form action={deleteLocation}>
                    <input type="hidden" name="id" value={l.id} />
                    <Button type="submit" variant="ghost" size="sm" aria-label="Delete">
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </form>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </LookupSection>
    </div>
  );
}
