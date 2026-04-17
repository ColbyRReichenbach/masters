import { useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { ArchetypeScatterChart } from "../components/charts/ArchetypeScatterChart";
import { MetricDistributionChart } from "../components/charts/MetricDistributionChart";
import { PlayerComparisonDumbbellChart } from "../components/charts/PlayerComparisonDumbbellChart";
import { ScoringProfileStrip } from "../components/charts/ScoringProfileStrip";
import { PlayerDetailDrawer } from "../components/drawers/PlayerDetailDrawer";
import { MetricKpiCard } from "../components/ui/MetricKpiCard";
import { useProfileModel } from "../hooks/useProfileModel";
import type { PlayerTournamentStats } from "../lib/data";
import type { PlayerMetricKey } from "../lib/chart-formatters";
import { getMetricValue } from "../lib/selectors";

export default function Profile() {
  const model = useProfileModel();
  const [isPlayerDrawerOpen, setIsPlayerDrawerOpen] = useState(false);
  const [drawerPlayers, setDrawerPlayers] = useState<PlayerTournamentStats[]>([]);
  const [drawerTitle, setDrawerTitle] = useState<string | undefined>();
  const [drawerMetric, setDrawerMetric] = useState<PlayerMetricKey | undefined>();

  const changeSelectedPlayer = (playerSlug: string) => {
    model.setSelectedPlayerSlug(playerSlug);
  };

  const openPlayerDrawer = (playerSlug: string) => {
    model.setSelectedPlayerSlug(playerSlug);
    setDrawerPlayers([]);
    setDrawerTitle(undefined);
    setDrawerMetric(undefined);
    setIsPlayerDrawerOpen(true);
  };

  const openRangeDrawer = (players: PlayerTournamentStats[], label: string, metric: PlayerMetricKey) => {
    setDrawerPlayers(players);
    setDrawerTitle(label);
    setDrawerMetric(metric);
    setIsPlayerDrawerOpen(true);
  };

  const verdicts = [
    { title: "Power Blueprint", text: model.profile.verdicts.primarySeparator },
    { title: "Defensive Mastery", text: model.profile.verdicts.secondarySupport },
    { title: "The X-Factor", text: model.profile.verdicts.weaknessOvercome },
  ];

  return (
    <div className="w-full pb-32">
      <PlayerDetailDrawer
        player={model.selectedPlayer}
        playerList={drawerPlayers}
        title={drawerTitle}
        listMetric={drawerMetric}
        isOpen={isPlayerDrawerOpen}
        onSelectPlayer={(playerSlug) => {
          model.setSelectedPlayerSlug(playerSlug);
          setDrawerPlayers([]);
          setDrawerTitle(undefined);
          setDrawerMetric(undefined);
        }}
        onClose={() => setIsPlayerDrawerOpen(false)}
      />

      <section className="relative w-full h-screen overflow-hidden bg-masters-green">
        <div className="absolute inset-0">
          <img
            src="/rory-scoreboard.png"
            alt="Rory McIlroy at the scoreboard"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 hero-vignette" />
        </div>

        <div className="relative z-10 max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 h-full flex flex-col justify-end pb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 border border-white/20 rounded-full mb-6 backdrop-blur-md">
              <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-white">
                Technical Analysis
              </span>
            </div>
            <h1 className="font-serif text-6xl md:text-8xl font-bold text-white mb-6 leading-tight tracking-tighter text-shadow-premium">
              The <span className="italic text-masters-yellow">Blueprint</span>
              <br />
              for Augusta.
            </h1>
            <p className="font-sans text-xl text-white/90 max-w-2xl leading-relaxed">
              Rory’s winning profile, plotted against every player in the 2026 field and the full top-10 cohort including ties.
            </p>
          </motion.div>
        </div>
      </section>

      <main className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 -mt-20 relative z-20 space-y-12">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5"
        >
          {model.kpis.map((kpi) => (
            <div key={kpi.key}>
              <MetricKpiCard
                metric={kpi.config}
                value={kpi.value}
                fieldAverage={kpi.fieldAverage}
                top10Average={kpi.top10Average}
                percentile={kpi.percentile}
                rank={kpi.rank}
              />
            </div>
          ))}
        </motion.section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <MetricDistributionChart
                metric={model.distributionMetric}
                cohort={model.cohort}
                bins={model.bins}
                roryValue={getMetricValue(model.rory, model.distributionMetric)}
                fieldAverage={model.fieldAverages[model.distributionMetric]}
                top10Average={model.top10Averages[model.distributionMetric]}
                selectedPlayerValue={
                  model.selectedPlayer ? getMetricValue(model.selectedPlayer, model.distributionMetric) : null
                }
                selectedPlayerSlug={model.selectedPlayerSlug}
                players={model.players}
                onMetricChange={model.setDistributionMetric}
                onCohortChange={model.setCohort}
                onSelectPlayer={changeSelectedPlayer}
                onSelectBin={openRangeDrawer}
              />
            </motion.div>
          </div>

          <aside className="lg:col-span-4 space-y-8">
            <h3 className="font-serif text-2xl font-bold text-masters-green px-2">The Winning Verdict</h3>
            <div className="space-y-6">
              {verdicts.map((verdict, index) => (
                <motion.div
                  key={verdict.title}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="bg-white rounded-[32px] p-8 shadow-premium border border-line-subtle group hover:border-masters-green transition-colors"
                >
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-ink-400 block mb-6">
                    {verdict.title}
                  </span>
                  <p className="font-medium text-green-950 leading-relaxed italic">
                    "{verdict.text}"
                  </p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="bg-masters-yellow rounded-[32px] p-10 text-masters-green shadow-premium relative overflow-hidden group cursor-pointer"
            >
              <Trophy className="absolute -bottom-6 -right-6 text-masters-green/5 rotate-[-15deg] group-hover:rotate-0 transition-transform duration-700" size={180} />
              <div className="relative z-10">
                <h4 className="font-serif text-3xl font-bold mb-4">Confirmed <br />Dominance.</h4>
                <p className="text-[10px] font-black uppercase tracking-widest mb-6 border-b border-masters-green/10 pb-4">
                  Tournament ID: {model.statsMeta.tournamentId ?? "N/A"}
                </p>
                <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] group-hover:translate-x-2 transition-transform">
                  Return to Scorecard <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>
          </aside>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <ArchetypeScatterChart
            players={model.cohortPlayers}
            allPlayers={model.players}
            xMetric={model.scatterXMetric}
            yMetric={model.scatterYMetric}
            selectedPlayerSlug={model.selectedPlayerSlug}
            cohort={model.cohort}
            onXMetricChange={model.setScatterXMetric}
            onYMetricChange={model.setScatterYMetric}
            onSelectPlayer={changeSelectedPlayer}
            onOpenPlayer={openPlayerDrawer}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <PlayerComparisonDumbbellChart
            rory={model.rory}
            selectedPlayer={model.selectedPlayer}
            fieldAverages={model.fieldAverages}
            top10Averages={model.top10Averages}
            players={model.players}
            selectedPlayerSlug={model.selectedPlayerSlug}
            onSelectPlayer={changeSelectedPlayer}
            onSelectMetric={model.setDistributionMetric}
          />
        </motion.div>

        {model.roryScoringProfile && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <ScoringProfileStrip
              rory={model.roryScoringProfile}
              selectedPlayer={model.selectedScoringProfile}
              selectedPlayerName={model.selectedPlayer?.playerName}
              field={model.fieldScoringProfile}
              top10={model.top10ScoringProfile}
              players={model.players}
              selectedPlayerSlug={model.selectedPlayerSlug}
              onSelectPlayer={changeSelectedPlayer}
            />
          </motion.div>
        )}
      </main>
    </div>
  );
}
