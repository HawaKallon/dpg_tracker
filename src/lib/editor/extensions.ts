import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import type { AnyExtension } from '@tiptap/core';

/**
 * Extensions used by the server-side renderer.
 * Must match the editor's content model exactly — anything you add here must also
 * be supported by getEditorExtensions() (which adds editor-only UI extras).
 */
export function getRenderExtensions(): AnyExtension[] {
  return [
    StarterKit.configure({
      link: false,
      heading: { levels: [2, 3] },
    }),
    Link.configure({
      autolink: true,
      openOnClick: false,
      HTMLAttributes: {
        rel: 'noopener noreferrer',
        target: '_blank',
        class: 'text-primary underline underline-offset-2 hover:text-primary-deep',
      },
    }),
  ];
}

/** Editor-only — adds Placeholder (UI hint, no effect on saved JSON). */
export function getEditorExtensions(opts: { placeholder?: string } = {}): AnyExtension[] {
  return [
    ...getRenderExtensions(),
    Placeholder.configure({
      placeholder: opts.placeholder ?? 'Write something…',
      emptyEditorClass: 'is-editor-empty',
    }),
  ];
}
