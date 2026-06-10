import type { ReactNode } from "react";
import { Sparkle } from "./Doodles";

type AccentKey = "primary" | "secondary" | "accent" | "mint" | "foreground";

interface SectionHeaderProps {
  kicker: string;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Optional handwritten annotation shown below the title, above the subtitle. */
  handwritten?: string;
  /** Primary accent color for the dot + label. Defaults to "primary" (tomato). */
  accent?: AccentKey;
  centered?: boolean;
  className?: string;
  /** Size of the title. "lg" (default) | "xl" for hero-y headings. */
  size?: "lg" | "xl";
}

const dotColor: Record<AccentKey, string> = {
  primary: "bg-primary",
  secondary: "bg-secondary",
  accent: "bg-accent",
  mint: "bg-mint",
  foreground: "bg-foreground",
};

const labelColor: Record<AccentKey, string> = {
  primary: "text-primary",
  secondary: "text-secondary",
  accent: "text-foreground",
  mint: "text-foreground",
  foreground: "text-foreground",
};

const handColor: Record<AccentKey, string> = {
  primary: "text-primary/75",
  secondary: "text-secondary/80",
  accent: "text-primary/75",
  mint: "text-secondary/80",
  foreground: "text-primary/75",
};

const SectionHeader = ({
  kicker,
  title,
  subtitle,
  handwritten,
  accent = "primary",
  centered = true,
  className = "",
  size = "lg",
}: SectionHeaderProps) => {
  const alignItems = centered ? "items-center" : "items-start";
  const justifyGroup = centered ? "justify-center" : "justify-start";
  const textAlign = centered ? "text-center" : "text-left";
  const titleSize =
    size === "xl"
      ? "clamp(2.25rem, 5.5vw, 4.5rem)"
      : "clamp(1.85rem, 4.2vw, 3.25rem)";
  const subtitleAlign = centered ? "max-w-2xl mx-auto" : "max-w-xl";

  return (
    <div className={`flex flex-col ${alignItems} ${textAlign} ${className}`}>
      <div className={`flex items-center gap-3 mb-5 ${justifyGroup}`}>
        <span className={`w-2 h-2 rounded-full ${dotColor[accent]}`} />
        <span className={`label ${labelColor[accent]}`}>{kicker}</span>
        <Sparkle className="w-4 h-4 text-accent" />
      </div>

      <h2
        className="font-display text-foreground leading-[0.98] tracking-tight"
        style={{ fontSize: titleSize }}
      >
        {title}
      </h2>

      {handwritten && (
        <p
          className={`handwritten text-xl sm:text-2xl ${handColor[accent]} -rotate-2 mt-4`}
        >
          {handwritten}
        </p>
      )}

      {subtitle && (
        <p
          className={`font-body text-base sm:text-lg text-foreground/70 leading-relaxed mt-5 ${subtitleAlign}`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default SectionHeader;
