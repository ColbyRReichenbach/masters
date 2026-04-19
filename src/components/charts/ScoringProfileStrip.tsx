import { SectionHeader } from "../ui/SectionHeader";
import { PlayerSearchSelect } from "../ui/PlayerSearchSelect";
import type { PlayerTournamentStats } from "../../lib/data";

interface ScoringProfile {
  birdiePlusPct: number;
  parPct: number;
  bogeyPct: number;
  doublePlusPct: number;
}

interface ScoringProfileStripProps {
  rory: ScoringProfile;
  selectedPlayer: ScoringProfile | null;
  selectedPlayerName?: string;
  field: ScoringProfile;
  top10: ScoringProfile;
  players: PlayerTournamentStats[];
  selectedPlayerSlug: string | null;
  onSelectPlayer: (playerSlug: string) => void;
}

const categories = [
  { key: "birdiePlusPct" as const, label: "Birdie+", color: "bg-masters-green" },
  { key: "parPct" as const, label: "Par", color: "bg-augusta-gold" },
  { key: "bogeyPct" as const, label: "Bogey", color: "bg-under-par" },
  { key: "doublePlusPct" as const, label: "Double+", color: "bg-ink-800" },
];

function normalizeProfile(profile: ScoringProfile) {
  const total = categories.reduce((sum, category) => sum + profile[category.key], 0);
  if (!total) return profile;
  return categories.reduce<ScoringProfile>((acc, category) => {
    acc[category.key] = Number(((profile[category.key] / total) * 100).toFixed(1));
    return acc;
  }, { birdiePlusPct: 0, parPct: 0, bogeyPct: 0, doublePlusPct: 0 });
}

function Row({ label, profile }: { label: string; profile: ScoringProfile }) {
  const normalized = normalizeProfile(profile);
  let runningTotal = 0;
  const segments = categories.map((category) => {
    const value = normalized[category.key];
    const start = runningTotal;
    runningTotal += value;
    return {
      ...category,
      value,
      labelCenter: Math.min(98, Math.max(2, start + value / 2)),
      showInsideLabel: value >= 2.5,
      showAboveLabel: value > 0 && value < 2.5,
    };
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-masters-green/45">
          {label}
        </span>
      </div>
      <div className="relative pt-5">
        {segments
          .filter((segment) => segment.showAboveLabel)
          .map((segment) => (
            <span
              key={`${segment.key}-above`}
              className="absolute top-0 -translate-x-1/2 whitespace-nowrap text-[9px] font-black uppercase tracking-widest text-masters-green"
              style={{ left: `${segment.labelCenter}%` }}
            >
              {segment.value}%
            </span>
          ))}
        <div className="h-9 w-full rounded-full overflow-hidden bg-masters-green/5 border border-masters-green/10 flex">
          {segments.map((segment) => (
            <div
              key={segment.key}
              className={`${segment.color} relative h-full min-w-0`}
              style={{ width: `${segment.value}%` }}
              title={`${segment.label}: ${segment.value}%`}
            >
              {segment.showInsideLabel && (
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[9px] font-black uppercase tracking-widest text-white drop-shadow-sm">
                  {segment.value}%
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ScoringProfileStrip({
  rory,
  selectedPlayer,
  selectedPlayerName = "Selected",
  field,
  top10,
  players,
  selectedPlayerSlug,
  onSelectPlayer,
}: ScoringProfileStripProps) {
  return (
    <section className="bg-white rounded-2xl sm:rounded-[32px] md:rounded-[48px] p-4 sm:p-6 md:p-14 border border-masters-green/10">
      <SectionHeader
        eyebrow="Scoring Profile"
        title="How Scores Were Made"
        subtitle="Four scoring categories, normalized to 100% for each row so Rory, the selected player, the field, and top-10 plus ties can be compared directly."
        actions={<PlayerSearchSelect players={players} value={selectedPlayerSlug} onChange={onSelectPlayer} compact />}
      />
      <div className="space-y-6 md:space-y-7">
        <Row label="Rory McIlroy" profile={rory} />
        {selectedPlayer && <Row label={selectedPlayerName} profile={selectedPlayer} />}
        <Row label="Field Average" profile={field} />
        <Row label="Top 10 + Ties" profile={top10} />
      </div>
      <div className="mt-8 flex flex-wrap gap-5">
        {categories.map((category) => (
          <div key={category.key} className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${category.color}`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-ink-400">{category.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
