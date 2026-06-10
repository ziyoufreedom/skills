import type { ReactNode } from "react";
import ScrollReveal from "./ScrollReveal";
import SectionHeader from "./SectionHeader";
import { Sun, Heart, Sparkle, Flower, Squiggle } from "./Doodles";

type AccentKey = "accent" | "primary" | "secondary";

interface ProgramFeaturesProps {
  kicker: string;
  title: ReactNode;
  subtitle: ReactNode;
  handwritten?: string;
  features: { title: string; description: string }[];
  method: { title: string; body: ReactNode };
  /** Color family for accents — matches the program level. */
  accent?: AccentKey;
}

// Rotate color chips per feature index using brand colors.
const chipColors = [
  "bg-primary text-primary-foreground",
  "bg-accent text-foreground",
  "bg-secondary text-secondary-foreground",
  "bg-mint text-foreground",
  "bg-foreground text-background",
];

const tintColors = [
  "bg-primary/10",
  "bg-accent/20",
  "bg-secondary/10",
  "bg-mint/20",
  "bg-foreground/10",
];

const ProgramFeatures = ({
  kicker,
  title,
  subtitle,
  handwritten,
  features,
  method,
  accent = "primary",
}: ProgramFeaturesProps) => {
  const accentTint = {
    accent: "bg-accent/25",
    primary: "bg-primary/10",
    secondary: "bg-secondary/10",
  }[accent];

  return (
    <>
      <ScrollReveal>
        <div className="relative mb-14 md:mb-16">
          <Sun className="absolute top-0 right-[4%] w-10 h-10 text-accent float-y hidden md:block" />
          <Heart className="absolute top-[20%] left-[4%] w-5 h-5 text-primary bounce-soft hidden md:block" />
          <SectionHeader
            kicker={kicker}
            title={title}
            subtitle={subtitle}
            handwritten={handwritten}
            accent={accent}
          />
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 mb-16 md:mb-20">
        {features.map((f, i) => {
          const rot = ((i * 29) % 5) - 2;
          return (
            <ScrollReveal key={f.title} delay={i * 0.06}>
              <div className="relative h-full" style={{ transform: `rotate(${rot}deg)` }}>
                <span
                  aria-hidden
                  className={`absolute inset-0 ${tintColors[i % 5]} rounded-2xl translate-x-1.5 translate-y-2 -z-10`}
                />
                <div className="bg-background border border-foreground/10 rounded-2xl p-5 md:p-6 shadow-sm h-full">
                  <div
                    className={`w-11 h-11 rounded-full ${chipColors[i % 5]} flex items-center justify-center mb-4 shadow-md`}
                    style={{ transform: "rotate(-6deg)" }}
                  >
                    <span className="font-display italic-wonk text-lg tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="font-display text-xl italic-wonk text-foreground mb-2 leading-tight">
                    {f.title}
                  </h3>
                  <p className="font-body text-sm text-foreground/70 leading-relaxed">
                    {f.description}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          );
        })}
      </div>

      <ScrollReveal>
        <div className="relative" style={{ transform: "rotate(-0.5deg)" }}>
          <span
            aria-hidden
            className={`absolute inset-0 ${accentTint} rounded-3xl translate-x-2 translate-y-3 -z-10`}
          />
          <div className="bg-background border border-foreground/10 rounded-3xl p-8 md:p-12 text-center shadow-sm">
            <Flower className="w-10 h-10 text-accent mx-auto mb-3 wobble" />
            <Squiggle className="w-32 h-4 text-primary/60 mx-auto mb-4" />
            <div className="flex items-center justify-center gap-3 mb-3">
              <span className="label text-primary">Core Teaching Method</span>
              <Sparkle className="w-4 h-4 text-accent" />
            </div>
            <h3 className="font-display text-2xl md:text-3xl italic-wonk text-foreground mb-4 leading-tight">
              {method.title}
            </h3>
            <p className="font-body text-base text-foreground/75 max-w-xl mx-auto leading-relaxed">
              {method.body}
            </p>
          </div>
        </div>
      </ScrollReveal>
    </>
  );
};

export default ProgramFeatures;
