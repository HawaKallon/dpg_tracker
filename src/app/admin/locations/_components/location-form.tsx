'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import type { JSONContent } from '@tiptap/core';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RichTextEditor } from '@/components/editor/rich-text-editor';
import { slugify } from '@/lib/utils/slugify';
import type { Location } from '@/types/database';

type Defaults = Partial<Location>;

export function LocationForm({
  action,
  defaults,
  submitLabel = 'Save location',
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaults?: Defaults;
  submitLabel?: string;
}) {
  const [locationId] = useState<string>(() => defaults?.id ?? crypto.randomUUID());
  const [name, setName] = useState<string>(defaults?.name ?? '');
  const [slug, setSlug] = useState<string>(defaults?.slug ?? '');
  const slugDirtyRef = useRef<boolean>(!!defaults?.slug);
  const [description, setDescription] = useState<JSONContent | null>(
    (defaults?.description ?? null) as JSONContent | null
  );
  const [keepLogoUrl, setKeepLogoUrl] = useState<string | null>(defaults?.logo_url ?? null);
  const [newLogoFile, setNewLogoFile] = useState<File | null>(null);
  const logoPreview = useMemo(
    () => (newLogoFile ? URL.createObjectURL(newLogoFile) : null),
    [newLogoFile]
  );
  useEffect(() => {
    if (!logoPreview) return;
    return () => URL.revokeObjectURL(logoPreview);
  }, [logoPreview]);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (slugDirtyRef.current) return;
    setSlug(slugify(name));
  }, [name]);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const handler = (e: FormDataEvent) => {
      if (newLogoFile) e.formData.set('logo_file', newLogoFile, newLogoFile.name);
    };
    form.addEventListener('formdata', handler);
    return () => form.removeEventListener('formdata', handler);
  }, [newLogoFile]);

  const onPickLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) return;
    if (f.size > 10 * 1024 * 1024) return;
    setNewLogoFile(f);
    e.target.value = '';
  };

  return (
    <form ref={formRef} action={action} className="space-y-8 w-full">
      <input type="hidden" name="location_id" value={locationId} />
      <input
        type="hidden"
        name="description"
        value={description ? JSON.stringify(description) : ''}
      />
      <input type="hidden" name="keep_logo_url" value={keepLogoUrl ?? ''} />

      <section>
        <header className="mb-4">
          <h2 className="text-sm font-semibold text-accent">Identity</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Name and URL slug. Editing the slug will change the public detail page URL.
          </p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              name="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              name="slug"
              value={slug}
              onChange={(e) => {
                slugDirtyRef.current = true;
                setSlug(e.target.value);
              }}
              placeholder="auto-generated from name"
            />
            <p className="text-xs text-muted-foreground">
              URL becomes <code className="text-accent">/locations/{slug || 'your-slug'}</code>
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="type">Type *</Label>
            <Select id="type" name="type" defaultValue={defaults?.type ?? 'university'} required>
              <option value="university">University</option>
              <option value="hub">Hub</option>
              <option value="online">Online</option>
              <option value="other">Other</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="partner_type">Partner type</Label>
            <Input
              id="partner_type"
              name="partner_type"
              defaultValue={defaults?.partner_type ?? ''}
              placeholder="academic / community-hub / gov / ngo …"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="region">Region</Label>
            <Input
              id="region"
              name="region"
              defaultValue={defaults?.region ?? ''}
              placeholder="Western Area, Bo, …"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="first_active_date">First active</Label>
            <Input
              id="first_active_date"
              name="first_active_date"
              type="date"
              defaultValue={defaults?.first_active_date ?? ''}
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="website_url">Website</Label>
            <Input
              id="website_url"
              name="website_url"
              type="url"
              defaultValue={defaults?.website_url ?? ''}
              placeholder="https://…"
            />
          </div>
        </div>
      </section>

      <section>
        <header className="mb-4">
          <h2 className="text-sm font-semibold text-accent">Geography</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Coordinates power the map page. Leave blank if unknown.
          </p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label htmlFor="lat">Latitude</Label>
            <Input
              id="lat"
              name="lat"
              type="number"
              step="0.000001"
              defaultValue={defaults?.lat ?? ''}
              placeholder="8.484"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lng">Longitude</Label>
            <Input
              id="lng"
              name="lng"
              type="number"
              step="0.000001"
              defaultValue={defaults?.lng ?? ''}
              placeholder="-13.234"
            />
          </div>
        </div>
      </section>

      <section>
        <header className="mb-4">
          <h2 className="text-sm font-semibold text-accent">Logo</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Square works best. JPEG / PNG / WebP, max 10 MB.
          </p>
        </header>
        <div className="flex items-start gap-4">
          {(logoPreview || keepLogoUrl) && (
            <div className="relative size-24 overflow-hidden rounded-md border border-border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoPreview ?? keepLogoUrl ?? ''}
                alt=""
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  if (logoPreview) setNewLogoFile(null);
                  else setKeepLogoUrl(null);
                }}
                className="absolute right-1 top-1 inline-flex items-center justify-center rounded-full bg-black/60 p-1 text-white"
                aria-label="Remove logo"
              >
                <X className="size-3" />
              </button>
            </div>
          )}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border bg-muted/40 px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted">
            <Upload className="size-4" />
            {keepLogoUrl || logoPreview ? 'Replace logo' : 'Upload logo'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={onPickLogo}
            />
          </label>
        </div>
      </section>

      <section>
        <header className="mb-4">
          <h2 className="text-sm font-semibold text-accent">Description</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            What is this place, who works there, and how it fits the program.
          </p>
        </header>
        <RichTextEditor
          value={description}
          onChange={setDescription}
          placeholder="A short paragraph or two of context…"
        />
      </section>

      <div className="flex gap-2 justify-end pt-2 border-t border-border">
        <Button type="submit" size="lg">{submitLabel}</Button>
      </div>
    </form>
  );
}

