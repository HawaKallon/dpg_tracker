'use client';

import { useMemo, useState, useTransition } from 'react';
import { Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { createLocationInline, createSubCategoryInline } from '../actions';
import type { Category, Location, SubCategory, SubProject } from '@/types/database';

export type ActivityFormDefaults = {
  id?: string;
  sub_project_id?: string | null;
  category_id?: string | null;
  sub_category_id?: string | null;
  location_id?: string | null;
  event_year?: number | null;
  activity_date?: string | null;
  month_label?: string | null;
  male_count?: number | null;
  female_count?: number | null;
  total_count?: number | null;
  reach?: number | null;
  notes?: string | null;
  discourse_url?: string | null;
};

type LocationLite = { id: string; name: string; type: string };
type SubCategoryLite = { id: string; category_id: string; name: string };

export function ActivityForm({
  action,
  defaults,
  subProjects,
  categories,
  subCategories,
  locations,
  submitLabel = 'Save activity',
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaults?: ActivityFormDefaults;
  subProjects: SubProject[];
  categories: Category[];
  subCategories: SubCategory[];
  locations: Location[];
  submitLabel?: string;
}) {
  const [subProjectId, setSubProjectId] = useState(defaults?.sub_project_id ?? '');
  const [categoryId, setCategoryId] = useState(defaults?.category_id ?? '');
  const [subCategoryId, setSubCategoryId] = useState(defaults?.sub_category_id ?? '');
  const [locationId, setLocationId] = useState(defaults?.location_id ?? '');
  const [male, setMale] = useState<string>(defaults?.male_count?.toString() ?? '');
  const [female, setFemale] = useState<string>(defaults?.female_count?.toString() ?? '');
  const [total, setTotal] = useState<string>(defaults?.total_count?.toString() ?? '');
  const [totalEdited, setTotalEdited] = useState(false);

  const [locList, setLocList] = useState<LocationLite[]>(
    locations.map((l) => ({ id: l.id, name: l.name, type: l.type }))
  );
  const [subCatList, setSubCatList] = useState<SubCategoryLite[]>(
    subCategories.map((sc) => ({ id: sc.id, category_id: sc.category_id, name: sc.name }))
  );

  const [showLocAdd, setShowLocAdd] = useState(false);
  const [newLocName, setNewLocName] = useState('');
  const [newLocType, setNewLocType] = useState<'university' | 'hub' | 'online' | 'other'>(
    'university'
  );
  const [locError, setLocError] = useState<string | null>(null);

  const [showSubCatAdd, setShowSubCatAdd] = useState(false);
  const [newSubCatName, setNewSubCatName] = useState('');
  const [subCatError, setSubCatError] = useState<string | null>(null);

  const [pendingLoc, startLocTransition] = useTransition();
  const [pendingSubCat, startSubCatTransition] = useTransition();

  const filteredCats = useMemo(
    () => categories.filter((c) => !subProjectId || c.sub_project_id === subProjectId),
    [categories, subProjectId]
  );
  const filteredSubCats = useMemo(
    () => subCatList.filter((sc) => !categoryId || sc.category_id === categoryId),
    [subCatList, categoryId]
  );

  const autoTotal = (() => {
    if (totalEdited) return total;
    const m = Number(male);
    const f = Number(female);
    if (Number.isFinite(m) && Number.isFinite(f) && (male !== '' || female !== '')) {
      return String((Number.isFinite(m) ? m : 0) + (Number.isFinite(f) ? f : 0));
    }
    return total;
  })();

  function handleAddLocation() {
    setLocError(null);
    const name = newLocName.trim();
    if (!name) {
      setLocError('Name is required');
      return;
    }
    startLocTransition(async () => {
      try {
        const created = await createLocationInline({ name, type: newLocType });
        setLocList((prev) =>
          prev.some((p) => p.id === created.id) ? prev : [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
        );
        setLocationId(created.id);
        setNewLocName('');
        setShowLocAdd(false);
      } catch (e) {
        setLocError(e instanceof Error ? e.message : 'Failed to create location');
      }
    });
  }

  function handleAddSubCategory() {
    setSubCatError(null);
    const name = newSubCatName.trim();
    if (!categoryId) {
      setSubCatError('Pick a category first');
      return;
    }
    if (!name) {
      setSubCatError('Name is required');
      return;
    }
    startSubCatTransition(async () => {
      try {
        const created = await createSubCategoryInline({ category_id: categoryId, name });
        setSubCatList((prev) =>
          prev.some((p) => p.id === created.id) ? prev : [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
        );
        setSubCategoryId(created.id);
        setNewSubCatName('');
        setShowSubCatAdd(false);
      } catch (e) {
        setSubCatError(e instanceof Error ? e.message : 'Failed to create sub-category');
      }
    });
  }

  return (
    <form action={action} className="space-y-8 w-full">
      <section>
        <header className="mb-4">
          <h2 className="text-sm font-semibold text-accent">Classification</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Where this activity sits in the program hierarchy.
          </p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label htmlFor="sub_project_id">Sub-project *</Label>
          <Select
            id="sub_project_id"
            name="sub_project_id"
            required
            value={subProjectId ?? ''}
            onChange={(e) => {
              setSubProjectId(e.target.value);
              setCategoryId('');
              setSubCategoryId('');
            }}
          >
            <option value="">Select…</option>
            {subProjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="category_id">Category</Label>
          <Select
            id="category_id"
            name="category_id"
            value={categoryId ?? ''}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setSubCategoryId('');
            }}
            disabled={!subProjectId}
          >
            <option value="">—</option>
            {filteredCats.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="sub_category_id">Sub-category</Label>
            {!showSubCatAdd && (
              <button
                type="button"
                onClick={() => {
                  setShowSubCatAdd(true);
                  setSubCatError(null);
                }}
                disabled={!categoryId}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed"
              >
                <Plus className="size-3" />
                Add new
              </button>
            )}
          </div>
          {showSubCatAdd ? (
            <div className="space-y-1.5">
              <div className="flex gap-2">
                <Input
                  value={newSubCatName}
                  onChange={(e) => setNewSubCatName(e.target.value)}
                  placeholder="New sub-category name"
                  disabled={pendingSubCat}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddSubCategory}
                  disabled={pendingSubCat}
                >
                  {pendingSubCat ? 'Adding…' : 'Create'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowSubCatAdd(false);
                    setNewSubCatName('');
                    setSubCatError(null);
                  }}
                  disabled={pendingSubCat}
                  aria-label="Cancel"
                >
                  <X className="size-4" />
                </Button>
              </div>
              {subCatError && <p className="text-xs text-destructive">{subCatError}</p>}
            </div>
          ) : (
            <Select
              id="sub_category_id"
              name="sub_category_id"
              value={subCategoryId ?? ''}
              onChange={(e) => setSubCategoryId(e.target.value)}
              disabled={!categoryId}
            >
              <option value="">—</option>
              {filteredSubCats.map((sc) => (
                <option key={sc.id} value={sc.id}>{sc.name}</option>
              ))}
            </Select>
          )}
          {showSubCatAdd && (
            <input type="hidden" name="sub_category_id" value={subCategoryId ?? ''} />
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="location_id">Location</Label>
            {!showLocAdd && (
              <button
                type="button"
                onClick={() => {
                  setShowLocAdd(true);
                  setLocError(null);
                }}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Plus className="size-3" />
                Add new
              </button>
            )}
          </div>
          {showLocAdd ? (
            <div className="space-y-1.5">
              <div className="flex gap-2">
                <Input
                  value={newLocName}
                  onChange={(e) => setNewLocName(e.target.value)}
                  placeholder="New location name"
                  disabled={pendingLoc}
                />
                <Select
                  value={newLocType}
                  onChange={(e) =>
                    setNewLocType(e.target.value as 'university' | 'hub' | 'online' | 'other')
                  }
                  disabled={pendingLoc}
                  className="w-32"
                >
                  <option value="university">University</option>
                  <option value="hub">Hub</option>
                  <option value="online">Online</option>
                  <option value="other">Other</option>
                </Select>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddLocation}
                  disabled={pendingLoc}
                >
                  {pendingLoc ? 'Adding…' : 'Create'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowLocAdd(false);
                    setNewLocName('');
                    setLocError(null);
                  }}
                  disabled={pendingLoc}
                  aria-label="Cancel"
                >
                  <X className="size-4" />
                </Button>
              </div>
              {locError && <p className="text-xs text-destructive">{locError}</p>}
            </div>
          ) : (
            <Select
              id="location_id"
              name="location_id"
              value={locationId ?? ''}
              onChange={(e) => setLocationId(e.target.value)}
            >
              <option value="">—</option>
              {locList.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </Select>
          )}
          {showLocAdd && <input type="hidden" name="location_id" value={locationId ?? ''} />}
        </div>
        </div>
      </section>

      <section>
        <header className="mb-4">
          <h2 className="text-sm font-semibold text-accent">When</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Year drives dashboard filtering. Date is exact; month label is for legacy/fuzzy entries.
          </p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label htmlFor="event_year">Year *</Label>
          <Input
            id="event_year"
            name="event_year"
            type="number"
            min={2020}
            max={2100}
            required
            defaultValue={defaults?.event_year ?? new Date().getFullYear()}
          />
          <p className="text-xs text-muted-foreground">Used to filter the dashboard by year.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="activity_date">Date</Label>
          <Input
            id="activity_date"
            name="activity_date"
            type="date"
            defaultValue={defaults?.activity_date ?? ''}
          />
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="month_label">Month label</Label>
          <Input
            id="month_label"
            name="month_label"
            placeholder='e.g. "July" or "Start - July 31st"'
            defaultValue={defaults?.month_label ?? ''}
          />
        </div>
        </div>
      </section>

      <section>
        <header className="mb-4">
          <h2 className="text-sm font-semibold text-accent">Participants & reach</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Total auto-calculates from M + F until you edit it. Reach is the broader audience
            (Discourse views, social engagement, livestream viewers).
          </p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="space-y-1.5">
            <Label htmlFor="male_count">Male</Label>
            <Input
              id="male_count"
              name="male_count"
              type="number"
              min={0}
              value={male}
              onChange={(e) => setMale(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="female_count">Female</Label>
            <Input
              id="female_count"
              name="female_count"
              type="number"
              min={0}
              value={female}
              onChange={(e) => setFemale(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="total_count">Total</Label>
            <Input
              id="total_count"
              name="total_count"
              type="number"
              min={0}
              value={autoTotal}
              onChange={(e) => {
                setTotalEdited(true);
                setTotal(e.target.value);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reach">Reach</Label>
            <Input
              id="reach"
              name="reach"
              type="number"
              min={0}
              defaultValue={defaults?.reach ?? ''}
              placeholder="e.g. 1200"
            />
            <p className="text-xs text-muted-foreground">
              Broader audience touched (not in-person participants).
            </p>
          </div>
        </div>
      </section>

      <section>
        <header className="mb-4">
          <h2 className="text-sm font-semibold text-accent">Details</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Reference link and any context worth keeping.
          </p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label htmlFor="discourse_url">Discourse URL</Label>
            <Input
              id="discourse_url"
              name="discourse_url"
              type="url"
              placeholder="https://dpg.discourse.group/t/..."
              defaultValue={defaults?.discourse_url ?? ''}
            />
          </div>
          <div className="space-y-1.5 md:row-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={6}
              defaultValue={defaults?.notes ?? ''}
              className="h-full"
            />
          </div>
        </div>
      </section>

      <div className="flex gap-2 justify-end pt-2 border-t border-border">
        <Button type="submit" size="lg">{submitLabel}</Button>
      </div>
    </form>
  );
}
