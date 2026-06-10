import { Link } from "react-router-dom";
import ScrollReveal from "./ScrollReveal";
import { Sparkle } from "./Doodles";

type ProgramId = "2-4" | "4-6" | "6-8";

type ProgramMeta = {
  id: ProgramId;
  age: string;
  title: string;
  kicker: string;
  sub: string;
  path: string;
  pill: string;
  tint: string;
};

const programs: ProgramMeta[] = [
  {
    id: "2-4",
    age: "2–4",
    title: "Sensation",
    kicker: "Chapter I",
    sub: "Body awareness & raw perception",
    path: "/programs/ages-2-4",
    pill: "bg-accent text-foreground",
    tint: "bg-accent/15",
  },
  {
    id: "4-6",
    age: "4–6",
    title: "Imagination",
    kicker: "Chapter II",
    sub: "Graphic thinking & design basics",
    path: "/programs/ages-4-6",
    pill: "bg-primary text-primary-foreground",
    tint: "bg-primary/10",
  },
  {
    id: "6-8",
    age: "6–8",
    title: "Design",
    kicker: "Chapter III",
    sub: "Form, space & material exploration",
    path: "/programs/ages-6-8",
    pill: "bg-secondary text-secondary-foreground",
    tint: "bg-secondary/10",
  },
];

const OtherPrograms = ({ current }: { current: ProgramId }) => {
  const others = programs.filter((p) => p.id !== current);

  return (
    <ScrollReveal delay={0.1}>
      <div className="mt-16 md:mt-20">
        <div className="flex items-center justify-center gap-4 mb-8">
          <span className="h-px w-12 sm:w-20 bg-foreground/15" />
          <p className="handwritten text-2xl text-primary/75 -rotate-2 flex items-center gap-2">
            explore the other chapters
            <Sparkle className="w-4 h-4 text-accent" />
          </p>
          <span className="h-px w-12 sm:w-20 bg-foreground/15" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
          {others.map((p, i) => (
            <Link
              key={p.id}
              to={p.path}
              className="group relative block"
              style={{ transform: `rotate(${i === 0 ? -1.2 : 1.2}deg)` }}
            >
              {/* Colored backing card */}
              <span
                aria-hidden
                className={`absolute inset-0 ${p.tint} rounded-3xl translate-x-1.5 translate-y-2 -z-10`}
              />

              <div className="bg-background border border-foreground/10 rounded-3xl p-5 sm:p-6 flex items-center gap-4 sm:gap-5 shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
                {/* Age circle */}
                <div
                  className={`w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-full ${p.pill} flex flex-col items-center justify-center shadow-lg flex-shrink-0`}
                  style={{ transform: "rotate(-6deg)" }}
                >
                  <span className="font-display italic-wonk text-xl sm:text-2xl leading-none tabular-nums">
                    {p.age}
                  </span>
                  <span className="label text-[0.55rem] opacity-80 mt-1">yrs</span>
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0 text-left">
                  <p className="label text-muted-foreground mb-1 truncate">{p.kicker}</p>
                  <h3 className="font-display text-2xl sm:text-3xl italic-wonk text-foreground leading-none mb-1.5">
                    {p.title}
                  </h3>
                  <p className="font-body text-xs text-muted-foreground leading-snug line-clamp-2">
                    {p.sub}
                  </p>
                </div>

                {/* Arrow */}
                <span className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center group-hover:rotate-45 group-hover:bg-primary transition-all flex-shrink-0">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M3 7h8M7 3l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </ScrollReveal>
  );
};

export default OtherPrograms;
