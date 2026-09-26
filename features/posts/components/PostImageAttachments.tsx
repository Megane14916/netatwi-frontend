"use client";

import { X } from "lucide-react";

interface PostImageAttachmentsProps {
  previewUrls: string[];
  isCompressing: boolean;
  onRemove: (index: number) => void;
}

export function PostImageAttachments({
  previewUrls,
  isCompressing,
  onRemove,
}: PostImageAttachmentsProps) {
  if (previewUrls.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-2 mt-2 pl-[52px]">
      {previewUrls.map((url, idx) => (
        <div key={idx} className="relative group">
          <img
            src={url}
            alt="preview"
            className="w-full h-32 object-cover rounded-xl border border-gray-200 dark:border-gray-800"
          />
          <button
            type="button"
            onClick={() => onRemove(idx)}
            disabled={isCompressing}
            className="absolute top-2 right-2 bg-black/70 dark:bg-white/70 text-white rounded-full p-1.5 hover:bg-black transition-colors backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
