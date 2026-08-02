'use client';

import { useActionState, useMemo, useState, useTransition } from 'react';
import { AlertCircle, Plus, X } from 'lucide-react';
import type { JSONContent } from '@tiptap/core';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RichTextEditor } from '@/components/editor/rich-text-editor';
import { ChipInput } from '@/components/chip-input';
import { TaxonomyChips } from '@/components/taxonomy-chips';
import { MediaPicker } from '@/components/media-picker';
import { createLocationInline, type ActivityFormState } from '../actions';
import type {
  Category,
  Location,
  RichTextDoc,
  SubProject,
} from '@/types/database';

export type ActivityFormDefaults = {
  id?: string;
  sub_project_id?: string | null;
  category_id?: string | null;
  location_id?: string | null;
  event_year?: number | null;
  activity_date?: string | null;
  month_label?: string | null;
  male_count?: number | null;
  female_count?: number | null;
  total_count?: number | null;
  notes?: string | null;
  discourse_url?: string | null;
  outcomes?: RichTextDoc | null;
  highlights?: string | null;
  media_urls?: string[] | null;
  partner_orgs?: string[] | null;
  age_bands?: string[] | null;
  roles?: string[] | null;
  updated_at?: string | null;
};

type LocationLite = { id: string; name: string; type: string };

export function ActivityForm({
  action,
  activityId,
  defaults,
  subProjects,
  categories,
  locations,
  ageBandOptions,
  roleOptions,
  submitLabel = 'Save activity',
}: {
  action: (
    prev: ActivityFormState,
    formData: FormData
  ) => Promise<ActivityFormState>;
  /**
   * Generated on the server so it is stable across hydration — it doubles as the
   * row's primary key and as the storage folder photos upload into, both of
   * which have to be settled before the first photo is picked.
   */
  activityId: string;
  defaults?: ActivityFormDefaults;
  subProjects: SubProject[];
  categories: Category[];
  locations: Location[];
  ageBandOptions: string[];
  roleOptions: string[];
  submitLabel?: string;
}) {
  const [state, formAction, isPending] = useActionState<ActivityFormState, FormData>(
    action,
    undefined
  );

  const [subProjectId, setSubProjectId] = useState(defaults?.sub_project_id ?? '');
  const [categoryId, setCategoryId] = useState(defaults?.category_id ?? '');
  const [locationId, setLocationId] = useState(defaults?.location_id ?? '');
  const [male, setMale] = useState<string>(defaults?.male_count?.toString() ?? '');
  const [female, setFemale] = useState<string>(defaults?.female_count?.toString() ?? '');
  const [total, setTotal] = useState<string>(defaults?.total_count?.toString() ?? '');

  // Every text field is controlled on purpose. React 19 resets uncontrolled
  // inputs once a form action settles — including when it fails — so leaving
  // these on defaultValue would wipe a long Notes/Outcomes write-up the moment
  // a save errored, which is the failure this form is being fixed for.
  const [activityDate, setActivityDate] = useState(defaults?.activity_date ?? '');
  const [eventYear, setEventYear] = useState(defaults?.event_year?.toString() ?? '');
  const [monthLabel, setMonthLabel] = useState(defaults?.month_label ?? '');
  const [discourseUrl, setDiscourseUrl] = useState(defaults?.discourse_url ?? '');
  const [notes, setNotes] = useState(defaults?.notes ?? '');
  const [highlights, setHighlights] = useState(defaults?.highlights ?? '');

  const [outcomes, setOutcomes] = useState<JSONContent | null>(
    (defaults?.outcomes ?? null) as JSONContent | null
  );
  const [partnerOrgs, setPartnerOrgs] = useState<string[]>(defaults?.partner_orgs ?? []);
  const [ageBands, setAgeBands] = useState<string[]>(defaults?.age_bands ?? []);
  const [roles, setRoles] = useState<string[]>(defaults?.roles ?? []);
  const [mediaUrls, setMediaUrls] = useState<string[]>(defaults?.media_urls ?? []);
  const [uploading, setUploading] = useState(false);

  const [locList, setLocList] = useState<LocationLite[]>(
    locations.map((l) => ({ id: l.id, name: l.name, type: l.type }))
  );

  const [showLocAdd, setShowLocAdd] = useState(false);
  const [newLocName, setNewLocName] = useState('');
  const [newLocType, setNewLocType] = useState<'university' | 'hub' | 'online' | 'other'>(
    'university'
  );
  const [locError, setLocError] = useState<string | null>(null);

  const [pendingLoc, startLocTransition] = useTransition();

  const filteredCats = useMemo(
    () => categories.filter((c) => !subProjectId || c.sub_project_id === subProjectId),
    [categories, subProjectId]
  );

  // The gender split is often incomplete, so M + F legitimately disagrees with
  // the headcount. Suggest the sum, never apply it: an earlier version derived
  // the Total on every render, which silently rewrote hand-entered figures the
  // next time the activity was opened.
  const genderSum =
    male.trim() !== '' || female.trim() !== ''
      ? (Number(male) || 0) + (Number(female) || 0)
      : null;
  const totalNum = total.trim() === '' ? null : Number(total);
  const sumDiffers = genderSum !== null && totalNum !== null && totalNum !== genderSum;
  const totalBelowSum = genderSum !== null && totalNum !== null && totalNum < genderSum;

  /** Fill an empty Total as a convenience; never overwrite a value that's there. */
  function fillTotalIfEmpty(nextMale: string, nextFemale: string) {
    if (total.trim() !== '') return;
    if (nextMale.trim() === '' && nextFemale.trim() === '') return;
    setTotal(String((Number(nextMale) || 0) + (Number(nextFemale) || 0)));
  }

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
          prev.some((p) => p.id === created.id)
            ? prev
            : [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
        );
        setLocationId(created.id);
        setNewLocName('');
        setShowLocAdd(false);
      } catch (e) {
        setLocError(e instanceof Error ? e.message : 'Failed to create location');
      }
    });
  }

  return (
    <form action={formAction} className="space-y-8 w-full">
      <input type="hidden" name="activity_id" value={activityId} />
      {defaults?.updated_at && (
        <input type="hidden" name="row_version" value={defaults.updated_at} />
      )}
      <input
        type="hidden"
        name="outcomes"
        value={outcomes ? JSON.stringify(outcomes) : ''}
      />
      {partnerOrgs.map((p, i) => (
        <input key={`${p}-${i}`} type="hidden" name="partner_orgs" value={p} />
      ))}
      {ageBands.map((p, i) => (
        <input key={`ab-${p}-${i}`} type="hidden" name="age_bands" value={p} />
      ))}
      {roles.map((p, i) => (
        <input key={`r-${p}-${i}`} type="hidden" name="roles" value={p} />
      ))}

      {state?.error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="size-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">This activity was not saved.</p>
            <p className="mt-0.5">{state.error}</p>
          </div>
        </div>
      )}

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
            onChange={(e) => setCategoryId(e.target.value)}
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
            Year drives every dashboard filter. It follows the date unless you set it
            explicitly. Month label is for legacy/fuzzy entries.
          </p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label htmlFor="activity_date">Date</Label>
          <Input
            id="activity_date"
            name="activity_date"
            type="date"
            value={activityDate}
            onChange={(e) => setActivityDate(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="event_year">Year</Label>
          <Input
            id="event_year"
            name="event_year"
            type="number"
            min={2000}
            max={2100}
            placeholder="From the date"
            value={eventYear}
            onChange={(e) => setEventYear(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Leave blank to take the year from the date. With neither, the current year
            is used.
          </p>
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="month_label">Month label</Label>
          <Input
            id="month_label"
            name="month_label"
            placeholder='e.g. "July" or "Start - July 31st"'
            value={monthLabel}
            onChange={(e) => setMonthLabel(e.target.value)}
          />
        </div>
        </div>
      </section>

      <section>
        <header className="mb-4">
          <h2 className="text-sm font-semibold text-accent">Participants</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Total is the headcount you report. It is only filled in for you when it is
            blank — it is never recalculated behind your back.
          </p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="space-y-1.5">
            <Label htmlFor="male_count">Male</Label>
            <Input
              id="male_count"
              name="male_count"
              type="number"
              min={0}
              step={1}
              value={male}
              onChange={(e) => {
                setMale(e.target.value);
                fillTotalIfEmpty(e.target.value, female);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="female_count">Female</Label>
            <Input
              id="female_count"
              name="female_count"
              type="number"
              min={0}
              step={1}
              value={female}
              onChange={(e) => {
                setFemale(e.target.value);
                fillTotalIfEmpty(male, e.target.value);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="total_count">Total</Label>
            <Input
              id="total_count"
              name="total_count"
              type="number"
              min={0}
              step={1}
              value={total}
              onChange={(e) => setTotal(e.target.value)}
            />
            {sumDiffers && (
              <p
                className={
                  totalBelowSum
                    ? 'text-xs text-destructive'
                    : 'text-xs text-muted-foreground'
                }
              >
                {totalBelowSum
                  ? `Total is below Male + Female (${genderSum}).`
                  : `Male + Female = ${genderSum}.`}{' '}
                <button
                  type="button"
                  onClick={() => setTotal(String(genderSum))}
                  className="text-primary underline underline-offset-2"
                >
                  Use {genderSum}
                </button>
              </p>
            )}
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
              value={discourseUrl}
              onChange={(e) => setDiscourseUrl(e.target.value)}
            />
          </div>
          <div className="space-y-1.5 md:row-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={6}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-full"
            />
          </div>
        </div>
      </section>

      <section>
        <header className="mb-4">
          <h2 className="text-sm font-semibold text-accent">Story &amp; outcomes</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            What changed because of this activity? This is what funders read.
          </p>
        </header>
        <div className="space-y-5">
          <div className="space-y-1.5">
            {/* Not htmlFor — the editable surface is Tiptap's contenteditable, not an input. */}
            <Label>Outcomes</Label>
            <RichTextEditor
              value={outcomes}
              onChange={setOutcomes}
              placeholder="What did participants learn, build, or commit to?"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="highlights">Highlight quote</Label>
            <Textarea
              id="highlights"
              name="highlights"
              rows={2}
              maxLength={280}
              value={highlights}
              onChange={(e) => setHighlights(e.target.value)}
              placeholder="One memorable line — a participant quote, an outcome stat, anything funders should remember."
            />
          </div>
          <div className="space-y-1.5">
            <Label>Partner organizations</Label>
            <ChipInput
              values={partnerOrgs}
              onChange={setPartnerOrgs}
              placeholder="Type a name and press Enter or comma…"
            />
            <p className="text-xs text-muted-foreground">
              Co-hosts, sponsors, or other orgs credited for this activity.
            </p>
          </div>
        </div>
      </section>

      <section>
        <header className="mb-4">
          <h2 className="text-sm font-semibold text-accent">Demographics</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Who attended? Pick from the controlled vocabulary so reports can roll up cleanly.
          </p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label>Age bands</Label>
            <TaxonomyChips
              values={ageBands}
              onChange={setAgeBands}
              options={ageBandOptions}
              placeholder="Add an age band…"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Roles</Label>
            <TaxonomyChips
              values={roles}
              onChange={setRoles}
              options={roleOptions}
              placeholder="Add a role…"
            />
          </div>
        </div>
      </section>

      <section>
        <header className="mb-4">
          <h2 className="text-sm font-semibold text-accent">Photos</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Upload images from the activity. They appear on the public detail page.
          </p>
        </header>
        <MediaPicker
          activityId={activityId}
          urls={mediaUrls}
          onUrlsChange={setMediaUrls}
          onUploadingChange={setUploading}
        />
      </section>

      <div className="flex items-center gap-3 justify-end pt-2 border-t border-border">
        {uploading && (
          <span className="text-xs text-muted-foreground">
            Waiting for photo uploads…
          </span>
        )}
        <Button type="submit" size="lg" disabled={isPending || uploading}>
          {isPending ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
