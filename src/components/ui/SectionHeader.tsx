import type { ReactNode } from "react";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle: string;
  icon?: ReactNode;
  actions?: ReactNode;
  inverse?: boolean;
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  icon,
  actions,
  inverse = false,
}: SectionHeaderProps) {
  return (
    <div className="flex flex-col justify-between items-start gap-6 md:gap-8 mb-8 md:mb-10">
      <div className="max-w-3xl">
        {eyebrow && (
          <span
            className={`text-[10px] font-black uppercase tracking-[0.32em] block mb-3 ${
              inverse ? "text-white/45" : "text-masters-green/40"
            }`}
          >
            {eyebrow}
          </span>
        )}
        <h2
          className={`text-3xl md:text-5xl font-serif font-bold mb-4 flex items-center gap-3 md:gap-4 ${
            inverse ? "!text-white" : "text-masters-green"
          }`}
        >
          {icon}
          {title}
        </h2>
        <div className={`h-1 w-20 mb-4 ${inverse ? "bg-white/20" : "bg-masters-green/20"}`} />
        <p className={`font-medium leading-relaxed italic ${inverse ? "text-white/75" : "text-ink-600/80"}`}>
          {subtitle}
        </p>
      </div>
      {actions && <div className="flex w-full max-w-full flex-wrap items-center gap-3 overflow-x-auto pb-1">{actions}</div>}
    </div>
  );
}
