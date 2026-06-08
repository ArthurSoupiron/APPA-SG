"use client";

import { Calendar03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { format, parse } from "date-fns";
import { fr } from "date-fns/locale";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function ymdToDate(ymd: string): Date | undefined {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return undefined;
  const d = parse(ymd, "yyyy-MM-dd", new Date());
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export type CrmDayPickerFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (ymd: string) => void;
  placeholder?: string;
  className?: string;
};

export function CrmDayPickerField({
  id,
  label,
  value,
  onChange,
  placeholder = "Choisir une date",
  className,
}: CrmDayPickerFieldProps) {
  const [open, setOpen] = React.useState(false);
  const selected = ymdToDate(value);

  return (
    <div className={cn("grid gap-1", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            className={cn(
              "h-10 w-full min-w-[10rem] justify-start gap-2 font-normal",
              !value && "text-muted-foreground",
            )}
          >
            <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-4 shrink-0" />
            <span className="truncate text-left">
              {selected ? format(selected, "d MMMM yyyy", { locale: fr }) : placeholder}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            locale={fr}
            selected={selected}
            onSelect={(d) => {
              if (d) onChange(format(d, "yyyy-MM-dd"));
              setOpen(false);
            }}
            captionLayout="dropdown"
            fromYear={2020}
            toYear={2035}
            defaultMonth={selected}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
