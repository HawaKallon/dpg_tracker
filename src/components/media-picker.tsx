'use client';

import { useEffect, useMemo, useState } from 'react';
import { Upload, X } from 'lucide-react';

type Props = {
  keepUrls: string[];
  onKeepUrlsChange: (next: string[]) => void;
  newFiles: File[];
  onNewFilesChange: (next: File[]) => void;
};

export function MediaPicker({
  keepUrls,
  onKeepUrlsChange,
  newFiles,
  onNewFilesChange,
}: Props) {
  const previews = useMemo(
    () => newFiles.map((f) => ({ file: f, url: URL.createObjectURL(f) })),
    [newFiles]
  );

  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [previews]);

  const [error, setError] = useState<string | null>(null);

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const picked = Array.from(e.target.files ?? []);
    const ok: File[] = [];
    for (const f of picked) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
        setError(`${f.name}: unsupported format (use JPEG, PNG, or WebP)`);
        continue;
      }
      if (f.size > 10 * 1024 * 1024) {
        setError(`${f.name}: larger than 10 MB`);
        continue;
      }
      ok.push(f);
    }
    onNewFilesChange([...newFiles, ...ok]);
    e.target.value = '';
  };

  return (
    <div className="space-y-3">
      {(keepUrls.length > 0 || previews.length > 0) && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {keepUrls.map((url) => (
            <div
              key={url}
              className="relative aspect-square overflow-hidden rounded-md border border-border bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onKeepUrlsChange(keepUrls.filter((u) => u !== url))}
                className="absolute right-1 top-1 inline-flex items-center justify-center rounded-full bg-black/60 p-1 text-white hover:bg-black"
                aria-label="Remove photo"
              >
                <X className="size-3" />
              </button>
              {/* Send as hidden input so the action keeps it */}
              <input type="hidden" name="keep_urls" value={url} />
            </div>
          ))}
          {previews.map(({ file, url }, i) => (
            <div
              key={`${file.name}-${i}`}
              className="relative aspect-square overflow-hidden rounded-md border border-border bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={file.name} className="h-full w-full object-cover" />
              <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 text-[10px] text-white">
                New
              </span>
              <button
                type="button"
                onClick={() =>
                  onNewFilesChange(newFiles.filter((_, idx) => idx !== i))
                }
                className="absolute right-1 top-1 inline-flex items-center justify-center rounded-full bg-black/60 p-1 text-white hover:bg-black"
                aria-label={`Remove ${file.name}`}
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border bg-muted/40 px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted">
        <Upload className="size-4" />
        Add photos
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          onChange={handlePick}
        />
      </label>
      <p className="text-xs text-muted-foreground">JPEG, PNG, or WebP. Max 10 MB each.</p>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
