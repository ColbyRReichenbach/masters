import { motion } from "motion/react";
import { ArrowRight, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { RepeatChampionBenchmarkChart } from "../components/charts/RepeatChampionBenchmarkChart";
import { RepeatPathChart } from "../components/charts/RepeatPathChart";
import { RoundSwingStoryChart } from "../components/charts/RoundSwingStoryChart";
import { useRepeatModel } from "../hooks/useRepeatModel";
import { formatSigned, formatToPar } from "../lib/chart-formatters";
import { cn } from "../lib/utils";

export default function TheRepeat() {
  const model = useRepeatModel();
  const selectedCell = model.selectedCell;
  const selectedChampion = model.selectedChampion;

  return (
    <div className="w-full pb-32">
      <section className="relative w-full h-screen overflow-hidden bg-masters-green">
        <div className="absolute inset-0">
          <img
            src="/rory-jacket.png"
            alt="Rory McIlroy in the green jacket"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 hero-vignette" />
        </div>

        <div className="relative z-10 max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 h-full flex flex-col justify-end pb-24">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 border border-white/20 rounded-full mb-8 backdrop-blur-md">
              <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-white">
                Historical Context
              </span>
            </div>
            <h1 className="font-serif text-6xl md:text-8xl lg:text-[100px] font-bold text-white mb-8 leading-[0.9] tracking-tighter text-shadow-premium">
              The <span className="italic text-masters-yellow">Repeat.</span>
              <br />
              Defying Odds.
            </h1>
            <p className="font-sans text-xl md:text-2xl text-white/90 max-w-3xl leading-relaxed mb-12">
              Rory’s 2026 defense joins Nicklaus, Faldo, and Woods in the rarest Masters company. This page compares his two title paths and the historical repeat benchmarks.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
              {[
                { label: "Repeat Club", value: `${model.repeatContext.repeatSetSize}`, sub: "Successful defenders" },
                {
                  label: "Rory 2025",
                  value: formatToPar(model.scorecard2025.player.totalToPar),
                  sub: `${model.scorecard2025.player.totalStrokes} strokes`,
                },
                {
                  label: "Rory 2026",
                  value: formatToPar(model.scorecard2026.player.totalToPar),
                  sub: `${model.scorecard2026.player.totalStrokes} strokes`,
                },
              ].map((stat) => (
                <div key={stat.label} className="glass-dark p-6 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 block mb-2">
                    {stat.label}
                  </span>
                  <div className="text-3xl font-serif font-bold text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-[10px] font-medium text-masters-yellow uppercase tracking-widest">
                    {stat.sub}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <main className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 -mt-20 relative z-20 space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-8"
          >
            <RepeatPathChart
              data={model.repeatPathSeries}
              zoom={model.repeatPathZoom}
              onZoomChange={model.setRepeatPathZoom}
              onSelectHole={model.selectHole72}
            />
          </motion.div>

          <aside className="lg:col-span-4 space-y-8">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-masters-green rounded-[32px] p-10 text-white shadow-2xl relative overflow-hidden"
            >
              <Trophy className="absolute -bottom-8 -right-8 text-white/5 rotate-[-12deg]" size={190} />
              <div className="relative z-10">
                <h3 className="font-serif text-3xl font-bold mb-6 italic !text-masters-yellow">
                  The Immortal Rank.
                </h3>
                <p className="text-sm opacity-75 leading-relaxed mb-8">
                  {model.repeatContext.intro} The round story below is regulation-hole only; Rory’s 2025 playoff is noted in the benchmark data but not blended into the 72-hole comparison.
                </p>
                <div className="h-px w-full bg-white/10 mb-8" />
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.35em] text-masters-yellow border-b-2 border-masters-yellow/20 pb-1"
                >
                  Tournament Review <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-white border border-masters-green/10 p-8 rounded-[32px] shadow-sm"
            >
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-masters-green/40 block mb-3">
                Selected Hole
              </span>
              {selectedCell ? (
                <div>
                  <h4 className="font-serif text-3xl font-black text-masters-green mb-2 flex items-baseline gap-2">
                    <span>{selectedCell.holeName}</span>
                    <span className="text-sm font-sans font-bold opacity-30">#{selectedCell.holeNumber}</span>
                  </h4>
                  <p className="text-sm font-medium italic text-ink-600 mb-6">
                    Round {selectedCell.roundNumber} · {selectedCell.holeName} · Par {selectedCell.par} · {selectedCell.yardage} yds
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      ["2025", selectedCell.score2025],
                      ["2026", selectedCell.score2026],
                      ["Delta", formatSigned(selectedCell.delta, 0)],
                    ].map(([label, value]) => (
                      <div key={label} className="bg-masters-green/5 rounded-2xl p-4 border border-masters-green/10">
                        <span className="text-[9px] font-black uppercase tracking-widest text-ink-400 block mb-1">
                          {label}
                        </span>
                        <span
                          className={cn(
                            "font-serif text-2xl font-black text-masters-green",
                            label === "Delta" && selectedCell.delta < 0 && "text-masters-green",
                            label === "Delta" && selectedCell.delta > 0 && "text-under-par"
                          )}
                        >
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm italic text-ink-600 leading-relaxed">
                  Click a path point or round story hole to inspect the round, hole, score delta, par, and yardage.
                </p>
              )}
            </motion.div>
          </aside>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <RoundSwingStoryChart
            cells={model.allDeltaCells}
            selectedCell={model.selectedRepeatHoleCell}
            onSelectCell={model.selectCell}
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-8"
          >
            <RepeatChampionBenchmarkChart
              rows={model.championRows}
              selectedChampionKey={model.selectedChampionKey}
              onSelectChampion={model.setSelectedChampionKey}
            />
          </motion.div>

          <aside className="lg:col-span-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-[32px] border border-masters-green/10 p-10 sticky top-28"
            >
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-masters-green/40 block mb-3">
                Champion Detail
              </span>
              {selectedChampion && (
                <>
                  <h3 className="font-serif text-3xl font-black text-masters-green mb-2">
                    {selectedChampion.playerName}
                  </h3>
                  <p className="text-sm italic text-ink-600 leading-relaxed mb-8">
                    {selectedChampion.significance}
                  </p>
                  <div className="space-y-5">
                    {[
                      [`${selectedChampion.firstYear} Score`, formatToPar(selectedChampion.firstWin.scoreToPar)],
                      [`${selectedChampion.repeatYear} Score`, formatToPar(selectedChampion.repeatWin.scoreToPar)],
                      ["Repeat Total", selectedChampion.repeatWin.totalStrokes],
                      ["Repeat Margin", selectedChampion.repeatWin.winningMargin],
                      ["Course Yardage", `${selectedChampion.repeatWin.courseYardage} yds`],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between items-end border-b border-masters-green/10 pb-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-ink-400">
                          {label}
                        </span>
                        <span className="font-serif text-2xl font-black text-masters-green">{value}</span>
                      </div>
                    ))}
                  </div>
                  {selectedChampion.playoffNote && (
                    <p className="mt-8 bg-masters-green/5 border border-masters-green/10 rounded-3xl p-5 text-sm italic leading-relaxed text-ink-600">
                      {selectedChampion.playoffNote}
                    </p>
                  )}
                </>
              )}
            </motion.div>
          </aside>
        </div>
      </main>
    </div>
  );
}
