import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import type { PlayerTournamentStats } from "../../lib/data";
import { PLAYER_METRICS, formatMetricValue, type PlayerMetricKey } from "../../lib/chart-formatters";
import { getPlayerScoringProfile } from "../../lib/selectors";

interface PlayerDetailDrawerProps {
  player: PlayerTournamentStats | null;
  playerList?: PlayerTournamentStats[];
  title?: string;
  listMetric?: PlayerMetricKey;
  isOpen: boolean;
  onClose: () => void;
  onSelectPlayer?: (playerSlug: string) => void;
}

const METRICS: PlayerMetricKey[] = [
  "drivingDistanceAvgYards",
  "drivingAccuracyPct",
  "girPct",
  "puttsPerGir",
  "birdies",
  "bogeys",
  "doubles",
  "scoreToPar",
];

export function PlayerDetailDrawer({
  player,
  playerList = [],
  title,
  listMetric,
  isOpen,
  onClose,
  onSelectPlayer,
}: PlayerDetailDrawerProps) {
  const profile = getPlayerScoringProfile(player);
  const isListMode = playerList.length > 0;
  const listMetricLabel = listMetric ? PLAYER_METRICS[listMetric].shortLabel : "Score";

  return (
    <AnimatePresence>
      {isOpen && (player || isListMode) && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-masters-green/40 backdrop-blur-sm z-[100]"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 w-full max-w-md h-full bg-white shadow-2xl z-[101] overflow-y-auto"
          >
            <div className="relative h-64 bg-masters-green overflow-hidden">
              <img src="/rory-scoreboard.png" alt="" className="w-full h-full object-cover opacity-30 mix-blend-multiply" />
              <button
                type="button"
                onClick={onClose}
                className="absolute top-8 right-8 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-masters-green transition-all"
                aria-label="Close player drawer"
              >
                <X size={20} />
              </button>
              <div className="absolute bottom-10 left-10 right-8">
                <span className="text-[10px] font-black uppercase tracking-[0.35em] text-masters-yellow block mb-2">
                  {isListMode
                    ? `${playerList.length} Players · ${listMetricLabel}`
                    : `${player?.positionLabel} · Score ${formatMetricValue(player?.scoreToPar, "scoreToPar")}`}
                </span>
                <h3 className="font-serif text-5xl font-black italic !text-white">
                  {isListMode ? title ?? "Players in Range" : player?.playerName}
                </h3>
              </div>
            </div>
            <div className="p-10 space-y-8">
              {isListMode ? (
                <div className="space-y-3">
                  {playerList.map((item) => (
                    <button
                      key={item.playerSlug}
                      type="button"
                      onClick={() => onSelectPlayer?.(item.playerSlug)}
                      className="w-full rounded-3xl border border-masters-green/10 bg-masters-green/5 p-5 text-left transition hover:bg-white"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-widest text-ink-400 block mb-1">
                            {item.positionLabel}
                          </span>
                          <span className="font-serif text-2xl font-black text-masters-green">
                            {item.playerName}
                          </span>
                        </div>
                        <span className="font-serif text-2xl font-black text-masters-green">
                          {listMetric
                            ? formatMetricValue(item[listMetric], listMetric)
                            : formatMetricValue(item.scoreToPar, "scoreToPar")}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    {METRICS.map((key) => (
                      <div key={key} className="bg-masters-green/5 border border-masters-green/10 rounded-3xl p-5">
                        <span className="text-[9px] font-black uppercase tracking-widest text-ink-400 block mb-2">
                          {PLAYER_METRICS[key].shortLabel}
                        </span>
                        <span className="text-2xl font-serif font-black text-masters-green">
                          {formatMetricValue(player?.[key], key)}
                        </span>
                      </div>
                    ))}
                  </div>
                  {profile && (
                    <div className="bg-masters-green rounded-[32px] p-7 text-white">
                      <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/45 block mb-5">
                        Scoring Mix
                      </span>
                      {[
                        ["Birdie+", profile.birdiePlusPct],
                        ["Par", profile.parPct],
                        ["Bogey", profile.bogeyPct],
                        ["Double+", profile.doublePlusPct],
                      ].map(([label, value]) => (
                        <div key={label} className="flex justify-between border-b border-white/10 py-3 last:border-0">
                          <span className="text-xs font-bold uppercase tracking-widest text-white/55">{label}</span>
                          <span className="font-serif font-black text-masters-yellow">{value}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
