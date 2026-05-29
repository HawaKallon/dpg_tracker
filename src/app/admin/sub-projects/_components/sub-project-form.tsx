'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import type { JSONContent } from '@tiptap/core';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RichTextEditor } from '@/components/editor/rich-text-editor';
import { slugify } from '@/lib/utils/slugify';
import type { SubProject } from '@/types/database';

type Defaults = Partial<SubProject>;

function ImageField({
  label,
  hint,
  keepUrl,
  onKeepUrlChange,
  file,
  onFileChange,
}: {
  label: string;
  hint?: string;
  keepUrl: string | null;
  onKeepUrlChange: (v: string | null) => void;
  file: File | null;
  onFileChange: (f: File | null) => void;
}) {
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) return;
    if (f.size > 10 * 1024 * 1024) return;
    onFileChange(f);
    e.target.value = '';
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-start gap-4">
        {(preview || keepUrl) && (
          <div className="relative size-24 overflow-hidden rounded-md border border-border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview ?? keepUrl ?? ''}
              alt=""
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => (preview ? onFileChange(null) : onKeepUrlChange(null))}
              className="absolute right-1 top-1 inline-flex items-center justify-center rounded-full bg-black/60 p-1 text-white"
              aria-label={`Remove ${label}`}
            >
              <X className="size-3" />
            </button>
          </div>
        )}
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border bg-muted/40 px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted">
          <Upload className="size-4" />
          {keepUrl || preview ? 'Replace' : 'Upload'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={onPick}
          />
        </label>
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function SubProjectForm({
  action,
  defaults,
  submitLabel = 'Save sub-project',
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaults?: Defaults;
  submitLabel?: string;
}) {
  const [subProjectId] = useState<string>(() => defaults?.id ?? crypto.randomUUID());
  const [name, setName] = useState(defaults?.name ?? '');
  const [slug, setSlug] = useState(defaults?.slug ?? '');
  const slugDirtyRef = useRef<boolean>(!!defaults?.slug);
  const [description, setDescription] = useState<JSONContent | null>(
    (defaults?.description ?? null) as JSONContent | null
  );

  const [keepHero, setKeepHero] = useState<string | null>(defaults?.hero_image_url ?? null);
  const [keepFunder, setKeepFunder] = useState<string | null>(defaults?.funder_logo_url ?? null);
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [funderFile, setFunderFile] = useState<File | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (slugDirtyRef.current) return;
    setSlug(slugify(name));
  }, [name]);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const handler = (e: FormDataEvent) => {
      if (heroFile) e.formData.set('hero_file', heroFile, heroFile.name);
      if (funderFile) e.formData.set('funder_logo_file', funderFile, funderFile.name);
    };
    form.addEventListener('formdata', handler);
    return () => form.removeEventListener('formdata', handler);
  }, [heroFile, funderFile]);

  return (
    <form ref={formRef} action={action} className="space-y-8 w-full">
      <input type="hidden" name="sub_project_id" value={subProjectId} />
      <input
        type="hidden"
        name="description"
        value={description ? JSON.stringify(description) : ''}
      />
      <input type="hidden" name="keep_hero_url" value={keepHero ?? ''} />
      <input type="hidden" name="keep_funder_url" value={keepFunder ?? ''} />

      <section>
        <header className="mb-4">
          <h2 className="text-sm font-semibold text-accent">Identity</h2>
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
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              name="slug"
              required
              value={slug}
              onChange={(e) => {
                slugDirtyRef.current = true;
                setSlug(e.target.value);
              }}
            />
            <p className="text-xs text-muted-foreground">
              URL becomes <code className="text-accent">/programs/{slug || 'your-slug'}</code>
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="display_order">Display order</Label>
            <Input
              id="display_order"
              name="display_order"
              type="number"
              defaultValue={defaults?.display_order ?? 0}
            />
          </div>
          <div className="space-y-1.5 flex items-center">
            <label className="inline-flex items-center gap-2 mt-6 text-sm">
              <input
                type="checkbox"
                name="is_active"
                defaultChecked={defaults?.is_active ?? true}
                className="size-4 rounded border-border"
              />
              Active
            </label>
          </div>
        </div>
      </section>

      <section>
        <header className="mb-4">
          <h2 className="text-sm font-semibold text-accent">Funder</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Surfaces in the program hero and OG image.
          </p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label htmlFor="funder_name">Funder name</Label>
            <Input
              id="funder_name"
              name="funder_name"
              defaultValue={defaults?.funder_name ?? ''}
            />
          </div>
          <ImageField
            label="Funder logo"
            keepUrl={keepFunder}
            onKeepUrlChange={setKeepFunder}
            file={funderFile}
            onFileChange={setFunderFile}
          />
        </div>
      </section>

      <section>
        <header className="mb-4">
          <h2 className="text-sm font-semibold text-accent">Hero image</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Wide image for the program detail page hero. JPEG / PNG / WebP, max 10 MB.
          </p>
        </header>
        <ImageField
          label="Hero"
          keepUrl={keepHero}
          onKeepUrlChange={setKeepHero}
          file={heroFile}
          onFileChange={setHeroFile}
        />
      </section>

      <section>
        <header className="mb-4">
          <h2 className="text-sm font-semibold text-accent">Description</h2>
        </header>
        <RichTextEditor
          value={description}
          onChange={setDescription}
          placeholder="What this program does, who it serves, and why it matters…"
        />
      </section>

      <div className="flex gap-2 justify-end pt-2 border-t border-border">
        <Button type="submit" size="lg">{submitLabel}</Button>
      </div>
    </form>
  );
}
