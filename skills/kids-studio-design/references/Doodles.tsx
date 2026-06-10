type DoodleProps = {
  className?: string;
  color?: string;
};

export const Star = ({ className, color = "currentColor" }: DoodleProps) => (
  <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 3 L22 17 L36 19 L22 22 L20 37 L18 22 L4 19 L18 17 Z" fill={color} />
  </svg>
);

export const Scribble = ({ className, color = "currentColor" }: DoodleProps) => (
  <svg className={className} viewBox="0 0 120 30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 20 Q 20 4, 36 14 T 68 16 T 100 10 T 116 20" stroke={color} strokeWidth="3" strokeLinecap="round" fill="none" />
  </svg>
);

export const Arrow = ({ className, color = "currentColor" }: DoodleProps) => (
  <svg className={className} viewBox="0 0 60 30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 15 Q 20 2, 40 15 T 54 15" stroke={color} strokeWidth="2.4" strokeLinecap="round" fill="none" />
    <path d="M46 8 L54 15 L46 22" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

export const ArrowCurly = ({ className, color = "currentColor" }: DoodleProps) => (
  <svg className={className} viewBox="0 0 80 90" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M10 10 Q 35 30, 25 55 Q 18 75, 40 82"
      stroke={color}
      strokeWidth="2.4"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M33 74 L40 82 L48 76"
      stroke={color}
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

export const Dot = ({ className, color = "currentColor" }: DoodleProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill={color} />
  </svg>
);

export const Circle = ({ className, color = "currentColor" }: DoodleProps) => (
  <svg className={className} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M40 6 Q 68 12, 74 40 Q 72 68, 42 74 Q 12 70, 6 42 Q 8 10, 40 6" stroke={color} strokeWidth="2.8" fill="none" />
  </svg>
);

export const Sparkle = ({ className, color = "currentColor" }: DoodleProps) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 2 L18 14 L30 16 L18 18 L16 30 L14 18 L2 16 L14 14 Z" fill={color} />
  </svg>
);

export const Sun = ({ className, color = "currentColor" }: DoodleProps) => (
  <svg className={className} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="30" cy="30" r="10" fill={color} />
    {[...Array(8)].map((_, i) => {
      const angle = (i * 45 * Math.PI) / 180;
      const x1 = 30 + Math.cos(angle) * 16;
      const y1 = 30 + Math.sin(angle) * 16;
      const x2 = 30 + Math.cos(angle) * 26;
      const y2 = 30 + Math.sin(angle) * 26;
      return (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="3" strokeLinecap="round" />
      );
    })}
  </svg>
);

export const Heart = ({ className, color = "currentColor" }: DoodleProps) => (
  <svg className={className} viewBox="0 0 32 30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M16 27 C 6 20, 2 13, 4 8 C 6 3, 12 2, 16 7 C 20 2, 26 3, 28 8 C 30 13, 26 20, 16 27 Z"
      fill={color}
    />
  </svg>
);

export const Cloud = ({ className, color = "currentColor" }: DoodleProps) => (
  <svg className={className} viewBox="0 0 70 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 30 Q 2 30, 4 22 Q 2 14, 14 14 Q 16 6, 26 8 Q 30 2, 40 6 Q 50 4, 52 14 Q 64 14, 62 24 Q 66 30, 56 30 Z"
      fill={color}
    />
  </svg>
);

export const Rainbow = ({ className }: DoodleProps) => (
  <svg className={className} viewBox="0 0 80 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 42 A 34 34 0 0 1 74 42" stroke="hsl(8 72% 52%)" strokeWidth="5" fill="none" strokeLinecap="round" />
    <path d="M12 42 A 28 28 0 0 1 68 42" stroke="hsl(45 92% 55%)" strokeWidth="5" fill="none" strokeLinecap="round" />
    <path d="M18 42 A 22 22 0 0 1 62 42" stroke="hsl(158 42% 55%)" strokeWidth="5" fill="none" strokeLinecap="round" />
    <path d="M24 42 A 16 16 0 0 1 56 42" stroke="hsl(204 65% 53%)" strokeWidth="5" fill="none" strokeLinecap="round" />
  </svg>
);

export const Drop = ({ className, color = "currentColor" }: DoodleProps) => (
  <svg className={className} viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2 C 6 12, 3 18, 3 22 A 9 9 0 0 0 21 22 C 21 18, 18 12, 12 2 Z" fill={color} />
  </svg>
);

export const Smile = ({ className, color = "currentColor" }: DoodleProps) => (
  <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="17" stroke={color} strokeWidth="2.4" fill="none" />
    <circle cx="14" cy="16" r="1.8" fill={color} />
    <circle cx="26" cy="16" r="1.8" fill={color} />
    <path d="M12 24 Q 20 32, 28 24" stroke={color} strokeWidth="2.4" strokeLinecap="round" fill="none" />
  </svg>
);

export const Flower = ({ className, color = "currentColor" }: DoodleProps) => (
  <svg className={className} viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
    {[...Array(6)].map((_, i) => {
      const angle = (i * 60 * Math.PI) / 180;
      const cx = 25 + Math.cos(angle) * 11;
      const cy = 25 + Math.sin(angle) * 11;
      return <circle key={i} cx={cx} cy={cy} r="7" fill={color} />;
    })}
    <circle cx="25" cy="25" r="5" fill="hsl(45 92% 55%)" />
  </svg>
);

export const Squiggle = ({ className, color = "currentColor" }: DoodleProps) => (
  <svg className={className} viewBox="0 0 160 30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M2 15 Q 12 2, 22 15 T 42 15 T 62 15 T 82 15 T 102 15 T 122 15 T 142 15 T 158 15"
      stroke={color}
      strokeWidth="2.6"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

export const BrandMark = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="24" r="6" fill="hsl(8 72% 52%)" />
    <circle cx="24" cy="12" r="6" fill="hsl(45 92% 55%)" />
    <circle cx="36" cy="24" r="6" fill="hsl(204 65% 53%)" />
    <circle cx="24" cy="36" r="6" fill="hsl(158 42% 55%)" />
  </svg>
);
