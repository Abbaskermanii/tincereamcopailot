"use client";

import { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo,
  Redo,
} from "lucide-react";
import { MediaUploader } from "@/components/admin/MediaUploader";
import { mediaUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  label?: string;
}

const toolbarButton =
  "min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-lg border border-char/15 bg-surface px-2 py-1 text-sm hover:bg-char/5 disabled:opacity-40 dark:border-white/15 dark:bg-transparent dark:hover:bg-white/10";

export function RichTextEditor({ value, onChange, placeholder = "متن را اینجا بنویسید…", label }: RichTextEditorProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      Image.configure({
        allowBase64: false,
        HTMLAttributes: { class: "rounded-xl max-w-full h-auto my-4" },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { class: "text-lajvard underline dark:text-lajvard-soft" },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "<p></p>",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none p-4 min-h-[240px] focus:outline-none dark:prose-invert prose-p:leading-7 prose-headings:font-extrabold prose-a:text-lajvard dark:prose-a:text-lajvard-soft prose-img:rounded-xl prose-blockquote:border-r-4 prose-blockquote:border-firouzeh/30 prose-blockquote:pr-4",
        dir: "auto",
      },
    },
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  // sync external value when opening edit (avoid infinite loops)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    // normalize empty
    const normalizedValue = value || "<p></p>";
    if (current !== normalizedValue && normalizedValue !== "<p></p>") {
      // only update if external value is meaningfully different and editor not focused OR empty
      // To avoid cursor jump, only sync when editor is not focused or value was externally reset
      if (!editor.isFocused) {
        editor.commands.setContent(normalizedValue, false);
      }
    }
    // if value cleared externally, also clear
    if (!value && current !== "<p></p>") {
      if (!editor.isFocused) editor.commands.setContent("<p></p>", false);
    }
  }, [value, editor]);

  // handle pending image insertion from MediaUploader – store absolute URL for correct fetch
  useEffect(() => {
    if (pendingImageUrl && editor) {
      const absoluteSrc = mediaUrl(pendingImageUrl) || pendingImageUrl;
      editor.chain().focus().setImage({ src: absoluteSrc }).run();
      setPendingImageUrl(null);
      setShowImagePicker(false);
    }
  }, [pendingImageUrl, editor]);

  if (!editor) {
    return <div className="min-h-[240px] rounded-xl border border-char/15 bg-surface p-4 dark:border-white/15 dark:bg-black/20" />;
  }

  const setLink = () => {
    if (!linkUrl) return;
    let url = linkUrl.trim();
    if (!/^https?:\/\//i.test(url) && !url.startsWith("/") && !url.startsWith("#")) {
      url = `https://${url}`;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    setLinkUrl("");
    setShowLinkInput(false);
  };

  const unsetLink = () => {
    editor.chain().focus().unsetLink().run();
    setShowLinkInput(false);
  };

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium text-ink-soft">{label}</p>}
      <div className="overflow-hidden rounded-xl border border-char/15 bg-surface shadow-sm dark:border-white/15 dark:bg-black/20">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1 border-b border-char/10 bg-char/5 p-2 dark:border-white/10 dark:bg-white/5">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(toolbarButton, editor.isActive("bold") && "bg-lajvard text-white dark:bg-lajvard-soft dark:text-char")}
            aria-label="بولد"
            title="بولد"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(toolbarButton, editor.isActive("italic") && "bg-lajvard text-white dark:bg-lajvard-soft dark:text-char")}
            aria-label="ایتالیک"
            title="ایتالیک"
          >
            <Italic className="h-4 w-4" />
          </button>
          <span className="mx-1 h-6 w-px bg-char/15 dark:bg-white/15" />
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={cn(toolbarButton, editor.isActive("heading", { level: 2 }) && "bg-lajvard text-white dark:bg-lajvard-soft dark:text-char")}
            aria-label="تیتر 2"
            title="تیتر ۲"
          >
            <Heading2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={cn(toolbarButton, editor.isActive("heading", { level: 3 }) && "bg-lajvard text-white dark:bg-lajvard-soft dark:text-char")}
            aria-label="تیتر 3"
            title="تیتر ۳"
          >
            <Heading3 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
            className={cn(toolbarButton, editor.isActive("heading", { level: 4 }) && "bg-lajvard text-white dark:bg-lajvard-soft dark:text-char")}
            aria-label="تیتر 4"
            title="تیتر ۴"
          >
            <Heading4 className="h-4 w-4" />
          </button>
          <span className="mx-1 h-6 w-px bg-char/15 dark:bg-white/15" />
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(toolbarButton, editor.isActive("bulletList") && "bg-lajvard text-white dark:bg-lajvard-soft dark:text-char")}
            aria-label="لیست نقطه‌ای"
            title="لیست نقطه‌ای"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(toolbarButton, editor.isActive("orderedList") && "bg-lajvard text-white dark:bg-lajvard-soft dark:text-char")}
            aria-label="لیست شماره‌دار"
            title="لیست شماره‌دار"
          >
            <ListOrdered className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={cn(toolbarButton, editor.isActive("blockquote") && "bg-lajvard text-white dark:bg-lajvard-soft dark:text-char")}
            aria-label="نقل‌قول"
            title="نقل‌قول"
          >
            <Quote className="h-4 w-4" />
          </button>
          <span className="mx-1 h-6 w-px bg-char/15 dark:bg-white/15" />
          <button
            type="button"
            onClick={() => setShowLinkInput((v) => !v)}
            className={cn(toolbarButton, editor.isActive("link") && "bg-lajvard text-white dark:bg-lajvard-soft dark:text-char")}
            aria-label="لینک"
            title="لینک"
          >
            <LinkIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setShowImagePicker((v) => !v)}
            className={toolbarButton}
            aria-label="تصویر"
            title="درج تصویر"
          >
            <ImageIcon className="h-4 w-4" />
          </button>
          <span className="mx-1 h-6 w-px bg-char/15 dark:bg-white/15" />
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className={toolbarButton}
            aria-label="بازگشت"
            title="بازگشت"
          >
            <Undo className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className={toolbarButton}
            aria-label="جلو"
            title="جلو"
          >
            <Redo className="h-4 w-4" />
          </button>
        </div>

        {/* Link input */}
        {showLinkInput && (
          <div className="flex gap-2 border-b border-char/10 bg-lajvard/5 p-2 dark:border-white/10 dark:bg-lajvard-soft/10">
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              dir="ltr"
              className="flex-1 rounded-lg border border-char/15 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-firouzeh dark:border-white/20 dark:bg-black/20"
            />
            <button type="button" onClick={setLink} className="rounded-lg bg-lajvard px-3 py-1.5 text-sm text-white dark:bg-lajvard-soft dark:text-char">
              اعمال
            </button>
            {editor.isActive("link") && (
              <button type="button" onClick={unsetLink} className="rounded-lg border border-char/20 px-3 py-1.5 text-sm dark:border-white/20">
                حذف لینک
              </button>
            )}
            <button type="button" onClick={() => setShowLinkInput(false)} className="rounded-lg px-2 text-sm text-ink-soft">
              ×
            </button>
          </div>
        )}

        {/* Image picker */}
        {showImagePicker && (
          <div className="border-b border-char/10 bg-lajvard/5 p-3 dark:border-white/10 dark:bg-lajvard-soft/10">
            <p className="mb-2 text-xs font-medium">انتخاب تصویر برای درج در متن</p>
            <MediaUploader value={null} onChange={(url) => url && setPendingImageUrl(url)} label="آپلود تصویر" />
            <button type="button" onClick={() => setShowImagePicker(false)} className="mt-2 text-xs text-ink-soft underline">
              بستن
            </button>
          </div>
        )}

        {/* Editor */}
        <EditorContent editor={editor} className="min-h-[240px] bg-white dark:bg-black/10" />
      </div>
      <p className="text-xs text-char-soft">از H2 برای شروع بدنه استفاده کنید — هر صفحه فقط یک H1 دارد.</p>
      <style jsx global>{`
        .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: right;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }
        .tiptap:focus {
          outline: none;
        }
        .tiptap ul,
        .tiptap ol {
          padding-right: 1.5rem;
          margin: 0.75rem 0;
        }
        .tiptap blockquote {
          border-right: 4px solid rgba(122, 158, 147, 0.3);
          padding-right: 1rem;
          margin: 1rem 0;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
