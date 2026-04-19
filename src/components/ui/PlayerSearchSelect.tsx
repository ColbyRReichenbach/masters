import type { PlayerTournamentStats } from "../../lib/data";

interface PlayerSearchSelectProps {
  players: PlayerTournamentStats[];
  value: string | null;
  onChange: (playerSlug: string) => void;
  compact?: boolean;
}

export function PlayerSearchSelect({ players, value, onChange, compact = false }: PlayerSearchSelectProps) {
  return (
    <label className={`flex w-full flex-col gap-2 sm:w-auto ${compact ? "sm:min-w-[190px]" : "sm:min-w-[220px]"}`}>
      <span className="text-[9px] font-black uppercase tracking-[0.24em] text-masters-green/40">
        Compare Player
      </span>
      <select
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        className={`${compact ? "h-10" : "h-11"} w-full rounded-xl border border-masters-green/10 bg-white px-4 text-xs font-bold uppercase tracking-widest text-masters-green outline-none transition focus:border-masters-green/40`}
      >
        {players.map((player) => (
          <option key={player.playerSlug} value={player.playerSlug}>
            {player.positionLabel} · {player.playerName}
          </option>
        ))}
      </select>
    </label>
  );
}
