import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { Sun, Cloud, Sparkle, Heart, Flower, Squiggle } from "./Doodles";

interface PageHeroProps {
  tag: string;
  title: ReactNode;
  subtitle?: ReactNode;
  bgImage?: string;
  /**
   * CSS object-position for bgImage. Defaults to "center 30%" so subjects
   * whose heads sit in the upper portion of the frame stay in view on
   * wider desktop crops. Override per page for awkward compositions.
   */
  imagePosition?: string;
  /**
   * Color mood of the gradient hero. Defaults to "warm".
   * warm  → cream → honey → peach → soft coral (sunny)
   * cool  → cream → mint → soft blue → dusty ocean (fresh)
   * dusk  → ivory → blush → lilac → honey (soft)
   */
  mood?: "warm" | "cool" | "dusk";
}

const gradients: Record<NonNullable<PageHeroProps["mood"]>, string> = {
  warm: "linear-gradient(135deg, hsl(38 62% 93%) 0%, hsl(42 78% 82%) 32%, hsl(20 72% 80%) 66%, hsl(10 68% 74%) 100%)",
  cool: "linear-gradient(135deg, hsl(38 55% 94%) 0%, hsl(158 45% 82%) 30%, hsl(195 55% 80%) 64%, hsl(204 50% 72%) 100%)",
  dusk: "linear-gradient(135deg, hsl(38 60% 94%) 0%, hsl(18 55% 86%) 28%, hsl(340 40% 84%) 58%, hsl(42 75% 82%) 100%)",
};

const PageHero = ({ tag, title, subtitle, bgImage, imagePosition = "center 30%", mood = "warm" }: PageHeroProps) => {
  return (
    <section className="relative min-h-[54vh] md:min-h-[60vh] flex items-center justify-center overflow-hidden paper-grain">
      {bgImage ? (
        <>
          <img
            src={bgImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: imagePosition }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/45 via-foreground/25 to-foreground/55" />
        </>
      ) : (
        <>
          {/* Base multi-stop gradient */}
          <div className="absolute inset-0" style={{ background: gradients[mood] }} />

          {/* Soft color-glow blobs for depth */}
          <div
            aria-hidden
            className="absolute top-[10%] left-[6%] w-[38vw] h-[38vw] rounded-full opacity-55 blur-3xl"
            style={{ background: "hsl(45 92% 65%)" }}
          />
          <div
            aria-hidden
            className="absolute bottom-[-8%] right-[-4%] w-[44vw] h-[44vw] rounded-full opacity-50 blur-3xl"
            style={{ background: mood === "cool" ? "hsl(204 65% 70%)" : "hsl(8 72% 70%)" }}
          />
          <div
            aria-hidden
            className="absolute top-[42%] right-[24%] w-[22vw] h-[22vw] rounded-full opacity-40 blur-3xl"
            style={{ background: mood === "cool" ? "hsl(158 50% 70%)" : "hsl(38 75% 80%)" }}
          />

          {/* Playful doodles */}
          <Sun className="absolute top-[18%] left-[12%] w-14 h-14 text-accent float-y hidden md:block" />
          <Cloud className="absolute top-[14%] right-[14%] w-24 h-12 text-background/70 drift-x hidden md:block" />
          <Sparkle className="absolute bottom-[24%] left-[22%] w-5 h-5 text-primary hidden md:block" />
          <Heart className="absolute top-[36%] right-[12%] w-6 h-6 text-primary wobble hidden md:block" />
          <Flower className="absolute bottom-[18%] right-[18%] w-10 h-10 text-mint/80 wobble hidden md:block" />
        </>
      )}

      <div className="relative z-10 text-center px-4 sm:px-6 max-w-3xl mx-auto py-24 md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-6 flex justify-center"
        >
          <span
            className={`sticker sticker-sm ${
              bgImage ? "bg-background text-foreground" : "bg-foreground text-background"
            }`}
          >
            {tag}
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className={`font-display leading-[0.98] tracking-tight mb-4 ${
            bgImage ? "text-background" : "text-foreground"
          }`}
          style={{ fontSize: "clamp(2.5rem, 6.5vw, 5.25rem)" }}
        >
          {title}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="flex justify-center mb-4"
        >
          <Squiggle
            className={`w-32 h-4 ${bgImage ? "text-background/70" : "text-primary/70"}`}
          />
        </motion.div>

        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className={`font-body text-base sm:text-lg max-w-xl mx-auto leading-relaxed ${
              bgImage ? "text-background/85" : "text-foreground/75"
            }`}
          >
            {subtitle}
          </motion.p>
        )}
      </div>
    </section>
  );
};

export default PageHero;
