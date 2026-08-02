'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Upload, X } from 'lucide-react';
import {
  deleteMediaByUrl,
  uploadActivityMediaFromBrowser,
} from '@/lib/supabase/storage-client';
import { IMAGE_ACCEPT, imageRejectionReason } from '@/lib/utils/image-file';

type Pending = {
  key: string;
  name: string;
  previewUrl: string;
  status: 'uploading' | 'error';
  error?: string;
};

type Props = {
  /** Used as the storage folder, so it must match the row the form will write. */
  activityId: string;
  /** Public URLs already attached to this activity, plus anything just uploaded. */
  urls: string[];
  /**
   * A React state setter. Uploads resolve independently and concurrently, so
   * appends must go through the updater form or parallel uploads clobber each
   * other's results.
   */
  onUrlsChange: React.Dispatch<React.SetStateAction<string[]>>;
  /** Lets the form block submission while an upload is still in flight. */
  onUploadingChange: React.Dispatch<React.SetStateAction<boolean>>;
};

export function MediaPicker({
  activityId,
  urls,
  onUrlsChange,
  onUploadingChange,
}: Props) {
  const [pending, setPending] = useState<Pending[]>([]);
  const [rejections, setRejections] = useState<string[]>([]);
  const objectUrls = useRef<Set<string>>(new Set());

  const uploading = pending.some((p) => p.status === 'uploading');
  useEffect(() => {
    onUploadingChange(uploading);
  }, [uploading, onUploadingChange]);

  // Revoke every preview URL this component created, on unmount only — revoking
  // eagerly per render would blank thumbnails that are still on screen.
  useEffect(() => {
    const created = objectUrls.current;
    return () => {
      created.forEach((u) => URL.revokeObjectURL(u));
      created.clear();
    };
  }, []);

  const handlePick = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const picked = Array.from(e.target.files ?? []);
      e.target.value = '';
      if (picked.length === 0) return;

      const rejected: string[] = [];
      const accepted: File[] = [];
      for (const f of picked) {
        const reason = imageRejectionReason(f);
        if (reason) rejected.push(reason);
        else accepted.push(f);
      }
      // Report every rejection, not only the last one.
      setRejections(rejected);
      if (accepted.length === 0) return;

      const stamp = `${performance.now()}`;
      const entries: Pending[] = accepted.map((f, i) => {
        const previewUrl = URL.createObjectURL(f);
        objectUrls.current.add(previewUrl);
        return {
          key: `${stamp}-${i}-${f.name}`,
          name: f.name,
          previewUrl,
          status: 'uploading' as const,
        };
      });
      setPending((prev) => [...prev, ...entries]);

      // Upload each file independently so one failure doesn't lose the others.
      await Promise.all(
        accepted.map(async (file, i) => {
          const entry = entries[i];
          try {
            const url = await uploadActivityMediaFromBrowser(activityId, file);
            onUrlsChange((prev) => (prev.includes(url) ? prev : [...prev, url]));
            setPending((prev) => prev.filter((p) => p.key !== entry.key));
          } catch (err) {
            const message =
              err instanceof Error ? err.message : `${file.name}: upload failed`;
            setPending((prev) =>
              prev.map((p) =>
                p.key === entry.key ? { ...p, status: 'error', error: message } : p
              )
            );
          }
        })
      );
    },
    [activityId, onUrlsChange]
  );

  const removeUrl = (url: string) => {
    onUrlsChange((prev) => prev.filter((u) => u !== url));
    // Best effort — an orphaned object beats a blocked form.
    void deleteMediaByUrl(url);
  };

  const errors = pending.filter((p) => p.status === 'error');
  const hasThumbs = urls.length > 0 || pending.length > 0;

  return (
    <div className="space-y-3">
      {hasThumbs && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {urls.map((url) => (
            <div
              key={url}
              className="relative aspect-square overflow-hidden rounded-md border border-border bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeUrl(url)}
                className="absolute right-1 top-1 inline-flex items-center justify-center rounded-full bg-black/60 p-1 text-white hover:bg-black"
                aria-label="Remove photo"
              >
                <X className="size-3" />
              </button>
              {/* The form submits URLs, not files — see storage-client.ts. */}
              <input type="hidden" name="media_urls" value={url} />
            </div>
          ))}

          {pending.map((p) => (
            <div
              key={p.key}
              className="relative aspect-square overflow-hidden rounded-md border border-border bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.previewUrl}
                alt={p.name}
                className="h-full w-full object-cover opacity-50"
              />
              {p.status === 'uploading' ? (
                <span className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="size-5 animate-spin text-white drop-shadow" />
                </span>
              ) : (
                <>
                  <span className="absolute inset-x-0 bottom-0 bg-destructive/80 px-1 py-0.5 text-[10px] leading-tight text-white">
                    Failed
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setPending((prev) => prev.filter((x) => x.key !== p.key))
                    }
                    className="absolute right-1 top-1 inline-flex items-center justify-center rounded-full bg-black/60 p-1 text-white hover:bg-black"
                    aria-label={`Dismiss ${p.name}`}
                  >
                    <X className="size-3" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border bg-muted/40 px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted">
        <Upload className="size-4" />
        Add photos
        <input
          type="file"
          accept={IMAGE_ACCEPT}
          multiple
          className="sr-only"
          onChange={handlePick}
        />
      </label>
      <p className="text-xs text-muted-foreground">
        JPEG, PNG, or WebP. Max 10 MB each. Photos upload as soon as you pick them.
      </p>

      {uploading && (
        <p className="text-xs text-muted-foreground">Uploading… wait for this to finish before saving.</p>
      )}
      {errors.map((p) => (
        <p key={`err-${p.key}`} className="text-xs text-destructive">
          {p.error}
        </p>
      ))}
      {rejections.map((r) => (
        <p key={r} className="text-xs text-destructive">
          {r}
        </p>
      ))}
    </div>
  );
}
