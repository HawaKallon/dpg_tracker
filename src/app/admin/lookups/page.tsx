import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

export default async function LookupsPage() {
  const [subs, cats, subCats, locs] = await Promise.all([
    getSubProjects(),
    getCategories(),
    getSubCategories(),
    getLocations(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Configuration
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-accent mt-1">Lookups</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage sub-projects, categories, sub-categories, and locations.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sub-projects</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
          <Table>
            <THead>
              <TR><TH>Name</TH><TH>Slug</TH><TH>Order</TH><TH></TH></TR>
            </THead>
            <TBody>
              {subs.map((s) => (
                <TR key={s.id}>
                  <TD>{s.name}</TD>
                  <TD className="font-mono text-xs text-muted-foreground">{s.slug}</TD>
                  <TD>{s.display_order}</TD>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={createCategory} className="flex flex-wrap gap-3 items-end">
            <div className="min-w-56">
              <Label htmlFor="c-sp">Sub-project</Label>
              <Select id="c-sp" name="sub_project_id" required>
                <option value="">Select…</option>
                {subs.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </div>
            <div className="flex-1 min-w-48">
              <Label htmlFor="c-name">Name</Label>
              <Input id="c-name" name="name" required />
            </div>
            <Button type="submit">Add</Button>
          </form>
          <Table>
            <THead>
              <TR><TH>Name</TH><TH>Sub-project</TH><TH></TH></TR>
            </THead>
            <TBody>
              {cats.map((c) => (
                <TR key={c.id}>
                  <TD>{c.name}</TD>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sub-categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={createSubCategory} className="flex flex-wrap gap-3 items-end">
            <div className="min-w-56">
              <Label htmlFor="sc-cat">Category</Label>
              <Select id="sc-cat" name="category_id" required>
                <option value="">Select…</option>
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>
            <div className="flex-1 min-w-48">
              <Label htmlFor="sc-name">Name</Label>
              <Input id="sc-name" name="name" required />
            </div>
            <Button type="submit">Add</Button>
          </form>
          <Table>
            <THead>
              <TR><TH>Name</TH><TH>Category</TH><TH></TH></TR>
            </THead>
            <TBody>
              {subCats.map((sc) => (
                <TR key={sc.id}>
                  <TD>{sc.name}</TD>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Locations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
          <Table>
            <THead>
              <TR><TH>Name</TH><TH>Type</TH><TH>Region</TH><TH></TH></TR>
            </THead>
            <TBody>
              {locs.map((l) => (
                <TR key={l.id}>
                  <TD>{l.name}</TD>
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
        </CardContent>
      </Card>
    </div>
  );
}
