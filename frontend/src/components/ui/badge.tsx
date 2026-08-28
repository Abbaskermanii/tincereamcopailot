import { cn } from "@/lib/utils";

type Tone = "brand" | "warm" | "muted" | "success";

const tones: Record<Tone, string> = {
  brand: "bg-lajvard/12 text-lajvard dark:bg-lajvard-soft/20 dark:text-lajvard-soft",
  warm: "bg-clay/15 text-clay dark:bg-clay-soft/20 dark:text-clay-soft",
  muted: "bg-char/8 text-char-soft dark:bg-white/10 dark:text-ink-soft",
  success: "bg-firouzeh/20 text-[#3f5f56] dark:text-firouzeh-soft",
};

export function Badge({
  tone = "muted",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
