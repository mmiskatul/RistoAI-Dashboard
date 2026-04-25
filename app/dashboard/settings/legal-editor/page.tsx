"use client";

import React, { useState, useEffect, Suspense } from "react";
import Header from "@/components/layout/Header";
import { useSearchParams } from "next/navigation";
import { apiClient, getApiErrorMessage } from "@/lib/api";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import {
  Clock,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List as ListIcon,
  ListOrdered,
  Save,
  Loader2
} from "lucide-react";

type LegalDocumentResponse = {
  key: string;
  title: string;
  content: string;
  updated_at: string | null;
  updated_by: string | null;
};

const documentConfig = {
  terms: {
    getEndpoint: "/api/v1/settings/terms-of-service",
    updateEndpoint: "/api/v1/settings/terms-of-service",
    fallbackTitle: "Terms of Service",
  },
  privacy: {
    getEndpoint: "/api/v1/settings/privacy-policy",
    updateEndpoint: "/api/v1/settings/privacy-policy",
    fallbackTitle: "Privacy Policy",
  },
} as const;

const formatLastUpdated = (value: string | null): string => {
  if (!value) {
    return "Not updated yet";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

function LegalEditorContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams?.get("tab") === "privacy" ? "privacy" : "terms";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [documentMeta, setDocumentMeta] = useState<LegalDocumentResponse | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
    ],
    content: '',
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!editor) return;

    const fetchDocument = async () => {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      try {
        const config = documentConfig[activeTab];
        const response = await apiClient.get<LegalDocumentResponse>(config.getEndpoint);
        setDocumentMeta(response.data);
        editor.commands.setContent(response.data.content || "");
      } catch (err: unknown) {
        setError(getApiErrorMessage(err, `Failed to load ${documentConfig[activeTab].fallbackTitle}`));
        setDocumentMeta(null);
        editor.commands.setContent("");
      } finally {
        setLoading(false);
      }
    };

    void fetchDocument();
  }, [activeTab, editor]);

  if (!editor) {
    return null;
  }

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const config = documentConfig[activeTab];
      const content = editor.getText({ blockSeparator: "\n\n" }).trim();
      const response = await apiClient.put(config.updateEndpoint, { content });
      const refreshedDocument = response.data?.editor
        ? await apiClient.get<LegalDocumentResponse>(config.getEndpoint)
        : null;

      if (refreshedDocument) {
        setDocumentMeta(refreshedDocument.data);
        editor.commands.setContent(refreshedDocument.data.content || "");
      }

      setSuccessMessage("Changes saved");
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to save changes"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-white dark:bg-black">
      <title>Legal Content Editor | Aldo</title>
      <Header />

      <main className="p-8 max-w-[1200px] mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Legal Content Editor</h1>
            <p className="text-sm font-medium text-gray-500 mt-1">
              Last updated: {formatLastUpdated(documentMeta?.updated_at ?? null)}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400">
              <Clock className="h-4 w-4" />
              {documentMeta?.updated_by ? `Updated by ${documentMeta.updated_by}` : "Manual save"}
            </div>
            {successMessage ? (
              <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 border border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-800/20">
                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-500">{successMessage}</span>
              </div>
            ) : null}
          </div>
        </div>

        {error ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        ) : null}

        {/* Tabs */}
        <div className="flex items-center gap-8 border-b border-gray-100 mb-8 dark:border-gray-800 overflow-x-auto">
          <button 
            onClick={() => setActiveTab("terms")}
            className={`pb-4 text-sm font-bold whitespace-nowrap transition-all border-b-2 ${
              activeTab === "terms" 
                ? "border-[#059669] text-[#059669] dark:border-emerald-500 dark:text-emerald-400" 
                : "border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            Terms of Service
          </button>
          <button 
            onClick={() => setActiveTab("privacy")}
            className={`pb-4 text-sm font-bold whitespace-nowrap transition-all border-b-2 ${
              activeTab === "privacy" 
                ? "border-[#059669] text-[#059669] dark:border-emerald-500 dark:text-emerald-400" 
                : "border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            Privacy Policy
          </button>
        </div>

        {/* Editor Wrapper */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm dark:border-gray-700 dark:bg-gray-900">
          {/* Editor Toolbar */}
          <div className="flex items-center gap-4 border-b border-gray-100 px-6 py-3 bg-white dark:border-gray-700 dark:bg-gray-800 flex-wrap">
            <button 
              onClick={() => editor.chain().focus().toggleBold().run()} 
              disabled={!editor.can().chain().focus().toggleBold().run()}
              className={`text-gray-500 hover:text-gray-900 transition-colors p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-white ${editor.isActive('bold') ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white' : ''}`}
            >
              <Bold className="h-4 w-4" />
            </button>
            <button 
              onClick={() => editor.chain().focus().toggleItalic().run()} 
              disabled={!editor.can().chain().focus().toggleItalic().run()}
              className={`text-gray-500 hover:text-gray-900 transition-colors p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-white ${editor.isActive('italic') ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white' : ''}`}
            >
              <Italic className="h-4 w-4" />
            </button>
            <button 
              onClick={() => editor.chain().focus().toggleUnderline().run()} 
              disabled={!editor.can().chain().focus().toggleUnderline().run()}
              className={`text-gray-500 hover:text-gray-900 transition-colors p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-white ${editor.isActive('underline') ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white' : ''}`}
            >
              <UnderlineIcon className="h-4 w-4" />
            </button>
            
            <div className="w-px h-5 bg-gray-200 mx-2 dark:bg-gray-600"></div>
            
            <button 
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} 
              className={`text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-white ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white' : ''}`}
            >
              H1
            </button>
            <button 
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} 
              className={`text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-white ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white' : ''}`}
            >
              H2
            </button>
            <button 
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} 
              className={`text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-white ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white' : ''}`}
            >
              H3
            </button>

            <div className="w-px h-5 bg-gray-200 mx-2 dark:bg-gray-600"></div>

            <button 
              onClick={() => editor.chain().focus().toggleBulletList().run()} 
              className={`text-gray-500 hover:text-gray-900 transition-colors p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-white ${editor.isActive('bulletList') ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white' : ''}`}
            >
              <ListIcon className="h-4 w-4" />
            </button>
            <button 
              onClick={() => editor.chain().focus().toggleOrderedList().run()} 
              className={`text-gray-500 hover:text-gray-900 transition-colors p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-white ${editor.isActive('orderedList') ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white' : ''}`}
            >
              <ListOrdered className="h-4 w-4" />
            </button>
          </div>

          {/* Editor Content Box */}
          <div className="bg-white dark:bg-gray-900">
            {loading ? (
              <div className="flex min-h-[500px] items-center justify-center text-sm font-medium text-gray-500 dark:text-gray-400">
                Loading content...
              </div>
            ) : (
              <EditorContent editor={editor} />
            )}
          </div>
        </div>

        {/* Action Bottom */}
        <div className="flex justify-end mt-8">
          <button
            onClick={() => void handleSave()}
            disabled={saving || loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-8 py-3 text-sm font-bold text-white shadow-md shadow-[var(--color-primary)]/20 transition-all hover:bg-[var(--color-primary-hover)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </main>

      {/* Tailwind Typography replacement for ProseMirror */}
      <style dangerouslySetInnerHTML={{__html: `
        .ProseMirror {
          outline: none;
          min-height: 500px;
          padding: 2rem;
          color: #374151;
          line-height: 1.75;
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        .dark .ProseMirror {
          color: #D1D5DB;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9CA3AF;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror h1 {
          font-size: 2.25rem;
          font-weight: 800;
          margin-top: 0;
          margin-bottom: 1rem;
          color: #111827;
        }
        .dark .ProseMirror h1 {
          color: #FFFFFF;
        }
        .ProseMirror h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          color: #1F2937;
        }
        .dark .ProseMirror h2 {
          color: #F3F4F6;
        }
        .ProseMirror h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
          color: #374151;
        }
        .dark .ProseMirror h3 {
          color: #E5E7EB;
        }
        .ProseMirror p {
          margin-top: 0;
          margin-bottom: 1rem;
        }
        .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-bottom: 1rem;
        }
        .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin-bottom: 1rem;
        }
        .ProseMirror li p {
          margin-bottom: 0.25rem;
          margin-top: 0.25rem;
        }
      `}} />
    </div>
  );
}

export default function LegalEditorPage() {
  return (
    <Suspense fallback={<div className="flex-1 min-h-screen bg-white dark:bg-black p-8 text-center text-gray-500">Loading editor...</div>}>
      <LegalEditorContent />
    </Suspense>
  );
}
