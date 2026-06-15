"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import {
  fetchTemplateFormData,
  generateMissionTemplate,
  previewTemplateDryRun,
} from "../_lib/missions-api";
import { gestionnaireMissionsStyles as gm } from "../_lib/gestionnaire-missions.styles";
import type { TemplateDocType } from "../_lib/missions-types";

function decodeBase64ToArrayBuffer(base64: string): ArrayBuffer {
  const raw = atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes.buffer;
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  missionId: string;
  bcId?: string | null;
  documentType: TemplateDocType;
  defaultNumber: string;
  canGenerate: boolean;
  onSuccess: () => void;
};

export function TemplateGenerationDialog({
  open,
  onOpenChange,
  missionId,
  bcId,
  documentType,
  defaultNumber,
  canGenerate,
  onSuccess,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [perTargetValues, setPerTargetValues] = useState<
    Record<string, Record<string, string>>
  >({});
  const [generationTargets, setGenerationTargets] = useState<
    Array<{ id: string; label: string; name: string | null; email: string | null }>
  >([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [documentNumber, setDocumentNumber] = useState(defaultNumber);
  const [previewDocxBase64, setPreviewDocxBase64] = useState<string | null>(null);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const previewContentRef = useRef<HTMLDivElement | null>(null);
  const [previewScale, setPreviewScale] = useState(1);

  const title = useMemo(() => `Génération template ${documentType}`, [documentType]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setIsLoadingTags(true);
    setDocumentNumber(defaultNumber);
    void fetchTemplateFormData(missionId, bcId ?? null, documentType)
      .then((data) => {
        if (cancelled || !data) return;
        setTags(data.tags);
        setGenerationTargets(data.generationTargets ?? []);
        setSelectedTargetId(data.generationTargets?.[0]?.id ?? null);
        setValues((prev) => {
          const next: Record<string, string> = {};
          for (const tag of data.tags) {
            next[tag] = data.prefill[tag] ?? prev[tag] ?? "";
          }
          return next;
        });
        setPerTargetValues({});
        setPreviewDocxBase64(null);
      })
      .catch(() => {
        if (!cancelled) toast.error("Erreur de chargement des balises du template.");
      })
      .finally(() => {
        if (!cancelled) setIsLoadingTags(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, defaultNumber, documentType, missionId, bcId]);

  useEffect(() => {
    if (!previewDocxBase64 || !previewContentRef.current) return;
    const content = previewContentRef.current;
    content.innerHTML = "";
    setPreviewScale(1);
    void import("docx-preview")
      .then((mod) =>
        mod.renderAsync(decodeBase64ToArrayBuffer(previewDocxBase64), content, undefined, {
          className: "docx-preview-content",
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          breakPages: true,
          ignoreLastRenderedPageBreak: false,
          renderHeaders: true,
          renderFooters: true,
          useBase64URL: true,
        }),
      )
      .catch((error) => {
        console.error(error);
        toast.error("Impossible d'afficher la prévisualisation DOCX.");
      });
  }, [previewDocxBase64]);

  useEffect(() => {
    if (!previewDocxBase64 || !previewContainerRef.current || !previewContentRef.current) {
      return;
    }
    const container = previewContainerRef.current;
    const content = previewContentRef.current;

    const updateScale = () => {
      const availableWidth = Math.max(0, container.clientWidth - 16);
      const renderedWidth = content.scrollWidth;
      if (!renderedWidth) {
        setPreviewScale(1);
        return;
      }
      setPreviewScale(Math.min(1, availableWidth / renderedWidth));
    };

    const ro = new ResizeObserver(updateScale);
    ro.observe(container);
    updateScale();
    const raf = requestAnimationFrame(updateScale);
    const t = setTimeout(updateScale, 180);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
      ro.disconnect();
    };
  }, [previewDocxBase64]);

  const selectedTarget =
    generationTargets.find((t) => t.id === selectedTargetId) ?? null;
  const isMultiTarget = generationTargets.length > 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none! flex h-[92vh] w-full max-w-[96vw] flex-col overflow-hidden xl:max-w-[1400px]">
        <DialogHeader>
          <DialogTitle className="text-sm">{title}</DialogTitle>
        </DialogHeader>
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-2.5 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="min-h-0 space-y-1.5 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Numéro document</Label>
                <Input
                  className={cn(gm.actionButton, "h-7 text-[11px]")}
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  placeholder={`${documentType}-2026-001`}
                />
              </div>
            </div>

            {generationTargets.length > 0 ? (
              <div className="space-y-1 border border-amber-300/70 bg-amber-50/60 px-2 py-1 text-[10px] dark:border-amber-400/35 dark:bg-amber-500/10">
                <p className="font-medium text-amber-800 dark:text-amber-200 whitespace-normal wrap-anywhere">
                  {generationTargets.length > 1
                    ? `${generationTargets.length} documents seront générés (un par intervenant assigné).`
                    : "1 document sera généré pour l'intervenant assigné."}
                </p>
              </div>
            ) : null}

            {generationTargets.length > 0 ? (
              <div className="space-y-1">
                <Label className="text-xs">Aperçu document intervenant</Label>
                <select
                  className="h-7 w-full border border-slate-300/85 bg-slate-50 px-2 text-[11px] text-slate-900 dark:border-white/8 dark:bg-slate-900 dark:text-slate-100"
                  value={selectedTargetId ?? ""}
                  onChange={(e) => setSelectedTargetId(e.target.value || null)}
                >
                  {generationTargets.map((target) => (
                    <option key={target.id} value={target.id}>
                      {target.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="border border-slate-300/85 p-1.5 dark:border-white/8">
              {isLoadingTags ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Chargement des balises…
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
                  {tags.map((tag) => (
                    <div key={tag} className="space-y-0.5">
                      <Label className="text-[10px]">{tag}</Label>
                      <Input
                        className={cn(gm.actionButton, "h-7 text-[11px]")}
                        value={
                          selectedTargetId
                            ? (perTargetValues[selectedTargetId]?.[tag] ?? values[tag] ?? "")
                            : (values[tag] ?? "")
                        }
                        onChange={(e) => {
                          const nextValue = e.target.value;
                          if (selectedTargetId) {
                            setPerTargetValues((prev) => ({
                              ...prev,
                              [selectedTargetId]: {
                                ...(prev[selectedTargetId] ?? {}),
                                [tag]: nextValue,
                              },
                            }));
                          } else {
                            setValues((prev) => ({ ...prev, [tag]: nextValue }));
                          }
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedTarget ? (
              <p className="text-[11px] text-muted-foreground whitespace-normal wrap-anywhere">
                Données visibles pour:{" "}
                <span className="font-medium text-foreground">{selectedTarget.label}</span>
                {isMultiTarget
                  ? " (tu peux vérifier chaque document via la liste ci-dessus)."
                  : ""}
              </p>
            ) : null}

            <div className="flex justify-end gap-1.5">
              <Button
                type="button"
                variant="outline"
                className={cn(gm.actionButton, "h-7 px-2.5 text-[11px]")}
                disabled={
                  isPending || isLoadingTags || !documentNumber.trim() || !canGenerate
                }
                onClick={() =>
                  startTransition(async () => {
                    const result = await previewTemplateDryRun({
                      missionId,
                      bcId: bcId ?? null,
                      documentType,
                      documentNumber: documentNumber.trim(),
                      values,
                      perTargetValues,
                      targetIntervenantId: selectedTargetId,
                    });
                    if (!result) return;
                    setPreviewDocxBase64(result.docxBase64);
                    toast.success(
                      result.targetLabel
                        ? `Prévisualisation chargée pour ${result.targetLabel}.`
                        : "Prévisualisation chargée.",
                    );
                  })
                }
              >
                {isPending ? "Prévisualisation…" : "Prévisualiser"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className={cn(gm.actionButton, "h-7 px-2.5 text-[11px]")}
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button
                type="button"
                className={cn(gm.actionButton, "h-7 px-2.5 text-[11px]")}
                disabled={isPending || !documentNumber.trim() || !canGenerate}
                onClick={() =>
                  startTransition(async () => {
                    const result = await generateMissionTemplate({
                      missionId,
                      bcId: bcId ?? null,
                      documentType,
                      documentNumber: documentNumber.trim(),
                      values,
                      perTargetValues,
                    });
                    if (!result.success) return;
                    onOpenChange(false);
                    onSuccess();
                  })
                }
              >
                {isPending
                  ? "Génération…"
                  : generationTargets.length > 1
                    ? `Générer ${generationTargets.length} DOCX`
                    : "Générer DOCX"}
              </Button>
            </div>
            {!canGenerate ? (
              <p className="text-[11px] text-amber-600 dark:text-amber-300">
                Vous n&apos;avez pas la permission de générer des documents DOCX.
              </p>
            ) : null}
          </div>

          <div className="flex min-h-0 flex-col space-y-1 lg:border-l lg:border-slate-300/70 lg:pl-3 lg:dark:border-white/10">
            <p className="text-[11px] text-muted-foreground">
              Prévisualisation locale (non enregistrée sur Drive).
            </p>
            {previewDocxBase64 ? (
              <div
                ref={previewContainerRef}
                className="preview-docx-host min-h-0 flex-1 overflow-y-auto overflow-x-hidden border border-slate-300/85 bg-slate-100 p-2 dark:border-white/8 dark:bg-slate-950"
              >
                <div className="flex justify-center">
                  <div
                    ref={previewContentRef}
                    style={{
                      transform: `scale(${previewScale})`,
                      transformOrigin: "top left",
                    }}
                    className="inline-block"
                  />
                </div>
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 items-center justify-center border border-dashed border-slate-300/85 bg-slate-50/40 p-3 text-xs text-muted-foreground dark:border-white/12 dark:bg-slate-900/20">
                Cliquez sur « Prévisualiser » pour afficher le rendu du document ici.
              </div>
            )}
          </div>
        </div>
        <style jsx global>{`
          .preview-docx-host .docx-wrapper {
            padding: 8px !important;
          }
          .preview-docx-host .docx-preview-content {
            margin: 0 auto !important;
            box-shadow: none !important;
            border: 1px solid rgba(148, 163, 184, 0.5);
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
