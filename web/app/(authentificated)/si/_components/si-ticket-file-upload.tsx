"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ACCEPT =
  ".pdf,.png,.jpg,.jpeg,.webp,.txt,.doc,.docx,.xls,.xlsx,application/pdf,image/*";

export function SiTicketFileUpload(props: {
  files: File[];
  onFilesChange: (files: File[]) => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function addFiles(list: FileList | File[]) {
    const incoming = Array.from(list);
    if (incoming.length === 0) return;
    const names = new Set(props.files.map((f) => `${f.name}-${f.size}`));
    const merged = [...props.files];
    for (const f of incoming) {
      const key = `${f.name}-${f.size}`;
      if (!names.has(key)) {
        names.add(key);
        merged.push(f);
      }
    }
    props.onFilesChange(merged);
  }

  function removeAt(index: number) {
    props.onFilesChange(props.files.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!props.disabled) addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "cursor-pointer rounded-lg border border-dashed px-4 py-5 text-center transition-colors",
          dragOver ? "border-primary bg-primary/5" : "border-border bg-muted/20",
          props.disabled && "pointer-events-none opacity-50",
          props.compact && "py-3",
        )}
      >
        <p className="text-sm font-medium">Déposer des fichiers ici</p>
        <p className="mt-1 text-xs text-muted-foreground whitespace-normal break-words">
          PDF, images, Office — ou cliquez pour parcourir
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          className="sr-only"
          disabled={props.disabled}
          onChange={(e) => {
            addFiles(e.target.files ?? []);
            e.target.value = "";
          }}
        />
      </div>
      {props.files.length > 0 ? (
        <ul className="space-y-1">
          {props.files.map((f, i) => (
            <li
              key={`${f.name}-${f.size}-${i}`}
              className="flex items-start justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm"
            >
              <span className="whitespace-normal break-words">{f.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0"
                disabled={props.disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  removeAt(i);
                }}
              >
                Retirer
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
