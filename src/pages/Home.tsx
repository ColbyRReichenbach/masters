import { motion } from "motion/react";
import { ArrowRight, BarChart3, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { CumulativeTournamentPathChart } from "../components/charts/CumulativeTournamentPathChart";
import { HoleGainLossChart } from "../components/charts/HoleGainLossChart";
import { HoleDetailDrawer } from "../components/drawers/HoleDetailDrawer";
import { TraditionalScorecard } from "../components/scorecard/TraditionalScorecard";
import { BenchmarkToggle } from "../components/ui/BenchmarkToggle";
import { SectionHeader } from "../components/ui/SectionHeader";
import { useTournamentOverviewModel } from "../hooks/useTournamentOverviewModel";
import { formatToPar } from "../lib/chart-formatters";
import { cn } from "../lib/utils";

export default function Home() {
  const model = useTournamentOverviewModel();

  return (
    <div className="w-full pb-32">
      <HoleDetailDrawer
        isOpen={Boolean(model.selectedHole && model.selectedHoleData)}
        roundNumber={model.selectedRound}
        hole={model.selectedHoleData}
        holeDifficultyRank={model.holeDifficultyRank}
        roryTournamentAverage={model.roryTournamentAverage}
        comparison={model.comparison}
        trajectoryPoint={model.trajectoryPoint}
        focus={model.holeDrawerFocus}
        onFocusChange={model.setHoleDrawerFocus}
        onClose={model.closeHoleDrawer}
      />

      <section className="relative w-full h-screen overflow-hidden bg-masters-green">
        <div className="absolute inset-0">
          <img
            src="/masters-main.png"
            alt="Masters scoreboard"
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
                Back-to-Back Masters Champion
              </span>
            </div>

            <h1 className="font-serif text-6xl md:text-8xl lg:text-[100px] font-bold text-white mb-8 leading-[0.9] tracking-tighter text-shadow-premium">
              Rory’s <span className="italic text-masters-yellow">72-Hole</span>
              <br />
              Path.
            </h1>

            <p className="font-sans text-xl md:text-2xl text-white/90 max-w-3xl leading-relaxed mb-12">
              A hole-by-hole look at how McIlroy won the 2026 Masters, with direct
              score comparisons against the field and the top-10 plus ties.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl">
              {[
                {
                  label: "Total Score",
                  value: formatToPar(model.winner.scoreToPar),
                  sub: `${model.winner.totalStrokes} Strokes`,
                },
                { label: "Field Size", value: `${model.tournament.fieldSize}`, sub: "Full ESPN field" },
                {
                  label: "Four Rounds",
                  value: model.winner.rounds.join("-"),
                  sub: "Full Card",
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
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass rounded-[48px] p-8 md:p-14"
        >
          <SectionHeader
            eyebrow="Traditional Card"
            title="Rory’s Card"
            subtitle={`"${model.narratives.homepage.scorecardLead}"`}
            icon={<Trophy size={32} className="text-augusta-gold" />}
            actions={
              <>
                <div className="flex bg-augusta-gold/5 p-1 rounded-2xl border border-augusta-gold/10 mr-4 font-sans">
                  <button
                    type="button"
                    onClick={() => model.setShowFieldAvg(!model.showFieldAvg)}
                    className={cn(
                      "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      model.showFieldAvg
                        ? "bg-augusta-gold text-white"
                        : "text-augusta-gold hover:bg-augusta-gold/10"
                    )}
                  >
                    Field Avg
                  </button>
                  <button
                    type="button"
                    onClick={() => model.setShowTop10Avg(!model.showTop10Avg)}
                    className={cn(
                      "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      model.showTop10Avg
                        ? "bg-masters-green text-white"
                        : "text-masters-green hover:bg-masters-green/10"
                    )}
                  >
                    Top 10
                  </button>
                </div>
                <BenchmarkToggle
                  value={model.selectedRound}
                  onChange={model.setSelectedRound}
                  options={[
                    { value: 1, label: "Round 1" },
                    { value: 2, label: "Round 2" },
                    { value: 3, label: "Round 3" },
                    { value: 4, label: "Round 4" },
                  ]}
                />
              </>
            }
          />

          <TraditionalScorecard
            round={model.selectedRoundData}
            showFieldAvg={model.showFieldAvg}
            showTop10Avg={model.showTop10Avg}
            onSelectHole={(holeNumber, focus) => model.openHoleDrawer(holeNumber, focus)}
          />
        </motion.section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="lg:col-span-8"
          >
            <CumulativeTournamentPathChart
              data={model.scorecard.trajectory}
              zoom={model.cumulativeZoom}
              onZoomChange={model.setCumulativeZoom}
              onSelectHole={model.openFromHole72}
            />
          </motion.div>

          <aside className="lg:col-span-4 space-y-8 text-masters-green">
            <div className="bg-white rounded-[32px] p-10 border border-masters-green/10">
              <h4 className="font-serif text-2xl font-bold mb-8 italic">Verified Performance.</h4>
              <div className="space-y-10">
                {model.profile.metrics.slice(0, 3).map((metric) => (
                  <div key={metric.key}>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 block mb-2">
                      {metric.label}
                    </span>
                    <div className="flex justify-between items-end border-b border-masters-green/10 pb-4">
                      <span className="text-3xl font-serif font-black">
                        {metric.winnerValue}
                        {metric.unit}
                      </span>
                      <span className="text-xs font-bold opacity-60">
                        Field: {metric.fieldValue}
                        {metric.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                to="/profile"
                className="mt-12 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] border-b-2 border-masters-green pb-1 hover:pb-2 transition-all"
              >
                Full Technical Breakdown <ArrowRight size={14} />
              </Link>
            </div>

            <Link
              to="/the-repeat"
              className="bg-bg-cream-dark rounded-[32px] p-10 border border-masters-green/10 relative overflow-hidden group cursor-pointer block hover:bg-white transition-all shadow-sm"
            >
              <BarChart3 className="absolute -bottom-8 -right-8 text-masters-green/5 group-hover:rotate-6 transition-transform duration-700" size={170} />
              <div className="relative z-10">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 block">
                  Historical Perspective
                </span>
                <h4 className="font-serif text-2xl font-bold mb-6 leading-tight italic">
                  Joining the
                  <br />
                  Repeat-Champion
                  <br />
                  Company.
                </h4>
                <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                  Evolution Analysis <ArrowRight size={14} />
                </div>
              </div>
            </Link>
          </aside>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <HoleGainLossChart
            data={model.holeGainLossSeries}
            benchmark={model.holeGainLossBenchmark}
            roundFilter={model.holeGainLossRoundFilter}
            segmentFilter={model.holeGainLossSegmentFilter}
            onBenchmarkChange={model.setHoleGainLossBenchmark}
            onRoundFilterChange={model.setHoleGainLossRoundFilter}
            onSegmentFilterChange={model.setHoleGainLossSegmentFilter}
            onSelectHole={(holeNumber, focus) => model.openHoleDrawer(holeNumber, focus)}
          />
        </motion.div>
      </main>
    </div>
  );
}

