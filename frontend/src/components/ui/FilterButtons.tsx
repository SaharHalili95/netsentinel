"use client";

import { cn } from "@/lib/utils";

interface FilterButtonsProps<T extends string> {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export default function FilterButtons<T extends string>({ label, options, value, onChange }: FilterButtonsProps<T>) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            value === o.value ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
