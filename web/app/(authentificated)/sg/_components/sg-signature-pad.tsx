"use client";

// Module SG — signature manuscrite numérique (canvas).
// On dessine sur un <canvas> et on exporte un PNG (dataURL) stocké sur le document.
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { GedDoc } from "../_lib/sg-types";

/** Vignette d'aperçu d'une signature déjà apposée. */
export function SignaturePreview({ src, className }: { src: string; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt="Signature"
      className={`h-8 w-20 rounded border border-border bg-white object-contain ${className ?? ""}`}
    />
  );
}

/** Boîte de dialogue de signature : champ signataire + zone de dessin. */
export function SignDocumentDialog({
  doc,
  onOpenChange,
  onSign,
}: {
  doc: GedDoc | null;
  onOpenChange: (open: boolean) => void;
  onSign: (signature: string, signedBy: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);
  const [name, setName] = useState("");

  const open = doc !== null;

  useEffect(() => {
    if (!open) return;
    setHasInk(false);
    setName("");
    const c = canvasRef.current;
    c?.getContext("2d")?.clearRect(0, 0, c.width, c.height);
  }, [open]);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (c.width / r.width),
      y: (e.clientY - r.top) * (c.height / r.height),
    };
  };

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    drawing.current = true;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    c.setPointerCapture(e.pointerId);
  };

  const moveDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0f172a";
    const p = pos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    setHasInk(true);
  };

  const endDraw = () => {
    drawing.current = false;
  };

  const clear = () => {
    const c = canvasRef.current;
    c?.getContext("2d")?.clearRect(0, 0, c.width, c.height);
    setHasInk(false);
  };

  const confirm = () => {
    const c = canvasRef.current;
    if (!c || !hasInk) return;
    onSign(c.toDataURL("image/png"), name.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Signer le document</DialogTitle>
        </DialogHeader>

        {doc && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{doc.title}</span>
              <span className="font-mono"> · {doc.ref}</span>
            </p>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Signataire</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nom du Secrétaire Général"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Signature manuscrite</Label>
              <div className="rounded-md border border-border bg-white">
                <canvas
                  ref={canvasRef}
                  width={560}
                  height={180}
                  className="h-[180px] w-full touch-none rounded-md"
                  onPointerDown={startDraw}
                  onPointerMove={moveDraw}
                  onPointerUp={endDraw}
                  onPointerLeave={endDraw}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Dessinez votre signature dans le cadre (souris ou tactile).
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="sm:justify-between">
          <Button variant="ghost" onClick={clear} disabled={!hasInk}>
            Effacer
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button disabled={!hasInk} onClick={confirm}>
              Apposer la signature
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
